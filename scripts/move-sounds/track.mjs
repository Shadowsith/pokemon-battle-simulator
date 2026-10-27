/**
 * A mono mix buffer with Game Boy / GBA style voices: pulse waves, a 4-bit
 * wavetable channel and an LFSR noise channel. Everything is synthesized,
 * no samples are used.
 */
export const RATE = 44100;

/** Frequency in Hz of a MIDI note number (69 = A4 = 440 Hz). */
export const midi = (n) => 440 * Math.pow(2, (n - 69) / 12);

/** Envelope / curve helpers; `u` is the 0..1 position inside a voice. */
export const env = {
  ramp: (a, b) => (u) => a + (b - a) * u,
  decay: (peak, curve = 3) => (u) => peak * Math.pow(1 - u, curve),
  attackDecay: (peak, attack = 0.05) => (u) =>
    u < attack ? peak * (u / attack) : peak * Math.pow(1 - (u - attack) / (1 - attack), 2),
  swell: (peak) => (u) => peak * Math.sin(Math.PI * u),
};

/** GB wave channel default: a 32-step, 4-bit triangle. */
const TRIANGLE = Array.from({ length: 32 }, (_, i) => (i < 16 ? i : 31 - i));

export class Track {
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

  /** GB wave channel: a 32-step 4-bit wavetable (soft, flute-like by default). */
  wave(start, dur, { freq, gain, table = TRIANGLE }) {
    let phase = 0;
    this.#render(start, dur, (u) => {
      phase = (phase + freq(u) / RATE) % 1;
      return (table[Math.floor(phase * 32)] / 7.5 - 1) * gain(u);
    });
  }

  /**
   * GB noise channel: a 15-bit LFSR clocked at `clock(u)` Hz. Short mode
   * (7-bit feedback) gives a metallic, buzzy tone.
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
  normalize(peak = 0.85, maxRms = 0.16) {
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
