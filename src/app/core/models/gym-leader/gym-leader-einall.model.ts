import type { GymLeader, RunRegion } from '../trainer-run.model';

/**
 * Einall uses the first Schwarz 2 / Weiß 2 team of each leader — the PWT
 * "Einall-Arenaleiterturnier" (source: pokewiki.de, each leader's page), in
 * Schwarz / Weiß badge order. Orion City is fixed to Maik (not Benny or Colin),
 * and Twindrake City fields Lysander: Lilia isn't in that tournament. Six
 * Pokémon each, holding their PWT items; abilities aren't modelled.
 */
export const EINALL: RunRegion<GymLeader> = {
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
