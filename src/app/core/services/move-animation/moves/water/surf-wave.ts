import { Point, BattleStageRefs, MoveVisual } from '../../animation.types';
import { Fx } from '../../fx';
import { SplashTone, WaterCrash } from './water-crash';

/** Colours of a Surf-like wave: flood backdrop, wave body and foam, and the crash splash. */
export interface WaveStyle {
  flood: string;
  colors: {
    body: string;
    lineLight: string;
    lineDark: string;
    top: string;
    bottom: string;
    shadow: string;
    foam: string;
    foamGlow: string;
  };
  splash: SplashTone;
}

/** The big rolling wave of Surf and Muddy Water. */
export class SurfWave {
  /** Surf: dark blue sea with white foam. */
  static readonly SURF: WaveStyle = {
    flood: 'linear-gradient(180deg,#081A40,#0F3274 45%,#164496 70%,#0A2458)',
    colors: {
      body: '#123A86',
      lineLight: '#3F74C8',
      lineDark: '#1E4FA0',
      top: '#6FA3E8',
      bottom: '#061638',
      shadow: '#0A245899',
      foam: '#ffffff',
      foamGlow: '#DDEEFF'
    },
    splash: WaterCrash.SURF
  };

  /** Muddy Water: brown, clay-laden water with cream foam. */
  static readonly MUD: WaveStyle = {
    flood: 'linear-gradient(180deg,#3A2410,#6E4422 45%,#8A5A30 70%,#4A2E14)',
    colors: {
      body: '#7A4C26',
      lineLight: '#C89A62',
      lineDark: '#5E3A1A',
      top: '#E0B880',
      bottom: '#2E1A0A',
      shadow: '#3A221099',
      foam: '#FFF4E4',
      foamGlow: '#E8CFA8'
    },
    splash: WaterCrash.MUD
  };

  /**
   * Surf / Muddy Water (colours from `style`): a curling dark blue (or brown) wave - moving water inside, a white foam crest
   * throwing spray off its top - rises in front of the caster, then swells
   * huge while the field floods, rolls over to the target and crashes onto it.
   */
  static async play(refs: BattleStageRefs, launch: Point, target: Point, v: MoveVisual, style: WaveStyle) {
    const { fieldEl, fxEl, launchEl, targetEl } = refs;
    const f = Fx.rect(fieldEl);
    const lr = Fx.rect(launchEl);
    const tr = Fx.rect(targetEl);

    // 1. A wave rises in front of the caster, on its foe's side (0-0.5 s).
    const w = Math.max(lr.width * 1.3, 100);
    const h = w * 0.6;
    const wave = SurfWave.waveGlyph(w, h, v.dir, style);
    const base: Point = { x: launch.x + v.dir * w * 0.45, y: lr.bottom - f.top - h / 2 };
    Fx.place(wave, base);
    fxEl.appendChild(wave);
    const spray = SurfWave.crestSpray(fxEl, fieldEl, wave, v.dir, style);
    await Fx.anim(wave, [
      { transform: 'translate(0,0) scale(.7,0)', opacity: 0.7 },
      { transform: 'translate(0,0) scale(1,1.08)', opacity: 1, offset: 0.7 },
      { transform: 'translate(0,0) scale(1,1)', opacity: 1 }
    ], { duration: 450, easing: 'ease-out', fill: 'forwards' });
    await Fx.wait(120);

    // 2. The field floods while the wave swells and rolls to the target (0.57-1.3 s).
    const sea = Fx.backdrop(fieldEl, `background:${style.flood}`);
    Fx.anim(sea, [{ opacity: 0 }, { opacity: 0.95 }], { duration: 300, easing: 'ease-out', fill: 'forwards' });
    const grow = Math.max((tr.height * 1.5) / h, 1.8);
    const dx = target.x - v.dir * w * grow * 0.15 - base.x;
    const dy = tr.bottom - f.top - h / 2 - base.y;
    await Fx.anim(wave, [
      { transform: 'translate(0,0) scale(1,1)' },
      { transform: `translate(${dx * 0.45}px,${dy * 0.45}px) scale(${grow * 0.75},${grow * 0.7})`, offset: 0.5 },
      { transform: `translate(${dx}px,${dy}px) scale(${grow},${grow})` }
    ], { duration: 720, easing: 'ease-in', fill: 'forwards' });

    // 3. Crash (1.3 s): the lip falls onto the target and the wave collapses into splashes.
    spray.stop();
    Fx.anim(wave, [
      { transform: `translate(${dx}px,${dy}px) scale(${grow},${grow})`, opacity: 1 },
      { transform: `translate(${dx + v.dir * w * 0.3}px,${dy + h * 0.2}px) scale(${grow * 1.15},${grow * 0.35})`, opacity: 0 }
    ], { duration: 360, easing: 'ease-in' }).then(() => wave.remove());
    await WaterCrash.play(refs, target, style.splash);

    await Fx.anim(sea, [{ opacity: 0.95 }, { opacity: 0 }], { duration: 350, easing: 'ease-in' });
    sea.remove();
  }

  /** Counter for unique SVG ids (several waves can be on screen at once). */
  private static waveId = 0;

  /**
   * A curling wave, `w` x `h` px, breaking toward `dir`: water with light
   * wave lines drifting through it and a foam crest along its top (colours from `style`).
   */
  private static waveGlyph(w: number, h: number, dir: 1 | -1, style: WaveStyle): HTMLElement {
    const c = style.colors;
    const id = `surf${SurfWave.waveId++}`;
    // Silhouette (viewBox 200 x 120, breaking to the right): a long rising back,
    // a crest curling over at the front and a hollow under the lip.
    const top = 'M0,116 C36,104 78,52 118,24 C146,10 174,8 189,25 C197,34 194,47 182,49 C172,51 168,41 159,44';
    const body = `${top} C149,48 151,74 166,120 L0,120 Z`;
    const el = document.createElement('div');
    el.style.cssText = `position:absolute;width:${w}px;height:${h}px;pointer-events:none;transform-origin:50% 100%;filter:drop-shadow(0 0 6px ${c.shadow})`;
    el.innerHTML =
      `<svg width="100%" height="100%" viewBox="0 0 200 120" preserveAspectRatio="none" style="overflow:visible;transform:scaleX(${dir})">` +
      `<defs>` +
      `<pattern id="${id}p" width="40" height="18" patternUnits="userSpaceOnUse">` +
      `<rect width="40" height="18" fill="${c.body}"/>` +
      `<path d="M0,9 Q10,3 20,9 T40,9" fill="none" stroke="${c.lineLight}" stroke-width="2.2"/>` +
      `<path d="M0,15 Q10,11 20,15 T40,15" fill="none" stroke="${c.lineDark}" stroke-width="1.6"/>` +
      `</pattern>` +
      `<linearGradient id="${id}g" x1="0" y1="0" x2="0" y2="1">` +
      `<stop offset="0" stop-color="${c.top}" stop-opacity=".55"/><stop offset=".45" stop-color="${c.top}" stop-opacity="0"/>` +
      `<stop offset="1" stop-color="${c.bottom}" stop-opacity=".75"/></linearGradient>` +
      `<clipPath id="${id}c"><path d="${body}"/></clipPath>` +
      `</defs>` +
      `<g clip-path="url(#${id}c)"><rect class="flow" x="-40" y="0" width="280" height="120" fill="url(#${id}p)"/>` +
      `<rect width="200" height="120" fill="url(#${id}g)"/></g>` +
      `<path d="${top}" fill="none" stroke="${c.foamGlow}" stroke-width="9" stroke-linecap="round" opacity=".55"/>` +
      `<path d="${top}" fill="none" stroke="${c.foam}" stroke-width="4.5" stroke-linecap="round"/>` +
      `</svg>`;
    // The water inside drifts forward, so the wave looks like it's rolling.
    el.querySelector<SVGElement>('.flow')?.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(40px)' }], {
      duration: 420,
      iterations: Infinity,
      easing: 'linear'
    });
    return el;
  }

  /**
   * Foam spray keeps flying off the top of `wave` (its crest and curling lip)
   * until stopped: droplets and short streaks thrown back and up, then falling.
   */
  private static crestSpray(fxEl: HTMLElement, fieldEl: HTMLElement, wave: HTMLElement, dir: 1 | -1, style: WaveStyle): { stop: () => void } {
    const { foam, foamGlow } = style.colors;
    const timer = setInterval(() => {
      const r = Fx.rect(wave);
      const f = Fx.rect(fieldEl);
      if (r.height < 4) return;
      for (let i = 0; i < 3; i++) {
        // Somewhere along the upper crest, mostly near the curling front.
        const u = 0.45 + Math.random() * 0.5;
        const x = dir > 0 ? r.left + r.width * u : r.right - r.width * u;
        const y = r.top + r.height * (0.08 + (1 - u) * 0.45) - f.top;
        const s = 3 + Math.random() * 4;
        const drop = document.createElement('div');
        const streak = Math.random() < 0.35;
        drop.style.cssText = `position:absolute;width:${s}px;height:${streak ? s * 3 : s}px;border-radius:${s}px;pointer-events:none;background:radial-gradient(circle at 35% 30%,${foam},${foamGlow});box-shadow:0 0 4px ${foam}aa`;
        Fx.place(drop, { x: x - f.left, y });
        fxEl.appendChild(drop);
        const back = -dir * (10 + Math.random() * 30);
        const up = 14 + Math.random() * 24;
        Fx.anim(drop, [
          { transform: 'translate(0,0) scale(1)', opacity: 1 },
          { transform: `translate(${back * 0.6}px,${-up}px) scale(1)`, opacity: 1, offset: 0.45 },
          { transform: `translate(${back}px,${-up * 0.3}px) scale(.5)`, opacity: 0 }
        ], { duration: 420 + Math.random() * 200, easing: 'ease-out' }).then(() => drop.remove());
      }
    }, 45);
    return { stop: () => clearInterval(timer) };
  }
}
