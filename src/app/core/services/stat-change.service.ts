import { Injectable } from '@angular/core';
import { Dex } from '@pkmn/sim';
import { Boosts, StatKey } from '../models/pokemon.model';
import { Move } from '../models/move.model';

/** Move data (boosts, secondary effects, type immunities) at Gen 6. */
const MOVEDEX = Dex.forGen(6);
const STAT_KEYS: StatKey[] = ['atk', 'def', 'spa', 'spd', 'spe', 'accuracy', 'evasion'];

export interface StatChange {
  stat: StatKey;
  /** Requested delta (may be clamped). */
  delta: number;
  /** True when the stat was already at ±6 and nothing changed. */
  capped: boolean;
}

/** Multiplier a stat stage applies to Atk / Def / SpA / SpD / Spe. */
export function stageMultiplier(stage: number): number {
  return stage >= 0 ? (2 + stage) / 2 : 2 / (2 - stage);
}

/**
 * Multiplier a combined accuracy/evasion stage applies to a move's hit chance.
 * Accuracy/evasion use a 3-based table (±6 → 3× … ⅓×), unlike the 2-based table
 * for the offensive/defensive stats.
 */
export function accuracyStageMultiplier(stage: number): number {
  const s = Math.max(-6, Math.min(6, stage));
  return s >= 0 ? (3 + s) / 3 : 3 / (3 - s);
}

/**
 * Resolves the stat-stage changes a move causes (Swords Dance, Agility, Growl,
 * Leer, Overheat's own drop, Crunch's chance to lower Defense, …), reading
 * @pkmn/sim move data. Pure - the battle page applies the deltas.
 */
@Injectable({ providedIn: 'root' })
export class StatChangeService {
  /** Deltas the move applies, split by recipient. Rolls any secondary chances. */
  resolve(
    move: Move,
    targetTypes: string[],
    dealtDamage: number
  ): { toUser: Partial<Boosts>; toTarget: Partial<Boosts> } {
    const md = MOVEDEX.moves.get(move.showdownId);
    const toUser: Partial<Boosts> = {};
    const toTarget: Partial<Boosts> = {};
    if (!md?.exists) return { toUser, toTarget };

    const selfTargeted =
      md.target === 'self' || md.target === 'allies' || md.target === 'allySide' || md.target === 'adjacentAlly';
    const isStatus = md.category === 'Status';
    const connected = isStatus || dealtDamage > 0;
    // A status move that whiffs on a type-immune target (Growl on a Ghost) does nothing.
    const hitsTarget = connected && (!isStatus || !!MOVEDEX.getImmunity(md.type, targetTypes));

    if (md.boosts) {
      if (selfTargeted) merge(toUser, md.boosts);
      else if (hitsTarget) merge(toTarget, md.boosts);
    }

    // Guaranteed self-drawback (Overheat, Draco Meteor, Superpower, Close Combat, Hammer Arm…)
    if (md.self?.boosts && connected) merge(toUser, md.self.boosts);

    // Chance-based secondary effects on a damaging hit.
    if (dealtDamage > 0) {
      const secs = [md.secondary, ...(md.secondaries ?? [])].filter(
        (s): s is NonNullable<typeof s> => !!s
      );
      for (const sec of secs) {
        if (!roll(sec.chance ?? 100)) continue;
        if (sec.boosts) merge(toTarget, sec.boosts);
        if (sec.self?.boosts) merge(toUser, sec.self.boosts);
      }
    }

    return { toUser, toTarget };
  }

  /** Clamp deltas onto a stat-stage record; report what actually changed. */
  apply(current: Boosts, delta: Partial<Boosts>): { boosts: Boosts; changes: StatChange[] } {
    const boosts: Boosts = { ...current };
    const changes: StatChange[] = [];
    for (const stat of STAT_KEYS) {
      const d = delta[stat];
      if (!d) continue;
      const before = boosts[stat];
      const after = Math.max(-6, Math.min(6, before + d));
      boosts[stat] = after;
      changes.push({ stat, delta: d, capped: after === before });
    }
    return { boosts, changes };
  }
}

function merge(acc: Partial<Boosts>, add: Partial<Record<string, number>>): void {
  for (const key of Object.keys(add)) {
    const k = key as StatKey;
    acc[k] = (acc[k] ?? 0) + (add[key] ?? 0);
  }
}

const roll = (chance: number): boolean => Math.random() * 100 < chance;
