import { Point, BattleStageRefs, MoveVisual } from '../../animation.types';
import { Fx } from '../../fx';
import { FxEffects } from '../../fx-effects';
import { FxGlyphs } from '../../fx-glyphs';

/**
 * Wing Attack, after the Gen 4 / Gen 5 animation:
 * - Gen 4: https://www.pokewiki.de/images/5/5e/Fl%C3%BCgelschlag_Gen4.png
 * - Gen 5: https://www.pokewiki.de/images/3/3a/Fl%C3%BCgelschlag_Gen5.png
 *
 * The user darts in (0-0.26 s) and beats both wings into the target: a
 * white-yellow star burst flares on one side, then the other (0.12 s and
 * 0.24 s, hit at 0.12 s). Yellow feathers burst off the target and flutter
 * down round it, swaying (0.25-1.25 s).
 */
export class WingAttack {
  static async play(refs: BattleStageRefs, target: Point, v: MoveVisual) {
    const { fxEl, launchEl, targetEl } = refs;
    const r = Fx.rect(targetEl);
    const size = Math.max(r.width * 0.5, 34);
    const dart = FxEffects.dart(launchEl, v.dir);
    const effects: Promise<void>[] = [dart];

    for (const side of [-1, 1] as const) {
      await Fx.wait(120);
      const at: Point = { x: target.x + side * r.width * 0.15, y: target.y - r.height * (side < 0 ? 0.12 : 0.02) };
      Fx.flash(targetEl, '#FFF2A0', 0.45);
      Fx.shake(targetEl, 4);
      effects.push(
        Fx.spawn(fxEl, FxGlyphs.spikyBurst(size, '#F8E060', '#FFFFFF', '#ffffff'), at, [
          { transform: 'scale(.3) rotate(0deg)', opacity: 1 },
          { transform: 'scale(1) rotate(15deg)', opacity: 1, offset: 0.35 },
          { transform: 'scale(1.1) rotate(25deg)', opacity: 0 }
        ], { duration: 300, easing: 'ease-out' })
      );
    }

    for (let i = 0; i < 8; i++) {
      const len = 14 + Math.random() * 6;
      const start: Point = { x: target.x + (Math.random() * 2 - 1) * r.width * 0.25, y: target.y - r.height * 0.2 };
      const up = r.height * (0.25 + Math.random() * 0.3);
      const fall = r.height * (0.55 + Math.random() * 0.3);
      const out = (i % 2 ? 1 : -1) * (14 + Math.random() * r.width * 0.35);
      const tilt = Math.random() * 60 - 30;
      effects.push(
        Fx.spawn(fxEl, WingAttack.featherGlyph(len), start, [
          { transform: `translate(0,0) rotate(${tilt}deg) scale(.4)`, opacity: 0 },
          { transform: `translate(${out * 0.6}px,${-up}px) rotate(${tilt + 40}deg) scale(1)`, opacity: 1, offset: 0.2 },
          { transform: `translate(${out * 0.9}px,${-up + fall * 0.35}px) rotate(${tilt - 30}deg)`, opacity: 1, offset: 0.45 },
          { transform: `translate(${out * 0.7}px,${-up + fall * 0.7}px) rotate(${tilt + 30}deg)`, opacity: 0.9, offset: 0.72 },
          { transform: `translate(${out}px,${-up + fall}px) rotate(${tilt - 20}deg)`, opacity: 0 }
        ], { duration: 950 + Math.random() * 150, easing: 'ease-out', delay: 10 + i * 20 })
      );
    }
    await Promise.all(effects);
  }

  /** A small yellow feather, quill pointing down, `len` px long. */
  private static featherGlyph(len: number): HTMLElement {
    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg') as unknown as HTMLElement;
    svg.setAttribute('viewBox', '0 0 10 24');
    svg.setAttribute('style', `position:absolute;overflow:visible;pointer-events:none;width:${len * 0.42}px;height:${len}px;filter:drop-shadow(0 0 2px #FFE87088)`);
    svg.innerHTML =
      '<path d="M5,1 C9,5 9.5,12 6,19 L5,23 L4,19 C0.5,12 1,5 5,1 Z" fill="#F4DC50" stroke="#B8901C" stroke-width=".8"/>' +
      '<path d="M5,3 L5,23" stroke="#C89A20" stroke-width=".8"/>' +
      '<path d="M5,8 L8,6 M5,12 L8.3,10 M5,8 L2,6 M5,12 L1.7,10" stroke="#D8B030" stroke-width=".5"/>';
    return svg;
  }
}
