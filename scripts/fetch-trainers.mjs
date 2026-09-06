// Downloads every Pokémon Showdown trainer sprite into
// public/assets/trainers/ and writes an index.json manifest of their ids.
//
// The settings-page avatar picker uses a curated, labelled subset
// (TRAINER_AVATARS in src/app/core/models/trainer.model.ts); the full set
// here is what the battle screen draws from to hand each test-battle NPC a
// random trainer look.
//
// Each sprite is a tiny (~700 byte) 80x80 pixel-art PNG; the whole set is
// roughly 1 MB.
//
// Source: https://play.pokemonshowdown.com/sprites/trainers/
// Run with: node scripts/fetch-trainers.mjs

import { mkdir, writeFile, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

const INDEX_URL = 'https://play.pokemonshowdown.com/sprites/trainers/';
const BASE_URL = 'https://play.pokemonshowdown.com/sprites/trainers';
const OUT_DIR = path.resolve('public/assets/trainers');
const MANIFEST = path.join(OUT_DIR, 'index.json');
const CONCURRENCY = 16;
const RETRIES = 3;

async function listRemoteIds() {
  const res = await fetch(INDEX_URL);
  if (!res.ok) throw new Error(`index listing HTTP ${res.status}`);
  const html = await res.text();
  const ids = new Set();
  for (const m of html.matchAll(/href="([a-z0-9][a-z0-9._-]*)\.png"/gi)) {
    ids.add(m[1]);
  }
  return [...ids].sort();
}

async function download(id) {
  const dest = path.join(OUT_DIR, `${id}.png`);
  if (existsSync(dest)) return 'skipped';
  for (let attempt = 1; attempt <= RETRIES; attempt++) {
    try {
      const res = await fetch(`${BASE_URL}/${id}.png`);
      if (res.status === 404) return 'missing';
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      await writeFile(dest, Buffer.from(await res.arrayBuffer()));
      return 'ok';
    } catch (err) {
      if (attempt === RETRIES) return `error (${err.message})`;
      await new Promise((r) => setTimeout(r, 300 * attempt));
    }
  }
}

async function runPool(items, worker) {
  let cursor = 0;
  const next = async () => {
    while (cursor < items.length) await worker(items[cursor++]);
  };
  await Promise.all(Array.from({ length: CONCURRENCY }, next));
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  const ids = await listRemoteIds();
  console.log(`Showdown lists ${ids.length} trainer sprites.`);

  let ok = 0;
  let skipped = 0;
  let failed = 0;
  let done = 0;

  await runPool(ids, async (id) => {
    const result = await download(id);
    if (result === 'ok') ok++;
    else if (result === 'skipped') skipped++;
    else {
      failed++;
      console.log(`${id}: ${result}`);
    }
    if (++done % 200 === 0) console.log(`  ${done}/${ids.length}`);
  });

  // Manifest reflects what is actually on disk (so a partial run is still usable).
  const onDisk = (await readdir(OUT_DIR))
    .filter((f) => f.endsWith('.png'))
    .map((f) => f.slice(0, -4))
    .sort();
  await writeFile(MANIFEST, JSON.stringify(onDisk) + '\n');

  console.log(
    `\nDone. ${ok} downloaded, ${skipped} already present, ${failed} failed. ` +
      `${onDisk.length} sprites in ${OUT_DIR}, manifest -> ${path.relative(process.cwd(), MANIFEST)}`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
