import type { GymLeader, RunRegion } from './trainer-run.model';

/**
 * Arenaleiter rosters for the "Arenaleiter-Herausforderung" run mode. One region
 * per generation; only Kanto is authored so far.
 *
 * Kanto uses the first Schwarz 2 / Weiß 2 team of each leader — the PWT
 * "Kanto-Arenaleiterturnier" (source: pokewiki.de, each leader's page). That
 * tournament fields Janina (not Koga) for Fuchsania City and Giovanni for
 * Vertania City. Six Pokémon each, holding their PWT items; abilities aren't modelled.
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
          moves: ['sandtomb', 'protect', 'stealthrock', 'sandstorm'],
          item: 'salacberry'
        },
        {
          speciesNum: 76, speciesId: 'golem', name: 'Geowaz', types: ['Rock', 'Ground'],
          moves: ['stoneedge', 'earthquake', 'suckerpunch', 'irondefense'],
          item: 'darkgem'
        },
        {
          speciesNum: 141, speciesId: 'kabutops', name: 'Kabutops', types: ['Rock', 'Water'],
          moves: ['stoneedge', 'aquajet', 'superpower', 'swordsdance'],
          item: 'liechiberry'
        },
        {
          speciesNum: 139, speciesId: 'omastar', name: 'Amoroso', types: ['Rock', 'Water'],
          moves: ['hydropump', 'ancientpower', 'earthpower', 'icebeam'],
          item: 'rindoberry'
        },
        {
          speciesNum: 142, speciesId: 'aerodactyl', name: 'Aerodactyl', types: ['Rock', 'Flying'],
          moves: ['rockslide', 'earthquake', 'thunderfang', 'tailwind'],
          item: 'chartiberry'
        },
        {
          speciesNum: 369, speciesId: 'relicanth', name: 'Relicanth', types: ['Water', 'Rock'],
          moves: ['rockslide', 'waterfall', 'rockpolish', 'yawn'],
          item: 'rockgem'
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
          moves: ['hydropump', 'psychic', 'thunderbolt', 'icebeam'],
          item: 'petayaberry'
        },
        {
          speciesNum: 55, speciesId: 'golduck', name: 'Entoron', types: ['Water'],
          moves: ['aquajet', 'blizzard', 'focusblast', 'honeclaws'],
          item: 'watergem'
        },
        {
          speciesNum: 119, speciesId: 'seaking', name: 'Golking', types: ['Water'],
          moves: ['waterfall', 'megahorn', 'poisonjab', 'agility'],
          item: 'wacanberry'
        },
        {
          speciesNum: 131, speciesId: 'lapras', name: 'Lapras', types: ['Water', 'Ice'],
          moves: ['hydropump', 'icebeam', 'thunderbolt', 'confuseray'],
          item: 'ganlonberry'
        },
        {
          speciesNum: 80, speciesId: 'slowbro', name: 'Lahmus', types: ['Water', 'Psychic'],
          moves: ['scald', 'psyshock', 'slackoff', 'yawn'],
          item: 'apicotberry'
        },
        {
          speciesNum: 9, speciesId: 'blastoise', name: 'Turtok', types: ['Water'],
          moves: ['hydropump', 'irontail', 'avalanche', 'irondefense'],
          item: 'salacberry'
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
          moves: ['thunderbolt', 'focusblast', 'signalbeam', 'thunderwave'],
          item: 'electricgem'
        },
        {
          speciesNum: 101, speciesId: 'electrode', name: 'Lektrobal', types: ['Electric'],
          moves: ['raindance', 'thunder', 'mirrorcoat', 'magnetrise'],
          item: 'lumberry'
        },
        {
          speciesNum: 462, speciesId: 'magnezone', name: 'Magnezone', types: ['Electric', 'Steel'],
          moves: ['discharge', 'flashcannon', 'signalbeam', 'barrier'],
          item: 'airballoon'
        },
        {
          speciesNum: 466, speciesId: 'electivire', name: 'Elevoltek', types: ['Electric'],
          moves: ['wildcharge', 'lowkick', 'rocktomb', 'firepunch'],
          item: 'liechiberry'
        },
        {
          speciesNum: 135, speciesId: 'jolteon', name: 'Blitza', types: ['Electric'],
          moves: ['thunder', 'shadowball', 'signalbeam', 'raindance'],
          item: 'shucaberry'
        },
        {
          speciesNum: 181, speciesId: 'ampharos', name: 'Ampharos', types: ['Electric'],
          moves: ['discharge', 'powergem', 'charge', 'cottonguard'],
          item: 'petayaberry'
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
          moves: ['petaldance', 'sleeppowder', 'moonlight', 'sunnyday'],
          item: 'grassgem'
        },
        {
          speciesNum: 3, speciesId: 'venusaur', name: 'Bisaflor', types: ['Grass', 'Poison'],
          moves: ['petaldance', 'toxic', 'lightscreen', 'synthesis'],
          item: 'sitrusberry'
        },
        {
          speciesNum: 71, speciesId: 'victreebel', name: 'Sarzenia', types: ['Grass', 'Poison'],
          moves: ['leafblade', 'suckerpunch', 'swordsdance', 'reflect'],
          item: 'salacberry'
        },
        {
          speciesNum: 103, speciesId: 'exeggutor', name: 'Kokowei', types: ['Grass', 'Psychic'],
          moves: ['solarbeam', 'psyshock', 'hypnosis', 'sunnyday'],
          item: 'tangaberry'
        },
        {
          speciesNum: 465, speciesId: 'tangrowth', name: 'Tangoloss', types: ['Grass'],
          moves: ['powerwhip', 'earthquake', 'rockslide', 'swordsdance'],
          item: 'liechiberry'
        },
        {
          speciesNum: 182, speciesId: 'bellossom', name: 'Blubella', types: ['Grass'],
          moves: ['leafblade', 'drainpunch', 'swordsdance', 'sunnyday'],
          item: 'fightinggem'
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
          moves: ['sludgebomb', 'bugbuzz', 'gigadrain', 'quiverdance'],
          item: 'petayaberry'
        },
        {
          speciesNum: 110, speciesId: 'weezing', name: 'Smogmog', types: ['Poison'],
          moves: ['sludgebomb', 'fireblast', 'shadowball', 'painsplit'],
          item: 'firegem'
        },
        {
          speciesNum: 168, speciesId: 'ariados', name: 'Ariados', types: ['Bug', 'Poison'],
          moves: ['poisonjab', 'strugglebug', 'electroweb', 'suckerpunch'],
          item: 'payapaberry'
        },
        {
          speciesNum: 169, speciesId: 'crobat', name: 'Iksbat', types: ['Poison', 'Flying'],
          moves: ['toxic', 'superfang', 'heatwave', 'tailwind'],
          item: 'sitrusberry'
        },
        {
          speciesNum: 24, speciesId: 'arbok', name: 'Arbok', types: ['Poison'],
          moves: ['gunkshot', 'suckerpunch', 'coil', 'dragontail'],
          item: 'shucaberry'
        },
        {
          speciesNum: 73, speciesId: 'tentacruel', name: 'Tentoxa', types: ['Water', 'Poison'],
          moves: ['toxicspikes', 'scald', 'gigadrain', 'barrier'],
          item: 'apicotberry'
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
          moves: ['psyshock', 'shadowball', 'focusblast', 'chargebeam'],
          item: 'colburberry'
        },
        {
          speciesNum: 97, speciesId: 'hypno', name: 'Hypno', types: ['Psychic'],
          moves: ['dreameater', 'shadowball', 'hypnosis', 'calmmind'],
          item: 'sitrusberry'
        },
        {
          speciesNum: 122, speciesId: 'mrmime', name: 'Pantimos', types: ['Psychic', 'Fairy'],
          moves: ['psychic', 'chargebeam', 'lightscreen', 'reflect'],
          item: 'kasibberry'
        },
        {
          speciesNum: 199, speciesId: 'slowking', name: 'Laschoking', types: ['Water', 'Psychic'],
          moves: ['psyshock', 'icebeam', 'slackoff', 'calmmind'],
          item: 'ganlonberry'
        },
        {
          speciesNum: 196, speciesId: 'espeon', name: 'Psiana', types: ['Psychic'],
          moves: ['psyshock', 'shadowball', 'yawn', 'reflect'],
          item: 'petayaberry'
        },
        {
          speciesNum: 124, speciesId: 'jynx', name: 'Rossana', types: ['Ice', 'Psychic'],
          moves: ['dreameater', 'frostbreath', 'energyball', 'lovelykiss'],
          item: 'salacberry'
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
          moves: ['flareblitz', 'wildcharge', 'closecombat', 'extremespeed'],
          item: 'liechiberry'
        },
        {
          speciesNum: 38, speciesId: 'ninetales', name: 'Vulnona', types: ['Fire'],
          moves: ['heatwave', 'energyball', 'hypnosis', 'nastyplot'],
          item: 'chartiberry'
        },
        {
          speciesNum: 6, speciesId: 'charizard', name: 'Glurak', types: ['Fire', 'Flying'],
          moves: ['inferno', 'dragonrush', 'focusblast', 'honeclaws'],
          item: 'dragongem'
        },
        {
          speciesNum: 467, speciesId: 'magmortar', name: 'Magbrant', types: ['Fire'],
          moves: ['fireblast', 'psychic', 'thunderbolt', 'focusblast'],
          item: 'petayaberry'
        },
        {
          speciesNum: 136, speciesId: 'flareon', name: 'Flamara', types: ['Fire'],
          moves: ['flamecharge', 'superpower', 'flail', 'yawn'],
          item: 'salacberry'
        },
        {
          speciesNum: 78, speciesId: 'rapidash', name: 'Gallopa', types: ['Fire'],
          moves: ['flareblitz', 'megahorn', 'wildcharge', 'hypnosis'],
          item: 'shucaberry'
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
          moves: ['drillrun', 'stoneedge', 'megahorn', 'hammerarm'],
          item: 'liechiberry'
        },
        {
          speciesNum: 76, speciesId: 'golem', name: 'Geowaz', types: ['Rock', 'Ground'],
          moves: ['earthquake', 'stealthrock', 'rockblast', 'roar'],
          item: 'rindoberry'
        },
        {
          speciesNum: 105, speciesId: 'marowak', name: 'Knogga', types: ['Ground'],
          moves: ['bonemerang', 'stoneedge', 'outrage', 'thunderpunch'],
          item: 'yacheberry'
        },
        {
          speciesNum: 28, speciesId: 'sandslash', name: 'Sandamer', types: ['Ground'],
          moves: ['earthquake', 'rockslide', 'brickbreak', 'sandstorm'],
          item: 'salacberry'
        },
        {
          speciesNum: 34, speciesId: 'nidoking', name: 'Nidoking', types: ['Poison', 'Ground'],
          moves: ['earthpower', 'sludgewave', 'megahorn', 'blizzard'],
          item: 'shucaberry'
        },
        {
          speciesNum: 31, speciesId: 'nidoqueen', name: 'Nidoqueen', types: ['Poison', 'Ground'],
          moves: ['earthpower', 'poisonjab', 'superpower', 'thunder'],
          item: 'passhoberry'
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
