import { Point, BattleStageRefs } from '../../animation.types';
import { Fx } from '../../fx';
import { FxGlyphs } from '../../fx-glyphs';
import { FxEffects } from '../../fx-effects';

/**
 * Head Charge, after the Gen 5 animation:
 * - Gen 5: https://www.pokewiki.de/images/3/38/Steinsch%C3%A4del_Gen5.png
 *
 * The user pulls back and charges head first (0-0.35 s). At the hit
 * (0.3 s) an amber ray backdrop flares round the target and an orange spiky
 * burst with a dark, rough core pops on it while red, pink and white stars
 * fly off (0.3-1.1 s). The rays fade (to ~1.35 s) and the user takes recoil
 * (to ~1.7 s).
 */
export class HeadCharge {
  static async play(refs: BattleStageRefs, launch: Point, target: Point) {
    const { fieldEl, fxEl, launchEl, targetEl } = refs;
    const tr = Fx.rect(targetEl);
    const original = launchEl.style.transform;
    const dx = target.x - launch.x;
    const dy = target.y - launch.y;
    const charge = Fx.anim(launchEl, [
      { transform: `${original} translate(0,0)` },
      { transform: `${original} translate(${-dx * 0.04}px,${-dy * 0.04}px)`, offset: 0.25 },
      { transform: `${original} translate(${dx * 0.35}px,${dy * 0.35}px)`, offset: 0.55 },
      { transform: `${original} translate(0,0)` }
    ], { duration: 600, easing: 'ease-in', fill: 'none' });
    await Fx.wait(300);

    // The hit: amber rays, an orange burst with a rough dark core, flying stars.
    const raysReady = FxEffects.burstBackdrop(fieldEl, target, 'amber');
    const size = Math.max(tr.width, tr.height) * 0.9;
    const burst = FxGlyphs.spikyBurst(size, '#FF7A2A', '#FF9A4A', '#FFB46A');
    Fx.place(burst, target);
    fxEl.appendChild(burst);
    const core = document.createElement('div');
    core.style.cssText =
      `width:${size * 0.4}px;height:${size * 0.4}px;border-radius:50%;pointer-events:none;` +
      'background:radial-gradient(circle,#1A0E08 2px,#3A2010 3px,#1A0E08 5px) 0 0/7px 7px,#2A160A';
    Fx.place(core, target);
    fxEl.appendChild(core);
    Fx.shakeField(fieldEl, 0.8);
    Fx.shake(targetEl, 8);
    setTimeout(() => Fx.shake(targetEl, 5), 300);
    const pop = (el: HTMLElement) =>
      Fx.anim(el, [
        { transform: 'scale(.3)', opacity: 1 },
        { transform: 'scale(1)', opacity: 1, offset: 0.3 },
        { transform: 'scale(1.05)', opacity: 1, offset: 0.7 },
        { transform: 'scale(1.15)', opacity: 0 }
      ], { duration: 700, easing: 'ease-out' }).then(() => el.remove());
    const effects: Promise<void>[] = [charge, pop(burst), pop(core)];
    const colors: [string, string, string][] = [
      ['#FF3A3A', '#FF5A5A', '#E02020'],
      ['#FFA0C0', '#FFC0D8', '#FF80A8'],
      ['#FFFFFF', '#FFFFFF', '#F0EAFF']
    ];
    for (let i = 0; i < 7; i++) {
      const [glow, c, edge] = colors[i % 3];
      const star = FxGlyphs.fivePointStar(10 + Math.random() * 6, glow, c, edge);
      Fx.place(star, target);
      fxEl.appendChild(star);
      const ang = Math.random() * Math.PI * 2;
      const d = size * (0.55 + Math.random() * 0.3);
      effects.push(
        Fx.anim(star, [
          { transform: 'translate(0,0) rotate(0deg)', opacity: 1 },
          { transform: `translate(${Math.cos(ang) * d}px,${Math.sin(ang) * d}px) rotate(${(Math.random() * 2 - 1) * 180}deg)`, opacity: 0 }
        ], { duration: 650 + Math.random() * 150, easing: 'ease-out' }).then(() => star.remove())
      );
    }
    const rays = await raysReady;
    await Promise.all([...effects, Fx.wait(700)]);
    await Fx.anim(rays, [{ opacity: 1 }, { opacity: 0 }], { duration: 250, easing: 'ease-in' });
    rays.remove();

    // Recoil.
    Fx.flash(launchEl, '#E06666', 0.6);
    Fx.shake(launchEl, 6);
    await Fx.wait(350);
  }
}
