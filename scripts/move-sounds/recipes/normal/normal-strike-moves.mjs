import { MoveSfx } from '../../move-sfx.mjs';
import { env } from '../../track.mjs';

/** Normal-type contact attacks (punches, tackles, slams, multi-hit strikes). */
export const NORMAL_STRIKE = {
  /** Generic self aura (priority): energy is stored up, tense and low. */
  bide: () => {
    const s = new MoveSfx(1.1, 0xb1de);
    s.pulse(0.02, 0.9, { freq: env.ramp(80, 120), gain: (u) => 0.22 * Math.min(1, u * 3) * (0.6 + 0.4 * Math.sin(2 * Math.PI * 8 * u)), duty: 0.125 });
    s.rumble(0.02, 0.9, { from: 300, to: 500, gain: 0.25 });
    s.pulse(0.85, 0.15, { freq: () => 240, gain: env.decay(0.25, 2), duty: 0.5 });
    return s;
  },

  /** NormalStrikeMoveAnimations.playBind: rings close in, then six squeezes 0.15 s apart (from 0.19 s). */
  bind: () => {
    const s = new MoveSfx(1.35, 0xb1d0);
    s.whoosh(0.0, 0.2, { from: 3000, to: 1200, gain: 0.25 });
    for (let j = 0; j < 6; j++) {
      const at = 0.19 + j * 0.15;
      s.wave(at, 0.12, { freq: env.ramp(320, 210), gain: env.decay(0.3, 1) });
      s.noise(at, 0.08, { clock: () => 900, gain: env.decay(0.18, 1) });
    }
    return s;
  },

  /** Generic melee + paralysis fleck: a full-body slam. */
  bodyslam: () => {
    const s = new MoveSfx(0.95, 0xb0d5);
    s.whoosh(0.0, 0.18, { from: 800, to: 2500, gain: 0.35 });
    s.thud(0.17, 0.85, 1);
    s.rumble(0.2, 0.3, { from: 300, to: 120, gain: 0.25 });
    s.paralyze(0.5, 0.2);
    return s;
  },

  /** Generic melee: a steady blow that chips bits off. */
  chipaway: () => {
    const s = new MoveSfx(0.7, 0xc1a0);
    s.whoosh(0.0, 0.18, { from: 1500, to: 5000, gain: 0.3 });
    s.thud(0.17, 0.55, 0.5);
    for (let i = 0; i < 3; i++) s.noise(0.24 + i * 0.07, 0.03, { clock: () => 5000 + s.random() * 3000, gain: env.decay(0.25 - i * 0.05, 1) });
    return s;
  },

  /** Generic melee punch, 3 hits (impacts at 0.17 / 0.59 / 1.01 s): punches like shooting stars. */
  cometpunch: () => {
    const s = new MoveSfx(1.3, 0xc0e7);
    for (let hit = 0; hit < 3; hit++) {
      const at = 0.17 + hit * 0.42;
      s.whoosh(at - 0.12, 0.13, { from: 2500, to: 8000, gain: 0.22 });
      s.thud(at, 0.55, 0.35);
      s.pulse(at + 0.02, 0.12, { freq: () => 2637 + hit * 200, gain: env.decay(0.1, 2), duty: 0.125 });
    }
    return s;
  },

  /** Generic melee + Speed drop fleck: the target gets squeezed tight. */
  constrict: () => {
    const s = new MoveSfx(1.0, 0xc057);
    s.thud(0.17, 0.4, 0.3);
    for (const at of [0.2, 0.32]) s.wave(at, 0.12, { freq: env.ramp(320, 200), gain: env.decay(0.3, 1) });
    s.statDown(0.5);
    return s;
  },

  /** Generic melee: an eager approach, a light hit, then a sneaky grab. */
  covet: () => {
    const s = new MoveSfx(0.9, 0xc0e2);
    s.arpeggio(0.0, [76, 79], 0.08, { gain: 0.18, voice: 'wave', hold: 0.1 });
    s.thud(0.17, 0.45, 0.3);
    s.pulse(0.35, 0.15, { freq: env.ramp(500, 1500), gain: env.decay(0.18, 1), duty: 0.25 });
    s.sparkle(0.5, 0.25, 4, { gain: 0.1 });
    return s;
  },

  /** Generic melee slash + Defense drop fleck: hard claws that crush. */
  crushclaw: () => {
    const s = new MoveSfx(1.0, 0xc2c1);
    s.whoosh(0.0, 0.18, { from: 2000, to: 8000, gain: 0.3 });
    s.slash(0.17, 0.5);
    s.thud(0.17, 0.5, 0.6);
    s.noise(0.22, 0.12, { clock: () => 3000, gain: env.decay(0.2, 1.5) });
    s.statDown(0.5);
    return s;
  },

  /** Generic melee: a grip tightens and crushes. */
  crushgrip: () => {
    const s = new MoveSfx(0.9, 0xc2c9);
    s.wave(0.0, 0.17, { freq: env.ramp(150, 260), gain: env.ramp(0.1, 0.3) });
    s.thud(0.17, 0.65, 0.8);
    for (let i = 0; i < 4; i++) s.noise(0.22 + i * 0.06, 0.04, { clock: () => 1500 + s.random() * 2000, gain: env.decay(0.25, 1) });
    s.pulse(0.3, 0.4, { freq: env.ramp(90, 60), gain: env.decay(0.18, 1), duty: 0.25 });
    return s;
  },

  /** Generic melee slash: a clean cut. */
  cut: () => {
    const s = new MoveSfx(0.55, 0xc07a);
    s.whoosh(0.0, 0.18, { from: 2500, to: 10000, gain: 0.35 });
    s.slash(0.17, 0.6);
    return s;
  },

  /**
   * NormalStrikeMoveAnimations.playDizzyPunch: lunge and fist slam (~0.33 s),
   * then birds fly out (0.62 s) and bob dizzily above the target (to ~2 s).
   */
  dizzypunch: () => {
    const s = new MoveSfx(2.05, 0xd122);
    s.whoosh(0.0, 0.2, { from: 1500, to: 6000, gain: 0.3 });
    s.thud(0.33, 0.65, 0.6);
    s.sparkle(0.35, 0.3, 5, { gain: 0.14 });
    s.chord(0.55, 1.4, [88, 91, 86], { rate: 0.08, gain: 0.35, vibrato: 0.02 });
    return s;
  },

  /**
   * NormalStrikeMoveAnimations.playDoubleEdge: runs a small circle (0.6 s),
   * the scene darkens (0.3 s + 0.15 s), rams the target (impact ~1.21 s), then a
   * sunburst and flying sparkles (to ~2.2 s).
   */
  doubleedge: () => {
    const s = new MoveSfx(2.25, 0xded9);
    s.noise(0.0, 0.6, { clock: (u) => 2000 + 1500 * Math.sin(2 * Math.PI * u), gain: env.swell(0.35) });
    s.pulse(0.6, 0.45, { freq: env.ramp(80, 140), gain: env.ramp(0.05, 0.35), duty: 0.25 });
    s.whoosh(1.05, 0.17, { from: 1500, to: 9000, gain: 0.4 });
    s.thud(1.21, 0.9, 1);
    s.noise(1.21, 0.4, { clock: (u) => 12000 - 9000 * u, gain: env.attackDecay(0.5, 0.02) });
    s.sparkle(1.25, 0.8, 12, { gain: 0.13 });
    s.thud(1.6, 0.3, 0.4);
    return s;
  },

  /** Generic melee, 2 hits (impacts at 0.17 / 0.59 s). */
  doublehit: () => {
    const s = new MoveSfx(0.85, 0xd0b1);
    for (const at of [0.17, 0.59]) {
      s.whoosh(at - 0.12, 0.13, { from: 1500, to: 5000, gain: 0.2 });
      s.thud(at, 0.6, 0.5);
    }
    return s;
  },

  /** Generic melee, 3 hits (impacts at 0.17 / 0.59 / 1.01 s): snappy slaps. */
  doubleslap: () => {
    const s = new MoveSfx(1.25, 0xd05a);
    for (let hit = 0; hit < 3; hit++) {
      const at = 0.17 + hit * 0.42;
      s.noise(at, 0.06, { clock: () => 15000, gain: env.decay(0.5, 1) });
      s.thud(at, 0.35, 0.2);
    }
    return s;
  },

  /** Generic melee (impact 0.17 s): a desperate, gritty all-out charge. */
  endeavor: () => {
    const s = new MoveSfx(0.75, 0xe0de);
    s.pulse(0.0, 0.17, { freq: env.ramp(150, 300), gain: env.ramp(0.08, 0.25), duty: 0.25 });
    s.whoosh(0.0, 0.17, { from: 1500, to: 6000, gain: 0.25 });
    s.thud(0.17, 0.65, 0.7);
    s.pulse(0.2, 0.2, { freq: env.ramp(500, 250), gain: env.decay(0.2, 2), duty: 0.125 });
    return s;
  },

  /** Generic melee, priority (impact 0.12 s): a blinding dash that cuts the air. */
  extremespeed: () => {
    const s = new MoveSfx(0.7, 0xe75d);
    s.whoosh(0.0, 0.13, { from: 4000, to: 16000, gain: 0.4 });
    s.pulse(0.0, 0.12, { freq: env.ramp(800, 2400), gain: env.ramp(0.05, 0.18), duty: 0.125 });
    s.thud(0.12, 0.6, 0.5);
    s.whoosh(0.14, 0.3, { from: 10000, to: 2000, gain: 0.18 });
    return s;
  },

  /** Generic melee (impact 0.17 s): a gutsy, angry body slam. */
  facade: () => {
    const s = new MoveSfx(0.7, 0xfacd);
    s.whoosh(0.0, 0.17, { from: 1200, to: 5000, gain: 0.25 });
    s.pulse(0.0, 0.15, { freq: env.ramp(180, 260), gain: env.ramp(0.05, 0.2), duty: 0.5 });
    s.thud(0.17, 0.7, 0.8);
    s.noise(0.17, 0.1, { clock: () => 5000, gain: env.decay(0.3, 1.5), short: true });
    return s;
  },

  /** Generic melee, quick (impact 0.12 s) + flinch fleck (~0.45 s): a sharp surprise clap. */
  fakeout: () => {
    const s = new MoveSfx(0.85, 0xfa0e);
    s.whoosh(0.0, 0.12, { from: 3000, to: 9000, gain: 0.3 });
    s.noise(0.12, 0.05, { clock: () => 16000, gain: env.decay(0.3, 1) });
    s.thud(0.12, 0.5, 0.3);
    s.pulse(0.12, 0.06, { freq: () => 1320, gain: env.decay(0.2, 1), duty: 0.25 });
    s.flinch(0.45, 0.3);
    return s;
  },

  /** Generic melee (impact 0.17 s): a light, held-back slash that leaves the foe hanging on. */
  falseswipe: () => {
    const s = new MoveSfx(0.75, 0xfa15);
    s.whoosh(0.0, 0.18, { from: 2000, to: 7000, gain: 0.3 });
    s.slash(0.17, 0.4);
    s.thud(0.19, 0.3, 0.2);
    s.wave(0.25, 0.3, { freq: env.ramp(660, 520), gain: env.decay(0.18, 1.5) });
    return s;
  },

  /** Generic melee (impact 0.17 s): frantic flailing, a burst of wild flurried blows. */
  flail: () => {
    const s = new MoveSfx(0.95, 0xf1a1);
    s.whoosh(0.0, 0.17, { from: 1500, to: 5000, gain: 0.3 });
    for (const [at, g] of [[0.17, 0.55], [0.26, 0.35], [0.33, 0.45], [0.42, 0.3], [0.5, 0.4]]) s.thud(at, g, 0.3 + s.random() * 0.4);
    s.whoosh(0.2, 0.35, { from: 4000, to: 2000, gain: 0.15 });
    return s;
  },

  /** Generic melee (impact at 0.17 s): a grudging, angry swat with a grumbling low tone. */
  frustration: () => {
    const s = new MoveSfx(0.85, 0xf2a7);
    s.pulse(0.0, 0.16, { freq: (u) => 140 + 30 * Math.sin(2 * Math.PI * 6 * u), gain: env.ramp(0.08, 0.2), duty: 0.25 });
    s.whoosh(0.03, 0.14, { from: 2000, to: 7000, gain: 0.25 });
    s.thud(0.17, 0.7, 0.6);
    s.thud(0.3, 0.4, 0.4);
    s.pulse(0.32, 0.3, { freq: (u) => 180 - 60 * u, gain: env.decay(0.15, 1.5), duty: 0.125 });
    return s;
  },

  /** Generic melee, 3 hits (impacts at 0.17 / 0.59 / 1.01 s): rapid horn jabs - sharp pecking stabs. */
  furyattack: () => {
    const s = new MoveSfx(1.3, 0xf0a7);
    for (let hit = 0; hit < 3; hit++) {
      const at = 0.17 + hit * 0.42;
      s.whoosh(at - 0.1, 0.1, { from: 3000, to: 9000, gain: 0.2 });
      s.thud(at, 0.5, 0.25);
      s.pulse(at, 0.06, { freq: () => 1760 + hit * 120, gain: env.decay(0.18, 1), duty: 0.25 });
    }
    return s;
  },

  /** Generic melee, 3 hits (impacts at 0.17 / 0.59 / 1.01 s): quick claw swipes. */
  furyswipes: () => {
    const s = new MoveSfx(1.3, 0xf05a);
    for (let hit = 0; hit < 3; hit++) {
      const at = 0.17 + hit * 0.42;
      s.whoosh(at - 0.1, 0.11, { from: 2500, to: 8000, gain: 0.2 });
      s.slash(at, 0.45);
      s.thud(at, 0.3, 0.2);
    }
    return s;
  },

  /** Generic melee (impact 0.17 s), 150 bp: a full-body charge smashes in with a huge, booming crash. */
  gigaimpact: () => {
    const s = new MoveSfx(1.0, 0x61a1);
    s.whoosh(0.0, 0.18, { from: 800, to: 4000, gain: 0.3 });
    s.thud(0.17, 0.75, 1);
    s.noise(0.17, 0.25, { clock: (u) => 8000 - 6000 * u, gain: env.attackDecay(0.4, 0.03) });
    s.rumble(0.2, 0.7, { from: 600, to: 150, gain: 0.35 });
    return s;
  },

  /** Generic melee (impact 0.17 s): giant pincers snap shut on the foe with a sharp, final clack. */
  guillotine: () => {
    const s = new MoveSfx(0.7, 0x6011);
    s.pulse(0.0, 0.17, { freq: env.ramp(1200, 2600), gain: env.swell(0.24), duty: 0.125 });
    s.slash(0.15, 0.4);
    s.noise(0.17, 0.06, { clock: () => 14000, gain: env.decay(0.25, 1), short: true });
    s.thud(0.18, 0.25, 0.5);
    s.pulse(0.18, 0.45, { freq: () => 1975, gain: env.decay(0.18, 1.5), duty: 0.125 });
    return s;
  },

  /**
   * NormalStrikeMoveAnimations.playHeadbutt: a quick dart forward and back
   * (0.26 s), then the starburst + star ring on the target (0.26-0.81 s).
   * A dull skull-on-body bonk with scattering stars.
   */
  headbutt: () => {
    const s = new MoveSfx(0.85, 0x4eb7);
    s.whoosh(0.0, 0.12, { from: 1500, to: 5000, gain: 0.28 });
    s.thud(0.12, 0.35, 0.3);
    s.thud(0.26, 0.85, 0.8);
    s.pulse(0.26, 0.12, { freq: (u) => 900 - 500 * u, gain: env.decay(0.2, 1.5), duty: 0.5 });
    s.sparkle(0.3, 0.45, 6, { lo: 2200, hi: 3600, gain: 0.12 });
    return s;
  },

  /** Generic melee (impact 0.17 s) + recoil (user flinches ~0.29 s): a reckless full-body ram with a heavy recoil jolt. */
  headcharge: () => {
    const s = new MoveSfx(0.95, 0x4ec4);
    s.whoosh(0.0, 0.18, { from: 1000, to: 4500, gain: 0.4 });
    s.thud(0.17, 0.95, 0.9);
    s.noise(0.17, 0.06, { clock: () => 6000, gain: env.decay(0.3, 1) });
    s.thud(0.29, 0.4, 0.5);
    s.rumble(0.2, 0.5, { from: 500, to: 150, gain: 0.2 });
    return s;
  },

  /** Generic melee (impact 0.17 s): a restrained, softened body blow. */
  holdback: () => {
    const s = new MoveSfx(0.7, 0x401d);
    s.whoosh(0.0, 0.17, { from: 1500, to: 4000, gain: 0.25 });
    s.thud(0.17, 0.5, 0.35);
    s.wave(0.24, 0.25, { freq: (u) => 520 - 180 * u, gain: env.decay(0.12, 1.5) });
    return s;
  },

  /** Generic melee (impact 0.17 s): a horn rams the target with a sharp stab. */
  hornattack: () => {
    const s = new MoveSfx(0.62, 0x4a77);
    s.whoosh(0.0, 0.17, { from: 2000, to: 7000, gain: 0.3 });
    s.pulse(0.15, 0.08, { freq: (u) => 1800 - 900 * u, gain: env.decay(0.25, 1.5), duty: 0.125 });
    s.thud(0.17, 0.6, 0.5);
    return s;
  },

  /** Generic melee (impact 0.17 s): the horn spins like a drill and grinds into the target (OHKO). */
  horndrill: () => {
    const s = new MoveSfx(1.0, 0x4d71);
    s.noise(0.0, 0.17, { clock: env.ramp(2000, 6000), gain: env.ramp(0.1, 0.25), short: true });
    s.thud(0.17, 0.5, 0.5);
    s.noise(0.17, 0.6, { clock: (u) => 5000 + 1500 * Math.sin(2 * Math.PI * 14 * u), gain: (u) => 0.3 * Math.pow(1 - u, 0.8), short: true });
    s.pulse(0.17, 0.6, { freq: (u) => 180 + 60 * Math.sin(2 * Math.PI * 14 * u), gain: env.decay(0.18, 1), duty: 0.25 });
    return s;
  },

  /**
   * NormalStrikeMoveAnimations.playHyperFang: big incisors drop (0-0.16 s) and clamp down
   * with a flash; red sparkle clusters pop until ~0.85 s. A hard crunching chomp.
   */
  hyperfang: () => {
    const s = new MoveSfx(0.95, 0x4f46);
    s.whoosh(0.0, 0.16, { from: 2000, to: 8000, gain: 0.25 });
    s.noise(0.16, 0.1, { clock: () => 14000, gain: env.attackDecay(0.5, 0.05), short: true });
    s.thud(0.16, 0.55, 0.45);
    s.pulse(0.28, 0.06, { freq: () => 1400, gain: env.decay(0.18, 1), duty: 0.25 });
    s.sparkle(0.25, 0.55, 8, { lo: 2000, hi: 4000, gain: 0.14 });
    return s;
  },

  /** Generic melee (impact 0.17 s), bp 140: a long wind-up rush and an all-out, booming body blow. */
  lastresort: () => {
    const s = new MoveSfx(0.95, 0x1a57);
    s.pulse(0.0, 0.17, { freq: env.ramp(300, 900), gain: env.ramp(0.08, 0.2), duty: 0.25 });
    s.whoosh(0.0, 0.18, { from: 1500, to: 8000, gain: 0.35 });
    s.thud(0.17, 0.8, 1);
    s.noise(0.17, 0.3, { clock: (u) => 12000 - 9000 * u, gain: env.attackDecay(0.4, 0.03) });
    s.pulse(0.2, 0.45, { freq: (u) => 110 * Math.pow(0.5, u), gain: env.decay(0.3, 1.5), duty: 0.5 });
    return s;
  },

  /**
   * NormalStrikeMoveAnimations.playMegaKick: the field goes black (0-0.25 s), a red
   * burst backdrop flares in (to 0.47 s), the giant foot pops in (to 0.69 s) and
   * trembles (to 1.34 s), then stamps down (impact 1.43 s); foot and scene fade
   * to ~2.2 s. Sound: a dark swell, a rising trembling build-up, then a huge kick.
   */
  megakick: () => {
    const s = new MoveSfx(2.15, 0x3e6c);
    s.wave(0.0, 0.47, { freq: () => 82, gain: env.swell(0.2) });
    s.noise(0.25, 0.25, { clock: env.ramp(1500, 4000), gain: env.swell(0.15) });
    s.pulse(0.47, 0.22, { freq: (u) => 400 + 400 * u, gain: env.swell(0.12), duty: 0.25 });
    s.pulse(0.69, 0.65, { freq: (u) => (110 + 110 * u) * (1 + 0.06 * Math.sin(2 * Math.PI * 25 * u)), gain: env.ramp(0.08, 0.2), duty: 0.5 });
    s.noise(0.69, 0.65, { clock: env.ramp(1000, 3000), gain: env.ramp(0.05, 0.16), short: true });
    s.whoosh(1.34, 0.09, { from: 3000, to: 9000, gain: 0.3 });
    s.thud(1.43, 0.9, 1);
    s.rumble(1.45, 0.65, { from: 400, to: 120, gain: 0.35 });
    return s;
  },

  /**
   * NormalStrikeMoveAnimations.playMegaPunch: the field dims (0-0.25 s), a big fist
   * rushes in and slams onto the target (impact 0.42 s) with a hit burst, ground
   * quakes (0.42 s and 0.9 s) and sparks scatter until ~1.7 s, then the scene clears.
   * Sound: a rushing swoop, a big punch with a second aftershock and crackling sparks.
   */
  megapunch: () => {
    const s = new MoveSfx(1.75, 0x3e6b);
    s.wave(0.0, 0.25, { freq: () => 98, gain: env.swell(0.15) });
    s.whoosh(0.2, 0.22, { from: 1500, to: 8000, gain: 0.35 });
    s.thud(0.42, 0.9, 0.9);
    s.noise(0.42, 0.1, { clock: () => 9000, gain: env.decay(0.3, 1) });
    s.rumble(0.45, 0.5, { from: 450, to: 150, gain: 0.3 });
    s.thud(0.9, 0.4, 1);
    s.rumble(0.9, 0.55, { from: 350, to: 120, gain: 0.22 });
    s.sparkle(0.5, 0.9, 10, { lo: 3000, hi: 6000, gain: 0.1 });
    return s;
  },

  /** Generic melee (0.17 s impact): a plain, round slap. */
  pound: () => {
    const s = new MoveSfx(0.6, 0x90d0);
    s.whoosh(0.0, 0.16, { from: 1500, to: 5000, gain: 0.2 });
    s.thud(0.17, 0.6, 0.45);
    return s;
  },

  /** Generic melee (priority, impact 0.12 s): a lightning-fast dash and a light tap. */
  quickattack: () => {
    const s = new MoveSfx(0.55, 0x9a77);
    s.whoosh(0.0, 0.13, { from: 3000, to: 12000, gain: 0.45 });
    s.pulse(0.0, 0.12, { freq: (u) => 800 + 1600 * u, gain: env.swell(0.12), duty: 0.125 });
    s.thud(0.12, 0.6, 0.3);
    return s;
  },

  /** Generic melee (impact 0.17 s): an angry charge with a growl and a hard blow. */
  rage: () => {
    const s = new MoveSfx(0.75, 0x7a6e);
    s.pulse(0.0, 0.18, { freq: (u) => 110 + 40 * Math.sin(2 * Math.PI * 4 * u), gain: env.swell(0.2), duty: 0.125 });
    s.whoosh(0.0, 0.18, { from: 1000, to: 3500, gain: 0.3 });
    s.thud(0.17, 0.8, 0.8);
    s.thud(0.27, 0.35, 0.5);
    return s;
  },

  /** Generic melee (impact 0.17 s): the user spins in, a whirring buzz around a hit. */
  rapidspin: () => {
    const s = new MoveSfx(0.8, 0x7a95);
    s.pulse(0.0, 0.55, { freq: (u) => 300 + 500 * u, gain: (u) => 0.18 * Math.sin(Math.PI * u) * (0.5 + 0.5 * Math.sin(2 * Math.PI * 14 * u)), duty: 0.25 });
    s.whoosh(0.0, 0.55, { from: 2000, to: 7000, gain: 0.25 });
    s.thud(0.17, 0.6, 0.4);
    s.noise(0.5, 0.15, { clock: (u) => 6000 - 3000 * u, gain: env.decay(0.15, 1) });
    return s;
  },

  /** Generic melee (impact 0.17 s): a vengeful counterblow – a stern low strike with a hard echo. */
  retaliate: () => {
    const s = new MoveSfx(0.85, 0x7e7a);
    s.pulse(0.0, 0.16, { freq: env.ramp(110, 160), gain: env.swell(0.2), duty: 0.25 });
    s.whoosh(0.0, 0.18, { from: 1200, to: 4500, gain: 0.3 });
    s.thud(0.17, 0.8, 0.8);
    s.thud(0.3, 0.4, 0.5);
    s.rumble(0.2, 0.4, { from: 400, to: 150, gain: 0.2 });
    return s;
  },

  /** Generic melee (impact 0.17 s): a heartfelt blow – clean hit with a warm, friendly chime. */
  return: () => {
    const s = new MoveSfx(0.85, 0x7e70);
    s.whoosh(0.0, 0.18, { from: 1500, to: 5000, gain: 0.3 });
    s.thud(0.17, 0.7, 0.55);
    s.arpeggio(0.25, [76, 81, 84], 0.07, { gain: 0.16, voice: 'wave', hold: 0.18 });
    return s;
  },

  /** Generic melee (impact 0.17 s) + confusion fleck (~0.6 s): a rugged climbing charge that shakes the target dizzy. */
  rockclimb: () => {
    const s = new MoveSfx(1.2, 0xc11b);
    s.rumble(0.0, 0.2, { from: 300, to: 600, gain: 0.3 });
    s.whoosh(0.0, 0.18, { from: 800, to: 3000, gain: 0.3 });
    s.thud(0.17, 0.85, 0.9);
    for (let i = 0; i < 4; i++) s.noise(0.22 + i * 0.06, 0.04, { clock: () => 1500 + s.random() * 1500, gain: env.decay(0.25 - i * 0.04, 1) });
    s.confusion(0.6, 0.18);
    return s;
  },

  /** Generic melee slash (impact 0.17 s): quick claw scratches – two bright rasps. */
  scratch: () => {
    const s = new MoveSfx(0.6, 0x5c7a);
    s.whoosh(0.0, 0.16, { from: 3000, to: 9000, gain: 0.25 });
    s.slash(0.17, 0.55);
    s.noise(0.22, 0.08, { clock: (u) => 14000 - 6000 * u, gain: env.attackDecay(0.3, 0.1) });
    s.pulse(0.2, 0.08, { freq: (u) => 1800 - 800 * u, gain: env.decay(0.12, 1.5), duty: 0.125 });
    return s;
  },

  /**
   * CHARGE, played on both turns. Turn 1 (playSkullBashCharge): rears back twice (0.11 / 0.39 s), orange sparkles
   * drift down to ~1.75 s. Turn 2 (playSkullBash): dark 0.3 s, darts at 0.37 / 0.51 / 0.66 s, fiery blast 0.72 s.
   * Sound: tense double wind-up, quick dashes, a heavy headbutt crash and sparkling embers.
   */
  skullbash: () => {
    const s = new MoveSfx(1.85, 0x5b01);
    s.whoosh(0.02, 0.18, { from: 800, to: 2000, gain: 0.2 });
    s.whoosh(0.3, 0.18, { from: 800, to: 2000, gain: 0.2 });
    [0.37, 0.51, 0.66].forEach((at) => s.whoosh(at - 0.07, 0.08, { from: 2500, to: 8000, gain: 0.22 }));
    s.thud(0.72, 0.8, 1);
    s.noise(0.74, 0.5, { clock: env.ramp(1600, 400), gain: env.attackDecay(0.35, 0.05) });
    s.sparkle(0.85, 0.85, 9, { lo: 2000, hi: 4000, gain: 0.14 });
    return s;
  },

  /** NormalStrikeMoveAnimations.playSlam: squash + flash at 0 s, sparks fly out to ~0.6 s. A flat, heavy smack with crackling sparks. */
  slam: () => {
    const s = new MoveSfx(0.75, 0x51a4);
    s.thud(0.0, 0.85, 0.9);
    s.noise(0.0, 0.1, { clock: () => 12000, gain: env.decay(0.4, 2) });
    s.sparkle(0.05, 0.45, 6, { lo: 3000, hi: 6000, gain: 0.15 });
    return s;
  },

  /**
   * NormalStrikeMoveAnimations.playSlash: the blade draws across (0-0.36 s),
   * the spark star flashes at 0.11 s and sparks spray out until ~0.9 s.
   * A sharp double-edged cut with fizzing sparks.
   */
  slash: () => {
    const s = new MoveSfx(0.9, 0x51a5);
    s.whoosh(0.0, 0.12, { from: 3000, to: 12000, gain: 0.3 });
    s.slash(0.1, 0.4);
    s.pulse(0.11, 0.2, { freq: (u) => 3200 - 1800 * u, gain: env.decay(0.18, 1.5), duty: 0.125 });
    s.thud(0.12, 0.25, 0.2);
    s.noise(0.15, 0.65, { clock: () => 8000, gain: env.attackDecay(0.12, 0.1), short: true });
    s.sparkle(0.16, 0.6, 14, { lo: 3500, hi: 7000, gain: 0.2 });
    return s;
  },

  /** Generic melee (impact 0.17 s): a sharp slap that jolts the target awake. */
  smellingsalts: () => {
    const s = new MoveSfx(0.75, 0x5a17);
    s.whoosh(0.0, 0.18, { from: 1500, to: 5000, gain: 0.3 });
    s.thud(0.17, 0.6, 0.4);
    s.noise(0.17, 0.06, { clock: () => 15000, gain: env.decay(0.35, 1) });
    s.arpeggio(0.27, [84, 91], 0.06, { gain: 0.16, duty: 0.25, hold: 0.09 });
    return s;
  },

  /** Generic melee (kick style) + flinch fleck: a heavy foot stamps down. */
  stomp: () => {
    const s = new MoveSfx(0.85, 0x5707);
    s.whoosh(0.0, 0.18, { from: 700, to: 2000, gain: 0.3 });
    s.thud(0.17, 0.85, 1);
    s.rumble(0.2, 0.25, { from: 260, to: 100, gain: 0.25 });
    s.flinch(0.6);
    return s;
  },

  /**
   * NormalStrikeMoveAnimations.playStrength: the caster glows red and trembles
   * (0-0.8 s), six bursts pound the target (0.8-1.4 s, 0.12 s apart), embers to
   * ~1.9 s. A straining power-up, then a pummelling flurry.
   */
  strength: () => {
    const s = new MoveSfx(2.1, 0x57e9);
    s.pulse(0.0, 0.8, { freq: env.ramp(70, 120), gain: (u) => 0.22 * Math.min(1, u * 4) * (0.6 + 0.4 * Math.sin(2 * Math.PI * 12 * u)), duty: 0.5 });
    s.rumble(0.0, 0.8, { from: 160, to: 260, gain: 0.2 });
    for (let i = 0; i < 6; i++) {
      const at = 0.8 + i * 0.12;
      s.thud(at, 0.55 + 0.05 * i, 0.8);
      s.noise(at, 0.08, { clock: () => 2500 + s.random() * 2000, gain: env.decay(0.25, 1.5) });
    }
    s.rumble(1.45, 0.5, { from: 300, to: 110, gain: 0.25 });
    s.sparkle(1.0, 0.9, 8, { lo: 1800, hi: 3500, gain: 0.1 });
    return s;
  },


  /** Generic melee + 1/4 HP self-damage (~0.12 s after impact): a desperate flailing hit. */
  struggle: () => {
    const s = new MoveSfx(0.7, 0x5706);
    s.whoosh(0.0, 0.18, { from: 1200, to: 3500, gain: 0.3 });
    s.thud(0.17, 0.7, 0.5);
    s.thud(0.3, 0.35, 0.3);
    s.pulse(0.32, 0.25, { freq: (u) => 400 * Math.pow(0.5, u), gain: env.decay(0.15, 1.5), duty: 0.25 });
    return s;
  },

  /** Generic melee: big fangs snap shut with a sharp double crunch. */
  superfang: () => {
    const s = new MoveSfx(0.65, 0x5f46);
    s.whoosh(0.0, 0.18, { from: 2000, to: 6000, gain: 0.25 });
    s.noise(0.17, 0.05, { clock: () => 14000, gain: env.decay(0.35, 1) });
    s.thud(0.17, 0.6, 0.3);
    s.noise(0.25, 0.06, { clock: () => 9000, gain: env.decay(0.3, 1) });
    s.pulse(0.25, 0.1, { freq: env.ramp(900, 500), gain: env.decay(0.2, 1), duty: 0.125 });
    return s;
  },

  /** Generic melee (impact 0.17 s): the classic clean body tackle - short rush, solid thump. */
  tackle: () => {
    const s = new MoveSfx(0.6, 0x7ac1);
    s.whoosh(0.0, 0.18, { from: 1200, to: 4000, gain: 0.3 });
    s.thud(0.17, 0.75, 0.6);
    s.noise(0.2, 0.15, { clock: () => 1200, gain: env.decay(0.15, 1.5) });
    return s;
  },

  /** Generic melee, 3 hits (impacts at 0.17 / 0.59 / 1.01 s): quick, light whip-slaps of a tail. */
  tailslap: () => {
    const s = new MoveSfx(1.3, 0x7a15);
    for (let hit = 0; hit < 3; hit++) {
      const at = 0.17 + hit * 0.42;
      s.whoosh(at - 0.13, 0.14, { from: 2000, to: 9000, gain: 0.22 });
      s.noise(at, 0.06, { clock: () => 16000, gain: env.decay(0.5, 1) });
      s.thud(at, 0.4, 0.2);
      s.pulse(at + 0.01, 0.07, { freq: () => 1300 + hit * 150, gain: env.decay(0.12, 1.5), duty: 0.25 });
    }
    return s;
  },

  /** Generic melee at high power (impact 0.17 s) + recoil (~0.29 s): a reckless full-body charge, then the user's own jolt. */
  takedown: () => {
    const s = new MoveSfx(0.85, 0x7a4d);
    s.whoosh(0.0, 0.18, { from: 800, to: 3000, gain: 0.4 });
    s.thud(0.17, 0.85, 0.9);
    s.rumble(0.19, 0.3, { from: 400, to: 150, gain: 0.25 });
    s.thud(0.29, 0.35, 0.4);
    return s;
  },

  /** Generic melee (impact 0.17 s): a sneaky swipe - quick slap, then a little "snatched it" pickup jingle. */
  thief: () => {
    const s = new MoveSfx(0.85, 0x7d1e);
    s.whoosh(0.0, 0.17, { from: 2500, to: 8000, gain: 0.28 });
    s.thud(0.17, 0.55, 0.4);
    s.noise(0.17, 0.05, { clock: () => 14000, gain: env.decay(0.35, 1) });
    s.arpeggio(0.36, [76, 83], 0.07, { gain: 0.16, duty: 0.25, hold: 0.1 });
    s.pulse(0.5, 0.18, { freq: env.ramp(500, 260), gain: env.decay(0.12, 1.5), duty: 0.125 });
    return s;
  },

  /** Generic melee at max power (impact 0.17 s): a wild rampage - heavy blow followed by a flurry of flailing hits. */
  thrash: () => {
    const s = new MoveSfx(1.05, 0x7a5f);
    s.whoosh(0.0, 0.18, { from: 1000, to: 4000, gain: 0.4 });
    s.thud(0.17, 0.85, 1);
    for (const [at, g] of [[0.36, 0.45], [0.5, 0.38], [0.63, 0.3]]) {
      s.thud(at, g, 0.4);
      s.noise(at, 0.04, { clock: () => 12000, gain: env.decay(g * 0.6, 1) });
    }
    s.rumble(0.2, 0.7, { from: 450, to: 150, gain: 0.2 });
    return s;
  },

  /** Generic melee (impact 0.17 s): pincers swing in and clamp shut with a hard metallic snap. */
  visegrip: () => {
    const s = new MoveSfx(0.75, 0x515e);
    s.whoosh(0.0, 0.17, { from: 1500, to: 5000, gain: 0.25 });
    s.thud(0.17, 0.55, 0.45);
    s.noise(0.17, 0.06, { clock: () => 12000, gain: env.decay(0.35, 1.5), short: true });
    s.pulse(0.19, 0.12, { freq: () => 1760, gain: env.decay(0.18, 2), duty: 0.125 });
    s.wave(0.24, 0.3, { freq: env.ramp(260, 200), gain: env.decay(0.18, 1) });
    return s;
  },

  /** Generic melee (impact 0.17 s): the user coils round the target and squeezes tight - a creaking constriction. */
  wrap: () => {
    const s = new MoveSfx(0.95, 0x3e9a);
    s.whoosh(0.0, 0.17, { from: 1500, to: 4000, gain: 0.25 });
    s.thud(0.17, 0.5, 0.4);
    s.pulse(0.2, 0.55, { freq: (u) => 180 + 60 * u + 15 * Math.sin(2 * Math.PI * 8 * u), gain: (u) => 0.2 * Math.sin(Math.PI * u), duty: 0.125 });
    s.noise(0.2, 0.55, { clock: () => 2500, gain: (u) => 0.12 * Math.sin(Math.PI * u) * (0.5 + 0.5 * Math.sin(2 * Math.PI * 7 * u)) });
    return s;
  },

  /** Generic projectile (impact 0.43 s), contact: grabs the target and wrings it out - a rising strain, then a hard squeeze. */
  wringout: () => {
    const s = new MoveSfx(1.0, 0x3e90);
    s.pulse(0.0, 0.43, { freq: env.ramp(150, 330), gain: env.ramp(0.08, 0.22), duty: 0.25 });
    s.noise(0.0, 0.43, { clock: env.ramp(1500, 4000), gain: env.ramp(0.06, 0.2) });
    s.thud(0.43, 0.6, 0.6);
    s.pulse(0.45, 0.4, { freq: (u) => 300 * (1 + 0.05 * Math.sin(2 * Math.PI * 14 * u)) * Math.pow(0.6, u), gain: env.decay(0.25, 1.2), duty: 0.125 });
    return s;
  },
};
