import { MoveSfx } from '../move-sfx.mjs';
import { env } from '../track.mjs';

/** Dark-type move sounds. */
export const DARK = {
  /** Generic melee: a low, menacing swing and a hard blow. */
  assurance: () => {
    const s = new MoveSfx(0.75, 0xa55a);
    s.whoosh(0.0, 0.18, { from: 800, to: 2500, gain: 0.35 });
    s.thud(0.17, 0.65, 0.7);
    s.pulse(0.2, 0.4, { freq: env.ramp(110, 70), gain: env.decay(0.2, 1), duty: 0.125 });
    return s;
  },

  /** Generic projectile (0.43 s): the whole party piles in with quick blows. */
  beatup: () => {
    const s = new MoveSfx(0.95, 0xbea7);
    s.whoosh(0.0, 0.45, { from: 1000, to: 4000, gain: 0.3 });
    for (const [at, g] of [[0.43, 0.6], [0.52, 0.4], [0.6, 0.45], [0.69, 0.35]]) s.thud(at, g, 0.4);
    return s;
  },

  /** DarkMoveAnimations.playBite: jaws open and close (0.45 s), snap with sparks, fade (~0.9 s). */
  bite: () => {
    const s = new MoveSfx(0.9, 0xb17e);
    s.pulse(0.02, 0.43, { freq: env.ramp(120, 240), gain: env.ramp(0.05, 0.2), duty: 0.125 });
    s.noise(0.45, 0.06, { clock: () => 14000, gain: env.decay(0.6, 1) });
    s.pulse(0.45, 0.05, { freq: () => 1400, gain: env.decay(0.35, 1), duty: 0.25 });
    s.pulse(0.5, 0.05, { freq: () => 1100, gain: env.decay(0.3, 1), duty: 0.25 });
    s.thud(0.45, 0.45, 0.3);
    s.sparkle(0.48, 0.25, 5, { gain: 0.14 });
    return s;
  },

  /**
   * DarkMoveAnimations.playCrunch: black (0-0.25 s), purple swirl (0.25-0.55 s), the jaw
   * opens and snaps shut at ~1.0 s, grinds at ~1.25 / ~1.5 s, lets go by ~1.95 s, the
   * backdrop clears by ~2.3 s. A low growl, then sharp fangs crunching down three times.
   */
  crunch: () => {
    const s = new MoveSfx(2.3, 0xc2a7);
    s.noise(0.25, 0.75, { clock: () => 700, gain: env.swell(0.12) });
    s.pulse(0.55, 0.45, { freq: env.ramp(110, 200), gain: env.ramp(0.05, 0.2), duty: 0.125 });
    [[1.0, 0.6], [1.25, 0.45], [1.5, 0.45]].forEach(([at, g]) => {
      s.noise(at, 0.06, { clock: () => 9000, gain: env.decay(g, 1) });
      s.thud(at, g * 0.9, 0.45);
    });
    return s;
  },


  /**
   * DarkMoveAnimations.playDarkPulse: the scene greys out (0.28 s), five dark
   * rings spread every 0.17 s (1 s each), the target is hit as the first waves
   * pass, then the scene clears (to ~2.3 s).
   */
  darkpulse: () => {
    const s = new MoveSfx(2.35, 0xda75);
    s.pulse(0.0, 2.2, { freq: () => 55, gain: (u) => 0.16 * Math.min(1, u * 8) * Math.min(1, (1 - u) * 5), duty: 0.25 });
    for (let i = 0; i < 5; i++) {
      const at = 0.28 + i * 0.17;
      s.pulse(at, 0.3, { freq: (u) => 160 * Math.pow(0.55, u), gain: env.decay(0.35, 1.5), duty: 0.5 });
      s.noise(at, 0.3, { clock: env.ramp(1800, 600), gain: env.swell(0.12) });
    }
    for (const at of [0.55, 0.72, 0.89]) s.thud(at, 0.35, 0.4);
    return s;
  },

  /** Generic target aura + sleep fleck: the foes sink into a black void. */
  darkvoid: () => {
    const s = new MoveSfx(1.35, 0xda70);
    s.wave(0.02, 0.6, { freq: (u) => 400 * Math.pow(0.2, u), gain: env.swell(0.35) });
    s.noise(0.02, 0.6, { clock: env.ramp(1200, 300), gain: env.swell(0.2) });
    s.sleep(0.62);
    return s;
  },

  /** Generic target aura: a heavy, gloomy seal clamps down on the target's items. */
  embargo: () => {
    const s = new MoveSfx(1.15, 0xeba2);
    s.pulse(0.02, 0.8, { freq: (u) => 98 * (1 + 0.02 * Math.sin(2 * Math.PI * 5 * u)), gain: env.swell(0.3), duty: 0.25 });
    s.pulse(0.02, 0.8, { freq: () => 139, gain: env.swell(0.15), duty: 0.5 });
    s.noise(0.6, 0.06, { clock: () => 4000, gain: env.decay(0.4, 1), short: true });
    s.thud(0.6, 0.45, 0.6);
    return s;
  },

  /** Generic self aura (~0.8 s) + Sp. Def drop fleck (0.85 s): crocodile sobs, wobbling high whimpers. */
  faketears: () => {
    const s = new MoveSfx(1.5, 0xfa7e);
    for (const at of [0.05, 0.3, 0.55]) {
      s.pulse(at, 0.2, { freq: (u) => (1400 - 500 * u) * (1 + 0.04 * Math.sin(2 * Math.PI * 30 * u)), gain: env.swell(0.22), duty: 0.25 });
    }
    s.bubbles(0.15, 0.55, 4, { lo: 1500, hi: 2500, gain: 0.12 });
    s.statDown(0.85);
    return s;
  },

  /** Generic melee (impact 0.17 s): a sly vanishing sidestep, then an unseen blow. */
  feintattack: () => {
    const s = new MoveSfx(0.8, 0xfe1a);
    s.pulse(0.0, 0.15, { freq: env.ramp(400, 1200), gain: env.decay(0.18, 1), duty: 0.125 });
    s.whoosh(0.02, 0.15, { from: 3000, to: 1200, gain: 0.25 });
    s.thud(0.17, 0.6, 0.6);
    s.pulse(0.2, 0.35, { freq: env.ramp(130, 80), gain: env.decay(0.18, 1), duty: 0.125 });
    return s;
  },

  /** Generic self aura (~0.8 s) + confusion fleck (0.85 s): sugary, insincere praise. */
  flatter: () => {
    const s = new MoveSfx(1.5, 0xf1a7);
    s.arpeggio(0.02, [72, 76, 79, 76, 81, 79], 0.11, { gain: 0.26, voice: 'wave', hold: 0.16 });
    s.arpeggio(0.02, [84, 88, 91, 88, 93, 91], 0.11, { gain: 0.07, duty: 0.25, hold: 0.08 });
    s.sparkle(0.3, 0.45, 5, { lo: 3000, hi: 5000, gain: 0.1 });
    s.confusion(0.85, 0.22);
    return s;
  },

  /** Generic projectile (impact at 0.43 s): an item is hurled end over end and clonks into the target. */
  fling: () => {
    const s = new MoveSfx(0.85, 0xf11e);
    for (const at of [0.04, 0.16, 0.28]) s.whoosh(at, 0.1, { from: 1800, to: 4500, gain: 0.18 });
    s.thud(0.43, 0.6, 0.5);
    s.pulse(0.43, 0.2, { freq: (u) => 1200 - 500 * u, gain: env.decay(0.18, 2), duty: 0.25 });
    return s;
  },

  /** Generic melee (impact at 0.17 s): a sly feint, then the target's own power turned against it - a sneering low sting. */
  foulplay: () => {
    const s = new MoveSfx(0.85, 0xf0a1);
    s.pulse(0.0, 0.15, { freq: (u) => 330 - 120 * u, gain: env.ramp(0.08, 0.2), duty: 0.125 });
    s.whoosh(0.03, 0.15, { from: 2500, to: 8000, gain: 0.25 });
    s.thud(0.17, 0.7, 0.7);
    s.pulse(0.2, 0.4, { freq: (u) => 220 * (1 + 0.06 * Math.sin(2 * Math.PI * 7 * u)), gain: env.decay(0.18, 1.5), duty: 0.25 });
    s.pulse(0.2, 0.4, { freq: (u) => 233 * (1 + 0.06 * Math.sin(2 * Math.PI * 7 * u)), gain: env.decay(0.12, 1.5), duty: 0.5 });
    return s;
  },

  /** Generic self aura (~0.8 s): claws scrape against each other twice, then the stat-up jingle (0.85 s). */
  honeclaws: () => {
    const s = new MoveSfx(1.45, 0x40c1);
    for (const at of [0.05, 0.3, 0.55]) {
      s.noise(at, 0.18, { clock: (u) => 9000 + 5000 * u, gain: env.swell(0.28), short: true });
      s.pulse(at, 0.16, { freq: (u) => 2400 + 800 * u, gain: env.decay(0.12, 1.5), duty: 0.125 });
    }
    s.statUp(0.85);
    return s;
  },

  /** Generic projectile (0.43 s): a ring portal opens, unleashing a heavy flurry of dark blows. */
  hyperspacefury: () => {
    const s = new MoveSfx(1.1, 0x4f5f);
    s.pulse(0.0, 0.43, { freq: (u) => 110 + 60 * Math.sin(2 * Math.PI * 4 * u), gain: env.ramp(0.08, 0.2), duty: 0.25 });
    s.whoosh(0.0, 0.43, { from: 800, to: 4000, gain: 0.25 });
    for (const [at, g] of [[0.43, 0.55], [0.53, 0.4], [0.63, 0.45], [0.74, 0.35]]) s.thud(at, g, 0.6);
    s.rumble(0.45, 0.6, { from: 400, to: 120, gain: 0.25 });
    return s;
  },

  /** Generic self aura (≈ 0.8 s) + Atk / Sp. Atk drop fleck (0.85 s): the user gives everything up - a sinking, fading dirge. */
  memento: () => {
    const s = new MoveSfx(1.55, 0xde4d);
    s.wave(0.0, 0.85, { freq: (u) => 330 * Math.pow(0.5, u), gain: env.swell(0.25) });
    s.pulse(0.0, 0.85, { freq: (u) => 220 * Math.pow(0.5, u) * (1 + 0.02 * Math.sin(2 * Math.PI * 6 * u)), gain: env.swell(0.12), duty: 0.25 });
    s.noise(0.2, 0.6, { clock: () => 1200, gain: env.swell(0.08) });
    s.statDown(0.85);
    return s;
  },

  /** Generic self aura (~0.8 s) + Sp. Atk +2 fleck (~0.85 s): a sly, scheming chuckle of low creeping notes, then a stat jingle. */
  nastyplot: () => {
    const s = new MoveSfx(1.5, 0x9a57);
    s.pulse(0.02, 0.75, { freq: () => 98, gain: env.swell(0.14), duty: 0.25 });
    s.arpeggio(0.05, [57, 58, 57, 63, 62, 61], 0.12, { gain: 0.22, duty: 0.25, hold: 0.11 });
    s.arpeggio(0.05, [69, 70, 69, 75, 74, 73], 0.12, { gain: 0.08, voice: 'wave', hold: 0.11 });
    s.statUp(0.85);
    return s;
  },

  /** Generic projectile (0.43 s) + accuracy drop fleck (~0.55 s): a pitch-black shockwave hums over and booms dully. */
  nightdaze: () => {
    const s = new MoveSfx(1.05, 0x7da2);
    s.pulse(0.0, 0.45, { freq: (u) => 70 + 50 * u, gain: env.ramp(0.08, 0.26), duty: 0.25 });
    s.noise(0.0, 0.45, { clock: env.ramp(400, 1300), gain: env.swell(0.18) });
    s.thud(0.43, 0.6, 0.8);
    s.noise(0.43, 0.3, { clock: env.ramp(2500, 500), gain: env.attackDecay(0.3, 0.05) });
    s.statDown(0.58);
    return s;
  },

  /** Generic melee slash (impact 0.17 s), no fleck: a swift dark swipe with a keen, ringing cut. */
  nightslash: () => {
    const s = new MoveSfx(0.7, 0x5a54);
    s.whoosh(0.0, 0.18, { from: 1500, to: 7000, gain: 0.35 });
    s.slash(0.17, 0.6);
    s.pulse(0.17, 0.35, { freq: env.ramp(130, 80), gain: env.decay(0.22, 1.2), duty: 0.125 });
    s.pulse(0.2, 0.15, { freq: () => 3200, gain: env.decay(0.08, 2), duty: 0.125 });
    return s;
  },

  /** Generic target aura (0-0.8 s): a sneering parting jab of low taunting blips. */
  partingshot: () => {
    const s = new MoveSfx(1.1, 0xda57);
    s.pulse(0.02, 0.6, { freq: (u) => 140 + 20 * Math.sin(2 * Math.PI * 4 * u), gain: env.swell(0.25), duty: 0.25 });
    s.arpeggio(0.05, [67, 64, 67, 64, 58], 0.12, { gain: 0.2, duty: 0.125, hold: 0.1 });
    s.whoosh(0.7, 0.25, { from: 5000, to: 1500, gain: 0.2 });
    return s;
  },

  /** Generic melee (0.17 s impact): a dark, vengeful hit with a low menacing hum. */
  payback: () => {
    const s = new MoveSfx(0.85, 0xdabc);
    s.pulse(0.0, 0.17, { freq: (u) => 90 + 60 * u, gain: env.swell(0.25), duty: 0.25 });
    s.whoosh(0.02, 0.15, { from: 1500, to: 6000, gain: 0.2 });
    s.thud(0.17, 0.6, 0.7);
    s.noise(0.2, 0.4, { clock: () => 600, gain: env.decay(0.2, 1.5) });
    return s;
  },

  /** Generic melee (impact 0.17 s): a harsh, punishing smack with a low sneer. */
  punishment: () => {
    const s = new MoveSfx(0.75, 0xd9a1);
    s.whoosh(0.0, 0.18, { from: 1200, to: 4000, gain: 0.3 });
    s.thud(0.17, 0.75, 0.6);
    s.noise(0.17, 0.05, { clock: () => 14000, gain: env.decay(0.3, 1) });
    s.pulse(0.22, 0.35, { freq: (u) => 110 * Math.pow(0.8, u), gain: env.decay(0.18, 1.5), duty: 0.125 });
    return s;
  },

  /** Generic melee (impact 0.17 s): a sneaky dash from the shadows and a sharp blow. */
  pursuit: () => {
    const s = new MoveSfx(0.7, 0xd905);
    s.pulse(0.0, 0.18, { freq: (u) => 180 - 60 * u, gain: env.ramp(0.05, 0.15), duty: 0.125 });
    s.whoosh(0.0, 0.18, { from: 1500, to: 6000, gain: 0.3 });
    s.thud(0.17, 0.7, 0.45);
    s.thud(0.3, 0.3, 0.3);
    return s;
  },

  /** Generic target aura (~0.8 s): the target is held back - a heavy, sinking dark drone. */
  quash: () => {
    const s = new MoveSfx(0.95, 0xd9a5);
    s.pulse(0.02, 0.15, { freq: (u) => 300 * Math.pow(0.5, u), gain: env.decay(0.35, 1.5), duty: 0.5 });
    s.noise(0.02, 0.1, { clock: () => 2500, gain: env.decay(0.25, 1) });
    s.pulse(0.1, 0.75, { freq: (u) => 140 * Math.pow(0.6, u), gain: env.swell(0.2), duty: 0.125 });
    s.wave(0.1, 0.75, { freq: (u) => 220 * Math.pow(0.7, u) * (1 + 0.03 * Math.sin(2 * Math.PI * 5 * u)), gain: env.swell(0.25) });
    return s;
  },

  /** Generic sonic (rings 0-0.33 s, impact 0.43 s) + Sp. Atk drop fleck (0.55 s): a rough, snarling growl. */
  snarl: () => {
    const s = new MoveSfx(1.05, 0x5aa1);
    s.pulse(0.0, 0.45, { freq: (u) => (130 + 30 * Math.sin(Math.PI * u)) * (1 + 0.12 * Math.sin(2 * Math.PI * 25 * u)), gain: env.swell(0.35), duty: 0.25 });
    s.noise(0.0, 0.45, { clock: () => 1400, gain: env.swell(0.2) });
    s.statDown(0.55, 0.24);
    return s;
  },

  /** Generic self aura (priority): the user lurks and a sneaky hand darts out to steal. */
  snatch: () => {
    const s = new MoveSfx(0.95, 0x5a7c);
    s.arpeggio(0.02, [55, 54, 55, 54], 0.1, { gain: 0.18, voice: 'wave', hold: 0.1 });
    s.whoosh(0.42, 0.15, { from: 2000, to: 9000, gain: 0.3 });
    s.pulse(0.58, 0.08, { freq: () => 1200, gain: env.decay(0.25, 1.5), duty: 0.25 });
    s.noise(0.58, 0.05, { clock: () => 9000, gain: env.decay(0.25, 1) });
    s.pulse(0.66, 0.2, { freq: () => 1600, gain: env.decay(0.15, 1.5), duty: 0.125 });
    return s;
  },

  /** Generic melee (priority, impact 0.12 s): a sly, sudden jab from the shadows. */
  suckerpunch: () => {
    const s = new MoveSfx(0.6, 0x5c4e);
    s.pulse(0.0, 0.12, { freq: env.ramp(110, 75), gain: env.swell(0.2), duty: 0.25 });
    s.whoosh(0.0, 0.12, { from: 2500, to: 7000, gain: 0.3 });
    s.thud(0.12, 0.75, 0.5);
    s.pulse(0.16, 0.25, { freq: (u) => 140 * Math.pow(0.6, u), gain: env.decay(0.2, 1.5), duty: 0.125 });
    return s;
  },

  /** Generic target aura (~0.8 s): a sneaky swap - two items whisk past each other. */
  switcheroo: () => {
    const s = new MoveSfx(1.0, 0x5c7e);
    s.whoosh(0.02, 0.3, { from: 2000, to: 6000, gain: 0.25 });
    s.whoosh(0.3, 0.3, { from: 6000, to: 2000, gain: 0.25 });
    s.arpeggio(0.05, [62, 69], 0.3, { gain: 0.24, duty: 0.25, hold: 0.2 });
    s.arpeggio(0.62, [69, 62], 0.1, { gain: 0.22, voice: 'wave', hold: 0.18 });
    return s;
  },

  /** Generic melee (impact 0.17 s): a low swipe that knocks the held item flying. */
  knockoff: () => {
    const s = new MoveSfx(0.85, 0x40cf);
    s.whoosh(0.0, 0.18, { from: 1000, to: 4000, gain: 0.3 });
    s.thud(0.17, 0.6, 0.5);
    s.pulse(0.22, 0.35, { freq: (u) => 1400 - 900 * u, gain: env.decay(0.15, 1), duty: 0.125 });
    s.noise(0.58, 0.04, { clock: () => 5000, gain: env.decay(0.25, 1) });
    s.noise(0.66, 0.03, { clock: () => 4000, gain: env.decay(0.15, 1) });
    return s;
  },

  /** Generic target aura (~0.8 s, no fleck): a mocking jeer - two cocky "nyah" blips over a low menacing pulse. */
  taunt: () => {
    const s = new MoveSfx(1.05, 0x7a07);
    s.pulse(0.02, 0.8, { freq: (u) => 98 * (1 + 0.04 * Math.sin(2 * Math.PI * 5 * u)), gain: env.swell(0.2), duty: 0.25 });
    for (const [at, f] of [[0.1, 660], [0.3, 523], [0.5, 660], [0.66, 494]]) {
      s.pulse(at, 0.14, { freq: (u) => f * (1 + 0.12 * Math.sin(Math.PI * u)), gain: env.attackDecay(0.22, 0.1), duty: 0.5 });
    }
    return s;
  },

  /** Generic target aura (~0.8 s, no fleck): everything flips - a pitch sweep that rises and turns over, with a low tumble. */
  topsyturvy: () => {
    const s = new MoveSfx(1.05, 0x7095);
    s.pulse(0.02, 0.4, { freq: (u) => 200 * Math.pow(6, u), gain: env.swell(0.2), duty: 0.25 });
    s.pulse(0.42, 0.4, { freq: (u) => 1200 * Math.pow(1 / 6, u), gain: env.swell(0.2), duty: 0.25 });
    s.wave(0.02, 0.8, { freq: (u) => 110 * (1 + 0.1 * Math.sin(2 * Math.PI * 2 * u)), gain: env.swell(0.18) });
    s.whoosh(0.3, 0.3, { from: 2000, to: 6000, gain: 0.15 });
    s.thud(0.82, 0.3, 0.6);
    return s;
  },

  /** Generic target aura (~0.8 s, no fleck): nagging torment - a dissonant, needling minor-second drone that pricks again and again. */
  torment: () => {
    const s = new MoveSfx(1.05, 0x7023);
    s.chord(0.02, 0.85, [58, 59], { rate: 0.04, gain: 0.18, voice: 'pulse' });
    s.wave(0.02, 0.85, { freq: (u) => 82 * (1 + 0.03 * Math.sin(2 * Math.PI * 7 * u)), gain: env.swell(0.2) });
    for (let i = 0; i < 4; i++) s.pulse(0.12 + i * 0.17, 0.06, { freq: env.ramp(1500, 1100), gain: env.decay(0.16, 1), duty: 0.125 });
    return s;
  },
};
