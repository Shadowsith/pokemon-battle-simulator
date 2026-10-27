import { MoveSfx } from '../move-sfx.mjs';
import { env } from '../track.mjs';

/** Ground-type move sounds: whirring bones, heavy stomps, rumbling earth. */
export const GROUND = {
  /**
   * GroundMoveAnimations.playBoneClub: a spinning bone arcs up and drops onto
   * the target (0.76 s), bounces off and fades (~1.2 s).
   */
  boneclub: () => {
    const s = new MoveSfx(1.3, 0xb0c1);
    s.pulse(0.0, 0.76, { freq: env.ramp(500, 380), gain: (u) => 0.16 * (0.4 + 0.6 * Math.abs(Math.sin(2 * Math.PI * 6 * u))), duty: 0.25 });
    s.whoosh(0.0, 0.76, { from: 1500, to: 4000, gain: 0.15 });
    s.wave(0.76, 0.15, { freq: env.ramp(620, 420), gain: env.decay(0.4, 1.5) });
    s.thud(0.76, 0.55, 0.4);
    s.whoosh(0.85, 0.35, { from: 4000, to: 1500, gain: 0.15 });
    return s;
  },

  /**
   * GroundMoveAnimations.playBonemerang: the bone spins out (0.56 s, hits),
   * curves back (0.62 s) and is caught (1.18 s).
   */
  bonemerang: () => {
    const s = new MoveSfx(1.45, 0xb0e2);
    const spin = (u) => 0.4 + 0.6 * Math.abs(Math.sin(2 * Math.PI * 7 * u));
    s.pulse(0.0, 0.56, { freq: env.ramp(420, 560), gain: (u) => 0.16 * spin(u), duty: 0.25 });
    s.wave(0.56, 0.15, { freq: env.ramp(620, 420), gain: env.decay(0.4, 1.5) });
    s.thud(0.56, 0.55, 0.4);
    s.pulse(0.6, 0.58, { freq: env.ramp(560, 400), gain: (u) => 0.13 * spin(u), duty: 0.25 });
    s.noise(1.18, 0.04, { clock: () => 5000, gain: env.decay(0.25, 1) });
    s.pulse(1.18, 0.12, { freq: () => 1046.5, gain: env.decay(0.15, 1.5), duty: 0.5 });
    return s;
  },

  /** Generic projectile, 3 hits (impacts at 0.43 / 1.0 / 1.57 s): a bone strikes again and again. */
  bonerush: () => {
    const s = new MoveSfx(2.0, 0xb02a);
    for (let hit = 0; hit < 3; hit++) {
      const at = hit * 0.57;
      s.pulse(at, 0.43, { freq: env.ramp(450, 550), gain: (u) => 0.14 * (0.4 + 0.6 * Math.abs(Math.sin(2 * Math.PI * 4 * u))), duty: 0.25 });
      s.wave(at + 0.43, 0.12, { freq: env.ramp(620, 420), gain: env.decay(0.35, 1.5) });
      s.thud(at + 0.43, 0.5, 0.35);
    }
    return s;
  },

  /** Generic field move + Speed drop fleck: a stomp that shakes the whole field. */
  bulldoze: () => {
    const s = new MoveSfx(1.25, 0xb01d);
    s.thud(0.02, 0.8, 1);
    s.rumble(0.02, 0.95, { from: 450, to: 120, gain: 0.5 });
    for (let i = 0; i < 5; i++) {
      s.noise(0.15 + i * 0.09 + s.random() * 0.03, 0.04, { clock: () => 1200 + s.random() * 1500, gain: env.decay(0.2, 1) });
    }
    s.statDown(0.55, 0.22);
    return s;
  },

  /**
   * Two-turn move (plays on both turns): digs down with gritty scrapes;
   * GroundMoveAnimations.playDigUp bursts out under the target (0.52 s) in a cloud of dust.
   */
  dig: () => {
    const s = new MoveSfx(1.15, 0xd190);
    for (let i = 0; i < 4; i++) s.noise(0.02 + i * 0.1, 0.08, { clock: () => 700 + s.random() * 500, gain: env.attackDecay(0.35, 0.2) });
    s.rumble(0.3, 0.3, { from: 200, to: 400, gain: 0.3 });
    s.thud(0.52, 0.7, 0.9);
    s.noise(0.52, 0.45, { clock: env.ramp(2500, 800), gain: env.decay(0.25, 1.5) });
    return s;
  },

  /** Generic melee: a spinning drill that grinds into the target. */
  drillrun: () => {
    const s = new MoveSfx(0.85, 0xd21a);
    s.pulse(0.0, 0.45, { freq: (u) => 600 + 300 * u, gain: (u) => 0.18 * (0.6 + 0.4 * Math.sin(2 * Math.PI * 25 * u)), duty: 0.125 });
    s.thud(0.17, 0.6, 0.6);
    s.noise(0.17, 0.3, { clock: () => 5000, gain: env.decay(0.3, 1), short: true });
    return s;
  },

  /** Generic projectile + stat-down fleck: the earth cracks open under the target (impact 0.43 s) and erupts. */
  earthpower: () => {
    const s = new MoveSfx(1.3, 0xea27);
    s.rumble(0.0, 0.45, { from: 300, to: 500, gain: 0.3 });
    s.pulse(0.0, 0.43, { freq: env.ramp(55, 80), gain: env.ramp(0.05, 0.25), duty: 0.5 });
    s.thud(0.43, 0.6, 0.9);
    s.noise(0.43, 0.45, { clock: (u) => 3000 - 2400 * u, gain: env.attackDecay(0.45, 0.05) });
    s.statDown(0.6, 0.22);
    return s;
  },

  /**
   * GroundMoveAnimations.playEarthquake: the field shakes for 1.5 s (strongest
   * mid-way), rocks pop out of the ground and the target flashes four times
   * (0.2 / 0.52 / 0.84 / 1.16 s). A heavy rolling rumble with stomps.
   */
  earthquake: () => {
    const s = new MoveSfx(1.8, 0xea2c);
    s.noise(0.0, 1.55, { clock: (u) => 380 - 180 * u, gain: (u) => 0.45 * Math.min(1, u * 6) * Math.pow(1 - u, 0.8) * (0.75 + 0.25 * Math.sin(2 * Math.PI * 10 * u)) });
    s.pulse(0.0, 1.5, { freq: (u) => 48 + 6 * Math.sin(2 * Math.PI * 8 * u), gain: env.swell(0.3), duty: 0.5 });
    [0.2, 0.52, 0.84, 1.16].forEach((at, i) => s.thud(at, 0.5 - i * 0.04, 1));
    for (let i = 0; i < 8; i++) s.noise(0.1 + i * 0.12 + s.random() * 0.05, 0.04, { clock: () => 1500 + s.random() * 2000, gain: env.decay(0.18, 1) });
    return s;
  },

  /** Generic projectile (impact 0.43 s), OHKO: the ground splits open and swallows the foe. */
  fissure: () => {
    const s = new MoveSfx(1.6, 0xf155);
    s.rumble(0.0, 0.5, { from: 300, to: 600, gain: 0.35 });
    s.noise(0.43, 0.08, { clock: () => 9000, gain: env.decay(0.5, 1) });
    s.thud(0.43, 0.8, 1);
    s.rumble(0.45, 1.05, { from: 700, to: 120, gain: 0.55 });
    for (const at of [0.6, 0.78, 0.95]) s.thud(at, 0.35, 0.9);
    return s;
  },

  /** Generic field (field shake + waves ~0.6 s), bp 90: the land itself heaves - a deep quake rumble with two heavy jolts and scattering clods. */
  landswrath: () => {
    const s = new MoveSfx(1.3, 0x1a9d);
    s.thud(0.02, 0.75, 1);
    s.noise(0.0, 1.05, { clock: (u) => 420 - 220 * u, gain: (u) => 0.45 * Math.min(1, u * 8) * Math.pow(1 - u, 1.0) * (0.8 + 0.2 * Math.sin(2 * Math.PI * 9 * u)) });
    s.pulse(0.0, 0.95, { freq: (u) => 55 + 8 * Math.sin(2 * Math.PI * 7 * u), gain: env.decay(0.32, 1.2), duty: 0.5 });
    s.thud(0.3, 0.55, 1);
    for (let i = 0; i < 6; i++) s.noise(0.12 + i * 0.1 + s.random() * 0.04, 0.04, { clock: () => 1400 + s.random() * 1800, gain: env.decay(0.2, 1) });
    return s;
  },

  /** Generic field (shake + waves ≈ 0.6 s): an earthquake of random strength - deep rolling rumble with heavy jolts. */
  magnitude: () => {
    const s = new MoveSfx(1.1, 0x6a91);
    s.rumble(0.0, 1.0, { from: 450, to: 120, gain: 0.5 });
    s.pulse(0.0, 0.9, { freq: (u) => 70 * (1 + 0.1 * Math.sin(2 * Math.PI * 14 * u)), gain: env.swell(0.25), duty: 0.5 });
    for (const at of [0.05, 0.3, 0.55]) s.thud(at, 0.4, 1);
    return s;
  },

  /** Generic lob (arcs 0.52 s) + stat-down fleck: a gloopy mud ball arcs over and splatters wetly. */
  mudbomb: () => {
    const s = new MoveSfx(1.35, 0x3db0);
    s.pulse(0.0, 0.52, { freq: (u) => 250 + 150 * Math.sin(Math.PI * u), gain: env.ramp(0.08, 0.18), duty: 0.25 });
    s.whoosh(0.0, 0.52, { from: 800, to: 2500, gain: 0.12 });
    s.thud(0.52, 0.6, 0.7);
    s.noise(0.52, 0.3, { clock: (u) => 3500 - 2500 * u, gain: env.attackDecay(0.45, 0.04) });
    s.bubbles(0.55, 0.25, 4, { lo: 150, hi: 350, gain: 0.15 });
    s.statDown(0.68, 0.22);
    return s;
  },

  /** Generic lob (arcs 0.52 s) + Speed-drop fleck: a spray of mud flung over, a sloppy splat. */
  mudshot: () => {
    const s = new MoveSfx(1.35, 0x3d50);
    s.noise(0.0, 0.52, { clock: (u) => 1500 + 1000 * u, gain: env.ramp(0.1, 0.25) });
    s.pulse(0.0, 0.52, { freq: (u) => 200 + 80 * Math.sin(2 * Math.PI * 4 * u), gain: env.ramp(0.06, 0.14), duty: 0.25 });
    s.thud(0.52, 0.5, 0.6);
    s.noise(0.52, 0.25, { clock: (u) => 3000 - 2000 * u, gain: env.attackDecay(0.4, 0.04) });
    s.bubbles(0.55, 0.2, 3, { lo: 150, hi: 300, gain: 0.14 });
    s.statDown(0.68, 0.22);
    return s;
  },

  /** Generic projectile (0.43 s) + stat-down fleck: a quick fling of mud slaps the face. */
  mudslap: () => {
    const s = new MoveSfx(1.25, 0x3d51);
    s.whoosh(0.0, 0.43, { from: 1000, to: 3000, gain: 0.18 });
    s.noise(0.43, 0.14, { clock: (u) => 5000 - 3500 * u, gain: env.attackDecay(0.5, 0.03) });
    s.thud(0.43, 0.4, 0.4);
    s.bubbles(0.45, 0.15, 3, { lo: 180, hi: 320, gain: 0.12 });
    s.statDown(0.58, 0.22);
    return s;
  },

  /** Generic target aura (~0.8 s), no fleck: mud is flung about in wet, heavy splats. */
  mudsport: () => {
    const s = new MoveSfx(1.15, 0x3d5b);
    for (const [at, g] of [[0.02, 0.4], [0.24, 0.34], [0.46, 0.38], [0.66, 0.3]]) {
      s.noise(at, 0.16, { clock: (u) => 2200 - 1600 * u, gain: env.attackDecay(g, 0.05) });
      s.pulse(at, 0.12, { freq: (u) => 180 * Math.pow(0.5, u), gain: env.decay(g * 0.6, 1.5), duty: 0.5 });
    }
    s.bubbles(0.1, 0.8, 7, { lo: 140, hi: 320, gain: 0.2 });
    return s;
  },

  /** Generic field (≈0.6 s) at high power: the ground splits and jagged blades of rock erupt. */
  precipiceblades: () => {
    const s = new MoveSfx(1.25, 0x9bec);
    s.rumble(0.0, 1.05, { from: 600, to: 180, gain: 0.45 });
    s.thud(0.05, 0.55, 1);
    for (const at of [0.2, 0.35, 0.5]) {
      s.noise(at, 0.12, { clock: (u) => 9000 - 6000 * u, gain: env.attackDecay(0.35, 0.05) });
      s.thud(at, 0.35, 0.7);
    }
    return s;
  },

  /** Generic target aura (~0.8 s): the soil is tilled – churning, chunky dirt turned over in rhythm. */
  rototiller: () => {
    const s = new MoveSfx(1.1, 0x2071);
    s.rumble(0.0, 0.9, { from: 300, to: 200, gain: 0.3 });
    for (let i = 0; i < 6; i++) {
      s.noise(i * 0.13, 0.1, { clock: () => 1200 + s.random() * 800, gain: env.attackDecay(0.28, 0.1) });
      s.pulse(i * 0.13, 0.08, { freq: (u) => 140 * Math.pow(0.6, u), gain: env.decay(0.2, 1.5), duty: 0.5 });
    }
    return s;
  },

  /** Generic self aura (~0.8 s) + accuracy drop fleck (~0.85 s): sand is kicked up and flung into the eyes. */
  sandattack: () => {
    const s = new MoveSfx(1.4, 0x5a7a);
    s.noise(0.0, 0.25, { clock: env.ramp(1500, 6000), gain: env.attackDecay(0.3, 0.2) });
    s.noise(0.2, 0.55, { clock: (u) => 5000 + 2000 * Math.sin(2 * Math.PI * 3 * u), gain: env.swell(0.2) });
    for (let i = 0; i < 8; i++) s.noise(0.25 + s.random() * 0.5, 0.02, { clock: () => 10000, gain: env.decay(0.15, 1), short: true });
    s.statDown(0.85, 0.24);
    return s;
  },

  /** Generic projectile (impact 0.43 s): a swirling vortex of sand engulfs and traps the target. */
  sandtomb: () => {
    const s = new MoveSfx(1.2, 0x5a70);
    s.whoosh(0.0, 0.43, { from: 1500, to: 4500, gain: 0.25 });
    s.thud(0.43, 0.5, 0.6);
    s.noise(0.43, 0.7, { clock: (u) => 2500 + 1500 * Math.sin(2 * Math.PI * 4 * u), gain: (u) => 0.3 * Math.min(1, u * 6) * Math.pow(1 - u, 0.8) });
    s.rumble(0.45, 0.65, { from: 400, to: 200, gain: 0.25 });
    return s;
  },

  /** Generic target aura (~0.8 s), on the foe side: a handful of spikes is scattered and lands with clinks. */
  spikes: () => {
    const s = new MoveSfx(1.0, 0x5b1c);
    s.whoosh(0.02, 0.25, { from: 2000, to: 6000, gain: 0.2 });
    for (let i = 0; i < 5; i++) {
      const at = 0.28 + i * 0.1;
      s.noise(at, 0.04, { clock: () => 10000, gain: env.decay(0.3, 1), short: true });
      s.pulse(at, 0.08, { freq: () => 1800 + s.random() * 800, gain: env.decay(0.15, 2), duty: 0.125 });
      s.thud(at, 0.2, 0.1);
    }
    return s;
  },

  /** Generic field (≈0.6 s): a hail of earthen arrows rains down - rapid little thuds over a rolling rumble. */
  thousandarrows: () => {
    const s = new MoveSfx(1.0, 0x1a44);
    s.rumble(0.0, 0.85, { from: 500, to: 180, gain: 0.4 });
    for (let i = 0; i < 9; i++) {
      const at = 0.03 + i * 0.065 + s.random() * 0.02;
      s.noise(at, 0.04, { clock: () => 7000, gain: env.decay(0.3, 1) });
      s.pulse(at, 0.07, { freq: (u) => 260 * Math.pow(0.4, u), gain: env.decay(0.3, 2), duty: 0.5 });
    }
    return s;
  },

  /** Generic field (≈0.6 s): the ground surges outward in a great wave - a deep swelling roll that crashes down. */
  thousandwaves: () => {
    const s = new MoveSfx(1.0, 0x1a4e);
    s.noise(0.0, 0.85, { clock: (u) => 300 + 400 * Math.sin(Math.PI * u), gain: (u) => 0.45 * Math.min(1, u * 5) * Math.pow(1 - u, 1.1) });
    s.pulse(0.0, 0.7, { freq: (u) => 70 + 30 * Math.sin(Math.PI * u), gain: env.swell(0.3), duty: 0.5 });
    s.thud(0.35, 0.6, 1);
    s.rumble(0.4, 0.5, { from: 400, to: 120, gain: 0.25 });
    return s;
  },
};
