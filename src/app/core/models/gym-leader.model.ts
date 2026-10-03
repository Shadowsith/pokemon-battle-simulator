import type { GymLeader, RunRegion } from './trainer-run.model';

/**
 * Arenaleiter rosters for the "Arenaleiter-Herausforderung" run mode. One region
 * per generation; Kanto and Johto are authored so far.
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
          item: 'chestoberry'
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
          item: 'chestoberry'
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
          item: 'habanberry'
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

/** A region whose gym leaders aren't authored yet: listed, but not playable. */
function upcoming(id: string, gen: number, label: string): RunRegion<GymLeader> {
  return { id, gen, label, available: false, members: [] };
}

export const GYM_REGIONS: RunRegion<GymLeader>[] = [
  KANTO,
  JOHTO,
  upcoming('hoenn', 3, 'Hoenn (Gen 3)'),
  upcoming('sinnoh', 4, 'Sinnoh (Gen 4)'),
  upcoming('einall', 5, 'Einall (Gen 5)'),
  upcoming('kalos', 6, 'Kalos (Gen 6)')
];

export function gymRegion(id: string): RunRegion<GymLeader> | undefined {
  return GYM_REGIONS.find((r) => r.id === id);
}
