import { Dex } from '@pkmn/sim';
import { Move } from '../../models/move.model';
import { MoveVisualBuilder } from './move-visual.builder';
import { CUSTOM_CHARGE_ANIMATIONS, CUSTOM_MOVE_ANIMATIONS, MOVE_ANIMATION_GROUPS } from './moves';

function moveFor(id: string): Move {
  const d = Dex.moves.get(id);
  return { showdownId: id, name: d.name, type: d.type, color: '#ffffff' } as Move;
}

describe('move animation registry', () => {
  it('registers every move id in exactly one type group', () => {
    const seen = new Map<string, number>();
    for (const group of MOVE_ANIMATION_GROUPS) {
      for (const id of Object.keys(group.anims)) seen.set(id, (seen.get(id) ?? 0) + 1);
    }
    const duplicates = [...seen].filter(([, n]) => n > 1).map(([id]) => id);
    expect(duplicates).toEqual([]);
    expect(Object.keys(CUSTOM_MOVE_ANIMATIONS).length).toBe(seen.size);
  });

  it('only uses real @pkmn/sim move ids', () => {
    const unknown = Object.keys(CUSTOM_MOVE_ANIMATIONS).filter((id) => !Dex.moves.get(id).exists);
    expect(unknown).toEqual([]);
  });

  it('only registers turn-1 animations for real two-turn moves', () => {
    const wrong = Object.keys(CUSTOM_CHARGE_ANIMATIONS).filter((id) => !Dex.moves.get(id).flags.charge);
    expect(wrong).toEqual([]);
    expect(Object.keys(CUSTOM_CHARGE_ANIMATIONS)).toEqual(jasmine.arrayContaining(['dig', 'fly', 'razorwind']));
  });
});

describe('MoveVisualBuilder', () => {
  it('derives a status-inflicting target aura (Thunder Wave)', () => {
    const v = MoveVisualBuilder.build(moveFor('thunderwave'));
    expect(v.delivery).toBe('targetAura');
    expect(v.fleck).toBe('paralyze');
  });

  it('derives a multi-hit lob (Bullet Seed)', () => {
    const v = MoveVisualBuilder.build(moveFor('bulletseed'));
    expect(v.delivery).toBe('lob');
    expect(v.hits).toBe(3);
  });

  it('derives weather (Sunny Day)', () => {
    const v = MoveVisualBuilder.build(moveFor('sunnyday'));
    expect(v.delivery).toBe('weather');
    expect(v.weather).toBe('sun');
  });
});
