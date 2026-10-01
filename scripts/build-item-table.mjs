// Builds src/app/core/models/item-table.ts: the curated held items the battle
// engine models, with German names (PokeAPI), Showdown icon positions
// (@pkmn/sim `spritenum`) and a short German description per item.
//
// The effects themselves are declared below — @pkmn/sim keeps item behaviour
// in code callbacks that only run inside its own battle engine.
//
// Run with: node scripts/build-item-table.mjs

import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { Dex } from '@pkmn/sim';

const OUT_FILE = path.resolve('src/app/core/models/item-table.ts');

const TYPE_DE = {
  Normal: 'Normal', Fire: 'Feuer', Water: 'Wasser', Electric: 'Elektro', Grass: 'Pflanzen', Ice: 'Eis',
  Fighting: 'Kampf', Poison: 'Gift', Ground: 'Boden', Flying: 'Flug', Psychic: 'Psycho', Bug: 'Käfer',
  Rock: 'Gesteins', Ghost: 'Geister', Dragon: 'Drachen', Dark: 'Unlicht', Steel: 'Stahl', Fairy: 'Feen'
};

const TYPE_BOOSTERS = {
  Normal: 'silkscarf', Fire: 'charcoal', Water: 'mysticwater', Electric: 'magnet', Grass: 'miracleseed',
  Ice: 'nevermeltice', Fighting: 'blackbelt', Poison: 'poisonbarb', Ground: 'softsand', Flying: 'sharpbeak',
  Psychic: 'twistedspoon', Bug: 'silverpowder', Rock: 'hardstone', Ghost: 'spelltag', Dragon: 'dragonfang',
  Dark: 'blackglasses', Steel: 'metalcoat', Fairy: 'pixieplate'
};

const GEMS = {
  Normal: 'normalgem', Fire: 'firegem', Water: 'watergem', Electric: 'electricgem', Grass: 'grassgem',
  Ice: 'icegem', Fighting: 'fightinggem', Poison: 'poisongem', Ground: 'groundgem', Flying: 'flyinggem',
  Psychic: 'psychicgem', Bug: 'buggem', Rock: 'rockgem', Ghost: 'ghostgem', Dragon: 'dragongem',
  Dark: 'darkgem', Steel: 'steelgem'
};

const RESIST_BERRIES = {
  Fire: 'occaberry', Water: 'passhoberry', Electric: 'wacanberry', Grass: 'rindoberry', Ice: 'yacheberry',
  Fighting: 'chopleberry', Poison: 'kebiaberry', Ground: 'shucaberry', Flying: 'cobaberry',
  Psychic: 'payapaberry', Bug: 'tangaberry', Rock: 'chartiberry', Ghost: 'kasibberry', Dragon: 'habanberry',
  Dark: 'colburberry', Steel: 'babiriberry', Normal: 'chilanberry', Fairy: 'roseliberry'
};

const STAT_DE = { atk: 'Angriff', def: 'Verteidigung', spa: 'Spezial-Angriff', spd: 'Spezial-Verteidigung', spe: 'Initiative' };
const CURE_DE = { par: 'Paralyse', slp: 'Schlaf', psn: 'Vergiftung', tox: 'Vergiftung', brn: 'Verbrennung', frz: 'Einfrieren', confusion: 'Verwirrung' };

/** [id, category, effect, description] */
const ITEMS = [];

for (const [type, id] of Object.entries(TYPE_BOOSTERS)) {
  ITEMS.push([id, 'booster', { kind: 'typeBoost', type, mult: 1.2 }, `Verstärkt ${TYPE_DE[type]}-Attacken um 20 %.`]);
}
for (const [type, id] of Object.entries(GEMS)) {
  ITEMS.push([id, 'gem', { kind: 'gem', type }, `Verstärkt die erste ${TYPE_DE[type]}-Attacke um 30 %. Einmalig.`]);
}
for (const [type, id] of Object.entries(RESIST_BERRIES)) {
  const desc =
    type === 'Normal'
      ? 'Halbiert den Schaden einer Normal-Attacke. Einmalig.'
      : `Halbiert einen sehr effektiven ${TYPE_DE[type]}-Treffer. Einmalig.`;
  ITEMS.push([id, 'berry', { kind: 'resistBerry', type }, desc]);
}
ITEMS.push(['sitrusberry', 'berry', { kind: 'healBerry', threshold: 0.5, fraction: 0.25 }, 'Füllt bei halben KP ¼ der KP auf. Einmalig.']);
ITEMS.push(['oranberry', 'berry', { kind: 'healBerry', threshold: 0.5, flat: 10 }, 'Füllt bei halben KP 10 KP auf. Einmalig.']);
for (const [id, cures] of [
  ['cheriberry', ['par']], ['chestoberry', ['slp']], ['pechaberry', ['psn', 'tox']], ['rawstberry', ['brn']],
  ['aspearberry', ['frz']], ['persimberry', ['confusion']]
]) {
  ITEMS.push([id, 'berry', { kind: 'cureBerry', cures }, `Heilt ${CURE_DE[cures[0]]}. Einmalig.`]);
}
ITEMS.push(['lumberry', 'berry', { kind: 'cureBerry', cures: ['par', 'slp', 'psn', 'tox', 'brn', 'frz', 'confusion'] }, 'Heilt jedes Statusproblem und Verwirrung. Einmalig.']);
for (const [id, stat] of [['salacberry', 'spe'], ['liechiberry', 'atk'], ['petayaberry', 'spa'], ['ganlonberry', 'def'], ['apicotberry', 'spd']]) {
  ITEMS.push([id, 'berry', { kind: 'pinchBerry', stat, stages: 1 }, `Erhöht bei ¼ KP ${STAT_DE[stat]}. Einmalig.`]);
}
ITEMS.push(['starfberry', 'berry', { kind: 'pinchBerry', stat: 'random', stages: 2 }, 'Erhöht bei ¼ KP einen zufälligen Wert stark. Einmalig.']);
ITEMS.push(['jabocaberry', 'berry', { kind: 'retaliateBerry', category: 'Physical' }, 'Physischer Angreifer verliert ⅛ seiner KP. Einmalig.']);
ITEMS.push(['rowapberry', 'berry', { kind: 'retaliateBerry', category: 'Special' }, 'Spezieller Angreifer verliert ⅛ seiner KP. Einmalig.']);

const BATTLE = [
  ['leftovers', 'Füllt am Rundenende 1/16 der KP auf.'],
  ['blacksludge', 'Gift-Pokémon: +1/16 KP pro Runde, andere verlieren ⅛.'],
  ['lifeorb', 'Attacken +30 %, kostet pro Treffer 1/10 der KP.'],
  ['choiceband', 'Angriff ×1,5, aber nur eine Attacke wählbar.'],
  ['choicespecs', 'Spezial-Angriff ×1,5, aber nur eine Attacke wählbar.'],
  ['choicescarf', 'Initiative ×1,5, aber nur eine Attacke wählbar.'],
  ['focussash', 'Übersteht bei vollen KP einen K.-o.-Treffer mit 1 KP. Einmalig.'],
  ['expertbelt', 'Sehr effektive Attacken +20 %.'],
  ['muscleband', 'Physische Attacken +10 %.'],
  ['wiseglasses', 'Spezielle Attacken +10 %.'],
  ['eviolite', 'Verteidigung und Sp.-Vert. ×1,5, solange es sich entwickeln kann.'],
  ['assaultvest', 'Spezial-Verteidigung ×1,5, aber keine Status-Attacken.'],
  ['rockyhelmet', 'Angreifer mit Kontakt verliert ⅙ seiner KP.'],
  ['airballoon', 'Immun gegen Boden-Attacken, bis es getroffen wird.'],
  ['brightpowder', 'Gegnerische Attacken treffen seltener (×0,9).'],
  ['widelens', 'Eigene Attacken treffen öfter (×1,1).'],
  ['powerherb', 'Zwei-Runden-Attacke sofort einsetzen. Einmalig.'],
  ['whiteherb', 'Setzt gesenkte Statuswerte zurück. Einmalig.'],
  ['shellbell', 'Füllt ⅛ des zugefügten Schadens als KP auf.']
];
for (const [id, desc] of BATTLE) ITEMS.push([id, 'battle', { kind: 'battle', id }, desc]);

async function germanName(enName) {
  const slug = enName.toLowerCase().replace(/'/g, '').replace(/ /g, '-');
  const res = await fetch(`https://pokeapi.co/api/v2/item/${slug}`);
  if (!res.ok) throw new Error(`PokeAPI ${slug}: ${res.status}`);
  const data = await res.json();
  return data.names.find((n) => n.language.name === 'de')?.name ?? enName;
}

async function main() {
  const rows = [];
  for (const [id, category, effect, desc] of ITEMS) {
    const item = Dex.items.get(id);
    if (!item.exists) throw new Error(`unknown item ${id}`);
    const name = await germanName(item.name);
    rows.push({ id, name, category, spritenum: item.spritenum ?? 0, desc, effect });
    process.stdout.write('.');
  }
  // Plain JSON is valid TypeScript; Prettier (repo config) formats it afterwards.
  const out = `// Generated by scripts/build-item-table.mjs — do not edit by hand.
import type { HeldItem } from './item.model';

export const ITEM_TABLE: HeldItem[] = ${JSON.stringify(rows, null, 2)};
`;
  await writeFile(OUT_FILE, out);
  console.log(`\nwrote ${rows.length} items to ${OUT_FILE}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
