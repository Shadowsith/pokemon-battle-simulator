import { MoveSfx } from '../move-sfx.mjs';
import { env } from '../track.mjs';

/** Fairy-type move sounds. */
export const FAIRY = {
  /**
   * Custom (2.2 s): a soft airy swell as the pink mist washes over the user
   * (0-1.1 s) with a sweet shimmering chord, twinkles as the sparkles pop
   * (0.7-1.2 s), then the stat-up run as the aura rises (1.15 s).
   */
  aromaticmist: () => {
    const s = new MoveSfx(2.2, 0xa3a5);
    s.noise(0.0, 1.1, { clock: () => 9000, gain: env.swell(0.12) });
    s.chord(0.1, 0.9, [76, 80, 83], { gain: 0.2, vibrato: 0.01 });
    s.sparkle(0.7, 0.5, 6, { lo: 3500, hi: 6000, gain: 0.12 });
    s.statUp(1.15);
    return s;
  },

  /**
   * Custom (2.4 s): a bright two-note twinkle as the eyes catch the light,
   * a ringing shimmer as the white ring flares (0.1-0.8 s), a glittery swish
   * as the glints fly over (0.8-1.2 s), then the stat-down run (1.25 s).
   */
  babydolleyes: () => {
    const s = new MoveSfx(2.4, 0xbade);
    s.arpeggio(0.05, [88, 93], 0.12, { gain: 0.24, voice: 'wave', hold: 0.2 });
    s.pulse(0.2, 0.55, { freq: env.ramp(1200, 1600), gain: env.swell(0.12), duty: 0.5 });
    s.whoosh(0.8, 0.35, { from: 3000, to: 7000, gain: 0.1 });
    s.sparkle(0.8, 0.4, 5, { lo: 3500, hi: 6500, gain: 0.12 });
    s.statDown(1.25);
    return s;
  },

  /** Charm.play (user sways and hearts float up 0-0.95 s, Attack drop 0.95 s on): a cute rising trill with heart blips, then the stat-down. */
  charm: () => {
    const s = new MoveSfx(1.95, 0xc4a7);
    s.wave(0.02, 0.85, { freq: (u) => [784, 1047, 1319][Math.min(2, Math.floor(u * 3))] * (1 + 0.015 * Math.sin(2 * Math.PI * 12 * u)), gain: env.swell(0.3) });
    for (let i = 0; i < 5; i++) s.pulse(0.05 + i * 0.09, 0.08, { freq: () => 2093, gain: env.decay(0.06, 2), duty: 0.5 });
    s.statDown(0.95);
    return s;
  },

  /**
   * Custom (1.6 s): a rising run of glassy blips as the hexagons pop up one
   * after another (0-0.75 s), a ringing shield chord while the wall shines
   * (0.3-1.1 s) and a soft glitter as it fades.
   */
  craftyshield: () => {
    const s = new MoveSfx(1.6, 0xc2af);
    s.arpeggio(0.0, [76, 79, 83, 86, 88, 91, 95], 0.1, { gain: 0.16, voice: 'pulse', duty: 0.25, hold: 0.06 });
    s.chord(0.3, 0.8, [76, 83, 88], { rate: 0.03, gain: 0.18 });
    s.wave(0.3, 0.8, { freq: () => 164.8, gain: env.swell(0.14) });
    s.sparkle(1.0, 0.5, 5, { gain: 0.1 });
    return s;
  },

  /**
   * Custom (2.1 s): a soft airy swell into white (0-0.3 s), a shimmering
   * prismatic chord as the rainbow ring flares (0.3-0.9 s), quick swishes as
   * the streaks fly (0.8-1.25 s), then the dazzling flash at 1.25 s - a bright
   * crash of chimes.
   */
  dazzlinggleam: () => {
    const s = new MoveSfx(2.25, 0xda22);
    s.noise(0.0, 0.3, { clock: () => 5000, gain: env.swell(0.08) });
    s.chord(0.3, 0.6, [79, 83, 86, 91], { rate: 0.03, gain: 0.15, vibrato: 0.01 });
    s.sparkle(0.35, 0.55, 8, { lo: 3500, hi: 6500, gain: 0.13 });
    s.whoosh(0.8, 0.45, { from: 2500, to: 7000, gain: 0.2 });
    s.noise(1.25, 0.35, { clock: (u) => 14000 - 7000 * u, gain: env.attackDecay(0.4, 0.04) });
    s.chord(1.25, 0.7, [88, 91, 96, 100], { rate: 0.02, gain: 0.14 });
    s.sparkle(1.3, 0.5, 8, { lo: 4000, hi: 7500, gain: 0.12 });
    return s;
  },

  /**
   * Custom (1.9 s): a cute rising cry as the user rears up (0-0.35 s), a
   * warbling run of notes as the sound rings roll out (0.35-1.0 s), then three
   * bright pops as they burst on the target (0.97-1.25 s) with glitter.
   */
  disarmingvoice: () => {
    const s = new MoveSfx(1.9, 0xd15a);
    s.pulse(0.0, 0.35, { freq: env.ramp(700, 1400), gain: env.swell(0.26), duty: 0.5 });
    s.arpeggio(0.35, [84, 88, 91, 88, 93], 0.12, { gain: 0.2, voice: 'wave', hold: 0.1 });
    for (const t of [0.97, 1.09, 1.21]) s.noise(t, 0.1, { clock: () => 9000, gain: env.decay(0.22) });
    s.sparkle(1.0, 0.4, 6, { lo: 3500, hi: 6500, gain: 0.12 });
    return s;
  },

  /**
   * Custom (2.3 s): a little smack as the kiss lands at 0.2 s with a
   * twinkle, a gentle rising tone as the white orb floats back (0.6-1.15 s),
   * then the soft drain run as green light rises round the user (1.15 s).
   */
  drainingkiss: () => {
    const s = new MoveSfx(2.3, 0xd2a1);
    s.pulse(0.15, 0.06, { freq: env.ramp(1800, 900), gain: env.decay(0.3), duty: 0.25 });
    s.noise(0.2, 0.06, { clock: () => 10000, gain: env.decay(0.18) });
    s.sparkle(0.25, 0.35, 5, { lo: 3500, hi: 6000, gain: 0.12 });
    s.wave(0.6, 0.55, { freq: env.ramp(520, 880), gain: env.swell(0.16) });
    s.drain(1.15);
    return s;
  },

  /**
   * Custom (2.4 s): rattling chain clinks as the chains slide in (0-0.9 s)
   * with glints (0.3-1.1 s), a swoop as the big padlock drops in (1.15 s) and
   * a heavy click as its shackle snaps shut at 1.55 s.
   */
  fairylock: () => {
    const s = new MoveSfx(2.4, 0xfa10);
    s.sparkle(0.0, 0.9, 14, { lo: 1800, hi: 3200, gain: 0.16 });
    s.noise(0.0, 0.9, { clock: () => 7000, gain: env.swell(0.08), short: true });
    s.sparkle(0.3, 0.8, 6, { lo: 4500, hi: 7500, gain: 0.1 });
    s.pulse(1.15, 0.25, { freq: env.ramp(900, 400), gain: env.swell(0.14), duty: 0.5 });
    s.noise(1.55, 0.06, { clock: () => 12000, gain: env.decay(0.4) });
    s.thud(1.55, 0.35, 0.2);
    s.chord(1.6, 0.4, [79, 83, 86], { rate: 0.03, gain: 0.12 });
    return s;
  },

  /**
   * Custom (1.5 s): three airy gusts sweep across (0, 0.15, 0.3 s), a
   * glittery swirl round the target (0.55-1.3 s) with two soft buffets at
   * 0.63 s and 0.83 s.
   */
  fairywind: () => {
    const s = new MoveSfx(1.5, 0xfa1d);
    for (const t of [0.0, 0.15, 0.3]) s.whoosh(t, 0.8, { from: 1200, to: 5000, gain: 0.16 });
    s.sparkle(0.55, 0.7, 7, { lo: 3500, hi: 6500, gain: 0.12 });
    for (const t of [0.63, 0.83]) s.noise(t, 0.1, { clock: () => 3000, gain: env.decay(0.2) });
    return s;
  },

  /**
   * Custom (2.0 s): a swirling wind as the magenta whirl circles the field
   * (0-1.5 s), rustling petal glitter (0.1-1.4 s) and a warm floral chord as
   * the Pokémon glow pink (0.5-1.5 s).
   */
  flowershield: () => {
    const s = new MoveSfx(2.0, 0xf10d);
    s.noise(0.0, 1.5, { clock: (u) => 2500 + 2000 * Math.sin(u * 9), gain: env.swell(0.16) });
    s.sparkle(0.1, 1.3, 12, { lo: 2500, hi: 5000, gain: 0.1 });
    s.chord(0.5, 1.0, [72, 76, 79, 84], { rate: 0.04, gain: 0.16, vibrato: 0.01 });
    return s;
  },

  /**
   * Two-turn move, custom; the same clip plays on both turns. Turn 1 (1.65 s):
   * darkness, light pillars and swirling gems - covered by the shimmering
   * chord (0.25-1.4 s). Turn 2 (3.3 s): pillars, the rainbow fan bursts at
   * 0.7 s, the ground glow at 1.55 s and the stat rise at 2.3 s (on turn 1
   * that tail plays as the charge message shows).
   */
  geomancy: () => {
    const s = new MoveSfx(3.2, 0x9e0a);
    s.chord(0.25, 1.15, [72, 76, 79, 84], { rate: 0.035, gain: 0.16, vibrato: 0.01 });
    s.wave(0.25, 1.1, { freq: env.ramp(330, 990), gain: env.swell(0.12) });
    s.sparkle(0.3, 1.1, 12, { lo: 3000, hi: 6000, gain: 0.11 });
    s.noise(0.7, 0.4, { clock: env.ramp(3000, 8000), gain: env.attackDecay(0.22, 0.1) });
    s.chord(1.55, 0.6, [84, 88, 91, 96], { rate: 0.03, gain: 0.12 });
    s.statUp(2.3);
    return s;
  },

  /**
   * Custom (2.6 s): a hush as the scene darkens, a rising shimmering hum as
   * the pink light gathers (0.25-0.9 s), the beam fires with a bright roar at
   * 0.9 s and explodes at 1.15 s in a big boom with chimes, then a dull thud
   * as the user takes the recoil (1.85 s).
   */
  lightofruin: () => {
    const s = new MoveSfx(2.6, 0x11fe);
    s.wave(0.25, 0.65, { freq: env.ramp(300, 900), gain: env.ramp(0.05, 0.2) });
    s.sparkle(0.25, 0.6, 8, { lo: 3500, hi: 6500, gain: 0.1 });
    s.noise(0.9, 0.7, { clock: (u) => 12000 - 6000 * u, gain: env.attackDecay(0.3, 0.05) });
    s.pulse(0.9, 0.7, { freq: env.ramp(1200, 600), gain: env.swell(0.14), duty: 0.25 });
    s.thud(1.15, 0.55, 0.8);
    s.rumble(1.15, 0.6, { from: 600, to: 150, gain: 0.3 });
    s.chord(1.15, 0.5, [84, 88, 91], { rate: 0.03, gain: 0.12 });
    s.thud(1.85, 0.3, 0.3);
    return s;
  },

  /**
   * Custom (2.5 s, the terrain animation): big sparkles pop round the user (0-0.55 s), sparkles race over the ground as the scene takes its tint (0.4-1.3 s), then the fog bank rises and fades (1.1-2.4 s).
   * Soft chimes as the sparkles pop, an airy glittering sweep over the ground
   * and a dreamy, shimmering pad as the pink mist rises.
   */
  mistyterrain: () => {
    const s = new MoveSfx(2.5, 0x3157e);
    s.sparkle(0.0, 0.55, 6, { lo: 4000, hi: 7000, gain: 0.12 });
    s.noise(0.4, 1.0, { clock: () => 9000, gain: env.swell(0.1) });
    s.sparkle(0.4, 0.9, 10, { lo: 3500, hi: 6500, gain: 0.08 });
    s.chord(1.1, 1.3, [76, 81, 84, 88], { rate: 0.05, gain: 0.14, vibrato: 0.012 });
    return s;
  },

  /**
   * Custom (2.85 s): a soft swell as the scene turns magenta, a rising
   * shimmering chord as the moon sinks in and glows (0.3-1.1 s), a bright flare
   * (1.1 s), a swish round the user (1.35 s), the orb hums across
   * (1.5-1.88 s) and bursts in a shower of chimes at 1.88 s.
   */
  moonblast: () => {
    const s = new MoveSfx(3.0, 0x3b1a);
    s.noise(0.0, 0.3, { clock: () => 1500, gain: env.swell(0.1) });
    s.chord(0.3, 0.8, [76, 81, 84], { rate: 0.04, gain: 0.16, vibrato: 0.01 });
    s.wave(0.3, 0.8, { freq: env.ramp(330, 660), gain: env.ramp(0.06, 0.18) });
    s.sparkle(1.05, 0.3, 5, { lo: 4000, hi: 7000, gain: 0.14 });
    s.whoosh(1.35, 0.2, { from: 2000, to: 5000, gain: 0.14 });
    s.wave(1.5, 0.38, { freq: env.ramp(660, 990), gain: env.swell(0.16) });
    s.noise(1.88, 0.35, { clock: (u) => 14000 - 8000 * u, gain: env.attackDecay(0.42, 0.04) });
    s.thud(1.88, 0.45, 0.4);
    s.chord(1.88, 0.7, [84, 88, 91, 96], { rate: 0.03, gain: 0.14 });
    s.sparkle(1.9, 0.6, 8, { lo: 3500, hi: 7000, gain: 0.12 });
    return s;
  },

  /** Generic self aura (~0.8 s): cool moonlight glimmers down, then a soft healing run. */
  moonlight: () => {
    const s = new MoveSfx(1.15, 0x3011);
    s.chord(0.02, 0.6, [81, 84, 88], { rate: 0.05, gain: 0.18, vibrato: 0.01 });
    s.sparkle(0.05, 0.5, 6, { lo: 4000, hi: 7000, gain: 0.1 });
    s.arpeggio(0.5, [76, 81, 84, 88], 0.07, { gain: 0.22, voice: 'wave', hold: 0.2 });
    return s;
  },

  /**
   * Custom (1.7 s): the user dashes in (0-0.28 s), the brawl cloud puffs up
   * with a thump, scuffle hits at 0.43 / 0.73 / 1.03 s while stars and hearts
   * twinkle out (0.36-1.3 s), then the cloud blows away (1.28-1.66 s).
   */
  playrough: () => {
    const s = new MoveSfx(1.85, 0xfa1a);
    s.whoosh(0.0, 0.28, { from: 2000, to: 7000, gain: 0.25 });
    s.thud(0.28, 0.5, 0.5);
    s.noise(0.28, 1.0, { clock: (u) => 2500 + 1500 * Math.sin(2 * Math.PI * 7 * u), gain: env.swell(0.14), short: true });
    for (const at of [0.43, 0.58, 0.73, 0.88, 1.03]) s.thud(at + s.random() * 0.03, 0.35, 0.35);
    s.sparkle(0.36, 0.9, 10, { lo: 3000, hi: 5500, gain: 0.13 });
    s.whoosh(1.28, 0.38, { from: 5000, to: 1500, gain: 0.18 });
    return s;
  },

  /** SweetKiss.play (cherub floats in 0-0.5 s, kiss at 0.5 s, hearts pop 0.5-0.95 s, confusion birds 1.0-1.9 s): a soft airy float, a smooch, heart blips, then the dizzy warble. */
  sweetkiss: () => {
    const s = new MoveSfx(2.0, 0x5c55);
    s.wave(0.0, 0.5, { freq: env.ramp(900, 1300), gain: env.swell(0.1) });
    s.noise(0.5, 0.06, { clock: () => 6000, gain: env.decay(0.25, 2) });
    s.pulse(0.5, 0.08, { freq: env.ramp(1200, 1800), gain: env.decay(0.14, 1), duty: 0.5 });
    for (let i = 0; i < 3; i++) s.pulse(0.55 + i * 0.05, 0.08, { freq: () => [1318.5, 1568, 2093][i], gain: env.decay(0.12, 2), duty: 0.5 });
    s.confusion(1.0);
    return s;
  },
};
