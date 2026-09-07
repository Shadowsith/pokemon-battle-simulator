import { Injectable } from '@angular/core';
import { Dex } from '@pkmn/sim';
import { BattlePokemon, MajorStatus, StatusState } from '../models/pokemon.model';
import { Move } from '../models/move.model';

const G5 = Dex.forGen(5);

export type Inflicted = MajorStatus | 'confusion';

export interface PreMove {
  canAct: boolean;
  /** New status state to write back (sleep decremented, thaw roll, snap-out). */
  status: StatusState;
  /** Message to show when a status fires (prevents the move, thaws, wakes …). */
  message: string | null;
  /** The Pokémon hit itself in its confusion - its action is over. */
  confusionSelfHit: boolean;
}

const rollPct = (chance: number): boolean => Math.random() * 100 < chance;
const chip = (maxHp: number, num: number, den: number): number =>
  Math.max(1, Math.floor((maxHp * num) / den));

function secondaries(md: ReturnType<typeof G5.moves.get>) {
  return [md.secondary, ...(md.secondaries ?? [])].filter((s): s is NonNullable<typeof s> => !!s);
}

/**
 * Gen 5 status-condition rules, as pure decisions the battle page applies:
 * sleep / freeze / paralysis / confusion gating before a move, status
 * infliction from moves (with type immunities), and end-of-turn burn / poison
 * / toxic damage. Burned physical attackers deal half.
 */
@Injectable({ providedIn: 'root' })
export class StatusService {
  /** Effects that fire before `mon` moves. */
  resolvePreMove(mon: BattlePokemon): PreMove {
    const s: StatusState = { ...mon.status };
    let message: string | null = null;

    if (s.major === 'frz') {
      if (rollPct(20)) {
        s.major = null;
        message = `${mon.name} ist aufgetaut!`;
      } else {
        return { canAct: false, status: s, message: `${mon.name} ist eingefroren und kann nicht angreifen!`, confusionSelfHit: false };
      }
    }

    if (s.major === 'slp') {
      s.sleepTurns -= 1;
      if (s.sleepTurns <= 0) {
        s.major = null;
        s.sleepTurns = 0;
        message = merge(message, `${mon.name} ist aufgewacht!`); // Gen 5: wakes and still moves this turn
      } else {
        return { canAct: false, status: s, message: merge(message, `${mon.name} schläft tief und fest.`), confusionSelfHit: false };
      }
    }

    if (s.confusionTurns > 0) {
      s.confusionTurns -= 1;
      if (s.confusionTurns === 0) {
        message = merge(message, `${mon.name} ist nicht mehr verwirrt!`);
      } else if (rollPct(50)) {
        return { canAct: false, status: s, message: merge(message, `${mon.name} ist so verwirrt, dass es sich selbst verletzt!`), confusionSelfHit: true };
      }
    }

    if (s.major === 'par' && rollPct(25)) {
      return { canAct: false, status: s, message: merge(message, `${mon.name} ist paralysiert! Es kann nicht angreifen!`), confusionSelfHit: false };
    }

    return { canAct: true, status: s, message, confusionSelfHit: false };
  }

  /** What status (if any) `move` inflicts on `target` this time. Rolls RNG. */
  rollInfliction(move: Move, target: BattlePokemon, damageDealt: number): Inflicted | null {
    const md = G5.moves.get(move.showdownId);
    if (!md?.exists) return null;
    const isStatusMove = md.category === 'Status';
    const connected = isStatusMove || damageDealt > 0;
    if (!connected) return null;

    // A status move that is type-immune (Thunder Wave vs Ground, Glare vs
    // Ghost, Toxic vs Steel) does nothing.
    if (isStatusMove && !G5.getImmunity(md.type, target.types)) return null;

    // Confusion (volatile) - can stack with a major status.
    const confChance =
      md.volatileStatus === 'confusion'
        ? 100
        : (secondaries(md).find((s) => s.volatileStatus === 'confusion')?.chance ?? 0);
    if (confChance && target.status.confusionTurns === 0 && rollPct(confChance)) {
      return 'confusion';
    }

    // Major status - from `move.status` or a secondary effect.
    let statusId = md.status as MajorStatus | undefined;
    let chance = statusId ? 100 : 0;
    if (!statusId) {
      const sec = secondaries(md).find((s) => !!s.status);
      if (sec) {
        statusId = sec.status as MajorStatus;
        chance = sec.chance ?? 100;
      }
    }
    if (!statusId) return null;
    if (target.status.major) return null; // only one major status at a time
    if (!rollPct(chance)) return null;

    const immunityKey = statusId === 'tox' ? 'psn' : statusId;
    if (!G5.getImmunity(immunityKey, target.types)) return null; // Fire/brn, Ice/frz, Poison·Steel/psn
    return statusId;
  }

  /** The StatusState to write onto a target that was just inflicted. */
  applyInfliction(target: BattlePokemon, inflicted: Inflicted): StatusState {
    const s: StatusState = { ...target.status };
    if (inflicted === 'confusion') {
      s.confusionTurns = 2 + Math.floor(Math.random() * 4); // 2-5 turns
      return s;
    }
    s.major = inflicted;
    // sleepTurns counts down once per turn; the Pokémon misses (sleepTurns - 1)
    // turns, i.e. 1-3, then wakes and moves.
    if (inflicted === 'slp') s.sleepTurns = 2 + Math.floor(Math.random() * 3);
    if (inflicted === 'tox') s.toxicTurns = 1;
    return s;
  }

  inflictionMessage(name: string, inflicted: Inflicted): string {
    switch (inflicted) {
      case 'brn':
        return `${name} erleidet Verbrennungen!`;
      case 'psn':
        return `${name} wurde vergiftet!`;
      case 'tox':
        return `${name} wurde schwer vergiftet!`;
      case 'par':
        return `${name} wurde paralysiert!`;
      case 'slp':
        return `${name} ist eingeschlafen!`;
      case 'frz':
        return `${name} wurde eingefroren!`;
      case 'confusion':
        return `${name} ist verwirrt!`;
    }
  }

  /** End-of-turn burn / poison / toxic damage. */
  residual(mon: BattlePokemon): { damage: number; status: StatusState; message: string | null } {
    const s: StatusState = { ...mon.status };
    if (mon.currentHp <= 0 || !s.major) return { damage: 0, status: s, message: null };

    if (s.major === 'brn') {
      return { damage: chip(mon.maxHp, 1, 8), status: s, message: `${mon.name} leidet unter seiner Verbrennung!` };
    }
    if (s.major === 'psn') {
      return { damage: chip(mon.maxHp, 1, 8), status: s, message: `${mon.name} leidet unter der Vergiftung!` };
    }
    if (s.major === 'tox') {
      const damage = chip(mon.maxHp, Math.min(s.toxicTurns, 15), 16);
      s.toxicTurns += 1;
      return { damage, status: s, message: `${mon.name} leidet unter der Vergiftung!` };
    }
    return { damage: 0, status: s, message: null };
  }

  /** A Fire move landing on a frozen Pokémon thaws it. */
  isFireMove(move: Move): boolean {
    return G5.moves.get(move.showdownId)?.type === 'Fire';
  }
}

function merge(a: string | null, b: string): string {
  return a ? `${a} ${b}` : b;
}
