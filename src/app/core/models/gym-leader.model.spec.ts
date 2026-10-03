import { GYM_REGIONS, gymRegion } from './gym-leader.model';
import { MOVE_LIBRARY } from './move.model';
import { heldItem } from './item.model';

describe('gym-leader.model', () => {
  const kanto = gymRegion('kanto')!;
  const johto = gymRegion('johto')!;
  const hoenn = gymRegion('hoenn')!;
  const available = GYM_REGIONS.filter((r) => r.available);

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
    for (const leader of available.flatMap((r) => r.members)) {
      expect(leader.team.length).withContext(leader.name).toBe(6);
      for (const mon of leader.team) {
        expect(mon.moves.length).withContext(`${leader.name} ${mon.name}`).toBe(4);
        expect(mon.moves.filter((id) => !known.has(id))).withContext(`${leader.name} ${mon.name}`).toEqual([]);
      }
    }
  });

  it('gives every gym Pokémon its PWT held item', () => {
    for (const leader of kanto.members) {
      for (const mon of leader.team) {
        expect(heldItem(mon.item)).withContext(`${leader.name} ${mon.name} ${mon.item}`).toBeDefined();
      }
    }
    expect(kanto.members[0].team.map((m) => m.item)).toEqual([
      'salacberry', 'darkgem', 'liechiberry', 'rindoberry', 'chartiberry', 'rockgem'
    ]);
  });

  it('uses trainer sprites that ship with the app', () => {
    expect(kanto.members.map((m) => m.trainerId)).toEqual([
      'brock-gen3', 'misty-gen3', 'ltsurge-gen3', 'erika-gen3',
      'janine', 'sabrina-gen3', 'blaine-gen3', 'giovanni-gen3'
    ]);
  });

  it('runs the 8 Johto gym leaders with their HGSS Kampf-Dojo teams in canonical order', () => {
    expect(johto.available).toBe(true);
    expect(johto.members.map((m) => m.name)).toEqual([
      'Falk', 'Kai', 'Bianka', 'Jens', 'Hartwig', 'Jasmin', 'Norbert', 'Sandra'
    ]);
    expect(johto.members.map((m) => m.badge)).toEqual([
      'Flügelorden', 'Insektorden', 'Basisorden', 'Phantomorden',
      'Faustorden', 'Stahlorden', 'Eisorden', 'Drachenorden'
    ]);
    expect(johto.members.map((m) => m.trainerId)).toEqual([
      'falkner', 'bugsy', 'whitney', 'morty', 'chuck', 'jasmine', 'pryce', 'clair'
    ]);
  });

  it('gives Johto Pokémon only the items they hold in the Dojo', () => {
    for (const leader of johto.members) {
      for (const mon of leader.team.filter((m) => m.item)) {
        expect(heldItem(mon.item)).withContext(`${leader.name} ${mon.name} ${mon.item}`).toBeDefined();
      }
    }
    expect(johto.members[0].team.map((m) => m.item)).toEqual([
      'sitrusberry', undefined, undefined, undefined, undefined, undefined
    ]);
    expect(johto.members[2].team[5].item).withContext('Bianka Miltank (Prunusbeere)').toBe('lumberry');
  });

  it('runs the Hoenn gym leaders of the PWT Hoenn tournament in canonical order', () => {
    expect(hoenn.available).toBe(true);
    expect(hoenn.members.map((m) => m.name)).toEqual([
      'Felizia', 'Kamillo', 'Walter', 'Flavia', 'Norman', 'Wibke', 'Ben', 'Svenja', 'Juan'
    ]);
    expect(hoenn.members.map((m) => m.badge)).toEqual([
      'Steinorden', 'Knöchelorden', 'Dynamo-Orden', 'Hitzeorden', 'Balanceorden',
      'Federorden', 'Mentalorden', 'Mentalorden', 'Schauerorden'
    ]);
    expect(hoenn.members.map((m) => m.trainerId)).toEqual([
      'roxanne-gen3', 'brawly-gen3', 'wattson-gen3', 'flannery-gen3', 'norman-gen3',
      'winona-gen3', 'tateandliza-gen3', 'tateandliza-gen3', 'juan-gen3'
    ]);
  });

  it('has Ben share the Mentalorden with Svenja, so Hoenn still awards 8 badges', () => {
    expect(hoenn.members.filter((m) => m.sharedBadge).map((m) => m.name)).toEqual(['Ben']);
    expect(hoenn.members.filter((m) => !m.sharedBadge).length).toBe(8);
  });

  it('gives every Hoenn Pokémon its PWT held item', () => {
    for (const leader of hoenn.members) {
      for (const mon of leader.team) {
        expect(heldItem(mon.item)).withContext(`${leader.name} ${mon.name} ${mon.item}`).toBeDefined();
      }
    }
    expect(hoenn.members[0].team.map((m) => m.item)).toEqual([
      'shucaberry', 'liechiberry', 'sitrusberry', 'chopleberry', 'rindoberry', 'salacberry'
    ]);
  });

  it('lists the other regions as not yet playable', () => {
    expect(GYM_REGIONS.filter((r) => !['kanto', 'johto', 'hoenn'].includes(r.id)).every((r) => !r.available && !r.members.length)).toBe(true);
  });
});
