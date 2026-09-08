// Builds the overworld art, no external deps:
//
//   public/assets/overworld/tileset.png   8 cols x 2 rows (128x32) - generated
//   public/assets/overworld/player.png    3 cols x 4 rows (48x80)
//       - sliced out of ./Townspeople.png (a user-supplied character sheet) when
//         that file is present, otherwise a plain generated placeholder.
//
// Tile ids are 1-based, row-major (columns: 8 in route01.json):
//   1 grass  2 path  3 tall grass  4 water  5 house wall  6 tree trunk
//   7 flower  8 ledge   10 tree canopy (overlay)  11 house roof (overlay)
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
const tileset = new Surface(COLS * T, 2 * T);
const tileAt = (id, draw) => {
  const i = id - 1;
  draw((i % COLS) * T, Math.floor(i / COLS) * T);
};

tileAt(1, (ox, oy) => {
  const r = rng(11);
  tileset.rect(ox, oy, T, T, [74, 158, 63]);
  for (let n = 0; n < 22; n++)
    tileset.set(ox + ((r() * T) | 0), oy + ((r() * T) | 0), r() > 0.5 ? [99, 184, 90] : [58, 132, 49]);
});
tileAt(2, (ox, oy) => {
  const r = rng(23);
  tileset.rect(ox, oy, T, T, [226, 205, 148]);
  for (let n = 0; n < 14; n++) tileset.set(ox + ((r() * T) | 0), oy + ((r() * T) | 0), [212, 189, 126]);
  for (let x = 0; x < T; x++) if (x % 3) tileset.set(ox + x, oy + T - 1, [198, 173, 110]);
});
tileAt(3, (ox, oy) => {
  const r = rng(31);
  tileset.rect(ox, oy, T, T, [47, 125, 52]);
  for (let x = 0; x < T; x += 2) {
    const h = 5 + ((r() * 6) | 0);
    for (let y = 0; y < h; y++) tileset.set(ox + x, oy + T - 1 - y, [63, 148, 64]);
    for (let y = 0; y < h - 2; y++) tileset.set(ox + x + 1, oy + T - 1 - y, [37, 100, 40]);
  }
});
tileAt(4, (ox, oy) => {
  tileset.rect(ox, oy, T, T, [63, 127, 192]);
  for (let x = 0; x < T; x++) {
    if (x % 6 < 3) tileset.set(ox + x, oy + 4, [91, 155, 216]);
    if ((x + 3) % 6 < 3) tileset.set(ox + x, oy + 10, [91, 155, 216]);
  }
  tileset.rect(ox, oy + T - 2, T, 2, [53, 111, 168]);
});
tileAt(5, (ox, oy) => {
  tileset.rect(ox, oy, T, T, [201, 143, 90]);
  for (let y = 0; y < T; y += 4) tileset.rect(ox, oy + y, T, 1, [122, 82, 48]);
  for (let x = 0; x < T; x += 8) tileset.rect(ox + x, oy, 1, T, [122, 82, 48]);
  tileset.rect(ox + 4, oy + 5, 6, 6, [143, 208, 232]);
  tileset.rect(ox + 4, oy + 5, 6, 1, [90, 60, 36]);
});
tileAt(6, (ox, oy) => {
  tileset.rect(ox, oy, T, T, [74, 158, 63]);
  tileset.rect(ox + 5, oy + 3, 6, T - 3, [110, 74, 44]);
  tileset.rect(ox + 5, oy + 3, 2, T - 3, [90, 58, 32]);
  tileset.rect(ox + 9, oy + 3, 1, T - 3, [138, 96, 60]);
});
tileAt(7, (ox, oy) => {
  const r = rng(71);
  tileset.rect(ox, oy, T, T, [74, 158, 63]);
  for (let n = 0; n < 18; n++) tileset.set(ox + ((r() * T) | 0), oy + ((r() * T) | 0), [58, 132, 49]);
  for (const [cx, cy, col] of [
    [4, 6, [235, 96, 120]],
    [11, 10, [244, 214, 84]]
  ]) {
    tileset.set(ox + cx, oy + cy - 1, col);
    tileset.set(ox + cx - 1, oy + cy, col);
    tileset.set(ox + cx + 1, oy + cy, col);
    tileset.set(ox + cx, oy + cy + 1, col);
    tileset.set(ox + cx, oy + cy, [255, 255, 255]);
  }
});
tileAt(8, (ox, oy) => {
  tileset.rect(ox, oy, T, T, [226, 205, 148]);
  tileset.rect(ox, oy, T, 5, [74, 158, 63]);
  tileset.rect(ox, oy + 5, T, 2, [173, 149, 96]);
  for (let x = 2; x < T; x += 5) tileset.rect(ox + x, oy + 7, 2, T - 8, [198, 173, 110]);
});
tileAt(10, (ox, oy) => {
  const rows = [
    '                ',
    '     ######     ',
    '   ##########   ',
    '  ############  ',
    ' ############## ',
    ' ############## ',
    '################',
    '################',
    '################',
    ' ############## ',
    ' ############## ',
    '  ############  ',
    '   ##########   ',
    '     ######     ',
    '       ##       ',
    '                '
  ];
  const r = rng(101);
  for (let y = 0; y < 16; y++)
    for (let x = 0; x < 16; x++)
      if (rows[y][x] === '#') tileset.set(ox + x, oy + y, r() > 0.55 ? [63, 148, 64] : [47, 116, 48]);
});
tileAt(11, (ox, oy) => {
  tileset.rect(ox, oy + 4, T, T - 4, [162, 64, 47]);
  for (let y = 4; y < T; y += 3) tileset.rect(ox, oy + y, T, 1, [138, 51, 36]);
  tileset.rect(ox, oy + 2, T, 2, [120, 44, 32]);
});

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
console.log('wrote tileset.png (128x32) and player.png (48x80)');
