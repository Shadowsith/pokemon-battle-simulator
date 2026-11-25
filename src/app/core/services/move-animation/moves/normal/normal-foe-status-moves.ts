import { Point, BattleStageRefs, MoveAnimRegistry, MoveVisual } from '../../animation.types';
import { DIM_BACKDROP } from '../../animation.constants';
import { Fx } from '../../fx';
import { FxGlyphs } from '../../fx-glyphs';
import { FxEffects } from '../../fx-effects';
import { Attract } from './attract';
import { Block } from './block';
import { Conversion2 } from './conversion-2';
import { Foresight } from './foresight';
import { LockOn } from './lock-on';
import { MeanLook } from './mean-look';
import { MindReader } from './mind-reader';
import { ScaryFace } from './scary-face';
import { Sketch } from './sketch';
import { Swagger } from './swagger';
import { SweetScent } from './sweet-scent';
import { OdorSleuth } from './odor-sleuth';
import { TeeterDance } from './teeter-dance';
import { Tickle } from './tickle';

/** Hand-made animations for Normal-type status moves aimed at the foe (stat drops, sleep, disabling, forcing out, copying; Attract, Block, Conversion 2, Foresight, Lock-On, Mean Look, Mind Reader, Odor Sleuth, Scary Face, Sketch, Swagger, Sweet Scent, Teeter Dance and Tickle live in their own files). */
export class NormalFoeStatusMoveAnimations {
  /** By @pkmn/sim move id. */
  static readonly anims: MoveAnimRegistry = {
    attract: (refs, _launch, target) => Attract.play(refs, target),
    block: (refs, _launch, target) => Block.play(refs, target),
    conversion2: (refs, launch, target) => Conversion2.play(refs, launch, target),
    disable: (refs, _launch, target) => NormalFoeStatusMoveAnimations.playDisable(refs, target),
    encore: (refs, _launch, target) => NormalFoeStatusMoveAnimations.playEncore(refs, target),
    flash: (refs, launch, target) => NormalFoeStatusMoveAnimations.playFlash(refs, launch, target),
    foresight: (refs, _launch, target) => Foresight.play(refs, target),
    leer: (refs, launch, target, v) => NormalFoeStatusMoveAnimations.playLeer(refs, launch, target, v),
    lockon: (refs, _launch, target, v) => LockOn.play(refs, target, v),
    lovelykiss: (refs, _launch, target, v) => NormalFoeStatusMoveAnimations.playLovelyKiss(refs, target, v),
    meanlook: (refs, _launch, target) => MeanLook.play(refs, target),
    mimic: (refs, launch, target) => NormalFoeStatusMoveAnimations.playMimic(refs, launch, target),
    mindreader: (refs, _launch, target) => MindReader.play(refs, target),
    odorsleuth: (refs, launch, target, v) => OdorSleuth.play(refs, launch, target, v),
    scaryface: (refs, launch, target) => ScaryFace.play(refs, launch, target),
    sketch: (refs, _launch, target) => Sketch.play(refs, target),
    smokescreen: (refs, launch, target) => NormalFoeStatusMoveAnimations.playSmokescreen(refs, launch, target),
    swagger: (refs, _launch, target) => Swagger.play(refs, target),
    sweetscent: (refs, _launch, target) => SweetScent.play(refs, target),
    tailwhip: (refs, _launch, target) => NormalFoeStatusMoveAnimations.playTailWhip(refs, target),
    teeterdance: (refs, launch, target) => TeeterDance.play(refs, launch, target),
    tickle: (refs, _launch, target) => Tickle.play(refs, target),
    whirlwind: (refs, _launch, target, v) => NormalFoeStatusMoveAnimations.playWhirlwind(refs, target, v),
    yawn: (refs, launch, target) => NormalFoeStatusMoveAnimations.playYawn(refs, launch, target)
  };

  /**
   * Tail Whip, after the Gen 4 / Gen 5 animation:
   * - Gen 4: https://www.pokewiki.de/images/1/18/Rutenschlag_Gen4.png
   * - Gen 5: https://www.pokewiki.de/images/1/16/Rutenschlag_Gen5.png
   *
   * The user wags its tail: it sways side to side with little hops, four times
   * (0-0.8 s). Then the target turns blue under stat-down bubbles (0.85-1.75 s).
   */
  private static async playTailWhip(refs: BattleStageRefs, target: Point) {
    const { launchEl } = refs;
    const base = launchEl.style.transform;
    const sway = Math.max(Fx.rect(launchEl).width * 0.08, 6);
    const frames: Keyframe[] = [{ transform: `${base} translate(0,0)` }];
    for (let k = 0; k < 4; k++) {
      const side = k % 2 ? -1 : 1;
      frames.push(
        { transform: `${base} translate(${side * sway}px,-4px)`, offset: (k + 0.5) / 4 },
        { transform: `${base} translate(0,0)`, offset: (k + 1) / 4 }
      );
    }
    await Fx.anim(launchEl, frames, { duration: 800, easing: 'ease-in-out', fill: 'none' });
    await Fx.wait(50);
    await FxEffects.blueStatDrop(refs, target);
  }

  /**
   * Smokescreen, after the Gen 4 / Gen 5 animation:
   * - Gen 4: https://www.pokewiki.de/images/4/4d/Rauchwolke_Gen4.png
   * - Gen 5: https://www.pokewiki.de/images/b/bc/Rauchwolke_Gen5.png
   *
   * A puff of yellowish dust kicks up at the user's feet as it fires a black
   * smoke ball in a low arc at the target (0-0.4 s). The ball bursts into a
   * thick black smoke cloud over the target (0.4-1.15 s), then the target
   * turns blue under stat-down bubbles (1.15-2.05 s).
   */
  private static async playSmokescreen(refs: BattleStageRefs, launch: Point, target: Point) {
    const { fieldEl, fxEl, launchEl, targetEl } = refs;
    const lr = Fx.rect(launchEl);
    const tr = Fx.rect(targetEl);
    const dx = target.x - launch.x;
    const dy = target.y - launch.y;
    const lift = 30 + Math.abs(dx) * 0.08;
    const dust = FxEffects.smokePuff(fxEl, Fx.footOf(launchEl, fieldEl), Math.max(lr.width * 0.6, 44), ['#F4E08A', '#D8B850']);
    const size = Math.max(tr.width * 0.3, 22);
    const frames: Keyframe[] = [];
    for (let k = 0; k <= 8; k++) {
      const t = k / 8;
      frames.push({ transform: `translate(${dx * t}px,${dy * t - Math.sin(t * Math.PI) * lift}px) scale(${0.6 + t * 0.5})`, opacity: t === 0 ? 0 : 1 });
    }
    const ball = Fx.box(size, size, 'border-radius:50%;background:radial-gradient(circle at 35% 30%,#6A6A6A,#1A1A1A 55%,#000);box-shadow:0 0 6px #0008');
    await Fx.spawn(fxEl, ball, launch, frames, { duration: 400, easing: 'linear' });

    const w = Math.max(tr.width * 1.1, 70);
    const h = Math.max(tr.height * 0.9, 56);
    await Promise.all([dust, FxEffects.smokeCloud(fxEl, target, w, h, ['#3A3A3A', '#0A0A0A'], 14, 600, 150)]);
    await FxEffects.blueStatDrop(refs, target);
  }

  /**
   * Leer, after the Gen 4 / Gen 5 animation:
   * - Gen 4: https://www.pokewiki.de/images/0/03/Silberblick_Gen4.png
   * - Gen 5: https://www.pokewiki.de/images/c/c9/Silberblick_Gen5.png
   *
   * The scene goes dark (0-0.28 s) and a white glint flashes in the user's
   * eyes (0.3-0.65 s); the scene clears (0.65-0.95 s), then the target turns
   * blue under stat-down bubbles (its Defense falls, 0.95-1.85 s).
   */
  private static async playLeer(refs: BattleStageRefs, launch: Point, target: Point, v: MoveVisual) {
    const { fieldEl, fxEl, launchEl } = refs;
    const r = Fx.rect(launchEl);
    const dim = Fx.backdrop(fieldEl, DIM_BACKDROP);
    await Fx.anim(dim, [{ opacity: 0 }, { opacity: 1 }], { duration: 280, easing: 'ease-out' });
    const eye: Point = { x: launch.x + v.dir * r.width * 0.15, y: launch.y - r.height * 0.22 };
    await Fx.spawn(fxEl, FxGlyphs.sparkStar(Math.max(r.width * 0.32, 24), '#ffffff'), eye, [
      { transform: 'scale(0) rotate(0deg)', opacity: 0 },
      { transform: 'scale(1.2) rotate(45deg)', opacity: 1, offset: 0.4 },
      { transform: 'scale(.9) rotate(70deg)', opacity: 1, offset: 0.7 },
      { transform: 'scale(0) rotate(90deg)', opacity: 0 }
    ], { duration: 350, easing: 'ease-in-out' });
    await Fx.anim(dim, [{ opacity: 1 }, { opacity: 0 }], { duration: 300, easing: 'ease-in' });
    dim.remove();
    await FxEffects.blueStatDrop(refs, target);
  }

  /**
   * Lovely Kiss, after the Gen 4 / Gen 5 animation:
   * - Gen 4: https://www.pokewiki.de/images/9/96/Todeskuss_Gen4.png
   * - Gen 5: https://www.pokewiki.de/images/6/6a/Todeskuss_Gen5.png
   *
   * A big pink heart pops up on the target (0-0.3 s) and beats twice
   * (0.3-0.7 s), then bursts into small violet hearts that scatter and fade
   * (0.7-1.25 s); "Z"s rise from the target's head as it falls asleep
   * (1.1-~3.0 s).
   */
  private static async playLovelyKiss(refs: BattleStageRefs, target: Point, v: MoveVisual) {
    const { fxEl, targetEl } = refs;
    const r = Fx.rect(targetEl);
    const size = Math.max(r.width * 0.55, 40);
    await Fx.spawn(fxEl, FxGlyphs.musicNote(size, '#FF5AB4', '♥'), target, [
      { transform: 'scale(0)', opacity: 0 },
      { transform: 'scale(1.15)', opacity: 1, offset: 0.25 },
      { transform: 'scale(1)', opacity: 1, offset: 0.4 },
      { transform: 'scale(1.15)', opacity: 1, offset: 0.55 },
      { transform: 'scale(1)', opacity: 1, offset: 0.7 },
      { transform: 'scale(1.2)', opacity: 1, offset: 0.9 },
      { transform: 'scale(1.4)', opacity: 0 }
    ], { duration: 780, easing: 'ease-out' });
    Fx.flash(targetEl, '#FF8AD0', 0.5);
    const effects: Promise<void>[] = [];
    for (let i = 0; i < 7; i++) {
      const a = (Math.PI * 2 * i) / 7 + Math.random() * 0.4;
      const d = size * (0.6 + Math.random() * 0.4);
      effects.push(
        Fx.spawn(fxEl, FxGlyphs.musicNote(12 + Math.random() * 6, i % 2 ? '#C870F0' : '#FF8AD0', '♥'), target, [
          { transform: 'translate(0,0) scale(.4)', opacity: 1 },
          { transform: `translate(${Math.cos(a) * d * 0.7}px,${Math.sin(a) * d * 0.7}px) scale(1)`, opacity: 1, offset: 0.5 },
          { transform: `translate(${Math.cos(a) * d}px,${Math.sin(a) * d + 8}px) scale(.8)`, opacity: 0 }
        ], { duration: 550, easing: 'ease-out' })
      );
    }
    await Fx.wait(400);
    const head: Point = { x: target.x, y: target.y - r.height * 0.35 };
    effects.push(FxEffects.sleepZs(fxEl, head, -v.dir, ['#9C7CE8', '#B59CF2']));
    await Promise.all(effects);
  }

  /**
   * Mimic, after the Gen 4 / Gen 5 animation:
   * - Gen 4: https://www.pokewiki.de/images/f/f3/Mimikry_Gen4.png
   * - Gen 5: https://www.pokewiki.de/images/9/9d/Mimikry_Gen5.png
   *
   * A small yellow light rises out of the target (0-0.3 s) and floats to the
   * user on a gentle arc (0.3-0.9 s), where it swells into a big soft glow
   * while the user shines yellow (0.9-1.55 s).
   */
  private static async playMimic(refs: BattleStageRefs, launch: Point, target: Point) {
    const { fxEl, launchEl, targetEl } = refs;
    const lr = Fx.rect(launchEl);
    const s = 18;
    const light = Fx.box(s, s, 'border-radius:50%;background:radial-gradient(circle,#ffffff 0 20%,#FFF27A 45%,#F8C82000 72%);box-shadow:0 0 10px #FFE04A');
    Fx.place(light, target);
    fxEl.appendChild(light);
    Fx.glow(targetEl, 'brightness(1.3) drop-shadow(0 0 6px #FFE04A)', 400);
    const dx = launch.x - target.x;
    const dy = launch.y - target.y;
    const frames: Keyframe[] = [
      { transform: 'translate(0,0) scale(0)', opacity: 0, offset: 0 },
      { transform: 'translate(0,-12px) scale(1)', opacity: 1, offset: 0.33 }
    ];
    for (let k = 1; k <= 10; k++) {
      const t = k / 10;
      frames.push({ transform: `translate(${dx * t}px,${-12 + (dy + 12) * t - Math.sin(t * Math.PI) * 40}px) scale(1)`, opacity: 1, offset: 0.33 + t * 0.67 });
    }
    await Fx.anim(light, frames, { duration: 900, easing: 'linear' });
    light.remove();
    const size = Math.max(lr.width * 0.9, 64);
    await Promise.all([
      Fx.spawn(fxEl, Fx.box(size, size, 'border-radius:50%;background:radial-gradient(circle,#FFFDE0 0 15%,#FFF07Acc 40%,#F8D84A55 60%,#F8C82000 72%)'), launch, [
        { transform: 'scale(.2)', opacity: 0 },
        { transform: 'scale(1)', opacity: 1, offset: 0.4 },
        { transform: 'scale(1.1)', opacity: 0.8, offset: 0.7 },
        { transform: 'scale(1.2)', opacity: 0 }
      ], { duration: 650, easing: 'ease-out' }),
      Fx.glow(launchEl, 'sepia(.5) saturate(2) brightness(1.35) drop-shadow(0 0 8px #FFE04A)', 650)
    ]);
  }

  /**
   * Disable, after the Gen 4 / Gen 5 animation:
   * - Gen 4: https://www.pokewiki.de/images/3/38/Aussetzer_Gen4.png
   * - Gen 5: https://www.pokewiki.de/images/4/46/Aussetzer_Gen5.png
   *
   * A white sparkle glints on the target (0-0.35 s); then the scene greys
   * over and the target goes dull and dark, as if switched off (0.3-0.6 s,
   * held to 1.0 s), and both come back (1.0-1.3 s).
   */
  private static async playDisable(refs: BattleStageRefs, target: Point) {
    const { fieldEl, fxEl, targetEl } = refs;
    const r = Fx.rect(targetEl);
    const glint = Fx.spawn(fxEl, FxGlyphs.sparkStar(Math.max(r.width * 0.4, 28), '#ffffff'), { x: target.x - r.width * 0.15, y: target.y - r.height * 0.2 }, [
      { transform: 'scale(0) rotate(0deg)', opacity: 0 },
      { transform: 'scale(1.1) rotate(45deg)', opacity: 1, offset: 0.45 },
      { transform: 'scale(0) rotate(90deg)', opacity: 0 }
    ], { duration: 350, easing: 'ease-in-out' });
    await Fx.wait(300);
    const grey = Fx.backdrop(fieldEl, 'background:linear-gradient(180deg,#6A6A6E,#3A3A3E)');
    const dull = Fx.glow(targetEl, 'grayscale(1) brightness(.5)', 1000);
    await Fx.anim(grey, [
      { opacity: 0 },
      { opacity: 0.85, offset: 0.3 },
      { opacity: 0.85, offset: 0.7 },
      { opacity: 0 }
    ], { duration: 1000, easing: 'ease-in-out' });
    grey.remove();
    await Promise.all([glint, dull]);
  }

  /**
   * Flash, after the Gen 4 / Gen 5 animation:
   * - Gen 4: https://www.pokewiki.de/images/8/88/Blitz_Gen4.png
   * - Gen 5: https://www.pokewiki.de/images/b/b0/Blitz_Gen5.png
   *
   * A blinding white flash fills the scene and the user shows as a black
   * silhouette against it (0-0.5 s); then the target turns blue while blue
   * stat-down bubbles drift down over it (its accuracy falls, 0.55-1.45 s).
   */
  private static async playFlash(refs: BattleStageRefs, launch: Point, target: Point) {
    const { fieldEl, screenFxEl, launchEl } = refs;
    const white = Fx.backdrop(fieldEl, 'background:#ffffff');
    Fx.screenWash(screenFxEl, '#ffffff', 120, 260, launch.x > target.x ? '70%' : '30%');
    const silhouette = Fx.glow(launchEl, 'brightness(0)', 500);
    await Fx.anim(white, [
      { opacity: 0 },
      { opacity: 1, offset: 0.2 },
      { opacity: 1, offset: 0.6 },
      { opacity: 0 }
    ], { duration: 550, easing: 'ease-out' });
    white.remove();
    await silhouette;
    await FxEffects.blueStatDrop(refs, target);
  }

  /**
   * Yawn, after the DPPt animation: the user stretches up in a big yawn
   * (0-0.4 s); a stream of grey-white breath puffs floats over to the target,
   * wobbling and swelling, engulfs it and drifts on past (0.2-1.5 s); then a
   * drowsy bubble swells and shrinks at its face like slow breathing while
   * little rings rise off it and drift away, and it pops (1.4-2.6 s).
   */
  private static async playYawn(refs: BattleStageRefs, launch: Point, target: Point) {
    const { fxEl, launchEl, targetEl } = refs;
    const lr = Fx.rect(launchEl);
    const tr = Fx.rect(targetEl);

    // 1. The yawn: a stretch up and back down (no turning, the sprite keeps facing its foe).
    const original = launchEl.style.transform;
    const stretch = Fx.anim(launchEl, [
      { transform: `${original} translateY(0) scale(1,1)` },
      { transform: `${original} translateY(${-lr.height * 0.06}px) scale(.97,1.06)`, offset: 0.5 },
      { transform: `${original} translateY(0) scale(1,1)` }
    ], { duration: 400, easing: 'ease-in-out', fill: 'none' });

    // 2. The breath: puffs leave the user's mouth one after another and float past the target.
    const mouth: Point = { x: launch.x + (target.x - launch.x) * 0.1, y: launch.y - lr.height * 0.25 };
    const dx = target.x - mouth.x;
    const dy = target.y - mouth.y;
    const len = Math.max(Math.hypot(dx, dy), 1);
    const sx = -dy / len;
    const sy = dx / len;
    const breath: Promise<void>[] = [];
    for (let i = 0; i < 14; i++) {
      const s = Math.max(tr.width * (0.22 + Math.random() * 0.12), 18);
      const puff = document.createElement('div');
      puff.style.cssText = `position:absolute;width:${s}px;height:${s}px;border-radius:46% 54% 50% 50%;pointer-events:none;background:radial-gradient(circle at 40% 35%,#ffffff,#E4E6EE 50%,#C4C8D6cc 70%,#C4C8D600 74%)`;
      Fx.place(puff, mouth);
      fxEl.appendChild(puff);
      const frames: Keyframe[] = [];
      for (let k = 0; k <= 8; k++) {
        const t = k / 8;
        // On past the target by a third, wobbling sideways on the way.
        const f = t * 1.35;
        const wob = Math.sin(t * Math.PI * 2 + i * 0.9) * s * 0.5;
        frames.push({
          transform: `translate(${dx * f + sx * wob}px,${dy * f + sy * wob - t * 10}px) scale(${0.5 + t * 0.9})`,
          opacity: t === 0 ? 0 : t < 0.7 ? 0.9 : (1 - t) * 3
        });
      }
      breath.push(Fx.anim(puff, frames, { duration: 900, delay: 200 + i * 70, easing: 'linear', fill: 'backwards' }).then(() => puff.remove()));
    }
    setTimeout(() => Fx.flash(targetEl, '#E4E6EE', 0.3), 900);
    await Promise.all([stretch, ...breath]);

    // 3. The drowsy bubble breathes at the target's face; little rings drift up off it.
    const face: Point = { x: target.x + (launch.x - target.x) * 0.08, y: target.y - tr.height * 0.12 };
    const size = Math.max(tr.width * 0.3, 22);
    const bubble = NormalFoeStatusMoveAnimations.drowsyBubble(size);
    Fx.place(bubble, face);
    fxEl.appendChild(bubble);
    const parts: Promise<void>[] = [
      Fx.anim(bubble, [
        { transform: 'scale(0)', opacity: 1 },
        { transform: 'scale(1)', opacity: 1, offset: 0.2 },
        { transform: 'scale(.78)', opacity: 1, offset: 0.42 },
        { transform: 'scale(1.1)', opacity: 1, offset: 0.65 },
        { transform: 'scale(.9)', opacity: 1, offset: 0.85 },
        { transform: 'scale(1.3)', opacity: 0 }
      ], { duration: 1200, easing: 'ease-in-out' }).then(() => bubble.remove())
    ];
    for (let i = 0; i < 5; i++) {
      const ring = NormalFoeStatusMoveAnimations.drowsyBubble(size * (0.4 + Math.random() * 0.25));
      Fx.place(ring, face);
      fxEl.appendChild(ring);
      const drift = (Math.random() * 2 - 1) * size * 0.6;
      parts.push(
        Fx.anim(ring, [
          { transform: 'translate(0,0) scale(.3)', opacity: 0 },
          { transform: `translate(${drift * 0.4}px,${-size * 0.6}px) scale(1)`, opacity: 0.9, offset: 0.3 },
          { transform: `translate(${drift}px,${-size * 2}px) scale(1.1)`, opacity: 0 }
        ], { duration: 800, delay: 150 + i * 180, easing: 'ease-out', fill: 'backwards' }).then(() => ring.remove())
      );
    }
    await Promise.all(parts);
  }

  /** A see-through bubble, `size` px wide: white rim, pale blue inside and a highlight (Yawn). */
  private static drowsyBubble(size: number): HTMLElement {
    const el = document.createElement('div');
    el.style.cssText =
      `position:absolute;width:${size}px;height:${size}px;border-radius:50%;pointer-events:none;box-sizing:border-box;` +
      'border:1.5px solid #ffffffdd;box-shadow:0 0 3px #ffffff88;' +
      'background:radial-gradient(circle at 32% 30%,#ffffffcc 0 12%,#ffffff00 20%),radial-gradient(circle,#D8ECFF33,#B8D8FF66)';
    return el;
  }

  /**
   * Whirlwind: a gust sweeps over the target - white and grey flakes tumble
   * past it in swirling streams with a few white wind streaks - while it
   * leans against the wind. (Blowing it off the field is the move resolver's
   * job, and only happens when there's a Pokémon to drag in.)
   */
  private static async playWhirlwind(refs: BattleStageRefs, target: Point, v: MoveVisual) {
    const { fieldEl, fxEl, targetEl } = refs;
    const W = fieldEl.clientWidth;
    const r = Fx.rect(targetEl);
    const span = Math.max(W * 0.35, r.width * 1.6);
    const band = Math.max(r.height * 0.6, 40);
    const gust = 1000;

    const flakes: Promise<void>[] = [];
    for (let i = 0; i < 34; i++) {
      const s = 4 + Math.random() * 5;
      const flake = document.createElement('div');
      flake.style.cssText = `position:absolute;width:${s}px;height:${s * (0.6 + Math.random() * 0.6)}px;pointer-events:none;background:${i % 3 ? '#F4F4F4' : '#B8B8B8'};box-shadow:0 0 2px #00000055`;
      const y0 = target.y + (Math.random() * 2 - 1) * band;
      Fx.place(flake, { x: target.x - v.dir * span, y: y0 });
      fxEl.appendChild(flake);
      const frames: Keyframe[] = [];
      const wob = 10 + Math.random() * 18;
      const phase = Math.random() * Math.PI * 2;
      const spin = (Math.random() < 0.5 ? -1 : 1) * (360 + Math.random() * 360);
      for (let k = 0; k <= 8; k++) {
        const t = k / 8;
        frames.push({
          transform: `translate(${v.dir * span * 2 * t}px,${Math.sin(phase + t * Math.PI * 2.5) * wob - t * 12}px) rotate(${spin * t}deg)`,
          opacity: k === 0 || k === 8 ? 0 : 1
        });
      }
      flakes.push(Fx.anim(flake, frames, { duration: 520 + Math.random() * 240, easing: 'linear', delay: Math.random() * (gust - 600) }).then(() => flake.remove()));
    }
    // Thin white wind streaks curl past.
    for (let i = 0; i < 5; i++) {
      const len = span * (0.5 + Math.random() * 0.4);
      const streak = document.createElement('div');
      streak.style.cssText = `position:absolute;width:${len}px;height:${8 + Math.random() * 8}px;pointer-events:none;border-top:2px solid #ffffffcc;border-radius:50%`;
      Fx.place(streak, { x: target.x - v.dir * span * 0.6, y: target.y + (Math.random() * 2 - 1) * band * 0.8 });
      fxEl.appendChild(streak);
      flakes.push(
        Fx.anim(streak, [
          { transform: 'translateX(0) scaleX(.4)', opacity: 0 },
          { transform: `translateX(${v.dir * span * 0.6}px) scaleX(1)`, opacity: 0.9, offset: 0.5 },
          { transform: `translateX(${v.dir * span * 1.3}px) scaleX(.6)`, opacity: 0 }
        ], { duration: 500, easing: 'ease-out', delay: 100 + Math.random() * (gust - 600) }).then(() => streak.remove())
      );
    }

    // The target leans with the wind and wobbles (position only, it keeps facing its foe).
    const base = targetEl.style.transform;
    const lean: Keyframe[] = [];
    for (let k = 0; k <= 10; k++) {
      const push = k === 0 || k === 10 ? 0 : v.dir * (6 + (k % 2 ? 3 : -3));
      lean.push({ transform: `${base} translateX(${push}px)` });
    }
    flakes.push(Fx.anim(targetEl, lean, { duration: gust, easing: 'ease-in-out', fill: 'none' }));
    await Promise.all(flakes);
  }

  /**
   * Encore: the stage goes dark, a pink-white spotlight shines down on the
   * target from above with a pool of light at its feet, and colourful confetti
   * flutters down around it.
   */
  private static async playEncore(refs: BattleStageRefs, target: Point) {
    const { fieldEl, fxEl, targetEl } = refs;
    const f = Fx.rect(fieldEl);
    const r = Fx.rect(targetEl);
    const foot = r.bottom - f.top - r.height * 0.06;

    // 1. Dark stage (0-0.3 s).
    const dark = Fx.backdrop(fieldEl, 'background:radial-gradient(circle at 50% 45%,#2A2230,#0C0A10)');
    await Fx.anim(dark, [{ opacity: 0 }, { opacity: 1 }], { duration: 300, easing: 'ease-out', fill: 'forwards' });

    // 2. The spotlight switches on (0.3-0.5 s): a cone from the top of the field and a pool of light.
    const poolW = Math.max(r.width * 1.3, 90);
    const cone = document.createElement('div');
    const topW = poolW * 0.35;
    cone.style.cssText = `position:absolute;left:${target.x - poolW / 2}px;top:0;width:${poolW}px;height:${foot}px;pointer-events:none;clip-path:polygon(${50 - (topW / poolW) * 50}% 0,${50 + (topW / poolW) * 50}% 0,100% 100%,0 100%);background:linear-gradient(180deg,#FFE8F4cc,#FFD0E888 60%,#FFC8E066)`;
    const pool = document.createElement('div');
    pool.style.cssText = `position:absolute;width:${poolW}px;height:${poolW * 0.32}px;border-radius:50%;pointer-events:none;background:radial-gradient(ellipse,#FFF0F8ee,#FFD0E8aa 55%,#FFC8E000 72%)`;
    Fx.place(pool, { x: target.x, y: foot });
    dark.append(cone, pool);
    const light = [cone, pool].map((el) =>
      Fx.anim(el, [{ opacity: 0 }, { opacity: 1, offset: 0.15 }, { opacity: 0.9, offset: 0.85 }, { opacity: 0 }], { duration: 1500, easing: 'ease-out' })
    );
    Fx.anim(targetEl, [
      { filter: 'brightness(1)' },
      { filter: 'brightness(1.35) drop-shadow(0 0 6px #FFD0E8)', offset: 0.2 },
      { filter: 'brightness(1.35) drop-shadow(0 0 6px #FFD0E8)', offset: 0.8 },
      { filter: 'brightness(1)' }
    ], { duration: 1500, easing: 'ease-out', fill: 'none' });

    // 3. Confetti flutters down around the target (0.4-1.8 s).
    const colors = ['#FF4A4A', '#FFC83A', '#4AC8FF', '#7AE05A', '#C86AFF', '#FF8AD0'];
    const spread = poolW * 0.6;
    const confetti: Promise<void>[] = [];
    for (let i = 0; i < 26; i++) {
      const w = 5 + Math.random() * 4;
      const bit = document.createElement('div');
      bit.style.cssText = `position:absolute;width:${w}px;height:${w * 0.55}px;pointer-events:none;background:${colors[i % colors.length]}`;
      const x0 = target.x + (Math.random() * 2 - 1) * spread;
      const y0 = r.top - f.top - 20 - Math.random() * r.height * 0.5;
      Fx.place(bit, { x: x0, y: y0 });
      fxEl.appendChild(bit);
      const fall = r.height * (0.8 + Math.random() * 0.5);
      const sway = 8 + Math.random() * 10;
      const spin = (Math.random() < 0.5 ? -1 : 1) * (300 + Math.random() * 400);
      const frames: Keyframe[] = [];
      for (let k = 0; k <= 6; k++) {
        const t = k / 6;
        frames.push({
          transform: `translate(${Math.sin(t * Math.PI * 3 + i) * sway}px,${t * fall}px) rotate(${spin * t}deg) scaleY(${Math.cos(t * Math.PI * 4)})`,
          opacity: k === 0 ? 0 : k === 6 ? 0 : 1
        });
      }
      confetti.push(Fx.anim(bit, frames, { duration: 1000 + Math.random() * 400, easing: 'linear', delay: 100 + Math.random() * 400 }).then(() => bit.remove()));
    }
    await Promise.all([...light, ...confetti]);

    await Fx.anim(dark, [{ opacity: 1 }, { opacity: 0 }], { duration: 300, easing: 'ease-in' });
    dark.remove();
  }
}
