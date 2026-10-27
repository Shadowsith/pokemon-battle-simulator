import { MoveSfx } from '../move-sfx.mjs';
import { env } from '../track.mjs';

/** Dragon-type move sounds: deep roars, raw draconic energy. */
export const DRAGON = {
  /** Generic projectile at high power (0.43 s): a roar, then meteors rain down and explode. */
  dracometeor: () => {
    const s = new MoveSfx(1.6, 0xd2ac);
    s.pulse(0.0, 0.3, { freq: (u) => 110 * (1 + 0.1 * Math.sin(2 * Math.PI * 12 * u)), gain: env.swell(0.3), duty: 0.25 });
    for (const [at, g] of [[0.43, 0.75], [0.6, 0.6], [0.78, 0.65]]) {
      s.pulse(at - 0.22, 0.22, { freq: (u) => 1800 - 1300 * u, gain: env.ramp(0.05, 0.14), duty: 0.125 });
      s.thud(at, g, 0.9);
      s.noise(at, 0.25, { clock: (u) => 9000 - 7000 * u, gain: env.attackDecay(g * 0.6, 0.03) });
    }
    s.rumble(0.8, 0.75, { from: 500, to: 120, gain: 0.4 });
    return s;
  },

  /** Generic projectile (0.43 s) + paralysis fleck: a breath of dragon fire. */
  dragonbreath: () => {
    const s = new MoveSfx(1.1, 0xd2b2);
    s.noise(0.0, 0.5, { clock: env.ramp(400, 1400), gain: env.swell(0.45) });
    s.pulse(0.0, 0.45, { freq: (u) => 90 + 30 * u, gain: env.swell(0.2), duty: 0.25 });
    s.thud(0.43, 0.45, 0.5);
    s.paralyze(0.6);
    return s;
  },

  /** Generic melee slash: sharp claws and a low growl. */
  dragonclaw: () => {
    const s = new MoveSfx(0.75, 0xd2c1);
    s.pulse(0.0, 0.2, { freq: (u) => 100 * (1 + 0.1 * Math.sin(2 * Math.PI * 10 * u)), gain: env.swell(0.25), duty: 0.25 });
    s.whoosh(0.0, 0.18, { from: 2000, to: 9000, gain: 0.3 });
    s.slash(0.17, 0.6);
    s.thud(0.17, 0.4, 0.5);
    return s;
  },

  /** Generic self aura + stat-up fleck: a mystic, swirling dance. */
  dragondance: () => {
    const s = new MoveSfx(1.5, 0xd2dd);
    s.arpeggio(0.02, [57, 60, 64, 67, 69, 72, 76, 79], 0.09, { gain: 0.22, voice: 'wave', hold: 0.14 });
    s.noise(0.02, 0.75, { clock: (u) => 2000 + 1500 * Math.sin(2 * Math.PI * 2 * u), gain: env.swell(0.15) });
    s.statUp(0.85);
    return s;
  },

  /** Generic pulse (rings every 0.13 s, impact ~0.56 s): roaring waves of draconic energy. */
  dragonpulse: () => {
    const s = new MoveSfx(1.15, 0xd2be);
    s.pulse(0.0, 0.55, { freq: (u) => 82 * (1 + 0.08 * Math.sin(2 * Math.PI * 14 * u)), gain: env.ramp(0.1, 0.3), duty: 0.25 });
    for (const at of [0.02, 0.15, 0.28]) s.pulse(at, 0.15, { freq: env.ramp(330, 200), gain: env.decay(0.22, 1), duty: 0.5 });
    s.thud(0.56, 0.75, 0.9);
    s.noise(0.56, 0.35, { clock: (u) => 8000 - 6000 * u, gain: env.attackDecay(0.4, 0.03) });
    return s;
  },

  /** Generic projectile (0.43 s): a shock wave of draconic rage. */
  dragonrage: () => {
    const s = new MoveSfx(0.95, 0xd2a9);
    s.noise(0.0, 0.45, { clock: env.ramp(300, 900), gain: env.ramp(0.15, 0.4) });
    s.pulse(0.0, 0.45, { freq: (u) => 70 + 50 * u, gain: env.ramp(0.1, 0.3), duty: 0.25 });
    s.thud(0.43, 0.75, 0.8);
    s.rumble(0.45, 0.4, { from: 400, to: 150, gain: 0.25 });
    return s;
  },

  /** Generic melee at high power + flinch fleck: a menacing, crushing charge. */
  dragonrush: () => {
    const s = new MoveSfx(0.85, 0xd2a7);
    s.pulse(0.0, 0.18, { freq: (u) => 90 * (1 + 0.12 * Math.sin(2 * Math.PI * 9 * u)), gain: env.ramp(0.1, 0.3), duty: 0.25 });
    s.whoosh(0.0, 0.18, { from: 800, to: 3500, gain: 0.35 });
    s.thud(0.17, 0.9, 1);
    s.flinch(0.42);
    return s;
  },

  /** Generic melee: a tail swipe that knocks the target away. */
  dragontail: () => {
    const s = new MoveSfx(0.85, 0xd27a);
    s.whoosh(0.0, 0.18, { from: 1000, to: 5000, gain: 0.35 });
    s.thud(0.17, 0.7, 0.8);
    s.whoosh(0.3, 0.4, { from: 6000, to: 1500, gain: 0.25 });
    return s;
  },

  /** Generic melee, 2 hits (impacts at 0.17 / 0.59 s): two quick chops. */
  dualchop: () => {
    const s = new MoveSfx(0.85, 0xd0a1);
    for (const at of [0.17, 0.59]) {
      s.whoosh(at - 0.12, 0.13, { from: 2500, to: 9000, gain: 0.25 });
      s.thud(at, 0.55, 0.5);
      s.noise(at, 0.05, { clock: () => 12000, gain: env.decay(0.3, 1) });
    }
    return s;
  },

  /** Generic melee hit (impact 0.17 s), bp 120, no fleck: a raging growl, a crushing blow and a furious echo. */
  outrage: () => {
    const s = new MoveSfx(0.95, 0x0a7e);
    s.pulse(0.0, 0.2, { freq: (u) => (90 + 60 * u) * (1 + 0.06 * Math.sin(2 * Math.PI * 25 * u)), gain: env.ramp(0.1, 0.3), duty: 0.25 });
    s.noise(0.0, 0.18, { clock: env.ramp(800, 2500), gain: env.swell(0.2) });
    s.thud(0.17, 0.8, 1);
    s.noise(0.17, 0.3, { clock: (u) => 6000 - 4500 * u, gain: env.attackDecay(0.35, 0.03) });
    s.pulse(0.22, 0.5, { freq: (u) => 110 * (1 - 0.3 * u) * (1 + 0.05 * Math.sin(2 * Math.PI * 18 * u)), gain: env.decay(0.25, 1.2), duty: 0.25 });
    return s;
  },

  /** Generic projectile (impact 0.43 s), bp 150 + recharge: time itself bends – a warped, rising chord flies out and bursts with a deep, echoing boom. */
  roaroftime: () => {
    const s = new MoveSfx(1.5, 0xd1a1);
    s.pulse(0.0, 0.45, { freq: (u) => (110 + 110 * u) * (1 + 0.04 * Math.sin(2 * Math.PI * 9 * u)), gain: env.swell(0.25), duty: 0.25 });
    s.wave(0.0, 0.45, { freq: (u) => (165 + 165 * u) * (1 - 0.04 * Math.sin(2 * Math.PI * 9 * u)), gain: env.swell(0.2) });
    s.noise(0.0, 0.45, { clock: env.ramp(1000, 4000), gain: env.swell(0.2) });
    s.thud(0.43, 0.9, 1);
    s.rumble(0.43, 0.95, { from: 700, to: 120, gain: 0.4 });
    for (const [d, g] of [[0, 0.28], [0.18, 0.18], [0.36, 0.1]]) s.pulse(0.45 + d, 0.4, { freq: (u) => 147 * (1 + 0.03 * Math.sin(2 * Math.PI * 5 * u)), gain: env.decay(g, 1.5), duty: 0.5 });
    return s;
  },

  /** Generic projectile (impact 0.43 s): space itself is torn open with a warped, ripping roar. */
  spacialrend: () => {
    const s = new MoveSfx(1.0, 0x5ace);
    s.wave(0.0, 0.43, { freq: (u) => 200 + 500 * u + 40 * Math.sin(2 * Math.PI * 12 * u), gain: env.ramp(0.15, 0.3) });
    s.noise(0.0, 0.43, { clock: env.ramp(1000, 6000), gain: env.ramp(0.05, 0.2) });
    s.slash(0.43, 0.5);
    s.thud(0.43, 0.6, 0.9);
    s.pulse(0.45, 0.45, { freq: (u) => 900 * Math.pow(0.3, u) * (1 + 0.05 * Math.sin(2 * Math.PI * 20 * u)), gain: env.decay(0.25, 1.2), duty: 0.25 });
    return s;
  },

  /** Generic field (~0.6 s) + flinch fleck (~0.7 s): a draconic whirlwind howls across the field. */
  twister: () => {
    const s = new MoveSfx(1.1, 0x7a15);
    s.noise(0.0, 0.75, { clock: (u) => 2500 + 1500 * Math.sin(2 * Math.PI * 3 * u), gain: env.swell(0.35) });
    s.pulse(0.0, 0.75, { freq: (u) => 140 * (1 + 0.1 * Math.sin(2 * Math.PI * 6 * u)), gain: env.swell(0.15), duty: 0.25 });
    s.wave(0.1, 0.6, { freq: (u) => 500 + 300 * Math.sin(2 * Math.PI * 3 * u), gain: env.swell(0.12) });
    s.flinch(0.75);
    return s;
  },
};
