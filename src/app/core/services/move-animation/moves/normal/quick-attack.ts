import { Point, BattleStageRefs, MoveVisual } from '../../animation.types';
import { Fx } from '../../fx';
import { FxGlyphs } from '../../fx-glyphs';

/**
 * Quick Attack, after the Gen 4 / Gen 5 animation:
 * - Gen 4: https://www.pokewiki.de/images/4/40/Ruckzuckhieb_Gen4.png
 * - Gen 5: https://www.pokewiki.de/images/3/33/Ruckzuckhieb_Gen5.png
 *
 * The user dashes at the target in a flash, leaving a trail of see-through
 * afterimages, and springs back (0-0.36 s). It strikes at 0.12 s: a white
 * glint, then yellow stars burst out and drift up off the target as they
 * fade (to ~0.65 s).
 */
export class QuickAttack {
  static async play(refs: BattleStageRefs, target: Point, v: MoveVisual) {
    const { fxEl, launchEl, targetEl } = refs;
    const tr = Fx.rect(targetEl);
    const base = launchEl.style.transform;
    const reach = v.dir * 56;
    const dash: Keyframe[] = [
      { transform: `${base} translateX(0)` },
      { transform: `${base} translateX(${reach}px)`, offset: 0.33 },
      { transform: `${base} translateX(${reach * 0.85}px)`, offset: 0.45 },
      { transform: `${base} translateX(0)` }
    ];
    // Afterimages: copies of the sprite just behind it, lagging a little.
    const trail = [40, 80, 120].map((delay, i) => {
      const copy = launchEl.cloneNode(false) as HTMLElement;
      // No slot id: sprite lookups by `data-slot` must keep finding the real one.
      copy.removeAttribute('data-slot');
      copy.classList.remove('acting');
      copy.style.pointerEvents = 'none';
      copy.style.opacity = '0';
      launchEl.before(copy);
      const alpha = 0.45 - i * 0.12;
      return Fx.anim(copy, dash.map((f, k) => ({ ...f, opacity: k === 0 || k === dash.length - 1 ? 0 : alpha })), {
        duration: 360,
        delay,
        easing: 'ease-out',
        fill: 'none'
      }).then(() => copy.remove());
    });
    const run = Fx.anim(launchEl, dash, { duration: 360, easing: 'ease-out', fill: 'none' });
    await Fx.wait(120);

    Fx.flash(targetEl, '#FFFFFF', 0.6);
    Fx.shake(targetEl, 4);
    const effects: Promise<void>[] = [
      run,
      ...trail,
      Fx.spawn(fxEl, FxGlyphs.sparkStar(Math.max(tr.width * 0.4, 28), '#FFFFFF'), target, [
        { transform: 'scale(.3) rotate(0deg)', opacity: 1 },
        { transform: 'scale(1) rotate(20deg)', opacity: 1, offset: 0.4 },
        { transform: 'scale(.4) rotate(40deg)', opacity: 0 }
      ], { duration: 240, easing: 'ease-out' })
    ];
    for (let i = 0; i < 8; i++) {
      const a = -Math.PI / 2 + (Math.random() * 2 - 1) * Math.PI * 0.55;
      const d = Math.max(tr.width * 0.6, 40) * (0.6 + Math.random() * 0.6);
      effects.push(
        Fx.spawn(fxEl, FxGlyphs.sparkStar(9 + Math.random() * 5, '#FFE04A'), target, [
          { transform: 'translate(0,0) scale(.4)', opacity: 1 },
          { transform: `translate(${Math.cos(a) * d * 0.7}px,${Math.sin(a) * d * 0.7}px) scale(1)`, opacity: 1, offset: 0.4 },
          { transform: `translate(${Math.cos(a) * d}px,${Math.sin(a) * d - 16}px) scale(.5)`, opacity: 0 }
        ], { duration: 500, delay: 60 + i * 15, easing: 'ease-out' })
      );
    }
    await Promise.all(effects);
  }
}
