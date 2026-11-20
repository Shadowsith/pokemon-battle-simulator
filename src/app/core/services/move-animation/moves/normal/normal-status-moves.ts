import { Point, BattleStageRefs, MoveAnimRegistry, MoveVisual } from '../../animation.types';
import { Fx } from '../../fx';
import { FxGlyphs } from '../../fx-glyphs';
import { FxEffects } from '../../fx-effects';
import { Assist } from './assist';
import { Camouflage } from './camouflage';
import { DoubleTeam } from './double-team';
import { Endure } from './endure';
import { HelpingHand } from './helping-hand';
import { Howl } from './howl';
import { PsychUp } from './psych-up';
import { Safeguard } from './safeguard';
import { ShellSmash } from './shell-smash';
import { Transform } from './transform';
import { WorkUp } from './work-up';
import { NaturePower } from './nature-power';
import { Recycle } from './recycle';

/** Hand-made animations for Normal-type status moves on the user or its side (setup, protection, support; foe-targeted ones are in `normal-foe-status-moves.ts`; Assist lives in `assist.ts`, Camouflage in `camouflage.ts`, Double Team in `double-team.ts`, Endure in `endure.ts`, Helping Hand in `helping-hand.ts`, Howl in `howl.ts`, Nature Power in `nature-power.ts`, Psych Up in `psych-up.ts`, Recycle in `recycle.ts`, Safeguard in `safeguard.ts`, Shell Smash in `shell-smash.ts`, Transform in `transform.ts`, Work Up in `work-up.ts`). */
export class NormalStatusMoveAnimations {
  /** By @pkmn/sim move id. */
  static readonly anims: MoveAnimRegistry = {
    assist: (refs, launch, target) => Assist.play(refs, launch, target),
    batonpass: (refs, launch) => NormalStatusMoveAnimations.playBatonPass(refs, launch),
    bellydrum: (refs, launch) => NormalStatusMoveAnimations.playBellyDrum(refs, launch),
    camouflage: (refs, launch) => Camouflage.play(refs, launch),
    conversion: (refs, launch) => NormalStatusMoveAnimations.playConversion(refs, launch),
    defensecurl: (refs, launch) => NormalStatusMoveAnimations.playDefenseCurl(refs, launch),
    doubleteam: (refs, launch) => DoubleTeam.play(refs, launch),
    endure: (refs, launch) => Endure.play(refs, launch),
    focusenergy: (refs, launch) => NormalStatusMoveAnimations.playFocusEnergy(refs, launch),
    followme: (refs, launch) => NormalStatusMoveAnimations.playFollowMe(refs, launch),
    growth: (refs, launch) => NormalStatusMoveAnimations.playGrowth(refs, launch),
    harden: (refs, launch) => NormalStatusMoveAnimations.playHarden(refs, launch),
    helpinghand: (refs, _launch, target) => HelpingHand.play(refs, target),
    howl: (refs, launch, _target, v) => Howl.play(refs, launch, v),
    metronome: (refs, launch, _target, v) => NormalStatusMoveAnimations.playMetronome(refs, launch, v),
    minimize: (refs, launch) => NormalStatusMoveAnimations.playMinimize(refs, launch),
    naturepower: (refs, launch) => NaturePower.play(refs, launch),
    painsplit: (refs, launch, target) => NormalStatusMoveAnimations.playPainSplit(refs, launch, target),
    protect: (refs, launch) => NormalStatusMoveAnimations.playProtect(refs, launch),
    psychup: (refs, launch) => PsychUp.play(refs, launch),
    recycle: (refs, launch) => Recycle.play(refs, launch),
    safeguard: (refs, launch) => Safeguard.play(refs, launch),
    sharpen: (refs, launch) => NormalStatusMoveAnimations.playSharpen(refs, launch),
    shellsmash: (refs, launch) => ShellSmash.play(refs, launch),
    sleeptalk: (refs, launch, target, v) => NormalStatusMoveAnimations.playSleepTalk(refs, launch, target, v),
    splash: (refs) => NormalStatusMoveAnimations.playSplash(refs),
    swordsdance: (refs, launch) => NormalStatusMoveAnimations.playSwordsDance(refs, launch),
    transform: (refs) => Transform.play(refs),
    workup: (refs, launch) => WorkUp.play(refs, launch),
  };

  /**
   * Splash, after the Gen 4 / Gen 5 animation:
   * - Gen 4: https://www.pokewiki.de/images/9/9f/Platscher_Gen4.png
   * - Gen 5: https://www.pokewiki.de/images/2/27/Platscher_Gen5.png
   *
   * The user hops on the spot three times (one hop every 0.4 s, 0-1.2 s).
   * Each time it lands (0.4 / 0.8 / 1.2 s) blue water drops splash out from
   * its feet to both sides and fall away (to ~1.6 s). Nothing else happens.
   */
  private static async playSplash(refs: BattleStageRefs) {
    const { fieldEl, fxEl, launchEl } = refs;
    const r = Fx.rect(launchEl);
    const foot = Fx.footOf(launchEl, fieldEl);
    const base = launchEl.style.transform;
    const hop = Math.max(r.height * 0.18, 14);
    const frames: Keyframe[] = [];
    for (let k = 0; k < 3; k++) {
      frames.push(
        { transform: `${base} translateY(0) scale(1.06,.94)`, offset: k / 3 },
        { transform: `${base} translateY(${-hop}px) scale(.96,1.04)`, offset: (k + 0.5) / 3, easing: 'ease-in' }
      );
    }
    frames.push({ transform: `${base} translateY(0) scale(1)`, offset: 1 });
    const effects: Promise<unknown>[] = [Fx.anim(launchEl, frames, { duration: 1200, easing: 'ease-out', fill: 'none' })];
    for (let k = 1; k <= 3; k++) {
      for (let i = 0; i < 6; i++) {
        const side = i % 2 ? 1 : -1;
        const x = side * (r.width * 0.3 + Math.random() * 18);
        const up = 14 + Math.random() * 14;
        const s = 5 + Math.random() * 4;
        const drop = Fx.box(s, s * 1.3, 'border-radius:50% 50% 50% 50%/60% 60% 40% 40%;background:radial-gradient(circle at 35% 30%,#fff,#6AB4F8 50%,#2A6CD0);box-shadow:0 0 3px #8AC8FF');
        effects.push(
          Fx.spawn(fxEl, drop, { x: foot.x + side * r.width * 0.15, y: foot.y }, [
            { transform: 'translate(0,0) scale(.5)', opacity: 1 },
            { transform: `translate(${x * 0.6}px,${-up}px) scale(1)`, opacity: 1, offset: 0.45 },
            { transform: `translate(${x}px,8px) scale(.8)`, opacity: 0 }
          ], { duration: 420, delay: k * 400 - 20, easing: 'ease-out' })
        );
      }
    }
    await Promise.all(effects);
  }

  /**
   * Sharpen, after the Gen 4 / Gen 5 animation:
   * - Gen 4: https://www.pokewiki.de/images/7/7f/Sch%C3%A4rfer_Gen4.png
   * - Gen 5: https://www.pokewiki.de/images/9/96/Sch%C3%A4rfer_Gen5.png
   *
   * A silver-white cube grows over the user, which turns steely grey, as if
   * its body were honed into hard edges (0-0.45 s). A white glint flashes on
   * the cube's corner (0.45-0.75 s), the cube fades away (0.75-1.0 s) and the
   * stat-up aura plays (1.0-1.8 s).
   */
  private static async playSharpen(refs: BattleStageRefs, launch: Point) {
    const { fxEl, launchEl } = refs;
    const r = Fx.rect(launchEl);
    const size = Math.max(Math.min(r.width, r.height) * 0.75, 44);
    const cube = Fx.box(size, size, 'filter:drop-shadow(0 0 4px #FFFFFF) drop-shadow(0 0 2px #707078)');
    // An isometric cube: top, left and right faces.
    cube.innerHTML =
      '<svg viewBox="0 0 100 100" width="100%" height="100%" style="display:block">' +
      '<polygon points="50,6 92,28 50,50 8,28" fill="#FFFFFF" stroke="#8A8A94" stroke-width="3"/>' +
      '<polygon points="8,28 50,50 50,96 8,72" fill="#D8D8E0" stroke="#8A8A94" stroke-width="3"/>' +
      '<polygon points="92,28 50,50 50,96 92,72" fill="#B0B0BC" stroke="#8A8A94" stroke-width="3"/></svg>';
    await Promise.all([
      Fx.glow(launchEl, 'grayscale(1) brightness(1.15) contrast(1.2)', 1000),
      Fx.spawn(fxEl, cube, launch, [
        { transform: 'scale(.2)', opacity: 0 },
        { transform: 'scale(1)', opacity: 0.95, offset: 0.45 },
        { transform: 'scale(1)', opacity: 0.95, offset: 0.75 },
        { transform: 'scale(1.1)', opacity: 0 }
      ], { duration: 1000, easing: 'ease-out' }),
      Fx.spawn(fxEl, FxGlyphs.sparkStar(size * 0.5, '#FFFFFF'), { x: launch.x + size * 0.32, y: launch.y - size * 0.24 }, [
        { transform: 'scale(0) rotate(0deg)', opacity: 0 },
        { transform: 'scale(1) rotate(30deg)', opacity: 1, offset: 0.5 },
        { transform: 'scale(0) rotate(60deg)', opacity: 0 }
      ], { duration: 300, delay: 450, easing: 'ease-in-out' })
    ]);
    await FxEffects.statUpAura(refs, launch);
  }

  /**
   * Metronome, after the Gen 4 animation:
   * - Gen 4: https://www.pokewiki.de/images/7/79/Metronom_Gen4.png
   * - Gen 5: https://www.pokewiki.de/images/9/9d/Metronom_Gen5.png
   *
   * A white glove pops up beside the user's head (0-0.2 s) and wags its
   * finger like a metronome, four ticks (0.2-1.4 s); a glint flashes on the
   * fingertip and the glove fades (1.4-1.65 s). The called move plays after.
   */
  private static async playMetronome(refs: BattleStageRefs, launch: Point, v: MoveVisual) {
    const { fxEl, launchEl } = refs;
    const r = Fx.rect(launchEl);
    const w = Math.max(r.width * 0.3, 24);
    const at: Point = { x: launch.x + v.dir * r.width * 0.45, y: launch.y - r.height * 0.25 };
    const hand = FxGlyphs.pointingHandGlyph(w);
    hand.style.transformOrigin = '50% 100%';
    Fx.place(hand, at);
    fxEl.appendChild(hand);
    const frames: Keyframe[] = [
      { transform: 'rotate(0deg) scale(0)', opacity: 0, offset: 0 },
      { transform: 'rotate(0deg) scale(1)', opacity: 1, offset: 0.12 }
    ];
    for (let k = 0; k < 4; k++) {
      frames.push({ transform: `rotate(${k % 2 ? 28 : -28}deg) scale(1)`, opacity: 1, offset: 0.12 + ((k + 0.5) / 4) * 0.73 });
    }
    frames.push({ transform: 'rotate(0deg) scale(1)', opacity: 1, offset: 0.85 }, { transform: 'rotate(0deg) scale(.9)', opacity: 0, offset: 1 });
    const wag = Fx.anim(hand, frames, { duration: 1650, easing: 'ease-in-out' }).then(() => hand.remove());
    await Fx.wait(1400);
    await Promise.all([
      wag,
      Fx.spawn(fxEl, FxGlyphs.sparkStar(16, '#ffffff'), { x: at.x, y: at.y - w * 0.75 }, [
        { transform: 'scale(0) rotate(0deg)', opacity: 0 },
        { transform: 'scale(1.2) rotate(45deg)', opacity: 1, offset: 0.4 },
        { transform: 'scale(0) rotate(90deg)', opacity: 0 }
      ], { duration: 280, easing: 'ease-out' })
    ]);
  }

  /**
   * Minimize, after the Gen 4 / Gen 5 animation:
   * - Gen 4: https://www.pokewiki.de/images/c/ce/Komprimator_Gen4.png
   * - Gen 5: https://www.pokewiki.de/images/0/0a/Komprimator_Gen5.png
   *
   * The user shrinks to a speck where it stands (0-0.35 s), stays tiny
   * (to 0.9 s), pops back to full size with a little bounce (0.9-1.15 s),
   * then the stat-up aura plays (its evasion rises, 1.15-1.95 s).
   */
  private static async playMinimize(refs: BattleStageRefs, launch: Point) {
    const { launchEl } = refs;
    const origin = launchEl.style.transformOrigin;
    const base = launchEl.style.transform;
    launchEl.style.transformOrigin = 'center bottom';
    await Fx.anim(launchEl, [
      { transform: `${base} scale(1)` },
      { transform: `${base} scale(.08)`, offset: 0.3 },
      { transform: `${base} scale(.08)`, offset: 0.78 },
      { transform: `${base} scale(1.12)`, offset: 0.92 },
      { transform: `${base} scale(1)` }
    ], { duration: 1150, easing: 'ease-in-out', fill: 'none' });
    launchEl.style.transformOrigin = origin;
    await FxEffects.statUpAura(refs, launch);
  }

  /**
   * Defense Curl, after the Gen 4 / Gen 5 animation:
   * - Gen 4: https://www.pokewiki.de/images/a/ab/Einigler_Gen4.png
   * - Gen 5: https://www.pokewiki.de/images/6/6a/Einigler_Gen5.png
   *
   * The user curls up (squashes down, 0-0.25 s) and a see-through blue
   * sphere swells round it (0.15-0.45 s); white sparkles twinkle on the
   * sphere (0.45-0.9 s), then it fades and the user uncurls (0.9-1.1 s).
   * Last, orange stat-up bands scroll up over the user (1.1-1.9 s).
   */
  private static async playDefenseCurl(refs: BattleStageRefs, launch: Point) {
    const { fxEl, launchEl } = refs;
    const r = Fx.rect(launchEl);
    const base = launchEl.style.transform;
    const origin = launchEl.style.transformOrigin;
    launchEl.style.transformOrigin = 'center bottom';
    const curl = Fx.anim(launchEl, [
      { transform: `${base} scale(1,1)` },
      { transform: `${base} scale(1.06,.86)`, offset: 0.23 },
      { transform: `${base} scale(1.06,.86)`, offset: 0.82 },
      { transform: `${base} scale(1,1)` }
    ], { duration: 1100, easing: 'ease-in-out', fill: 'none' }).then(() => { launchEl.style.transformOrigin = origin; });

    const size = Math.max(r.width, r.height) * 1.05;
    const at: Point = { x: launch.x, y: launch.y + r.height * 0.06 };
    const sphere = Fx.box(size, size, 'border-radius:50%;border:2px solid #E8F6FFcc;background:radial-gradient(circle at 32% 28%,#ffffffcc 0 10%,transparent 16%),radial-gradient(circle at 50% 50%,#6AB8FF22 45%,#3A88F088 85%,#2A68D0aa);box-shadow:0 0 10px #8FD0FF99,inset 0 0 12px #A8DCFF88');
    const effects: Promise<void>[] = [
      curl,
      Fx.spawn(fxEl, sphere, at, [
        { transform: 'scale(.3)', opacity: 0, offset: 0 },
        { transform: 'scale(.3)', opacity: 0, offset: 0.16 },
        { transform: 'scale(1)', opacity: 0.9, offset: 0.48 },
        { transform: 'scale(1.03)', opacity: 0.9, offset: 0.85 },
        { transform: 'scale(1.08)', opacity: 0 }
      ], { duration: 1100, easing: 'ease-out' })
    ];
    for (let i = 0; i < 7; i++) {
      const a = -Math.PI * (0.15 + Math.random() * 0.7);
      const d = size * (0.3 + Math.random() * 0.2);
      effects.push(
        Fx.spawn(fxEl, FxGlyphs.sparkStar(8 + Math.random() * 6, '#ffffff'), { x: at.x + Math.cos(a) * d, y: at.y + Math.sin(a) * d }, [
          { transform: 'scale(0) rotate(0deg)', opacity: 0 },
          { transform: 'scale(1) rotate(45deg)', opacity: 1, offset: 0.5 },
          { transform: 'scale(0) rotate(90deg)', opacity: 0 }
        ], { duration: 320, easing: 'ease-in-out', delay: 450 + i * 60 })
      );
    }
    await Promise.all(effects);
    await FxEffects.statUpAura(refs, launch);
  }

  /**
   * Focus Energy, after the Gen 4 / Gen 5 animation:
   * - Gen 4: https://www.pokewiki.de/images/3/32/Energiefokus_Gen4.png
   * - Gen 5: https://www.pokewiki.de/images/2/24/Energiefokus_Gen5.png
   *
   * Pillars of yellow light shoot up round the user one after another, one
   * white in the middle (0-1.0 s), while glowing yellow dots pop up at its
   * sides and float upward (0.15-1.15 s); the user glows faintly yellow.
   */
  private static async playFocusEnergy(refs: BattleStageRefs, launch: Point) {
    const { fieldEl, fxEl, launchEl } = refs;
    const r = Fx.rect(launchEl);
    const foot = Fx.footOf(launchEl, fieldEl);
    const h = Math.max(r.height * 1.3, 90);
    const effects: Promise<void>[] = [Fx.glow(launchEl, 'brightness(1.2) drop-shadow(0 0 6px #FFE04A)', 1100)];
    const pillars = 9;
    for (let i = 0; i < pillars; i++) {
      const centre = i === Math.floor(pillars / 2);
      const pw = centre ? 10 : 5 + Math.random() * 5;
      const x = centre ? launch.x : launch.x + (Math.random() * 2 - 1) * r.width * 0.45;
      const tone = centre ? '#ffffff' : '#FFE84A';
      const pillar = Fx.box(pw, h, `border-radius:${pw}px;background:linear-gradient(0deg,${tone}00,${tone}dd 25%,${tone} 55%,${tone}00);box-shadow:0 0 8px ${tone};transform-origin:50% 100%`);
      effects.push(
        Fx.spawn(fxEl, pillar, { x, y: foot.y - h / 2 }, [
          { transform: 'translateY(0) scaleY(0)', opacity: 0 },
          { transform: 'translateY(0) scaleY(1)', opacity: 1, offset: 0.4 },
          { transform: `translateY(${-h * 0.3}px) scaleY(.6)`, opacity: 0 }
        ], { duration: 420, easing: 'ease-out', delay: centre ? 300 : (i / pillars) * 600 + Math.random() * 80 })
      );
    }
    for (let i = 0; i < 12; i++) {
      const side = i % 2 ? 1 : -1;
      const s = 6 + Math.random() * 5;
      const at: Point = { x: launch.x + side * r.width * (0.3 + Math.random() * 0.25), y: foot.y - Math.random() * r.height * 0.5 };
      effects.push(
        Fx.spawn(fxEl, Fx.box(s, s, 'border-radius:50%;background:radial-gradient(circle,#FFFDE0,#FFE040 55%,#FFC80000);box-shadow:0 0 6px #FFE040'), at, [
          { transform: 'translateY(0) scale(0)', opacity: 0 },
          { transform: 'translateY(-6px) scale(1.2)', opacity: 1, offset: 0.3 },
          { transform: `translateY(${-r.height * 0.4}px) scale(.6)`, opacity: 0 }
        ], { duration: 550, easing: 'ease-out', delay: 150 + i * 40 })
      );
    }
    await Promise.all(effects);
  }

  /**
   * Growth, after the Gen 4 / Gen 5 animation:
   * - Gen 4: https://www.pokewiki.de/images/a/a5/Wachstum_Gen4.png
   * - Gen 5: https://www.pokewiki.de/images/b/bf/Wachstum_Gen5.png
   *
   * The user glows a soft green and stretches up taller from its feet
   * (0-0.45 s), holds (to 0.6 s) and settles back (0.6-0.8 s); then orange
   * stat-up bands scroll up over it (0.8-1.6 s).
   */
  private static async playGrowth(refs: BattleStageRefs, launch: Point) {
    const { launchEl } = refs;
    const base = launchEl.style.transform;
    const origin = launchEl.style.transformOrigin;
    launchEl.style.transformOrigin = 'center bottom';
    await Promise.all([
      Fx.anim(launchEl, [
        { transform: `${base} scale(1,1)` },
        { transform: `${base} scale(1.08,1.18)`, offset: 0.56 },
        { transform: `${base} scale(1.08,1.18)`, offset: 0.75 },
        { transform: `${base} scale(1,1)` }
      ], { duration: 800, easing: 'ease-in-out', fill: 'none' }),
      Fx.glow(launchEl, 'brightness(1.15) drop-shadow(0 0 7px #8AE85A)', 800)
    ]);
    launchEl.style.transformOrigin = origin;
    await FxEffects.statUpAura(refs, launch);
  }

  /**
   * Harden, after the Gen 4 / Gen 5 animation:
   * - Gen 4: https://www.pokewiki.de/images/0/06/H%C3%A4rtner_Gen4.png
   * - Gen 5: https://www.pokewiki.de/images/1/11/H%C3%A4rtner_Gen5.png
   *
   * The user turns hard, pale steel grey (0-0.8 s) while white glints flash
   * on its edges one after another (0.15-0.7 s); then orange stat-up bands
   * scroll up over it (0.8-1.6 s).
   */
  private static async playHarden(refs: BattleStageRefs, launch: Point) {
    const { fxEl, launchEl } = refs;
    const r = Fx.rect(launchEl);
    const effects: Promise<void>[] = [Fx.glow(launchEl, 'grayscale(1) brightness(1.25) contrast(1.5) drop-shadow(0 0 3px #ffffff)', 800)];
    const spots: Point[] = [
      { x: -0.35, y: -0.3 },
      { x: 0.35, y: -0.05 },
      { x: -0.15, y: 0.3 }
    ];
    spots.forEach((p, i) => {
      effects.push(
        Fx.spawn(fxEl, FxGlyphs.sparkStar(Math.max(r.width * 0.3, 20), '#ffffff'), { x: launch.x + p.x * r.width, y: launch.y + p.y * r.height }, [
          { transform: 'scale(0) rotate(0deg)', opacity: 0 },
          { transform: 'scale(1) rotate(45deg)', opacity: 1, offset: 0.5 },
          { transform: 'scale(0) rotate(90deg)', opacity: 0 }
        ], { duration: 260, easing: 'ease-in-out', delay: 150 + i * 160 })
      );
    });
    await Promise.all(effects);
    await FxEffects.statUpAura(refs, launch);
  }

  /**
   * Conversion, after the Gen 4 / Gen 5 animation:
   * - Gen 4: https://www.pokewiki.de/images/c/c3/Umwandlung_Gen4.png
   * - Gen 5: https://www.pokewiki.de/images/e/eb/Umwandlung_Gen5.png
   *
   * Pastel squares (pink, lilac, sky blue, white) blink on and off all over
   * the user like pixels being rewritten (0-1.1 s) while it flickers, then the
   * last ones fade (to ~1.3 s).
   */
  private static async playConversion(refs: BattleStageRefs, launch: Point) {
    const { fxEl, launchEl } = refs;
    const r = Fx.rect(launchEl);
    const colors = ['#F8C8D8', '#D8C8F8', '#C8E0F8', '#FFFFFF', '#F0B8C8'];
    const base = Math.max(r.width * 0.16, 12);
    const pixels: Promise<void>[] = [];
    for (let i = 0; i < 26; i++) {
      const s = base * (0.6 + Math.random() * 0.8);
      const c = colors[i % colors.length];
      const at: Point = {
        x: launch.x + (Math.random() * 2 - 1) * r.width * 0.42,
        y: launch.y + (Math.random() * 2 - 1) * r.height * 0.42
      };
      pixels.push(
        Fx.spawn(fxEl, Fx.box(s, s, `background:${c};opacity:.9;box-shadow:0 0 3px ${c}`), at, [
          { opacity: 0 },
          { opacity: 0.9, offset: 0.15 },
          { opacity: 0.2, offset: 0.45 },
          { opacity: 0.9, offset: 0.65 },
          { opacity: 0 }
        ], { duration: 360 + Math.random() * 160, easing: 'steps(4, end)', delay: (i / 26) * 800 + Math.random() * 120 })
      );
    }
    const flicker = Fx.anim(launchEl, [
      { opacity: 1 },
      { opacity: 0.6, offset: 0.2 },
      { opacity: 1, offset: 0.35 },
      { opacity: 0.55, offset: 0.55 },
      { opacity: 1, offset: 0.7 },
      { opacity: 0.7, offset: 0.85 },
      { opacity: 1 }
    ], { duration: 1100, easing: 'steps(6, end)', fill: 'none' });
    await Promise.all([flicker, ...pixels]);
  }

  /**
   * Follow Me: a white glove with its index finger up whirls twice round the
   * user (0-1.0 s; smaller and dimmer while it passes behind), then rises
   * above the user's head and wags its finger four times (1.2-2.1 s).
   */
  private static async playFollowMe(refs: BattleStageRefs, launch: Point) {
    const { fxEl, launchEl } = refs;
    const r = Fx.rect(launchEl);
    const w = Math.max(r.width * 0.32, 26);
    const hand = FxGlyphs.pointingHandGlyph(w);
    Fx.place(hand, launch);
    fxEl.appendChild(hand);

    // 1. Two laps round the user on a flat ellipse; the back half reads as further away.
    const rx = Math.max(r.width * 0.65, 40);
    const ry = Math.max(r.height * 0.18, 12);
    const steps = 24;
    const laps: Keyframe[] = [];
    for (let k = 0; k <= steps; k++) {
      const a = (k / steps) * Math.PI * 4;
      const depth = (1 + Math.cos(a)) / 2; // 1 = in front, 0 = behind
      laps.push({
        transform: `translate(${Math.sin(a) * rx}px,${Math.cos(a) * ry}px) scale(${0.7 + 0.3 * depth})`,
        opacity: k === 0 ? 0 : 0.55 + 0.45 * depth
      });
    }
    await Fx.anim(hand, laps, { duration: 1000, easing: 'linear' });

    // 2. Up above the head, then the finger wags.
    const up = -r.height * 0.5 - w * 0.6;
    await Fx.anim(hand, [{ transform: 'translate(0,0) scale(1)' }, { transform: `translate(0,${up}px) scale(1)` }], {
      duration: 200,
      easing: 'ease-out',
      fill: 'forwards'
    });
    hand.style.transformOrigin = '50% 100%';
    const wag: Keyframe[] = [{ transform: `translate(0,${up}px) rotate(0deg)` }];
    for (let i = 0; i < 4; i++) {
      wag.push({ transform: `translate(0,${up}px) rotate(-18deg)` }, { transform: `translate(0,${up}px) rotate(18deg)` });
    }
    wag.push({ transform: `translate(0,${up}px) rotate(0deg)` });
    await Fx.anim(hand, wag, { duration: 900, easing: 'ease-in-out' });
    await Fx.anim(hand, [{ opacity: 1 }, { opacity: 0 }], { duration: 200, easing: 'ease-in' });
    hand.remove();
  }

  /** Particle colours of Protect's barrier: green, white, light blue. */
  private static readonly PROTECT_COLORS = ['#86E8A8', '#FFFFFF', '#8FD0FF', '#B8F0D0', '#CFE8FF'];

  /**
   * Protect: a barrier of tightly packed green, white and light-blue
   * particles gathers over the caster, shimmers for a moment, then breaks up.
   */
  private static async playProtect(refs: BattleStageRefs, launch: Point) {
    const { fxEl, launchEl } = refs;
    const r = Fx.rect(launchEl);
    const rx = Math.max(r.width * 0.58, 36);
    const ry = Math.max(r.height * 0.5, 32);
    const colors = NormalStatusMoveAnimations.PROTECT_COLORS;
    const hold = 1100;

    const parts: Promise<void>[] = [];
    for (let i = 0; i < 80; i++) {
      // Spread evenly over an ellipse round the caster.
      const ang = Math.random() * Math.PI * 2;
      const d = Math.sqrt(Math.random());
      const at = { x: launch.x + Math.cos(ang) * d * rx, y: launch.y + Math.sin(ang) * d * ry };
      const s = 5 + Math.random() * 7;
      const c = colors[i % colors.length];
      const p = document.createElement('div');
      p.style.cssText = `position:absolute;width:${s}px;height:${s}px;border-radius:${s * 0.3}px;pointer-events:none;background:${c};box-shadow:0 0 ${s * 0.8}px ${c};opacity:0`;
      Fx.place(p, at);
      fxEl.appendChild(p);
      // Gather in from slightly outside, shimmer in place, then scatter outward.
      const inX = Math.cos(ang) * rx * 0.25;
      const inY = Math.sin(ang) * ry * 0.25;
      const jx = (Math.random() * 2 - 1) * 2;
      const jy = (Math.random() * 2 - 1) * 2;
      parts.push(
        Fx.anim(p, [
          { transform: `translate(${inX}px,${inY}px) scale(.3)`, opacity: 0 },
          { transform: 'translate(0,0) scale(1)', opacity: 0.9, offset: 0.2 },
          { transform: `translate(${jx}px,${jy}px) scale(.8)`, opacity: 0.55, offset: 0.4 },
          { transform: 'translate(0,0) scale(1.05)', opacity: 0.95, offset: 0.6 },
          { transform: `translate(${-jx}px,${-jy}px) scale(.85)`, opacity: 0.6, offset: 0.78 },
          { transform: `translate(${inX * 1.4}px,${inY * 1.4}px) scale(.4)`, opacity: 0 }
        ], { duration: hold, easing: 'ease-in-out', delay: Math.random() * 180 }).then(() => p.remove())
      );
    }
    await Promise.all(parts);
  }

  /**
   * Sleep Talk: pale blue rings pulse out round the sleeping caster while blue
   * "Z"s float up from its head (0 - 1.1 s); then it lunges at the foe like a
   * tackle and a yellow burst lands on the target (~1.27 s).
   */
  private static async playSleepTalk(refs: BattleStageRefs, launch: Point, target: Point, v: MoveVisual) {
    const { fieldEl, fxEl, launchEl, targetEl } = refs;
    const r = Fx.rect(launchEl);
    const f = Fx.rect(fieldEl);

    // Phase 1: rings and Zs.
    const effects: Promise<void>[] = [];
    const ring = Math.max(r.width, r.height) * 0.9;
    for (let i = 0; i < 3; i++) {
      const c = document.createElement('div');
      c.style.cssText = `width:${ring}px;height:${ring}px;border-radius:50%;pointer-events:none;border:3px solid #BFE4FFcc;background:radial-gradient(circle,#9CD4FF00 55%,#9CD4FF44 72%,#9CD4FF00 76%);box-shadow:0 0 8px #9CD4FF88`;
      Fx.place(c, launch);
      fxEl.appendChild(c);
      effects.push(
        Fx.anim(c, [
          { transform: 'scale(.4)', opacity: 0 },
          { transform: 'scale(.8)', opacity: 0.9, offset: 0.35 },
          { transform: 'scale(1.25)', opacity: 0 }
        ], { duration: 750, delay: i * 220, easing: 'ease-out' }).then(() => c.remove())
      );
    }
    const away = -v.dir;
    const head: Point = { x: launch.x + away * r.width * 0.15, y: r.top - f.top + r.height * 0.2 };
    effects.push(FxEffects.sleepZs(fxEl, head, away, ['#8FC8FF', '#BFE0FF']));
    await Fx.wait(1100);

    // Phase 2: a tackle-like lunge at the foe.
    const original = launchEl.style.transform;
    await Fx.anim(launchEl, [
      { transform: `${original} translateX(${v.dir * -10}px)` },
      { transform: `${original} translateX(${v.dir * 42}px)` }
    ], { duration: 170, easing: 'ease-in' });

    // Phase 3: yellow hit on the target.
    const tr = Fx.rect(targetEl);
    const size = Math.max(tr.width * 0.7, 52);
    const burst = FxGlyphs.spikyBurst(size, '#FFD83A', '#FFF3A0', '#ffffff');
    Fx.place(burst, target);
    fxEl.appendChild(burst);
    effects.push(
      Fx.anim(burst, [
        { transform: 'scale(.3)', opacity: 1 },
        { transform: 'scale(1.1)', opacity: 1, offset: 0.35 },
        { transform: 'scale(1.25)', opacity: 0 }
      ], { duration: 420, easing: 'ease-out' }).then(() => burst.remove())
    );
    for (let i = 0; i < 8; i++) {
      const star = FxGlyphs.sparkStar(8 + Math.random() * 8, '#FFE04A');
      Fx.place(star, target);
      fxEl.appendChild(star);
      const ang = Math.random() * Math.PI * 2;
      const dist = size * (0.45 + Math.random() * 0.4);
      effects.push(
        Fx.anim(star, [
          { transform: 'translate(0,0) scale(.3)', opacity: 1 },
          { transform: `translate(${Math.cos(ang) * dist}px,${Math.sin(ang) * dist}px) scale(1) rotate(60deg)`, opacity: 0 }
        ], { duration: 450 + Math.random() * 150, easing: 'ease-out' }).then(() => star.remove())
      );
    }
    Fx.flash(targetEl, '#FFE04A', 0.7);
    Fx.shake(targetEl, 6);
    await Fx.anim(launchEl, [{ transform: `${original} translateX(${v.dir * 42}px)` }, { transform: original }], {
      duration: 110,
      easing: 'ease-out'
    });
    launchEl.style.transform = original;
    await Promise.all(effects);
  }

  /** Pain Split: the same orange hit bursts strike the caster and the target at once. */
  private static async playPainSplit(refs: BattleStageRefs, launch: Point, target: Point) {
    await Promise.all([
      NormalStatusMoveAnimations.painBursts(refs.fxEl, refs.launchEl, launch),
      NormalStatusMoveAnimations.painBursts(refs.fxEl, refs.targetEl, target)
    ]);
  }

  /** Three orange spiky bursts, each with a white ring, pop on one Pokémon as it flashes and shakes. */
  private static async painBursts(fxEl: HTMLElement, el: HTMLElement, at: Point): Promise<void> {
    const r = Fx.rect(el);
    const size = Math.max(r.width * 0.75, 56);
    const pops: Promise<void>[] = [];
    for (let i = 0; i < 3; i++) {
      await Fx.wait(i ? 230 : 0);
      const p = { x: at.x + (Math.random() * 2 - 1) * r.width * 0.2, y: at.y + (Math.random() * 2 - 1) * r.height * 0.2 };
      const burst = FxGlyphs.spikyBurst(size, '#FF7A1A', '#FFB040', '#FFF6E0');
      const ring = document.createElement('div');
      const rs = size * 0.5;
      ring.style.cssText = `position:absolute;width:${rs}px;height:${rs}px;border-radius:50%;pointer-events:none;border:${Math.max(rs * 0.12, 3)}px dashed #ffffff;box-shadow:0 0 4px #ffffffaa`;
      for (const e of [burst, ring]) {
        Fx.place(e, p);
        fxEl.appendChild(e);
      }
      pops.push(
        Fx.anim(burst, [
          { transform: 'scale(.3) rotate(0deg)', opacity: 1 },
          { transform: 'scale(1) rotate(12deg)', opacity: 1, offset: 0.4 },
          { transform: 'scale(1.1) rotate(18deg)', opacity: 0 }
        ], { duration: 420, easing: 'ease-out' }).then(() => burst.remove()),
        Fx.anim(ring, [
          { transform: 'scale(.4) rotate(0deg)', opacity: 1 },
          { transform: 'scale(1.3) rotate(40deg)', opacity: 0 }
        ], { duration: 420, easing: 'ease-out' }).then(() => ring.remove())
      );
      Fx.flash(el, '#FF9A3A', 0.6);
      Fx.shake(el, 4);
    }
    await Promise.all(pops);
  }

  /**
   * Swords Dance: six teal swords appear and dance round the caster on a
   * ring while cyan sparkles twinkle, then fade; orange stat-up sparkles
   * drift down over the caster.
   */
  private static async playSwordsDance(refs: BattleStageRefs, launch: Point) {
    const { fieldEl, fxEl, launchEl } = refs;
    const r = Fx.rect(launchEl);
    const f = Fx.rect(fieldEl);
    const rx = Math.max(r.width * 0.65, 46);
    const ry = Math.max(r.height * 0.2, 14);
    const centre: Point = { x: launch.x, y: launch.y + r.height * 0.05 };
    const swordH = Math.max(r.height * 0.75, 56);
    const count = 6;
    const dance = 1200;

    // 1. Swords pop in (0-0.25 s), circle once with a bob (0.25-1.45 s), fade (1.45-1.7 s).
    const swords = Array.from({ length: count }, (_, i) => {
      const sword = FxGlyphs.swordGlyph(swordH);
      Fx.place(sword, centre);
      fxEl.appendChild(sword);
      return { sword, a0: (Math.PI * 2 * i) / count };
    });
    const at = (a: number, bob: number) => {
      // Lower on the ring = nearer the viewer: a touch bigger and brighter.
      const near = Math.sin(a);
      return { transform: `translate(${Math.cos(a) * rx}px,${near * ry + bob}px) scale(${0.85 + 0.15 * near})`, opacity: 0.75 + 0.25 * near };
    };
    await Promise.all(
      swords.map(({ sword, a0 }) =>
        Fx.anim(sword, [{ ...at(a0, -20), opacity: 0 }, at(a0, 0)], { duration: 250, easing: 'ease-out', fill: 'forwards' })
      )
    );
    const steps = 24;
    const danced = swords.map(({ sword, a0 }, i) => {
      const frames: Keyframe[] = [];
      for (let k = 0; k <= steps; k++) {
        const t = k / steps;
        frames.push(at(a0 + t * Math.PI * 2, Math.sin(t * Math.PI * 4 + i) * 5));
      }
      return Fx.anim(sword, frames, { duration: dance, easing: 'ease-in-out', fill: 'forwards' });
    });
    // Cyan sparkles twinkle round the ring while the swords dance.
    for (let i = 0; i < 16; i++) {
      const star = FxGlyphs.sparkStar(9 + Math.random() * 9, i % 3 ? '#7FF0F0' : '#ffffff');
      Fx.place(star, {
        x: centre.x + (Math.random() * 2 - 1) * rx * 1.1,
        y: r.top - f.top + Math.random() * r.height
      });
      fxEl.appendChild(star);
      Fx.anim(star, [
        { transform: 'scale(0) rotate(0deg)', opacity: 0 },
        { transform: 'scale(1.2) rotate(45deg)', opacity: 1, offset: 0.4 },
        { transform: 'scale(0) rotate(90deg)', opacity: 0 }
      ], { duration: 500, easing: 'ease-out', delay: Math.random() * (dance - 400) }).then(() => star.remove());
    }
    await Promise.all(danced);
    await Promise.all(
      swords.map(({ sword }) => Fx.anim(sword, [{ opacity: 1 }, { opacity: 0 }], { duration: 250, easing: 'ease-in' }).then(() => sword.remove()))
    );

    // 2. Attack up (1.7 s): orange stat sparkles.
    await FxEffects.orangeSparkles(refs, launch, r.top - f.top);
  }

  /**
   * Belly Drum: two dark hands drum on the caster's belly, faster and faster,
   * and each beat sends a white music-note bubble floating up; then orange
   * stat-up sparkles drift down over it.
   */
  private static async playBellyDrum(refs: BattleStageRefs, launch: Point) {
    const { fieldEl, fxEl, launchEl } = refs;
    const r = Fx.rect(launchEl);
    const top = r.top - Fx.rect(fieldEl).top;
    const belly: Point = { x: launch.x, y: launch.y + r.height * 0.12 };
    const head: Point = { x: launch.x, y: top + r.height * 0.15 };
    const hw = Math.max(r.width * 0.3, 28);

    // Two hands, tilted toward the belly, one on each side.
    const hands = [-1, 1].map((side) => {
      const hand = FxGlyphs.gloveGlyph(hw, '#4A4A54', '#18181E');
      Fx.place(hand, { x: belly.x + side * hw * 0.55, y: belly.y });
      fxEl.appendChild(hand);
      Fx.anim(hand, [{ transform: `rotate(${side * 30}deg)`, opacity: 0 }, { transform: `rotate(${side * 30}deg)`, opacity: 1 }], { duration: 120, fill: 'forwards' });
      return { hand, side };
    });

    // 1. Six beats, speeding up (0-0.63 s): a hand pats in, a note bubble floats up.
    const beats = [0, 0.17, 0.31, 0.43, 0.53, 0.63];
    const notes: Promise<void>[] = [];
    for (let i = 0; i < beats.length; i++) {
      await Fx.wait((beats[i] - (beats[i - 1] ?? 0)) * 1000);
      const { hand, side } = hands[i % 2];
      Fx.anim(hand, [
        { transform: `rotate(${side * 30}deg) translate(0,0)` },
        { transform: `rotate(${side * 30}deg) translate(${-side * 5}px,6px) scale(1.05,.9)`, offset: 0.4 },
        { transform: `rotate(${side * 30}deg) translate(0,0)` }
      ], { duration: 110, easing: 'ease-out', fill: 'forwards' });
      Fx.shake(launchEl, 2);
      const bubble = FxGlyphs.noteBubble(Math.max(r.width * 0.2, 20), i % 2 ? '♫' : '♪');
      Fx.place(bubble, { x: head.x + (Math.random() * 2 - 1) * r.width * 0.25, y: head.y });
      fxEl.appendChild(bubble);
      const drift = (Math.random() * 2 - 1) * 24;
      notes.push(
        Fx.anim(bubble, [
          { transform: 'translate(0,0) scale(.3)', opacity: 0 },
          { transform: `translate(${drift * 0.4}px,-14px) scale(1)`, opacity: 1, offset: 0.3 },
          { transform: `translate(${drift}px,-44px) scale(1.05)`, opacity: 0 }
        ], { duration: 700, easing: 'ease-out' }).then(() => bubble.remove())
      );
    }

    // 2. Hands fade (0.75-0.95 s), notes finish, then Attack up (from ~0.95 s).
    await Fx.wait(120);
    await Promise.all(
      hands.map(({ hand }) => Fx.anim(hand, [{ opacity: 1 }, { opacity: 0 }], { duration: 200, easing: 'ease-in' }).then(() => hand.remove()))
    );
    await FxEffects.orangeSparkles(refs, launch, top);
    await Promise.all(notes);
  }

  /**
   * Baton Pass: a red baton is tossed up from the caster, spinning, and falls
   * back into a white glove that rises to catch it. (The switch itself is
   * the battle flow's job.)
   */
  private static async playBatonPass(refs: BattleStageRefs, launch: Point) {
    const { fieldEl, fxEl, launchEl } = refs;
    const r = Fx.rect(launchEl);
    const top = r.top - Fx.rect(fieldEl).top;
    const catchAt: Point = { x: launch.x, y: top + r.height * 0.2 };
    const bw = Math.max(r.width * 0.35, 30);
    const rise = Math.max(r.height * 0.9, 70);

    // 1. Toss (0-0.85 s): up, spinning, then down into the glove.
    const baton = FxGlyphs.batonGlyph(bw);
    Fx.place(baton, catchAt);
    fxEl.appendChild(baton);
    const toss = Fx.anim(baton, [
      { transform: 'translateY(10px) rotate(0deg)', opacity: 0, easing: 'ease-out' },
      { transform: 'translateY(0) rotate(60deg)', opacity: 1, offset: 0.1, easing: 'ease-out' },
      { transform: `translateY(${-rise}px) rotate(400deg)`, opacity: 1, offset: 0.5, easing: 'ease-in' },
      { transform: 'translateY(0) rotate(720deg)', opacity: 1 }
    ], { duration: 850, fill: 'forwards' });

    // The glove rises into place (0.45-0.7 s) to catch it.
    const glove = FxGlyphs.gloveGlyph(Math.max(r.width * 0.4, 34));
    Fx.place(glove, { x: catchAt.x, y: catchAt.y + bw * 0.3 });
    fxEl.appendChild(glove);
    await Fx.wait(450);
    await Fx.anim(glove, [
      { transform: 'translateY(16px) scale(.7)', opacity: 0 },
      { transform: 'translateY(0) scale(1)', opacity: 1 }
    ], { duration: 250, easing: 'ease-out', fill: 'forwards' });
    await toss;

    // 2. Catch (0.85 s): the glove dips with the weight, then both fade.
    Fx.flash(launchEl, '#ffffff', 0.3);
    await Fx.anim(glove, [
      { transform: 'translateY(0)' },
      { transform: 'translateY(6px)', offset: 0.4 },
      { transform: 'translateY(0)' }
    ], { duration: 220, easing: 'ease-out', fill: 'forwards' });
    await Fx.wait(200);
    await Promise.all(
      [baton, glove].map((el) => Fx.anim(el, [{ opacity: 1 }, { opacity: 0 }], { duration: 250, easing: 'ease-in' }).then(() => el.remove()))
    );
  }
}
