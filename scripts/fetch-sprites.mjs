// Downloads the animated Showdown-style front and back sprites (Smogon's
// unified BW art style, which PokeAPI mirrors and which covers well beyond
// Gen 5) for national dex numbers 1-721, i.e. Gen 1 through Gen 6.
//
// Run with: node scripts/fetch-sprites.mjs
//
// Source: https://github.com/PokeAPI/sprites (sprites/pokemon/other/showdown)

import { mkdir, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

const LAST_DEX_ID = 721;
const BASE_URL = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/showdown';
const OUT_DIR = path.resolve('public/assets/sprites/showdown');
const OUT_DIR_BACK = path.join(OUT_DIR, 'back');

async function ensureDirs() {
  await mkdir(OUT_DIR, { recursive: true });
  await mkdir(OUT_DIR_BACK, { recursive: true });
}

async function download(url, destPath) {
  if (existsSync(destPath)) return 'skipped';
  const res = await fetch(url);
  if (!res.ok) return `missing (${res.status})`;
  const buffer = Buffer.from(await res.arrayBuffer());
  await writeFile(destPath, buffer);
  return 'ok';
}

async function main() {
  await ensureDirs();
  let ok = 0;
  let missing = 0;

  for (let dexId = 1; dexId <= LAST_DEX_ID; dexId++) {
    const frontResult = await download(`${BASE_URL}/${dexId}.gif`, path.join(OUT_DIR, `${dexId}.gif`));
    const backResult = await download(`${BASE_URL}/back/${dexId}.gif`, path.join(OUT_DIR_BACK, `${dexId}.gif`));

    if (frontResult === 'ok' || frontResult === 'skipped') ok++;
    else missing++;

    if (backResult.startsWith('missing')) {
      console.log(`#${dexId}: no back sprite available (${backResult})`);
    }

    if (dexId % 50 === 0) {
      console.log(`Progress: ${dexId}/${LAST_DEX_ID}`);
    }
  }

  console.log(`Done. Front sprites available for ${ok} Pokémon, ${missing} missing.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
