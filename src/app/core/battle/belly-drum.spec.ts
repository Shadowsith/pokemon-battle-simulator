import { freshBoosts } from '../models/pokemon.model';
import { bellyDrumCost, canBellyDrum } from './belly-drum';

describe('belly drum', () => {
  it('costs half of max HP', () => {
    expect(bellyDrumCost({ maxHp: 301 })).toBe(150);
  });

  it('needs more than half HP and an Attack below +6', () => {
    expect(canBellyDrum({ maxHp: 300, currentHp: 151, boosts: freshBoosts() })).toBeTrue();
    expect(canBellyDrum({ maxHp: 300, currentHp: 150, boosts: freshBoosts() })).toBeFalse();
    expect(canBellyDrum({ maxHp: 300, currentHp: 300, boosts: { ...freshBoosts(), atk: 6 } })).toBeFalse();
  });
});
