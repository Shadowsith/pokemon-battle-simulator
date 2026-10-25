import { Injectable, inject } from '@angular/core';
import { Dex } from '@pkmn/sim';
import { Move, PokemonType } from '../models/move.model';
import { AudioService } from './audio.service';

export interface BattleStageRefs {
  fieldEl: HTMLElement;
  fxEl: HTMLElement;
  screenFxEl: HTMLElement;
  /** The Pokémon that is casting the move (its own sprite lunges/emits from here). */
  launchEl: HTMLElement;
  /** The Pokémon being hit. */
  targetEl: HTMLElement;
}

interface Point {
  x: number;
  y: number;
}

/** How the effect gets from caster to target - the coarse motion of the move. */
type Delivery =
  | 'melee'
  | 'projectile'
  | 'lob'
  | 'beam'
  | 'pulse'
  | 'sonic'
  | 'powder'
  | 'field'
  | 'selfAura'
  | 'targetAura'
  | 'weather';

type MeleeStyle = 'hit' | 'punch' | 'bite' | 'kick' | 'slash';
type Fleck =
  | 'burn'
  | 'freeze'
  | 'paralyze'
  | 'poison'
  | 'sleep'
  | 'flinch'
  | 'confusion'
  | 'statUp'
  | 'statDown'
  | null;
type Weather = 'sun' | 'rain' | 'sand' | 'hail' | null;

/**
 * Everything the renderer needs to draw one move, derived per-move from its
 * real @pkmn/sim data (category, base power, multi-hit, flags, status,
 * drain/recoil, weather, target) rather than from a shared archetype - so
 * Bullet Seed, Ember and Thunder Wave each look like themselves.
 */
interface MoveVisual {
  delivery: Delivery;
  meleeStyle: MeleeStyle;
  type: PokemonType;
  /** +1 when the caster is left of the target (player -> opponent), -1 otherwise. */
  dir: 1 | -1;
  /** Primary tint (from the Move model). */
  color: string;
  /** 0-1 intensity from base power - scales beams, bursts, flash and shake. */
  power: number;
  /** Number of distinct impacts (multi-hit moves land 2-5). */
  hits: number;
  /** Priority move - dashes in / travels faster. */
  quick: boolean;
  /** Two-turn move - plays a charge-up before firing. */
  charge: boolean;
  /** Draining move - energy streams back to the caster after impact. */
  drain: boolean;
  /** Recoil move - the caster recoils after connecting. */
  recoil: boolean;
  /** Self-healing status move. */
  heal: boolean;
  /** Hits everything on the target side / whole field. */
  spread: boolean;
  fleck: Fleck;
  weather: Weather;
}

/** Per-type particle identity: the glyph shape and whether it tumbles. */
const TYPE_STYLE: Record<PokemonType, { shape: Shape; spin: boolean }> = {
  Normal: { shape: 'circle', spin: false },
  Fire: { shape: 'ember', spin: false },
  Water: { shape: 'drop', spin: false },
  Electric: { shape: 'bolt', spin: false },
  Grass: { shape: 'leaf', spin: true },
  Ice: { shape: 'shard', spin: true },
  Fighting: { shape: 'burst', spin: false },
  Poison: { shape: 'bubble', spin: false },
  Ground: { shape: 'rock', spin: true },
  Flying: { shape: 'slash', spin: false },
  Psychic: { shape: 'ring', spin: true },
  Bug: { shape: 'circle', spin: false },
  Rock: { shape: 'rock', spin: true },
  Ghost: { shape: 'wisp', spin: false },
  Dragon: { shape: 'ring', spin: true },
  Dark: { shape: 'wisp', spin: false },
  Steel: { shape: 'shard', spin: true },
  Fairy: { shape: 'ring', spin: true }
};

type Shape =
  | 'circle'
  | 'ember'
  | 'drop'
  | 'bolt'
  | 'leaf'
  | 'shard'
  | 'burst'
  | 'bubble'
  | 'rock'
  | 'slash'
  | 'ring'
  | 'wisp';

const SHAPE_CSS: Record<Shape, (c: string) => string> = {
  circle: (c) => `border-radius:50%;background:radial-gradient(circle at 35% 35%,#fff,${c} 55%,#000)`,
  ember: (c) => `border-radius:50% 50% 50% 0;background:radial-gradient(circle,#fff,${c} 55%,transparent)`,
  drop: (c) => `border-radius:50% 50% 50% 50%/65% 65% 40% 40%;background:radial-gradient(circle at 40% 30%,#fff,${c})`,
  bolt: (c) => `background:${c}`, // replaced by an SVG glyph; kept for completeness
  leaf: (c) => `border-radius:0 100% 0 100%;background:linear-gradient(135deg,${c},#fff)`,
  shard: (c) => `clip-path:polygon(50% 0,100% 100%,0 100%);background:linear-gradient(${c},#fff)`,
  burst: (c) => `clip-path:polygon(50% 0,61% 35%,100% 50%,61% 65%,50% 100%,39% 65%,0 50%,39% 35%);background:${c}`,
  bubble: (c) => `border-radius:50%;background:radial-gradient(circle at 35% 35%,#fff,${c}88 70%,transparent);border:1px solid ${c}`,
  rock: (c) => `border-radius:22%;background:linear-gradient(135deg,${c},#000)`,
  slash: (c) => `border-radius:2px;background:linear-gradient(90deg,transparent,${c},#fff)`,
  ring: (c) => `border-radius:50%;border:2px solid ${c};background:radial-gradient(circle,${c}33,transparent 70%)`,
  wisp: (c) => `border-radius:50%;background:radial-gradient(circle,${c},transparent 72%);filter:blur(1px)`
};

const FLECK_COLOR: Record<Exclude<Fleck, null>, string> = {
  burn: '#F0803C',
  freeze: '#9CD6FF',
  paralyze: '#F6D33B',
  poison: '#A24BC4',
  sleep: '#C9C2E6',
  flinch: '#FFE58A',
  confusion: '#E58AC8',
  statUp: '#8CE0A6',
  statDown: '#E08C8C'
};

/** Two-turn moves where the user leaves the field on turn 1 (Fly, Dig, …). */
const SEMI_INVULN_ANIM = new Set(['fly', 'dig', 'bounce', 'dive', 'skydrop', 'shadowforce', 'phantomforce']);

interface BubbleStyle {
  count: number;
  /** ms for one bubble to reach the target */
  travel: number;
  /** ms between bubble launches */
  stagger: number;
  /** max px of up-and-down wobble on the way */
  wobble: number;
  /** max px of scatter around the caster at launch */
  jitter: number;
}

/** Bubble: a slow, loose drift. */
const BUBBLE_DRIFT: BubbleStyle = { count: 14, travel: 1150, stagger: 55, wobble: 16, jitter: 12 };
/** Bubble Beam: more bubbles, fast, in a tight line. */
const BUBBLE_BEAM: BubbleStyle = { count: 24, travel: 480, stagger: 28, wobble: 3, jitter: 4 };

/** Red-hot battle backdrop for fire moves (Flamethrower, Fire Blast). */
const HEAT_BACKDROP = 'background:radial-gradient(circle at 55% 40%,#D2462C,#9A2218 55%,#5E0E0A)';

/** Darkened battle backdrop for moves that dim the scene (Amnesia, Aurora Beam, …). */
const DIM_BACKDROP = 'background:radial-gradient(circle at 50% 45%,#2A2A3A,#08080F)';

/** Tile of wavy purple / pink bands for the psychedelic Psychic backdrop (60 x 24 px). */
const PSYCHIC_WAVES =
  'url("data:image/svg+xml,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="60" height="24" viewBox="0 0 60 24">' +
      '<rect width="60" height="24" fill="#4A1A7A"/>' +
      '<path d="M0,6 Q15,0 30,6 T60,6 L60,16 Q45,22 30,16 T0,16 Z" fill="#B23FCF"/>' +
      '<path d="M0,9 Q15,3 30,9 T60,9" fill="none" stroke="#F28BF0" stroke-width="2"/>' +
      '<path d="M0,16 Q15,10 30,16 T60,16" fill="none" stroke="#7A2AA8" stroke-width="2.5"/>' +
      '</svg>'
  ) +
  '")';

/** Colours for the cartoon fist (Dizzy Punch, Fire Punch, Ice Punch). */
const FIST_TONES = {
  yellow: { fill: '#FFD84A', edge: '#B8860B', lines: '#C9971A', glow: '#FFE04A' },
  red: { fill: '#D8342A', edge: '#6E1010', lines: '#8E1A14', glow: '#FF8A3C' },
  ice: { fill: '#8FD4FF', edge: '#2A6CB5', lines: '#4A90D0', glow: '#CFF0FF' }
};

const WEATHER_COLOR: Record<Exclude<Weather, null>, string> = {
  sun: '#FFB13C',
  rain: '#4C8FD6',
  sand: '#C9A24B',
  hail: '#AFE0FF'
};

/**
 * Plays the visual effect for a move against a pair of on-screen sprite
 * elements. This is intentionally imperative DOM manipulation (not template
 * bindings) because battle effects are short-lived, one-off animations that
 * don't belong in component state - the same approach used by the
 * interactive prototypes this service is ported from.
 */
@Injectable({ providedIn: 'root' })
export class MoveAnimationService {
  private readonly audio = inject(AudioService);

  /** Resolves once the impact should register (damage applied, HP bar updated). */
  async playMove(
    move: Move,
    refs: BattleStageRefs,
    phase?: 'charge' | 'release'
  ): Promise<void> {
    const launch = this.centerOf(refs.launchEl, refs.fieldEl);
    const target = this.centerOf(refs.targetEl, refs.fieldEl);
    const v = this.buildVisual(move);
    v.dir = target.x >= launch.x ? 1 : -1;

    if (phase === 'charge') {
      return this.playChargeTurn(move, refs, launch, v);
    }
    if (phase === 'release') {
      await this.playReleaseIntro(move, refs);
    } else if (v.charge) {
      await this.chargeUp(refs, launch, v);
    }

    const custom = this.customAnims[move.showdownId];
    await (custom ? custom(refs, launch, target, v) : this.playDelivery(refs, launch, target, v));
  }

  /** Hand-made animations that replace the derived one for specific moves (by @pkmn/sim id). */
  private readonly customAnims: Record<
    string,
    (refs: BattleStageRefs, launch: Point, target: Point, v: MoveVisual) => Promise<void>
  > = {
    absorb: (refs, launch, target) => this.playAbsorb(refs, launch, target),
    acid: (refs, launch, target) => this.playAcidSpit(refs, launch, target),
    agility: (refs, launch) => this.playAgility(refs, launch),
    amnesia: (refs, launch) => this.playAmnesia(refs, launch),
    aurorabeam: (refs, launch, target) => this.playAuroraBeam(refs, launch, target),
    barrage: (refs, launch, target) => this.playBarrage(refs, launch, target),
    barrier: (refs, launch) => this.playBarrier(refs, launch),
    bind: (refs, _launch, target) => this.playBind(refs, target),
    bite: (refs, _launch, target) => this.playBite(refs, target),
    dizzypunch: (refs, _launch, target, v) => this.playDizzyPunch(refs, target, v),
    doubleedge: (refs, launch, target, v) => this.playDoubleEdge(refs, launch, target, v),
    dreameater: (refs, launch, target, v) => this.playDreamEater(refs, launch, target, v),
    drillpeck: (refs, _launch, target, v) => this.playDrillPeck(refs, target, v),
    eggbomb: (refs, launch, target) => this.playEggBomb(refs, launch, target),
    explosion: (refs, launch, target, v) => this.playExplosion(refs, launch, target, v),
    firepunch: (refs, _launch, target) => this.playFirePunch(refs, target),
    fly: (refs, _launch, target) => this.playFlyDown(refs, target),
    glare: (refs, launch, target) => this.playGlare(refs, launch, target),
    headbutt: (refs, _launch, target, v) => this.playHeadbutt(refs, target, v),
    highjumpkick: (refs, _launch, target, v) => this.playHighJumpKick(refs, target, v),
    hyperfang: (refs, _launch, target, v) => this.playHyperFang(refs, target, v),
    icepunch: (refs, _launch, target) => this.playIcePunch(refs, target),
    // Like Absorb, but blood-red sparkles are drained from the target.
    leechlife: (refs, launch, target) => this.playAbsorb(refs, launch, target, ['#D8201C', '#FF8A80']),
    blizzard: (refs, launch, target) => this.playBlizzard(refs, launch, target),
    boneclub: (refs, launch, target, v) => this.playBoneClub(refs, launch, target, v),
    bonemerang: (refs, launch, target, v) => this.playBonemerang(refs, launch, target, v),
    bubble: (refs, launch, target) => this.playBubbles(refs, launch, target, BUBBLE_DRIFT),
    bubblebeam: (refs, launch, target) => this.playBubbles(refs, launch, target, BUBBLE_BEAM),
    crabhammer: (refs, _launch, target) => this.playCrabhammer(refs, target),
    dig: (refs, _launch, target) => this.playDigUp(refs, target),
    earthquake: (refs) => this.playEarthquake(refs),
    hydropump: (refs, launch, target) => this.playHydroPump(refs, launch, target),
    hyperbeam: (refs, launch, target) => this.playHyperBeam(refs, launch, target),
    icebeam: (refs, launch, target) => this.playIceBeam(refs, launch, target),
    darkpulse: (refs, launch, target) => this.playDarkPulse(refs, launch, target),
    psychic: (refs) => this.playPsychic(refs),
    thunder: (refs, _launch, target) => this.playThunder(refs, target),
    ember: (refs, _launch, _target, v) => this.playGroundFlame(refs, v),
    fireblast: (refs, launch, target, v) => this.playFireBlast(refs, launch, target, v),
    flareblitz: (refs, launch, target, v) => this.playFlareBlitz(refs, launch, target, v),
    flamethrower: (refs, launch, target, v) => this.playFlamethrower(refs, launch, target, v),
    firespin: async (refs, launch, target, v) => {
      await this.playDelivery(refs, launch, target, v);
      await this.playVortex(refs, v);
    }
  };

  private playDelivery(refs: BattleStageRefs, launch: Point, target: Point, v: MoveVisual): Promise<void> {
    switch (v.delivery) {
      case 'weather':
        return this.playWeather(refs, v);
      case 'selfAura':
        return this.playSelfAura(refs, launch, v);
      case 'targetAura':
        return this.playTargetAura(refs, target, v);
      case 'powder':
        return this.playPowder(refs, launch, target, v);
      case 'sonic':
        return this.playSonic(refs, launch, target, v);
      case 'field':
        return this.playField(refs, target, v);
      case 'beam':
        return this.playBeam(refs, launch, target, v);
      case 'pulse':
        return this.playPulse(refs, launch, target, v);
      case 'lob':
        return this.playLob(refs, launch, target, v);
      case 'projectile':
        return this.playProjectile(refs, launch, target, v);
      case 'melee':
        return this.playMelee(refs, launch, target, v);
    }
  }

  // --- per-move descriptor -------------------------------------------------

  private buildVisual(move: Move): MoveVisual {
    const d = Dex.moves.get(move.showdownId);
    const flags = (d?.flags ?? {}) as Record<string, unknown>;
    const name = move.name + ' ' + move.showdownId;
    const bp = d?.basePower ?? 0;
    const isStatus = d?.category === 'Status';
    const isPhysical = d?.category === 'Physical';
    const targetsSelf = d?.target === 'self' || d?.target === 'allySide';
    const selfBoost = boostSign(d?.boosts) || boostSign(d?.self?.boosts);
    const spread = d?.target === 'allAdjacent' || d?.target === 'allAdjacentFoes';
    const heal = Boolean(flags['heal'] || d?.heal) && isStatus;

    let delivery: Delivery;
    if (d?.weather) delivery = 'weather';
    else if (targetsSelf || (isStatus && (heal || selfBoost !== 0))) delivery = 'selfAura';
    else if (isStatus) delivery = flags['powder'] ? 'powder' : 'targetAura';
    else if (flags['sound']) delivery = 'sonic';
    else if (flags['pulse']) delivery = 'pulse';
    else if (flags['charge'] || /\bbeam\b|cannon/i.test(name)) delivery = 'beam';
    else if (flags['bullet'] || flags['bomb'] || /\b(ball|seed|bomb|shot|missile)\b/i.test(name))
      delivery = 'lob';
    else if (spread) delivery = 'field';
    else if (flags['contact'] && isPhysical) delivery = 'melee';
    else delivery = 'projectile';

    return {
      delivery,
      meleeStyle: meleeStyle(flags, name),
      type: move.type,
      dir: 1, // set from real sprite positions in playMove()
      color: move.color,
      power: bp ? clamp(bp / 150, 0.14, 1) : 0,
      hits: multiHitCount(d?.multihit),
      quick: (d?.priority ?? 0) > 0,
      charge: Boolean(flags['charge']),
      drain: Boolean(d?.drain),
      recoil: Boolean(d?.recoil || d?.hasCrashDamage),
      heal,
      spread,
      fleck: deriveFleck(d, selfBoost, delivery),
      weather: mapWeather(d?.weather)
    };
  }

  // --- deliveries --------------------------------------------------------

  private async playMelee(refs: BattleStageRefs, launch: Point, target: Point, v: MoveVisual) {
    const { launchEl, targetEl, fxEl } = refs;
    const dir = v.dir;
    const original = launchEl.style.transform;
    for (let hit = 0; hit < v.hits; hit++) {
      await this.anim(launchEl, [
        { transform: `${original} translateX(${dir * -10}px)` },
        { transform: `${original} translateX(${dir * 42}px)` }
      ], { duration: v.quick ? 120 : 170, easing: 'ease-in' });
      this.meleeGlyph(fxEl, target, v);
      await this.impact(refs, target, v, hit);
      await this.anim(launchEl, [{ transform: `${original} translateX(${dir * 42}px)` }, { transform: original }], {
        duration: 110,
        easing: 'ease-out'
      });
    }
    launchEl.style.transform = original;
    this.afterImpact(refs, launch, target, v);
  }

  private async playProjectile(refs: BattleStageRefs, launch: Point, target: Point, v: MoveVisual) {
    for (let hit = 0; hit < v.hits; hit++) {
      this.streamParticles(refs.fxEl, launch, target, v, 5 + Math.round(v.power * 6), v.quick ? 260 : 420);
      const core = this.glyph(v, 16 + v.power * 12);
      place(core, launch);
      refs.fxEl.appendChild(core);
      await this.anim(core, [
        { transform: 'translate(0,0) scale(.4)', opacity: 0.9 },
        { transform: `translate(${target.x - launch.x}px,${target.y - launch.y}px) scale(1.3)`, opacity: 1 }
      ], { duration: v.quick ? 260 : 430, easing: 'cubic-bezier(.4,0,.7,1)' });
      core.remove();
      await this.impact(refs, target, v, hit);
    }
    this.afterImpact(refs, launch, target, v);
  }

  private async playLob(refs: BattleStageRefs, launch: Point, target: Point, v: MoveVisual) {
    const arc = Math.min(launch.y, target.y) - 90 - v.power * 40;
    for (let hit = 0; hit < v.hits; hit++) {
      const orb = this.glyph(v, 18 + v.power * 14);
      place(orb, launch);
      refs.fxEl.appendChild(orb);
      await this.anim(orb, [
        { transform: 'translate(0,0) scale(.5)', offset: 0 },
        { transform: `translate(${(target.x - launch.x) * 0.5}px,${arc - launch.y}px) scale(1)`, offset: 0.5 },
        { transform: `translate(${target.x - launch.x}px,${target.y - launch.y}px) scale(1.1)`, offset: 1 }
      ], { duration: 520, easing: 'linear' });
      orb.remove();
      await this.impact(refs, target, v, hit);
      if (hit < v.hits - 1) await this.wait(80);
    }
    this.afterImpact(refs, launch, target, v);
  }

  private async playBeam(refs: BattleStageRefs, launch: Point, target: Point, v: MoveVisual) {
    const dx = target.x - launch.x;
    const dy = target.y - launch.y;
    const dist = Math.hypot(dx, dy);
    const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
    const thickness = 6 + v.power * 16;
    const beam = document.createElement('div');
    beam.style.cssText = `position:absolute;left:${launch.x}px;top:${launch.y - thickness / 2}px;height:${thickness}px;width:0;border-radius:${thickness}px;transform-origin:left center;transform:rotate(${angle}deg);background:linear-gradient(90deg,${v.color},#fff 75%);box-shadow:0 0 ${8 + v.power * 20}px ${v.color}`;
    refs.fxEl.appendChild(beam);
    await this.anim(beam, [{ width: '0px' }, { width: `${dist}px` }], {
      duration: 260,
      easing: 'ease-out',
      fill: 'forwards'
    });
    await this.impact(refs, target, v, 0);
    await this.wait(120 + v.power * 260);
    await this.anim(beam, [{ opacity: 1 }, { opacity: 0 }], { duration: 200, fill: 'forwards' });
    beam.remove();
    this.afterImpact(refs, launch, target, v);
  }

  private async playPulse(refs: BattleStageRefs, launch: Point, target: Point, v: MoveVisual) {
    const dx = target.x - launch.x;
    const dy = target.y - launch.y;
    for (let i = 0; i < 3; i++) {
      const ring = document.createElement('div');
      const size = 26 + v.power * 16;
      ring.style.cssText = `position:absolute;left:${launch.x - size / 2}px;top:${launch.y - size / 2}px;width:${size}px;height:${size}px;border-radius:50%;border:3px solid ${v.color};background:radial-gradient(circle,${v.color}44,transparent 70%)`;
      refs.fxEl.appendChild(ring);
      this.anim(ring, [
        { transform: 'translate(0,0) scale(.6)', opacity: 1 },
        { transform: `translate(${dx}px,${dy}px) scale(1.4)`, opacity: 0 }
      ], { duration: 520, easing: 'ease-in', delay: i * 130 }).then(() => ring.remove());
    }
    await this.wait(560);
    await this.impact(refs, target, v, 0);
    this.afterImpact(refs, launch, target, v);
  }

  private async playSonic(refs: BattleStageRefs, launch: Point, target: Point, v: MoveVisual) {
    for (let i = 0; i < 4; i++) {
      const ring = document.createElement('div');
      ring.style.cssText = `position:absolute;left:${launch.x}px;top:${launch.y}px;width:20px;height:20px;margin:-10px 0 0 -10px;border-radius:50%;border:2px solid ${v.color};opacity:.85`;
      refs.fxEl.appendChild(ring);
      this.anim(ring, [
        { transform: 'scale(.4)', opacity: 0.9 },
        { transform: `scale(${6 + v.power * 5})`, opacity: 0 }
      ], { duration: 640, easing: 'ease-out', delay: i * 110 }).then(() => ring.remove());
    }
    await this.wait(430);
    await this.impact(refs, target, v, 0);
    this.afterImpact(refs, launch, target, v);
  }

  private async playPowder(refs: BattleStageRefs, launch: Point, target: Point, v: MoveVisual) {
    this.streamParticles(refs.fxEl, launch, target, v, 22, 900, 26);
    await this.wait(760);
    this.flash(refs.targetEl, v.color, 0.3);
    this.fleck(refs.fxEl, target, v);
    await this.wait(240);
  }

  private async playField(refs: BattleStageRefs, target: Point, v: MoveVisual) {
    const { fieldEl, fxEl, screenFxEl, targetEl } = refs;
    const rect = fieldEl.getBoundingClientRect();
    this.screenWash(screenFxEl, `${v.color}55`, 150, 460, v.dir === 1 ? '65%' : '35%');
    this.shakeField(fieldEl, 0.7 + v.power * 0.6);

    if (v.type === 'Ground' || v.type === 'Rock') {
      // Cracks radiate from under whoever is being hit, not always mid-field.
      const originX = clamp(target.x, rect.width * 0.22, rect.width * 0.78);
      for (let i = 0; i < 5; i++) {
        const w = 40 + i * 26;
        const crack = document.createElement('div');
        crack.style.cssText = `position:absolute;left:${originX - w / 2}px;top:${rect.height * 0.72}px;height:3px;width:2px;background:${v.color};border-radius:2px`;
        fxEl.appendChild(crack);
        this.anim(crack, [
          { width: '2px', opacity: 0.9 },
          { width: `${w}px`, opacity: 0.9, offset: 0.5 },
          { width: `${w}px`, opacity: 0 }
        ], { duration: 620, easing: 'ease-out' }).then(() => crack.remove());
      }
    } else {
      // Wave sweeps from the caster's side across to the target's side.
      const from = v.dir === 1 ? -80 : rect.width + 80;
      const to = v.dir === 1 ? rect.width + 80 : -80;
      const mid = v.dir === 1 ? rect.width * 0.35 : rect.width * 0.65;
      const wave = document.createElement('div');
      wave.style.cssText = `position:absolute;left:0;top:${rect.height * 0.45}px;width:60px;height:${rect.height * 0.5}px;background:linear-gradient(90deg,transparent,${v.color}cc,transparent);filter:blur(2px)`;
      fxEl.appendChild(wave);
      this.anim(wave, [
        { transform: `translateX(${from}px) scaleY(.6)`, opacity: 0 },
        { transform: `translateX(${mid}px) scaleY(1)`, opacity: 1, offset: 0.4 },
        { transform: `translateX(${to}px) scaleY(.7)`, opacity: 0 }
      ], { duration: 620, easing: 'ease-in-out' }).then(() => wave.remove());
    }
    await this.wait(360);
    await this.impact(refs, target, v, 0);
    this.fleck(fxEl, target, v);
    void targetEl;
  }

  private async playSelfAura(refs: BattleStageRefs, launch: Point, v: MoveVisual) {
    const { launchEl, fxEl } = refs;
    const up = v.fleck !== 'statDown';
    const tint = v.heal ? FLECK_COLOR.statUp : up ? v.color : FLECK_COLOR.statDown;
    const original = launchEl.style.transform;
    this.anim(launchEl, [
      { transform: original },
      { transform: `${original} translateY(${up ? -10 : 6}px)`, offset: 0.5 },
      { transform: original }
    ], { duration: 700, easing: 'ease-in-out' });

    for (let i = 0; i < 2; i++) {
      const size = 64 + i * 22;
      const ring = document.createElement('div');
      ring.style.cssText = `position:absolute;left:${launch.x - size / 2}px;top:${launch.y - size / 2}px;width:${size}px;height:${size}px;border-radius:50%;border:2px solid ${tint}`;
      fxEl.appendChild(ring);
      this.anim(ring, [
        { transform: 'scale(.6)', opacity: 0 },
        { transform: `scale(1.25) rotate(${i ? -80 : 80}deg)`, opacity: 0.9, offset: 0.5 },
        { transform: 'scale(1.5)', opacity: 0 }
      ], { duration: 780, easing: 'ease-out' }).then(() => ring.remove());
    }
    for (let i = 0; i < 12; i++) {
      const mote = document.createElement('div');
      const s = 5 + Math.random() * 5;
      mote.style.cssText = `position:absolute;width:${s}px;height:${s}px;border-radius:50%;background:${tint};left:${launch.x + (Math.random() * 60 - 30)}px;top:${launch.y + 24}px`;
      fxEl.appendChild(mote);
      this.anim(mote, [
        { transform: 'translateY(0) scale(1)', opacity: 0.9 },
        { transform: `translateY(${up ? -60 : 40}px) scale(.2)`, opacity: 0 }
      ], { duration: 600 + Math.random() * 300, easing: 'ease-out', delay: Math.random() * 250 }).then(() => mote.remove());
    }
    this.flash(launchEl, tint, 0.4);
    await this.wait(780);
    launchEl.style.transform = original;
  }

  private async playTargetAura(refs: BattleStageRefs, target: Point, v: MoveVisual) {
    const { fxEl, targetEl } = refs;
    const glyph = this.glyph(v, 30);
    place(glyph, { x: target.x, y: target.y - 70 });
    fxEl.appendChild(glyph);
    await this.anim(glyph, [
      { transform: 'translateY(-24px) scale(.6)', opacity: 0 },
      { transform: 'translateY(0) scale(1)', opacity: 1, offset: 0.6 },
      { transform: 'translateY(6px) scale(1.2)', opacity: 0 }
    ], { duration: 520, easing: 'ease-in' });
    glyph.remove();
    this.flash(targetEl, v.color, 0.35);
    this.shake(targetEl, 3);
    this.fleck(fxEl, target, v);
    await this.wait(260);
  }

  private async playWeather(refs: BattleStageRefs, v: MoveVisual) {
    const { fieldEl, fxEl, screenFxEl } = refs;
    const rect = fieldEl.getBoundingClientRect();
    const color = WEATHER_COLOR[v.weather ?? 'sun'];
    screenFxEl.style.background = `linear-gradient(${v.weather === 'sun' ? '180deg' : '200deg'},${color}55,transparent 70%)`;
    screenFxEl.style.transition = 'opacity 300ms ease-out';
    screenFxEl.style.opacity = '1';

    const drops = v.weather === 'sun' ? 0 : 46;
    for (let i = 0; i < drops; i++) {
      const p = document.createElement('div');
      const rain = v.weather === 'rain';
      const s = rain ? 2 : v.weather === 'hail' ? 6 : 4;
      p.style.cssText = `position:absolute;width:${s}px;height:${rain ? 14 : s}px;border-radius:${rain ? '1px' : '50%'};background:${color};left:${Math.random() * rect.width}px;top:-20px;opacity:.8`;
      fxEl.appendChild(p);
      this.anim(p, [
        { transform: 'translateY(0)', opacity: 0.8 },
        { transform: `translate(${v.weather === 'sand' ? 40 : 12}px,${rect.height + 30}px)`, opacity: 0.1 }
      ], { duration: 700 + Math.random() * 500, easing: 'linear', delay: Math.random() * 500 }).then(() => p.remove());
    }
    if (v.weather === 'sun') {
      const glow = document.createElement('div');
      glow.style.cssText = `position:absolute;right:${rect.width * 0.12}px;top:${rect.height * 0.08}px;width:80px;height:80px;border-radius:50%;background:radial-gradient(circle,${color},transparent 70%)`;
      fxEl.appendChild(glow);
      this.anim(glow, [
        { transform: 'scale(.4)', opacity: 0 },
        { transform: 'scale(1.2)', opacity: 1, offset: 0.5 },
        { transform: 'scale(1)', opacity: 0.8 }
      ], { duration: 900, easing: 'ease-out' }).then(() => glow.remove());
    }
    await this.wait(900);
    screenFxEl.style.transition = 'opacity 500ms ease-in';
    screenFxEl.style.opacity = '0';
    await this.wait(300);
  }

  // --- shared beats -----------------------------------------------------

  /** Turn 1 of a two-turn move: gather energy, or duck under / fly up out of sight. */
  private async playChargeTurn(move: Move, refs: BattleStageRefs, launch: Point, v: MoveVisual) {
    if (move.showdownId === 'dig') return this.playDigDown(refs);
    if (move.showdownId === 'fly') return this.playFlyUp(refs, launch);
    if (SEMI_INVULN_ANIM.has(move.showdownId)) {
      const el = refs.launchEl;
      const down = move.showdownId === 'dig' || move.showdownId === 'dive';
      el.getAnimations?.().forEach((a) => a.cancel());
      el.style.transformOrigin = 'center bottom';
      await this.anim(el, [
        { transform: 'translateY(0) scale(1)', opacity: 1 },
        { transform: `translateY(${down ? 58 : -74}px) scale(${down ? 0.7 : 0.55})`, opacity: 0 }
      ], { duration: 400, easing: 'ease-in', fill: 'forwards' });
      el.style.opacity = '0';
      return;
    }
    await this.chargeUp(refs, launch, v);
  }

  /** Turn 2 of a semi-invulnerable move: the user drops back into view. */
  private async playReleaseIntro(move: Move, refs: BattleStageRefs) {
    // Dig's and Fly's own animations bring the user back.
    if (!SEMI_INVULN_ANIM.has(move.showdownId) || move.showdownId === 'dig' || move.showdownId === 'fly') return;
    await this.dropBackIn(refs.launchEl);
  }

  /** The user drops back into view from above, after being away (Fly, Bounce, …). */
  private async dropBackIn(el: HTMLElement) {
    el.getAnimations?.().forEach((a) => a.cancel());
    el.style.opacity = '1';
    await this.anim(el, [
      { transform: 'translateY(-46px) scale(.6)', opacity: 0 },
      { transform: 'translateY(0) scale(1)', opacity: 1 }
    ], { duration: 260, easing: 'ease-out' });
    el.style.transform = '';
  }

  private async chargeUp(refs: BattleStageRefs, launch: Point, v: MoveVisual) {
    const { launchEl, fxEl } = refs;
    const glow = document.createElement('div');
    const size = 30 + v.power * 24;
    glow.style.cssText = `position:absolute;left:${launch.x - size / 2}px;top:${launch.y - size / 2}px;width:${size}px;height:${size}px;border-radius:50%;background:radial-gradient(circle,#fff,${v.color} 60%,transparent);opacity:0`;
    fxEl.appendChild(glow);
    for (let i = 0; i < 10; i++) {
      const s = 5 + Math.random() * 4;
      const m = document.createElement('div');
      const ang = Math.random() * Math.PI * 2;
      const r = 50 + Math.random() * 30;
      m.style.cssText = `position:absolute;width:${s}px;height:${s}px;border-radius:50%;background:${v.color};left:${launch.x + Math.cos(ang) * r}px;top:${launch.y + Math.sin(ang) * r}px`;
      fxEl.appendChild(m);
      this.anim(m, [
        { transform: 'translate(0,0)', opacity: 0.9 },
        { transform: `translate(${-Math.cos(ang) * r}px,${-Math.sin(ang) * r}px) scale(.2)`, opacity: 0.3 }
      ], { duration: 420, easing: 'ease-in', delay: Math.random() * 120 }).then(() => m.remove());
    }
    this.flash(launchEl, v.color, 0.5);
    await this.anim(glow, [
      { transform: 'scale(.3)', opacity: 0 },
      { transform: 'scale(1)', opacity: 0.9, offset: 0.7 },
      { transform: 'scale(.6)', opacity: 0 }
    ], { duration: 480, easing: 'ease-out' });
    glow.remove();
  }

  /** One hit landing: burst + flash + shake, all scaled by power. */
  private async impact(refs: BattleStageRefs, target: Point, v: MoveVisual, hitIndex: number) {
    const strong = 0.35 + v.power * 0.65;
    this.emitBurst(refs.fxEl, target, v, 6 + Math.round(v.power * 8), 24 + v.power * 34);
    this.flash(refs.targetEl, v.color, strong);
    this.shake(refs.targetEl, 3 + v.power * 6);
    if (hitIndex === 0 && (v.spread || v.power > 0.8)) {
      this.screenWash(refs.screenFxEl, `${v.color}44`, 120, 260, v.dir === 1 ? '65%' : '35%');
      this.shakeField(refs.fieldEl, 0.5 + v.power * 0.5);
    }
    await this.wait(v.hits > 1 ? 140 : 90);
  }

  /** Cosmetic tail: status fleck, drain tendrils, caster recoil. */
  private afterImpact(refs: BattleStageRefs, launch: Point, target: Point, v: MoveVisual) {
    if (v.fleck) this.fleck(refs.fxEl, target, v);
    if (v.drain) {
      this.streamParticles(refs.fxEl, target, launch, { ...v, type: 'Grass' }, 10, 520);
      setTimeout(() => this.flash(refs.launchEl, FLECK_COLOR.statUp, 0.35), 260);
    }
    if (v.recoil) {
      setTimeout(() => {
        this.flash(refs.launchEl, '#E06666', 0.4);
        this.shake(refs.launchEl, 4);
      }, 120);
    }
  }

  /**
   * A ring of flames that ignites at the target's feet and spirals up around
   * it. Flames on the back half of the ring are smaller and dimmer, so the
   * ring reads as circling the sprite rather than sitting on top of it.
   */
  private async playVortex(refs: BattleStageRefs, v: MoveVisual) {
    const { fxEl, fieldEl, targetEl } = refs;
    const r = targetEl.getBoundingClientRect();
    const ground = this.footOf(targetEl, fieldEl);
    const rx = Math.max(r.width * 0.55, 34);
    const ry = rx * 0.3;
    const rise = Math.max(r.height * 1.1, 70);
    const spin = v.dir * Math.PI * 2.5;
    const colors = [v.color, '#FFD25A', '#FF5A1F'];

    // Glowing scorch ring on the ground where the vortex starts.
    const base = document.createElement('div');
    base.style.cssText = `position:absolute;width:${rx * 2}px;height:${ry * 2}px;border-radius:50%;border:3px solid ${v.color};box-shadow:0 0 14px ${v.color},inset 0 0 12px ${v.color};background:radial-gradient(ellipse,${v.color}55,transparent 70%)`;
    place(base, ground);
    fxEl.appendChild(base);
    this.anim(base, [
      { transform: 'scale(.3)', opacity: 0 },
      { transform: 'scale(1)', opacity: 1, offset: 0.25 },
      { transform: 'scale(1.05)', opacity: 0.8, offset: 0.75 },
      { transform: 'scale(1.1)', opacity: 0 }
    ], { duration: 1500, easing: 'ease-out' }).then(() => base.remove());

    // Three stacked rings of flames, each spinning upwards a little later.
    const waves = 3;
    const perWave = 14;
    const dur = 1100;
    const steps = 12;
    for (let w = 0; w < waves; w++) {
      for (let i = 0; i < perWave; i++) {
        const a0 = (Math.PI * 2 * i) / perWave + w * 0.4;
        const size = 14 + v.power * 10 + Math.random() * 6;
        const flame = document.createElement('div');
        const c = colors[(i + w) % colors.length];
        flame.style.cssText = `position:absolute;width:${size}px;height:${size}px;pointer-events:none;border-radius:50% 0 50% 50%;background:radial-gradient(circle at 60% 40%,#fff,${c} 45%,${c}00 80%);filter:drop-shadow(0 0 4px ${c})`;
        place(flame, ground);
        fxEl.appendChild(flame);
        const frames: Keyframe[] = [];
        for (let k = 0; k <= steps; k++) {
          const t = k / steps;
          const a = a0 + spin * t;
          const front = Math.sin(a) > 0;
          const x = Math.cos(a) * rx * (1 - t * 0.25);
          const y = Math.sin(a) * ry - t * rise;
          const scale = (1 - t * 0.55) * (front ? 1 : 0.7);
          const fade = Math.min(1, t * 6, (1 - t) * 3);
          frames.push({
            transform: `translate(${x}px,${y}px) rotate(-45deg) scale(${scale})`,
            opacity: fade * (front ? 1 : 0.55)
          });
        }
        this.anim(flame, frames, { duration: dur, easing: 'linear', delay: w * 180 }).then(() => flame.remove());
      }
    }

    // The target flickers while it is engulfed.
    for (let i = 0; i < 4; i++) setTimeout(() => this.flash(targetEl, v.color, 0.45), 200 + i * 280);
    await this.wait(dur + (waves - 1) * 180);
  }

  /** A single small flame that flares up at the target's feet and flickers out (Ember). */
  private async playGroundFlame(refs: BattleStageRefs, v: MoveVisual) {
    const { fxEl, fieldEl, targetEl } = refs;
    const w = Math.min(Math.max(targetEl.getBoundingClientRect().width * 0.28, 22), 36);
    const done = this.burnFlame(fxEl, this.footOf(targetEl, fieldEl), w, v.color, 900);
    await this.wait(200);
    this.flash(targetEl, v.color, 0.35);
    this.shake(targetEl, 3);
    await done;
  }

  /**
   * One flickering flame standing on `base` (its bottom-centre): flares up,
   * flickers, then floats up a little and goes out. Shared by Ember and the
   * burning target of Flamethrower.
   */
  private burnFlame(fxEl: HTMLElement, base: Point, w: number, color: string, duration: number, delay = 0): Promise<void> {
    // Outer flame with a yellow-white core; the square tear is rotated so its tip points up.
    const flame = document.createElement('div');
    flame.style.cssText = `position:absolute;left:${base.x - w / 2}px;top:${base.y - w * 1.5}px;width:${w}px;height:${w * 1.5}px;pointer-events:none;transform-origin:50% 100%`;
    for (const [scale, from, to] of [
      [1, '#FFB13C', color],
      [0.55, '#fff', '#FFD25A']
    ] as const) {
      const s = w * 0.8 * scale;
      const tear = document.createElement('div');
      tear.style.cssText = `position:absolute;left:${(w - s) / 2}px;bottom:${s * 0.15}px;width:${s}px;height:${s}px;border-radius:50% 0 50% 50%;transform:rotate(-45deg);background:radial-gradient(circle at 40% 60%,${from},${to} 70%);filter:drop-shadow(0 0 5px ${color})`;
      flame.appendChild(tear);
    }
    fxEl.appendChild(flame);

    const flicker: Keyframe[] = [{ transform: 'scale(.2,.1)', opacity: 0 }];
    const n = 8;
    for (let k = 1; k <= n; k++) {
      flicker.push({
        transform: `scale(${1 + (k % 2 ? 0.08 : -0.06)},${1 + (k % 2 ? -0.1 : 0.14)}) skewX(${k % 2 ? 4 : -4}deg)`,
        opacity: 1,
        offset: 0.12 + (k / n) * 0.7
      });
    }
    flicker.push({ transform: 'translateY(-10px) scale(.4,.6)', opacity: 0 });
    return this.anim(flame, flicker, { duration, delay, easing: 'ease-in-out' }).then(() => flame.remove());
  }

  /**
   * Flamethrower: the backdrop glows red-hot, a stream of fire pours from the
   * caster into the target, then the target turns red and burns briefly.
   */
  private async playFlamethrower(refs: BattleStageRefs, launch: Point, target: Point, v: MoveVisual) {
    const { fieldEl, fxEl, targetEl } = refs;
    const heat = this.backdrop(fieldEl, HEAT_BACKDROP);
    await this.anim(heat, [{ opacity: 0 }, { opacity: 1 }], { duration: 300, easing: 'ease-out' });
    // Heat shimmer: the red glow pulses gently.
    heat.animate([{ filter: 'brightness(1)' }, { filter: 'brightness(1.15)' }, { filter: 'brightness(1)' }], {
      duration: 500,
      iterations: Infinity
    });

    // Fire stream: puffs leave the caster in quick succession and swell as they fly.
    const puffs = 42;
    const gap = 24;
    const travel = 380;
    const stream = this.fireStream(fxEl, launch, target, { count: puffs, gap, travel });
    // The target shakes under the stream.
    for (let t = travel * 0.8; t < puffs * gap + travel; t += 260) setTimeout(() => this.shake(targetEl, 4), t);
    await this.wait(travel * 0.8);
    targetEl.style.filter = `sepia(1) saturate(5) hue-rotate(-25deg) brightness(.95) drop-shadow(0 0 8px ${v.color})`;
    await stream;

    // Burning: a few flames flicker over the reddened target.
    const r = targetEl.getBoundingClientRect();
    const foot = this.footOf(targetEl, fieldEl);
    const fw = Math.min(Math.max(r.width * 0.26, 20), 34);
    const burns: Promise<void>[] = [];
    for (let i = 0; i < 5; i++) {
      const base = {
        x: target.x + (Math.random() * 2 - 1) * r.width * 0.32,
        y: foot.y - Math.random() * r.height * 0.5
      };
      burns.push(this.burnFlame(fxEl, base, fw * (0.8 + Math.random() * 0.4), v.color, 750, i * 110));
    }
    await Promise.all(burns);
    targetEl.style.filter = '';

    await this.anim(heat, [{ opacity: 1 }, { opacity: 0 }], { duration: 380, easing: 'ease-in' });
    heat.remove();
  }


  /**
   * Absorb: no projectile. Green energy stars are pulled out of the target and
   * drift back to the caster along wavy arcs, then sparkle around the caster
   * to show the HP it gained. The drained stars' colours can be changed
   * (Leech Life drains blood-red ones).
   */
  private async playAbsorb(
    refs: BattleStageRefs,
    launch: Point,
    target: Point,
    [main, light]: [string, string] = [FLECK_COLOR.statUp, '#E6FFB0']
  ) {
    const { fxEl, targetEl } = refs;
    const dx = launch.x - target.x;
    const dy = launch.y - target.y;

    this.flash(targetEl, main, 0.4);
    this.shake(targetEl, 3);

    // Stream: stars leave the target in a steady trickle and float to the caster.
    const count = 22;
    const travel = 900;
    const spread = 1100;
    for (let i = 0; i < count; i++) {
      const star = this.sparkStar(8 + Math.random() * 7, i % 3 ? main : light);
      place(star, { x: target.x + (Math.random() * 40 - 20), y: target.y + (Math.random() * 40 - 20) });
      fxEl.appendChild(star);
      const bend = (Math.random() * 2 - 1) * 45;
      const frames: Keyframe[] = [];
      const steps = 8;
      for (let k = 0; k <= steps; k++) {
        const t = k / steps;
        const ease = t * t * (3 - 2 * t);
        frames.push({
          transform: `translate(${dx * ease}px,${dy * ease + Math.sin(t * Math.PI) * bend}px) rotate(${t * 240}deg) scale(${0.4 + Math.sin(t * Math.PI) * 0.8})`,
          opacity: Math.min(1, t * 5, (1 - t) * 4 + 0.2)
        });
      }
      this.anim(star, frames, { duration: travel, easing: 'linear', delay: (i / count) * spread }).then(() => star.remove());
    }
    await this.wait(travel + spread * 0.8);
    await this.healSparkles(refs, launch);
  }

  /** HP gain: twinkling green stars and a soft green glow around the caster (drain moves). */
  private async healSparkles(refs: BattleStageRefs, launch: Point) {
    const { fxEl, launchEl } = refs;
    const green = FLECK_COLOR.statUp;
    const r = launchEl.getBoundingClientRect();
    const rad = Math.max(r.width * 0.45, 28);
    for (let i = 0; i < 12; i++) {
      const star = this.sparkStar(9 + Math.random() * 8, i % 2 ? green : '#fff');
      place(star, {
        x: launch.x + (Math.random() * 2 - 1) * rad,
        y: launch.y + (Math.random() * 2 - 1) * rad
      });
      fxEl.appendChild(star);
      this.anim(star, [
        { transform: 'translateY(0) scale(0) rotate(0deg)', opacity: 0 },
        { transform: 'translateY(-6px) scale(1.2) rotate(90deg)', opacity: 1, offset: 0.4 },
        { transform: 'translateY(-18px) scale(0) rotate(180deg)', opacity: 0 }
      ], { duration: 650, easing: 'ease-out', delay: Math.random() * 450 }).then(() => star.remove());
    }
    this.flash(launchEl, green, 0.5);
    setTimeout(() => this.flash(launchEl, green, 0.35), 350);
    await this.wait(900);
  }

  /**
   * Dream Eater: the scene goes dark, glowing yellow dream orbs drift out of
   * the sleeping target into the caster, the caster glows with purple psychic
   * sparkles, then the target is hit and the caster gains HP (green sparkles).
   */
  private async playDreamEater(refs: BattleStageRefs, launch: Point, target: Point, v: MoveVisual) {
    const { fieldEl, fxEl, launchEl } = refs;

    // 1. Darkness.
    const dim = this.backdrop(fieldEl, DIM_BACKDROP);
    await this.anim(dim, [{ opacity: 0 }, { opacity: 1 }], { duration: 300, easing: 'ease-out' });

    // 2. Yellow dream orbs float from the target to the caster on wavy paths.
    const dx = launch.x - target.x;
    const dy = launch.y - target.y;
    const count = 16;
    const travel = 1000;
    const spread = 900;
    for (let i = 0; i < count; i++) {
      const s = 8 + Math.random() * 8;
      const orb = document.createElement('div');
      orb.style.cssText = `position:absolute;width:${s}px;height:${s}px;border-radius:50%;pointer-events:none;background:radial-gradient(circle,#FFFBE0,#FFE36A 45%,#F2C23A00 75%);box-shadow:0 0 ${s}px #FFE36A88`;
      place(orb, { x: target.x + (Math.random() * 40 - 20), y: target.y + (Math.random() * 40 - 20) });
      fxEl.appendChild(orb);
      const bend = (Math.random() * 2 - 1) * 40;
      const frames: Keyframe[] = [];
      const steps = 8;
      for (let k = 0; k <= steps; k++) {
        const t = k / steps;
        const ease = t * t * (3 - 2 * t);
        frames.push({
          transform: `translate(${dx * ease}px,${dy * ease + Math.sin(t * Math.PI) * bend}px) scale(${0.5 + Math.sin(t * Math.PI) * 0.6})`,
          opacity: Math.min(1, t * 5, (1 - t) * 4 + 0.2)
        });
      }
      this.anim(orb, frames, { duration: travel, easing: 'linear', delay: (i / count) * spread }).then(() => orb.remove());
    }
    await this.wait(travel + spread * 0.85);

    // 3. The caster glows while purple psychic sparkles twinkle over it.
    const r = launchEl.getBoundingClientRect();
    const rad = Math.max(r.width * 0.45, 28);
    const glow = this.anim(launchEl, [
      { filter: 'brightness(1)' },
      { filter: 'brightness(1.7) drop-shadow(0 0 10px #E9A8FF)', offset: 0.3 },
      { filter: 'brightness(1.5) drop-shadow(0 0 8px #E9A8FF)', offset: 0.75 },
      { filter: 'brightness(1)' }
    ], { duration: 900, easing: 'ease-in-out', fill: 'none' });
    for (let i = 0; i < 12; i++) {
      const sp = this.psySparkle(14 + Math.random() * 10);
      place(sp, { x: launch.x + (Math.random() * 2 - 1) * rad, y: launch.y + (Math.random() * 2 - 1) * rad });
      fxEl.appendChild(sp);
      this.anim(sp, [
        { transform: 'scale(0) rotate(0deg)', opacity: 0 },
        { transform: 'scale(1) rotate(45deg)', opacity: 1, offset: 0.4 },
        { transform: 'scale(.2) rotate(90deg)', opacity: 0 }
      ], { duration: 500, easing: 'ease-out', delay: Math.random() * 400 }).then(() => sp.remove());
    }
    await glow;

    // 4. The target takes the hit (blinking); the caster recovers HP.
    await Promise.all([this.blink(refs.targetEl), this.impact(refs, target, v, 0)]);
    const fade = this.anim(dim, [{ opacity: 1 }, { opacity: 0 }], { duration: 400, delay: 300 }).then(() => dim.remove());
    await this.healSparkles(refs, launch);
    await fade;
  }

  /** A purple four-point psychic sparkle inside a thin glowing ring. */
  private psySparkle(size: number): HTMLElement {
    const el = this.sparkStar(size, '#C860FF');
    const ring = document.createElement('div');
    ring.style.cssText = 'position:absolute;inset:22%;border-radius:50%;border:1.5px solid #F0C8FF;box-shadow:0 0 4px #C860FF';
    el.appendChild(ring);
    return el;
  }

  /**
   * Acid:the caster spits a quick volley of dark purple poison droplets that
   * fly in a shallow arc and splash on the target.
   */
  private async playAcidSpit(refs: BattleStageRefs, launch: Point, target: Point) {
    const { fxEl, targetEl } = refs;
    const purple = '#5A1F8C';
    const dark = '#2A0B45';
    const dx = target.x - launch.x;
    const dy = target.y - launch.y;
    const lift = 36 + Math.abs(dx) * 0.08;
    const drops = 7;
    const gap = 75;
    const travel = 440;
    const steps = 8;

    const landed: Promise<void>[] = [];
    for (let i = 0; i < drops; i++) {
      const size = 11 + Math.random() * 7;
      const drop = document.createElement('div');
      drop.style.cssText = `position:absolute;width:${size}px;height:${size}px;pointer-events:none;border-radius:50% 50% 50% 50%/60% 60% 40% 40%;background:radial-gradient(circle at 35% 30%,#C79BEA,${purple} 45%,${dark});box-shadow:0 0 5px ${purple}`;
      place(drop, { x: launch.x + (Math.random() * 10 - 5), y: launch.y + (Math.random() * 10 - 5) });
      fxEl.appendChild(drop);
      // Each droplet lands a little off-centre so the volley spreads over the target.
      const hx = dx + (Math.random() * 30 - 15);
      const hy = dy + (Math.random() * 24 - 12);
      const frames: Keyframe[] = [];
      for (let k = 0; k <= steps; k++) {
        const t = k / steps;
        const wobble = k % 2 ? 1.15 : 0.88;
        frames.push({
          transform: `translate(${hx * t}px,${hy * t - Math.sin(t * Math.PI) * lift}px) scale(${(0.6 + t * 0.5) * wobble},${(0.6 + t * 0.5) / wobble})`,
          opacity: t === 0 ? 0 : 1
        });
      }
      landed.push(
        this.anim(drop, frames, { duration: travel, easing: 'linear', delay: i * gap }).then(() => {
          drop.remove();
          this.acidSplash(fxEl, { x: launch.x + hx, y: launch.y + hy }, purple);
          if (i === 0) this.flash(targetEl, purple, 0.45);
          if (i % 2 === 0) this.shake(targetEl, 3);
        })
      );
    }
    await Promise.all(landed);
    this.flash(targetEl, purple, 0.5);
    await this.wait(250);
  }

  /** A few dark purple specks that burst out where a poison droplet hits. */
  private acidSplash(fxEl: HTMLElement, at: Point, color: string) {
    for (let i = 0; i < 4; i++) {
      const s = 4 + Math.random() * 4;
      const speck = document.createElement('div');
      speck.style.cssText = `position:absolute;width:${s}px;height:${s}px;border-radius:50%;pointer-events:none;background:${color}`;
      place(speck, at);
      fxEl.appendChild(speck);
      const ang = Math.random() * Math.PI * 2;
      const dist = 10 + Math.random() * 14;
      this.anim(speck, [
        { transform: 'translate(0,0) scale(1)', opacity: 1 },
        { transform: `translate(${Math.cos(ang) * dist}px,${Math.sin(ang) * dist + 8}px) scale(.4)`, opacity: 0 }
      ], { duration: 320, easing: 'ease-out' }).then(() => speck.remove());
    }
  }

  /**
   * Agility: the battle backdrop turns into rushing blue speed lines while the
   * caster zips around a small circle. Only its position moves, so it keeps
   * facing the opponent.
   */
  private async playAgility(refs: BattleStageRefs, launch: Point) {
    const { fieldEl, launchEl } = refs;
    const W = fieldEl.clientWidth;
    const H = fieldEl.clientHeight;
    const total = 1400;
    // Agility targets the caster itself, so derive facing from its side of the field.
    const facing = launch.x < W / 2 ? 1 : -1;

    const bg = this.backdrop(fieldEl, 'background:linear-gradient(180deg,#0B3E9E,#1E8BE8 30%,#57C8FF 50%,#1E8BE8 70%,#0B3E9E)');
    // Lines rush past opposite to the way the caster faces, as if it is dashing forward.
    const flow = -facing;
    for (let i = 0; i < 34; i++) {
      const line = document.createElement('div');
      const len = W * (0.2 + Math.random() * 0.45);
      const thick = 1 + Math.random() * 4;
      const color = Math.random() < 0.6 ? '#FFFFFF' : '#9BE7FF';
      line.style.cssText = `position:absolute;left:0;top:${Math.random() * H}px;width:${len}px;height:${thick}px;border-radius:${thick}px;background:linear-gradient(90deg,transparent,${color},transparent);opacity:${0.5 + Math.random() * 0.5}`;
      bg.appendChild(line);
      line.animate(
        [
          { transform: `translateX(${flow > 0 ? -len : W}px)` },
          { transform: `translateX(${flow > 0 ? W : -len}px)` }
        ],
        { duration: 220 + Math.random() * 300, delay: -Math.random() * 500, iterations: Infinity, easing: 'linear' }
      );
    }
    const bgDone = this.anim(bg, [
      { opacity: 0 },
      { opacity: 1, offset: 0.12 },
      { opacity: 1, offset: 0.85 },
      { opacity: 0 }
    ], { duration: total, easing: 'linear' }).then(() => bg.remove());

    // Two quick laps around a small circle that starts and ends at the sprite's spot.
    const original = launchEl.style.transform;
    const r = 14;
    const laps = 2;
    const steps = 24;
    const circle: Keyframe[] = [];
    for (let k = 0; k <= steps; k++) {
      const a = (k / steps) * Math.PI * 2 * laps;
      circle.push({ transform: `${original} translate(${r * Math.sin(a) * facing}px,${-r * (1 - Math.cos(a))}px)` });
    }
    await this.wait(180);
    await this.anim(launchEl, circle, { duration: 900, easing: 'ease-in-out' });
    launchEl.getAnimations?.().forEach((a) => a.cancel());
    launchEl.style.transform = original;
    await bgDone;
  }

  /**
   * Amnesia: the backdrop dims while a cloud with a "?" forms over the
   * caster. The cloud puffs away, the backdrop clears, and orange
   * sparkles drift over the caster.
   */
  private async playAmnesia(refs: BattleStageRefs, launch: Point) {
    const { fieldEl, fxEl, launchEl } = refs;
    const r = launchEl.getBoundingClientRect();
    const f = fieldEl.getBoundingClientRect();
    const head: Point = { x: launch.x, y: r.top - f.top + r.height * 0.15 };

    const dim = this.backdrop(fieldEl, DIM_BACKDROP);
    const dimIn = this.anim(dim, [{ opacity: 0 }, { opacity: 1 }], { duration: 300, easing: 'ease-out' });

    // One cloud: overlapping bumps share a fill and a single glow (on the
    // wrapper), so they read as one shape with the "?" inside it.
    const cw = Math.max(r.width * 0.8, 72);
    const ch = cw * 0.62;
    const cloud = document.createElement('div');
    cloud.style.cssText = `position:absolute;width:${cw}px;height:${ch}px;pointer-events:none;filter:drop-shadow(0 0 6px #ffffffaa)`;
    const fill = 'background:radial-gradient(circle at 40% 30%,#fff,#E8ECF5 70%,#D2D8E6)';
    // [left, top, size] in % of the cloud width / height.
    for (const [x, y, size] of [
      [4, 38, 42],
      [22, 8, 52],
      [50, 14, 46],
      [58, 40, 38]
    ]) {
      const bump = document.createElement('div');
      bump.style.cssText = `position:absolute;left:${x}%;top:${y}%;width:${size}%;aspect-ratio:1;border-radius:50%;${fill}`;
      cloud.appendChild(bump);
    }
    const base = document.createElement('div');
    base.style.cssText = `position:absolute;left:12%;right:12%;bottom:4%;height:42%;border-radius:${ch}px;${fill}`;
    cloud.appendChild(base);
    const mark = document.createElement('div');
    mark.textContent = '?';
    mark.style.cssText = `position:absolute;left:0;right:0;top:50%;margin-top:-${ch * 0.3}px;height:${ch * 0.6}px;text-align:center;font:bold ${ch * 0.6}px/${ch * 0.6}px sans-serif;color:#6F7894`;
    cloud.appendChild(mark);
    place(cloud, head);
    fxEl.appendChild(cloud);

    this.anim(cloud, [
      { transform: 'scale(0)', opacity: 0 },
      { transform: 'scale(1.12)', opacity: 1, offset: 0.7 },
      { transform: 'scale(1)', opacity: 1 }
    ], { duration: 380, easing: 'ease-out', delay: 150 });
    // The question mark wobbles while the cloud hangs there.
    this.anim(mark, [
      { transform: 'rotate(0deg)' },
      { transform: 'rotate(-12deg)', offset: 0.25 },
      { transform: 'rotate(10deg)', offset: 0.75 },
      { transform: 'rotate(0deg)' }
    ], { duration: 700, easing: 'ease-in-out', delay: 650 });
    await dimIn;
    await this.wait(1200);

    // Puff away: the cloud swells, blurs and fades; the backdrop clears.
    this.anim(cloud, [
      { transform: 'scale(1)', opacity: 1, filter: 'drop-shadow(0 0 6px #ffffffaa) blur(0px)' },
      { transform: 'translateY(-10px) scale(1.6)', opacity: 0, filter: 'drop-shadow(0 0 6px #ffffffaa) blur(6px)' }
    ], { duration: 450, easing: 'ease-out' }).then(() => cloud.remove());
    await this.anim(dim, [{ opacity: 1 }, { opacity: 0 }], { duration: 420, easing: 'ease-in' });
    dim.remove();

    // Orange sparkles drift down over the caster.
    const spread = Math.max(r.width * 0.45, 30);
    for (let i = 0; i < 16; i++) {
      const s = 6 + Math.random() * 6;
      const dot = document.createElement('div');
      dot.style.cssText = `position:absolute;width:${s}px;height:${s}px;border-radius:50%;pointer-events:none;background:radial-gradient(circle,#FFF3C4,#FFA62B 55%,#FF7A0000);box-shadow:0 0 6px #FFA62B`;
      place(dot, { x: launch.x + (Math.random() * 2 - 1) * spread, y: head.y + Math.random() * r.height * 0.6 });
      fxEl.appendChild(dot);
      this.anim(dot, [
        { transform: 'translateY(0) scale(0)', opacity: 0 },
        { transform: 'translateY(6px) scale(1.2)', opacity: 1, offset: 0.35 },
        { transform: 'translateY(22px) scale(.3)', opacity: 0 }
      ], { duration: 700, easing: 'ease-out', delay: Math.random() * 500 }).then(() => dot.remove());
    }
    this.flash(launchEl, '#FFA62B', 0.3);
    await this.wait(1200);
  }

  /**
   * Aurora Beam: over a darkened backdrop, a tight stream of rainbow rings
   * flies from the caster to the target, each ring facing along the beam.
   */
  private async playAuroraBeam(refs: BattleStageRefs, launch: Point, target: Point) {
    const { fieldEl, fxEl, targetEl } = refs;
    const dx = target.x - launch.x;
    const dy = target.y - launch.y;
    const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
    // Unit vector across the beam, for a slight corkscrew wobble.
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len;
    const ny = dx / len;

    const dim = this.backdrop(fieldEl, DIM_BACKDROP);
    await this.anim(dim, [{ opacity: 0 }, { opacity: 1 }], { duration: 300, easing: 'ease-out' });

    const rings = 34;
    const gap = 24;
    const travel = 420;
    const steps = 6;
    const flights: Promise<void>[] = [];
    for (let i = 0; i < rings; i++) {
      const hue = (i * 37) % 360;
      const color = `hsl(${hue},100%,62%)`;
      const ring = document.createElement('div');
      ring.style.cssText = `position:absolute;width:12px;height:38px;border-radius:50%;pointer-events:none;border:3px solid ${color};box-shadow:0 0 6px ${color},inset 0 0 4px ${color}`;
      place(ring, launch);
      fxEl.appendChild(ring);
      const phase = i * 0.9;
      const frames: Keyframe[] = [];
      for (let k = 0; k <= steps; k++) {
        const t = k / steps;
        const wob = Math.sin(phase + t * Math.PI * 2) * 5;
        frames.push({
          transform: `translate(${dx * t + nx * wob}px,${dy * t + ny * wob}px) rotate(${angle}deg) scale(${0.5 + t * 0.7})`,
          opacity: t === 0 ? 0 : t === 1 ? 0.2 : 1
        });
      }
      flights.push(
        this.anim(ring, frames, { duration: travel, easing: 'linear', delay: i * gap }).then(() => {
          ring.remove();
          if (i % 4 === 0) this.flash(targetEl, color, 0.45);
          if (i % 8 === 0) this.shake(targetEl, 3);
        })
      );
    }
    await Promise.all(flights);
    this.flash(targetEl, '#9CD6FF', 0.6);
    await this.wait(200);
    await this.anim(dim, [{ opacity: 1 }, { opacity: 0 }], { duration: 380, easing: 'ease-in' });
    dim.remove();
  }

  /**
   * Barrage: one large glowing white orb is lobbed at the target; the ground
   * shakes once it lands.
   */
  private async playBarrage(refs: BattleStageRefs, launch: Point, target: Point) {
    const { fxEl, fieldEl, targetEl } = refs;
    const size = 46;
    const dx = target.x - launch.x;
    const dy = target.y - launch.y;
    const arc = Math.min(launch.y, target.y) - 70 - launch.y;

    const orb = document.createElement('div');
    orb.style.cssText = `position:absolute;width:${size}px;height:${size}px;border-radius:50%;pointer-events:none;background:radial-gradient(circle at 38% 32%,#fff,#F3EEFF 45%,#CFC6E6 80%,#B7ADD4);box-shadow:0 0 14px #fff,0 0 28px #E8E0FFaa`;
    place(orb, launch);
    fxEl.appendChild(orb);
    await this.anim(orb, [
      { transform: 'translate(0,0) scale(.5)', opacity: 0, offset: 0 },
      { transform: `translate(${dx * 0.12}px,${arc * 0.4}px) scale(.75)`, opacity: 1, offset: 0.12 },
      { transform: `translate(${dx * 0.5}px,${arc}px) scale(1)`, offset: 0.5 },
      { transform: `translate(${dx}px,${dy}px) scale(1.1)`, offset: 1 }
    ], { duration: 620, easing: 'ease-in' });

    // Impact: the orb squashes and bursts into light, the target recoils, then the ground shakes.
    this.anim(orb, [
      { transform: `translate(${dx}px,${dy}px) scale(1.1,1.1)`, opacity: 1 },
      { transform: `translate(${dx}px,${dy}px) scale(1.6,1.2)`, opacity: 0 }
    ], { duration: 260, easing: 'ease-out' }).then(() => orb.remove());
    this.flash(targetEl, '#ffffff', 0.7);
    this.shake(targetEl, 5);
    await this.wait(120);
    this.shakeField(fieldEl, 0.6);
    await this.wait(480);
  }

  /**
   * Barrier: a flat, glassy panel opens in front of the caster, a sheen of
   * light sweeps over it, it glows brighter with twinkling sparkles, then fades.
   */
  private async playBarrier(refs: BattleStageRefs, launch: Point) {
    const { fxEl, launchEl } = refs;
    const r = launchEl.getBoundingClientRect();
    const w = Math.max(r.width * 0.9, 60);
    const h = Math.max(r.height * 1.0, 70);

    const panel = document.createElement('div');
    panel.style.cssText = `position:absolute;width:${w}px;height:${h}px;pointer-events:none;overflow:hidden;border:2px solid #ffffffcc;border-radius:3px;background:linear-gradient(160deg,#E8FFFB66,#9FE9E255 45%,#7FD8D04d);box-shadow:0 0 10px #B8FFF6aa,inset 0 0 14px #ffffff66`;
    // Diagonal band of light that sweeps across the glass.
    const sheen = document.createElement('div');
    sheen.style.cssText = `position:absolute;top:-20%;left:0;width:${w * 0.35}px;height:140%;background:linear-gradient(90deg,transparent,#ffffffcc,transparent);transform:skewX(-20deg)`;
    panel.appendChild(sheen);
    place(panel, launch);
    fxEl.appendChild(panel);

    const total = 1700;
    const done = this.anim(panel, [
      { transform: 'scale(1,0.05)', opacity: 0, background: 'linear-gradient(160deg,#E8FFFB66,#9FE9E255 45%,#7FD8D04d)' },
      { transform: 'scale(1,1)', opacity: 1, offset: 0.15 },
      { transform: 'scale(1,1)', opacity: 0.85, offset: 0.4, background: 'linear-gradient(160deg,#E8FFFB66,#9FE9E255 45%,#7FD8D04d)' },
      { transform: 'scale(1.02,1.02)', opacity: 1, offset: 0.6, background: 'linear-gradient(160deg,#D6FFF8bb,#7FE6DCaa 45%,#5CCFC699)' },
      { transform: 'scale(1,1)', opacity: 0.9, offset: 0.85 },
      { transform: 'scale(1,1)', opacity: 0 }
    ], { duration: total, easing: 'ease-in-out' }).then(() => panel.remove());
    this.anim(sheen, [
      { transform: `translateX(${-w * 0.5}px) skewX(-20deg)` },
      { transform: `translateX(${w * 1.2}px) skewX(-20deg)` }
    ], { duration: 650, easing: 'ease-in-out', delay: 280 });

    // Sparkles twinkle on the glass, mostly near its upper edge and corners.
    const left = launch.x - w / 2;
    const top = launch.y - h / 2;
    for (let i = 0; i < 9; i++) {
      const star = this.sparkStar(10 + Math.random() * 10, i % 3 ? '#ffffff' : '#C9FFF8');
      const corner = i < 4;
      place(star, {
        x: left + (corner ? (i % 2 ? w * 0.1 : w * 0.9) : Math.random() * w),
        y: top + (corner ? (i < 2 ? h * 0.1 : h * 0.9) : Math.random() * h * 0.6)
      });
      fxEl.appendChild(star);
      this.anim(star, [
        { transform: 'scale(0) rotate(0deg)', opacity: 0 },
        { transform: 'scale(1.2) rotate(45deg)', opacity: 1, offset: 0.4 },
        { transform: 'scale(0) rotate(90deg)', opacity: 0 }
      ], { duration: 520, easing: 'ease-out', delay: 300 + Math.random() * 900 }).then(() => star.remove());
    }
    this.flash(launchEl, '#B8FFF6', 0.3);
    await done;
  }

  /**
   * Bind: nested dark arcs close in on both sides of the target and squeeze
   * in and out quickly while the target is pressed together.
   */
  private async playBind(refs: BattleStageRefs, target: Point) {
    const { fxEl, targetEl } = refs;
    const r = targetEl.getBoundingClientRect();
    const baseW = Math.max(r.width * 0.95, 60);
    const baseH = Math.max(r.height * 0.8, 50);
    const squeezes = 6;
    const beat = 150;
    const hold = squeezes * beat;

    // Only the left and right borders are coloured, so each ring reads as "( )".
    const rings: HTMLElement[] = [];
    for (let i = 0; i < 4; i++) {
      const w = baseW * (1 + i * 0.14);
      const h = baseH * (1 - i * 0.06);
      const ring = document.createElement('div');
      ring.style.cssText = `position:absolute;width:${w}px;height:${h}px;border-radius:50%;pointer-events:none;border:${3 - i * 0.4}px solid transparent;border-left-color:#1E1A24;border-right-color:#1E1A24;opacity:${0.85 - i * 0.15}`;
      place(ring, target);
      fxEl.appendChild(ring);
      rings.push(ring);
    }

    // Close in from wide, then pulse: tight - loose - tight ...
    const frames = (i: number): Keyframe[] => {
      const out: Keyframe[] = [{ transform: 'scaleX(1.6)', opacity: 0, offset: 0 }];
      const start = 0.15;
      for (let k = 0; k <= squeezes * 2; k++) {
        out.push({
          transform: `scaleX(${k % 2 ? 1.08 + i * 0.02 : 0.86})`,
          opacity: 1,
          offset: start + (k / (squeezes * 2)) * (0.85 - start)
        });
      }
      out.push({ transform: 'scaleX(1.2)', opacity: 0, offset: 1 });
      return out;
    };
    const total = hold / 0.7;
    const done = rings.map((ring, i) =>
      this.anim(ring, frames(i), { duration: total, easing: 'ease-in-out', delay: i * 20 }).then(() => ring.remove())
    );

    // The target gets squeezed in time with the arcs.
    const original = targetEl.style.transform;
    const squash: Keyframe[] = [{ transform: original, offset: 0 }];
    for (let k = 0; k <= squeezes * 2; k++) {
      squash.push({
        transform: `${original} scaleX(${k % 2 ? 1 : 0.93})`,
        offset: 0.15 + (k / (squeezes * 2)) * 0.7
      });
    }
    squash.push({ transform: original, offset: 1 });
    // A dim flash on every tight squeeze (the even keyframes above).
    for (let j = 0; j < squeezes; j++) {
      setTimeout(() => this.flash(targetEl, '#8a7a9a', 0.25), total * (0.15 + (j / squeezes) * 0.7));
    }
    await this.anim(targetEl, squash, { duration: total, easing: 'ease-in-out' });
    targetEl.getAnimations?.().forEach((a) => a.cancel());
    targetEl.style.transform = original;
    await Promise.all(done);
  }

  /**
   * Bite: a white jaw with sharp teeth opens above and below the target and
   * snaps shut on it, stopping just before the teeth touch.
   */
  private async playBite(refs: BattleStageRefs, target: Point) {
    const { fxEl, targetEl } = refs;
    const r = targetEl.getBoundingClientRect();
    const w = Math.max(r.width * 1.1, 72);
    const h = w * 0.46;
    // Tooth tips sit at 45/46 of the glyph height; stop them a few px apart so the halves never touch.
    const gap = 3;
    const shut = h * (45 / 46 - 0.5) + gap;
    const open = shut + Math.max(r.height * 0.22, 16);

    const upper = this.jawGlyph(w, h, false);
    const lower = this.jawGlyph(w, h, true);
    place(upper, target);
    place(lower, target);
    fxEl.append(upper, lower);

    const move = (el: HTMLElement, sign: number, flip: string): Promise<void> =>
      this.anim(el, [
        { transform: `translateY(${sign * (open + 8)}px) ${flip}`, opacity: 0, offset: 0 },
        { transform: `translateY(${sign * open}px) ${flip}`, opacity: 1, offset: 0.43 },
        { transform: `translateY(${sign * (open + 4)}px) ${flip}`, opacity: 1, offset: 0.79 },
        // Must end at offset 1: otherwise the browser adds a final frame at the untransformed spot.
        { transform: `translateY(${sign * shut}px) ${flip}`, opacity: 1, offset: 1 }
      ], { duration: 450, easing: 'ease-in' });
    await Promise.all([move(upper, -1, ''), move(lower, 1, 'scaleY(-1)')]);

    // Snap: flash, shake and a burst of white sparks where the teeth meet.
    this.flash(targetEl, '#ffffff', 0.6);
    this.shake(targetEl, 5);
    for (let i = 0; i < 8; i++) {
      const star = this.sparkStar(8 + Math.random() * 6, '#FFF6C8');
      place(star, target);
      fxEl.appendChild(star);
      const ang = (Math.PI * 2 * i) / 8;
      this.anim(star, [
        { transform: 'translate(0,0) scale(.3)', opacity: 1 },
        { transform: `translate(${Math.cos(ang) * w * 0.55}px,${Math.sin(ang) * h * 0.6}px) scale(1)`, opacity: 0 }
      ], { duration: 320, easing: 'ease-out' }).then(() => star.remove());
    }
    await this.wait(220);
    const release = (el: HTMLElement, sign: number, flip: string): Promise<void> =>
      this.anim(el, [
        { transform: `translateY(${sign * shut}px) ${flip}`, opacity: 1 },
        { transform: `translateY(${sign * (shut + 10)}px) ${flip}`, opacity: 0 }
      ], { duration: 220, easing: 'ease-out' }).then(() => el.remove());
    await Promise.all([release(upper, -1, ''), release(lower, 1, 'scaleY(-1)')]);
  }

  /** One half of a jaw: a white dome with a row of pointed teeth along its lower edge. */
  private jawGlyph(w: number, h: number, lower: boolean): HTMLElement {
    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg') as unknown as HTMLElement;
    svg.setAttribute('width', `${w}`);
    svg.setAttribute('height', `${h}`);
    svg.setAttribute('viewBox', '0 0 100 46');
    svg.setAttribute('style', `position:absolute;overflow:visible;pointer-events:none;width:${w}px;height:${h}px;filter:drop-shadow(0 0 3px #fff)`);
    const id = `jaw-${lower ? 'lo' : 'up'}-${Math.random().toString(36).slice(2, 8)}`;
    let teeth = '';
    for (let i = 0; i < 8; i++) {
      const x = 4 + i * 11.5;
      teeth += `M${x},30 L${x + 5.75},45 L${x + 11.5},30 `;
    }
    svg.innerHTML =
      `<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#C9CED8"/><stop offset=".55" stop-color="#fff"/><stop offset="1" stop-color="#E9ECF2"/></linearGradient></defs>` +
      `<path d="M2,30 Q2,2 50,2 Q98,2 98,30 Z" fill="url(#${id})" stroke="#7D8594" stroke-width="1.6"/>` +
      `<path d="${teeth}Z" fill="#fff" stroke="#7D8594" stroke-width="1.2" stroke-linejoin="round"/>`;
    return svg;
  }

  /**
   * Blizzard: the scene whites out under a snowy backdrop and a light fog,
   * dense snow and wind gusts blow towards the target, and ice crystals form
   * on it while it shakes.
   */
  private async playBlizzard(refs: BattleStageRefs, launch: Point, target: Point) {
    const { fieldEl, fxEl, targetEl } = refs;
    const W = fieldEl.clientWidth;
    const H = fieldEl.clientHeight;
    const dir = target.x >= launch.x ? 1 : -1;
    const total = 2200;
    const fade: Keyframe[] = [
      { opacity: 0 },
      { opacity: 1, offset: 0.12 },
      { opacity: 1, offset: 0.85 },
      { opacity: 0 }
    ];

    const bg = this.backdrop(fieldEl, 'background:linear-gradient(180deg,#C9CCD6,#E9EBF1 45%,#D4D7E0)');
    const bgDone = this.anim(bg, fade, { duration: total, easing: 'linear' }).then(() => bg.remove());

    // Fog over sprites too, so the whole scene looks snowed in. Snow and gusts live inside it.
    const storm = document.createElement('div');
    storm.style.cssText = 'position:absolute;inset:0;overflow:hidden;pointer-events:none';
    const fog = document.createElement('div');
    fog.style.cssText = 'position:absolute;inset:0;background:radial-gradient(ellipse at 50% 50%,#F4F6FA55,#DADDE699)';
    storm.appendChild(fog);
    fxEl.appendChild(storm);

    // Snowflakes blow across the field at an angle, wobbling as they go.
    for (let i = 0; i < 80; i++) {
      const s = 2 + Math.random() * 6;
      const flake = document.createElement('div');
      flake.style.cssText = `position:absolute;left:0;top:0;width:${s}px;height:${s}px;border-radius:50%;background:#fff;box-shadow:0 0 ${s}px #ffffffcc;opacity:${0.6 + Math.random() * 0.4}`;
      storm.appendChild(flake);
      const y0 = Math.random() * H * 1.2 - H * 0.3;
      const drop = H * (0.25 + Math.random() * 0.3);
      const wob = 6 + Math.random() * 12;
      const xs = dir > 0 ? [-20, W + 20] : [W + 20, -20];
      const frames: Keyframe[] = [];
      for (let k = 0; k <= 6; k++) {
        const t = k / 6;
        frames.push({
          transform: `translate(${xs[0] + (xs[1] - xs[0]) * t}px,${y0 + drop * t + Math.sin(t * Math.PI * 3) * wob}px)`
        });
      }
      flake.animate(frames, {
        duration: 700 + Math.random() * 700,
        delay: -Math.random() * 1400,
        iterations: Infinity,
        easing: 'linear'
      });
    }
    // Long faint wind gusts.
    for (let i = 0; i < 10; i++) {
      const len = W * (0.25 + Math.random() * 0.35);
      const gust = document.createElement('div');
      gust.style.cssText = `position:absolute;left:0;top:${Math.random() * H}px;width:${len}px;height:${2 + Math.random() * 3}px;border-radius:3px;background:linear-gradient(90deg,transparent,#ffffffcc,transparent);transform-origin:left center`;
      storm.appendChild(gust);
      gust.animate(
        [
          { transform: `translateX(${dir > 0 ? -len : W}px) rotate(${dir * 12}deg)` },
          { transform: `translateX(${dir > 0 ? W : -len}px) rotate(${dir * 12}deg)` }
        ],
        { duration: 450 + Math.random() * 350, delay: -Math.random() * 800, iterations: Infinity, easing: 'linear' }
      );
    }
    const stormDone = this.anim(storm, fade, { duration: total, easing: 'linear' }).then(() => storm.remove());

    // Ice crystals build up on the target while it is battered.
    const r = targetEl.getBoundingClientRect();
    const spread = Math.max(r.width * 0.5, 30);
    for (let i = 0; i < 12; i++) {
      const shard = this.iceShard(10 + Math.random() * 10);
      place(shard, {
        x: target.x + (Math.random() * 2 - 1) * spread,
        y: target.y + (Math.random() * 2 - 1) * spread * 0.8
      });
      fxEl.appendChild(shard);
      this.anim(shard, [
        { transform: 'scale(0) rotate(0deg)', opacity: 0 },
        { transform: `scale(1) rotate(${Math.random() * 60 - 30}deg)`, opacity: 1, offset: 0.3 },
        { transform: `scale(1) rotate(${Math.random() * 60 - 30}deg)`, opacity: 0.9, offset: 0.8 },
        { transform: 'scale(.6)', opacity: 0 }
      ], { duration: 900, easing: 'ease-out', delay: 500 + Math.random() * 700 }).then(() => shard.remove());
    }
    for (let i = 0; i < 5; i++) {
      setTimeout(() => {
        this.flash(targetEl, '#9CD6FF', 0.5);
        this.shake(targetEl, 4);
      }, 450 + i * 300);
    }

    await Promise.all([bgDone, stormDone]);
  }

  /** A light blue diamond-shaped ice crystal, `s` px wide (Blizzard, Ice Beam). */
  private iceShard(s: number): HTMLElement {
    const shard = document.createElement('div');
    shard.style.cssText = `position:absolute;width:${s}px;height:${s * 1.4}px;pointer-events:none;clip-path:polygon(50% 0,100% 50%,50% 100%,0 50%);background:linear-gradient(135deg,#fff,#9CD6FF 60%,#5FA8E0)`;
    return shard;
  }

  /**
   * Ice Beam: a light blue beam with a white core shoots from the caster to
   * the target and flickers while frosty sparkles break off along it. Ice
   * crystals burst on the target, which turns icy blue.
   */
  private async playIceBeam(refs: BattleStageRefs, launch: Point, target: Point) {
    const { fxEl, targetEl } = refs;
    const ice = '#9CD6FF';
    const deep = '#5FA8E0';
    const dx = target.x - launch.x;
    const dy = target.y - launch.y;
    const dist = Math.hypot(dx, dy) || 1;
    const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
    // Unit vector across the beam, to scatter sparkles off its sides.
    const nx = -dy / dist;
    const ny = dx / dist;
    const thick = 14;
    const grow = 240;
    const hold = 950;
    const fadeOut = 260;
    const total = grow + hold + fadeOut;

    // Beam: soft light-blue glow around a white core, shooting out from the caster.
    const beam = document.createElement('div');
    beam.style.cssText = `position:absolute;left:${launch.x}px;top:${launch.y - thick / 2}px;width:${dist}px;height:${thick}px;pointer-events:none;transform-origin:0 50%;border-radius:${thick}px;background:linear-gradient(180deg,transparent,${ice}bb 22%,#fff 42%,#fff 58%,${ice}bb 78%,transparent);box-shadow:0 0 10px ${ice},0 0 22px ${deep}aa`;
    fxEl.appendChild(beam);
    const rot = `rotate(${angle}deg)`;
    const frames: Keyframe[] = [{ transform: `${rot} scale(0,1)`, opacity: 1, offset: 0 }];
    const flickers = 10;
    for (let k = 0; k <= flickers; k++) {
      frames.push({
        transform: `${rot} scale(1,${k % 2 ? 0.75 : 1.2})`,
        opacity: 1,
        offset: (grow + (k / flickers) * hold) / total
      });
    }
    frames.push({ transform: `${rot} scale(1,.1)`, opacity: 0, offset: 1 });
    const beamDone = this.anim(beam, frames, { duration: total, easing: 'linear' }).then(() => beam.remove());

    // Glowing flare where the beam hits.
    const flare = document.createElement('div');
    flare.style.cssText = `position:absolute;width:44px;height:44px;border-radius:50%;pointer-events:none;background:radial-gradient(circle,#fff,${ice} 45%,transparent 72%)`;
    place(flare, target);
    fxEl.appendChild(flare);
    this.anim(flare, [
      { transform: 'scale(.3)', opacity: 0 },
      { transform: 'scale(1.2)', opacity: 1, offset: 0.25 },
      { transform: 'scale(.9)', opacity: 0.9, offset: 0.5 },
      { transform: 'scale(1.2)', opacity: 1, offset: 0.75 },
      { transform: 'scale(.6)', opacity: 0 }
    ], { duration: hold + fadeOut, easing: 'ease-in-out', delay: grow }).then(() => flare.remove());

    // Frosty sparkles and little crystals break off along the beam and drift away from it.
    for (let i = 0; i < 28; i++) {
      const t = Math.random();
      const side = Math.random() < 0.5 ? -1 : 1;
      const off = side * (4 + Math.random() * 8);
      const drift = side * (10 + Math.random() * 18);
      const p = i % 3 ? this.sparkStar(6 + Math.random() * 7, i % 2 ? '#fff' : ice) : this.iceShard(5 + Math.random() * 5);
      place(p, { x: launch.x + dx * t + nx * off, y: launch.y + dy * t + ny * off });
      fxEl.appendChild(p);
      this.anim(p, [
        { transform: 'translate(0,0) scale(0) rotate(0deg)', opacity: 0 },
        { transform: `translate(${nx * drift * 0.4}px,${ny * drift * 0.4}px) scale(1.1) rotate(60deg)`, opacity: 1, offset: 0.35 },
        { transform: `translate(${nx * drift}px,${ny * drift}px) scale(.2) rotate(140deg)`, opacity: 0 }
      ], { duration: 480 + Math.random() * 220, easing: 'ease-out', delay: grow * t + Math.random() * hold * 0.8 }).then(() => p.remove());
    }

    // Impact: the target turns icy blue and ice crystals form on it while it shakes.
    await this.wait(grow);
    targetEl.style.filter = `sepia(1) saturate(2.5) hue-rotate(165deg) brightness(1.2) drop-shadow(0 0 6px ${ice})`;
    const r = targetEl.getBoundingClientRect();
    const spread = Math.max(r.width * 0.45, 26);
    for (let i = 0; i < 10; i++) {
      const shard = this.iceShard(9 + Math.random() * 9);
      place(shard, {
        x: target.x + (Math.random() * 2 - 1) * spread,
        y: target.y + (Math.random() * 2 - 1) * spread * 0.8
      });
      fxEl.appendChild(shard);
      this.anim(shard, [
        { transform: 'scale(0) rotate(0deg)', opacity: 0 },
        { transform: `scale(1) rotate(${Math.random() * 60 - 30}deg)`, opacity: 1, offset: 0.3 },
        { transform: `scale(1) rotate(${Math.random() * 60 - 30}deg)`, opacity: 0.9, offset: 0.8 },
        { transform: 'scale(.6)', opacity: 0 }
      ], { duration: 800, easing: 'ease-out', delay: Math.random() * (hold - 300) }).then(() => shard.remove());
    }
    for (let i = 0; i < 4; i++) setTimeout(() => this.shake(targetEl, 4), i * 240);
    await beamDone;
    targetEl.style.filter = '';
    this.flash(targetEl, ice, 0.5);
    await this.wait(220);
  }

  /**
   * Hydro Pump: the scene goes dark, then a deep blue backdrop with rushing
   * light streaks fades in. A water beam made of a glowing core and a stream
   * of swelling water rings blasts the target, then the backdrop fades away.
   */
  private async playHydroPump(refs: BattleStageRefs, launch: Point, target: Point) {
    const { fieldEl, fxEl, targetEl } = refs;
    const W = fieldEl.clientWidth;
    const H = fieldEl.clientHeight;
    const dir = target.x >= launch.x ? 1 : -1;
    const water = '#7CC8FF';

    // backdrop() inserts at the back, so the blue layer is made first and the dim one ends up behind it.
    const sea = this.backdrop(fieldEl, 'background:linear-gradient(180deg,#0A2A5E,#14508F 35%,#1D63A8 50%,#14508F 65%,#0A2A5E);opacity:0');
    for (let i = 0; i < 30; i++) {
      const len = W * (0.15 + Math.random() * 0.35);
      const h = 2 + Math.random() * 5;
      const streak = document.createElement('div');
      streak.style.cssText = `position:absolute;left:0;top:${Math.random() * H}px;width:${len}px;height:${h}px;border-radius:${h}px;background:linear-gradient(90deg,transparent,${Math.random() < 0.5 ? '#5FA8E0' : '#9CD6FF'},transparent);opacity:${0.35 + Math.random() * 0.45}`;
      sea.appendChild(streak);
      streak.animate(
        [
          { transform: `translateX(${dir > 0 ? -len : W}px)` },
          { transform: `translateX(${dir > 0 ? W : -len}px)` }
        ],
        { duration: 700 + Math.random() * 700, delay: -Math.random() * 1400, iterations: Infinity, easing: 'linear' }
      );
    }
    const dim = this.backdrop(fieldEl, DIM_BACKDROP);
    await this.anim(dim, [{ opacity: 0 }, { opacity: 1 }], { duration: 300, easing: 'ease-out' });
    await this.wait(150);
    await this.anim(sea, [{ opacity: 0 }, { opacity: 1 }], { duration: 400, easing: 'ease-in-out' });
    sea.style.opacity = '1';
    dim.remove();

    const dx = target.x - launch.x;
    const dy = target.y - launch.y;
    const dist = Math.hypot(dx, dy) || 1;
    const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
    const nx = -dy / dist;
    const ny = dx / dist;
    const rings = 40;
    const gap = 24;
    const travel = 400;
    const streamTime = rings * gap + travel;

    // Glowing water core under the rings.
    const thick = 16;
    const core = document.createElement('div');
    core.style.cssText = `position:absolute;left:${launch.x}px;top:${launch.y - thick / 2}px;width:${dist}px;height:${thick}px;border-radius:${thick}px;pointer-events:none;transform-origin:0 50%;background:linear-gradient(180deg,transparent,${water}99 30%,#E8F6FFcc 50%,${water}99 70%,transparent);box-shadow:0 0 14px ${water}`;
    fxEl.appendChild(core);
    const rot = `rotate(${angle}deg)`;
    const coreDone = this.anim(core, [
      { transform: `${rot} scale(0,1)`, opacity: 0.9 },
      { transform: `${rot} scale(1,1)`, opacity: 0.9, offset: travel / streamTime },
      { transform: `${rot} scale(1,1.15)`, opacity: 0.9, offset: 0.85 },
      { transform: `${rot} scale(1,.2)`, opacity: 0 }
    ], { duration: streamTime, easing: 'linear' }).then(() => core.remove());

    // Water rings stream out, swelling and swirling slightly as they fly.
    const steps = 6;
    const flights: Promise<void>[] = [];
    for (let i = 0; i < rings; i++) {
      const ring = document.createElement('div');
      ring.style.cssText = `position:absolute;width:14px;height:40px;border-radius:50%;pointer-events:none;border:2.5px solid #E8F6FFdd;background:radial-gradient(ellipse,transparent 45%,${water}55);box-shadow:0 0 8px ${water},inset 0 0 6px ${water}`;
      place(ring, launch);
      fxEl.appendChild(ring);
      const phase = i * 0.8;
      const frames: Keyframe[] = [];
      for (let k = 0; k <= steps; k++) {
        const t = k / steps;
        const wob = Math.sin(phase + t * Math.PI * 2) * 4;
        frames.push({
          transform: `translate(${dx * t + nx * wob}px,${dy * t + ny * wob}px) rotate(${angle}deg) scale(${0.5 + t * 0.9})`,
          opacity: t === 0 ? 0 : t === 1 ? 0.15 : 0.85
        });
      }
      flights.push(
        this.anim(ring, frames, { duration: travel, easing: 'linear', delay: i * gap }).then(() => {
          ring.remove();
          if (i % 5 === 0) {
            this.flash(targetEl, water, 0.45);
            this.shake(targetEl, 4);
            this.waterSplash(fxEl, target);
          }
        })
      );
    }
    await Promise.all([...flights, coreDone]);
    this.flash(targetEl, water, 0.6);
    await this.wait(250);

    await this.anim(sea, [{ opacity: 1 }, { opacity: 0 }], { duration: 450, easing: 'ease-in' });
    sea.remove();
  }

  /** A handful of water droplets splashing outwards from `at`. */
  private waterSplash(fxEl: HTMLElement, at: Point) {
    for (let i = 0; i < 6; i++) {
      const s = 4 + Math.random() * 4;
      const drop = document.createElement('div');
      drop.style.cssText = `position:absolute;width:${s}px;height:${s}px;border-radius:50%;pointer-events:none;background:radial-gradient(circle at 35% 30%,#fff,#9CD6FF);box-shadow:0 0 4px #9CD6FF`;
      place(drop, { x: at.x + (Math.random() * 20 - 10), y: at.y + (Math.random() * 20 - 10) });
      fxEl.appendChild(drop);
      const ang = Math.random() * Math.PI * 2;
      const dist = 18 + Math.random() * 22;
      this.anim(drop, [
        { transform: 'translate(0,0) scale(1)', opacity: 1 },
        { transform: `translate(${Math.cos(ang) * dist}px,${Math.sin(ang) * dist + 10}px) scale(.4)`, opacity: 0 }
      ], { duration: 380, easing: 'ease-out' }).then(() => drop.remove());
    }
  }

  /**
   * Hyper Beam: the backdrop turns bright green with dark green streaks racing
   * along the top and bottom edges. A thick golden beam with a spiky glowing
   * fringe and rolling energy bulges blasts the target, throwing off sparkles.
   */
  private async playHyperBeam(refs: BattleStageRefs, launch: Point, target: Point) {
    const { fieldEl, fxEl, targetEl } = refs;
    const W = fieldEl.clientWidth;
    const H = fieldEl.clientHeight;
    const dir = target.x >= launch.x ? 1 : -1;
    const gold = '#FFC21A';

    // Backdrop: green field, with streaks scrolling in a band along the top and bottom edges.
    const bg = this.backdrop(fieldEl, 'background:linear-gradient(180deg,#3E8E1E,#8CC63A 22%,#C9E35A 50%,#8CC63A 78%,#3E8E1E);opacity:0');
    for (let i = 0; i < 26; i++) {
      const top = i % 2 === 0;
      const len = 30 + Math.random() * 70;
      const h = 4 + Math.random() * 6;
      const y = top ? Math.random() * H * 0.2 : H * 0.8 + Math.random() * H * 0.2 - h;
      const streak = document.createElement('div');
      streak.style.cssText = `position:absolute;left:0;top:${y}px;width:${len}px;height:${h}px;border-radius:${h}px;background:${Math.random() < 0.6 ? '#1F6A12' : '#2E8A1A'};opacity:${0.6 + Math.random() * 0.4}`;
      bg.appendChild(streak);
      streak.animate(
        [
          { transform: `translateX(${dir > 0 ? -len : W}px)` },
          { transform: `translateX(${dir > 0 ? W : -len}px)` }
        ],
        { duration: 500 + Math.random() * 400, delay: -Math.random() * 900, iterations: Infinity, easing: 'linear' }
      );
    }
    // The scene goes dark first; backdrop() inserts at the back, so the dim layer sits behind the green one.
    const dim = this.backdrop(fieldEl, DIM_BACKDROP);
    await this.anim(dim, [{ opacity: 0 }, { opacity: 1 }], { duration: 300, easing: 'ease-out' });
    await this.wait(150);
    await this.anim(bg, [{ opacity: 0 }, { opacity: 1 }], { duration: 400, easing: 'ease-in-out' });
    dim.remove();

    const dx = target.x - launch.x;
    const dy = target.y - launch.y;
    const dist = Math.hypot(dx, dy) || 1;
    const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
    const nx = -dy / dist;
    const ny = dx / dist;
    const thick = 40;
    const len = dist + 30; // reaches a little past the target, as if blasting through it
    const grow = 220;
    const hold = 1000;
    const fadeOut = 280;
    const total = grow + hold + fadeOut;

    // Beam: a spiky cream fringe (tiled SVG spikes) around a golden core of rolling bulges.
    const spikes =
      'url("data:image/svg+xml,' +
      encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="40" viewBox="0 0 12 40" preserveAspectRatio="none">' +
          '<path d="M0,20 L1,7 L3,14 L6,1 L8,13 L11,5 L12,20 L11,35 L8,27 L6,39 L3,26 L1,33 Z" fill="#FFF4C8"/>' +
          '</svg>'
      ) +
      '")';
    const beam = document.createElement('div');
    beam.style.cssText = `position:absolute;left:${launch.x}px;top:${launch.y - thick / 2}px;width:${len}px;height:${thick}px;pointer-events:none;transform-origin:0 50%;filter:drop-shadow(0 0 6px ${gold})`;
    const fringe = document.createElement('div');
    fringe.style.cssText = `position:absolute;inset:0;background:${spikes} 0 0/12px 100% repeat-x`;
    const core = document.createElement('div');
    core.style.cssText = `position:absolute;left:0;right:0;top:22%;height:56%;border-radius:${thick}px;background:radial-gradient(ellipse at center,#FFFBE0 0,#FFE066 30%,${gold} 55%,#E89200 72%,transparent 74%) 0 0/26px 100% repeat-x`;
    beam.append(fringe, core);
    fxEl.appendChild(beam);
    // Spikes and bulges roll along the beam towards the target.
    fringe.animate([{ backgroundPosition: '0 0' }, { backgroundPosition: '36px 0' }], { duration: 160, iterations: Infinity });
    core.animate([{ backgroundPosition: '0 0' }, { backgroundPosition: '52px 0' }], { duration: 160, iterations: Infinity });

    const rot = `rotate(${angle}deg)`;
    const frames: Keyframe[] = [{ transform: `${rot} scale(0,.6)`, opacity: 1, offset: 0 }];
    const flickers = 12;
    for (let k = 0; k <= flickers; k++) {
      frames.push({
        transform: `${rot} scale(1,${k % 2 ? 0.88 : 1.1})`,
        opacity: 1,
        offset: (grow + (k / flickers) * hold) / total
      });
    }
    frames.push({ transform: `${rot} scale(1,.1)`, opacity: 0, offset: 1 });
    const beamDone = this.anim(beam, frames, { duration: total, easing: 'linear' }).then(() => beam.remove());

    // Golden and white sparkles burst off the sides of the beam.
    for (let i = 0; i < 36; i++) {
      const t = Math.random();
      const side = Math.random() < 0.5 ? -1 : 1;
      const off = side * (10 + Math.random() * 8);
      const drift = side * (14 + Math.random() * 26);
      const star = this.sparkStar(7 + Math.random() * 9, i % 3 ? gold : '#FFFFFF');
      place(star, { x: launch.x + dx * t + nx * off, y: launch.y + dy * t + ny * off });
      fxEl.appendChild(star);
      this.anim(star, [
        { transform: 'translate(0,0) scale(0) rotate(0deg)', opacity: 0 },
        { transform: `translate(${nx * drift * 0.4}px,${ny * drift * 0.4}px) scale(1.2) rotate(70deg)`, opacity: 1, offset: 0.3 },
        { transform: `translate(${nx * drift}px,${ny * drift}px) scale(.2) rotate(160deg)`, opacity: 0 }
      ], { duration: 450 + Math.random() * 250, easing: 'ease-out', delay: grow * t + Math.random() * hold * 0.85 }).then(() => star.remove());
    }

    // Impact: the target is pummelled with golden flashes and the field shakes.
    await this.wait(grow);
    this.shakeField(fieldEl, 0.8);
    for (let i = 0; i < 5; i++) {
      setTimeout(() => {
        this.flash(targetEl, gold, 0.6);
        this.shake(targetEl, 5);
      }, i * 210);
    }
    await beamDone;

    // Final burst of sparkles from the target.
    for (let i = 0; i < 10; i++) {
      const star = this.sparkStar(10 + Math.random() * 8, i % 2 ? gold : '#FFFFFF');
      place(star, target);
      fxEl.appendChild(star);
      const ang = (Math.PI * 2 * i) / 10;
      this.anim(star, [
        { transform: 'translate(0,0) scale(.3)', opacity: 1 },
        { transform: `translate(${Math.cos(ang) * 46}px,${Math.sin(ang) * 46}px) scale(1)`, opacity: 0 }
      ], { duration: 380, easing: 'ease-out' }).then(() => star.remove());
    }
    await this.anim(bg, [{ opacity: 1 }, { opacity: 0 }], { duration: 350, easing: 'ease-in' });
    bg.remove();
  }

  /**
   * Bone Club: a spinning bone is thrown high and drops onto the target from
   * above, lands with a hit, then bounces off.
   */
  private async playBoneClub(refs: BattleStageRefs, launch: Point, target: Point, v: MoveVisual) {
    const { fxEl } = refs;
    const bone = this.boneGlyph(46);
    place(bone, launch);
    fxEl.appendChild(bone);

    // Quadratic arc: up past the target, then straight down onto its head.
    const dx = target.x - launch.x;
    const dy = target.y - launch.y;
    const apex = { x: dx * 0.85, y: Math.min(0, dy) - 130 };
    const spin = v.dir * 360 * 3;
    const steps = 14;
    const frames: Keyframe[] = [];
    for (let k = 0; k <= steps; k++) {
      const t = k / steps;
      const u = 1 - t;
      const x = 2 * u * t * apex.x + t * t * dx;
      const y = 2 * u * t * apex.y + t * t * (dy - 10);
      frames.push({ transform: `translate(${x}px,${y}px) rotate(${spin * t}deg)`, opacity: t === 0 ? 0 : 1 });
    }
    // The last quarter-turn settles upright, as it falls onto the target.
    frames[steps] = { transform: `translate(${dx}px,${dy - 10}px) rotate(${spin + 90 * v.dir}deg)`, opacity: 1 };
    await this.anim(bone, frames, { duration: 760, easing: 'ease-in' });

    this.meleeGlyph(fxEl, target, { ...v, meleeStyle: 'hit', color: '#ffffff' });
    const hit = this.impact(refs, target, v, 0);
    // Bounce off and fade.
    this.anim(bone, [
      { transform: `translate(${dx}px,${dy - 10}px) rotate(${spin + 90 * v.dir}deg)`, opacity: 1 },
      { transform: `translate(${dx - v.dir * 30}px,${dy - 50}px) rotate(${spin + 90 * v.dir - 200 * v.dir}deg)`, opacity: 0 }
    ], { duration: 420, easing: 'ease-out' }).then(() => bone.remove());
    await hit;
    await this.wait(300);
  }

  /**
   * Bonemerang: like Bone Club, but the spinning bone flies out on a curve,
   * hits the target and curves back to the caster on the other side, like a
   * boomerang.
   */
  private async playBonemerang(refs: BattleStageRefs, launch: Point, target: Point, v: MoveVisual) {
    const { fxEl, launchEl } = refs;
    const bone = this.boneGlyph(46);
    place(bone, launch);
    fxEl.appendChild(bone);

    const dx = target.x - launch.x;
    const dy = target.y - launch.y;
    const len = Math.hypot(dx, dy) || 1;
    // Perpendicular bulge: out along one side of the line, back along the other.
    const bulge = Math.min(90, len * 0.35);
    const nx = (-dy / len) * bulge;
    const ny = (dx / len) * bulge;
    const out = { x: dx * 0.5 - nx, y: dy * 0.5 - ny };
    const back = { x: dx * 0.5 + nx, y: dy * 0.5 + ny };
    const turnsPerLeg = 3;

    // Quadratic Bezier from a to b through control point c, spinning as it goes.
    const leg = (a: Point, c: Point, b: Point, rot0: number, fadeIn: boolean): Keyframe[] => {
      const frames: Keyframe[] = [];
      const steps = 14;
      for (let k = 0; k <= steps; k++) {
        const t = k / steps;
        const u = 1 - t;
        const x = u * u * a.x + 2 * u * t * c.x + t * t * b.x;
        const y = u * u * a.y + 2 * u * t * c.y + t * t * b.y;
        frames.push({
          transform: `translate(${x}px,${y}px) rotate(${rot0 + v.dir * 360 * turnsPerLeg * t}deg)`,
          opacity: fadeIn && t === 0 ? 0 : 1
        });
      }
      return frames;
    };
    const origin = { x: 0, y: 0 };
    const hitAt = { x: dx, y: dy };
    const midRot = v.dir * 360 * turnsPerLeg;

    await this.anim(bone, leg(origin, out, hitAt, 0, true), { duration: 560, easing: 'ease-in' });
    this.meleeGlyph(fxEl, target, { ...v, meleeStyle: 'hit', color: '#ffffff' });
    const hit = this.impact(refs, target, v, 0);
    await this.anim(bone, leg(hitAt, back, origin, midRot, false), { duration: 620, easing: 'ease-out' });
    await hit;

    // Caught: the bone disappears into the caster with a small flash.
    this.flash(launchEl, '#F6F3EA', 0.35);
    await this.anim(bone, [
      { transform: `rotate(${midRot * 2}deg) scale(1)`, opacity: 1 },
      { transform: `rotate(${midRot * 2 + v.dir * 90}deg) scale(.5)`, opacity: 0 }
    ], { duration: 160, easing: 'ease-out' });
    bone.remove();
  }

  /**
   * Dizzy Punch: the caster lunges, a yellow fist slams onto the target, then
   * little yellow birds fly out of the fist in arcs and circle dizzily in a
   * row above the target's head, with stars twinkling between them.
   */
  private async playDizzyPunch(refs: BattleStageRefs, target: Point, v: MoveVisual) {
    const { launchEl, fxEl, targetEl } = refs;
    const r = targetEl.getBoundingClientRect();

    // Lunge in.
    const original = launchEl.style.transform;
    await this.anim(launchEl, [
      { transform: `${original} translateX(${v.dir * -10}px)` },
      { transform: `${original} translateX(${v.dir * 42}px)` }
    ], { duration: 170, easing: 'ease-in', fill: 'none' });

    // The fist slams in from big to normal size.
    const fist = this.fistGlyph(Math.max(r.width * 0.5, 40));
    place(fist, target);
    fxEl.appendChild(fist);
    this.anim(launchEl, [{ transform: `${original} translateX(${v.dir * 42}px)` }, { transform: original }], {
      duration: 160,
      easing: 'ease-out',
      fill: 'none'
    });
    await this.anim(fist, [
      { transform: 'scale(1.8)', opacity: 0 },
      { transform: 'scale(1)', opacity: 1 }
    ], { duration: 160, easing: 'ease-in' });
    this.flash(targetEl, '#FFE04A', 0.6);
    this.shake(targetEl, 5);
    for (let i = 0; i < 6; i++) {
      const star = this.sparkStar(8 + Math.random() * 5, '#FFF6C8');
      place(star, target);
      fxEl.appendChild(star);
      const ang = (Math.PI * 2 * i) / 6;
      this.anim(star, [
        { transform: 'translate(0,0) scale(.3)', opacity: 1 },
        { transform: `translate(${Math.cos(ang) * 40}px,${Math.sin(ang) * 30}px) scale(1)`, opacity: 0 }
      ], { duration: 300, easing: 'ease-out' }).then(() => star.remove());
    }
    this.anim(fist, [
      { transform: 'scale(1)', opacity: 1, offset: 0 },
      { transform: 'scale(1)', opacity: 1, offset: 0.6 },
      { transform: 'scale(.9)', opacity: 0 }
    ], { duration: 500, easing: 'ease-in' }).then(() => fist.remove());

    // Birds fly out of the fist in arcs and line up above the target's head.
    const spread = Math.max(r.width * 0.75, 50);
    const rowY = -Math.max(r.height * 0.6, 40);
    const slots = [-1, -0.35, 0.35, 1];
    const fly = 620;
    const hover = 900;
    const flights = slots.map((sx, i) => {
      const bird = this.birdGlyph(22);
      place(bird, target);
      fxEl.appendChild(bird);
      const end = { x: sx * spread, y: rowY };
      const ctrl = { x: sx * spread * 1.3, y: rowY - 50 };
      const face = sx < 0 ? -1 : 1;
      const frames: Keyframe[] = [];
      const steps = 12;
      for (let k = 0; k <= steps; k++) {
        const t = k / steps;
        const u = 1 - t;
        const x = 2 * u * t * ctrl.x + t * t * end.x;
        const y = 2 * u * t * ctrl.y + t * t * end.y;
        frames.push({ transform: `translate(${x}px,${y}px) scaleX(${face}) scale(${0.4 + t * 0.6})`, opacity: Math.min(1, t * 4) });
      }
      const at = `translate(${end.x}px,${end.y}px) scaleX(${face})`;
      return this.anim(bird, frames, { duration: fly, easing: 'ease-out', delay: i * 60 })
        .then(() =>
          // Dizzy bobbing, out of step with the neighbours, then fade.
          this.anim(bird, [
            { transform: `${at}`, opacity: 1 },
            { transform: `${at} translateY(${i % 2 ? 5 : -5}px)`, opacity: 1, offset: 0.25 },
            { transform: `${at}`, opacity: 1, offset: 0.5 },
            { transform: `${at} translateY(${i % 2 ? 5 : -5}px)`, opacity: 1, offset: 0.75 },
            { transform: `${at}`, opacity: 0 }
          ], { duration: hover, easing: 'ease-in-out' })
        )
        .then(() => bird.remove());
    });

    // Stars twinkle above and between the birds while they bob.
    for (let i = 0; i < 5; i++) {
      const star = this.sparkStar(9, '#FFE04A');
      place(star, { x: target.x + (i - 2) * spread * 0.45, y: target.y + rowY - 16 - (i % 2) * 6 });
      fxEl.appendChild(star);
      this.anim(star, [
        { transform: 'scale(0) rotate(0deg)', opacity: 0 },
        { transform: 'scale(1) rotate(45deg)', opacity: 1, offset: 0.3 },
        { transform: 'scale(.4) rotate(90deg)', opacity: 0.6, offset: 0.6 },
        { transform: 'scale(1) rotate(135deg)', opacity: 1, offset: 0.8 },
        { transform: 'scale(0) rotate(180deg)', opacity: 0 }
      ], { duration: hover, easing: 'ease-in-out', delay: fly + i * 40 }).then(() => star.remove());
    }
    await Promise.all(flights);
  }

  /**
   * Double-Edge: the caster runs one small circle on the spot while still
   * facing the target, the scene goes dark, then it rams the
   * target: a blazing orange sunburst fills the backdrop, colourful sparkles
   * fly out and the target is squashed flat for a moment. Then recoil.
   */
  private async playDoubleEdge(refs: BattleStageRefs, launch: Point, target: Point, v: MoveVisual) {
    const { launchEl, targetEl, fieldEl, fxEl } = refs;

    // 1. Run one small circle on the spot (backwards first, then round), still facing the target.
    const radius = 14;
    const circle: Keyframe[] = [];
    const steps = 16;
    for (let k = 0; k <= steps; k++) {
      const a = (Math.PI * 2 * k) / steps;
      // Starts and ends at the home spot; flattened, since the circle lies on the ground.
      circle.push({ transform: `translate(${-v.dir * Math.sin(a) * radius}px,${(1 - Math.cos(a)) * radius * -0.5}px)` });
    }
    await this.anim(launchEl, circle, { duration: 600, easing: 'linear', fill: 'none' });

    // 2. The scene goes dark.
    const dim = this.backdrop(fieldEl, DIM_BACKDROP);
    await this.anim(dim, [{ opacity: 0 }, { opacity: 1 }], { duration: 300, easing: 'ease-out' });
    await this.wait(150);

    // 3. Ram the target.
    const dash = v.dir * 60;
    await this.anim(launchEl, [
      { transform: `translateX(${v.dir * -12}px)` },
      { transform: `translateX(${dash}px)` }
    ], { duration: 160, easing: 'ease-in', fill: 'none' });

    // Sunburst backdrop centred on the target: white core, orange rays, darker rim.
    const at = `${target.x}px ${target.y}px`;
    const burst = this.backdrop(
      fieldEl,
      `background:radial-gradient(circle at ${at},#fff 0 6%,#FFF6C8 14%,#FFE08A00 42%),` +
        `radial-gradient(circle at ${at},transparent 50%,#C84A0099 100%),` +
        `repeating-conic-gradient(from 0deg at ${at},#FF8A10 0 7deg,#FFC23A 7deg 14deg)`
    );
    dim.remove();
    const burstShow = this.anim(burst, [
      { opacity: 1, transform: 'scale(1.15)' },
      { opacity: 1, transform: 'scale(1)', offset: 0.7 },
      { opacity: 0, transform: 'scale(1)' }
    ], { duration: 1000, easing: 'ease-out' }).then(() => burst.remove());

    this.anim(launchEl, [{ transform: `translateX(${dash}px)` }, { transform: 'translateX(0)' }], {
      duration: 260,
      easing: 'ease-out',
      fill: 'none'
    });

    // Target squashed flat on impact, then springs back.
    const origin = targetEl.style.transformOrigin;
    targetEl.style.transformOrigin = 'center bottom';
    this.anim(targetEl, [
      { transform: 'scale(1,1)' },
      { transform: 'scale(1.18,.72)', offset: 0.25 },
      { transform: 'scale(.94,1.06)', offset: 0.6 },
      { transform: 'scale(1,1)' }
    ], { duration: 520, easing: 'ease-out', fill: 'none' }).then(() => (targetEl.style.transformOrigin = origin));
    this.flash(targetEl, '#ffffff', 0.8);
    this.shakeField(fieldEl, 0.8);

    // Sparkles: cyan stars and red / orange / white dots fly out from the target.
    const colors = ['#5FF0E0', '#F04060', '#FF9A2A', '#ffffff', '#F25A9A'];
    for (let i = 0; i < 26; i++) {
      const c = colors[i % colors.length];
      const s = 6 + Math.random() * 8;
      let p: HTMLElement;
      if (i % 3 === 0) {
        p = this.sparkStar(s + 4, c);
      } else {
        p = document.createElement('div');
        p.style.cssText = `position:absolute;width:${s}px;height:${s}px;border-radius:50%;pointer-events:none;background:radial-gradient(circle at 35% 35%,#fff,${c} 55%,${c}00 80%)`;
      }
      place(p, target);
      fxEl.appendChild(p);
      const ang = Math.random() * Math.PI * 2;
      const dist = 50 + Math.random() * 80;
      this.anim(p, [
        { transform: 'translate(0,0) scale(.3) rotate(0deg)', opacity: 1 },
        { transform: `translate(${Math.cos(ang) * dist * 0.7}px,${Math.sin(ang) * dist * 0.7}px) scale(1) rotate(90deg)`, opacity: 1, offset: 0.6 },
        { transform: `translate(${Math.cos(ang) * dist}px,${Math.sin(ang) * dist}px) scale(.6) rotate(140deg)`, opacity: 0 }
      ], { duration: 700 + Math.random() * 300, easing: 'ease-out', delay: Math.random() * 120 }).then(() => p.remove());
    }

    await burstShow;
    this.afterImpact(refs, launch, target, v);
  }

  /**
   * Drill Peck: the caster steps forward, then rapid pecks land one after
   * another on different spots of the target, turning round it like a
   * revolver's cylinder. Each peck is a small yellow starburst with a puff of
   * grey dust. The target shakes the whole time; then the caster steps back.
   */
  private async playDrillPeck(refs: BattleStageRefs, target: Point, v: MoveVisual) {
    const { launchEl, targetEl, fxEl } = refs;
    const r = targetEl.getBoundingClientRect();
    const fwd = v.dir * 30;

    // 1. Step forward.
    await this.anim(launchEl, [{ transform: 'translateX(0)' }, { transform: `translateX(${fwd}px)` }], {
      duration: 200,
      easing: 'ease-out'
    });

    // 2. Pecks round the target, each spot 135° on from the last.
    const pecks = 9;
    const gap = 75;
    const rad = Math.max(Math.min(r.width, r.height) * 0.28, 16);
    const start = Math.random() * Math.PI * 2;
    for (let i = 0; i < pecks; i++) {
      const a = start + i * ((Math.PI * 3) / 4);
      const at = { x: target.x + Math.cos(a) * rad, y: target.y + Math.sin(a) * rad * 0.9 };
      this.peckSpark(fxEl, at);
      // The caster jabs in a little with every peck.
      this.anim(launchEl, [
        { transform: `translateX(${fwd}px)` },
        { transform: `translateX(${fwd + v.dir * 8}px)`, offset: 0.4 },
        { transform: `translateX(${fwd}px)` }
      ], { duration: gap, easing: 'ease-out' });
      if (i % 2 === 0) this.shake(targetEl, 4);
      if (i % 3 === 0) this.flash(targetEl, '#FFF2A0', 0.35);
      await this.wait(gap);
    }
    await this.wait(150);

    // 3. Step back.
    await this.anim(launchEl, [{ transform: `translateX(${fwd}px)` }, { transform: 'translateX(0)' }], {
      duration: 220,
      easing: 'ease-in-out',
      fill: 'none'
    });
    launchEl.getAnimations().forEach((a) => a.cancel());
  }

  /**
   * Egg Bomb: a white egg is lobbed in a high arc, tumbling, onto the target,
   * where it blows up in a fiery blast with red sparks flying out.
   */
  private async playEggBomb(refs: BattleStageRefs, launch: Point, target: Point) {
    const { fieldEl, fxEl, targetEl } = refs;
    const r = targetEl.getBoundingClientRect();

    // 1. The egg flies in a high arc and lands on the target.
    const egg = document.createElement('div');
    egg.style.cssText = 'position:absolute;width:20px;height:26px;pointer-events:none;border-radius:50% 50% 50% 50%/60% 60% 40% 40%;background:radial-gradient(circle at 35% 30%,#fff 0 30%,#ECEAE4 60%,#BDB9B0);box-shadow:0 0 3px #00000055';
    place(egg, launch);
    fxEl.appendChild(egg);
    const dx = target.x - launch.x;
    const dy = target.y - launch.y;
    const apexY = Math.min(0, dy) - 120;
    const steps = 14;
    const frames: Keyframe[] = [];
    for (let k = 0; k <= steps; k++) {
      const t = k / steps;
      const u = 1 - t;
      const x = t * dx;
      const y = 2 * u * t * apexY + t * t * dy;
      frames.push({ transform: `translate(${x}px,${y}px) rotate(${t * 300 * Math.sign(dx || 1)}deg) scale(${0.8 + t * 0.2})`, opacity: t === 0 ? 0 : 1 });
    }
    await this.anim(egg, frames, { duration: 700, easing: 'ease-in' });
    egg.remove();

    // 2. Explosion on the target.
    const blast = this.fireBlastCloud(fxEl, { x: target.x, y: target.y + r.height * 0.1 }, Math.max(r.width * 0.55, 44), 12, '#E0201A');
    this.flash(targetEl, '#FFB13C', 0.8);
    this.shake(targetEl, 6);
    this.shakeField(fieldEl, 0.6);
    await blast;
  }

  /** A fiery explosion cloud: hot puffs swell out from a point while sparks scatter. */
  private fireBlastCloud(fxEl: HTMLElement, hit: Point, size: number, count: number, sparkColor: string): Promise<void> {
    const puffs: Promise<void>[] = [];
    for (let i = 0; i < count; i++) {
      const puff = this.firePuff(size * (0.5 + Math.random() * 0.5), i < 4 ? 'hot' : 'red');
      const ang = Math.random() * Math.PI * 2;
      const dist = i < 4 ? 0 : size * (0.25 + Math.random() * 0.3);
      place(puff, hit);
      fxEl.appendChild(puff);
      const end = `translate(${Math.cos(ang) * dist}px,${Math.sin(ang) * dist * 0.8}px)`;
      puffs.push(
        this.anim(puff, [
          { transform: 'translate(0,0) scale(.2)', opacity: 1 },
          { transform: `${end} scale(1.2)`, opacity: 1, offset: 0.45 },
          { transform: `${end} translateY(-8px) scale(1.4)`, opacity: 0 }
        ], { duration: 650 + Math.random() * 200, easing: 'ease-out', delay: Math.random() * 120 }).then(() => puff.remove())
      );
    }
    for (let i = 0; i < 14; i++) {
      const s = 5 + Math.random() * 4;
      const spark = document.createElement('div');
      spark.style.cssText = `position:absolute;width:${s}px;height:${s}px;border-radius:50%;pointer-events:none;background:radial-gradient(circle at 35% 35%,#fff,${sparkColor} 55%,${sparkColor}88)`;
      place(spark, hit);
      fxEl.appendChild(spark);
      const ang = Math.random() * Math.PI * 2;
      const dist = size * (1 + Math.random() * 0.8);
      this.anim(spark, [
        { transform: 'translate(0,0)', opacity: 1 },
        { transform: `translate(${Math.cos(ang) * dist * 0.8}px,${Math.sin(ang) * dist * 0.8}px)`, opacity: 1, offset: 0.7 },
        { transform: `translate(${Math.cos(ang) * dist}px,${Math.sin(ang) * dist}px)`, opacity: 0 }
      ], { duration: 700 + Math.random() * 200, easing: 'ease-out' }).then(() => spark.remove());
    }
    return Promise.all(puffs).then(() => void 0);
  }

  /**
   * Explosion: glowing orange sparks gather into the caster as it lights up,
   * then it blows up - a huge fireball with light rays and a white flash that
   * fill the screen - and the target is hit (blinking).
   */
  private async playExplosion(refs: BattleStageRefs, launch: Point, target: Point, v: MoveVisual) {
    const { fieldEl, fxEl, launchEl, targetEl, screenFxEl } = refs;
    const field = fieldEl.getBoundingClientRect();
    const r = launchEl.getBoundingClientRect();

    // 1. Orange sparks drift in from all around and gather on the caster.
    const gather = 900;
    const glow = this.anim(launchEl, [
      { filter: 'brightness(1)' },
      { filter: 'brightness(1.8) drop-shadow(0 0 12px #FFB060)' }
    ], { duration: gather, easing: 'ease-in', fill: 'forwards' });
    for (let i = 0; i < 14; i++) {
      const s = 8 + Math.random() * 6;
      const orb = document.createElement('div');
      orb.style.cssText = `position:absolute;width:${s}px;height:${s}px;border-radius:50%;pointer-events:none;background:radial-gradient(circle,#FFF0C0,#FF8A2A 45%,#F0501A00 75%);box-shadow:0 0 ${s}px #FF8A2A`;
      const ang = Math.random() * Math.PI * 2;
      const dist = Math.max(r.width * 0.7, 50) * (0.8 + Math.random() * 0.4);
      place(orb, { x: launch.x + Math.cos(ang) * dist, y: launch.y + Math.sin(ang) * dist * 0.8 });
      fxEl.appendChild(orb);
      this.anim(orb, [
        { transform: 'translate(0,0) scale(.4)', opacity: 0 },
        { transform: 'translate(0,0) scale(1)', opacity: 1, offset: 0.3 },
        { transform: `translate(${-Math.cos(ang) * dist}px,${-Math.sin(ang) * dist * 0.8}px) scale(.3)`, opacity: 0.8 }
      ], { duration: 600, easing: 'ease-in', delay: Math.random() * (gather - 600) }).then(() => orb.remove());
    }
    await glow;

    // 2. Boom: white flash, light rays and a giant fireball on the caster.
    const at = `${launch.x}px ${launch.y}px`;
    // Behind the sprites, so the target stays visible in front of the glare.
    const rays = this.backdrop(
      fieldEl,
      `background:radial-gradient(circle at ${at},#fff 0 18%,#FFFDF0cc 35%,#FFF6D000 70%),` +
        `repeating-conic-gradient(from 0deg at ${at},#FFE87Acc 0 8deg,#FFE87A00 8deg 24deg),#FFFBEF`
    );
    const raysShow = this.anim(rays, [
      { opacity: 0 },
      { opacity: 1, offset: 0.1 },
      { opacity: 1, offset: 0.65 },
      { opacity: 0 }
    ], { duration: 1400, easing: 'ease-out' }).then(() => rays.remove());
    this.screenWash(screenFxEl, '#ffffffcc', 80, 200, `${(launch.x / field.width) * 100}%`);
    launchEl.getAnimations().forEach((a) => a.cancel());
    const blast = this.fireBlastCloud(fxEl, launch, Math.max(field.width * 0.32, 110), 18, '#FF8A2A');
    this.shakeField(fieldEl, 1.4);

    // 3. The target is caught in the blast.
    await this.wait(250);
    await Promise.all([this.blink(targetEl), this.impact(refs, target, v, 0)]);
    await Promise.all([blast, raysShow]);
  }

  /** One peck: a small yellow starburst that pops, with grey dust spraying out. */
  private peckSpark(fxEl: HTMLElement, at: Point) {
    const burst = document.createElement('div');
    burst.style.cssText = 'position:absolute;width:22px;height:22px;pointer-events:none;filter:drop-shadow(0 0 3px #FFE36A)';
    const shape = document.createElement('div');
    shape.style.cssText = 'width:100%;height:100%;clip-path:polygon(50% 0,58% 34%,85% 15%,66% 42%,100% 50%,66% 58%,85% 85%,58% 66%,50% 100%,42% 66%,15% 85%,34% 58%,0 50%,34% 42%,15% 15%,42% 34%);background:radial-gradient(circle,#fff,#FFE04A 55%,#F2B21A)';
    burst.appendChild(shape);
    place(burst, at);
    fxEl.appendChild(burst);
    const rot = Math.random() * 90;
    this.anim(burst, [
      { transform: `scale(.3) rotate(${rot}deg)`, opacity: 1 },
      { transform: `scale(1.1) rotate(${rot + 20}deg)`, opacity: 1, offset: 0.4 },
      { transform: `scale(.6) rotate(${rot + 30}deg)`, opacity: 0 }
    ], { duration: 200, easing: 'ease-out' }).then(() => burst.remove());

    for (let i = 0; i < 6; i++) {
      const s = 2 + Math.random() * 3;
      const d = document.createElement('div');
      d.style.cssText = `position:absolute;width:${s}px;height:${s}px;border-radius:50%;pointer-events:none;background:${i % 2 ? '#C8C4B8' : '#F4F0E4'}`;
      place(d, at);
      fxEl.appendChild(d);
      const ang = Math.random() * Math.PI * 2;
      const dist = 10 + Math.random() * 14;
      this.anim(d, [
        { transform: 'translate(0,0)', opacity: 1 },
        { transform: `translate(${Math.cos(ang) * dist}px,${Math.sin(ang) * dist}px)`, opacity: 0 }
      ], { duration: 260 + Math.random() * 120, easing: 'ease-out' }).then(() => d.remove());
    }
  }

  /**
   * Fire Punch: the backdrop turns red-hot, then a red fist slams onto the
   * target and a cloud of little flickering flames bursts up around it.
   */
  private async playFirePunch(refs: BattleStageRefs, target: Point) {
    const { fieldEl, fxEl, targetEl } = refs;
    const r = targetEl.getBoundingClientRect();

    // 1. Red-hot backdrop.
    const heat = this.backdrop(fieldEl, HEAT_BACKDROP);
    await this.anim(heat, [{ opacity: 0 }, { opacity: 1 }], { duration: 300, easing: 'ease-out' });

    // 2. The fist slams in, flames burst around it.
    const fist = this.fistGlyph(Math.max(r.width * 0.45, 36), 'red');
    place(fist, target);
    fxEl.appendChild(fist);
    await this.anim(fist, [
      { transform: 'scale(1.8)', opacity: 0 },
      { transform: 'scale(1)', opacity: 1 }
    ], { duration: 150, easing: 'ease-in' });
    this.flash(targetEl, '#FF8A3C', 0.7);
    this.shake(targetEl, 5);

    const spreadX = Math.max(r.width * 0.55, 34);
    const spreadY = Math.max(r.height * 0.5, 30);
    const flames: Promise<void>[] = [];
    for (let i = 0; i < 18; i++) {
      // Denser near the middle, with a few further out. burnFlame stands on this point.
      const ang = Math.random() * Math.PI * 2;
      const d = Math.sqrt(Math.random());
      const base = { x: target.x + Math.cos(ang) * spreadX * d, y: target.y + 10 + Math.sin(ang) * spreadY * d };
      flames.push(this.burnFlame(fxEl, base, 12 + Math.random() * 10, '#E8401C', 600 + Math.random() * 200, Math.random() * 350));
    }
    this.anim(fist, [
      { transform: 'scale(1)', opacity: 1, offset: 0 },
      { transform: 'scale(1)', opacity: 1, offset: 0.7 },
      { transform: 'scale(.9)', opacity: 0 }
    ], { duration: 700, easing: 'ease-in' }).then(() => fist.remove());
    await Promise.all(flames);

    await this.anim(heat, [{ opacity: 1 }, { opacity: 0 }], { duration: 350, easing: 'ease-in' });
    heat.remove();
  }

  /**
   * Headbutt: the caster darts forward and straight back, then the target is
   * hit: a bright white-yellow starburst flares on it and a ring of yellow
   * stars bursts outward.
   */
  private async playHeadbutt(refs: BattleStageRefs, target: Point, v: MoveVisual) {
    const { launchEl, targetEl, fxEl } = refs;
    const r = targetEl.getBoundingClientRect();

    // 1. Quick dart forward and back.
    await this.dart(launchEl, v.dir);

    // 2. Hit: starburst flare on the target.
    const size = Math.max(r.width * 0.8, 56);
    const flare = document.createElement('div');
    flare.style.cssText = `position:absolute;width:${size}px;height:${size}px;pointer-events:none;filter:drop-shadow(0 0 8px #FFF2A0)`;
    const shape = document.createElement('div');
    shape.style.cssText = 'width:100%;height:100%;clip-path:polygon(50% 0,56% 38%,85% 15%,62% 44%,100% 50%,62% 56%,85% 85%,56% 62%,50% 100%,44% 62%,15% 85%,38% 56%,0 50%,38% 44%,15% 15%,44% 38%);background:radial-gradient(circle,#fff 0 25%,#FFF6C0 45%,#FFE04A00 75%)';
    flare.appendChild(shape);
    place(flare, target);
    fxEl.appendChild(flare);
    const flareDone = this.anim(flare, [
      { transform: 'scale(.3) rotate(0deg)', opacity: 1 },
      { transform: 'scale(1.1) rotate(15deg)', opacity: 1, offset: 0.35 },
      { transform: 'scale(1.3) rotate(25deg)', opacity: 0 }
    ], { duration: 450, easing: 'ease-out' }).then(() => flare.remove());

    // Ring of yellow stars bursting outward.
    const n = 10;
    const rad = Math.max(r.width * 0.6, 40);
    for (let i = 0; i < n; i++) {
      const star = this.sparkStar(12 + Math.random() * 6, '#FFD84A');
      place(star, target);
      fxEl.appendChild(star);
      const ang = (Math.PI * 2 * i) / n + Math.random() * 0.3;
      const x = Math.cos(ang) * rad;
      const y = Math.sin(ang) * rad * 0.85;
      this.anim(star, [
        { transform: 'translate(0,0) scale(.3) rotate(0deg)', opacity: 1 },
        { transform: `translate(${x}px,${y}px) scale(1) rotate(60deg)`, opacity: 1, offset: 0.6 },
        { transform: `translate(${x * 1.15}px,${y * 1.15}px) scale(.5) rotate(90deg)`, opacity: 0 }
      ], { duration: 550, easing: 'ease-out' }).then(() => star.remove());
    }
    this.flash(targetEl, '#FFF2A0', 0.7);
    this.shake(targetEl, 6);
    await flareDone;
    await this.wait(150);
  }

  /** The caster darts quickly toward the target and straight back (Headbutt, High Jump Kick). */
  private dart(el: HTMLElement, dir: 1 | -1): Promise<void> {
    return this.anim(el, [
      { transform: 'translateX(0)' },
      { transform: `translateX(${dir * 46}px)`, offset: 0.45 },
      { transform: 'translateX(0)' }
    ], { duration: 260, easing: 'ease-in-out', fill: 'none' });
  }

  /**
   * High Jump Kick: the caster darts forward and back, then jagged comic-style
   * impact bursts - a big red one, a yellow-orange one over it, then a
   * smaller one - pop on the target while red specks scatter.
   */
  private async playHighJumpKick(refs: BattleStageRefs, target: Point, v: MoveVisual) {
    const { launchEl, targetEl, fieldEl, fxEl } = refs;
    const r = targetEl.getBoundingClientRect();
    const size = Math.max(r.width * 0.9, 64);

    await this.dart(launchEl, v.dir);

    // [x offset, y offset, size factor, outer colour, inner colour, delay]
    const bursts: [number, number, number, string, string, number][] = [
      [-0.15, -0.1, 1, '#E8281C', '#FF6A2A', 0],
      [0.18, 0.08, 0.85, '#FF9A1A', '#FFE84A', 70],
      [-0.05, 0.22, 0.55, '#E8281C', '#FFB02A', 150]
    ];
    const pops = bursts.map(([ox, oy, f, outer, inner, delay]) =>
      this.wait(delay).then(() => {
        const s = size * f;
        const el = this.spikyBurst(s, outer, inner);
        place(el, { x: target.x + ox * size, y: target.y + oy * size });
        fxEl.appendChild(el);
        const rot = Math.random() * 30 - 15;
        return this.anim(el, [
          { transform: `scale(.3) rotate(${rot}deg)`, opacity: 1 },
          { transform: `scale(1.1) rotate(${rot}deg)`, opacity: 1, offset: 0.25 },
          { transform: `scale(1) rotate(${rot}deg)`, opacity: 1, offset: 0.7 },
          { transform: `scale(1.05) rotate(${rot}deg)`, opacity: 0 }
        ], { duration: 480, easing: 'ease-out' }).then(() => el.remove());
      })
    );

    // Red specks scatter out, some landing on the platform.
    for (let i = 0; i < 12; i++) {
      const s = 4 + Math.random() * 4;
      const d = document.createElement('div');
      d.style.cssText = `position:absolute;width:${s}px;height:${s}px;border-radius:50%;pointer-events:none;background:radial-gradient(circle at 35% 35%,#FF8A70,#E0281C 60%,#A01010)`;
      place(d, target);
      fxEl.appendChild(d);
      const ang = Math.random() * Math.PI * 2;
      const dist = size * (0.5 + Math.random() * 0.5);
      this.anim(d, [
        { transform: 'translate(0,0)', opacity: 1 },
        { transform: `translate(${Math.cos(ang) * dist}px,${Math.sin(ang) * dist * 0.6 + 12}px)`, opacity: 1, offset: 0.7 },
        { transform: `translate(${Math.cos(ang) * dist}px,${Math.sin(ang) * dist * 0.6 + 16}px)`, opacity: 0 }
      ], { duration: 600 + Math.random() * 200, easing: 'ease-out' }).then(() => d.remove());
    }
    this.flash(targetEl, '#FF6A2A', 0.7);
    this.shake(targetEl, 7);
    this.shakeField(fieldEl, 0.5);
    await Promise.all(pops);
  }

  /**
   * Ice Punch: a light blue ice fist slams onto the target while see-through
   * ice crystals burst out around it, tumbling and drifting as they fade.
   */
  private async playIcePunch(refs: BattleStageRefs, target: Point) {
    const { fxEl, targetEl } = refs;
    const r = targetEl.getBoundingClientRect();

    const fist = this.fistGlyph(Math.max(r.width * 0.45, 36), 'ice');
    place(fist, target);
    fxEl.appendChild(fist);
    await this.anim(fist, [
      { transform: 'scale(1.8)', opacity: 0 },
      { transform: 'scale(1)', opacity: 1 }
    ], { duration: 150, easing: 'ease-in' });
    this.flash(targetEl, '#9CD6FF', 0.7);
    this.shake(targetEl, 5);

    // Ice crystals: irregular see-through chunks flung out round the target.
    const crystals: Promise<void>[] = [];
    for (let i = 0; i < 16; i++) {
      const s = 12 + Math.random() * 14;
      const chunk = document.createElement('div');
      chunk.style.cssText = `position:absolute;width:${s}px;height:${s * 0.8}px;pointer-events:none;filter:drop-shadow(0 0 2px #ffffff)`;
      const shape = document.createElement('div');
      shape.style.cssText = 'width:100%;height:100%;clip-path:polygon(18% 0,70% 6%,100% 38%,88% 88%,40% 100%,0 70%,4% 24%);background:linear-gradient(135deg,#ffffffee,#DDF3FFb0 45%,#9CD6FF70)';
      chunk.appendChild(shape);
      place(chunk, target);
      fxEl.appendChild(chunk);
      const ang = (Math.PI * 2 * i) / 16 + Math.random() * 0.4;
      const dist = Math.max(r.width * 0.7, 46) * (0.6 + Math.random() * 0.7);
      const x = Math.cos(ang) * dist;
      const y = Math.sin(ang) * dist * 0.75;
      const spin = (Math.random() * 2 - 1) * 200;
      crystals.push(
        this.anim(chunk, [
          { transform: 'translate(0,0) scale(.3) rotate(0deg)', opacity: 0 },
          { transform: `translate(${x * 0.6}px,${y * 0.6}px) scale(1) rotate(${spin * 0.4}deg)`, opacity: 1, offset: 0.3 },
          { transform: `translate(${x}px,${y - 6}px) scale(1) rotate(${spin}deg)`, opacity: 1, offset: 0.75 },
          { transform: `translate(${x * 1.05}px,${y - 10}px) scale(.8) rotate(${spin * 1.1}deg)`, opacity: 0 }
        ], { duration: 800 + Math.random() * 250, easing: 'ease-out', delay: Math.random() * 120 }).then(() => chunk.remove())
      );
    }
    this.anim(fist, [
      { transform: 'scale(1)', opacity: 1, offset: 0 },
      { transform: 'scale(1)', opacity: 1, offset: 0.7 },
      { transform: 'scale(.9)', opacity: 0 }
    ], { duration: 700, easing: 'ease-in' }).then(() => fist.remove());
    await Promise.all(crystals);
  }

  /**
   * Hyper Fang:a pair of big rodent incisors chomps diagonally down into the
   * target, while clusters of little red sparkles twinkle around it.
   */
  private async playHyperFang(refs: BattleStageRefs, target: Point, v: MoveVisual) {
    const { targetEl, fxEl } = refs;
    const r = targetEl.getBoundingClientRect();
    const h = Math.max(r.height * 0.55, 40);
    // Tilted toward the caster's side, like a bite from that direction.
    const tilt = `rotate(${-v.dir * 35}deg)`;

    const teeth = this.incisorGlyph(h);
    place(teeth, target);
    fxEl.appendChild(teeth);
    await this.anim(teeth, [
      { transform: `${tilt} translateY(${-h * 0.8}px)`, opacity: 0 },
      { transform: `${tilt} translateY(0)`, opacity: 1 }
    ], { duration: 160, easing: 'ease-in' });

    this.flash(targetEl, '#FF6A4A', 0.6);
    this.shake(targetEl, 6);
    const done = this.anim(teeth, [
      { transform: `${tilt} translateY(0)`, opacity: 1 },
      { transform: `${tilt} translateY(-6px)`, opacity: 1, offset: 0.2 },
      { transform: `${tilt} translateY(0)`, opacity: 1, offset: 0.4 },
      { transform: `${tilt} translateY(0)`, opacity: 1, offset: 0.75 },
      { transform: `${tilt} translateY(-10px)`, opacity: 0 }
    ], { duration: 650, easing: 'ease-out' }).then(() => teeth.remove());

    // Red sparkle clusters pop up at a few spots around the target.
    const spots = 4;
    const start = Math.random() * Math.PI * 2;
    for (let c = 0; c < spots; c++) {
      const a = start + (Math.PI * 2 * c) / spots;
      const centre = {
        x: target.x + Math.cos(a) * Math.max(r.width * 0.55, 34),
        y: target.y + Math.sin(a) * Math.max(r.height * 0.45, 28)
      };
      for (let i = 0; i < 4; i++) {
        const star = this.sparkStar(6 + Math.random() * 7, i % 2 ? '#FF3A2A' : '#FF8A6A');
        place(star, { x: centre.x + (Math.random() * 2 - 1) * 12, y: centre.y + (Math.random() * 2 - 1) * 12 });
        fxEl.appendChild(star);
        this.anim(star, [
          { transform: 'scale(0) rotate(0deg)', opacity: 0 },
          { transform: 'scale(1.1) rotate(45deg)', opacity: 1, offset: 0.35 },
          { transform: 'scale(.6) rotate(90deg)', opacity: 0.8, offset: 0.65 },
          { transform: 'scale(0) rotate(135deg)', opacity: 0 }
        ], { duration: 500, easing: 'ease-out', delay: c * 70 + Math.random() * 120 }).then(() => star.remove());
      }
    }
    await done;
  }

  /** Two big rodent incisors side by side (cream to orange, chisel-edged at the bottom). */
  private incisorGlyph(h: number): HTMLElement {
    const ns = 'http://www.w3.org/2000/svg';
    const wrap = document.createElement('div');
    wrap.style.cssText = `position:absolute;width:${h * (20 / 30)}px;height:${h}px;pointer-events:none;filter:drop-shadow(0 0 4px #FFB070)`;
    const svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('viewBox', '0 0 20 30');
    svg.setAttribute('style', 'width:100%;height:100%;overflow:visible');
    const tooth = (x: number) => `<path d="M${x + 1},3 Q${x + 1},0 ${x + 4},0 H${x + 6} Q${x + 9},0 ${x + 9},3 V25 L${x + 1},28 Z"/>`;
    const shapes = tooth(0.5) + tooth(10.5);
    svg.innerHTML =
      '<defs><linearGradient id="incisor" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0" stop-color="#E89A50"/><stop offset=".45" stop-color="#FFE2B0"/><stop offset="1" stop-color="#FFF8EA"/>' +
      '</linearGradient></defs>' +
      `<g fill="#7A3E14" stroke="#7A3E14" stroke-width="1.6" stroke-linejoin="round">${shapes}</g>` +
      `<g fill="url(#incisor)">${shapes}</g>`;
    wrap.appendChild(svg);
    return wrap;
  }

  /** A jagged comic-style impact burst: irregular spikes in one colour round a core of another. */
  private spikyBurst(size: number, outer: string, inner: string): HTMLElement {
    const spikes = 12;
    const pts: string[] = [];
    for (let i = 0; i < spikes * 2; i++) {
      const a = (Math.PI * 2 * i) / (spikes * 2);
      const rad = i % 2 ? 22 + Math.random() * 8 : 42 + Math.random() * 8;
      pts.push(`${(50 + Math.cos(a) * rad).toFixed(1)}% ${(50 + Math.sin(a) * rad).toFixed(1)}%`);
    }
    const el = document.createElement('div');
    el.style.cssText = `position:absolute;width:${size}px;height:${size}px;pointer-events:none;filter:drop-shadow(0 0 4px ${inner})`;
    const shape = document.createElement('div');
    shape.style.cssText = `width:100%;height:100%;clip-path:polygon(${pts.join(',')});background:radial-gradient(circle,#FFF6C0 0 12%,${inner} 30%,${outer} 55%)`;
    el.appendChild(shape);
    return el;
  }

  /**
   * Glare: the scene turns dark red and a pair of glowing red snake eyes
   * opens above the field and stares; then the target is paralysed - its
   * sprite goes dark while yellow sparks crackle around it.
   */
  private async playGlare(refs: BattleStageRefs, launch: Point, target: Point) {
    const { fieldEl, fxEl, targetEl } = refs;
    const field = fieldEl.getBoundingClientRect();

    const dark = this.backdrop(fieldEl, 'background:radial-gradient(circle at 45% 40%,#4A1A12,#24080A 60%,#120404)');
    await this.anim(dark, [{ opacity: 0 }, { opacity: 1 }], { duration: 300, easing: 'ease-out' });

    // 1. The eyes open (squeezed flat -> open), glow, narrow once, then fade.
    const eyeW = Math.max(field.width * 0.16, 56);
    const gap = eyeW * 0.25;
    const centre = { x: (launch.x + target.x) / 2, y: Math.min(launch.y, target.y) - 10 };
    const eyes = [-1, 1].map((side) => {
      const eye = this.snakeEyeGlyph(eyeW, side as 1 | -1);
      place(eye, { x: centre.x + side * (eyeW / 2 + gap / 2), y: centre.y });
      fxEl.appendChild(eye);
      return eye;
    });
    await Promise.all(
      eyes.map((eye) =>
        this.anim(eye, [
          { transform: 'scaleY(0)', opacity: 0 },
          { transform: 'scaleY(1.1)', opacity: 1, offset: 0.7 },
          { transform: 'scaleY(1)', opacity: 1 }
        ], { duration: 280, easing: 'ease-out' })
      )
    );
    await Promise.all(
      eyes.map((eye) =>
        this.anim(eye, [
          { transform: 'scaleY(1)', filter: 'brightness(1)' },
          { transform: 'scaleY(.55)', filter: 'brightness(1.6)', offset: 0.45 },
          { transform: 'scaleY(1)', filter: 'brightness(1.3)', offset: 0.7 },
          { transform: 'scaleY(1)', filter: 'brightness(1)' }
        ], { duration: 600, easing: 'ease-in-out' })
      )
    );
    eyes.forEach((eye) =>
      this.anim(eye, [{ opacity: 1 }, { opacity: 0 }], { duration: 250, easing: 'ease-in' }).then(() => eye.remove())
    );

    // 2. Shock: the target goes dark and twitches while sparks crackle round it.
    const r = targetEl.getBoundingClientRect();
    const darken = this.anim(targetEl, [
      { filter: 'brightness(1)' },
      { filter: 'brightness(.35) saturate(.6)', offset: 0.15 },
      { filter: 'brightness(.45) saturate(.6)', offset: 0.85 },
      { filter: 'brightness(1)' }
    ], { duration: 1100, easing: 'ease-in-out', fill: 'none' });
    for (let i = 0; i < 12; i++) {
      setTimeout(() => {
        const bolt = this.boltGlyph('#FFE04A', 8 + Math.random() * 6);
        place(bolt, {
          x: target.x + (Math.random() * 2 - 1) * Math.max(r.width * 0.5, 26),
          y: target.y + (Math.random() * 2 - 1) * Math.max(r.height * 0.45, 24)
        });
        bolt.style.filter = 'drop-shadow(0 0 4px #FFE04A)';
        fxEl.appendChild(bolt);
        const rot = Math.random() * 60 - 30;
        this.anim(bolt, [
          { transform: `rotate(${rot}deg) scale(.4)`, opacity: 0 },
          { transform: `rotate(${rot}deg) scale(1.1)`, opacity: 1, offset: 0.3 },
          { transform: `rotate(${rot}deg) scale(1)`, opacity: 0 }
        ], { duration: 220, easing: 'ease-out' }).then(() => bolt.remove());
        if (i % 3 === 0) this.shake(targetEl, 3);
      }, 60 + i * 70);
    }
    await darken;

    await this.anim(dark, [{ opacity: 1 }, { opacity: 0 }], { duration: 300, easing: 'ease-in' });
    dark.remove();
  }

  /** One glowing red snake eye with a black slit pupil; side -1 is the left eye (mirrored). */
  private snakeEyeGlyph(w: number, side: 1 | -1): HTMLElement {
    const ns = 'http://www.w3.org/2000/svg';
    const wrap = document.createElement('div');
    wrap.style.cssText = `position:absolute;width:${w}px;height:${w * 0.5}px;pointer-events:none;filter:drop-shadow(0 0 6px #FF3A2A)`;
    const svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('viewBox', '0 0 40 20');
    svg.setAttribute('style', `width:100%;height:100%;overflow:visible;transform:scaleX(${side})`);
    // Almond shape, inner corner lower than the outer one, for an angry stare.
    svg.innerHTML =
      '<defs><radialGradient id="snakeEye" cx="55%" cy="50%" r="60%">' +
      '<stop offset="0" stop-color="#FFD0A0"/><stop offset=".35" stop-color="#FF4A2A"/><stop offset="1" stop-color="#A0100C"/>' +
      '</radialGradient></defs>' +
      '<path d="M2,14 Q16,0 38,4 Q28,20 2,14 Z" fill="url(#snakeEye)" stroke="#5A0806" stroke-width="1.4"/>' +
      '<ellipse cx="21" cy="9.5" rx="1.8" ry="6" fill="#140404"/>';
    wrap.appendChild(svg);
    return wrap;
  }

  /** A cartoon fist seen from the front (see FIST_TONES for the colours): fingers curled in, thumb across the side. */
  private fistGlyph(w: number, tone: keyof typeof FIST_TONES = 'yellow'): HTMLElement {
    const c = FIST_TONES[tone];
    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg') as unknown as HTMLElement;
    svg.setAttribute('viewBox', '0 0 24 20');
    svg.setAttribute('style', `position:absolute;overflow:visible;pointer-events:none;width:${w}px;height:${w * (20 / 24)}px;filter:drop-shadow(0 0 4px ${c.glow})`);
    const shapes = '<rect x="5" y="2" width="17" height="16" rx="4"/><rect x="2" y="6" width="8" height="11" rx="3.5"/>';
    svg.innerHTML =
      `<g fill="${c.edge}" stroke="${c.edge}" stroke-width="1.6">${shapes}</g>` +
      `<g fill="${c.fill}">${shapes}</g>` +
      `<path d="M11,6.5 H21 M11,10 H21 M11,13.5 H21" stroke="${c.lines}" stroke-width="1" stroke-linecap="round"/>`;
    return svg;
  }

  /** A small yellow cartoon bird (a little chick) facing right. */
  private birdGlyph(w: number): HTMLElement {
    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg') as unknown as HTMLElement;
    svg.setAttribute('viewBox', '0 0 22 16');
    svg.setAttribute('style', `position:absolute;overflow:visible;pointer-events:none;width:${w}px;height:${w * (16 / 22)}px`);
    const shapes = '<ellipse cx="9" cy="11" rx="8" ry="4.8"/><circle cx="14" cy="5" r="4"/>';
    svg.innerHTML =
      `<g fill="#B88A00" stroke="#B88A00" stroke-width="1.4">${shapes}</g>` +
      `<g fill="#FFE04A">${shapes}</g>` +
      '<polygon points="17.5,4.2 21.5,5.6 17.5,7" fill="#F08A24"/>' +
      '<circle cx="15" cy="4" r=".9" fill="#1a1a1a"/>' +
      '<path d="M4,10 Q8,7 11,10" fill="none" stroke="#C99A10" stroke-width="1"/>';
    return svg;
  }

  /** A simple cartoon bone (shaft with two round knobs at each end), outlined only on its outside. */
  private boneGlyph(w: number): HTMLElement {
    const h = w * 0.3;
    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg') as unknown as HTMLElement;
    svg.setAttribute('viewBox', '0 0 40 12');
    svg.setAttribute('style', `position:absolute;overflow:visible;pointer-events:none;width:${w}px;height:${h}px`);
    const shapes =
      '<rect x="5" y="3.6" width="30" height="4.8" rx="1"/>' +
      '<circle cx="4.5" cy="3.6" r="3.4"/><circle cx="4.5" cy="8.4" r="3.4"/>' +
      '<circle cx="35.5" cy="3.6" r="3.4"/><circle cx="35.5" cy="8.4" r="3.4"/>';
    // Outline layer underneath, fill layer on top: overlaps stay seamless.
    svg.innerHTML =
      `<g fill="#7E7A70" stroke="#7E7A70" stroke-width="1.6">${shapes}</g>` +
      `<g fill="#F6F3EA">${shapes}</g>`;
    return svg;
  }

  /**
   * Bubble / Bubble Beam: see-through water bubbles travel to the target,
   * gather around it, then pop one after another. The style sets how many,
   * how fast and how loosely they fly (a slow drift or a tight beam).
   */
  private async playBubbles(refs: BattleStageRefs, launch: Point, target: Point, style: BubbleStyle) {
    const { fxEl, targetEl } = refs;
    const r = targetEl.getBoundingClientRect();
    const spreadX = Math.max(r.width * 0.45, 28);
    const spreadY = Math.max(r.height * 0.4, 24);
    const { count, travel, stagger, wobble, jitter } = style;

    const bubbles: { el: HTMLElement; end: Point; rest: string }[] = [];
    const arrivals: Promise<void>[] = [];
    for (let i = 0; i < count; i++) {
      const el = this.bubbleGlyph(12 + Math.random() * 14);
      const start = { x: launch.x + (Math.random() * 2 - 1) * jitter, y: launch.y + (Math.random() * 2 - 1) * jitter };
      place(el, start);
      fxEl.appendChild(el);
      // Each bubble ends up at its own spot around the target.
      const end = {
        x: target.x + (Math.random() * 2 - 1) * spreadX,
        y: target.y + (Math.random() * 2 - 1) * spreadY
      };
      const ex = end.x - start.x;
      const ey = end.y - start.y;
      bubbles.push({ el, end, rest: `translate(${ex}px,${ey}px)` });
      const wob = wobble * (0.4 + Math.random() * 0.6);
      const phase = Math.random() * Math.PI * 2;
      const frames: Keyframe[] = [];
      const steps = 10;
      for (let k = 0; k <= steps; k++) {
        const t = k / steps;
        const ease = 1 - (1 - t) * (1 - t); // slows down as it arrives
        frames.push({
          transform: `translate(${ex * ease}px,${ey * ease + Math.sin(phase + t * Math.PI * 3) * wob * (1 - t)}px) scale(${0.4 + t * 0.6})`,
          opacity: Math.min(1, t * 5)
        });
      }
      arrivals.push(this.anim(el, frames, { duration: travel, easing: 'linear', delay: i * stagger }));
    }
    await Promise.all(arrivals);
    await this.wait(250);

    // Pop: each bubble swells and vanishes, leaving a few droplets.
    const pops = bubbles.map(({ el, end, rest }, i) =>
      this.wait(i * 35 + Math.random() * 60).then(() => {
        const at = { x: end.x, y: end.y };
        this.anim(el, [
          { transform: `${rest} scale(1)`, opacity: 1 },
          { transform: `${rest} scale(1.6)`, opacity: 0 }
        ], { duration: 160, easing: 'ease-out' }).then(() => el.remove());
        for (let d = 0; d < 4; d++) {
          const drop = document.createElement('div');
          drop.style.cssText = 'position:absolute;width:3px;height:3px;border-radius:50%;pointer-events:none;background:#D8F0FF';
          place(drop, at);
          fxEl.appendChild(drop);
          const ang = (Math.PI * 2 * d) / 4 + Math.random();
          this.anim(drop, [
            { transform: 'translate(0,0)', opacity: 1 },
            { transform: `translate(${Math.cos(ang) * 10}px,${Math.sin(ang) * 10}px)`, opacity: 0 }
          ], { duration: 260, easing: 'ease-out' }).then(() => drop.remove());
        }
        if (i % 4 === 0) {
          this.flash(targetEl, '#8FD0FF', 0.35);
          this.shake(targetEl, 2);
        }
      })
    );
    await Promise.all(pops);
    await this.wait(260);
  }

  /** A see-through water bubble with a highlight (Bubble, Bubble Beam, Crabhammer). */
  private bubbleGlyph(size: number): HTMLElement {
    const el = document.createElement('div');
    el.style.cssText = `position:absolute;width:${size}px;height:${size}px;border-radius:50%;pointer-events:none;border:1.5px solid #ffffffdd;background:radial-gradient(circle at 30% 28%,#ffffffee 0 14%,transparent 18%),radial-gradient(circle at 50% 50%,#BFE6FF22 55%,#8FD0FF66);box-shadow:inset 0 0 5px #A8DCFF99,0 0 3px #ffffff88`;
    return el;
  }

  /**
   * Crabhammer: a large water drop plunges fast from above onto the target and
   * bursts into a splash crown, then bubbles form around the target and pop.
   */
  private async playCrabhammer(refs: BattleStageRefs, target: Point) {
    const { fieldEl, fxEl, targetEl } = refs;
    const r = targetEl.getBoundingClientRect();
    const hit: Point = { x: target.x, y: target.y - r.height * 0.15 };
    const fall = hit.y + 60; // starts just above the top edge of the field

    // The drop: a teardrop with its tip pointing up (a rotated square tear), stretched while it falls.
    const size = 38;
    const drop = document.createElement('div');
    drop.style.cssText = `position:absolute;width:${size}px;height:${size}px;pointer-events:none;filter:drop-shadow(0 0 6px #7CC8FF)`;
    const tear = document.createElement('div');
    tear.style.cssText = `width:100%;height:100%;border-radius:50% 0 50% 50%;transform:rotate(-45deg);background:radial-gradient(circle at 40% 60%,#fff,#9CD6FF 35%,#3F8FD8 80%,#2A6CB5)`;
    drop.appendChild(tear);
    place(drop, hit);
    fxEl.appendChild(drop);

    // Light streaks trailing above the drop.
    for (let i = 0; i < 3; i++) {
      const streak = document.createElement('div');
      const w = 3 + (i === 1 ? 3 : 0);
      streak.style.cssText = `position:absolute;left:${hit.x - w / 2 + (i - 1) * 9}px;top:${hit.y - 90}px;width:${w}px;height:90px;border-radius:${w}px;pointer-events:none;background:linear-gradient(180deg,transparent,#E8F6FFcc);transform-origin:50% 100%`;
      fxEl.appendChild(streak);
      this.anim(streak, [
        { transform: `translateY(${-fall}px) scaleY(.4)`, opacity: 0 },
        { transform: 'translateY(0) scaleY(1)', opacity: 0.9, offset: 0.6 },
        { transform: 'translateY(0) scaleY(.2)', opacity: 0 }
      ], { duration: 460, easing: 'ease-in' }).then(() => streak.remove());
    }
    await this.anim(drop, [
      { transform: `translateY(${-fall}px) scale(.8,1.25)`, opacity: 0.6 },
      { transform: 'translateY(0) scale(.85,1.3)', opacity: 1 }
    ], { duration: 260, easing: 'ease-in' });

    // Splash: the drop flattens and bursts, a ring spreads out, droplets fly up and fall.
    this.anim(drop, [
      { transform: 'scale(1.1,.9)', opacity: 1 },
      { transform: 'scale(1.9,.35)', opacity: 0 }
    ], { duration: 160, easing: 'ease-out' }).then(() => drop.remove());
    const ring = document.createElement('div');
    ring.style.cssText = 'position:absolute;width:40px;height:14px;border-radius:50%;pointer-events:none;border:3px solid #E8F6FF;box-shadow:0 0 8px #7CC8FF,inset 0 0 6px #7CC8FF';
    place(ring, hit);
    fxEl.appendChild(ring);
    this.anim(ring, [
      { transform: 'scale(.4)', opacity: 1 },
      { transform: 'scale(2.6)', opacity: 0 }
    ], { duration: 420, easing: 'ease-out' }).then(() => ring.remove());
    for (let i = 0; i < 16; i++) {
      const s = 5 + Math.random() * 6;
      const d = document.createElement('div');
      d.style.cssText = `position:absolute;width:${s}px;height:${s * 1.2}px;border-radius:50%;pointer-events:none;background:radial-gradient(circle at 35% 30%,#fff,#9CD6FF 60%,#3F8FD8);box-shadow:0 0 4px #9CD6FF`;
      place(d, hit);
      fxEl.appendChild(d);
      // Thrown up and out in a crown, then pulled down again.
      const vx = (Math.random() * 2 - 1) * 60;
      const vy = 50 + Math.random() * 45;
      const frames: Keyframe[] = [];
      const steps = 8;
      for (let k = 0; k <= steps; k++) {
        const t = k / steps;
        frames.push({
          transform: `translate(${vx * t}px,${-vy * t + 110 * t * t}px) scale(${1 - t * 0.5})`,
          opacity: t < 0.7 ? 1 : (1 - t) / 0.3
        });
      }
      this.anim(d, frames, { duration: 520 + Math.random() * 180, easing: 'linear' }).then(() => d.remove());
    }
    this.flash(targetEl, '#8FD0FF', 0.7);
    this.shake(targetEl, 6);
    this.shakeField(fieldEl, 0.5);
    await this.wait(260);

    // Bubbles form around the target, float up a little and pop.
    const spreadX = Math.max(r.width * 0.55, 30);
    const spreadY = Math.max(r.height * 0.45, 26);
    const pops: Promise<void>[] = [];
    for (let i = 0; i < 12; i++) {
      const b = this.bubbleGlyph(8 + Math.random() * 12);
      place(b, {
        x: target.x + (Math.random() * 2 - 1) * spreadX,
        y: target.y + (Math.random() * 2 - 1) * spreadY
      });
      fxEl.appendChild(b);
      const rise = 14 + Math.random() * 18;
      pops.push(
        this.anim(b, [
          { transform: 'translateY(0) scale(0)', opacity: 0 },
          { transform: `translateY(${-rise * 0.3}px) scale(1)`, opacity: 1, offset: 0.25 },
          { transform: `translateY(${-rise}px) scale(1)`, opacity: 1, offset: 0.85 },
          { transform: `translateY(${-rise}px) scale(1.5)`, opacity: 0 }
        ], { duration: 750 + Math.random() * 250, easing: 'ease-out', delay: Math.random() * 300 }).then(() => b.remove())
      );
    }
    await Promise.all(pops);
  }

  /**
   * Earthquake: the whole field shakes fast left and right (and a little up
   * and down) while small rocks keep jumping up on both sides of the target.
   */
  private async playEarthquake(refs: BattleStageRefs) {
    const { fieldEl, fxEl, targetEl } = refs;
    const total = 1500;

    // Field shake: quick alternating offsets, strongest in the middle.
    const beats = 30;
    const shake: Keyframe[] = [];
    for (let k = 0; k <= beats; k++) {
      const t = k / beats;
      const amp = k === 0 || k === beats ? 0 : 3 + Math.sin(t * Math.PI) * 5;
      shake.push({ transform: `translate(${k % 2 ? -amp : amp}px,${k % 3 === 0 ? amp * 0.3 : -amp * 0.25}px)` });
    }
    const quake = this.anim(fieldEl, shake, { duration: total, easing: 'linear', fill: 'none' });

    // Rocks pop out of the ground left and right of the target.
    const r = targetEl.getBoundingClientRect();
    const foot = this.footOf(targetEl, fieldEl);
    const side = Math.max(r.width * 0.5, 30);
    const rocks = 16;
    for (let i = 0; i < rocks; i++) {
      const dirX = i % 2 ? 1 : -1;
      const s = 6 + Math.random() * 7;
      const rock = document.createElement('div');
      rock.style.cssText = `position:absolute;width:${s}px;height:${s * 0.85}px;pointer-events:none;clip-path:polygon(20% 0,75% 8%,100% 45%,85% 100%,15% 95%,0 40%);background:linear-gradient(135deg,#B08A5A,#6E5232 70%,#4A3622)`;
      place(rock, { x: foot.x + dirX * (side + Math.random() * side * 0.6), y: foot.y - Math.random() * 8 });
      fxEl.appendChild(rock);
      const up = 18 + Math.random() * 26;
      const drift = dirX * (4 + Math.random() * 10);
      const spin = (Math.random() * 2 - 1) * 240;
      this.anim(rock, [
        { transform: 'translate(0,0) rotate(0deg)', opacity: 0 },
        { transform: `translate(${drift * 0.5}px,${-up}px) rotate(${spin * 0.5}deg)`, opacity: 1, offset: 0.45 },
        { transform: `translate(${drift}px,0) rotate(${spin}deg)`, opacity: 1, offset: 0.85 },
        { transform: `translate(${drift}px,0) rotate(${spin}deg)`, opacity: 0 }
      ], { duration: 520, easing: 'ease-in-out', delay: 80 + (i / rocks) * (total - 600) }).then(() => rock.remove());
    }

    for (let i = 0; i < 4; i++) {
      setTimeout(() => this.flash(targetEl, '#C9A24B', 0.4), 200 + i * 320);
    }
    await quake;
  }

  /**
   * Dig, turn 1: the user wriggles down into the ground. The part below the
   * ground line is clipped away, so it sinks through the platform, while dust
   * clouds billow around it and clods of dirt are thrown up.
   */
  private async playDigDown(refs: BattleStageRefs) {
    const { launchEl: el, fieldEl, fxEl } = refs;
    el.getAnimations?.().forEach((a) => a.cancel());
    const r = el.getBoundingClientRect();
    const foot = this.footOf(el, fieldEl);
    const dur = 1000;

    this.kickUpDirt(fxEl, foot, Math.max(r.width * 0.6, 34), dur, '#B89A5E');

    const steps = 12;
    const frames: Keyframe[] = [];
    for (let k = 0; k <= steps; k++) {
      const t = k / steps;
      const depth = r.height * t;
      const wiggle = k === 0 || k === steps ? 0 : (k % 2 ? 1 : -1) * 4;
      frames.push({ transform: `translate(${wiggle}px,${depth}px)`, clipPath: `inset(0 0 ${depth}px 0)` });
    }
    await this.anim(el, frames, { duration: dur, easing: 'ease-in', fill: 'forwards' });
    el.style.opacity = '0';
  }

  /**
   * Dig, turn 2: the user bursts back up out of the ground in a cloud of dust
   * and dirt, then the target is hit and white dust specks rise around it.
   */
  private async playDigUp(refs: BattleStageRefs, target: Point) {
    const { launchEl: el, fieldEl, fxEl, targetEl } = refs;
    el.getAnimations?.().forEach((a) => a.cancel());
    el.style.opacity = '1';
    const r = el.getBoundingClientRect();
    const foot = this.footOf(el, fieldEl);

    this.kickUpDirt(fxEl, foot, Math.max(r.width * 0.6, 34), 700, '#D8CBB0');
    await this.anim(el, [
      { transform: `translateY(${r.height}px)`, clipPath: `inset(0 0 ${r.height}px 0)` },
      { transform: 'translateY(-16px)', clipPath: 'inset(0 0 -40px 0)', offset: 0.6 },
      { transform: 'translateY(0)', clipPath: 'inset(0 0 -40px 0)' }
    ], { duration: 520, easing: 'ease-out', fill: 'none' });

    // Hit: the target shakes and white dust specks rise up around it.
    const tr = targetEl.getBoundingClientRect();
    this.flash(targetEl, '#F6F3EA', 0.6);
    this.shake(targetEl, 6);
    this.shakeField(fieldEl, 0.4);
    const specks: Promise<void>[] = [];
    for (let i = 0; i < 16; i++) {
      const s = 4 + Math.random() * 6;
      const d = document.createElement('div');
      d.style.cssText = `position:absolute;width:${s}px;height:${s}px;border-radius:50%;pointer-events:none;background:radial-gradient(circle at 35% 35%,#fff,#E8E4DA 60%,#C9C2B0);box-shadow:0 0 3px #ffffffaa`;
      place(d, {
        x: target.x + (Math.random() * 2 - 1) * Math.max(tr.width * 0.35, 20),
        y: target.y + Math.random() * tr.height * 0.2
      });
      fxEl.appendChild(d);
      const rise = 30 + Math.random() * 40;
      specks.push(
        this.anim(d, [
          { transform: 'translate(0,0) scale(.3)', opacity: 0 },
          { transform: `translate(0,${-rise * 0.3}px) scale(1)`, opacity: 1, offset: 0.25 },
          { transform: `translate(${(Math.random() * 2 - 1) * 8}px,${-rise}px) scale(.8)`, opacity: 0 }
        ], { duration: 650 + Math.random() * 250, easing: 'ease-out', delay: Math.random() * 200 }).then(() => d.remove())
      );
    }
    await Promise.all(specks);
  }

  /**
   * Fly, turn 1: the sky backdrop rushes downward (streaks moving up), a blue
   * bubble forms around the user, which fades into it, and the bubble shoots
   * up out of the top of the screen.
   */
  private async playFlyUp(refs: BattleStageRefs, launch: Point) {
    const { launchEl: el, fieldEl, fxEl } = refs;
    el.getAnimations?.().forEach((a) => a.cancel());
    const r = el.getBoundingClientRect();
    const sky = this.skyBackdrop(fieldEl, 'up');
    await this.anim(sky, [{ opacity: 0 }, { opacity: 1 }], { duration: 250, easing: 'ease-out' });

    const size = Math.max(Math.max(r.width, r.height) * 1.05, 60);
    const bubble = document.createElement('div');
    bubble.style.cssText = `position:absolute;width:${size}px;height:${size}px;border-radius:50%;pointer-events:none;background:radial-gradient(circle at 35% 28%,#ffffffdd 0 7%,#C8F6FF 20%,#5CD6F4 62%,#2A9CD8);box-shadow:0 0 12px #A8ECFF;opacity:.92`;
    place(bubble, launch);
    fxEl.appendChild(bubble);
    this.anim(el, [
      { transform: 'scale(1)', opacity: 1 },
      { transform: 'scale(.6)', opacity: 0 }
    ], { duration: 300, easing: 'ease-in', fill: 'forwards' });
    await this.anim(bubble, [
      { transform: 'scale(0)', opacity: 0 },
      { transform: 'scale(1.1)', opacity: 0.92, offset: 0.7 },
      { transform: 'scale(1)', opacity: 0.92 }
    ], { duration: 320, easing: 'ease-out' });
    await this.wait(150);
    await this.anim(bubble, [
      { transform: 'translateY(0) scale(1,1)' },
      { transform: `translateY(${-(launch.y + size)}px) scale(.85,1.2)` }
    ], { duration: 550, easing: 'ease-in' });
    bubble.remove();
    el.style.opacity = '0';

    await this.wait(200);
    await this.anim(sky, [{ opacity: 1 }, { opacity: 0 }], { duration: 300, easing: 'ease-in' });
    sky.remove();
  }

  /**
   * Fly, turn 2: the sky backdrop returns (streaks now moving down), a white
   * glowing orb dives from above onto the target with a burst of yellow
   * sparks, then the user drops back into its place.
   */
  private async playFlyDown(refs: BattleStageRefs, target: Point) {
    const { launchEl, fieldEl, fxEl, targetEl } = refs;
    // Away in the sky until the end (also when Power Herb skipped turn 1).
    launchEl.getAnimations?.().forEach((a) => a.cancel());
    launchEl.style.opacity = '0';
    const r = targetEl.getBoundingClientRect();
    const sky = this.skyBackdrop(fieldEl, 'down');
    await this.anim(sky, [{ opacity: 0 }, { opacity: 1 }], { duration: 250, easing: 'ease-out' });
    await this.wait(150);

    const size = Math.max(r.width * 0.75, 50);
    const orb = document.createElement('div');
    orb.style.cssText = `position:absolute;width:${size}px;height:${size}px;border-radius:50%;pointer-events:none;background:radial-gradient(circle,#fff 0 42%,#F2F8FFee 55%,#DCEBFF00 72%);box-shadow:0 0 ${size * 0.4}px #ffffffcc`;
    place(orb, target);
    fxEl.appendChild(orb);
    await this.anim(orb, [
      { transform: `translate(${-size * 0.8}px,${-(target.y + size)}px) scale(.8,1.3)`, opacity: 0.8 },
      { transform: 'translate(0,0) scale(.9,1.15)', opacity: 1 }
    ], { duration: 320, easing: 'ease-in' });

    // Hit: the orb flattens and fades, yellow sparks burst, the target blinks.
    this.anim(orb, [
      { transform: 'scale(1)', opacity: 1 },
      { transform: 'scale(1.5,.8)', opacity: 0 }
    ], { duration: 380, easing: 'ease-out' }).then(() => orb.remove());
    for (let i = 0; i < 10; i++) {
      const star = this.sparkStar(10 + Math.random() * 8, '#FFE04A');
      place(star, target);
      fxEl.appendChild(star);
      const ang = Math.random() * Math.PI * 2;
      const dist = size * (0.4 + Math.random() * 0.5);
      this.anim(star, [
        { transform: 'translate(0,0) scale(.3)', opacity: 1 },
        { transform: `translate(${Math.cos(ang) * dist}px,${Math.sin(ang) * dist}px) scale(1)`, opacity: 1, offset: 0.6 },
        { transform: `translate(${Math.cos(ang) * dist * 1.2}px,${Math.sin(ang) * dist * 1.2}px) scale(.4)`, opacity: 0 }
      ], { duration: 500 + Math.random() * 150, easing: 'ease-out' }).then(() => star.remove());
    }
    this.flash(targetEl, '#ffffff', 0.7);
    this.shake(targetEl, 6);
    this.shakeField(fieldEl, 0.5);
    await this.blink(targetEl);
    await this.wait(250);

    await this.anim(sky, [{ opacity: 1 }, { opacity: 0 }], { duration: 300, easing: 'ease-in' });
    sky.remove();
    await this.dropBackIn(launchEl);
  }

  /**
   * A bright blue sky backdrop (light column in the middle, deeper blue at the
   * sides) with white wind streaks endlessly rushing up or down. Remove it when done.
   */
  private skyBackdrop(fieldEl: HTMLElement, dir: 'up' | 'down'): HTMLElement {
    const sky = this.backdrop(
      fieldEl,
      'background:linear-gradient(90deg,#1A56C8,#3E8CEA 22%,#A8D4FF 42%,#E4F2FF 50%,#A8D4FF 58%,#3E8CEA 78%,#1A56C8)'
    );
    const { width, height } = fieldEl.getBoundingClientRect();
    for (let i = 0; i < 26; i++) {
      const w = 5 + Math.random() * 9;
      const h = 30 + Math.random() * 50;
      const streak = document.createElement('div');
      streak.style.cssText = `position:absolute;left:${Math.random() * width}px;top:0;width:${w}px;height:${h}px;border-radius:50%;background:radial-gradient(ellipse,#ffffff,#ffffffaa 50%,#ffffff00 75%);opacity:${0.55 + Math.random() * 0.4}`;
      sky.appendChild(streak);
      const from = height + h;
      const to = -h;
      const dur = 450 + Math.random() * 450;
      streak.animate(
        [{ transform: `translateY(${dir === 'up' ? from : to}px)` }, { transform: `translateY(${dir === 'up' ? to : from}px)` }],
        // Negative delay: the streaks are already spread over the screen when it appears.
        { duration: dur, iterations: Infinity, delay: -Math.random() * dur, easing: 'linear' }
      );
    }
    return sky;
  }

  /** Dust clouds swelling around a spot on the ground, plus clods of dirt thrown up and falling back. */
  private kickUpDirt(fxEl: HTMLElement, foot: Point, spread: number, dur: number, dust: string) {
    for (let i = 0; i < 9; i++) {
      const s = 22 + Math.random() * 18;
      const puff = document.createElement('div');
      puff.style.cssText = `position:absolute;width:${s}px;height:${s * 0.8}px;border-radius:50%;pointer-events:none;background:radial-gradient(circle at 45% 40%,${dust},${dust}cc 45%,${dust}00 72%)`;
      const side = i % 2 ? 1 : -1;
      place(puff, { x: foot.x + side * Math.random() * spread, y: foot.y - Math.random() * 10 });
      fxEl.appendChild(puff);
      this.anim(puff, [
        { transform: 'translate(0,0) scale(.4)', opacity: 0 },
        { transform: `translate(${side * 6}px,-6px) scale(1)`, opacity: 0.95, offset: 0.3 },
        { transform: `translate(${side * 16}px,-18px) scale(1.5)`, opacity: 0 }
      ], { duration: dur * 0.7, easing: 'ease-out', delay: Math.random() * dur * 0.4 }).then(() => puff.remove());
    }
    for (let i = 0; i < 12; i++) {
      const s = 8 + Math.random() * 8;
      const clod = document.createElement('div');
      clod.style.cssText = `position:absolute;width:${s}px;height:${s * 0.9}px;border-radius:45% 55% 50% 40%;pointer-events:none;background:radial-gradient(circle at 30% 70%,#3E3A16 0 18%,transparent 22%),radial-gradient(circle at 65% 35%,#9A9A4A,#6E6A2A 55%,#4A4618)`;
      place(clod, { x: foot.x + (Math.random() * 2 - 1) * spread * 0.6, y: foot.y - 6 });
      fxEl.appendChild(clod);
      const vx = (Math.random() * 2 - 1) * 50;
      const up = 70 + Math.random() * 70;
      const spin = (Math.random() * 2 - 1) * 300;
      const frames: Keyframe[] = [];
      const steps = 8;
      for (let k = 0; k <= steps; k++) {
        const t = k / steps;
        // Thrown up, then pulled back down a little below where it started.
        frames.push({
          transform: `translate(${vx * t}px,${-up * 4 * t * (1 - t) + 20 * t}px) rotate(${spin * t}deg)`,
          opacity: t < 0.8 ? 1 : (1 - t) / 0.2
        });
      }
      this.anim(clod, frames, { duration: 700 + Math.random() * 200, easing: 'linear', delay: Math.random() * dur * 0.5 }).then(() => clod.remove());
    }
  }

  /**
   * Psychic: the backdrop goes dark, then a moving psychedelic wave pattern
   * fades in while the target warps and glows.
   */
  private async playPsychic(refs: BattleStageRefs) {
    const { fieldEl, targetEl } = refs;

    const dim = this.backdrop(fieldEl, DIM_BACKDROP);
    await this.anim(dim, [{ opacity: 0 }, { opacity: 1 }], { duration: 300, easing: 'ease-out' });

    // Wave layer goes on top of the dim layer, still behind platforms and sprites.
    const waves = document.createElement('div');
    waves.style.cssText = `position:absolute;inset:-48px;background-image:${PSYCHIC_WAVES};background-size:60px 24px`;
    dim.appendChild(waves);
    waves.animate([{ backgroundPosition: '0 0' }, { backgroundPosition: '60px 24px' }], {
      duration: 700,
      iterations: Infinity,
      easing: 'linear'
    });
    // A slow sway makes the whole pattern ripple, not just scroll.
    waves.animate(
      [{ transform: 'skewY(0deg) scaleY(1)' }, { transform: 'skewY(4deg) scaleY(1.08)' }, { transform: 'skewY(0deg) scaleY(1)' }],
      { duration: 900, iterations: Infinity, easing: 'ease-in-out' }
    );
    await this.anim(waves, [{ opacity: 0 }, { opacity: 1 }], { duration: 300, easing: 'ease-out' });

    // The target is warped back and forth and glows.
    const original = targetEl.style.transform;
    const warp: Keyframe[] = [];
    const n = 10;
    for (let k = 0; k <= n; k++) {
      const a = k === 0 || k === n ? 0 : (k % 2 ? 1 : -1);
      warp.push({ transform: `${original} skewX(${a * 10}deg) scale(${1 + a * 0.06},${1 - a * 0.05})` });
    }
    for (let i = 0; i < 4; i++) setTimeout(() => this.flash(targetEl, i % 2 ? '#F28BF0' : '#FFE37A', 0.55), i * 260);
    await this.anim(targetEl, warp, { duration: 1100, easing: 'ease-in-out', fill: 'none' });
    targetEl.style.transform = original;

    await this.anim(dim, [{ opacity: 1 }, { opacity: 0 }], { duration: 380, easing: 'ease-in' });
    dim.remove();
  }

  /**
   * Dark Pulse: the backdrop turns grey, dark purple rings ripple out over
   * the ground from the caster's feet while dark sparks fly out around it;
   * the target is hit as the waves reach it.
   */
  private async playDarkPulse(refs: BattleStageRefs, launch: Point, target: Point) {
    const { fieldEl, fxEl, launchEl, targetEl } = refs;
    const purple = '#4B1A63';
    const grey = this.backdrop(fieldEl, 'background:linear-gradient(180deg,#7C7A80,#A5A3A8 45%,#8A888E)');
    await this.anim(grey, [{ opacity: 0 }, { opacity: 1 }], { duration: 280, easing: 'ease-out' });

    // Ground layer: above the platforms, below HUD and sprites.
    const ground = document.createElement('div');
    ground.style.cssText = 'position:absolute;inset:0;overflow:hidden;pointer-events:none';
    fieldEl.insertBefore(ground, fieldEl.querySelector('.hud') ?? fieldEl.querySelector('.sprite'));

    const foot = this.footOf(launchEl, fieldEl);
    const reach = Math.hypot(target.x - foot.x, target.y - foot.y) * 1.25;
    const rings = 5;
    const ringDur = 1000;
    const ringGap = 170;
    for (let i = 0; i < rings; i++) {
      const ring = document.createElement('div');
      const w = reach * 2;
      ring.style.cssText = `position:absolute;width:${w}px;height:${w * 0.3}px;border-radius:50%;border:${5 - i * 0.6}px solid ${purple};box-shadow:0 0 8px ${purple},inset 0 0 8px ${purple}`;
      place(ring, foot);
      ground.appendChild(ring);
      this.anim(ring, [
        { transform: 'scale(.08)', opacity: 0 },
        { transform: 'scale(.25)', opacity: 0.9, offset: 0.15 },
        { transform: 'scale(1)', opacity: 0 }
      ], { duration: ringDur, easing: 'ease-out', delay: i * ringGap }).then(() => ring.remove());
    }

    // Dark sparks: short smoky streaks flying out around the caster.
    const r = launchEl.getBoundingClientRect();
    const rad = Math.max(r.width * 0.4, 28);
    for (let i = 0; i < 22; i++) {
      const ang = Math.random() * Math.PI * 2;
      const len = 10 + Math.random() * 16;
      const spark = document.createElement('div');
      spark.style.cssText = `position:absolute;width:${len}px;height:${3 + Math.random() * 3}px;border-radius:3px;pointer-events:none;background:linear-gradient(90deg,transparent,${purple},#8E3FB0);filter:blur(.6px);box-shadow:0 0 6px ${purple}`;
      const from = { x: launch.x + Math.cos(ang) * rad * 0.6, y: launch.y + Math.sin(ang) * rad * 0.6 };
      place(spark, from);
      fxEl.appendChild(spark);
      const dist = rad * (0.8 + Math.random() * 1.2);
      const deg = (ang * 180) / Math.PI;
      this.anim(spark, [
        { transform: `rotate(${deg}deg) translateX(0) scaleX(.3)`, opacity: 0 },
        { transform: `rotate(${deg}deg) translateX(${dist * 0.4}px) scaleX(1)`, opacity: 1, offset: 0.3 },
        { transform: `rotate(${deg}deg) translateX(${dist}px) scaleX(.6)`, opacity: 0 }
      ], { duration: 520, easing: 'ease-out', delay: Math.random() * (rings * ringGap + 300) }).then(() => spark.remove());
    }
    this.flash(launchEl, purple, 0.5);

    // The target is hit when the first wave reaches it, and again as later waves pass.
    for (let i = 0; i < 3; i++) {
      setTimeout(() => {
        this.flash(targetEl, purple, 0.55);
        this.shake(targetEl, 4);
      }, ringDur * 0.45 + i * ringGap * 1.6);
    }

    await this.wait(ringDur + (rings - 1) * ringGap);
    ground.remove();
    await this.anim(grey, [{ opacity: 1 }, { opacity: 0 }], { duration: 350, easing: 'ease-in' });
    grey.remove();
  }

  /**
   * Thunder: the scene goes dark under a band of storm clouds along the top,
   * then a jagged yellow bolt strikes the target from the sky, with a ground
   * glow, sparks and flashes.
   */
  private async playThunder(refs: BattleStageRefs, target: Point) {
    const { fieldEl, fxEl, screenFxEl, targetEl } = refs;
    const W = fieldEl.clientWidth;
    const H = fieldEl.clientHeight;
    const yellow = '#F6D33B';

    const sky = this.backdrop(fieldEl, 'background:linear-gradient(180deg,#141418,#24242B 40%,#1A1A20)');
    // Storm clouds: overlapping soft grey blobs along the top edge, drifting slowly.
    const clouds = document.createElement('div');
    clouds.style.cssText = 'position:absolute;left:-10%;right:-10%;top:0;height:28%';
    for (let i = 0; i < 14; i++) {
      const cw = W * (0.14 + Math.random() * 0.12);
      const blob = document.createElement('div');
      blob.style.cssText = `position:absolute;left:${(i / 14) * 112 - 4}%;top:${-cw * 0.35 + Math.random() * 10}px;width:${cw}px;height:${cw * 0.55}px;border-radius:50%;background:radial-gradient(ellipse at 50% 60%,#4A4A52,#33333A 60%,#2A2A3000);filter:blur(2px)`;
      clouds.appendChild(blob);
    }
    sky.appendChild(clouds);
    clouds.animate([{ transform: 'translateX(0)' }, { transform: `translateX(${W * 0.04}px)` }], {
      duration: 2600,
      easing: 'ease-in-out'
    });
    await this.anim(sky, [{ opacity: 0 }, { opacity: 1 }], { duration: 350, easing: 'ease-out' });
    await this.wait(350);

    // The bolt: jagged path from the sky to the target's feet, plus two thinner forks.
    const foot = this.footOf(targetEl, fieldEl);
    const zigzag = (x0: number, y0: number, x1: number, y1: number, jag: number): string => {
      const pts: string[] = [];
      const segs = Math.max(4, Math.round((y1 - y0) / 18));
      for (let k = 0; k <= segs; k++) {
        const t = k / segs;
        const off = k === 0 || k === segs ? 0 : (Math.random() * 2 - 1) * jag;
        pts.push(`${(x0 + (x1 - x0) * t + off).toFixed(1)},${(y0 + (y1 - y0) * t).toFixed(1)}`);
      }
      return pts.join(' ');
    };
    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg') as unknown as HTMLElement;
    svg.setAttribute('width', `${W}`);
    svg.setAttribute('height', `${H}`);
    svg.setAttribute('style', `position:absolute;left:0;top:0;overflow:visible;pointer-events:none;filter:drop-shadow(0 0 6px ${yellow}) drop-shadow(0 0 14px ${yellow})`);
    const main = zigzag(target.x + (Math.random() * 30 - 15), -10, foot.x, foot.y - 4, 14);
    const forkY = H * 0.25 + Math.random() * H * 0.15;
    const forks = [
      zigzag(target.x - 10, forkY, target.x - 40 - Math.random() * 30, forkY + 70, 9),
      zigzag(target.x + 8, forkY + 30, target.x + 35 + Math.random() * 30, forkY + 95, 9)
    ];
    svg.innerHTML =
      forks.map((f) => `<polyline points="${f}" fill="none" stroke="${yellow}" stroke-width="2.5" stroke-linejoin="bevel"/>`).join('') +
      `<polyline points="${main}" fill="none" stroke="${yellow}" stroke-width="7" stroke-linejoin="bevel"/>` +
      `<polyline points="${main}" fill="none" stroke="#FFFBE0" stroke-width="2.5" stroke-linejoin="bevel"/>`;
    fxEl.appendChild(svg);

    // Ground glow where the bolt lands.
    const rr = targetEl.getBoundingClientRect();
    const gw = Math.max(rr.width * 1.3, 80);
    const glow = document.createElement('div');
    glow.style.cssText = `position:absolute;width:${gw}px;height:${gw * 0.32}px;border-radius:50%;pointer-events:none;background:radial-gradient(ellipse,#FFFBE0,#E8F04Acc 35%,#9CD62A55 65%,transparent 75%)`;
    place(glow, foot);
    fxEl.insertBefore(glow, svg);

    // Strike - flicker - strike again.
    const strike = this.anim(svg, [
      { opacity: 0 },
      { opacity: 1, offset: 0.05 },
      { opacity: 0.25, offset: 0.25 },
      { opacity: 1, offset: 0.35 },
      { opacity: 0.4, offset: 0.55 },
      { opacity: 1, offset: 0.65 },
      { opacity: 0 }
    ], { duration: 900, easing: 'linear' }).then(() => svg.remove());
    this.anim(glow, [
      { transform: 'scale(.3)', opacity: 0 },
      { transform: 'scale(1)', opacity: 1, offset: 0.15 },
      { transform: 'scale(1.1)', opacity: 0.8, offset: 0.7 },
      { transform: 'scale(1.2)', opacity: 0 }
    ], { duration: 1100, easing: 'ease-out' }).then(() => glow.remove());
    this.screenWash(screenFxEl, '#FFF6B088', 60, 140, `${((target.x / W) * 100).toFixed(0)}%`);
    this.flash(targetEl, yellow, 0.9);
    this.shake(targetEl, 6);
    this.shakeField(fieldEl, 0.8);
    setTimeout(() => {
      this.flash(targetEl, '#FFFBE0', 0.9);
      this.shake(targetEl, 5);
    }, 320);

    // Sparks: glowing yellow-white motes bursting out around the target.
    const spread = Math.max(rr.width * 0.6, 40);
    for (let i = 0; i < 20; i++) {
      const sz = 5 + Math.random() * 7;
      const mote = document.createElement('div');
      mote.style.cssText = `position:absolute;width:${sz}px;height:${sz}px;border-radius:50%;pointer-events:none;background:radial-gradient(circle,#fff,#F4F47A 50%,#F6D33B00 75%);box-shadow:0 0 8px #F4F47A`;
      place(mote, { x: target.x + (Math.random() * 2 - 1) * spread * 0.4, y: foot.y - Math.random() * rr.height * 0.6 });
      fxEl.appendChild(mote);
      const ang = Math.random() * Math.PI * 2;
      const dist = spread * (0.5 + Math.random() * 0.7);
      this.anim(mote, [
        { transform: 'translate(0,0) scale(.4)', opacity: 0 },
        { transform: `translate(${Math.cos(ang) * dist * 0.5}px,${Math.sin(ang) * dist * 0.3}px) scale(1.2)`, opacity: 1, offset: 0.3 },
        { transform: `translate(${Math.cos(ang) * dist}px,${Math.sin(ang) * dist * 0.5}px) scale(.5)`, opacity: 0 }
      ], { duration: 650 + Math.random() * 350, easing: 'ease-out', delay: Math.random() * 300 }).then(() => mote.remove());
    }

    await strike;
    await this.wait(250);
    await this.anim(sky, [{ opacity: 1 }, { opacity: 0 }], { duration: 380, easing: 'ease-in' });
    sky.remove();
  }

  /**
   * Fire Blast, in three phases, all built from flowing fire streams (like
   * Flamethrower) so the fire keeps moving instead of sitting as orbs:
   * 1. flames stream in from around the caster and gather in it,
   * 2. a burning fireball flies to the target over a red-hot backdrop,
   * 3. it bursts into the five-armed blast shape over a yellow sunburst.
   */
  private async playFireBlast(refs: BattleStageRefs, launch: Point, target: Point, v: MoveVisual) {
    const { fieldEl, fxEl, launchEl, targetEl } = refs;
    const W = fieldEl.clientWidth;
    const H = fieldEl.clientHeight;
    const lr = launchEl.getBoundingClientRect();

    // --- phase 1: gather -------------------------------------------------
    const ringR = Math.max(lr.width * 0.65, 46);
    const gather: Promise<void>[] = [];
    for (let i = 0; i < 8; i++) {
      const ang = (Math.PI * 2 * i) / 8 + Math.random() * 0.3;
      const from = { x: launch.x + Math.cos(ang) * ringR, y: launch.y + Math.sin(ang) * ringR * 0.8 };
      gather.push(
        this.fireStream(fxEl, from, launch, {
          count: 7,
          gap: 45,
          travel: 420,
          grow: [1.1, 0.4],
          jitter: 4,
          wave: 4,
          delay: i * 35
        })
      );
    }
    this.flash(launchEl, v.color, 0.4);
    setTimeout(() => this.flash(launchEl, '#FFC53C', 0.5), 500);
    await Promise.all(gather);

    // --- phase 2: a burning fireball flies over a red-hot backdrop ------------
    const heat = this.backdrop(fieldEl, HEAT_BACKDROP);
    const heatIn = this.anim(heat, [{ opacity: 0 }, { opacity: 1 }], { duration: 250, easing: 'ease-out' });
    const dx = target.x - launch.x;
    const dy = target.y - launch.y;
    const flight = 480;
    // The ball: a few puffs churning around a shared centre.
    const ball = document.createElement('div');
    ball.style.cssText = 'position:absolute;width:0;height:0;pointer-events:none';
    place(ball, launch);
    for (const [size, ox, oy, turn] of [
      [42, 0, 0, 1],
      [30, -9, -6, -1.4],
      [28, 8, 5, 1.8],
      [24, 3, -10, -2.2]
    ]) {
      const puff = this.firePuff(size);
      puff.style.left = `${ox - size / 2}px`;
      puff.style.top = `${oy - size / 2}px`;
      ball.appendChild(puff);
      puff.animate([{ transform: 'rotate(0deg) scale(1)' }, { transform: `rotate(${turn * 180}deg) scale(1.15)` }, { transform: `rotate(${turn * 360}deg) scale(1)` }], {
        duration: 300,
        iterations: Infinity
      });
    }
    fxEl.appendChild(ball);
    // Flames shed behind the ball as it flies.
    for (let i = 0; i < 22; i++) {
      const t = i / 22;
      const trail = this.firePuff(16 + Math.random() * 10);
      place(trail, { x: launch.x + dx * t, y: launch.y + dy * t });
      fxEl.appendChild(trail);
      const rot = Math.random() * 180;
      this.anim(trail, [
        { transform: `rotate(${rot}deg) scale(.9)`, opacity: 0.95 },
        { transform: `translate(${-v.dir * 10}px,-10px) rotate(${rot + 120}deg) scale(.3)`, opacity: 0 }
      ], { duration: 300, easing: 'ease-out', delay: t * flight }).then(() => trail.remove());
    }
    await this.anim(ball, [
      { transform: 'translate(0,0) scale(.6)' },
      { transform: `translate(${dx * 0.15}px,${dy * 0.15}px) scale(1)`, offset: 0.2 },
      { transform: `translate(${dx}px,${dy}px) scale(1.2)` }
    ], { duration: flight, easing: 'ease-in' });
    await heatIn;
    ball.remove();

    // --- phase 3: five-armed blast over a sunburst -----------------------------
    const cx = `${target.x}px ${target.y}px`;
    const burst = this.backdrop(
      fieldEl,
      `background:radial-gradient(circle at ${cx},#FFFDE8 0,#FFF6A0 12%,transparent 34%),` +
        `radial-gradient(circle at ${cx},transparent 30%,#F0602Acc 85%,#C8301A),` +
        `repeating-conic-gradient(from 0deg at ${cx},#FFE95A 0deg 5deg,#FFC23C 5deg 10deg)`
    );
    // Sunburst goes above the heat layer (both stay behind platforms and sprites).
    heat.after(burst);
    this.anim(burst, [{ opacity: 0 }, { opacity: 1, offset: 0.1 }, { opacity: 1, offset: 0.8 }, { opacity: 0 }], {
      duration: 1500,
      easing: 'linear'
    }).then(() => burst.remove());
    this.flash(targetEl, '#FFF6A0', 0.9);
    this.shake(targetEl, 6);
    this.shakeField(fieldEl, 0.9);

    // Arms: up, left, right, down-left, down-right (screen angles, y points down).
    const armLen = Math.max(Math.min(W, H) * 0.32, 70);
    const blasts: Promise<void>[] = [];
    for (const deg of [-90, 180, 0, 135, 45]) {
      const a = (deg * Math.PI) / 180;
      const end = { x: target.x + Math.cos(a) * armLen, y: target.y + Math.sin(a) * armLen };
      blasts.push(
        this.fireStream(fxEl, target, end, {
          count: 16,
          gap: 40,
          travel: 460,
          size: [18, 30],
          grow: [0.6, 1.6],
          jitter: 6,
          wave: 4
        })
      );
    }
    // The core keeps burning on the target while the arms stream out.
    blasts.push(this.fireStream(fxEl, target, target, { count: 14, gap: 45, travel: 420, size: [24, 36], grow: [0.7, 1.5], jitter: 12, wave: 0 }));
    setTimeout(() => this.shake(targetEl, 5), 450);
    await Promise.all(blasts);

    await this.anim(heat, [{ opacity: 1 }, { opacity: 0 }], { duration: 350, easing: 'ease-in' });
    heat.remove();
  }

  /**
   * Flare Blitz, in three phases:
   * 1. lots of small flames rise straight up off the caster,
   * 2. the backdrop goes dark,
   * 3. the caster lunges and the target is hit by a big red flame blast with
   *    sparks over a bright blue backdrop; the caster takes recoil.
   */
  private async playFlareBlitz(refs: BattleStageRefs, launch: Point, target: Point, v: MoveVisual) {
    const { fieldEl, fxEl, launchEl, targetEl } = refs;
    const lr = launchEl.getBoundingClientRect();
    const f = fieldEl.getBoundingClientRect();

    // --- phase 1: flames rise off the caster ------------------------------
    const rise: Promise<void>[] = [];
    for (let i = 0; i < 9; i++) {
      const x = lr.left - f.left + lr.width * (0.15 + Math.random() * 0.7);
      const y = lr.top - f.top + lr.height * (0.25 + Math.random() * 0.65);
      const up = 70 + Math.random() * 60;
      rise.push(
        this.fireStream(fxEl, { x, y }, { x, y: y - up }, {
          count: 5,
          gap: 90,
          travel: 520,
          size: [8, 14],
          grow: [1, 0.3],
          jitter: 3,
          wave: 2,
          delay: Math.random() * 250
        })
      );
    }
    for (let i = 0; i < 3; i++) setTimeout(() => this.flash(launchEl, v.color, 0.45), i * 320);
    await Promise.all(rise);

    // --- phase 2: darkness -----------------------------------------------
    const dim = this.backdrop(fieldEl, DIM_BACKDROP);
    await this.anim(dim, [{ opacity: 0 }, { opacity: 1 }], { duration: 280, easing: 'ease-out' });
    await this.wait(150);

    // --- phase 3: lunge and flame blast ------------------------------------
    const original = launchEl.style.transform;
    const lunge = v.dir * 46;
    await this.anim(launchEl, [
      { transform: `${original} translateX(${-v.dir * 8}px)` },
      { transform: `${original} translateX(${lunge}px)` }
    ], { duration: 170, easing: 'ease-in' });

    const blue = this.backdrop(
      fieldEl,
      `background:radial-gradient(circle at ${target.x}px ${target.y}px,#C8ECFF 0,#5AA8EE 25%,#2463C2 60%,#123A86)`
    );
    dim.after(blue);
    const blueDone = this.anim(blue, [{ opacity: 0 }, { opacity: 1, offset: 0.08 }, { opacity: 1, offset: 0.8 }, { opacity: 0 }], {
      duration: 1300,
      easing: 'linear'
    }).then(() => blue.remove());
    this.flash(targetEl, '#FF5A3C', 0.9);
    this.shake(targetEl, 7);
    this.shakeField(fieldEl, 0.9);

    // The blast: red flame bursting outward in every direction, plus a burning core.
    const tr = targetEl.getBoundingClientRect();
    const reach = Math.max(tr.width * 0.75, 55);
    const blast: Promise<void>[] = [];
    for (let i = 0; i < 14; i++) {
      const a = (Math.PI * 2 * i) / 14 + Math.random() * 0.3;
      const d = reach * (0.7 + Math.random() * 0.4);
      blast.push(
        this.fireStream(fxEl, target, { x: target.x + Math.cos(a) * d, y: target.y + Math.sin(a) * d }, {
          count: 4,
          gap: 55,
          travel: 420,
          size: [22, 34],
          grow: [0.6, 1.9],
          jitter: 8,
          wave: 3,
          tone: 'red'
        })
      );
    }
    blast.push(this.fireStream(fxEl, target, target, { count: 8, gap: 60, travel: 420, size: [40, 56], grow: [0.7, 1.6], jitter: 6, wave: 0, tone: 'red' }));
    // Sparkling flames fly out past the blast; dark embers speckle it.
    for (let i = 0; i < 18; i++) {
      const a = Math.random() * Math.PI * 2;
      const spark = i % 3 ? this.firePuff(7 + Math.random() * 5) : this.sparkStar(9, '#FFE38A');
      place(spark, target);
      fxEl.appendChild(spark);
      const d = reach * (1.1 + Math.random() * 0.7);
      this.anim(spark, [
        { transform: 'translate(0,0) scale(.4)', opacity: 0 },
        { transform: `translate(${Math.cos(a) * d * 0.5}px,${Math.sin(a) * d * 0.5}px) scale(1)`, opacity: 1, offset: 0.3 },
        { transform: `translate(${Math.cos(a) * d}px,${Math.sin(a) * d}px) scale(.4)`, opacity: 0 }
      ], { duration: 650, easing: 'ease-out', delay: 60 + Math.random() * 250 }).then(() => spark.remove());
    }
    for (let i = 0; i < 14; i++) {
      const ember = document.createElement('div');
      const sz = 3 + Math.random() * 3;
      ember.style.cssText = `position:absolute;width:${sz}px;height:${sz}px;border-radius:50%;pointer-events:none;background:#7A0E0E`;
      place(ember, { x: target.x + (Math.random() * 2 - 1) * reach * 0.8, y: target.y + (Math.random() * 2 - 1) * reach * 0.7 });
      fxEl.appendChild(ember);
      this.anim(ember, [{ opacity: 0 }, { opacity: 0.9, offset: 0.3 }, { opacity: 0 }], {
        duration: 600,
        delay: 120 + Math.random() * 300
      }).then(() => ember.remove());
    }

    // Back to the start spot, then recoil.
    await this.anim(launchEl, [{ transform: `${original} translateX(${lunge}px)` }, { transform: original }], {
      duration: 220,
      easing: 'ease-out'
    });
    launchEl.getAnimations?.().forEach((a) => a.cancel());
    launchEl.style.transform = original;
    setTimeout(() => {
      this.flash(launchEl, '#E06666', 0.5);
      this.shake(launchEl, 4);
    }, 300);
    await Promise.all(blast);
    await blueDone;
    await this.anim(dim, [{ opacity: 1 }, { opacity: 0 }], { duration: 320, easing: 'ease-in' });
    dim.remove();
  }

  /**
   * A flowing stream of fire from `from` to `to`: puffs leave one after
   * another, swirl, change size and fade. Overlapping, ever-moving puffs are
   * what make it read as flame rather than as orbs.
   */
  private fireStream(
    fxEl: HTMLElement,
    from: Point,
    to: Point,
    opts: {
      count: number;
      gap: number;
      travel: number;
      /** puff size range in px */
      size?: [number, number];
      /** scale at the start and at the end of the flight */
      grow?: [number, number];
      /** max px of random scatter at the end */
      jitter?: number;
      /** max px of sideways wave */
      wave?: number;
      delay?: number;
      tone?: 'hot' | 'red';
    }
  ): Promise<void> {
    const { count, gap, travel, size = [14, 24], grow = [0.4, 1.5], jitter = 8, wave = 8, delay = 0, tone = 'hot' } = opts;
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const sc = (f: number) => grow[0] + (grow[1] - grow[0]) * f;
    const flights: Promise<void>[] = [];
    for (let i = 0; i < count; i++) {
      const puff = this.firePuff(size[0] + Math.random() * (size[1] - size[0]), tone);
      place(puff, from);
      fxEl.appendChild(puff);
      const jx = (Math.random() * 2 - 1) * jitter;
      const jy = (Math.random() * 2 - 1) * jitter;
      const wav = Math.sin(i * 0.7) * wave;
      const rot = Math.random() * 180;
      flights.push(
        this.anim(puff, [
          { transform: `translate(0,0) rotate(${rot}deg) scale(${sc(0)})`, opacity: 0 },
          { transform: `translate(${dx * 0.15}px,${dy * 0.15 + wav * 0.3}px) rotate(${rot + 40}deg) scale(${sc(0.27)})`, opacity: 1, offset: 0.12 },
          { transform: `translate(${dx * 0.6 + jx * 0.5}px,${dy * 0.6 + wav + jy * 0.5}px) rotate(${rot + 120}deg) scale(${sc(0.73)})`, opacity: 1, offset: 0.6 },
          { transform: `translate(${dx + jx}px,${dy + jy}px) rotate(${rot + 200}deg) scale(${sc(1)})`, opacity: 0 }
        ], { duration: travel, easing: 'linear', delay: delay + i * gap }).then(() => puff.remove())
      );
    }
    return Promise.all(flights).then(() => void 0);
  }

  /**
   * A swirling ball of fire. `hot` is the usual yellow-white core with an
   * orange edge; `red` is a deeper red blast (Flare Blitz). Used by the fire moves.
   */
  private firePuff(size: number, tone: 'hot' | 'red' = 'hot'): HTMLElement {
    const fill =
      tone === 'red'
        ? 'radial-gradient(circle at 45% 45%,#FFD2A8,#F2583A 30%,#D0281C 58%,#9A101000 78%)'
        : 'radial-gradient(circle at 45% 45%,#FFF6C0,#FFC53C 35%,#F0803C 60%,#D2321A00 78%)';
    const puff = document.createElement('div');
    puff.style.cssText = `position:absolute;width:${size}px;height:${size}px;border-radius:50% 50% 45% 55%;pointer-events:none;background:${fill}`;
    return puff;
  }

  /**
   * A temporary layer that replaces the battle backdrop. It is inserted as the
   * field's first child, so it sits behind the platforms, sprites and HUD.
   */
  private backdrop(fieldEl: HTMLElement, css: string): HTMLElement {
    const bg = document.createElement('div');
    bg.style.cssText = `position:absolute;inset:0;overflow:hidden;pointer-events:none;${css}`;
    fieldEl.insertBefore(bg, fieldEl.firstChild);
    return bg;
  }

  /** A four-point glowing star used for energy / sparkle effects. */
  private sparkStar(size: number, color: string): HTMLElement {
    // The glow sits on a wrapper: clip-path on the same element would cut the drop-shadow off.
    const el = document.createElement('div');
    el.style.cssText = `position:absolute;width:${size}px;height:${size}px;pointer-events:none;filter:drop-shadow(0 0 4px ${color})`;
    const shape = document.createElement('div');
    shape.style.cssText = `width:100%;height:100%;clip-path:polygon(50% 0,62% 38%,100% 50%,62% 62%,50% 100%,38% 62%,0 50%,38% 38%);background:radial-gradient(circle,#fff,${color} 60%)`;
    el.appendChild(shape);
    return el;
  }

  // --- particle helpers ------------------------------------------------

  private glyph(v: MoveVisual, size: number): HTMLElement {
    const style = TYPE_STYLE[v.type] ?? TYPE_STYLE.Normal;
    if (style.shape === 'bolt') return this.boltGlyph(v.color, size);
    const el = document.createElement('div');
    el.style.cssText = `position:absolute;width:${size}px;height:${size}px;pointer-events:none;${SHAPE_CSS[style.shape](v.color)}`;
    return el;
  }

  private boltGlyph(color: string, size: number): HTMLElement {
    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg') as unknown as HTMLElement;
    svg.setAttribute('width', `${size}`);
    svg.setAttribute('height', `${size * 1.6}`);
    svg.setAttribute('viewBox', '0 0 10 16');
    svg.setAttribute('style', 'position:absolute;overflow:visible');
    const p = document.createElementNS(ns, 'polyline');
    p.setAttribute('points', '6,0 2,7 5,7 3,16 9,6 5,6');
    p.setAttribute('fill', color);
    p.setAttribute('stroke', '#fff');
    p.setAttribute('stroke-width', '0.6');
    svg.appendChild(p);
    return svg;
  }

  private emitBurst(fxEl: HTMLElement, c: Point, v: MoveVisual, count: number, radius: number) {
    const spins = TYPE_STYLE[v.type]?.spin ?? false;
    for (let i = 0; i < count; i++) {
      const ang = (Math.PI * 2 * i) / count + Math.random() * 0.6;
      const dist = radius * (0.5 + Math.random() * 0.7);
      const size = 6 + v.power * 9 + Math.random() * 4;
      const g = this.glyph(v, size);
      place(g, c);
      fxEl.appendChild(g);
      const spin = spins ? Math.random() * 720 - 360 : 0;
      this.anim(g, [
        { transform: 'translate(0,0) scale(.4) rotate(0deg)', opacity: 1 },
        {
          transform: `translate(${Math.cos(ang) * dist}px,${Math.sin(ang) * dist + 14}px) scale(1) rotate(${spin}deg)`,
          opacity: 0
        }
      ], { duration: 360 + Math.random() * 260, easing: 'cubic-bezier(.2,.6,.3,1)' }).then(() => g.remove());
    }
  }

  private streamParticles(
    fxEl: HTMLElement,
    from: Point,
    to: Point,
    v: MoveVisual,
    count: number,
    dur: number,
    jitter = 12
  ) {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    for (let i = 0; i < count; i++) {
      const g = this.glyph(v, 5 + v.power * 6 + Math.random() * 4);
      const ox = from.x + (Math.random() * jitter * 2 - jitter);
      const oy = from.y + (Math.random() * jitter * 2 - jitter);
      place(g, { x: ox, y: oy });
      fxEl.appendChild(g);
      this.anim(g, [
        { transform: 'translate(0,0)', opacity: 0 },
        { transform: `translate(${dx * 0.1}px,${dy * 0.1}px)`, opacity: 0.95, offset: 0.15 },
        { transform: `translate(${dx}px,${dy}px)`, opacity: 0 }
      ], { duration: dur, easing: 'ease-in', delay: (i / count) * dur * 0.6 }).then(() => g.remove());
    }
  }

  private meleeGlyph(fxEl: HTMLElement, at: Point, v: MoveVisual) {
    const el = document.createElement('div');
    const c = v.color;
    const shapes: Record<MeleeStyle, string> = {
      hit: `width:44px;height:44px;clip-path:polygon(50% 0,61% 35%,100% 50%,61% 65%,50% 100%,39% 65%,0 50%,39% 35%);background:radial-gradient(circle,#fff,${c})`,
      punch: `width:38px;height:38px;border-radius:50%;background:radial-gradient(circle at 40% 40%,#fff,${c});box-shadow:0 0 12px ${c}`,
      bite: `width:46px;height:46px;border-radius:50%;background:conic-gradient(${c} 0 30deg,transparent 30deg 60deg,${c} 60deg 90deg,transparent 90deg 120deg,${c} 120deg 150deg,transparent 150deg 180deg,${c} 180deg 210deg,transparent 210deg 240deg,${c} 240deg 270deg,transparent 270deg 300deg,${c} 300deg 330deg,transparent 330deg)`,
      kick: `width:50px;height:14px;border-radius:7px;background:linear-gradient(90deg,transparent,${c},#fff)`,
      slash: `width:56px;height:10px;border-radius:6px;background:linear-gradient(90deg,transparent,#fff,${c},transparent)`
    };
    el.style.cssText = `position:absolute;left:${at.x}px;top:${at.y}px;margin:-24px 0 0 -24px;${shapes[v.meleeStyle]}`;
    fxEl.appendChild(el);
    // Mirror the directional glyphs (kick/slash gradients, slash tilt) so an
    // opponent -> player strike reads the same as a player -> opponent one.
    const pre = `scaleX(${v.dir}) ${v.meleeStyle === 'slash' ? 'rotate(-35deg) ' : ''}`;
    this.anim(el, [
      { transform: `${pre}scale(.4)`, opacity: 0.2 },
      { transform: `${pre}scale(1)`, opacity: 1, offset: 0.4 },
      { transform: `${pre}scale(1.3)`, opacity: 0 }
    ], { duration: 300, easing: 'ease-out' }).then(() => el.remove());
  }

  private fleck(fxEl: HTMLElement, at: Point, v: MoveVisual) {
    if (!v.fleck) return;
    const color = FLECK_COLOR[v.fleck];
    const glyphs: Record<Exclude<Fleck, null>, string> = {
      burn: `border-radius:50% 50% 50% 0;background:radial-gradient(circle,#fff,${color})`,
      freeze: `clip-path:polygon(50% 0,100% 100%,0 100%);background:linear-gradient(${color},#fff)`,
      paralyze: `clip-path:polygon(60% 0,20% 55%,50% 55%,30% 100%,90% 45%,55% 45%);background:${color}`,
      poison: `border-radius:50%;background:radial-gradient(circle at 35% 35%,#fff,${color});border:1px solid ${color}`,
      sleep: `border-radius:2px;background:${color};clip-path:polygon(0 0,100% 0,0 100%,100% 100%)`,
      flinch: `clip-path:polygon(50% 0,61% 35%,100% 50%,61% 65%,50% 100%,39% 65%,0 50%,39% 35%);background:${color}`,
      confusion: `border-radius:50%;border:3px solid ${color};border-right-color:transparent`,
      statUp: `clip-path:polygon(50% 0,100% 100%,0 100%);background:${color}`,
      statDown: `clip-path:polygon(0 0,100% 0,50% 100%);background:${color}`
    };
    const rising = v.fleck === 'statUp' || v.fleck === 'sleep';
    for (let i = 0; i < 5; i++) {
      const el = document.createElement('div');
      const s = 12 + Math.random() * 6;
      el.style.cssText = `position:absolute;width:${s}px;height:${s}px;left:${at.x + (Math.random() * 44 - 22)}px;top:${at.y + (Math.random() * 30 - 15)}px;${glyphs[v.fleck]}`;
      fxEl.appendChild(el);
      this.anim(el, [
        { transform: 'translateY(0) scale(.5) rotate(0deg)', opacity: 0 },
        { transform: 'translateY(0) scale(1) rotate(40deg)', opacity: 1, offset: 0.3 },
        { transform: `translateY(${rising ? -28 : 16}px) scale(.6) rotate(120deg)`, opacity: 0 }
      ], { duration: 620, easing: 'ease-out', delay: i * 60 }).then(() => el.remove());
    }
  }

  // --- faint / recall / send-out ------------------------------------

  /** A quick sidestep-and-back: the target slips the attack when it misses. */
  async playDodge(spriteEl: HTMLElement): Promise<void> {
    await this.anim(
      spriteEl,
      [
        { transform: 'translateX(0)' },
        { transform: 'translateX(-18px) skewX(8deg)', offset: 0.3 },
        { transform: 'translateX(12px) skewX(-4deg)', offset: 0.65 },
        { transform: 'translateX(0) skewX(0)' }
      ],
      { duration: 360, easing: 'ease-out', fill: 'none' }
    );
  }

  /** Protect / Detect / King's Shield: a translucent bubble pops up around the Pokémon. */
  async playShield(spriteEl: HTMLElement, fxEl: HTMLElement, fieldEl: HTMLElement, color = '#7fd3ff'): Promise<void> {
    const at = this.centerOf(spriteEl, fieldEl);
    const size = Math.max(spriteEl.getBoundingClientRect().height, 60) * 1.15;
    const bubble = document.createElement('div');
    bubble.style.cssText = `position:absolute;left:${at.x - size / 2}px;top:${at.y - size / 2}px;width:${size}px;height:${size}px;border-radius:50%;border:3px solid ${color};background:radial-gradient(circle at 35% 30%,rgba(255,255,255,.55),${color}33 60%,transparent 75%);pointer-events:none`;
    fxEl.appendChild(bubble);
    await this.anim(bubble, [
      { transform: 'scale(.4)', opacity: 0 },
      { transform: 'scale(1.05)', opacity: 1, offset: 0.35 },
      { transform: 'scale(1)', opacity: 0.9, offset: 0.7 },
      { transform: 'scale(1.1)', opacity: 0 }
    ], { duration: 620, easing: 'ease-out' });
    bubble.remove();
  }

  /** A short hit flash + shake for the extra targets of a spread move. */
  async playHitFlash(spriteEl: HTMLElement, color = '#ffffff'): Promise<void> {
    this.flash(spriteEl, color, 0.7);
    this.shake(spriteEl, 5);
    await this.wait(260);
  }

  /** The classic faint: the Pokémon drops below its platform and fades out. */
  async playFaint(spriteEl: HTMLElement): Promise<void> {
    spriteEl.getAnimations?.().forEach((a) => a.cancel());
    spriteEl.style.transformOrigin = 'center bottom';
    await this.anim(spriteEl, [
      { transform: 'translateY(0) scaleY(1)', opacity: 1, offset: 0 },
      { transform: 'translateY(3px) scaleY(0.8)', opacity: 1, offset: 0.16 },
      { transform: 'translateY(70px) scaleY(0.65)', opacity: 0, offset: 1 }
    ], { duration: 640, easing: 'cubic-bezier(.5,0,.9,.35)', fill: 'forwards' });
    spriteEl.style.opacity = '0';
    spriteEl.style.transform = 'translateY(70px)';
  }

  /** Recall a (living) Pokémon: a ball flies in, a beam retracts it, the ball wobbles shut. */
  async playRecall(
    spriteEl: HTMLElement,
    fxEl: HTMLElement,
    fieldEl: HTMLElement,
    side: 'player' | 'opponent'
  ): Promise<void> {
    spriteEl.getAnimations?.().forEach((a) => a.cancel());
    const rect = fieldEl.getBoundingClientRect();
    const sprite = this.centerOf(spriteEl, fieldEl);
    const home = this.ballHome(rect, side);
    const point = { x: sprite.x, y: sprite.y + 16 };

    const ball = this.pokeball(20);
    place(ball, home);
    fxEl.appendChild(ball);
    const at = (p: Point) => `translate(${p.x - home.x}px, ${p.y - home.y}px)`;
    await this.anim(ball, [{ transform: at(home) }, { transform: at(point) }], {
      duration: 300,
      easing: 'ease-out',
      fill: 'forwards'
    });

    // ball is in position - the recall beam fires and pulls the Pokémon in
    this.audio.playBallReturn();
    this.beam(fxEl, point, sprite);
    spriteEl.style.transformOrigin = 'center center';
    await this.anim(spriteEl, [
      { transform: 'translate(0,0) scale(1)', filter: 'brightness(1) saturate(1)', opacity: 1, offset: 0 },
      { transform: 'translate(0,0) scale(1)', filter: 'brightness(3) saturate(0)', opacity: 1, offset: 0.25 },
      {
        transform: `translate(${point.x - sprite.x}px, ${point.y - sprite.y}px) scale(0.04)`,
        filter: 'brightness(4) saturate(0)',
        opacity: 0.4,
        offset: 1
      }
    ], { duration: 360, easing: 'ease-in', fill: 'forwards' });
    spriteEl.style.opacity = '0';
    spriteEl.style.transform = '';
    spriteEl.style.filter = '';

    await this.anim(ball, [
      { transform: `${at(point)} rotate(0)` },
      { transform: `${at(point)} rotate(-20deg)`, offset: 0.3 },
      { transform: `${at(point)} rotate(17deg)`, offset: 0.6 },
      { transform: `${at(point)} rotate(0)` }
    ], { duration: 260 });
    await this.anim(ball, [{ transform: at(point), opacity: 1 }, { transform: at(home), opacity: 0 }], {
      duration: 240,
      easing: 'ease-in'
    });
    ball.remove();
  }

  /** Send a Pokémon out: a ball arcs in, bursts open with a flash, the sprite grows in. */
  async playSendOut(
    spriteEl: HTMLElement,
    fxEl: HTMLElement,
    fieldEl: HTMLElement,
    side: 'player' | 'opponent'
  ): Promise<void> {
    spriteEl.getAnimations?.().forEach((a) => a.cancel());
    spriteEl.style.transform = 'none';
    spriteEl.style.filter = 'none';
    spriteEl.style.opacity = '0';

    const rect = fieldEl.getBoundingClientRect();
    const target = this.centerOf(spriteEl, fieldEl);
    const home = this.ballHome(rect, side);
    const midX = home.x + (target.x - home.x) * 0.55;
    const arcY = Math.min(home.y, target.y) - 80;

    const ball = this.pokeball(22);
    place(ball, home);
    fxEl.appendChild(ball);
    await this.anim(ball, [
      { transform: 'translate(0,0) rotate(0)', offset: 0 },
      { transform: `translate(${midX - home.x}px, ${arcY - home.y}px) rotate(340deg)`, offset: 0.55 },
      { transform: `translate(${target.x - home.x}px, ${target.y - home.y}px) rotate(560deg)`, offset: 1 }
    ], { duration: 430, easing: 'ease-in', fill: 'forwards' });

    // ball has landed and is springing open - the Pokémon is released now
    this.audio.playBallOpen();

    const flash = document.createElement('div');
    const fs = 14;
    flash.style.cssText = `position:absolute;left:${target.x - fs / 2}px;top:${target.y - fs / 2}px;width:${fs}px;height:${fs}px;border-radius:50%;background:radial-gradient(circle,#fff,#d6ecff 55%,transparent);pointer-events:none`;
    fxEl.appendChild(flash);
    this.anim(ball, [{ opacity: 1 }, { opacity: 0 }], { duration: 140 }).then(() => ball.remove());
    await this.anim(flash, [
      { transform: 'scale(.3)', opacity: 0 },
      { transform: 'scale(4)', opacity: 1, offset: 0.35 },
      { transform: 'scale(8)', opacity: 0 }
    ], { duration: 340, easing: 'ease-out' });
    flash.remove();

    spriteEl.style.opacity = '1';
    spriteEl.style.transformOrigin = 'center bottom';
    await this.anim(spriteEl, [
      { transform: 'scale(0)', filter: 'brightness(4) saturate(0)', offset: 0 },
      { transform: 'scale(1.12)', filter: 'brightness(2) saturate(.4)', offset: 0.6 },
      { transform: 'scale(1)', filter: 'brightness(1) saturate(1)', offset: 1 }
    ], { duration: 380, easing: 'cubic-bezier(.3,1.3,.5,1)' });
    spriteEl.style.transform = '';
    spriteEl.style.filter = '';
  }

  private ballHome(rect: DOMRect, side: 'player' | 'opponent'): Point {
    return side === 'player'
      ? { x: -34, y: rect.height + 34 }
      : { x: rect.width + 34, y: -34 };
  }

  private beam(fxEl: HTMLElement, from: Point, to: Point): void {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const len = Math.hypot(dx, dy) + 26;
    const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
    const b = document.createElement('div');
    b.style.cssText = `position:absolute;left:${from.x}px;top:${from.y - 4}px;height:8px;width:${len}px;border-radius:4px;transform-origin:left center;background:linear-gradient(90deg,#ff5a4d,#ffd2cd);pointer-events:none`;
    fxEl.appendChild(b);
    this.anim(b, [
      { transform: `rotate(${angle}deg) scaleX(0)`, opacity: 0.9 },
      { transform: `rotate(${angle}deg) scaleX(1)`, opacity: 0.9, offset: 0.4 },
      { transform: `rotate(${angle}deg) scaleX(0)`, opacity: 0 }
    ], { duration: 430, easing: 'ease-in-out' }).then(() => b.remove());
  }

  private pokeball(size: number): HTMLElement {
    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg') as unknown as HTMLElement;
    svg.setAttribute('viewBox', '0 0 20 20');
    svg.setAttribute(
      'style',
      `position:absolute;width:${size}px;height:${size}px;overflow:visible;filter:drop-shadow(0 2px 2px rgba(0,0,0,.3))`
    );
    svg.innerHTML =
      '<circle cx="10" cy="10" r="9" fill="#f6f6f6" stroke="#1a1a1a" stroke-width="1.4"/>' +
      '<path d="M1.3 9.3A9 9 0 0 1 18.7 9.3Z" fill="#ec4b3b"/>' +
      '<rect x="1" y="8.6" width="18" height="2.8" fill="#1a1a1a"/>' +
      '<circle cx="10" cy="10" r="2.7" fill="#fff" stroke="#1a1a1a" stroke-width="1.4"/>';
    return svg;
  }

  // --- primitives ----------------------------------------------------

  private centerOf(el: HTMLElement, fieldEl: HTMLElement): Point {
    const r = el.getBoundingClientRect();
    const f = fieldEl.getBoundingClientRect();
    return { x: r.left - f.left + r.width / 2, y: r.top - f.top + r.height / 2 };
  }

  /** Bottom-centre of a sprite (where it stands), in field coordinates. */
  private footOf(el: HTMLElement, fieldEl: HTMLElement): Point {
    const r = el.getBoundingClientRect();
    const f = fieldEl.getBoundingClientRect();
    return { x: r.left - f.left + r.width / 2, y: r.bottom - f.top - 6 };
  }

  private flash(el: HTMLElement, color: string, intensity = 0.5): void {
    const blur = 4 + intensity * 20;
    el.style.filter = `brightness(${1 + intensity}) drop-shadow(0 0 ${blur}px ${color})`;
    setTimeout(() => (el.style.filter = ''), 150);
  }

  /** Classic hit blink: the sprite flickers off and on a few times. */
  private blink(el: HTMLElement, times = 4, ms = 70): Promise<void> {
    const frames: Keyframe[] = [];
    // step-end on each frame: hard on/off cuts instead of fading.
    for (let i = 0; i < times; i++) frames.push({ opacity: 0, easing: 'step-end' }, { opacity: 1, easing: 'step-end' });
    frames.push({ opacity: 1 });
    return this.anim(el, frames, { duration: times * 2 * ms, easing: 'linear', fill: 'none' });
  }

  private shake(el: HTMLElement, amp = 4): void {
    let i = 0;
    const base = el.style.transform.replace(/translate\([^)]*\)/g, '');
    const t = setInterval(() => {
      el.style.transform = `${base} translateX(${i % 2 ? -amp : amp}px)`;
      if (++i > 5) {
        clearInterval(t);
        el.style.transform = base;
      }
    }, 40);
  }

  private shakeField(fieldEl: HTMLElement, scale = 1): void {
    let i = 0;
    const a = 6 * scale;
    const t = setInterval(() => {
      fieldEl.style.transform = `translate(${(i % 2 ? -a : a).toFixed(1)}px,${i % 3 ? 2 : -2}px)`;
      if (++i > 10) {
        clearInterval(t);
        fieldEl.style.transform = '';
      }
    }, 45);
  }

  private screenWash(
    screenFxEl: HTMLElement,
    color: string,
    rampMs: number,
    holdMs: number,
    anchorX = '65%'
  ): void {
    screenFxEl.style.background = `radial-gradient(circle at ${anchorX} 40%, ${color}, transparent 75%)`;
    screenFxEl.style.transition = `opacity ${rampMs}ms ease-out`;
    screenFxEl.style.opacity = '1';
    setTimeout(() => {
      screenFxEl.style.transition = `opacity ${rampMs}ms ease-in`;
      screenFxEl.style.opacity = '0';
    }, holdMs);
  }

  private anim(el: Element, frames: Keyframe[], opts: KeyframeAnimationOptions): Promise<void> {
    const a = el.animate(frames, { fill: 'both', ...opts });
    return a.finished.then(() => void 0).catch(() => void 0);
  }

  private wait(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// --- pure derivations from move data ----------------------------------

function place(el: HTMLElement, p: Point): void {
  const w = parseFloat(el.style.width) || 0;
  const h = parseFloat(el.style.height) || 0;
  el.style.position = 'absolute';
  el.style.left = `${p.x - w / 2}px`;
  el.style.top = `${p.y - h / 2}px`;
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

function multiHitCount(multihit: unknown): number {
  if (typeof multihit === 'number') return clamp(multihit, 1, 5);
  if (Array.isArray(multihit)) {
    const [min, max] = multihit as number[];
    return clamp(min === max ? min : 3, 1, 5);
  }
  return 1;
}

function meleeStyle(flags: Record<string, unknown>, name: string): MeleeStyle {
  if (flags['punch']) return 'punch';
  if (flags['bite']) return 'bite';
  if (/\b(kick|stomp|jump)\b/i.test(name)) return 'kick';
  if (/\b(slash|cut|claw|blade|scratch|wing|sword)\b/i.test(name)) return 'slash';
  return 'hit';
}

function boostSign(boosts: unknown): number {
  if (!boosts || typeof boosts !== 'object') return 0;
  const vals = Object.values(boosts as Record<string, number>);
  if (!vals.length) return 0;
  return vals.reduce((a, b) => a + b, 0) >= 0 ? 1 : -1;
}

function deriveFleck(
  d: ReturnType<typeof Dex.moves.get> | undefined,
  selfBoost: number,
  delivery: Delivery
): Fleck {
  const statusMap: Record<string, Fleck> = {
    brn: 'burn',
    frz: 'freeze',
    par: 'paralyze',
    psn: 'poison',
    tox: 'poison',
    slp: 'sleep'
  };
  if (d?.status && statusMap[d.status]) return statusMap[d.status];
  if (d?.volatileStatus === 'confusion') return 'confusion';
  const sec = d?.secondary ?? (Array.isArray(d?.secondaries) ? d?.secondaries[0] : undefined);
  if (sec?.status && statusMap[sec.status]) return statusMap[sec.status];
  if (sec?.volatileStatus === 'flinch') return 'flinch';
  if (sec?.volatileStatus === 'confusion') return 'confusion';
  if (sec?.boosts) return 'statDown';
  if (delivery === 'selfAura' && selfBoost !== 0) return selfBoost > 0 ? 'statUp' : 'statDown';
  if ((delivery === 'targetAura' || delivery === 'powder') && boostSign(d?.boosts) < 0) return 'statDown';
  return null;
}

function mapWeather(weather: string | undefined): Weather {
  switch (weather) {
    case 'sunnyday':
      return 'sun';
    case 'raindance':
      return 'rain';
    case 'sandstorm':
      return 'sand';
    case 'hail':
      return 'hail';
    default:
      return null;
  }
}
