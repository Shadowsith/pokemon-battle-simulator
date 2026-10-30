import { MoveSfx } from '../move-sfx.mjs';
import { env } from '../track.mjs';

/** Water-type move sounds: rushing water, splashes, bubbles. */
export const WATER = {
  /** Generic melee, priority (lunge 0.12 s): a jet of water, then a splash. */
  aquajet: () => {
    const s = new MoveSfx(0.75, 0xa9e7);
    s.whoosh(0.0, 0.14, { from: 3000, to: 7000, gain: 0.4 });
    s.bubbles(0.0, 0.12, 4, { gain: 0.15 });
    s.splash(0.12, 0.6);
    s.bubbles(0.2, 0.4, 6, { gain: 0.12 });
    return s;
  },

  /** Generic self aura (heal): a ring of water bubbles up around the caster. */
  aquaring: () => {
    const s = new MoveSfx(1.2, 0xa917);
    s.bubbles(0.02, 0.9, 14, { lo: 400, hi: 1100, gain: 0.2 });
    s.wave(0.05, 0.85, { freq: (u) => 880 * (1 + 0.03 * Math.sin(2 * Math.PI * 9 * u)), gain: env.swell(0.16) });
    s.arpeggio(0.6, [72, 76, 79, 84], 0.07, { gain: 0.18, voice: 'wave', hold: 0.15 });
    return s;
  },

  /** Generic melee: a swirling tail swing and a heavy splash. */
  aquatail: () => {
    const s = new MoveSfx(0.85, 0xa97a);
    s.noise(0.0, 0.2, { clock: (u) => 2000 + 1500 * Math.sin(2 * Math.PI * 3 * u), gain: env.swell(0.35) });
    s.thud(0.17, 0.5, 0.6);
    s.splash(0.17, 0.6);
    s.bubbles(0.3, 0.4, 5, { gain: 0.12 });
    return s;
  },

  /** Generic projectile (0.43 s): a salty jet of water. */
  brine: () => {
    const s = new MoveSfx(0.95, 0xb21e);
    s.whoosh(0.0, 0.45, { from: 2500, to: 6500, gain: 0.35 });
    s.bubbles(0.0, 0.4, 5, { gain: 0.12 });
    s.splash(0.43, 0.6);
    s.noise(0.5, 0.4, { clock: () => 12000, gain: env.decay(0.12, 1.5) });
    return s;
  },

  /**
   * WaterMoveAnimations.playBubbles (BUBBLE_BEAM): 24 bubbles fired every
   * 28 ms reach the target in 0.48 s, then pop one after another (~1.37-2.3 s).
   */
  bubblebeam: () => {
    const s = new MoveSfx(2.4, 0xbbbe);
    for (let i = 0; i < 24; i++) {
      s.pulse(i * 0.028, 0.04, { freq: (u) => (500 + s.random() * 300) * (1 + u), gain: env.decay(0.16, 1), duty: 0.5 });
    }
    s.noise(0.0, 0.75, { clock: () => 4000, gain: env.swell(0.12) });
    for (let i = 0; i < 24; i++) {
      const at = 1.37 + i * 0.035 + s.random() * 0.03;
      s.pulse(at, 0.03, { freq: (u) => (900 + s.random() * 500) * (1 + 2 * u), gain: env.decay(0.22, 1), duty: 0.5 });
    }
    return s;
  },

  /**
   * WaterMoveAnimations.playBubbles (BUBBLE_DRIFT): 14 bubbles every 55 ms
   * drift slowly to the target (1.15 s), then pop (~2.1-2.7 s).
   */
  bubble: () => {
    const s = new MoveSfx(2.85, 0xbb1e);
    for (let i = 0; i < 14; i++) {
      s.pulse(i * 0.055, 0.06, { freq: (u) => (300 + s.random() * 200) * (1 + 0.8 * u), gain: env.decay(0.2, 1), duty: 0.5 });
    }
    s.wave(0.1, 1.9, { freq: (u) => 440 * (1 + 0.04 * Math.sin(2 * Math.PI * 5 * u)), gain: env.swell(0.1) });
    for (let i = 0; i < 14; i++) {
      const at = 2.12 + i * 0.035 + s.random() * 0.05;
      s.pulse(at, 0.035, { freq: (u) => (700 + s.random() * 400) * (1 + 2 * u), gain: env.decay(0.25, 1), duty: 0.5 });
    }
    return s;
  },

  /** Generic melee: a shell snaps shut and squeezes. */
  clamp: () => {
    const s = new MoveSfx(0.8, 0xc1a3);
    s.noise(0.17, 0.05, { clock: () => 10000, gain: env.decay(0.35, 1) });
    s.pulse(0.17, 0.06, { freq: () => 900, gain: env.decay(0.35, 1), duty: 0.25 });
    s.thud(0.17, 0.4, 0.4);
    for (const at of [0.3, 0.45]) s.wave(at, 0.13, { freq: env.ramp(300, 210), gain: env.decay(0.4, 1) });
    return s;
  },

  /**
   * WaterMoveAnimations.playCrabhammer: a big drop falls onto the target
   * (0.26 s) and splashes, droplets fly, then bubbles rise and pop (to ~1.6 s).
   */
  crabhammer: () => {
    const s = new MoveSfx(1.7, 0xc2ab);
    s.pulse(0.0, 0.26, { freq: (u) => 1600 - 1100 * u, gain: env.ramp(0.08, 0.2), duty: 0.125 });
    s.thud(0.26, 0.6, 1);
    s.splash(0.26, 0.5);
    s.bubbles(0.35, 0.5, 7, { lo: 600, hi: 1200, gain: 0.22 });
    for (let i = 0; i < 8; i++) {
      s.pulse(1.1 + i * 0.06 + s.random() * 0.04, 0.03, { freq: (u) => (800 + s.random() * 500) * (1 + 2 * u), gain: env.decay(0.35, 1), duty: 0.5 });
    }
    return s;
  },

  /** Two-turn move (plays on both turns): dives under, then bursts up and hits with a splash. */
  dive: () => {
    const s = new MoveSfx(1.15, 0xd1fe);
    s.splash(0.02, 0.45);
    s.bubbles(0.15, 0.4, 8, { lo: 250, hi: 700, gain: 0.18 });
    s.whoosh(0.5, 0.2, { from: 2000, to: 6000, gain: 0.3 });
    s.thud(0.68, 0.55, 0.6);
    s.splash(0.68, 0.55);
    return s;
  },

  /** Generic beam (grows 0.26 s, holds 0.38 s, fades 0.2 s): a roaring high-pressure water blast. */
  hydrocannon: () => {
    const s = new MoveSfx(1.1, 0x4dca);
    s.noise(0.0, 0.84, { clock: (u) => 4000 + 3000 * Math.min(1, u * 3), gain: (u) => 0.35 * Math.min(1, u * 3) * (u > 0.76 ? (1 - u) / 0.24 : 1) });
    s.pulse(0.0, 0.84, { freq: (u) => 140 + 40 * Math.sin(2 * Math.PI * 12 * u), gain: (u) => 0.18 * Math.min(1, u * 3) * (u > 0.76 ? (1 - u) / 0.24 : 1), duty: 0.5 });
    s.splash(0.26, 0.6);
    s.splash(0.5, 0.4);
    s.bubbles(0.6, 0.45, 7, { gain: 0.13 });
    return s;
  },

  /**
   * WaterMoveAnimations.playHydroPump: dim + sea backdrop (0-0.85 s), a stream of 40 water rings
   * (0.85-2.21 s, arriving from 1.25 s) splashes the target every ~0.12 s, then the sea fades (~2.9 s).
   * Swelling surf, a rushing torrent and repeated splashes.
   */
  hydropump: () => {
    const s = new MoveSfx(3.0, 0x4d9b);
    s.noise(0.05, 0.8, { clock: env.ramp(800, 2500), gain: env.ramp(0.02, 0.18) });
    s.bubbles(0.4, 0.45, 5, { lo: 250, hi: 600, gain: 0.1 });
    s.noise(0.85, 1.4, { clock: (u) => 3500 + 1000 * Math.sin(2 * Math.PI * 8 * u), gain: (u) => 0.28 * Math.min(1, u * 6) * (u > 0.85 ? (1 - u) / 0.15 : 1) });
    for (let at = 1.25; at < 2.2; at += 0.24) s.splash(at, 0.4);
    s.bubbles(2.2, 0.5, 6, { gain: 0.12 });
    s.noise(2.25, 0.65, { clock: env.ramp(2000, 600), gain: env.decay(0.14, 1.5) });
    return s;
  },

  /** Generic field move (~0.6 s) + stat-down fleck: a heavy wave of muddy water crashes over the foes. */
  muddywater: () => {
    const s = new MoveSfx(1.35, 0x3dd7);
    s.noise(0.0, 0.65, { clock: (u) => 2500 + 2500 * Math.sin(Math.PI * u), gain: (u) => 0.4 * Math.min(1, u * 5) * Math.pow(1 - u, 0.8) });
    s.rumble(0.0, 0.6, { from: 400, to: 150, gain: 0.3 });
    s.splash(0.25, 0.35);
    s.bubbles(0.1, 0.45, 6, { lo: 150, hi: 400, gain: 0.14 });
    s.statDown(0.65, 0.22);
    return s;
  },

  /** Generic lob (0.52 s arc) + accuracy drop fleck (~0.65 s): an ink blob is shot up with a "blorp" and splats inky. */
  octazooka: () => {
    const s = new MoveSfx(1.15, 0x0c7a);
    s.pulse(0.0, 0.1, { freq: (u) => 180 * (1 + 2 * u), gain: env.decay(0.35, 1), duty: 0.5 });
    s.noise(0.02, 0.48, { clock: env.ramp(1500, 3000), gain: env.swell(0.12) });
    s.splash(0.52, 0.55);
    s.pulse(0.52, 0.2, { freq: (u) => 120 * Math.pow(0.5, u), gain: env.decay(0.3, 1.5), duty: 0.5 });
    s.statDown(0.68);
    return s;
  },

  /** Generic pulse (3 rings 0.13 s apart, impact ~0.56 s), bp 110: three mighty tidal pulses surge out and crash in a huge wave. */
  originpulse: () => {
    const s = new MoveSfx(1.4, 0x0219);
    for (let i = 0; i < 3; i++) {
      const at = i * 0.13;
      s.pulse(at, 0.3, { freq: (u) => 200 * Math.pow(0.6, u), gain: env.decay(0.3, 1.5), duty: 0.5 });
      s.wave(at, 0.25, { freq: env.ramp(500, 900), gain: env.decay(0.16, 1) });
    }
    s.noise(0.0, 0.56, { clock: env.ramp(1500, 5000), gain: env.swell(0.18) });
    s.thud(0.56, 0.6, 0.9);
    s.noise(0.56, 0.75, { clock: (u) => 7000 - 5000 * u, gain: (u) => 0.45 * Math.min(1, u * 12) * Math.pow(1 - u, 1.2) });
    s.bubbles(0.65, 0.55, 8, { lo: 300, hi: 800, gain: 0.16 });
    return s;
  },

  /** Generic weather (particles ~1.1 s, glow 0.9 s, clip ~1.45 s): a downpour hiss with patters of drops. */
  raindance: () => {
    const s = new MoveSfx(1.45, 0x7a1d);
    s.noise(0.0, 1.35, { clock: (u) => 6000 + 1500 * Math.sin(2 * Math.PI * 2 * u), gain: env.swell(0.2) });
    s.noise(0.0, 1.3, { clock: () => 1200, gain: env.swell(0.08) });
    for (let i = 0; i < 18; i++) {
      const at = 0.1 + s.random() * 1.05;
      s.pulse(at, 0.03, { freq: (u) => (900 + s.random() * 900) * (1 + 0.8 * u), gain: env.decay(0.14, 1), duty: 0.5 });
    }
    return s;
  },

  /** Generic melee (impact 0.17 s) + defense-drop fleck (~0.6 s): a shell blade slashes wetly. */
  razorshell: () => {
    const s = new MoveSfx(1.05, 0x7a5e);
    s.whoosh(0.0, 0.18, { from: 2500, to: 9000, gain: 0.3 });
    s.slash(0.17, 0.6);
    s.splash(0.2, 0.3);
    s.statDown(0.6, 0.22);
    return s;
  },

  /** Generic projectile (impact 0.43 s) + burn fleck (0.55 s): boiling water – a hissing, bubbling jet that splashes and sizzles. */
  scald: () => {
    const s = new MoveSfx(1.1, 0x5ca1);
    s.noise(0.0, 0.43, { clock: env.ramp(4000, 8000), gain: env.swell(0.22) });
    s.bubbles(0.0, 0.4, 8, { lo: 300, hi: 800, gain: 0.15 });
    s.splash(0.43, 0.55);
    s.noise(0.5, 0.45, { clock: () => 11000, gain: env.decay(0.18, 1) });
    s.burn(0.55, 0.22);
    return s;
  },

  /** Generic target aura (~0.8 s): a torrent of water drenches the target. */
  soak: () => {
    const s = new MoveSfx(1.0, 0x50a4);
    s.noise(0.02, 0.6, { clock: (u) => 5000 + 1500 * Math.sin(2 * Math.PI * 6 * u), gain: env.swell(0.25) });
    s.bubbles(0.05, 0.6, 10, { lo: 400, hi: 1000, gain: 0.18 });
    s.splash(0.6, 0.4);
    return s;
  },

  /** Generic projectile (impact 0.43 s) + burn fleck (0.55 s): scalding steam erupts in a blast. */
  steameruption: () => {
    const s = new MoveSfx(1.0, 0x57e1);
    s.noise(0.0, 0.45, { clock: env.ramp(3000, 9000), gain: env.ramp(0.12, 0.3) });
    s.rumble(0.0, 0.45, { from: 200, to: 400, gain: 0.2 });
    s.noise(0.43, 0.3, { clock: env.ramp(8000, 2000), gain: env.attackDecay(0.4, 0.05) });
    s.thud(0.43, 0.55, 0.8);
    s.burn(0.55, 0.25);
    return s;
  },

  /**
   * WaterMoveAnimations.playSurf: the curling wave rises (0-0.45 s) with spray, the field
   * floods and the wave swells and rolls to the target (0.57-1.3 s), crashes at 1.3 s
   * (splashes and spray to ~2.2 s), the water drains by 2.55 s. A rising swell, a roaring
   * surge and a crash.
   */
  surf: () => {
    const s = new MoveSfx(2.6, 0x5af7);
    s.noise(0.0, 0.57, { clock: env.ramp(800, 2200), gain: env.swell(0.2) });
    s.noise(0.57, 0.75, { clock: (u) => 1500 + 4500 * u, gain: (u) => 0.42 * Math.min(1, u * 3) });
    s.rumble(0.57, 0.75, { from: 220, to: 450, gain: 0.25 });
    s.splash(1.3, 0.5);
    s.noise(1.3, 0.8, { clock: env.ramp(6000, 1200), gain: env.attackDecay(0.35, 0.05) });
    s.bubbles(1.4, 0.8, 8, { gain: 0.14 });
    s.noise(2.15, 0.4, { clock: () => 900, gain: env.decay(0.12, 1) });
    return s;
  },


  /**
   * WaterMoveAnimations.playWaterfall: the field goes black (0-0.25 s), a wall of water rushes up
   * (0.25-0.67 s) and keeps flowing; at 1.02 s a column of splashes strikes the target with field
   * shake (to ~1.9 s), then the dark fades (~2.2 s). Rising torrent roar, then a heavy crash.
   */
  waterfall: () => {
    const s = new MoveSfx(2.3, 0x3a7f);
    s.noise(0.25, 1.75, { clock: (u) => (u < 0.25 ? 1500 + 6000 * u : 3000 - 1500 * u), gain: (u) => 0.3 * Math.min(1, u * 4) * Math.pow(1 - u, 1.1) });
    s.bubbles(0.3, 0.65, 6, { lo: 400, hi: 900, gain: 0.12 });
    s.thud(1.02, 0.6, 1);
    s.splash(1.02, 0.55);
    s.splash(1.13, 0.45);
    s.splash(1.24, 0.35);
    s.rumble(1.02, 0.6, { from: 500, to: 150, gain: 0.3 });
    s.bubbles(1.1, 0.5, 8, { lo: 400, hi: 1000, gain: 0.15 });
    return s;
  },

  /** Generic projectile (impact 0.43 s): a thin squirt of water and a small splash. */
  watergun: () => {
    const s = new MoveSfx(0.85, 0x3a61);
    s.noise(0.0, 0.43, { clock: (u) => 4000 + 2500 * u, gain: (u) => 0.28 * Math.min(1, u * 6) });
    s.bubbles(0.02, 0.38, 5, { lo: 400, hi: 900, gain: 0.12 });
    s.splash(0.43, 0.55);
    return s;
  },

  /** Generic projectile (impact 0.43 s): a column of water rushes up from below and crashes onto the target. */
  waterpledge: () => {
    const s = new MoveSfx(1.05, 0x3a62);
    s.noise(0.0, 0.43, { clock: env.ramp(1500, 6000), gain: env.ramp(0.12, 0.38) });
    s.pulse(0.0, 0.43, { freq: env.ramp(110, 260), gain: env.ramp(0.06, 0.18), duty: 0.5 });
    s.splash(0.43, 0.65);
    s.thud(0.43, 0.35, 0.6);
    s.bubbles(0.5, 0.4, 7, { gain: 0.12 });
    return s;
  },

  /** Generic pulse (rings every 0.13 s, impact 0.56 s) + confusion fleck (~0.7 s): watery rings throb out, then dizzy tweets. */
  waterpulse: () => {
    const s = new MoveSfx(1.35, 0x3a63);
    for (let i = 0; i < 4; i++) {
      s.wave(i * 0.13, 0.14, { freq: (u) => (330 + i * 40) * (1 + 0.5 * u), gain: env.decay(0.3, 1.2) });
      s.bubbles(i * 0.13, 0.08, 2, { lo: 500, hi: 900, gain: 0.1 });
    }
    s.splash(0.56, 0.5);
    s.confusion(0.72);
    return s;
  },

  /** Generic projectile at priority, 3 hits (impacts 0.26 / 0.83 / 1.40 s): spinning water stars whiz in and splash. */
  watershuriken: () => {
    const s = new MoveSfx(1.75, 0x3a64);
    for (const at of [0.26, 0.83, 1.4]) {
      s.noise(at - 0.24, 0.24, { clock: (u) => 5000 + 3000 * Math.sin(2 * Math.PI * 4 * u), gain: env.ramp(0.08, 0.3) });
      s.pulse(at - 0.24, 0.24, { freq: (u) => 1400 + 500 * Math.sin(2 * Math.PI * 4 * u), gain: env.ramp(0.03, 0.1), duty: 0.125 });
      s.slash(at, 0.35);
      s.splash(at, 0.4);
    }
    return s;
  },

  /** Generic target aura (~0.8 s, field): the user soaks the field, a gentle sprinkle of drops. */
  watersport: () => {
    const s = new MoveSfx(1.15, 0x3a65);
    s.noise(0.02, 0.85, { clock: () => 7000, gain: env.swell(0.18) });
    s.bubbles(0.02, 0.85, 16, { lo: 600, hi: 1400, gain: 0.16 });
    s.wave(0.1, 0.7, { freq: (u) => 523 * (1 + 0.03 * Math.sin(2 * Math.PI * 6 * u)), gain: env.swell(0.12) });
    return s;
  },

  /** Generic field move at full power (~0.6 s + heavy shake): a huge spout erupts and rains down on the foes. */
  waterspout: () => {
    const s = new MoveSfx(1.3, 0x3a66);
    s.noise(0.0, 0.35, { clock: env.ramp(1200, 8000), gain: env.attackDecay(0.55, 0.15) });
    s.pulse(0.0, 0.4, { freq: (u) => 70 + 120 * u, gain: env.decay(0.35, 1), duty: 0.5 });
    s.rumble(0.0, 0.7, { from: 600, to: 250, gain: 0.3 });
    s.splash(0.4, 0.55);
    s.noise(0.45, 0.75, { clock: () => 6000, gain: env.decay(0.2, 1.2) });
    s.bubbles(0.45, 0.6, 9, { gain: 0.12 });
    return s;
  },

  /** Generic projectile (impact 0.43 s): a spinning vortex of water swirls in and engulfs the target. */
  whirlpool: () => {
    const s = new MoveSfx(1.2, 0x3a67);
    s.noise(0.0, 1.0, { clock: (u) => 2500 + 1500 * Math.sin(2 * Math.PI * 5 * u), gain: (u) => 0.3 * Math.min(1, u * 4) * Math.pow(1 - u, 0.8) });
    s.wave(0.0, 1.0, { freq: (u) => 300 + 120 * Math.sin(2 * Math.PI * 5 * u), gain: (u) => 0.18 * Math.sin(Math.PI * u) });
    s.splash(0.43, 0.5);
    s.bubbles(0.5, 0.5, 7, { gain: 0.12 });
    return s;
  },

  /** Generic self aura + stat-up fleck (0.85 s): the user pulls into its shell with a hollow knock. */
  withdraw: () => {
    const s = new MoveSfx(1.5, 0x3a68);
    s.whoosh(0.02, 0.2, { from: 4000, to: 1500, gain: 0.22 });
    s.thud(0.22, 0.4, 0.3);
    s.wave(0.24, 0.35, { freq: () => 392, gain: env.decay(0.25, 1.5) });
    s.bubbles(0.35, 0.4, 4, { gain: 0.1 });
    s.statUp(0.85);
    return s;
  },
};
