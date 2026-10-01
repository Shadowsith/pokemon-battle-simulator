import { Dex } from '@pkmn/sim';
import type { Move } from '../models/move.model';
import { BattlePokemon, STAT_META, StatKey } from '../models/pokemon.model';
import { BattleItemId, HeldItem, heldItem } from '../models/item.model';

/**
 * What a held item does at each point of a move / turn. Pure functions over
 * BattlePokemon + Move: they return multipliers, HP deltas, patches and the
 * German log line, and the battle page applies them. Gen 6+ / Gen 8 values.
 */

const DEX = Dex.forGen(6);

export function itemOf(mon: BattlePokemon): HeldItem | undefined {
  return heldItem(mon.item);
}

function battleItem(mon: BattlePokemon): BattleItemId | null {
  const e = itemOf(mon)?.effect;
  return e?.kind === 'battle' ? e.id : null;
}

function moveData(move: Move) {
  const md = DEX.moves.get(move.showdownId);
  return {
    type: md?.type ?? move.type,
    category: md?.category ?? 'Status',
    damaging: !!md?.exists && md.category !== 'Status' && md.basePower > 0,
    contact: !!md?.flags?.['contact']
  };
}

const nfeByDex = new Map<number, boolean>();
/** True when the species can still evolve (Eviolite). */
export function canEvolve(dexId: number): boolean {
  if (!nfeByDex.size) {
    for (const s of DEX.species.all()) {
      if (s.num > 0 && (!s.forme || !nfeByDex.has(s.num))) nfeByDex.set(s.num, !!s.nfe);
    }
  }
  return nfeByDex.get(dexId) ?? false;
}

// --- damage ---------------------------------------------------------------

export interface OffenseMods {
  /** Base power multiplier (type booster, gem, Muscle Band / Wise Glasses). */
  powerMult: number;
  /** Attacking stat multiplier (Choice Band / Specs). */
  atkStatMult: number;
  /** Final damage multiplier (Expert Belt, Life Orb). */
  finalMult: number;
  /** The gem this hit uses up, if any. */
  gem: HeldItem | null;
  /** Life Orb recoil follows the hit. */
  lifeOrb: boolean;
}

export function offenseMods(attacker: BattlePokemon, move: Move, effectiveness: number): OffenseMods {
  const mods: OffenseMods = { powerMult: 1, atkStatMult: 1, finalMult: 1, gem: null, lifeOrb: false };
  const item = itemOf(attacker);
  const md = moveData(move);
  if (!item || !md.damaging) return mods;
  const e = item.effect;
  const physical = md.category === 'Physical';

  if (e.kind === 'typeBoost' && e.type === md.type) mods.powerMult *= e.mult;
  if (e.kind === 'gem' && e.type === md.type) {
    mods.powerMult *= 1.3;
    mods.gem = item;
  }
  if (e.kind === 'battle') {
    if (e.id === 'muscleband' && physical) mods.powerMult *= 1.1;
    if (e.id === 'wiseglasses' && !physical) mods.powerMult *= 1.1;
    if (e.id === 'choiceband' && physical) mods.atkStatMult *= 1.5;
    if (e.id === 'choicespecs' && !physical) mods.atkStatMult *= 1.5;
    if (e.id === 'expertbelt' && effectiveness > 1) mods.finalMult *= 1.2;
    if (e.id === 'lifeorb') {
      mods.finalMult *= 1.3;
      mods.lifeOrb = true;
    }
  }
  return mods;
}

export interface DefenseMods {
  /** Defending stat multiplier (Assault Vest, Eviolite). */
  defStatMult: number;
  /** Final damage multiplier (resist berry). */
  finalMult: number;
  /** The resist berry this hit uses up, if any. */
  berry: HeldItem | null;
  /** Air Balloon: Ground moves miss entirely. */
  immune: boolean;
}

export function defenseMods(defender: BattlePokemon, move: Move, effectiveness: number): DefenseMods {
  const mods: DefenseMods = { defStatMult: 1, finalMult: 1, berry: null, immune: false };
  const item = itemOf(defender);
  const md = moveData(move);
  if (!item || !md.damaging) return mods;
  const e = item.effect;
  const special = md.category === 'Special';

  if (e.kind === 'battle') {
    if (e.id === 'airballoon' && md.type === 'Ground') mods.immune = true;
    if (e.id === 'assaultvest' && special) mods.defStatMult *= 1.5;
    if (e.id === 'eviolite' && canEvolve(defender.dexId)) mods.defStatMult *= 1.5;
  }
  if (e.kind === 'resistBerry' && e.type === md.type && (e.type === 'Normal' || effectiveness > 1)) {
    mods.finalMult *= 0.5;
    mods.berry = item;
  }
  return mods;
}

/** Focus Sash: a full-HP Pokémon survives a would-be KO with 1 HP (then the sash is gone). */
export function focusSashCap(defender: BattlePokemon, damage: number): { damage: number; used: boolean } {
  if (battleItem(defender) !== 'focussash') return { damage, used: false };
  if (defender.currentHp !== defender.maxHp || damage < defender.currentHp) return { damage, used: false };
  return { damage: defender.currentHp - 1, used: true };
}

// --- after a hit --------------------------------------------------------

/** HP the attacker loses for hitting `defender` (Rocky Helmet, Jaboca / Rowap Berry). */
export function retaliation(
  attacker: BattlePokemon,
  defender: BattlePokemon,
  move: Move,
  dealt: number
): { damage: number; message: string; consumed: boolean } | null {
  const item = itemOf(defender);
  const md = moveData(move);
  if (!item || dealt <= 0) return null;
  const e = item.effect;
  if (e.kind === 'battle' && e.id === 'rockyhelmet' && md.contact) {
    return {
      damage: Math.max(1, Math.floor(attacker.maxHp / 6)),
      message: `${attacker.name} wird durch den Beulenhelm verletzt!`,
      consumed: false
    };
  }
  if (e.kind === 'retaliateBerry' && e.category === md.category) {
    return {
      damage: Math.max(1, Math.floor(attacker.maxHp / 8)),
      message: `${defender.name} isst seine ${item.name}! ${attacker.name} wird verletzt!`,
      consumed: true
    };
  }
  return null;
}

/** Life Orb recoil: 1/10 of max HP after a damaging hit. */
export function lifeOrbRecoil(attacker: BattlePokemon): number {
  return Math.max(1, Math.floor(attacker.maxHp / 10));
}

/** Shell Bell: heal 1/8 of the damage dealt. */
export function shellBellHeal(attacker: BattlePokemon, dealt: number): number {
  return battleItem(attacker) === 'shellbell' && dealt > 0 ? Math.max(1, Math.floor(dealt / 8)) : 0;
}

/** An Air Balloon pops as soon as its holder takes damage. */
export function balloonPops(defender: BattlePokemon, dealt: number): boolean {
  return battleItem(defender) === 'airballoon' && dealt > 0;
}

// --- berries & herbs ---------------------------------------------------

export interface ItemTrigger {
  /** Changes for the holder (item removed when consumed). */
  patch: Partial<BattlePokemon>;
  message: string;
}

const PINCH_STATS: StatKey[] = ['atk', 'def', 'spa', 'spd', 'spe'];

/**
 * Berries / White Herb that fire on their own after HP, status or stat
 * changes: heal at ≤ 50 %, pinch boost at ≤ 25 %, status cure, reset lowered
 * stats. Returns the first trigger (the item is then used up) or null.
 */
export function berryCheck(mon: BattlePokemon, rng: () => number = Math.random): ItemTrigger | null {
  const item = itemOf(mon);
  if (!item || mon.currentHp <= 0) return null;
  const e = item.effect;
  const used = { item: null, itemRevealed: true };

  if (e.kind === 'healBerry' && mon.currentHp <= mon.maxHp * e.threshold) {
    const amount = e.flat ?? Math.floor(mon.maxHp * (e.fraction ?? 0));
    const healed = Math.min(mon.maxHp, mon.currentHp + Math.max(1, amount));
    return {
      patch: { ...used, currentHp: healed },
      message: `${mon.name} isst seine ${item.name} und füllt KP auf!`
    };
  }

  if (e.kind === 'cureBerry') {
    const major = mon.status.major;
    if (major && e.cures.includes(major)) {
      return {
        patch: { ...used, status: { ...mon.status, major: null, toxicTurns: 0, sleepTurns: 0 } },
        message: `${mon.name} isst seine ${item.name} und wird geheilt!`
      };
    }
    if (mon.status.confusionTurns > 0 && e.cures.includes('confusion')) {
      return {
        patch: { ...used, status: { ...mon.status, confusionTurns: 0 } },
        message: `${mon.name} isst seine ${item.name} und ist nicht mehr verwirrt!`
      };
    }
  }

  if (e.kind === 'pinchBerry' && mon.currentHp <= mon.maxHp / 4) {
    const open = PINCH_STATS.filter((s) => mon.boosts[s] < 6);
    const stat = e.stat === 'random' ? open[Math.floor(rng() * open.length)] : e.stat;
    if (!stat || mon.boosts[stat] >= 6) return null;
    const boosts = { ...mon.boosts, [stat]: Math.min(6, mon.boosts[stat] + e.stages) };
    const verb = e.stages >= 2 ? 'steigt stark' : 'steigt';
    return {
      patch: { ...used, boosts },
      message: `${mon.name} isst seine ${item.name}! ${mon.name}s ${STAT_META[stat].label} ${verb}!`
    };
  }

  if (e.kind === 'battle' && e.id === 'whiteherb') {
    const lowered = (Object.keys(mon.boosts) as StatKey[]).filter((k) => mon.boosts[k] < 0);
    if (lowered.length) {
      const boosts = { ...mon.boosts };
      for (const k of lowered) boosts[k] = 0;
      return {
        patch: { ...used, boosts },
        message: `${mon.name} stellt mit dem Schlohkraut seine Statuswerte wieder her!`
      };
    }
  }
  return null;
}

/** End-of-turn item HP change (Leftovers, Black Sludge). */
export function residualItem(mon: BattlePokemon): { delta: number; message: string } | null {
  const id = battleItem(mon);
  if (mon.currentHp <= 0) return null;
  const sixteenth = Math.max(1, Math.floor(mon.maxHp / 16));
  if (id === 'leftovers' && mon.currentHp < mon.maxHp) {
    return { delta: sixteenth, message: `${mon.name} füllt mit Überreste etwas KP auf.` };
  }
  if (id === 'blacksludge') {
    if (mon.types.includes('poison')) {
      return mon.currentHp < mon.maxHp
        ? { delta: sixteenth, message: `${mon.name} füllt mit Giftschleim etwas KP auf.` }
        : null;
    }
    return { delta: -Math.max(1, Math.floor(mon.maxHp / 8)), message: `${mon.name} wird durch den Giftschleim verletzt!` };
  }
  return null;
}

// --- speed, accuracy, move restrictions ---------------------------------

/** Choice Scarf: ×1.5 Speed. */
export function speedMult(mon: BattlePokemon): number {
  return battleItem(mon) === 'choicescarf' ? 1.5 : 1;
}

/** Wide Lens (attacker ×1.1) and Bright Powder (defender ×0.9). */
export function accuracyMult(attacker: BattlePokemon, defender: BattlePokemon): number {
  let mult = 1;
  if (battleItem(attacker) === 'widelens') mult *= 1.1;
  if (battleItem(defender) === 'brightpowder') mult *= 0.9;
  return mult;
}

/** Choice Band / Specs / Scarf lock the holder into its first move. */
export function isChoiceItem(mon: BattlePokemon): boolean {
  const id = battleItem(mon);
  return id === 'choiceband' || id === 'choicespecs' || id === 'choicescarf';
}

/** Assault Vest: the holder can't select status moves. */
export function blocksStatusMoves(mon: BattlePokemon): boolean {
  return battleItem(mon) === 'assaultvest';
}

/** Power Herb: skip the charge turn of a two-turn move (once). */
export function hasPowerHerb(mon: BattlePokemon): boolean {
  return battleItem(mon) === 'powerherb';
}

/** Rough damage multiplier the item gives `move` (NPC move scoring). */
export function itemScoreMult(attacker: BattlePokemon, move: Move): number {
  const m = offenseMods(attacker, move, 1);
  return m.powerMult * m.atkStatMult * m.finalMult;
}
