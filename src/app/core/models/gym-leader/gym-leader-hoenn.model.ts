import type { GymLeader, RunRegion } from '../trainer-run.model';

/**
 * Hoenn uses the first Schwarz 2 / Weiß 2 team of each leader — the PWT
 * "Hoenn-Arenaleiterturnier" (source: pokewiki.de, each leader's page). That
 * tournament fields Juan (not Wassili) for Xeneroville, and Ben and Svenja as
 * two separate entrants: they're fought back to back for the one Mentalorden.
 * Six Pokémon each, holding their PWT items; abilities aren't modelled.
 */
export const HOENN: RunRegion<GymLeader> = {
  id: 'hoenn',
  gen: 3,
  label: 'Hoenn (Gen 3)',
  available: true,
  members: [
    {
      trainerId: 'roxanne-gen3',
      name: 'Felizia',
      title: 'Arenaleiterin von Metarost City',
      badge: 'Steinorden',
      type: 'Rock',
      team: [
        {
          speciesNum: 476, speciesId: 'probopass', name: 'Voluminas', types: ['Rock', 'Steel'],
          moves: ['sandstorm', 'powergem', 'flashcannon', 'thunderwave'],
          item: 'shucaberry'
        },
        {
          speciesNum: 348, speciesId: 'armaldo', name: 'Armaldo', types: ['Rock', 'Bug'],
          moves: ['curse', 'aquatail', 'xscissor', 'stoneedge'],
          item: 'liechiberry'
        },
        {
          speciesNum: 346, speciesId: 'cradily', name: 'Wielie', types: ['Rock', 'Grass'],
          moves: ['ancientpower', 'gigadrain', 'stockpile', 'stealthrock'],
          item: 'sitrusberry'
        },
        {
          speciesNum: 306, speciesId: 'aggron', name: 'Stolloss', types: ['Steel', 'Rock'],
          moves: ['irontail', 'stoneedge', 'outrage', 'thunderwave'],
          item: 'chopleberry'
        },
        {
          speciesNum: 369, speciesId: 'relicanth', name: 'Relicanth', types: ['Water', 'Rock'],
          moves: ['amnesia', 'yawn', 'aquatail', 'stoneedge'],
          item: 'rindoberry'
        },
        {
          speciesNum: 76, speciesId: 'golem', name: 'Geowaz', types: ['Rock', 'Ground'],
          moves: ['rockslide', 'ironhead', 'steamroller', 'rockpolish'],
          item: 'salacberry'
        }
      ]
    },
    {
      trainerId: 'brawly-gen3',
      name: 'Kamillo',
      title: 'Arenaleiter von Faustauhaven',
      badge: 'Knöchelorden',
      type: 'Fighting',
      team: [
        {
          speciesNum: 297, speciesId: 'hariyama', name: 'Hariyama', types: ['Fighting'],
          moves: ['closecombat', 'bulletpunch', 'earthquake', 'bulkup'],
          item: 'sitrusberry'
        },
        {
          speciesNum: 308, speciesId: 'medicham', name: 'Meditalis', types: ['Fighting', 'Psychic'],
          moves: ['brickbreak', 'psychocut', 'thunderpunch', 'icepunch'],
          item: 'psychicgem'
        },
        {
          speciesNum: 286, speciesId: 'breloom', name: 'Kapilz', types: ['Grass', 'Fighting'],
          moves: ['focuspunch', 'spore', 'stoneedge', 'machpunch'],
          item: 'cobaberry'
        },
        {
          speciesNum: 68, speciesId: 'machamp', name: 'Machomei', types: ['Fighting'],
          moves: ['closecombat', 'earthquake', 'stoneedge', 'bulkup'],
          item: 'lumberry'
        },
        {
          speciesNum: 237, speciesId: 'hitmontop', name: 'Kapoera', types: ['Fighting'],
          moves: ['triplekick', 'drillrun', 'rockslide', 'agility'],
          item: 'liechiberry'
        },
        {
          speciesNum: 214, speciesId: 'heracross', name: 'Skaraborn', types: ['Bug', 'Fighting'],
          moves: ['closecombat', 'megahorn', 'aerialace', 'rockslide'],
          item: 'salacberry'
        }
      ]
    },
    {
      trainerId: 'wattson-gen3',
      name: 'Walter',
      title: 'Arenaleiter von Malvenfroh City',
      badge: 'Dynamo-Orden',
      type: 'Electric',
      team: [
        {
          speciesNum: 310, speciesId: 'manectric', name: 'Voltenso', types: ['Electric'],
          moves: ['thunderbolt', 'charge', 'flamethrower', 'signalbeam'],
          item: 'petayaberry'
        },
        {
          speciesNum: 462, speciesId: 'magnezone', name: 'Magnezone', types: ['Electric', 'Steel'],
          moves: ['discharge', 'magnetrise', 'triattack', 'metalsound'],
          item: 'airballoon'
        },
        {
          speciesNum: 101, speciesId: 'electrode', name: 'Lektrobal', types: ['Electric'],
          moves: ['lightscreen', 'chargebeam', 'doubleteam', 'signalbeam'],
          item: 'shucaberry'
        },
        {
          speciesNum: 311, speciesId: 'plusle', name: 'Plusle', types: ['Electric'],
          moves: ['discharge', 'agility', 'nastyplot', 'batonpass'],
          item: 'salacberry'
        },
        {
          speciesNum: 312, speciesId: 'minun', name: 'Minun', types: ['Electric'],
          moves: ['faketears', 'thunderwave', 'voltswitch', 'charm'],
          item: 'electricgem'
        },
        {
          speciesNum: 26, speciesId: 'raichu', name: 'Raichu', types: ['Electric'],
          moves: ['return', 'wildcharge', 'knockoff', 'brickbreak'],
          item: 'liechiberry'
        }
      ]
    },
    {
      trainerId: 'flannery-gen3',
      name: 'Flavia',
      title: 'Arenaleiterin von Bad Lavastadt',
      badge: 'Hitzeorden',
      type: 'Fire',
      team: [
        {
          speciesNum: 324, speciesId: 'torkoal', name: 'Qurtel', types: ['Fire'],
          moves: ['fireblast', 'stoneedge', 'gyroball', 'yawn'],
          item: 'firegem'
        },
        {
          speciesNum: 323, speciesId: 'camerupt', name: 'Camerupt', types: ['Fire', 'Ground'],
          moves: ['yawn', 'fireblast', 'earthpower', 'rockslide'],
          item: 'passhoberry'
        },
        {
          speciesNum: 219, speciesId: 'magcargo', name: 'Magcargo', types: ['Fire', 'Rock'],
          moves: ['ancientpower', 'earthpower', 'lavaplume', 'shellsmash'],
          item: 'shucaberry'
        },
        {
          speciesNum: 257, speciesId: 'blaziken', name: 'Lohgock', types: ['Fire', 'Fighting'],
          moves: ['skyuppercut', 'bravebird', 'flareblitz', 'bulkup'],
          item: 'salacberry'
        },
        {
          speciesNum: 229, speciesId: 'houndoom', name: 'Hundemon', types: ['Dark', 'Fire'],
          moves: ['willowisp', 'nastyplot', 'fireblast', 'darkpulse'],
          item: 'petayaberry'
        },
        {
          speciesNum: 467, speciesId: 'magmortar', name: 'Magbrant', types: ['Fire'],
          moves: ['rockslide', 'crosschop', 'thunderpunch', 'fireblast'],
          item: 'liechiberry'
        }
      ]
    },
    {
      trainerId: 'norman-gen3',
      name: 'Norman',
      title: 'Arenaleiter von Blütenburg City',
      badge: 'Balanceorden',
      type: 'Normal',
      team: [
        {
          speciesNum: 289, speciesId: 'slaking', name: 'Letarking', types: ['Normal'],
          moves: ['gigaimpact', 'hammerarm', 'earthquake', 'slackoff'],
          item: 'sitrusberry'
        },
        {
          speciesNum: 327, speciesId: 'spinda', name: 'Pandir', types: ['Normal'],
          moves: ['thrash', 'suckerpunch', 'teeterdance', 'assist'],
          item: 'darkgem'
        },
        {
          speciesNum: 352, speciesId: 'kecleon', name: 'Kecleon', types: ['Normal'],
          moves: ['fakeout', 'shadowclaw', 'recover', 'skillswap'],
          item: 'ganlonberry'
        },
        {
          speciesNum: 351, speciesId: 'castform', name: 'Formeo', types: ['Normal'],
          moves: ['fireblast', 'icywind', 'hydropump', 'disable'],
          item: 'icegem'
        },
        {
          speciesNum: 295, speciesId: 'exploud', name: 'Krawumms', types: ['Normal'],
          moves: ['fireblast', 'focusblast', 'hypervoice', 'icebeam'],
          item: 'petayaberry'
        },
        {
          speciesNum: 335, speciesId: 'zangoose', name: 'Sengo', types: ['Normal'],
          moves: ['return', 'closecombat', 'rockslide', 'nightslash'],
          item: 'ganlonberry'
        }
      ]
    },
    {
      trainerId: 'winona-gen3',
      name: 'Wibke',
      title: 'Arenaleiterin von Baumhausen City',
      badge: 'Federorden',
      type: 'Flying',
      team: [
        {
          speciesNum: 334, speciesId: 'altaria', name: 'Altaria', types: ['Dragon', 'Flying'],
          moves: ['cottonguard', 'dreameater', 'roost', 'sing'],
          item: 'apicotberry'
        },
        {
          speciesNum: 279, speciesId: 'pelipper', name: 'Pelipper', types: ['Water', 'Flying'],
          moves: ['tailwind', 'icebeam', 'hurricane', 'scald'],
          item: 'petayaberry'
        },
        {
          speciesNum: 277, speciesId: 'swellow', name: 'Schwalboss', types: ['Normal', 'Flying'],
          moves: ['doubleteam', 'bravebird', 'endeavor', 'uturn'],
          item: 'liechiberry'
        },
        {
          speciesNum: 227, speciesId: 'skarmory', name: 'Panzaeron', types: ['Steel', 'Flying'],
          moves: ['roost', 'bravebird', 'whirlwind', 'stealthrock'],
          item: 'wacanberry'
        },
        {
          speciesNum: 357, speciesId: 'tropius', name: 'Tropius', types: ['Grass', 'Flying'],
          moves: ['substitute', 'leechseed', 'airslash', 'roost'],
          item: 'yacheberry'
        },
        {
          speciesNum: 430, speciesId: 'honchkrow', name: 'Kramshef', types: ['Dark', 'Flying'],
          moves: ['bravebird', 'nightslash', 'icywind', 'heatwave'],
          item: 'chartiberry'
        }
      ]
    },
    {
      trainerId: 'tateandliza-gen3',
      name: 'Ben',
      title: 'Arenaleiter von Moosbach City',
      badge: 'Mentalorden',
      type: 'Psychic',
      sharedBadge: true,
      team: [
        {
          speciesNum: 338, speciesId: 'solrock', name: 'Sonnfel', types: ['Rock', 'Psychic'],
          moves: ['zenheadbutt', 'rockslide', 'fireblast', 'trickroom'],
          item: 'liechiberry'
        },
        {
          speciesNum: 178, speciesId: 'xatu', name: 'Xatu', types: ['Psychic', 'Flying'],
          moves: ['psychic', 'shadowball', 'featherdance', 'trickroom'],
          item: 'wacanberry'
        },
        {
          speciesNum: 358, speciesId: 'chimecho', name: 'Palimpalim', types: ['Psychic'],
          moves: ['hypnosis', 'dreameater', 'energyball', 'trickroom'],
          item: 'colburberry'
        },
        {
          speciesNum: 326, speciesId: 'grumpig', name: 'Groink', types: ['Psychic'],
          moves: ['psyshock', 'sleeptalk', 'rest', 'calmmind'],
          item: 'ganlonberry'
        },
        {
          speciesNum: 475, speciesId: 'gallade', name: 'Galagladi', types: ['Psychic', 'Fighting'],
          moves: ['psychocut', 'stoneedge', 'nightslash', 'leafblade'],
          item: 'kasibberry'
        },
        {
          speciesNum: 376, speciesId: 'metagross', name: 'Lepumentas', types: ['Steel', 'Psychic'],
          moves: ['psychic', 'earthpower', 'cosmicpower', 'trickroom'],
          item: 'sitrusberry'
        }
      ]
    },
    {
      trainerId: 'tateandliza-gen3',
      name: 'Svenja',
      title: 'Arenaleiterin von Moosbach City',
      badge: 'Mentalorden',
      type: 'Psychic',
      team: [
        {
          speciesNum: 337, speciesId: 'lunatone', name: 'Lunastein', types: ['Rock', 'Psychic'],
          moves: ['hypnosis', 'dreameater', 'icebeam', 'cosmicpower'],
          item: 'petayaberry'
        },
        {
          speciesNum: 178, speciesId: 'xatu', name: 'Xatu', types: ['Psychic', 'Flying'],
          moves: ['psyshock', 'thunderwave', 'tailwind', 'heatwave'],
          item: 'chartiberry'
        },
        {
          speciesNum: 358, speciesId: 'chimecho', name: 'Palimpalim', types: ['Psychic'],
          moves: ['lightscreen', 'psychic', 'yawn', 'reflect'],
          item: 'colburberry'
        },
        {
          speciesNum: 326, speciesId: 'grumpig', name: 'Groink', types: ['Psychic'],
          moves: ['psyshock', 'focusblast', 'powergem', 'calmmind'],
          item: 'salacberry'
        },
        {
          speciesNum: 282, speciesId: 'gardevoir', name: 'Guardevoir', types: ['Psychic', 'Fairy'],
          moves: ['dreameater', 'shadowball', 'thunderbolt', 'hypnosis'],
          item: 'ghostgem'
        },
        {
          speciesNum: 376, speciesId: 'metagross', name: 'Lepumentas', types: ['Steel', 'Psychic'],
          moves: ['zenheadbutt', 'bulldoze', 'cosmicpower', 'stoneedge'],
          item: 'sitrusberry'
        }
      ]
    },
    {
      trainerId: 'juan-gen3',
      name: 'Juan',
      title: 'Arenaleiter von Xeneroville',
      badge: 'Schauerorden',
      type: 'Water',
      team: [
        {
          speciesNum: 230, speciesId: 'kingdra', name: 'Seedraking', types: ['Water', 'Dragon'],
          moves: ['raindance', 'muddywater', 'icebeam', 'dragonpulse'],
          item: 'habanberry'
        },
        {
          speciesNum: 365, speciesId: 'walrein', name: 'Walraisa', types: ['Ice', 'Water'],
          moves: ['stockpile', 'blizzard', 'aquaring', 'surf'],
          item: 'sitrusberry'
        },
        {
          speciesNum: 342, speciesId: 'crawdaunt', name: 'Krebutack', types: ['Water', 'Dark'],
          moves: ['dragondance', 'crabhammer', 'superpower', 'nightslash'],
          item: 'wacanberry'
        },
        {
          speciesNum: 340, speciesId: 'whiscash', name: 'Welsar', types: ['Water', 'Ground'],
          moves: ['dragondance', 'earthquake', 'waterfall', 'rockslide'],
          item: 'rindoberry'
        },
        {
          speciesNum: 367, speciesId: 'huntail', name: 'Aalabyss', types: ['Water'],
          moves: ['shellsmash', 'crunch', 'icefang', 'aquatail'],
          item: 'liechiberry'
        },
        {
          speciesNum: 368, speciesId: 'gorebyss', name: 'Saganabyss', types: ['Water'],
          moves: ['shellsmash', 'psychic', 'icywind', 'hydropump'],
          item: 'petayaberry'
        }
      ]
    }
  ]
};
