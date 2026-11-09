import { Point, BattleStageRefs, MoveVisual } from '../../animation.types';
import { Fx } from '../../fx';
import { FxGlyphs } from '../../fx-glyphs';

/** Petal colours: [body, light edge, dark edge]. */
const PETAL_TONES: readonly (readonly [string, string, string])[] = [
  ['#F27A9C', '#FFD0DE', '#D84A72'],
  ['#F2E05A', '#FFF8C8', '#C8A82A'],
  ['#5AD8F0', '#D0F6FF', '#2A98C0'],
  ['#7AE07A', '#D8FFD0', '#3AA84A']
];

/**
 * Petal Blizzard, after the XY animation: the scene dims to a dark green
 * (0-0.35 s) and a storm of pink, yellow, cyan and green petals sweeps across
 * the whole field from the user's side, tumbling as it goes (0.2-1.9 s). In
 * the thick of it a green energy sphere swells on the target and bursts while
 * the target glows green (0.9-1.6 s); then the petals thin out and the scene
 * clears (to ~2.2 s).
 */
export class PetalBlizzard {
  static async play(refs: BattleStageRefs, target: Point, v: MoveVisual) {
    const { fieldEl, fxEl } = refs;
    const W = fieldEl.clientWidth;
    const H = fieldEl.clientHeight;

    const dim = Fx.backdrop(fieldEl, 'background:radial-gradient(circle at 50% 50%,#1E3A22,#06120A)');
    Fx.anim(dim, [{ opacity: 0 }, { opacity: 0.9 }], { duration: 350, easing: 'ease-out' });

    const layer = document.createElement('div');
    layer.style.cssText = 'position:absolute;inset:0;overflow:hidden;pointer-events:none';
    fxEl.appendChild(layer);

    // The storm: petals cross the field in waving paths, tumbling as they fly.
    const petals: Promise<void>[] = [];
    const count = 80;
    for (let i = 0; i < count; i++) {
      const [body, light, dark] = PETAL_TONES[i % PETAL_TONES.length];
      const petal = FxGlyphs.petalGlyph(7 + Math.random() * 6, body, light, dark);
      const startX = v.dir > 0 ? -20 : W + 20;
      const y0 = Math.random() * H;
      Fx.place(petal, { x: startX, y: y0 });
      layer.appendChild(petal);
      const span = (W + 40) * v.dir;
      const drift = (Math.random() * 2 - 1) * H * 0.2;
      const wave = 15 + Math.random() * 25;
      const phase = Math.random() * Math.PI * 2;
      const spin = (Math.random() < 0.5 ? -1 : 1) * (360 + Math.random() * 540);
      const frames: Keyframe[] = [];
      for (let k = 0; k <= 8; k++) {
        const t = k / 8;
        const y = drift * t + Math.sin(phase + t * Math.PI * 3) * wave;
        // The flicker in width makes the petal look like it is turning over.
        frames.push({ transform: `translate(${span * t}px,${y}px) rotate(${spin * t}deg) scaleX(${k % 2 ? 0.35 : 1})` });
      }
      petals.push(
        Fx.anim(petal, frames, { duration: 900 + Math.random() * 400, delay: 200 + (i / count) * 1100, easing: 'linear' }).then(() => petal.remove())
      );
    }

    await Fx.wait(900);
    const hit = PetalBlizzard.sphere(refs, layer, target);

    await Promise.all([...petals, hit]);
    await Fx.anim(dim, [{ opacity: 0.9 }, { opacity: 0 }], { duration: 300, easing: 'ease-in' });
    dim.remove();
    layer.remove();
  }

  /** A green energy sphere swells on the target and bursts into green sparks; the target glows green. */
  private static sphere(refs: BattleStageRefs, layer: HTMLElement, target: Point): Promise<unknown> {
    const { targetEl } = refs;
    const r = Fx.rect(targetEl);
    const size = Math.max(r.width * 1.1, 70);
    const orb = document.createElement('div');
    orb.style.cssText =
      `width:${size}px;height:${size}px;border-radius:50%;pointer-events:none;` +
      'background:radial-gradient(circle,#E8FFE0aa 0 20%,#7AF07A66 50%,#30C05099 68%,#20A04000 72%);border:2px solid #A8FFA8;box-shadow:0 0 12px #40E060,inset 0 0 10px #40E060';
    Fx.place(orb, target);
    layer.appendChild(orb);
    const effects: Promise<unknown>[] = [
      Fx.anim(orb, [
        { transform: 'scale(.2)', opacity: 0 },
        { transform: 'scale(1)', opacity: 1, offset: 0.5 },
        { transform: 'scale(1.4)', opacity: 0 }
      ], { duration: 500, easing: 'ease-out' }).then(() => orb.remove()),
      Fx.anim(targetEl, [
        { filter: 'none' },
        { filter: 'sepia(1) saturate(4) hue-rotate(60deg) brightness(1.1)', offset: 0.3 },
        { filter: 'sepia(1) saturate(4) hue-rotate(60deg) brightness(1.1)', offset: 0.6 },
        { filter: 'none' }
      ], { duration: 700, easing: 'ease-in-out', fill: 'none' })
    ];
    setTimeout(() => Fx.shake(targetEl, 5), 250);
    for (let i = 0; i < 14; i++) {
      const spark = FxGlyphs.sparkStar(6 + Math.random() * 6, '#B8FFB0');
      Fx.place(spark, target);
      layer.appendChild(spark);
      const ang = Math.random() * Math.PI * 2;
      const d = size * (0.5 + Math.random() * 0.4);
      effects.push(
        Fx.anim(spark, [
          { transform: 'translate(0,0) scale(.4)', opacity: 0 },
          { transform: `translate(${Math.cos(ang) * d * 0.5}px,${Math.sin(ang) * d * 0.5}px) scale(1)`, opacity: 1, offset: 0.3 },
          { transform: `translate(${Math.cos(ang) * d}px,${Math.sin(ang) * d}px) scale(.5)`, opacity: 0 }
        ], { duration: 450, delay: 250 + Math.random() * 80, easing: 'ease-out' }).then(() => spark.remove())
      );
    }
    return Promise.all(effects);
  }
}
