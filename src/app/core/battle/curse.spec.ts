import { castsGhostCurse, curseCost, curseDamage } from './curse';

describe('curse', () => {
  it('is the real curse only for Ghost types', () => {
    expect(castsGhostCurse({ types: ['ghost', 'poison'] })).toBeTrue();
    expect(castsGhostCurse({ types: ['normal'] })).toBeFalse();
  });

  it('costs half and drains a quarter of max HP', () => {
    expect(curseCost({ maxHp: 301 })).toBe(150);
    expect(curseDamage({ maxHp: 301 })).toBe(75);
    expect(curseDamage({ maxHp: 3 })).toBe(1);
  });
});
