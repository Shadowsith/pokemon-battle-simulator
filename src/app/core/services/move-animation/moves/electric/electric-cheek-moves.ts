import { Point, BattleStageRefs, MoveAnimRegistry } from '../../animation.types';
import { Fx } from '../../fx';
import { FxGlyphs } from '../../fx-glyphs';
import { FxEffects } from '../../fx-effects';

/** Hand-made animations for the Gen 6 Electric-type attacks charged in the user's cheeks (Nuzzle, Parabolic Charge). */
export class ElectricCheekMoveAnimations {
  /** By @pkmn/sim move id. */
  static readonly anims: MoveAnimRegistry = {
    nuzzle: (refs, launch, target) => ElectricCheekMoveAnimations.playNuzzle(refs, launch, target),
    paraboliccharge: (refs, launch, target) => ElectricCheekMoveAnimations.playParabolicCharge(refs, launch, target)
  };

  /**
   * Nuzzle, after the XY animation: the user's cheeks crackle as the scene
   * flashes yellow (0-0.45 s), it scoots up to the target and rubs against it
   * (0.45-1.05 s; hit at 0.6 s), then slides back while red and violet
   * paralysis sparks pop round the target (1.05-1.5 s).
   * Reference: https://www.pokewiki.de/images/b/bd/Wangenrubbler_Gen6.png
   */
  private static async playNuzzle(refs: BattleStageRefs, launch: Point, target: Point) {
    const { fieldEl, fxEl, launchEl, targetEl } = refs;
    const lr = Fx.rect(launchEl);
    const tr = Fx.rect(targetEl);
    const wash = Fx.backdrop(fieldEl, 'background:#F0E890b0');
    const stop = FxEffects.crackleOver(fxEl, launch, Math.max(lr.width, 40), '#FFF6A0');
    await Promise.all([
      Fx.anim(wash, [{ opacity: 0 }, { opacity: 1, offset: 0.4 }, { opacity: 0 }], { duration: 450, easing: 'ease-in-out' }).then(() => wash.remove()),
      Fx.glow(launchEl, 'brightness(1.25) drop-shadow(0 0 8px #FFE84A)', 450)
    ]);

    // Scoot up, rub side to side, slide back (position only - it keeps facing the foe).
    const original = launchEl.style.transform;
    const dx = (target.x - launch.x) * 0.72;
    const dy = (target.y - launch.y) * 0.72;
    const at = (x: number, y: number) => ({ transform: `${original} translate(${x}px,${y}px)` });
    const rub = Fx.anim(launchEl, [
      at(0, 0),
      { ...at(dx, dy), offset: 0.25 },
      { ...at(dx + 8, dy - 4), offset: 0.37 },
      { ...at(dx - 6, dy + 2), offset: 0.49 },
      { ...at(dx + 8, dy - 4), offset: 0.61 },
      { ...at(dx, dy), offset: 0.73 },
      at(0, 0)
    ], { duration: 800, easing: 'ease-in-out', fill: 'none' });
    await Fx.wait(220);
    stop();
    Fx.flash(targetEl, '#FFE84A', 0.6);
    Fx.shake(targetEl, 4);
    const sparks: Promise<void>[] = [];
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const r = Math.max(tr.width * 0.55, 36);
      const zig = FxGlyphs.boltGlyph(i % 2 ? '#FF4A6A' : '#A04AFF', 9);
      sparks.push(
        Fx.spawn(fxEl, zig, { x: target.x + Math.cos(a) * r * 0.6, y: target.y + Math.sin(a) * r * 0.6 - tr.height * 0.15 }, [
          { transform: 'translate(0,0) scale(.3)', opacity: 0 },
          { transform: `translate(${Math.cos(a) * r * 0.3}px,${Math.sin(a) * r * 0.3}px) scale(1)`, opacity: 1, offset: 0.4 },
          { transform: `translate(${Math.cos(a) * r * 0.5}px,${Math.sin(a) * r * 0.5}px) scale(.6)`, opacity: 0 }
        ], { duration: 450, delay: 400 + i * 40, easing: 'ease-out' })
      );
    }
    await Promise.all([rub, ...sparks]);
  }

  /**
   * Parabolic Charge, after the XY animation: red sparks pop at the user's
   * cheeks (0-0.4 s), the scene turns orange and white-yellow lightning
   * bursts out from the user across the whole field (0.4-1.0 s), striking
   * the target in a fiery spark burst (0.7-1.2 s); then the scene flashes
   * green and green sparkles and light streaks rise round the user as it
   * heals (1.2-1.9 s).
   * Reference: https://www.pokewiki.de/images/5/56/Parabolladung_Gen6.png
   */
  private static async playParabolicCharge(refs: BattleStageRefs, launch: Point, target: Point) {
    const { fieldEl, fxEl, launchEl, targetEl } = refs;
    const W = fieldEl.clientWidth;
    const H = fieldEl.clientHeight;
    const lr = Fx.rect(launchEl);
    const tr = Fx.rect(targetEl);

    const cheeks: Promise<void>[] = [];
    for (let i = 0; i < 4; i++) {
      const at: Point = { x: launch.x + (i % 2 ? 1 : -1) * lr.width * 0.25, y: launch.y - lr.height * 0.05 + Math.random() * 10 };
      cheeks.push(
        Fx.spawn(fxEl, Fx.box(12, 12, 'border-radius:50%;background:radial-gradient(circle,#ffffff,#FF4A4A 55%,#FF2A2A00 75%);box-shadow:0 0 8px #FF4A4A'), at, [
          { transform: 'scale(0)', opacity: 0 },
          { transform: 'scale(1.2)', opacity: 1, offset: 0.4 },
          { transform: `translate(${(Math.random() * 2 - 1) * 20}px,${-20 - Math.random() * 20}px) scale(.4)`, opacity: 0 }
        ], { duration: 400, delay: i * 60, easing: 'ease-out' })
      );
    }
    await Promise.all(cheeks);

    // The scene turns orange; lightning bursts out over the whole field.
    const scene = Fx.backdrop(fieldEl, `background:radial-gradient(circle at ${launch.x}px ${launch.y}px,#FFD06Add,#E87A1Add 45%,#8A3A0Add)`);
    const effects: Promise<unknown>[] = [
      Fx.anim(scene, [{ opacity: 0 }, { opacity: 1, offset: 0.15 }, { opacity: 1, offset: 0.7 }, { opacity: 0 }], { duration: 850, easing: 'ease-in-out' }).then(() => scene.remove())
    ];
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * Math.PI * 2 + Math.random() * 0.4;
      const reach = Math.max(W, H) * (0.5 + Math.random() * 0.3);
      const bolt = FxGlyphs.lightning(W, H, launch, { x: launch.x + Math.cos(a) * reach, y: launch.y + Math.sin(a) * reach * 0.6 }, 14, '#ffffff', '#FFE84A', 3);
      fxEl.appendChild(bolt);
      effects.push(
        Fx.anim(bolt, [{ opacity: 0 }, { opacity: 1, offset: 0.15 }, { opacity: 0.4, offset: 0.5 }, { opacity: 1, offset: 0.6 }, { opacity: 0 }], {
          duration: 320,
          delay: i * 45,
          easing: 'linear'
        }).then(() => bolt.remove())
      );
    }
    await Fx.wait(300);
    Fx.flash(targetEl, '#FFE84A', 0.7);
    Fx.shake(targetEl, 6);
    effects.push(FxEffects.fireBlastCloud(fxEl, target, Math.max(tr.width * 0.9, 60), 6, '#FFE84A'));
    await Promise.all(effects);

    // Green flash; the user heals.
    const green = Fx.backdrop(fieldEl, 'background:#3AB878b8');
    const heal: Promise<unknown>[] = [
      Fx.anim(green, [{ opacity: 0 }, { opacity: 1, offset: 0.25 }, { opacity: 0 }], { duration: 700, easing: 'ease-in-out' }).then(() => green.remove()),
      FxEffects.healSparkles(refs, launch)
    ];
    heal.push(FxEffects.healStreaks(refs, launch, 6));
    await Promise.all(heal);
  }
}
