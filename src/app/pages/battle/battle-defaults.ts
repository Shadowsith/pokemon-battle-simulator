import { MOVE_LIBRARY, Move } from '../../core/models/move.model';
import { BattlePokemon, freshBoosts, freshStatus } from '../../core/models/pokemon.model';
import { TeamPokemon, isBattleReady } from '../../core/models/team.model';
import { toBattlePokemon } from '../../core/models/battle-pokemon';

type HpStat = (dexId: number) => number;

/** Used when the player hasn't built a team yet (also the move-animation test bed). */
const PROTOTYPE_TEAM: Pick<BattlePokemon, 'dexId' | 'name' | 'types'>[] = [
  { dexId: 197, name: 'Nachtara', types: ['dark'] },
  { dexId: 149, name: 'Dragoran', types: ['dragon', 'flying'] },
  { dexId: 31, name: 'Nidoqueen', types: ['poison', 'ground'] }
];

/** @pkmn/sim move ids resolved against MOVE_LIBRARY; unknown ids are dropped. */
export function movesByIds(ids: string[]): Move[] {
  return ids
    .map((id) => MOVE_LIBRARY.find((m) => m.showdownId === id))
    .filter((m): m is Move => m !== undefined);
}

/** The player's built team at full health, or the prototype trio when none is battle-ready. */
export function derivePlayerTeam(built: TeamPokemon[], hp: HpStat): BattlePokemon[] {
  if (isBattleReady(built)) return built.map((p) => toBattlePokemon(p, hp));
  return PROTOTYPE_TEAM.map((p) => {
    const maxHp = hp(p.dexId);
    return { ...p, maxHp, currentHp: maxHp, status: freshStatus(), boosts: freshBoosts() };
  });
}

/** A single fallback Pokémon so the field is always valid before the roll lands. */
export function makeGlurak(hp: HpStat): BattlePokemon {
  const maxHp = hp(6);
  return {
    dexId: 6,
    name: 'Glurak',
    maxHp,
    currentHp: maxHp,
    types: ['fire', 'flying'],
    status: freshStatus(),
    boosts: freshBoosts()
  };
}

export function fallbackOpponentMoves(): Move[] {
  return movesByIds(['flamethrower', 'airslash', 'dragonclaw', 'heatwave', 'slash']);
}
