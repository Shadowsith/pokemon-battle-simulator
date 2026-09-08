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

/**
 * Johto Top Four, Vierte Generation (HeartGold / SoulSilver) **rematch** teams.
 * Six Pokémon each; held items and abilities aren't modelled, so only species +
 * movesets carry over. Two-turn moves (Fly) and recharge moves resolve through
 * the battle engine as normal.
 */
const JOHTO: EliteFourRegion = {
  id: 'johto',
  gen: 2,
  label: 'Johto (Gen 2)',
  available: true,
  members: [
    {
      trainerId: 'will',
      name: 'Willi',
      title: 'Meister der Psycho-Pokémon',
      team: [
        {
          speciesNum: 437, speciesId: 'bronzong', name: 'Bronzong', types: ['Steel', 'Psychic'],
          moves: ['payback', 'psychic', 'gravity', 'reflect']
        },
        {
          speciesNum: 124, speciesId: 'jynx', name: 'Rossana', types: ['Ice', 'Psychic'],
          moves: ['dreameater', 'lovelykiss', 'blizzard', 'faketears']
        },
        {
          speciesNum: 326, speciesId: 'grumpig', name: 'Groink', types: ['Psychic'],
          moves: ['confuseray', 'psychic', 'powergem', 'signalbeam']
        },
        {
          speciesNum: 199, speciesId: 'slowking', name: 'Lahmus', types: ['Water', 'Psychic'],
          moves: ['amnesia', 'psychic', 'bodyslam', 'curse']
        },
        {
          speciesNum: 282, speciesId: 'gardevoir', name: 'Guardevoir', types: ['Psychic'],
          moves: ['chargebeam', 'psychic', 'focusblast', 'calmmind']
        },
        {
          speciesNum: 178, speciesId: 'xatu', name: 'Xatu', types: ['Psychic', 'Flying'],
          moves: ['psychic', 'confuseray', 'shadowball', 'quickattack']
        }
      ]
    },
    {
      trainerId: 'koga',
      name: 'Koga',
      title: 'Meister der Gift-Pokémon',
      team: [
        {
          speciesNum: 435, speciesId: 'skuntank', name: 'Skuntank', types: ['Poison', 'Dark'],
          moves: ['explosion', 'toxic', 'dig', 'suckerpunch']
        },
        {
          speciesNum: 454, speciesId: 'toxicroak', name: 'Toxiquak', types: ['Poison', 'Fighting'],
          moves: ['xscissor', 'swagger', 'gunkshot', 'crosschop']
        },
        {
          speciesNum: 317, speciesId: 'swalot', name: 'Schlukwech', types: ['Poison'],
          moves: ['amnesia', 'sludgebomb', 'yawn', 'painsplit']
        },
        {
          speciesNum: 89, speciesId: 'muk', name: 'Sleimok', types: ['Poison'],
          moves: ['toxic', 'swagger', 'minimize', 'screech']
        },
        {
          speciesNum: 49, speciesId: 'venomoth', name: 'Omot', types: ['Bug', 'Poison'],
          moves: ['silverwind', 'doubleteam', 'psychic', 'batonpass']
        },
        {
          speciesNum: 169, speciesId: 'crobat', name: 'Iksbat', types: ['Poison', 'Flying'],
          moves: ['fly', 'meanlook', 'poisonfang', 'toxic']
        }
      ]
    },
    {
      trainerId: 'bruno',
      name: 'Bruno',
      title: 'Meister der Kampf-Pokémon',
      team: [
        {
          speciesNum: 237, speciesId: 'hitmontop', name: 'Kapoera', types: ['Fighting'],
          moves: ['earthquake', 'counter', 'quickattack', 'closecombat']
        },
        {
          speciesNum: 107, speciesId: 'hitmonchan', name: 'Nockchan', types: ['Fighting'],
          moves: ['substitute', 'bulletpunch', 'drainpunch', 'closecombat']
        },
        {
          speciesNum: 106, speciesId: 'hitmonlee', name: 'Kicklee', types: ['Fighting'],
          moves: ['closecombat', 'swagger', 'blazekick', 'revenge']
        },
        {
          speciesNum: 297, speciesId: 'hariyama', name: 'Hariyama', types: ['Fighting'],
          moves: ['payback', 'lowkick', 'bulkup', 'bulletpunch']
        },
        {
          speciesNum: 448, speciesId: 'lucario', name: 'Lucario', types: ['Fighting', 'Steel'],
          moves: ['irontail', 'counter', 'closecombat', 'extremespeed']
        },
        {
          speciesNum: 68, speciesId: 'machamp', name: 'Machomei', types: ['Fighting'],
          moves: ['stoneedge', 'hammerarm', 'bulletpunch', 'crosschop']
        }
      ]
    },
    {
      trainerId: 'karen',
      name: 'Melanie',
      title: 'Meisterin der Unlicht-Pokémon',
      team: [
        {
          speciesNum: 461, speciesId: 'weavile', name: 'Snibunna', types: ['Dark', 'Ice'],
          moves: ['icepunch', 'lowkick', 'nightslash', 'iceshard']
        },
        {
          speciesNum: 430, speciesId: 'honchkrow', name: 'Kramshef', types: ['Dark', 'Flying'],
          moves: ['thunderwave', 'drillpeck', 'whirlwind', 'suckerpunch']
        },
        {
          speciesNum: 442, speciesId: 'spiritomb', name: 'Kryppuk', types: ['Ghost', 'Dark'],
          moves: ['curse', 'confuseray', 'painsplit', 'suckerpunch']
        },
        {
          speciesNum: 197, speciesId: 'umbreon', name: 'Nachtara', types: ['Dark'],
          moves: ['curse', 'payback', 'confuseray', 'suckerpunch']
        },
        {
          speciesNum: 229, speciesId: 'houndoom', name: 'Hundemon', types: ['Dark', 'Fire'],
          moves: ['flamethrower', 'nastyplot', 'darkpulse', 'sludgebomb']
        },
        {
          speciesNum: 359, speciesId: 'absol', name: 'Absol', types: ['Dark'],
          moves: ['detect', 'nightslash', 'perishsong', 'psychocut']
        }
      ]
    }
  ]
};

/**
 * Hoenn Top Four, Pokémon Smaragd (Emerald) teams. Five Pokémon each; held
 * items and abilities aren't modelled. Two-turn / recharge moves resolve
 * through the battle engine as normal.
 */
const HOENN: EliteFourRegion = {
  id: 'hoenn',
  gen: 3,
  label: 'Hoenn (Gen 3)',
  available: true,
  members: [
    {
      trainerId: 'sidney-gen3',
      name: 'Ulrich',
      title: 'Meister der Unlicht-Pokémon',
      team: [
        {
          speciesNum: 262, speciesId: 'mightyena', name: 'Magnayen', types: ['Dark'],
          moves: ['takedown', 'sandattack', 'roar', 'crunch']
        },
        {
          speciesNum: 275, speciesId: 'shiftry', name: 'Tengulist', types: ['Grass', 'Dark'],
          moves: ['extrasensory', 'doubleteam', 'swagger', 'torment']
        },
        {
          speciesNum: 332, speciesId: 'cacturne', name: 'Noktuska', types: ['Grass', 'Dark'],
          moves: ['feintattack', 'needlearm', 'leechseed', 'cottonspore']
        },
        {
          speciesNum: 342, speciesId: 'crawdaunt', name: 'Krebutack', types: ['Water', 'Dark'],
          moves: ['surf', 'swordsdance', 'facade', 'strength']
        },
        {
          speciesNum: 359, speciesId: 'absol', name: 'Absol', types: ['Dark'],
          moves: ['aerialace', 'swordsdance', 'rockslide', 'slash']
        }
      ]
    },
    {
      trainerId: 'phoebe-gen3',
      name: 'Antonia',
      title: 'Meisterin der Geist-Pokémon',
      team: [
        {
          speciesNum: 356, speciesId: 'dusclops', name: 'Zwirrklop', types: ['Ghost'],
          moves: ['protect', 'curse', 'confuseray', 'shadowpunch']
        },
        {
          speciesNum: 354, speciesId: 'banette', name: 'Banette', types: ['Ghost'],
          moves: ['grudge', 'willowisp', 'shadowball', 'feintattack']
        },
        {
          speciesNum: 302, speciesId: 'sableye', name: 'Zobiris', types: ['Dark', 'Ghost'],
          moves: ['feintattack', 'shadowball', 'doubleteam', 'nightshade']
        },
        {
          speciesNum: 354, speciesId: 'banette', name: 'Banette', types: ['Ghost'],
          moves: ['psychic', 'thunderbolt', 'shadowball', 'facade']
        },
        {
          speciesNum: 356, speciesId: 'dusclops', name: 'Zwirrklop', types: ['Ghost'],
          moves: ['icebeam', 'shadowball', 'rockslide', 'earthquake']
        }
      ]
    },
    {
      trainerId: 'glacia-gen3',
      name: 'Frosina',
      title: 'Meisterin der Eis-Pokémon',
      team: [
        {
          speciesNum: 364, speciesId: 'sealeo', name: 'Seejong', types: ['Ice', 'Water'],
          moves: ['encore', 'iceball', 'hail', 'bodyslam']
        },
        {
          speciesNum: 362, speciesId: 'glalie', name: 'Firnontor', types: ['Ice'],
          moves: ['lightscreen', 'icywind', 'icebeam', 'crunch']
        },
        {
          speciesNum: 364, speciesId: 'sealeo', name: 'Seejong', types: ['Ice', 'Water'],
          moves: ['takedown', 'blizzard', 'hail', 'attract']
        },
        {
          speciesNum: 362, speciesId: 'glalie', name: 'Firnontor', types: ['Ice'],
          moves: ['shadowball', 'hail', 'icebeam', 'explosion']
        },
        {
          speciesNum: 365, speciesId: 'walrein', name: 'Walraisa', types: ['Ice', 'Water'],
          moves: ['surf', 'icebeam', 'sheercold', 'bodyslam']
        }
      ]
    },
    {
      trainerId: 'drake-gen3',
      name: 'Dragan',
      title: 'Meister der Drachen-Pokémon',
      team: [
        {
          speciesNum: 371, speciesId: 'bagon', name: 'Draschel', types: ['Dragon'],
          moves: ['dragonclaw', 'rocktomb', 'protect', 'takedown']
        },
        {
          speciesNum: 334, speciesId: 'altaria', name: 'Altaria', types: ['Dragon', 'Flying'],
          moves: ['dragonbreath', 'aerialace', 'doubleedge', 'dragondance']
        },
        {
          speciesNum: 230, speciesId: 'kingdra', name: 'Seedraking', types: ['Water', 'Dragon'],
          moves: ['surf', 'bodyslam', 'smokescreen', 'dragondance']
        },
        {
          speciesNum: 330, speciesId: 'flygon', name: 'Libelldra', types: ['Ground', 'Dragon'],
          moves: ['flamethrower', 'earthquake', 'crunch', 'dragonbreath']
        },
        {
          speciesNum: 373, speciesId: 'salamence', name: 'Brutalanda', types: ['Dragon', 'Flying'],
          moves: ['flamethrower', 'dragonclaw', 'crunch', 'rockslide']
        }
      ]
    }
  ]
};

/**
 * Sinnoh Top Four, Strahlender Diamant / Leuchtende Perle (Brilliant Diamond /
 * Shining Pearl) — rematch stage "Nach dem Fang von Heatran". Aaron / Bertha /
 * Flint field six each; Lucian's entry on the source is his five-Pokémon set.
 * Held items and abilities aren't modelled; Rock Wrecker / Solar Beam resolve
 * through the engine's recharge / two-turn handling. Play Rough (post-Gen 5) is
 * not in MOVE_LIBRARY, so Flint's Arcanine uses Crunch in that slot.
 */
const SINNOH: EliteFourRegion = {
  id: 'sinnoh',
  gen: 4,
  label: 'Sinnoh (Gen 4)',
  available: true,
  members: [
    {
      trainerId: 'aaron',
      name: 'Herbaro',
      title: 'Meister der Käfer-Pokémon',
      team: [
        {
          speciesNum: 469, speciesId: 'yanmega', name: 'Yanmega', types: ['Bug', 'Flying'],
          moves: ['bugbuzz', 'airslash', 'detect', 'ancientpower']
        },
        {
          speciesNum: 212, speciesId: 'scizor', name: 'Scherox', types: ['Bug', 'Steel'],
          moves: ['bulletpunch', 'xscissor', 'nightslash', 'swordsdance']
        },
        {
          speciesNum: 416, speciesId: 'vespiquen', name: 'Honweisel', types: ['Bug', 'Flying'],
          moves: ['powergem', 'attackorder', 'aerialace', 'defendorder']
        },
        {
          speciesNum: 214, speciesId: 'heracross', name: 'Skaraborn', types: ['Bug', 'Fighting'],
          moves: ['earthquake', 'rockslide', 'facade', 'closecombat']
        },
        {
          speciesNum: 330, speciesId: 'flygon', name: 'Libelldra', types: ['Ground', 'Dragon'],
          moves: ['dragonpulse', 'earthpower', 'sonicboom', 'bugbuzz']
        },
        {
          speciesNum: 452, speciesId: 'drapion', name: 'Piondragi', types: ['Poison', 'Dark'],
          moves: ['poisonfang', 'nightslash', 'earthquake', 'xscissor']
        }
      ]
    },
    {
      trainerId: 'bertha',
      name: 'Teresa',
      title: 'Meisterin der Boden-Pokémon',
      team: [
        {
          speciesNum: 340, speciesId: 'whiscash', name: 'Welsar', types: ['Water', 'Ground'],
          moves: ['earthquake', 'icebeam', 'scald', 'zenheadbutt']
        },
        {
          speciesNum: 472, speciesId: 'gliscor', name: 'Skorgro', types: ['Ground', 'Flying'],
          moves: ['earthquake', 'thunderfang', 'guillotine', 'xscissor']
        },
        {
          speciesNum: 34, speciesId: 'nidoking', name: 'Nidoking', types: ['Poison', 'Ground'],
          moves: ['sludgebomb', 'earthpower', 'thunderbolt', 'icebeam']
        },
        {
          speciesNum: 450, speciesId: 'hippowdon', name: 'Hippoterus', types: ['Ground'],
          moves: ['icefang', 'earthquake', 'crunch', 'rest']
        },
        {
          speciesNum: 473, speciesId: 'mamoswine', name: 'Mamutel', types: ['Ice', 'Ground'],
          moves: ['earthquake', 'iciclespear', 'iceshard', 'takedown']
        },
        {
          speciesNum: 464, speciesId: 'rhyperior', name: 'Rihornior', types: ['Ground', 'Rock'],
          moves: ['earthquake', 'rockwrecker', 'megahorn', 'thunderfang']
        }
      ]
    },
    {
      trainerId: 'flint',
      name: 'Ignaz',
      title: 'Meister der Feuer-Pokémon',
      team: [
        {
          speciesNum: 38, speciesId: 'ninetales', name: 'Vulnona', types: ['Fire'],
          moves: ['flamethrower', 'solarbeam', 'hypnosis', 'nastyplot']
        },
        {
          speciesNum: 229, speciesId: 'houndoom', name: 'Hundemon', types: ['Dark', 'Fire'],
          moves: ['flamethrower', 'darkpulse', 'destinybond', 'nastyplot']
        },
        {
          speciesNum: 78, speciesId: 'rapidash', name: 'Gallopa', types: ['Fire'],
          moves: ['flareblitz', 'irontail', 'poisonjab', 'hypnosis']
        },
        {
          speciesNum: 392, speciesId: 'infernape', name: 'Panferno', types: ['Fire', 'Fighting'],
          moves: ['firepunch', 'thunderpunch', 'closecombat', 'machpunch']
        },
        {
          speciesNum: 59, speciesId: 'arcanine', name: 'Arkani', types: ['Fire'],
          moves: ['flareblitz', 'crunch', 'closecombat', 'extremespeed']
        },
        {
          speciesNum: 467, speciesId: 'magmortar', name: 'Magbrant', types: ['Fire'],
          moves: ['fireblast', 'thunderbolt', 'focusblast', 'psychic']
        }
      ]
    },
    {
      trainerId: 'lucian',
      name: 'Lucian',
      title: 'Meister der Psycho-Pokémon',
      team: [
        {
          speciesNum: 122, speciesId: 'mrmime', name: 'Pantimos', types: ['Psychic'],
          moves: ['psychic', 'lightscreen', 'reflect', 'thunderbolt']
        },
        {
          speciesNum: 203, speciesId: 'girafarig', name: 'Girafarig', types: ['Normal', 'Psychic'],
          moves: ['psychic', 'doublehit', 'shadowball', 'crunch']
        },
        {
          speciesNum: 308, speciesId: 'medicham', name: 'Meditalis', types: ['Fighting', 'Psychic'],
          moves: ['drainpunch', 'icepunch', 'firepunch', 'thunderpunch']
        },
        {
          speciesNum: 65, speciesId: 'alakazam', name: 'Simsala', types: ['Psychic'],
          moves: ['psychic', 'focusblast', 'recover', 'energyball']
        },
        {
          speciesNum: 437, speciesId: 'bronzong', name: 'Bronzong', types: ['Steel', 'Psychic'],
          moves: ['psychic', 'gyroball', 'calmmind', 'earthquake']
        }
      ]
    }
  ]
};

/**
 * Einall (Unova) Top Four, Pokémon Schwarz / Weiß (Black / White) — "Runde 2"
 * rematch teams (post-National-Pokédex), NOT the Schwarz 2 / Weiß 2 versions.
 * Six Pokémon each; held items and abilities aren't modelled. Giga Impact
 * resolves through the engine's recharge handling.
 */
const EINALL: EliteFourRegion = {
  id: 'einall',
  gen: 5,
  label: 'Einall (Gen 5)',
  available: true,
  members: [
    {
      trainerId: 'shauntal',
      name: 'Anissa',
      title: 'Meisterin der Geist-Pokémon',
      team: [
        {
          speciesNum: 563, speciesId: 'cofagrigus', name: 'Echnatoll', types: ['Ghost'],
          moves: ['shadowball', 'willowisp', 'psychic', 'energyball']
        },
        {
          speciesNum: 593, speciesId: 'jellicent', name: 'Apoquallyp', types: ['Water', 'Ghost'],
          moves: ['sludgewave', 'hydropump', 'psychic', 'shadowball']
        },
        {
          speciesNum: 623, speciesId: 'golurk', name: 'Golgantes', types: ['Ground', 'Ghost'],
          moves: ['hammerarm', 'earthquake', 'shadowpunch', 'curse']
        },
        {
          speciesNum: 478, speciesId: 'froslass', name: 'Frosdedje', types: ['Ice', 'Ghost'],
          moves: ['blizzard', 'iceshard', 'shadowball', 'psychic']
        },
        {
          speciesNum: 426, speciesId: 'drifblim', name: 'Drifzepeli', types: ['Ghost', 'Flying'],
          moves: ['thunder', 'shadowball', 'acrobatics', 'psychic']
        },
        {
          speciesNum: 609, speciesId: 'chandelure', name: 'Skelabra', types: ['Ghost', 'Fire'],
          moves: ['fireblast', 'psychic', 'shadowball', 'payback']
        }
      ]
    },
    {
      trainerId: 'grimsley',
      name: 'Astor',
      title: 'Meister der Unlicht-Pokémon',
      team: [
        {
          speciesNum: 319, speciesId: 'sharpedo', name: 'Tohaido', types: ['Water', 'Dark'],
          moves: ['waterfall', 'nightslash', 'earthquake', 'aquajet']
        },
        {
          speciesNum: 560, speciesId: 'scrafty', name: 'Irokex', types: ['Dark', 'Fighting'],
          moves: ['crunch', 'poisonjab', 'headsmash', 'brickbreak']
        },
        {
          speciesNum: 553, speciesId: 'krookodile', name: 'Rabigator', types: ['Ground', 'Dark'],
          moves: ['outrage', 'earthquake', 'foulplay', 'smackdown']
        },
        {
          speciesNum: 510, speciesId: 'liepard', name: 'Kleoparda', types: ['Dark'],
          moves: ['suckerpunch', 'fakeout', 'aerialace', 'attract']
        },
        {
          speciesNum: 452, speciesId: 'drapion', name: 'Piondragi', types: ['Poison', 'Dark'],
          moves: ['poisonfang', 'firefang', 'crunch', 'thunderfang']
        },
        {
          speciesNum: 625, speciesId: 'bisharp', name: 'Caesurio', types: ['Dark', 'Steel'],
          moves: ['xscissor', 'nightslash', 'aerialace', 'guillotine']
        }
      ]
    },
    {
      trainerId: 'caitlin',
      name: 'Kattlea',
      title: 'Meisterin der Psycho-Pokémon',
      team: [
        {
          speciesNum: 518, speciesId: 'musharna', name: 'Somnivora', types: ['Psychic'],
          moves: ['reflect', 'hypnosis', 'dreameater', 'psychic']
        },
        {
          speciesNum: 561, speciesId: 'sigilyph', name: 'Symvolara', types: ['Psychic', 'Flying'],
          moves: ['flashcannon', 'icebeam', 'airslash', 'psychic']
        },
        {
          speciesNum: 579, speciesId: 'reuniclus', name: 'Zytomega', types: ['Psychic'],
          moves: ['energyball', 'thunder', 'focusblast', 'psychic']
        },
        {
          speciesNum: 576, speciesId: 'gothitelle', name: 'Morbitesse', types: ['Psychic'],
          moves: ['flatter', 'payback', 'thunderbolt', 'psychic']
        },
        {
          speciesNum: 437, speciesId: 'bronzong', name: 'Bronzong', types: ['Steel', 'Psychic'],
          moves: ['payback', 'chargebeam', 'flashcannon', 'psychic']
        },
        {
          speciesNum: 376, speciesId: 'metagross', name: 'Metagross', types: ['Steel', 'Psychic'],
          moves: ['bulletpunch', 'earthquake', 'zenheadbutt', 'gigaimpact']
        }
      ]
    },
    {
      trainerId: 'marshal',
      name: 'Eugen',
      title: 'Meister der Kampf-Pokémon',
      team: [
        {
          speciesNum: 286, speciesId: 'breloom', name: 'Kapilz', types: ['Grass', 'Fighting'],
          moves: ['spore', 'skyuppercut', 'machpunch', 'grassknot']
        },
        {
          speciesNum: 538, speciesId: 'throh', name: 'Jiutai', types: ['Fighting'],
          moves: ['earthquake', 'superpower', 'retaliate', 'grassknot']
        },
        {
          speciesNum: 539, speciesId: 'sawk', name: 'Karadonis', types: ['Fighting'],
          moves: ['closecombat', 'stoneedge', 'poisonjab', 'retaliate']
        },
        {
          speciesNum: 620, speciesId: 'mienshao', name: 'Lin-Fu', types: ['Fighting'],
          moves: ['uturn', 'fakeout', 'acrobatics', 'highjumpkick']
        },
        {
          speciesNum: 454, speciesId: 'toxicroak', name: 'Toxiquak', types: ['Poison', 'Fighting'],
          moves: ['earthquake', 'toxic', 'venoshock', 'lowsweep']
        },
        {
          speciesNum: 534, speciesId: 'conkeldurr', name: 'Karok', types: ['Fighting'],
          moves: ['hammerarm', 'earthquake', 'stoneedge', 'payback']
        }
      ]
    }
  ]
};

export const ELITE_FOUR_REGIONS: EliteFourRegion[] = [
  KANTO,
  JOHTO,
  HOENN,
  SINNOH,
  EINALL
];

export function eliteFourRegion(id: string): EliteFourRegion | undefined {
  return ELITE_FOUR_REGIONS.find((r) => r.id === id);
}
