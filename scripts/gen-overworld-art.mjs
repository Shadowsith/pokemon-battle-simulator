// Builds the overworld art, no external deps:
//
//   public/assets/overworld/tileset.png   8 cols x 8 rows (128x128) - generated
//   public/assets/overworld/player.png    3 cols x 4 rows (48x80)
//       - sliced out of ./Townspeople.png (a user-supplied character sheet) when
//         that file is present, otherwise a plain generated placeholder.
//
// Tile ids are 1-based, row-major (columns: 8 in route01.json):
//   1 grass  2 road  3 tall grass  4 water fill  5 house wall  6 tree trunk
//   7 flower  8 ledge   10 tree canopy (overlay)  11 house roof (overlay)
//   12 rock (solid)  13 bush (solid)   22 tall-grass front (over the player)
//   14-17 water shore edges N/E/S/W (overlay)   18-21 shore corners NE/NW/SE/SW
//   25,26 2x2 tree canopy (overlay) + 33,34 2x2 tree trunk (ground)
//   29,30,37,38 2x2 boulder (ground, solid)
//   42 PC roof (red)  43 Mart roof (blue)  44 Gym roof (slate)  45 door - all with wall id 5
//   46 paved road (town streets; id 2 stays the dirt route road)
//   civic facades (Pokémon Center / Mart, FRLG style): 9 plaster wall  36 window
//   23 glass auto-door   24,27 red Poke Ball emblem (2 tiles)  28 "P.C" sign
//   31,32 blue Poke Ball emblem (2 tiles)  35 "MART" sign
//
// Player sheet layout: rows = down, left, right, up; col 0 = stand, cols 1-2 walk.
// Frames are 16 wide x 20 tall (the extra 4px is the head overhanging the tile).
//
// Run: node scripts/gen-overworld-art.mjs

import zlib from 'node:zlib';
import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import path from 'node:path';

// --- minimal RGBA PNG codec ------------------------------------------------

function crc32(buf) {
  let c = ~0 >>> 0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return (~c) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}
function encodePng(width, height, rgba) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  const stride = width * 4;
  const raw = Buffer.alloc(height * (1 + stride));
  for (let y = 0; y < height; y++) {
    raw[y * (1 + stride)] = 0;
    Buffer.from(rgba.buffer, rgba.byteOffset + y * stride, stride).copy(raw, y * (1 + stride) + 1);
  }
  const idat = zlib.deflateSync(raw, { level: 9 });
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))]);
}
/** Decode a non-interlaced 8-bit RGBA PNG to { width, height, data:Uint8Array }. */
function decodePng(buf) {
  let p = 8;
  let width = 0;
  let height = 0;
  const idat = [];
  while (p < buf.length) {
    const len = buf.readUInt32BE(p);
    const type = buf.toString('ascii', p + 4, p + 8);
    const data = buf.subarray(p + 8, p + 8 + len);
    if (type === 'IHDR') {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      if (data[8] !== 8 || data[9] !== 6) throw new Error('need 8-bit RGBA PNG');
    } else if (type === 'IDAT') {
      idat.push(data);
    } else if (type === 'IEND') break;
    p += 12 + len;
  }
  const stride = width * 4;
  const raw = zlib.inflateSync(Buffer.concat(idat));
  const out = Buffer.alloc(height * stride);
  for (let y = 0; y < height; y++) {
    const ft = raw[y * (stride + 1)];
    const row = raw.subarray(y * (stride + 1) + 1, y * (stride + 1) + 1 + stride);
    const prev = y > 0 ? out.subarray((y - 1) * stride, y * stride) : Buffer.alloc(stride);
    const cur = out.subarray(y * stride, (y + 1) * stride);
    for (let x = 0; x < stride; x++) {
      const a = x >= 4 ? cur[x - 4] : 0;
      const b = prev[x];
      const c = x >= 4 ? prev[x - 4] : 0;
      let v = row[x];
      if (ft === 1) v = (v + a) & 255;
      else if (ft === 2) v = (v + b) & 255;
      else if (ft === 3) v = (v + ((a + b) >> 1)) & 255;
      else if (ft === 4) {
        const pp = a + b - c;
        const pa = Math.abs(pp - a);
        const pb = Math.abs(pp - b);
        const pc = Math.abs(pp - c);
        v = (v + (pa <= pb && pa <= pc ? a : pb <= pc ? b : c)) & 255;
      }
      cur[x] = v;
    }
  }
  return { width, height, data: new Uint8Array(out) };
}

// --- tiny drawing surface ------------------------------------------------

class Surface {
  constructor(w, h) {
    this.w = w;
    this.h = h;
    this.data = new Uint8Array(w * h * 4);
  }
  set(x, y, [r, g, b, a = 255]) {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    const i = (y * this.w + x) * 4;
    this.data[i] = r;
    this.data[i + 1] = g;
    this.data[i + 2] = b;
    this.data[i + 3] = a;
  }
  rect(x, y, w, h, c) {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.set(x + i, y + j, c);
  }
  alpha(x, y) {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return 0;
    return this.data[(y * this.w + x) * 4 + 3];
  }
  /** Copy a sub-rect of a decoded image into this surface at (dx,dy). */
  blit(src, sx, sy, sw, sh, dx, dy) {
    for (let j = 0; j < sh; j++) {
      for (let i = 0; i < sw; i++) {
        const s = ((sy + j) * src.width + (sx + i)) * 4;
        this.set(dx + i, dy + j, [src.data[s], src.data[s + 1], src.data[s + 2], src.data[s + 3]]);
      }
    }
  }
  png() {
    return encodePng(this.w, this.h, this.data);
  }
}

const rng = (seed) => () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32);
const OUT = path.resolve('public/assets/overworld');
mkdirSync(OUT, { recursive: true });

// --- tileset -----------------------------------------------------------

const T = 16;
const COLS = 8;
const tileset = new Surface(COLS * T, 8 * T); // 8x8 grid, ids 1..64
const tileAt = (id, draw) => {
  const i = id - 1;
  draw((i % COLS) * T, Math.floor(i / COLS) * T);
};

const c8 = (v) => (v < 0 ? 0 : v > 255 ? 255 : v | 0);
const noisy = (base, n) => [c8(base[0] + n * 0.35), c8(base[1] + n), c8(base[2] + n * 0.35)];

// 1 grass - two-tone base with faint mow bands + scattered blade tufts
tileAt(1, (ox, oy) => {
  const r = rng(0x9e11);
  for (let y = 0; y < T; y++) {
    const band = (y >> 2) & 1 ? 7 : -5;
    for (let x = 0; x < T; x++) {
      const n = (r() * 20 - 10) | 0;
      tileset.set(ox + x, oy + y, noisy([70 + band, 150 + band, 58 + band], n));
    }
  }
  for (let k = 0; k < 4; k++) {
    const bx = 1 + ((r() * (T - 3)) | 0);
    const by = 3 + ((r() * (T - 6)) | 0);
    tileset.set(ox + bx + 1, oy + by, [56, 118, 44]);
    tileset.set(ox + bx, oy + by + 1, [56, 118, 44]);
    tileset.set(ox + bx + 2, oy + by + 1, [56, 118, 44]);
    tileset.set(ox + bx + 1, oy + by + 1, [92, 176, 78]);
  }
});
// 2 road - packed dirt with pebbles + clumps
tileAt(2, (ox, oy) => {
  const r = rng(0x2317);
  for (let y = 0; y < T; y++)
    for (let x = 0; x < T; x++) {
      const n = (r() * 26 - 13) | 0;
      tileset.set(ox + x, oy + y, [c8(196 + n), c8(168 + n), c8(120 + n * 0.6)]);
    }
  for (let k = 0; k < 3; k++) tileset.set(ox + ((r() * T) | 0), oy + ((r() * T) | 0), [150, 120, 82]);
  for (let k = 0; k < 5; k++) {
    const sx = 1 + ((r() * (T - 3)) | 0);
    const sy = 1 + ((r() * (T - 3)) | 0);
    tileset.set(ox + sx, oy + sy, [178, 168, 148]);
    tileset.set(ox + sx + 1, oy + sy, [128, 118, 100]);
    tileset.set(ox + sx, oy + sy + 1, [112, 102, 86]);
    tileset.set(ox + sx + 1, oy + sy + 1, [92, 84, 70]);
  }
});
// 3 tall grass - a leafy clump of blades on the grass field
tileAt(3, (ox, oy) => {
  const r = rng(0x31a7);
  // grass-field background so it blends with tile 1
  for (let y = 0; y < T; y++) {
    const band = (y >> 2) & 1 ? 7 : -5;
    for (let x = 0; x < T; x++) tileset.set(ox + x, oy + y, noisy([70 + band, 150 + band, 58 + band], (r() * 14 - 7) | 0));
  }
  const DARK = [30, 84, 38];
  const MID = [54, 132, 58];
  const LITE = [120, 198, 104];
  // one blade: a curved stroke from (baseX, 13) up to a tip
  const blade = (baseX, tipX, tipY) => {
    const span = 13 - tipY;
    for (let i = 0; i <= span; i++) {
      const t = i / span;
      const x = Math.round(baseX + (tipX - baseX) * t * t); // curls outward near the tip
      const y = 13 - i;
      tileset.set(ox + x, oy + y, i >= span - 1 ? LITE : DARK);
      tileset.set(ox + x + (tipX >= baseX ? -1 : 1), oy + y, MID);
    }
  };
  // base shadow
  for (let x = 3; x < 13; x++) tileset.set(ox + x, oy + 14, [42, 96, 42]);
  for (let x = 5; x < 11; x++) tileset.set(ox + x, oy + 13, [46, 108, 46]);
  // fan of blades - tall centre, splayed shorter ones to the sides
  blade(8, 8, 1);
  blade(8, 6, 3);
  blade(8, 10, 3);
  blade(7, 3, 4);
  blade(9, 13, 4);
  blade(7, 4, 6);
  blade(9, 12, 6);
  blade(8, 1, 8);
  blade(8, 15, 8);
  // a few stray short sprigs for texture
  for (let k = 0; k < 4; k++) {
    const bx = 2 + ((r() * 12) | 0);
    tileset.set(ox + bx, oy + 12, MID);
    tileset.set(ox + bx, oy + 11, DARK);
  }
});
// 22 tall grass FRONT - transparent, short blades drawn over the player's legs
tileAt(22, (ox, oy) => {
  const r = rng(0x22ff);
  const DARK = [30, 84, 38];
  const MID = [54, 132, 58];
  const LITE = [120, 198, 104];
  const blade = (baseX, tipX, tipY) => {
    const span = 14 - tipY;
    for (let i = 0; i <= span; i++) {
      const t = i / span;
      const x = Math.round(baseX + (tipX - baseX) * t * t);
      const y = 14 - i;
      tileset.set(ox + x, oy + y, i >= span - 1 ? LITE : DARK);
      tileset.set(ox + x + (tipX >= baseX ? -1 : 1), oy + y, MID);
    }
  };
  blade(8, 8, 5);
  blade(8, 5, 7);
  blade(8, 11, 7);
  blade(7, 3, 8);
  blade(9, 13, 8);
  blade(8, 1, 10);
  blade(8, 15, 10);
  for (let k = 0; k < 3; k++) tileset.set(ox + 2 + ((r() * 12) | 0), oy + 13, MID);
});
// 4 water - layered ripples + a sparkle
tileAt(4, (ox, oy) => {
  const r = rng(0x40aa);
  for (let y = 0; y < T; y++)
    for (let x = 0; x < T; x++)
      tileset.set(ox + x, oy + y, noisy([60, 124, 190], (r() * 14 - 7) | 0));
  for (const yy of [3, 8, 13]) for (let x = 0; x < T; x++) if ((x + yy) % 5 < 2) tileset.set(ox + x, oy + yy, [104, 168, 224]);
  tileset.set(ox + 4, oy + 5, [220, 240, 255]);
  tileset.set(ox + 5, oy + 5, [200, 230, 250]);
  tileset.rect(ox, oy + T - 2, T, 2, [48, 104, 158]);
});
// 5 house - wood siding with a framed window
tileAt(5, (ox, oy) => {
  for (let y = 0; y < T; y++) {
    const plank = (y >> 2) & 1;
    for (let x = 0; x < T; x++) tileset.set(ox + x, oy + y, plank ? [186, 132, 84] : [203, 148, 94]);
  }
  for (let y = 3; y < T; y += 4) tileset.rect(ox, oy + y, T, 1, [138, 94, 58]);
  tileset.rect(ox, oy, 1, T, [150, 104, 66]);
  tileset.rect(ox + 3, oy + 3, 10, 10, [110, 76, 48]);
  tileset.rect(ox + 4, oy + 4, 8, 8, [150, 210, 232]);
  tileset.rect(ox + 4, oy + 8, 8, 1, [104, 150, 178]);
  tileset.rect(ox + 8, oy + 4, 1, 8, [104, 150, 178]);
});
// 6 tree trunk (ground, paired with canopy 10) - lit-left bark + cast shadow
tileAt(6, (ox, oy) => {
  const r = rng(0x6a3c);
  for (let y = 0; y < T; y++) {
    const band = (y >> 2) & 1 ? 7 : -5;
    for (let x = 0; x < T; x++) tileset.set(ox + x, oy + y, [70 + band, 150 + band, 58 + band]);
  }
  // cast shadow to the lower-right
  for (let y = 0; y < T; y++)
    for (let x = 0; x < T; x++) {
      const nx = (x - 10) / 6;
      const ny = (y - 13) / 3;
      if (nx * nx + ny * ny < 1) tileset.set(ox + x, oy + y, [44, 96, 42]);
    }
  for (let y = 8; y < T - 1; y++)
    for (let x = 6; x < 11; x++) {
      let c = x < 7 ? [126, 90, 56] : x >= 10 ? [70, 46, 28] : [98, 68, 42];
      if (y % 3 === 1 && x > 7 && x < 10 && r() > 0.5) c = [66, 44, 26];
      tileset.set(ox + x, oy + y, c);
    }
  tileset.rect(ox + 5, oy + T - 2, 7, 1, [58, 40, 24]); // root flare
});
// 10 tree canopy (overlay) - a tiered conifer, lit from the upper-left
tileAt(10, (ox, oy) => {
  const r = rng(0x101f);
  const cx = 8;
  const foliage = (y, hw) => {
    for (let dx = -hw; dx <= hw; dx++) {
      const x = cx + dx;
      const lx = hw ? dx / hw : 0;
      const ly = y / 13; // 0 top .. 1 bottom
      let g;
      if (Math.abs(dx) >= hw) g = [22, 68, 30];
      else if (lx < -0.1 && ly < 0.62) g = [116, 202, 100];
      else if (lx > 0.33 || ly > 0.82) g = [36, 98, 42];
      else g = r() > 0.84 ? [44, 116, 50] : [62, 146, 64];
      tileset.set(ox + x, oy + y, g);
    }
  };
  // three overlapping tiers, widest at the bottom (drawn bottom-up)
  for (const [apex, base, wide] of [
    [4, 13, 7],
    [2, 9, 5],
    [0, 6, 3]
  ]) {
    for (let y = base; y >= apex; y--) {
      const t = (base - y) / (base - apex); // 0 at base .. 1 at apex
      foliage(y, Math.max(0, Math.round(wide * (1 - t))));
    }
    for (let dx = -wide; dx <= wide; dx++) tileset.set(ox + cx + dx, oy + base, [18, 60, 26]); // tier lip shadow
  }
});
// 7 flower patch
tileAt(7, (ox, oy) => {
  const r = rng(0x71ff);
  for (let y = 0; y < T; y++) {
    const band = (y >> 2) & 1 ? 7 : -5;
    for (let x = 0; x < T; x++) tileset.set(ox + x, oy + y, noisy([70 + band, 150 + band, 58 + band], (r() * 16 - 8) | 0));
  }
  for (const [cx, cy, col] of [
    [4, 6, [236, 96, 120]],
    [11, 5, [244, 214, 84]],
    [8, 12, [180, 130, 232]]
  ]) {
    tileset.set(ox + cx, oy + cy - 1, col);
    tileset.set(ox + cx - 1, oy + cy, col);
    tileset.set(ox + cx + 1, oy + cy, col);
    tileset.set(ox + cx, oy + cy + 1, col);
    tileset.set(ox + cx, oy + cy, [255, 255, 255]);
  }
});
// 8 ledge
tileAt(8, (ox, oy) => {
  const r = rng(0x81aa);
  for (let x = 0; x < T; x++) tileset.set(ox + x, oy + (r() > 0.5 ? 0 : 1), [70, 150, 58]);
  tileset.rect(ox, oy, T, 5, [70, 150, 58]);
  tileset.rect(ox, oy + 5, T, 2, [150, 116, 74]);
  for (let y = 7; y < T; y++)
    for (let x = 0; x < T; x++) tileset.set(ox + x, oy + y, noisy([176, 150, 100], (r() * 22 - 11) | 0));
  for (let x = 1; x < T; x += 5) tileset.rect(ox + x, oy + 7, 1, T - 8, [130, 104, 68]);
});
// Shingled roof (overlay) in an arbitrary hue. Transparent above y=2.
// A bright ridge cap up top, courses of shingles, a dark eave line + fascia
// at the bottom so the roof reads as a solid overhanging slab (FRLG look).
const roof = (id, base) =>
  tileAt(id, (ox, oy) => {
    const sh = (d) => [c8(base[0] + d), c8(base[1] + d), c8(base[2] + d)];
    for (let y = 2; y < T; y++) {
      const row = (y - 2) >> 1;
      for (let x = 0; x < T; x++) {
        const off = row & 1 ? 2 : 0;
        const gap = (x + off) % 4 === 0;
        tileset.set(ox + x, oy + y, sh(gap ? -32 : row & 1 ? -12 : 8));
      }
    }
    tileset.rect(ox, oy + 2, T, 1, sh(34)); // sunlit ridge cap
    tileset.rect(ox, oy + 3, T, 1, sh(14));
    tileset.rect(ox, oy + T - 3, T, 1, sh(-46)); // eave shadow line
    tileset.rect(ox, oy + T - 2, T, 2, sh(-26)); // fascia board
  });
roof(11, [92, 158, 78]); // house - green
roof(42, [188, 64, 56]); // Pokémon Center - red
roof(43, [58, 98, 178]); // Mart - blue
roof(44, [104, 108, 122]); // Gym / arena - slate
// 45 door - a doorway set into the wood siding
tileAt(45, (ox, oy) => {
  for (let y = 0; y < T; y++) {
    const plank = (y >> 2) & 1;
    for (let x = 0; x < T; x++) tileset.set(ox + x, oy + y, plank ? [186, 132, 84] : [203, 148, 94]);
  }
  tileset.rect(ox + 4, oy + 3, 8, T - 3, [96, 64, 40]);
  tileset.rect(ox + 5, oy + 4, 6, T - 4, [58, 38, 24]);
  tileset.rect(ox + 6, oy + 5, 4, 3, [80, 52, 32]);
  tileset.set(ox + 9, oy + 9, [216, 190, 120]);
});
// 46 paved road - flagstones with mortar lines (town streets)
tileAt(46, (ox, oy) => {
  const r = rng(0x46bb);
  for (let y = 0; y < T; y++)
    for (let x = 0; x < T; x++) tileset.set(ox + x, oy + y, noisy([150, 146, 138], (r() * 12 - 6) | 0));
  for (let y = 0; y < T; y++)
    for (let x = 0; x < T; x++) {
      const rowShift = (y >> 3) & 1 ? 4 : 0;
      if ((x + rowShift) % 8 === 0 || y % 8 === 0) tileset.set(ox + x, oy + y, [112, 106, 98]);
    }
  for (let k = 0; k < 3; k++) tileset.set(ox + 1 + ((r() * 13) | 0), oy + 1 + ((r() * 13) | 0), [178, 172, 162]);
});

// --- civic facades: Pokémon Center + Mart (FRLG style) -------------------
// Pale plaster wall in bays, a big split Poké Ball emblem, a red painted sign
// and a glass sliding door. Laid out by civic() in gen-overworld-map.mjs.

const plaster = (ox, oy, r) => {
  for (let y = 0; y < T; y++)
    for (let x = 0; x < T; x++) {
      const n = (r() * 8 - 4) | 0;
      tileset.set(ox + x, oy + y, [c8(230 + n), c8(226 + n), c8(216 + n)]);
    }
  tileset.rect(ox, oy, T, 1, [212, 207, 196]); // top reveal
  tileset.rect(ox, oy, 1, T, [214, 209, 198]); // pilaster seam between bays
  tileset.rect(ox, oy + T - 2, T, 2, [198, 192, 180]); // base skirt
};

// 3x5 pixel font, just the glyphs the two signs need
const GLYPH = {
  P: ['###', '# #', '###', '#  ', '#  '],
  C: ['###', '#  ', '#  ', '#  ', '###'],
  M: ['# #', '###', '###', '# #', '# #'],
  A: [' # ', '# #', '###', '# #', '# #'],
  R: ['###', '# #', '###', '## ', '# #'],
  T: ['###', ' # ', ' # ', ' # ', ' # '],
  '.': ['   ', '   ', '   ', '   ', ' # ']
};
const sign = (ox, oy, text, x0) => {
  let cx = x0;
  for (const ch of text) {
    const g = GLYPH[ch];
    for (let y = 0; y < 5; y++)
      for (let x = 0; x < 3; x++) if (g[y][x] === '#') tileset.set(ox + cx + x, oy + 6 + y, [196, 60, 52]);
    cx += 4;
  }
};

// 9 plaster wall  36 window
tileAt(9, (ox, oy) => plaster(ox, oy, rng(0x09cc)));
tileAt(36, (ox, oy) => {
  plaster(ox, oy, rng(0x36cc));
  tileset.rect(ox + 3, oy + 3, 10, 10, [92, 88, 80]); // frame
  tileset.rect(ox + 4, oy + 4, 8, 8, [150, 210, 232]); // glass
  tileset.rect(ox + 4, oy + 8, 8, 4, [108, 164, 196]); // lower panes darker
  tileset.rect(ox + 8, oy + 4, 1, 8, [92, 88, 80]); // mullion
  tileset.rect(ox + 4, oy + 8, 8, 1, [92, 88, 80]);
  tileset.set(ox + 5, oy + 5, [224, 244, 250]);
  tileset.set(ox + 6, oy + 5, [206, 236, 246]);
});

// 23 glass sliding door
tileAt(23, (ox, oy) => {
  plaster(ox, oy, rng(0x23cc));
  tileset.rect(ox + 2, oy + 2, 12, T - 2, [86, 82, 76]); // frame
  tileset.rect(ox + 3, oy + 3, 10, T - 3, [140, 196, 220]); // glass
  tileset.rect(ox + 3, oy + 9, 10, T - 9, [104, 156, 186]); // lower glass
  tileset.rect(ox + 8, oy + 3, 1, T - 3, [70, 66, 60]); // door split
  for (let i = 0; i < 6; i++) tileset.set(ox + 4 + i, oy + 12 - i, [220, 240, 248]); // shine
  tileset.rect(ox + 2, oy + T - 1, 12, 1, [60, 56, 52]); // threshold
});

// 24,27 / 31,32 - a Poké Ball emblem centred on the seam between two tiles
const emblem = (idL, idR, lower) => {
  const paint = (ox, oy, seed, ccx) => {
    plaster(ox, oy, rng(seed));
    for (let y = 0; y < T; y++)
      for (let x = 0; x < T; x++) {
        const dx = x - ccx;
        const dy = y - 8;
        const d = Math.hypot(dx, dy);
        if (d > 7.6) continue;
        let c;
        if (d > 6.3) c = [36, 34, 36]; // outer rim
        else if (Math.abs(dy) <= 1) c = [44, 42, 44]; // equator band
        else if (dy < 0) c = [236, 232, 224]; // top shell
        else c = lower; // bottom shell
        if (dy < 0 && dx < 0 && d > 3 && d < 6 && ((x + y) & 1) === 0) c = [252, 250, 246]; // sheen
        if (d < 2.7) c = [40, 38, 40]; // button ring
        if (d < 1.5) c = [240, 238, 232];
        tileset.set(ox + x, oy + y, c);
      }
  };
  tileAt(idL, (ox, oy) => paint(ox, oy, 0xe000 + idL, T)); // circle centre on the right edge
  tileAt(idR, (ox, oy) => paint(ox, oy, 0xe000 + idR, 0)); // circle centre on the left edge
};
emblem(24, 27, [206, 66, 58]); // Pokémon Center - red
emblem(31, 32, [62, 110, 190]); // Mart - blue

// 28 "P.C" sign   35 "MART" sign
tileAt(28, (ox, oy) => {
  plaster(ox, oy, rng(0x28cc));
  sign(ox, oy, 'P.C', 4);
});
tileAt(35, (ox, oy) => {
  plaster(ox, oy, rng(0x35cc));
  sign(ox, oy, 'MART', 0);
});

// --- small blocking objects ---------------------------------------------

const grassBg = (ox, oy, r, jitter = 16) => {
  for (let y = 0; y < T; y++) {
    const b = (y >> 2) & 1 ? 7 : -5;
    for (let x = 0; x < T; x++) tileset.set(ox + x, oy + y, noisy([70 + b, 150 + b, 58 + b], (r() * jitter - jitter / 2) | 0));
  }
};
/** Draw a filled blob from a 16-line mask string, shaded top-left -> bottom-right. */
const blob = (ox, oy, mask, r, { rim, hi, mid, dark, speck }) => {
  const on = (x, y) => x >= 0 && y >= 0 && x < 16 && y < 16 && mask[y][x] === '#';
  for (let y = 0; y < 16; y++)
    for (let x = 0; x < 16; x++) {
      if (mask[y][x] !== '#') continue;
      const edge = !on(x - 1, y) || !on(x + 1, y) || !on(x, y - 1) || !on(x, y + 1);
      let c = edge ? rim : x + y < 11 ? hi : r() > 0.74 ? dark : mid;
      if (!edge && speck && r() > 0.93) c = speck;
      tileset.set(ox + x, oy + y, c);
    }
};

const ROCK_MASK = [
  '                ',
  '                ',
  '     ######     ',
  '   ##########   ',
  '  ############  ',
  '  ############  ',
  ' ############## ',
  ' ############## ',
  ' ############## ',
  '  ############  ',
  '  ############  ',
  '   ##########   ',
  '    ########    ',
  '                ',
  '                ',
  '                '
];
const BUSH_MASK = [
  '                ',
  '     ######     ',
  '   ##########   ',
  '  ############  ',
  ' ############## ',
  ' ############## ',
  ' ############## ',
  ' ############## ',
  ' ############## ',
  '  ############  ',
  '  ############  ',
  '   ##########   ',
  '     ######     ',
  '      ####      ',
  '                ',
  '                '
];

// 12 rock (1 tile, solid) - a shaded stone, lit from the upper-left
tileAt(12, (ox, oy) => {
  const r = rng(0x120c);
  grassBg(ox, oy, r);
  // contact shadow
  for (let y = 0; y < T; y++)
    for (let x = 0; x < T; x++) {
      const nx = (x - 8) / 7;
      const ny = (y - 12) / 3;
      if (nx * nx + ny * ny < 1) tileset.set(ox + x, oy + y, [42, 92, 42]);
    }
  for (let y = 0; y < T; y++)
    for (let x = 0; x < T; x++) {
      const nx = (x - 8) / 7;
      const ny = (y - 9) / 6;
      const d = nx * nx + ny * ny;
      if (d > 1) continue;
      const li = -nx * 0.62 - ny * 0.78; // brightest toward the upper-left
      let c;
      if (d > 0.84) c = [72, 68, 64];
      else if (li > 0.5) c = [198, 192, 184];
      else if (li > 0.12) c = [164, 158, 150];
      else if (li > -0.26) c = [128, 122, 116];
      else c = [92, 86, 82];
      if (r() > 0.93) c = [c[0] - 12, c[1] - 12, c[2] - 12];
      tileset.set(ox + x, oy + y, c);
    }
});
// 13 bush (1 tile, solid) - leafy, no trunk
tileAt(13, (ox, oy) => {
  const r = rng(0x13bb);
  grassBg(ox, oy, r);
  blob(ox, oy, BUSH_MASK, r, {
    rim: [30, 84, 36],
    hi: [104, 186, 90],
    mid: [62, 144, 64],
    dark: [42, 108, 48],
    speck: [34, 92, 40]
  });
  for (let x = 4; x < 12; x++) tileset.set(ox + x, oy + 14, [40, 80, 36]);
});

// --- water shore pieces (14-21, transparent, drawn over the water fill) ----

const SAND = [216, 196, 140];
const SAND2 = [196, 172, 112];
const FOAM = [234, 240, 238];
const shoreEdge = (id, dir) =>
  tileAt(id, (ox, oy) => {
    const r = rng(0x14e0 + id);
    for (let d = 0; d < 6; d++) {
      for (let t = 0; t < T; t++) {
        if (d >= 4 && r() > 0.82) continue; // ragged waterline
        const col = d === 5 ? FOAM : d >= 3 ? SAND2 : SAND;
        if (dir === 'n') tileset.set(ox + t, oy + d, col);
        else if (dir === 's') tileset.set(ox + t, oy + T - 1 - d, col);
        else if (dir === 'w') tileset.set(ox + d, oy + t, col);
        else tileset.set(ox + T - 1 - d, oy + t, col);
      }
    }
  });
shoreEdge(14, 'n');
shoreEdge(15, 'e');
shoreEdge(16, 's');
shoreEdge(17, 'w');

const shoreCorner = (id, right, bottom) =>
  tileAt(id, (ox, oy) => {
    for (let y = 0; y < T; y++)
      for (let x = 0; x < T; x++) {
        const dx = right ? T - 1 - x : x;
        const dy = bottom ? T - 1 - y : y;
        const dist = Math.hypot(dx, dy);
        if (dist < 6.5) tileset.set(ox + x, oy + y, dist > 4.8 ? FOAM : dist > 2.6 ? SAND2 : SAND);
      }
  });
shoreCorner(18, true, false); // NE - land at the top-right corner
shoreCorner(19, false, false); // NW
shoreCorner(20, true, true); // SE
shoreCorner(21, false, true); // SW

// --- 2x2 objects painted into their 32x32 tileset blocks -----------------
// Big tree -> ids 25,26 (canopy, overlay) + 33,34 (trunk, ground)
// Boulder  -> ids 29,30 / 37,38 (all ground, all solid)

function tree2() {
  const bx = 0 * T;
  const by = 3 * T;
  const S = 32;
  const set = (x, y, c) => tileset.set(bx + x, by + y, c);
  const r = rng(0x5eed);
  const cx = 16;

  // grass fill for the bottom (ground) cells so there are no holes
  for (let y = 16; y < S; y++) {
    const b = (y >> 2) & 1 ? 7 : -5;
    for (let x = 0; x < S; x++) set(x, y, [70 + b, 150 + b, 58 + b]);
  }
  // cast shadow on the grass, to the lower-right
  for (let y = 22; y < S; y++)
    for (let x = 0; x < S; x++) {
      const nx = (x - 18) / 11;
      const ny = (y - 29) / 4;
      if (nx * nx + ny * ny < 1) set(x, y, [42, 86, 40]);
    }

  // tiered conifer: apex ~y1, widening to ~y22, lit from the upper-left
  const foliage = (y, hw) => {
    for (let dx = -hw; dx <= hw; dx++) {
      const x = cx + dx;
      const lx = hw ? dx / hw : 0;
      const ly = y / 24;
      let g;
      if (Math.abs(dx) >= hw) g = [20, 66, 28];
      else if (lx < -0.12 && ly < 0.62) g = [120, 206, 102];
      else if (lx > 0.32 || ly > 0.82) g = [34, 96, 42];
      else g = r() > 0.86 ? [44, 116, 50] : [62, 146, 64];
      set(x, y, g);
    }
  };
  for (let y = 1; y < 23; y++) {
    const tier = Math.floor((y - 1) / 7); // 0,1,2
    const local = ((y - 1) % 7) / 7;
    const hw = Math.min(13, Math.round(3 + tier * 4 + local * 4));
    foliage(y, hw);
    if ((y - 1) % 7 === 6) for (let dx = -hw; dx <= hw; dx++) set(cx + dx, y, [16, 56, 24]); // tier lip
  }

  // trunk (over the foliage base), lit-left
  for (let y = 19; y < S - 2; y++)
    for (let x = 13; x < 19; x++) {
      let c = x < 15 ? [124, 88, 54] : x >= 17 ? [70, 46, 28] : [98, 68, 42];
      if (y % 3 === 1 && x > 14 && x < 18 && r() > 0.5) c = [66, 44, 26];
      set(x, y, c);
    }
  for (let x = 11; x < 22; x++) {
    set(x, S - 2, [58, 40, 24]);
    set(x, S - 1, [50, 34, 20]);
  }
}
function boulder2() {
  const bx = 4 * T;
  const by = 3 * T;
  const S = 32;
  const set = (x, y, c) => tileset.set(bx + x, by + y, c);
  const r = rng(0xb0d);
  for (let y = 0; y < S; y++) {
    const b = (y >> 2) & 1 ? 7 : -5;
    for (let x = 0; x < S; x++) set(x, y, [70 + b, 150 + b, 58 + b]); // grass fill (no holes)
  }
  // contact shadow
  for (let y = 0; y < S; y++)
    for (let x = 0; x < S; x++) {
      const nx = (x - 17) / 15;
      const ny = (y - 24) / 6;
      if (nx * nx + ny * ny < 1) set(x, y, [42, 86, 40]);
    }
  // shaded stone sphere, light from the upper-left
  for (let y = 0; y < S; y++)
    for (let x = 0; x < S; x++) {
      const nx = (x - 16) / 14;
      const ny = (y - 15) / 12;
      const d = nx * nx + ny * ny;
      if (d > 1) continue;
      const li = -nx * 0.62 - ny * 0.78;
      let c;
      if (d > 0.9) c = [70, 66, 62];
      else if (li > 0.55) c = [200, 194, 186];
      else if (li > 0.2) c = [170, 164, 156];
      else if (li > -0.12) c = [140, 134, 126];
      else if (li > -0.48) c = [106, 100, 94];
      else c = [80, 74, 70];
      if (r() > 0.94) c = [c[0] - 14, c[1] - 14, c[2] - 14];
      set(x, y, c);
    }
  // rim light along the upper-left edge
  for (let a = Math.PI * 1.02; a < Math.PI * 1.52; a += 0.05) {
    set(Math.round(16 + Math.cos(a) * 13), Math.round(15 + Math.sin(a) * 11), [216, 210, 202]);
  }
  // a facet line
  for (let y = 9; y < 24; y++) if (y % 6 < 3) set(15 + (((y - 9) / 5) | 0), y, [64, 60, 56]);
}
tree2();
boulder2();

writeFileSync(path.join(OUT, 'tileset.png'), tileset.png());

// --- player sheet ----------------------------------------------------

const FW = 16;
const FH = 20;
const player = new Surface(3 * FW, 4 * FH);
const SHEET = path.join(OUT, 'Townspeople.png');

if (existsSync(SHEET)) {
  // Slice the 3x4 grid out of the supplied sheet. Content columns start at
  // x = 1, 19, 37 and rows at y = 1, 27, 53, 79 (1px side gutters, ~6px row gutters).
  const src = decodePng(readFileSync(SHEET));
  const colX = [1, 19, 37];
  const rowY = [1, 27, 53, 79];
  if (src.width < 53 || src.height < 99) {
    throw new Error(`Townspeople.png is ${src.width}x${src.height}; expected ~54x100`);
  }
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 3; col++) {
      player.blit(src, colX[col], rowY[row], FW, FH, col * FW, row * FH);
    }
  }
  console.log(`sliced player.png from Townspeople.png (${src.width}x${src.height})`);
} else {
  // Plain placeholder if no sheet is provided.
  const PAL = { H: [90, 58, 34], F: [240, 200, 160], S: [201, 66, 54], P: [59, 74, 122], B: [40, 40, 46] };
  const body = (lL, lR) => [
    '     HHHH       '.slice(0, 16),
    '    HHFFHH      '.slice(0, 16),
    '    HFFFFH      '.slice(0, 16),
    '    .FFFF.      '.slice(0, 16),
    '   SSSSSSSS     '.slice(0, 16),
    '   SSSSSSSS     '.slice(0, 16),
    '   SSSSSSSS     '.slice(0, 16),
    '   .SSSSSS.     '.slice(0, 16),
    '    PPPPPP      '.slice(0, 16),
    '    PP  PP      '.slice(0, 16),
    `   ${lL}P  P${lR}    `.slice(0, 16),
    `   ${lL}P  P${lR}    `.slice(0, 16),
    '    P    P      '.slice(0, 16),
    '    B    B      '.slice(0, 16),
    '   BB    BB     '.slice(0, 16),
    '               '.slice(0, 16),
    '               '.slice(0, 16),
    '               '.slice(0, 16),
    '               '.slice(0, 16),
    '               '.slice(0, 16)
  ];
  const stamp = (col, row, grid) => {
    for (let y = 0; y < grid.length; y++)
      for (let x = 0; x < grid[y].length; x++) {
        const c = PAL[grid[y][x]];
        if (c) player.set(col * FW + x, row * FH + y, c);
      }
  };
  for (let r = 0; r < 4; r++) {
    stamp(0, r, body('P', 'P'));
    stamp(1, r, body('B', 'P'));
    stamp(2, r, body('P', 'B'));
  }
  console.log('no Townspeople.png - wrote a placeholder player.png');
}

writeFileSync(path.join(OUT, 'player.png'), player.png());
console.log('wrote tileset.png (128x128) and player.png (48x80)');
