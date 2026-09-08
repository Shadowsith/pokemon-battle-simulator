// Regenerates the MOVE_LIBRARY array in
// src/app/core/models/move.model.ts so it holds *every* Gen 1-6 move, one
// entry per move, sourced from:
//
//   - scripts/move-archetypes.json  -> archetype + Gen 6 type per move
//     (produced by scripts/categorize-moves.mjs)
//   - @pkmn/sim (Dex.forGen(6))     -> canonical id, English name, move number
//   - PokeAPI /move/<num>           -> German (de) display name
//
// German names are cached in scripts/move-names.de.json so re-runs work
// offline and only fetch moves that are missing.
//
// The type definitions and the Move interface at the top of move.model.ts
// are left untouched - only the doc comment + array at the bottom are
// rewritten.
//
// Run with: node scripts/generate-move-library.mjs
// Offline (skip PokeAPI, use cache + English fallback): node scripts/generate-move-library.mjs --offline

import { readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { Dex } from '@pkmn/sim';

const MODEL_FILE = path.resolve('src/app/core/models/move.model.ts');
const MAPPING_FILE = path.resolve('scripts/move-archetypes.json');
const NAME_CACHE_FILE = path.resolve('scripts/move-names.de.json');
const OFFLINE = process.argv.includes('--offline');
const CONCURRENCY = 8;
const RETRIES = 3;

const GEN6 = Dex.forGen(6);

// Fallback tint per elemental type, used for every move that has no entry in
// COLOR_OVERRIDES. Kept deliberately muted to match the battle stage art.
const TYPE_COLORS = {
  Normal: '#B4B2A9',
  Fire: '#C7431F',
  Water: '#2C6FB5',
  Electric: '#EF9F27',
  Grass: '#3B6D11',
  Ice: '#185FA5',
  Fighting: '#9B331F',
  Poison: '#6B2C6B',
  Ground: '#854F0B',
  Flying: '#6B8ABF',
  Psychic: '#993556',
  Bug: '#6D7815',
  Rock: '#7A6A3B',
  Ghost: '#4A3572',
  Dragon: '#4A3C9B',
  Dark: '#3C3489',
  Steel: '#7A8A99',
  Fairy: '#C96FAE'
};

// Hand-tuned tints that should win over the plain type color (keyed by
// showdownId) - seeded with the colors from the original starter catalog.
const COLOR_OVERRIDES = {
  tackle: '#B4B2A9',
  bite: '#72243E',
  energyball: '#3B6D11',
  solarbeam: '#BA7517',
  icebeam: '#185FA5',
  darkpulse: '#3C3489',
  psychic: '#993556',
  thunderbolt: '#EF9F27',
  earthquake: '#854F0B'
};

/** English move name -> a stable snake_case id ("X-Scissor" -> "x_scissor"). */
const toEntryId = (name) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

async function loadNameCache() {
  if (!existsSync(NAME_CACHE_FILE)) return {};
  try {
    return JSON.parse(await readFile(NAME_CACHE_FILE, 'utf8'));
  } catch {
    return {};
  }
}

async function fetchGermanName(num) {
  const url = `https://pokeapi.co/api/v2/move/${num}/`;
  for (let attempt = 1; attempt <= RETRIES; attempt++) {
    try {
      const res = await fetch(url);
      if (res.status === 404) return null;
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      return json.names.find((n) => n.language.name === 'de')?.name ?? null;
    } catch (err) {
      if (attempt === RETRIES) throw err;
      await new Promise((r) => setTimeout(r, 300 * attempt));
    }
  }
}

async function runPool(items, worker) {
  let cursor = 0;
  const next = async () => {
    while (cursor < items.length) await worker(items[cursor++]);
  };
  await Promise.all(Array.from({ length: CONCURRENCY }, next));
}

async function main() {
  const mapping = JSON.parse(await readFile(MAPPING_FILE, 'utf8'));
  const nameCache = await loadNameCache();

  // Resolve every mapped move against the Gen 6 dex, sorted by move number
  // so the generated list follows in-game (generation) order.
  const moves = Object.entries(mapping)
    .map(([showdownId, { archetype, type }]) => {
      const m = GEN6.moves.get(showdownId);
      if (!m?.exists) {
        console.warn(`skip: ${showdownId} not found in Gen 6 dex`);
        return null;
      }
      return { showdownId, archetype, type, num: m.num, enName: m.name };
    })
    .filter(Boolean)
    .sort((a, b) => a.num - b.num);

  // Fetch any German names we don't already have cached.
  const missing = OFFLINE ? [] : moves.filter((m) => !nameCache[m.showdownId]);
  if (missing.length) {
    console.log(`Fetching ${missing.length} German move names from PokeAPI...`);
    let done = 0;
    await runPool(missing, async (m) => {
      try {
        const de = await fetchGermanName(m.num);
        if (de) nameCache[m.showdownId] = de;
        else console.warn(`no German name for ${m.showdownId} (#${m.num})`);
      } catch (err) {
        console.warn(`fetch failed for ${m.showdownId}: ${err.message}`);
      }
      if (++done % 50 === 0) console.log(`  ${done}/${missing.length}`);
    });
    await writeFile(NAME_CACHE_FILE, JSON.stringify(sortKeys(nameCache), null, 2) + '\n');
  }

  const seenIds = new Set();
  const rows = moves.map((m) => {
    let id = toEntryId(m.enName);
    while (seenIds.has(id)) id = `${id}_`;
    seenIds.add(id);

    const name = nameCache[m.showdownId] ?? m.enName;
    const color = COLOR_OVERRIDES[m.showdownId] ?? TYPE_COLORS[m.type] ?? '#B4B2A9';

    return (
      `  { id: ${q(id)}, name: ${q(name)}, archetype: ${q(m.archetype)}, ` +
      `type: ${q(m.type)}, color: ${q(color)}, showdownId: ${q(m.showdownId)} }`
    );
  });

  const block =
    '/**\n' +
    ` * Every Gen 1-6 move, one entry each (${rows.length} total), generated by\n` +
    ' * scripts/generate-move-library.mjs. Archetype + Gen 6 type come from\n' +
    ' * scripts/move-archetypes.json; German names from PokeAPI. Edit the\n' +
    ' * script (or its COLOR_OVERRIDES) rather than this array by hand.\n' +
    ' */\n' +
    'export const MOVE_LIBRARY: Move[] = [\n' +
    rows.join(',\n') +
    '\n];\n';

  const src = await readFile(MODEL_FILE, 'utf8');
  const anchor = src.search(/\/\*\*\n \* (Starter catalog|Every Gen)/);
  const cut = anchor === -1 ? src.indexOf('export const MOVE_LIBRARY') : anchor;
  if (cut === -1) throw new Error('could not locate MOVE_LIBRARY in move.model.ts');

  await writeFile(MODEL_FILE, src.slice(0, cut) + block);
  console.log(`Wrote ${rows.length} moves to ${path.relative(process.cwd(), MODEL_FILE)}`);
}

const q = (s) => `'${String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
const sortKeys = (obj) =>
  Object.fromEntries(Object.keys(obj).sort().map((k) => [k, obj[k]]));

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
