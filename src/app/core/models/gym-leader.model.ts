import type { GymLeader, RunRegion } from './trainer-run.model';

/**
 * Arenaleiter rosters for the "Arenaleiter-Herausforderung" run mode. One region
 * per generation; only Kanto is authored so far.
 *
 * Kanto uses the first Schwarz 2 / Weiß 2 team of each leader — the PWT
 * "Kanto-Arenaleiterturnier" (source: pokewiki.de, each leader's page). That
 * tournament fields Janina (not Koga) for Fuchsania City and Giovanni for
 * Vertania City. Six Pokémon each; held items and abilities aren't modelled.
 */
const KANTO: RunRegion<GymLeader> = {
  id: 'kanto',
  gen: 1,
  label: 'Kanto (Gen 1)',
  available: true,
  members: [
    {
      trainerId: 'brock-gen3',
      name: 'Rocko',
      title: 'Arenaleiter von Marmoria City',
      badge: 'Felsorden',
      type: 'Rock',
      team: [
        {
          speciesNum: 95, speciesId: 'onix', name: 'Onix', types: ['Rock', 'Ground'],
          moves: ['sandtomb', 'protect', 'stealthrock', 'sandstorm']
        },
        {
          speciesNum: 76, speciesId: 'golem', name: 'Geowaz', types: ['Rock', 'Ground'],
          moves: ['stoneedge', 'earthquake', 'suckerpunch', 'irondefense']
        },
        {
          speciesNum: 141, speciesId: 'kabutops', name: 'Kabutops', types: ['Rock', 'Water'],
          moves: ['stoneedge', 'aquajet', 'superpower', 'swordsdance']
        },
        {
          speciesNum: 139, speciesId: 'omastar', name: 'Amoroso', types: ['Rock', 'Water'],
          moves: ['hydropump', 'ancientpower', 'earthpower', 'icebeam']
        },
        {
          speciesNum: 142, speciesId: 'aerodactyl', name: 'Aerodactyl', types: ['Rock', 'Flying'],
          moves: ['rockslide', 'earthquake', 'thunderfang', 'tailwind']
        },
        {
          speciesNum: 369, speciesId: 'relicanth', name: 'Relicanth', types: ['Water', 'Rock'],
          moves: ['rockslide', 'waterfall', 'rockpolish', 'yawn']
        }
      ]
    },
    {
      trainerId: 'misty-gen3',
      name: 'Misty',
      title: 'Arenaleiterin von Azuria City',
      badge: 'Quellorden',
      type: 'Water',
      team: [
        {
          speciesNum: 121, speciesId: 'starmie', name: 'Starmie', types: ['Water', 'Psychic'],
          moves: ['hydropump', 'psychic', 'thunderbolt', 'icebeam']
        },
        {
          speciesNum: 55, speciesId: 'golduck', name: 'Entoron', types: ['Water'],
          moves: ['aquajet', 'blizzard', 'focusblast', 'honeclaws']
        },
        {
          speciesNum: 119, speciesId: 'seaking', name: 'Golking', types: ['Water'],
          moves: ['waterfall', 'megahorn', 'poisonjab', 'agility']
        },
        {
          speciesNum: 131, speciesId: 'lapras', name: 'Lapras', types: ['Water', 'Ice'],
          moves: ['hydropump', 'icebeam', 'thunderbolt', 'confuseray']
        },
        {
          speciesNum: 80, speciesId: 'slowbro', name: 'Lahmus', types: ['Water', 'Psychic'],
          moves: ['scald', 'psyshock', 'slackoff', 'yawn']
        },
        {
          speciesNum: 9, speciesId: 'blastoise', name: 'Turtok', types: ['Water'],
          moves: ['hydropump', 'irontail', 'avalanche', 'irondefense']
        }
      ]
    },
    {
      trainerId: 'ltsurge-gen3',
      name: 'Major Bob',
      title: 'Arenaleiter von Orania City',
      badge: 'Donnerorden',
      type: 'Electric',
      team: [
        {
          speciesNum: 26, speciesId: 'raichu', name: 'Raichu', types: ['Electric'],
          moves: ['thunderbolt', 'focusblast', 'signalbeam', 'thunderwave']
        },
        {
          speciesNum: 101, speciesId: 'electrode', name: 'Lektrobal', types: ['Electric'],
          moves: ['raindance', 'thunder', 'mirrorcoat', 'magnetrise']
        },
        {
          speciesNum: 462, speciesId: 'magnezone', name: 'Magnezone', types: ['Electric', 'Steel'],
          moves: ['discharge', 'flashcannon', 'signalbeam', 'barrier']
        },
        {
          speciesNum: 466, speciesId: 'electivire', name: 'Elevoltek', types: ['Electric'],
          moves: ['wildcharge', 'lowkick', 'rocktomb', 'firepunch']
        },
        {
          speciesNum: 135, speciesId: 'jolteon', name: 'Blitza', types: ['Electric'],
          moves: ['thunder', 'shadowball', 'signalbeam', 'raindance']
        },
        {
          speciesNum: 181, speciesId: 'ampharos', name: 'Ampharos', types: ['Electric'],
          moves: ['discharge', 'powergem', 'charge', 'cottonguard']
        }
      ]
    },
    {
      trainerId: 'erika-gen3',
      name: 'Erika',
      title: 'Arenaleiterin von Prismania City',
      badge: 'Farborden',
      type: 'Grass',
      team: [
        {
          speciesNum: 45, speciesId: 'vileplume', name: 'Giflor', types: ['Grass', 'Poison'],
          moves: ['petaldance', 'sleeppowder', 'moonlight', 'sunnyday']
        },
        {
          speciesNum: 3, speciesId: 'venusaur', name: 'Bisaflor', types: ['Grass', 'Poison'],
          moves: ['petaldance', 'toxic', 'lightscreen', 'synthesis']
        },
        {
          speciesNum: 71, speciesId: 'victreebel', name: 'Sarzenia', types: ['Grass', 'Poison'],
          moves: ['leafblade', 'suckerpunch', 'swordsdance', 'reflect']
        },
        {
          speciesNum: 103, speciesId: 'exeggutor', name: 'Kokowei', types: ['Grass', 'Psychic'],
          moves: ['solarbeam', 'psyshock', 'hypnosis', 'sunnyday']
        },
        {
          speciesNum: 465, speciesId: 'tangrowth', name: 'Tangoloss', types: ['Grass'],
          moves: ['powerwhip', 'earthquake', 'rockslide', 'swordsdance']
        },
        {
          speciesNum: 182, speciesId: 'bellossom', name: 'Blubella', types: ['Grass'],
          moves: ['leafblade', 'drainpunch', 'swordsdance', 'sunnyday']
        }
      ]
    },
    {
      trainerId: 'janine',
      name: 'Janina',
      title: 'Arenaleiterin von Fuchsania City',
      badge: 'Seelenorden',
      type: 'Poison',
      team: [
        {
          speciesNum: 49, speciesId: 'venomoth', name: 'Omot', types: ['Bug', 'Poison'],
          moves: ['sludgebomb', 'bugbuzz', 'gigadrain', 'quiverdance']
        },
        {
          speciesNum: 110, speciesId: 'weezing', name: 'Smogmog', types: ['Poison'],
          moves: ['sludgebomb', 'fireblast', 'shadowball', 'painsplit']
        },
        {
          speciesNum: 168, speciesId: 'ariados', name: 'Ariados', types: ['Bug', 'Poison'],
          moves: ['poisonjab', 'strugglebug', 'electroweb', 'suckerpunch']
        },
        {
          speciesNum: 169, speciesId: 'crobat', name: 'Iksbat', types: ['Poison', 'Flying'],
          moves: ['toxic', 'superfang', 'heatwave', 'tailwind']
        },
        {
          speciesNum: 24, speciesId: 'arbok', name: 'Arbok', types: ['Poison'],
          moves: ['gunkshot', 'suckerpunch', 'coil', 'dragontail']
        },
        {
          speciesNum: 73, speciesId: 'tentacruel', name: 'Tentoxa', types: ['Water', 'Poison'],
          moves: ['toxicspikes', 'scald', 'gigadrain', 'barrier']
        }
      ]
    },
    {
      trainerId: 'sabrina-gen3',
      name: 'Sabrina',
      title: 'Arenaleiterin von Saffronia City',
      badge: 'Sumpforden',
      type: 'Psychic',
      team: [
        {
          speciesNum: 65, speciesId: 'alakazam', name: 'Simsala', types: ['Psychic'],
          moves: ['psyshock', 'shadowball', 'focusblast', 'chargebeam']
        },
        {
          speciesNum: 97, speciesId: 'hypno', name: 'Hypno', types: ['Psychic'],
          moves: ['dreameater', 'shadowball', 'hypnosis', 'calmmind']
        },
        {
          speciesNum: 122, speciesId: 'mrmime', name: 'Pantimos', types: ['Psychic', 'Fairy'],
          moves: ['psychic', 'chargebeam', 'lightscreen', 'reflect']
        },
        {
          speciesNum: 199, speciesId: 'slowking', name: 'Laschoking', types: ['Water', 'Psychic'],
          moves: ['psyshock', 'icebeam', 'slackoff', 'calmmind']
        },
        {
          speciesNum: 196, speciesId: 'espeon', name: 'Psiana', types: ['Psychic'],
          moves: ['psyshock', 'shadowball', 'yawn', 'reflect']
        },
        {
          speciesNum: 124, speciesId: 'jynx', name: 'Rossana', types: ['Ice', 'Psychic'],
          moves: ['dreameater', 'frostbreath', 'energyball', 'lovelykiss']
        }
      ]
    },
    {
      trainerId: 'blaine-gen3',
      name: 'Pyro',
      title: 'Arenaleiter der Zinnoberinsel',
      badge: 'Vulkanorden',
      type: 'Fire',
      team: [
        {
          speciesNum: 59, speciesId: 'arcanine', name: 'Arkani', types: ['Fire'],
          moves: ['flareblitz', 'wildcharge', 'closecombat', 'extremespeed']
        },
        {
          speciesNum: 38, speciesId: 'ninetales', name: 'Vulnona', types: ['Fire'],
          moves: ['heatwave', 'energyball', 'hypnosis', 'nastyplot']
        },
        {
          speciesNum: 6, speciesId: 'charizard', name: 'Glurak', types: ['Fire', 'Flying'],
          moves: ['inferno', 'dragonrush', 'focusblast', 'honeclaws']
        },
        {
          speciesNum: 467, speciesId: 'magmortar', name: 'Magbrant', types: ['Fire'],
          moves: ['fireblast', 'psychic', 'thunderbolt', 'focusblast']
        },
        {
          speciesNum: 136, speciesId: 'flareon', name: 'Flamara', types: ['Fire'],
          moves: ['flamecharge', 'superpower', 'flail', 'yawn']
        },
        {
          speciesNum: 78, speciesId: 'rapidash', name: 'Gallopa', types: ['Fire'],
          moves: ['flareblitz', 'megahorn', 'wildcharge', 'hypnosis']
        }
      ]
    },
    {
      trainerId: 'giovanni-gen3',
      name: 'Giovanni',
      title: 'Arenaleiter von Vertania City',
      badge: 'Erdorden',
      type: 'Ground',
      team: [
        {
          speciesNum: 464, speciesId: 'rhyperior', name: 'Rihornior', types: ['Ground', 'Rock'],
          moves: ['drillrun', 'stoneedge', 'megahorn', 'hammerarm']
        },
        {
          speciesNum: 76, speciesId: 'golem', name: 'Geowaz', types: ['Rock', 'Ground'],
          moves: ['earthquake', 'stealthrock', 'rockblast', 'roar']
        },
        {
          speciesNum: 105, speciesId: 'marowak', name: 'Knogga', types: ['Ground'],
          moves: ['bonemerang', 'stoneedge', 'outrage', 'thunderpunch']
        },
        {
          speciesNum: 28, speciesId: 'sandslash', name: 'Sandamer', types: ['Ground'],
          moves: ['earthquake', 'rockslide', 'brickbreak', 'sandstorm']
        },
        {
          speciesNum: 34, speciesId: 'nidoking', name: 'Nidoking', types: ['Poison', 'Ground'],
          moves: ['earthpower', 'sludgewave', 'megahorn', 'blizzard']
        },
        {
          speciesNum: 31, speciesId: 'nidoqueen', name: 'Nidoqueen', types: ['Poison', 'Ground'],
          moves: ['earthpower', 'poisonjab', 'superpower', 'thunder']
        }
      ]
    }
  ]
};

/** A region whose gym leaders aren't authored yet: listed, but not playable. */
function upcoming(id: string, gen: number, label: string): RunRegion<GymLeader> {
  return { id, gen, label, available: false, members: [] };
}

export const GYM_REGIONS: RunRegion<GymLeader>[] = [
  KANTO,
  upcoming('johto', 2, 'Johto (Gen 2)'),
  upcoming('hoenn', 3, 'Hoenn (Gen 3)'),
  upcoming('sinnoh', 4, 'Sinnoh (Gen 4)'),
  upcoming('einall', 5, 'Einall (Gen 5)'),
  upcoming('kalos', 6, 'Kalos (Gen 6)')
];

export function gymRegion(id: string): RunRegion<GymLeader> | undefined {
  return GYM_REGIONS.find((r) => r.id === id);
}
