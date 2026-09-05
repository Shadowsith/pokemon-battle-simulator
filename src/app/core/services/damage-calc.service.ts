import { Injectable } from '@angular/core';
import { Dex, StatsTable } from '@pkmn/sim';
import { BattlePokemon } from '../models/pokemon.model';
import { Move } from '../models/move.model';

const LEVEL = 50;
const NEUTRAL_IV = 31;
const NEUTRAL_EV = 0;

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

    const rawDamage =
      (((2 * LEVEL) / 5 + 2) * moveData.basePower * (attackStat / defenseStat)) / 50 + 2;
    const finalDamage = Math.max(1, Math.floor(rawDamage * stab * effectiveness * randomFactor));

    const damagePercent = finalDamage / defenderMaxHpStat;
    return Math.max(1, Math.round(damagePercent * defender.maxHp));
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
