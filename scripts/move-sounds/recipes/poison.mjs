import { MoveSfx } from '../move-sfx.mjs';
import { env } from '../track.mjs';

/** Poison-type move sounds: gloopy, bubbling, sizzling. */
export const POISON = {
  /** PoisonMoveAnimations.playAcidSpit: 7 droplets spat every 75 ms, each landing 0.44 s later, then a short hold. */
  acid: () => {
    const s = new MoveSfx(1.35, 0xac1d);
    for (let i = 0; i < 7; i++) {
      const at = 0.02 + i * 0.075;
      s.pulse(at, 0.06, { freq: (u) => 500 + 700 * u, gain: env.decay(0.2, 1), duty: 0.25 });
      const land = at + 0.44;
      s.noise(land, 0.1, { clock: (u) => 5000 - 3000 * u, gain: env.attackDecay(0.35, 0.05) });
      s.pulse(land, 0.08, { freq: (u) => 320 * Math.pow(0.5, u), gain: env.decay(0.25, 2), duty: 0.5 });
    }
    // The acid sizzles on the target.
    s.noise(0.5, 0.8, { clock: () => 11000, gain: env.attackDecay(0.16, 0.2) });
    return s;
  },

  /** Generic self aura (0-0.8 s) + stat-up fleck: the body melts into liquid. */
  acidarmor: () => {
    const s = new MoveSfx(1.5, 0xac1a);
    s.wave(0.02, 0.8, { freq: (u) => 150 - 50 * u + 45 * Math.sin(2 * Math.PI * 5 * u), gain: env.swell(0.4) });
    s.bubbles(0.05, 0.7, 9, { lo: 160, hi: 400, gain: 0.25 });
    s.statUp(0.85);
    return s;
  },

  /** Generic lob (0.52 s arc) + Sp. Def drop fleck. */
  acidspray: () => {
    const s = new MoveSfx(1.3, 0xac5b);
    s.pulse(0.02, 0.06, { freq: (u) => 500 + 700 * u, gain: env.decay(0.25, 1), duty: 0.25 });
    s.pulse(0.03, 0.5, { freq: (u) => 1400 - 900 * u, gain: (u) => 0.12 * (1 - 0.5 * u), duty: 0.125 });
    s.splash(0.54, 0.5);
    s.noise(0.6, 0.5, { clock: () => 11000, gain: env.attackDecay(0.14, 0.2) });
    s.statDown(0.7);
    return s;
  },

  /** Generic projectile (0.43 s): a mighty, gassy burp. */
  belch: () => {
    const s = new MoveSfx(1.1, 0xbe1c);
    s.pulse(0.02, 0.55, {
      freq: (u) => (95 - 25 * u) * (1 + 0.08 * Math.sin(2 * Math.PI * 22 * u)),
      gain: (u) => 0.4 * Math.min(1, u * 10) * Math.pow(1 - u, 0.6),
      duty: 0.25,
    });
    s.noise(0.02, 0.55, { clock: (u) => 700 - 200 * u, gain: (u) => 0.25 * Math.min(1, u * 10) * Math.pow(1 - u, 0.6) });
    s.noise(0.43, 0.5, { clock: env.ramp(3000, 800), gain: env.attackDecay(0.35, 0.1) });
    s.bubbles(0.5, 0.4, 5, { lo: 200, hi: 450, gain: 0.15 });
    return s;
  },

  /** Generic projectile (0.43 s): a puff of smog that wipes stat changes clean. */
  clearsmog: () => {
    const s = new MoveSfx(1.1, 0xc15a);
    s.noise(0.0, 0.45, { clock: env.ramp(600, 1600), gain: env.swell(0.35) });
    s.noise(0.43, 0.35, { clock: env.ramp(2500, 700), gain: env.attackDecay(0.35, 0.1) });
    s.arpeggio(0.6, [79, 72], 0.1, { gain: 0.2, voice: 'wave', hold: 0.18 });
    return s;
  },

  /** Generic self aura + stat-up fleck: the body coils up with a hiss. */
  coil: () => {
    const s = new MoveSfx(1.5, 0xc011);
    s.noise(0.02, 0.6, { clock: () => 14000, gain: env.swell(0.2) });
    for (const at of [0.05, 0.3]) s.pulse(at, 0.25, { freq: (u) => 300 * Math.pow(2.5, u), gain: env.swell(0.18), duty: 0.125 });
    s.statUp(0.85);
    return s;
  },

  /** Generic melee + poison fleck: two crossing poisonous slashes. */
  crosspoison: () => {
    const s = new MoveSfx(1.0, 0xc25b);
    s.whoosh(0.0, 0.12, { from: 2000, to: 8000, gain: 0.3 });
    s.slash(0.1, 0.4);
    s.slash(0.17, 0.5);
    s.thud(0.17, 0.4, 0.4);
    s.poison(0.45);
    return s;
  },

  /** Generic target aura (~0.8 s), no fleck: sticky acid coats the foe with a fizzing gurgle. */
  gastroacid: () => {
    const s = new MoveSfx(1.25, 0x6a5a);
    s.noise(0.02, 0.85, { clock: () => 2600, gain: env.swell(0.12) });
    s.pulse(0.02, 0.8, { freq: (u) => (260 - 80 * u) * (1 + 0.08 * Math.sin(2 * Math.PI * 11 * u)), gain: env.swell(0.2), duty: 0.25 });
    s.bubbles(0.05, 0.8, 9, { lo: 160, hi: 380, gain: 0.22 });
    return s;
  },

  /** Generic lob (impact 0.52 s) + poison fleck (≈0.65 s): a heavy glob of filth splats onto the foe. */
  gunkshot: () => {
    const s = new MoveSfx(1.2, 0x6c57);
    s.pulse(0, 0.08, { freq: (u) => 180 + 220 * u, gain: env.decay(0.3, 1), duty: 0.5 });
    s.pulse(0.04, 0.48, { freq: (u) => (420 - 200 * u) * (1 + 0.05 * Math.sin(2 * Math.PI * 7 * u)), gain: (u) => 0.1 * (1 - 0.5 * u), duty: 0.25 });
    s.thud(0.52, 0.55, 0.7);
    s.noise(0.52, 0.3, { clock: (u) => 3000 - 2200 * u, gain: env.attackDecay(0.35, 0.05) });
    s.poison(0.65, 0.25);
    return s;
  },

  /** Generic melee, bite style (0.17 s impact) + poison fleck: venomous fangs sink in. */
  poisonfang: () => {
    const s = new MoveSfx(1.15, 0xf4f9);
    s.whoosh(0.0, 0.15, { from: 2000, to: 7000, gain: 0.2 });
    s.pulse(0.17, 0.05, { freq: (u) => 1800 - 800 * u, gain: env.decay(0.3, 1.5), duty: 0.25 });
    s.thud(0.17, 0.45, 0.3);
    s.pulse(0.24, 0.05, { freq: (u) => 1600 - 800 * u, gain: env.decay(0.3, 1.5), duty: 0.25 });
    s.thud(0.24, 0.35, 0.25);
    s.poison(0.6);
    return s;
  },

  /** Generic target aura (0-0.8 s) + poison fleck (≈0.6 s): a hissing cloud of toxic gas. */
  poisongas: () => {
    const s = new MoveSfx(1.15, 0xf9a5);
    s.noise(0.0, 0.8, { clock: (u) => 1200 + 800 * Math.sin(Math.PI * u), gain: env.swell(0.32) });
    s.noise(0.05, 0.6, { clock: () => 12000, gain: env.swell(0.1) });
    s.bubbles(0.1, 0.5, 5, { lo: 150, hi: 300, gain: 0.15 });
    s.poison(0.6);
    return s;
  },

  /** Generic melee (0.17 s impact) + poison fleck: a stabbing, toxic jab. */
  poisonjab: () => {
    const s = new MoveSfx(1.15, 0xf41a);
    s.whoosh(0.0, 0.15, { from: 2000, to: 8000, gain: 0.25 });
    s.thud(0.17, 0.6, 0.5);
    s.noise(0.19, 0.3, { clock: () => 9000, gain: env.decay(0.15, 1.5) });
    s.bubbles(0.2, 0.2, 3, { lo: 200, hi: 400, gain: 0.15 });
    s.poison(0.6);
    return s;
  },

  /** Generic powder (stream 0.76 s) + poison fleck at 0.76 s: a fizzing purple dust. */
  poisonpowder: () => {
    const s = new MoveSfx(1.3, 0xf4d0);
    s.noise(0.0, 0.8, { clock: (u) => 7000 - 2000 * u, gain: env.swell(0.25) });
    s.sparkle(0.05, 0.7, 7, { lo: 1500, hi: 3000, gain: 0.12 });
    s.poison(0.76, 0.3);
    return s;
  },

  /** Generic projectile (0.43 s impact) + poison fleck: a tiny barb whistles in and pricks. */
  poisonsting: () => {
    const s = new MoveSfx(1.15, 0xf457);
    s.pulse(0.02, 0.4, { freq: (u) => 1500 + 1500 * u, gain: (u) => 0.1 * (0.5 + 0.5 * u), duty: 0.125 });
    s.pulse(0.43, 0.04, { freq: () => 2800, gain: env.decay(0.3, 1.5), duty: 0.25 });
    s.thud(0.43, 0.35, 0.15);
    s.poison(0.58);
    return s;
  },

  /** Generic melee (0.17 s impact) + poison fleck: a swinging tail smack with a venomous drip. */
  poisontail: () => {
    const s = new MoveSfx(1.15, 0xf47a);
    s.whoosh(0.0, 0.17, { from: 1200, to: 6000, gain: 0.3 });
    s.thud(0.17, 0.55, 0.55);
    s.bubbles(0.2, 0.15, 3, { lo: 200, hi: 400, gain: 0.15 });
    s.poison(0.6);
    return s;
  },

  /** Generic projectile (impact 0.43 s) + poison fleck (0.55 s): a gloopy glob of sludge. */
  sludge: () => {
    const s = new MoveSfx(1.05, 0x51d6);
    s.pulse(0.0, 0.43, { freq: (u) => (250 + 150 * u) * (1 + 0.08 * Math.sin(2 * Math.PI * 12 * u)), gain: env.ramp(0.1, 0.22), duty: 0.25 });
    s.splash(0.43, 0.45);
    s.poison(0.55);
    return s;
  },

  /** Generic lob (impact 0.52 s) + poison fleck (0.65 s): a heavy sludge bomb arcs over and bursts. */
  sludgebomb: () => {
    const s = new MoveSfx(1.15, 0x5b0b);
    s.pulse(0.0, 0.06, { freq: (u) => 300 + 500 * u, gain: env.decay(0.3, 1), duty: 0.5 });
    s.pulse(0.03, 0.49, { freq: (u) => 900 - 600 * u, gain: (u) => 0.1 * (1 - 0.5 * u), duty: 0.25 });
    s.thud(0.52, 0.55, 0.8);
    s.splash(0.52, 0.45);
    s.poison(0.65);
    return s;
  },

  /** Generic field (waves 0-0.6 s) + poison fleck: a toxic tide floods the whole field. */
  sludgewave: () => {
    const s = new MoveSfx(1.15, 0x5a7e);
    s.rumble(0.0, 0.6, { from: 300, to: 500, gain: 0.3 });
    s.noise(0.0, 0.6, { clock: (u) => 2500 + 1500 * Math.sin(2 * Math.PI * 3 * u), gain: env.swell(0.25) });
    s.bubbles(0.05, 0.55, 10, { lo: 180, hi: 420, gain: 0.2 });
    s.poison(0.65);
    return s;
  },

  /** Generic projectile (impact 0.43 s) + poison fleck (0.55 s): a hissing puff of exhaust gas. */
  smog: () => {
    const s = new MoveSfx(1.05, 0x5309);
    s.noise(0.0, 0.45, { clock: env.ramp(500, 1200), gain: env.swell(0.35) });
    s.noise(0.43, 0.25, { clock: env.ramp(2000, 600), gain: env.attackDecay(0.35, 0.1) });
    s.poison(0.55);
    return s;
  },

  /**
   * PoisonMoveAnimations.playToxic: a purple pool spreads under the target (0-0.4 s),
   * from 0.3 s 16 bubbles well up every 60 ms while the sprite turns purple (to ~1.7 s),
   * the pool fades out by ~2.1 s. A sickly, thick gurgle that keeps bubbling.
   */
  toxic: () => {
    const s = new MoveSfx(2.2, 0x70c1);
    s.noise(0.0, 0.45, { clock: env.ramp(600, 1800), gain: env.swell(0.22) });
    s.pulse(0.02, 1.9, { freq: (u) => (150 - 40 * u) * (1 + 0.08 * Math.sin(2 * Math.PI * 14 * u)), gain: (u) => 0.18 * Math.min(1, u * 6) * Math.pow(1 - u, 1.2), duty: 0.25 });
    for (let i = 0; i < 16; i++) {
      const at = 0.3 + i * 0.06 + s.random() * 0.03;
      const f = 220 + s.random() * 260;
      s.pulse(at, 0.08, { freq: (u) => f * (1 + 1.4 * u), gain: env.decay(0.22, 1), duty: 0.5 });
    }
    s.poison(1.2, 0.22);
    return s;
  },

  /** Generic target aura (~0.8 s) on the foe side: toxic barbs scatter and clink onto the ground. */
  toxicspikes: () => {
    const s = new MoveSfx(1.2, 0x7059);
    s.whoosh(0.0, 0.35, { from: 2000, to: 5000, gain: 0.18 });
    for (let i = 0; i < 6; i++) {
      const at = 0.25 + i * 0.09 + s.random() * 0.03;
      s.pulse(at, 0.05, { freq: () => 2400 + s.random() * 1200, gain: env.decay(0.22, 1.5), duty: 0.125 });
      s.noise(at, 0.04, { clock: () => 9000, gain: env.decay(0.15, 1), short: true });
    }
    s.pulse(0.55, 0.45, { freq: (u) => (280 - 90 * u) * (1 + 0.06 * Math.sin(2 * Math.PI * 9 * u)), gain: env.swell(0.15), duty: 0.25 });
    return s;
  },

  /** Generic target aura (~0.8 s) on all foes: a sticky flood of venom gushes over them and seeps in. */
  venomdrench: () => {
    const s = new MoveSfx(1.25, 0x7ed1);
    s.noise(0.0, 0.8, { clock: (u) => 2500 - 1500 * u, gain: env.swell(0.3) });
    s.pulse(0.02, 0.85, { freq: (u) => (200 - 70 * u) * (1 + 0.07 * Math.sin(2 * Math.PI * 11 * u)), gain: env.swell(0.2), duty: 0.25 });
    s.bubbles(0.15, 0.7, 9, { lo: 180, hi: 420, gain: 0.2 });
    s.pulse(0.8, 0.35, { freq: (u) => 160 * Math.pow(0.6, u), gain: env.decay(0.15, 1.5), duty: 0.5 });
    return s;
  },

  /** Generic projectile (impact 0.43 s): a gurgling venom ball smacks in with a corrosive hiss. */
  venoshock: () => {
    const s = new MoveSfx(0.95, 0x7e05);
    s.pulse(0.0, 0.43, { freq: (u) => (220 + 120 * u) * (1 + 0.1 * Math.sin(2 * Math.PI * 10 * u)), gain: env.ramp(0.1, 0.25), duty: 0.25 });
    s.splash(0.43, 0.5);
    s.thud(0.43, 0.4, 0.5);
    s.noise(0.5, 0.35, { clock: () => 4000, gain: env.decay(0.15, 1.5), short: true });
    s.bubbles(0.5, 0.3, 4, { lo: 200, hi: 400, gain: 0.15 });
    return s;
  },
};
