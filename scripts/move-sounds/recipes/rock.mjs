import { MoveSfx } from '../move-sfx.mjs';
import { env } from '../track.mjs';

/** Rock-type move sounds. */
export const ROCK = {
  /** Generic projectile (0.43 s): an ancient hum lifts rocks that crash into the target. */
  ancientpower: () => {
    const s = new MoveSfx(1.0, 0xa9c1);
    s.wave(0.0, 0.5, { freq: () => 90, gain: env.swell(0.3) });
    s.wave(0.0, 0.5, { freq: () => 135, gain: env.swell(0.18) });
    s.rumble(0.0, 0.45, { from: 300, to: 500, gain: 0.3 });
    s.thud(0.43, 0.7, 0.9);
    for (let i = 0; i < 5; i++) {
      s.noise(0.5 + i * 0.07 + s.random() * 0.03, 0.05, { clock: () => 1500 + s.random() * 1500, gain: env.decay(0.25 - i * 0.03, 1) });
    }
    return s;
  },

  /** Generic field move: a storm of glittering diamonds. */
  diamondstorm: () => {
    const s = new MoveSfx(1.25, 0xd1a5);
    s.noise(0.0, 1.0, { clock: (u) => 3500 + 1500 * Math.sin(2 * Math.PI * 2 * u), gain: env.swell(0.25) });
    s.rumble(0.0, 0.6, { from: 400, to: 150, gain: 0.35 });
    s.sparkle(0.05, 0.9, 18, { lo: 2500, hi: 5500, gain: 0.2 });
    return s;
  },

  /** Generic melee (impact 0.17 s) + heavy recoil (~0.29 s): a stone skull smashes in, cracking rock, and the user reels hard. */
  headsmash: () => {
    const s = new MoveSfx(1.1, 0x45a5);
    s.whoosh(0.0, 0.18, { from: 600, to: 3000, gain: 0.35 });
    s.thud(0.17, 1.0, 1);
    s.noise(0.17, 0.15, { clock: (u) => 5000 - 3500 * u, gain: env.attackDecay(0.5, 0.05) });
    s.rumble(0.19, 0.75, { from: 600, to: 120, gain: 0.4 });
    s.thud(0.29, 0.55, 0.7);
    return s;
  },

  /** Generic projectile (0.43 s impact): a glittering gem beam that strikes with a crystal clang. */
  powergem: () => {
    const s = new MoveSfx(1.0, 0x90e3);
    s.chord(0.02, 0.42, [76, 80, 83, 88], { rate: 0.03, gain: 0.15, voice: 'pulse' });
    s.thud(0.43, 0.5, 0.5);
    s.pulse(0.43, 0.35, { freq: () => 1660, gain: env.decay(0.22, 1.5), duty: 0.25 });
    s.pulse(0.44, 0.35, { freq: () => 2490, gain: env.decay(0.14, 1.5), duty: 0.125 });
    s.sparkle(0.45, 0.35, 6, { gain: 0.14 });
    return s;
  },

  /** Generic lob, 3 hits (impacts 0.52 / 1.26 / 2.0 s): three boulders arc up and crash down in turn. */
  rockblast: () => {
    const s = new MoveSfx(2.35, 0xb1a5);
    for (let hit = 0; hit < 3; hit++) {
      const at = 0.52 + hit * 0.74;
      s.whoosh(at - 0.45, 0.4, { from: 600, to: 2000, gain: 0.18 });
      s.thud(at, 0.75, 0.9);
      s.rumble(at + 0.02, 0.3, { from: 600, to: 200, gain: 0.25 });
      for (let i = 0; i < 3; i++) s.noise(at + 0.04 + i * 0.05, 0.04, { clock: () => 1500 + s.random() * 1500, gain: env.decay(0.2 - i * 0.04, 1) });
    }
    return s;
  },

  /** Generic self aura (~0.8 s) + Speed rise fleck (0.85 s): stone is polished smooth – a grinding scrape that turns glossy. */
  rockpolish: () => {
    const s = new MoveSfx(1.5, 0x9011);
    for (let i = 0; i < 4; i++) s.noise(i * 0.2, 0.18, { clock: (u) => 3000 + 4000 * Math.sin(Math.PI * u), gain: (u) => 0.22 * Math.sin(Math.PI * u) });
    s.sparkle(0.3, 0.5, 6, { lo: 3500, hi: 6000, gain: 0.14 });
    s.statUp(0.85, 0.26);
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

  /** Generic projectile (impact 0.43 s): a rock is hurled and smacks into the target. */
  rockthrow: () => {
    const s = new MoveSfx(0.85, 0x7a20);
    s.whoosh(0.0, 0.43, { from: 700, to: 2500, gain: 0.22 });
    s.thud(0.43, 0.8, 0.9);
    for (let i = 0; i < 3; i++) s.noise(0.48 + i * 0.06, 0.04, { clock: () => 1500 + s.random() * 1500, gain: env.decay(0.22 - i * 0.05, 1) });
    return s;
  },

  /** Generic projectile (impact 0.43 s) + Speed drop fleck (0.55 s): boulders slam down and wall the target in. */
  rocktomb: () => {
    const s = new MoveSfx(1.3, 0x70b5);
    s.whoosh(0.0, 0.43, { from: 600, to: 2000, gain: 0.2 });
    s.thud(0.43, 0.75, 1);
    s.thud(0.51, 0.55, 0.9);
    s.rumble(0.45, 0.4, { from: 500, to: 150, gain: 0.25 });
    s.statDown(0.6, 0.22);
    return s;
  },

  /** Generic lob (impact 0.52 s), bp 150 + recharge: a huge boulder arcs over and smashes apart in a thundering crash. */
  rockwrecker: () => {
    const s = new MoveSfx(1.45, 0x7ec4);
    s.whoosh(0.0, 0.5, { from: 400, to: 1800, gain: 0.25 });
    s.pulse(0.0, 0.5, { freq: env.ramp(70, 110), gain: env.swell(0.18), duty: 0.125 });
    s.thud(0.52, 1.0, 1);
    s.noise(0.52, 0.2, { clock: (u) => 5000 - 3500 * u, gain: env.attackDecay(0.45, 0.05) });
    s.rumble(0.54, 0.85, { from: 600, to: 100, gain: 0.45 });
    for (let i = 0; i < 6; i++) s.noise(0.6 + i * 0.07 + s.random() * 0.03, 0.05, { clock: () => 1200 + s.random() * 2000, gain: env.decay(0.25 - i * 0.03, 1) });
    return s;
  },

  /** Generic melee (impact 0.17 s): the user rolls in like a boulder – a rolling rumble and a blunt crash. */
  rollout: () => {
    const s = new MoveSfx(0.8, 0x7011);
    s.noise(0.0, 0.18, { clock: (u) => 300 + 300 * u, gain: (u) => 0.35 * Math.min(1, u * 4) * (0.7 + 0.3 * Math.sin(2 * Math.PI * 6 * u)) });
    s.pulse(0.0, 0.17, { freq: env.ramp(60, 90), gain: env.swell(0.2), duty: 0.5 });
    s.thud(0.17, 0.85, 0.9);
    s.rumble(0.2, 0.35, { from: 400, to: 120, gain: 0.25 });
    return s;
  },

  /** Generic weather (particles ~1.1 s, glow 0.9 s, clip ~1.45 s): a gritty, howling sandstorm. */
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

  /** Generic target aura (~0.8 s), on the foe side: sharp stones float up and settle with clacks. */
  stealthrock: () => {
    const s = new MoveSfx(1.0, 0x57ea);
    s.rumble(0.02, 0.5, { from: 200, to: 450, gain: 0.25 });
    for (let i = 0; i < 5; i++) {
      const at = 0.2 + i * 0.12;
      s.noise(at, 0.05, { clock: () => 3000 + s.random() * 2000, gain: env.decay(0.35, 1) });
      s.pulse(at, 0.06, { freq: () => 500 + i * 60, gain: env.decay(0.2, 2), duty: 0.5 });
    }
    return s;
  },

  /** Generic projectile (impact 0.43 s, bp 100): sharp stone blades fly in and shatter on the foe. */
  stoneedge: () => {
    const s = new MoveSfx(0.95, 0x570e);
    s.whoosh(0.0, 0.43, { from: 1500, to: 5000, gain: 0.25 });
    s.pulse(0.0, 0.4, { freq: env.ramp(150, 240), gain: env.swell(0.12), duty: 0.25 });
    s.thud(0.43, 0.75, 0.8);
    for (let i = 0; i < 5; i++) s.noise(0.45 + s.random() * 0.25, 0.04, { clock: () => 5000 + s.random() * 4000, gain: env.decay(0.25, 1) });
    s.rumble(0.45, 0.4, { from: 400, to: 150, gain: 0.22 });
    return s;
  },

  /**
   * Support move, no aura: MoveAnimationService.playShield raises a brown
   * bubble around every ally (0-0.62 s). A broad, stony guard: a heavy knock and a low ringing wall.
   */
  wideguard: () => {
    const s = new MoveSfx(0.85, 0x3f61);
    s.whoosh(0.0, 0.12, { from: 1500, to: 5000, gain: 0.22 });
    s.thud(0.08, 0.5, 0.7);
    s.wave(0.1, 0.6, { freq: () => 196, gain: env.decay(0.28, 1.5) });
    s.pulse(0.1, 0.55, { freq: () => 784, gain: env.decay(0.18, 2), duty: 0.25 });
    s.pulse(0.1, 0.55, { freq: () => 1176, gain: env.decay(0.1, 2), duty: 0.25 });
    return s;
  },
};
