import { TestBed } from '@angular/core/testing';
import { DamageCalcService } from '../services/damage-calc.service';
import { MOVE_LIBRARY, Move } from '../models/move.model';
import { BattlePokemon, freshBoosts, freshStatus } from '../models/pokemon.model';
import { FieldView, Slot, slotKey } from './battle-format';
import { chooseNpcMove, pickSwitchIn } from './npc-ai';

const move = (id: string): Move => MOVE_LIBRARY.find((m) => m.showdownId === id)!;

function mon(dexId: number, types: string[], hpFrac = 1): BattlePokemon {
  return {
    dexId,
    name: `#${dexId}`,
    maxHp: 300,
    currentHp: Math.round(300 * hpFrac),
    types,
    status: freshStatus(),
    boosts: freshBoosts()
  };
}

const O0: Slot = { side: 'opponent', pos: 0 };
const O1: Slot = { side: 'opponent', pos: 1 };
const P0: Slot = { side: 'player', pos: 0 };
const P1: Slot = { side: 'player', pos: 1 };

describe('NPC AI', () => {
  let calc: DamageCalcService;
  const noRandom = () => 0.5; // never the 15 % free pick, never the defensive rolls

  beforeEach(() => {
    TestBed.configureTestingModule({});
    calc = TestBed.inject(DamageCalcService);
  });

  function ctx(mons: Record<string, BattlePokemon>, format: 'singles' | 'doubles', user: Slot, moves: string[]) {
    const field: FieldView = { format, alive: (s) => (mons[slotKey(s)]?.currentHp ?? 0) > 0 };
    return {
      calc,
      field,
      slot: user,
      user: mons[slotKey(user)],
      moves: moves.map(move),
      monAt: (s: Slot) => mons[slotKey(s)] ?? null,
      allyMoves: [] as Move[],
      protectStreak: 0,
      rng: noRandom
    };
  }

  it('targets the foe its move hits super-effectively', () => {
    const mons = {
      o0: mon(9, ['water']), // Blastoise
      p0: mon(3, ['grass', 'poison']), // Venusaur
      p1: mon(6, ['fire', 'flying']) // Charizard
    };
    const choice = chooseNpcMove(ctx(mons, 'doubles', O0, ['surf', 'hydropump', 'tackle']));
    expect(['surf', 'hydropump']).toContain(choice.move.showdownId);
    if (choice.move.showdownId === 'hydropump') expect(choice.target).toEqual(P1);
  });

  it('avoids Earthquake when it would hit its own partner hard', () => {
    const mons = {
      o0: mon(248, ['rock', 'dark']), // Tyranitar
      o1: mon(6, ['fire'], 1), // a Fire partner that Earthquake hurts
      p0: mon(143, ['normal']),
      p1: mon(143, ['normal'])
    };
    const withAlly = chooseNpcMove(ctx(mons, 'doubles', O0, ['earthquake', 'rockslide']));
    expect(withAlly.move.showdownId).toBe('rockslide');
  });

  it('is happy to Earthquake next to a Flying partner', () => {
    const mons = {
      o0: mon(248, ['rock', 'dark']),
      o1: mon(6, ['fire', 'flying']), // immune to Ground
      p0: mon(135, ['electric']),
      p1: mon(135, ['electric'])
    };
    expect(chooseNpcMove(ctx(mons, 'doubles', O0, ['earthquake', 'rockslide'])).move.showdownId).toBe('earthquake');
  });

  it('picks the best switch-in against the remaining foes', () => {
    const team = [mon(6, ['fire', 'flying'], 0), mon(9, ['water']), mon(3, ['grass', 'poison'])];
    const sets = [[move('flamethrower')], [move('surf')], [move('gigadrain')]];
    expect(pickSwitchIn(calc, team, sets, [mon(76, ['rock', 'ground'])], new Set([0]))).toBe(1);
    expect(pickSwitchIn(calc, team, sets, [mon(76, ['rock', 'ground'])], new Set([0, 1, 2]))).toBe(-1);
  });
});
