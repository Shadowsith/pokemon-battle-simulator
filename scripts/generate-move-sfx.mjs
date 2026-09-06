// Synthesizes one chiptune-style sound effect for every (archetype, type)
// combination that actually occurs among the Gen 1-5 moves in
// scripts/move-archetypes.json - e.g. meleeNormal.mp3, beamIce.mp3,
// arealPsychic.mp3. Everything is procedurally generated with sox
// (sine/square/triangle/noise synthesis, sweeps, tremolo) - nothing is
// sampled or ripped from any existing source.
//
// Each Pokémon type has a "flavor" (waveform, base pitch, noise color,
// tremolo rate) and each MoveArchetype has a "shape" (the envelope/structure
// - a punchy hit, a sweep, a sustained beam, etc.) that consumes that
// flavor. The combination is what produces the distinct per-cell sound.
//
// Requires sox on PATH (Manjaro/Arch: `sudo pacman -S sox`).
// Run with: node scripts/generate-move-sfx.mjs
//
// Output: public/assets/sounds/moves/<archetype><Type>.mp3

import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdir, mkdtemp, rm, readFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const execFileAsync = promisify(execFile);

const OUT_DIR = path.resolve('public/assets/sounds/moves');
const MAPPING_FILE = path.resolve('scripts/move-archetypes.json');

async function sox(args) {
  await execFileAsync('sox', args);
}

// Per-type sonic identity: waveform, a base frequency (Hz) the archetype
// shapes sweep/center around, an optional noise color layered in, and an
// optional tremolo rate (Hz) for a characteristic wobble/buzz.
const TYPE_FLAVORS = {
  Normal: { wave: 'square', base: 300, noise: null, trem: null },
  Fire: { wave: 'sawtooth', base: 380, noise: 'whitenoise', trem: 9 },
  Water: { wave: 'sine', base: 260, noise: null, trem: 5 },
  Electric: { wave: 'square', base: 500, noise: null, trem: 14 },
  Grass: { wave: 'triangle', base: 300, noise: null, trem: 4 },
  Ice: { wave: 'sine', base: 700, noise: null, trem: null },
  Fighting: { wave: 'square', base: 220, noise: null, trem: null },
  Poison: { wave: 'sawtooth', base: 260, noise: null, trem: 6 },
  Ground: { wave: 'sine', base: 90, noise: 'brownnoise', trem: 4 },
  Flying: { wave: 'sine', base: 500, noise: 'pinknoise', trem: null },
  Psychic: { wave: 'sine', base: 450, noise: null, trem: 8 },
  Bug: { wave: 'square', base: 600, noise: null, trem: 18 },
  Rock: { wave: 'square', base: 150, noise: 'whitenoise', trem: null },
  Ghost: { wave: 'sine', base: 340, noise: null, trem: 6 },
  Dragon: { wave: 'sawtooth', base: 200, noise: null, trem: null },
  Dark: { wave: 'triangle', base: 180, noise: null, trem: 3 },
  Steel: { wave: 'square', base: 500, noise: 'whitenoise', trem: null }
};

/** Each shape receives (tmp dir, flavor) and must produce `${tmp}/out.wav`. */
const ARCHETYPE_SHAPES = {
  // Physical contact hit: pitch-drop tone + a short noise crack, mixed.
  async melee(tmp, f) {
    await sox(['-n', `${tmp}/tone.wav`, 'synth', '0.16', f.wave, `${f.base * 1.3}:${f.base * 0.35}`, 'fade', 'q', '0', '0.16', '0.1']);
    await sox(['-n', `${tmp}/noise.wav`, 'synth', '0.07', f.noise || 'whitenoise', 'fade', 'q', '0', '0.07', '0.05']);
    await sox(['-m', `${tmp}/tone.wav`, `${tmp}/noise.wav`, `${tmp}/out.wav`]);
  },

  // Thrown/launched object: a quick descending exponential "pew".
  async projectile(tmp, f) {
    await sox(['-n', `${tmp}/out.wav`, 'synth', '0.28', f.wave, `${f.base * 2.5}/${f.base * 0.8}`, 'fade', 'q', '0', '0.28', '0.18']);
  },

  // Sustained energy stream: a charge-up sweep into a held, shimmering tone.
  async beam(tmp, f) {
    await sox(['-n', `${tmp}/charge.wav`, 'synth', '0.28', 'sine', `${f.base * 0.5}:${f.base * 2.2}`, 'fade', 'q', '0.02', '0.28', '0.05']);
    await sox(['-n', `${tmp}/sustain.wav`, 'synth', '0.85', f.wave, `${f.base * 2.2}`, 'tremolo', `${f.trem || 6}`, '40', 'fade', 'q', '0.02', '0.85', '0.3']);
    await sox([`${tmp}/charge.wav`, `${tmp}/sustain.wav`, `${tmp}/out.wav`]);
  },

  // Draining hit: three pulses at descending pitch (energy drawn away from the target).
  async absorb(tmp, f) {
    await sox(['-n', `${tmp}/p1.wav`, 'synth', '0.14', f.wave, `${f.base * 1.4}`, 'fade', 'q', '0', '0.14', '0.08']);
    await sox(['-n', `${tmp}/p2.wav`, 'synth', '0.14', f.wave, `${f.base * 1.0}`, 'fade', 'q', '0', '0.14', '0.08']);
    await sox(['-n', `${tmp}/p3.wav`, 'synth', '0.18', f.wave, `${f.base * 0.6}`, 'fade', 'q', '0', '0.18', '0.1']);
    await sox(['-n', `${tmp}/gap.wav`, 'trim', '0', '0.07']);
    await sox([`${tmp}/p1.wav`, `${tmp}/gap.wav`, `${tmp}/p2.wav`, `${tmp}/gap.wav`, `${tmp}/p3.wav`, `${tmp}/out.wav`]);
  },

  // Wide field/wave effect: a broad sweep, optionally layered with a filtered noise wash.
  async areal(tmp, f) {
    await sox(['-n', `${tmp}/sweep.wav`, 'synth', '1.1', f.wave, `${f.base * 0.6}:${f.base * 1.6}`, 'tremolo', `${f.trem || 5}`, '50', 'fade', 'q', '0.05', '1.1', '0.35']);
    if (f.noise) {
      await sox(['-n', `${tmp}/wash.wav`, 'synth', '1.1', f.noise, 'bandpass', `${f.base * 1.5}`, `${f.base}`, 'fade', 'q', '0.05', '1.1', '0.4']);
      await sox(['-m', `${tmp}/sweep.wav`, `${tmp}/wash.wav`, `${tmp}/out.wav`]);
    } else {
      await sox(['-n', `${tmp}/out.wav`, 'synth', '1.1', f.wave, `${f.base * 0.6}:${f.base * 1.6}`, 'tremolo', `${f.trem || 5}`, '50', 'fade', 'q', '0.05', '1.1', '0.35']);
    }
  },

  // Generic special attack: a moderate descending sweep - shorter than a beam, longer than a projectile.
  async specialAttack(tmp, f) {
    await sox(['-n', `${tmp}/out.wav`, 'synth', '0.55', f.wave, `${f.base * 1.6}:${f.base * 0.9}`, 'fade', 'q', '0.02', '0.55', '0.25']);
  },

  // Non-damaging stat/status move: a soft, gentle rising chime - always sine, no noise/percussion.
  async statMove(tmp, f) {
    await sox(['-n', `${tmp}/out.wav`, 'synth', '0.6', 'sine', `${f.base * 0.8}:${f.base * 1.4}`, 'fade', 'q', '0.05', '0.6', '0.3', 'tremolo', '6', '30']);
  },

  // Self-heal: a warm, slow rising glow - longer and softer than a stat move.
  async healMove(tmp, f) {
    await sox(['-n', `${tmp}/out.wav`, 'synth', '0.9', 'sine', `${f.base * 0.7}:${f.base * 1.2}`, 'fade', 'q', '0.1', '0.9', '0.5', 'tremolo', '4', '25']);
  }
};

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  const mapping = JSON.parse(await readFile(MAPPING_FILE, 'utf8'));

  const pairs = new Set();
  for (const { archetype, type } of Object.values(mapping)) {
    pairs.add(`${archetype}|${type}`);
  }

  let ok = 0;
  let skipped = 0;

  for (const pair of pairs) {
    const [archetype, type] = pair.split('|');
    const shape = ARCHETYPE_SHAPES[archetype];
    const flavor = TYPE_FLAVORS[type];
    if (!shape || !flavor) {
      console.log(`skip: no shape/flavor for ${archetype}/${type}`);
      skipped++;
      continue;
    }

    const tmp = await mkdtemp(path.join(os.tmpdir(), 'move-sfx-'));
    try {
      await shape(tmp, flavor);
      const destName = `${archetype}${type}`;
      const dest = path.join(OUT_DIR, `${destName}.mp3`);
      await sox([`${tmp}/out.wav`, dest]);
      ok++;
      if (ok % 20 === 0) console.log(`Progress: ${ok}/${pairs.size}`);
    } finally {
      await rm(tmp, { recursive: true, force: true });
    }
  }

  console.log(`\nDone. ${ok} sounds written to ${OUT_DIR}, ${skipped} skipped.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
