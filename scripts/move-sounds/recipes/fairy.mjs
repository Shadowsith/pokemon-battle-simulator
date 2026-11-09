import { MoveSfx } from '../move-sfx.mjs';
import { env } from '../track.mjs';

/** Fairy-type move sounds. */
export const FAIRY = {
  /** Generic self aura + stat-up fleck: a soft, sweet-smelling mist. */
  aromaticmist: () => {
    const s = new MoveSfx(1.5, 0xa3a5);
    s.noise(0.02, 0.9, { clock: () => 9000, gain: env.swell(0.14) });
    s.chord(0.1, 0.7, [76, 80, 83], { gain: 0.22, vibrato: 0.01 });
    s.statUp(0.85);
    return s;
  },

  /** Generic self aura (priority) + stat-down fleck: big cute eyes twinkle. */
  babydolleyes: () => {
    const s = new MoveSfx(1.4, 0xbade);
    s.arpeggio(0.02, [88, 93], 0.12, { gain: 0.25, voice: 'wave', hold: 0.2 });
    s.pulse(0.3, 0.3, { freq: env.ramp(900, 1400), gain: env.swell(0.16), duty: 0.5 });
    s.sparkle(0.1, 0.5, 6, { lo: 3500, hi: 6000, gain: 0.14 });
    s.statDown(0.85);
    return s;
  },

  /** Generic self aura + stat-down fleck: an adorable, disarming look. */
  charm: () => {
    const s = new MoveSfx(1.5, 0xc4a7);
    s.wave(0.02, 0.7, { freq: (u) => [784, 1047, 1319][Math.min(2, Math.floor(u * 3))] * (1 + 0.015 * Math.sin(2 * Math.PI * 12 * u)), gain: env.swell(0.3) });
    s.sparkle(0.2, 0.5, 6, { lo: 3000, hi: 5000, gain: 0.12 });
    s.statDown(0.85);
    return s;
  },

  /** Generic self aura (priority): a magical shield rises over the team. */
  craftyshield: () => {
    const s = new MoveSfx(1.0, 0xc2af);
    s.chord(0.02, 0.7, [76, 83, 88], { rate: 0.03, gain: 0.22 });
    s.wave(0.02, 0.7, { freq: () => 164.8, gain: env.swell(0.18) });
    s.pulse(0.35, 0.3, { freq: () => 2637, gain: env.decay(0.12, 2), duty: 0.5 });
    s.sparkle(0.3, 0.5, 6, { gain: 0.12 });
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

  /** Generic sonic (rings every 0.11 s, impact 0.43 s): a charming, sweet voice. */
  disarmingvoice: () => {
    const s = new MoveSfx(0.95, 0xd15a);
    [81, 84, 88, 84].forEach((n, i) => {
      const f = 440 * Math.pow(2, (n - 69) / 12);
      s.wave(i * 0.11, 0.16, { freq: (u) => f * (1 + 0.02 * Math.sin(2 * Math.PI * 3 * u)), gain: env.swell(0.3) });
    });
    s.thud(0.43, 0.3, 0.2);
    s.sparkle(0.45, 0.3, 4, { gain: 0.12 });
    return s;
  },

  /** Generic projectile (0.43 s) + drain: a blown kiss that steals energy. */
  drainingkiss: () => {
    const s = new MoveSfx(1.3, 0xd2a1);
    s.pulse(0.02, 0.12, { freq: (u) => 600 + 900 * Math.sin(Math.PI * u), gain: env.swell(0.25), duty: 0.25 });
    s.wave(0.1, 0.33, { freq: env.ramp(1000, 1400), gain: env.ramp(0.05, 0.15) });
    s.arpeggio(0.43, [88], 0.2, { gain: 0.25, voice: 'wave', hold: 0.2 });
    s.thud(0.43, 0.3, 0.2);
    s.drain(0.55);
    return s;
  },

  /** Generic target aura: chains of light snap shut around the field with a sweet, locking click. */
  fairylock: () => {
    const s = new MoveSfx(1.15, 0xfa10);
    s.chord(0.02, 0.6, [84, 88, 91], { rate: 0.03, gain: 0.18 });
    for (let i = 0; i < 4; i++) s.noise(0.1 + i * 0.12, 0.04, { clock: () => 9000, gain: env.decay(0.22, 1), short: true });
    s.noise(0.6, 0.05, { clock: () => 7000, gain: env.decay(0.35, 1), short: true });
    s.pulse(0.6, 0.25, { freq: () => 2093.0, gain: env.decay(0.22, 2), duty: 0.5 });
    s.wave(0.6, 0.4, { freq: () => 1046.5, gain: env.decay(0.18, 1.5) });
    return s;
  },

  /** Generic projectile (impact 0.43 s), no original sound: a light, glittering breeze. */
  fairywind: () => {
    const s = new MoveSfx(0.9, 0xfa1d);
    s.whoosh(0.0, 0.5, { from: 3000, to: 9000, gain: 0.3 });
    s.chord(0.0, 0.45, [83, 88, 91], { rate: 0.04, gain: 0.16, vibrato: 0.01 });
    s.sparkle(0.05, 0.4, 6, { lo: 3500, hi: 6000, gain: 0.14 });
    s.noise(0.43, 0.2, { clock: (u) => 12000 - 6000 * u, gain: env.attackDecay(0.35, 0.05) });
    s.arpeggio(0.43, [88, 91, 96], 0.05, { gain: 0.18, voice: 'wave', hold: 0.15 });
    return s;
  },

  /** Generic target aura (~0.8 s, fleck at ~0.6 s): petals open into a flowery shield - a sweet blooming chime with a stat-up run. */
  flowershield: () => {
    const s = new MoveSfx(1.4, 0xf10d);
    s.chord(0.0, 0.6, [84, 88, 91], { rate: 0.04, gain: 0.18, vibrato: 0.01 });
    s.sparkle(0.05, 0.5, 6, { lo: 3000, hi: 5000, gain: 0.1 });
    s.wave(0.0, 0.6, { freq: (u) => 523 + 260 * u, gain: env.swell(0.15) });
    s.statUp(0.6);
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

  /** Generic projectile (impact 0.43 s) + recoil (~0.55 s), bp 140: a beam of the eternal flower - a radiant chord swelling into a blinding blast, then a jolt back. */
  lightofruin: () => {
    const s = new MoveSfx(1.15, 0x11fe);
    s.chord(0.0, 0.45, [84, 88, 91, 96], { rate: 0.03, gain: 0.24, voice: 'pulse' });
    s.wave(0.0, 0.45, { freq: env.ramp(500, 1000), gain: env.ramp(0.08, 0.2) });
    s.thud(0.43, 0.65, 0.8);
    s.noise(0.43, 0.35, { clock: (u) => 14000 - 9000 * u, gain: env.attackDecay(0.4, 0.03) });
    s.sparkle(0.45, 0.4, 8, { lo: 3000, hi: 6000, gain: 0.14 });
    s.thud(0.58, 0.4, 0.4);
    return s;
  },

  /** Generic target aura (~0.8 s, whole field): a soft pink mist blankets the ground under a sweet chord. */
  mistyterrain: () => {
    const s = new MoveSfx(1.15, 0x3157e);
    s.noise(0.02, 0.85, { clock: (u) => 4000 + 3000 * Math.sin(Math.PI * u), gain: env.swell(0.26) });
    s.chord(0.02, 0.8, [76, 80, 83, 88], { rate: 0.035, gain: 0.22, vibrato: 0.01 });
    s.wave(0.02, 0.8, { freq: () => 164.8, gain: env.swell(0.14) });
    s.sparkle(0.2, 0.6, 6, { lo: 3500, hi: 6500, gain: 0.1 });
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

  /** Generic target aura + confusion fleck (~0.6 s): a sweet blown kiss with a heart chime. */
  sweetkiss: () => {
    const s = new MoveSfx(1.15, 0x5ee1);
    s.pulse(0.02, 0.08, { freq: env.ramp(1200, 2000), gain: env.decay(0.25, 1), duty: 0.25 });
    s.arpeggio(0.12, [79, 84, 88], 0.09, { gain: 0.26, voice: 'wave', hold: 0.18 });
    s.sparkle(0.2, 0.35, 5, { lo: 3000, hi: 5000, gain: 0.12 });
    s.confusion(0.6, 0.18);
    return s;
  },
};
