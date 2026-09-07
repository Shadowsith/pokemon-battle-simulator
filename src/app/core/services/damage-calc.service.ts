import { Injectable } from '@angular/core';
import { Dex, StatsTable } from '@pkmn/sim';
import { BattlePokemon } from '../models/pokemon.model';
import { Move } from '../models/move.model';
import { stageMultiplier } from './stat-change.service';

/** Every Pokémon in this simulator is level 100. */
const LEVEL = 100;
const NEUTRAL_IV = 31;
const NEUTRAL_EV = 0;

/**
 * Self-heal moves whose amount depends on the weather (½ HP under clear sky,
 * ⅔ in sun, ¼ in other weather). No weather system yet, so they use the
 * clear-sky value.
 */
const WEATHER_HEAL_MOVES = new Set(['moonlight', 'synthesis', 'morningsun']);

/** Two-turn moves whose user disappears and is (mostly) untargetable turn 1. */
const SEMI_INVULN = new Set(['fly', 'dig', 'bounce', 'dive', 'skydrop', 'shadowforce', 'phantomforce']);

export type Recovery = { amount: number; kind: 'drain' | 'selfHeal' | 'none' };
export type SelfDamage = { amount: number; kind: 'recoil' | 'selfKo' | 'none' };

/**
 * Standard Pokémon stat formula (neutral nature, no EVs, max IVs) - identical to
 * @pkmn/sim's own `spreadModify`, so a level-100 result matches the simulator.
 */
function calcStat(base: number, isHp: boolean): number {
  const core = Math.floor(((2 * base + NEUTRAL_IV + Math.floor(NEUTRAL_EV / 4)) * LEVEL) / 100);
  return isHp ? core + LEVEL + 10 : core + 5;
}

/**
 * Computes real damage via @pkmn/sim's bundled Gen data (species base stats, move
 * power/category/type, type chart) using the standard damage formula, against the
 * defender's real level-100 HP total.
 */
@Injectable({ providedIn: 'root' })
export class DamageCalcService {
  private speciesByDexId: Map<number, { baseStats: StatsTable; types: string[] }> | null = null;
  private readonly ppByMove = new Map<string, number>();

  /** The level every Pokémon in this simulator is set to. */
  readonly level = LEVEL;

  /**
   * A species' real max HP at {@link level} (31 IVs, 0 EVs, from its @pkmn/sim
   * base HP stat) - the value the HP bar is denominated in. Falls back to 100
   * for an unknown dex id.
   */
  hpStat(dexId: number): number {
    const species = this.lookupSpecies(dexId);
    return species ? calcStat(species.baseStats['hp'], true) : 100;
  }

  /** A species' full battle stat line at {@link level} (atk/def/spa/spd/spe + hp). */
  statLine(dexId: number): StatsTable | null {
    const species = this.lookupSpecies(dexId);
    if (!species) return null;
    return {
      hp: calcStat(species.baseStats['hp'], true),
      atk: calcStat(species.baseStats['atk'], false),
      def: calcStat(species.baseStats['def'], false),
      spa: calcStat(species.baseStats['spa'], false),
      spd: calcStat(species.baseStats['spd'], false),
      spe: calcStat(species.baseStats['spe'], false)
    };
  }

  /** Base PP of a move (no PP Ups), from @pkmn/sim. Cached. */
  maxPp(move: Move): number {
    const cached = this.ppByMove.get(move.showdownId);
    if (cached !== undefined) return cached;
    const pp = Dex.moves.get(move.showdownId)?.pp || 1;
    this.ppByMove.set(move.showdownId, pp);
    return pp;
  }

  /** Priority bracket of a move (Quick Attack +1, Roar -6, most moves 0). */
  movePriority(move: Move): number {
    return Dex.moves.get(move.showdownId)?.priority ?? 0;
  }

  /** A move's base power from @pkmn/sim (0 for status / fixed-damage moves). */
  basePower(move: Move): number {
    return Dex.moves.get(move.showdownId)?.basePower ?? 0;
  }

  /**
   * Type-effectiveness multiplier of a damaging move against `defender`:
   * 0 (immune), 0.25, 0.5, 1, 2 or 4. Status / no-power moves report 1.
   */
  effectiveness(move: Move, defender: BattlePokemon): number {
    const moveData = Dex.moves.get(move.showdownId);
    if (!moveData?.exists || moveData.category === 'Status' || !moveData.basePower) return 1;
    const species = this.lookupSpecies(defender.dexId);
    if (!species) return 1;
    if (!Dex.getImmunity(moveData.type, species.types)) return 0;
    return Math.pow(2, Dex.getEffectiveness(moveData.type, species.types));
  }

  /** A non-damaging status move (Swords Dance, Toxic, Thunder Wave …). */
  isStatusMove(move: Move): boolean {
    return Dex.moves.get(move.showdownId)?.category === 'Status';
  }

  /** Two-turn move (Solar Beam, Fly, Dig, Sky Attack …): charges turn 1, hits turn 2. */
  isChargeMove(move: Move): boolean {
    return !!Dex.moves.get(move.showdownId)?.flags?.['charge'];
  }

  /** The subset of two-turn moves where the user vanishes and dodges attacks turn 1. */
  isSemiInvulnMove(move: Move): boolean {
    return SEMI_INVULN.has(move.showdownId);
  }

  /**
   * Effective Speed used for turn order: base Speed stat, scaled by the Speed
   * stage, quartered while paralysed (Gen 5).
   */
  effectiveSpeed(mon: BattlePokemon): number {
    const species = this.lookupSpecies(mon.dexId);
    if (!species) return 0;
    let spe = calcStat(species.baseStats['spe'], false) * stageMultiplier(mon.boosts.spe);
    if (mon.status.major === 'par') spe *= 0.25;
    return spe;
  }

  calculateDamage(attacker: BattlePokemon, defender: BattlePokemon, move: Move): number {
    const moveData = Dex.moves.get(move.showdownId);
    if (!moveData?.exists || !moveData.basePower) return 0;

    const attackerSpecies = this.lookupSpecies(attacker.dexId);
    const defenderSpecies = this.lookupSpecies(defender.dexId);
    if (!attackerSpecies || !defenderSpecies) return 0;

    if (!Dex.getImmunity(moveData.type, defenderSpecies.types)) return 0;

    const isPhysical = moveData.category === 'Physical';
    const atkKey = isPhysical ? 'atk' : 'spa';
    const defKey = isPhysical ? 'def' : 'spd';
    const attackStat =
      calcStat(attackerSpecies.baseStats[atkKey], false) * stageMultiplier(attacker.boosts[atkKey]);
    const defenseStat =
      calcStat(defenderSpecies.baseStats[defKey], false) * stageMultiplier(defender.boosts[defKey]);

    const stab = attackerSpecies.types.includes(moveData.type) ? 1.5 : 1;
    const typeMod = Dex.getEffectiveness(moveData.type, defenderSpecies.types);
    const effectiveness = Math.pow(2, typeMod);
    const randomFactor = (85 + Math.floor(Math.random() * 16)) / 100;
    // A burned attacker's physical moves deal half.
    const burn = attacker.status.major === 'brn' && isPhysical ? 0.5 : 1;

    const rawDamage =
      (((2 * LEVEL) / 5 + 2) * moveData.basePower * (attackStat / defenseStat)) / 50 + 2;
    return Math.max(1, Math.floor(rawDamage * stab * effectiveness * randomFactor * burn));
  }

  /**
   * HP the move restores to its **user**, in the app's 0-100 HP units, using
   * @pkmn/sim move data:
   *  - `drain` moves (Giga Drain, Drain Punch, Absorb, Leech Life, Horn Leech,
   *    Mega Drain, Dream Eater) heal half the damage dealt;
   *  - `heal` moves (Recover, Roost, Soft-Boiled, Milk Drink, Slack Off, Heal
   *    Order) heal a fixed fraction of max HP;
   *  - Moonlight / Synthesis / Morning Sun heal a weather-scaled fraction;
   *  - Rest fully restores; Wish is applied immediately here.
   * `amount` is already clamped to the missing HP.
   */
  calculateRecovery(move: Move, user: BattlePokemon, damageDealt: number): Recovery {
    const md = Dex.moves.get(move.showdownId);
    if (!md?.exists) return { amount: 0, kind: 'none' };

    const missing = Math.max(0, user.maxHp - user.currentHp);
    const clamp = (n: number) => Math.max(0, Math.min(missing, n));

    if (md.drain && damageDealt > 0) {
      const raw = Math.round((damageDealt * md.drain[0]) / md.drain[1]);
      return { amount: Math.min(missing, Math.max(1, raw)), kind: 'drain' };
    }

    if (md.heal) {
      return { amount: clamp(Math.round((user.maxHp * md.heal[0]) / md.heal[1])), kind: 'selfHeal' };
    }

    if (WEATHER_HEAL_MOVES.has(md.id) || md.id === 'wish') {
      return { amount: clamp(Math.round(user.maxHp * 0.5)), kind: 'selfHeal' };
    }

    if (md.id === 'rest') {
      return { amount: missing, kind: 'selfHeal' };
    }

    // Heal-flag moves we don't model (Healing Wish, Lunar Dance, Heal Pulse,
    // Swallow): report as a self-heal so messaging reads "but it failed".
    if (md.flags?.heal) return { amount: 0, kind: 'selfHeal' };

    return { amount: 0, kind: 'none' };
  }

  /**
   * HP the move costs its **user** right after it connects:
   *  - recoil moves (Brave Bird, Flare Blitz, Volt Tackle, Double-Edge, Wood
   *    Hammer, Take Down, Head Smash, Submission, Wild Charge, Head Charge)
   *    cost a fraction of the damage dealt (Gen 5 rounding, min 1);
   *  - self-KO moves (Explosion, Self-Destruct, Memento, Final Gambit, …) make
   *    the user faint.
   * `amount` is clamped to the user's current HP. Jump Kick / Hi Jump Kick
   * crash damage is not modelled - it only triggers on a miss and there is no
   * accuracy system.
   */
  calculateSelfDamage(move: Move, user: BattlePokemon, damageDealt: number): SelfDamage {
    const md = Dex.moves.get(move.showdownId);
    if (!md?.exists) return { amount: 0, kind: 'none' };

    if (md.selfdestruct) return { amount: user.currentHp, kind: 'selfKo' };

    if (md.recoil && damageDealt > 0) {
      const raw = Math.max(1, Math.round((damageDealt * md.recoil[0]) / md.recoil[1]));
      return { amount: Math.min(user.currentHp, raw), kind: 'recoil' };
    }

    if (md.struggleRecoil) {
      const raw = Math.max(1, Math.round(user.maxHp / 4));
      return { amount: Math.min(user.currentHp, raw), kind: 'recoil' };
    }

    return { amount: 0, kind: 'none' };
  }

  /** Damage a confused Pokémon does to itself: a 40-BP typeless physical hit. */
  confusionSelfDamage(mon: BattlePokemon): number {
    const species = this.lookupSpecies(mon.dexId);
    if (!species) return Math.max(1, Math.round(mon.maxHp * 0.1));
    const atk = calcStat(species.baseStats['atk'], false);
    const def = calcStat(species.baseStats['def'], false);
    const randomFactor = (85 + Math.floor(Math.random() * 16)) / 100;
    const raw = (((2 * LEVEL) / 5 + 2) * 40 * (atk / def)) / 50 + 2;
    return Math.max(1, Math.floor(raw * randomFactor));
  }

  private lookupSpecies(dexId: number) {
    if (!this.speciesByDexId) {
      this.speciesByDexId = new Map();
      for (const species of Dex.species.all()) {
        if (!this.speciesByDexId.has(species.num)) {
          this.speciesByDexId.set(species.num, { baseStats: species.baseStats, types: species.types });
        }
      }
    }
    return this.speciesByDexId.get(dexId);
  }
}
