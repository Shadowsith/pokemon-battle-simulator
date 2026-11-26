import { Point, BattleStageRefs } from '../../animation.types';
import { Fx } from '../../fx';
import { FxGlyphs } from '../../fx-glyphs';

/** A ring pulses out of the user every `GAP` ms from 0; the note bubble rises from `BUBBLE` (ms); the target is hit at `HIT` (ms). */
const GAP = 160;
const RINGS = 6;
const BUBBLE = 300;
const HIT = 1000;

/**
 * Chatter, after the Gen 4 / Gen 5 animation:
 * - Gen 4: https://www.pokewiki.de/images/0/0e/Geschw%C3%A4tz_Gen4.png
 * - Gen 5: https://www.pokewiki.de/images/6/68/Geschw%C3%A4tz_Gen5.png
 *
 * The user chatters: yellow, blue and orange rings pulse out round it one
 * after another (0-1.2 s) while it bobs. A white speech bubble with music
 * notes pops up above it and wobbles (0.3-1.3 s). The noise reaches the
 * target, which shakes (1.0 s).
 */
export class Chatter {
  static async play(refs: BattleStageRefs, launch: Point) {
    const { fxEl, launchEl, targetEl } = refs;
    const r = Fx.rect(launchEl);
    const size = Math.max(r.width, r.height, 60) * 0.9;
    const original = launchEl.style.transform;
    const colors = ['#FFE04A', '#4A7AFF', '#FF8A3A'];
    const effects: Promise<void>[] = [];
    for (let i = 0; i < RINGS; i++) {
      const c = colors[i % colors.length];
      const ring = Fx.box(size * 0.5, size * 0.5, `border-radius:50%;border:5px solid ${c};box-shadow:0 0 8px ${c}`);
      effects.push(Fx.spawn(fxEl, ring, launch, [
        { transform: 'scale(.4)', opacity: 0 },
        { transform: 'scale(1)', opacity: 0.95, offset: 0.25 },
        { transform: 'scale(2)', opacity: 0 }
      ], { duration: 450, delay: i * GAP, easing: 'ease-out' }));
    }
    const bob: Keyframe[] = [];
    for (let k = 0; k <= 8; k++) bob.push({ transform: `${original} translateY(${k % 2 ? -4 : 0}px)` });
    effects.push(Fx.anim(launchEl, bob, { duration: RINGS * GAP, easing: 'linear', fill: 'none' }));

    const bs = Math.max(r.width * 0.45, 30);
    const bubble = FxGlyphs.noteBubble(bs, '♫');
    effects.push(Fx.spawn(fxEl, bubble, { x: launch.x, y: launch.y - r.height * 0.6 }, [
      { transform: 'translateY(10px) scale(.2)', opacity: 0 },
      { transform: 'translateY(0) scale(1.1) rotate(-8deg)', opacity: 1, offset: 0.2 },
      { transform: 'translateY(-4px) scale(1) rotate(8deg)', opacity: 1, offset: 0.45 },
      { transform: 'translateY(-6px) scale(1) rotate(-8deg)', opacity: 1, offset: 0.7 },
      { transform: 'translateY(-14px) scale(.8) rotate(0deg)', opacity: 0 }
    ], { duration: 1000, delay: BUBBLE, easing: 'ease-in-out' }));
    for (let i = 0; i < 3; i++) {
      effects.push(Fx.spawn(fxEl, FxGlyphs.musicNote(bs * 0.45, ['#FF5AA0', '#4A7AFF', '#FFB020'][i]), { x: launch.x + (i - 1) * bs * 0.6, y: launch.y - r.height * 0.6 }, [
        { transform: 'translate(0,0)', opacity: 0 },
        { transform: 'translate(0,-8px)', opacity: 1, offset: 0.3 },
        { transform: `translate(${(i - 1) * 10}px,-28px)`, opacity: 0 }
      ], { duration: 600, delay: BUBBLE + 250 + i * 150, easing: 'ease-out' }));
    }
    effects.push(Fx.wait(HIT).then(() => Fx.shake(targetEl, 4)));
    await Promise.all(effects);
  }
}
