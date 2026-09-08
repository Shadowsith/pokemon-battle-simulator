import type { NpcTeamOptions } from '../services/npc-team.service';
import { POKEMON_TYPES } from './pokemon.model';
import { MAX_TEAM_SIZE, type TeamPokemon } from './team.model';

/** How the Custom Battle opponent is built. */
export type OpponentMode = 'random' | 'team';

export interface CustomBattleConfig {
  /** 1..6 — number of opponent slots (team mode) / roll size (random mode). */
  opponentCount: number;
  mode: OpponentMode;

  // --- mode === 'team' ---
  /** Hand-built opponent party; same shape the team builder persists. */
  team: TeamPokemon[];

  // --- mode === 'random' ---
  /** Each primary type may appear at most once. */
  forceDistinctTypes: boolean;
  /** Primary types to guarantee (each appears once). [] = any. Capped at opponentCount. */
  distinctTypes: string[];
  /** Every Pokémon shares one primary type. Mutually exclusive with forceDistinctTypes. */
  forceSingleType: boolean;
  /** The wished type when forceSingleType is on; null = pick at random. */
  singleType: string | null;

  /** Fixed NPC avatar sprite id, or null for a random one. */
  avatarId: string | null;
}

export interface SavedCustomBattle {
  id: string;
  name: string;
  config: CustomBattleConfig;
}

export function defaultCustomBattleConfig(): CustomBattleConfig {
  return {
    opponentCount: 3,
    mode: 'random',
    team: [],
    forceDistinctTypes: false,
    distinctTypes: [],
    forceSingleType: false,
    singleType: null,
    avatarId: null
  };
}

/**
 * Normalises a config: clamps `opponentCount` to 1..6, trims `team` and
 * `distinctTypes` to that count, and enforces that the two type modes are
 * mutually exclusive (single type wins).
 */
export function clampConfig(c: CustomBattleConfig): CustomBattleConfig {
  const opponentCount = Math.max(1, Math.min(MAX_TEAM_SIZE, Math.round(c.opponentCount || 1)));
  const forceSingleType = c.forceSingleType;
  const forceDistinctTypes = forceSingleType ? false : c.forceDistinctTypes;
  return {
    ...c,
    opponentCount,
    team: c.team.slice(0, opponentCount),
    forceSingleType,
    forceDistinctTypes,
    distinctTypes: (forceDistinctTypes ? c.distinctTypes : []).slice(0, opponentCount),
    singleType: forceSingleType ? c.singleType : null
  };
}

/**
 * The random-mode constraints as {@link NpcTeamOptions} for
 * NpcTeamService.generate(). When "single type" is on without a chosen type, a
 * random type is picked here (so "Nochmal" re-rolls a fresh mono-type team).
 */
export function configToNpcOptions(c: CustomBattleConfig): NpcTeamOptions {
  if (c.forceSingleType) {
    return { singleType: c.singleType ?? POKEMON_TYPES[Math.floor(Math.random() * POKEMON_TYPES.length)] };
  }
  if (c.forceDistinctTypes) {
    return { distinctPrimaryTypes: true, guaranteedTypes: c.distinctTypes };
  }
  return {};
}
