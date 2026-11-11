import { MoveSfx } from '../move-sfx.mjs';
import { env } from '../track.mjs';

/** Steel-type move sounds. */
export const STEEL = {
  /** Generic self aura + stat-up fleck: armor plates clank off, the body gets lighter. */
  autotomize: () => {
    const s = new MoveSfx(1.5, 0xa070);
    for (const at of [0.05, 0.15, 0.25, 0.35]) {
      s.noise(at, 0.04, { clock: () => 8000, gain: env.decay(0.3, 1), short: true });
      s.pulse(at, 0.15, { freq: () => 2300 + s.random() * 600, gain: env.decay(0.14, 2), duty: 0.5 });
    }
    s.whoosh(0.35, 0.4, { from: 2000, to: 8000, gain: 0.25 });
    s.statUp(0.85);
    return s;
  },

  /** Generic melee punch at priority (lunge 0.12 s): a fast, metallic jab. */
  bulletpunch: () => {
    const s = new MoveSfx(0.65, 0xb0e7);
    s.whoosh(0.0, 0.12, { from: 3000, to: 10000, gain: 0.35 });
    s.thud(0.12, 0.6, 0.4);
    s.noise(0.12, 0.08, { clock: () => 9000, gain: env.decay(0.4, 1), short: true });
    s.pulse(0.12, 0.35, { freq: () => 1850, gain: env.decay(0.14, 2), duty: 0.5 });
    return s;
  },

  /**
   * Custom, the turn it's used (dark 0-0.3 s, white swells peak at 0.47 / 0.92 s):
   * an ominous hum and two bright glints - a wish of light that will strike later.
   */
  doomdesire: () => {
    const s = new MoveSfx(1.6, 0xd00d);
    s.chord(0.0, 1.2, [48, 55, 60], { rate: 0.04, gain: 0.22, voice: 'pulse' });
    for (const at of [0.47, 0.92]) {
      s.whoosh(at - 0.17, 0.2, { from: 2000, to: 7000, gain: 0.15 });
      s.noise(at, 0.05, { clock: () => 9000, gain: env.decay(0.3, 1), short: true });
      s.pulse(at, 0.45, { freq: () => 1568, gain: env.decay(0.16, 2), duty: 0.5 });
      s.sparkle(at, 0.25, 4, { lo: 3500, hi: 6000, gain: 0.1 });
    }
    return s;
  },

  /** Custom (dark 0-0.25 s, light gathers 0.25-0.6 s, orb 0.6-0.95 s, beam 0.95-1.35 s, hit 1.1 s, rings to ~2.0 s): gathering light, a gleaming ray, a bright burst. */
  flashcannon: () => {
    const s = new MoveSfx(2.4, 0xf1ac);
    s.whoosh(0.25, 0.35, { from: 6000, to: 2000, gain: 0.15 });
    s.sparkle(0.25, 0.4, 5, { lo: 4000, hi: 7000, gain: 0.12 });
    s.chord(0.6, 0.35, [79, 86, 91], { rate: 0.025, gain: 0.16, voice: 'pulse' });
    s.noise(0.95, 0.4, { clock: () => 6000, gain: (u) => 0.22 * Math.min(1, u * 4) * Math.min(1, (1 - u) * 3), short: true });
    s.wave(0.95, 0.4, { freq: env.ramp(500, 900), gain: env.swell(0.2) });
    s.thud(1.1, 0.6, 0.6);
    s.noise(1.1, 0.25, { clock: (u) => 9000 - 6000 * u, gain: env.attackDecay(0.3, 0.03) });
    s.sparkle(1.25, 0.7, 7, { lo: 4500, hi: 7500, gain: 0.12 });
    return s;
  },

  /** Generic melee, 2 hits (impacts 0.17 / 0.59 s): spinning gears grind into the foe with metallic clanks. */
  geargrind: () => {
    const s = new MoveSfx(1.0, 0x6ea6);
    for (const at of [0.17, 0.59]) {
      s.noise(at - 0.15, 0.17, { clock: (u) => 3000 + 5000 * u, gain: env.swell(0.12), short: true });
      s.noise(at, 0.2, { clock: () => 9000, gain: env.decay(0.35, 1.5), short: true });
      s.pulse(at, 0.18, { freq: (u) => 1400 * (1 + 0.15 * Math.sin(2 * Math.PI * 40 * u)) * (1 - 0.3 * u), gain: env.decay(0.18, 1.5), duty: 0.25 });
      s.thud(at, 0.4, 0.3);
    }
    return s;
  },

  /** Custom (glint ring spins up 0-0.8 s, dart and hit 0.92 s, white whirl grinds to ~1.65 s): a whirring spin-up, a clank, a grinding whirr. */
  gyroball: () => {
    const s = new MoveSfx(1.8, 0x9b0a);
    s.noise(0.0, 0.8, { clock: (u) => 3000 + 2500 * u + 2000 * Math.sin(2 * Math.PI * 12 * u), gain: env.ramp(0.08, 0.3), short: true });
    s.pulse(0.0, 0.8, { freq: (u) => 400 + 900 * u + 120 * Math.sin(2 * Math.PI * 16 * u), gain: env.ramp(0.06, 0.22), duty: 0.25 });
    s.whoosh(0.8, 0.12, { from: 2000, to: 7000, gain: 0.25 });
    s.thud(0.92, 0.5, 0.6);
    s.noise(0.92, 0.08, { clock: () => 9000, gain: env.decay(0.4, 1), short: true });
    s.pulse(0.92, 0.6, { freq: () => 1760, gain: env.decay(0.2, 1.5), duty: 0.5 });
    s.noise(0.95, 0.6, { clock: (u) => 6000 + 2000 * Math.sin(2 * Math.PI * 14 * u), gain: env.decay(0.18, 1.5), short: true });
    s.sparkle(1.0, 0.45, 6, { lo: 3000, hi: 5500, gain: 0.1 });
    return s;
  },

  /** Generic melee (impact 0.17 s): a massive iron body slams down with a ringing, heavy clang. */
  heavyslam: () => {
    const s = new MoveSfx(1.15, 0x4e5a);
    s.whoosh(0.0, 0.18, { from: 800, to: 3000, gain: 0.3 });
    s.thud(0.17, 0.9, 1);
    s.noise(0.17, 0.1, { clock: () => 7000, gain: env.decay(0.45, 1), short: true });
    s.pulse(0.17, 0.8, { freq: () => 1175, gain: env.decay(0.2, 1.5), duty: 0.5 });
    s.pulse(0.17, 0.6, { freq: () => 1661, gain: env.decay(0.08, 2), duty: 0.5 });
    s.rumble(0.2, 0.8, { from: 500, to: 150, gain: 0.4 });
    return s;
  },

  /**
   * SteelMoveAnimations.playIronDefense: two white blinks (0 / 0.16 s), the
   * user gleams silver twice (0.45-1.25 s, peaks 0.69 / 0.97 s), then the
   * stat-up aura rises (1.3-2.1 s).
   */
  irondefense: () => {
    const s = new MoveSfx(2.2, 0x1d3f);
    for (const at of [0.0, 0.16]) s.pulse(at, 0.08, { freq: () => 2093, gain: env.decay(0.14, 1.5), duty: 0.25 });
    s.wave(0.45, 0.8, { freq: () => 392, gain: env.swell(0.14) });
    for (const at of [0.5, 0.69, 0.97]) {
      s.noise(at, 0.04, { clock: () => 8000, gain: env.decay(0.3, 1), short: true });
      s.pulse(at, 0.25, { freq: () => 1568 + at * 400, gain: env.decay(0.15, 2), duty: 0.5 });
    }
    s.statUp(1.3);
    return s;
  },

  /** Custom (steel rush 0-0.25 s, glint and ram 0.25 s, impact 0.45 s, shards fall to ~1.3 s): a rushing dash, a heavy ringing clang, tinkling shards. */
  ironhead: () => {
    const s = new MoveSfx(1.7, 0x1d4e);
    s.whoosh(0.0, 0.45, { from: 1500, to: 6000, gain: 0.28 });
    s.pulse(0.25, 0.08, { freq: () => 2490, gain: env.decay(0.1, 1.5), duty: 0.25 });
    s.thud(0.45, 0.75, 0.8);
    s.noise(0.45, 0.08, { clock: () => 8000, gain: env.decay(0.4, 1), short: true });
    s.pulse(0.45, 0.5, { freq: () => 1175, gain: env.decay(0.2, 1.5), duty: 0.5 });
    s.sparkle(0.55, 0.6, 7, { lo: 2500, hi: 4500, gain: 0.1 });
    return s;
  },

  /** Generic melee (impact 0.17 s) + Defense drop fleck (0.45 s): a swung steel tail whips in with a clanking smack. */
  irontail: () => {
    const s = new MoveSfx(1.1, 0x1d7a);
    s.whoosh(0.0, 0.17, { from: 2000, to: 9000, gain: 0.35 });
    s.thud(0.17, 0.6, 0.6);
    s.noise(0.17, 0.08, { clock: () => 9000, gain: env.decay(0.4, 1), short: true });
    s.pulse(0.17, 0.35, { freq: () => 1480, gain: env.decay(0.14, 2), duty: 0.5 });
    s.statDown(0.45);
    return s;
  },

  /** Generic lob (arc 0.52 s → impact): a ticking magnetic mine homes in and detonates with a metallic bang. */
  magnetbomb: () => {
    const s = new MoveSfx(1.15, 0xb0b3);
    s.pulse(0.0, 0.52, { freq: (u) => 500 + 600 * u, gain: env.ramp(0.08, 0.18), duty: 0.25 });
    for (let i = 0; i < 5; i++) s.noise(0.05 + i * 0.1, 0.03, { clock: () => 8000, gain: env.decay(0.18, 1), short: true });
    s.thud(0.52, 0.7, 0.8);
    s.noise(0.52, 0.4, { clock: (u) => 6000 - 4500 * u, gain: env.attackDecay(0.4, 0.03) });
    s.pulse(0.52, 0.5, { freq: () => 1480, gain: env.decay(0.12, 2), duty: 0.5 });
    return s;
  },

  /** Generic projectile (impact 0.43 s): stored damage is flung back as a ringing burst of metal. */
  metalburst: () => {
    const s = new MoveSfx(1.0, 0xb0b5);
    s.chord(0.0, 0.43, [55, 62, 67], { rate: 0.03, gain: 0.2, voice: 'pulse' });
    s.noise(0.0, 0.43, { clock: env.ramp(2000, 7000), gain: env.swell(0.15), short: true });
    s.thud(0.43, 0.4, 0.6);
    s.noise(0.43, 0.08, { clock: () => 9000, gain: env.decay(0.4, 1), short: true });
    s.pulse(0.43, 0.5, { freq: () => 1660, gain: env.decay(0.22, 1.5), duty: 0.5 });
    s.pulse(0.43, 0.45, { freq: () => 2350, gain: env.decay(0.08, 2), duty: 0.5 });
    return s;
  },

  /** Generic melee slash (impact 0.17 s): steel claws rake with a bright clink. */
  metalclaw: () => {
    const s = new MoveSfx(0.7, 0xc1a3);
    s.whoosh(0.0, 0.17, { from: 3000, to: 10000, gain: 0.3 });
    s.slash(0.17, 0.5);
    s.noise(0.17, 0.06, { clock: () => 9500, gain: env.decay(0.3, 1), short: true });
    s.pulse(0.17, 0.4, { freq: () => 2090, gain: env.decay(0.14, 2), duty: 0.5 });
    s.pulse(0.25, 0.3, { freq: () => 2790, gain: env.decay(0.08, 2), duty: 0.5 });
    return s;
  },

  /** Generic self aura (≈ 0.8 s) + Sp. Def drop fleck (0.85 s): a grating metallic screech scrapes at the ears. */
  metalsound: () => {
    const s = new MoveSfx(1.5, 0x5c4e);
    s.pulse(0.0, 0.8, { freq: (u) => 2400 * (1 + 0.05 * Math.sin(2 * Math.PI * 30 * u)), gain: env.swell(0.15), duty: 0.125 });
    s.pulse(0.0, 0.8, { freq: (u) => 2540 * (1 - 0.05 * Math.sin(2 * Math.PI * 23 * u)), gain: env.swell(0.12), duty: 0.25 });
    s.noise(0.0, 0.8, { clock: () => 7000, gain: env.swell(0.14), short: true });
    s.statDown(0.85);
    return s;
  },

  /**
   * SteelMoveAnimations.playMeteorMash: black (0-0.25 s), six shooting stars
   * streak past (0.25-1.0 s, every 0.075 s), the fist lands (1.15 s) and
   * stars burst out; the scene clears (~1.7-2.0 s).
   */
  meteormash: () => {
    const s = new MoveSfx(2.1, 0x3e7e);
    for (let i = 0; i < 6; i++) {
      const at = 0.25 + i * 0.075;
      s.pulse(at, 0.3, { freq: (u) => (2400 + i * 150) * (1 - 0.5 * u), gain: env.decay(0.1, 1.5), duty: 0.125 });
    }
    s.whoosh(0.3, 0.6, { from: 6000, to: 2000, gain: 0.18 });
    s.whoosh(1.0, 0.15, { from: 3000, to: 11000, gain: 0.3 });
    s.thud(1.15, 0.7, 0.8);
    s.noise(1.15, 0.25, { clock: () => 9000, gain: env.decay(0.3, 2), short: true });
    s.pulse(1.15, 0.45, { freq: () => 1568, gain: env.decay(0.16, 2), duty: 0.25 });
    s.pulse(1.15, 0.45, { freq: () => 2217, gain: env.decay(0.1, 2.5), duty: 0.5 });
    s.sparkle(1.2, 0.45, 8, { lo: 2800, hi: 5600, gain: 0.12 });
    return s;
  },

  /** Generic lob (arcs 0.52 s) + stat-down fleck: a glinting shard flies over, shatters with a mirror flash, then accuracy falls. */
  mirrorshot: () => {
    const s = new MoveSfx(1.35, 0x3a50);
    s.wave(0.0, 0.52, { freq: (u) => 1200 + 500 * Math.sin(Math.PI * u), gain: env.ramp(0.1, 0.22) });
    s.sparkle(0.05, 0.45, 5, { lo: 4000, hi: 7000, gain: 0.1 });
    s.noise(0.52, 0.2, { clock: () => 12000, gain: env.attackDecay(0.35, 0.03), short: true });
    s.pulse(0.52, 0.3, { freq: () => 2637, gain: env.decay(0.18, 2), duty: 0.25 });
    s.thud(0.52, 0.35, 0.3);
    s.statDown(0.68, 0.22);
    return s;
  },

  /** Generic self aura (~0.8 s) + stat rise fleck (~0.85 s): interlocking gears grind round - metallic ratchet clicks speeding up. */
  shiftgear: () => {
    const s = new MoveSfx(1.45, 0x5f6e);
    let t = 0.03;
    for (let i = 0; i < 9; i++) {
      s.noise(t, 0.035, { clock: () => 9000, gain: env.decay(0.3, 1), short: true });
      s.pulse(t, 0.04, { freq: () => (i % 2 ? 1568 : 1175), gain: env.decay(0.14, 1.5), duty: 0.125 });
      t += 0.11 - i * 0.007;
    }
    s.pulse(0.03, 0.75, { freq: env.ramp(120, 200), gain: env.swell(0.1), duty: 0.25 });
    s.statUp(0.85);
    return s;
  },

  /** Custom: steel feathers shimmer into being (0-0.4 s), whoosh off and strike three times (0.64 / 0.73 / 0.82 s). */
  steelwing: () => {
    const s = new MoveSfx(1.2, 0x57e1);
    s.sparkle(0.0, 0.4, 4, { lo: 3500, hi: 6000, gain: 0.12 });
    s.pulse(0.05, 0.35, { freq: env.ramp(1200, 2000), gain: env.swell(0.08), duty: 0.125 });
    s.whoosh(0.4, 0.24, { from: 2500, to: 9000, gain: 0.3 });
    s.slash(0.64, 0.45);
    for (const [i, at] of [0.64, 0.73, 0.82].entries()) {
      s.noise(at, 0.05, { clock: () => 12000, gain: env.decay(0.28, 1), short: true });
      s.pulse(at, 0.35, { freq: () => [1568, 1760, 2093][i], gain: env.decay(0.14, 1.5), duty: 0.125 });
    }
    s.pulse(0.82, 0.4, { freq: () => 2349, gain: env.decay(0.1, 1.3), duty: 0.25 });
    return s;
  },

  /**
   * Custom (1.6 s): magenta sparks crackle while the orb forms (0-0.4 s), the
   * honeycomb shield clangs open at 0.35 s with a royal chord, shimmers
   * (to 1.3 s) and fades.
   */
  kingsshield: () => {
    const s = new MoveSfx(1.75, 0x4153);
    for (let i = 0; i < 6; i++) s.noise(i * 0.05, 0.04, { clock: () => 9000, gain: env.decay(0.22, 1), short: true });
    s.pulse(0.0, 0.35, { freq: (u) => 500 + 700 * u, gain: env.swell(0.14), duty: 0.25 });
    s.noise(0.35, 0.05, { clock: () => 9000, gain: env.decay(0.35, 1), short: true });
    s.chord(0.35, 0.95, [76, 83, 88], { rate: 0.03, gain: 0.2, voice: 'pulse' });
    s.wave(0.38, 1.0, { freq: () => 1568, gain: env.decay(0.22, 2) });
    s.sparkle(0.6, 0.7, 5, { lo: 3500, hi: 6000, gain: 0.1 });
    return s;
  },
};
