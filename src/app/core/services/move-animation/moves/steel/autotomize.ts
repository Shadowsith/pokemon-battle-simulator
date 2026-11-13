import { Point, BattleStageRefs } from '../../animation.types';
import { Fx } from '../../fx';
import { FxGlyphs } from '../../fx-glyphs';

/**
 * Autotomize, after the Gen 5 animation:
 * - Gen 5: https://www.pokewiki.de/images/5/5a/Autotomie_Gen5.png
 *
 * The user glows silver-white and goes pale (0-0.45 s) and trembles
 * (0.35-0.6 s). It sheds its weight: grey metal flakes and orange sparks
 * burst off it and tumble to the ground (0.55-1.3 s), then it hops up
 * lightly (1.05-1.4 s) and the glow fades (to ~1.45 s).
 */
export class Autotomize {
  static async play(refs: BattleStageRefs, launch: Point) {
    const { fxEl, launchEl } = refs;
    const lr = Fx.rect(launchEl);
    const original = launchEl.style.transform;

    const glow = Fx.anim(launchEl, [
      { filter: 'brightness(1) saturate(1) drop-shadow(0 0 0 #ffffff00)' },
      { filter: 'brightness(1.7) saturate(.2) drop-shadow(0 0 8px #E4E8F0)', offset: 0.3 },
      { filter: 'brightness(1.7) saturate(.2) drop-shadow(0 0 8px #E4E8F0)', offset: 0.45 },
      { filter: 'brightness(1.1) saturate(.8) drop-shadow(0 0 4px #E4E8F0)', offset: 0.75 },
      { filter: 'brightness(1) saturate(1) drop-shadow(0 0 0 #ffffff00)' }
    ], { duration: 1450, easing: 'ease-in-out', fill: 'none' });
    await Fx.wait(350);

    // Trembling as the weight comes loose.
    const tremble: Keyframe[] = [];
    for (let k = 0; k <= 8; k++) tremble.push({ transform: `${original} translateX(${k === 8 ? 0 : k % 2 ? 3 : -3}px)` });
    await Fx.anim(launchEl, tremble, { duration: 250, easing: 'linear', fill: 'none' });

    // Shedding: metal flakes and orange sparks fall off and tumble down.
    const effects: Promise<void>[] = [glow];
    const floor = lr.height * 0.5;
    for (let i = 0; i < 16; i++) {
      const spark = i % 2 === 0;
      const s = spark ? 6 + Math.random() * 5 : 6 + Math.random() * 7;
      const el = document.createElement('div');
      el.style.cssText = spark
        ? `position:absolute;width:${s}px;height:${s}px;border-radius:50%;pointer-events:none;background:radial-gradient(circle,#FFF3C4,#FF9A2B 55%,#FF6A0000);box-shadow:0 0 6px #FF9A2B`
        : `position:absolute;width:${s}px;height:${s * 0.7}px;pointer-events:none;clip-path:polygon(15% 0,100% 25%,85% 100%,0 75%);background:linear-gradient(135deg,#E4E8F0,#7A8290)`;
      const from: Point = {
        x: launch.x + (Math.random() * 2 - 1) * lr.width * 0.4,
        y: launch.y + (Math.random() * 2 - 1) * lr.height * 0.35
      };
      Fx.place(el, from);
      fxEl.appendChild(el);
      const dx = (from.x - launch.x) * 0.6 + (Math.random() * 2 - 1) * 14;
      const fall = launch.y + floor - from.y;
      const spin = (Math.random() * 2 - 1) * 480;
      effects.push(
        Fx.anim(el, [
          { transform: 'translate(0,0) rotate(0deg) scale(.4)', opacity: 0 },
          { transform: `translate(${dx * 0.4}px,-10px) rotate(${spin * 0.3}deg) scale(1)`, opacity: 1, offset: 0.25 },
          { transform: `translate(${dx}px,${fall}px) rotate(${spin}deg) scale(1)`, opacity: 1, offset: 0.85 },
          { transform: `translate(${dx}px,${fall}px) rotate(${spin}deg) scale(.8)`, opacity: 0 }
        ], { duration: 600 + Math.random() * 200, delay: Math.random() * 150, easing: 'ease-in' }).then(() => el.remove())
      );
    }
    await Fx.wait(500);

    // Lighter now: a quick hop, with a silver glint.
    const glint = FxGlyphs.sparkStar(Math.max(lr.width * 0.3, 18), '#E4E8F0');
    Fx.place(glint, { x: launch.x + lr.width * 0.2, y: launch.y - lr.height * 0.3 });
    fxEl.appendChild(glint);
    effects.push(
      Fx.anim(glint, [
        { transform: 'scale(0) rotate(0deg)', opacity: 0 },
        { transform: 'scale(1.2) rotate(45deg)', opacity: 1, offset: 0.5 },
        { transform: 'scale(0) rotate(90deg)', opacity: 0 }
      ], { duration: 350, easing: 'ease-in-out' }).then(() => glint.remove()),
      Fx.anim(launchEl, [
        { transform: `${original} translateY(0)` },
        { transform: `${original} translateY(-16px)`, offset: 0.45 },
        { transform: `${original} translateY(0)`, offset: 0.8 },
        { transform: `${original} translateY(-3px)`, offset: 0.9 },
        { transform: `${original} translateY(0)` }
      ], { duration: 350, easing: 'ease-out', fill: 'none' })
    );
    await Promise.all(effects);
  }
}
