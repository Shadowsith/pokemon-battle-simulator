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

  /**
   * Custom (2.35 s): the scene darkens (0-0.45 s), the aura swirl charges
   * (0.45-1.15 s), the sphere flies (1.15-1.45 s) and bursts at 1.45 s.
   */
  aurasphere: () => {
    const s = new MoveSfx(2.4, 0xa45f);
    s.wave(0.0, 0.45, { freq: env.ramp(200, 300), gain: env.swell(0.1) });
    s.pulse(0.45, 0.7, { freq: env.ramp(150, 320), gain: env.ramp(0.05, 0.2), duty: 0.25 });
    s.wave(0.45, 0.7, { freq: (u) => (300 + 300 * u) * (1 + 0.05 * Math.sin(2 * Math.PI * 12 * u)), gain: env.ramp(0.05, 0.22) });
    s.whoosh(1.15, 0.3, { from: 2000, to: 8000, gain: 0.35 });
    s.thud(1.45, 0.7, 0.8);
    s.noise(1.45, 0.2, { clock: (u) => 10000 - 6000 * u, gain: env.attackDecay(0.4, 0.03) });
    s.wave(1.48, 0.45, { freq: () => 600, gain: env.decay(0.15, 2) });
    return s;
  },

  /** Custom (chop lands at 0.56 s): a karate chop that shatters a glass pane. */
  brickbreak: () => {
    const s = new MoveSfx(1.25, 0xb21c);
    s.whoosh(0.4, 0.16, { from: 1500, to: 7000, gain: 0.35 });
    s.thud(0.56, 0.5, 0.4);
    // Glass shattering: a bright crash with a metallic ring ...
    s.noise(0.56, 0.28, { clock: (u) => 22000 - 6000 * u, gain: env.attackDecay(0.6, 0.02) });
    s.noise(0.56, 0.18, { clock: () => 15000, gain: env.decay(0.25, 2), short: true });
    // ... then shards tinkling down, thinning out.
    for (let i = 0; i < 16; i++) {
      const at = 0.6 + 0.55 * Math.pow(s.random(), 1.6);
      const f = 3200 + s.random() * 4800;
      s.wave(at, 0.05 + s.random() * 0.07, { freq: (u) => f * (1 - 0.05 * u), gain: env.decay(0.22 * (1.2 - (at - 0.6) * 1.4), 2) });
    }
    s.sparkle(0.6, 0.4, 8, { lo: 4000, hi: 8000, gain: 0.12 });
    return s;
  },

  /** Custom (flex pumps 0.03 / 0.28 / 0.53 s, sparkles from 0.8 s): flexing muscles, pumping up, then the stat-up jingle. */
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

  /**
   * Custom (2.45 s): black flash, then speed lines and eight blows every
   * 0.11 s from 0.25 s (last and hardest at 1.02 s); the user's Defense and
   * Sp. Def drop at 1.55 s.
   */
  closecombat: () => {
    const s = new MoveSfx(2.5, 0xc1cc);
    s.whoosh(0.2, 1.0, { from: 3000, to: 6000, gain: 0.12 });
    for (let i = 0; i < 8; i++) {
      const at = 0.25 + i * 0.11;
      s.whoosh(at - 0.05, 0.06, { from: 2000, to: 6000, gain: 0.15 });
      s.thud(at, i === 7 ? 0.75 : 0.45, 0.4);
    }
    s.statDown(1.55);
    return s;
  },

  /**
   * FightingPunchMoveAnimations.playCrossChop: two hands appear (0-0.25 s), chop across
   * (0.4-0.6 s) and cross at 0.5 s (bursts at 0.5 / 0.58 s), fade by ~0.9 s. Two crossed chops.
   */
  crosschop: () => {
    const s = new MoveSfx(1.0, 0xc2cc);
    s.pulse(0.0, 0.15, { freq: env.ramp(500, 900), gain: env.decay(0.1, 1.5), duty: 0.25 });
    s.whoosh(0.38, 0.12, { from: 2000, to: 8000, gain: 0.3 });
    s.whoosh(0.42, 0.12, { from: 2500, to: 9000, gain: 0.3 });
    s.thud(0.5, 0.75, 0.8);
    s.noise(0.5, 0.08, { clock: () => 12000, gain: env.decay(0.35, 1) });
    s.thud(0.58, 0.45, 0.5);
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

  /**
   * FightingStatusMoveAnimations.playDetect: dark (0-0.3 s), the ring sparkle flares at ~0.3-0.55 s
   * while the caster glows white (0.45-0.85 s), gone by 1.1 s, light back by 1.4 s.
   * Senses the attack coming - a sharp alert ping.
   */
  detect: () => {
    const s = new MoveSfx(1.4, 0xde7e);
    s.noise(0.0, 0.3, { clock: () => 600, gain: env.swell(0.08) });
    s.pulse(0.3, 0.08, { freq: () => 2637, gain: env.decay(0.3, 1), duty: 0.25 });
    s.pulse(0.4, 0.4, { freq: () => 3136, gain: env.decay(0.25, 1.5), duty: 0.25 });
    s.sparkle(0.45, 0.5, 6, { lo: 4000, hi: 6500, gain: 0.12 });
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

  /** Custom (dim 0-0.2 s, fist hits 0.35 s, orbs drift back 0.5-1.5 s, heal stars 1.5-2.4 s): a punch, then sapped energy flows back. */
  drainpunch: () => {
    const s = new MoveSfx(2.5, 0xd2a9);
    s.whoosh(0.2, 0.15, { from: 2000, to: 7000, gain: 0.3 });
    s.thud(0.35, 0.7, 0.6);
    s.drain(0.5);
    s.wave(0.5, 1.0, { freq: (u) => 520 + 300 * u, gain: env.swell(0.1) });
    s.arpeggio(1.5, [72, 76, 79, 84, 88], 0.09, { gain: 0.16, voice: 'wave', hold: 0.15 });
    s.sparkle(1.5, 0.8, 7, { lo: 3500, hi: 6000, gain: 0.12 });
    return s;
  },

  /**
   * FightingPunchMoveAnimations.playDynamicPunch: red burst backdrop (0-0.25 s), the fist slams at
   * 0.42 s (blast, quake, stones flying to ~1.27 s), backdrop clears (to ~1.57 s), birds circle
   * the head (~1.57-2.97 s). An explosive punch, tumbling rocks, then the dizzy confusion jingle.
   */
  dynamicpunch: () => {
    const s = new MoveSfx(3.0, 0xd9a3);
    s.noise(0.0, 0.25, { clock: env.ramp(800, 3000), gain: env.swell(0.15) });
    s.whoosh(0.25, 0.17, { from: 1500, to: 6000, gain: 0.35 });
    s.thud(0.42, 0.85, 1);
    s.noise(0.42, 0.45, { clock: (u) => 9000 - 7000 * u, gain: env.attackDecay(0.55, 0.02) });
    s.rumble(0.45, 0.6, { from: 400, to: 120, gain: 0.32 });
    for (let i = 0; i < 6; i++) s.noise(0.55 + i * 0.1, 0.04, { clock: () => 2000 + s.random() * 2000, gain: env.decay(0.18, 1) });
    s.confusion(1.6);
    s.wave(1.6, 1.3, { freq: (u) => 1200 + 250 * Math.sin(2 * Math.PI * 3 * u), gain: (u) => 0.08 * Math.sin(Math.PI * u) });
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

  /**
   * Custom (1.45 s): a puff and a whoosh up as the user leaps (0-0.35 s), a
   * falling whistle as it dives (0.35-0.75 s), then a heavy belly-flop at
   * 0.75 s with rumbling dust and pattering rubble.
   */
  flyingpress: () => {
    const s = new MoveSfx(1.6, 0xf1e5);
    s.noise(0.0, 0.1, { clock: () => 2500, gain: env.decay(0.18, 1) });
    s.whoosh(0.05, 0.3, { from: 1500, to: 6000, gain: 0.25 });
    s.pulse(0.35, 0.4, { freq: (u) => 1800 - 1200 * u, gain: env.ramp(0.05, 0.14), duty: 0.125 });
    s.whoosh(0.35, 0.4, { from: 2000, to: 8000, gain: 0.3 });
    s.thud(0.75, 0.9, 1);
    s.rumble(0.78, 0.5, { from: 500, to: 150, gain: 0.3 });
    for (let i = 0; i < 5; i++) s.thud(0.95 + i * 0.07 + s.random() * 0.03, 0.12, 0.2);
    return s;
  },

  /** Custom (red rush 0-0.3 s, rings close in 0.3-0.95 s, shot 0.95-1.25 s, burst rings 1.25 / 1.39 s): a gathering hum, a launch, a huge blast. */
  focusblast: () => {
    const s = new MoveSfx(2.25, 0xf0cb);
    s.noise(0.0, 1.95, { clock: () => 1800, gain: (u) => 0.12 * Math.min(1, u * 6) * Math.min(1, (1 - u) * 5) });
    s.wave(0.3, 0.65, { freq: (u) => 200 + 250 * u, gain: env.ramp(0.1, 0.25) });
    for (const at of [0.3, 0.43, 0.56]) s.pulse(at, 0.3, { freq: env.ramp(900, 450), gain: env.swell(0.1), duty: 0.25 });
    s.whoosh(0.95, 0.3, { from: 1200, to: 6000, gain: 0.3 });
    s.thud(1.25, 0.8, 0.9);
    s.noise(1.25, 0.3, { clock: (u) => 10000 - 7000 * u, gain: env.attackDecay(0.4, 0.03) });
    s.thud(1.39, 0.4, 0.6);
    s.sparkle(1.3, 0.45, 5, { lo: 3000, hi: 5500, gain: 0.12 });
    return s;
  },

  /**
   * FightingPunchMoveAnimations.playFocusPunch: a steel girder lands on the user's
   * head (0.18 s) while red streaks rush up (to 1.0 s); the blue burst flares
   * (1.0-1.25 s) and the red fist slams into the target (1.41 s).
   */
  focuspunch: () => {
    const s = new MoveSfx(2.3, 0xf0c9);
    s.thud(0.18, 0.45, 0.3);
    s.pulse(0.18, 0.05, { freq: () => 880, gain: env.decay(0.18, 2), duty: 0.25 });
    s.pulse(0.2, 0.8, { freq: (u) => 160 + 260 * u, gain: env.ramp(0.06, 0.2), duty: 0.5 });
    s.whoosh(0.3, 0.7, { from: 1500, to: 7000, gain: 0.22 });
    s.noise(1.0, 0.3, { clock: (u) => 3000 + 9000 * u, gain: env.swell(0.2) });
    s.whoosh(1.25, 0.16, { from: 2000, to: 9000, gain: 0.3 });
    s.thud(1.41, 0.9, 1);
    s.noise(1.41, 0.12, { clock: () => 12000, gain: env.decay(0.4, 1) });
    s.rumble(1.44, 0.6, { from: 450, to: 120, gain: 0.3 });
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

  /** Custom (hammer swings down 0-0.45 s, hit 0.45 s, bounces off to ~1.05 s, Speed-drop bubbles 1.05-1.95 s): a heavy swing, a huge clonk, then a slowing tone. */
  hammerarm: () => {
    const s = new MoveSfx(2.1, 0x4a3a);
    s.whoosh(0.05, 0.4, { from: 500, to: 2500, gain: 0.35 });
    s.thud(0.45, 1.0, 1);
    s.pulse(0.45, 0.35, { freq: () => 880, gain: env.decay(0.12, 2), duty: 0.5 });
    s.rumble(0.46, 0.5, { from: 400, to: 120, gain: 0.3 });
    s.pulse(1.05, 0.7, { freq: (u) => 523 * Math.pow(0.5, u), gain: env.decay(0.14, 1.2), duty: 0.5 });
    s.bubbles(1.1, 0.7, 6, { lo: 700, hi: 300, gain: 0.1 });
    return s;
  },

  /**
   * FightingKickThrowMoveAnimations.playHighJumpKick: the user darts forward and back (0-0.26 s), then three
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
   * FightingKickThrowMoveAnimations.playLowKick: a foot sweeps low across the target (0-0.52 s),
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
   * FightingKickThrowMoveAnimations.playSeismicToss: dim 0.3 s, sky 0.55 s, streaks rush up (0.55-1.45 s) then down
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

  /**
   * FightingPunchMoveAnimations.playSkyUppercut: dark red scene (0-0.25 s), white
   * rings pulse on the platforms (0.25-0.95 s, peaks ~0.43 / 0.74 s), black
   * then the blue sky rushes up (0.95-1.55 s), the fist shoots up (1.55 s)
   * and strikes (1.8 s), punching on through to ~2.2 s; sky fades (~2.8 s).
   */
  skyuppercut: () => {
    const s = new MoveSfx(2.85, 0x5c90);
    s.pulse(0.0, 0.95, { freq: (u) => 110 + 30 * Math.sin(2 * Math.PI * 2 * u), gain: env.swell(0.12), duty: 0.5 });
    for (const at of [0.43, 0.74]) s.chord(at, 0.2, [72, 79], { rate: 0.03, gain: 0.08 });
    s.noise(0.95, 1.3, { clock: env.ramp(1200, 4000), gain: env.swell(0.16) });
    s.whoosh(1.55, 0.25, { from: 1200, to: 6000, gain: 0.32 });
    s.thud(1.8, 0.8, 0.7);
    s.noise(1.8, 0.2, { clock: (u) => 9000 - 5000 * u, gain: env.attackDecay(0.3, 0.02) });
    s.whoosh(1.82, 0.4, { from: 3000, to: 11000, gain: 0.3 });
    s.pulse(1.82, 0.35, { freq: env.ramp(400, 1400), gain: env.decay(0.14, 1.2), duty: 0.25 });
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

  /**
   * FightingKickThrowMoveAnimations.playSubmission: both sprites roll two counter-clockwise laps
   * (0-1.2 s, laps at 0 / 0.6 s) while four hits land (0.25 / 0.5 / 0.75 / 1.0 s), then
   * dust swirls round the target (1.2-2.0 s). A tumbling scuffle of thumps, then a dusty skid.
   */
  submission: () => {
    const s = new MoveSfx(2.1, 0x5b31);
    [0.0, 0.6].forEach((at) => s.whoosh(at, 0.55, { from: 700, to: 2200, gain: 0.22 }));
    [0.25, 0.5, 0.75, 1.0].forEach((at, i) => {
      s.thud(at, 0.6 + 0.08 * i, 0.7);
      s.noise(at, 0.06, { clock: () => 3500, gain: env.decay(0.22, 1.5) });
    });
    s.noise(1.2, 0.8, { clock: env.ramp(1400, 500), gain: env.attackDecay(0.28, 0.15) });
    s.rumble(1.2, 0.6, { from: 260, to: 110, gain: 0.25 });
    return s;
  },


  /**
   * FightingPunchMoveAnimations.playSuperpower: the user powers up with rising
   * light and haze (0-1.2 s), lunges as the scene darkens (1.2-1.45 s), pink
   * sparks pop on the target (1.45 s), the red ray burst opens (1.6 s, shakes
   * 1.85 / 2.07 / 2.29 s), black and back (2.6-3.15 s), stat-down (3.15 s).
   */
  superpower: () => {
    const s = new MoveSfx(4.1, 0x5e9e);
    s.pulse(0.0, 1.2, { freq: env.ramp(60, 140), gain: env.swell(0.22), duty: 0.5 });
    s.noise(0.0, 1.2, { clock: env.ramp(600, 2400), gain: env.ramp(0.05, 0.22) });
    s.sparkle(0.1, 0.9, 8, { lo: 3000, hi: 6000, gain: 0.08 });
    s.whoosh(1.2, 0.25, { from: 700, to: 3000, gain: 0.35 });
    s.sparkle(1.45, 0.2, 4, { lo: 5000, hi: 8000, gain: 0.12 });
    s.thud(1.6, 1.0, 1);
    s.noise(1.6, 0.15, { clock: () => 11000, gain: env.decay(0.3, 1.5) });
    s.rumble(1.62, 0.9, { from: 350, to: 100, gain: 0.3 });
    for (const at of [1.85, 2.07, 2.29]) s.thud(at, 0.3, 0.5);
    s.whoosh(2.6, 0.3, { from: 3000, to: 900, gain: 0.12 });
    s.statDown(3.2);
    return s;
  },

  /** FightingKickThrowMoveAnimations.playJumpKick: four feet fly in 0.14 s apart, hitting at 0.26 / 0.40 / 0.54 / 0.68 s. */
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
