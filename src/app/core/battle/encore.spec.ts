import { canEncore } from './encore';

describe('encore', () => {
  it('needs a last move that can be encored', () => {
    expect(canEncore('tackle', false)).toBeTrue();
    expect(canEncore(undefined, false)).toBeFalse();
    expect(canEncore('encore', false)).toBeFalse();
    expect(canEncore('transform', false)).toBeFalse();
  });

  it('fails on an already encored Pokémon', () => {
    expect(canEncore('tackle', true)).toBeFalse();
  });
});
