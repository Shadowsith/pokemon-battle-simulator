/** The battle field's design size; all field CSS and effect coordinates use it. */
export const FIELD_WIDTH = 640;
export const FIELD_HEIGHT = 300;

/** Same breakpoint as `battle-portrait.scss`: below it the field is laid out, not scaled. */
const PORTRAIT_QUERY = '(max-width: 639px)';

/**
 * Zooms the 640 × 300 battle field to fill the free space on wide screens.
 * Watches the area the field may use and writes the zoom factor as the
 * `--field-scale` CSS variable, which the field (CSS `scale`) and the layout
 * around it read. Never shrinks the field below its design size.
 */
export class FieldScaler {
  private observer: ResizeObserver | null = null;

  /**
   * Start watching `area` and write `--field-scale` onto `target`. `beside`
   * are fixed-width elements sharing the row with the field (hidden ones
   * measure 0), so their width is not available to the field.
   */
  start(area: HTMLElement, target: HTMLElement, beside: HTMLElement[] = []): void {
    this.stop();
    if (typeof ResizeObserver === 'undefined') return;
    this.observer = new ResizeObserver(() => this.update(area, target, beside));
    this.observer.observe(area);
  }

  stop(): void {
    this.observer?.disconnect();
    this.observer = null;
  }

  private update(area: HTMLElement, target: HTMLElement, beside: HTMLElement[]): void {
    target.style.setProperty('--field-scale', String(this.scaleFor(area, beside)));
  }

  private scaleFor(area: HTMLElement, beside: HTMLElement[]): number {
    if (window.matchMedia(PORTRAIT_QUERY).matches) return 1;
    const width = area.clientWidth - beside.reduce((sum, el) => sum + el.offsetWidth, 0);
    const k = Math.min(width / FIELD_WIDTH, area.clientHeight / FIELD_HEIGHT);
    // Two decimals: stable values, no sub-pixel jitter from tiny resizes.
    return Math.max(1, Math.floor(k * 100) / 100);
  }
}
