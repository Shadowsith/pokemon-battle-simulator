import { Dex, StatsTable } from '@pkmn/sim';
import type { Move } from '../models/move.model';
import { HeldItem, ITEMS } from '../models/item.model';

/**
 * Picks a fitting held item for a randomly rolled NPC Pokémon from a simple
 * role heuristic (stats + moveset), never repeating an item within one team.
 */

const DEX = Dex.forGen(6);
const TYPES = [
  'Normal', 'Fire', 'Water', 'Electric', 'Grass', 'Ice', 'Fighting', 'Poison', 'Ground',
  'Flying', 'Psychic', 'Bug', 'Rock', 'Ghost', 'Dragon', 'Dark', 'Steel', 'Fairy'
];

function itemFor(kind: 'typeBoost' | 'gem' | 'resistBerry', type: string): HeldItem | undefined {
  return ITEMS.find((i) => i.effect.kind === kind && 'type' in i.effect && i.effect.type === type);
}

/** The attacking type this Pokémon leans on most: its STAB type with the most damaging moves. */
function mainAttackType(types: string[], moves: Move[]): string | null {
  const count = new Map<string, number>();
  for (const m of moves) {
    const md = DEX.moves.get(m.showdownId);
    if (!md?.exists || md.category === 'Status' || !md.basePower) continue;
    count.set(md.type, (count.get(md.type) ?? 0) + (types.includes(md.type) ? 2 : 1));
  }
  return [...count.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
}

/** The attacking type this Pokémon is weakest to (×2 or ×4), if any. */
function worstWeakness(types: string[]): string | null {
  let worst: string | null = null;
  let worstMult = 1;
  for (const t of TYPES) {
    if (!DEX.getImmunity(t, types)) continue;
    const mult = Math.pow(2, DEX.getEffectiveness(t, types));
    if (mult > worstMult) {
      worst = t;
      worstMult = mult;
    }
  }
  return worst;
}

export interface NpcItemInput {
  /** Capitalised type names ("Water"). */
  types: string[];
  /** Level-100 stat line (DamageCalcService.statLine). */
  stats: StatsTable | null;
  moves: Move[];
}

/**
 * A held item id for one NPC Pokémon, or null when every candidate is taken.
 * Candidates by role: fast & frail → Focus Sash / Choice Scarf; strong
 * attacker → Choice Band / Specs (only with an all-attack set) or Life Orb;
 * bulky → Leftovers / Sitrus Berry; always its main attack type's booster or
 * gem, and the resist berry for its worst weakness.
 */
export function pickNpcItem(mon: NpcItemInput, used: ReadonlySet<string>, rng: () => number = Math.random): string | null {
  const s = mon.stats;
  const types = mon.types.map((t) => t.charAt(0).toUpperCase() + t.slice(1).toLowerCase());
  const candidates: string[] = [];
  const allAttacks = mon.moves.every((m) => DEX.moves.get(m.showdownId)?.category !== 'Status');

  if (s) {
    const physical = s.atk >= s.spa;
    const offense = Math.max(s.atk, s.spa);
    const frail = s.hp + s.def + s.spd < 720;
    if (s.spe >= 250 && frail) candidates.push('focussash', allAttacks ? 'choicescarf' : 'lifeorb');
    if (offense >= 270) candidates.push(allAttacks ? (physical ? 'choiceband' : 'choicespecs') : 'lifeorb', 'lifeorb');
    if (s.hp >= 340 || s.def + s.spd >= 480) candidates.push('leftovers', 'sitrusberry');
  }
  const main = mainAttackType(types, mon.moves);
  if (main) {
    const booster = itemFor('typeBoost', main);
    const gem = itemFor('gem', main);
    if (booster) candidates.push(booster.id);
    if (gem) candidates.push(gem.id);
  }
  const weak = worstWeakness(types);
  const berry = weak ? itemFor('resistBerry', weak) : undefined;
  if (berry) candidates.push(berry.id);
  candidates.push('sitrusberry', 'leftovers', 'expertbelt', 'lumberry');

  const open = [...new Set(candidates)].filter((id) => !used.has(id));
  if (!open.length) return null;
  // Usually one of the best-fitting three, so teams vary between rolls.
  const top = open.slice(0, 3);
  return top[Math.floor(rng() * top.length)];
}
