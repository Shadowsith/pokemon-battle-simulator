import { Point } from './animation.types';

/** Low-level DOM animation primitives shared by every move animation. */
export class Fx {
  static anim(el: Element, frames: Keyframe[], opts: KeyframeAnimationOptions): Promise<void> {
    const a = el.animate(frames, { fill: 'both', ...opts });
    return a.finished.then(() => void 0).catch(() => void 0);
  }

  static wait(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  static flash(el: HTMLElement, color: string, intensity = 0.5): void {
    const blur = 4 + intensity * 20;
    el.style.filter = `brightness(${1 + intensity}) drop-shadow(0 0 ${blur}px ${color})`;
    setTimeout(() => (el.style.filter = ''), 150);
  }

  /** Classic hit blink: the sprite flickers off and on a few times. */
  static blink(el: HTMLElement, times = 4, ms = 70): Promise<void> {
    const frames: Keyframe[] = [];
    // step-end on each frame: hard on/off cuts instead of fading.
    for (let i = 0; i < times; i++) frames.push({ opacity: 0, easing: 'step-end' }, { opacity: 1, easing: 'step-end' });
    frames.push({ opacity: 1 });
    return Fx.anim(el, frames, { duration: times * 2 * ms, easing: 'linear', fill: 'none' });
  }

  static shake(el: HTMLElement, amp = 4): void {
    let i = 0;
    const base = el.style.transform.replace(/translate\([^)]*\)/g, '');
    const t = setInterval(() => {
      el.style.transform = `${base} translateX(${i % 2 ? -amp : amp}px)`;
      if (++i > 5) {
        clearInterval(t);
        el.style.transform = base;
      }
    }, 40);
  }

  static shakeField(fieldEl: HTMLElement, scale = 1): void {
    let i = 0;
    const a = 6 * scale;
    const t = setInterval(() => {
      fieldEl.style.transform = `translate(${(i % 2 ? -a : a).toFixed(1)}px,${i % 3 ? 2 : -2}px)`;
      if (++i > 10) {
        clearInterval(t);
        fieldEl.style.transform = '';
      }
    }, 45);
  }

  static screenWash(
    screenFxEl: HTMLElement,
    color: string,
    rampMs: number,
    holdMs: number,
    anchorX = '65%'
  ): void {
    screenFxEl.style.background = `radial-gradient(circle at ${anchorX} 40%, ${color}, transparent 75%)`;
    screenFxEl.style.transition = `opacity ${rampMs}ms ease-out`;
    screenFxEl.style.opacity = '1';
    setTimeout(() => {
      screenFxEl.style.transition = `opacity ${rampMs}ms ease-in`;
      screenFxEl.style.opacity = '0';
    }, holdMs);
  }

  /**
   * A temporary layer that replaces the battle backdrop. It is inserted as the
   * field's first child, so it sits behind the platforms, sprites and HUD.
   */
  static backdrop(fieldEl: HTMLElement, css: string): HTMLElement {
    const bg = document.createElement('div');
    bg.style.cssText = `position:absolute;inset:0;overflow:hidden;pointer-events:none;${css}`;
    fieldEl.insertBefore(bg, fieldEl.firstChild);
    return bg;
  }

  static centerOf(el: HTMLElement, fieldEl: HTMLElement): Point {
    const r = el.getBoundingClientRect();
    const f = fieldEl.getBoundingClientRect();
    return { x: r.left - f.left + r.width / 2, y: r.top - f.top + r.height / 2 };
  }

  /** Bottom-centre of a sprite (where it stands), in field coordinates. */
  static footOf(el: HTMLElement, fieldEl: HTMLElement): Point {
    const r = el.getBoundingClientRect();
    const f = fieldEl.getBoundingClientRect();
    return { x: r.left - f.left + r.width / 2, y: r.bottom - f.top - 6 };
  }

  static place(el: HTMLElement, p: Point): void {
    const w = parseFloat(el.style.width) || 0;
    const h = parseFloat(el.style.height) || 0;
    el.style.position = 'absolute';
    el.style.left = `${p.x - w / 2}px`;
    el.style.top = `${p.y - h / 2}px`;
  }

  static clamp(n: number, lo: number, hi: number): number {
    return Math.max(lo, Math.min(hi, n));
  }

  /** SVG polyline points for a jagged lightning path from (x0,y0) to (x1,y1); jag = max px of sideways kink. */
  static zigzagPoints(x0: number, y0: number, x1: number, y1: number, jag: number): string {
    const pts: string[] = [];
    const segs = Math.max(4, Math.round((y1 - y0) / 18));
    for (let k = 0; k <= segs; k++) {
      const t = k / segs;
      const off = k === 0 || k === segs ? 0 : (Math.random() * 2 - 1) * jag;
      pts.push(`${(x0 + (x1 - x0) * t + off).toFixed(1)},${(y0 + (y1 - y0) * t).toFixed(1)}`);
    }
    return pts.join(' ');
  }
}
