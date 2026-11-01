import { MOVE_LIBRARY } from '../models/move.model';
import { isFutureMove } from './future-sight';

describe('future-sight', () => {
  const move = (id: string) => MOVE_LIBRARY.find((m) => m.showdownId === id)!;

  it('flags Future Sight and Doom Desire as delayed attacks', () => {
    expect(isFutureMove(move('futuresight'))).toBeTrue();
    expect(isFutureMove(move('doomdesire'))).toBeTrue();
    expect(isFutureMove(move('psychic'))).toBeFalse();
  });
});
