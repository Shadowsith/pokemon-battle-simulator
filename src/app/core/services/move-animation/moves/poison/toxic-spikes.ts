import { Point, BattleStageRefs } from '../../animation.types';
import { Fx } from '../../fx';
import { FxGlyphs } from '../../fx-glyphs';

/**
 * Toxic Spikes, after the Gen 4 / Gen 5 animation:
 * - Gen 4: https://www.pokewiki.de/images/9/95/Giftspitzen_Gen4.png
 * - Gen 5: https://www.pokewiki.de/images/8/85/Giftspitzen_Gen5.png
 *
 * Four purple three-pronged spikes are lobbed one after another in arcs from
 * the user onto the foe's side (0-0.81 s, landings 0.45-0.81 s every
 * 0.12 s). Purple poison bubbles bubble up from each spike as it lands
 * (to ~1.4 s); the spikes fade (1.4-1.65 s).
 */
export class ToxicSpikes {
  static async play(refs: BattleStageRefs, launch: Point, target: Point) {
    const { fieldEl, fxEl, targetEl } = refs;
    const tr = Fx.rect(targetEl);
    const foot = Fx.footOf(targetEl, fieldEl);
    const spread = Math.max(tr.width * 0.7, 46);
    const arc = Math.max(fieldEl.clientHeight * 0.25, 60);

    const parts: Promise<void>[] = [];
    const spots = [-0.9, 0.35, -0.3, 0.9];
    for (let i = 0; i < spots.length; i++) {
      const w = 14 + Math.random() * 4;
      const spike = ToxicSpikes.spikeGlyph(w);
      Fx.place(spike, launch);
      fxEl.appendChild(spike);
      const land: Point = { x: target.x + spots[i] * spread, y: foot.y - w * 0.4 + (i % 2 ? -6 : 5) };
      const dx = land.x - launch.x;
      const dy = land.y - launch.y;
      // Every spike ends at 1.65 s: flight 0.45 s from its throw, rest until 1.4 s, fade.
      const start = i * 120;
      const dur = 1650 - start;
      const flight: Keyframe[] = [];
      for (let k = 0; k <= 6; k++) {
        const t = k / 6;
        flight.push({ transform: `translate(${dx * t}px,${dy * t - arc * 4 * t * (1 - t)}px) rotate(${t * 480}deg)`, opacity: k ? 1 : 0, offset: (t * 450) / dur });
      }
      parts.push(
        Fx.anim(spike, [
          ...flight,
          { transform: `translate(${dx}px,${dy}px) rotate(480deg)`, opacity: 1, offset: (1400 - start) / dur },
          { transform: `translate(${dx}px,${dy}px) rotate(480deg)`, opacity: 0 }
        ], { duration: dur, delay: start, easing: 'linear', fill: 'backwards' }).then(() => spike.remove())
      );
      for (let b = 0; b < 3; b++) parts.push(ToxicSpikes.bubbleUp(fxEl, land, start + 450 + b * 140));
    }
    await Promise.all(parts);
  }

  /** A purple poison bubble swells up from `at` after `delay` ms and pops. */
  private static bubbleUp(fxEl: HTMLElement, at: Point, delay: number): Promise<void> {
    const bubble = FxGlyphs.poisonBubble(6 + Math.random() * 5);
    Fx.place(bubble, { x: at.x + (Math.random() * 2 - 1) * 6, y: at.y - 4 });
    fxEl.appendChild(bubble);
    const rise = 18 + Math.random() * 16;
    const drift = (Math.random() * 2 - 1) * 8;
    return Fx.anim(bubble, [
      { transform: 'translate(0,0) scale(.2)', opacity: 0 },
      { transform: `translate(${drift * 0.4}px,${-rise * 0.4}px) scale(1)`, opacity: 1, offset: 0.35 },
      { transform: `translate(${drift}px,${-rise}px) scale(1.25)`, opacity: 0 }
    ], { duration: 520 + Math.random() * 120, delay, easing: 'ease-out', fill: 'backwards' }).then(() => bubble.remove());
  }

  /** A purple three-pronged spike `w` px wide, with a dark outline. */
  private static spikeGlyph(w: number): HTMLElement {
    const el = document.createElement('div');
    el.style.cssText = `position:absolute;width:${w}px;height:${w}px;pointer-events:none;filter:drop-shadow(0 1px 2px #00000088)`;
    el.innerHTML =
      '<svg width="100%" height="100%" viewBox="0 0 20 20"><defs><linearGradient id="toxicSpike" x1="0" y1="0" x2="1" y2="1">' +
      '<stop offset="0" stop-color="#E0A0FF"/><stop offset=".45" stop-color="#9A3ED0"/><stop offset="1" stop-color="#4A1070"/></linearGradient></defs>' +
      '<polygon points="10,1.5 12.6,9.5 18,16 10,13.6 2,16 7.4,9.5" fill="url(#toxicSpike)" stroke="#2A0840" stroke-width=".9" stroke-linejoin="round"/>' +
      '</svg>';
    return el;
  }
}
