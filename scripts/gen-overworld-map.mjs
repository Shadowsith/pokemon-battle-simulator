// Generates public/assets/overworld/route01.json - the exploration POC map:
// a route in the south, a 2-tile road opening in the tree line, and a small
// town to the north with a Pokémon Center, a Mart, an arena and houses.
// Tile ids match scripts/gen-overworld-art.mjs (columns: 8).
//
// Run: node scripts/gen-overworld-map.mjs

import { writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';

const GRASS = 1;
const ROAD = 2;
const TALLGRASS = 3;
const WATER = 4;
const WALL = 5;
const TREETRUNK = 6;
const FLOWER = 7;
const TREE_CANOPY = 10; // overlay
const ROOF_HOUSE = 11; // overlay
const ROCK = 12;
const BUSH = 13;
const TREE2_CANOPY = [25, 26]; // overlay
const TREE2_TRUNK = [33, 34]; // ground
const BOULDER = [
  [29, 30],
  [37, 38]
];
const ROOF_PC = 42; // overlay
const ROOF_MART = 43; // overlay
const ROOF_GYM = 44; // overlay
const DOOR = 45;
const PAVED = 46; // town streets

// civic facade tiles (Pokémon Center / Mart)
const CWALL = 9; // plaster wall
const CWIN = 36; // window
const CDOOR = 23; // glass sliding door
const PC_EMBLEM = [24, 27]; // red Poké Ball, left + right halves
const PC_SIGN = 28; // "P.C"
const MART_EMBLEM = [31, 32]; // blue Poké Ball
const MART_SIGN = 35; // "MART"

const W = 26;
const H = 40;
const g = new Array(W * H).fill(GRASS);
const o = new Array(W * H).fill(0);
const s = new Array(W * H).fill(0);
const at = (x, y) => y * W + x;
const inb = (x, y) => x >= 0 && y >= 0 && x < W && y < H;
const put = (x, y, gid, oid, solid) => {
  if (!inb(x, y)) return;
  if (gid !== undefined) g[at(x, y)] = gid;
  if (oid !== undefined) o[at(x, y)] = oid;
  if (solid !== undefined) s[at(x, y)] = solid ? 1 : 0;
};
const rect = (x0, y0, x1, y1, fn) => {
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) fn(x, y);
};
const road = (x0, y0, x1, y1) => rect(x0, y0, x1, y1, (x, y) => put(x, y, ROAD, undefined, 0));
const paved = (x0, y0, x1, y1) => rect(x0, y0, x1, y1, (x, y) => put(x, y, PAVED, 0, 0));
const treeLine = (x0, y0, x1, y1) => rect(x0, y0, x1, y1, (x, y) => put(x, y, TREETRUNK, TREE_CANOPY, 1));

// --- outer border --------------------------------------------------------
rect(0, 0, W - 1, H - 1, (x, y) => {
  if (x === 0 || y === 0 || x === W - 1 || y === H - 1) put(x, y, TREETRUNK, TREE_CANOPY, 1);
});

// =======================================================================
//  TOWN  (rows 1..15)
// =======================================================================

// two horizontal streets + one vertical spine - paved
paved(2, 6, 23, 7); // street A (below the big buildings)
paved(2, 12, 23, 13); // street B (below the houses)
paved(12, 6, 13, 16); // vertical spine down through the south gate

// big buildings: roof (overlay) on the top 2 rows, wall (ground) below, all solid
function building(mx, my, w, h, roofId, doorX) {
  for (let cy = 0; cy < h; cy++) {
    for (let cx = 0; cx < w; cx++) {
      put(mx + cx, my + cy, WALL, cy < 2 ? roofId : undefined, 1);
    }
  }
  put(mx + doorX, my + h - 1, DOOR, undefined, 1);
}
// Pokémon Center / Mart: 5 wide x 5 tall, FRLG-style facade.
//   rows 0-1  roof (overlay) over plain wall
//   row 2     plaster upper wall
//   row 3     .  emblemL emblemR window .
//   row 4     sign window door window .
function civic(mx, my, roofId, emblem, signId) {
  for (let cx = 0; cx < 5; cx++) {
    put(mx + cx, my, WALL, roofId, 1);
    put(mx + cx, my + 1, WALL, roofId, 1);
    put(mx + cx, my + 2, CWALL, 0, 1);
  }
  put(mx + 0, my + 3, CWALL, 0, 1);
  put(mx + 1, my + 3, emblem[0], 0, 1);
  put(mx + 2, my + 3, emblem[1], 0, 1);
  put(mx + 3, my + 3, CWIN, 0, 1);
  put(mx + 4, my + 3, CWALL, 0, 1);
  put(mx + 0, my + 4, signId, 0, 1);
  put(mx + 1, my + 4, CWIN, 0, 1);
  put(mx + 2, my + 4, CDOOR, 0, 1);
  put(mx + 3, my + 4, CWIN, 0, 1);
  put(mx + 4, my + 4, CWALL, 0, 1);
}
civic(2, 1, ROOF_PC, PC_EMBLEM, PC_SIGN); // Pokémon Center - door at (4,5) onto street A
building(10, 1, 6, 5, ROOF_GYM, 2); // Arena / Gym - door at (12,5) onto the spine
civic(19, 1, ROOF_MART, MART_EMBLEM, MART_SIGN); // Mart - door at (21,5) onto street A

// four small houses between the two streets
building(3, 8, 3, 4, ROOF_HOUSE, 1); // door (4,11) onto street B
building(7, 8, 3, 4, ROOF_HOUSE, 1); // door (8,11)
building(16, 8, 3, 4, ROOF_HOUSE, 1); // door (17,11)
building(20, 8, 3, 4, ROOF_HOUSE, 1); // door (21,11)

// town greenery (kept off the paved streets)
for (const [x, y] of [
  [8, 4],
  [17, 4],
  [3, 14],
  [22, 14],
  [9, 14]
]) {
  put(x, y, FLOWER, undefined, 0);
}
put(2, 10, TREETRUNK, TREE_CANOPY, 1);
put(23, 10, TREETRUNK, TREE_CANOPY, 1);

// south gate: a tree line broken by an open clearing with a 2-tile paved road
treeLine(1, 16, W - 2, 16);
rect(10, 16, 15, 16, (x, y) => put(x, y, GRASS, 0, 0)); // clear the trees flanking the entrance
paved(12, 16, 13, 16);

// =======================================================================
//  ROUTE  (rows 17..38)
// =======================================================================

road(12, 17, 13, 35); // spine from the gate down to the spawn
road(5, 33, 20, 33); // east-west branch

building(3, 19, 4, 4, ROOF_HOUSE, 3); // route house, door (6,22)
road(6, 23, 12, 23); // path from the house door across to the spine

// pond (engine draws the shore)
rect(3, 26, 6, 30, (x, y) => put(x, y, WATER, undefined, 1));

placeTree2(16, 20);
placeTree2(20, 28);
placeTree2(8, 30);

placeBoulder(18, 25);
placeBoulder(9, 25);

for (const [x, y] of [
  [4, 24],
  [22, 20],
  [10, 31],
  [16, 36]
]) {
  put(x, y, ROCK, undefined, 1);
}

rect(15, 27, 16, 28, (x, y) => put(x, y, BUSH, undefined, 1));
rect(15, 30, 18, 32, (x, y) => put(x, y, TALLGRASS, undefined, 0));

function placeTree2(mx, my) {
  for (let cx = 0; cx < 2; cx++) put(mx + cx, my, GRASS, TREE2_CANOPY[cx], 1);
  for (let cx = 0; cx < 2; cx++) put(mx + cx, my + 1, TREE2_TRUNK[cx], undefined, 1);
}
function placeBoulder(mx, my) {
  for (let cy = 0; cy < 2; cy++) for (let cx = 0; cx < 2; cx++) put(mx + cx, my + cy, BOULDER[cy][cx], undefined, 1);
}

// =======================================================================

const map = {
  id: 'route01',
  width: W,
  height: H,
  tileSize: 16,
  tileset: 'assets/overworld/tileset.png',
  columns: 8,
  layers: { ground: g, overlay: o },
  solid: s,
  spawn: { x: 12, y: 35, facing: 'up' },
  water: {
    fill: WATER,
    edges: { n: 14, e: 15, s: 16, w: 17 },
    corners: { ne: 18, nw: 19, se: 20, sw: 21 }
  },
  tallGrass: { tile: TALLGRASS, front: 22 }
};

if (s[at(map.spawn.x, map.spawn.y)]) throw new Error('spawn tile is solid');

mkdirSync(path.resolve('public/assets/overworld'), { recursive: true });
writeFileSync(path.resolve('public/assets/overworld/route01.json'), JSON.stringify(map));
console.log(
  `wrote route01.json ${W}x${H}, solid ${s.filter(Boolean).length}, spawn ${JSON.stringify(map.spawn)}`
);
