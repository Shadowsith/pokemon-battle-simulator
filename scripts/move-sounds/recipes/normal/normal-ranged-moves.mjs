import { MoveSfx } from '../../move-sfx.mjs';
import { env } from '../../track.mjs';

/** Normal-type non-contact attacks (projectiles, beams, sound waves, explosions). */
export const NORMAL_RANGED = {
  /**
   * NormalRangedMoveAnimations.playBarrage: one orb arcs to the target
   * (0.62 s), bursts with a flash, the ground shakes (0.74 s), hold to ~1.2 s.
   */
  barrage: () => {
    const s = new MoveSfx(1.3, 0xba77);
    s.pulse(0.0, 0.62, { freq: (u) => 600 + 500 * Math.sin(Math.PI * Math.min(1, u * 1.2)), gain: env.ramp(0.1, 0.2), duty: 0.25 });
    s.thud(0.62, 0.6, 0.6);
    s.sparkle(0.62, 0.2, 5, { gain: 0.15 });
    s.rumble(0.74, 0.45, { from: 400, to: 150, gain: 0.3 });
    return s;
  },

  /** Generic sonic: four sound rings (0.11 s apart) blast out, impact at 0.43 s. */
  boomburst: () => {
    const s = new MoveSfx(1.1, 0xb00b);
    for (let i = 0; i < 4; i++) {
      const at = i * 0.11;
      s.pulse(at, 0.25, { freq: (u) => 180 * Math.pow(0.6, u), gain: env.decay(0.45, 1.5), duty: 0.5 });
      s.pulse(at, 0.2, { freq: () => 360 + i * 45, gain: env.decay(0.18, 1.5), duty: 0.25 });
    }
    s.noise(0.0, 0.5, { clock: env.ramp(8000, 3000), gain: env.swell(0.25) });
    s.thud(0.43, 0.8, 1);
    s.rumble(0.45, 0.6, { from: 500, to: 150, gain: 0.3 });
    return s;
  },

  /** Generic sonic (rings every 0.11 s, impact 0.43 s): a call that echoes back louder and louder. */
  echoedvoice: () => {
    const s = new MoveSfx(1.0, 0xec0e);
    [0.6, 0.75, 0.9, 1.0].forEach((g, i) => {
      s.pulse(i * 0.11, 0.14, { freq: (u) => 880 * (1 + 0.03 * Math.sin(2 * Math.PI * 3 * u)), gain: env.decay(0.25 * g, 1.5), duty: 0.25 });
      s.wave(i * 0.11, 0.18, { freq: () => 1320, gain: env.decay(0.15 * g, 2) });
    });
    s.pulse(0.43, 0.4, { freq: () => 880, gain: env.decay(0.3, 2), duty: 0.5 });
    s.wave(0.48, 0.4, { freq: () => 880, gain: env.decay(0.12, 2) });
    return s;
  },

  /**
   * NormalRangedMoveAnimations.playEggBomb: an egg arcs high (0.7 s, spinning)
   * and explodes in a red fire cloud on the target (~0.9 s, field shakes).
   */
  eggbomb: () => {
    const s = new MoveSfx(1.75, 0xe9b0);
    s.pulse(0.0, 0.7, { freq: (u) => 700 + 600 * (1 - u), gain: (u) => 0.15 * (0.5 + 0.5 * Math.abs(Math.sin(2 * Math.PI * 4 * u))), duty: 0.25 });
    s.whoosh(0.0, 0.7, { from: 2000, to: 5000, gain: 0.15 });
    s.noise(0.7, 0.05, { clock: () => 12000, gain: env.decay(0.4, 1) });
    s.noise(0.7, 0.95, { clock: (u) => 3500 - 3000 * u, gain: env.attackDecay(0.75, 0.03) });
    s.thud(0.7, 0.6, 1);
    s.pulse(0.7, 0.5, { freq: env.ramp(90, 40), gain: env.decay(0.35, 1.5), duty: 0.5 });
    return s;
  },

  /**
   * NormalRangedMoveAnimations.playExplosion: sparks gather on the glowing
   * caster (0-0.9 s), then a huge blast with white flash and rays (0.9 s),
   * the target is hit (1.15 s), fireball and rays fade (~2.3 s).
   */
  explosion: () => {
    const s = new MoveSfx(2.5, 0xe8a1);
    s.pulse(0.0, 0.9, { freq: (u) => 200 * Math.pow(4, u), gain: env.ramp(0.03, 0.18), duty: 0.25 });
    s.noise(0.0, 0.9, { clock: env.ramp(1500, 8000), gain: env.ramp(0.03, 0.2) });
    s.noise(0.9, 1.5, { clock: (u) => 6000 * Math.pow(0.05, u) + 150, gain: env.attackDecay(0.8, 0.02) });
    s.pulse(0.9, 1.0, { freq: (u) => 120 * Math.pow(0.25, u), gain: env.decay(0.6, 1.5), duty: 0.5 });
    s.thud(1.15, 0.5, 1);
    s.rumble(1.2, 1.2, { from: 400, to: 120, gain: 0.3 });
    return s;
  },

  /** Generic projectile, quick (impact 0.26 s): a fake-out jab that slips past protection. */
  feint: () => {
    const s = new MoveSfx(0.75, 0xfe17);
    s.pulse(0.0, 0.08, { freq: env.ramp(500, 900), gain: env.decay(0.18, 1), duty: 0.25 });
    s.whoosh(0.08, 0.2, { from: 2500, to: 9000, gain: 0.3 });
    s.thud(0.26, 0.5, 0.35);
    s.noise(0.26, 0.06, { clock: () => 14000, gain: env.decay(0.35, 1) });
    s.pulse(0.3, 0.12, { freq: env.ramp(1200, 800), gain: env.decay(0.16, 1.5), duty: 0.125 });
    return s;
  },

  /** Generic projectile (0.43 s): a shimmering orb of hidden power, popping on impact. */
  hiddenpower: () => {
    const s = new MoveSfx(0.95, 0x41dd);
    s.chord(0.0, 0.45, [67, 71, 74, 79], { rate: 0.03, gain: 0.2, voice: 'pulse' });
    s.whoosh(0.0, 0.45, { from: 1500, to: 5000, gain: 0.18 });
    s.thud(0.43, 0.5, 0.4);
    s.sparkle(0.45, 0.35, 7, { gain: 0.15 });
    return s;
  },

  /**
   * NormalRangedMoveAnimations.playHyperBeam: dim + green backdrop (0-0.85 s), the beam grows
   * (0.85-1.07 s), pummels the target with 5 gold flashes (1.07-1.91 s), fades (~2.35 s),
   * final sparkle burst and the backdrop fades (~2.7 s). A charging hum into a roaring blast.
   */
  hyperbeam: () => {
    const s = new MoveSfx(2.85, 0x4b3a);
    s.pulse(0.05, 0.8, { freq: (u) => 110 + 330 * u * u, gain: env.ramp(0.05, 0.22), duty: 0.5 });
    s.noise(0.3, 0.55, { clock: env.ramp(1000, 6000), gain: env.ramp(0.0, 0.2) });
    s.noise(0.85, 1.5, { clock: (u) => 3500 + 800 * Math.sin(2 * Math.PI * 9 * u), gain: (u) => 0.32 * Math.min(1, u * 8) * (u > 0.85 ? (1 - u) / 0.15 : 1) });
    s.pulse(0.85, 1.5, { freq: (u) => 220 * (1 + 0.04 * Math.sin(2 * Math.PI * 40 * u)), gain: (u) => 0.2 * Math.min(1, u * 8) * (u > 0.85 ? (1 - u) / 0.15 : 1), duty: 0.25 });
    for (let i = 0; i < 5; i++) s.thud(1.07 + i * 0.21, 0.4, 0.6);
    s.sparkle(2.33, 0.3, 8, { lo: 2500, hi: 5000, gain: 0.18 });
    s.noise(2.35, 0.45, { clock: env.ramp(3000, 600), gain: env.decay(0.18, 2) });
    return s;
  },

  /** Sonic (4 rings every 0.11 s, impact 0.43 s): a booming, ringing shout that hits all foes. */
  hypervoice: () => {
    const s = new MoveSfx(1.0, 0x4f0c);
    for (let i = 0; i < 4; i++) {
      s.pulse(i * 0.11, 0.14, { freq: (u) => 740 - 120 * u, gain: env.attackDecay(0.24, 0.1), duty: 0.5 });
      s.pulse(i * 0.11, 0.14, { freq: (u) => 1110 - 180 * u, gain: env.attackDecay(0.12, 0.1), duty: 0.25 });
    }
    s.noise(0.43, 0.35, { clock: env.ramp(8000, 3000), gain: env.attackDecay(0.3, 0.05) });
    s.pulse(0.43, 0.45, { freq: (u) => 620 * (1 + 0.03 * Math.sin(2 * Math.PI * 10 * u)), gain: env.decay(0.25, 1.5), duty: 0.5 });
    return s;
  },

  /** Generic projectile (0.43 s), no fleck: a berry's gift floats over with a gentle rising chime and pops on the target. */
  naturalgift: () => {
    const s = new MoveSfx(0.8, 0x9a71);
    s.wave(0.0, 0.43, { freq: env.ramp(600, 1100), gain: env.swell(0.26) });
    s.sparkle(0.05, 0.38, 5, { lo: 2000, hi: 3500, gain: 0.1 });
    s.noise(0.43, 0.08, { clock: () => 10000, gain: env.decay(0.4, 1) });
    s.thud(0.43, 0.45, 0.3);
    s.arpeggio(0.47, [79, 84], 0.07, { gain: 0.16, voice: 'wave', hold: 0.12 });
    return s;
  },

  /** Generic projectile (0.43 s impact): a coin flicked at the foe, then coins jingling on the ground. */
  payday: () => {
    const s = new MoveSfx(1.1, 0x9ad4);
    s.pulse(0.02, 0.05, { freq: () => 2600, gain: env.decay(0.25, 1), duty: 0.125 });
    s.pulse(0.03, 0.38, { freq: (u) => 3200 + 400 * Math.sin(2 * Math.PI * 12 * u), gain: (u) => 0.06 * (1 - 0.5 * u), duty: 0.125 });
    s.thud(0.43, 0.35, 0.2);
    for (const [at, f] of [[0.45, 3950], [0.55, 3500], [0.63, 4200], [0.74, 3700], [0.82, 4400]]) {
      s.pulse(at, 0.12, { freq: () => f, gain: env.decay(0.22, 1.5), duty: 0.125 });
      s.pulse(at + 0.01, 0.1, { freq: () => f * 1.5, gain: env.decay(0.1, 1.5), duty: 0.25 });
    }
    return s;
  },

  /**
   * Generic projectile (impact 0.43 s): a wrapped gift tumbles over with a
   * cheerful little jingle and pops open on the target. No plain original
   * exists (damage and heal both use this clip).
   */
  present: () => {
    const s = new MoveSfx(0.9, 0x9e5e);
    s.arpeggio(0.0, [79, 84, 88, 91], 0.1, { gain: 0.22, voice: 'wave', hold: 0.12 });
    s.pulse(0.05, 0.3, { freq: () => 3136, gain: (u) => 0.06 * (0.5 + 0.5 * Math.sin(2 * Math.PI * 12 * u)), duty: 0.5 });
    s.noise(0.43, 0.12, { clock: (u) => 9000 - 6000 * u, gain: env.attackDecay(0.4, 0.05) });
    s.pulse(0.43, 0.15, { freq: (u) => 200 * Math.pow(0.4, u), gain: env.decay(0.35, 2), duty: 0.5 });
    s.sparkle(0.48, 0.35, 6, { lo: 3000, hi: 5500, gain: 0.14 });
    return s;
  },

  /**
   * Two-turn move, plays on both turns with custom animations:
   * turn 1 NormalRangedMoveAnimations.playRazorWhirlwind (rings spin up for
   * ~1.4-1.76 s), turn 2 playRazorBlades (five blades 0.12 s apart from 0,
   * hits at +0.08 s, done ~0.8 s). Swirling wind cut by quick blade swishes,
   * the wind tailing off for the longer whirlwind.
   */
  razorwind: () => {
    const s = new MoveSfx(1.6, 0x7a2d);
    s.noise(0.0, 1.5, { clock: (u) => 3000 + 2000 * Math.sin(2 * Math.PI * 4 * u), gain: (u) => 0.2 * Math.min(1, u * 8) * Math.pow(1 - u, 1.3) });
    for (let i = 0; i < 5; i++) {
      const at = i * 0.12;
      s.noise(at, 0.09, { clock: (u) => 16000 - 8000 * u, gain: env.attackDecay(0.35, 0.2) });
      s.pulse(at + 0.06, 0.07, { freq: (u) => (2400 - 200 * i) * (1 - 0.4 * u), gain: env.decay(0.16, 1.5), duty: 0.125 });
    }
    return s;
  },

  /** Generic sonic (rings 0.11 s apart, impact 0.43 s) + sleep fleck: an ancient, haunting melody. */
  relicsong: () => {
    const s = new MoveSfx(1.15, 0x7e15);
    [76, 79, 83, 81, 76].forEach((n, i) => {
      const f = 440 * Math.pow(2, (n - 69) / 12);
      s.wave(i * 0.11, 0.16, { freq: (u) => f * (1 + 0.015 * Math.sin(2 * Math.PI * 4 * u)), gain: env.swell(0.3) });
      s.pulse(i * 0.11, 0.12, { freq: () => f * 2, gain: env.decay(0.05, 1.5), duty: 0.25 });
    });
    s.noise(0.43, 0.06, { clock: () => 5000, gain: env.decay(0.15, 1) });
    s.sleep(0.58, 0.18);
    return s;
  },

  /** Generic sonic (rings every 0.11 s, impact 0.43 s): a sung round – a little melody that rings out at the target. */
  round: () => {
    const s = new MoveSfx(1.0, 0x50d0);
    [72, 76, 79, 84].forEach((n, i) => {
      const f = 440 * Math.pow(2, (n - 69) / 12);
      s.pulse(i * 0.11, 0.14, { freq: (u) => f * (1 + 0.015 * Math.sin(2 * Math.PI * 5 * u)), gain: env.decay(0.25, 1), duty: 0.5 });
      s.wave(i * 0.11 + 0.02, 0.16, { freq: () => f / 2, gain: env.decay(0.15, 1) });
    });
    s.chord(0.43, 0.45, [72, 76, 79], { rate: 0.035, gain: 0.2, vibrato: 0.01 });
    s.thud(0.43, 0.25, 0.2);
    return s;
  },

  /** Generic projectile (0.43 s) + paralysis fleck (~0.55 s): a mysterious, shifting orb of energy pops on the target. */
  secretpower: () => {
    const s = new MoveSfx(0.95, 0x5ec9);
    s.pulse(0.0, 0.43, { freq: (u) => 600 + 500 * u + 80 * Math.sin(2 * Math.PI * 6 * u), gain: env.ramp(0.08, 0.22), duty: 0.25 });
    s.whoosh(0.05, 0.38, { from: 1500, to: 5000, gain: 0.18 });
    s.thud(0.43, 0.5, 0.4);
    s.paralyze(0.55, 0.2);
    return s;
  },

  /** NormalRangedMoveAnimations.playSelfDestruct: dark 0.3 s, eight booms 0.4-1.17 s, target hit 1.0 s, glare fades to 1.8 s. */
  selfdestruct: () => {
    const s = new MoveSfx(2.0, 0x5e1f);
    s.noise(0.0, 0.35, { clock: env.ramp(200, 900), gain: env.ramp(0.0, 0.25) });
    for (let i = 0; i < 8; i++) {
      const at = 0.4 + i * 0.11;
      s.noise(at, 0.2, { clock: (u) => 2500 - 2000 * u, gain: env.attackDecay(0.3 + 0.02 * i, 0.04) });
      s.pulse(at, 0.12, { freq: (u) => 140 * Math.pow(0.4, u), gain: env.decay(0.25, 2), duty: 0.5 });
    }
    s.thud(1.0, 0.6, 1);
    s.rumble(1.0, 0.8, { from: 700, to: 150, gain: 0.4 });
    return s;
  },

  /** Generic sonic (4 rings every 0.11 s, impact 0.43 s) + flinch fleck (0.55 s): a loud, rasping snore. */
  snore: () => {
    const s = new MoveSfx(0.85, 0x5302);
    for (let i = 0; i < 2; i++) {
      s.pulse(0.02 + i * 0.2, 0.2, { freq: (u) => (90 + 40 * u) * (1 + 0.1 * Math.sin(2 * Math.PI * 30 * u)), gain: env.swell(0.35), duty: 0.25 });
      s.noise(0.02 + i * 0.2, 0.2, { clock: () => 500, gain: env.swell(0.25) });
    }
    s.thud(0.43, 0.45, 0.6);
    s.flinch(0.55);
    return s;
  },

  /** Generic projectile (impact 0.43 s): a shockwave whistles over and cracks with a boom. */
  sonicboom: () => {
    const s = new MoveSfx(0.85, 0x50b0);
    s.pulse(0.0, 0.43, { freq: (u) => 600 + 2400 * u, gain: env.ramp(0.08, 0.2), duty: 0.125 });
    s.whoosh(0.0, 0.43, { from: 2000, to: 9000, gain: 0.22 });
    s.noise(0.43, 0.3, { clock: env.ramp(6000, 600), gain: env.attackDecay(0.45, 0.05) });
    s.thud(0.43, 0.5, 0.8);
    return s;
  },

  /**
   * Generic beam at minimum power (grows 0.26 s, holds ~0.16 s, fades to ~0.62 s),
   * 3 hits: three spikes are fired in quick succession, landing at 0.26 / 0.36 / 0.46 s.
   */
  spikecannon: () => {
    const s = new MoveSfx(0.8, 0x5c4a);
    for (let hit = 0; hit < 3; hit++) {
      const at = hit * 0.1;
      s.pulse(at, 0.04, { freq: (u) => 900 + 900 * u, gain: env.decay(0.2, 1), duty: 0.25 });
      s.pulse(at + 0.02, 0.22, { freq: (u) => 2200 - 900 * u, gain: (u) => 0.07 * (1 - 0.5 * u), duty: 0.125 });
      s.noise(at + 0.26, 0.05, { clock: () => 14000, gain: env.decay(0.3, 1) });
      s.thud(at + 0.26, 0.4, 0.25);
    }
    return s;
  },

  /** Generic projectile (impact 0.43 s): stored power is heaved up and spat out in a gush. */
  spitup: () => {
    const s = new MoveSfx(0.9, 0x5917);
    s.pulse(0.0, 0.3, { freq: (u) => (110 + 60 * u) * (1 + 0.08 * Math.sin(2 * Math.PI * 14 * u)), gain: env.swell(0.3), duty: 0.25 });
    s.noise(0.25, 0.2, { clock: env.ramp(1500, 4000), gain: env.swell(0.25) });
    s.noise(0.43, 0.35, { clock: env.ramp(4000, 900), gain: env.attackDecay(0.4, 0.06) });
    s.thud(0.43, 0.5, 0.6);
    return s;
  },

  /** Generic field (~0.6 s, all foes): a shower of star rays, twinkling and swooshing. */
  swift: () => {
    const s = new MoveSfx(1.0, 0x5f17);
    s.whoosh(0.0, 0.5, { from: 3000, to: 8000, gain: 0.18 });
    s.arpeggio(0.02, [84, 88, 91, 96, 91, 88], 0.08, { gain: 0.2, duty: 0.25, hold: 0.1 });
    s.sparkle(0.05, 0.55, 10, { lo: 3000, hi: 6000, gain: 0.16 });
    for (const at of [0.3, 0.45, 0.6]) s.noise(at, 0.06, { clock: () => 8000, gain: env.decay(0.25, 1) });
    return s;
  },

  /** Generic projectile (impact 0.43 s): a divine orb of light that bursts on the target. */
  judgment: () => {
    const s = new MoveSfx(1.25, 0x10d6);
    s.chord(0.0, 0.48, [72, 79, 84, 88], { rate: 0.03, gain: 0.34 });
    s.wave(0.0, 0.45, { freq: (u) => 523 * Math.pow(2, u), gain: env.ramp(0.08, 0.2) });
    s.thud(0.43, 0.6, 0.8);
    s.noise(0.43, 0.3, { clock: (u) => 14000 - 9000 * u, gain: env.attackDecay(0.4, 0.03) });
    s.sparkle(0.48, 0.6, 10, { lo: 3500, hi: 6500, gain: 0.14 });
    s.rumble(0.45, 0.6, { from: 400, to: 150, gain: 0.2 });
    return s;
  },

  /** Generic projectile at high power (impact 0.43 s): a futuristic charged blast - rising synth whine, hard energy burst with a falling laser tone. */
  technoblast: () => {
    const s = new MoveSfx(1.05, 0x7ecb);
    s.pulse(0.0, 0.43, { freq: (u) => 300 * Math.pow(5, u), gain: env.ramp(0.06, 0.2), duty: 0.125 });
    s.pulse(0.0, 0.43, { freq: (u) => 302 * Math.pow(5, u), gain: env.ramp(0.04, 0.12), duty: 0.5 });
    s.noise(0.0, 0.43, { clock: env.ramp(2000, 8000), gain: env.ramp(0.04, 0.16), short: true });
    s.thud(0.43, 0.8, 0.8);
    s.noise(0.43, 0.35, { clock: (u) => 18000 - 12000 * u, gain: env.attackDecay(0.4, 0.03) });
    s.pulse(0.43, 0.45, { freq: (u) => 1600 * Math.pow(0.2, u), gain: env.decay(0.25, 1.5), duty: 0.25 });
    return s;
  },

  /**
   * NormalRangedMoveAnimations.playTriAttack: field goes black (0-0.3 s), three orbs circle
   * the caster twice (0.3-1.3 s), then fly at the target (impacts 1.6 / 1.77 / 1.94 s) and burst
   * into sparks, ice and fire (to ~2.75 s); the dark fades by ~3.05 s. Hum, swirl, then zap/clink/roar.
   */
  triattack: () => {
    const s = new MoveSfx(3.15, 0x7a1a);
    s.pulse(0.02, 0.3, { freq: env.ramp(80, 120), gain: env.ramp(0.02, 0.15), duty: 0.5 });
    // The orbit: a three-note GB shimmer that whirls round twice.
    s.chord(0.3, 1.0, [76, 80, 83], { rate: 0.042, gain: 0.2, voice: 'pulse' });
    s.wave(0.3, 1.0, { freq: (u) => 300 * (1 + 0.15 * Math.sin(2 * Math.PI * 2 * u)), gain: env.swell(0.15) });
    s.whoosh(1.3, 0.3, { from: 2000, to: 8000, gain: 0.2 });
    // Electric burst.
    s.thud(1.6, 0.45, 0.3);
    s.noise(1.6, 0.3, { clock: () => 7000, gain: env.decay(0.3, 1.5), short: true });
    s.pulse(1.6, 0.2, { freq: (u) => 1800 - 1200 * u, gain: env.decay(0.25, 2), duty: 0.25 });
    // Ice burst.
    s.thud(1.77, 0.4, 0.3);
    s.sparkle(1.77, 0.3, 6, { lo: 3500, hi: 6000, gain: 0.2 });
    s.wave(1.77, 0.35, { freq: (u) => 1760 * Math.pow(0.6, u), gain: env.decay(0.2, 1.5) });
    // Fire burst: warm roar while the puffs flare.
    s.thud(1.94, 0.5, 0.5);
    s.noise(1.94, 0.8, { clock: (u) => 1600 - 900 * u, gain: env.attackDecay(0.4, 0.1) });
    s.pulse(1.94, 0.5, { freq: (u) => 120 * Math.pow(0.5, u), gain: env.decay(0.25, 1.5), duty: 0.5 });
    return s;
  },

  /** Generic projectile (impact 0.43 s): a shining last-resort card flicks out and slaps in with a flourish. */
  trumpcard: () => {
    const s = new MoveSfx(1.0, 0x7c4d);
    s.arpeggio(0.0, [76, 79, 83, 88], 0.07, { gain: 0.18, duty: 0.25, hold: 0.1 });
    s.whoosh(0.15, 0.28, { from: 2500, to: 9000, gain: 0.2 });
    s.thud(0.43, 0.6, 0.45);
    s.pulse(0.43, 0.25, { freq: () => 1318, gain: env.decay(0.15, 1.5), duty: 0.25 });
    s.sparkle(0.48, 0.35, 5, { gain: 0.14 });
    return s;
  },

  /** Generic sonic (4 rings every 0.11 s, impact 0.43 s): a raucous, rattling shout that keeps blaring. */
  uproar: () => {
    const s = new MoveSfx(1.05, 0x0b2a);
    s.pulse(0.0, 0.85, { freq: (u) => (330 + 60 * Math.sin(2 * Math.PI * 9 * u)), gain: (u) => 0.22 * Math.min(1, u * 10) * Math.pow(1 - u, 0.8), duty: 0.25 });
    s.pulse(0.0, 0.85, { freq: (u) => (495 + 80 * Math.sin(2 * Math.PI * 9 * u + 1)), gain: (u) => 0.12 * Math.min(1, u * 10) * Math.pow(1 - u, 0.8), duty: 0.5 });
    for (let i = 0; i < 4; i++) s.noise(i * 0.11, 0.08, { clock: () => 6000, gain: env.decay(0.22, 1.5) });
    s.thud(0.43, 0.45, 0.4);
    return s;
  },

  /** Generic lob (impact 0.52 s): a ball of weather energy arcs over and bursts with a bright pop. */
  weatherball: () => {
    const s = new MoveSfx(1.0, 0x3eba);
    s.wave(0.0, 0.52, { freq: (u) => 500 + 400 * Math.sin(Math.PI * u), gain: () => 0.2 });
    s.noise(0.0, 0.52, { clock: () => 4000, gain: env.swell(0.12) });
    s.thud(0.52, 0.55, 0.5);
    s.noise(0.52, 0.18, { clock: (u) => 14000 - 8000 * u, gain: env.attackDecay(0.35, 0.03) });
    s.sparkle(0.56, 0.3, 5, { gain: 0.14 });
    return s;
  },
};
