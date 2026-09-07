import { Injectable } from '@angular/core';
import { Dex, StatsTable } from '@pkmn/sim';
import { BattlePokemon } from '../models/pokemon.model';
import { Move } from '../models/move.model';

const LEVEL = 50;
const NEUTRAL_IV = 31;
const NEUTRAL_EV = 0;

/**
 * Self-heal moves whose amount depends on the weather (½ HP under clear sky,
 * ⅔ in sun, ¼ in other weather). No weather system yet, so they use the
 * clear-sky value.
 */
const WEATHER_HEAL_MOVES = new Set(['moonlight', 'synthesis', 'morningsun']);

export type Recovery = { amount: number; kind: 'drain' | 'selfHeal' | 'none' };
export type SelfDamage = { amount: number; kind: 'recoil' | 'selfKo' | 'none' };

/** Standard Pokémon stat formula (neutral nature, no EVs, max IVs). */
function calcStat(base: number, isHp: boolean): number {
  const core = Math.floor(((2 * base + NEUTRAL_IV + Math.floor(NEUTRAL_EV / 4)) * LEVEL) / 100);
  return isHp ? core + LEVEL + 10 : core + 5;
}

/**
 * Computes real damage via @pkmn/sim's bundled Gen data (species base stats, move
 * power/category/type, type chart) using the standard damage formula, then scales
 * the result onto the app's 0-100 HP bars.
 */
@Injectable({ providedIn: 'root' })
export class DamageCalcService {
  private speciesByDexId: Map<number, { baseStats: StatsTable; types: string[] }> | null = null;
  private readonly ppByMove = new Map<string, number>();

  /** Base PP of a move (no PP Ups), from @pkmn/sim. Cached. */
  maxPp(move: Move): number {
    const cached = this.ppByMove.get(move.showdownId);
    if (cached !== undefined) return cached;
    const pp = Dex.moves.get(move.showdownId)?.pp || 1;
    this.ppByMove.set(move.showdownId, pp);
    return pp;
  }

  calculateDamage(attacker: BattlePokemon, defender: BattlePokemon, move: Move): number {
    const moveData = Dex.moves.get(move.showdownId);
    if (!moveData?.exists || !moveData.basePower) return 0;

    const attackerSpecies = this.lookupSpecies(attacker.dexId);
    const defenderSpecies = this.lookupSpecies(defender.dexId);
    if (!attackerSpecies || !defenderSpecies) return 0;

    if (!Dex.getImmunity(moveData.type, defenderSpecies.types)) return 0;

    const isPhysical = moveData.category === 'Physical';
    const attackStat = calcStat(attackerSpecies.baseStats[isPhysical ? 'atk' : 'spa'], false);
    const defenseStat = calcStat(defenderSpecies.baseStats[isPhysical ? 'def' : 'spd'], false);
    const defenderMaxHpStat = calcStat(defenderSpecies.baseStats['hp'], true);

    const stab = attackerSpecies.types.includes(moveData.type) ? 1.5 : 1;
    const typeMod = Dex.getEffectiveness(moveData.type, defenderSpecies.types);
    const effectiveness = Math.pow(2, typeMod);
    const randomFactor = (85 + Math.floor(Math.random() * 16)) / 100;
    // A burned attacker's physical moves deal half.
    const burn = attacker.status.major === 'brn' && isPhysical ? 0.5 : 1;

    const rawDamage =
      (((2 * LEVEL) / 5 + 2) * moveData.basePower * (attackStat / defenseStat)) / 50 + 2;
    const finalDamage = Math.max(1, Math.floor(rawDamage * stab * effectiveness * randomFactor * burn));

    const damagePercent = finalDamage / defenderMaxHpStat;
    return Math.max(1, Math.round(damagePercent * defender.maxHp));
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
    const hpStat = calcStat(species.baseStats['hp'], true);
    const randomFactor = (85 + Math.floor(Math.random() * 16)) / 100;
    const raw = (((2 * LEVEL) / 5 + 2) * 40 * (atk / def)) / 50 + 2;
    const dmg = Math.max(1, Math.floor(raw * randomFactor));
    return Math.max(1, Math.round((dmg / hpStat) * mon.maxHp));
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
