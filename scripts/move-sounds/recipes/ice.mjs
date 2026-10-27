import { MoveSfx } from '../move-sfx.mjs';
import { env } from '../track.mjs';

/** Ice-type move sounds. */
export const ICE = {
  /**
   * IceMoveAnimations.playAuroraBeam: the scene dims (0-0.3 s), 34 rainbow
   * rings stream to the target (0.3-1.54 s), then the scene clears (to ~2.1 s).
   */
  aurorabeam: () => {
    const s = new MoveSfx(2.05, 0xa0b3);
    s.wave(0.0, 0.4, { freq: () => 220, gain: env.swell(0.12) });
    s.chord(0.3, 1.3, [84, 88, 91, 96], { gain: 0.24, vibrato: 0.015 });
    s.noise(0.72, 0.85, { clock: () => 14000, gain: env.swell(0.08) });
    s.sparkle(0.75, 0.8, 12, { lo: 3000, hi: 5500, gain: 0.12 });
    s.wave(1.5, 0.5, { freq: () => 1046.5, gain: env.decay(0.12, 2) });
    return s;
  },

  /** Generic melee: a crash of ice, rolling snow and flying chunks. */
  avalanche: () => {
    const s = new MoveSfx(1.3, 0xa7a1);
    s.whoosh(0.0, 0.18, { from: 600, to: 2000, gain: 0.3 });
    s.thud(0.17, 0.8, 1);
    s.rumble(0.17, 1.1, { from: 600, to: 150, gain: 0.45 });
    s.sparkle(0.25, 0.65, 8, { lo: 2000, hi: 3500, gain: 0.16 });
    return s;
  },

  /**
   * IceMoveAnimations.playBlizzard: a 2.2 s snowstorm with wind gusts; ice
   * crystals build up on the target, which is hit at 0.45 s and every 0.3 s.
   */
  blizzard: () => {
    const s = new MoveSfx(2.35, 0xb122);
    s.noise(0.0, 2.25, { clock: (u) => 3000 + 1500 * Math.sin(2 * Math.PI * 2.5 * u), gain: env.swell(0.3) });
    s.wave(0.0, 2.2, { freq: (u) => 700 + 180 * Math.sin(2 * Math.PI * 1.6 * u), gain: env.swell(0.14) });
    for (let i = 0; i < 5; i++) {
      const at = 0.45 + i * 0.3;
      s.noise(at, 0.05, { clock: () => 12000, gain: env.decay(0.3, 1) });
      s.pulse(at, 0.1, { freq: () => 2400 + i * 180, gain: env.decay(0.14, 2), duty: 0.125 });
    }
    s.sparkle(0.5, 1.6, 14, { lo: 3000, hi: 5500, gain: 0.12 });
    return s;
  },

  /** Generic projectile (impact at 0.43 s) + freeze fleck: a dry, crackling chill flash-freezes the target. */
  freezedry: () => {
    const s = new MoveSfx(1.25, 0xf2d7);
    s.noise(0.0, 0.43, { clock: (u) => 6000 + 6000 * u, gain: env.ramp(0.06, 0.22) });
    s.wave(0.0, 0.43, { freq: (u) => 1400 + 600 * u, gain: env.ramp(0.05, 0.14) });
    s.noise(0.43, 0.08, { clock: () => 14000, gain: env.decay(0.4, 1) });
    s.sparkle(0.43, 0.3, 7, { lo: 3500, hi: 6000, gain: 0.16 });
    s.freeze(0.58);
    return s;
  },

  /**
   * Two-turn move, plays on both turns: turn 1 FxEffects.chargeUp (glow
   * gathers ~0.48 s), turn 2 generic beam at near-max power (grows 0.26 s,
   * holds ~0.36 s, fades 0.2 s) + paralysis fleck. A crackling icy charge.
   */
  freezeshock: () => {
    const s = new MoveSfx(1.25, 0xf25c);
    s.wave(0.0, 0.3, { freq: (u) => 600 + 1200 * u, gain: env.ramp(0.08, 0.2) });
    s.noise(0.0, 0.85, { clock: (u) => 9000 + 3000 * Math.sin(2 * Math.PI * 4 * u), gain: env.swell(0.2) });
    s.noise(0.26, 0.55, { clock: () => 5000, gain: env.swell(0.12), short: true });
    s.sparkle(0.26, 0.55, 8, { lo: 3500, hi: 6000, gain: 0.14 });
    s.paralyze(0.85, 0.2);
    return s;
  },

  /** Generic projectile (impact at 0.43 s): a frigid gust of breath, ending in icy chips. */
  frostbreath: () => {
    const s = new MoveSfx(1.05, 0xf2b7);
    s.noise(0.0, 0.5, { clock: (u) => 2500 + 4000 * u, gain: env.attackDecay(0.3, 0.3) });
    s.wave(0.02, 0.45, { freq: (u) => 900 + 300 * Math.sin(2 * Math.PI * 3 * u), gain: env.swell(0.12) });
    s.noise(0.43, 0.06, { clock: () => 13000, gain: env.decay(0.35, 1) });
    s.sparkle(0.45, 0.35, 7, { lo: 3000, hi: 5500, gain: 0.15 });
    return s;
  },

  /** Generic field (~0.6 s, all foes) + Speed-drop fleck (≈0.7 s): a freezing gale sweeps the field. */
  glaciate: () => {
    const s = new MoveSfx(1.4, 0x61ac);
    s.whoosh(0.0, 0.65, { from: 4000, to: 12000, gain: 0.25 });
    s.wave(0.0, 0.65, { freq: (u) => 1760 * Math.pow(0.55, u), gain: env.swell(0.12) });
    s.sparkle(0.05, 0.6, 12, { lo: 3500, hi: 7000, gain: 0.14 });
    s.statDown(0.7, 0.24);
    return s;
  },

  /** Generic weather (particles fall ~1.1 s, glow 0.9 s, clip ~1.45 s): an icy wind with hailstones clattering down. */
  hail: () => {
    const s = new MoveSfx(1.45, 0x4a11);
    s.noise(0.0, 1.35, { clock: (u) => 4000 + 1500 * Math.sin(2 * Math.PI * 1.5 * u), gain: env.swell(0.22) });
    s.wave(0.0, 1.3, { freq: (u) => 900 - 250 * u, gain: env.swell(0.08) });
    for (let i = 0; i < 12; i++) {
      const at = 0.1 + s.random() * 1.05;
      s.noise(at, 0.03, { clock: () => 10000, gain: env.decay(0.28, 1), short: true });
      s.pulse(at, 0.05, { freq: () => 2600 + s.random() * 1800, gain: env.decay(0.12, 1.5), duty: 0.125 });
    }
    return s;
  },

  /** Generic target aura (~0.8 s): a low, murky fog rolls over the field and settles. */
  haze: () => {
    const s = new MoveSfx(1.2, 0x4a2e);
    s.noise(0.0, 1.1, { clock: (u) => 700 - 300 * u, gain: env.swell(0.4) });
    s.wave(0.0, 1.05, { freq: (u) => 140 + 25 * Math.sin(2 * Math.PI * 3 * u), gain: env.swell(0.3) });
    s.wave(0.1, 0.9, { freq: (u) => 210 - 40 * u, gain: env.swell(0.12) });
    return s;
  },

  /** Generic lob (impact 0.52 s): a snowball tumbles through the air and bursts into crunchy snow. */
  iceball: () => {
    const s = new MoveSfx(1.05, 0x1ceb);
    s.wave(0.0, 0.5, { freq: (u) => 900 + 500 * Math.sin(Math.PI * u), gain: env.swell(0.14) });
    s.noise(0.0, 0.5, { clock: (u) => 4000 + 3000 * Math.sin(Math.PI * u), gain: env.swell(0.12) });
    s.thud(0.52, 0.55, 0.5);
    s.noise(0.52, 0.3, { clock: (u) => 9000 - 5000 * u, gain: env.attackDecay(0.3, 0.05) });
    s.sparkle(0.55, 0.35, 7, { lo: 2500, hi: 5000, gain: 0.15 });
    return s;
  },

  /**
   * IceMoveAnimations.playIceBeam: the beam grows (0-0.24 s), holds with a
   * flaring impact and ice crystals forming on the target (0.24-1.19 s, shakes
   * every 0.24 s), fades (to 1.45 s). A glassy, shimmering ray.
   */
  icebeam: () => {
    const s = new MoveSfx(1.6, 0x1cebe);
    s.wave(0.0, 0.24, { freq: (u) => 900 + 900 * u, gain: env.ramp(0.08, 0.2) });
    s.chord(0.2, 1.25, [86, 91, 95, 98], { rate: 0.03, gain: 0.18, vibrato: 0.01 });
    s.noise(0.0, 1.45, { clock: () => 12000, gain: (u) => 0.16 * Math.min(1, u * 6) * Math.min(1, (1 - u) * 4) });
    for (let i = 0; i < 4; i++) s.noise(0.24 + i * 0.24, 0.05, { clock: () => 14000, gain: env.decay(0.25, 1) });
    s.sparkle(0.25, 1.0, 14, { lo: 3500, hi: 6500, gain: 0.12 });
    return s;
  },

  /**
   * Two-turn move, plays on both turns: turn 1 FxEffects.chargeUp (~0.5 s),
   * turn 2 generic beam at near-max power (grows 0.26 s, holds ~0.36 s, fades
   * to ~0.82 s) + burn fleck (0.85 s). A freezing roar with a searing edge.
   */
  iceburn: () => {
    const s = new MoveSfx(1.3, 0x1cb0);
    s.wave(0.0, 0.3, { freq: (u) => 500 + 1300 * u, gain: env.ramp(0.08, 0.2) });
    s.noise(0.0, 0.82, { clock: (u) => 7000 + 3000 * Math.sin(2 * Math.PI * 3 * u), gain: env.swell(0.2) });
    s.noise(0.26, 0.56, { clock: () => 900, gain: env.swell(0.2) });
    s.sparkle(0.26, 0.5, 8, { lo: 3500, hi: 6500, gain: 0.13 });
    s.burn(0.85, 0.25);
    return s;
  },

  /** Generic melee bite (impact 0.17 s) + freeze fleck (0.45 s): frosty fangs snap shut with a crunch. */
  icefang: () => {
    const s = new MoveSfx(1.0, 0x1cef);
    s.whoosh(0.0, 0.17, { from: 2500, to: 9000, gain: 0.25 });
    s.noise(0.17, 0.06, { clock: () => 12000, gain: env.decay(0.4, 1) });
    s.pulse(0.17, 0.08, { freq: (u) => 1400 - 800 * u, gain: env.decay(0.25, 1.5), duty: 0.25 });
    s.thud(0.2, 0.45, 0.3);
    s.freeze(0.45);
    return s;
  },

  /**
   * FxEffects.playElementalPunch (ice): the fist slams in (impact 0.15 s), ice
   * chunks burst outward (to ~1.2 s). A heavy punch that cracks into ice.
   */
  icepunch: () => {
    const s = new MoveSfx(1.3, 0x1cec);
    s.whoosh(0.0, 0.15, { from: 2500, to: 9000, gain: 0.3 });
    s.thud(0.15, 0.6, 0.7);
    s.noise(0.15, 0.1, { clock: () => 14000, gain: env.decay(0.3, 1) });
    s.noise(0.17, 0.95, { clock: (u) => 9000 - 4000 * u, gain: (u) => 0.2 * Math.min(1, u * 10) * Math.pow(1 - u, 1.3) });
    s.wave(0.15, 0.95, { freq: (u) => 2000 * Math.pow(0.55, u), gain: env.decay(0.16, 1.2) });
    s.sparkle(0.2, 0.9, 14, { lo: 2500, hi: 5500, gain: 0.17 });
    return s;
  },

  /** Generic projectile at priority (impact 0.26 s): a quick, glinting shard that clinks on hit. */
  iceshard: () => {
    const s = new MoveSfx(0.75, 0x1c5a);
    s.whoosh(0.0, 0.26, { from: 4000, to: 12000, gain: 0.25 });
    s.pulse(0.0, 0.26, { freq: (u) => 2400 + 1200 * u, gain: env.ramp(0.05, 0.12), duty: 0.125 });
    s.noise(0.26, 0.05, { clock: () => 14000, gain: env.decay(0.4, 1) });
    s.pulse(0.26, 0.35, { freq: () => 3136, gain: env.decay(0.16, 2), duty: 0.25 });
    s.sparkle(0.28, 0.3, 5, { lo: 3500, hi: 6500, gain: 0.14 });
    return s;
  },

  /** Generic projectile (impact 0.43 s) + flinch fleck (0.55 s): heavy icicles crash down with a shattering thump. */
  iciclecrash: () => {
    const s = new MoveSfx(1.05, 0x1c1c);
    s.wave(0.0, 0.43, { freq: (u) => 1800 - 900 * u, gain: env.ramp(0.06, 0.16) });
    s.whoosh(0.0, 0.43, { from: 2000, to: 6000, gain: 0.2 });
    s.thud(0.43, 0.75, 0.9);
    s.noise(0.43, 0.25, { clock: (u) => 13000 - 5000 * u, gain: env.attackDecay(0.3, 0.05) });
    s.sparkle(0.45, 0.4, 8, { lo: 2500, hi: 5000, gain: 0.15 });
    s.flinch(0.62);
    return s;
  },

  /** Generic projectile, 3 hits (impacts 0.43 / 1.0 / 1.57 s): a volley of icicles, each landing with a sharp ice crack. */
  iciclespear: () => {
    const s = new MoveSfx(1.95, 0x1c5e);
    for (let i = 0; i < 3; i++) {
      const at = 0.43 + i * 0.57;
      s.whoosh(at - 0.3, 0.3, { from: 3000, to: 10000, gain: 0.2 });
      s.noise(at, 0.06, { clock: () => 13000, gain: env.decay(0.35, 1) });
      s.thud(at, 0.45, 0.3);
      s.pulse(at, 0.2, { freq: () => 2637 + i * 200, gain: env.decay(0.13, 2), duty: 0.125 });
      s.sparkle(at + 0.02, 0.2, 3, { lo: 3500, hi: 6000, gain: 0.12 });
    }
    return s;
  },

  /** Generic field (gust over all foes ~0.6 s) + Speed drop fleck (0.7 s): a howling chilly wind with drifting flakes. */
  icywind: () => {
    const s = new MoveSfx(1.4, 0x1c3d);
    s.noise(0.0, 0.75, { clock: (u) => 3000 + 1500 * Math.sin(2 * Math.PI * 2 * u), gain: env.swell(0.3) });
    s.wave(0.0, 0.7, { freq: (u) => 800 + 250 * Math.sin(2 * Math.PI * 1.5 * u), gain: env.swell(0.14) });
    s.sparkle(0.1, 0.55, 8, { lo: 3500, hi: 6000, gain: 0.12 });
    s.statDown(0.7, 0.24);
    return s;
  },

  /** Generic self aura (~0.8 s, team side): a cold white mist rolls out over the party with a faint glassy shimmer. */
  mist: () => {
    const s = new MoveSfx(1.1, 0x3157);
    s.noise(0.02, 0.85, { clock: (u) => 3500 + 2500 * Math.sin(Math.PI * u), gain: env.swell(0.32) });
    s.wave(0.05, 0.8, { freq: (u) => 1320 * (1 + 0.02 * Math.sin(2 * Math.PI * 5 * u)), gain: env.swell(0.12) });
    s.sparkle(0.2, 0.6, 6, { lo: 3500, hi: 6000, gain: 0.1 });
    return s;
  },

  /** Generic field (≈0.6 s) + freeze fleck: a chilly gust of fine snow over the foes. */
  powdersnow: () => {
    const s = new MoveSfx(1.25, 0x1ce5);
    s.noise(0.0, 0.7, { clock: (u) => 6000 + 3000 * u, gain: env.attackDecay(0.28, 0.3) });
    s.sparkle(0.05, 0.6, 9, { lo: 3500, hi: 6500, gain: 0.15 });
    s.freeze(0.65);
    return s;
  },

  /** Generic projectile (0.43 s), no fleck: an absolute-zero chill - a thin freezing whistle, then a glassy crackle as ice seals the target. */
  sheercold: () => {
    const s = new MoveSfx(1.0, 0x5ec0);
    s.wave(0.0, 0.43, { freq: (u) => 1400 + 800 * u, gain: env.ramp(0.08, 0.2) });
    s.noise(0.0, 0.43, { clock: () => 12000, gain: env.swell(0.1) });
    s.noise(0.43, 0.15, { clock: env.ramp(14000, 6000), gain: env.attackDecay(0.35, 0.05) });
    s.freeze(0.45, 0.24);
    s.wave(0.45, 0.45, { freq: () => 2093, gain: env.decay(0.14, 1.2) });
    return s;
  },
};
