import { Point, BattleStageRefs } from '../../animation.types';
import { Fx } from '../../fx';

/** The pull lasts from `PULL` (ms) until `RELEASE` (ms). */
const PULL = 250;
const RELEASE = 1300;

/**
 * Gravity, after the Gen 4 / Gen 5 animation:
 * - Gen 4: https://www.pokewiki.de/images/2/2e/Erdanziehung_Gen4.png
 * - Gen 5: https://www.pokewiki.de/images/a/a8/Erdanziehung_Gen5.png
 *
 * The scene turns a murky violet with dark streaks pouring downward
 * (0-0.25 s). A dark swirling vortex opens at the user's feet (0.2-1.3 s)
 * and both Pokémon are pressed down and squashed against the ground
 * (0.25-1.3 s), then spring back as the scene clears (1.3-1.6 s).
 */
export class Gravity {
  static async play(refs: BattleStageRefs, launch: Point) {
    const { fieldEl, fxEl, launchEl, targetEl } = refs;
    const lr = Fx.rect(launchEl);
    const murk = Fx.backdrop(fieldEl,
      'background:repeating-linear-gradient(90deg,#00000000 0 10px,#1A102844 10px 14px,#00000000 14px 26px),linear-gradient(180deg,#6A5A8A,#3A2E52 60%,#241A36)');
    const effects: Promise<void>[] = [
      Fx.anim(murk, [{ opacity: 0 }, { opacity: 0.92 }], { duration: PULL, easing: 'ease-out' })
    ];
    // Dark streaks pour down over the whole scene.
    const f = Fx.rect(fieldEl);
    for (let i = 0; i < 14; i++) {
      const x = f.width * ((i * 0.37 + 0.03) % 1);
      const streak = Fx.box(3, f.height * 0.35, 'background:linear-gradient(180deg,#1A102800,#1A1028aa,#1A102800)');
      effects.push(Fx.spawn(fxEl, streak, { x, y: f.height * 0.2 }, [
        { transform: 'translateY(0)', opacity: 0 },
        { transform: `translateY(${f.height * 0.25}px)`, opacity: 1, offset: 0.4 },
        { transform: `translateY(${f.height * 0.6}px)`, opacity: 0 }
      ], { duration: 500, delay: PULL + (i * 83) % 700, easing: 'ease-in' }));
    }
    const vw = Math.max(lr.width * 1.6, 100);
    const vortex = Fx.box(vw, vw, 'border-radius:50%;background:repeating-conic-gradient(#120A1Ccc 0 20deg,#3A2A52aa 20deg 40deg);-webkit-mask:radial-gradient(circle,#000 0 30%,#000a 55%,transparent 70%);mask:radial-gradient(circle,#000 0 30%,#000a 55%,transparent 70%)');
    const flat = document.createElement('div');
    flat.style.cssText = 'position:absolute;width:0;height:0;pointer-events:none;transform:scaleY(.35)';
    Fx.place(flat, { x: launch.x, y: launch.y + lr.height * 0.42 });
    flat.appendChild(vortex);
    vortex.style.left = `${-vw / 2}px`;
    vortex.style.top = `${-vw / 2}px`;
    fxEl.appendChild(flat);
    // The vortex spins inside a flattened wrapper: it lies on the ground (only the effect turns).
    effects.push(Fx.anim(vortex, [
      { transform: 'rotate(0deg) scale(.2)', opacity: 0 },
      { transform: 'rotate(120deg) scale(1)', opacity: 1, offset: 0.2 },
      { transform: 'rotate(600deg) scale(1)', opacity: 1, offset: 0.85 },
      { transform: 'rotate(720deg) scale(.6)', opacity: 0 }
    ], { duration: RELEASE - 200, delay: 200, easing: 'linear' }).then(() => flat.remove()));
    for (const el of [launchEl, targetEl]) {
      const original = el.style.transform;
      const h = Fx.rect(el).height;
      // Squash round the feet: scale about the centre and shift down by the lost half height.
      const press = (sy: number, dy: number) => `${original} translateY(${h * (1 - sy) / 2 + dy}px) scaleY(${sy})`;
      effects.push(Fx.anim(el, [
        { transform: press(1, 0), offset: 0 },
        { transform: press(0.88, 2), offset: 0.2 },
        { transform: press(0.86, 3), offset: 0.85 },
        { transform: press(1.04, -3), offset: 0.93 },
        { transform: press(1, 0), offset: 1 }
      ], { duration: RELEASE + 150 - PULL, delay: PULL, easing: 'ease-in-out', fill: 'none' }));
    }
    await Promise.all(effects);
    await Fx.anim(murk, [{ opacity: 0.92 }, { opacity: 0 }], { duration: 300, easing: 'ease-in' });
    murk.remove();
  }
}
