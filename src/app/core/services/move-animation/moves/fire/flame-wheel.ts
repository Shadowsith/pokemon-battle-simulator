import { Point, BattleStageRefs, MoveVisual } from '../../animation.types';
import { Fx } from '../../fx';
import { FxGlyphs } from '../../fx-glyphs';

/** How many flames make up the wheel. */
const FLAMES = 8;
/** The wheel spins up round the user until `CHARGE`, then rolls into the target, hitting at `HIT` (ms). */
const CHARGE = 600;
const HIT = 800;

/**
 * Flame Wheel, after the Gen 4 / Gen 5 animation:
 * - Gen 4: https://www.pokewiki.de/images/6/67/Flammenrad_Gen4.png
 * - Gen 5: https://www.pokewiki.de/images/2/27/Flammenrad_Gen5.png
 *
 * A ring of flames lights up and spins round the user, which glows orange
 * (0-0.6 s). Wrapped in the wheel of fire, the user rolls into the target
 * (0.6-0.8 s, hit at 0.8 s): a hot burst flares, flames scatter off the target
 * and it flashes red, while the user slides back home (0.8-1.1 s) and the
 * flames fade (to ~1.3 s).
 */
export class FlameWheel {
  static async play(refs: BattleStageRefs, launch: Point, target: Point, v: MoveVisual) {
    const { fxEl, launchEl, targetEl } = refs;
    const lr = Fx.rect(launchEl);
    const tr = Fx.rect(targetEl);
    const radius = Math.max(lr.width, lr.height, 50) * 0.55;
    const base = launchEl.style.transform;
    const dx = (target.x - launch.x) * 0.7;
    const dy = (target.y - launch.y) * 0.7;
    const total = 1100;
    const at = (ms: number) => ms / total;
    // Spin direction rolls towards the target.
    const spin = v.dir * 360;

    // The flames sit in a ring inside a wheel that spins and rolls with the user.
    const wheel = Fx.box(radius * 2, radius * 2, '');
    for (let i = 0; i < FLAMES; i++) {
      const a = (Math.PI * 2 * i) / FLAMES;
      const s = radius * 0.6;
      const flame = FxGlyphs.firePuff(s);
      Fx.place(flame, { x: radius + Math.cos(a) * radius * 0.85, y: radius + Math.sin(a) * radius * 0.85 });
      wheel.appendChild(flame);
    }
    const roll = Fx.spawn(fxEl, wheel, launch, [
      { transform: 'translate(0,0) rotate(0deg) scale(.5)', opacity: 0 },
      { transform: `translate(0,0) rotate(${spin * 0.4}deg) scale(1)`, opacity: 1, offset: at(200) },
      { transform: `translate(0,0) rotate(${spin * 1.5}deg) scale(1)`, opacity: 1, offset: at(CHARGE), easing: 'ease-in' },
      { transform: `translate(${dx}px,${dy}px) rotate(${spin * 2.3}deg) scale(1)`, opacity: 1, offset: at(HIT), easing: 'ease-out' },
      { transform: `translate(${dx * 0.6}px,${dy * 0.6}px) rotate(${spin * 2.6}deg) scale(1.3)`, opacity: 0, offset: at(HIT + 200) },
      { transform: `translate(${dx * 0.6}px,${dy * 0.6}px) rotate(${spin * 2.6}deg) scale(1.3)`, opacity: 0 }
    ], { duration: total, easing: 'linear' });

    const glowFilter = 'sepia(1) saturate(4) hue-rotate(-15deg) brightness(1.1) drop-shadow(0 0 8px #FF8A2A)';
    const dash = Fx.anim(launchEl, [
      { transform: base, filter: 'none' },
      { transform: base, filter: glowFilter, offset: at(250) },
      { transform: base, filter: glowFilter, offset: at(CHARGE), easing: 'ease-in' },
      { transform: `${base} translate(${dx}px,${dy}px)`, filter: glowFilter, offset: at(HIT), easing: 'ease-out' },
      { transform: base, filter: 'none' }
    ], { duration: total, easing: 'linear', fill: 'none' });

    await Fx.wait(HIT);
    Fx.flash(targetEl, '#FF6A3A', 0.6);
    Fx.shake(targetEl, 5);
    const burst = Fx.spawn(fxEl, FxGlyphs.spikyBurst(Math.max(tr.width * 0.6, 40), '#F0602A', '#FFD04A', '#ffffff'), target, [
      { transform: 'scale(.3) rotate(0deg)', opacity: 1 },
      { transform: 'scale(1) rotate(15deg)', opacity: 1, offset: 0.4 },
      { transform: 'scale(1.1) rotate(25deg)', opacity: 0 }
    ], { duration: 280, easing: 'ease-out' });
    const embers: Promise<void>[] = [];
    for (let i = 0; i < 9; i++) {
      const a = -Math.PI / 2 + (Math.random() * 2 - 1) * 1.6;
      const dist = 30 + Math.random() * 30;
      embers.push(
        Fx.spawn(fxEl, FxGlyphs.firePuff(10 + Math.random() * 8, i % 3 ? 'hot' : 'red'), target, [
          { transform: 'translate(0,0) scale(.5)', opacity: 1 },
          { transform: `translate(${Math.cos(a) * dist}px,${Math.sin(a) * dist}px) scale(1)`, opacity: 0.9, offset: 0.5 },
          { transform: `translate(${Math.cos(a) * dist * 1.2}px,${Math.sin(a) * dist + 20}px) scale(.6)`, opacity: 0 }
        ], { duration: 480, easing: 'ease-out', delay: Math.random() * 60 })
      );
    }
    await Promise.all([roll, dash, burst, ...embers]);
  }
}
