import { Point, BattleStageRefs, MoveAnimRegistry } from '../../animation.types';
import { Fx } from '../../fx';
import { FxGlyphs } from '../../fx-glyphs';
import { FxEffects } from '../../fx-effects';
import { TerrainFx } from '../../terrain-fx';

/** Hand-made animations for the Gen 6 Electric-type status moves (terrain, field charges, stat moves). */
export class ElectricFieldMoveAnimations {
  /** By @pkmn/sim move id. */
  static readonly anims: MoveAnimRegistry = {
    eerieimpulse: (refs, launch, target) => ElectricFieldMoveAnimations.playEerieImpulse(refs, launch, target),
    electricterrain: (refs, launch) => TerrainFx.play(refs, launch, TerrainFx.ELECTRIC),
    electrify: (refs, launch, target) => ElectricFieldMoveAnimations.playElectrify(refs, launch, target),
    iondeluge: (refs, launch) => ElectricFieldMoveAnimations.playIonDeluge(refs, launch),
    magneticflux: (refs, launch) => ElectricFieldMoveAnimations.playMagneticFlux(refs, launch)
  };

  /**
   * Eerie Impulse, after the XY animation: three cyan rings pulse from the
   * user to the target (0-0.75 s, 0.12 s apart), yellow sparks crackle on it
   * while glowing yellow orbs circle it (0.6-1.2 s), then its Sp. Atk falls
   * (1.2-2.2 s).
   * Reference: https://www.pokewiki.de/images/5/5d/Mystowellen_Gen6.png
   */
  private static async playEerieImpulse(refs: BattleStageRefs, launch: Point, target: Point) {
    const { fxEl, launchEl, targetEl } = refs;
    const lr = Fx.rect(launchEl);
    const tr = Fx.rect(targetEl);
    const dx = target.x - launch.x;
    const dy = target.y - launch.y;
    const size = Math.max(lr.height * 0.6, 50);
    const rings: Promise<void>[] = [];
    for (let i = 0; i < 3; i++) {
      const ring = Fx.box(size * 0.6, size, 'border-radius:50%;border:4px solid #6AE8FF;box-shadow:0 0 8px #3AC8FF,inset 0 0 6px #3AC8FF');
      rings.push(
        Fx.spawn(fxEl, ring, launch, [
          { transform: 'translate(0,0) scale(.4)', opacity: 0 },
          { transform: `translate(${dx * 0.2}px,${dy * 0.2}px) scale(.8)`, opacity: 1, offset: 0.2 },
          { transform: `translate(${dx}px,${dy}px) scale(1.1)`, opacity: 0 }
        ], { duration: 520, delay: i * 120, easing: 'ease-in' })
      );
    }
    await Fx.wait(560);

    const stop = FxEffects.crackleOver(fxEl, target, Math.max(tr.width, 40), '#FFF27A');
    const orbit: Promise<unknown>[] = [Fx.glow(targetEl, 'brightness(1.2) drop-shadow(0 0 8px #FFE84A)', 600)];
    const rx = Math.max(tr.width * 0.6, 36);
    for (let i = 0; i < 3; i++) {
      const frames: Keyframe[] = [];
      for (let k = 0; k <= 8; k++) {
        const a = (i / 3 + k / 8) * Math.PI * 2;
        frames.push({ transform: `translate(${Math.cos(a) * rx}px,${Math.sin(a) * rx * 0.35}px)`, opacity: k === 0 || k === 8 ? 0 : 1 });
      }
      orbit.push(Fx.spawn(fxEl, Fx.box(14, 14, 'border-radius:50%;background:radial-gradient(circle,#ffffff,#FFE84A 50%,#FFD02A00 75%);box-shadow:0 0 8px #FFE84A'), target, frames, { duration: 600, easing: 'linear' }));
    }
    await Promise.all([...rings, ...orbit]);
    stop();
    await FxEffects.statDropCloud(refs, target);
  }

  /**
   * Electrify, after the XY animation: a yellow-white streak of electricity
   * shoots from the user to the target (0-0.35 s), a ring of orange-yellow
   * light flares round the target's feet and it crackles and glows yellow
   * (0.3-1.2 s).
   * Reference: https://www.pokewiki.de/images/2/23/Elektrifizierung_Gen6.png
   */
  private static async playElectrify(refs: BattleStageRefs, launch: Point, target: Point) {
    const { fieldEl, fxEl, targetEl } = refs;
    const tr = Fx.rect(targetEl);
    const dx = target.x - launch.x;
    const dy = target.y - launch.y;
    const len = Math.hypot(dx, dy);
    const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
    const streak = Fx.box(len * 0.35, 6, `left:${launch.x}px;top:${launch.y - 3}px;transform-origin:0 50%;border-radius:3px;background:linear-gradient(90deg,#FFE84A00,#FFE84A,#ffffff);box-shadow:0 0 10px #FFE84A`);
    fxEl.appendChild(streak);
    await Fx.anim(streak, [
      { transform: `rotate(${angle}deg) translateX(0)`, opacity: 1 },
      { transform: `rotate(${angle}deg) translateX(${len * 0.7}px)`, opacity: 1, offset: 0.85 },
      { transform: `rotate(${angle}deg) translateX(${len * 0.75}px) scaleX(.2)`, opacity: 0 }
    ], { duration: 350, easing: 'ease-in' });
    streak.remove();

    const foot = Fx.footOf(targetEl, fieldEl);
    const w = Math.max(tr.width * 1.5, 80);
    const ring = Fx.box(w, w * 0.35, 'border-radius:50%;border:4px solid #FFC84A;background:radial-gradient(ellipse,#FFF6C066,#FF9A2A00 70%);box-shadow:0 0 12px #FF9A2A,inset 0 0 10px #FFE84A');
    const stop = FxEffects.crackleOver(fxEl, target, Math.max(tr.width, 40), '#FFF27A');
    Fx.flash(targetEl, '#FFE84A', 0.6);
    await Promise.all([
      Fx.spawn(fxEl, ring, foot, [
        { transform: 'scale(.3)', opacity: 0 },
        { transform: 'scale(1)', opacity: 1, offset: 0.3 },
        { transform: 'scale(1.1)', opacity: 1, offset: 0.7 },
        { transform: 'scale(1.2)', opacity: 0 }
      ], { duration: 850, easing: 'ease-out' }),
      Fx.glow(targetEl, 'brightness(1.2) sepia(.5) saturate(2) hue-rotate(10deg) drop-shadow(0 0 8px #FFE84A)', 850)
    ]);
    stop();
  }

  /**
   * Ion Deluge, after the XY animation: the sky turns stormy blue and yellow
   * lightning rains down all over the field while the user glows yellow
   * (0-1.2 s), then a spray of yellow-orange sparks sweeps low across the
   * field (1.0-1.8 s).
   * Reference: https://www.pokewiki.de/images/a/af/Plasmaschauer_Gen6.png
   */
  private static async playIonDeluge(refs: BattleStageRefs, launch: Point) {
    const { fieldEl, fxEl, launchEl } = refs;
    const W = fieldEl.clientWidth;
    const H = fieldEl.clientHeight;
    const sky = Fx.backdrop(fieldEl, 'background:linear-gradient(180deg,#0A1A4A,#1A3A7A 55%,#2A4A6Acc)');
    const effects: Promise<unknown>[] = [
      Fx.anim(sky, [{ opacity: 0 }, { opacity: 1, offset: 0.15 }, { opacity: 1, offset: 0.75 }, { opacity: 0 }], { duration: 1900, easing: 'ease-in-out' }).then(() => sky.remove()),
      Fx.glow(launchEl, 'brightness(1.3) sepia(.6) saturate(2.5) hue-rotate(10deg) drop-shadow(0 0 8px #FFE84A)', 1200, 150)
    ];
    for (let i = 0; i < 12; i++) {
      const x = W * (0.05 + Math.random() * 0.9);
      const bolt = FxGlyphs.lightning(W, H, { x, y: -10 }, { x: x + (Math.random() * 2 - 1) * 20, y: H * (0.45 + Math.random() * 0.4) }, 10, '#FFF6A0', '#FFD84A', 2);
      fxEl.appendChild(bolt);
      effects.push(
        Fx.anim(bolt, [{ opacity: 0 }, { opacity: 1, offset: 0.15 }, { opacity: 0.4, offset: 0.5 }, { opacity: 1, offset: 0.6 }, { opacity: 0 }], {
          duration: 300,
          delay: 150 + i * 80,
          easing: 'linear'
        }).then(() => bolt.remove())
      );
    }
    await Fx.wait(1000);
    const dir = launch.x < W / 2 ? 1 : -1;
    for (let i = 0; i < 30; i++) {
      const y = H * (0.55 + Math.random() * 0.4);
      const spark = i % 3 ? FxGlyphs.sparkStar(10 + Math.random() * 8, i % 2 ? '#FFD84A' : '#FF9A2A') : FxGlyphs.boltGlyph('#FFE84A', 8);
      effects.push(
        Fx.spawn(fxEl, spark, { x: dir > 0 ? -10 : W + 10, y }, [
          { transform: 'translate(0,0) scale(.6)', opacity: 0 },
          { transform: `translate(${dir * W * 0.3}px,${-8 - Math.random() * 10}px) scale(1)`, opacity: 1, offset: 0.3 },
          { transform: `translate(${dir * (W + 20)}px,0) scale(.6)`, opacity: 0 }
        ], { duration: 600, delay: i * 8, easing: 'ease-out' })
      );
    }
    await Promise.all(effects);
  }

  /**
   * Magnetic Flux, after the XY animation: the scene turns gold with white
   * lightning flickering across it (0-1.1 s); orange magnetic rings circle
   * the user as it crackles and glows (0.1-1.1 s), then its defences rise
   * (1.1-1.9 s).
   * Reference: https://www.pokewiki.de/images/8/8a/Magnetregler_Gen6.png
   */
  private static async playMagneticFlux(refs: BattleStageRefs, launch: Point) {
    const { fieldEl, fxEl, launchEl } = refs;
    const W = fieldEl.clientWidth;
    const H = fieldEl.clientHeight;
    const lr = Fx.rect(launchEl);
    const scene = Fx.backdrop(fieldEl, 'background:radial-gradient(circle at 40% 60%,#F8E08Acc,#D8A83Acc)');
    const stop = FxEffects.crackleOver(fxEl, launch, Math.max(lr.width, 40), '#ffffff');
    const effects: Promise<unknown>[] = [
      Fx.anim(scene, [{ opacity: 0 }, { opacity: 1, offset: 0.2 }, { opacity: 1, offset: 0.75 }, { opacity: 0 }], { duration: 1150, easing: 'ease-in-out' }).then(() => scene.remove()),
      Fx.glow(launchEl, 'brightness(1.2) drop-shadow(0 0 8px #FFB04A)', 1000, 100)
    ];
    for (let i = 0; i < 5; i++) {
      const x = W * (0.1 + Math.random() * 0.8);
      const y = H * Math.random() * 0.3;
      const bolt = FxGlyphs.lightning(W, H, { x, y }, { x: x + (Math.random() * 2 - 1) * 60, y: y + H * 0.2 }, 10, '#ffffff', '#FFF0B0', 1.8);
      fxEl.appendChild(bolt);
      effects.push(Fx.anim(bolt, [{ opacity: 0 }, { opacity: 1, offset: 0.2 }, { opacity: 0 }], { duration: 220, delay: 100 + i * 170, easing: 'linear' }).then(() => bolt.remove()));
    }
    const rx = Math.max(lr.width * 0.65, 40);
    for (let i = 0; i < 3; i++) {
      // A round ring spinning inside a flattened wrapper reads as a flat ring circling the user.
      const wrap = Fx.box(rx * 2, rx * 2, '');
      const ring = Fx.box(rx * 2, rx * 2, 'left:0;top:0;box-sizing:border-box;border-radius:50%;border:5px solid #FF9A3A;border-top-color:#FF9A3A22;border-right-color:#FFD08A;box-shadow:0 0 8px #FFB04A');
      wrap.appendChild(ring);
      ring.animate([{ transform: 'rotate(0deg)' }, { transform: 'rotate(720deg)' }], { duration: 950, delay: 100 + i * 60, easing: 'linear' });
      effects.push(
        Fx.spawn(fxEl, wrap, { x: launch.x, y: launch.y + (i - 1) * lr.height * 0.25 }, [
          { transform: 'scale(.6,.18)', opacity: 0 },
          { transform: 'scale(1,.3)', opacity: 1, offset: 0.3 },
          { transform: 'scale(1,.3)', opacity: 1, offset: 0.8 },
          { transform: 'scale(1.1,.33)', opacity: 0 }
        ], { duration: 950, delay: 100 + i * 60, easing: 'linear' })
      );
    }
    await Promise.all(effects);
    stop();
    await FxEffects.statUpAura(refs, launch);
  }
}
