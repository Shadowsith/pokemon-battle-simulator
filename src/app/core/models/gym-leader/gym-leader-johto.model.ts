import type { GymLeader, RunRegion } from '../trainer-run.model';

/**
 * Johto uses each leader's Kampf-Dojo rematch team from HeartGold / SoulSilver
 * (source: pokewiki.de, each leader's page). Items as held there; Schwalboss'
 * Heiß-Orb and Kapilz' Toxik-Orb are left off because the orbs aren't modelled
 * (nor the Adrenalin / Aufheber abilities that would make them useful). Jens
 * really does field two Gengar.
 */
export const JOHTO: RunRegion<GymLeader> = {
  id: 'johto',
  gen: 2,
  label: 'Johto (Gen 2)',
  available: true,
  members: [
    {
      trainerId: 'falkner',
      name: 'Falk',
      title: 'Arenaleiter von Viola City',
      badge: 'Flügelorden',
      type: 'Flying',
      team: [
        {
          speciesNum: 398, speciesId: 'staraptor', name: 'Staraptor', types: ['Normal', 'Flying'],
          moves: ['attract', 'bravebird', 'closecombat', 'uturn'],
          item: 'sitrusberry'
        },
        {
          speciesNum: 164, speciesId: 'noctowl', name: 'Noctuh', types: ['Normal', 'Flying'],
          moves: ['roost', 'airslash', 'shadowball', 'featherdance']
        },
        {
          speciesNum: 277, speciesId: 'swellow', name: 'Schwalboss', types: ['Normal', 'Flying'],
          moves: ['facade', 'protect', 'doubleteam', 'endeavor']
        },
        {
          speciesNum: 430, speciesId: 'honchkrow', name: 'Kramshef', types: ['Dark', 'Flying'],
          moves: ['nightslash', 'suckerpunch', 'thunderwave', 'darkpulse']
        },
        {
          speciesNum: 279, speciesId: 'pelipper', name: 'Pelipper', types: ['Water', 'Flying'],
          moves: ['surf', 'tailwind', 'icebeam', 'hiddenpower']
        },
        {
          speciesNum: 18, speciesId: 'pidgeot', name: 'Tauboss', types: ['Normal', 'Flying'],
          moves: ['return', 'doubleteam', 'swagger', 'roost']
        }
      ]
    },
    {
      trainerId: 'bugsy',
      name: 'Kai',
      title: 'Arenaleiter von Azalea City',
      badge: 'Insektorden',
      type: 'Bug',
      team: [
        {
          speciesNum: 212, speciesId: 'scizor', name: 'Scherox', types: ['Bug', 'Steel'],
          moves: ['bulletpunch', 'xscissor', 'swordsdance', 'superpower'],
          item: 'sitrusberry'
        },
        {
          speciesNum: 292, speciesId: 'shedinja', name: 'Ninjatom', types: ['Bug', 'Ghost'],
          moves: ['toxic', 'xscissor', 'shadowsneak', 'swagger']
        },
        {
          speciesNum: 469, speciesId: 'yanmega', name: 'Yanmega', types: ['Bug', 'Flying'],
          moves: ['detect', 'bugbuzz', 'airslash', 'ancientpower']
        },
        {
          speciesNum: 127, speciesId: 'pinsir', name: 'Pinsir', types: ['Bug'],
          moves: ['earthquake', 'guillotine', 'xscissor', 'rocktomb']
        },
        {
          speciesNum: 214, speciesId: 'heracross', name: 'Skaraborn', types: ['Bug', 'Fighting'],
          moves: ['closecombat', 'megahorn', 'stoneedge', 'counter']
        },
        {
          speciesNum: 416, speciesId: 'vespiquen', name: 'Honweisel', types: ['Bug', 'Flying'],
          moves: ['protect', 'confuseray', 'attackorder', 'defendorder'],
          item: 'sitrusberry'
        }
      ]
    },
    {
      trainerId: 'whitney',
      name: 'Bianka',
      title: 'Arenaleiterin von Dukatia City',
      badge: 'Basisorden',
      type: 'Normal',
      team: [
        {
          speciesNum: 203, speciesId: 'girafarig', name: 'Girafarig', types: ['Normal', 'Psychic'],
          moves: ['psychic', 'shadowball', 'nastyplot', 'batonpass']
        },
        {
          speciesNum: 400, speciesId: 'bibarel', name: 'Bidifas', types: ['Normal', 'Water'],
          moves: ['doubleteam', 'chargebeam', 'surf', 'icebeam']
        },
        {
          speciesNum: 463, speciesId: 'lickilicky', name: 'Schlurplek', types: ['Normal'],
          moves: ['wringout', 'flamethrower', 'icebeam', 'thunderbolt']
        },
        {
          speciesNum: 36, speciesId: 'clefable', name: 'Pixi', types: ['Fairy'],
          moves: ['blizzard', 'thunder', 'fireblast', 'nastyplot']
        },
        {
          speciesNum: 301, speciesId: 'delcatty', name: 'Enekoro', types: ['Normal'],
          moves: ['fakeout', 'assist', 'nastyplot', 'batonpass']
        },
        {
          speciesNum: 241, speciesId: 'miltank', name: 'Miltank', types: ['Normal'],
          moves: ['bodyslam', 'attract', 'sleeptalk', 'rest'],
          item: 'lumberry'
        }
      ]
    },
    {
      trainerId: 'morty',
      name: 'Jens',
      title: 'Arenaleiter von Teak City',
      badge: 'Phantomorden',
      type: 'Ghost',
      team: [
        {
          speciesNum: 426, speciesId: 'drifblim', name: 'Drifzepeli', types: ['Ghost', 'Flying'],
          moves: ['destinybond', 'substitute', 'thunderbolt', 'shadowball'],
          item: 'sitrusberry'
        },
        {
          speciesNum: 477, speciesId: 'dusknoir', name: 'Zwirrfinst', types: ['Ghost'],
          moves: ['painsplit', 'willowisp', 'substitute', 'payback']
        },
        {
          speciesNum: 302, speciesId: 'sableye', name: 'Zobiris', types: ['Dark', 'Ghost'],
          moves: ['suckerpunch', 'brickbreak', 'icepunch', 'fakeout']
        },
        {
          speciesNum: 429, speciesId: 'mismagius', name: 'Traunmagil', types: ['Ghost'],
          moves: ['perishsong', 'meanlook', 'confuseray', 'astonish']
        },
        {
          speciesNum: 94, speciesId: 'gengar', name: 'Gengar', types: ['Ghost', 'Poison'],
          moves: ['hypnosis', 'confuseray', 'shadowball', 'focusblast']
        },
        {
          speciesNum: 94, speciesId: 'gengar', name: 'Gengar', types: ['Ghost', 'Poison'],
          moves: ['substitute', 'shadowball', 'thunderbolt', 'destinybond']
        }
      ]
    },
    {
      trainerId: 'chuck',
      name: 'Hartwig',
      title: 'Arenaleiter von Anemonia City',
      badge: 'Faustorden',
      type: 'Fighting',
      team: [
        {
          speciesNum: 308, speciesId: 'medicham', name: 'Meditalis', types: ['Fighting', 'Psychic'],
          moves: ['highjumpkick', 'psychocut', 'attract', 'thunderpunch'],
          item: 'sitrusberry'
        },
        {
          speciesNum: 107, speciesId: 'hitmonchan', name: 'Nockchan', types: ['Fighting'],
          moves: ['machpunch', 'swagger', 'focuspunch', 'doubleteam']
        },
        {
          speciesNum: 106, speciesId: 'hitmonlee', name: 'Kicklee', types: ['Fighting'],
          moves: ['highjumpkick', 'fakeout', 'blazekick', 'bulkup']
        },
        {
          speciesNum: 286, speciesId: 'breloom', name: 'Kapilz', types: ['Grass', 'Fighting'],
          moves: ['substitute', 'focuspunch', 'drainpunch', 'stoneedge']
        },
        {
          speciesNum: 57, speciesId: 'primeape', name: 'Rasaff', types: ['Fighting'],
          moves: ['closecombat', 'payback', 'thunderpunch', 'swagger']
        },
        {
          speciesNum: 62, speciesId: 'poliwrath', name: 'Quappo', types: ['Water', 'Fighting'],
          moves: ['doubleteam', 'waterfall', 'focuspunch', 'substitute'],
          item: 'sitrusberry'
        }
      ]
    },
    {
      trainerId: 'jasmine',
      name: 'Jasmin',
      title: 'Arenaleiterin von Oliviana City',
      badge: 'Stahlorden',
      type: 'Steel',
      team: [
        {
          speciesNum: 376, speciesId: 'metagross', name: 'Metagross', types: ['Steel', 'Psychic'],
          moves: ['meteormash', 'bulletpunch', 'gravity', 'explosion']
        },
        {
          speciesNum: 437, speciesId: 'bronzong', name: 'Bronzong', types: ['Steel', 'Psychic'],
          moves: ['gyroball', 'hypnosis', 'dreameater', 'gravity']
        },
        {
          speciesNum: 227, speciesId: 'skarmory', name: 'Panzaeron', types: ['Steel', 'Flying'],
          moves: ['airslash', 'spikes', 'nightslash', 'steelwing']
        },
        {
          speciesNum: 395, speciesId: 'empoleon', name: 'Impoleon', types: ['Water', 'Steel'],
          moves: ['hydropump', 'blizzard', 'aquajet', 'roar']
        },
        {
          speciesNum: 462, speciesId: 'magnezone', name: 'Magnezone', types: ['Electric', 'Steel'],
          moves: ['zapcannon', 'lockon', 'mirrorcoat', 'metalsound']
        },
        {
          speciesNum: 208, speciesId: 'steelix', name: 'Stahlos', types: ['Steel', 'Ground'],
          moves: ['stoneedge', 'stealthrock', 'roar', 'irontail']
        }
      ]
    },
    {
      trainerId: 'pryce',
      name: 'Norbert',
      title: 'Arenaleiter von Mahagonia City',
      badge: 'Eisorden',
      type: 'Ice',
      team: [
        {
          speciesNum: 460, speciesId: 'abomasnow', name: 'Rexblisar', types: ['Grass', 'Ice'],
          moves: ['iceshard', 'woodhammer', 'earthquake', 'blizzard']
        },
        {
          speciesNum: 362, speciesId: 'glalie', name: 'Firnontor', types: ['Ice'],
          moves: ['payback', 'torment', 'attract', 'blizzard']
        },
        {
          speciesNum: 478, speciesId: 'froslass', name: 'Frosdedje', types: ['Ice', 'Ghost'],
          moves: ['iceshard', 'confuseray', 'attract', 'blizzard']
        },
        {
          speciesNum: 87, speciesId: 'dewgong', name: 'Jugong', types: ['Water', 'Ice'],
          moves: ['dive', 'sheercold', 'sleeptalk', 'rest'],
          item: 'lumberry'
        },
        {
          speciesNum: 365, speciesId: 'walrein', name: 'Walraisa', types: ['Ice', 'Water'],
          moves: ['hail', 'bodyslam', 'swagger', 'blizzard']
        },
        {
          speciesNum: 473, speciesId: 'mamoswine', name: 'Mamutel', types: ['Ice', 'Ground'],
          moves: ['earthquake', 'avalanche', 'stoneedge', 'doubleteam'],
          item: 'sitrusberry'
        }
      ]
    },
    {
      trainerId: 'clair',
      name: 'Sandra',
      title: 'Arenaleiterin von Ebenholz City',
      badge: 'Drachenorden',
      type: 'Dragon',
      team: [
        {
          speciesNum: 130, speciesId: 'gyarados', name: 'Garados', types: ['Water', 'Flying'],
          moves: ['dragondance', 'earthquake', 'waterfall', 'dragonpulse'],
          item: 'wacanberry'
        },
        {
          speciesNum: 148, speciesId: 'dragonair', name: 'Dragonir', types: ['Dragon'],
          moves: ['thunderwave', 'dragonrush', 'thunderbolt', 'flamethrower']
        },
        {
          speciesNum: 142, speciesId: 'aerodactyl', name: 'Aerodactyl', types: ['Rock', 'Flying'],
          moves: ['earthquake', 'thunderfang', 'rockslide', 'roar']
        },
        {
          speciesNum: 6, speciesId: 'charizard', name: 'Glurak', types: ['Fire', 'Flying'],
          moves: ['shadowclaw', 'airslash', 'dragonclaw', 'firefang']
        },
        {
          speciesNum: 230, speciesId: 'kingdra', name: 'Seedraking', types: ['Water', 'Dragon'],
          moves: ['yawn', 'hydropump', 'icebeam', 'dragonbreath']
        },
        {
          speciesNum: 149, speciesId: 'dragonite', name: 'Dragoran', types: ['Dragon', 'Flying'],
          moves: ['thunder', 'safeguard', 'dragonbreath', 'hyperbeam'],
          item: 'sitrusberry'
        }
      ]
    }
  ]
};
