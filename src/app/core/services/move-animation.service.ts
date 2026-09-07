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
  Steel: { shape: 'shard', spin: true }
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
    if (!SEMI_INVULN_ANIM.has(move.showdownId)) return;
    const el = refs.launchEl;
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

  private flash(el: HTMLElement, color: string, intensity = 0.5): void {
    const blur = 4 + intensity * 20;
    el.style.filter = `brightness(${1 + intensity}) drop-shadow(0 0 ${blur}px ${color})`;
    setTimeout(() => (el.style.filter = ''), 150);
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
