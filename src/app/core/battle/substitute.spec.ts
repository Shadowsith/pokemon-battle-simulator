import { bypassesSubstitute, canAffordSubstitute, hitSubstitute, substituteCost } from './substitute';

describe('substitute', () => {
  it('costs a quarter of max HP, rounded down', () => {
    expect(substituteCost({ maxHp: 364 })).toBe(91);
    expect(substituteCost({ maxHp: 3 })).toBe(0);
  });

  it('needs more HP than it costs', () => {
    expect(canAffordSubstitute({ maxHp: 400, currentHp: 101 })).toBeTrue();
    expect(canAffordSubstitute({ maxHp: 400, currentHp: 100 })).toBeFalse();
    expect(canAffordSubstitute({ maxHp: 3, currentHp: 3 })).toBeFalse();
  });

  it('lets sound moves through, but not normal attacks', () => {
    expect(bypassesSubstitute({ showdownId: 'hypervoice' })).toBeTrue();
    expect(bypassesSubstitute({ showdownId: 'tackle' })).toBeFalse();
    expect(bypassesSubstitute({ showdownId: 'thunderwave' })).toBeFalse();
  });

  it('soaks up damage up to its HP', () => {
    expect(hitSubstitute(90, 40)).toEqual({ absorbed: 40, left: 50 });
    expect(hitSubstitute(90, 200)).toEqual({ absorbed: 90, left: 0 });
    expect(hitSubstitute(90, 0)).toEqual({ absorbed: 0, left: 90 });
  });
});
