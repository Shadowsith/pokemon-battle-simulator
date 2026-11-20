import { MoveSfx } from '../move-sfx.mjs';
import { env } from '../track.mjs';

/** Rock-type move sounds. */
export const ROCK = {
  /** AncientPower.play (rocks rise 0-0.5 s, hover to ~0.7 s, land 0.9-1.1 s, scatter to ~1.45 s): an ancient hum lifts the rocks, a rush, then a rattle of stony hits. */
  ancientpower: () => {
    const s = new MoveSfx(1.7, 0xa9c1);
    s.wave(0.0, 0.7, { freq: () => 90, gain: env.swell(0.3) });
    s.wave(0.0, 0.7, { freq: () => 135, gain: env.swell(0.18) });
    s.rumble(0.0, 0.5, { from: 300, to: 500, gain: 0.3 });
    s.whoosh(0.68, 0.22, { from: 800, to: 3000, gain: 0.2 });
    for (let i = 0; i < 6; i++) {
      const at = 0.9 + i * 0.04;
      if (i % 2 === 0) s.thud(at, 0.6 - i * 0.05, 0.7);
      s.noise(at + s.random() * 0.02, 0.05, { clock: () => 1500 + s.random() * 1500, gain: env.decay(0.25 - i * 0.025, 1) });
    }
    return s;
  },

  /**
   * Custom (2.1 s): a bright swell as the glow forms (0-0.35 s), a crystal
   * chime as the diamond appears (0.35 s), then the glittering storm rushes
   * over (0.95-1.8 s) with the hit at 1.35 s.
   */
  diamondstorm: () => {
    const s = new MoveSfx(2.25, 0xd1a5);
    s.wave(0.0, 0.35, { freq: env.ramp(500, 1000), gain: env.swell(0.12) });
    s.chord(0.35, 0.6, [84, 88, 91], { rate: 0.03, gain: 0.14 });
    s.sparkle(0.35, 0.5, 6, { lo: 3500, hi: 6500, gain: 0.14 });
    s.noise(0.95, 0.85, { clock: (u) => 3500 + 1500 * Math.sin(2 * Math.PI * 2 * u), gain: env.swell(0.24) });
    s.sparkle(0.95, 0.85, 16, { lo: 2500, hi: 5500, gain: 0.18 });
    s.thud(1.35, 0.5, 0.5);
    s.noise(1.35, 0.2, { clock: () => 9000, gain: env.decay(0.25, 1) });
    return s;
  },

  /** Custom (dark 0-0.2 s, ring closes with rocks 0.2-0.6 s while the user charges, impact 0.6 s, orange burst to ~1.65 s, recoil 1.65 s): a charging rush, a crushing smash with cracking rock, the user reels. */
  headsmash: () => {
    const s = new MoveSfx(2.15, 0x45a5);
    s.wave(0.2, 0.4, { freq: (u) => 200 + 400 * u, gain: env.ramp(0.05, 0.18) });
    s.whoosh(0.3, 0.3, { from: 600, to: 3500, gain: 0.35 });
    s.thud(0.6, 1.0, 1);
    s.noise(0.6, 0.2, { clock: (u) => 5000 - 3500 * u, gain: env.attackDecay(0.5, 0.05) });
    s.rumble(0.62, 0.9, { from: 600, to: 120, gain: 0.4 });
    s.thud(0.9, 0.4, 0.5);
    s.thud(1.65, 0.55, 0.7);
    return s;
  },

  /** Custom (dark 0-0.25 s, gems pop up glinting 0.25-0.6 s, glittering stream 0.57-1.4 s, hit 0.95 s, clears to 1.67 s): crystal chimes gather, rush out and strike with a clang. */
  powergem: () => {
    const s = new MoveSfx(1.8, 0x90e3);
    s.sparkle(0.25, 0.35, 8, { lo: 3000, hi: 6000, gain: 0.14 });
    s.chord(0.3, 0.6, [76, 80, 83, 88], { rate: 0.03, gain: 0.12, voice: 'pulse' });
    s.whoosh(0.57, 0.8, { from: 3000, to: 9000, gain: 0.18 });
    s.thud(0.95, 0.5, 0.5);
    s.pulse(0.95, 0.4, { freq: () => 1660, gain: env.decay(0.22, 1.5), duty: 0.25 });
    s.pulse(0.96, 0.4, { freq: () => 2490, gain: env.decay(0.14, 1.5), duty: 0.125 });
    s.sparkle(1.0, 0.4, 8, { gain: 0.14 });
    return s;
  },

  /** RockBlast.play (one boulder per hit, hurled every 0.28 s, smashing in 0.32 s later at 0.32 / 0.6 / 0.88 s for three; dust ~0.5 s): a heavy whoosh per rock, a crash with a rumble and scattering grit. */
  rockblast: () => {
    const s = new MoveSfx(1.4, 0xb1a5);
    for (let hit = 0; hit < 3; hit++) {
      const at = 0.32 + hit * 0.28;
      s.whoosh(at - 0.3, 0.28, { from: 600, to: 2000, gain: 0.16 });
      s.thud(at, 0.75, 0.9);
      s.rumble(at + 0.02, 0.28, { from: 600, to: 200, gain: 0.22 });
      for (let i = 0; i < 3; i++) s.noise(at + 0.04 + i * 0.05, 0.04, { clock: () => 1500 + s.random() * 1500, gain: env.decay(0.2 - i * 0.04, 1) });
    }
    return s;
  },

  /** Custom (dark 0-0.25 s, shine streaks at 0.25 / 0.49 / 0.73 s with pink sparkles to 1.13 s, orange sparkles 1.38-2.6 s): three glossy polishing swipes that glint, then a stat jingle. */
  rockpolish: () => {
    const s = new MoveSfx(2.7, 0x9011);
    for (let i = 0; i < 3; i++) {
      const at = 0.25 + i * 0.24;
      s.noise(at, 0.28, { clock: (u) => 3000 + 4000 * Math.sin(Math.PI * u), gain: (u) => 0.2 * Math.sin(Math.PI * u) });
      s.pulse(at + 0.14, 0.12, { freq: () => 3520 + i * 440, gain: env.decay(0.1, 1.5), duty: 0.125 });
    }
    s.sparkle(0.35, 0.75, 7, { lo: 3500, hi: 6500, gain: 0.12 });
    s.statUp(1.43, 0.26);
    return s;
  },

  /** RockMoveAnimations.playRockSlide: 26 rocks rain down (landings 0.34–1.44 s), target flinches every 0.22 s, field shake at 1.1 s, end ≈ 1.78 s. A tumbling avalanche of clattering stones. */
  rockslide: () => {
    const s = new MoveSfx(1.95, 0x5a1d);
    s.rumble(0.0, 1.85, { from: 500, to: 160, gain: 0.32 });
    for (let i = 0; i < 26; i++) {
      const at = 0.34 + (i / 26) * 1.1 + s.random() * 0.06;
      s.noise(at, 0.05, { clock: () => 1200 + s.random() * 2200, gain: env.decay(0.22, 1) });
    }
    for (let t = 0.34; t < 1.44; t += 0.22) s.thud(t, 0.45, 0.8);
    s.thud(1.1, 0.6, 1);
    return s;
  },

  /** RockMoveAnimations.playRockThrow (rock drops 0-0.4 s, hit at 0.4 s, stones bounce and land ~0.9-1.05 s): a falling rock smacks the target and breaks into clattering stones. */
  rockthrow: () => {
    const s = new MoveSfx(1.2, 0x7a20);
    s.whoosh(0.1, 0.3, { from: 2500, to: 700, gain: 0.2 });
    s.thud(0.4, 0.8, 0.9);
    for (let i = 0; i < 3; i++) s.noise(0.44 + i * 0.05, 0.04, { clock: () => 1500 + s.random() * 1500, gain: env.decay(0.2 - i * 0.05, 1) });
    for (let i = 0; i < 5; i++) s.noise(0.9 + i * 0.035, 0.03, { clock: () => 1200 + s.random() * 1200, gain: env.decay(0.12, 1), short: true });
    return s;
  },

  /** RockTomb.play (five boulders crash down round the target, landing at 0.3 / 0.44 / 0.58 / 0.72 / 0.86 s, crumble away 1.0-1.4 s, Speed drop 1.4-2.3 s): a falling whoosh, five heavy thuds with rumble, crumbling grit, the stat-down jingle. */
  rocktomb: () => {
    const s = new MoveSfx(2.35, 0x70b5);
    s.whoosh(0.0, 0.3, { from: 2000, to: 600, gain: 0.18 });
    for (const [i, at] of [0.3, 0.44, 0.58, 0.72, 0.86].entries()) s.thud(at, 0.7 - i * 0.04, 0.95);
    s.rumble(0.32, 0.7, { from: 500, to: 150, gain: 0.22 });
    for (let i = 0; i < 6; i++) s.noise(1.0 + i * 0.06, 0.05, { clock: () => 1500 + s.random() * 1500, gain: env.decay(0.16, 1) });
    s.statDown(1.4, 0.22);
    return s;
  },

  /** Custom (dark 0-0.25 s, blazing sky 0.25-0.5 s, rocks rise 0.5-1.0 s, boulder swells 0.9-1.1 s, flies 1.1-1.45 s, crash 1.45 s, debris to 2.1 s, clears to 2.35 s): a rising roar, a hurtling boulder and a thundering crash. */
  rockwrecker: () => {
    const s = new MoveSfx(2.6, 0x7ec4);
    s.whoosh(0.25, 0.3, { from: 800, to: 3000, gain: 0.18 });
    s.rumble(0.5, 0.6, { from: 150, to: 400, gain: 0.3 });
    s.pulse(0.5, 0.95, { freq: env.ramp(70, 120), gain: env.swell(0.16), duty: 0.125 });
    s.thud(0.95, 0.35, 0.6);
    s.whoosh(1.1, 0.35, { from: 400, to: 1800, gain: 0.3 });
    s.thud(1.45, 1.0, 1);
    s.noise(1.45, 0.25, { clock: (u) => 5000 - 3500 * u, gain: env.attackDecay(0.45, 0.05) });
    s.rumble(1.47, 0.85, { from: 600, to: 100, gain: 0.45 });
    for (let i = 0; i < 6; i++) s.noise(1.55 + i * 0.07 + s.random() * 0.03, 0.05, { clock: () => 1200 + s.random() * 2000, gain: env.decay(0.25 - i * 0.03, 1) });
    return s;
  },

  /** Rollout.play (boulder rolls in 0-0.55 s, smashes at 0.55 s, chunks fly to ~1.15 s): a rolling rumble that builds, a blunt crash, clattering chunks. */
  rollout: () => {
    const s = new MoveSfx(1.25, 0x7011);
    s.rumble(0.0, 0.55, { from: 120, to: 260, gain: 0.35 });
    s.noise(0.0, 0.55, { clock: (u) => 700 + 600 * u, gain: (u) => 0.12 * u * (0.6 + 0.4 * Math.sin(2 * Math.PI * 12 * u)) });
    s.thud(0.55, 0.75, 0.9);
    s.noise(0.55, 0.12, { clock: () => 2000, gain: env.decay(0.3, 1.5) });
    for (let i = 0; i < 4; i++) s.noise(0.85 + i * 0.07 + s.random() * 0.03, 0.04, { clock: () => 1500 + s.random() * 1200, gain: env.decay(0.12, 1) });
    return s;
  },

  /** Custom (sandy haze swells in and clears over ~1.5 s): a gritty, howling sandstorm. */
  sandstorm: () => {
    const s = new MoveSfx(1.5, 0x5a57);
    s.noise(0.0, 1.4, { clock: (u) => 3000 + 2000 * Math.sin(2 * Math.PI * 1.5 * u), gain: env.swell(0.3) });
    s.noise(0.0, 1.4, { clock: () => 600, gain: env.swell(0.15) });
    s.wave(0.0, 1.3, { freq: (u) => 300 + 120 * Math.sin(2 * Math.PI * 1.2 * u), gain: env.swell(0.08) });
    for (let i = 0; i < 14; i++) s.noise(0.1 + s.random() * 1.1, 0.02, { clock: () => 9000, gain: env.decay(0.15, 1), short: true });
    return s;
  },

  /** Generic projectile (impact 0.43 s): a hurled rock knocks the target down to earth. */
  smackdown: () => {
    const s = new MoveSfx(0.9, 0x5ac0);
    s.whoosh(0.0, 0.43, { from: 800, to: 3000, gain: 0.25 });
    s.pulse(0.05, 0.38, { freq: (u) => 600 - 350 * u, gain: env.ramp(0.05, 0.15), duty: 0.25 });
    s.thud(0.43, 0.75, 0.9);
    s.rumble(0.47, 0.35, { from: 400, to: 150, gain: 0.3 });
    return s;
  },

  /** Custom (stones tossed 0-0.6 s, landing 0.45-1.05 s every 0.15 s, rise 1.05-1.45 s, glint 1.45 s, fade to 1.75 s): stones whizz over and land with clacks, then hover with a glint. */
  stealthrock: () => {
    const s = new MoveSfx(1.95, 0x57ea);
    for (let i = 0; i < 5; i++) {
      const at = 0.45 + i * 0.15;
      s.whoosh(at - 0.45, 0.3, { from: 1500, to: 3500, gain: 0.12 });
      s.noise(at, 0.05, { clock: () => 3000 + s.random() * 2000, gain: env.decay(0.35, 1) });
      s.pulse(at, 0.06, { freq: () => 500 + i * 60, gain: env.decay(0.2, 2), duty: 0.5 });
    }
    s.rumble(1.05, 0.4, { from: 200, to: 450, gain: 0.2 });
    s.sparkle(1.45, 0.25, 4, { lo: 3000, hi: 5500, gain: 0.12 });
    return s;
  },

  /** Custom (stones rise and circle the target 0-0.65 s, six stabs 0.7-1.0 s every 0.06 s, streaks fade to ~1.35 s): a grinding rise, then a volley of sharp stone stabs. */
  stoneedge: () => {
    const s = new MoveSfx(1.55, 0x570e);
    s.rumble(0.0, 0.65, { from: 200, to: 500, gain: 0.28 });
    s.whoosh(0.1, 0.55, { from: 1500, to: 5000, gain: 0.15 });
    s.thud(0.7, 0.75, 0.8);
    for (let i = 0; i < 6; i++) {
      const at = 0.7 + i * 0.06;
      s.noise(at, 0.04, { clock: () => 5000 + s.random() * 4000, gain: env.decay(0.28, 1) });
      s.pulse(at, 0.05, { freq: () => 1400 + i * 120, gain: env.decay(0.12, 2), duty: 0.25 });
    }
    s.rumble(0.75, 0.45, { from: 400, to: 150, gain: 0.22 });
    return s;
  },

  /**
   * WideGuard: five light bars rise in a row (0-0.6 s, one every 0.07 s), then
   * merge into one wide wall (0.5-1.5 s). Five rising chimes, then a broad,
   * low ringing wall.
   */
  wideguard: () => {
    const s = new MoveSfx(1.6, 0x3f61);
    [523, 659, 784, 988, 1175].forEach((f, i) => s.pulse(i * 0.07, 0.18, { freq: () => f, gain: env.decay(0.14, 2), duty: 0.25 }));
    s.whoosh(0.45, 0.12, { from: 1500, to: 5000, gain: 0.2 });
    s.thud(0.5, 0.5, 0.7);
    s.wave(0.5, 0.9, { freq: () => 196, gain: env.decay(0.28, 1.5) });
    s.pulse(0.5, 0.8, { freq: () => 784, gain: env.decay(0.16, 2), duty: 0.25 });
    s.pulse(0.5, 0.8, { freq: () => 1176, gain: env.decay(0.09, 2), duty: 0.25 });
    return s;
  },
};
