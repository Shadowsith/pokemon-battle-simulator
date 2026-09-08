import { TestBed } from '@angular/core/testing';
import { DamageCalcService } from './damage-calc.service';
import { StatusService } from './status.service';
import { MOVE_LIBRARY, Move } from '../models/move.model';
import { BattlePokemon, freshBoosts, freshStatus } from '../models/pokemon.model';

const move = (id: string): Move => MOVE_LIBRARY.find((m) => m.showdownId === id)!;

function mon(dexId: number, patch: Partial<BattlePokemon> = {}): BattlePokemon {
  return {
    dexId,
    name: `#${dexId}`,
    maxHp: 320,
    currentHp: 320,
    types: [],
    status: freshStatus(),
    boosts: freshBoosts(),
    ...patch
  };
}

describe('Gen 8 battle mechanics', () => {
  let calc: DamageCalcService;
  let status: StatusService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    calc = TestBed.inject(DamageCalcService);
    status = TestBed.inject(StatusService);
  });

  it('paralysis halves Speed (Gen 7+), not quarters it', () => {
    const healthy = mon(149); // Dragonite
    const para = mon(149, { status: { ...freshStatus(), major: 'par' } });
    expect(calc.effectiveSpeed(para)).toBeCloseTo(calc.effectiveSpeed(healthy) * 0.5, 5);
  });

  it('flags Hyper Beam & co. as recharge moves', () => {
    expect(calc.needsRecharge(move('hyperbeam'))).toBe(true);
    expect(calc.needsRecharge(move('gigaimpact'))).toBe(true);
    expect(calc.needsRecharge(move('blastburn'))).toBe(true);
    expect(calc.needsRecharge(move('flamethrower'))).toBe(false);
    expect(calc.needsRecharge(move('solarbeam'))).toBe(false); // charge, not recharge
  });

  it('burn chips 1/16 of max HP (Gen 7+)', () => {
    const burned = mon(6, { maxHp: 320, status: { ...freshStatus(), major: 'brn' } });
    expect(status.residual(burned).damage).toBe(20); // 320 / 16
  });

  it('poison still chips 1/8 of max HP', () => {
    const poisoned = mon(6, { maxHp: 320, status: { ...freshStatus(), major: 'psn' } });
    expect(status.residual(poisoned).damage).toBe(40); // 320 / 8
  });
});
