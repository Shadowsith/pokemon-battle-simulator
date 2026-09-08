/**
 * An image sliced into a fixed grid of cells. `index` is 1-based (0 = blank);
 * `draw` maps it to a source rect via `columns` and the cell size. Cells are
 * square by default; pass `cellHeight` for taller frames (e.g. a character sheet
 * whose head overhangs the tile).
 */
export class Tileset {
  private image: HTMLImageElement | null = null;
  readonly cellWidth: number;
  readonly cellHeight: number;
  readonly columns: number;

  constructor(cellWidth: number, columns: number, cellHeight = cellWidth) {
    this.cellWidth = cellWidth;
    this.cellHeight = cellHeight;
    this.columns = columns;
  }

  /** True once an image has loaded; the engine falls back to debug tiles otherwise. */
  get ready(): boolean {
    return this.image !== null && this.image.complete && this.image.naturalWidth > 0;
  }

  /** Resolves whether the image loaded or not - the caller never needs to catch. */
  load(url: string): Promise<boolean> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        this.image = img;
        resolve(true);
      };
      img.onerror = () => {
        this.image = null;
        resolve(false);
      };
      img.src = url;
    });
  }

  /** Blit cell `index` (1-based) at integer destination `dx,dy`. No-op if blank / not ready. */
  draw(ctx: CanvasRenderingContext2D, index: number, dx: number, dy: number): void {
    if (!this.image || index <= 0) return;
    const i = index - 1;
    const sx = (i % this.columns) * this.cellWidth;
    const sy = Math.floor(i / this.columns) * this.cellHeight;
    ctx.drawImage(
      this.image,
      sx,
      sy,
      this.cellWidth,
      this.cellHeight,
      dx,
      dy,
      this.cellWidth,
      this.cellHeight
    );
  }
}
