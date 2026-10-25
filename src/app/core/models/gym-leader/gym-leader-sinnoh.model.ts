import type { GymLeader, RunRegion } from '../trainer-run.model';

/**
 * Sinnoh uses the first Schwarz 2 / Weiß 2 team of each leader — the PWT
 * "Sinnoh-Arenaleiterturnier" (source: pokewiki.de, each leader's page), in
 * badge-case order. Six Pokémon each, holding their PWT items; abilities aren't modelled.
 */
export const SINNOH: RunRegion<GymLeader> = {
  id: 'sinnoh',
  gen: 4,
  label: 'Sinnoh (Gen 4)',
  available: true,
  members: [
    {
      trainerId: 'roark',
      name: 'Veit',
      title: 'Arenaleiter von Erzelingen',
      badge: 'Kohleorden',
      type: 'Rock',
      team: [
        {
          speciesNum: 409, speciesId: 'rampardos', name: 'Rameidon', types: ['Rock'],
          moves: ['stoneedge', 'zenheadbutt', 'earthquake', 'outrage'],
          item: 'salacberry'
        },
        {
          speciesNum: 476, speciesId: 'probopass', name: 'Voluminas', types: ['Rock', 'Steel'],
          moves: ['powergem', 'earthpower', 'sandstorm', 'stealthrock'],
          item: 'chopleberry'
        },
        {
          speciesNum: 185, speciesId: 'sudowoodo', name: 'Mogelbaum', types: ['Rock'],
          moves: ['stoneedge', 'hammerarm', 'woodhammer', 'suckerpunch'],
          item: 'liechiberry'
        },
        {
          speciesNum: 95, speciesId: 'onix', name: 'Onix', types: ['Rock', 'Ground'],
          moves: ['stoneedge', 'roar', 'sandstorm', 'stealthrock'],
          item: 'rindoberry'
        },
        {
          speciesNum: 76, speciesId: 'golem', name: 'Geowaz', types: ['Rock', 'Ground'],
          moves: ['stealthrock', 'gyroball', 'hammerarm', 'curse'],
          item: 'passhoberry'
        },
        {
          speciesNum: 369, speciesId: 'relicanth', name: 'Relicanth', types: ['Water', 'Rock'],
          moves: ['rockslide', 'amnesia', 'sleeptalk', 'rest'],
          item: 'rindoberry'
        }
      ]
    },
    {
      trainerId: 'gardenia',
      name: 'Silvana',
      title: 'Arenaleiterin von Ewigenau',
      badge: 'Waldorden',
      type: 'Grass',
      team: [
        {
          speciesNum: 407, speciesId: 'roserade', name: 'Roserade', types: ['Grass', 'Poison'],
          moves: ['petaldance', 'shadowball', 'weatherball', 'sunnyday'],
          item: 'lumberry'
        },
        {
          speciesNum: 455, speciesId: 'carnivine', name: 'Venuflibis', types: ['Grass'],
          moves: ['powerwhip', 'crunch', 'bugbite', 'swordsdance'],
          item: 'liechiberry'
        },
        {
          speciesNum: 421, speciesId: 'cherrim', name: 'Kinoso', types: ['Grass'],
          moves: ['gigadrain', 'leechseed', 'substitute', 'sunnyday'],
          item: 'grassgem'
        },
        {
          speciesNum: 465, speciesId: 'tangrowth', name: 'Tangoloss', types: ['Grass'],
          moves: ['powerwhip', 'focusblast', 'ancientpower', 'earthquake'],
          item: 'salacberry'
        },
        {
          speciesNum: 470, speciesId: 'leafeon', name: 'Folipurba', types: ['Grass'],
          moves: ['leafblade', 'xscissor', 'quickattack', 'swordsdance'],
          item: 'occaberry'
        },
        {
          speciesNum: 389, speciesId: 'torterra', name: 'Chelterrar', types: ['Grass', 'Ground'],
          moves: ['woodhammer', 'earthquake', 'outrage', 'curse'],
          item: 'yacheberry'
        }
      ]
    },
    {
      trainerId: 'maylene',
      name: 'Hilda',
      title: 'Arenaleiterin von Schleiede',
      badge: 'Bergorden',
      type: 'Fighting',
      team: [
        {
          speciesNum: 448, speciesId: 'lucario', name: 'Lucario', types: ['Fighting', 'Steel'],
          moves: ['crosschop', 'bonerush', 'extremespeed', 'swordsdance'],
          item: 'liechiberry'
        },
        {
          speciesNum: 392, speciesId: 'infernape', name: 'Panferno', types: ['Fire', 'Fighting'],
          moves: ['closecombat', 'firepunch', 'machpunch', 'bulkup'],
          item: 'firegem'
        },
        {
          speciesNum: 454, speciesId: 'toxicroak', name: 'Toxiquak', types: ['Poison', 'Fighting'],
          moves: ['drainpunch', 'suckerpunch', 'torment', 'bulkup'],
          item: 'payapaberry'
        },
        {
          speciesNum: 475, speciesId: 'gallade', name: 'Galagladi', types: ['Psychic', 'Fighting'],
          moves: ['closecombat', 'psychocut', 'slash', 'bulkup'],
          item: 'cobaberry'
        },
        {
          speciesNum: 308, speciesId: 'medicham', name: 'Meditalis', types: ['Fighting', 'Psychic'],
          moves: ['brickbreak', 'zenheadbutt', 'bulletpunch', 'bulkup'],
          item: 'kasibberry'
        },
        {
          speciesNum: 68, speciesId: 'machamp', name: 'Machomei', types: ['Fighting'],
          moves: ['crosschop', 'stoneedge', 'icepunch', 'focusenergy'],
          item: 'sitrusberry'
        }
      ]
    },
    {
      trainerId: 'crasherwake',
      name: 'Wellenbrecher Marinus',
      title: 'Arenaleiter von Weideburg',
      badge: 'Fennorden',
      type: 'Water',
      team: [
        {
          speciesNum: 419, speciesId: 'floatzel', name: 'Bojelin', types: ['Water'],
          moves: ['aquajet', 'icepunch', 'focusblast', 'bulkup'],
          item: 'liechiberry'
        },
        {
          speciesNum: 395, speciesId: 'empoleon', name: 'Impoleon', types: ['Water', 'Steel'],
          moves: ['surf', 'blizzard', 'grassknot', 'featherdance'],
          item: 'petayaberry'
        },
        {
          speciesNum: 457, speciesId: 'lumineon', name: 'Lumineon', types: ['Water'],
          moves: ['scald', 'icywind', 'uturn', 'raindance'],
          item: 'icegem'
        },
        {
          speciesNum: 423, speciesId: 'gastrodon', name: 'Gastrodon', types: ['Water', 'Ground'],
          moves: ['muddywater', 'earthpower', 'stockpile', 'recover'],
          item: 'apicotberry'
        },
        {
          speciesNum: 195, speciesId: 'quagsire', name: 'Morlord', types: ['Water', 'Ground'],
          moves: ['earthquake', 'aquatail', 'curse', 'raindance'],
          item: 'rindoberry'
        },
        {
          speciesNum: 130, speciesId: 'gyarados', name: 'Garados', types: ['Water', 'Flying'],
          moves: ['stoneedge', 'aquatail', 'dragondance', 'outrage'],
          item: 'wacanberry'
        }
      ]
    },
    {
      trainerId: 'fantina',
      name: 'Lamina',
      title: 'Arenaleiterin von Herzhofen',
      badge: 'Reliktorden',
      type: 'Ghost',
      team: [
        {
          speciesNum: 429, speciesId: 'mismagius', name: 'Traunmagil', types: ['Ghost'],
          moves: ['shadowball', 'psychic', 'powergem', 'nastyplot'],
          item: 'salacberry'
        },
        {
          speciesNum: 426, speciesId: 'drifblim', name: 'Drifzepeli', types: ['Ghost', 'Flying'],
          moves: ['shadowball', 'thunder', 'acrobatics', 'tailwind'],
          item: 'flyinggem'
        },
        {
          speciesNum: 442, speciesId: 'spiritomb', name: 'Kryppuk', types: ['Ghost', 'Dark'],
          moves: ['shadowball', 'darkpulse', 'willowisp', 'nastyplot'],
          item: 'sitrusberry'
        },
        {
          speciesNum: 477, speciesId: 'dusknoir', name: 'Zwirrfinst', types: ['Ghost'],
          moves: ['shadowsneak', 'curse', 'painsplit', 'confuseray'],
          item: 'apicotberry'
        },
        {
          speciesNum: 479, speciesId: 'rotom', name: 'Rotom', types: ['Electric', 'Ghost'],
          moves: ['shadowball', 'chargebeam', 'substitute', 'painsplit'],
          item: 'electricgem'
        },
        {
          speciesNum: 94, speciesId: 'gengar', name: 'Gengar', types: ['Ghost', 'Poison'],
          moves: ['hex', 'hypnosis', 'nightmare', 'dreameater'],
          item: 'psychicgem'
        }
      ]
    },
    {
      trainerId: 'byron',
      name: 'Adam',
      title: 'Arenaleiter von Fleetburg',
      badge: 'Minenorden',
      type: 'Steel',
      team: [
        {
          speciesNum: 411, speciesId: 'bastiodon', name: 'Bollterus', types: ['Rock', 'Steel'],
          moves: ['metalburst', 'fireblast', 'irondefense', 'stealthrock'],
          item: 'shucaberry'
        },
        {
          speciesNum: 208, speciesId: 'steelix', name: 'Stahlos', types: ['Steel', 'Ground'],
          moves: ['gyroball', 'dragontail', 'curse', 'stealthrock'],
          item: 'passhoberry'
        },
        {
          speciesNum: 437, speciesId: 'bronzong', name: 'Bronzong', types: ['Steel', 'Psychic'],
          moves: ['gyroball', 'zenheadbutt', 'hypnosis', 'trickroom'],
          item: 'sitrusberry'
        },
        {
          speciesNum: 462, speciesId: 'magnezone', name: 'Magnezone', types: ['Electric', 'Steel'],
          moves: ['flashcannon', 'chargebeam', 'barrier', 'lightscreen'],
          item: 'airballoon'
        },
        {
          speciesNum: 306, speciesId: 'aggron', name: 'Stolloss', types: ['Steel', 'Rock'],
          moves: ['ironhead', 'autotomize', 'rockslide', 'outrage'],
          item: 'chopleberry'
        },
        {
          speciesNum: 205, speciesId: 'forretress', name: 'Forstellka', types: ['Bug', 'Steel'],
          moves: ['gyroball', 'irondefense', 'lightscreen', 'spikes'],
          item: 'occaberry'
        }
      ]
    },
    {
      trainerId: 'candice',
      name: 'Frida',
      title: 'Arenaleiterin von Blizzach',
      badge: 'Firnorden',
      type: 'Ice',
      team: [
        {
          speciesNum: 478, speciesId: 'froslass', name: 'Frosdedje', types: ['Ice', 'Ghost'],
          moves: ['hail', 'blizzard', 'shadowball', 'thunderbolt'],
          item: 'petayaberry'
        },
        {
          speciesNum: 460, speciesId: 'abomasnow', name: 'Rexblisar', types: ['Grass', 'Ice'],
          moves: ['earthquake', 'blizzard', 'grassknot', 'ingrain'],
          item: 'occaberry'
        },
        {
          speciesNum: 461, speciesId: 'weavile', name: 'Snibunna', types: ['Dark', 'Ice'],
          moves: ['torment', 'nightslash', 'icepunch', 'payback'],
          item: 'chopleberry'
        },
        {
          speciesNum: 471, speciesId: 'glaceon', name: 'Glaziola', types: ['Ice'],
          moves: ['icywind', 'shadowball', 'signalbeam', 'yawn'],
          item: 'salacberry'
        },
        {
          speciesNum: 473, speciesId: 'mamoswine', name: 'Mamutel', types: ['Ice', 'Ground'],
          moves: ['iciclecrash', 'superpower', 'bulldoze', 'rocktomb'],
          item: 'liechiberry'
        },
        {
          speciesNum: 362, speciesId: 'glalie', name: 'Firnontor', types: ['Ice'],
          moves: ['hail', 'icebeam', 'crunch', 'rollout'],
          item: 'rockgem'
        }
      ]
    },
    {
      trainerId: 'volkner',
      name: 'Volkner',
      title: 'Arenaleiter von Sonnewik',
      badge: 'Lichtorden',
      type: 'Electric',
      team: [
        {
          speciesNum: 466, speciesId: 'electivire', name: 'Elevoltek', types: ['Electric'],
          moves: ['wildcharge', 'brickbreak', 'icepunch', 'bulldoze'],
          item: 'salacberry'
        },
        {
          speciesNum: 405, speciesId: 'luxray', name: 'Luxtra', types: ['Electric'],
          moves: ['wildcharge', 'crunch', 'superpower', 'thunderwave'],
          item: 'shucaberry'
        },
        {
          speciesNum: 26, speciesId: 'raichu', name: 'Raichu', types: ['Electric'],
          moves: ['chargebeam', 'focusblast', 'grassknot', 'charge'],
          item: 'grassgem'
        },
        {
          speciesNum: 479, speciesId: 'rotom', name: 'Rotom', types: ['Electric', 'Ghost'],
          moves: ['discharge', 'hex', 'painsplit', 'willowisp'],
          item: 'colburberry'
        },
        {
          speciesNum: 135, speciesId: 'jolteon', name: 'Blitza', types: ['Electric'],
          moves: ['thunderbolt', 'shadowball', 'charm', 'wish'],
          item: 'sitrusberry'
        },
        {
          speciesNum: 101, speciesId: 'electrode', name: 'Lektrobal', types: ['Electric'],
          moves: ['electroball', 'signalbeam', 'taunt', 'torment'],
          item: 'electricgem'
        }
      ]
    }
  ]
};
