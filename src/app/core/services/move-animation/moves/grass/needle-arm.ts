import { Point, BattleStageRefs, MoveVisual } from '../../animation.types';
import { Fx } from '../../fx';
import { FxGlyphs } from '../../fx-glyphs';

/** The needles converge on the target until `NEEDLES` (ms); the arm strikes at `HIT` (ms). */
const NEEDLES = 450;
const HIT = 650;
/** How many green needles fly in from all sides. */
const COUNT = 10;

/**
 * Needle Arm, after the Gen 4 / Gen 5 animation:
 * - Gen 4: https://www.pokewiki.de/images/9/9a/Nietenranke_Gen4.png
 * - Gen 5: https://www.pokewiki.de/images/a/ab/Nietenranke_Gen5.png
 *
 * Green needles shoot in at the target from all sides and stick into it
 * with a pale green flash (0-0.45 s). Then a spiked green arm swings in
 * from the user's side and strikes the target (0.65 s), which shakes while
 * green leaves and needles scatter off it (0.65-1.15 s).
 */
export class NeedleArm {
  static async play(refs: BattleStageRefs, target: Point, v: MoveVisual) {
    const { fxEl, targetEl } = refs;
    const r = Fx.rect(targetEl);
    const w = Math.max(r.width, 50);
    const reach = w * 1.4;
    const effects: Promise<void>[] = [];
    for (let i = 0; i < COUNT; i++) {
      const a = (Math.PI * 2 * i) / COUNT + 0.2;
      const deg = (a * 180) / Math.PI + 180;
      const needle = Fx.box(w * 0.4, 5, 'clip-path:polygon(0 50%,25% 0,100% 30%,100% 70%,25% 100%);background:linear-gradient(90deg,#E8FFB0,#6AD04A 40%,#2A8A2A)');
      const stop = w * 0.18;
      effects.push(Fx.spawn(fxEl, needle, target, [
        { transform: `translate(${Math.cos(a) * reach}px,${Math.sin(a) * reach * 0.7}px) rotate(${deg}deg)`, opacity: 0 },
        { transform: `translate(${Math.cos(a) * reach * 0.7}px,${Math.sin(a) * reach * 0.5}px) rotate(${deg}deg)`, opacity: 1, offset: 0.2 },
        { transform: `translate(${Math.cos(a) * stop}px,${Math.sin(a) * stop * 0.7}px) rotate(${deg}deg)`, opacity: 1, offset: 0.75 },
        { transform: `translate(${Math.cos(a) * stop}px,${Math.sin(a) * stop * 0.7}px) rotate(${deg}deg)`, opacity: 0 }
      ], { duration: NEEDLES + 150, delay: (i % 3) * 40, easing: 'ease-in' }));
    }
    setTimeout(() => Fx.flash(targetEl, '#B8F08A', 0.4), NEEDLES - 80);

    // The arm: a green fist swinging in from the user's side.
    const armW = Math.max(w * 0.6, 40);
    const arm = FxGlyphs.fistGlyph(armW, 'yellow');
    const wrap = Fx.box(armW, armW, `filter:hue-rotate(55deg) saturate(1.3)${v.dir < 0 ? ';transform:scaleX(-1)' : ''}`);
    wrap.appendChild(arm);
    const holder = Fx.box(armW, armW, '');
    holder.appendChild(wrap);
    const from = -v.dir * w * 0.9;
    effects.push(Fx.spawn(fxEl, holder, target, [
      { transform: `translate(${from}px,${-r.height * 0.1}px) scale(.8)`, opacity: 0 },
      { transform: `translate(${from * 0.6}px,${-r.height * 0.05}px) scale(1)`, opacity: 1, offset: 0.3 },
      { transform: 'translate(0,0) scale(1.15)', opacity: 1, offset: 0.65 },
      { transform: `translate(${v.dir * w * 0.1}px,0) scale(1)`, opacity: 0 }
    ], { duration: 450, delay: HIT - 290, easing: 'ease-in' }));

    effects.push(Fx.wait(HIT).then(() => {
      Fx.shake(targetEl, 6);
      Fx.flash(targetEl, '#FFFFFF', 0.5);
      const scatter: Promise<void>[] = [];
      for (let i = 0; i < 8; i++) {
        const a = (Math.PI * 2 * i) / 8 + 0.4;
        const d = w * (0.6 + (i % 2) * 0.25);
        scatter.push(Fx.spawn(fxEl, FxGlyphs.leafGlyph(13 + (i % 3) * 3), target, [
          { transform: 'translate(0,0) rotate(0deg)', opacity: 1 },
          { transform: `translate(${Math.cos(a) * d}px,${Math.sin(a) * d * 0.7 + 10}px) rotate(${200 + i * 50}deg)`, opacity: 0 }
        ], { duration: 500, easing: 'ease-out' }));
      }
      return Promise.all(scatter).then(() => void 0);
    }));
    await Promise.all(effects);
  }
}
