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

  /**
   * NormalBlowMoveAnimations.playBodySlam: hop (0-0.32 s), slam at 0.32 s, specks scatter
   * and sink (to ~1.2 s). A rising hop, a heavy thud with a rumble, falling specks.
   */
  bodyslam: () => {
    const s = new MoveSfx(1.3, 0xb0d5);
    s.whoosh(0.0, 0.32, { from: 800, to: 2500, gain: 0.32 });
    s.thud(0.32, 0.9, 1);
    s.rumble(0.34, 0.35, { from: 300, to: 110, gain: 0.25 });
    s.sparkle(0.4, 0.7, 6, { lo: 2500, hi: 4500, gain: 0.1 });
    return s;
  },

  /** Custom (slip 0-0.25 s, hit 0.25 s, sparks to 0.75 s, specks drift to ~1.05 s): a soft rush, a steady blow, chipped bits. */
  chipaway: () => {
    const s = new MoveSfx(1.15, 0xc1a0);
    s.whoosh(0.0, 0.25, { from: 1500, to: 5000, gain: 0.28 });
    s.thud(0.25, 0.55, 0.5);
    s.sparkle(0.28, 0.4, 5, { lo: 4000, hi: 7000, gain: 0.14 });
    for (let i = 0; i < 3; i++) s.noise(0.55 + i * 0.12, 0.03, { clock: () => 5000 + s.random() * 3000, gain: env.decay(0.15 - i * 0.03, 1) });
    return s;
  },

  /** NormalBlowMoveAnimations.playCometPunch, 3 hits (impacts at 0.09 / 0.39 / 0.69 s): quick jabs like shooting stars. */
  cometpunch: () => {
    const s = new MoveSfx(1.05, 0xc0e7);
    for (let hit = 0; hit < 3; hit++) {
      const at = 0.09 + hit * 0.3;
      s.whoosh(at - 0.08, 0.09, { from: 2500, to: 8000, gain: 0.2 });
      s.thud(at, 0.55, 0.35);
      s.pulse(at + 0.02, 0.12, { freq: () => 2637 + hit * 200, gain: env.decay(0.1, 2), duty: 0.125 });
    }
    return s;
  },

  /**
   * NormalStrikeMoveAnimations.playConstrict: four coils wind on (0 / 0.11 / 0.22 / 0.33 s),
   * squeezes at 0.55 / 0.85 / 1.15 s (hit on the first), loosen by 1.55 s.
   * Rustling vines winding up, then three tight creaking squeezes.
   */
  constrict: () => {
    const s = new MoveSfx(1.7, 0xc057);
    for (let i = 0; i < 4; i++) s.whoosh(i * 0.11, 0.12, { from: 900 + i * 300, to: 2400 + i * 400, gain: 0.16 });
    s.thud(0.55, 0.4, 0.3);
    for (const at of [0.55, 0.85, 1.15]) s.wave(at, 0.14, { freq: env.ramp(320, 200), gain: env.decay(0.3, 1) });
    s.whoosh(1.3, 0.25, { from: 2400, to: 900, gain: 0.1 });
    return s;
  },

  /** Covet.play (hearts float over 0-0.6 s, the target jolts at 0.6 s, an item flies from it to the user 0.7-1.2 s): a sweet two-note coo, a soft hit, then a rising snatch blip and a twinkle as the item arrives. */
  covet: () => {
    const s = new MoveSfx(1.3, 0xc0e2);
    s.arpeggio(0.0, [76, 79, 84], 0.12, { gain: 0.18, voice: 'wave', hold: 0.14 });
    s.thud(0.6, 0.45, 0.3);
    s.pulse(0.7, 0.2, { freq: env.ramp(500, 1500), gain: env.decay(0.18, 1), duty: 0.25 });
    s.whoosh(0.75, 0.4, { from: 3000, to: 1500, gain: 0.15 });
    s.sparkle(1.15, 0.15, 3, { gain: 0.1 });
    return s;
  },

  /** Custom (claw pairs hit at 0.12 / 0.47 s) + Defense drop fleck: hard claws that crush. */
  crushclaw: () => {
    const s = new MoveSfx(1.3, 0xc2c1);
    for (const at of [0.0, 0.35]) {
      s.whoosh(at, 0.13, { from: 2000, to: 8000, gain: 0.3 });
      s.slash(at + 0.12, 0.5);
      s.thud(at + 0.12, 0.45, 0.6);
      s.noise(at + 0.16, 0.12, { clock: () => 3000, gain: env.decay(0.2, 1.5) });
    }
    s.statDown(0.85);
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

  /**
   * NormalStrikeMoveAnimations.playSlash (Cut style): a golden cut sweeps across (0-0.36 s,
   * hit at 0.11 s), sparks drift out and sink (to ~1.3 s). A clean cut, then soft glints.
   */
  cut: () => {
    const s = new MoveSfx(1.4, 0xc07a);
    s.whoosh(0.0, 0.12, { from: 2500, to: 10000, gain: 0.35 });
    s.slash(0.11, 0.6);
    s.sparkle(0.2, 0.9, 7, { lo: 3000, hi: 5500, gain: 0.1 });
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

  /** DoubleSlap.play, 3 hits (impacts at 0.14 / 0.50 / 0.86 s): a swish in, then a snappy slap. */
  doubleslap: () => {
    const s = new MoveSfx(1.15, 0xd05a);
    for (let hit = 0; hit < 3; hit++) {
      const at = 0.14 + hit * 0.36;
      s.whoosh(at - 0.12, 0.12, { from: 2500, to: 7000, gain: 0.15 });
      s.noise(at, 0.06, { clock: () => 15000, gain: env.decay(0.5, 1) });
      s.thud(at, 0.35, 0.2);
    }
    return s;
  },

  /** Endeavor.play (the user strains, shaking at 0 / 0.15 / 0.3 s with sweat drops, burst on the target at 0.6 s): a straining grunt, then a hard hit. */
  endeavor: () => {
    const s = new MoveSfx(0.9, 0xe0de);
    s.pulse(0.0, 0.45, { freq: (u) => (150 + 150 * u) * (1 + 0.05 * Math.sin(2 * Math.PI * 7 * u)), gain: env.ramp(0.08, 0.25), duty: 0.25 });
    s.whoosh(0.45, 0.15, { from: 1500, to: 6000, gain: 0.25 });
    s.thud(0.6, 0.65, 0.7);
    s.pulse(0.62, 0.2, { freq: env.ramp(500, 250), gain: env.decay(0.2, 2), duty: 0.125 });
    return s;
  },

  /**
   * NormalBlowMoveAnimations.playExtremeSpeed: dark (0-0.25 s), speed rush from 0.25 s, the
   * caster shoots up in dust (0.45-0.75 s), strikes at ~0.85 / ~1.1 s, drops back in
   * (~1.45-1.7 s), the scene clears by ~2.05 s. A rushing wind, a vanishing zip, two blinding hits.
   */
  extremespeed: () => {
    const s = new MoveSfx(2.1, 0xe75d);
    s.noise(0.25, 1.5, { clock: (u) => 6000 + 2000 * Math.sin(2 * Math.PI * 6 * u), gain: (u) => 0.16 * Math.min(1, u * 8) * Math.min(1, (1 - u) * 5) });
    s.whoosh(0.45, 0.3, { from: 3000, to: 14000, gain: 0.35 });
    s.noise(0.45, 0.2, { clock: () => 1500, gain: env.decay(0.18, 1) });
    for (const at of [0.85, 1.1]) {
      s.whoosh(at - 0.06, 0.08, { from: 6000, to: 16000, gain: 0.3 });
      s.thud(at, 0.6, 0.5);
      s.noise(at, 0.06, { clock: () => 12000, gain: env.decay(0.3, 1) });
    }
    s.whoosh(1.45, 0.25, { from: 9000, to: 2500, gain: 0.2 });
    return s;
  },


  /**
   * NormalBlowMoveAnimations.playFacade: the user glows in shifting colours
   * while three waves of orbs pop off it (0.1 / 0.35 / 0.6 s), then a white
   * starburst hits the target (0.95 s).
   */
  facade: () => {
    const s = new MoveSfx(1.4, 0xfacd);
    s.pulse(0.0, 0.9, { freq: env.ramp(180, 300), gain: env.swell(0.14), duty: 0.5 });
    for (let w = 0; w < 3; w++) s.sparkle(0.1 + w * 0.25, 0.2, 5, { lo: 1200 + w * 300, hi: 2600 + w * 400, gain: 0.16 });
    s.whoosh(0.8, 0.15, { from: 1200, to: 5000, gain: 0.25 });
    s.thud(0.95, 0.7, 0.8);
    s.noise(0.95, 0.1, { clock: () => 5000, gain: env.decay(0.3, 1.5), short: true });
    return s;
  },

  /** FakeOut.play (white flash 0-0.12 s, hands swing in and clap in front of the target at 0.25 s, the target flinches to 0.6 s): a swish, a sharp clap, then a flinch. */
  fakeout: () => {
    const s = new MoveSfx(0.8, 0xfa0e);
    s.whoosh(0.05, 0.2, { from: 3000, to: 9000, gain: 0.3 });
    s.noise(0.25, 0.05, { clock: () => 16000, gain: env.decay(0.35, 1) });
    s.thud(0.25, 0.45, 0.2);
    s.pulse(0.25, 0.06, { freq: () => 1320, gain: env.decay(0.2, 1), duty: 0.25 });
    s.flinch(0.45, 0.3);
    return s;
  },

  /** FalseSwipe.play (light streak crosses the target at 0.15 s, puffs fade to ~0.65 s): a quick swish and a soft, held-back cut. */
  falseswipe: () => {
    const s = new MoveSfx(0.75, 0xfa15);
    s.whoosh(0.0, 0.15, { from: 2000, to: 7000, gain: 0.3 });
    s.slash(0.15, 0.4);
    s.thud(0.17, 0.3, 0.2);
    s.wave(0.22, 0.3, { freq: env.ramp(660, 520), gain: env.decay(0.18, 1.5) });
    return s;
  },

  /** Flail.play (frantic flailing 0-0.7 s, blows at 0.75 / 0.9 s): wild flapping swishes, then two thumps. */
  flail: () => {
    const s = new MoveSfx(1.2, 0xf1a1);
    for (let i = 0; i < 6; i++) s.whoosh(i * 0.11, 0.1, { from: 1500 + s.random() * 1000, to: 4000, gain: 0.14 });
    s.thud(0.75, 0.55, 0.5);
    s.thud(0.9, 0.45, 0.4);
    s.noise(0.75, 0.2, { clock: () => 6000, gain: env.decay(0.18, 1.5) });
    return s;
  },

  /** Frustration.play (user seethes red 0-0.5 s, blows at 0.55 / 0.7 / 0.85 s): an angry grumble, then three grudging thumps. */
  frustration: () => {
    const s = new MoveSfx(1.15, 0xf2a7);
    s.pulse(0.0, 0.5, { freq: (u) => 140 + 30 * Math.sin(2 * Math.PI * 8 * u), gain: env.swell(0.2), duty: 0.25 });
    for (const [i, at] of [0.55, 0.7, 0.85].entries()) {
      s.whoosh(at - 0.08, 0.08, { from: 2000, to: 7000, gain: 0.18 });
      s.thud(at, 0.6 - i * 0.08, 0.5);
    }
    s.pulse(0.9, 0.25, { freq: (u) => 180 - 60 * u, gain: env.decay(0.12, 1.5), duty: 0.125 });
    return s;
  },

  /** NormalStrikeMoveAnimations.playFuryAttack, 3 hits (impacts at 0.1 / 0.42 / 0.74 s): rapid horn jabs - sharp pecking stabs. */
  furyattack: () => {
    const s = new MoveSfx(1.05, 0xf0a7);
    for (let hit = 0; hit < 3; hit++) {
      const at = 0.1 + hit * 0.32;
      s.whoosh(at - 0.09, 0.09, { from: 3000, to: 9000, gain: 0.2 });
      s.thud(at, 0.5, 0.25);
      s.pulse(at, 0.06, { freq: () => 1760 + hit * 120, gain: env.decay(0.18, 1), duty: 0.25 });
    }
    return s;
  },

  /** NormalStrikeMoveAnimations.playFurySwipes, 3 hits (impacts at 0.1 / 0.46 / 0.82 s): quick three-claw rakes. */
  furyswipes: () => {
    const s = new MoveSfx(1.15, 0xf05a);
    for (let hit = 0; hit < 3; hit++) {
      const at = 0.1 + hit * 0.36;
      s.whoosh(at - 0.09, 0.1, { from: 2500, to: 8000, gain: 0.2 });
      s.slash(at, 0.45);
      s.thud(at, 0.3, 0.2);
    }
    return s;
  },

  /** Custom (black 0-0.2 s, ring closes 0.2-0.6 s, lunge, impact 0.78 s, second jolt 1.08 s, burst to ~1.8 s): a tense build-up, then a huge, booming crash. */
  gigaimpact: () => {
    const s = new MoveSfx(2.25, 0x61a1);
    s.pulse(0.2, 0.4, { freq: (u) => 200 + 400 * u, gain: env.ramp(0.05, 0.15), duty: 0.25 });
    s.whoosh(0.6, 0.18, { from: 800, to: 4000, gain: 0.35 });
    s.thud(0.78, 0.85, 1);
    s.noise(0.78, 0.3, { clock: (u) => 8000 - 6000 * u, gain: env.attackDecay(0.45, 0.03) });
    s.rumble(0.8, 0.9, { from: 600, to: 120, gain: 0.35 });
    s.thud(1.08, 0.5, 0.7);
    for (let i = 0; i < 4; i++) s.whoosh(0.9 + s.random() * 0.5, 0.2, { from: 6000, to: 2500, gain: 0.1 });
    return s;
  },

  /**
   * Guillotine.play: scene darkens (0-0.25 s), blades open (0.25-0.45 s), snap shut at
   * 0.6 s, sparkles drift down (to 1.2 s), scene back by ~1.45 s. A low ominous swell,
   * a steely "shing" as the blades open, then a sharp, final clack and falling twinkles.
   */
  guillotine: () => {
    const s = new MoveSfx(1.5, 0x6011);
    s.pulse(0.0, 0.3, { freq: () => 98, gain: env.swell(0.2), duty: 0.25 });
    s.noise(0.25, 0.2, { clock: env.ramp(6000, 14000), gain: env.attackDecay(0.18, 0.1), short: true });
    s.pulse(0.3, 0.3, { freq: env.ramp(1200, 2600), gain: env.swell(0.2), duty: 0.125 });
    s.slash(0.58, 0.4);
    s.noise(0.6, 0.06, { clock: () => 14000, gain: env.decay(0.25, 1), short: true });
    s.thud(0.6, 0.35, 0.5);
    s.pulse(0.61, 0.45, { freq: () => 1975, gain: env.decay(0.18, 1.5), duty: 0.125 });
    s.sparkle(0.65, 0.55, 6, { lo: 3000, hi: 5500, gain: 0.1 });
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

  /** Custom (pull back + charge 0-0.35 s, hit 0.3 s with amber rays and stars to ~1.1 s, rays fade to ~1.35 s, recoil ~1.4 s): a reckless ram, a heavy crash, a recoil jolt. */
  headcharge: () => {
    const s = new MoveSfx(1.75, 0x4ec4);
    s.whoosh(0.08, 0.22, { from: 1000, to: 4500, gain: 0.4 });
    s.thud(0.3, 0.95, 0.9);
    s.noise(0.3, 0.08, { clock: () => 6000, gain: env.decay(0.3, 1) });
    s.rumble(0.33, 0.6, { from: 500, to: 150, gain: 0.2 });
    s.sparkle(0.35, 0.6, 5, { lo: 3500, hi: 6500, gain: 0.1 });
    s.thud(1.4, 0.4, 0.5);
    return s;
  },

  /**
   * Custom (0.9 s): the user darts in with a swish (0-0.26 s), a soft knock
   * as the crescent sweeps across at 0.26 s, and a twinkle of little stars
   * (0.3-0.7 s).
   */
  holdback: () => {
    const s = new MoveSfx(0.9, 0x401d);
    s.whoosh(0.05, 0.3, { from: 2000, to: 6000, gain: 0.22 });
    s.thud(0.26, 0.35, 0.25);
    s.sparkle(0.3, 0.4, 5, { lo: 3500, hi: 6000, gain: 0.12 });
    return s;
  },

  /** NormalStrikeMoveAnimations.playHornAttack (impact 0.1 s, dots spring out to ~0.5 s): a horn rams the target with a sharp stab. */
  hornattack: () => {
    const s = new MoveSfx(0.6, 0x4a77);
    s.whoosh(0.0, 0.1, { from: 2000, to: 7000, gain: 0.3 });
    s.pulse(0.08, 0.08, { freq: (u) => 1800 - 900 * u, gain: env.decay(0.25, 1.5), duty: 0.125 });
    s.thud(0.1, 0.6, 0.5);
    s.sparkle(0.15, 0.3, 4, { lo: 2500, hi: 4500, gain: 0.08 });
    return s;
  },

  /**
   * HornDrill.play: horn flies in (0-0.25 s), bores in from 0.3 s (hit) juddering to 0.85 s,
   * final flare at 0.85 s, gone by ~1.15 s. A rising whir, a stab, a grinding drill, a last crunch.
   */
  horndrill: () => {
    const s = new MoveSfx(1.3, 0x4d71);
    s.noise(0.0, 0.3, { clock: env.ramp(2000, 6000), gain: env.ramp(0.1, 0.25), short: true });
    s.thud(0.3, 0.5, 0.5);
    s.noise(0.3, 0.55, { clock: (u) => 5000 + 1500 * Math.sin(2 * Math.PI * 14 * u), gain: (u) => 0.3 * Math.pow(1 - u * 0.5, 0.8), short: true });
    s.pulse(0.3, 0.55, { freq: (u) => 180 + 60 * Math.sin(2 * Math.PI * 14 * u), gain: env.decay(0.18, 0.6), duty: 0.25 });
    s.thud(0.85, 0.65, 0.8);
    s.noise(0.85, 0.25, { clock: (u) => 6000 - 4000 * u, gain: env.decay(0.3, 1.2) });
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

  /** Custom (stars swirl in 0-0.8 s, dart 0.8 s, hit 0.92 s, golden burst and scattering stars to ~1.65 s): twinkling stars swirl in, an all-out blow, a starry burst. */
  lastresort: () => {
    const s = new MoveSfx(1.8, 0x1a57);
    s.sparkle(0.0, 0.8, 14, { lo: 2000, hi: 4000, gain: 0.1 });
    s.pulse(0.0, 0.8, { freq: env.ramp(300, 900), gain: env.ramp(0.04, 0.16), duty: 0.25 });
    s.whoosh(0.78, 0.14, { from: 1500, to: 8000, gain: 0.3 });
    s.thud(0.92, 0.8, 1);
    s.noise(0.92, 0.3, { clock: (u) => 12000 - 9000 * u, gain: env.attackDecay(0.4, 0.03) });
    s.pulse(0.95, 0.45, { freq: (u) => 110 * Math.pow(0.5, u), gain: env.decay(0.3, 1.5), duty: 0.5 });
    s.arpeggio(1.0, [84, 88, 91], 0.06, { gain: 0.12, voice: 'wave', hold: 0.12 });
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

  /** Pound.play (dart 0-0.26 s, hit at 0.12 s, stars scatter and fade to ~0.75 s): a plain, round slap with a little twinkle. */
  pound: () => {
    const s = new MoveSfx(0.9, 0x90d0);
    s.whoosh(0.0, 0.11, { from: 1500, to: 5000, gain: 0.2 });
    s.thud(0.12, 0.6, 0.45);
    s.sparkle(0.15, 0.4, 4, { lo: 2500, hi: 4500, gain: 0.08 });
    return s;
  },

  /** QuickAttack.play (dash 0-0.36 s, hit at 0.12 s, stars drift up to ~0.65 s): a lightning-fast dash, a light tap and a twinkle. */
  quickattack: () => {
    const s = new MoveSfx(0.8, 0x9a77);
    s.whoosh(0.0, 0.13, { from: 3000, to: 12000, gain: 0.45 });
    s.pulse(0.0, 0.12, { freq: (u) => 800 + 1600 * u, gain: env.swell(0.12), duty: 0.125 });
    s.thud(0.12, 0.6, 0.3);
    s.sparkle(0.18, 0.45, 5, { lo: 3000, hi: 5500, gain: 0.08 });
    return s;
  },

  /** Rage.play (red flush + anger mark 0-0.5 s, dart 0.5-0.76 s, hit at 0.62 s, specks to ~1.15 s): an angry growl building up, then a hard blow. */
  rage: () => {
    const s = new MoveSfx(1.25, 0x7a6e);
    s.pulse(0.0, 0.5, { freq: (u) => 110 + 40 * Math.sin(2 * Math.PI * 8 * u), gain: env.swell(0.22), duty: 0.125 });
    s.whoosh(0.48, 0.14, { from: 1000, to: 3500, gain: 0.3 });
    s.thud(0.62, 0.8, 0.8);
    s.thud(0.72, 0.35, 0.5);
    return s;
  },

  /** RapidSpin.play (whirl spins up 0-0.5 s, darts in 0.5-0.65 s, hit 0.65 s, whirl fades to 1.0 s): a whirring buzz that speeds up, a hit, the whirr dying away. */
  rapidspin: () => {
    const s = new MoveSfx(1.1, 0x5a91);
    s.noise(0.0, 0.95, { clock: (u) => 2000 + 2000 * Math.min(u * 1.6, 1), gain: (u) => 0.2 * Math.sin(Math.PI * u) * (0.6 + 0.4 * Math.sin(2 * Math.PI * (8 + 14 * u) * u)) });
    s.pulse(0.0, 0.65, { freq: env.ramp(200, 500), gain: env.swell(0.1), duty: 0.25 });
    s.thud(0.65, 0.6, 0.5);
    return s;
  },

  /** Custom (yellow glow and dust round the user 0-0.5 s, dart 0.5-0.76 s, hit 0.62 s, yellow spiky bursts pop to ~1.2 s): a stern swelling growl in a dust swirl, then a hard counterblow with crackling bursts. */
  retaliate: () => {
    const s = new MoveSfx(1.35, 0x7e7a);
    s.pulse(0.0, 0.5, { freq: env.ramp(110, 160), gain: env.swell(0.16), duty: 0.25 });
    s.noise(0.0, 0.5, { clock: () => 1500, gain: env.swell(0.12) });
    s.whoosh(0.48, 0.15, { from: 1200, to: 4500, gain: 0.3 });
    s.thud(0.62, 0.8, 0.8);
    s.rumble(0.65, 0.4, { from: 400, to: 150, gain: 0.2 });
    for (const at of [0.7, 0.77, 0.84, 0.91]) s.noise(at, 0.05, { clock: () => 6000, gain: env.decay(0.18, 1), short: true });
    return s;
  },

  /** Return.play (user hops at 0 / 0.3 s, blow at 0.7 s, sparkles drift up to ~1.2 s): two happy bounces, a clean hit and a warm, friendly chime. */
  return: () => {
    const s = new MoveSfx(1.3, 0x7e70);
    for (const at of [0, 0.3]) s.pulse(at, 0.12, { freq: env.ramp(500, 900), gain: env.decay(0.14, 1), duty: 0.5 });
    s.whoosh(0.6, 0.1, { from: 2000, to: 6000, gain: 0.2 });
    s.thud(0.7, 0.6, 0.5);
    s.arpeggio(0.75, [72, 76, 79, 84], 0.06, { gain: 0.14, voice: 'wave', hold: 0.15 });
    return s;
  },

  /** Custom (dust rises while the user bobs up at 0.15 / 0.45 s, charge 0.6-0.9 s, hit 0.73 s, rocks scatter to 1.45 s): scrabbling up rock, a rugged charge and a gravelly crash. */
  rockclimb: () => {
    const s = new MoveSfx(1.6, 0xc11b);
    s.rumble(0.0, 0.6, { from: 250, to: 400, gain: 0.22 });
    for (const at of [0.15, 0.45]) s.noise(at - 0.08, 0.14, { clock: () => 1500 + s.random() * 1000, gain: env.attackDecay(0.25, 0.2) });
    s.whoosh(0.6, 0.15, { from: 800, to: 3000, gain: 0.3 });
    s.thud(0.73, 0.85, 0.9);
    for (let i = 0; i < 5; i++) s.noise(0.78 + i * 0.07, 0.05, { clock: () => 1500 + s.random() * 1500, gain: env.decay(0.25 - i * 0.04, 1) });
    s.noise(0.75, 0.6, { clock: () => 900, gain: env.decay(0.12, 1.5) });
    return s;
  },

  /** Scratch.play (three claw streaks at 0 / 0.045 / 0.09 s, hit at 0.12 s, specks to ~0.65 s): three quick bright rasps. */
  scratch: () => {
    const s = new MoveSfx(0.75, 0x5c7a);
    for (const at of [0.0, 0.045, 0.09]) s.slash(at, 0.4);
    s.noise(0.12, 0.08, { clock: (u) => 14000 - 6000 * u, gain: env.attackDecay(0.3, 0.1) });
    s.pulse(0.12, 0.08, { freq: (u) => 1800 - 800 * u, gain: env.decay(0.12, 1.5), duty: 0.125 });
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

  /**
   * NormalStrikeMoveAnimations.playSmellingSalts: two hands appear by the
   * target (0-0.25 s) and clap at 0.4 s and 0.85 s, each with a burst and
   * drifting specks; the hands fade (1.25-1.5 s). Two sharp claps, a bright
   * wake-up chime.
   */
  smellingsalts: () => {
    const s = new MoveSfx(1.6, 0x5a17);
    s.whoosh(0.0, 0.25, { from: 2000, to: 5000, gain: 0.12 });
    for (const at of [0.4, 0.85]) {
      s.thud(at, 0.35, 0.2);
      s.noise(at, 0.07, { clock: () => 15000, gain: env.decay(0.4, 1) });
      s.noise(at, 0.12, { clock: () => 5000, gain: env.decay(0.2, 2) });
      s.sparkle(at + 0.03, 0.4, 4, { lo: 4500, hi: 8000, gain: 0.1 });
    }
    s.arpeggio(1.0, [84, 91], 0.06, { gain: 0.16, duty: 0.25, hold: 0.09 });
    return s;
  },

  /** Custom (footprint comes down 0-0.22 s, stamp 0.22 s, sparkles + specks to ~0.85 s): a heavy foot stamps down. */
  stomp: () => {
    const s = new MoveSfx(1.0, 0x5707);
    s.whoosh(0.0, 0.22, { from: 700, to: 2000, gain: 0.3 });
    s.thud(0.22, 0.85, 1);
    s.rumble(0.25, 0.25, { from: 260, to: 100, gain: 0.25 });
    s.sparkle(0.25, 0.4, 5, { lo: 2500, hi: 4500, gain: 0.1 });
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


  /** Custom (lunge, hit 0.12 s, yellow stars twinkle to 0.6 s, recoil shudder 0.65-0.95 s): a desperate flailing hit, then it hurts itself. */
  struggle: () => {
    const s = new MoveSfx(1.1, 0x5706);
    s.whoosh(0.0, 0.12, { from: 1200, to: 3500, gain: 0.3 });
    s.thud(0.12, 0.7, 0.5);
    s.sparkle(0.15, 0.4, 4, { lo: 3000, hi: 5000, gain: 0.09 });
    s.thud(0.65, 0.35, 0.3);
    s.pulse(0.65, 0.25, { freq: (u) => 400 * Math.pow(0.5, u), gain: env.decay(0.15, 1.5), duty: 0.25 });
    return s;
  },

  /**
   * NormalStrikeMoveAnimations.playSuperFang: small incisors drop (0-0.13 s) and clamp,
   * the red-pink starburst flares at 0.3 s and sparks fly out until ~0.9 s.
   * A quick, sharp nibble, then a stinging crunch.
   */
  superfang: () => {
    const s = new MoveSfx(1.0, 0x5f46);
    s.whoosh(0.0, 0.13, { from: 2500, to: 8000, gain: 0.22 });
    s.noise(0.13, 0.05, { clock: () => 14000, gain: env.decay(0.35, 1) });
    s.pulse(0.13, 0.06, { freq: () => 1600, gain: env.decay(0.18, 1), duty: 0.25 });
    s.thud(0.3, 0.7, 0.4);
    s.noise(0.3, 0.12, { clock: () => 9000, gain: env.attackDecay(0.4, 0.05), short: true });
    s.pulse(0.3, 0.12, { freq: env.ramp(900, 500), gain: env.decay(0.2, 1), duty: 0.125 });
    s.sparkle(0.35, 0.55, 8, { lo: 3000, hi: 6000, gain: 0.14 });
    return s;
  },

  /** Custom (charge, hit 0.12 s, yellow glow to 0.45 s, specks float up to ~0.9 s): a quick rush and a solid bump. */
  tackle: () => {
    const s = new MoveSfx(0.95, 0x7ac1);
    s.whoosh(0.0, 0.12, { from: 1200, to: 4000, gain: 0.3 });
    s.thud(0.12, 0.75, 0.6);
    s.noise(0.15, 0.15, { clock: () => 1200, gain: env.decay(0.15, 1.5) });
    s.sparkle(0.2, 0.55, 4, { lo: 2000, hi: 3500, gain: 0.07 });
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

  /**
   * NormalStrikeMoveAnimations.playTakeDown: the caster darts in (contact 0.12 s) - flash,
   * golden dust and sparkles to ~1.0 s - and jolts from the recoil at ~0.5 s.
   * A reckless full-body charge, a dusty crash, then the user's own jolt.
   */
  takedown: () => {
    const s = new MoveSfx(1.1, 0x7a4d);
    s.whoosh(0.0, 0.12, { from: 800, to: 3000, gain: 0.4 });
    s.thud(0.12, 0.85, 0.9);
    s.noise(0.12, 0.6, { clock: env.ramp(1800, 500), gain: env.attackDecay(0.25, 0.08) });
    s.rumble(0.14, 0.35, { from: 400, to: 150, gain: 0.25 });
    s.sparkle(0.2, 0.75, 8, { lo: 2500, hi: 5000, gain: 0.12 });
    s.thud(0.5, 0.35, 0.4);
    return s;
  },


  /** Thief.play (scuffle hit 0.15 s, dust to ~0.6 s, item pops up and flies to the user 0.6-1.1 s): a quick scuffle, a pop and a sneaky swish away. */
  thief: () => {
    const s = new MoveSfx(1.25, 0x7a1e);
    s.whoosh(0.0, 0.15, { from: 2000, to: 6000, gain: 0.2 });
    s.thud(0.15, 0.55, 0.5);
    for (let i = 0; i < 3; i++) s.noise(0.15 + i * 0.13, 0.08, { clock: () => 3000, gain: env.decay(0.15, 1.5) });
    s.pulse(0.6, 0.08, { freq: env.ramp(800, 1600), gain: env.decay(0.16, 1), duty: 0.25 });
    s.whoosh(0.7, 0.4, { from: 4000, to: 1500, gain: 0.16 });
    return s;
  },

  /**
   * NormalBlowMoveAnimations.playThrash: six fists / feet slam onto the target 0.15 s apart
   * (0-0.75 s), the last fades by ~1.1 s. A wild rampage of flailing hits.
   */
  thrash: () => {
    const s = new MoveSfx(1.15, 0x7a5f);
    for (let i = 0; i < 6; i++) {
      const at = i * 0.15;
      s.thud(at, i === 0 || i === 5 ? 0.85 : 0.55, i % 2 ? 0.5 : 0.8);
      s.noise(at, 0.05, { clock: () => 9000 + s.random() * 4000, gain: env.decay(0.28, 1) });
    }
    s.rumble(0.05, 0.9, { from: 450, to: 150, gain: 0.2 });
    return s;
  },


  /** ViseGrip.play (jaws rise 0-0.25 s, snap shut 0.4 s with red glow + pink sparkles to ~0.85 s, part 0.9-1.15 s): a grinding slide-in, a hard metallic snap, a strained hold, then a release. */
  visegrip: () => {
    const s = new MoveSfx(1.3, 0x515e);
    s.whoosh(0.0, 0.25, { from: 800, to: 2500, gain: 0.18 });
    s.whoosh(0.28, 0.12, { from: 1500, to: 5000, gain: 0.25 });
    s.thud(0.4, 0.55, 0.45);
    s.noise(0.4, 0.06, { clock: () => 12000, gain: env.decay(0.35, 1.5), short: true });
    s.pulse(0.42, 0.12, { freq: () => 1760, gain: env.decay(0.18, 2), duty: 0.125 });
    s.sparkle(0.45, 0.35, 5, { gain: 0.12 });
    s.pulse(0.5, 0.4, { freq: (u) => 200 + 10 * Math.sin(2 * Math.PI * 12 * u), gain: env.decay(0.12, 1), duty: 0.125 });
    s.whoosh(0.9, 0.2, { from: 3000, to: 1200, gain: 0.15 });
    return s;
  },

  /** Wrap.play (cloud + coils drop in 0-0.35 s, squeezes at 0.4 / 0.7 / 1.0 s, coils loosen 1.15-1.35 s): a soft rustle, then three creaking squeezes. */
  wrap: () => {
    const s = new MoveSfx(1.5, 0x3e9a);
    s.whoosh(0.0, 0.35, { from: 1200, to: 3500, gain: 0.2 });
    for (const t of [0.4, 0.7, 1.0]) {
      s.thud(t, 0.4, 0.35);
      s.pulse(t, 0.22, { freq: (u) => 200 + 70 * u, gain: env.attackDecay(0.18, 0.2), duty: 0.125 });
      s.noise(t, 0.18, { clock: () => 2500, gain: env.decay(0.12, 1.5) });
    }
    s.whoosh(1.15, 0.2, { from: 3000, to: 1200, gain: 0.12 });
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
