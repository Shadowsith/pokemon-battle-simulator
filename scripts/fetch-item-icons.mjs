// Downloads Showdown's item icon sheet (24 × 24 px icons, 16 per row). Items
// reference their icon by @pkmn/sim `spritenum` (see item.model.ts).
//
// Run with: node scripts/fetch-item-icons.mjs
//
// Source: https://play.pokemonshowdown.com/sprites/itemicons-sheet.png

import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const URL = 'https://play.pokemonshowdown.com/sprites/itemicons-sheet.png';
const OUT = path.resolve('public/assets/sprites/itemicons-sheet.png');

async function main() {
  await mkdir(path.dirname(OUT), { recursive: true });
  const res = await fetch(URL);
  if (!res.ok) throw new Error(`${URL}: ${res.status}`);
  const buffer = Buffer.from(await res.arrayBuffer());
  await writeFile(OUT, buffer);
  console.log(`saved ${buffer.length} bytes to ${OUT}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
