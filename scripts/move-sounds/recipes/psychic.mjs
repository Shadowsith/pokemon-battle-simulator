import { MoveSfx } from '../move-sfx.mjs';
import { env } from '../track.mjs';

/** Psychic-type move sounds: warbling, shimmering tones. */
export const PSYCHIC = {
  /**
   * PsychicMoveAnimations.playAgility: speed lines rush by for 1.4 s while the
   * caster runs two quick laps (0.18-1.08 s).
   */
  agility: () => {
    const s = new MoveSfx(1.5, 0xa911);
    s.noise(0.0, 1.4, { clock: () => 4000, gain: env.swell(0.15) });
    s.whoosh(0.18, 0.45, { from: 2000, to: 9000, gain: 0.35 });
    s.whoosh(0.63, 0.45, { from: 2500, to: 11000, gain: 0.35 });
    s.pulse(0.18, 0.9, {
      freq: (u) => (400 + 1200 * u) * (1 + 0.04 * Math.sin(2 * Math.PI * 12 * u)),
      gain: env.swell(0.12),
      duty: 0.125,
    });
    return s;
  },

  /** Generic self aura (priority): two Pokémon swap places - crossing sweeps. */
  allyswitch: () => {
    const s = new MoveSfx(1.0, 0xa115);
    s.pulse(0.02, 0.5, { freq: (u) => 300 * Math.pow(5, u), gain: env.swell(0.2), duty: 0.25 });
    s.pulse(0.02, 0.5, { freq: (u) => 1500 * Math.pow(0.2, u), gain: env.swell(0.2), duty: 0.5 });
    s.wave(0.4, 0.5, { freq: (u) => 880 * (1 + 0.05 * Math.sin(2 * Math.PI * 7 * u)), gain: env.swell(0.2) });
    s.sparkle(0.45, 0.4, 6, { gain: 0.14 });
    return s;
  },

  /**
   * PsychicMoveAnimations.playAmnesia: the scene dims (0-0.3 s), a cloud pops
   * up (0.15 s), its "?" wobbles (0.65-1.35 s), the cloud puffs away
   * (1.2-1.65 s) and the scene clears (to ~2.07 s).
   */
  amnesia: () => {
    const s = new MoveSfx(2.1, 0xa3e5);
    s.wave(0.0, 0.45, { freq: () => 110, gain: env.swell(0.15) });
    s.noise(0.15, 0.2, { clock: env.ramp(1500, 600), gain: env.attackDecay(0.3, 0.1) });
    s.pulse(0.15, 0.15, { freq: env.ramp(400, 700), gain: env.decay(0.2, 1), duty: 0.5 });
    // The question mark: a wobbly, confused tone.
    s.wave(0.65, 0.7, { freq: (u) => 520 * (1 + 0.12 * Math.sin(2 * Math.PI * 4 * u)), gain: env.swell(0.32) });
    s.noise(1.2, 0.45, { clock: env.ramp(2000, 500), gain: env.swell(0.25) });
    s.wave(1.6, 0.45, { freq: () => 110, gain: env.decay(0.1, 1) });
    return s;
  },

  /**
   * PsychicMoveAnimations.playBarrier: a glass panel appears for 1.7 s, a band
   * of light sweeps across it (0.28-0.93 s) and sparkles twinkle (0.3-1.2 s).
   */
  barrier: () => {
    const s = new MoveSfx(1.8, 0xba21);
    s.chord(0.02, 1.6, [84, 88, 91], { rate: 0.04, gain: 0.2, vibrato: 0.005 });
    s.pulse(0.05, 0.4, { freq: () => 2093, gain: env.decay(0.12, 2), duty: 0.5 });
    s.whoosh(0.28, 0.65, { from: 6000, to: 12000, gain: 0.15 });
    s.sparkle(0.3, 0.9, 9, { lo: 3500, hi: 6000, gain: 0.14 });
    return s;
  },

  /** Generic self aura + stat-up fleck: a calm, focused hum. */
  calmmind: () => {
    const s = new MoveSfx(1.5, 0xca1a);
    s.wave(0.02, 0.8, { freq: () => 220, gain: env.swell(0.25) });
    s.wave(0.02, 0.8, { freq: () => 330, gain: env.swell(0.16) });
    s.sparkle(0.2, 0.5, 5, { lo: 2500, hi: 4000, gain: 0.1 });
    s.statUp(0.85);
    return s;
  },

  /** Generic self aura + stat-up fleck: starry cosmic shimmer over a deep drone. */
  cosmicpower: () => {
    const s = new MoveSfx(1.5, 0xc05a);
    s.wave(0.02, 0.8, { freq: () => 73.4, gain: env.swell(0.25) });
    s.chord(0.05, 0.75, [84, 91, 96], { rate: 0.035, gain: 0.18, vibrato: 0.006 });
    s.sparkle(0.05, 0.7, 10, { lo: 4000, hi: 7000, gain: 0.12 });
    s.statUp(0.85);
    return s;
  },

  /** Generic projectile (0.43 s) + confusion fleck: a warbling psychic wave. */
  confusion: () => {
    const s = new MoveSfx(1.2, 0xc0f5);
    s.pulse(0.0, 0.45, { freq: (u) => (400 + 400 * u) * (1 + 0.1 * Math.sin(2 * Math.PI * 7 * u)), gain: env.ramp(0.08, 0.22), duty: 0.25 });
    s.wave(0.43, 0.25, { freq: (u) => 900 * Math.pow(0.5, u), gain: env.decay(0.35, 1.5) });
    s.thud(0.43, 0.35, 0.3);
    s.confusion(0.6);
    return s;
  },

  /**
   * PsychicMoveAnimations.playDreamEater: darkness (0.3 s), 16 dream orbs float
   * from the target to the caster (arrivals ~1.3-2.2 s), the caster glows with
   * sparkles (to ~3 s), the darkness lifts.
   */
  dreameater: () => {
    const s = new MoveSfx(3.2, 0xd2ea);
    s.wave(0.0, 3.0, { freq: (u) => 220 * (1 + 0.02 * Math.sin(2 * Math.PI * 4 * u)), gain: (u) => 0.12 * Math.min(1, u * 10) * Math.min(1, (1 - u) * 5) });
    const scale = [72, 74, 76, 79, 81, 84];
    for (let i = 0; i < 16; i++) {
      const note = scale[Math.floor(s.random() * scale.length)];
      s.arpeggio(1.3 + i * 0.056, [note], 0.1, { gain: 0.16, voice: 'wave', hold: 0.14 });
    }
    s.chord(2.1, 0.9, [76, 79, 84], { rate: 0.04, gain: 0.2, vibrato: 0.01 });
    s.sparkle(2.1, 0.5, 8, { lo: 3000, hi: 5500, gain: 0.12 });
    return s;
  },

  /** Generic projectile (impact 0.43 s) + flinch fleck: an odd, warbling wave of sixth sense. */
  extrasensory: () => {
    const s = new MoveSfx(1.0, 0xe755);
    s.wave(0.0, 0.43, { freq: (u) => 700 * Math.pow(1.6, u) * (1 + 0.06 * Math.sin(2 * Math.PI * 14 * u)), gain: env.ramp(0.15, 0.3) });
    s.pulse(0.0, 0.43, { freq: (u) => 1050 * Math.pow(1.6, u), gain: () => 0.07, duty: 0.125 });
    s.wave(0.43, 0.3, { freq: (u) => 1100 * (1 + 0.1 * Math.sin(2 * Math.PI * 6 * u)), gain: env.decay(0.35, 1.5) });
    s.noise(0.43, 0.08, { clock: () => 8000, gain: env.decay(0.3, 1) });
    s.flinch(0.6);
    return s;
  },

  /** Generic projectile (impact at 0.43 s; the hit lands two turns later): a warbling glimpse of the future that fades into the distance. */
  futuresight: () => {
    const s = new MoveSfx(1.1, 0xf075);
    s.wave(0.0, 0.5, { freq: (u) => 500 + 500 * u + 60 * Math.sin(2 * Math.PI * 10 * u), gain: env.ramp(0.1, 0.25) });
    s.wave(0.0, 0.5, { freq: (u) => 750 + 750 * u + 80 * Math.sin(2 * Math.PI * 8 * u), gain: env.ramp(0.05, 0.12) });
    s.chord(0.43, 0.6, [79, 83, 86, 91], { rate: 0.035, gain: 0.2, vibrato: 0.02 });
    s.wave(0.45, 0.6, { freq: (u) => 1500 - 900 * u, gain: env.decay(0.12, 1.5) });
    return s;
  },

  /** Generic target aura (~0.8 s) on the whole field: space bends and everything is pulled down hard. */
  gravity: () => {
    const s = new MoveSfx(1.3, 0x6a71);
    s.wave(0.02, 0.85, { freq: (u) => 440 * Math.pow(0.3, u) * (1 + 0.03 * Math.sin(2 * Math.PI * 10 * u)), gain: env.swell(0.22) });
    s.pulse(0.02, 0.85, { freq: (u) => 220 * Math.pow(0.4, u), gain: env.swell(0.12), duty: 0.5 });
    s.rumble(0.3, 0.9, { from: 400, to: 120, gain: 0.25 });
    return s;
  },

  /** Generic target aura (~0.8 s): two warbling tones meet and settle on one shared note. */
  guardsplit: () => {
    const s = new MoveSfx(1.25, 0x65b1);
    s.wave(0.02, 0.8, { freq: (u) => (300 + 140 * Math.min(1, u * 1.5)) * (1 + 0.02 * Math.sin(2 * Math.PI * 12 * u)), gain: env.swell(0.18) });
    s.wave(0.02, 0.8, { freq: (u) => (600 - 160 * Math.min(1, u * 1.5)) * (1 + 0.02 * Math.sin(2 * Math.PI * 12 * u)), gain: env.swell(0.14) });
    s.pulse(0.75, 0.25, { freq: () => 880, gain: env.decay(0.12, 1.5), duty: 0.25 });
    return s;
  },

  /** Generic target aura (~0.8 s): two shields trade places, a rising and a falling warble crossing. */
  guardswap: () => {
    const s = new MoveSfx(1.25, 0x65a9);
    s.wave(0.02, 0.75, { freq: (u) => 330 * Math.pow(2, u) * (1 + 0.02 * Math.sin(2 * Math.PI * 11 * u)), gain: env.swell(0.17) });
    s.wave(0.02, 0.75, { freq: (u) => 660 * Math.pow(0.5, u) * (1 + 0.02 * Math.sin(2 * Math.PI * 11 * u)), gain: env.swell(0.15) });
    s.arpeggio(0.78, [76, 72], 0.08, { gain: 0.14, duty: 0.25, hold: 0.12 });
    return s;
  },

  /** Generic target aura (~0.8 s): a psychic seal buzzes shut over the foes with a dull, denying tone. */
  healblock: () => {
    const s = new MoveSfx(1.2, 0x4eb0);
    s.wave(0.0, 0.7, { freq: (u) => 600 + 80 * Math.sin(2 * Math.PI * 7 * u), gain: env.swell(0.2) });
    s.pulse(0.0, 0.7, { freq: (u) => 900 + 120 * Math.sin(2 * Math.PI * 7 * u), gain: env.swell(0.1), duty: 0.25 });
    s.pulse(0.65, 0.18, { freq: () => 233, gain: env.decay(0.2, 1), duty: 0.5 });
    s.pulse(0.65, 0.18, { freq: () => 247, gain: env.decay(0.16, 1), duty: 0.5 });
    s.pulse(0.85, 0.25, { freq: () => 175, gain: env.decay(0.2, 1.5), duty: 0.5 });
    s.pulse(0.85, 0.25, { freq: () => 185, gain: env.decay(0.16, 1.5), duty: 0.5 });
    return s;
  },

  /** Generic self aura (~0.8 s) then ~1.5 s clip: a hushed, rising wish that sparkles and gently fades away. */
  healingwish: () => {
    const s = new MoveSfx(1.6, 0x4e15);
    s.chord(0.0, 0.9, [72, 76, 79, 84], { rate: 0.05, gain: 0.2, vibrato: 0.01 });
    s.wave(0.0, 0.9, { freq: (u) => 400 + 400 * u, gain: env.swell(0.14) });
    s.arpeggio(0.8, [84, 88, 91, 96], 0.09, { gain: 0.16, voice: 'wave', hold: 0.3 });
    s.sparkle(0.3, 1.0, 12, { lo: 4000, hi: 7500, gain: 0.1 });
    return s;
  },

  /** Generic self aura (~0.8 s) for any target: soft healing waves ripple out in gentle wavering tones. */
  healpulse: () => {
    const s = new MoveSfx(1.3, 0x4e9c);
    for (let i = 0; i < 4; i++) {
      s.wave(i * 0.2, 0.4, { freq: (u) => (523 + i * 65) * (1 + 0.25 * u), gain: env.swell(0.2) });
      s.pulse(i * 0.2, 0.3, { freq: (u) => (1046 + i * 130) * (1 + 0.25 * u), gain: env.swell(0.06), duty: 0.25 });
    }
    s.arpeggio(0.85, [79, 84, 88], 0.07, { gain: 0.14, voice: 'wave', hold: 0.15 });
    return s;
  },

  /** Generic melee (impact 0.17 s) + flinch fleck (~0.45 s): a cute heart twinkle, then a sudden stamping smack. */
  heartstamp: () => {
    const s = new MoveSfx(0.85, 0x4e57);
    s.arpeggio(0.0, [84, 88], 0.06, { gain: 0.16, voice: 'wave', hold: 0.1 });
    s.thud(0.17, 0.75, 0.7);
    s.wave(0.17, 0.3, { freq: (u) => 700 + 300 * Math.sin(2 * Math.PI * 4 * u), gain: env.decay(0.16, 1.5) });
    s.flinch(0.45);
    return s;
  },

  /** Generic target aura (~0.8 s): two warbling tones trade places as the stat changes are swapped. */
  heartswap: () => {
    const s = new MoveSfx(1.2, 0x4e5f);
    s.wave(0.0, 0.85, { freq: (u) => 400 + 400 * u + 30 * Math.sin(2 * Math.PI * 8 * u), gain: env.swell(0.2) });
    s.pulse(0.0, 0.85, { freq: (u) => 800 - 400 * u + 30 * Math.sin(2 * Math.PI * 8 * u), gain: env.swell(0.1), duty: 0.25 });
    s.arpeggio(0.75, [76, 81, 76, 81], 0.07, { gain: 0.14, voice: 'wave', hold: 0.1 });
    return s;
  },

  /** Generic projectile (0.43 s): space warps open with a woozy warble and the target is swallowed by a rift. */
  hyperspacehole: () => {
    const s = new MoveSfx(1.1, 0x4d50);
    s.wave(0.0, 0.45, { freq: (u) => 300 + 600 * u + 150 * Math.sin(2 * Math.PI * 8 * u), gain: env.ramp(0.12, 0.28) });
    s.chord(0.0, 0.45, [72, 78], { rate: 0.04, gain: 0.1, voice: 'pulse' });
    s.noise(0.43, 0.15, { clock: env.ramp(9000, 2000), gain: env.attackDecay(0.35, 0.05) });
    s.wave(0.43, 0.55, { freq: (u) => 900 * Math.pow(0.25, u) * (1 + 0.05 * Math.sin(2 * Math.PI * 10 * u)), gain: env.decay(0.3, 1.2) });
    s.pulse(0.43, 0.4, { freq: (u) => 120 * Math.pow(0.6, u), gain: env.decay(0.2, 1.5), duty: 0.5 });
    return s;
  },

  /** Generic target aura (~0.8 s) + sleep fleck (0.6 s): hypnotic, swaying waves lull the target. */
  hypnosis: () => {
    const s = new MoveSfx(1.45, 0x4e9b);
    s.wave(0.0, 0.8, { freq: (u) => 440 + 110 * Math.sin(2 * Math.PI * 3 * u), gain: env.swell(0.22) });
    s.wave(0.05, 0.75, { freq: (u) => 660 - 110 * Math.sin(2 * Math.PI * 3 * u), gain: env.swell(0.12) });
    s.sleep(0.6, 0.22);
    return s;
  },

  /** Generic self aura (~0.8 s, no fleck): a sealing glyph locks shut with a low, warbling hum and a clack. */
  imprison: () => {
    const s = new MoveSfx(1.15, 0x1a95);
    s.wave(0.0, 0.8, { freq: (u) => 330 * (1 + 0.04 * Math.sin(2 * Math.PI * 7 * u)), gain: env.swell(0.25) });
    s.chord(0.1, 0.6, [57, 60, 63], { rate: 0.05, gain: 0.14, voice: 'pulse', vibrato: 0.01 });
    s.noise(0.75, 0.05, { clock: () => 6000, gain: env.decay(0.3, 1), short: true });
    s.pulse(0.75, 0.25, { freq: () => 196, gain: env.decay(0.25, 2), duty: 0.5 });
    return s;
  },

  /**
   * PsychicMoveAnimations.playScreen (LIGHT_SCREEN): a screen of light opens (0-0.25 s),
   * a sheen sweeps it (0.28-0.98 s), sparkles twinkle 0.2-1.72 s, fade by 1.7 s.
   */
  lightscreen: () => {
    const s = new MoveSfx(1.95, 0x115c);
    s.wave(0.0, 0.25, { freq: env.ramp(400, 1200), gain: env.ramp(0.1, 0.26) });
    s.pulse(0.0, 0.25, { freq: env.ramp(800, 2400), gain: env.ramp(0.04, 0.1), duty: 0.125 });
    // Humming screen with a bright sheen swell.
    s.wave(0.2, 1.5, { freq: (u) => 1046 * (1 + 0.012 * Math.sin(2 * Math.PI * 7 * u)), gain: (u) => 0.13 * Math.min(1, u * 8) * Math.pow(1 - u, 1.2) });
    s.noise(0.28, 0.7, { clock: env.ramp(5000, 11000), gain: env.swell(0.1) });
    s.chord(0.28, 0.7, [84, 88, 91], { rate: 0.04, gain: 0.1, voice: 'pulse' });
    s.sparkle(0.2, 1.5, 14, { lo: 3000, hi: 5500, gain: 0.12 });
    return s;
  },

  /** Generic self aura (~0.8 s, no fleck): a moonlit dance - a dreamy waltz of warbling waves and soft starlight. */
  lunardance: () => {
    const s = new MoveSfx(1.25, 0x10da);
    s.arpeggio(0.02, [69, 76, 81, 79, 76, 84], 0.13, { gain: 0.2, voice: 'wave', hold: 0.22 });
    s.wave(0.02, 0.85, { freq: (u) => 220 * (1 + 0.03 * Math.sin(2 * Math.PI * 5 * u)), gain: env.swell(0.14) });
    s.chord(0.3, 0.6, [93, 96, 100], { rate: 0.05, gain: 0.08, vibrato: 0.01 });
    s.sparkle(0.1, 0.8, 8, { lo: 2600, hi: 5000, gain: 0.1 });
    return s;
  },

  /** Generic projectile (impact 0.43 s) + Sp. Def-down fleck (~0.55 s): a ray of glistening light - a shimmering warble rising into a bright burst. */
  lusterpurge: () => {
    const s = new MoveSfx(1.15, 0x105e);
    s.wave(0.0, 0.45, { freq: (u) => (600 + 600 * u) * (1 + 0.04 * Math.sin(2 * Math.PI * 10 * u)), gain: env.ramp(0.1, 0.26) });
    s.pulse(0.0, 0.45, { freq: (u) => 1200 + 1200 * u, gain: env.ramp(0.03, 0.08), duty: 0.125 });
    s.thud(0.43, 0.5, 0.5);
    s.noise(0.43, 0.25, { clock: (u) => 11000 - 6000 * u, gain: env.attackDecay(0.35, 0.04) });
    s.sparkle(0.45, 0.2, 4, { gain: 0.12 });
    s.statDown(0.55, 0.22);
    return s;
  },

  /** Generic self aura (priority, ≈ 0.8 s): a mirror-like barrier rings up around the caster with a bright reflective shimmer. */
  magiccoat: () => {
    const s = new MoveSfx(1.1, 0x3ac0);
    s.pulse(0.0, 0.35, { freq: (u) => 600 * Math.pow(3, u), gain: env.swell(0.18), duty: 0.25 });
    s.chord(0.15, 0.7, [84, 88, 91, 96], { rate: 0.03, gain: 0.2, vibrato: 0.01 });
    s.wave(0.3, 0.7, { freq: (u) => 1320 * (1 + 0.03 * Math.sin(2 * Math.PI * 8 * u)), gain: env.decay(0.18, 1.5) });
    s.sparkle(0.35, 0.5, 7, { lo: 3500, hi: 6500, gain: 0.12 });
    return s;
  },

  /** Generic target aura (≈ 0.8 s): the room warps - a bizarre, detuned wobble bends up and down. */
  magicroom: () => {
    const s = new MoveSfx(1.15, 0x3a90);
    s.wave(0.0, 1.0, { freq: (u) => 330 * (1 + 0.25 * Math.sin(2 * Math.PI * 3 * u)), gain: env.swell(0.26) });
    s.wave(0.0, 1.0, { freq: (u) => 349 * (1 - 0.25 * Math.sin(2 * Math.PI * 3 * u)), gain: env.swell(0.18) });
    s.pulse(0.1, 0.85, { freq: (u) => 660 * (1 + 0.08 * Math.sin(2 * Math.PI * 11 * u)), gain: env.swell(0.1), duty: 0.125 });
    s.arpeggio(0.65, [79, 74, 80, 73], 0.08, { gain: 0.12, voice: 'wave', hold: 0.12 });
    return s;
  },

  /** Generic self aura (≈ 0.8 s) + Attack-up fleck (0.85 s): a calm, slow breathing hum focuses the mind. */
  meditate: () => {
    const s = new MoveSfx(1.55, 0x3ed1);
    s.wave(0.0, 0.85, { freq: (u) => 220 * (1 + 0.02 * Math.sin(2 * Math.PI * 4 * u)), gain: env.swell(0.24) });
    s.wave(0.1, 0.75, { freq: () => 330, gain: env.swell(0.14) });
    s.chord(0.3, 0.5, [76, 83], { rate: 0.08, gain: 0.08 });
    s.statUp(0.85);
    return s;
  },

  /** Generic target aura (~0.8 s): a third eye opens with a warbling glow and a sharp seeing "ping". */
  miracleeye: () => {
    const s = new MoveSfx(1.15, 0x3e1e);
    s.wave(0.02, 0.55, { freq: (u) => (500 + 400 * u) * (1 + 0.04 * Math.sin(2 * Math.PI * 9 * u)), gain: env.swell(0.26) });
    s.wave(0.02, 0.55, { freq: (u) => (750 + 600 * u) * (1 + 0.04 * Math.sin(2 * Math.PI * 9 * u)), gain: env.swell(0.1) });
    s.pulse(0.55, 0.4, { freq: () => 2093, gain: env.decay(0.22, 2), duty: 0.25 });
    s.sparkle(0.58, 0.3, 4, { lo: 4000, hi: 6000, gain: 0.1 });
    return s;
  },

  /** Generic projectile (0.43 s → impact): a shimmering reflective coat flings the blow back with a glassy ring. */
  mirrorcoat: () => {
    const s = new MoveSfx(0.95, 0x3c0a);
    s.chord(0.0, 0.43, [84, 88, 91], { rate: 0.03, gain: 0.2, vibrato: 0.01 });
    s.wave(0.0, 0.43, { freq: env.ramp(600, 1200), gain: env.ramp(0.08, 0.2) });
    s.noise(0.43, 0.15, { clock: () => 12000, gain: env.attackDecay(0.25, 0.03), short: true });
    s.thud(0.43, 0.3, 0.3);
    s.pulse(0.43, 0.4, { freq: () => 2794, gain: env.decay(0.16, 2), duty: 0.25 });
    return s;
  },

  /** Generic lob (arcs 0.52 s) + stat-down fleck: a hazy, warbling down-feather orb drifts over and bursts softly. */
  mistball: () => {
    const s = new MoveSfx(1.35, 0x3b0b);
    s.wave(0.0, 0.52, { freq: (u) => 330 * (1 + 0.06 * Math.sin(2 * Math.PI * 7 * u)) * (1 + 0.4 * u), gain: env.ramp(0.14, 0.3) });
    s.noise(0.0, 0.52, { clock: () => 3000, gain: env.ramp(0.04, 0.1) });
    s.noise(0.52, 0.3, { clock: (u) => 5000 - 3500 * u, gain: env.attackDecay(0.4, 0.05) });
    s.thud(0.52, 0.45, 0.5);
    s.statDown(0.68, 0.22);
    return s;
  },

  /** Generic target aura (0-0.8 s): two warbling tones meet and settle on one pitch (stats averaged). */
  powersplit: () => {
    const s = new MoveSfx(1.1, 0x95b1);
    s.wave(0.02, 0.8, { freq: (u) => (u < 0.6 ? 330 + 110 * (u / 0.6) : 440) * (1 + 0.03 * Math.sin(2 * Math.PI * 12 * u)), gain: env.swell(0.3) });
    s.wave(0.02, 0.8, { freq: (u) => (u < 0.6 ? 660 - 220 * (u / 0.6) : 440) * (1 + 0.03 * Math.sin(2 * Math.PI * 9 * u)), gain: env.swell(0.25) });
    s.pulse(0.5, 0.45, { freq: () => 880, gain: env.decay(0.12, 1.5), duty: 0.25 });
    return s;
  },

  /** Generic target aura (0-0.8 s): two psychic tones glide past each other, swapping places. */
  powerswap: () => {
    const s = new MoveSfx(1.1, 0x95a9);
    s.wave(0.02, 0.8, { freq: (u) => 330 * Math.pow(2, u) * (1 + 0.03 * Math.sin(2 * Math.PI * 10 * u)), gain: env.swell(0.3) });
    s.wave(0.02, 0.8, { freq: (u) => 660 * Math.pow(0.5, u) * (1 + 0.03 * Math.sin(2 * Math.PI * 8 * u)), gain: env.swell(0.25) });
    s.arpeggio(0.55, [76, 72], 0.1, { gain: 0.15, duty: 0.25, hold: 0.15 });
    return s;
  },

  /** Generic self aura (≈0.8 s): the user's power flips over with an up-down psychic warble. */
  powertrick: () => {
    const s = new MoveSfx(1.1, 0x9571);
    s.wave(0.02, 0.4, { freq: (u) => (200 + 400 * u) * (1 + 0.04 * Math.sin(2 * Math.PI * 8 * u)), gain: env.swell(0.32) });
    s.wave(0.42, 0.4, { freq: (u) => (600 - 400 * u) * (1 + 0.04 * Math.sin(2 * Math.PI * 8 * u)), gain: env.swell(0.32) });
    s.pulse(0.4, 0.08, { freq: () => 1200, gain: env.decay(0.18, 1.5), duty: 0.25 });
    s.pulse(0.82, 0.12, { freq: () => 800, gain: env.decay(0.18, 1.5), duty: 0.25 });
    return s;
  },

  /** Generic projectile (impact 0.43 s) + confusion fleck: a wobbling rainbow ray, then dizzy tweets. */
  psybeam: () => {
    const s = new MoveSfx(1.15, 0x9b3a);
    s.pulse(0.0, 0.45, { freq: (u) => (500 + 700 * u) * (1 + 0.1 * Math.sin(2 * Math.PI * 9 * u)), gain: env.attackDecay(0.22, 0.2), duty: 0.25 });
    s.wave(0.0, 0.45, { freq: (u) => (750 + 900 * u) * (1 + 0.08 * Math.sin(2 * Math.PI * 7 * u)), gain: env.swell(0.25) });
    s.noise(0.43, 0.12, { clock: (u) => 8000 - 5000 * u, gain: env.attackDecay(0.32, 0.05) });
    s.wave(0.43, 0.2, { freq: (u) => 600 * Math.pow(0.5, u), gain: env.decay(0.3, 1.5) });
    s.confusion(0.58);
    return s;
  },

  /**
   * PsychicMoveAnimations.playPsychic: the scene dims (0-0.3 s), the wave
   * pattern fades in (0.3-0.6 s), the target warps for 1.1 s with four
   * flashes (0.6 / 0.86 / 1.12 / 1.38 s), the dim fades (1.7-2.08 s).
   * A rising, warbling psychic tone that pulses with each flash.
   */
  psychic: () => {
    const s = new MoveSfx(2.15, 0x95c1);
    s.wave(0.0, 0.6, { freq: (u) => 220 + 220 * u, gain: env.ramp(0.05, 0.25) });
    s.wave(0.6, 1.1, { freq: (u) => 440 * (1 + 0.12 * Math.sin(2 * Math.PI * 9 * u)), gain: (u) => 0.28 * Math.min(1, (1 - u) * 6 + 0.3) });
    s.pulse(0.3, 1.4, { freq: (u) => 660 * (1 + 0.08 * Math.sin(2 * Math.PI * 12 * u)), gain: (u) => 0.12 * Math.sin(Math.PI * u), duty: 0.125 });
    for (const at of [0.6, 0.86, 1.12, 1.38]) {
      s.wave(at, 0.2, { freq: (u) => 1320 * Math.pow(0.6, u), gain: env.decay(0.22, 1.5) });
      s.noise(at, 0.08, { clock: () => 3000, gain: env.decay(0.12, 1) });
    }
    s.wave(1.7, 0.4, { freq: (u) => 440 * Math.pow(0.5, u), gain: env.decay(0.18, 1.5) });
    return s;
  },

  /** Generic projectile at near-max power (impact 0.43 s): a huge psychic surge that bursts. */
  psychoboost: () => {
    const s = new MoveSfx(1.3, 0x9b05);
    s.wave(0.0, 0.45, { freq: (u) => (300 + 1300 * u) * (1 + 0.1 * Math.sin(2 * Math.PI * 10 * u)), gain: env.ramp(0.1, 0.32) });
    s.pulse(0.0, 0.45, { freq: (u) => 150 + 500 * u, gain: env.ramp(0.05, 0.2), duty: 0.5 });
    s.thud(0.43, 0.45, 0.9);
    s.noise(0.43, 0.3, { clock: (u) => 10000 - 7000 * u, gain: env.attackDecay(0.3, 0.03) });
    s.chord(0.48, 0.7, [76, 83, 88], { rate: 0.035, gain: 0.2, vibrato: 0.02 });
    s.rumble(0.45, 0.8, { from: 600, to: 200, gain: 0.25 });
    return s;
  },

  /** Generic projectile (impact 0.43 s): a psychic blade flies and slices. */
  psychocut: () => {
    const s = new MoveSfx(0.85, 0x9c07);
    s.wave(0.0, 0.43, { freq: (u) => 900 * (1 + 0.1 * Math.sin(2 * Math.PI * 8 * u)) * (1 + 0.5 * u), gain: env.swell(0.22) });
    s.whoosh(0.05, 0.4, { from: 3000, to: 11000, gain: 0.25 });
    s.slash(0.43, 0.6);
    s.wave(0.45, 0.3, { freq: (u) => 1400 * Math.pow(0.6, u), gain: env.decay(0.18, 1.5) });
    return s;
  },

  /** Generic target aura (~0.8 s): the status ailment wobbles over to the target. */
  psychoshift: () => {
    const s = new MoveSfx(1.0, 0x95f7);
    s.wave(0.02, 0.5, { freq: (u) => (700 - 300 * u) * (1 + 0.1 * Math.sin(2 * Math.PI * 6 * u)), gain: env.swell(0.3) });
    s.pulse(0.3, 0.5, { freq: (u) => (300 + 400 * u) * (1 + 0.06 * Math.sin(2 * Math.PI * 9 * u)), gain: env.swell(0.18), duty: 0.25 });
    s.arpeggio(0.6, [74, 69], 0.1, { gain: 0.22, voice: 'wave', hold: 0.18 });
    return s;
  },

  /** Generic projectile (impact 0.43 s): crackling psychic blocks pelt the target. */
  psyshock: () => {
    const s = new MoveSfx(1.0, 0x95b0);
    s.wave(0.0, 0.45, { freq: (u) => (500 + 600 * u) * (1 + 0.08 * Math.sin(2 * Math.PI * 9 * u)), gain: env.swell(0.25) });
    for (const at of [0.43, 0.52, 0.61]) {
      s.noise(at, 0.06, { clock: () => 6000, gain: env.decay(0.4, 1), short: true });
      s.pulse(at, 0.08, { freq: (u) => 900 * Math.pow(0.5, u), gain: env.decay(0.3, 1.5), duty: 0.5 });
    }
    s.wave(0.6, 0.3, { freq: (u) => 660 * Math.pow(0.6, u), gain: env.decay(0.15, 1.5) });
    return s;
  },

  /** Generic projectile (impact 0.43 s): a strong, deep psychic wave crashing into the foe. */
  psystrike: () => {
    const s = new MoveSfx(1.2, 0x9571);
    s.wave(0.0, 0.45, { freq: (u) => (200 + 700 * u) * (1 + 0.1 * Math.sin(2 * Math.PI * 7 * u)), gain: env.ramp(0.1, 0.3) });
    s.pulse(0.0, 0.45, { freq: (u) => (400 + 1000 * u) * (1 + 0.06 * Math.sin(2 * Math.PI * 11 * u)), gain: env.swell(0.14), duty: 0.125 });
    s.thud(0.43, 0.45, 0.8);
    s.noise(0.43, 0.25, { clock: (u) => 7000 - 4000 * u, gain: env.attackDecay(0.28, 0.04) });
    s.wave(0.45, 0.6, { freq: (u) => 330 * (1 + 0.1 * Math.sin(2 * Math.PI * 6 * u)) * Math.pow(0.7, u), gain: env.decay(0.25, 1.2) });
    return s;
  },

  /** Generic projectile (impact 0.43 s): wavering rings with an unsteady pitch. */
  psywave: () => {
    const s = new MoveSfx(0.95, 0x95a3);
    s.wave(0.0, 0.45, { freq: (u) => 600 * (1 + 0.25 * Math.sin(2 * Math.PI * 5 * u)), gain: env.swell(0.3) });
    s.pulse(0.0, 0.45, { freq: (u) => 900 * (1 + 0.2 * Math.sin(2 * Math.PI * 5 * u + 1.5)), gain: env.swell(0.12), duty: 0.25 });
    s.noise(0.43, 0.1, { clock: () => 4500, gain: env.decay(0.3, 1) });
    s.wave(0.43, 0.4, { freq: (u) => 500 * (1 + 0.2 * Math.sin(2 * Math.PI * 4 * u)) * Math.pow(0.6, u), gain: env.decay(0.28, 1.5) });
    return s;
  },

  /**
   * PsychicMoveAnimations.playScreen (Reflect): a violet panel pops up
   * (0-0.25 s) and stays for 1.7 s, a sheen sweeps it (0.28-0.98 s) while
   * sparkles twinkle (0.2-1.7 s). A hard, glassy panel tone.
   */
  reflect: () => {
    const s = new MoveSfx(1.8, 0x7ef1);
    s.pulse(0.02, 0.2, { freq: (u) => 600 + 1200 * u, gain: env.attackDecay(0.22, 0.4), duty: 0.25 });
    s.chord(0.15, 1.5, [79, 86, 91], { rate: 0.035, gain: 0.2, voice: 'pulse', vibrato: 0.004 });
    s.whoosh(0.28, 0.7, { from: 5000, to: 11000, gain: 0.14 });
    s.sparkle(0.2, 1.4, 10, { lo: 3000, hi: 5500, gain: 0.12 });
    return s;
  },

  /** PsychicMoveAnimations.playRest: sleep bubble breathes twice (peaks 0.34 / 1.1 s, pops 1.7 s) while 4 Zs float up (0–1.94 s), then heal sparkles (1.94–3.04 s). A drowsy lullaby with snoring breaths and a soft healing glitter. */
  rest: () => {
    const s = new MoveSfx(3.2, 0x7e57);
    for (const [at, d] of [[0.0, 0.68], [0.68, 0.77]]) {
      s.noise(at, d, { clock: (u) => 500 + 900 * Math.sin(Math.PI * u), gain: (u) => 0.16 * Math.sin(Math.PI * u) });
      s.wave(at, d, { freq: (u) => 150 + 60 * Math.sin(Math.PI * u), gain: (u) => 0.22 * Math.sin(Math.PI * u) });
    }
    s.arpeggio(0.05, [79, 76, 72, 67], 0.28, { gain: 0.2, voice: 'wave', hold: 0.4 });
    s.pulse(1.7, 0.06, { freq: (u) => 1400 * (1 + u), gain: env.decay(0.25, 1), duty: 0.25 });
    s.arpeggio(1.95, [72, 76, 79, 84, 88], 0.09, { gain: 0.2, voice: 'wave', hold: 0.18 });
    s.sparkle(2.0, 0.9, 10, { lo: 2500, hi: 5000, gain: 0.14 });
    s.wave(2.3, 0.75, { freq: () => 1047, gain: env.decay(0.12, 1.5) });
    return s;
  },

  /** Generic target aura (~0.8 s): the user mimics the target – a mirrored warbling copy of a phrase. */
  roleplay: () => {
    const s = new MoveSfx(1.1, 0x901e);
    [72, 76, 79].forEach((n, i) => {
      const f = 440 * Math.pow(2, (n - 69) / 12);
      s.wave(i * 0.12, 0.14, { freq: (u) => f * (1 + 0.03 * Math.sin(2 * Math.PI * 8 * u)), gain: env.decay(0.25, 1) });
      s.wave(0.45 + i * 0.12, 0.16, { freq: (u) => f * 1.5 * (1 + 0.03 * Math.sin(2 * Math.PI * 8 * u)), gain: env.decay(0.22, 1) });
    });
    s.pulse(0.0, 0.85, { freq: (u) => 330 * (1 + 0.05 * Math.sin(2 * Math.PI * 5 * u)), gain: env.swell(0.1), duty: 0.25 });
    s.sparkle(0.6, 0.35, 4, { gain: 0.1 });
    return s;
  },

  /** Generic target aura (~0.8 s), no fleck: two warbling tones swap places - one rises while the other falls, crossing midway. */
  skillswap: () => {
    const s = new MoveSfx(1.1, 0x5c55);
    s.wave(0.02, 0.75, { freq: (u) => (400 + 500 * u) * (1 + 0.03 * Math.sin(2 * Math.PI * 7 * u)), gain: env.swell(0.26) });
    s.pulse(0.02, 0.75, { freq: (u) => (900 - 500 * u) * (1 + 0.03 * Math.sin(2 * Math.PI * 7 * u + 2)), gain: env.swell(0.1), duty: 0.25 });
    s.arpeggio(0.78, [79, 84], 0.07, { gain: 0.18, voice: 'wave', hold: 0.12 });
    return s;
  },

  /** Generic projectile (impact 0.43 s): pent-up power swells as a warbling orb, then bursts. */
  storedpower: () => {
    const s = new MoveSfx(0.9, 0x5704);
    s.wave(0.0, 0.43, { freq: (u) => (400 + 600 * u) * (1 + 0.05 * Math.sin(2 * Math.PI * 12 * u)), gain: env.swell(0.25) });
    s.pulse(0.0, 0.43, { freq: (u) => 800 + 1200 * u, gain: env.swell(0.08), duty: 0.125 });
    s.noise(0.43, 0.2, { clock: env.ramp(9000, 3000), gain: env.attackDecay(0.35, 0.05) });
    s.wave(0.43, 0.35, { freq: (u) => 1000 * Math.pow(0.5, u), gain: env.decay(0.25, 1.5) });
    s.sparkle(0.45, 0.3, 4, { gain: 0.12 });
    return s;
  },

  /** Generic field (shake + waves ~0.6 s, bp 120): eerie synchronised shockwaves pulse outward. */
  synchronoise: () => {
    const s = new MoveSfx(1.0, 0x5c40);
    for (let i = 0; i < 4; i++) {
      const at = 0.02 + i * 0.15;
      s.wave(at, 0.2, { freq: (u) => 700 * (1 + 0.3 * u), gain: env.attackDecay(0.28, 0.15) });
      s.wave(at, 0.2, { freq: (u) => 707 * (1 + 0.3 * u), gain: env.attackDecay(0.2, 0.15) });
    }
    s.noise(0.0, 0.7, { clock: (u) => 3000 + 2000 * Math.sin(2 * Math.PI * 6 * u), gain: env.swell(0.2) });
    s.thud(0.6, 0.35, 0.4);
    return s;
  },

  /** Generic self aura + accuracy-drop fleck (0.85 s): a spoon bends with a wobbly, twanging tone. */
  kinesis: () => {
    const s = new MoveSfx(1.5, 0x4135);
    s.wave(0.02, 0.4, { freq: (u) => 600 * (1 - 0.35 * Math.sin(Math.PI * u)), gain: env.swell(0.28) });
    s.wave(0.38, 0.4, { freq: (u) => 640 * (1 - 0.4 * Math.sin(Math.PI * u)), gain: env.swell(0.28) });
    s.pulse(0.72, 0.15, { freq: () => 1760, gain: env.decay(0.15, 1.5), duty: 0.25 });
    s.statDown(0.85);
    return s;
  },

  /** Generic target aura (~0.8 s, no fleck): the target is lifted by psychic force - a warbling tone that floats upward. */
  telekinesis: () => {
    const s = new MoveSfx(1.05, 0x7e1e);
    s.wave(0.02, 0.85, { freq: (u) => 330 * Math.pow(2, u) * (1 + 0.05 * Math.sin(2 * Math.PI * 7 * u)), gain: env.swell(0.26) });
    s.pulse(0.02, 0.85, { freq: (u) => 495 * Math.pow(2, u) * (1 + 0.05 * Math.sin(2 * Math.PI * 7 * u + 1)), gain: env.swell(0.1), duty: 0.125 });
    s.sparkle(0.4, 0.45, 4, { lo: 2500, hi: 4500, gain: 0.1 });
    return s;
  },

  /** Generic self aura (~0.8 s, no fleck): the user vanishes - a fast rising warp shimmer ending in a soft "blink". */
  teleport: () => {
    const s = new MoveSfx(1.05, 0x7e1f);
    s.chord(0.02, 0.7, [72, 79, 84], { rate: 0.025, gain: 0.16, vibrato: 0.01 });
    s.wave(0.02, 0.7, { freq: (u) => 220 * Math.pow(8, u), gain: env.swell(0.2) });
    s.noise(0.1, 0.6, { clock: env.ramp(3000, 12000), gain: env.swell(0.08) });
    s.pulse(0.72, 0.12, { freq: (u) => 2400 * (1 + u), gain: env.decay(0.2, 1.5), duty: 0.125 });
    return s;
  },

  /** Generic target aura (~0.8 s): a sly sleight of hand, two held items swap with a crossing warble and a pop. */
  trick: () => {
    const s = new MoveSfx(1.15, 0x7c1c);
    s.wave(0.02, 0.6, { freq: (u) => 440 * Math.pow(2, u) * (1 + 0.03 * Math.sin(2 * Math.PI * 10 * u)), gain: env.swell(0.2) });
    s.wave(0.02, 0.6, { freq: (u) => 880 * Math.pow(0.5, u) * (1 + 0.03 * Math.sin(2 * Math.PI * 10 * u)), gain: env.swell(0.17) });
    s.pulse(0.65, 0.05, { freq: () => 1568, gain: env.decay(0.2, 1), duty: 0.25 });
    s.pulse(0.72, 0.1, { freq: () => 2093, gain: env.decay(0.2, 1.5), duty: 0.25 });
    s.sparkle(0.7, 0.3, 4, { gain: 0.12 });
    return s;
  },

  /** Generic target aura (~0.8 s) on the whole field: space twists inside out, a warped tone flips direction. */
  trickroom: () => {
    const s = new MoveSfx(1.3, 0x7c00);
    s.wave(0.02, 0.9, { freq: (u) => (u < 0.5 ? 300 + 600 * u * 2 : 900 - 600 * (u - 0.5) * 2) * (1 + 0.04 * Math.sin(2 * Math.PI * 12 * u)), gain: env.swell(0.25) });
    s.pulse(0.02, 0.9, { freq: (u) => (u < 0.5 ? 900 - 600 * u * 2 : 300 + 600 * (u - 0.5) * 2), gain: env.swell(0.09), duty: 0.125 });
    s.noise(0.4, 0.15, { clock: () => 5000, gain: env.swell(0.12), short: true });
    s.pulse(0.85, 0.35, { freq: () => 220, gain: env.decay(0.18, 1.5), duty: 0.25 });
    s.pulse(0.85, 0.35, { freq: () => 233, gain: env.decay(0.12, 1.5), duty: 0.25 });
    return s;
  },

  /** Generic target aura (~0.8 s, field): space bends into a strange room, a warbling, twisting hum. */
  wonderroom: () => {
    const s = new MoveSfx(1.15, 0x3f50);
    s.wave(0.02, 0.85, { freq: (u) => 330 * (1 + 0.1 * Math.sin(2 * Math.PI * 4 * u)), gain: env.swell(0.3) });
    s.wave(0.02, 0.85, { freq: (u) => 494 * (1 - 0.1 * Math.sin(2 * Math.PI * 4 * u)), gain: env.swell(0.16) });
    s.pulse(0.05, 0.8, { freq: (u) => 165 * (1 + 0.04 * Math.sin(2 * Math.PI * 9 * u)), gain: env.swell(0.12), duty: 0.25 });
    s.arpeggio(0.75, [76, 72], 0.08, { gain: 0.15, voice: 'wave', hold: 0.18 });
    return s;
  },

  /** Generic melee (impact 0.17 s) + flinch fleck: a headbutt charged with a warbling psychic hum. */
  zenheadbutt: () => {
    const s = new MoveSfx(0.95, 0x2e4b);
    s.wave(0.0, 0.2, { freq: (u) => (400 + 500 * u) * (1 + 0.06 * Math.sin(2 * Math.PI * 8 * u)), gain: env.ramp(0.1, 0.3) });
    s.whoosh(0.0, 0.18, { from: 1500, to: 6000, gain: 0.25 });
    s.thud(0.17, 0.6, 0.6);
    s.wave(0.18, 0.35, { freq: (u) => 900 * Math.pow(0.6, u), gain: env.decay(0.25, 1.5) });
    s.flinch(0.45);
    return s;
  },
};
