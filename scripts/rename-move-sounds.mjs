// Renames every move sound file in public/assets/sounds/moves/ so its name
// matches the move's canonical @pkmn/sim id (showdownId) - the same id the
// app now uses to look up the file (see src/app/core/services/audio.service.ts).
//
//   "Solar Beam.mp3"            -> "solarbeam.mp3"
//   "X Scissor.mp3"             -> "xscissor.mp3"
//   "Fury Swipes 2hits.mp3"     -> "furyswipes-2hits.mp3"
//   "Roar of Time part2.mp3"    -> "roaroftime-part2.mp3"
//   "Fire Spin turn damage.mp3" -> "firespin-turndamage.mp3"
//   "Present heal.mp3"          -> "present-heal.mp3"
//
// Files that are not a move at all (UI / status stings like
// "Status Frozen.mp3", "Hit Super Effective.mp3") have no showdownId; they
// are just slugified to kebab-case and reported separately.
//
// Dry run by default - prints the plan and changes nothing.
// Pass --apply to actually rename.
//
//   node scripts/rename-move-sounds.mjs
//   node scripts/rename-move-sounds.mjs --apply

import { readdirSync, renameSync } from 'node:fs';
import path from 'node:path';
import { Dex } from '@pkmn/sim';

const DIR = path.resolve('public/assets/sounds/moves');
const APPLY = process.argv.includes('--apply');

// Trailing tokens that mark a per-move variant clip rather than being part
// of the move name. Matched against the file's base name (case-insensitive);
// `slug` is appended to the resolved showdownId as "<id>-<slug>".
const VARIANT_SUFFIXES = [
  { re: /\s+(\d+)\s*hits?$/i, slug: (m) => `${m[1]}hit${m[1] === '1' ? '' : 's'}` },
  { re: /\s+part\s*(\d+)$/i, slug: (m) => `part${m[1]}` },
  { re: /\s+turn\s+damage$/i, slug: () => 'turndamage' },
  { re: /\s+damage$/i, slug: () => 'damage' },
  { re: /\s+heal$/i, slug: () => 'heal' }
];

const kebab = (s) =>
  s
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

/** Resolve a file's base name to a target file name (without extension). */
function resolveTarget(base) {
  // 1. Whole name is a real move.
  const direct = Dex.moves.get(base);
  if (direct?.exists) return { name: direct.id, kind: 'move' };

  // 2. Name is "<move> <variant>".
  for (const { re, slug } of VARIANT_SUFFIXES) {
    const m = base.match(re);
    if (!m) continue;
    const core = base.slice(0, m.index);
    const move = Dex.moves.get(core);
    if (move?.exists) return { name: `${move.id}-${slug(m)}`, kind: 'variant' };
  }

  // 3. Not a move - keep it, just normalise the spelling.
  return { name: kebab(base), kind: 'other' };
}

const files = readdirSync(DIR).filter((f) => /\.mp3$/i.test(f));

const plan = [];
const targets = new Map(); // target name -> [sources]

for (const file of files) {
  const base = file.replace(/\.mp3$/i, '');
  const { name, kind } = resolveTarget(base);
  const target = `${name}.mp3`;
  plan.push({ file, target, kind });
  if (!targets.has(target)) targets.set(target, []);
  targets.get(target).push(file);
}

const collisions = [...targets].filter(([, srcs]) => srcs.length > 1);
if (collisions.length) {
  console.error('Aborting - multiple files would map to the same name:\n');
  for (const [target, srcs] of collisions) {
    console.error(`  ${target}`);
    for (const s of srcs) console.error(`    <- ${s}`);
  }
  process.exit(1);
}

const changes = plan.filter((p) => p.file !== p.target);
const unchanged = plan.length - changes.length;
const others = changes.filter((p) => p.kind === 'other');

for (const { file, target, kind } of changes) {
  console.log(`${kind === 'other' ? '[non-move] ' : ''}${file}  ->  ${target}`);
  if (APPLY) renameSync(path.join(DIR, file), path.join(DIR, target));
}

console.log(
  `\n${changes.length} to rename, ${unchanged} already correct` +
    (others.length ? `, ${others.length} of them non-move stings` : '')
);
console.log(APPLY ? 'Done.' : 'Dry run - re-run with --apply to rename.');
