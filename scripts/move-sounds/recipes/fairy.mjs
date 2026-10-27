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

  /** Generic field move: a dazzling flash of fairy light. */
  dazzlinggleam: () => {
    const s = new MoveSfx(1.0, 0xda22);
    s.chord(0.0, 0.5, [88, 92, 95, 100], { rate: 0.025, gain: 0.26 });
    s.noise(0.0, 0.4, { clock: () => 14000, gain: env.attackDecay(0.2, 0.05) });
    s.sparkle(0.05, 0.7, 14, { lo: 3500, hi: 7000, gain: 0.15 });
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
   * CHARGE: turn 1 FxEffects.chargeUp (~0.5 s), turn 2 generic self aura with stat-up fleck at 0.85 s.
   * The same clip plays on both turns: shimmering energy gathers, then a bright rising chime.
   */
  geomancy: () => {
    const s = new MoveSfx(1.55, 0x9e0a);
    s.chord(0.0, 0.75, [72, 76, 79, 84], { rate: 0.035, gain: 0.18, vibrato: 0.01 });
    s.wave(0.0, 0.6, { freq: env.ramp(330, 990), gain: env.swell(0.12) });
    s.sparkle(0.05, 0.65, 9, { lo: 3000, hi: 6000, gain: 0.12 });
    s.statUp(0.85);
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

  /** Generic projectile (0.43 s) + stat-down fleck: a glowing moon orb hums across and bursts in a shower of chimes. */
  moonblast: () => {
    const s = new MoveSfx(1.25, 0x3b1a);
    s.chord(0.0, 0.43, [81, 84, 88], { rate: 0.03, gain: 0.22 });
    s.wave(0.0, 0.43, { freq: env.ramp(330, 660), gain: env.ramp(0.1, 0.24) });
    s.noise(0.43, 0.3, { clock: (u) => 14000 - 8000 * u, gain: env.attackDecay(0.4, 0.04) });
    s.thud(0.43, 0.45, 0.4);
    s.sparkle(0.45, 0.25, 6, { lo: 3500, hi: 7000, gain: 0.12 });
    s.statDown(0.58, 0.22);
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

  /** Generic melee (0.17 s impact) + Attack-drop fleck: a rough-and-tumble flurry with a sweet twinkle. */
  playrough: () => {
    const s = new MoveSfx(1.15, 0xfa1a);
    s.whoosh(0.0, 0.15, { from: 2000, to: 7000, gain: 0.25 });
    s.thud(0.17, 0.5, 0.5);
    s.thud(0.27, 0.4, 0.3);
    s.thud(0.36, 0.45, 0.4);
    s.sparkle(0.18, 0.3, 6, { lo: 3000, hi: 5500, gain: 0.15 });
    s.statDown(0.6);
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
