#!/usr/bin/env node
/**
 * Synthesizes original, GBA-style move sounds from scratch (no samples) into
 * public/assets/sounds/moves/free/<showdownId>.mp3.
 *
 * Each recipe (scripts/move-sounds/recipes/<type>.mjs) only borrows the
 * *shape* of a move (timing taken from its battle animation, rough
 * loudness/brightness curve) and builds the audio from Game Boy style voices.
 * The result is crushed to the GBA's ~13 kHz / 8-bit output via sox and
 * encoded with ffmpeg.
 *
 * Usage: node scripts/synth-move-sounds.mjs [moveId ...]   (default: all recipes)
 * Requires: sox, ffmpeg on PATH.
 */
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { RECIPES } from './move-sounds/recipes/index.mjs';

const OUT_DIR = join(dirname(fileURLToPath(import.meta.url)), '../public/assets/sounds/moves/free');

function render(id) {
  const recipe = RECIPES[id];
  if (!recipe) throw new Error(`No recipe for "${id}"`);
  const track = recipe();
  track.normalize();

  const tmp = mkdtempSync(join(tmpdir(), 'synth-'));
  try {
    const raw = join(tmp, 'raw.wav');
    const gba = join(tmp, 'gba.wav');
    writeFileSync(raw, track.toWav());
    // GBA output: ~13 kHz, 8-bit, then back to 44.1 kHz for playback.
    execFileSync('sox', ['-G', raw, '-b', '8', gba, 'rate', '13379', 'dither']);
    const out = join(OUT_DIR, `${id}.mp3`);
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', gba, '-ar', '44100', '-ac', '1', '-b:a', '128k', out]);
    console.log(`wrote ${out}`);
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
}

mkdirSync(OUT_DIR, { recursive: true });
const ids = process.argv.slice(2);
for (const id of ids.length ? ids : Object.keys(RECIPES)) render(id);
