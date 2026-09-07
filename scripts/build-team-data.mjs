// Builds the static data the team builder needs, from @pkmn/sim's bundled
// Gen 5 dex, into public/assets/data/:
//
//   species-gen5.json    [{ num, id, name, types }]        national dex 1-649
//   moves-gen5.json      { id: { name, type, category, bp, pp } }
//   learnsets-gen5.json  { speciesId: [moveId, ...] }
//
// A move is listed for a species when the species (or any pre-evolution) can
// learn it in ANY generation (level-up, TM/HM, tutor or egg), as long as the
// move itself is a Gen 1-5 move the battle engine supports (present in
// MOVE_LIBRARY). So e.g. Umbreon lists Crunch, which it only gains by TM from
// Gen 8 on - the move existed in Gen 1-5, and Umbreon can learn it.
// Smeargle gets the full move pool (Sketch).
//
// Run with: node scripts/build-team-data.mjs

import { readFile, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { Dex } from '@pkmn/sim';

const G5 = Dex.forGen(5);
const OUT_DIR = path.resolve('public/assets/data');
const MODEL_FILE = path.resolve('src/app/core/models/move.model.ts');

const CATEGORY = { Physical: 'phys', Special: 'spec', Status: 'status' };

/**
 * MOVE_LIBRARY is the battle engine's move set and carries the German names /
 * Gen 5 types the rest of the app shows. Parse it so the team builder speaks
 * the same language.
 */
async function supportedMoves() {
  const src = await readFile(MODEL_FILE, 'utf8');
  const map = new Map();
  const re = /\bname: '([^']+)',[^}]*?\btype: '([^']+)',[^}]*?\bshowdownId: '([a-z0-9]+)'/g;
  for (const m of src.matchAll(re)) {
    map.set(m[3], { name: m[1], type: m[2] });
  }
  return map;
}

/**
 * Every Gen 1-5 move (present in `supported`) the species or a pre-evolution
 * can learn in any generation.
 */
async function legalMoves(speciesId, supported) {
  if (speciesId === 'smeargle') return [...supported.keys()].sort();

  const out = new Set();
  const seen = new Set();
  let species = G5.species.get(speciesId);
  while (species && species.exists && !seen.has(species.id)) {
    seen.add(species.id);
    const data = await G5.learnsets.get(species.id);
    if (data && data.learnset) {
      for (const moveId of Object.keys(data.learnset)) {
        if (supported.has(moveId)) out.add(moveId);
      }
    }
    species = species.prevo ? G5.species.get(species.prevo) : null;
  }
  return [...out].sort();
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  const supported = await supportedMoves();

  // moves - German name + Gen 5 type from MOVE_LIBRARY, mechanics from the dex
  const moves = {};
  for (const [id, lib] of [...supported].sort((a, b) => a[0].localeCompare(b[0]))) {
    const m = G5.moves.get(id);
    if (!m.exists) continue;
    moves[id] = {
      name: lib.name,
      type: lib.type,
      category: CATEGORY[m.category] ?? 'status',
      bp: m.basePower || 0,
      pp: m.pp
    };
  }

  // species (base national dex 1-649, no alternate formes)
  const species = G5.species
    .all()
    .filter((s) => s.num >= 1 && s.num <= 649 && s.gen <= 5 && !s.forme && !s.isNonstandard)
    .sort((a, b) => a.num - b.num)
    .map((s) => ({ num: s.num, id: s.id, name: s.name, types: s.types }));

  // learnsets
  const learnsets = {};
  let empty = 0;
  for (const s of species) {
    const list = await legalMoves(s.id, supported);
    learnsets[s.id] = list;
    if (!list.length) empty++;
  }

  await writeFile(path.join(OUT_DIR, 'moves-gen5.json'), JSON.stringify(moves) + '\n');
  await writeFile(path.join(OUT_DIR, 'species-gen5.json'), JSON.stringify(species) + '\n');
  await writeFile(path.join(OUT_DIR, 'learnsets-gen5.json'), JSON.stringify(learnsets) + '\n');

  const avg = Math.round(
    Object.values(learnsets).reduce((n, l) => n + l.length, 0) / species.length
  );
  console.log(
    `Wrote ${Object.keys(moves).length} moves, ${species.length} species, ` +
      `learnsets (avg ${avg} moves/species, ${empty} empty) to ${path.relative(process.cwd(), OUT_DIR)}`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
