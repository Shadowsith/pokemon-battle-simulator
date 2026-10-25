import { MOVE_LIBRARY, Move } from '../../core/models/move.model';
import { chargeMessage, statChangeMessage } from './battle-messages';

const move = (id: string): Move => MOVE_LIBRARY.find((m) => m.showdownId === id)!;

describe('battle messages', () => {
  it('uses the move-specific charge line, else a generic one', () => {
    expect(chargeMessage('Tauboss', move('fly'))).toBe('Tauboss flog empor!');
    const generic = { ...move('fly'), showdownId: 'unknowncharge', name: 'Testattacke' };
    expect(chargeMessage('Tauboss', generic)).toBe('Tauboss lädt Testattacke auf!');
  });

  it('describes stat-stage changes by size and direction', () => {
    expect(statChangeMessage('Glurak', { stat: 'atk', delta: 1, capped: false })).toBe('Gluraks Angriff steigt!');
    expect(statChangeMessage('Glurak', { stat: 'atk', delta: 2, capped: false })).toBe('Gluraks Angriff steigt stark!');
    expect(statChangeMessage('Glurak', { stat: 'def', delta: -3, capped: false })).toBe(
      'Gluraks Verteidigung sinkt extrem!'
    );
    expect(statChangeMessage('Glurak', { stat: 'atk', delta: 1, capped: true })).toBe(
      'Gluraks Angriff kann nicht weiter erhöht werden!'
    );
    expect(statChangeMessage('Glurak', { stat: 'atk', delta: -1, capped: true })).toBe(
      'Gluraks Angriff kann nicht weiter gesenkt werden!'
    );
  });
});
