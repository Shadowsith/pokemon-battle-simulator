/**
 * Elite Four rosters for the "Top 4 Run" game mode. One region per generation;
 * only Kanto (Gen 1) is authored so far, using the Feuerrot / Blattgrün
 * (FireRed / LeafGreen) **rematch** teams. Every Pokémon battles at level 100 in
 * this simulator, so only the species + movesets are honoured, not the levels.
 */

/** One opponent Pokémon; same shape as StoryMon / TeamPokemon. */
export interface EliteFourMon {
  speciesNum: number;
  speciesId: string;
  name: string;
  /** Capitalised Gen-5 type names ("Water"). */
  types: string[];
  /** @pkmn/sim move ids; resolved against MOVE_LIBRARY. */
  moves: string[];
}

export interface EliteFourMember {
  /** Trainer sprite id (assets/trainers/<id>.png). */
  trainerId: string;
  name: string;
  title: string;
  team: EliteFourMon[];
}

export interface EliteFourRegion {
  id: string;
  gen: number;
  label: string;
  /** false → shown in the picker but not playable yet. */
  available: boolean;
  members: EliteFourMember[];
}

const KANTO: EliteFourRegion = {
  id: 'kanto',
  gen: 1,
  label: 'Kanto (Gen 1)',
  available: true,
  members: [
    {
      trainerId: 'lorelei-gen3',
      name: 'Lorelei',
      title: 'Meisterin der Eis-Pokémon',
      team: [
        {
          speciesNum: 87, speciesId: 'dewgong', name: 'Jugong', types: ['Water', 'Ice'],
          moves: ['surf', 'icebeam', 'doubleteam', 'signalbeam']
        },
        {
          speciesNum: 91, speciesId: 'cloyster', name: 'Austos', types: ['Water', 'Ice'],
          moves: ['raindance', 'surf', 'icebeam', 'supersonic']
        },
        {
          speciesNum: 221, speciesId: 'piloswine', name: 'Keifel', types: ['Ice', 'Ground'],
          moves: ['earthquake', 'blizzard', 'takedown', 'rockslide']
        },
        {
          speciesNum: 124, speciesId: 'jynx', name: 'Rossana', types: ['Ice', 'Psychic'],
          moves: ['psychic', 'lovelykiss', 'attract', 'icebeam']
        },
        {
          speciesNum: 131, speciesId: 'lapras', name: 'Lapras', types: ['Water', 'Ice'],
          moves: ['psychic', 'thunder', 'icebeam', 'surf']
        }
      ]
    },
    {
      trainerId: 'bruno-gen3',
      name: 'Bruno',
      title: 'Meister der Kampf-Pokémon',
      team: [
        {
          speciesNum: 208, speciesId: 'steelix', name: 'Stahlos', types: ['Steel', 'Ground'],
          moves: ['rocktomb', 'earthquake', 'crunch', 'irontail']
        },
        {
          speciesNum: 107, speciesId: 'hitmonchan', name: 'Nockchan', types: ['Fighting'],
          moves: ['skyuppercut', 'machpunch', 'counter', 'rockslide']
        },
        {
          speciesNum: 106, speciesId: 'hitmonlee', name: 'Kicklee', types: ['Fighting'],
          moves: ['rockslide', 'megakick', 'highjumpkick', 'earthquake']
        },
        {
          speciesNum: 208, speciesId: 'steelix', name: 'Stahlos', types: ['Steel', 'Ground'],
          moves: ['flamethrower', 'earthquake', 'crunch', 'irontail']
        },
        {
          speciesNum: 68, speciesId: 'machamp', name: 'Machomei', types: ['Fighting'],
          moves: ['earthquake', 'rockslide', 'brickbreak', 'crosschop']
        }
      ]
    },
    {
      trainerId: 'agatha-gen3',
      name: 'Agathe',
      title: 'Meisterin der Geist-Pokémon',
      team: [
        {
          speciesNum: 94, speciesId: 'gengar', name: 'Gengar', types: ['Ghost', 'Poison'],
          moves: ['hypnosis', 'psychic', 'confuseray', 'shadowpunch']
        },
        {
          speciesNum: 169, speciesId: 'crobat', name: 'Iksbat', types: ['Poison', 'Flying'],
          moves: ['confuseray', 'sludgebomb', 'aircutter', 'shadowball']
        },
        {
          speciesNum: 200, speciesId: 'misdreavus', name: 'Traunfugil', types: ['Ghost'],
          moves: ['shadowball', 'psychic', 'thunderbolt', 'attract']
        },
        {
          speciesNum: 24, speciesId: 'arbok', name: 'Arbok', types: ['Poison'],
          moves: ['gigadrain', 'sludgebomb', 'doubleteam', 'earthquake']
        },
        {
          speciesNum: 94, speciesId: 'gengar', name: 'Gengar', types: ['Ghost', 'Poison'],
          moves: ['psychic', 'thunderbolt', 'shadowball', 'sludgebomb']
        }
      ]
    },
    {
      trainerId: 'lance-gen3',
      name: 'Siegfried',
      title: 'Meister der Drachen-Pokémon',
      team: [
        {
          speciesNum: 130, speciesId: 'gyarados', name: 'Garados', types: ['Water', 'Flying'],
          moves: ['earthquake', 'dragondance', 'thunderwave', 'hyperbeam']
        },
        {
          speciesNum: 149, speciesId: 'dragonite', name: 'Dragoran', types: ['Dragon', 'Flying'],
          moves: ['flamethrower', 'hyperbeam', 'earthquake', 'dragonclaw']
        },
        {
          speciesNum: 230, speciesId: 'kingdra', name: 'Seedraking', types: ['Water', 'Dragon'],
          moves: ['surf', 'hyperbeam', 'dragondance', 'icebeam']
        },
        {
          speciesNum: 142, speciesId: 'aerodactyl', name: 'Aerodactyl', types: ['Rock', 'Flying'],
          moves: ['aerialace', 'ancientpower', 'earthquake', 'hyperbeam']
        },
        {
          speciesNum: 149, speciesId: 'dragonite', name: 'Dragoran', types: ['Dragon', 'Flying'],
          moves: ['thunderbolt', 'outrage', 'icebeam', 'hyperbeam']
        }
      ]
    }
  ]
};

export const ELITE_FOUR_REGIONS: EliteFourRegion[] = [
  KANTO,
  { id: 'johto', gen: 2, label: 'Johto (Gen 2)', available: false, members: [] },
  { id: 'hoenn', gen: 3, label: 'Hoenn (Gen 3)', available: false, members: [] },
  { id: 'sinnoh', gen: 4, label: 'Sinnoh (Gen 4)', available: false, members: [] },
  { id: 'einall', gen: 5, label: 'Einall (Gen 5)', available: false, members: [] }
];

export function eliteFourRegion(id: string): EliteFourRegion | undefined {
  return ELITE_FOUR_REGIONS.find((r) => r.id === id);
}
