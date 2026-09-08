import { Facing, OverworldMap } from './overworld-map.model';
import { Tileset } from './tileset';

/** Held-direction flags, filled by the page from the keyboard / on-screen D-pad. */
export interface OverworldInput {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
}

const STEP_MS = 150; // time to cross one tile
const DIRS: Record<Facing, { dx: number; dy: number }> = {
  up: { dx: 0, dy: -1 },
  down: { dx: 0, dy: 1 },
  left: { dx: -1, dy: 0 },
  right: { dx: 1, dy: 0 }
};

/** Flat colours for the no-art fallback, keyed by ground tile id. */
const DEBUG_GROUND: Record<number, string> = {
  1: '#6cbf5b', // grass
  2: '#e6d29a', // path / sand
  3: '#3f9e46', // tall grass
  4: '#4a90c2', // water
  5: '#b98a5a', // house wall
  6: '#7a5a3a' // tree trunk
};
const DEBUG_OVERLAY: Record<number, string> = {
  10: '#2f7d3a', // tree canopy
  11: '#9c4a3a' // house roof / front
};

interface Step {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  elapsed: number;
}

/**
 * Framework-agnostic overworld: holds the map + player, advances tile-by-tile
 * movement with collision and a follow camera, and renders to a 2D context at a
 * fixed logical resolution. Renders flat debug tiles until a tileset image loads.
 */
export class OverworldEngine {
  private step: Step | null = null;
  private walkTimer = 0;

  readonly tile: number;
  player: { tileX: number; tileY: number; pixelX: number; pixelY: number; facing: Facing };
  camX = 0;
  camY = 0;

  constructor(
    readonly map: OverworldMap,
    private readonly tileset: Tileset,
    private readonly playerSheet: Tileset | null
  ) {
    this.tile = map.tileSize;
    this.player = {
      tileX: map.spawn.x,
      tileY: map.spawn.y,
      pixelX: map.spawn.x * this.tile,
      pixelY: map.spawn.y * this.tile,
      facing: map.spawn.facing
    };
  }

  get moving(): boolean {
    return this.step !== null;
  }

  private solidAt(x: number, y: number): boolean {
    if (x < 0 || y < 0 || x >= this.map.width || y >= this.map.height) return true;
    return this.map.solid[y * this.map.width + x] === 1;
  }

  private pressedDir(input: OverworldInput): Facing | null {
    // Vertical wins ties, matching the classic games' feel.
    if (input.up) return 'up';
    if (input.down) return 'down';
    if (input.left) return 'left';
    if (input.right) return 'right';
    return null;
  }

  update(dtMs: number, input: OverworldInput, logicalW: number, logicalH: number): void {
    const dt = Math.min(dtMs, 64); // ignore huge stalls (tab was backgrounded)

    if (this.step) {
      this.step.elapsed += dt;
      const t = Math.min(1, this.step.elapsed / STEP_MS);
      this.player.pixelX = lerp(this.step.fromX, this.step.toX, t) * this.tile;
      this.player.pixelY = lerp(this.step.fromY, this.step.toY, t) * this.tile;
      this.walkTimer += dt;
      if (t >= 1) {
        this.player.tileX = this.step.toX;
        this.player.tileY = this.step.toY;
        this.player.pixelX = this.step.toX * this.tile;
        this.player.pixelY = this.step.toY * this.tile;
        this.step = null;
      }
    }

    if (!this.step) {
      const dir = this.pressedDir(input);
      if (dir) {
        this.player.facing = dir;
        const nx = this.player.tileX + DIRS[dir].dx;
        const ny = this.player.tileY + DIRS[dir].dy;
        if (!this.solidAt(nx, ny)) {
          this.step = {
            fromX: this.player.tileX,
            fromY: this.player.tileY,
            toX: nx,
            toY: ny,
            elapsed: 0
          };
        } else {
          this.walkTimer = 0; // stand still against the wall
        }
      } else {
        this.walkTimer = 0;
      }
    }

    // Follow camera, clamped so it never shows past the map edges.
    const mapPixelW = this.map.width * this.tile;
    const mapPixelH = this.map.height * this.tile;
    this.camX = clamp(this.player.pixelX + this.tile / 2 - logicalW / 2, 0, Math.max(0, mapPixelW - logicalW));
    this.camY = clamp(this.player.pixelY + this.tile / 2 - logicalH / 2, 0, Math.max(0, mapPixelH - logicalH));
  }

  render(ctx: CanvasRenderingContext2D, logicalW: number, logicalH: number): void {
    const T = this.tile;
    const camX = Math.round(this.camX);
    const camY = Math.round(this.camY);

    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, logicalW, logicalH);

    const x0 = Math.floor(camX / T);
    const y0 = Math.floor(camY / T);
    const x1 = Math.min(this.map.width - 1, Math.floor((camX + logicalW) / T));
    const y1 = Math.min(this.map.height - 1, Math.floor((camY + logicalH) / T));

    // --- ground ---
    for (let ty = y0; ty <= y1; ty++) {
      for (let tx = x0; tx <= x1; tx++) {
        const id = this.map.layers.ground[ty * this.map.width + tx];
        const dx = tx * T - camX;
        const dy = ty * T - camY;
        if (this.tileset.ready) {
          this.tileset.draw(ctx, id, dx, dy);
        } else {
          this.drawDebugTile(ctx, DEBUG_GROUND[id] ?? '#9a9a86', dx, dy, T);
        }
      }
    }

    // --- player (between ground and overlay) ---
    this.drawPlayer(ctx, Math.round(this.player.pixelX) - camX, Math.round(this.player.pixelY) - camY);

    // --- overlay (canopies, house fronts - draw over the player) ---
    for (let ty = y0; ty <= y1; ty++) {
      for (let tx = x0; tx <= x1; tx++) {
        const id = this.map.layers.overlay[ty * this.map.width + tx];
        if (id <= 0) continue;
        const dx = tx * T - camX;
        const dy = ty * T - camY;
        if (this.tileset.ready) {
          this.tileset.draw(ctx, id, dx, dy);
        } else {
          this.drawDebugTile(ctx, DEBUG_OVERLAY[id] ?? '#00000055', dx, dy, T);
        }
      }
    }
  }

  private drawPlayer(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    const T = this.tile;
    // Sheet columns: 0 = left foot forward, 1 = idle/standing, 2 = right foot
    // forward. Standing shows the middle frame. Down/up rows animate the two
    // outer frames (opposite feet); the side rows on this sheet only have one
    // distinct stride, so left/right bob between the stride and the neutral pose.
    const phase = Math.floor(this.walkTimer / 130) % 2 === 0;
    let frame = 1;
    if (this.step) {
      const sideways = this.player.facing === 'left' || this.player.facing === 'right';
      frame = sideways ? (phase ? 0 : 1) : phase ? 0 : 2;
    }

    if (this.playerSheet?.ready) {
      // Row order in the sheet: down, left, right, up. Frames may be taller than
      // one tile (head overhang) - align the feet to the tile and let the top
      // spill upward.
      const row = { down: 0, left: 1, right: 2, up: 3 }[this.player.facing];
      const offX = Math.round((this.playerSheet.cellWidth - T) / 2);
      const offY = this.playerSheet.cellHeight - T;
      this.playerSheet.draw(ctx, row * this.playerSheet.columns + frame + 1, x - offX, y - offY);
      return;
    }

    // Debug avatar: a rounded body + a notch showing the facing.
    ctx.fillStyle = '#d8483f';
    ctx.fillRect(x + 3, y + 2, T - 6, T - 3);
    ctx.fillStyle = '#f4d7b0';
    ctx.fillRect(x + 5, y + 2, T - 10, 4);
    ctx.fillStyle = '#222';
    const n =
      this.player.facing === 'up'
        ? [x + T / 2 - 1, y]
        : this.player.facing === 'down'
          ? [x + T / 2 - 1, y + T - 2]
          : this.player.facing === 'left'
            ? [x + 1, y + T / 2 - 1]
            : [x + T - 3, y + T / 2 - 1];
    ctx.fillRect(n[0], n[1], 2, 2);
    if (frame) {
      ctx.fillRect(x + 4, y + T - 2, 2, 2); // a bobbing foot while walking
    }
  }

  private drawDebugTile(ctx: CanvasRenderingContext2D, color: string, x: number, y: number, T: number): void {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, T, T);
    ctx.strokeStyle = 'rgba(0,0,0,0.08)';
    ctx.strokeRect(x + 0.5, y + 0.5, T - 1, T - 1);
  }
}

function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}
function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}
