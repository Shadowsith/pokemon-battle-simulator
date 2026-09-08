import {
  clampConfig,
  configToNpcOptions,
  defaultCustomBattleConfig
} from './custom-battle.model';

describe('custom-battle.model', () => {
  it('defaults to a 3-Pokémon random fight with no constraints', () => {
    const c = defaultCustomBattleConfig();
    expect(c.opponentCount).toBe(3);
    expect(c.mode).toBe('random');
    expect(configToNpcOptions(c)).toEqual({});
  });

  it('clamps opponentCount to 1..6 and trims team / distinctTypes to it', () => {
    const c = clampConfig({
      ...defaultCustomBattleConfig(),
      opponentCount: 9,
      forceDistinctTypes: true,
      distinctTypes: ['Fire', 'Water', 'Grass', 'Ice', 'Rock', 'Ghost', 'Dark'],
      team: Array.from({ length: 8 }, (_, i) => ({
        speciesNum: i + 1,
        speciesId: `s${i}`,
        name: `S${i}`,
        types: ['Normal'],
        moves: ['tackle']
      }))
    });
    expect(c.opponentCount).toBe(6);
    expect(c.team.length).toBe(6);
    expect(c.distinctTypes.length).toBe(6);

    const low = clampConfig({ ...defaultCustomBattleConfig(), opponentCount: 0 });
    expect(low.opponentCount).toBe(1);
  });

  it('makes the two type modes mutually exclusive (single type wins)', () => {
    const c = clampConfig({
      ...defaultCustomBattleConfig(),
      forceDistinctTypes: true,
      distinctTypes: ['Fire'],
      forceSingleType: true,
      singleType: 'Water'
    });
    expect(c.forceSingleType).toBe(true);
    expect(c.forceDistinctTypes).toBe(false);
    expect(c.distinctTypes).toEqual([]);
    expect(configToNpcOptions(c)).toEqual({ singleType: 'Water' });
  });

  it('maps distinct-type config to guaranteed types', () => {
    const c = clampConfig({
      ...defaultCustomBattleConfig(),
      opponentCount: 4,
      forceDistinctTypes: true,
      distinctTypes: ['Fire', 'Electric']
    });
    expect(configToNpcOptions(c)).toEqual({
      distinctPrimaryTypes: true,
      guaranteedTypes: ['Fire', 'Electric']
    });
  });
});
