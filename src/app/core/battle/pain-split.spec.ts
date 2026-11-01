import { painSplitHp } from './pain-split';

describe('pain-split', () => {
  it('shares the HP total evenly, rounded down', () => {
    expect(painSplitHp({ currentHp: 21, maxHp: 300 }, { currentHp: 200, maxHp: 300 })).toEqual({ user: 110, target: 110 });
  });

  it('caps each side at its own max HP', () => {
    expect(painSplitHp({ currentHp: 50, maxHp: 60 }, { currentHp: 350, maxHp: 400 })).toEqual({ user: 60, target: 200 });
  });
});
