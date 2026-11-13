import { Point, BattleStageRefs } from '../../animation.types';
import { Fx } from '../../fx';
import { FxGlyphs } from '../../fx-glyphs';

/**
 * Fire Pledge, after the Gen 5 animation:
 * - Gen 5: https://www.pokewiki.de/images/2/28/Feuers%C3%A4ulen_Gen5.png
 *
 * Fire boils up on the ground round the target (0-0.3 s) and three pillars of
 * flame shoot up out of it, left, centre and right (0.15-0.9 s, hit at
 * 0.3 s), while the target glows red. The pillars burn out into dark smoke
 * that rises and fades (0.8-1.6 s).
 */
export class FirePledge {
  static async play(refs: BattleStageRefs, target: Point) {
    const { fxEl, targetEl } = refs;
    const tr = Fx.rect(targetEl);
    const w = Math.max(tr.width, 60);
    const foot: Point = { x: target.x, y: target.y + tr.height * 0.4 };

    const burn = Fx.anim(targetEl, [
      { filter: 'sepia(0) saturate(1) hue-rotate(0deg)' },
      { filter: 'sepia(1) saturate(4) hue-rotate(-35deg) brightness(.9)', offset: 0.25 },
      { filter: 'sepia(1) saturate(4) hue-rotate(-35deg) brightness(.9)', offset: 0.75 },
      { filter: 'sepia(0) saturate(1) hue-rotate(0deg)' }
    ], { duration: 1300, easing: 'ease-in-out', fill: 'none' });
    const effects: Promise<void>[] = [burn];

    // Fire boiling on the ground.
    for (let i = 0; i < 8; i++) {
      const puff = FxGlyphs.firePuff(w * (0.25 + Math.random() * 0.15), i % 2 ? 'red' : 'hot');
      Fx.place(puff, { x: foot.x + (Math.random() * 2 - 1) * w * 0.7, y: foot.y + (Math.random() * 2 - 1) * 6 });
      fxEl.appendChild(puff);
      effects.push(
        Fx.anim(puff, [
          { transform: 'scale(.2,.1)', opacity: 0 },
          { transform: 'scale(1.1,.7)', opacity: 1, offset: 0.4 },
          { transform: 'translateY(-6px) scale(1.2,.8)', opacity: 0 }
        ], { duration: 500, delay: Math.random() * 300, easing: 'ease-out' }).then(() => puff.remove())
      );
    }

    // Three pillars: puffs streaming straight up from the ground.
    const height = Math.max(tr.height * 1.6, 110);
    const pillars = [-0.55, 0, 0.55];
    pillars.forEach((off, p) => {
      const base: Point = { x: foot.x + off * w, y: foot.y };
      for (let i = 0; i < 9; i++) {
        const puff = FxGlyphs.firePuff(w * (0.3 + Math.random() * 0.12), i % 3 === 2 ? 'hot' : 'red');
        Fx.place(puff, base);
        fxEl.appendChild(puff);
        const wob = (Math.random() * 2 - 1) * 6;
        effects.push(
          Fx.anim(puff, [
            { transform: 'translate(0,0) scale(.5)', opacity: 0 },
            { transform: `translate(${wob}px,${-height * 0.35}px) scale(1)`, opacity: 1, offset: 0.3 },
            { transform: `translate(${-wob}px,${-height * 0.8}px) scale(.9)`, opacity: 1, offset: 0.75 },
            { transform: `translate(0,${-height}px) scale(.5)`, opacity: 0 }
          ], { duration: 500, delay: 150 + p * 60 + i * 30, easing: 'ease-out' }).then(() => puff.remove())
        );
      }
    });
    await Fx.wait(300);
    Fx.shake(targetEl, 6);
    Fx.flash(targetEl, '#FF6A3A', 0.6);
    await Fx.wait(500);

    // Dark smoke rises where the pillars burnt out.
    for (let i = 0; i < 9; i++) {
      const s = w * (0.35 + Math.random() * 0.2);
      const smoke = document.createElement('div');
      smoke.style.cssText = `position:absolute;width:${s}px;height:${s}px;border-radius:50%;pointer-events:none;background:radial-gradient(circle at 40% 40%,#5A3A34,#2A1A18 55%,#1A0E0C00 75%)`;
      const off = pillars[i % 3];
      Fx.place(smoke, { x: foot.x + off * w, y: foot.y - height * (0.3 + Math.random() * 0.4) });
      fxEl.appendChild(smoke);
      effects.push(
        Fx.anim(smoke, [
          { transform: 'translateY(0) scale(.5)', opacity: 0 },
          { transform: 'translateY(-12px) scale(1)', opacity: 0.85, offset: 0.35 },
          { transform: 'translateY(-40px) scale(1.4)', opacity: 0 }
        ], { duration: 700, delay: Math.random() * 150, easing: 'ease-out' }).then(() => smoke.remove())
      );
    }
    await Promise.all(effects);
  }
}
