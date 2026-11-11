import { MoveSfx } from '../move-sfx.mjs';
import { env } from '../track.mjs';

/** Grass-type move sounds: soft, airy, chiming. */
export const GRASS = {
  /**
   * GrassMoveAnimations.playAbsorb: 22 stars leave the target over 1.1 s and
   * float 0.9 s to the caster (arrivals 0.9-2.0 s).
   */
  absorb: () => {
    const s = new MoveSfx(2.15, 0xab50);
    // Soft suction that rises while energy is drawn out.
    s.wave(0.05, 1.95, { freq: env.ramp(260, 520), gain: env.swell(0.14) });
    s.noise(0.05, 1.95, { clock: env.ramp(3000, 1400), gain: env.swell(0.06) });
    // Each star chimes as it reaches the caster.
    const scale = [76, 79, 81, 84, 86, 88];
    for (let i = 0; i < 22; i++) {
      const note = scale[Math.floor(s.random() * scale.length)];
      s.arpeggio(0.92 + i * 0.05, [note], 0.07, { gain: 0.17, voice: 'wave' });
    }
    return s;
  },

  /** Custom (petals drift from ~0.1 s, green rings round the caster from ~0.55 s, ~1.6 s): a calming scent. */
  aromatherapy: () => {
    const s = new MoveSfx(1.5, 0xa307);
    s.noise(0.02, 1.0, { clock: () => 2200, gain: env.swell(0.07) });
    s.arpeggio(0.05, [72, 76, 79, 83, 84, 88], 0.12, { gain: 0.24, voice: 'wave', hold: 0.35 });
    s.sparkle(0.5, 0.7, 6, { gain: 0.12 });
    return s;
  },

  /** Generic lob, 3 hits (impacts at 0.52 / 1.26 / 2.0 s): seeds are spat in arcs. */
  bulletseed: () => {
    const s = new MoveSfx(2.45, 0xb5ee);
    for (let hit = 0; hit < 3; hit++) {
      const at = hit * 0.74;
      s.pulse(at, 0.05, { freq: (u) => 700 + 600 * u, gain: env.decay(0.25, 1), duty: 0.25 });
      s.pulse(at + 0.03, 0.48, { freq: (u) => 1300 - 700 * u, gain: (u) => 0.08 * (1 - 0.5 * u), duty: 0.125 });
      s.thud(at + 0.52, 0.5, 0.2);
    }
    return s;
  },

  /** Generic self aura + stat-up fleck: fluffy cotton wraps around the body. */
  cottonguard: () => {
    const s = new MoveSfx(1.5, 0xc07b);
    for (const at of [0.03, 0.2, 0.37, 0.54]) {
      s.noise(at, 0.18, { clock: () => 900, gain: env.swell(0.2) });
      s.wave(at, 0.18, { freq: () => 523 + at * 400, gain: env.swell(0.12) });
    }
    s.statUp(0.85);
    return s;
  },

  /** Generic self aura + Speed drop fleck: cotton spores drift down over the foes. */
  cottonspore: () => {
    const s = new MoveSfx(1.5, 0xc075);
    s.noise(0.02, 0.8, { clock: () => 3000, gain: env.swell(0.12) });
    s.sparkle(0.05, 0.75, 10, { lo: 1800, hi: 3200, gain: 0.12 });
    s.wave(0.05, 0.75, { freq: env.ramp(900, 500), gain: env.swell(0.12) });
    s.statDown(0.85);
    return s;
  },

  /** Custom (dim 0-0.25 s, green aura 0.25-0.75 s, ball flies 0.75-1.1 s, bursts into bubbles 1.1 s, sparkles to ~1.85 s): a humming charge, a flying ball, a bubbly pop. */
  energyball: () => {
    const s = new MoveSfx(2.25, 0xeba1);
    s.wave(0.25, 0.5, { freq: (u) => 520 * (1 + 0.05 * Math.sin(2 * Math.PI * 9 * u)), gain: env.swell(0.25) });
    s.pulse(0.25, 0.5, { freq: () => 1040, gain: env.swell(0.05), duty: 0.25 });
    s.wave(0.75, 0.35, { freq: (u) => 600 + 300 * u, gain: env.ramp(0.12, 0.22) });
    s.noise(1.1, 0.3, { clock: (u) => 8000 - 5000 * u, gain: env.attackDecay(0.35, 0.04) });
    s.thud(1.1, 0.45, 0.4);
    s.bubbles(1.15, 0.5, 6, { lo: 500, hi: 1200, gain: 0.2 });
    s.sparkle(1.2, 0.6, 6, { lo: 1800, hi: 3200, gain: 0.12 });
    return s;
  },

  /** Generic target aura (~0.8 s, fleck at ~0.6 s): an eerie forest curse - rustling leaves and a creeping, wobbly minor tone. */
  forestscurse: () => {
    const s = new MoveSfx(1.2, 0xf0c5);
    s.noise(0.0, 0.7, { clock: (u) => 2500 + 1500 * Math.sin(2 * Math.PI * 3 * u), gain: env.swell(0.18) });
    s.wave(0.0, 0.75, { freq: (u) => 311 * (1 + 0.04 * Math.sin(2 * Math.PI * 6 * u)), gain: env.swell(0.2) });
    s.wave(0.05, 0.7, { freq: (u) => 370 * (1 + 0.04 * Math.sin(2 * Math.PI * 5 * u)), gain: env.swell(0.15) });
    s.arpeggio(0.6, [67, 66, 63, 62], 0.1, { gain: 0.2, voice: 'wave', hold: 0.14 });
    return s;
  },

  /**
   * GrassMoveAnimations.playFrenzyPlant: dark (0-0.28 s), a green glade with
   * rising leaves (from 0.28 s), roots grow to the target (0.9-1.45 s) and
   * strike it (1.45 s); all clears ~2.0-2.35 s.
   */
  frenzyplant: () => {
    const s = new MoveSfx(2.5, 0xf2e9);
    s.wave(0.28, 0.6, { freq: (u) => 300 + 250 * u, gain: env.swell(0.12) });
    s.noise(0.28, 1.6, { clock: () => 3000, gain: env.swell(0.1) });
    s.sparkle(0.35, 0.5, 6, { lo: 2600, hi: 5000, gain: 0.12 });
    s.rumble(0.9, 0.55, { from: 180, to: 420, gain: 0.35 });
    s.noise(0.9, 0.55, { clock: (u) => 1500 + 3500 * u, gain: env.ramp(0.05, 0.25) });
    s.thud(1.45, 0.85, 0.9);
    s.slash(1.5, 0.3);
    s.noise(1.45, 0.5, { clock: () => 3500, gain: env.decay(0.2, 2) });
    s.arpeggio(1.6, [67, 71, 74], 0.07, { gain: 0.14, voice: 'wave' });
    return s;
  },

  /** Generic projectile (impact 0.43 s) + drain (≈0.75 s): a big green orb strikes, then life flows back. */
  gigadrain: () => {
    const s = new MoveSfx(1.4, 0x61ad);
    s.wave(0.0, 0.43, { freq: env.ramp(500, 900), gain: env.swell(0.14) });
    s.noise(0.0, 0.43, { clock: env.ramp(2000, 4500), gain: env.swell(0.08) });
    s.thud(0.43, 0.3, 0.3);
    s.noise(0.43, 0.25, { clock: () => 3500, gain: env.decay(0.2, 1.5) });
    s.drain(0.72, 0.26);
    return s;
  },

  /** Custom (grass loop rises and tightens 0-0.5 s, trip 0.5 s, leaves flutter to ~1.55 s): rustling grass snaps tight and trips the foe. */
  grassknot: () => {
    const s = new MoveSfx(1.65, 0x6a5c);
    s.noise(0.0, 0.5, { clock: env.ramp(1500, 4000), gain: env.swell(0.14) });
    s.pulse(0.38, 0.12, { freq: (u) => 600 + 900 * u, gain: env.decay(0.2, 1), duty: 0.25 });
    s.noise(0.49, 0.05, { clock: () => 12000, gain: env.decay(0.3, 1) });
    s.thud(0.5, 0.6, 0.6);
    s.noise(0.55, 1.0, { clock: (u) => 3500 - 1500 * u, gain: env.decay(0.12, 2) });
    return s;
  },

  /** Generic projectile (impact 0.43 s): a column of leafy energy surges at the foe. */
  grasspledge: () => {
    const s = new MoveSfx(0.95, 0x6a91);
    s.whoosh(0.0, 0.45, { from: 1200, to: 5000, gain: 0.22 });
    s.chord(0.0, 0.43, [67, 71, 74], { rate: 0.03, gain: 0.12 });
    s.thud(0.43, 0.45, 0.35);
    s.noise(0.43, 0.35, { clock: (u) => 5000 - 3000 * u, gain: env.attackDecay(0.22, 0.05) });
    s.sparkle(0.45, 0.3, 4, { lo: 1800, hi: 3200, gain: 0.12 });
    return s;
  },

  /** Generic target aura (~0.8 s) + sleep fleck (≈0.6 s): a soft leaf-whistle tune lulls the foe. */
  grasswhistle: () => {
    const s = new MoveSfx(1.5, 0x6a55);
    const notes = [84, 81, 84, 86, 84];
    notes.forEach((n, i) => {
      const f = 440 * Math.pow(2, (n - 69) / 12);
      s.wave(i * 0.11, 0.13, { freq: (u) => f * (1 + 0.012 * Math.sin(2 * Math.PI * 14 * u)), gain: env.swell(0.2) });
    });
    s.noise(0.0, 0.55, { clock: () => 6000, gain: env.swell(0.04) });
    s.sleep(0.6, 0.22);
    return s;
  },

  /** Generic target aura (~0.8 s) on the whole field: grass sprouts everywhere with a fresh, rising chime. */
  grassyterrain: () => {
    const s = new MoveSfx(1.35, 0x6a77);
    s.noise(0.0, 0.9, { clock: env.ramp(1200, 3500), gain: env.swell(0.12) });
    s.arpeggio(0.03, [67, 71, 74, 79, 83, 86], 0.1, { gain: 0.2, voice: 'wave', hold: 0.3 });
    s.sparkle(0.35, 0.6, 7, { lo: 2000, hi: 3600, gain: 0.1 });
    return s;
  },

  /** Generic melee (impact 0.17 s) + drain (~0.45 s): a horn stab, then life flows back to the user. */
  hornleech: () => {
    const s = new MoveSfx(1.0, 0x41ee);
    s.whoosh(0.0, 0.17, { from: 2000, to: 6000, gain: 0.3 });
    s.pulse(0.15, 0.08, { freq: (u) => 1600 - 800 * u, gain: env.decay(0.22, 1.5), duty: 0.125 });
    s.thud(0.17, 0.6, 0.5);
    s.drain(0.45, 0.22);
    return s;
  },

  /** Generic self aura (~0.8 s, no fleck): roots creep into the ground with a soft rustle and a deep, settling chime. */
  ingrain: () => {
    const s = new MoveSfx(1.15, 0x169a);
    s.noise(0.0, 0.8, { clock: (u) => 2500 - 1500 * u, gain: env.swell(0.16) });
    s.arpeggio(0.05, [67, 64, 60, 55], 0.14, { gain: 0.2, voice: 'wave', hold: 0.2 });
    s.wave(0.65, 0.45, { freq: () => 98, gain: env.decay(0.25, 1.5) });
    return s;
  },

  /**
   * GrassMoveAnimations.playLeafBlade: four blade cuts (land 0.1 / 0.24 /
   * 0.38 / 0.52 s), then leaves fly in and land (0.7-1.15 s, hit ~1.08 s).
   */
  leafblade: () => {
    const s = new MoveSfx(1.4, 0x1eaf);
    for (let i = 0; i < 4; i++) {
      const at = i * 0.14;
      s.whoosh(at, 0.1, { from: 3000, to: 11000, gain: 0.25 });
      s.slash(at + 0.1, 0.5);
      s.wave(at + 0.1, 0.15, { freq: () => 1319 + i * 110, gain: env.decay(0.1, 2) });
    }
    s.noise(0.7, 0.4, { clock: (u) => 2500 + 2500 * u, gain: env.ramp(0.05, 0.2) });
    s.thud(1.08, 0.35, 0.2);
    s.noise(1.08, 0.25, { clock: () => 3500, gain: env.decay(0.16, 1.5) });
    return s;
  },

  /** Custom (green sky 0-0.25 s, leaf storm 0.25-1.43 s with a burst on the target at 0.85 s, clears to 1.68 s, Sp. Atk-drop bubbles 1.68-2.58 s): a roaring rush of leaves, a leafy burst, then a sinking tone. */
  leafstorm: () => {
    const s = new MoveSfx(2.7, 0x1e57);
    s.noise(0.25, 1.15, { clock: (u) => 2500 + 2500 * Math.sin(Math.PI * u) + 600 * Math.sin(2 * Math.PI * 14 * u), gain: env.swell(0.38) });
    s.sparkle(0.3, 1.0, 14, { lo: 1500, hi: 3000, gain: 0.12 });
    s.thud(0.85, 0.6, 0.6);
    s.noise(0.85, 0.4, { clock: (u) => 7000 - 4500 * u, gain: env.attackDecay(0.35, 0.04) });
    s.arpeggio(0.88, [76, 72, 67], 0.06, { gain: 0.14, voice: 'wave', hold: 0.12 });
    s.pulse(1.68, 0.8, { freq: (u) => 523 * Math.pow(0.5, u), gain: env.decay(0.14, 1.2), duty: 0.5 });
    s.bubbles(1.72, 0.75, 6, { lo: 700, hi: 300, gain: 0.1 });
    return s;
  },

  /** Generic projectile (impact 0.43 s) + accuracy-down fleck (~0.55 s): a whirling column of leaves - a swirling wind and wobbling tone. */
  leaftornado: () => {
    const s = new MoveSfx(1.15, 0x1e70);
    s.noise(0.0, 0.48, { clock: (u) => 1800 + 1400 * Math.sin(2 * Math.PI * 5 * u), gain: env.swell(0.3) });
    s.wave(0.0, 0.45, { freq: (u) => 600 + 250 * Math.sin(2 * Math.PI * 5 * u), gain: env.swell(0.14) });
    s.thud(0.43, 0.45, 0.3);
    s.sparkle(0.43, 0.15, 3, { lo: 1800, hi: 3000, gain: 0.12 });
    s.statDown(0.55, 0.22);
    return s;
  },

  /**
   * GrassMoveAnimations.playLeechSeed: 3 seeds tossed 0.13 s apart in a 0.7 s arc
   * (landing 0.70 / 0.83 / 0.96 s), each sprouting a swaying shoot for 1.1 s (ends ~2.06 s).
   */
  leechseed: () => {
    const s = new MoveSfx(2.2, 0x1ee5);
    for (let i = 0; i < 3; i++) {
      const at = i * 0.13;
      s.pulse(at, 0.05, { freq: (u) => 600 + 500 * u, gain: env.decay(0.22, 1), duty: 0.25 });
      s.pulse(at + 0.04, 0.62, { freq: (u) => 900 + 500 * Math.sin(Math.PI * u), gain: (u) => 0.05 * (1 - 0.6 * u), duty: 0.125 });
      s.noise(at + 0.7, 0.05, { clock: () => 3000, gain: env.decay(0.3, 1) });
      // Sprout pops up with a rising chime, then sways.
      s.wave(at + 0.72, 0.18, { freq: (u) => 500 + 500 * u, gain: env.decay(0.2, 0.8) });
    }
    s.wave(0.98, 1.0, { freq: (u) => 660 * (1 + 0.04 * Math.sin(2 * Math.PI * 3 * u)), gain: (u) => 0.12 * Math.min(1, u * 6) * Math.pow(1 - u, 1.3) });
    s.noise(0.95, 1.0, { clock: () => 2600, gain: (u) => 0.06 * Math.min(1, u * 6) * Math.pow(1 - u, 1.5) });
    s.arpeggio(1.3, [76, 79, 74, 77], 0.16, { gain: 0.1, voice: 'wave', hold: 0.2 });
    return s;
  },

  /** Generic projectile (impact 0.43 s): glowing leaves flutter after the foe with soft chimes and strike home. */
  magicalleaf: () => {
    const s = new MoveSfx(0.95, 0x3a91);
    s.noise(0.0, 0.43, { clock: (u) => 3000 + 1500 * Math.sin(2 * Math.PI * 7 * u), gain: env.swell(0.14) });
    s.arpeggio(0.0, [84, 88, 91, 88, 93, 96], 0.07, { gain: 0.16, voice: 'wave', hold: 0.1 });
    s.slash(0.43, 0.35);
    s.thud(0.43, 0.35, 0.2);
    s.sparkle(0.45, 0.3, 5, { lo: 3000, hi: 5500, gain: 0.12 });
    return s;
  },

  /** Generic projectile (impact 0.43 s) + drain (energy flows back ≈ 0.75 s): a green seed hits, then a rising sap-like run returns. */
  megadrain: () => {
    const s = new MoveSfx(1.4, 0x3e6d);
    s.whoosh(0.0, 0.43, { from: 2000, to: 6000, gain: 0.25 });
    s.pulse(0.0, 0.43, { freq: (u) => 700 + 400 * u, gain: env.swell(0.1), duty: 0.25 });
    s.thud(0.43, 0.4, 0.3);
    s.noise(0.43, 0.3, { clock: () => 3500, gain: env.decay(0.15, 1) });
    s.drain(0.72, 0.24);
    s.chord(0.72, 0.5, [72, 79], { rate: 0.05, gain: 0.1 });
    return s;
  },

  /** Generic melee hit (impact 0.17 s) + flinch fleck (~0.45 s): a thorny arm swings, spiky prickles crackle on impact. */
  needlearm: () => {
    const s = new MoveSfx(0.8, 0x2ee7);
    s.whoosh(0.0, 0.18, { from: 1500, to: 5000, gain: 0.3 });
    s.thud(0.17, 0.55, 0.5);
    for (const at of [0.18, 0.22, 0.26, 0.3]) s.pulse(at, 0.025, { freq: () => 3800, gain: env.decay(0.18, 1), duty: 0.125 });
    s.noise(0.2, 0.15, { clock: () => 11000, gain: env.decay(0.12, 1) });
    s.flinch(0.45);
    return s;
  },

  /**
   * Custom (2.2 s): the scene dims (0-0.35 s), a petal storm rushes across the
   * field (0.2-1.9 s), the green sphere swells on the target and bursts at
   * ~1.15 s, then the wind dies down (to 2.2 s).
   */
  petalblizzard: () => {
    const s = new MoveSfx(2.35, 0x9e7b);
    s.noise(0.15, 1.85, { clock: (u) => 2500 + 2500 * Math.sin(Math.PI * u), gain: (u) => 0.32 * Math.min(1, u * 5) * Math.pow(1 - u, 0.6) });
    s.noise(0.15, 1.7, { clock: () => 800, gain: (u) => 0.2 * Math.sin(Math.PI * u) });
    s.sparkle(0.3, 1.5, 16, { lo: 1800, hi: 3600, gain: 0.13 });
    s.wave(0.9, 0.25, { freq: env.ramp(400, 900), gain: env.swell(0.14) });
    s.thud(1.15, 0.4, 0.4);
    s.sparkle(1.15, 0.4, 5, { lo: 3500, hi: 6000, gain: 0.14 });
    return s;
  },

  /**
   * GrassMoveAnimations.playPetalDance (2.6 s): petals whirl up around the dancing
   * caster (0-1.0 s), sweep over (1.0-1.35 s), then swirl round the buffeted
   * target (5 shakes every 0.26 s from 1.35 s) and scatter.
   */
  petaldance: () => {
    const s = new MoveSfx(2.85, 0x9da5);
    s.arpeggio(0.02, [72, 76, 79, 84, 79, 76, 72, 76], 0.12, { gain: 0.18, voice: 'wave', hold: 0.16 });
    s.noise(0.02, 1.0, { clock: (u) => 2000 + 2500 * u, gain: env.swell(0.2) });
    s.whoosh(0.98, 0.37, { from: 2500, to: 7000, gain: 0.3 });
    s.noise(1.3, 1.35, { clock: (u) => 3500 + 1500 * Math.sin(2 * Math.PI * 3 * u), gain: (u) => 0.22 * Math.min(1, u * 8) * Math.pow(1 - u, 0.8) });
    for (let k = 0; k < 5; k++) {
      s.thud(1.35 + k * 0.26, 0.35, 0.3);
      s.sparkle(1.38 + k * 0.26, 0.15, 2, { lo: 2000, hi: 3500, gain: 0.12 });
    }
    return s;
  },

  /** Custom (dark 0-0.2 s, vine swings down 0.15-0.45 s, crack on the hit at 0.4 s, green ray backdrop 0.45-1.15 s, fades to 1.4 s): a vine swishes down and cracks like a heavy whip, then a rushing flare. */
  powerwhip: () => {
    const s = new MoveSfx(1.55, 0x90e1);
    s.whoosh(0.15, 0.25, { from: 1200, to: 9000, gain: 0.3 });
    s.noise(0.4, 0.06, { clock: () => 20000, gain: env.decay(0.35, 1) });
    s.slash(0.4, 0.4);
    s.thud(0.41, 0.5, 0.6);
    s.noise(0.45, 0.75, { clock: (u) => 3000 - 1500 * u, gain: env.swell(0.2) });
    s.chord(0.5, 0.6, [64, 71, 76], { rate: 0.02, gain: 0.08 });
    return s;
  },

  /** Generic field (~0.6 s, hits all foes at once): a flurry of sharp leaves whirling and cutting. */
  razorleaf: () => {
    const s = new MoveSfx(0.8, 0x7a1f);
    s.noise(0.0, 0.6, { clock: (u) => 4000 + 2000 * Math.sin(2 * Math.PI * 3 * u), gain: env.swell(0.15) });
    for (let i = 0; i < 6; i++) {
      const at = 0.04 + i * 0.09;
      s.noise(at, 0.06, { clock: (u) => 15000 - 6000 * u, gain: env.attackDecay(0.32, 0.2) });
      s.pulse(at, 0.05, { freq: (u) => (1800 + 200 * (i % 3)) * (1 - 0.4 * u), gain: env.decay(0.14, 1.5), duty: 0.125 });
    }
    return s;
  },

  /** Custom (five seeds lobbed 0-0.48 s, 0.12 s apart; fiery bursts on landing 0.5-0.98 s; clouds fade to ~1.8 s): seeds whistle over and pop in a run of woody blasts. */
  seedbomb: () => {
    const s = new MoveSfx(1.85, 0x5eb0);
    for (let i = 0; i < 5; i++) {
      const at = 0.5 + i * 0.12;
      s.pulse(at - 0.5, 0.5, { freq: (u) => 500 + 500 * Math.sin(Math.PI * u), gain: env.ramp(0.05, 0.1), duty: 0.25 });
      s.thud(at, 0.55 - i * 0.04, 0.6);
      s.noise(at, 0.25, { clock: env.ramp(5000, 1500), gain: env.attackDecay(0.32, 0.05) });
    }
    for (let i = 0; i < 4; i++) s.noise(1.1 + i * 0.08, 0.03, { clock: () => 4000 + s.random() * 2000, gain: env.decay(0.14, 1) });
    return s;
  },

  /** Custom (pale 0-0.3 s, cyan sparks gather 0.3-0.9 s, beams shoot up 0.9-1.4 s, flare on the target 1.35 s, to ~1.9 s, clears to 2.15 s): light gathers, beams soar up and a bright flowering shockwave bursts. */
  seedflare: () => {
    const s = new MoveSfx(2.35, 0x5ef1);
    s.sparkle(0.3, 0.6, 8, { lo: 2500, hi: 4500, gain: 0.12 });
    s.wave(0.3, 0.6, { freq: (u) => 400 + 400 * u, gain: env.ramp(0.05, 0.18) });
    s.whoosh(0.9, 0.45, { from: 1500, to: 8000, gain: 0.22 });
    s.wave(0.9, 0.45, { freq: (u) => 800 + 1200 * u, gain: env.attackDecay(0.16, 0.2) });
    s.thud(1.35, 0.7, 0.8);
    s.noise(1.35, 0.45, { clock: env.ramp(6000, 800), gain: env.attackDecay(0.4, 0.05) });
    s.chord(1.38, 0.45, [72, 76, 79], { rate: 0.03, gain: 0.16 });
    return s;
  },

  /**
   * GrassMoveAnimations.playSleepPowder: green powder drifts down (0-1.9 s, flash
   * at 0.7 s), then FxEffects.sleepZs - four Zs float up 0.28 s apart (from 1.9 s).
   */
  sleeppowder: () => {
    const s = new MoveSfx(3.2, 0x5ee9);
    s.noise(0.02, 1.85, { clock: () => 2500, gain: env.swell(0.1) });
    s.sparkle(0.05, 1.7, 16, { lo: 1600, hi: 3000, gain: 0.12 });
    s.wave(0.05, 1.8, { freq: (u) => 700 - 250 * u + 30 * Math.sin(2 * Math.PI * 6 * u), gain: env.swell(0.12) });
    [79, 76, 72, 67].forEach((n, i) => s.arpeggio(1.9 + i * 0.28, [n], 0.28, { gain: 0.24, voice: 'wave', hold: 0.4 }));
    return s;
  },

  /**
   * CHARGE, plays on both turns. Turn 1 playSolarBeamCharge: dark, sun motes float
   * in (~0.3-2.0 s). Turn 2 playSolarBeam: the column of light drops (0.18 s), pulses
   * and thins out (to ~0.93 s), the ground glow fades by ~1.1 s. A rising shimmer, a
   * blazing roar and a long, sunny afterglow.
   */
  solarbeam: () => {
    const s = new MoveSfx(1.5, 0x501a);
    s.wave(0.0, 0.2, { freq: (u) => 600 + 1200 * u, gain: env.ramp(0.08, 0.22) });
    s.noise(0.18, 0.8, { clock: (u) => 7000 + 2000 * Math.sin(2 * Math.PI * 4 * u), gain: (u) => 0.3 * Math.min(1, u * 10) * Math.pow(1 - u, 0.8) });
    s.chord(0.18, 0.85, [76, 81, 84, 88], { rate: 0.03, gain: 0.2, voice: 'pulse' });
    s.thud(0.18, 0.4, 0.8);
    s.chord(0.7, 0.75, [84, 88, 91], { rate: 0.05, gain: 0.12 });
    s.sparkle(0.8, 0.55, 7, { lo: 3000, hi: 6000, gain: 0.1 });
    return s;
  },

  /**
   * Custom (1.3 s): the user turns green and the ring opens with a rising tone
   * (0-0.35 s), the spike cone bursts out with sharp crackles (0.3-0.6 s), then
   * it bristles and fades with a bright ping (to 1.3 s).
   */
  spikyshield: () => {
    const s = new MoveSfx(1.45, 0x5b5d);
    s.wave(0.0, 0.4, { freq: env.ramp(400, 800), gain: env.swell(0.2) });
    s.whoosh(0.3, 0.25, { from: 3000, to: 8000, gain: 0.3 });
    for (let i = 0; i < 7; i++) s.noise(0.3 + i * 0.045, 0.04, { clock: () => 12000, gain: env.decay(0.28, 1), short: true });
    s.pulse(0.65, 0.4, { freq: () => 1046, gain: env.decay(0.16, 1.5), duty: 0.125 });
    s.sparkle(0.7, 0.5, 3, { lo: 3000, hi: 5000, gain: 0.08 });
    return s;
  },

  /**
   * GrassMoveAnimations.playSpore: orange and green spores drift down (0-1.9 s,
   * flash at 0.7 s), then FxEffects.sleepZs - four Zs float up 0.28 s apart (from 1.9 s).
   * An earthy puff of spores, then a lullaby.
   */
  spore: () => {
    const s = new MoveSfx(3.2, 0x5907);
    s.noise(0.0, 0.12, { clock: env.ramp(3000, 1200), gain: env.attackDecay(0.28, 0.1) });
    s.noise(0.05, 1.8, { clock: () => 1800, gain: env.swell(0.11) });
    s.sparkle(0.1, 1.7, 14, { lo: 1200, hi: 2600, gain: 0.12 });
    s.wave(0.05, 1.8, { freq: (u) => 520 - 180 * u + 25 * Math.sin(2 * Math.PI * 5 * u), gain: env.swell(0.1) });
    [79, 76, 72, 67].forEach((n, i) => s.arpeggio(1.9 + i * 0.28, [n], 0.28, { gain: 0.24, voice: 'wave', hold: 0.4 }));
    return s;
  },

  /** Generic powder (spores stream 0.76 s, paralysis fleck 0.76 s): fizzy, crackly spores drift down. */
  stunspore: () => {
    const s = new MoveSfx(1.15, 0x5759);
    s.noise(0.0, 0.76, { clock: (u) => 5000 + 2000 * Math.sin(2 * Math.PI * 4 * u), gain: env.swell(0.18) });
    s.sparkle(0.05, 0.65, 10, { lo: 2500, hi: 5000, gain: 0.14 });
    s.paralyze(0.76, 0.26);
    return s;
  },

  /** Generic self aura (~0.8 s): sunlight is soaked up in a soft, rising leafy chime. */
  synthesis: () => {
    const s = new MoveSfx(1.2, 0x5947);
    s.noise(0.0, 0.8, { clock: () => 3500, gain: env.swell(0.1) });
    s.arpeggio(0.05, [67, 72, 76, 79, 84], 0.12, { gain: 0.24, voice: 'wave', hold: 0.25 });
    s.chord(0.6, 0.5, [84, 88, 91], { rate: 0.05, gain: 0.12 });
    s.sparkle(0.6, 0.4, 5, { gain: 0.1 });
    return s;
  },

  /** Generic melee (impact 0.17 s): a thin vine swishes and cracks like a whip. */
  vinewhip: () => {
    const s = new MoveSfx(0.7, 0x01e1);
    s.whoosh(0.0, 0.17, { from: 2000, to: 9000, gain: 0.25 });
    s.noise(0.17, 0.07, { clock: () => 18000, gain: env.attackDecay(0.4, 0.05) });
    s.pulse(0.17, 0.1, { freq: (u) => 2400 - 1500 * u, gain: env.decay(0.25, 1.5), duty: 0.125 });
    s.thud(0.17, 0.35, 0.2);
    s.noise(0.24, 0.3, { clock: () => 3000, gain: env.decay(0.18, 1.5) });
    return s;
  },

  /** Custom (green glow 0 s and 0.15 s, ram 0.3 s, impact 0.5 s, logs and leaves to ~1.35 s, recoil 0.62 s): two leafy shimmers, a heavy wooden crack, rustling debris. */
  woodhammer: () => {
    const s = new MoveSfx(1.5, 0x3f6a);
    s.wave(0.0, 0.12, { freq: () => 660, gain: env.decay(0.12, 1.5) });
    s.wave(0.15, 0.12, { freq: () => 784, gain: env.decay(0.12, 1.5) });
    s.whoosh(0.3, 0.2, { from: 800, to: 3500, gain: 0.3 });
    s.thud(0.5, 0.85, 1);
    s.wave(0.5, 0.25, { freq: (u) => 330 * Math.pow(0.6, u), gain: env.decay(0.35, 1.5) });
    s.noise(0.53, 0.5, { clock: () => 3000, gain: env.decay(0.15, 1.5) });
    s.thud(0.62, 0.3, 0.3);
    return s;
  },

  /** Generic target aura (~0.8 s): a seed bounces onto the target and sprouts with fretful wobbling chimes. */
  worryseed: () => {
    const s = new MoveSfx(1.1, 0x3f5e);
    for (const [at, f] of [[0.05, 900], [0.22, 760], [0.35, 680]]) {
      s.pulse(at, 0.06, { freq: (u) => f * (1 - 0.3 * u), gain: env.decay(0.25, 1), duty: 0.5 });
    }
    s.noise(0.4, 0.4, { clock: () => 5000, gain: env.swell(0.1) });
    s.wave(0.45, 0.5, { freq: (u) => 660 * (1 + 0.06 * Math.sin(2 * Math.PI * 7 * u)), gain: env.swell(0.2) });
    s.arpeggio(0.55, [79, 78, 76], 0.1, { gain: 0.12, duty: 0.25, hold: 0.14 });
    return s;
  },
};
