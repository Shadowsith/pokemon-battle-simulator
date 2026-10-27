import { Track, env, midi } from './track.mjs';

/**
 * A {@link Track} with reusable sound gestures shared by many moves (hits,
 * whooshes, splashes, stat jingles...). Recipes combine these with the raw
 * pulse / wave / noise voices.
 */
export class MoveSfx extends Track {
  /** Airy rush: noise whose brightness sweeps from `from` to `to` Hz. */
  whoosh(at, dur, { from = 1500, to = 6000, gain = 0.4 } = {}) {
    this.noise(at, dur, { clock: env.ramp(from, to), gain: env.swell(gain) });
  }

  /** Body blow: a short crack plus a falling low pulse; `weight` 0..1 makes it deeper and longer. */
  thud(at, gain = 0.6, weight = 0.5) {
    this.noise(at, 0.08 + 0.08 * weight, { clock: (u) => 9000 - 7000 * u, gain: env.attackDecay(gain, 0.02) });
    this.pulse(at, 0.1 + 0.12 * weight, {
      freq: (u) => (220 - 90 * weight) * Math.pow(0.35, u),
      gain: env.decay(gain * 0.8, 2),
      duty: 0.5,
    });
  }

  /** Blade cut: a bright hiss with a falling high whistle. */
  slash(at, gain = 0.5) {
    this.noise(at, 0.14, { clock: (u) => 22000 - 8000 * u, gain: env.attackDecay(gain, 0.15) });
    this.pulse(at, 0.12, { freq: (u) => 2600 - 1400 * u, gain: env.decay(gain * 0.4, 1.5), duty: 0.125 });
  }

  /** Water hitting something: a wet noise burst plus a few bubbles. */
  splash(at, gain = 0.5) {
    this.noise(at, 0.25, { clock: (u) => 6500 - 4500 * u, gain: env.attackDecay(gain, 0.04) });
    this.bubbles(at + 0.03, 0.25, 5, { gain: gain * 0.5 });
  }

  /** Rising "blip" bubbles scattered over `dur` seconds. */
  bubbles(at, dur, count, { lo = 300, hi = 900, gain = 0.25 } = {}) {
    for (let i = 0; i < count; i++) {
      const start = at + this.random() * dur;
      const f = lo + this.random() * (hi - lo);
      this.pulse(start, 0.05, { freq: (u) => f * (1 + 1.2 * u), gain: env.decay(gain, 1), duty: 0.5 });
    }
  }

  /** Short random high blips (sparks, glitter, ice chips). */
  sparkle(at, dur, count, { lo = 2400, hi = 4800, gain = 0.25 } = {}) {
    for (let i = 0; i < count; i++) {
      const start = at + this.random() * dur;
      const f = lo + this.random() * (hi - lo);
      this.pulse(start, 0.035, { freq: (u) => f * (1 - 0.3 * u), gain: env.decay(gain, 1), duty: 0.125 });
    }
  }

  /** Low rolling noise (earth, boulders, thunder). */
  rumble(at, dur, { from = 500, to = 200, gain = 0.4 } = {}) {
    this.noise(at, dur, { clock: env.ramp(from, to), gain: (u) => gain * Math.min(1, u * 8) * Math.pow(1 - u, 1.2) });
  }

  /** A run of notes (MIDI numbers), one every `step` seconds. */
  arpeggio(at, notes, step, { gain = 0.3, duty = 0.5, voice = 'pulse', hold = step } = {}) {
    notes.forEach((n, i) => {
      const f = midi(n);
      const opts = { freq: () => f, gain: env.decay(gain, 1) };
      if (voice === 'wave') this.wave(at + i * step, hold, opts);
      else this.pulse(at + i * step, hold, { ...opts, duty });
    });
  }

  /** GB-style chord: cycles through `notes` every `rate` seconds for `dur` (the classic fast arpeggio shimmer). */
  chord(at, dur, notes, { rate = 0.03, gain = 0.25, voice = 'wave', vibrato = 0 } = {}) {
    const freqs = notes.map(midi);
    const opts = {
      freq: (u) => freqs[Math.floor((u * dur) / rate) % freqs.length] * (1 + vibrato * Math.sin(2 * Math.PI * 6 * u * dur)),
      gain: env.swell(gain),
    };
    if (voice === 'wave') this.wave(at, dur, opts);
    else this.pulse(at, dur, { ...opts, duty: 0.25 });
  }

  /** Stat raised: bright rising arpeggio with a little glitter. */
  statUp(at, gain = 0.28) {
    this.arpeggio(at, [72, 76, 79, 84, 88], 0.06, { gain, duty: 0.25, hold: 0.09 });
    this.sparkle(at + 0.12, 0.35, 6, { gain: gain * 0.6 });
  }

  /** Stat lowered: falling arpeggio. */
  statDown(at, gain = 0.28) {
    this.arpeggio(at, [79, 75, 72, 67, 63], 0.07, { gain, duty: 0.5, hold: 0.1 });
  }

  /** Burn: a short flare-up of crackling flame. */
  burn(at, gain = 0.3) {
    this.noise(at, 0.35, { clock: () => 1200, gain: env.swell(gain) });
    this.sparkle(at + 0.05, 0.25, 3, { lo: 6000, hi: 9000, gain: gain * 0.6 });
  }

  /** Paralysis: three quick electric zaps. */
  paralyze(at, gain = 0.25) {
    for (let i = 0; i < 3; i++) {
      this.noise(at + i * 0.1, 0.05, { clock: () => 7000, gain: env.decay(gain, 1), short: true });
      this.pulse(at + i * 0.1, 0.05, { freq: (u) => 1800 - 900 * u, gain: env.decay(gain * 0.6, 1), duty: 0.25 });
    }
  }

  /** Poison: a sickly, gurgling wobble. */
  poison(at, gain = 0.25) {
    this.pulse(at, 0.4, { freq: (u) => (330 - 120 * u) * (1 + 0.06 * Math.sin(2 * Math.PI * 9 * u)), gain: env.swell(gain), duty: 0.25 });
    this.bubbles(at, 0.35, 4, { lo: 180, hi: 350, gain: gain * 0.8 });
  }

  /** Confusion: dizzy tweeting that circles round. */
  confusion(at, gain = 0.2) {
    this.chord(at, 0.5, [88, 91], { rate: 0.06, gain, vibrato: 0.02 });
  }

  /** Freeze: ice crackles over the target with a cold, falling shimmer. */
  freeze(at, gain = 0.2) {
    this.sparkle(at, 0.35, 8, { lo: 3500, hi: 6500, gain });
    this.wave(at, 0.45, { freq: (u) => 1760 * Math.pow(0.6, u), gain: env.decay(gain * 0.9, 1.5) });
  }

  /** Sleep: a slow, falling lullaby. */
  sleep(at, gain = 0.2) {
    this.arpeggio(at, [79, 76, 72], 0.15, { gain, voice: 'wave', hold: 0.25 });
  }

  /** Drain: stolen energy flows back to the caster as a soft rising run. */
  drain(at, gain = 0.18) {
    this.arpeggio(at, [72, 76, 79, 84], 0.08, { gain, voice: 'wave', hold: 0.12 });
    this.noise(at, 0.4, { clock: () => 5000, gain: env.swell(gain * 0.4) });
  }

  /** Flinch: two quick stuttering ticks. */
  flinch(at, gain = 0.2) {
    this.pulse(at, 0.04, { freq: () => 1700, gain: env.decay(gain, 1), duty: 0.25 });
    this.pulse(at + 0.07, 0.04, { freq: () => 1500, gain: env.decay(gain, 1), duty: 0.25 });
  }
}
