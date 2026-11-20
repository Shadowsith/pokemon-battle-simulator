import { BattleStageRefs } from '../../animation.types';
import { Fx } from '../../fx';

/** Swirl pattern of the nightmare scene: dark maroon with lighter spiral rings (80 x 80 px tile). */
const NIGHTMARE_SWIRLS =
  'background-color:#5A1838;background-size:80px 80px;' +
  'background-image:repeating-radial-gradient(circle at 40px 40px,#5A1838 0 5px,#7A2850 5px 9px,#5A1838 9px 14px)';
/** When the nightmare scene flickers off for a moment, ms from the start. */
const BLINKS = [450, 1050];
const TOTAL = 1500;

/**
 * Nightmare, after the Gen 4 / Gen 5 animation:
 * - Gen 4 (DPPt): https://www.pokewiki.de/images/3/3d/Nachtmahr_DPPt.png
 * - Gen 4 (HGSS): https://www.pokewiki.de/images/5/5d/Nachtmahr_HGSS.png
 * - Gen 5: https://www.pokewiki.de/images/a/ae/Nachtmahr_Gen5.png
 *
 * The scene turns into a dark maroon dream of slowly drifting swirls
 * (0-0.2 s); it flickers away and back twice (0.45 and 1.05 s, 0.1 s each)
 * while the target trembles in its sleep and is tinted violet. Then the
 * scene clears (1.3-1.5 s).
 */
export class Nightmare {
  static async play(refs: BattleStageRefs) {
    const { fieldEl, targetEl } = refs;
    const at = (ms: number) => ms / TOTAL;
    const dream = Fx.backdrop(fieldEl, `${NIGHTMARE_SWIRLS};opacity:0`);
    const frames: Keyframe[] = [{ opacity: 0 }, { opacity: 1, offset: at(200) }];
    for (const t of BLINKS) {
      frames.push({ opacity: 1, offset: at(t) }, { opacity: 0, offset: at(t + 30) }, { opacity: 0, offset: at(t + 100) }, { opacity: 1, offset: at(t + 130) });
    }
    frames.push({ opacity: 1, offset: at(1300) }, { opacity: 0 });
    const drift = dream.animate([{ backgroundPosition: '0 0' }, { backgroundPosition: '40px 20px' }], { duration: TOTAL, easing: 'linear' });
    const scene = Fx.anim(dream, frames, { duration: TOTAL, easing: 'linear' });

    const base = targetEl.style.transform;
    const tremble: Keyframe[] = [{ transform: base, filter: 'none' }];
    for (let i = 1; i < 12; i++) {
      tremble.push({ transform: `${base} translateX(${i % 2 ? 2 : -2}px)`, filter: 'sepia(.6) saturate(2) hue-rotate(250deg) brightness(.85)', offset: i / 12 });
    }
    tremble.push({ transform: base, filter: 'none' });
    const shiver = Fx.anim(targetEl, tremble, { duration: 1000, easing: 'linear', delay: 250, fill: 'none' });
    await Promise.all([scene, shiver]);
    drift.cancel();
    dream.remove();
  }
}
