// Downloads Pokémon cries from the PokeAPI/cries project (the "legacy" set,
// i.e. the classic Gen 1-5 style cries) and converts them to mp3 via ffmpeg,
// for national dex numbers 1-649 (Gen 1 through Gen 5).
//
// Requires ffmpeg on PATH.
// Run with: node scripts/fetch-cries.mjs
//
// Source: https://github.com/PokeAPI/cries (cries/pokemon/legacy)

import { mkdir, writeFile, rm } from 'node:fs/promises';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import os from 'node:os';

const execFileAsync = promisify(execFile);

const GEN5_LAST_DEX_ID = 649;
const BASE_URL = 'https://raw.githubusercontent.com/PokeAPI/cries/main/cries/pokemon/legacy';
const OUT_DIR = path.resolve('public/assets/sounds/cries');
const TMP_DIR = path.join(os.tmpdir(), 'pkmn-cries-ogg');
const CONCURRENCY = 6;
const RETRIES = 3;

async function ensureDirs() {
  await mkdir(OUT_DIR, { recursive: true });
  await mkdir(TMP_DIR, { recursive: true });
}

async function downloadOgg(dexId) {
  const url = `${BASE_URL}/${dexId}.ogg`;
  for (let attempt = 1; attempt <= RETRIES; attempt++) {
    try {
      const res = await fetch(url);
      if (res.status === 404) return null;
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return Buffer.from(await res.arrayBuffer());
    } catch (err) {
      if (attempt === RETRIES) throw err;
      await new Promise((r) => setTimeout(r, 300 * attempt));
    }
  }
}

async function convertToMp3(oggPath, mp3Path) {
  await execFileAsync('ffmpeg', ['-y', '-loglevel', 'error', '-i', oggPath, '-codec:a', 'libmp3lame', '-qscale:a', '4', mp3Path]);
}

async function processOne(dexId) {
  const oggPath = path.join(TMP_DIR, `${dexId}.ogg`);
  const mp3Path = path.join(OUT_DIR, `${dexId}.mp3`);

  const buffer = await downloadOgg(dexId);
  if (!buffer) return 'missing';

  await writeFile(oggPath, buffer);
  await convertToMp3(oggPath, mp3Path);
  await rm(oggPath, { force: true });
  return 'ok';
}

async function runPool(items, worker) {
  let cursor = 0;
  async function next() {
    while (cursor < items.length) {
      const i = cursor++;
      await worker(items[i]);
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, next));
}

async function main() {
  await ensureDirs();
  let ok = 0;
  let missing = 0;
  let done = 0;

  const dexIds = Array.from({ length: GEN5_LAST_DEX_ID }, (_, i) => i + 1);

  await runPool(dexIds, async (dexId) => {
    try {
      const result = await processOne(dexId);
      if (result === 'ok') ok++;
      else {
        missing++;
        console.log(`#${dexId}: no cry available`);
      }
    } catch (err) {
      missing++;
      console.log(`#${dexId}: error (${err.message})`);
    }

    done++;
    if (done % 50 === 0) console.log(`Progress: ${done}/${GEN5_LAST_DEX_ID}`);
  });

  await rm(TMP_DIR, { recursive: true, force: true });
  console.log(`Done. Cries downloaded for ${ok} Pokémon, ${missing} missing.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
