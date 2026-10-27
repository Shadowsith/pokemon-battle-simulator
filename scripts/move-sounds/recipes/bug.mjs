import { MoveSfx } from '../move-sfx.mjs';
import { env } from '../track.mjs';

/** Bug-type move sounds. */
export const BUG = {
  /** Generic projectile (0.43 s): a swarm flies in and lands many small hits. */
  attackorder: () => {
    const s = new MoveSfx(1.1, 0xa77d);
    for (const f of [170, 183, 196, 211]) {
      s.pulse(0.0, 0.9, {
        freq: (u) => f * (1 + 0.03 * Math.sin(2 * Math.PI * 18 * u + f)),
        gain: (u) => 0.1 * Math.min(1, u * 4) * Math.min(1, (1 - u) * 3),
        duty: 0.25,
      });
    }
    for (let i = 0; i < 6; i++) s.thud(0.43 + i * 0.055 + s.random() * 0.02, 0.28, 0.1);
    return s;
  },

  /** Generic melee bite: clicking mandibles, a crunch and a little munching. */
  bugbite: () => {
    const s = new MoveSfx(0.75, 0xbb17);
    for (const at of [0.0, 0.06, 0.12]) s.noise(at, 0.025, { clock: () => 10000, gain: env.decay(0.25, 1), short: true });
    s.noise(0.17, 0.07, { clock: () => 12000, gain: env.decay(0.55, 1) });
    s.thud(0.17, 0.45, 0.3);
    for (const at of [0.35, 0.48]) s.noise(at, 0.05, { clock: () => 3500, gain: env.decay(0.2, 1) });
    return s;
  },

  /** Generic sonic (rings every 0.11 s, impact 0.43 s) + Sp. Def drop fleck: a loud insect buzz. */
  bugbuzz: () => {
    const s = new MoveSfx(1.2, 0xbb22);
    for (const f of [220, 233, 247]) {
      s.pulse(0.0, 0.6, {
        freq: (u) => f * (1 + 0.04 * Math.sin(2 * Math.PI * 25 * u)),
        gain: (u) => 0.14 * Math.min(1, u * 6) * (0.7 + 0.3 * Math.sin(2 * Math.PI * 7 * u)) * Math.min(1, (1 - u) * 4),
        duty: 0.25,
      });
    }
    s.noise(0.0, 0.6, { clock: () => 7000, gain: env.swell(0.12), short: true });
    s.thud(0.43, 0.45, 0.4);
    s.statDown(0.6);
    return s;
  },

  /** Generic self aura + stat-up fleck: a swarm forms a protective wall. */
  defendorder: () => {
    const s = new MoveSfx(1.5, 0xdef0);
    for (const f of [180, 194, 208]) {
      s.pulse(0.02, 0.7, { freq: (u) => f * (1 + 0.03 * Math.sin(2 * Math.PI * 16 * u + f)), gain: env.swell(0.1), duty: 0.25 });
    }
    s.thud(0.6, 0.35, 0.5);
    s.statUp(0.85);
    return s;
  },

  /** Generic melee (impact 0.17 s): a sharp stinger jab, pointed and piercing. */
  fellstinger: () => {
    const s = new MoveSfx(0.8, 0xfe11);
    s.pulse(0.0, 0.17, { freq: (u) => 900 + 600 * u + 80 * Math.sin(2 * Math.PI * 40 * u), gain: env.ramp(0.05, 0.18), duty: 0.125 });
    s.noise(0.17, 0.04, { clock: () => 20000, gain: env.decay(0.3, 1) });
    s.pulse(0.17, 0.1, { freq: (u) => 3200 - 1500 * u, gain: env.decay(0.25, 1.5), duty: 0.125 });
    s.thud(0.18, 0.35, 0.3);
    s.pulse(0.25, 0.4, { freq: env.ramp(600, 400), gain: env.decay(0.16, 1), duty: 0.25 });
    return s;
  },

  /** Generic melee (impact at 0.17 s): a scything slash, a quick double cut with a rising ring. */
  furycutter: () => {
    const s = new MoveSfx(0.75, 0xf0c7);
    s.whoosh(0.0, 0.15, { from: 3000, to: 9000, gain: 0.3 });
    s.slash(0.17, 0.55);
    s.slash(0.26, 0.4);
    s.pulse(0.27, 0.25, { freq: (u) => 1800 + 600 * u, gain: env.decay(0.12, 1.5), duty: 0.125 });
    return s;
  },

  /** Generic self aura (~0.8 s glow + rings): a swarm buzzes in to tend the user, closing with a healing chime. */
  healorder: () => {
    const s = new MoveSfx(1.35, 0x4e0d);
    s.pulse(0.0, 0.8, { freq: (u) => 220 + 30 * Math.sin(2 * Math.PI * 22 * u), gain: env.swell(0.16), duty: 0.125 });
    s.pulse(0.05, 0.75, { freq: (u) => 330 + 40 * Math.sin(2 * Math.PI * 27 * u), gain: env.swell(0.1), duty: 0.25 });
    s.noise(0.0, 0.8, { clock: () => 1800, gain: env.swell(0.08), short: true });
    s.arpeggio(0.75, [72, 76, 79, 84], 0.07, { gain: 0.16, voice: 'wave', hold: 0.18 });
    return s;
  },

  /** Generic projectile (impact 0.43 s): a swarm of tiny bugs buzzes in and keeps crawling over the target. */
  infestation: () => {
    const s = new MoveSfx(1.0, 0x1f57);
    s.noise(0.0, 0.9, { clock: (u) => 2500 + 600 * Math.sin(2 * Math.PI * 14 * u), gain: env.swell(0.2), short: true });
    s.pulse(0.0, 0.9, { freq: (u) => 180 * (1 + 0.08 * Math.sin(2 * Math.PI * 25 * u)), gain: env.swell(0.14), duty: 0.25 });
    s.thud(0.43, 0.35, 0.2);
    for (let i = 0; i < 6; i++) s.pulse(0.45 + i * 0.07, 0.03, { freq: () => 1200 + s.random() * 600, gain: env.decay(0.12, 1), duty: 0.25 });
    return s;
  },

  /**
   * GrassMoveAnimations.playAbsorb in red: the target flashes/shakes at 0 s (the bite),
   * 22 red stars stream to the caster (arrivals 0.9-2.0 s), heal sparkles at ~1.78 s for 0.9 s.
   */
  leechlife: () => {
    const s = new MoveSfx(2.55, 0x1ee1);
    // Bite: a needle-sharp prick with a buzzy whine.
    s.noise(0.0, 0.08, { clock: () => 9000, gain: env.attackDecay(0.45, 0.05), short: true });
    s.pulse(0.0, 0.15, { freq: (u) => 1400 - 600 * u, gain: env.decay(0.25, 1.5), duty: 0.125 });
    // Sucking buzz while blood is drawn out.
    s.pulse(0.1, 1.9, { freq: (u) => (180 + 120 * u) * (1 + 0.05 * Math.sin(2 * Math.PI * 30 * u)), gain: env.swell(0.1), duty: 0.25 });
    s.noise(0.1, 1.9, { clock: env.ramp(3000, 1500), gain: env.swell(0.05) });
    const scale = [74, 77, 79, 82, 86];
    for (let i = 0; i < 18; i++) {
      s.arpeggio(0.92 + i * 0.06, [scale[Math.floor(s.random() * scale.length)]], 0.07, { gain: 0.14, voice: 'wave' });
    }
    s.drain(1.8, 0.2);
    s.sparkle(1.85, 0.5, 5, { gain: 0.1 });
    return s;
  },

  /** Generic melee (impact 0.17 s), 120 BP: a charging horn rams in with a buzzing rush and a heavy, piercing hit. */
  megahorn: () => {
    const s = new MoveSfx(0.85, 0xb06e);
    s.pulse(0.0, 0.18, { freq: (u) => 150 + 250 * u, gain: env.swell(0.18), duty: 0.25 });
    s.noise(0.0, 0.18, { clock: env.ramp(1500, 6000), gain: env.swell(0.25), short: true });
    s.thud(0.17, 0.75, 0.9);
    s.slash(0.17, 0.3);
    s.pulse(0.2, 0.4, { freq: (u) => 180 * (1 + 0.1 * Math.sin(2 * Math.PI * 30 * u)), gain: env.decay(0.14, 1.5), duty: 0.25 });
    return s;
  },

  /** Generic lob, 3 hits (impacts 0.52 / 1.26 / 2.00 s): each pin whistles up and stabs in. */
  pinmissile: () => {
    const s = new MoveSfx(2.3, 0x914d);
    for (let i = 0; i < 3; i++) {
      const at = 0.02 + i * 0.74;
      s.pulse(at, 0.5, { freq: (u) => 1800 + 900 * Math.sin(Math.PI * u), gain: (u) => 0.16 * (1 - 0.4 * u), duty: 0.125 });
      s.pulse(at + 0.5, 0.05, { freq: (u) => 2400 - 1200 * u, gain: env.decay(0.3, 1.5), duty: 0.25 });
      s.thud(at + 0.5, 0.4, 0.25);
      s.noise(at + 0.52, 0.15, { clock: () => 7000, gain: env.decay(0.12, 1.5), short: true });
    }
    return s;
  },

  /** Generic powder (stream 0.76 s, end ≈1.0 s): a cloud of fine, buzzy, explosive dust. */
  powder: () => {
    const s = new MoveSfx(1.15, 0x90d3);
    s.noise(0.0, 0.85, { clock: (u) => 9000 - 3000 * u, gain: env.swell(0.25) });
    s.noise(0.02, 0.8, { clock: () => 2500, gain: env.swell(0.12), short: true });
    s.sparkle(0.05, 0.7, 8, { lo: 3000, hi: 6000, gain: 0.12 });
    s.noise(0.76, 0.3, { clock: (u) => 2500 - 1500 * u, gain: env.attackDecay(0.28, 0.1) });
    return s;
  },

  /** Generic self aura (~0.8 s) + stat-up fleck (0.85 s): a light, fluttering wing dance. */
  quiverdance: () => {
    const s = new MoveSfx(1.5, 0xb9d5);
    s.pulse(0.02, 0.8, { freq: (u) => 1200 + 300 * Math.sin(2 * Math.PI * 3 * u), gain: (u) => 0.14 * Math.sin(Math.PI * u) * (0.5 + 0.5 * Math.sin(2 * Math.PI * 30 * u)), duty: 0.125 });
    s.noise(0.02, 0.8, { clock: () => 7000, gain: (u) => 0.1 * Math.sin(Math.PI * u) * (0.5 + 0.5 * Math.sin(2 * Math.PI * 24 * u)) });
    s.arpeggio(0.1, [81, 84, 88, 84, 81, 84], 0.11, { gain: 0.18, voice: 'wave', hold: 0.14 });
    s.statUp(0.85);
    return s;
  },

  /** Generic self aura (~0.8 s): a puff of irritating powder scattered around, with a buzz. */
  ragepowder: () => {
    const s = new MoveSfx(1.0, 0xb9a9);
    s.noise(0.02, 0.15, { clock: (u) => 2000 + 3000 * u, gain: env.attackDecay(0.3, 0.2) });
    s.noise(0.1, 0.75, { clock: () => 8000, gain: env.swell(0.14) });
    s.pulse(0.1, 0.7, { freq: (u) => 200 * (1 + 0.05 * Math.sin(2 * Math.PI * 20 * u)), gain: env.swell(0.15), duty: 0.25 });
    s.sparkle(0.15, 0.65, 9, { lo: 5000, hi: 8000, gain: 0.12 });
    return s;
  },

  /** Generic beam (grows 0.26 s, holds ~0.25 s, fades to ~0.71 s) + confusion fleck: a flickering, chittering signal of buzzing light. */
  signalbeam: () => {
    const s = new MoveSfx(1.3, 0x51b9);
    s.pulse(0.0, 0.7, { freq: (u) => 900 * (Math.floor(u * 28) % 2 ? 1 : 1.26), gain: env.swell(0.2), duty: 0.25 });
    s.noise(0.0, 0.7, { clock: () => 3500, gain: env.swell(0.14), short: true });
    s.pulse(0.0, 0.7, { freq: (u) => 220 + 60 * Math.sin(2 * Math.PI * 30 * u), gain: env.swell(0.1), duty: 0.5 });
    s.confusion(0.72);
    return s;
  },

  /** Generic projectile (0.43 s), no fleck: a gust of silvery scales - airy wind with fine shimmering glints. */
  silverwind: () => {
    const s = new MoveSfx(0.85, 0x51e0);
    s.whoosh(0.0, 0.5, { from: 2000, to: 7000, gain: 0.32 });
    s.sparkle(0.05, 0.6, 10, { lo: 3500, hi: 6500, gain: 0.14 });
    s.noise(0.43, 0.3, { clock: env.ramp(8000, 2500), gain: env.attackDecay(0.25, 0.1) });
    return s;
  },

  /** Generic target aura (~0.8 s): a sticky web is spun round the target, thread by thread. */
  spiderweb: () => {
    const s = new MoveSfx(1.0, 0x5d1e);
    for (let i = 0; i < 6; i++) {
      const at = 0.02 + i * 0.12;
      s.pulse(at, 0.1, { freq: (u) => 1400 + 800 * u, gain: env.decay(0.18, 1), duty: 0.125 });
      s.noise(at, 0.08, { clock: () => 6000, gain: env.swell(0.12) });
    }
    s.wave(0.72, 0.25, { freq: env.ramp(500, 350), gain: env.decay(0.25, 1.2) });
    return s;
  },

  /** Generic melee (impact 0.17 s) + flinch fleck (~0.5 s): the user rolls over the target with crushing weight. */
  steamroller: () => {
    const s = new MoveSfx(0.75, 0x57ea0);
    s.rumble(0.0, 0.2, { from: 200, to: 500, gain: 0.3 });
    s.thud(0.17, 0.75, 1);
    s.rumble(0.18, 0.3, { from: 400, to: 120, gain: 0.3 });
    s.flinch(0.5);
    return s;
  },

  /** Generic target aura (~0.8 s, foe side): sticky threads are strung out with twangy plucks. */
  stickyweb: () => {
    const s = new MoveSfx(1.0, 0x571c);
    for (const [at, f] of [[0.02, 520], [0.2, 620], [0.38, 470], [0.56, 580]]) {
      s.pulse(at, 0.16, { freq: (u) => f * (1 - 0.25 * u), gain: env.decay(0.26, 1.5), duty: 0.125 });
      s.noise(at, 0.1, { clock: () => 3000, gain: env.decay(0.12, 1) });
    }
    s.wave(0.6, 0.35, { freq: (u) => 300 * (1 + 0.04 * Math.sin(2 * Math.PI * 14 * u)), gain: env.decay(0.2, 1) });
    return s;
  },

  /** Generic self aura (~0.8 s) + stat-down fleck (~0.85 s): silk shoots out in buzzy spurts. */
  stringshot: () => {
    const s = new MoveSfx(1.4, 0x5751);
    for (let i = 0; i < 6; i++) {
      const at = 0.02 + i * 0.12;
      s.noise(at, 0.09, { clock: env.ramp(4000, 7000), gain: env.attackDecay(0.22, 0.2), short: true });
      s.pulse(at, 0.08, { freq: (u) => 900 + 500 * u, gain: env.decay(0.12, 1), duty: 0.125 });
    }
    s.statDown(0.85, 0.24);
    return s;
  },

  /** Generic field (shake + waves ~0.6 s) + stat-down fleck: a frantic swarm of chittering buzz. */
  strugglebug: () => {
    const s = new MoveSfx(1.25, 0x5b06);
    s.noise(0.0, 0.65, { clock: (u) => 2500 + 1500 * Math.sin(2 * Math.PI * 9 * u), gain: env.swell(0.32), short: true });
    s.pulse(0.0, 0.6, { freq: (u) => 260 + 40 * Math.sin(2 * Math.PI * 22 * u), gain: env.swell(0.2), duty: 0.25 });
    for (let i = 0; i < 6; i++) s.noise(0.08 + i * 0.09, 0.03, { clock: () => 9000, gain: env.decay(0.18, 1) });
    s.statDown(0.68, 0.22);
    return s;
  },

  /** Generic self aura (~0.8 s) + stat-up fleck (~0.85 s): the tail glows - a shimmering, swelling buzz of light, then a big rise. */
  tailglow: () => {
    const s = new MoveSfx(1.5, 0x7a61);
    s.chord(0.02, 0.8, [76, 83, 88], { rate: 0.03, gain: 0.16, voice: 'pulse' });
    s.wave(0.02, 0.8, { freq: (u) => 330 * Math.pow(2, u) * (1 + 0.02 * Math.sin(2 * Math.PI * 30 * u)), gain: env.swell(0.18) });
    s.noise(0.02, 0.8, { clock: () => 3500, gain: (u) => 0.06 * Math.sin(Math.PI * u), short: true });
    s.sparkle(0.3, 0.5, 6, { lo: 3500, hi: 6000, gain: 0.14 });
    s.statUp(0.85);
    return s;
  },

  /** Generic projectile, 2 hits (impacts 0.43 / 1.0 s) + poison fleck (~1.12 s): two stingers whine in and prick. */
  twineedle: () => {
    const s = new MoveSfx(1.6, 0x2e7d);
    for (const at of [0.43, 1.0]) {
      s.pulse(at - 0.36, 0.36, { freq: (u) => 1800 + 1600 * u, gain: (u) => 0.1 * (0.5 + 0.5 * u), duty: 0.125 });
      s.noise(at - 0.3, 0.3, { clock: () => 6500, gain: env.ramp(0.03, 0.1), short: true });
      s.pulse(at, 0.04, { freq: () => 3200, gain: env.decay(0.3, 1.5), duty: 0.25 });
      s.thud(at, 0.35, 0.15);
    }
    s.poison(1.12);
    return s;
  },

  /** Generic melee (impact 0.17 s): a buzzing dive-in hit, then the user zips back out. */
  uturn: () => {
    const s = new MoveSfx(0.85, 0x07a2);
    s.noise(0.0, 0.17, { clock: env.ramp(3000, 7000), gain: env.ramp(0.08, 0.25), short: true });
    s.whoosh(0.0, 0.17, { from: 2000, to: 7000, gain: 0.2 });
    s.thud(0.17, 0.6, 0.5);
    s.whoosh(0.3, 0.35, { from: 8000, to: 2000, gain: 0.22 });
    s.pulse(0.3, 0.3, { freq: (u) => 600 + 900 * u, gain: env.swell(0.1), duty: 0.125 });
    return s;
  },

  /** Generic melee (impact 0.17 s): two crossed blades scissor through the target - an X of quick cuts. */
  xscissor: () => {
    const s = new MoveSfx(0.7, 0x3fb9);
    s.whoosh(0.0, 0.15, { from: 2500, to: 9000, gain: 0.3 });
    s.slash(0.13, 0.45);
    s.slash(0.19, 0.5);
    s.thud(0.19, 0.35, 0.3);
    s.noise(0.25, 0.12, { clock: () => 7000, gain: env.decay(0.1, 1.5), short: true });
    return s;
  },
};
