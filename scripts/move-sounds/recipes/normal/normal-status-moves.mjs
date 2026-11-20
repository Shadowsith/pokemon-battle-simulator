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

  /** Attract.play (8 hearts pop 0-0.63 s, 0.09 s apart, target blushes 0.2-1.1 s, one small heart floats up 1.1-1.6 s): a run of sweet heart blips, then a last soft ping. */
  attract: () => {
    const s = new MoveSfx(1.8, 0xa77c);
    for (let i = 0; i < 8; i++) {
      s.pulse(i * 0.09, 0.1, { freq: () => [1046.5, 1318.5, 1568, 1318.5][i % 4] * (i < 4 ? 1 : 1.25), gain: env.decay(0.14, 2), duty: 0.5 });
    }
    s.wave(0.2, 0.8, { freq: (u) => 784 * (1 + 0.02 * Math.sin(2 * Math.PI * 6 * u)), gain: env.swell(0.12) });
    s.arpeggio(1.1, [79, 84], 0.08, { gain: 0.22, voice: 'wave', hold: 0.16 });
    s.sparkle(1.2, 0.35, 4, { lo: 3000, hi: 5000, gain: 0.1 });
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

  /**
   * Custom (2.8 s): a soft pop as the speech bubble swells (0.15-0.5 s), a
   * whoosh as it rushes to the target (0.5-0.85 s), a hushed murmur of three
   * blips as the "..." bubble shows (1.05-1.6 s), then the stat-down run (1.6 s).
   */
  confide: () => {
    const s = new MoveSfx(2.8, 0xc0f1);
    s.pulse(0.15, 0.2, { freq: env.ramp(400, 900), gain: env.swell(0.2), duty: 0.5 });
    s.whoosh(0.5, 0.35, { from: 1500, to: 6000, gain: 0.22 });
    s.arpeggio(1.1, [67, 67, 67], 0.14, { gain: 0.12, voice: 'wave', hold: 0.07 });
    s.statDown(1.6);
    return s;
  },

  /** Conversion2.play (pixels flicker on the target 0-0.55 s, stream to the user 0.55-0.9 s, user flickers 0.9-1.4 s): digital bleeps read the target, a falling zip, then the type flips. */
  conversion2: () => {
    const s = new MoveSfx(1.5, 0xc0b2);
    s.arpeggio(0.02, [91, 86, 88, 81, 84, 76, 79, 72, 84, 79], 0.05, { gain: 0.2, duty: 0.125, hold: 0.04 });
    s.pulse(0.55, 0.35, { freq: (u) => 1600 * Math.pow(0.4, u), gain: env.swell(0.16), duty: 0.5 });
    for (let i = 0; i < 4; i++) s.pulse(0.9 + i * 0.1, 0.06, { freq: () => (i % 2 ? 1568 : 1046.5), gain: env.decay(0.16, 1), duty: 0.25 });
    s.arpeggio(1.3, [79, 84], 0.05, { gain: 0.12, duty: 0.25, hold: 0.05 });
    return s;
  },

  /**
   * NormalStatusMoveAnimations.playDisable: white glint on the target (0-0.35 s), scene and
   * target grey over (0.3-0.6 s, held to 1.0 s), come back (1.0-1.3 s). A glint ping, a
   * power-down "no" buzzer sinking low, a lock click, then a faint hum back.
   */
  disable: () => {
    const s = new MoveSfx(1.45, 0xd15b);
    s.pulse(0.05, 0.15, { freq: () => 2637, gain: env.decay(0.14, 2), duty: 0.125 });
    s.pulse(0.3, 0.18, { freq: () => 196, gain: env.decay(0.3, 0.5), duty: 0.5 });
    s.pulse(0.5, 0.3, { freq: (u) => 147 - 40 * u, gain: env.decay(0.3, 0.5), duty: 0.5 });
    s.noise(0.62, 0.03, { clock: () => 9000, gain: env.decay(0.3, 1) });
    s.pulse(0.62, 0.04, { freq: () => 1200, gain: env.decay(0.2, 1), duty: 0.25 });
    s.pulse(1.0, 0.3, { freq: env.ramp(110, 220), gain: env.swell(0.1), duty: 0.25 });
    return s;
  },

  /**
   * NormalStatusMoveAnimations.playEncore: dark stage (0-0.3 s), spotlight on at ~0.3 s (to
   * ~1.8 s), confetti flutters (0.4-1.8 s), lights up again by ~2.1 s. A spotlight clunk,
   * then a cheerful clapping cheer that demands an encore.
   */
  encore: () => {
    const s = new MoveSfx(2.1, 0xe2c0);
    s.thud(0.3, 0.3, 0.2);
    s.pulse(0.3, 0.06, { freq: () => 1800, gain: env.decay(0.15, 1), duty: 0.25 });
    for (let i = 0; i < 10; i++) s.noise(0.45 + i * 0.12, 0.05, { clock: () => 9000, gain: env.decay(0.3, 1.5) });
    s.arpeggio(0.45, [72, 76, 79, 76, 79, 84], 0.12, { gain: 0.2, duty: 0.25, hold: 0.1 });
    s.sparkle(0.5, 1.2, 10, { lo: 3000, hi: 6000, gain: 0.08 });
    s.wave(1.2, 0.5, { freq: () => 1046.5, gain: env.decay(0.18, 1.5) });
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

  /**
   * NormalStatusMoveAnimations.playFlash: white flash with the user as a silhouette
   * (0-0.55 s), then the target turns blue under stat-down bubbles (0.55-1.45 s).
   * A blinding bright burst, then the accuracy-drop jingle.
   */
  flash: () => {
    const s = new MoveSfx(1.5, 0xf1a5);
    s.chord(0.0, 0.35, [84, 88, 91, 96], { rate: 0.02, gain: 0.22, voice: 'pulse' });
    s.noise(0.02, 0.4, { clock: (u) => 18000 - 10000 * u, gain: env.attackDecay(0.3, 0.05) });
    s.wave(0.25, 0.4, { freq: env.ramp(2100, 1400), gain: env.decay(0.2, 1.5) });
    s.sparkle(0.1, 0.45, 8, { lo: 4000, hi: 7000, gain: 0.14 });
    s.statDown(0.6);
    return s;
  },

  /** Foresight.play (magnifying glass circles the target 0-0.9 s, target spotted 0.9-1.3 s): high searching blips, then a lock-on ping. */
  foresight: () => {
    const s = new MoveSfx(1.4, 0xf05e);
    for (let i = 0; i < 6; i++) s.pulse(0.05 + i * 0.14, 0.06, { freq: () => 2093 + i * 180, gain: env.decay(0.16, 1), duty: 0.25 });
    s.wave(0.0, 0.85, { freq: (u) => 1200 + 400 * Math.sin(2 * Math.PI * 2 * u), gain: env.swell(0.1) });
    s.pulse(0.9, 0.4, { freq: () => 3520, gain: env.decay(0.22, 1.5), duty: 0.125 });
    s.pulse(0.9, 0.4, { freq: () => 1760, gain: env.decay(0.14, 1.5), duty: 0.5 });
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

  /**
   * NormalSoundMoveAnimations.playGrowl: two growls with red glow pulses (0 / 0.375 s, to 0.75 s),
   * then stat-down bubbles on the target (0.75-1.65 s). A cute but menacing growl, then the drop jingle.
   */
  growl: () => {
    const s = new MoveSfx(1.7, 0x6201);
    for (const [at, f] of [[0.02, 230], [0.39, 200]]) {
      s.pulse(at, 0.32, { freq: (u) => f * (1 + 0.1 * Math.sin(2 * Math.PI * 9 * u)) * (1 - 0.2 * u), gain: env.attackDecay(0.3, 0.2), duty: 0.25 });
      s.noise(at, 0.3, { clock: () => 900, gain: env.attackDecay(0.12, 0.2) });
    }
    s.statDown(0.75);
    return s;
  },

  /**
   * NormalFoeStatusMoveAnimations.playLeer: dark (0-0.28 s), glint in the eyes (0.3-0.65 s),
   * the scene clears (0.65-0.95 s), the target's blue stat drop (0.95-1.85 s).
   * A low menacing drone, a sharp glint, the stat-down jingle.
   */
  leer: () => {
    const s = new MoveSfx(2.05, 0x1ee7);
    s.pulse(0.0, 0.9, { freq: (u) => 110 + 10 * Math.sin(2 * Math.PI * 4 * u), gain: env.swell(0.15), duty: 0.25 });
    s.pulse(0.32, 0.12, { freq: () => 3136, gain: env.decay(0.2, 1), duty: 0.125 });
    s.pulse(0.44, 0.3, { freq: (u) => 2637 * (1 + 0.01 * Math.sin(2 * Math.PI * 20 * u)), gain: env.decay(0.18, 1.2), duty: 0.125 });
    s.noise(0.32, 0.4, { clock: () => 11000, gain: env.decay(0.08, 1.5) });
    s.statDown(0.95);
    return s;
  },

  /** LockOn.play (reticles close in 0-0.6 s, locked reticle blinks 0.6-0.9 s): sonar beeps speeding up, then a blinking lock tone. */
  lockon: () => {
    const s = new MoveSfx(1.1, 0x10c0);
    [0.0, 0.18, 0.32, 0.43, 0.51, 0.57].forEach((at, i) => {
      s.pulse(at, 0.05, { freq: () => 1760 + i * 60, gain: env.decay(0.22, 1), duty: 0.25 });
    });
    for (const at of [0.6, 0.75]) {
      s.pulse(at, 0.075, { freq: () => 2093, gain: () => 0.22, duty: 0.5 });
      s.pulse(at, 0.075, { freq: () => 1046, gain: () => 0.12, duty: 0.25 });
    }
    s.pulse(0.9, 0.12, { freq: () => 2093, gain: env.decay(0.2, 1.5), duty: 0.5 });
    return s;
  },

  /**
   * NormalFoeStatusMoveAnimations.playLovelyKiss: the heart pops up (0-0.2 s), beats at
   * ~0.31 / 0.43 s, bursts into small hearts at 0.78 s, "Z"s rise from 1.18 s (to ~3.0 s).
   * A kiss smack, two heartbeats, a sparkly burst, then the sleepy lullaby.
   */
  lovelykiss: () => {
    const s = new MoveSfx(3.1, 0x10e1);
    s.pulse(0.02, 0.05, { freq: (u) => 900 + 900 * u, gain: env.decay(0.28, 1), duty: 0.5 });
    s.noise(0.02, 0.04, { clock: () => 6000, gain: env.decay(0.2, 1) });
    for (const at of [0.31, 0.43]) s.wave(at, 0.1, { freq: env.ramp(180, 120), gain: env.decay(0.3, 1) });
    s.wave(0.1, 0.65, { freq: (u) => 784 * (1 + 0.03 * Math.sin(2 * Math.PI * 7 * u)) * (1 - 0.15 * u), gain: env.swell(0.18) });
    s.sparkle(0.78, 0.4, 6, { lo: 3000, hi: 6000, gain: 0.12 });
    s.arpeggio(0.8, [79, 84, 83], 0.12, { gain: 0.12, duty: 0.25, hold: 0.14 });
    s.sleep(1.18);
    s.sleep(1.9, 0.14);
    return s;
  },

  /** MeanLook.play (scene washes magenta 0-0.25 s, eye opens 0.3-0.6 s, pulses at 0.8 s, shuts 1.0-1.3 s): a cold low drone, a creeping dissonant whine as the eye opens, a throb, then it fades. */
  meanlook: () => {
    const s = new MoveSfx(1.5, 0x3e10);
    s.wave(0.0, 1.35, { freq: () => 98, gain: env.swell(0.22) });
    s.wave(0.3, 1.0, { freq: (u) => 740 + 40 * u + 8 * Math.sin(2 * Math.PI * 5 * u), gain: env.swell(0.1) });
    s.wave(0.3, 1.0, { freq: (u) => 784 + 40 * u, gain: env.swell(0.07) });
    s.pulse(0.8, 0.2, { freq: () => 110, gain: env.decay(0.25, 1.5), duty: 0.25 });
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

  /**
   * NormalFoeStatusMoveAnimations.playMimic: a light rises out of the target (0-0.3 s), floats to
   * the user (0.3-0.9 s) and swells into a glow (0.9-1.55 s). A phrase, then the same echoed back.
   */
  mimic: () => {
    const s = new MoveSfx(1.75, 0x313c);
    s.arpeggio(0.02, [76, 79, 74], 0.09, { gain: 0.26, duty: 0.25, hold: 0.09 });
    s.pulse(0.3, 0.6, { freq: (u) => 900 + 500 * Math.sin(Math.PI * u), gain: env.swell(0.08), duty: 0.125 });
    s.arpeggio(0.9, [76, 79, 74], 0.09, { gain: 0.24, voice: 'wave', hold: 0.12 });
    s.pulse(1.2, 0.3, { freq: () => 1175, gain: env.decay(0.12, 2), duty: 0.5 });
    return s;
  },

  /** MindReader.play (scene darkens 0-0.25 s, ring closes in 0.25-0.75 s, flares 0.75-0.95 s): a focused probing hum that narrows and rises, then locks on with a click. */
  mindreader: () => {
    const s = new MoveSfx(1.35, 0x31de);
    s.wave(0.2, 0.6, { freq: env.ramp(330, 990), gain: env.swell(0.16) });
    s.wave(0.2, 0.6, { freq: env.ramp(337, 1000), gain: env.swell(0.1) });
    s.pulse(0.75, 0.05, { freq: () => 3136, gain: env.decay(0.22, 1), duty: 0.25 });
    s.wave(0.75, 0.4, { freq: () => 1318.5, gain: env.decay(0.14, 1.5) });
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

  /**
   * Custom (2.7 s): a big growling roar as the rays blast out (0-0.7 s), a
   * fiery whoosh as the red ring spirals round the target (0.6-1.3 s), then the
   * stat-down run (1.35 s).
   */
  nobleroar: () => {
    const s = new MoveSfx(2.7, 0x90b1);
    s.noise(0.0, 0.7, { clock: (u) => 1200 - 600 * u, gain: env.attackDecay(0.4, 0.1) });
    s.pulse(0.0, 0.7, { freq: (u) => 140 - 40 * u + 10 * Math.sin(u * 60), gain: env.attackDecay(0.24, 0.1), duty: 0.25 });
    s.whoosh(0.6, 0.6, { from: 800, to: 3000, gain: 0.2 });
    s.burn(0.7, 0.18);
    s.statDown(1.35);
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

  /** PerishSong.play (dark + spotlight rays 0-0.3 s, notes drift 0.2-1.15 s, rays fade 1.15-1.35 s, red eyes glint 1.3-1.7 s): a haunting falling dirge in minor, then a low ominous sting. */
  perishsong: () => {
    const s = new MoveSfx(2.0, 0x9e15);
    s.arpeggio(0.2, [76, 74, 72, 71, 69, 68, 69], 0.135, { gain: 0.2, voice: 'wave', hold: 0.2 });
    s.wave(0.15, 1.05, { freq: () => 220, gain: env.swell(0.08) });
    s.wave(1.3, 0.45, { freq: () => 110, gain: env.decay(0.22, 1) });
    s.wave(1.3, 0.45, { freq: () => 116.5, gain: env.decay(0.16, 1) });
    return s;
  },

  /**
   * Custom (2.7 s): a friendly boing as the user hops (0-0.45 s), sweet
   * twinkling chimes round the target (0.45-1.25 s), then the stat-down run
   * (1.3 s).
   */
  playnice: () => {
    const s = new MoveSfx(2.7, 0x91a1);
    s.pulse(0.0, 0.3, { freq: env.ramp(300, 700), gain: env.swell(0.22), duty: 0.5 });
    s.arpeggio(0.45, [84, 88, 91, 96], 0.1, { gain: 0.16, voice: 'wave', hold: 0.12 });
    s.sparkle(0.45, 0.7, 8, { lo: 3500, hi: 6500, gain: 0.12 });
    s.statDown(1.3);
    return s;
  },

  /** PsychUp.play (4 swirl rings spiral in 0-0.95 s, 0.15 s apart; user glows pink 0.2-1.1 s): a rising, humming focus with a wobble per ring. */
  psychup: () => {
    const s = new MoveSfx(1.2, 0x95c0);
    s.wave(0.0, 1.05, { freq: env.ramp(330, 880), gain: env.swell(0.18) });
    for (let i = 0; i < 4; i++) s.wave(i * 0.15, 0.4, { freq: (u) => 660 + 440 * u + 30 * Math.sin(2 * Math.PI * 10 * u), gain: env.swell(0.08) });
    s.arpeggio(0.95, [76, 81], 0.06, { gain: 0.12, voice: 'wave', hold: 0.1 });
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

  /** NormalSoundMoveAnimations.playRoar (rear up 0-0.25 s, bolts fly 0.15-0.8 s, target blown back at 0.45 s, slides home to ~1.2 s): a fierce bellowing roar that blows the target away. */
  roar: () => {
    const s = new MoveSfx(1.35, 0x50a2);
    s.pulse(0.05, 0.8, { freq: (u) => (190 - 70 * u) * (1 + 0.05 * Math.sin(2 * Math.PI * 18 * u)), gain: (u) => 0.3 * Math.min(1, u * 8) * Math.pow(1 - u, 0.7), duty: 0.25 });
    s.pulse(0.05, 0.8, { freq: (u) => (285 - 100 * u) * (1 + 0.05 * Math.sin(2 * Math.PI * 18 * u)), gain: (u) => 0.15 * Math.min(1, u * 8) * Math.pow(1 - u, 0.7), duty: 0.125 });
    s.noise(0.05, 0.85, { clock: env.ramp(3500, 1200), gain: (u) => 0.3 * Math.min(1, u * 6) * Math.pow(1 - u, 0.8) });
    s.whoosh(0.45, 0.4, { from: 6000, to: 2000, gain: 0.22 });
    return s;
  },

  /** ScaryFace.play (scene darkens 0-0.2 s, face looms 0.15-0.6 s, holds to 0.8 s, fades by 1.0 s, Speed drop 1.0 s on): a low creepy growl swelling into a dissonant sting, then the stat-down. */
  scaryface: () => {
    const s = new MoveSfx(1.9, 0x5ca7);
    s.pulse(0.1, 0.7, { freq: (u) => 80 + 20 * u + 6 * Math.sin(2 * Math.PI * 18 * u), gain: env.swell(0.22), duty: 0.25 });
    s.wave(0.5, 0.35, { freq: () => 622, gain: env.decay(0.16, 1.5) });
    s.wave(0.5, 0.35, { freq: () => 659, gain: env.decay(0.14, 1.5) });
    s.statDown(1.0);
    return s;
  },

  /** NormalSoundMoveAnimations.playScreech (jagged rings flare at 0 / 0.21 / 0.42 s, shriek to 0.75 s, blue Defense drop 0.75-1.65 s): a grating, dissonant shriek. */
  screech: () => {
    const s = new MoveSfx(1.75, 0x5c4e);
    s.pulse(0.02, 0.75, { freq: (u) => 2400 * (1 + 0.05 * Math.sin(2 * Math.PI * 14 * u)), gain: env.swell(0.2), duty: 0.125 });
    s.pulse(0.02, 0.75, { freq: (u) => 2550 * (1 + 0.05 * Math.sin(2 * Math.PI * 11 * u + 1)), gain: env.swell(0.16), duty: 0.25 });
    s.noise(0.02, 0.75, { clock: () => 9000, gain: env.swell(0.08), short: true });
    s.statDown(0.8);
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

  /**
   * NormalSoundMoveAnimations.playSing: the scene pales (0-0.25 s), a white ring pulses
   * round the user (0.25-0.7 s), eight notes float to the target (0.25-1.7 s), colours
   * return (1.7-1.95 s). A soft shimmer, then an eight-note lullaby.
   */
  sing: () => {
    const s = new MoveSfx(2.05, 0x5129);
    s.sparkle(0.25, 0.4, 3, { lo: 3000, hi: 5000, gain: 0.08 });
    s.arpeggio(0.25, [76, 79, 81, 79, 76, 79, 81, 84], 0.17, { gain: 0.22, voice: 'wave', hold: 0.2 });
    s.arpeggio(0.25, [88, 91, 93, 91, 88, 91, 93, 96], 0.17, { gain: 0.05, duty: 0.125, hold: 0.12 });
    return s;
  },

  /** Sketch.play (pencil scribbles 4 strokes 0-0.8 s leaving stars, target flickers 0.8-1.1 s, stars fade to ~1.4 s): scratchy pencil strokes with twinkles, then a copying blip. */
  sketch: () => {
    const s = new MoveSfx(1.45, 0x5e7c);
    for (let i = 0; i < 4; i++) s.noise(i * 0.2, 0.18, { clock: () => 6000 + s.random() * 2000, gain: (u) => 0.12 * Math.sin(Math.PI * u) });
    s.sparkle(0.1, 0.75, 8, { lo: 3000, hi: 5500, gain: 0.1 });
    s.arpeggio(0.8, [84, 79, 84, 88], 0.075, { gain: 0.16, duty: 0.25, hold: 0.06 });
    return s;
  },

  /**
   * NormalFoeStatusMoveAnimations.playSmokescreen: dust kicks up as a black ball is fired
   * (0-0.4 s), it bursts into a smoke cloud over the target (0.4-1.15 s), stat drop
   * (1.15-2.05 s). A puff, a whoosh, a muffled pop, billowing smoke, then the drop.
   */
  smokescreen: () => {
    const s = new MoveSfx(2.2, 0x5305);
    s.noise(0.0, 0.12, { clock: env.ramp(3000, 1200), gain: env.attackDecay(0.25, 0.1) });
    s.whoosh(0.02, 0.38, { from: 900, to: 2500, gain: 0.2 });
    s.noise(0.4, 0.15, { clock: env.ramp(3000, 900), gain: env.attackDecay(0.4, 0.1) });
    s.noise(0.42, 0.7, { clock: env.ramp(900, 400), gain: env.swell(0.28) });
    s.statDown(1.2);
    return s;
  },

  /** Custom (dark 0-0.2 s, three yellow rings ripple out of the target at 0.2 / 0.35 / 0.5 s, dark lifts 0.95-1.15 s, dizzy birds 1.15-2.55 s): piercing ultrasonic rings, then the confusion jingle. */
  supersonic: () => {
    const s = new MoveSfx(2.6, 0x5502);
    for (let i = 0; i < 3; i++) s.pulse(0.2 + i * 0.15, 0.4, { freq: (u) => 2600 + 600 * u, gain: env.attackDecay(0.16, 0.2), duty: 0.125 });
    s.wave(0.2, 0.75, { freq: (u) => 1400 + 300 * Math.sin(2 * Math.PI * 7 * u), gain: env.swell(0.2) });
    s.confusion(1.15, 0.2);
    return s;
  },

  /** Swagger.play (anger mark throbs 0-0.45 s, target flushes red 0.3-0.7 s, Attack up 0.6-1.4 s, confusion birds 1.4-2.3 s): a mocking blare, the stat-up, then the dizzy warble. */
  swagger: () => {
    const s = new MoveSfx(2.4, 0x5a99);
    s.arpeggio(0.0, [67, 71, 74], 0.1, { gain: 0.2, duty: 0.25, hold: 0.12 });
    s.pulse(0.3, 0.3, { freq: (u) => 160 + 20 * Math.sin(2 * Math.PI * 10 * u), gain: env.swell(0.14), duty: 0.25 });
    s.statUp(0.6);
    s.confusion(1.4);
    return s;
  },

  /** SweetScent.play (pink haze 0-0.3 s, petals and rings drift 0.1-1.1 s, haze clears to 1.25 s, evasion drop 1.25 s on): a sweet, airy shimmer, then the stat-down. */
  sweetscent: () => {
    const s = new MoveSfx(2.2, 0x5ce7);
    s.chord(0.0, 1.15, [79, 83, 86, 91], { rate: 0.09, gain: 0.12, voice: 'wave', vibrato: 0.01 });
    s.noise(0.0, 1.1, { clock: () => 5000, gain: env.swell(0.06) });
    s.sparkle(0.2, 0.8, 6, { lo: 3000, hi: 5000, gain: 0.08 });
    s.statDown(1.25);
    return s;
  },

  /** Custom (four tail wags 0-0.8 s, 0.2 s each; stat drop 0.85-1.75 s): swishy wags, then the drop. */
  tailwhip: () => {
    const s = new MoveSfx(1.8, 0x7a1f);
    for (let i = 0; i < 4; i++) {
      const at = i * 0.2;
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

  /** Custom (white flash 0-0.2 s, melts flat 0.2-0.45 s, stretches back up under a flickering pixel mosaic 0.45-0.95 s, white flash 0.95 s, settles to 1.2 s): a warbling melt, glitchy blips, a bright chime. */
  transform: () => {
    const s = new MoveSfx(1.35, 0x7a5f);
    s.pulse(0.0, 0.08, { freq: () => 1760, gain: env.decay(0.15, 1.5), duty: 0.25 });
    s.wave(0.2, 0.25, { freq: (u) => (600 - 350 * u) * (1 + 0.08 * Math.sin(2 * Math.PI * 9 * u)), gain: env.swell(0.28) });
    for (let i = 0; i < 8; i++) {
      const at = 0.45 + i * 0.0625;
      s.pulse(at, 0.05, { freq: () => 400 + s.random() * 1400, gain: env.decay(0.12, 1), duty: 0.125 });
    }
    s.wave(0.45, 0.5, { freq: (u) => 250 + 450 * u, gain: env.swell(0.14) });
    s.arpeggio(0.95, [72, 79], 0.08, { gain: 0.15, voice: 'wave', hold: 0.15 });
    return s;
  },

  /**
   * NormalStatusMoveAnimations.playWhirlwind: flakes and wind streaks sweep past the target
   * (0-1.0 s); when the move works, the resolver then blows the target away (~1.2-1.7 s).
   * A howling gust swells and sweeps the target off.
   */
  whirlwind: () => {
    const s = new MoveSfx(1.75, 0x3e1d);
    s.noise(0.0, 1.05, { clock: (u) => 2000 + 4000 * u + 1200 * Math.sin(2 * Math.PI * 4 * u), gain: (u) => 0.38 * Math.min(1, u * 3) * Math.pow(1 - u, 0.5) });
    s.wave(0.05, 0.95, { freq: (u) => 600 + 500 * u + 120 * Math.sin(2 * Math.PI * 4 * u), gain: (u) => 0.1 * Math.sin(Math.PI * u) });
    s.whoosh(1.2, 0.5, { from: 2500, to: 9000, gain: 0.3 });
    return s;
  },


  /**
   * NormalStatusMoveAnimations.playYawn: the user stretches in a yawn (0-0.4 s),
   * breath puffs float over the target (0.2-1.4 s), a drowsy bubble breathes at
   * its face with rings drifting up (1.4-2.6 s) and pops. A big lazy yawn, a
   * breathy sigh, sleepy bloops and a soft pop.
   */
  yawn: () => {
    const s = new MoveSfx(2.7, 0x3eaa);
    s.wave(0.02, 0.4, { freq: (u) => 330 * Math.pow(1.5, Math.sin(Math.PI * u)), gain: env.swell(0.3) });
    s.wave(0.42, 0.7, { freq: (u) => 440 * Math.pow(0.5, u), gain: env.decay(0.28, 1) });
    s.noise(0.2, 1.2, { clock: () => 2500, gain: env.swell(0.1) });
    s.bubbles(1.5, 0.9, 5, { lo: 500, hi: 900, gain: 0.14 });
    s.arpeggio(1.6, [72, 67], 0.3, { gain: 0.1, voice: 'wave', hold: 0.35 });
    s.pulse(2.55, 0.05, { freq: () => 1400, gain: env.decay(0.15, 1.5), duty: 0.25 });
    return s;
  },
};
