import type { GymLeader, RunRegion } from '../trainer-run.model';

/**
 * Kalos has no PWT. Its core is each leader's X / Y Kampfschloss Pokémon (source:
 * pokewiki.de, each leader's page): every species they field across all ranks,
 * with the moveset of its highest-level entry. The Kampfschloss only gives them two
 * or three, so each team is filled up to six as described in
 * docs/kalos-gym-teams-concept.md — Gen 6 species of the leader's type first, then
 * fitting Gen 1-5 ones. Items are Gen 6-era (X / Y dropped the type gems).
 * Connie's Lucario carries Lucarionit in the Kampfschloss, but Mega Evolution isn't
 * modelled. Astrid's Psiaugon is female (Seher is a female-only move), which shares
 * typing and stats with the male form. Abilities aren't modelled.
 */
export const KALOS: RunRegion<GymLeader> = {
  id: 'kalos',
  gen: 6,
  label: 'Kalos (Gen 6)',
  available: true,
  members: [
    {
      trainerId: 'viola',
      name: 'Viola',
      title: 'Arenaleiterin von Nouvaria City',
      badge: 'Krabbelorden',
      type: 'Bug',
      team: [
        {
          speciesNum: 284, speciesId: 'masquerain', name: 'Maskeregen', types: ['Bug', 'Flying'],
          moves: ['quiverdance', 'airslash', 'bugbuzz', 'whirlwind'],
          item: 'chartiberry'
        },
        {
          speciesNum: 666, speciesId: 'vivillon', name: 'Vivillon', types: ['Bug', 'Flying'],
          moves: ['safeguard', 'quiverdance', 'powder', 'hurricane'],
          item: 'leftovers'
        },
        {
          speciesNum: 637, speciesId: 'volcarona', name: 'Ramoth', types: ['Bug', 'Fire'],
          moves: ['quiverdance', 'fierydance', 'bugbuzz', 'gigadrain'],
          item: 'lifeorb'
        },
        {
          speciesNum: 214, speciesId: 'heracross', name: 'Skaraborn', types: ['Bug', 'Fighting'],
          moves: ['megahorn', 'closecombat', 'stoneedge', 'earthquake'],
          item: 'choicescarf'
        },
        {
          speciesNum: 545, speciesId: 'scolipede', name: 'Cerapendra', types: ['Bug', 'Poison'],
          moves: ['megahorn', 'poisonjab', 'earthquake', 'swordsdance'],
          item: 'focussash'
        },
        {
          speciesNum: 596, speciesId: 'galvantula', name: 'Voltula', types: ['Bug', 'Electric'],
          moves: ['thunder', 'bugbuzz', 'gigadrain', 'voltswitch'],
          item: 'widelens'
        }
      ]
    },
    {
      trainerId: 'grant',
      name: 'Lino',
      title: 'Arenaleiter von Relievera City',
      badge: 'Wallorden',
      type: 'Rock',
      team: [
        {
          speciesNum: 699, speciesId: 'aurorus', name: 'Amagarga', types: ['Rock', 'Ice'],
          moves: ['encore', 'lightscreen', 'icebeam', 'hyperbeam'],
          item: 'leftovers'
        },
        {
          speciesNum: 697, speciesId: 'tyrantrum', name: 'Monargoras', types: ['Rock', 'Dragon'],
          moves: ['earthquake', 'horndrill', 'headsmash', 'rockslide'],
          item: 'lifeorb'
        },
        {
          speciesNum: 703, speciesId: 'carbink', name: 'Rocara', types: ['Rock', 'Fairy'],
          moves: ['powergem', 'moonblast', 'reflect', 'stealthrock'],
          item: 'rockyhelmet'
        },
        {
          speciesNum: 689, speciesId: 'barbaracle', name: 'Thanathora', types: ['Rock', 'Water'],
          moves: ['stoneedge', 'razorshell', 'crosschop', 'shellsmash'],
          item: 'whiteherb'
        },
        {
          speciesNum: 142, speciesId: 'aerodactyl', name: 'Aerodactyl', types: ['Rock', 'Flying'],
          moves: ['stoneedge', 'earthquake', 'crunch', 'ironhead'],
          item: 'focussash'
        },
        {
          speciesNum: 464, speciesId: 'rhyperior', name: 'Rihornior', types: ['Ground', 'Rock'],
          moves: ['rockwrecker', 'earthquake', 'megahorn', 'hammerarm'],
          item: 'assaultvest'
        }
      ]
    },
    {
      trainerId: 'korrina',
      name: 'Connie',
      title: 'Arenaleiterin von Yantara City',
      badge: 'Rauforden',
      type: 'Fighting',
      team: [
        {
          speciesNum: 701, speciesId: 'hawlucha', name: 'Resladero', types: ['Fighting', 'Flying'],
          moves: ['highjumpkick', 'skyattack', 'skydrop', 'swordsdance'],
          item: 'powerherb'
        },
        {
          speciesNum: 68, speciesId: 'machamp', name: 'Machomei', types: ['Fighting'],
          moves: ['dynamicpunch', 'scaryface', 'wakeupslap', 'crosschop'],
          item: 'widelens'
        },
        {
          speciesNum: 448, speciesId: 'lucario', name: 'Lucario', types: ['Fighting', 'Steel'],
          moves: ['healpulse', 'dragonpulse', 'extremespeed', 'closecombat'],
          item: 'lifeorb'
        },
        {
          speciesNum: 652, speciesId: 'chesnaught', name: 'Brigaron', types: ['Grass', 'Fighting'],
          moves: ['woodhammer', 'drainpunch', 'stoneedge', 'spikyshield'],
          item: 'rockyhelmet'
        },
        {
          speciesNum: 675, speciesId: 'pangoro', name: 'Pandagro', types: ['Fighting', 'Dark'],
          moves: ['hammerarm', 'crunch', 'stoneedge', 'partingshot'],
          item: 'roseliberry'
        },
        {
          speciesNum: 620, speciesId: 'mienshao', name: 'Wie-Shu', types: ['Fighting'],
          moves: ['highjumpkick', 'uturn', 'stoneedge', 'fakeout'],
          item: 'focussash'
        }
      ]
    },
    {
      trainerId: 'ramos',
      name: 'Amaro',
      title: 'Arenaleiter von Tempera City',
      badge: 'Blattorden',
      type: 'Grass',
      team: [
        {
          speciesNum: 189, speciesId: 'jumpluff', name: 'Papungha', types: ['Grass', 'Flying'],
          moves: ['worryseed', 'cottonspore', 'gigadrain', 'uturn'],
          item: 'sitrusberry'
        },
        {
          speciesNum: 673, speciesId: 'gogoat', name: 'Chevrumm', types: ['Grass'],
          moves: ['earthquake', 'leafblade', 'aerialace', 'milkdrink'],
          item: 'lumberry'
        },
        {
          speciesNum: 71, speciesId: 'victreebel', name: 'Sarzenia', types: ['Grass', 'Poison'],
          moves: ['leaftornado', 'razorleaf', 'leafstorm', 'leafblade'],
          item: 'whiteherb'
        },
        {
          speciesNum: 709, speciesId: 'trevenant', name: 'Trombork', types: ['Ghost', 'Grass'],
          moves: ['hornleech', 'shadowclaw', 'woodhammer', 'willowisp'],
          item: 'occaberry'
        },
        {
          speciesNum: 711, speciesId: 'gourgeist', name: 'Pumpdjinn', types: ['Ghost', 'Grass'],
          moves: ['seedbomb', 'phantomforce', 'leechseed', 'willowisp'],
          item: 'rockyhelmet'
        },
        {
          speciesNum: 598, speciesId: 'ferrothorn', name: 'Tentantel', types: ['Grass', 'Steel'],
          moves: ['powerwhip', 'gyroball', 'leechseed', 'spikes'],
          item: 'leftovers'
        }
      ]
    },
    {
      trainerId: 'clemont',
      name: 'Citro',
      title: 'Arenaleiter von Illumina City',
      badge: 'Ampere-Orden',
      type: 'Electric',
      team: [
        {
          speciesNum: 82, speciesId: 'magneton', name: 'Magneton', types: ['Electric', 'Steel'],
          moves: ['discharge', 'lockon', 'flashcannon', 'screech'],
          item: 'eviolite'
        },
        {
          speciesNum: 695, speciesId: 'heliolisk', name: 'Elezard', types: ['Electric', 'Normal'],
          moves: ['thunder', 'quickattack', 'paraboliccharge', 'charge'],
          item: 'expertbelt'
        },
        {
          speciesNum: 462, speciesId: 'magnezone', name: 'Magnezone', types: ['Electric', 'Steel'],
          moves: ['discharge', 'lockon', 'magnetrise', 'gyroball'],
          item: 'shucaberry'
        },
        {
          speciesNum: 702, speciesId: 'dedenne', name: 'Dedenne', types: ['Electric', 'Fairy'],
          moves: ['paraboliccharge', 'playrough', 'superfang', 'thunderwave'],
          item: 'sitrusberry'
        },
        {
          speciesNum: 587, speciesId: 'emolga', name: 'Emolga', types: ['Electric', 'Flying'],
          moves: ['thunderbolt', 'acrobatics', 'voltswitch', 'encore'],
          item: 'lumberry'
        },
        {
          speciesNum: 405, speciesId: 'luxray', name: 'Luxtra', types: ['Electric'],
          moves: ['wildcharge', 'crunch', 'icefang', 'firefang'],
          item: 'choiceband'
        }
      ]
    },
    {
      trainerId: 'valerie',
      name: 'Valerie',
      title: 'Arenaleiterin von Romantia City',
      badge: 'Feenorden',
      type: 'Fairy',
      team: [
        {
          speciesNum: 303, speciesId: 'mawile', name: 'Flunkifer', types: ['Steel', 'Fairy'],
          moves: ['playrough', 'ironhead', 'spitup', 'swallow'],
          item: 'occaberry'
        },
        {
          speciesNum: 700, speciesId: 'sylveon', name: 'Feelinara', types: ['Fairy'],
          moves: ['moonblast', 'lightscreen', 'lastresort', 'psychup'],
          item: 'leftovers'
        },
        {
          speciesNum: 671, speciesId: 'florges', name: 'Florges', types: ['Fairy'],
          moves: ['moonblast', 'petaldance', 'psychic', 'calmmind'],
          item: 'sitrusberry'
        },
        {
          speciesNum: 683, speciesId: 'aromatisse', name: 'Parfinesse', types: ['Fairy'],
          moves: ['moonblast', 'psychic', 'aromatherapy', 'trickroom'],
          item: 'kebiaberry'
        },
        {
          speciesNum: 685, speciesId: 'slurpuff', name: 'Sabbaione', types: ['Fairy'],
          moves: ['playrough', 'drainpunch', 'bellydrum', 'flamethrower'],
          item: 'sitrusberry'
        },
        {
          speciesNum: 122, speciesId: 'mrmime', name: 'Pantimos', types: ['Psychic', 'Fairy'],
          moves: ['psychic', 'dazzlinggleam', 'reflect', 'lightscreen'],
          item: 'focussash'
        }
      ]
    },
    {
      trainerId: 'olympia',
      name: 'Astrid',
      title: 'Arenaleiterin von Fluxia City',
      badge: 'Psi-Orden',
      type: 'Psychic',
      team: [
        {
          speciesNum: 561, speciesId: 'sigilyph', name: 'Symvolara', types: ['Psychic', 'Flying'],
          moves: ['psychic', 'airslash', 'skyattack', 'cosmicpower'],
          item: 'leftovers'
        },
        {
          speciesNum: 678, speciesId: 'meowstic', name: 'Psiaugon', types: ['Psychic'],
          moves: ['signalbeam', 'suckerpunch', 'futuresight', 'storedpower'],
          item: 'sitrusberry'
        },
        {
          speciesNum: 199, speciesId: 'slowking', name: 'Laschoking', types: ['Water', 'Psychic'],
          moves: ['psychic', 'trumpcard', 'psychup', 'healpulse'],
          item: 'colburberry'
        },
        {
          speciesNum: 655, speciesId: 'delphox', name: 'Fennexis', types: ['Fire', 'Psychic'],
          moves: ['psychic', 'flamethrower', 'grassknot', 'calmmind'],
          item: 'wiseglasses'
        },
        {
          speciesNum: 687, speciesId: 'malamar', name: 'Calamanero', types: ['Dark', 'Psychic'],
          moves: ['superpower', 'psychocut', 'nightslash', 'knockoff'],
          item: 'lifeorb'
        },
        {
          speciesNum: 576, speciesId: 'gothitelle', name: 'Morbitesse', types: ['Psychic'],
          moves: ['psychic', 'thunderbolt', 'shadowball', 'calmmind'],
          item: 'lumberry'
        }
      ]
    },
    {
      trainerId: 'wulfric',
      name: 'Galantho',
      title: 'Arenaleiter von Fractalia City',
      badge: 'Eisbergorden',
      type: 'Ice',
      team: [
        {
          speciesNum: 615, speciesId: 'cryogonal', name: 'Frigometri', types: ['Ice'],
          moves: ['recover', 'nightslash', 'solarbeam', 'confuseray'],
          item: 'powerherb'
        },
        {
          speciesNum: 713, speciesId: 'avalugg', name: 'Arktilas', types: ['Ice'],
          moves: ['recover', 'doubleedge', 'skullbash', 'crunch'],
          item: 'rockyhelmet'
        },
        {
          speciesNum: 460, speciesId: 'abomasnow', name: 'Rexblisar', types: ['Grass', 'Ice'],
          moves: ['ingrain', 'woodhammer', 'blizzard', 'sheercold'],
          item: 'occaberry'
        },
        {
          speciesNum: 473, speciesId: 'mamoswine', name: 'Mamutel', types: ['Ice', 'Ground'],
          moves: ['iciclecrash', 'earthquake', 'iceshard', 'stoneedge'],
          item: 'lifeorb'
        },
        {
          speciesNum: 614, speciesId: 'beartic', name: 'Siberio', types: ['Ice'],
          moves: ['iciclecrash', 'superpower', 'aquajet', 'swordsdance'],
          item: 'muscleband'
        },
        {
          speciesNum: 365, speciesId: 'walrein', name: 'Walraisa', types: ['Ice', 'Water'],
          moves: ['blizzard', 'surf', 'rest', 'sleeptalk'],
          item: 'leftovers'
        }
      ]
    }
  ]
};
