#!/usr/bin/env node
/**
 * Draws the original battle field backgrounds as SVG into
 * public/assets/backgrounds/ (names match backgroundUrl() in
 * src/app/core/battle/battle-background.ts). Recipes live in
 * scripts/backgrounds/ (outdoor.mjs: day + night, enclosed.mjs: one variant).
 *
 * Usage: node scripts/build-backgrounds.mjs [sceneId ...]   (default: all scenes)
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { arena, beach, city, forest, grass, water } from './backgrounds/outdoor.mjs';
import { cave, eliteFour, indoor } from './backgrounds/enclosed.mjs';

const OUT_DIR = join(dirname(fileURLToPath(import.meta.url)), '../public/assets/backgrounds');

/** sceneId → recipe; outdoor recipes are drawn once per time of day. */
const SCENES = {
  grass: { draw: grass, times: ['day', 'night'] },
  forest: { draw: forest, times: ['day', 'night'] },
  water: { draw: water, times: ['day', 'night'] },
  beach: { draw: beach, times: ['day', 'night'] },
  city: { draw: city, times: ['day', 'night'] },
  arena: { draw: arena, times: ['day', 'night'] },
  cave: { draw: cave, times: null },
  indoor: { draw: indoor, times: null },
  'elite-four': { draw: eliteFour, times: null }
};

const ids = process.argv.slice(2);
for (const id of ids) if (!SCENES[id]) throw new Error(`Unknown scene "${id}"`);

mkdirSync(OUT_DIR, { recursive: true });
for (const id of ids.length ? ids : Object.keys(SCENES)) {
  const { draw, times } = SCENES[id];
  for (const time of times ?? [null]) {
    const file = join(OUT_DIR, `${time ? `${id}-${time}` : id}.svg`);
    writeFileSync(file, draw(time).toString());
    console.log(`wrote ${file}`);
  }
}
