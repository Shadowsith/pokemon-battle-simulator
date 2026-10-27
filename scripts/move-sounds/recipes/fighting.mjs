import { MoveSfx } from '../move-sfx.mjs';
import { env } from '../track.mjs';

/** Fighting-type move sounds. */
export const FIGHTING = {
  /** Generic melee, 3 hits (one every 0.42 s, impacts at 0.17 / 0.59 / 1.01 s): rapid palm thrusts. */
  armthrust: () => {
    const s = new MoveSfx(1.25, 0xa7a7);
    for (let hit = 0; hit < 3; hit++) {
      const at = 0.17 + hit * 0.42;
      s.whoosh(at - 0.12, 0.13, { from: 2000, to: 6000, gain: 0.2 });
      s.thud(at, 0.55, 0.3);
    }
    return s;
  },

  /** Generic pulse (rings every 0.13 s, impact at ~0.56 s): a sphere of aura energy. */
  aurasphere: () => {
    const s = new MoveSfx(1.1, 0xa45f);
    s.pulse(0.0, 0.5, { freq: env.ramp(150, 300), gain: env.ramp(0.05, 0.2), duty: 0.25 });
    s.wave(0.0, 0.5, { freq: env.ramp(300, 600), gain: env.ramp(0.05, 0.22) });
    for (const at of [0.02, 0.15, 0.28]) {
      s.pulse(at, 0.12, { freq: env.ramp(420, 260), gain: env.decay(0.2, 1), duty: 0.5 });
    }
    s.thud(0.56, 0.7, 0.8);
    s.noise(0.56, 0.2, { clock: (u) => 10000 - 6000 * u, gain: env.attackDecay(0.4, 0.03) });
    s.wave(0.6, 0.45, { freq: () => 600, gain: env.decay(0.15, 2) });
    return s;
  },

  /** Generic melee: a karate chop that shatters something hard. */
  brickbreak: () => {
    const s = new MoveSfx(0.85, 0xb21c);
    s.whoosh(0.0, 0.18, { from: 1500, to: 7000, gain: 0.35 });
    s.thud(0.17, 0.7, 0.7);
    for (let i = 0; i < 6; i++) {
      s.noise(0.2 + i * 0.05 + s.random() * 0.02, 0.04, { clock: () => 2500 + s.random() * 3000, gain: env.decay(0.3 - i * 0.04, 1) });
    }
    return s;
  },

  /** Generic self aura + stat-up fleck: flexing muscles, pumping up. */
  bulkup: () => {
    const s = new MoveSfx(1.5, 0xb01c);
    for (const [at, f] of [[0.03, 98], [0.28, 110], [0.53, 123]]) {
      s.wave(at, 0.2, { freq: (u) => f * (1 + 0.1 * u), gain: env.swell(0.45) });
      s.noise(at, 0.2, { clock: () => 700, gain: env.swell(0.12) });
    }
    s.statUp(0.85);
    return s;
  },

  /** Generic melee: grab, swing round in a circle, throw down. */
  circlethrow: () => {
    const s = new MoveSfx(0.85, 0xc1c7);
    s.thud(0.17, 0.4, 0.3);
    s.noise(0.2, 0.32, { clock: (u) => 2500 + 2000 * Math.sin(2 * Math.PI * u), gain: env.swell(0.3) });
    s.thud(0.52, 0.65, 0.8);
    return s;
  },

  /** Generic melee at high power: a flurry of close-range blows. */
  closecombat: () => {
    const s = new MoveSfx(0.85, 0xc1cc);
    for (const [at, g] of [[0.05, 0.4], [0.1, 0.4], [0.14, 0.45], [0.17, 0.75]]) {
      s.whoosh(at - 0.05, 0.06, { from: 2000, to: 6000, gain: 0.15 });
      s.thud(at, g, 0.4);
    }
    for (const at of [0.24, 0.3, 0.36]) s.thud(at, 0.4, 0.3);
    return s;
  },

  /** Generic melee at high power: two crossed chops. */
  crosschop: () => {
    const s = new MoveSfx(0.7, 0xc2cc);
    s.whoosh(0.0, 0.12, { from: 2000, to: 8000, gain: 0.3 });
    s.whoosh(0.06, 0.12, { from: 2500, to: 9000, gain: 0.3 });
    s.thud(0.17, 0.75, 0.8);
    s.noise(0.17, 0.08, { clock: () => 12000, gain: env.decay(0.35, 1) });
    return s;
  },

  /** Generic melee: braces for the blow, then strikes back twice as hard. */
  counter: () => {
    const s = new MoveSfx(0.8, 0xc0c7);
    s.pulse(0.0, 0.17, { freq: env.ramp(110, 160), gain: env.ramp(0.1, 0.25), duty: 0.5 });
    s.thud(0.17, 0.8, 0.9);
    s.pulse(0.18, 0.25, { freq: (u) => 2200 * Math.pow(0.6, u), gain: env.decay(0.16, 1.5), duty: 0.25 });
    return s;
  },

  /** Generic self aura (priority): senses the attack coming - a sharp alert. */
  detect: () => {
    const s = new MoveSfx(0.75, 0xde7e);
    s.pulse(0.02, 0.08, { freq: () => 2637, gain: env.decay(0.3, 1), duty: 0.25 });
    s.pulse(0.1, 0.3, { freq: () => 3136, gain: env.decay(0.25, 1.5), duty: 0.25 });
    s.sparkle(0.12, 0.4, 5, { lo: 4000, hi: 6500, gain: 0.12 });
    return s;
  },

  /** Generic melee kick, 2 hits (impacts at 0.17 / 0.59 s). */
  doublekick: () => {
    const s = new MoveSfx(0.85, 0xd0bc);
    for (const at of [0.17, 0.59]) {
      s.whoosh(at - 0.12, 0.13, { from: 2000, to: 7000, gain: 0.25 });
      s.thud(at, 0.6, 0.6);
    }
    return s;
  },

  /** Generic melee punch + drain: a punch that saps energy back to the user. */
  drainpunch: () => {
    const s = new MoveSfx(1.1, 0xd2a9);
    s.whoosh(0.0, 0.18, { from: 2000, to: 7000, gain: 0.3 });
    s.thud(0.17, 0.65, 0.6);
    s.drain(0.4);
    return s;
  },

  /** Generic melee punch at high power + confusion fleck: an explosive punch. */
  dynamicpunch: () => {
    const s = new MoveSfx(1.2, 0xd9a3);
    s.whoosh(0.0, 0.18, { from: 1500, to: 6000, gain: 0.35 });
    s.thud(0.17, 0.85, 1);
    s.noise(0.17, 0.4, { clock: (u) => 9000 - 7000 * u, gain: env.attackDecay(0.55, 0.02) });
    s.rumble(0.2, 0.4, { from: 400, to: 150, gain: 0.3 });
    s.confusion(0.55);
    return s;
  },

  /** Generic projectile (impact 0.43 s): everything on one blow, then the user's strength drains away. */
  finalgambit: () => {
    const s = new MoveSfx(1.4, 0xf1ab);
    s.chord(0.0, 0.43, [55, 62, 67], { rate: 0.03, gain: 0.18, voice: 'pulse' });
    s.whoosh(0.0, 0.45, { from: 1000, to: 6000, gain: 0.3 });
    s.thud(0.43, 0.8, 0.9);
    s.noise(0.43, 0.25, { clock: (u) => 10000 - 7000 * u, gain: env.attackDecay(0.4, 0.03) });
    s.pulse(0.65, 0.65, { freq: (u) => 400 * Math.pow(0.3, u), gain: env.decay(0.22, 1.2), duty: 0.5 });
    return s;
  },

  /** Generic melee (impact at 0.17 s): a flying body-splash dive - wind rush, then a heavy belly-flop. */
  flyingpress: () => {
    const s = new MoveSfx(0.95, 0xf1e5);
    s.whoosh(0.0, 0.17, { from: 1200, to: 8000, gain: 0.35 });
    s.pulse(0.0, 0.17, { freq: (u) => 1500 - 900 * u, gain: env.ramp(0.05, 0.14), duty: 0.125 });
    s.thud(0.17, 0.85, 1);
    s.rumble(0.2, 0.45, { from: 500, to: 150, gain: 0.3 });
    s.whoosh(0.2, 0.3, { from: 5000, to: 1500, gain: 0.15 });
    return s;
  },

  /** Generic lob (arcs 0.52 s, fleck at ~0.65 s): a humming ball of focused aura bursts, then a stat-down run. */
  focusblast: () => {
    const s = new MoveSfx(1.35, 0xf0cb);
    s.wave(0.0, 0.52, { freq: (u) => 200 + 250 * u, gain: env.ramp(0.12, 0.25) });
    s.pulse(0.0, 0.52, { freq: (u) => 100 + 125 * u, gain: env.ramp(0.06, 0.15), duty: 0.25 });
    s.thud(0.52, 0.75, 0.9);
    s.noise(0.52, 0.3, { clock: (u) => 10000 - 7000 * u, gain: env.attackDecay(0.45, 0.03) });
    s.statDown(0.68);
    return s;
  },

  /** Generic melee punch at max power (impact at 0.17 s): a tightening focus hum, then a crushing blow. */
  focuspunch: () => {
    const s = new MoveSfx(0.95, 0xf0c9);
    s.pulse(0.0, 0.16, { freq: (u) => 180 + 200 * u, gain: env.ramp(0.08, 0.22), duty: 0.5 });
    s.whoosh(0.04, 0.13, { from: 2000, to: 8000, gain: 0.3 });
    s.thud(0.17, 0.9, 1);
    s.noise(0.17, 0.12, { clock: () => 12000, gain: env.decay(0.4, 1) });
    s.rumble(0.2, 0.55, { from: 450, to: 120, gain: 0.3 });
    return s;
  },

  /** Generic melee (impact at 0.17 s) + paralysis fleck: a palm strike with a shock wave. */
  forcepalm: () => {
    const s = new MoveSfx(1.1, 0xf0ca);
    s.whoosh(0.0, 0.17, { from: 2000, to: 7000, gain: 0.3 });
    s.thud(0.17, 0.65, 0.5);
    s.wave(0.18, 0.22, { freq: (u) => 900 - 500 * u, gain: env.decay(0.2, 1.5) });
    s.paralyze(0.45);
    return s;
  },

  /** Generic melee punch (impact 0.17 s): a heavy overhead hammer-fist, then the fighter slows down. */
  hammerarm: () => {
    const s = new MoveSfx(0.9, 0x4a3a);
    s.whoosh(0.0, 0.18, { from: 700, to: 2500, gain: 0.35 });
    s.thud(0.17, 0.9, 1);
    s.thud(0.21, 0.4, 0.8);
    s.rumble(0.18, 0.45, { from: 400, to: 120, gain: 0.25 });
    s.pulse(0.45, 0.25, { freq: (u) => 330 - 120 * u, gain: env.decay(0.12, 1.5), duty: 0.5 });
    return s;
  },

  /**
   * FightingMoveAnimations.playHighJumpKick: the user darts forward and back (0-0.26 s), then three
   * fiery bursts pop on the target (0.26 / 0.33 / 0.41 s, each ~0.48 s) with a field shake.
   * A leaping rush and a huge triple-cracking kick (on a miss the same clip covers the crash).
   */
  highjumpkick: () => {
    const s = new MoveSfx(1.05, 0x41c4);
    s.whoosh(0.0, 0.26, { from: 1500, to: 9000, gain: 0.35 });
    s.pulse(0.0, 0.22, { freq: (u) => 300 + 900 * u, gain: env.swell(0.12), duty: 0.25 });
    s.thud(0.26, 0.65, 0.9);
    s.thud(0.33, 0.4, 0.5);
    s.thud(0.41, 0.3, 0.3);
    s.rumble(0.3, 0.6, { from: 500, to: 150, gain: 0.3 });
    return s;
  },

  /**
   * FightingMoveAnimations.playLowKick: a foot sweeps low across the target (0-0.52 s),
   * hit at ~0.23 s with the sparkle burst (~0.7 s).
   */
  lowkick: () => {
    const s = new MoveSfx(1.05, 0x10c1);
    s.whoosh(0.0, 0.25, { from: 1200, to: 5000, gain: 0.3 });
    s.thud(0.23, 0.7, 0.7);
    s.whoosh(0.26, 0.26, { from: 4000, to: 1200, gain: 0.15 });
    s.sparkle(0.25, 0.5, 6, { lo: 2000, hi: 4000, gain: 0.12 });
    return s;
  },

  /** Generic melee (impact 0.17 s) + Speed-down fleck (~0.5 s): a fast sweeping kick at the legs. */
  lowsweep: () => {
    const s = new MoveSfx(1.1, 0x1053);
    s.whoosh(0.0, 0.18, { from: 1000, to: 5500, gain: 0.32 });
    s.thud(0.17, 0.65, 0.6);
    s.noise(0.2, 0.15, { clock: () => 2000, gain: env.decay(0.15, 1.5) });
    s.statDown(0.5);
    return s;
  },

  /** Generic melee, priority (impact 0.12 s): a lightning-fast jab - a short zip and a snappy punch. */
  machpunch: () => {
    const s = new MoveSfx(0.65, 0x3ac4);
    s.whoosh(0.0, 0.12, { from: 3000, to: 12000, gain: 0.32 });
    s.pulse(0.02, 0.1, { freq: env.ramp(800, 2400), gain: env.decay(0.12, 1), duty: 0.125 });
    s.thud(0.12, 0.65, 0.45);
    s.noise(0.12, 0.1, { clock: (u) => 12000 - 6000 * u, gain: env.attackDecay(0.3, 0.03) });
    return s;
  },

  /** Generic self aura (≈ 0.8 s): a tatami mat is flipped up with a woody slap and a sturdy guard tone. */
  matblock: () => {
    const s = new MoveSfx(1.0, 0x3a7b);
    s.whoosh(0.0, 0.2, { from: 1000, to: 5000, gain: 0.3 });
    s.thud(0.2, 0.7, 0.6);
    s.noise(0.2, 0.06, { clock: () => 4000, gain: env.decay(0.35, 1) });
    s.pulse(0.3, 0.55, { freq: () => 392, gain: env.decay(0.18, 1.2), duty: 0.25 });
    s.pulse(0.3, 0.55, { freq: () => 587, gain: env.decay(0.12, 1.2), duty: 0.5 });
    return s;
  },

  /** Generic melee, punch style (0.17 s impact): a solid jab with a small rising power-up chime. */
  poweruppunch: () => {
    const s = new MoveSfx(0.95, 0xf19c);
    s.whoosh(0.0, 0.15, { from: 1500, to: 6000, gain: 0.25 });
    s.thud(0.17, 0.65, 0.6);
    s.arpeggio(0.45, [67, 71, 74, 79], 0.05, { gain: 0.18, duty: 0.25, hold: 0.08 });
    return s;
  },

  /**
   * Support move, no aura: MoveAnimationService.playShield pops an orange
   * bubble up around every ally (0-0.62 s). A quick double "guard" clang.
   */
  quickguard: () => {
    const s = new MoveSfx(0.8, 0xf9a6);
    s.whoosh(0.0, 0.1, { from: 3000, to: 9000, gain: 0.25 });
    s.pulse(0.06, 0.08, { freq: () => 1046.5, gain: env.decay(0.3, 1.5), duty: 0.25 });
    s.pulse(0.14, 0.5, { freq: () => 1568, gain: env.decay(0.28, 2), duty: 0.25 });
    s.wave(0.14, 0.55, { freq: () => 784, gain: env.decay(0.22, 1.5) });
    s.thud(0.06, 0.3, 0.2);
    return s;
  },

  /** Generic melee (impact 0.17 s): a fierce payback blow – a growled windup and a heavy hit. */
  revenge: () => {
    const s = new MoveSfx(0.85, 0x2e7e);
    s.pulse(0.0, 0.17, { freq: env.ramp(90, 140), gain: env.swell(0.22), duty: 0.125 });
    s.whoosh(0.02, 0.16, { from: 1200, to: 5000, gain: 0.3 });
    s.thud(0.17, 0.9, 0.85);
    s.noise(0.17, 0.1, { clock: (u) => 6000 - 3000 * u, gain: env.attackDecay(0.35, 0.05) });
    s.rumble(0.22, 0.35, { from: 350, to: 120, gain: 0.18 });
    return s;
  },

  /** Generic melee (impact 0.17 s): a desperate comeback strike – a rising strain then a punchy blow. */
  reversal: () => {
    const s = new MoveSfx(0.7, 0x2e5a);
    s.pulse(0.0, 0.17, { freq: env.ramp(200, 600), gain: env.swell(0.18), duty: 0.25 });
    s.whoosh(0.0, 0.18, { from: 1500, to: 6000, gain: 0.3 });
    s.thud(0.17, 0.85, 0.7);
    s.pulse(0.19, 0.2, { freq: (u) => 700 * Math.pow(0.5, u), gain: env.decay(0.15, 1.5), duty: 0.5 });
    return s;
  },

  /** Generic melee (impact 0.17 s) + Defense drop fleck (~0.6 s): a punch that cracks rock apart. */
  rocksmash: () => {
    const s = new MoveSfx(1.15, 0x2c55);
    s.whoosh(0.0, 0.18, { from: 1500, to: 5000, gain: 0.3 });
    s.thud(0.17, 0.85, 0.75);
    for (let i = 0; i < 5; i++) s.noise(0.2 + i * 0.05 + s.random() * 0.02, 0.04, { clock: () => 1800 + s.random() * 2000, gain: env.decay(0.28 - i * 0.04, 1) });
    s.statDown(0.6, 0.22);
    return s;
  },

  /** Generic melee kick (impact 0.17 s) + flinch fleck (~0.6 s): a spinning kick – a whirling whoosh and a solid smack. */
  rollingkick: () => {
    const s = new MoveSfx(0.9, 0x2011);
    s.noise(0.0, 0.18, { clock: (u) => 2500 + 3000 * Math.sin(2 * Math.PI * 2.5 * u) ** 2, gain: env.swell(0.3) });
    s.thud(0.17, 0.85, 0.6);
    s.noise(0.17, 0.05, { clock: () => 10000, gain: env.decay(0.25, 1) });
    s.flinch(0.6, 0.2);
    return s;
  },

  /** Generic melee slash (impact 0.17 s): a legendary blade – a ringing draw and a clean, gleaming cut. */
  sacredsword: () => {
    const s = new MoveSfx(0.95, 0x5a5d);
    s.pulse(0.0, 0.16, { freq: env.ramp(1500, 3200), gain: env.swell(0.14), duty: 0.125 });
    s.whoosh(0.0, 0.17, { from: 3000, to: 11000, gain: 0.25 });
    s.slash(0.17, 0.7);
    s.wave(0.2, 0.6, { freq: () => 1568, gain: env.decay(0.16, 1.5) });
    s.wave(0.2, 0.6, { freq: () => 2349, gain: env.decay(0.08, 1.5) });
    return s;
  },

  /** Generic projectile (0.43 s), no fleck: a mystic blade-wave hums across and cuts deep with a ringing slash. */
  secretsword: () => {
    const s = new MoveSfx(0.85, 0x5ec5);
    s.pulse(0.0, 0.43, { freq: (u) => 1100 + 900 * u, gain: env.ramp(0.08, 0.2), duty: 0.125 });
    s.whoosh(0.0, 0.43, { from: 3000, to: 12000, gain: 0.25 });
    s.slash(0.43, 0.55);
    s.wave(0.45, 0.35, { freq: () => 1318, gain: env.decay(0.18, 1.5) });
    return s;
  },

  /**
   * FightingMoveAnimations.playSeismicToss: dim 0.3 s, sky 0.55 s, streaks rush up (0.55-1.45 s) then down
   * (1.45-2.15 s), impact + quake + flying stones at 2.15 s, fade to ~3.1 s. A soaring rise, a plunging fall, a huge crash.
   */
  seismictoss: () => {
    const s = new MoveSfx(3.1, 0x5e15);
    s.whoosh(0.3, 0.3, { from: 800, to: 1500, gain: 0.15 });
    s.noise(0.55, 0.9, { clock: env.ramp(1500, 9000), gain: env.swell(0.3) });
    s.pulse(0.55, 0.9, { freq: env.ramp(200, 800), gain: env.swell(0.12), duty: 0.25 });
    s.noise(1.45, 0.7, { clock: env.ramp(9000, 1200), gain: env.ramp(0.2, 0.38) });
    s.pulse(1.45, 0.7, { freq: env.ramp(800, 150), gain: env.ramp(0.1, 0.18), duty: 0.25 });
    s.thud(2.15, 0.9, 1);
    s.rumble(2.15, 0.7, { from: 600, to: 120, gain: 0.45 });
    for (let i = 0; i < 6; i++) s.noise(2.22 + i * 0.09, 0.04, { clock: () => 3000 + s.random() * 3000, gain: env.decay(0.22, 1) });
    return s;
  },

  /** Generic melee punch (impact 0.17 s), no fleck: a rising uppercut that whips skyward on contact. */
  skyuppercut: () => {
    const s = new MoveSfx(0.75, 0x5c90);
    s.whoosh(0.0, 0.18, { from: 1500, to: 5000, gain: 0.3 });
    s.thud(0.17, 0.75, 0.6);
    s.whoosh(0.19, 0.35, { from: 3000, to: 11000, gain: 0.3 });
    s.pulse(0.19, 0.3, { freq: env.ramp(400, 1400), gain: env.decay(0.14, 1.2), duty: 0.25 });
    return s;
  },

  /** Generic melee: a grab and a flinging throw that slams the foe down. */
  stormthrow: () => {
    const s = new MoveSfx(0.85, 0x5707);
    s.whoosh(0.0, 0.18, { from: 1200, to: 4000, gain: 0.3 });
    s.noise(0.17, 0.04, { clock: () => 6000, gain: env.decay(0.3, 1) });
    s.whoosh(0.2, 0.2, { from: 5000, to: 1500, gain: 0.3 });
    s.thud(0.4, 0.8, 0.8);
    return s;
  },

  /** Generic melee + recoil (~0.12 s after impact): a reckless rolling tackle and the backlash. */
  submission: () => {
    const s = new MoveSfx(0.75, 0x5b31);
    s.whoosh(0.0, 0.18, { from: 900, to: 3000, gain: 0.32 });
    s.thud(0.17, 0.8, 0.8);
    s.noise(0.2, 0.15, { clock: () => 2500, gain: env.decay(0.2, 1) });
    s.thud(0.29, 0.4, 0.4);
    return s;
  },

  /** Generic melee (bp 120): a gathering grunt of power and a crushing blow. */
  superpower: () => {
    const s = new MoveSfx(0.9, 0x5e9e);
    s.pulse(0.0, 0.18, { freq: env.ramp(60, 120), gain: env.swell(0.3), duty: 0.5 });
    s.whoosh(0.0, 0.18, { from: 700, to: 3000, gain: 0.35 });
    s.thud(0.17, 1.0, 1);
    s.noise(0.17, 0.12, { clock: () => 11000, gain: env.decay(0.3, 1.5) });
    s.rumble(0.2, 0.5, { from: 350, to: 100, gain: 0.3 });
    return s;
  },

  /** FightingMoveAnimations.playJumpKick: four feet fly in 0.14 s apart, hitting at 0.26 / 0.40 / 0.54 / 0.68 s. */
  jumpkick: () => {
    const s = new MoveSfx(1.0, 0x1c1c);
    for (let i = 0; i < 4; i++) {
      const at = 0.26 + i * 0.14;
      s.whoosh(at - 0.14, 0.15, { from: 2000, to: 7000, gain: 0.18 });
      s.thud(at, 0.5 + i * 0.05, 0.5);
    }
    return s;
  },

  /** Generic melee (impact 0.17 s): a sharp karate chop. */
  karatechop: () => {
    const s = new MoveSfx(0.65, 0xca7c);
    s.whoosh(0.0, 0.18, { from: 2500, to: 9000, gain: 0.35 });
    s.thud(0.17, 0.6, 0.5);
    s.noise(0.17, 0.05, { clock: () => 13000, gain: env.decay(0.35, 1) });
    return s;
  },

  /** Generic melee kick, 3 hits (impacts 0.17 / 0.59 / 1.01 s), each harder and lower than the last. */
  triplekick: () => {
    const s = new MoveSfx(1.35, 0x7a1c);
    [0, 1, 2].forEach((hit) => {
      const at = 0.17 + hit * 0.42;
      s.whoosh(at - 0.12, 0.13, { from: 2000, to: 7000, gain: 0.22 + hit * 0.03 });
      s.thud(at, 0.5 + hit * 0.1, 0.4 + hit * 0.25);
    });
    return s;
  },

  /** Generic projectile, priority (impact 0.26 s): a whirl of vacuum rushes in and pops. */
  vacuumwave: () => {
    const s = new MoveSfx(0.7, 0xfac0);
    s.noise(0.0, 0.26, { clock: (u) => 3000 + 5000 * u, gain: env.ramp(0.08, 0.3) });
    s.pulse(0.0, 0.26, { freq: (u) => 300 + 500 * u, gain: env.ramp(0.05, 0.15), duty: 0.125 });
    s.thud(0.26, 0.6, 0.45);
    s.noise(0.26, 0.2, { clock: () => 2500, gain: env.decay(0.2, 1.5) });
    return s;
  },

  /** Generic melee (impact 0.17 s): a grab and a heavy throw, the target slams down a beat later. */
  vitalthrow: () => {
    const s = new MoveSfx(0.95, 0x717a);
    s.whoosh(0.0, 0.17, { from: 1200, to: 4000, gain: 0.25 });
    s.thud(0.17, 0.45, 0.3);
    s.whoosh(0.25, 0.25, { from: 5000, to: 1500, gain: 0.25 });
    s.thud(0.5, 0.7, 1);
    s.rumble(0.52, 0.3, { from: 300, to: 120, gain: 0.2 });
    return s;
  },

  /** Generic melee (impact 0.17 s): a stinging open-palm slap, then a startled "wake up!" ping. */
  wakeupslap: () => {
    const s = new MoveSfx(0.8, 0x5a1a);
    s.whoosh(0.0, 0.17, { from: 3000, to: 10000, gain: 0.25 });
    s.noise(0.17, 0.1, { clock: (u) => 20000 - 8000 * u, gain: env.attackDecay(0.6, 0.03) });
    s.thud(0.17, 0.4, 0.2);
    s.arpeggio(0.32, [84, 91], 0.06, { gain: 0.16, duty: 0.25, hold: 0.1 });
    return s;
  },
};
