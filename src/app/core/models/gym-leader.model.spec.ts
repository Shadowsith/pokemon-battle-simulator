import { GYM_REGIONS, gymRegion } from './gym-leader.model';
import { MOVE_LIBRARY } from './move.model';

describe('gym-leader.model', () => {
  const kanto = gymRegion('kanto')!;

  it('runs the 8 Kanto gym leaders of the PWT Kanto tournament in canonical order', () => {
    expect(kanto.available).toBe(true);
    expect(kanto.members.map((m) => m.name)).toEqual([
      'Rocko', 'Misty', 'Major Bob', 'Erika', 'Janina', 'Sabrina', 'Pyro', 'Giovanni'
    ]);
    expect(kanto.members.map((m) => m.badge)).toEqual([
      'Felsorden', 'Quellorden', 'Donnerorden', 'Farborden',
      'Seelenorden', 'Sumpforden', 'Vulkanorden', 'Erdorden'
    ]);
  });

  it('gives every leader six Pokémon with four known moves', () => {
    const known = new Set(MOVE_LIBRARY.map((m) => m.showdownId));
    for (const leader of kanto.members) {
      expect(leader.team.length).withContext(leader.name).toBe(6);
      for (const mon of leader.team) {
        expect(mon.moves.length).withContext(`${leader.name} ${mon.name}`).toBe(4);
        expect(mon.moves.filter((id) => !known.has(id))).withContext(`${leader.name} ${mon.name}`).toEqual([]);
      }
    }
  });

  it('uses trainer sprites that ship with the app', () => {
    expect(kanto.members.map((m) => m.trainerId)).toEqual([
      'brock-gen3', 'misty-gen3', 'ltsurge-gen3', 'erika-gen3',
      'janine', 'sabrina-gen3', 'blaine-gen3', 'giovanni-gen3'
    ]);
  });

  it('lists the other regions as not yet playable', () => {
    expect(GYM_REGIONS.filter((r) => r.id !== 'kanto').every((r) => !r.available && !r.members.length)).toBe(true);
  });
});
