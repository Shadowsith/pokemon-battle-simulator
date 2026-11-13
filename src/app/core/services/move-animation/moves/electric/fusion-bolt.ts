import { Point, BattleStageRefs } from '../../animation.types';
import { Fx } from '../../fx';
import { FxEffects } from '../../fx-effects';

/**
 * Fusion Bolt, after the Gen 5 animation:
 * - Gen 5: https://www.pokewiki.de/images/b/b1/Kreuzdonner_Gen5.png
 *
 * The scene turns a deep night blue with drifting blue motes (0-0.3 s). The
 * user turns into a blue, crackling silhouette (0.3-0.8 s) and vanishes into
 * a big electric-blue orb that swells up (0.8-1.1 s). The orb flies at the
 * target (1.1-1.45 s) and bursts on it (hit at 1.45 s); the target glows blue
 * while sparks crackle over it (to ~2.1 s), the user reappears and the scene
 * clears (to ~2.4 s).
 */
export class FusionBolt {
  static async play(refs: BattleStageRefs, launch: Point, target: Point) {
    const { fieldEl, fxEl, launchEl, targetEl } = refs;
    const W = fieldEl.clientWidth;
    const H = fieldEl.clientHeight;
    const lr = Fx.rect(launchEl);
    const tr = Fx.rect(targetEl);
    const night = Fx.backdrop(fieldEl, 'background:radial-gradient(ellipse at 50% 60%,#0E2A48,#061426 60%,#020810)');
    await Fx.anim(night, [{ opacity: 0 }, { opacity: 1 }], { duration: 300, easing: 'ease-out' });
    const motes: HTMLElement[] = [];
    for (let i = 0; i < 14; i++) {
      const m = document.createElement('div');
      const s = 3 + Math.random() * 4;
      m.style.cssText = `position:absolute;width:${s}px;height:${s}px;border-radius:50%;pointer-events:none;background:#4AB8FF;box-shadow:0 0 6px #4AB8FF`;
      Fx.place(m, { x: Math.random() * W, y: Math.random() * H * 0.8 });
      fxEl.appendChild(m);
      m.animate([{ opacity: 0.2 }, { opacity: 1 }, { opacity: 0.2 }], { duration: 600 + Math.random() * 500, iterations: Infinity });
      motes.push(m);
    }

    // 1. The user turns into a crackling blue silhouette.
    const blue = 'brightness(.6) sepia(1) saturate(6) hue-rotate(170deg) brightness(1.3)';
    await Fx.anim(launchEl, [{ filter: 'none' }, { filter: blue }], { duration: 300, fill: 'forwards' });
    const silSize = Math.max(lr.width, lr.height);
    const sil = document.createElement('div');
    sil.style.cssText = `width:${silSize}px;height:${silSize}px;pointer-events:none;filter:drop-shadow(0 0 3px #4AB8FF)`;
    Fx.place(sil, launch);
    fxEl.appendChild(sil);
    const stopSil = FxEffects.crackle(sil, silSize, '#9ADCFF');
    await Fx.wait(250);

    // 2. It vanishes into a swelling orb.
    const size = Math.max(silSize * 0.9, 60);
    const orb = document.createElement('div');
    orb.style.cssText =
      `width:${size}px;height:${size}px;border-radius:50%;pointer-events:none;` +
      'background:radial-gradient(circle at 45% 45%,#9ADCFF,#2A8CF0 45%,#1460D0cc 65%,#1460D000 75%);filter:drop-shadow(0 0 8px #2A8CF0)';
    Fx.place(orb, launch);
    fxEl.appendChild(orb);
    const stopOrb = FxEffects.crackle(orb, size, '#BFE8FF');
    const original = launchEl.style.transform;
    await Promise.all([
      Fx.anim(orb, [{ transform: 'scale(.3)', opacity: 0 }, { transform: 'scale(1)', opacity: 1 }], { duration: 300, easing: 'ease-out' }),
      Fx.anim(launchEl, [{ opacity: 1, filter: blue }, { opacity: 0, filter: blue }], { duration: 300, fill: 'forwards' })
    ]);
    stopSil();
    sil.remove();

    // 3. The orb flies at the target.
    const dx = target.x - launch.x;
    const dy = target.y - launch.y;
    await Fx.anim(orb, [
      { transform: 'translate(0,0) scale(1)' },
      { transform: `translate(${dx}px,${dy}px) scale(.8)` }
    ], { duration: 350, easing: 'ease-in' });

    // 4. The hit: the orb bursts, the target glows blue under crackling sparks.
    stopOrb();
    Fx.shakeField(fieldEl, 0.7);
    const sparkSize = Math.max(Math.max(tr.width, tr.height) * 1.1, 60);
    const sparks = document.createElement('div');
    sparks.style.cssText = `width:${sparkSize}px;height:${sparkSize}px;pointer-events:none;filter:drop-shadow(0 0 3px #4AB8FF)`;
    Fx.place(sparks, target);
    fxEl.appendChild(sparks);
    const stopSparks = FxEffects.crackle(sparks, sparkSize, '#9ADCFF');
    for (let i = 0; i < 3; i++) setTimeout(() => Fx.shake(targetEl, 5), i * 200);
    await Promise.all([
      Fx.anim(orb, [
        { transform: `translate(${dx}px,${dy}px) scale(.8)`, opacity: 1 },
        { transform: `translate(${dx}px,${dy}px) scale(1.8)`, opacity: 0 }
      ], { duration: 350, easing: 'ease-out' }).then(() => orb.remove()),
      Fx.anim(targetEl, [{ filter: 'none' }, { filter: blue, offset: 0.15 }, { filter: blue, offset: 0.8 }, { filter: 'none' }], {
        duration: 650,
        fill: 'none'
      })
    ]);
    stopSparks();
    sparks.remove();

    // 5. The user returns, the scene clears.
    launchEl.getAnimations?.().forEach((a) => a.cancel());
    launchEl.style.transform = original;
    await Promise.all([
      Fx.anim(launchEl, [{ opacity: 0 }, { opacity: 1 }], { duration: 300, fill: 'none' }),
      Fx.anim(night, [{ opacity: 1 }, { opacity: 0 }], { duration: 300, easing: 'ease-in' })
    ]);
    night.remove();
    motes.forEach((m) => m.remove());
  }
}
