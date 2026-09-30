import { Dex } from '@pkmn/sim';
import type { Move } from '../models/move.model';

/**
 * Singles vs. doubles bookkeeping shared by the battle screen and the NPC AI:
 * slot addressing, which Pokémon a move hits (from @pkmn/sim's `target` data),
 * redirection and turn order. Pure functions — no Angular, no DOM.
 */

const MOVEDEX = Dex.forGen(6);

export type BattleFormat = 'singles' | 'doubles';
export type Side = 'player' | 'opponent';
export type SlotPos = 0 | 1;

/** One battle position: a side plus its left (0) / right (1) spot. */
export interface Slot {
  side: Side;
  pos: SlotPos;
}

/** Active positions per side for a format. */
export function positions(format: BattleFormat): SlotPos[] {
  return format === 'doubles' ? [0, 1] : [0];
}

/** Stable key for maps / sets: "p0", "p1", "o0", "o1". */
export function slotKey(s: Slot): string {
  return `${s.side === 'player' ? 'p' : 'o'}${s.pos}`;
}

export function sameSlot(a: Slot | null | undefined, b: Slot | null | undefined): boolean {
  return !!a && !!b && a.side === b.side && a.pos === b.pos;
}

export function otherSide(side: Side): Side {
  return side === 'player' ? 'opponent' : 'player';
}

/** The partner position on the same side (doubles only). */
export function allyOf(s: Slot): Slot {
  return { side: s.side, pos: s.pos === 0 ? 1 : 0 };
}

/** What the targeting rules need to know about the field right now. */
export interface FieldView {
  format: BattleFormat;
  /** True when a non-fainted Pokémon stands in `slot`. */
  alive(slot: Slot): boolean;
}

export function livingSlots(side: Side, field: FieldView): Slot[] {
  return positions(field.format)
    .map((pos) => ({ side, pos }))
    .filter((s) => field.alive(s));
}

export function livingFoes(user: Slot, field: FieldView): Slot[] {
  return livingSlots(otherSide(user.side), field);
}

export function livingAlly(user: Slot, field: FieldView): Slot | null {
  if (field.format !== 'doubles') return null;
  const ally = allyOf(user);
  return field.alive(ally) ? ally : null;
}

/** @pkmn/sim target kind of a move ("normal", "allAdjacent", "self" …). */
export function moveTarget(move: Pick<Move, 'showdownId'>): string {
  return MOVEDEX.moves.get(move.showdownId)?.target ?? 'normal';
}

/** Moves aimed at one Pokémon chosen by the user (or retargeted when it faints). */
const SINGLE_TARGET = new Set(['normal', 'any', 'adjacentFoe', 'scripted']);
/** Moves that hit several Pokémon at once and so take the doubles spread penalty. */
const SPREAD_TARGET = new Set(['allAdjacentFoes', 'allAdjacent']);

export function isSingleTarget(move: Pick<Move, 'showdownId'>): boolean {
  return SINGLE_TARGET.has(moveTarget(move));
}

export function isSpreadMove(move: Pick<Move, 'showdownId'>): boolean {
  return SPREAD_TARGET.has(moveTarget(move));
}

/**
 * How a move's effect is applied:
 * - `targets`: it hits the listed Pokémon (foes, and/or the ally for Surf & co.);
 * - `self`: it only affects the user or the field (Swords Dance, Protect,
 *   Light Screen, Rain Dance, Spikes …) — no accuracy / Protect check.
 */
export type TargetResolution = { kind: 'targets'; targets: Slot[] } | { kind: 'self' };

/** Positions the player may pick for `move` (empty when there's nothing to choose). */
export function targetChoices(move: Pick<Move, 'showdownId'>, user: Slot, field: FieldView): Slot[] {
  const t = moveTarget(move);
  if (t === 'scripted' || !SINGLE_TARGET.has(t)) return [];
  const foes = livingFoes(user, field);
  const ally = t === 'any' ? livingAlly(user, field) : null;
  return ally ? [...foes, ally] : foes;
}

/** True when the player has to pick a target for `move` (doubles, 2+ candidates). */
export function needsTargetChoice(move: Pick<Move, 'showdownId'>, user: Slot, field: FieldView): boolean {
  return field.format === 'doubles' && targetChoices(move, user, field).length > 1;
}

/**
 * Who `move` hits right now. A single-target move whose chosen foe has fainted
 * moves on to the other living foe (Gen 5+); aiming at a fainted partner fails.
 */
export function resolveTargets(
  move: Pick<Move, 'showdownId'>,
  user: Slot,
  chosen: Slot | null,
  field: FieldView,
  rng: () => number = Math.random
): TargetResolution {
  const t = moveTarget(move);
  const foes = livingFoes(user, field);

  switch (t) {
    case 'normal':
    case 'any':
    case 'adjacentFoe':
    case 'scripted': {
      if (chosen && chosen.side === user.side) {
        return { kind: 'targets', targets: field.alive(chosen) && !sameSlot(chosen, user) ? [chosen] : [] };
      }
      if (chosen && field.alive(chosen)) return { kind: 'targets', targets: [chosen] };
      const fallback = foes.find((f) => !chosen || f.pos !== chosen.pos) ?? foes[0];
      return { kind: 'targets', targets: fallback ? [fallback] : [] };
    }
    case 'randomNormal':
      return { kind: 'targets', targets: foes.length ? [foes[Math.floor(rng() * foes.length)]] : [] };
    case 'allAdjacentFoes':
      return { kind: 'targets', targets: foes };
    case 'allAdjacent': {
      const ally = livingAlly(user, field);
      return { kind: 'targets', targets: ally ? [...foes, ally] : foes };
    }
    default:
      // self, allySide, allies, all, foeSide, allyTeam, adjacentAlly(OrSelf):
      // user / field effects. Helping Hand is special-cased by the battle page.
      return { kind: 'self' };
  }
}

/** A Spotlight / Rage Powder user drawing single-target attacks this turn. */
export interface Redirector {
  slot: Slot;
  kind: 'followme' | 'ragepowder';
}

/**
 * Pull a single-target attack on the redirector's side onto the redirector.
 * Rage Powder is a powder move: Grass-type attackers ignore it.
 */
export function applyRedirection(
  targets: Slot[],
  move: Pick<Move, 'showdownId'>,
  user: Slot,
  userTypes: string[],
  redirector: Redirector | null | undefined,
  field: FieldView
): Slot[] {
  if (!redirector || targets.length !== 1 || !isSingleTarget(move)) return targets;
  if (redirector.slot.side === user.side || !field.alive(redirector.slot)) return targets;
  if (targets[0].side !== redirector.slot.side) return targets;
  if (redirector.kind === 'ragepowder' && userTypes.some((t) => t.toLowerCase() === 'grass')) return targets;
  return [redirector.slot];
}

/** Gen 6+ spread modifier: a move that hits more than one target deals 0.75×. */
export function spreadModifier(targetCount: number): number {
  return targetCount > 1 ? 0.75 : 1;
}

/** What {@link orderActions} needs about one queued action. */
export interface OrderableAction {
  kind: 'move' | 'switch';
  priority: number;
  speed: number;
}

/**
 * Turn order: switches first, then higher move priority, then higher Speed;
 * exact ties are broken at random.
 */
export function orderActions<T extends OrderableAction>(actions: T[], rng: () => number = Math.random): T[] {
  return actions
    .map((a) => ({ a, tie: rng() }))
    .sort((x, y) => {
      const sx = x.a.kind === 'switch' ? 1 : 0;
      const sy = y.a.kind === 'switch' ? 1 : 0;
      if (sx !== sy) return sy - sx;
      if (x.a.kind === 'move' && x.a.priority !== y.a.priority) return y.a.priority - x.a.priority;
      if (x.a.speed !== y.a.speed) return y.a.speed - x.a.speed;
      return x.tie - y.tie;
    })
    .map((x) => x.a);
}

// --- Protect family ------------------------------------------------------

/** Single-Pokémon protection moves (consecutive use can fail). */
export const PROTECT_MOVES = new Set(['protect', 'detect', 'kingsshield', 'spikyshield']);
/** Side-wide guards (no consecutive-use penalty since Gen 6). */
export const SIDE_GUARD_MOVES = new Set(['wideguard', 'quickguard']);
export const REDIRECT_MOVES = new Set(['followme', 'ragepowder']);

/** Chance that a protection move works after `streak` successful uses in a row: 1/3ⁿ. */
export function protectSuccessChance(streak: number): number {
  return Math.pow(1 / 3, Math.max(0, streak));
}

/** Whether a protection effect blocks `move` (Protect-flagged moves; King's Shield lets status moves through). */
export function protectBlocks(
  protectMove: string,
  move: Pick<Move, 'showdownId'>
): boolean {
  const md = MOVEDEX.moves.get(move.showdownId);
  if (!md?.exists || !md.flags?.['protect']) return false;
  if (protectMove === 'kingsshield' && md.category === 'Status') return false;
  return true;
}

export function isContactMove(move: Pick<Move, 'showdownId'>): boolean {
  return !!MOVEDEX.moves.get(move.showdownId)?.flags?.['contact'];
}
