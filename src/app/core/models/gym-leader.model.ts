import type { GymLeader, RunRegion } from './trainer-run.model';

/**
 * Arenaleiter rosters for the "Arenaleiter-Herausforderung" run mode. One region
 * per generation; Kanto, Johto, Hoenn, Sinnoh and Einall are authored so far.
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

/**
 * Johto uses each leader's Kampf-Dojo rematch team from HeartGold / SoulSilver
 * (source: pokewiki.de, each leader's page). Items as held there; Schwalboss'
 * Heiß-Orb and Kapilz' Toxik-Orb are left off because the orbs aren't modelled
 * (nor the Adrenalin / Aufheber abilities that would make them useful). Jens
 * really does field two Gengar.
 */
const JOHTO: RunRegion<GymLeader> = {
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

/**
 * Hoenn uses the first Schwarz 2 / Weiß 2 team of each leader — the PWT
 * "Hoenn-Arenaleiterturnier" (source: pokewiki.de, each leader's page). That
 * tournament fields Juan (not Wassili) for Xeneroville, and Ben and Svenja as
 * two separate entrants: they're fought back to back for the one Mentalorden.
 * Six Pokémon each, holding their PWT items; abilities aren't modelled.
 */
const HOENN: RunRegion<GymLeader> = {
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

/**
 * Sinnoh uses the first Schwarz 2 / Weiß 2 team of each leader — the PWT
 * "Sinnoh-Arenaleiterturnier" (source: pokewiki.de, each leader's page), in
 * badge-case order. Six Pokémon each, holding their PWT items; abilities aren't modelled.
 */
const SINNOH: RunRegion<GymLeader> = {
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

/**
 * Einall uses the first Schwarz 2 / Weiß 2 team of each leader — the PWT
 * "Einall-Arenaleiterturnier" (source: pokewiki.de, each leader's page), in
 * Schwarz / Weiß badge order. Orion City is fixed to Maik (not Benny or Colin),
 * and Twindrake City fields Lysander: Lilia isn't in that tournament. Six
 * Pokémon each, holding their PWT items; abilities aren't modelled.
 */
const EINALL: RunRegion<GymLeader> = {
  id: 'einall',
  gen: 5,
  label: 'Einall (Gen 5)',
  available: true,
  members: [
    {
      trainerId: 'chili',
      name: 'Maik',
      title: 'Arenaleiter von Orion City',
      badge: 'Triorden',
      type: 'Fire',
      team: [
        {
          speciesNum: 514, speciesId: 'simisear', name: 'Grillchita', types: ['Fire'],
          moves: ['heatwave', 'lowkick', 'rockslide', 'workup'],
          item: 'firegem'
        },
        {
          speciesNum: 323, speciesId: 'camerupt', name: 'Camerupt', types: ['Fire', 'Ground'],
          moves: ['lavaplume', 'earthpower', 'yawn', 'stockpile'],
          item: 'passhoberry'
        },
        {
          speciesNum: 631, speciesId: 'heatmor', name: 'Furnifraß', types: ['Fire'],
          moves: ['heatwave', 'suckerpunch', 'focusblast', 'stockpile'],
          item: 'salacberry'
        },
        {
          speciesNum: 555, speciesId: 'darmanitan', name: 'Flampivian', types: ['Fire'],
          moves: ['flareblitz', 'hammerarm', 'rockslide', 'uturn'],
          item: 'fightinggem'
        },
        {
          speciesNum: 59, speciesId: 'arcanine', name: 'Arkani', types: ['Fire'],
          moves: ['fireblast', 'dragonpulse', 'solarbeam', 'sunnyday'],
          item: 'dragongem'
        },
        {
          speciesNum: 467, speciesId: 'magmortar', name: 'Magbrant', types: ['Fire'],
          moves: ['flamecharge', 'rockslide', 'psychic', 'thunderbolt'],
          item: 'petayaberry'
        }
      ]
    },
    {
      trainerId: 'lenora',
      name: 'Aloe',
      title: 'Arenaleiterin von Septerna City',
      badge: 'Grundorden',
      type: 'Normal',
      team: [
        {
          speciesNum: 505, speciesId: 'watchog', name: 'Kukmarda', types: ['Normal'],
          moves: ['superfang', 'lowkick', 'confuseray', 'hypnosis'],
          item: 'salacberry'
        },
        {
          speciesNum: 531, speciesId: 'audino', name: 'Ohrdoch', types: ['Normal'],
          moves: ['fireblast', 'blizzard', 'thunder', 'calmmind'],
          item: 'sitrusberry'
        },
        {
          speciesNum: 36, speciesId: 'clefable', name: 'Pixi', types: ['Fairy'],
          moves: ['meteormash', 'thunderpunch', 'wish', 'cosmicpower'],
          item: 'steelgem'
        },
        {
          speciesNum: 586, speciesId: 'sawsbuck', name: 'Kronjuwild', types: ['Normal', 'Grass'],
          moves: ['retaliate', 'hornleech', 'wildcharge', 'jumpkick'],
          item: 'liechiberry'
        },
        {
          speciesNum: 115, speciesId: 'kangaskhan', name: 'Kangama', types: ['Normal'],
          moves: ['fakeout', 'outrage', 'hammerarm', 'aquatail'],
          item: 'chopleberry'
        },
        {
          speciesNum: 206, speciesId: 'dunsparce', name: 'Dummisel', types: ['Normal'],
          moves: ['rockslide', 'coil', 'roost', 'glare'],
          item: 'apicotberry'
        }
      ]
    },
    {
      trainerId: 'burgh',
      name: 'Artie',
      title: 'Arenaleiter von Stratos City',
      badge: 'Käferorden',
      type: 'Bug',
      team: [
        {
          speciesNum: 542, speciesId: 'leavanny', name: 'Matrifol', types: ['Bug', 'Grass'],
          moves: ['xscissor', 'leafblade', 'aerialace', 'swordsdance'],
          item: 'cobaberry'
        },
        {
          speciesNum: 416, speciesId: 'vespiquen', name: 'Honweisel', types: ['Bug', 'Flying'],
          moves: ['attackorder', 'defendorder', 'roost', 'toxic'],
          item: 'apicotberry'
        },
        {
          speciesNum: 558, speciesId: 'crustle', name: 'Castellith', types: ['Bug', 'Rock'],
          moves: ['xscissor', 'rockslide', 'earthquake', 'shellsmash'],
          item: 'salacberry'
        },
        {
          speciesNum: 589, speciesId: 'escavalier', name: 'Cavalanzas', types: ['Bug', 'Steel'],
          moves: ['megahorn', 'ironhead', 'poisonjab', 'swordsdance'],
          item: 'occaberry'
        },
        {
          speciesNum: 617, speciesId: 'accelgor', name: 'Hydragil', types: ['Bug'],
          moves: ['bugbuzz', 'spikes', 'focusblast', 'guardsplit'],
          item: 'petayaberry'
        },
        {
          speciesNum: 632, speciesId: 'durant', name: 'Fermicula', types: ['Bug', 'Steel'],
          moves: ['xscissor', 'ironhead', 'rockslide', 'honeclaws'],
          item: 'liechiberry'
        }
      ]
    },
    {
      trainerId: 'elesa',
      name: 'Kamilla',
      title: 'Arenaleiterin von Rayono City',
      badge: 'Voltorden',
      type: 'Electric',
      team: [
        {
          speciesNum: 523, speciesId: 'zebstrika', name: 'Zebritz', types: ['Electric'],
          moves: ['wildcharge', 'flamecharge', 'thrash', 'mefirst'],
          item: 'liechiberry'
        },
        {
          speciesNum: 181, speciesId: 'ampharos', name: 'Ampharos', types: ['Electric'],
          moves: ['discharge', 'signalbeam', 'powergem', 'cottonguard'],
          item: 'shucaberry'
        },
        {
          speciesNum: 596, speciesId: 'galvantula', name: 'Voltula', types: ['Bug', 'Electric'],
          moves: ['thunder', 'energyball', 'bugbuzz', 'disable'],
          item: 'sitrusberry'
        },
        {
          speciesNum: 587, speciesId: 'emolga', name: 'Emolga', types: ['Electric', 'Flying'],
          moves: ['voltswitch', 'acrobatics', 'attract', 'thunderwave'],
          item: 'flyinggem'
        },
        {
          speciesNum: 604, speciesId: 'eelektross', name: 'Zapplarang', types: ['Electric'],
          moves: ['zapcannon', 'flamethrower', 'dragonclaw', 'coil'],
          item: 'salacberry'
        },
        {
          speciesNum: 618, speciesId: 'stunfisk', name: 'Flunschlik', types: ['Ground', 'Electric'],
          moves: ['discharge', 'earthpower', 'muddywater', 'stoneedge'],
          item: 'petayaberry'
        }
      ]
    },
    {
      trainerId: 'clay',
      name: 'Turner',
      title: 'Arenaleiter von Marea City',
      badge: 'Seismo-Orden',
      type: 'Ground',
      team: [
        {
          speciesNum: 530, speciesId: 'excadrill', name: 'Stalobor', types: ['Ground', 'Steel'],
          moves: ['drillrun', 'rockslide', 'submission', 'swordsdance'],
          item: 'liechiberry'
        },
        {
          speciesNum: 344, speciesId: 'claydol', name: 'Lepumentas', types: ['Ground', 'Psychic'],
          moves: ['earthpower', 'psychic', 'cosmicpower', 'sandstorm'],
          item: 'ganlonberry'
        },
        {
          speciesNum: 553, speciesId: 'krookodile', name: 'Rabigator', types: ['Ground', 'Dark'],
          moves: ['earthquake', 'crunch', 'outrage', 'rockslide'],
          item: 'chopleberry'
        },
        {
          speciesNum: 537, speciesId: 'seismitoad', name: 'Branawarz', types: ['Water', 'Ground'],
          moves: ['earthpower', 'muddywater', 'drainpunch', 'icepunch'],
          item: 'rindoberry'
        },
        {
          speciesNum: 473, speciesId: 'mamoswine', name: 'Mamutel', types: ['Ice', 'Ground'],
          moves: ['earthquake', 'iceshard', 'stoneedge', 'sandstorm'],
          item: 'icegem'
        },
        {
          speciesNum: 623, speciesId: 'golurk', name: 'Golgantes', types: ['Ground', 'Ghost'],
          moves: ['earthquake', 'shadowpunch', 'stoneedge', 'hammerarm'],
          item: 'ghostgem'
        }
      ]
    },
    {
      trainerId: 'skyla',
      name: 'Géraldine',
      title: 'Arenaleiterin von Panaero City',
      badge: 'Jetorden',
      type: 'Flying',
      team: [
        {
          speciesNum: 581, speciesId: 'swanna', name: 'Swaroness', types: ['Water', 'Flying'],
          moves: ['hurricane', 'scald', 'icebeam', 'tailwind'],
          item: 'wacanberry'
        },
        {
          speciesNum: 521, speciesId: 'unfezant', name: 'Fasasnob', types: ['Normal', 'Flying'],
          moves: ['airslash', 'uturn', 'gigaimpact', 'hypnosis'],
          item: 'liechiberry'
        },
        {
          speciesNum: 528, speciesId: 'swoobat', name: 'Fletiamo', types: ['Psychic', 'Flying'],
          moves: ['airslash', 'psychic', 'attract', 'calmmind'],
          item: 'petayaberry'
        },
        {
          speciesNum: 630, speciesId: 'mandibuzz', name: 'Grypheldis', types: ['Dark', 'Flying'],
          moves: ['bravebird', 'toxic', 'doubleteam', 'roost'],
          item: 'apicotberry'
        },
        {
          speciesNum: 567, speciesId: 'archeops', name: 'Aeropteryx', types: ['Rock', 'Flying'],
          moves: ['acrobatics', 'stoneedge', 'earthquake', 'dragonclaw'],
          item: 'flyinggem'
        },
        {
          speciesNum: 628, speciesId: 'braviary', name: 'Washakwil', types: ['Normal', 'Flying'],
          moves: ['bravebird', 'rockslide', 'crushclaw', 'bulkup'],
          item: 'normalgem'
        }
      ]
    },
    {
      trainerId: 'brycen',
      name: 'Sandro',
      title: 'Arenaleiter von Nevaio City',
      badge: 'Eiszapforden',
      type: 'Ice',
      team: [
        {
          speciesNum: 615, speciesId: 'cryogonal', name: 'Frigometri', types: ['Ice'],
          moves: ['blizzard', 'flashcannon', 'confuseray', 'doubleteam'],
          item: 'petayaberry'
        },
        {
          speciesNum: 614, speciesId: 'beartic', name: 'Siberio', types: ['Ice'],
          moves: ['iciclecrash', 'superpower', 'rockslide', 'bulkup'],
          item: 'liechiberry'
        },
        {
          speciesNum: 584, speciesId: 'vanilluxe', name: 'Gelatwino', types: ['Ice'],
          moves: ['blizzard', 'flashcannon', 'weatherball', 'hail'],
          item: 'occaberry'
        },
        {
          speciesNum: 461, speciesId: 'weavile', name: 'Snibunna', types: ['Dark', 'Ice'],
          moves: ['icepunch', 'shadowclaw', 'lowkick', 'swordsdance'],
          item: 'chopleberry'
        },
        {
          speciesNum: 87, speciesId: 'dewgong', name: 'Jugong', types: ['Water', 'Ice'],
          moves: ['frostbreath', 'brine', 'signalbeam', 'stockpile'],
          item: 'wacanberry'
        },
        {
          speciesNum: 365, speciesId: 'walrein', name: 'Walraisa', types: ['Ice', 'Water'],
          moves: ['frostbreath', 'surf', 'superfang', 'yawn'],
          item: 'salacberry'
        }
      ]
    },
    {
      trainerId: 'drayden',
      name: 'Lysander',
      title: 'Arenaleiter von Twindrake City',
      badge: 'Legendenorden',
      type: 'Dragon',
      team: [
        {
          speciesNum: 612, speciesId: 'haxorus', name: 'Maxax', types: ['Dragon'],
          moves: ['outrage', 'earthquake', 'brickbreak', 'dragondance'],
          item: 'dragongem'
        },
        {
          speciesNum: 621, speciesId: 'druddigon', name: 'Shardrago', types: ['Dragon'],
          moves: ['outrage', 'firefang', 'suckerpunch', 'glare'],
          item: 'salacberry'
        },
        {
          speciesNum: 635, speciesId: 'hydreigon', name: 'Trikephalo', types: ['Dark', 'Dragon'],
          moves: ['dragonpulse', 'darkpulse', 'fireblast', 'focusblast'],
          item: 'petayaberry'
        },
        {
          speciesNum: 330, speciesId: 'flygon', name: 'Libelldra', types: ['Ground', 'Dragon'],
          moves: ['outrage', 'earthpower', 'flamethrower', 'stoneedge'],
          item: 'liechiberry'
        },
        {
          speciesNum: 334, speciesId: 'altaria', name: 'Altaria', types: ['Dragon', 'Flying'],
          moves: ['outrage', 'roost', 'dragondance', 'cottonguard'],
          item: 'apicotberry'
        },
        {
          speciesNum: 373, speciesId: 'salamence', name: 'Brutalanda', types: ['Dragon', 'Flying'],
          moves: ['dragonrush', 'thunderfang', 'fireblast', 'honeclaws'],
          item: 'yacheberry'
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
  JOHTO,
  HOENN,
  SINNOH,
  EINALL,
  upcoming('kalos', 6, 'Kalos (Gen 6)')
];

export function gymRegion(id: string): RunRegion<GymLeader> | undefined {
  return GYM_REGIONS.find((r) => r.id === id);
}
