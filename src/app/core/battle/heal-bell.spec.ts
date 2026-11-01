import { BattlePokemon, freshStatus } from '../models/pokemon.model';
import { cureTeamStatus } from './heal-bell';

describe('heal-bell', () => {
  const mon = (major: BattlePokemon['status']['major'], hp = 100, confusionTurns = 0) =>
    ({ currentHp: hp, status: { ...freshStatus(), major, sleepTurns: major === 'slp' ? 2 : 0, confusionTurns } }) as BattlePokemon;

  it('cures every living party member but keeps confusion', () => {
    const { team, cured } = cureTeamStatus([mon('brn'), mon('slp', 100, 3), mon(null)]);
    expect(cured).toBe(2);
    expect(team.map((p) => p.status.major)).toEqual([null, null, null]);
    expect(team[1].status.sleepTurns).toBe(0);
    expect(team[1].status.confusionTurns).toBe(3);
  });

  it('leaves fainted Pokémon alone', () => {
    const { cured } = cureTeamStatus([mon('psn', 0)]);
    expect(cured).toBe(0);
  });
});
