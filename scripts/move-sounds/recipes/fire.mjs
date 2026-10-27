import { MoveSfx } from '../move-sfx.mjs';
import { env } from '../track.mjs';

/** Fire-type move sounds. */
export const FIRE = {
  /**
   * FireMoveAnimations.playFlamethrower: heat glow fades in (0-0.3 s), a fire
   * stream pours into the target (0.3-1.7 s, target shakes every 0.26 s from
   * 0.6 s), the target burns with five flickering flames (1.7-2.9 s), glow
   * fades (to ~3.25 s). Warm, low roar rather than a bright hiss.
   */
  flamethrower: () => {
    const t = new MoveSfx(3.2, 0xf1a3);

    // Ignition: a rising "whoomph" as the heat builds.
    t.noise(0.02, 0.36, { clock: env.ramp(400, 3200), gain: env.swell(0.5) });
    t.pulse(0.02, 0.3, { freq: env.ramp(70, 190), gain: env.swell(0.25), duty: 0.5 });

    // The stream: low roaring body plus a brighter, fluttering flame layer.
    const roar = (u) => Math.min(1, u * 12) * Math.min(1, (1 - u) * 6);
    t.noise(0.3, 1.42, { clock: () => 520, gain: (u) => 0.45 * roar(u) });
    t.noise(0.3, 1.42, {
      clock: (u) => 1800 + 900 * Math.sin(2 * Math.PI * 3 * u),
      gain: (u) => 0.3 * roar(u) * (0.7 + 0.3 * Math.sin(2 * Math.PI * 17 * u)),
    });

    // Impacts on the target while the stream hits.
    for (let at = 0.6; at < 1.69; at += 0.26) {
      t.pulse(at, 0.09, { freq: (u) => 140 - 70 * u, gain: env.decay(0.3, 2), duty: 0.5 });
    }

    // Burning: five flames flicker up one after another, crackling.
    for (let i = 0; i < 5; i++) {
      const at = 1.69 + i * 0.11;
      t.noise(at, 0.75, {
        clock: () => 900 + t.random() * 500,
        gain: (u) => 0.22 * Math.sin(Math.PI * u) * (0.6 + 0.4 * Math.sin(2 * Math.PI * 11 * u + i)),
      });
    }
    for (let i = 0; i < 14; i++) {
      const at = 0.45 + t.random() * 2.3;
      t.noise(at, 0.025, { clock: () => 9000 + t.random() * 6000, gain: env.decay(0.35, 1) });
    }

    return t;
  },

  /** Generic projectile at full power (0.43 s): a roaring blast and a huge explosion. */
  blastburn: () => {
    const s = new MoveSfx(1.7, 0xb1a5);
    s.whoosh(0.0, 0.46, { from: 600, to: 4000, gain: 0.45 });
    s.noise(0.0, 0.45, { clock: () => 500, gain: env.ramp(0.1, 0.4) });
    s.thud(0.43, 0.9, 1);
    s.noise(0.43, 0.35, { clock: (u) => 12000 - 9000 * u, gain: env.attackDecay(0.7, 0.02) });
    s.rumble(0.45, 1.2, { from: 700, to: 150, gain: 0.5 });
    s.sparkle(0.6, 0.8, 8, { lo: 6000, hi: 9000, gain: 0.15 });
    return s;
  },

  /** Generic melee kick + burn fleck: a flaming kick. */
  blazekick: () => {
    const s = new MoveSfx(1.0, 0xb1a2);
    s.noise(0.0, 0.18, { clock: env.ramp(400, 1500), gain: env.ramp(0.15, 0.4) });
    s.whoosh(0.0, 0.18, { from: 1500, to: 5000, gain: 0.25 });
    s.thud(0.17, 0.65, 0.6);
    s.noise(0.18, 0.3, { clock: env.ramp(1500, 500), gain: env.decay(0.35, 1.5) });
    s.burn(0.55);
    return s;
  },

  /** Generic projectile (0.43 s) + burn fleck: an intense, bright blue flame. */
  blueflare: () => {
    const s = new MoveSfx(1.45, 0xb1f1);
    s.whoosh(0.0, 0.46, { from: 2000, to: 9000, gain: 0.35 });
    s.chord(0.0, 0.45, [72, 79, 84], { rate: 0.025, gain: 0.18, voice: 'pulse' });
    s.thud(0.43, 0.8, 0.9);
    s.noise(0.43, 0.6, { clock: env.ramp(6000, 900), gain: env.attackDecay(0.5, 0.03) });
    s.burn(1.0);
    return s;
  },

  /**
   * FireMoveAnimations.playGroundFlame: a small flame flares up at the
   * target's feet (0-0.9 s), the target flashes at 0.2 s; burn fleck after.
   * A soft, warm puff of fire.
   */
  ember: () => {
    const s = new MoveSfx(1.4, 0xe3be);
    s.noise(0.0, 0.25, { clock: env.ramp(600, 2500), gain: env.ramp(0.05, 0.35) });
    s.noise(0.2, 0.7, { clock: (u) => 1400 - 600 * u, gain: (u) => 0.4 * Math.pow(1 - u, 1.5) * (0.75 + 0.25 * Math.sin(2 * Math.PI * 8 * u)) });
    s.sparkle(0.2, 0.5, 4, { lo: 5000, hi: 8000, gain: 0.12 });
    s.burn(0.95, 0.25);
    return s;
  },

  /** Generic field move (bp 150): the ground bursts with a huge volcanic roar. */
  eruption: () => {
    const s = new MoveSfx(1.45, 0xe7a1);
    s.thud(0.02, 0.8, 1);
    s.noise(0.02, 1.2, { clock: (u) => 2500 - 2000 * u, gain: (u) => 0.55 * Math.min(1, u * 10) * Math.pow(1 - u, 1.1) });
    s.pulse(0.02, 0.9, { freq: env.ramp(80, 40), gain: env.decay(0.4, 1.2), duty: 0.5 });
    for (let i = 0; i < 6; i++) s.noise(0.15 + i * 0.1 + s.random() * 0.04, 0.06, { clock: () => 3000 + s.random() * 3000, gain: env.decay(0.25, 1) });
    return s;
  },

  /** Generic projectile (impact 0.43 s): a swirling, dancing flame with a rhythmic flicker. */
  fierydance: () => {
    const s = new MoveSfx(1.1, 0xf1ed);
    s.noise(0.0, 0.45, { clock: (u) => 900 + 700 * Math.sin(2 * Math.PI * 4 * u), gain: (u) => 0.35 * Math.sin(Math.PI * u) * (0.6 + 0.4 * Math.sin(2 * Math.PI * 8 * u)) });
    s.arpeggio(0.0, [67, 71, 74, 71, 74, 79], 0.07, { gain: 0.12, voice: 'wave', hold: 0.09 });
    s.thud(0.43, 0.6, 0.6);
    s.noise(0.44, 0.5, { clock: env.ramp(1800, 500), gain: env.attackDecay(0.4, 0.05) });
    s.sparkle(0.5, 0.3, 4, { lo: 6000, hi: 9000, gain: 0.12 });
    return s;
  },

  /**
   * FireMoveAnimations.playFireBlast: flames stream into the caster (0-0.94 s,
   * flashes at 0 and 0.5 s), the fireball flies (0.94-1.42 s), bursts into the
   * five-armed blast (1.42-2.48 s, second shake at 1.87 s), heat fades (~2.8 s).
   * A gathering roar, a rushing fireball and a huge booming blast.
   */
  fireblast: () => {
    const s = new MoveSfx(2.95, 0xf1b1);
    s.noise(0.0, 0.94, { clock: env.ramp(300, 1400), gain: (u) => 0.32 * Math.min(1, u * 3) * (0.75 + 0.25 * Math.sin(2 * Math.PI * 9 * u)) });
    s.pulse(0.0, 0.94, { freq: env.ramp(60, 150), gain: env.ramp(0.05, 0.18), duty: 0.5 });
    s.pulse(0.5, 0.15, { freq: () => 330, gain: env.decay(0.15, 1), duty: 0.25 });
    s.whoosh(0.94, 0.5, { from: 800, to: 5000, gain: 0.45 });
    s.thud(1.42, 0.9, 1);
    s.noise(1.42, 0.3, { clock: (u) => 12000 - 9000 * u, gain: env.attackDecay(0.6, 0.02) });
    s.noise(1.45, 1.05, { clock: () => 600, gain: (u) => 0.45 * Math.min(1, u * 10) * Math.pow(1 - u, 0.7) });
    s.noise(1.45, 1.05, { clock: (u) => 1800 + 700 * Math.sin(2 * Math.PI * 5 * u), gain: (u) => 0.22 * Math.sin(Math.PI * u) });
    s.thud(1.87, 0.45, 0.8);
    s.rumble(2.3, 0.55, { from: 500, to: 150, gain: 0.25 });
    s.sparkle(1.5, 1.0, 10, { lo: 6000, hi: 9500, gain: 0.12 });
    return s;
  },

  /** Generic melee bite (impact 0.17 s) + burn fleck (~0.5 s): blazing fangs clamp down. */
  firefang: () => {
    const s = new MoveSfx(1.0, 0xf1fa);
    s.noise(0.0, 0.17, { clock: env.ramp(400, 1500), gain: env.ramp(0.1, 0.3) });
    s.pulse(0.0, 0.17, { freq: env.ramp(120, 220), gain: env.ramp(0.05, 0.16), duty: 0.125 });
    s.noise(0.17, 0.05, { clock: () => 12000, gain: env.decay(0.5, 1) });
    s.noise(0.23, 0.05, { clock: () => 9000, gain: env.decay(0.35, 1) });
    s.thud(0.17, 0.5, 0.4);
    s.noise(0.2, 0.3, { clock: env.ramp(1500, 500), gain: env.decay(0.3, 1.5) });
    s.burn(0.5);
    return s;
  },

  /** Generic projectile (impact 0.43 s): a pillar of fire erupts under the target. */
  firepledge: () => {
    const s = new MoveSfx(1.3, 0xf1e9);
    s.whoosh(0.0, 0.45, { from: 600, to: 3000, gain: 0.3 });
    s.thud(0.43, 0.65, 0.8);
    s.noise(0.43, 0.75, { clock: env.ramp(500, 2500), gain: (u) => 0.45 * Math.min(1, u * 10) * Math.pow(1 - u, 1.2) });
    s.pulse(0.43, 0.5, { freq: env.ramp(90, 260), gain: env.decay(0.2, 1), duty: 0.5 });
    s.sparkle(0.55, 0.5, 6, { lo: 6000, hi: 9000, gain: 0.12 });
    return s;
  },

  /**
   * FireMoveAnimations.playFirePunch: heat glow fades in (0-0.3 s), the fist
   * slams in (impact 0.45 s), flames burst all over the target (0.45-1.5 s),
   * heat fades (~1.9 s). A heavy punch that ignites a crackling blaze.
   */
  firepunch: () => {
    const s = new MoveSfx(1.95, 0xf1fe);
    s.noise(0.0, 0.3, { clock: env.ramp(300, 1000), gain: env.ramp(0.05, 0.22) });
    s.whoosh(0.3, 0.16, { from: 2000, to: 7000, gain: 0.3 });
    s.thud(0.45, 0.85, 0.8);
    s.noise(0.45, 1.1, { clock: (u) => 1100 + 500 * Math.sin(2 * Math.PI * 6 * u), gain: (u) => 0.38 * Math.min(1, u * 15) * Math.pow(1 - u, 1.1) });
    for (let i = 0; i < 9; i++) s.noise(0.5 + s.random() * 0.9, 0.025, { clock: () => 10000, gain: env.decay(0.3, 1) });
    s.noise(1.5, 0.4, { clock: () => 500, gain: env.decay(0.12, 1.5) });
    return s;
  },

  /**
   * Generic projectile (impact 0.43 s), then FireMoveAnimations.playVortex: a
   * ring of flames spirals up around the target (0.52-1.98 s, flickers every
   * 0.28 s). A swirling, pulsing roar that winds down.
   */
  firespin: () => {
    const s = new MoveSfx(2.15, 0xf15b);
    s.whoosh(0.0, 0.45, { from: 800, to: 3500, gain: 0.3 });
    s.thud(0.43, 0.55, 0.5);
    s.noise(0.5, 1.5, { clock: (u) => 700 + 500 * Math.sin(2 * Math.PI * 7 * u), gain: (u) => 0.4 * Math.min(1, u * 6) * Math.pow(1 - u, 1.2) * (0.7 + 0.3 * Math.sin(2 * Math.PI * 9 * u)) });
    s.pulse(0.5, 1.3, { freq: (u) => 110 + 60 * Math.sin(2 * Math.PI * 7 * u), gain: (u) => 0.13 * Math.sin(Math.PI * u), duty: 0.5 });
    for (let i = 0; i < 4; i++) s.noise(0.72 + i * 0.28, 0.1, { clock: () => 3000, gain: env.decay(0.18, 1.5) });
    return s;
  },

  /** Generic projectile (impact 0.43 s): a fireball bursts, scattering embers around. */
  flameburst: () => {
    const s = new MoveSfx(1.15, 0xf1b0);
    s.whoosh(0.0, 0.45, { from: 700, to: 3500, gain: 0.35 });
    s.thud(0.43, 0.75, 0.7);
    s.noise(0.43, 0.2, { clock: (u) => 11000 - 8000 * u, gain: env.attackDecay(0.5, 0.03) });
    s.noise(0.5, 0.5, { clock: env.ramp(1500, 400), gain: env.decay(0.3, 1.2) });
    s.sparkle(0.5, 0.4, 8, { lo: 5000, hi: 9000, gain: 0.15 });
    return s;
  },

  /** Generic melee (impact 0.17 s) + Speed up (~0.5 s): a flaming tackle that stokes the user's pace. */
  flamecharge: () => {
    const s = new MoveSfx(1.15, 0xf1c4);
    s.noise(0.0, 0.17, { clock: env.ramp(500, 2000), gain: env.ramp(0.1, 0.35) });
    s.thud(0.17, 0.65, 0.6);
    s.noise(0.18, 0.3, { clock: env.ramp(1500, 500), gain: env.decay(0.3, 1.5) });
    s.statUp(0.5, 0.24);
    return s;
  },

  /** Generic melee (impact 0.17 s) + burn fleck (~0.55 s): a rolling wheel of fire slams in. */
  flamewheel: () => {
    const s = new MoveSfx(1.0, 0xf1e1);
    s.noise(0.0, 0.2, { clock: (u) => 800 + 600 * Math.sin(2 * Math.PI * 4 * u), gain: (u) => (0.15 + 0.25 * u) * (0.6 + 0.4 * Math.sin(2 * Math.PI * 6 * u)) });
    s.pulse(0.0, 0.17, { freq: env.ramp(100, 200), gain: env.ramp(0.05, 0.18), duty: 0.5 });
    s.thud(0.17, 0.6, 0.6);
    s.noise(0.18, 0.3, { clock: env.ramp(1500, 500), gain: env.decay(0.3, 1.5) });
    s.burn(0.55);
    return s;
  },

  /**
   * FireMoveAnimations.playFlareBlitz: flames rise off the caster (0-1.13 s,
   * flashes at 0 / 0.32 / 0.64 s), the field darkens (to 1.56 s), the caster
   * lunges (impact 1.73 s) into a huge flame blast (to ~2.6 s), recoil at
   * ~2.25 s, backdrops fade (~3.3 s). Building crackle, tense hush, explosion.
   */
  flareblitz: () => {
    const s = new MoveSfx(3.3, 0xf1b7);
    s.noise(0.0, 1.15, { clock: env.ramp(500, 1600), gain: (u) => 0.38 * Math.min(1, u * 4) * Math.pow(1 - u, 0.5) });
    for (const at of [0.0, 0.32, 0.64]) s.pulse(at, 0.18, { freq: env.ramp(150, 320), gain: env.decay(0.18, 1.5), duty: 0.5 });
    s.pulse(1.13, 0.45, { freq: env.ramp(70, 55), gain: env.swell(0.18), duty: 0.125 });
    s.whoosh(1.56, 0.18, { from: 2000, to: 8000, gain: 0.35 });
    s.thud(1.73, 0.7, 1);
    s.noise(1.73, 0.3, { clock: (u) => 12000 - 9000 * u, gain: env.attackDecay(0.4, 0.02) });
    s.noise(1.75, 0.9, { clock: (u) => 1200 - 600 * u, gain: (u) => 0.45 * Math.min(1, u * 10) * Math.pow(1 - u, 1) });
    s.sparkle(1.8, 0.55, 10, { lo: 6000, hi: 9500, gain: 0.14 });
    s.thud(2.25, 0.35, 0.4);
    s.noise(2.6, 0.6, { clock: () => 450, gain: env.decay(0.12, 1.5) });
    return s;
  },

  /** Generic projectile (impact at 0.43 s): a huge white-hot fireball - deep rising roar, then an explosive blast. */
  fusionflare: () => {
    const s = new MoveSfx(1.15, 0xf0f1);
    s.noise(0.0, 0.43, { clock: (u) => 800 + 1500 * u, gain: env.ramp(0.1, 0.35) });
    s.pulse(0.0, 0.43, { freq: (u) => 80 + 80 * u, gain: env.ramp(0.05, 0.15), duty: 0.5 });
    s.thud(0.43, 0.8, 1);
    s.noise(0.43, 0.6, { clock: (u) => 4000 - 3000 * u, gain: env.attackDecay(0.45, 0.03) });
    s.rumble(0.45, 0.6, { from: 400, to: 120, gain: 0.3 });
    return s;
  },

  /** Generic melee (impact 0.17 s): a blazing body crashes down with a deep thud and a burst of flame. */
  heatcrash: () => {
    const s = new MoveSfx(1.0, 0x4ec5);
    s.whoosh(0.0, 0.18, { from: 800, to: 2500, gain: 0.35 });
    s.thud(0.17, 0.9, 1);
    s.noise(0.17, 0.6, { clock: (u) => 1600 - 900 * u, gain: env.attackDecay(0.45, 0.05) });
    s.sparkle(0.22, 0.4, 5, { lo: 5000, hi: 8000, gain: 0.12 });
    return s;
  },

  /** Generic field (shake + waves ~0.6 s) + burn fleck (~0.7 s): a rolling blast of scorching air over all foes. */
  heatwave: () => {
    const s = new MoveSfx(1.25, 0x4ea7);
    s.noise(0.0, 0.75, { clock: (u) => 900 + 400 * Math.sin(2 * Math.PI * 3 * u), gain: env.swell(0.42) });
    s.wave(0.0, 0.7, { freq: (u) => 180 + 60 * Math.sin(2 * Math.PI * 5 * u), gain: env.swell(0.2) });
    s.burn(0.7);
    return s;
  },

  /** Generic field (flames sweep all foes ~0.6 s, other targets flash after): a broad, crackling burst of fire. */
  incinerate: () => {
    const s = new MoveSfx(1.05, 0x1c1e);
    s.noise(0.0, 0.85, { clock: (u) => 900 + 400 * Math.sin(2 * Math.PI * 5 * u), gain: (u) => 0.4 * Math.min(1, u * 10) * Math.pow(1 - u, 1.2) });
    s.thud(0.05, 0.4, 0.6);
    for (let i = 0; i < 7; i++) s.noise(0.1 + s.random() * 0.6, 0.025, { clock: () => 10000, gain: env.decay(0.25, 1) });
    return s;
  },

  /** Generic projectile (impact 0.43 s) + burn fleck (0.55 s): a roaring fireball that engulfs the target. */
  inferno: () => {
    const s = new MoveSfx(1.1, 0x1f30);
    s.noise(0.0, 0.43, { clock: (u) => 500 + 900 * u, gain: env.ramp(0.12, 0.35) });
    s.pulse(0.0, 0.43, { freq: (u) => 110 + 60 * u, gain: env.ramp(0.06, 0.15), duty: 0.5 });
    s.thud(0.43, 0.7, 0.8);
    s.noise(0.43, 0.6, { clock: () => 1000, gain: env.decay(0.35, 1.2) });
    s.burn(0.55, 0.28);
    return s;
  },

  /** Generic field (field shake + waves ~0.6 s) + burn fleck (~0.7 s): lava erupts in a ring - a bubbling, boiling roar with molten gloops. */
  lavaplume: () => {
    const s = new MoveSfx(1.25, 0x1a7a);
    s.thud(0.02, 0.6, 0.8);
    s.noise(0.0, 0.7, { clock: (u) => 1600 - 900 * u, gain: env.swell(0.45) });
    s.pulse(0.0, 0.65, { freq: (u) => 90 + 25 * Math.sin(2 * Math.PI * 6 * u), gain: env.swell(0.22), duty: 0.5 });
    s.bubbles(0.08, 0.55, 7, { lo: 160, hi: 320, gain: 0.22 });
    s.burn(0.7);
    return s;
  },

  /** Generic projectile (impact 0.43 s), trapping: a roaring swell of magma bursts on the foe and keeps swirling around it. */
  magmastorm: () => {
    const s = new MoveSfx(1.35, 0xa6a5);
    s.noise(0.0, 0.45, { clock: env.ramp(500, 1500), gain: env.swell(0.35) });
    s.pulse(0.0, 0.45, { freq: (u) => 90 + 60 * u, gain: env.swell(0.2), duty: 0.5 });
    s.thud(0.43, 0.6, 0.9);
    s.noise(0.43, 0.8, { clock: (u) => 900 + 400 * Math.sin(2 * Math.PI * 5 * u), gain: env.decay(0.4, 1.2) });
    s.rumble(0.45, 0.8, { from: 400, to: 150, gain: 0.3 });
    s.sparkle(0.5, 0.5, 4, { lo: 5000, hi: 8000, gain: 0.12 });
    return s;
  },

  /** Generic projectile (0.43 s) + Sp. Atk drop fleck (~0.55 s): a mystic flame whirls over with a magic shimmer and bursts. */
  mysticalfire: () => {
    const s = new MoveSfx(1.05, 0x3f1e);
    s.noise(0.0, 0.45, { clock: env.ramp(500, 1500), gain: env.swell(0.28) });
    s.chord(0.0, 0.45, [74, 78, 81], { rate: 0.04, gain: 0.14, vibrato: 0.02 });
    s.noise(0.43, 0.3, { clock: (u) => 5000 - 3800 * u, gain: env.attackDecay(0.45, 0.04) });
    s.thud(0.43, 0.4, 0.5);
    s.statDown(0.58);
    return s;
  },

  /** Generic projectile (0.43 s), bp 130: a white-hot blast roars out and explodes with a long, searing burn. */
  overheat: () => {
    const s = new MoveSfx(1.3, 0x0e47);
    s.noise(0.0, 0.45, { clock: env.ramp(1500, 7000), gain: env.ramp(0.15, 0.4) });
    s.pulse(0.0, 0.45, { freq: env.ramp(90, 200), gain: env.ramp(0.05, 0.16), duty: 0.5 });
    s.thud(0.43, 0.6, 0.9);
    s.noise(0.43, 0.75, { clock: (u) => 9000 - 6000 * u, gain: (u) => 0.4 * Math.min(1, u * 15) * Math.pow(1 - u, 1.1) });
    s.noise(0.45, 0.7, { clock: () => 900, gain: (u) => 0.25 * Math.sin(Math.PI * u) });
    s.sparkle(0.5, 0.55, 8, { lo: 6000, hi: 9500, gain: 0.12 });
    return s;
  },

  /** Generic projectile (impact 0.43 s) + burn fleck (0.55 s): a mystic flame – a holy chime rides a warm fire roar into a blaze. */
  sacredfire: () => {
    const s = new MoveSfx(1.15, 0x5acf);
    s.noise(0.0, 0.45, { clock: env.ramp(800, 1600), gain: env.swell(0.3) });
    s.chord(0.0, 0.45, [76, 81, 85], { rate: 0.04, gain: 0.14 });
    s.thud(0.43, 0.6, 0.6);
    s.noise(0.43, 0.35, { clock: (u) => 1800 - 800 * u, gain: env.attackDecay(0.4, 0.08) });
    s.burn(0.55, 0.3);
    return s;
  },

  /** Generic lob (0.52 s) + burn fleck (~0.65 s): a scorching fireball hurled in an arc that bursts in roaring flames. */
  searingshot: () => {
    const s = new MoveSfx(1.15, 0x5ea5);
    s.noise(0.0, 0.52, { clock: (u) => 900 + 700 * Math.sin(Math.PI * u), gain: env.ramp(0.15, 0.3) });
    s.pulse(0.0, 0.52, { freq: (u) => 220 + 180 * Math.sin(Math.PI * u), gain: env.swell(0.12), duty: 0.25 });
    s.thud(0.52, 0.6, 0.8);
    s.noise(0.52, 0.45, { clock: env.ramp(2500, 600), gain: env.attackDecay(0.45, 0.05) });
    s.burn(0.65, 0.25);
    return s;
  },

  /** Generic weather (particles ~1.1 s, glow 0.9 s): warm sunrays swell into a bright major chord. */
  sunnyday: () => {
    const s = new MoveSfx(1.45, 0x5d4a);
    s.arpeggio(0.02, [67, 71, 74, 79], 0.1, { gain: 0.22, voice: 'wave', hold: 0.3 });
    s.chord(0.4, 0.8, [79, 83, 86], { rate: 0.04, gain: 0.2, voice: 'pulse' });
    s.noise(0.02, 1.1, { clock: () => 1100, gain: env.swell(0.1) });
    s.sparkle(0.5, 0.7, 8, { lo: 3000, hi: 5000, gain: 0.12 });
    return s;
  },

  /** Generic melee at max power (impact 0.17 s): a blazing V-shaped charge that explodes in flames. */
  vcreate: () => {
    const s = new MoveSfx(1.15, 0x0c8e);
    s.noise(0.0, 0.17, { clock: env.ramp(800, 2500), gain: env.ramp(0.15, 0.45) });
    s.thud(0.17, 0.8, 1);
    s.noise(0.17, 0.85, { clock: (u) => 2200 - 1700 * u, gain: env.attackDecay(0.55, 0.04) });
    s.pulse(0.17, 0.6, { freq: (u) => 90 * Math.pow(0.45, u), gain: env.decay(0.35, 1.5), duty: 0.5 });
    s.sparkle(0.25, 0.5, 6, { lo: 5000, hi: 8000, gain: 0.14 });
    return s;
  },

  /** Generic target aura (~0.8 s) + burn fleck (~0.6 s): eerie wisps of ghost fire float over to the target. */
  willowisp: () => {
    const s = new MoveSfx(1.15, 0x3f1e);
    s.wave(0.02, 0.6, { freq: (u) => 520 * (1 + 0.05 * Math.sin(2 * Math.PI * 7 * u)) * (1 + 0.2 * u), gain: env.swell(0.24) });
    s.wave(0.12, 0.5, { freq: (u) => 555 * (1 + 0.05 * Math.sin(2 * Math.PI * 6 * u)), gain: env.swell(0.12) });
    s.noise(0.02, 0.6, { clock: () => 1000, gain: env.swell(0.12) });
    s.burn(0.6, 0.35);
    return s;
  },
};
