import { MoveSfx } from '../../move-sfx.mjs';
import { env } from '../../track.mjs';

/** Normal-type status moves on the user or its allies (buffs, heals, shields, self effects). */
export const NORMAL_BUFF = {
  /** Generic target aura: three precise needle pokes, then pressure releases. */
  acupressure: () => {
    const s = new MoveSfx(0.95, 0xacc0);
    for (const at of [0.08, 0.2, 0.32]) {
      s.pulse(at, 0.03, { freq: () => 3500, gain: env.decay(0.3, 1), duty: 0.25 });
      s.noise(at, 0.02, { clock: () => 16000, gain: env.decay(0.25, 1) });
    }
    s.wave(0.45, 0.4, { freq: env.ramp(600, 1250), gain: env.swell(0.3) });
    return s;
  },

  /** Generic self aura: calls out to the team, then a move is picked. */
  assist: () => {
    const s = new MoveSfx(1.0, 0xa5c1);
    s.arpeggio(0.02, [67, 71, 74, 79], 0.07, { gain: 0.28, duty: 0.25, hold: 0.1 });
    s.arpeggio(0.35, [79, 74, 79], 0.09, { gain: 0.16, voice: 'wave', hold: 0.12 });
    s.sparkle(0.4, 0.45, 6, { gain: 0.14 });
    return s;
  },

  /**
   * NormalStatusMoveAnimations.playBatonPass: the baton is tossed up (0-0.43 s), falls back
   * (to 0.85 s) into the glove that rises at 0.45-0.7 s, caught at 0.85 s, fades by ~1.5 s.
   * (The recall and send-in that follow have their own ball sounds.) A twirling toss, a catch.
   */
  batonpass: () => {
    const s = new MoveSfx(1.2, 0xba70);
    s.pulse(0.02, 0.8, { freq: (u) => 700 + 400 * Math.sin(Math.PI * u), gain: (u) => 0.16 * (0.5 + 0.5 * Math.sin(2 * Math.PI * 10 * u)), duty: 0.25 });
    s.whoosh(0.02, 0.4, { from: 2000, to: 6000, gain: 0.2 });
    s.whoosh(0.45, 0.4, { from: 6000, to: 2000, gain: 0.15 });
    s.thud(0.85, 0.4, 0.3);
    s.arpeggio(0.87, [79, 84], 0.1, { gain: 0.25, voice: 'wave', hold: 0.2 });
    return s;
  },


  /**
   * NormalStatusMoveAnimations.playBellyDrum: six belly beats speeding up (0, 0.17, 0.31,
   * 0.43, 0.53, 0.63 s), each with a rising note bubble; hands fade, orange stat sparkles
   * from ~0.95 s (to ~2.15 s). Drumming on the belly, faster and faster, then the stat-up jingle.
   */
  bellydrum: () => {
    const s = new MoveSfx(2.2, 0xbe11);
    const notes = [72, 76, 79, 76, 79, 84];
    [0, 0.17, 0.31, 0.43, 0.53, 0.63].forEach((at, i) => {
      const g = 0.45 + i * 0.05;
      s.pulse(at, 0.1, { freq: (u) => 140 * Math.pow(0.55, u), gain: env.decay(g, 2), duty: 0.5 });
      s.noise(at, 0.03, { clock: () => 3000, gain: env.decay(g * 0.4, 1) });
      s.arpeggio(at + 0.05, [notes[i]], 0.1, { gain: 0.1, voice: 'wave', hold: 0.12 });
    });
    s.statUp(0.95);
    return s;
  },


  /** Generic self aura: the body fades into its surroundings. */
  camouflage: () => {
    const s = new MoveSfx(1.0, 0xca30);
    s.noise(0.02, 0.6, { clock: () => 2500, gain: env.swell(0.14) });
    s.wave(0.05, 0.75, { freq: env.ramp(700, 300), gain: (u) => 0.25 * Math.pow(1 - u, 1.5) });
    s.pulse(0.6, 0.08, { freq: env.ramp(900, 1400), gain: env.decay(0.14, 1), duty: 0.25 });
    return s;
  },

  /** Generic self aura: a cheerful little fanfare with confetti. */
  celebrate: () => {
    const s = new MoveSfx(1.3, 0xce1e);
    s.noise(0.02, 0.06, { clock: () => 7000, gain: env.decay(0.3, 1) });
    s.arpeggio(0.05, [72, 76, 79], 0.09, { gain: 0.26, duty: 0.25, hold: 0.1 });
    s.arpeggio(0.32, [84, 84], 0.12, { gain: 0.26, duty: 0.25, hold: 0.1 });
    s.arpeggio(0.32, [76, 79], 0.12, { gain: 0.14, voice: 'wave', hold: 0.25 });
    s.sparkle(0.1, 0.9, 12, { lo: 3000, hi: 6000, gain: 0.12 });
    return s;
  },

  /** Generic self aura: digital bleeps as the type changes. */
  conversion: () => {
    const s = new MoveSfx(1.0, 0xc0b1);
    s.arpeggio(0.02, [72, 79, 76, 84, 81, 88, 86, 91], 0.045, { gain: 0.22, duty: 0.125, hold: 0.04 });
    s.pulse(0.4, 0.4, { freq: (u) => 400 * Math.pow(4, u), gain: env.swell(0.16), duty: 0.5 });
    s.sparkle(0.5, 0.35, 4, { gain: 0.12 });
    return s;
  },

  /** Generic self aura: a short phrase, then copied a step higher. */
  copycat: () => {
    const s = new MoveSfx(1.0, 0xc0ca);
    s.arpeggio(0.02, [72, 76, 74], 0.1, { gain: 0.24, voice: 'wave', hold: 0.11 });
    s.arpeggio(0.4, [77, 81, 79], 0.1, { gain: 0.24, voice: 'wave', hold: 0.11 });
    s.sparkle(0.7, 0.25, 3, { gain: 0.1 });
    return s;
  },

  /** Generic self aura + stat-up fleck: the body curls up into a ball. */
  defensecurl: () => {
    const s = new MoveSfx(1.5, 0xdefc);
    s.pulse(0.02, 0.35, { freq: (u) => 900 * Math.pow(0.3, u), gain: env.swell(0.22), duty: 0.25 });
    s.thud(0.4, 0.4, 0.5);
    s.statUp(0.85);
    return s;
  },

  /** Generic self aura + stat-up fleck: afterimages flicker on both sides. */
  doubleteam: () => {
    const s = new MoveSfx(1.5, 0xd07e);
    for (let i = 0; i < 6; i++) {
      const at = 0.02 + i * 0.11;
      s.whoosh(at, 0.1, { from: 3000, to: 8000, gain: 0.22 - i * 0.02 });
      s.pulse(at, 0.06, { freq: () => (i % 2 ? 1320 : 1100), gain: env.decay(0.14, 1), duty: 0.125 });
    }
    s.statUp(0.85);
    return s;
  },

  /** Generic self aura (priority): the user braces itself, a firm low hum that holds. */
  endure: () => {
    const s = new MoveSfx(1.05, 0xe2d7);
    s.pulse(0.02, 0.8, { freq: () => 110, gain: env.swell(0.3), duty: 0.25 });
    s.wave(0.02, 0.8, { freq: () => 220, gain: env.swell(0.2) });
    s.pulse(0.05, 0.12, { freq: env.ramp(300, 500), gain: env.decay(0.25, 1), duty: 0.5 });
    s.thud(0.5, 0.3, 0.3);
    return s;
  },

  /** Generic self aura (~0.8 s, no stat fleck): deep breath, the user's focus sharpens - a rising, pumping energy. */
  focusenergy: () => {
    const s = new MoveSfx(1.2, 0xf0e9);
    s.noise(0.0, 0.8, { clock: (u) => 1500 + 3000 * u, gain: env.swell(0.15) });
    for (const [at, f] of [[0.05, 196], [0.25, 247], [0.45, 294], [0.65, 392]]) {
      s.pulse(at, 0.18, { freq: (u) => f * (1 + 0.15 * u), gain: env.attackDecay(0.22, 0.1), duty: 0.25 });
    }
    s.pulse(0.85, 0.25, { freq: () => 784, gain: env.decay(0.16, 1.5), duty: 0.125 });
    return s;
  },

  /** Generic self aura (quick, ~0.8 s): the user waves for attention - a cheery "hey, over here!" jingle. */
  followme: () => {
    const s = new MoveSfx(1.05, 0xf011);
    s.arpeggio(0.02, [72, 76, 79, 76, 79, 84], 0.09, { gain: 0.24, duty: 0.5 });
    s.arpeggio(0.6, [84, 84], 0.1, { gain: 0.18, duty: 0.25, voice: 'wave', hold: 0.2 });
    return s;
  },

  /** Generic self aura (~0.8 s) + stat-up fleck (0.85 s): the body swells with a rising, leafy hum. */
  growth: () => {
    const s = new MoveSfx(1.5, 0x6207);
    s.wave(0.02, 0.75, { freq: env.ramp(196, 523), gain: env.swell(0.2) });
    s.noise(0.02, 0.75, { clock: env.ramp(800, 3000), gain: env.swell(0.08) });
    s.statUp(0.85);
    return s;
  },

  /** Generic self aura (~0.8 s glow + rings): a bouncy party jingle with confetti glitter. */
  happyhour: () => {
    const s = new MoveSfx(1.3, 0x4a99);
    s.arpeggio(0.0, [72, 76, 79, 76, 79, 84], 0.1, { gain: 0.24, duty: 0.25, hold: 0.12 });
    s.arpeggio(0.0, [60, 64, 67, 64, 67, 72], 0.1, { gain: 0.16, voice: 'wave', hold: 0.12 });
    s.chord(0.6, 0.45, [84, 88, 91], { rate: 0.035, gain: 0.18 });
    s.sparkle(0.1, 0.9, 12, { lo: 3000, hi: 6000, gain: 0.12 });
    return s;
  },

  /** Generic self aura + stat-up fleck (0.85 s): the body stiffens with a hard, grinding shell creak. */
  harden: () => {
    const s = new MoveSfx(1.5, 0x4a2d);
    s.pulse(0.05, 0.6, { freq: (u) => 300 + 200 * u, gain: env.swell(0.18), duty: 0.125 });
    s.noise(0.05, 0.6, { clock: (u) => 2500 + 2500 * u, gain: env.swell(0.14), short: true });
    s.noise(0.62, 0.05, { clock: () => 8000, gain: env.decay(0.3, 1), short: true });
    s.pulse(0.62, 0.2, { freq: () => 1400, gain: env.decay(0.12, 2), duty: 0.5 });
    s.statUp(0.85);
    return s;
  },

  /** Generic target aura (~0.8 s): a bell chimes clearly and rings out over the team. */
  healbell: () => {
    const s = new MoveSfx(1.4, 0x4eb1);
    for (const [at, f] of [[0.0, 1568], [0.3, 1319], [0.6, 1568]]) {
      s.pulse(at, 0.7, { freq: () => f, gain: env.decay(0.2, 2), duty: 0.5 });
      s.pulse(at, 0.55, { freq: () => f * 2.76, gain: env.decay(0.06, 2), duty: 0.5 });
      s.wave(at, 0.75, { freq: () => f / 2, gain: env.decay(0.12, 1.5) });
    }
    s.sparkle(0.2, 0.8, 8, { lo: 4000, hi: 7000, gain: 0.08 });
    return s;
  },

  /** Generic target aura (~0.8 s): an encouraging pat on the back and a bright "go!" cheer. */
  helpinghand: () => {
    const s = new MoveSfx(1.0, 0x4e1d);
    s.thud(0.04, 0.3, 0.1);
    s.thud(0.16, 0.3, 0.1);
    s.arpeggio(0.32, [72, 76, 79, 84], 0.06, { gain: 0.26, duty: 0.25, hold: 0.1 });
    s.wave(0.56, 0.3, { freq: () => 1046.5, gain: env.decay(0.2, 1.5) });
    s.sparkle(0.45, 0.35, 5, { gain: 0.12 });
    return s;
  },

  /** Generic target aura (~0.8 s): two friendly hand claps, then a warm shared chime. */
  holdhands: () => {
    const s = new MoveSfx(1.05, 0x40d4);
    for (const at of [0.03, 0.16]) s.noise(at, 0.05, { clock: () => 9000, gain: env.decay(0.3, 1.5) });
    s.arpeggio(0.3, [72, 76, 79], 0.1, { gain: 0.22, voice: 'wave', hold: 0.3 });
    s.chord(0.55, 0.4, [84, 88], { rate: 0.05, gain: 0.12 });
    return s;
  },

  /** Generic self aura (~0.8 s): a rising wolf howl, then the stat-up jingle (0.85 s). */
  howl: () => {
    const s = new MoveSfx(1.45, 0x4041);
    s.pulse(0.02, 0.75, { freq: (u) => (330 + 330 * Math.sin(Math.PI * Math.min(1, u * 1.4))) * (1 + 0.02 * Math.sin(2 * Math.PI * 30 * u)), gain: env.swell(0.3), duty: 0.25 });
    s.wave(0.02, 0.75, { freq: (u) => 660 + 500 * Math.sin(Math.PI * Math.min(1, u * 1.4)), gain: env.swell(0.15) });
    s.statUp(0.85);
    return s;
  },

  /** Generic self aura (~0.8 s, no fleck): a solemn incantation - a chanted three-note figure under twinkling luck charms. */
  luckychant: () => {
    const s = new MoveSfx(1.15, 0x1c4a);
    s.arpeggio(0.02, [67, 72, 74, 72, 79], 0.15, { gain: 0.22, voice: 'wave', hold: 0.2 });
    s.pulse(0.02, 0.8, { freq: () => 196, gain: env.swell(0.1), duty: 0.25 });
    s.sparkle(0.2, 0.65, 7, { lo: 3000, hi: 5000, gain: 0.12 });
    return s;
  },

  /** Generic self aura (~0.8 s): a finger wags like a metronome, tick-tock, then a bright "pick" chime. */
  metronome: () => {
    const s = new MoveSfx(1.1, 0x3e70);
    [0.02, 0.2, 0.38, 0.56].forEach((at, i) => {
      s.pulse(at, 0.04, { freq: () => (i % 2 ? 1400 : 1870), gain: env.decay(0.3, 1), duty: 0.25 });
      s.noise(at, 0.02, { clock: () => 14000, gain: env.decay(0.18, 1) });
    });
    s.arpeggio(0.74, [79, 84, 91], 0.05, { gain: 0.24, voice: 'wave', hold: 0.18 });
    return s;
  },

  /** Generic self aura (~0.8 s): three gulps of milk, then a warm healing run. */
  milkdrink: () => {
    const s = new MoveSfx(1.1, 0x3d41);
    for (let i = 0; i < 3; i++) s.wave(0.04 + i * 0.16, 0.1, { freq: (u) => 260 + 260 * u, gain: env.attackDecay(0.32, 0.2) });
    s.bubbles(0.05, 0.4, 4, { lo: 400, hi: 700, gain: 0.12 });
    s.arpeggio(0.5, [72, 76, 79, 84], 0.07, { gain: 0.22, voice: 'wave', hold: 0.18 });
    s.noise(0.5, 0.45, { clock: () => 7000, gain: env.swell(0.08) });
    return s;
  },

  /** Generic self aura + stat-up fleck (0.85 s): the user shrinks with a falling squeeze, then evasion rises. */
  minimize: () => {
    const s = new MoveSfx(1.5, 0x3191);
    s.pulse(0.02, 0.7, { freq: (u) => 1500 * Math.pow(0.3, u), gain: env.swell(0.24), duty: 0.25 });
    s.wave(0.02, 0.7, { freq: (u) => 750 * Math.pow(0.3, u), gain: env.swell(0.16) });
    s.noise(0.6, 0.06, { clock: () => 9000, gain: env.decay(0.2, 1), short: true });
    s.statUp(0.85);
    return s;
  },

  /** Generic self aura (~0.8 s): warm sunrise swell and a gentle rising healing run. */
  morningsun: () => {
    const s = new MoveSfx(1.15, 0x305a);
    s.chord(0.02, 0.6, [72, 76, 79], { rate: 0.035, gain: 0.2 });
    s.noise(0.02, 0.6, { clock: () => 6000, gain: env.swell(0.06) });
    s.arpeggio(0.5, [79, 84, 88, 91], 0.07, { gain: 0.22, voice: 'wave', hold: 0.2 });
    s.sparkle(0.55, 0.4, 4, { lo: 3000, hi: 5000, gain: 0.1 });
    return s;
  },

  /**
   * Support move, no aura: MoveAnimationService.playShield pops a bubble up
   * around the user (scale-in 0-0.22 s, holds, fades to 0.62 s). A bright
   * glassy "ping" that rings out.
   */
  protect: () => {
    const s = new MoveSfx(0.8, 0x9707);
    s.pulse(0.0, 0.18, { freq: (u) => 900 + 1300 * u, gain: env.attackDecay(0.22, 0.3), duty: 0.25 });
    s.wave(0.15, 0.6, { freq: () => 2093, gain: env.decay(0.3, 2) });
    s.pulse(0.15, 0.5, { freq: () => 3136, gain: env.decay(0.08, 2.5), duty: 0.5 });
    s.sparkle(0.2, 0.35, 4, { lo: 4000, hi: 6000, gain: 0.1 });
    return s;
  },

  /**
   * NormalStatusMoveAnimations.playRecover: golden stars twinkle over the
   * caster (0-1.22 s, glow flashes 0 / 0.4 s), then FxEffects.healSparkles
   * (1.25-2.35 s, green flashes 1.25 / 1.6 s). A warm shimmer, then a rising heal run.
   */
  recover: () => {
    const s = new MoveSfx(2.4, 0x7ec0);
    s.chord(0.02, 1.2, [72, 76, 79], { rate: 0.04, gain: 0.2, vibrato: 0.006 });
    s.sparkle(0.05, 1.15, 12, { lo: 2500, hi: 4500, gain: 0.13 });
    s.wave(0.4, 0.3, { freq: () => 1046.5, gain: env.decay(0.15, 2) });
    s.arpeggio(1.25, [72, 76, 79, 84, 88], 0.07, { gain: 0.26, voice: 'wave', hold: 0.14 });
    s.arpeggio(1.6, [84, 88, 91, 96], 0.07, { gain: 0.14, duty: 0.25, hold: 0.1 });
    s.sparkle(1.3, 0.85, 8, { lo: 3500, hi: 6000, gain: 0.12 });
    return s;
  },

  /** Generic self aura (~0.8 s): a used item pops back - a turning whirr, then a found-it jingle. */
  recycle: () => {
    const s = new MoveSfx(1.05, 0x7ecc);
    s.pulse(0.02, 0.45, { freq: (u) => 300 + 400 * u, gain: (u) => 0.2 * (0.55 + 0.45 * Math.sin(2 * Math.PI * 9 * u)), duty: 0.25 });
    s.noise(0.02, 0.45, { clock: () => 2200, gain: env.swell(0.12) });
    s.arpeggio(0.5, [76, 79, 84], 0.07, { gain: 0.26, voice: 'wave', hold: 0.18 });
    s.pulse(0.64, 0.25, { freq: () => 2093, gain: env.decay(0.08, 2), duty: 0.5 });
    return s;
  },

  /** Generic self aura (~0.8 s): a cool, refreshing rinse and a clean chime. */
  refresh: () => {
    const s = new MoveSfx(1.05, 0x7ef5);
    s.noise(0.02, 0.5, { clock: (u) => 3000 + 3000 * u, gain: env.swell(0.15) });
    s.bubbles(0.05, 0.45, 6, { lo: 600, hi: 1400, gain: 0.16 });
    s.arpeggio(0.5, [79, 84, 91], 0.08, { gain: 0.24, voice: 'wave', hold: 0.25 });
    s.sparkle(0.55, 0.4, 5, { lo: 3500, hi: 6000, gain: 0.1 });
    return s;
  },

  /** Generic self aura (~0.8 s): a protective veil settles over the team – a calm, shimmering major chord. */
  safeguard: () => {
    const s = new MoveSfx(1.4, 0x5afe);
    s.chord(0.0, 1.0, [72, 76, 79, 84], { rate: 0.04, gain: 0.25 });
    s.wave(0.0, 1.1, { freq: () => 262, gain: env.swell(0.15) });
    s.sparkle(0.2, 0.9, 10, { lo: 3000, hi: 5500, gain: 0.12 });
    s.pulse(0.85, 0.4, { freq: () => 1047, gain: env.decay(0.15, 1.5), duty: 0.25 });
    return s;
  },

  /** Generic self aura (~0.8 s) + Attack rise fleck (~0.85 s): a blade being honed, steady whetstone scrapes and a gleam. */
  sharpen: () => {
    const s = new MoveSfx(1.45, 0x54a7);
    for (let i = 0; i < 4; i++) {
      s.noise(0.05 + i * 0.18, 0.14, { clock: env.ramp(6000, 14000), gain: env.attackDecay(0.3, 0.4) });
      s.pulse(0.05 + i * 0.18, 0.1, { freq: env.ramp(1800, 2600), gain: env.decay(0.1, 1.5), duty: 0.125 });
    }
    s.pulse(0.72, 0.12, { freq: () => 3520, gain: env.decay(0.15, 1.5), duty: 0.125 });
    s.statUp(0.85);
    return s;
  },

  /** Generic self aura (~0.8 s) + stat rise fleck (~0.85 s): the shell cracks apart in a few crunches, then power surges. */
  shellsmash: () => {
    const s = new MoveSfx(1.5, 0x5e11);
    [0.08, 0.3, 0.5].forEach((at, i) => {
      s.noise(at, 0.12, { clock: (u) => 7000 - 4000 * u, gain: env.attackDecay(0.4 + i * 0.05, 0.05) });
      s.pulse(at, 0.12, { freq: (u) => 300 * Math.pow(0.4, u), gain: env.decay(0.3, 2), duty: 0.5 });
    });
    s.sparkle(0.55, 0.25, 4, { lo: 4000, hi: 7000, gain: 0.15 });
    s.statUp(0.85);
    return s;
  },

  /** Generic self aura (~0.8 s), no fleck (heals afterwards): a lazy, sleepy yawn that sinks, then a soft restoring glow. */
  slackoff: () => {
    const s = new MoveSfx(1.4, 0x51ac);
    s.wave(0.02, 0.6, { freq: (u) => 520 - 220 * u + 60 * Math.sin(Math.PI * u), gain: env.swell(0.26) });
    s.pulse(0.02, 0.6, { freq: (u) => 260 - 110 * u, gain: env.swell(0.08), duty: 0.25 });
    s.arpeggio(0.7, [67, 72, 76, 79], 0.08, { gain: 0.2, voice: 'wave', hold: 0.2 });
    s.sparkle(0.8, 0.4, 5, { lo: 3000, hi: 5000, gain: 0.12 });
    return s;
  },

  /** Generic self aura (~0.8 s): a drowsy mumble, then a move is picked in the sleep. */
  sleeptalk: () => {
    const s = new MoveSfx(1.05, 0x5137);
    s.wave(0.02, 0.55, { freq: (u) => 220 - 40 * u + 25 * Math.sin(2 * Math.PI * 4 * u), gain: env.swell(0.35) });
    s.pulse(0.02, 0.55, { freq: () => 110, gain: env.swell(0.12), duty: 0.25 });
    s.arpeggio(0.6, [72, 79], 0.1, { gain: 0.22, voice: 'wave', hold: 0.25 });
    return s;
  },

  /**
   * NormalStatusMoveAnimations.playSoftBoiled: the egg drops (0-0.42 s) and cracks,
   * a wave and blue sparkles burst out (0.42-1.57 s), then healSparkles (1.57-2.47 s).
   */
  softboiled: () => {
    const s = new MoveSfx(2.6, 0x50fb);
    s.pulse(0.0, 0.42, { freq: (u) => 1500 - 900 * u, gain: env.ramp(0.06, 0.16), duty: 0.125 });
    s.noise(0.42, 0.08, { clock: () => 9000, gain: env.decay(0.3, 1) });
    s.pulse(0.42, 0.1, { freq: () => 880, gain: env.decay(0.22, 2), duty: 0.5 });
    s.wave(0.45, 0.42, { freq: env.ramp(500, 1000), gain: env.swell(0.22) });
    s.sparkle(0.5, 1.05, 18, { lo: 2800, hi: 5200, gain: 0.16 });
    s.wave(0.85, 0.7, { freq: () => 1318, gain: env.swell(0.08) });
    s.arpeggio(1.6, [72, 76, 79, 84], 0.14, { gain: 0.22, voice: 'wave', hold: 0.4 });
    s.sparkle(1.65, 0.75, 10, { lo: 3500, hi: 6000, gain: 0.1 });
    return s;
  },

  /** Generic self aura (~0.8 s): flops around uselessly - two boing hops, two tiny splashes. */
  splash: () => {
    const s = new MoveSfx(1.0, 0x5b1a);
    for (const at of [0.02, 0.42]) {
      s.pulse(at, 0.2, { freq: (u) => 300 + 600 * Math.sin(Math.PI * u), gain: env.decay(0.25, 0.8), duty: 0.5 });
      s.splash(at + 0.22, 0.3);
    }
    return s;
  },

  /** Generic self aura (~0.8 s): energy is gulped down and stored in three swelling pulses. */
  stockpile: () => {
    const s = new MoveSfx(1.1, 0x570c);
    for (const [at, f] of [[0.02, 110], [0.28, 130], [0.54, 155]]) {
      s.pulse(at, 0.22, { freq: (u) => f * (1 + 0.6 * Math.sin(Math.PI * u)), gain: env.attackDecay(0.4, 0.3), duty: 0.5 });
      s.wave(at, 0.2, { freq: () => f * 4, gain: env.swell(0.12) });
    }
    s.wave(0.8, 0.25, { freq: env.ramp(330, 440), gain: env.decay(0.18, 1) });
    return s;
  },

  /**
   * MoveAnimationService.playSubstitute (played by the move resolver, not the move
   * registry): smoke puffs (0-0.58 s) while the Pokémon fades (0-0.3 s), the doll
   * swaps in and drops (0.4 s), lands at 0.62 s and settles by 0.74 s.
   * A puff of smoke, then the decoy doll pops into place.
   */
  substitute: () => {
    const s = new MoveSfx(1.0, 0x5ab5);
    s.noise(0.02, 0.4, { clock: env.ramp(3000, 900), gain: env.attackDecay(0.32, 0.1) });
    s.pulse(0.3, 0.12, { freq: env.ramp(200, 500), gain: env.decay(0.4, 1), duty: 0.5 });
    s.arpeggio(0.42, [67, 72, 79], 0.08, { gain: 0.24, voice: 'wave', hold: 0.15 });
    s.pulse(0.62, 0.18, { freq: () => 260, gain: env.decay(0.25, 2), duty: 0.25 });
    return s;
  },

  /** Generic self aura (~0.8 s): the stockpile is swallowed in gulps, then a soothing heal. */
  swallow: () => {
    const s = new MoveSfx(1.3, 0x5a11);
    for (const at of [0.02, 0.2, 0.38]) s.pulse(at, 0.14, { freq: (u) => 260 * Math.pow(0.45, u), gain: env.decay(0.38, 1.5), duty: 0.5 });
    s.arpeggio(0.6, [72, 76, 79, 84], 0.09, { gain: 0.24, voice: 'wave', hold: 0.16 });
    s.sparkle(0.7, 0.45, 5, { gain: 0.12 });
    return s;
  },

  /**
   * NormalStatusMoveAnimations.playSwordsDance: six swords pop in (0-0.25 s), circle the
   * caster once (0.25-1.45 s), fade (1.45-1.7 s), then orange stat sparkles (1.7-2.9 s).
   * Blades whirl in a dance, ringing as they pass, then the stat-up jingle.
   */
  swordsdance: () => {
    const s = new MoveSfx(2.9, 0x5d0d);
    s.pulse(0.02, 0.2, { freq: (u) => 1200 + 1200 * u, gain: env.decay(0.14, 1.5), duty: 0.125 });
    for (let i = 0; i < 6; i++) {
      const at = 0.25 + i * 0.2;
      s.whoosh(at, 0.16, { from: 3000, to: 9000, gain: 0.18 });
      s.pulse(at + 0.12, 0.2, { freq: () => (i % 2 ? 2093 : 1760), gain: env.decay(0.15, 1.5), duty: 0.125 });
    }
    s.sparkle(0.3, 1.1, 10, { lo: 3500, hi: 6500, gain: 0.1 });
    s.statUp(1.7);
    return s;
  },


  /** Generic self aura (~0.8 s, no fleck): a wish rises to the stars - a soft twinkling run with a glimmer. */
  wish: () => {
    const s = new MoveSfx(1.2, 0x3e15);
    s.arpeggio(0.02, [76, 79, 83, 88], 0.1, { gain: 0.22, voice: 'wave', hold: 0.2 });
    s.chord(0.4, 0.5, [88, 91, 95], { rate: 0.04, gain: 0.12, voice: 'wave' });
    s.sparkle(0.1, 0.85, 10, { lo: 3000, hi: 6000, gain: 0.12 });
    return s;
  },

  /** Generic self aura + stat-up fleck (0.85 s): the user psyches itself up - two pumped grunts, then the jingle. */
  workup: () => {
    const s = new MoveSfx(1.5, 0x3e0b);
    for (const at of [0.08, 0.36]) {
      s.thud(at, 0.35, 0.4);
      s.pulse(at, 0.15, { freq: env.ramp(200, 330), gain: env.decay(0.2, 1), duty: 0.25 });
    }
    s.pulse(0.55, 0.25, { freq: env.ramp(250, 600), gain: env.swell(0.15), duty: 0.25 });
    s.statUp(0.85);
    return s;
  },
};
