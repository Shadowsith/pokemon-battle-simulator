import type { BattlePokemon } from '../models/pokemon.model';

/**
 * Heal Bell / Aromatherapy (Gen 6): cures the major status (burn, freeze,
 * paralysis, poison, sleep) of every Pokémon in the user's party, benched ones
 * included. Confusion is not a major status and stays.
 */
export const TEAM_CURE_MOVES: ReadonlySet<string> = new Set(['healbell', 'aromatherapy']);

/** The party with every major status cured; `cured` = how many Pokémon were healed. */
export function cureTeamStatus(team: readonly BattlePokemon[]): { team: BattlePokemon[]; cured: number } {
  let cured = 0;
  const out = team.map((p) => {
    if (!p.status.major || p.currentHp <= 0) return p;
    cured++;
    return { ...p, status: { ...p.status, major: null, sleepTurns: 0, toxicTurns: 0 } };
  });
  return { team: out, cured };
}
