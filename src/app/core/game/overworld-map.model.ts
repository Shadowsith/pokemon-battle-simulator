/**
 * Tile-based overworld map for the exploration (Erkundung) mode. Row-major
 * arrays, one entry per tile. `layers.overlay` index 0 means "nothing" so tree
 * canopies / house fronts can be drawn over the player. Authored by hand or
 * exported from Tiled and reshaped to this format.
 */
export type Facing = 'up' | 'down' | 'left' | 'right';

export interface OverworldMap {
  id: string;
  /** Map size in tiles. */
  width: number;
  height: number;
  /** Tile edge length in pixels (16 for the GBA look). */
  tileSize: number;
  /** Asset path of the tileset image, e.g. "assets/overworld/tileset.png". */
  tileset: string;
  /** Tiles per tileset row (for turning a tile index into a source rect). */
  columns: number;
  layers: {
    /** Ground layer, drawn under the player. 1-based tile ids; 0 = blank. */
    ground: number[];
    /** Drawn over the player. 0 = nothing. */
    overlay: number[];
  };
  /** Collision, parallel to the layers: 1 = blocked, 0 = walkable. */
  solid: (0 | 1)[];
  spawn: { x: number; y: number; facing: Facing };
  /**
   * Optional shore auto-tiling: which tileset ids to overlay on a `fill` water
   * tile for each side / outer corner that touches land. Omit for no shore.
   */
  water?: {
    fill: number;
    edges: { n: number; e: number; s: number; w: number };
    corners: { ne: number; nw: number; se: number; sw: number };
  };
  /**
   * Optional tall-grass effect: standing on a `tile` ground tile, the engine
   * redraws `front` over the player so the blades cover the lower body.
   */
  tallGrass?: { tile: number; front: number };
}

/** Fetches and lightly validates one map JSON. Returns null on any failure. */
export async function loadMap(url: string): Promise<OverworldMap | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const m = (await res.json()) as OverworldMap;
    const tiles = m.width * m.height;
    if (
      !m ||
      !Number.isFinite(tiles) ||
      tiles <= 0 ||
      m.layers?.ground?.length !== tiles ||
      m.solid?.length !== tiles
    ) {
      return null;
    }
    if (m.layers.overlay?.length !== tiles) {
      m.layers.overlay = new Array(tiles).fill(0);
    }
    return m;
  } catch {
    return null;
  }
}
