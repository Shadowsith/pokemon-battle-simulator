#!/usr/bin/env node
/**
 * Synthesizes original, GBA-style move sounds from scratch (no samples) into
 * public/assets/sounds/moves/free/<showdownId>.mp3.
 *
 * Each recipe only borrows the *shape* of a move (timing taken from its
 * battle animation, rough loudness/brightness curve) and builds the audio
 * from Game Boy style voices: pulse waves and an LFSR noise channel. The
 * result is then crushed to the GBA's ~13 kHz / 8-bit output via sox and
 * encoded with ffmpeg.
 *
 * Usage: node scripts/synth-move-sounds.mjs [moveId ...]   (default: all recipes)
 * Requires: sox, ffmpeg on PATH.
 */
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const RATE = 44100;
const OUT_DIR = 'public/assets/sounds/moves/free';

/** A mono float mix buffer with GB-style voices that can be layered into it. */
class Track {
  constructor(seconds, seed = 1) {
    this.data = new Float32Array(Math.ceil(seconds * RATE));
    this.seed = seed >>> 0 || 1;
  }

  /** Deterministic 0..1 random numbers so the output is reproducible. */
  random() {
    this.seed ^= this.seed << 13;
    this.seed ^= this.seed >>> 17;
    this.seed ^= this.seed << 5;
    return (this.seed >>> 0) / 4294967296;
  }

  /**
   * Pulse wave (GB square channel). `freq` and `gain` are functions of the
   * normalized position 0..1 inside the voice, `duty` is the pulse width.
   */
  pulse(start, dur, { freq, gain, duty = 0.5 }) {
    let phase = 0;
    this.#render(start, dur, (u) => {
      phase = (phase + freq(u) / RATE) % 1;
      return (phase < duty ? 1 : -1) * gain(u);
    });
  }

  /**
   * GB noise channel: a 15-bit LFSR clocked at `clock(u)` Hz. Short mode
   * (7-bit feedback) gives the metallic, buzzy tone typical of electric moves.
   */
  noise(start, dur, { clock, gain, short = false }) {
    let lfsr = 0x7fff;
    let acc = 0;
    let out = 1;
    this.#render(start, dur, (u) => {
      acc += clock(u) / RATE;
      while (acc >= 1) {
        acc -= 1;
        const bit = (lfsr ^ (lfsr >> 1)) & 1;
        lfsr = (lfsr >> 1) | (bit << 14);
        if (short) lfsr = (lfsr & ~0x40) | (bit << 6);
        out = lfsr & 1 ? -1 : 1;
      }
      return out * gain(u);
    });
  }

  /**
   * Peak-normalizes the mix to `peak`, then turns it down if its average
   * loudness (RMS) exceeds `maxRms`, so sustained sounds don't play louder
   * than the regular clips (which sit around 0.13-0.16 RMS).
   */
  normalize(peak = 0.9, maxRms = 0.16) {
    let max = 0;
    let sum = 0;
    for (const v of this.data) {
      max = Math.max(max, Math.abs(v));
      sum += v * v;
    }
    if (max === 0) return;
    const rms = (Math.sqrt(sum / this.data.length) * peak) / max;
    const scale = (peak / max) * Math.min(1, maxRms / rms);
    for (let i = 0; i < this.data.length; i++) this.data[i] *= scale;
  }

  /** 16-bit PCM mono WAV bytes. */
  toWav() {
    const n = this.data.length;
    const buf = Buffer.alloc(44 + n * 2);
    buf.write('RIFF', 0);
    buf.writeUInt32LE(36 + n * 2, 4);
    buf.write('WAVEfmt ', 8);
    buf.writeUInt32LE(16, 16);
    buf.writeUInt16LE(1, 20);
    buf.writeUInt16LE(1, 22);
    buf.writeUInt32LE(RATE, 24);
    buf.writeUInt32LE(RATE * 2, 28);
    buf.writeUInt16LE(2, 32);
    buf.writeUInt16LE(16, 34);
    buf.write('data', 36);
    buf.writeUInt32LE(n * 2, 40);
    for (let i = 0; i < n; i++) {
      buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, this.data[i])) * 32767), 44 + i * 2);
    }
    return buf;
  }

  #render(start, dur, sample) {
    const from = Math.floor(start * RATE);
    const len = Math.floor(dur * RATE);
    for (let i = 0; i < len && from + i < this.data.length; i++) {
      this.data[from + i] += sample(i / len);
    }
  }
}

/** Envelope helpers (u = 0..1 position inside a voice). */
const env = {
  ramp: (a, b) => (u) => a + (b - a) * u,
  decay: (peak, curve = 3) => (u) => peak * Math.pow(1 - u, curve),
  attackDecay: (peak, attack = 0.05) => (u) =>
    u < attack ? peak * (u / attack) : peak * Math.pow(1 - (u - attack) / (1 - attack), 2),
  swell: (peak) => (u) => peak * Math.sin(Math.PI * u),
};

/**
 * Recipes keyed by @pkmn/sim move id. Timings follow the move's animation
 * in src/app/core/services/move-animation/moves/<type>-moves.ts.
 */
const RECIPES = {
  /**
   * ElectricMoveAnimations.playThunder: the sky darkens (0-0.7 s), one heavy
   * bolt strikes with field shake and flickers back twice (+0.32 s, +0.59 s),
   * the sky clears (to ~2.2 s). Deep and heavy: rumble, crack, rolling thunder.
   */
  thunder: () => {
    const t = new Track(2.4, 0x7d02);

    // Gathering storm: distant low rumble and a bass drone swelling up.
    t.noise(0.02, 0.72, { clock: env.ramp(300, 700), gain: env.ramp(0.05, 0.4) });
    t.pulse(0.02, 0.72, { freq: env.ramp(46, 38), gain: env.ramp(0.02, 0.22), duty: 0.5 });

    // The strike: bright crack, a falling boom and a bass hit.
    t.noise(0.7, 0.28, { clock: (u) => 24000 - 21000 * u, gain: env.attackDecay(0.95, 0.01) });
    t.pulse(0.7, 0.45, { freq: (u) => 900 * Math.pow(0.07, u), gain: env.decay(0.6, 2), duty: 0.25 });
    t.pulse(0.7, 0.65, { freq: env.ramp(70, 34), gain: env.decay(0.55, 1.5), duty: 0.5 });

    // The bolt flickers back twice: smaller cracks.
    for (const [at, g] of [[1.02, 0.55], [1.29, 0.42]]) {
      t.noise(at, 0.16, { clock: (u) => 16000 - 12000 * u, gain: env.attackDecay(g, 0.02) });
      t.pulse(at, 0.2, { freq: (u) => 600 * Math.pow(0.15, u), gain: env.decay(g * 0.5, 2), duty: 0.25 });
    }

    // Rolling thunder: low noise that wobbles and fades while the sky clears.
    t.noise(0.75, 1.62, {
      clock: env.ramp(900, 220),
      gain: (u) => 0.5 * Math.pow(1 - u, 1.5) * (0.7 + 0.3 * Math.sin(2 * Math.PI * 5 * u)),
    });

    return t;
  },

  /**
   * ElectricMoveAnimations.playThunderbolt: four thin bolts strike one after
   * another (every 0.23 s, each flickering once at +0.18 s) while a crackling
   * electric ball glows on the target (0.06-1.35 s) and throws off sparks.
   */
  thunderbolt: () => {
    const t = new Track(1.5, 0x7b01);

    // Four zaps: noise crack + falling pulse, pitch varies per strike.
    [1.0, 1.12, 0.94, 1.2].forEach((pitch, i) => {
      const at = 0.02 + i * 0.23;
      const g = 0.8 - i * 0.06;
      t.noise(at, 0.12, { clock: (u) => 18000 - 12000 * u, gain: env.attackDecay(g, 0.03) });
      t.pulse(at, 0.18, { freq: (u) => pitch * (1800 - 1400 * u), gain: env.decay(g * 0.55, 2), duty: 0.25 });
      // The flicker: a short re-zap halfway through the bolt.
      t.pulse(at + 0.18, 0.08, { freq: (u) => pitch * (1400 - 600 * u), gain: env.decay(g * 0.3, 1), duty: 0.125 });
    });

    // The electric ball: metallic buzz that pulses while it glows.
    t.noise(0.08, 1.3, {
      clock: () => 5200,
      gain: (u) => 0.3 * Math.sin(Math.PI * u) * (0.75 + 0.25 * Math.sin(2 * Math.PI * 9 * u)),
      short: true,
    });

    // Sparks crackling off the ball.
    for (let i = 0; i < 10; i++) {
      const at = 0.1 + i * 0.099 + t.random() * 0.03;
      const f = 2000 + t.random() * 2200;
      t.pulse(at, 0.035, { freq: (u) => f * (1 - 0.35 * u), gain: env.decay(0.28, 1), duty: 0.125 });
    }

    return t;
  },

  /**
   * FireMoveAnimations.playFlamethrower: heat glow fades in (0-0.3 s), a fire
   * stream pours into the target (0.3-1.7 s, target shakes every 0.26 s from
   * 0.6 s), the target burns with five flickering flames (1.7-2.9 s), glow
   * fades (to ~3.25 s). Warm, low roar rather than a bright hiss.
   */
  flamethrower: () => {
    const t = new Track(3.2, 0xf1a3);

    // Ignition: a rising "whoomph" as the heat builds.
    t.noise(0.02, 0.36, { clock: env.ramp(400, 3200), gain: env.swell(0.5) });
    t.pulse(0.02, 0.3, { freq: env.ramp(70, 190), gain: env.swell(0.25), duty: 0.5 });

    // The stream: low roaring body plus a brighter, fluttering flame layer.
    const roar = (u) => Math.min(1, u * 12) * Math.min(1, (1 - u) * 6);
    t.noise(0.3, 1.42, { clock: () => 520, gain: (u) => 0.45 * roar(u) });
    t.noise(0.3, 1.42, {
      clock: (u) => 1800 + 900 * Math.sin(2 * Math.PI * 3 * u),
      gain: (u) => 0.3 * roar(u) * (0.7 + 0.3 * Math.sin(2 * Math.PI * 17 * u)),
    });

    // Impacts on the target while the stream hits.
    for (let at = 0.6; at < 1.69; at += 0.26) {
      t.pulse(at, 0.09, { freq: (u) => 140 - 70 * u, gain: env.decay(0.3, 2), duty: 0.5 });
    }

    // Burning: five flames flicker up one after another, crackling.
    for (let i = 0; i < 5; i++) {
      const at = 1.69 + i * 0.11;
      t.noise(at, 0.75, {
        clock: () => 900 + t.random() * 500,
        gain: (u) => 0.22 * Math.sin(Math.PI * u) * (0.6 + 0.4 * Math.sin(2 * Math.PI * 11 * u + i)),
      });
    }
    for (let i = 0; i < 14; i++) {
      const at = 0.45 + t.random() * 2.3;
      t.noise(at, 0.025, { clock: () => 9000 + t.random() * 6000, gain: env.decay(0.35, 1) });
    }

    return t;
  },
};

function render(id) {
  const recipe = RECIPES[id];
  if (!recipe) throw new Error(`No recipe for "${id}"`);
  const track = recipe();
  track.normalize();

  const tmp = mkdtempSync(join(tmpdir(), 'synth-'));
  try {
    const raw = join(tmp, 'raw.wav');
    const gba = join(tmp, 'gba.wav');
    writeFileSync(raw, track.toWav());
    // GBA output: ~13 kHz, 8-bit, then back to 44.1 kHz for playback.
    execFileSync('sox', [raw, '-b', '8', gba, 'rate', '13379', 'dither']);
    const out = join(OUT_DIR, `${id}.mp3`);
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', gba, '-ar', '44100', '-ac', '1', '-b:a', '128k', out]);
    console.log(`wrote ${out}`);
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
}

mkdirSync(OUT_DIR, { recursive: true });
const ids = process.argv.slice(2);
for (const id of ids.length ? ids : Object.keys(RECIPES)) render(id);
