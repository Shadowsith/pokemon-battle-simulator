import type { BattleFormat } from '../battle/battle-format';
import { isSceneId, type SceneId } from '../battle/battle-background';
import type { NpcTeamOptions } from '../services/npc-team.service';
import { POKEMON_TYPES } from './pokemon.model';
import { MAX_TEAM_SIZE, type TeamPokemon } from './team.model';

/** How the Custom Battle opponent is built. */
export type OpponentMode = 'random' | 'team';

/**
 * Rules for rolling random NPC opponents, shared by Custom Battle (random mode)
 * and the tournament.
 */
export interface RandomOpponentRules {
  /** Singles or doubles (2 vs 2). Doubles needs at least 2 opponents. */
  format: BattleFormat;
  /** 1..6 — number of opponent Pokémon. */
  opponentCount: number;
  /** Each primary type may appear at most once. */
  forceDistinctTypes: boolean;
  /** Primary types to guarantee (each appears once). [] = any. Capped at opponentCount. */
  distinctTypes: string[];
  /** Every Pokémon shares one primary type. Mutually exclusive with forceDistinctTypes. */
  forceSingleType: boolean;
  /** The wished type when forceSingleType is on; null = pick at random. */
  singleType: string | null;
  /** Battle field scene, or 'random' for a random outdoor scene. */
  background: SceneId | 'random';
}

export interface CustomBattleConfig extends RandomOpponentRules {
  mode: OpponentMode;
  /** mode === 'team': hand-built opponent party; same shape the team builder persists. */
  team: TeamPokemon[];
  /** Fixed NPC avatar sprite id, or null for a random one. */
  avatarId: string | null;
}

export interface SavedCustomBattle {
  id: string;
  name: string;
  config: CustomBattleConfig;
}

export function defaultOpponentRules(): RandomOpponentRules {
  return {
    format: 'singles',
    opponentCount: 3,
    forceDistinctTypes: false,
    distinctTypes: [],
    forceSingleType: false,
    singleType: null,
    background: 'random'
  };
}

export function defaultCustomBattleConfig(): CustomBattleConfig {
  return { ...defaultOpponentRules(), mode: 'random', team: [], avatarId: null };
}

/**
 * Normalises opponent rules: clamps `opponentCount` to 1..6 (2..6 for doubles),
 * trims `distinctTypes` to that count, and enforces that the two type modes are
 * mutually exclusive (single type wins).
 */
export function clampRules<R extends RandomOpponentRules>(c: R): R {
  const format: BattleFormat = c.format === 'doubles' ? 'doubles' : 'singles';
  const minCount = format === 'doubles' ? 2 : 1;
  const opponentCount = Math.max(minCount, Math.min(MAX_TEAM_SIZE, Math.round(c.opponentCount || 1)));
  const forceSingleType = c.forceSingleType;
  const forceDistinctTypes = forceSingleType ? false : c.forceDistinctTypes;
  return {
    ...c,
    format,
    opponentCount,
    forceSingleType,
    forceDistinctTypes,
    distinctTypes: (forceDistinctTypes ? c.distinctTypes : []).slice(0, opponentCount),
    singleType: forceSingleType ? c.singleType : null
  };
}

/** {@link clampRules} plus trimming the hand-built `team` to `opponentCount`. */
export function clampConfig(c: CustomBattleConfig): CustomBattleConfig {
  const rules = clampRules(c);
  return { ...rules, team: c.team.slice(0, rules.opponentCount) };
}

/**
 * The random-roll rules as {@link NpcTeamOptions} for NpcTeamService.generate().
 * When "single type" is on without a chosen type, a random type is picked here
 * (so every roll gets a fresh mono-type team).
 */
export function rulesToNpcOptions(c: RandomOpponentRules): NpcTeamOptions {
  if (c.forceSingleType) {
    return { singleType: c.singleType ?? POKEMON_TYPES[Math.floor(Math.random() * POKEMON_TYPES.length)] };
  }
  if (c.forceDistinctTypes) {
    return { distinctPrimaryTypes: true, guaranteedTypes: c.distinctTypes };
  }
  return {};
}

/** Reads opponent rules from untrusted (stored) data; unknown fields fall back to defaults. */
export function sanitizeRules(c: Record<string, unknown>): RandomOpponentRules {
  const base = defaultOpponentRules();
  return clampRules({
    format: c['format'] === 'doubles' ? 'doubles' : 'singles',
    opponentCount: typeof c['opponentCount'] === 'number' ? c['opponentCount'] : base.opponentCount,
    forceDistinctTypes: c['forceDistinctTypes'] === true,
    distinctTypes: Array.isArray(c['distinctTypes'])
      ? (c['distinctTypes'] as unknown[]).filter((t): t is string => typeof t === 'string')
      : [],
    forceSingleType: c['forceSingleType'] === true,
    singleType: typeof c['singleType'] === 'string' ? c['singleType'] : null,
    background: isSceneId(c['background']) ? c['background'] : 'random'
  });
}
