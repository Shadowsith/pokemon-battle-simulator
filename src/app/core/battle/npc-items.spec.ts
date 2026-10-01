import { TestBed } from '@angular/core/testing';
import { MOVE_LIBRARY, Move } from '../models/move.model';
import { heldItem } from '../models/item.model';
import { DamageCalcService } from '../services/damage-calc.service';
import { pickNpcItem } from './npc-items';

const move = (id: string): Move => MOVE_LIBRARY.find((m) => m.showdownId === id)!;

describe('NPC item picks', () => {
  let calc: DamageCalcService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    calc = TestBed.inject(DamageCalcService);
  });

  it('always picks a known item that fits the Pokémon', () => {
    const blastoise = { types: ['Water'], stats: calc.statLine(9), moves: ['surf', 'icebeam', 'earthquake'].map(move) };
    for (let i = 0; i < 20; i++) {
      const id = pickNpcItem(blastoise, new Set());
      expect(heldItem(id)).withContext(String(id)).toBeDefined();
    }
  });

  it('prefers the main STAB type booster / gem when nothing else fits', () => {
    const golduck = { types: ['Water'], stats: calc.statLine(55), moves: ['surf', 'hydropump', 'icebeam'].map(move) };
    const picks = new Set(Array.from({ length: 30 }, () => pickNpcItem(golduck, new Set())));
    expect([...picks].some((id) => id === 'mysticwater' || id === 'watergem')).toBe(true);
  });

  it('never repeats an item already used in the team', () => {
    const mon = { types: ['Electric'], stats: calc.statLine(135), moves: ['thunderbolt', 'shadowball'].map(move) };
    const used = new Set<string>();
    for (let i = 0; i < 6; i++) {
      const id = pickNpcItem(mon, used);
      expect(id).not.toBeNull();
      expect(used.has(id!)).toBe(false);
      used.add(id!);
    }
  });
});
