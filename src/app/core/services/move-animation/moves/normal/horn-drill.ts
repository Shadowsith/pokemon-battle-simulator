import { Point, BattleStageRefs } from '../../animation.types';
import { Fx } from '../../fx';
import { FxGlyphs } from '../../fx-glyphs';

/**
 * Horn Drill, after the Gen 4 / Gen 5 animation:
 * - Gen 4: https://www.pokewiki.de/images/1/11/Hornbohrer_Gen4.png
 * - Gen 5: https://www.pokewiki.de/images/7/77/Hornbohrer_Gen5.png
 *
 * A black horn shoots at the target (0-0.25 s) and bores into it, juddering
 * fast while white and yellow sparks spray back off its tip (hit at 0.3 s,
 * drilling to 0.85 s); a big orange spiky burst flickers on the target the
 * whole time and flares up once more as the horn breaks off (0.85-1.15 s).
 */
export class HornDrill {
  static async play(refs: BattleStageRefs, launch: Point, target: Point) {
    const { fieldEl, fxEl, targetEl } = refs;
    const r = Fx.rect(targetEl);
    const len = Math.max(r.width * 0.65, 50);
    const angle = Math.atan2(target.y - launch.y, target.x - launch.x);
    const deg = (angle * 180) / Math.PI;
    const ux = Math.cos(angle);
    const uy = Math.sin(angle);
    // Tip on the target's near edge: the box centre sits half a length behind it.
    const tip: Point = { x: target.x - ux * r.width * 0.15, y: target.y - uy * r.width * 0.15 };
    const hornAt: Point = { x: tip.x - ux * len * 0.45, y: tip.y - uy * len * 0.45 };
    const from = { x: launch.x - hornAt.x, y: launch.y - hornAt.y };

    // Fly in (0-0.25 s), then judder back and forth while drilling (to 0.85 s), then fall away.
    const drill: Keyframe[] = [
      { transform: `translate(${from.x * 0.6}px,${from.y * 0.6}px) rotate(${deg}deg)`, opacity: 0, offset: 0 },
      { transform: `translate(0,0) rotate(${deg}deg)`, opacity: 1, offset: 0.22 }
    ];
    for (let k = 1; k <= 12; k++) {
      const j = k % 2 ? 3 : -2;
      drill.push({ transform: `translate(${ux * j}px,${uy * j + (k % 3) - 1}px) rotate(${deg}deg)`, opacity: 1, offset: 0.22 + (k / 12) * 0.52 });
    }
    drill.push({ transform: `translate(${-ux * len * 0.3}px,${-uy * len * 0.3 + 10}px) rotate(${deg}deg)`, opacity: 0 });
    const horn = Fx.spawn(fxEl, FxGlyphs.hornGlyph(len), hornAt, drill, { duration: 1150, easing: 'linear' });

    await Fx.wait(300);
    Fx.flash(targetEl, '#FFB040', 0.7);
    const size = Math.max(r.width * 0.9, 64);
    const flicker: Keyframe[] = [{ transform: 'scale(.3) rotate(0deg)', opacity: 0, offset: 0 }];
    for (let k = 1; k <= 8; k++) {
      flicker.push({ transform: `scale(${k % 2 ? 1 : 0.85}) rotate(${k * 12}deg)`, opacity: 1, offset: (k / 8) * 0.6 });
    }
    flicker.push({ transform: 'scale(1.3) rotate(110deg)', opacity: 1, offset: 0.8 }, { transform: 'scale(1.4) rotate(120deg)', opacity: 0 });
    const effects: Promise<void>[] = [horn, Fx.spawn(fxEl, FxGlyphs.spikyBurst(size, '#F07020', '#FFC030', '#FFF6C0'), tip, flicker, { duration: 850, easing: 'linear' })];

    // Sparks spray back off the tip while it drills; the target judders with it.
    for (let i = 0; i < 26; i++) {
      const spread = (Math.random() * 2 - 1) * 1.1;
      const a = angle + Math.PI + spread;
      const d = len * (0.5 + Math.random() * 0.7);
      const s = 3 + Math.random() * 4;
      const c = i % 2 ? '#ffffff' : '#FFE04A';
      effects.push(
        Fx.spawn(fxEl, Fx.box(s, s, `border-radius:50%;background:${c};box-shadow:0 0 4px ${c}`), tip, [
          { transform: 'translate(0,0)', opacity: 1 },
          { transform: `translate(${Math.cos(a) * d}px,${Math.sin(a) * d}px)`, opacity: 0 }
        ], { duration: 320, easing: 'ease-out', delay: i * 20 })
      );
    }
    for (let t = 0; t < 520; t += 130) setTimeout(() => Fx.shake(targetEl, 4), t);
    await Fx.wait(550);
    Fx.shakeField(fieldEl, 0.8);
    Fx.flash(targetEl, '#FFE84A', 0.8);
    await Promise.all(effects);
  }
}
