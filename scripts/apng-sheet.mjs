#!/usr/bin/env node
/**
 * Reference frame sheets for move animations.
 *
 *   node scripts/apng-sheet.mjs <moveId ...> [--out <dir>] [--frames 9] [--scale 0.75]
 *
 * Reads each move's Pokewiki APNG URLs (Gen 4 and Gen 5) from
 * docs/move-animations-review-checklist.md, downloads them and writes one
 * PNG per move: a 3x3 grid of evenly spaced frames per APNG, stacked top to
 * bottom in the order listed in the checklist (Gen 4 variants first, then
 * Gen 5). Small enough to read cheaply instead of the raw animations.
 * Needs ffmpeg / ffprobe on PATH. Output defaults to <tmp>/apng-sheets.
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CHECKLIST = path.join(ROOT, 'docs/move-animations-review-checklist.md');

function parseArgs(argv) {
  const opts = { ids: [], out: path.join(os.tmpdir(), 'apng-sheets'), frames: 9, scale: 0.75 };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--out') opts.out = path.resolve(argv[++i]);
    else if (a === '--frames') opts.frames = Number(argv[++i]);
    else if (a === '--scale') opts.scale = Number(argv[++i]);
    else opts.ids.push(a.toLowerCase());
  }
  if (!opts.ids.length) {
    console.error('usage: node scripts/apng-sheet.mjs <moveId ...> [--out <dir>] [--frames 9] [--scale 0.75]');
    process.exit(1);
  }
  return opts;
}

/** Move id -> [{ label, url }] from the "- Gen N APNG (label): url" lines under each checklist entry. */
function referenceUrls() {
  const refs = new Map();
  let current = null;
  for (const line of fs.readFileSync(CHECKLIST, 'utf8').split('\n')) {
    const entry = line.match(/^- \[.\] .*— `(\w+)`/);
    if (entry) {
      current = entry[1];
      continue;
    }
    const ref = line.match(/^\s+- Gen (\d) APNG(?: \(([^)]*)\))?: (\S+)/);
    if (ref && current) {
      if (!refs.has(current)) refs.set(current, []);
      refs.get(current).push({ label: ref[2] ? `Gen${ref[1]} ${ref[2]}` : `Gen${ref[1]}`, url: ref[3] });
    }
  }
  return refs;
}

function frameCount(file) {
  const out = execFileSync('ffprobe', ['-v', 'error', '-count_frames', '-select_streams', 'v:0', '-show_entries', 'stream=nb_read_frames', '-of', 'csv=p=0', file]);
  return Number(String(out).trim()) || 1;
}

/** A grid of `frames` evenly spaced frames of one APNG, scaled down. */
function gridOf(apng, out, frames, scale) {
  const cols = Math.ceil(Math.sqrt(frames));
  const rows = Math.ceil(frames / cols);
  const step = Math.max(1, Math.floor(frameCount(apng) / frames));
  const filter = `select='not(mod(n\\,${step}))',scale=iw*${scale}:-1,tile=${cols}x${rows}:padding=2:color=black`;
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', apng, '-vf', filter, '-frames:v', '1', '-fps_mode', 'vfr', out]);
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  const refs = referenceUrls();
  // Downloads go in their own folder, apart from the finished sheets.
  const dl = path.join(opts.out, 'downloads');
  fs.mkdirSync(dl, { recursive: true });

  for (const id of opts.ids) {
    const list = refs.get(id);
    if (!list?.length) {
      console.warn(`${id}: no reference APNG URLs in the checklist`);
      continue;
    }
    const grids = [];
    for (const [i, { label, url }] of list.entries()) {
      const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      if (!res.ok) {
        console.warn(`${id}: ${label} download failed (${res.status})`);
        continue;
      }
      const apng = path.join(dl, `${id}-${i}.png`);
      fs.writeFileSync(apng, Buffer.from(await res.arrayBuffer()));
      const grid = path.join(dl, `${id}-${i}-grid.png`);
      gridOf(apng, grid, opts.frames, opts.scale);
      grids.push({ label, grid });
    }
    if (!grids.length) continue;
    const sheet = path.join(opts.out, `${id}.png`);
    if (grids.length === 1) fs.copyFileSync(grids[0].grid, sheet);
    else {
      const inputs = grids.flatMap((g) => ['-i', g.grid]);
      execFileSync('ffmpeg', ['-v', 'error', '-y', ...inputs, '-filter_complex', `vstack=inputs=${grids.length}`, sheet]);
    }
    console.log(`${sheet}  (top to bottom: ${grids.map((g) => g.label).join(', ')})`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
