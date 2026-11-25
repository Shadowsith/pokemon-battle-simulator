import { MoveSfx } from '../move-sfx.mjs';
import { env } from '../track.mjs';

/** Ghost-type move sounds. */
export const GHOST = {
  /** Astonish.play (the target jolts at 0.15 s, a "!" burst pops 0.15-0.55 s, sweat drops spray off to 0.65 s): a rising spooky wail, a startle hit with a "!" blip, then a flinch. */
  astonish: () => {
    const s = new MoveSfx(0.75, 0xa570);
    s.pulse(0.0, 0.15, { freq: (u) => (300 + 600 * u) * (1 + 0.06 * Math.sin(2 * Math.PI * 4 * u)), gain: env.ramp(0.05, 0.25), duty: 0.25 });
    s.thud(0.15, 0.5, 0.3);
    s.arpeggio(0.16, [78], 0.15, { gain: 0.2, duty: 0.5 });
    s.arpeggio(0.16, [79], 0.15, { gain: 0.15, voice: 'wave' });
    s.flinch(0.38);
    return s;
  },

  /**
   * GhostMoveAnimations.playConfuseRay: dark (0-0.28 s), the orb wavers to the target and
   * loops round it (0.28-1.58 s), flash, the scene clears, birds circle (1.83-3.23 s).
   * An eerie warbling light, a soft flash, then the dizzy chime.
   */
  confuseray: () => {
    const s = new MoveSfx(3.4, 0xc0f2);
    s.wave(0.28, 1.3, { freq: (u) => 600 * (1 + 0.15 * Math.sin(2 * Math.PI * 4 * u)), gain: env.swell(0.28) });
    s.pulse(0.28, 1.3, { freq: (u) => 1200 * (1 + 0.15 * Math.sin(2 * Math.PI * 4 * u + 1)), gain: env.swell(0.07), duty: 0.125 });
    s.wave(1.58, 0.3, { freq: (u) => 1400 * Math.pow(0.5, u), gain: env.decay(0.22, 1.5) });
    s.confusion(1.85);
    s.confusion(2.5, 0.16);
    return s;
  },

  /**
   * GhostMoveAnimations.playCurse: the purple circle spreads (0-0.35 s), the nail flies in
   * (0.35-0.6 s), hammer blows at ~0.75 / ~0.95 s, pulse and fade by ~1.55 s.
   * An ominous drone, a nail flying in and being hammered down.
   */
  curse: () => {
    const s = new MoveSfx(1.6, 0xc025);
    s.pulse(0.02, 1.4, { freq: () => 110, gain: env.swell(0.18), duty: 0.25 });
    s.pulse(0.02, 1.4, { freq: () => 116.5, gain: env.swell(0.14), duty: 0.25 });
    s.whoosh(0.35, 0.25, { from: 2500, to: 7000, gain: 0.2 });
    s.thud(0.75, 0.55, 0.6);
    s.noise(0.75, 0.04, { clock: () => 12000, gain: env.decay(0.3, 1) });
    s.thud(0.95, 0.65, 0.6);
    s.noise(0.95, 0.04, { clock: () => 12000, gain: env.decay(0.35, 1) });
    s.wave(1.0, 0.55, { freq: env.ramp(500, 350), gain: env.decay(0.15, 1.5) });
    return s;
  },


  /**
   * GhostMoveAnimations.playDestinyBond: the ghostly haze fades in (0-0.35 s), the white disc
   * glides to the foe (0.45-1.15 s), the foe glows white at 1.15 s (to ~1.65 s), the haze
   * clears by ~2.0 s. A ghostly bond, with an eerie wail and a pale chime on the bond.
   */
  destinybond: () => {
    const s = new MoveSfx(2.0, 0xde57);
    s.pulse(0.02, 1.9, { freq: () => 73.4, gain: (u) => 0.2 * Math.sin(Math.PI * u) * (0.6 + 0.4 * Math.sin(2 * Math.PI * 6 * u)), duty: 0.25 });
    s.pulse(0.02, 1.9, { freq: () => 77.8, gain: env.swell(0.12), duty: 0.25 });
    s.wave(0.45, 0.7, { freq: (u) => 500 + 300 * Math.sin(Math.PI * u), gain: env.swell(0.22) });
    s.chord(1.15, 0.6, [79, 83, 86], { rate: 0.03, gain: 0.14, voice: 'wave', vibrato: 0.01 });
    return s;
  },


  /** Grudge.play (dark scene 0-0.25 s, ghost flames flicker round the user 0.2-1.25 s with a magenta tint, clear by 1.5 s): a low, wavering ghostly moan. */
  grudge: () => {
    const s = new MoveSfx(1.5, 0x6ad6);
    s.wave(0.02, 1.3, { freq: (u) => 330 * (1 - 0.25 * u) * (1 + 0.03 * Math.sin(2 * Math.PI * 6 * u)), gain: env.swell(0.2) });
    s.pulse(0.2, 1.1, { freq: (u) => 349 * (1 - 0.25 * u) * (1 + 0.04 * Math.sin(2 * Math.PI * 5 * u)), gain: env.swell(0.1), duty: 0.125 });
    s.noise(0.2, 1.05, { clock: () => 1200, gain: env.swell(0.05) });
    return s;
  },

  /** Generic projectile (0.43 s): a wailing cursed orb that hits with an eerie dissonant chord. */
  hex: () => {
    const s = new MoveSfx(1.0, 0x4e70);
    s.wave(0.0, 0.45, { freq: (u) => (440 + 200 * u) * (1 + 0.05 * Math.sin(2 * Math.PI * 7 * u)), gain: env.ramp(0.12, 0.26) });
    s.noise(0.0, 0.43, { clock: () => 2500, gain: env.swell(0.1) });
    s.noise(0.43, 0.2, { clock: env.ramp(6000, 1500), gain: env.attackDecay(0.35, 0.05) });
    s.chord(0.43, 0.5, [61, 62, 68], { rate: 0.035, gain: 0.26, vibrato: 0.03 });
    return s;
  },

  /**
   * GhostMoveAnimations.playLick: the tongue licks up the target (0-0.3 s, hit at 0.2 s) and
   * fades (to 0.65 s), a white glint streaks up (0.45-0.8 s). A wet slurp, then a shiny ping.
   */
  lick: () => {
    const s = new MoveSfx(1.0, 0x11c4);
    s.wave(0.0, 0.3, { freq: (u) => (300 + 500 * u) * (1 + 0.08 * Math.sin(2 * Math.PI * 18 * u)), gain: env.swell(0.28) });
    s.noise(0.12, 0.18, { clock: (u) => 4000 - 2500 * u, gain: env.attackDecay(0.3, 0.1) });
    s.thud(0.2, 0.35, 0.2);
    s.pulse(0.22, 0.2, { freq: (u) => 500 - 250 * u, gain: env.decay(0.15, 1.5), duty: 0.25 });
    s.pulse(0.5, 0.2, { freq: (u) => 2637 * (1 + 0.2 * u), gain: env.decay(0.12, 1.5), duty: 0.125 });
    return s;
  },

  /** Nightmare.play (swirling dream scene 0-0.2 s, flickers at 0.45 / 1.05 s, target trembles 0.25-1.25 s, clears 1.3-1.5 s): slow detuned moans sinking into the dark, cut by two eerie blips. */
  nightmare: () => {
    const s = new MoveSfx(1.6, 0x4a6e);
    s.wave(0.0, 1.45, { freq: (u) => 220 - 70 * u + 6 * Math.sin(2 * Math.PI * 3 * u), gain: env.swell(0.2) });
    s.wave(0.0, 1.45, { freq: (u) => 233 - 75 * u, gain: env.swell(0.14) });
    for (const at of [0.45, 1.05]) s.pulse(at, 0.1, { freq: env.ramp(1200, 600), gain: env.decay(0.14, 1), duty: 0.125 });
    return s;
  },

  /**
   * GhostMoveAnimations.playNightShade: screen darkens (0-0.35 s), the caster
   * glows in a pale halo (0.35-1.35 s), the target dims and trembles
   * (1.35-2.35 s), darkness lifts (to ~2.65 s). A falling hush, a pale eerie
   * shimmer, then a low quivering drone over the shaking target.
   */
  nightshade: () => {
    const s = new MoveSfx(2.75, 0x5ade);
    s.pulse(0.0, 0.35, { freq: env.ramp(220, 70), gain: env.ramp(0.05, 0.2), duty: 0.25 });
    s.noise(0.0, 0.35, { clock: env.ramp(3000, 600), gain: env.swell(0.12) });
    s.wave(0.35, 1.0, { freq: (u) => 740 * (1 + 0.03 * Math.sin(2 * Math.PI * 6 * u)), gain: env.swell(0.26) });
    s.chord(0.4, 0.9, [85, 88], { rate: 0.05, gain: 0.08, voice: 'pulse', vibrato: 0.02 });
    s.thud(1.35, 0.4, 0.6);
    s.pulse(1.35, 1.05, { freq: (u) => 82 * (1 + 0.06 * Math.sin(2 * Math.PI * 20 * u)), gain: (u) => 0.28 * Math.min(1, u * 10) * Math.min(1, (1 - u) * 4), duty: 0.25 });
    s.noise(1.35, 1.0, { clock: () => 900, gain: (u) => 0.12 * (0.5 + 0.5 * Math.sin(2 * Math.PI * 20 * u)) * Math.min(1, (1 - u) * 4) });
    s.wave(2.3, 0.4, { freq: env.ramp(300, 500), gain: env.decay(0.12, 1.5) });
    return s;
  },

  /** Generic projectile (0.43 s), no fleck: a howling, eerie gust rushes over and buffets the target. */
  ominouswind: () => {
    const s = new MoveSfx(1.0, 0x0a1d);
    s.noise(0.0, 0.75, { clock: (u) => 900 + 600 * Math.sin(2 * Math.PI * 3 * u), gain: (u) => 0.3 * Math.min(1, u * 5) * Math.pow(1 - u, 0.8) });
    s.wave(0.0, 0.7, { freq: (u) => (350 + 250 * Math.sin(Math.PI * u)) * (1 + 0.04 * Math.sin(2 * Math.PI * 6 * u)), gain: env.swell(0.22) });
    s.thud(0.43, 0.4, 0.5);
    return s;
  },

  /**
   * Two-turn move (plays on both turns), custom. Turn 1 (1.2 s): darkness and
   * the portal open (0-0.5 s), the user sinks in (0.5-0.95 s), it closes.
   * Turn 2 (1.8 s): darkness, portal and wisps (0-0.6 s), the user drops out
   * and strikes at 0.85 s, purple flames rise (to 1.8 s). An eerie warble
   * swelling into a hollow ghostly boom at 0.85 s, then a fading moan.
   */
  phantomforce: () => {
    const s = new MoveSfx(1.95, 0x9fa7);
    s.wave(0.0, 0.85, { freq: (u) => (300 + 300 * u) * (1 + 0.05 * Math.sin(2 * Math.PI * 9 * u)), gain: env.swell(0.2) });
    s.noise(0.2, 0.6, { clock: (u) => 1200 + 1500 * u, gain: env.swell(0.12) });
    s.whoosh(0.6, 0.25, { from: 4000, to: 800, gain: 0.2 });
    s.thud(0.85, 0.55, 0.7);
    s.pulse(0.85, 0.2, { freq: (u) => 900 - 500 * u, gain: env.decay(0.18, 1.5), duty: 0.25 });
    s.wave(1.0, 0.8, { freq: (u) => 466 * (1 - 0.3 * u) * (1 + 0.03 * Math.sin(2 * Math.PI * 25 * u)), gain: env.decay(0.14, 1) });
    return s;
  },

  /** Custom (ball gathers 0-0.25 s, hurled, impact 0.52 s) + Sp. Def drop fleck (~0.65 s): a dark, wobbling orb of shadow that lands with a hollow boom. */
  shadowball: () => {
    const s = new MoveSfx(1.15, 0x5ba1);
    s.wave(0.0, 0.52, { freq: (u) => (200 + 150 * Math.sin(Math.PI * u)) * (1 + 0.06 * Math.sin(2 * Math.PI * 8 * u)), gain: env.ramp(0.12, 0.28) });
    s.pulse(0.0, 0.52, { freq: (u) => 212 + 160 * Math.sin(Math.PI * u), gain: env.swell(0.08), duty: 0.125 });
    s.thud(0.52, 0.65, 0.8);
    s.noise(0.52, 0.3, { clock: env.ramp(2500, 500), gain: env.attackDecay(0.3, 0.05) });
    s.statDown(0.68, 0.22);
    return s;
  },

  /** Custom (three black claws rake 0-0.75 s, hit 0.1 s, red specks to 0.9 s, black smoke 0.45-1.0 s): an eerie hiss, three quick cuts with a sour ring and a dark puff. */
  shadowclaw: () => {
    const s = new MoveSfx(1.15, 0x5c1a);
    s.wave(0.0, 0.15, { freq: (u) => (300 + 500 * u) * (1 + 0.05 * Math.sin(2 * Math.PI * 4 * u)), gain: env.ramp(0.05, 0.2) });
    for (let i = 0; i < 3; i++) s.slash(0.04 + i * 0.06, 0.5 - i * 0.08);
    s.chord(0.15, 0.4, [73, 74], { rate: 0.04, gain: 0.14, vibrato: 0.03 });
    s.noise(0.45, 0.45, { clock: env.ramp(1200, 400), gain: env.swell(0.2) });
    return s;
  },

  /**
   * CHARGE, played on both turns. Turn 1 (ShadowForce.vanish): the user flickers out (0-0.6 s). Turn 2 (ShadowForce.strike):
   * grey scene 0-0.3 s, the user reappears mid-lunge 0.3-0.6 s, purple flash on the target 0.6 s, black clouds 0.6-1.3 s, clears to 1.6 s.
   * Sound: a vanishing ghostly swoosh, then a crushing, dissonant shadow surge, a hit and billowing darkness.
   */
  shadowforce: () => {
    const s = new MoveSfx(1.7, 0x5f0c);
    s.wave(0.0, 0.5, { freq: (u) => 900 * Math.pow(0.4, u), gain: env.attackDecay(0.22, 0.3) });
    s.whoosh(0.0, 0.45, { from: 4000, to: 1200, gain: 0.2 });
    s.pulse(0.3, 0.8, { freq: (u) => 110 * (1 + 0.04 * Math.sin(2 * Math.PI * 6 * u)), gain: env.swell(0.22), duty: 0.25 });
    s.pulse(0.3, 0.8, { freq: () => 116.5, gain: env.swell(0.14), duty: 0.125 });
    s.thud(0.6, 0.7, 0.8);
    s.chord(0.62, 0.45, [61, 62, 68], { rate: 0.035, gain: 0.16, vibrato: 0.03 });
    s.noise(0.65, 0.7, { clock: env.ramp(1500, 400), gain: env.swell(0.22) });
    return s;
  },

  /** ShadowPunch.play (user fades to shadow 0-0.25 s, shadow fist flies 0.25-0.6 s, hit 0.6 s, burst fades to 0.95 s): a warbly wail rising as the fist flies, a dull hit and a ghostly echo. */
  shadowpunch: () => {
    const s = new MoveSfx(1.1, 0x5a9c);
    s.wave(0.0, 0.25, { freq: (u) => 200 * (1 + 0.07 * Math.sin(2 * Math.PI * 5 * u)), gain: env.swell(0.1) });
    s.wave(0.25, 0.35, { freq: (u) => (250 + 400 * u) * (1 + 0.07 * Math.sin(2 * Math.PI * 5 * u)), gain: env.ramp(0.05, 0.22) });
    s.whoosh(0.3, 0.3, { from: 1500, to: 5000, gain: 0.18 });
    s.thud(0.6, 0.75, 0.6);
    s.wave(0.63, 0.4, { freq: (u) => 440 * (1 - 0.3 * u) * (1 + 0.04 * Math.sin(2 * Math.PI * 9 * u)), gain: env.decay(0.18, 1.5) });
    return s;
  },

  /** Generic melee, priority (impact 0.12 s), no fleck: a shadow creeps up fast - a quick low slither and a sharp jab. */
  shadowsneak: () => {
    const s = new MoveSfx(0.6, 0x5a5e);
    s.pulse(0.0, 0.13, { freq: env.ramp(90, 200), gain: env.ramp(0.08, 0.22), duty: 0.25 });
    s.noise(0.0, 0.12, { clock: env.ramp(1500, 4000), gain: env.swell(0.2) });
    s.thud(0.12, 0.65, 0.4);
    s.wave(0.14, 0.3, { freq: (u) => 600 * Math.pow(0.6, u), gain: env.decay(0.14, 1.5) });
    return s;
  },

  /** Spite.play (scene darkens 0-0.25 s, user flares pale at 0.35 / 0.65 s, target dims at 0.85 s): a hollow ghostly drone, two spiteful whines and a draining drop. */
  spite: () => {
    const s = new MoveSfx(1.35, 0x5b17);
    s.wave(0.0, 1.15, { freq: () => 130, gain: env.swell(0.16) });
    for (const at of [0.35, 0.65]) s.wave(at, 0.2, { freq: env.ramp(900, 1300), gain: env.attackDecay(0.14, 0.05) });
    s.pulse(0.85, 0.25, { freq: env.ramp(600, 150), gain: env.decay(0.18, 1), duty: 0.125 });
    return s;
  },

  /**
   * Custom (2.2 s): soft pops as the white puffs appear (0.1-0.6 s), a spooky
   * warbling tune as the little ghosts float over and swirl (0.35-1.45 s),
   * then a low "boo" as the big ghost rises behind the target (1.2-2.05 s).
   */
  trickortreat: () => {
    const s = new MoveSfx(2.2, 0x7071);
    for (const t of [0.1, 0.17, 0.24, 0.31]) s.noise(t, 0.08, { clock: () => 3000, gain: env.decay(0.18) });
    s.arpeggio(0.35, [69, 72, 75, 72, 70, 67], 0.18, { gain: 0.14, voice: 'wave', hold: 0.18 });
    s.wave(0.35, 1.1, { freq: (u) => 700 + 80 * Math.sin(u * 30), gain: env.swell(0.08) });
    s.wave(1.2, 0.85, { freq: env.ramp(330, 150), gain: env.swell(0.22) });
    return s;
  },
};
