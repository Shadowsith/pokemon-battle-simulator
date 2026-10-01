import type { Move } from '../models/move.model';
import type { BattlePokemon } from '../models/pokemon.model';
import {
  FieldView,
  PROTECT_MOVES,
  REDIRECT_MOVES,
  Slot,
  isSpreadMove,
  livingAlly,
  livingFoes,
  moveTarget
} from './battle-format';
import { itemScoreMult } from './item-effects';

/** The slice of DamageCalcService the AI scores with (kept small so it can be stubbed). */
export interface AiCalc {
  isStatusMove(move: Move): boolean;
  basePower(move: Move): number;
  accuracy(move: Move): number;
  effectiveness(move: Move, defender: BattlePokemon): number;
  hitChance(move: Move, attacker: BattlePokemon, defender: BattlePokemon): number;
}

/**
 * Rough "how useful is this move against `target`" for the NPC. Damaging moves
 * score as base power × STAB × type effectiveness × hit chance × held-item boost;
 * status moves score low so they stay situational rather than spammed.
 */
export function scoreMove(calc: AiCalc, move: Move, user: BattlePokemon, target: BattlePokemon): number {
  if (calc.isStatusMove(move)) return 12 * calc.accuracy(move);
  const bp = calc.basePower(move);
  if (bp <= 0) return 25; // fixed / variable damage (Seismic Toss, Night Shade, …)
  const eff = calc.effectiveness(move, target); // 0, .25, .5, 1, 2, 4
  if (eff === 0) return 0;
  const stab = user.types.includes(move.type.toLowerCase()) ? 1.5 : 1;
  return bp * stab * eff * calc.hitChance(move, user, target) * itemScoreMult(user, move);
}

export interface NpcContext {
  calc: AiCalc;
  field: FieldView;
  slot: Slot;
  user: BattlePokemon;
  moves: Move[];
  /** The Pokémon standing in a slot (null when empty). */
  monAt(slot: Slot): BattlePokemon | null;
  /** The partner's moveset (doubles), used to value Helping Hand. */
  allyMoves: Move[];
  /** Successful protection moves in a row for this Pokémon. */
  protectStreak: number;
  rng?: () => number;
}

export interface NpcChoice {
  move: Move;
  /** Chosen target for single-target moves; null for spread / self moves. */
  target: Slot | null;
}

/**
 * The NPC's action for one active Pokémon. Scores every move against every
 * foe (spread moves: all foes at 0.75×, minus what they'd do to the partner),
 * values Helping Hand by the partner's best attack, and occasionally protects
 * when low or redirects to shield a weak partner. Usually takes a top pick,
 * with a small chance of a free pick so it isn't perfectly predictable.
 */
export function chooseNpcMove(ctx: NpcContext): NpcChoice {
  const { calc, field, slot, user, moves } = ctx;
  const rng = ctx.rng ?? Math.random;
  const foes = livingFoes(slot, field)
    .map((s) => ({ slot: s, mon: ctx.monAt(s) }))
    .filter((f): f is { slot: Slot; mon: BattlePokemon } => !!f.mon);
  const allySlot = livingAlly(slot, field);
  const ally = allySlot ? ctx.monAt(allySlot) : null;

  const protect = moves.find((m) => PROTECT_MOVES.has(m.showdownId));
  if (protect && ctx.protectStreak === 0 && foes.length && user.currentHp / user.maxHp < 0.4 && rng() < 0.25) {
    return { move: protect, target: null };
  }
  const redirect = moves.find((m) => REDIRECT_MOVES.has(m.showdownId));
  if (redirect && ally && ally.currentHp / ally.maxHp < 0.35 && rng() < 0.35) {
    return { move: redirect, target: null };
  }

  const scored = moves.map((move) => evaluate(move));
  if (!scored.length) throw new Error('NPC has no moves');
  const best = Math.max(...scored.map((x) => x.score));

  if (best <= 0 || rng() < 0.15) {
    const pick = scored[Math.floor(rng() * scored.length)];
    return { move: pick.move, target: pick.target };
  }
  const top = scored.filter((x) => x.score >= best * 0.85);
  const pick = top[Math.floor(rng() * top.length)];
  return { move: pick.move, target: pick.target };

  function evaluate(move: Move): { move: Move; target: Slot | null; score: number } {
    const id = move.showdownId;
    if (PROTECT_MOVES.has(id) || REDIRECT_MOVES.has(id)) return { move, target: null, score: 0 };

    if (id === 'helpinghand') {
      if (!ally) return { move, target: null, score: 0 };
      const allyBest = Math.max(
        0,
        ...ctx.allyMoves.flatMap((am) => foes.map((f) => scoreMove(calc, am, ally, f.mon)))
      );
      return { move, target: null, score: 0.5 * allyBest };
    }

    if (isSpreadMove(move)) {
      if (!foes.length) return { move, target: null, score: 0 };
      const mod = foes.length > 1 || (ally && moveTarget(move) === 'allAdjacent') ? 0.75 : 1;
      let score = foes.reduce((sum, f) => sum + scoreMove(calc, move, user, f.mon) * mod, 0);
      if (ally && moveTarget(move) === 'allAdjacent' && !calc.isStatusMove(move)) {
        score -= scoreMove(calc, move, user, ally) * mod; // friendly fire (0 if the partner is immune)
      }
      return { move, target: null, score };
    }

    const t = moveTarget(move);
    if (t === 'normal' || t === 'any' || t === 'adjacentFoe' || t === 'scripted' || t === 'randomNormal') {
      let bestFoe: { slot: Slot; score: number } | null = null;
      for (const f of foes) {
        const s = scoreMove(calc, move, user, f.mon);
        if (!bestFoe || s > bestFoe.score) bestFoe = { slot: f.slot, score: s };
      }
      return { move, target: bestFoe?.slot ?? null, score: bestFoe?.score ?? 0 };
    }

    // Self / field moves.
    return { move, target: null, score: scoreMove(calc, move, user, foes[0]?.mon ?? user) };
  }
}

/**
 * Index of the healthy reserve with the best matchup against the given foes,
 * or -1 when nobody is left. `excluded` holds party indices already on the
 * field (or already chosen to come in).
 */
export function pickSwitchIn(
  calc: AiCalc,
  team: BattlePokemon[],
  movesets: Move[][],
  foes: BattlePokemon[],
  excluded: ReadonlySet<number>
): number {
  let bestIdx = -1;
  let best = -Infinity;
  for (let i = 0; i < team.length; i++) {
    if (excluded.has(i) || team[i].currentHp <= 0) continue;
    const set = movesets[i] ?? [];
    const score = set.reduce(
      (mx, mv) => Math.max(mx, ...foes.map((f) => scoreMove(calc, mv, team[i], f)), 0),
      0
    );
    if (score > best) {
      best = score;
      bestIdx = i;
    }
  }
  return bestIdx;
}
