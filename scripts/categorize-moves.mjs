// Categorizes every Gen 1-6 move (per @pkmn/sim's Gen 6 dex data) into one
// of the archetypes defined in src/app/core/models/move.model.ts
// (MoveArchetype), and records each move's Gen 6 elemental type. Together
// (archetype, type) key the eventual per-move sound lookup - e.g. a "beam"
// shaped like an Ice-type attack vs. a "beam" shaped like a Fire-type attack.
//
// Uses Dex.forGen(6) so Fairy exists and Charm / Sweet Kiss report Fairy.
//
// Heuristic (first match wins):
//   1. move.drain                                -> absorb          (Giga Drain, Leech Life)
//   2. Status category + flags.heal              -> healMove        (Recover, Moonlight, Rest)
//   3. Status category (everything else)         -> statMove        (Swords Dance, Growl, Toxic)
//   4. curated "signature blast" override        -> beam            (Hydro Pump, Aeroblast, Fire Blast)
//   5. name contains "beam"                      -> beam            (Ice Beam, Hyper Beam, Psybeam, Solar Beam)
//   6. curated "field-wide effect" override       -> areal           (Psychic, Dark Pulse)
//   7. spread target (allAdjacent[Foes])          -> areal           (Surf, Discharge, Earthquake, Blizzard)
//   8. Special + flags.bullet                     -> projectile      (Energy Ball, Shadow Ball, Zap Cannon)
//   9. Physical + no contact flag                 -> projectile      (Rock Slide, Rock Throw)
//  10. Physical + contact flag                    -> melee           (Tackle, Waterfall, Dragon Claw)
//  11. everything else                            -> specialAttack   (Thunderbolt, Earth Power, Water Pulse)
//
// This is an approximation for prototyping purposes, not a definitive
// classification - a couple of moves needed a curated override because the
// "shape" that feels right doesn't fall out of any single data field.
//
// Run with: node scripts/categorize-moves.mjs

import { Dex } from '@pkmn/sim';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';

const OUT_FILE = path.resolve('scripts/move-archetypes.json');
const DEX = Dex.forGen(6);

const BEAM_OVERRIDES = new Set(['hydropump', 'aeroblast', 'fireblast']);
const AREAL_OVERRIDES = new Set(['psychic', 'darkpulse']);
const SPREAD_TARGETS = new Set(['allAdjacent', 'allAdjacentFoes']);

function categorize(move) {
  if (move.drain) return 'absorb';
  if (move.category === 'Status' && move.flags.heal) return 'healMove';
  if (move.category === 'Status') return 'statMove';
  if (BEAM_OVERRIDES.has(move.id)) return 'beam';
  if (/beam/i.test(move.name)) return 'beam';
  if (AREAL_OVERRIDES.has(move.id)) return 'areal';
  if (SPREAD_TARGETS.has(move.target)) return 'areal';
  if (move.category === 'Special' && move.flags.bullet) return 'projectile';
  if (move.category === 'Physical' && !move.flags.contact) return 'projectile';
  if (move.category === 'Physical' && move.flags.contact) return 'melee';
  return 'specialAttack';
}

function main() {
  const moves = DEX.moves.all().filter((m) => m.exists && m.num > 0 && m.gen >= 1 && m.gen <= 6);

  const buckets = {
    melee: [],
    projectile: [],
    beam: [],
    absorb: [],
    areal: [],
    specialAttack: [],
    statMove: [],
    healMove: []
  };
  const mapping = {};

  for (const move of moves) {
    const archetype = categorize(move);
    buckets[archetype].push(move.name);
    mapping[move.id] = { archetype, type: move.type };
  }

  console.log(`Categorized ${moves.length} Gen 1-6 moves:\n`);
  for (const [archetype, names] of Object.entries(buckets)) {
    console.log(`${archetype} (${names.length}):`);
    console.log(`  ${names.slice(0, 12).join(', ')}${names.length > 12 ? ', ...' : ''}`);
  }

  return writeFile(OUT_FILE, JSON.stringify(mapping, null, 2) + '\n').then(() => {
    console.log(`\nWrote per-move archetype+type mapping to ${OUT_FILE}`);
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
