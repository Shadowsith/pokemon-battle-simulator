import { MoveSfx } from '../../move-sfx.mjs';
import { env } from '../../track.mjs';

/** Normal-type status moves aimed at the target or the field (debuffs, locks, terrain). */
export const NORMAL_STATUS = {
  /** Generic target aura: a polite two-note "after you" chime. */
  afteryou: () => {
    const s = new MoveSfx(0.95, 0xaf7e);
    s.arpeggio(0.02, [76, 72], 0.3, { gain: 0.32, voice: 'wave', hold: 0.45 });
    s.arpeggio(0.02, [88, 84], 0.3, { gain: 0.08, duty: 0.25, hold: 0.3 });
    return s;
  },

  /** Generic target aura: hearts pop up three times. */
  attract: () => {
    const s = new MoveSfx(1.25, 0xa77c);
    for (const at of [0.02, 0.35, 0.68]) {
      s.arpeggio(at, [79, 84], 0.08, { gain: 0.26, voice: 'wave', hold: 0.16 });
      s.pulse(at + 0.08, 0.12, { freq: () => 1046.5 * 2, gain: env.decay(0.06, 2), duty: 0.5 });
    }
    s.sparkle(0.8, 0.35, 5, { lo: 3000, hi: 5000, gain: 0.12 });
    return s;
  },

  /** Generic target aura: a present is handed over. */
  bestow: () => {
    const s = new MoveSfx(1.0, 0xbe57);
    s.arpeggio(0.02, [72, 76, 79, 84], 0.08, { gain: 0.24, voice: 'wave', hold: 0.14 });
    s.noise(0.4, 0.06, { clock: () => 6000, gain: env.decay(0.25, 1) });
    s.pulse(0.4, 0.1, { freq: env.ramp(500, 900), gain: env.decay(0.2, 1), duty: 0.5 });
    s.sparkle(0.45, 0.4, 6, { gain: 0.14 });
    return s;
  },

  /** Generic target aura: a wall slams down behind the target. */
  block: () => {
    const s = new MoveSfx(0.9, 0xb10c);
    s.whoosh(0.0, 0.2, { from: 1500, to: 600, gain: 0.25 });
    s.thud(0.2, 0.7, 1);
    s.wave(0.22, 0.4, { freq: () => 98, gain: env.decay(0.25, 1.5) });
    return s;
  },

  /** Generic self aura + stat-down fleck: an alluring glance. */
  captivate: () => {
    const s = new MoveSfx(1.5, 0xca97);
    s.wave(0.02, 0.4, { freq: (u) => 600 * Math.pow(2.5, u), gain: env.swell(0.26) });
    s.arpeggio(0.4, [88, 84], 0.1, { gain: 0.2, voice: 'wave', hold: 0.18 });
    s.sparkle(0.1, 0.6, 7, { lo: 3500, hi: 6000, gain: 0.13 });
    s.statDown(0.85);
    return s;
  },

  /** Generic self aura + stat-down fleck: a secretive whisper. */
  confide: () => {
    const s = new MoveSfx(1.5, 0xc0f1);
    for (const at of [0.05, 0.25, 0.42]) s.noise(at, 0.14, { clock: () => 6000, gain: env.swell(0.22) });
    s.wave(0.1, 0.5, { freq: () => 392, gain: env.swell(0.08) });
    s.statDown(0.85);
    return s;
  },

  /** Generic target aura: digital bleeps that read the target, then the type changes. */
  conversion2: () => {
    const s = new MoveSfx(1.0, 0xc0b2);
    s.arpeggio(0.02, [91, 86, 88, 81, 84, 76, 79, 72], 0.045, { gain: 0.22, duty: 0.125, hold: 0.04 });
    s.pulse(0.4, 0.4, { freq: (u) => 1600 * Math.pow(0.25, u), gain: env.swell(0.16), duty: 0.5 });
    s.arpeggio(0.75, [79, 84], 0.06, { gain: 0.15, duty: 0.25, hold: 0.06 });
    return s;
  },

  /** Generic target aura: a flat "no" buzzer, then a lock clicks. */
  disable: () => {
    const s = new MoveSfx(0.85, 0xd15b);
    s.pulse(0.02, 0.18, { freq: () => 196, gain: env.decay(0.3, 0.5), duty: 0.5 });
    s.pulse(0.22, 0.25, { freq: () => 147, gain: env.decay(0.3, 0.5), duty: 0.5 });
    s.noise(0.5, 0.03, { clock: () => 9000, gain: env.decay(0.3, 1) });
    s.pulse(0.5, 0.04, { freq: () => 1200, gain: env.decay(0.2, 1), duty: 0.25 });
    return s;
  },

  /** Generic target aura: a cheerful clapping cheer that demands an encore. */
  encore: () => {
    const s = new MoveSfx(1.2, 0xe2c0);
    for (let i = 0; i < 6; i++) s.noise(0.05 + i * 0.12, 0.05, { clock: () => 9000, gain: env.decay(0.35, 1.5) });
    s.arpeggio(0.1, [72, 76, 79, 76, 79, 84], 0.12, { gain: 0.2, duty: 0.25, hold: 0.1 });
    s.wave(0.82, 0.3, { freq: () => 1046.5, gain: env.decay(0.18, 1.5) });
    return s;
  },

  /** Generic target aura: a bouncy dance rhythm the target falls in step with. */
  entrainment: () => {
    const s = new MoveSfx(1.15, 0xe274);
    [392, 494, 587, 494, 392, 494, 587, 784].forEach((f, i) => {
      s.pulse(0.03 + i * 0.1, 0.07, { freq: () => f, gain: env.decay(0.22, 1), duty: 0.5 });
      if (i % 2 === 0) s.noise(0.03 + i * 0.1, 0.04, { clock: () => 6000, gain: env.decay(0.2, 1) });
    });
    s.wave(0.83, 0.25, { freq: () => 784.0, gain: env.decay(0.16, 1.5) });
    return s;
  },

  /** Generic self aura (~0.8 s) + accuracy drop fleck (0.85 s): a blinding white flash. */
  flash: () => {
    const s = new MoveSfx(1.5, 0xf1a5);
    s.chord(0.02, 0.35, [84, 88, 91, 96], { rate: 0.02, gain: 0.22, voice: 'pulse' });
    s.noise(0.05, 0.4, { clock: (u) => 18000 - 10000 * u, gain: env.attackDecay(0.3, 0.05) });
    s.wave(0.3, 0.5, { freq: env.ramp(2100, 1400), gain: env.decay(0.2, 1.5) });
    s.sparkle(0.15, 0.6, 8, { lo: 4000, hi: 7000, gain: 0.14 });
    s.statDown(0.85);
    return s;
  },

  /** Generic target aura (~0.8 s, fleck at ~0.6 s): a keen eye fixes on the target - high searching blips, then a lock-on ping. */
  foresight: () => {
    const s = new MoveSfx(1.0, 0xf05e);
    for (let i = 0; i < 4; i++) {
      s.pulse(0.03 + i * 0.12, 0.06, { freq: () => 2093 + i * 260, gain: env.decay(0.18, 1), duty: 0.25 });
    }
    s.wave(0.0, 0.55, { freq: (u) => 1200 + 400 * Math.sin(2 * Math.PI * 2 * u), gain: env.swell(0.1) });
    s.pulse(0.6, 0.35, { freq: () => 3520, gain: env.decay(0.22, 1.5), duty: 0.125 });
    s.pulse(0.6, 0.35, { freq: () => 1760, gain: env.decay(0.14, 1.5), duty: 0.5 });
    return s;
  },

  /**
   * NormalRangedMoveAnimations.playGlare: field darkens (0-0.3 s), snake eyes open (0.3-0.58 s),
   * narrow menacingly (squint ≈0.85 s), then 12 sparks crackle round the foe (1.24-2.0 s), fade out to 2.58 s.
   */
  glare: () => {
    const s = new MoveSfx(2.65, 0x61a4);
    s.wave(0.0, 0.3, { freq: env.ramp(220, 110), gain: env.swell(0.12) });
    s.pulse(0.3, 0.28, { freq: env.ramp(400, 1400), gain: env.swell(0.16), duty: 0.125 });
    s.pulse(0.6, 0.55, { freq: (u) => 1400 + 500 * Math.sin(Math.PI * u), gain: (u) => 0.12 * Math.sin(Math.PI * u), duty: 0.125 });
    s.noise(0.75, 0.2, { clock: () => 9000, gain: env.attackDecay(0.12, 0.3), short: true });
    for (let i = 0; i < 12; i++) {
      const at = 1.24 + i * 0.07;
      s.noise(at, 0.05, { clock: () => 7000, gain: env.decay(0.18, 1), short: true });
      s.pulse(at, 0.05, { freq: (u) => 1800 - 900 * u, gain: env.decay(0.1, 1), duty: 0.25 });
    }
    s.wave(1.2, 1.1, { freq: env.ramp(160, 110), gain: (u) => 0.12 * Math.min(1, u * 6) * (1 - u) });
    return s;
  },

  /** Generic self aura (~0.8 s) + Attack-drop fleck (0.85 s): a cute but menacing growl. */
  growl: () => {
    const s = new MoveSfx(1.5, 0x6201);
    for (const [at, f] of [[0.03, 230], [0.38, 200]]) {
      s.pulse(at, 0.32, { freq: (u) => f * (1 + 0.1 * Math.sin(2 * Math.PI * 9 * u)) * (1 - 0.2 * u), gain: env.attackDecay(0.3, 0.2), duty: 0.25 });
      s.noise(at, 0.3, { clock: () => 900, gain: env.attackDecay(0.12, 0.2) });
    }
    s.statDown(0.85);
    return s;
  },

  /** Generic self aura (~0.8 s) + Defense-down fleck (~0.85 s): a cold, menacing stare - a piercing glint over a low drone. */
  leer: () => {
    const s = new MoveSfx(1.5, 0x1ee7);
    s.pulse(0.0, 0.7, { freq: (u) => 110 + 10 * Math.sin(2 * Math.PI * 4 * u), gain: env.swell(0.15), duty: 0.25 });
    s.pulse(0.15, 0.12, { freq: () => 3136, gain: env.decay(0.2, 1), duty: 0.125 });
    s.pulse(0.3, 0.3, { freq: (u) => 2637 * (1 + 0.01 * Math.sin(2 * Math.PI * 20 * u)), gain: env.decay(0.18, 1.2), duty: 0.125 });
    s.noise(0.15, 0.4, { clock: () => 11000, gain: env.decay(0.08, 1.5) });
    s.statDown(0.85);
    return s;
  },

  /** Generic target aura (~0.8 s, no fleck): a targeting reticle closes in - quick sonar beeps speeding up into a lock tone. */
  lockon: () => {
    const s = new MoveSfx(1.1, 0x10c0);
    [0.0, 0.18, 0.32, 0.43, 0.51, 0.57].forEach((at, i) => {
      s.pulse(at, 0.05, { freq: () => 1760 + i * 60, gain: env.decay(0.22, 1), duty: 0.25 });
    });
    s.pulse(0.64, 0.35, { freq: () => 2093, gain: (u) => 0.22 * (u < 0.85 ? 1 : (1 - u) / 0.15), duty: 0.5 });
    s.pulse(0.64, 0.35, { freq: () => 1046, gain: (u) => 0.12 * (u < 0.85 ? 1 : (1 - u) / 0.15), duty: 0.25 });
    return s;
  },

  /** Generic target aura (~0.8 s) + sleep fleck (~0.6 s): a smooch - a little pop, a swooning heart melody and a lullaby. */
  lovelykiss: () => {
    const s = new MoveSfx(1.3, 0x10e1);
    s.pulse(0.02, 0.05, { freq: (u) => 900 + 900 * u, gain: env.decay(0.28, 1), duty: 0.5 });
    s.noise(0.02, 0.04, { clock: () => 6000, gain: env.decay(0.2, 1) });
    s.wave(0.1, 0.45, { freq: (u) => 784 * (1 + 0.03 * Math.sin(2 * Math.PI * 7 * u)) * (1 - 0.15 * u), gain: env.swell(0.22) });
    s.arpeggio(0.12, [79, 84, 83], 0.12, { gain: 0.12, duty: 0.25, hold: 0.14 });
    s.sleep(0.6);
    return s;
  },

  /** Generic target aura (≈ 0.8 s): a piercing, unblinking stare - a cold low drone with a creeping dissonant whine. */
  meanlook: () => {
    const s = new MoveSfx(1.15, 0x3ea1);
    s.wave(0.0, 1.0, { freq: () => 110, gain: env.swell(0.24) });
    s.pulse(0.1, 0.85, { freq: (u) => 1760 * (1 + 0.015 * Math.sin(2 * Math.PI * 7 * u)), gain: env.swell(0.1), duty: 0.125 });
    s.pulse(0.1, 0.85, { freq: () => 1865, gain: env.swell(0.07), duty: 0.125 });
    s.arpeggio(0.6, [64, 63], 0.15, { gain: 0.16, voice: 'wave', hold: 0.3 });
    return s;
  },

  /** Generic target aura (≈ 0.8 s): the user cuts in first - a quick upward dash and a cheeky copying echo. */
  mefirst: () => {
    const s = new MoveSfx(1.0, 0x3ef1);
    s.whoosh(0.0, 0.2, { from: 2000, to: 9000, gain: 0.3 });
    s.arpeggio(0.15, [72, 79, 84], 0.06, { gain: 0.2, duty: 0.25, hold: 0.08 });
    s.arpeggio(0.45, [72, 79, 84], 0.06, { gain: 0.12, duty: 0.25, hold: 0.08 });
    s.sparkle(0.35, 0.4, 5, { gain: 0.1 });
    return s;
  },

  /** Generic target aura (~0.8 s): a quick phrase is echoed back, copied a beat later. */
  mimic: () => {
    const s = new MoveSfx(1.1, 0x313c);
    s.arpeggio(0.02, [76, 79, 74], 0.09, { gain: 0.28, duty: 0.25, hold: 0.09 });
    s.arpeggio(0.4, [76, 79, 74], 0.09, { gain: 0.24, voice: 'wave', hold: 0.12 });
    s.pulse(0.7, 0.2, { freq: () => 1175, gain: env.decay(0.12, 2), duty: 0.5 });
    return s;
  },

  /** Generic target aura (~0.8 s): a focused probing hum locks onto the target with a click. */
  mindreader: () => {
    const s = new MoveSfx(1.1, 0x3d8e);
    s.wave(0.02, 0.6, { freq: (u) => 700 + 500 * u + 40 * Math.sin(2 * Math.PI * 7 * u), gain: env.swell(0.26) });
    s.pulse(0.02, 0.6, { freq: (u) => 1400 + 1000 * u, gain: env.swell(0.06), duty: 0.125 });
    s.noise(0.6, 0.04, { clock: () => 10000, gain: env.decay(0.3, 1), short: true });
    s.pulse(0.6, 0.3, { freq: () => 2349, gain: env.decay(0.18, 2), duty: 0.25 });
    return s;
  },

  /** Generic target aura (~0.8 s), no fleck; no original sound exists: nature's power swells up as a rustling, rising earthy chord. */
  naturepower: () => {
    const s = new MoveSfx(1.1, 0x4a7e);
    s.noise(0.02, 0.8, { clock: (u) => 3000 + 1500 * Math.sin(2 * Math.PI * 4 * u), gain: env.swell(0.12) });
    s.chord(0.02, 0.8, [55, 59, 62, 67], { rate: 0.05, gain: 0.24 });
    s.arpeggio(0.5, [67, 71, 74, 79], 0.06, { gain: 0.16, duty: 0.25, hold: 0.12 });
    return s;
  },

  /** Generic self aura (~0.8 s) + Attack / Sp. Atk drop fleck (~0.85 s): a proud, rough roar, then a falling jingle. */
  nobleroar: () => {
    const s = new MoveSfx(1.45, 0x90b1);
    s.pulse(0.02, 0.75, { freq: (u) => (180 + 80 * Math.sin(Math.PI * u)) * (1 + 0.04 * Math.sin(2 * Math.PI * 22 * u)), gain: (u) => 0.32 * Math.min(1, u * 8) * Math.pow(1 - u, 0.8), duty: 0.25 });
    s.pulse(0.02, 0.75, { freq: (u) => 90 + 40 * Math.sin(Math.PI * u), gain: (u) => 0.2 * Math.min(1, u * 8) * Math.pow(1 - u, 0.8), duty: 0.5 });
    s.noise(0.02, 0.75, { clock: () => 1800, gain: (u) => 0.2 * Math.min(1, u * 8) * Math.pow(1 - u, 0.8) });
    s.statDown(0.85);
    return s;
  },

  /** Generic target aura (~0.8 s), no fleck: quick sniff-sniff noise puffs, then an "aha" two-note blip. */
  odorsleuth: () => {
    const s = new MoveSfx(1.05, 0x0d05);
    for (const at of [0.02, 0.14, 0.26, 0.42, 0.54]) s.noise(at, 0.08, { clock: () => 4500, gain: env.swell(0.3) });
    s.arpeggio(0.7, [76, 83], 0.08, { gain: 0.26, duty: 0.25, hold: 0.12 });
    return s;
  },

  /** Generic target aura (0-0.8 s): two life forces pulled together and split evenly. */
  painsplit: () => {
    const s = new MoveSfx(1.15, 0x9a15);
    s.wave(0.02, 0.4, { freq: (u) => 300 + 300 * u, gain: env.swell(0.3) });
    s.wave(0.02, 0.4, { freq: (u) => 900 - 300 * u, gain: env.swell(0.25) });
    s.pulse(0.42, 0.12, { freq: (u) => 600 * Math.pow(0.7, u), gain: env.decay(0.3, 1.5), duty: 0.25 });
    s.wave(0.5, 0.45, { freq: (u) => 600 * (1 + 0.03 * Math.sin(2 * Math.PI * 7 * u)), gain: env.decay(0.3, 1.2) });
    s.wave(0.5, 0.45, { freq: (u) => 450 * (1 + 0.03 * Math.sin(2 * Math.PI * 7 * u)), gain: env.decay(0.22, 1.2) });
    return s;
  },

  /** Generic target aura (0-0.8 s, all active mons): a haunting, falling dirge in minor. */
  perishsong: () => {
    const s = new MoveSfx(1.45, 0x9e15);
    s.arpeggio(0.02, [76, 75, 71, 68, 64], 0.2, { gain: 0.3, voice: 'wave', hold: 0.32 });
    s.chord(0.1, 1.05, [52, 55, 59], { rate: 0.05, gain: 0.12, vibrato: 0.015 });
    return s;
  },

  /** Generic self aura (0-0.8 s) + Attack-drop fleck: a friendly, cheerful little tune. */
  playnice: () => {
    const s = new MoveSfx(1.5, 0x91a1);
    s.arpeggio(0.02, [72, 76, 79, 76, 84], 0.13, { gain: 0.26, duty: 0.25, hold: 0.14 });
    s.sparkle(0.1, 0.55, 5, { lo: 3000, hi: 5000, gain: 0.12 });
    s.statDown(0.85);
    return s;
  },

  /** Generic target aura (~0.8 s): the user tunes in and copies the target's mood - a rising, humming focus. */
  psychup: () => {
    const s = new MoveSfx(0.95, 0x95c9);
    s.wave(0.02, 0.75, { freq: (u) => (220 + 220 * u) * (1 + 0.05 * Math.sin(2 * Math.PI * 8 * u)), gain: env.swell(0.32) });
    s.pulse(0.02, 0.75, { freq: (u) => 110 + 110 * u, gain: env.swell(0.12), duty: 0.5 });
    s.arpeggio(0.6, [69, 76], 0.08, { gain: 0.2, voice: 'wave', hold: 0.2 });
    return s;
  },

  /** Generic target aura (~0.8 s): the user's colours shift to the target's - a mirrored up/down sweep. */
  reflecttype: () => {
    const s = new MoveSfx(1.0, 0x7e77);
    s.pulse(0.02, 0.4, { freq: (u) => 400 * Math.pow(4, u), gain: env.swell(0.18), duty: 0.25 });
    s.pulse(0.02, 0.4, { freq: (u) => 1600 * Math.pow(0.25, u), gain: env.swell(0.18), duty: 0.5 });
    s.chord(0.42, 0.45, [76, 81, 85], { rate: 0.035, gain: 0.22 });
    s.sparkle(0.45, 0.4, 5, { gain: 0.12 });
    return s;
  },

  /** Generic target aura (~0.8 s): a fierce bellowing roar that blows the target away. */
  roar: () => {
    const s = new MoveSfx(1.0, 0x50a2);
    s.pulse(0.0, 0.75, { freq: (u) => (190 - 70 * u) * (1 + 0.05 * Math.sin(2 * Math.PI * 18 * u)), gain: (u) => 0.3 * Math.min(1, u * 8) * Math.pow(1 - u, 0.7), duty: 0.25 });
    s.pulse(0.0, 0.75, { freq: (u) => (285 - 100 * u) * (1 + 0.05 * Math.sin(2 * Math.PI * 18 * u)), gain: (u) => 0.15 * Math.min(1, u * 8) * Math.pow(1 - u, 0.7), duty: 0.125 });
    s.noise(0.0, 0.8, { clock: env.ramp(3500, 1200), gain: (u) => 0.3 * Math.min(1, u * 6) * Math.pow(1 - u, 0.8) });
    s.whoosh(0.55, 0.35, { from: 6000, to: 2000, gain: 0.2 });
    return s;
  },

  /** Generic self aura (~0.8 s) + Speed drop fleck (~0.85 s): a menacing grimace – a low creepy growl and a dissonant sting. */
  scaryface: () => {
    const s = new MoveSfx(1.4, 0x5ca2);
    s.pulse(0.0, 0.7, { freq: (u) => 98 * (1 + 0.04 * Math.sin(2 * Math.PI * 6 * u)), gain: env.swell(0.25), duty: 0.125 });
    s.pulse(0.0, 0.7, { freq: (u) => 104 * (1 + 0.04 * Math.sin(2 * Math.PI * 6 * u)), gain: env.swell(0.15), duty: 0.25 });
    s.pulse(0.55, 0.18, { freq: () => 740, gain: env.decay(0.22, 1.5), duty: 0.25 });
    s.pulse(0.55, 0.18, { freq: () => 784, gain: env.decay(0.18, 1.5), duty: 0.5 });
    s.statDown(0.85, 0.25);
    return s;
  },

  /** Generic self aura (~0.8 s) + Defense drop fleck (~0.85 s): a grating, dissonant shriek that wavers on and on. */
  screech: () => {
    const s = new MoveSfx(1.45, 0x5c4e);
    s.pulse(0.02, 0.8, { freq: (u) => 2400 * (1 + 0.05 * Math.sin(2 * Math.PI * 14 * u)), gain: env.swell(0.2), duty: 0.125 });
    s.pulse(0.02, 0.8, { freq: (u) => 2550 * (1 + 0.05 * Math.sin(2 * Math.PI * 11 * u + 1)), gain: env.swell(0.16), duty: 0.25 });
    s.noise(0.02, 0.8, { clock: () => 9000, gain: env.swell(0.08), short: true });
    s.statDown(0.85);
    return s;
  },

  /** Generic target aura (~0.8 s), no fleck: a plain, flat-toned beam that boops the target's mind blank. */
  simplebeam: () => {
    const s = new MoveSfx(1.1, 0x51b3);
    s.pulse(0.02, 0.7, { freq: (u) => 880 * (Math.floor(u * 10) % 2 ? 1 : 1.5), gain: env.swell(0.22), duty: 0.5 });
    s.wave(0.02, 0.7, { freq: () => 440, gain: env.swell(0.2) });
    s.arpeggio(0.72, [72, 60], 0.1, { gain: 0.25, voice: 'wave', hold: 0.15 });
    return s;
  },

  /** Generic target aura (~0.8 s) + sleep fleck (~0.6 s): a gentle sung lullaby melody drifting over the target. */
  sing: () => {
    const s = new MoveSfx(1.3, 0x5129);
    s.arpeggio(0.02, [76, 79, 81, 79], 0.14, { gain: 0.24, voice: 'wave', hold: 0.18 });
    s.arpeggio(0.02, [88, 91, 93, 91], 0.14, { gain: 0.06, duty: 0.125, hold: 0.12 });
    s.sleep(0.62, 0.22);
    return s;
  },

  /** Generic target aura (~0.8 s), no fleck: quick pencil scribbles copy the target's move, ending in a little tick. */
  sketch: () => {
    const s = new MoveSfx(1.1, 0x5e7c);
    for (let i = 0; i < 7; i++) {
      const at = 0.04 + i * 0.1;
      s.noise(at, 0.07, { clock: () => 5000 + s.random() * 5000, gain: env.attackDecay(0.28, 0.3) });
    }
    s.pulse(0.78, 0.08, { freq: () => 1760, gain: env.decay(0.22, 1.5), duty: 0.25 });
    s.pulse(0.86, 0.1, { freq: () => 2637, gain: env.decay(0.18, 1.5), duty: 0.25 });
    return s;
  },

  /** Generic self aura (0-0.8 s) + accuracy drop fleck (0.85 s): a thick puff of smoke billows out. */
  smokescreen: () => {
    const s = new MoveSfx(1.5, 0x5305);
    s.noise(0.02, 0.15, { clock: env.ramp(3000, 900), gain: env.attackDecay(0.35, 0.1) });
    s.noise(0.05, 0.75, { clock: env.ramp(900, 400), gain: env.swell(0.3) });
    s.statDown(0.85);
    return s;
  },

  /** Generic target aura + confusion fleck (~0.6 s): piercing ultrasonic rings sweep at the foe. */
  supersonic: () => {
    const s = new MoveSfx(1.15, 0x5502);
    for (let i = 0; i < 4; i++) s.pulse(0.02 + i * 0.13, 0.13, { freq: (u) => 2600 + 600 * u, gain: env.attackDecay(0.16, 0.2), duty: 0.125 });
    s.wave(0.02, 0.55, { freq: (u) => 1400 + 300 * Math.sin(2 * Math.PI * 7 * u), gain: env.swell(0.2) });
    s.confusion(0.6, 0.2);
    return s;
  },

  /** Generic self aura + confusion fleck (~0.85 s): a cocky taunt, then the foe reels. */
  swagger: () => {
    const s = new MoveSfx(1.45, 0x5a66);
    s.arpeggio(0.02, [55, 59, 62], 0.1, { gain: 0.3, duty: 0.5, hold: 0.12 });
    s.pulse(0.35, 0.3, { freq: (u) => 196 * (1 + 0.05 * Math.sin(2 * Math.PI * 7 * u)), gain: env.decay(0.3, 1.2), duty: 0.25 });
    s.noise(0.35, 0.1, { clock: () => 4000, gain: env.decay(0.18, 1) });
    s.confusion(0.85, 0.2);
    return s;
  },

  /** Generic self aura + stat-down fleck (~0.85 s): a sweet, swaying waft of fragrance. */
  sweetscent: () => {
    const s = new MoveSfx(1.4, 0x5ee7);
    s.chord(0.02, 0.8, [72, 76, 79], { rate: 0.05, gain: 0.22, vibrato: 0.01 });
    s.noise(0.02, 0.8, { clock: () => 2500, gain: env.swell(0.1) });
    s.statDown(0.85, 0.22);
    return s;
  },

  /** Generic self aura (~0.8 s) + Defense-down fleck (~0.85 s): a cute tail wag - swishing back and forth, then the falling jingle. */
  tailwhip: () => {
    const s = new MoveSfx(1.5, 0x7a1f);
    for (let i = 0; i < 4; i++) {
      const at = 0.05 + i * 0.19;
      s.noise(at, 0.13, { clock: i % 2 ? env.ramp(7000, 3000) : env.ramp(3000, 7000), gain: env.swell(0.2) });
      s.pulse(at, 0.1, { freq: () => (i % 2 ? 1175 : 1397), gain: env.decay(0.13, 1.5), duty: 0.25 });
    }
    s.statDown(0.85);
    return s;
  },

  /** Generic target aura (~0.8 s) + confusion fleck (~0.6 s): a wobbly, tipsy dance tune swaying from side to side. */
  teeterdance: () => {
    const s = new MoveSfx(1.25, 0x7ee7);
    [72, 76, 74, 79, 72, 76].forEach((n, i) => {
      const f = 440 * Math.pow(2, (n - 69) / 12);
      s.wave(0.02 + i * 0.12, 0.13, { freq: (u) => f * (1 + 0.03 * Math.sin(2 * Math.PI * 3 * u)), gain: env.decay(0.28, 1) });
    });
    s.pulse(0.02, 0.75, { freq: (u) => 130 * (1 + 0.05 * Math.sin(2 * Math.PI * 4 * u)), gain: env.swell(0.14), duty: 0.5 });
    s.confusion(0.6, 0.2);
    return s;
  },

  /** Generic self aura (~0.8 s) + double stat-down fleck (~0.85 s): giggly tickling - fluttering high chirps, then the falling jingle. */
  tickle: () => {
    const s = new MoveSfx(1.5, 0x71c1);
    for (let i = 0; i < 9; i++) {
      const at = 0.04 + i * 0.085;
      const f = 1800 + (i % 3) * 400 + s.random() * 200;
      s.pulse(at, 0.06, { freq: (u) => f * (1 + 0.25 * Math.sin(Math.PI * u)), gain: env.decay(0.18, 1), duty: 0.125 });
    }
    s.noise(0.04, 0.75, { clock: () => 7000, gain: (u) => 0.08 * Math.sin(Math.PI * u) * (0.5 + 0.5 * Math.sin(2 * Math.PI * 9 * u)) });
    s.statDown(0.85);
    return s;
  },

  /** Generic target aura (~0.8 s): the user's shape melts and remolds, a wobbling morph that settles. */
  transform: () => {
    const s = new MoveSfx(1.2, 0x7a5f);
    s.wave(0.02, 0.85, { freq: (u) => (400 + 400 * u) * (1 + 0.08 * Math.sin(2 * Math.PI * 7 * u)), gain: env.swell(0.3) });
    s.pulse(0.02, 0.85, { freq: (u) => (800 - 300 * u) * (1 + 0.05 * Math.sin(2 * Math.PI * 9 * u)), gain: env.swell(0.1), duty: 0.125 });
    s.sparkle(0.2, 0.6, 5, { lo: 2000, hi: 3500, gain: 0.12 });
    s.arpeggio(0.8, [72, 79], 0.08, { gain: 0.15, voice: 'wave', hold: 0.15 });
    return s;
  },

  /** Generic target aura (~0.8 s): a howling gust swells and blows the target away. */
  whirlwind: () => {
    const s = new MoveSfx(1.15, 0x3e1d);
    s.noise(0.0, 0.95, { clock: (u) => 2000 + 4000 * u + 1200 * Math.sin(2 * Math.PI * 4 * u), gain: (u) => 0.38 * Math.min(1, u * 3) * Math.pow(1 - u, 0.7) });
    s.wave(0.05, 0.85, { freq: (u) => 600 + 500 * u + 120 * Math.sin(2 * Math.PI * 4 * u), gain: (u) => 0.1 * Math.sin(Math.PI * u) });
    return s;
  },

  /** Generic target aura (~0.8 s, no fleck – sleep comes next turn): a big lazy yawn, a slow falling sigh. */
  yawn: () => {
    const s = new MoveSfx(1.15, 0x3eaa);
    s.wave(0.02, 0.4, { freq: (u) => 330 * Math.pow(1.5, Math.sin(Math.PI * u)), gain: env.swell(0.3) });
    s.wave(0.42, 0.55, { freq: (u) => 440 * Math.pow(0.5, u), gain: env.decay(0.3, 1) });
    s.noise(0.42, 0.5, { clock: () => 3000, gain: env.decay(0.08, 1) });
    s.arpeggio(0.6, [72, 67], 0.16, { gain: 0.1, voice: 'wave', hold: 0.25 });
    return s;
  },
};
