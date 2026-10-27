import { MoveSfx } from '../move-sfx.mjs';
import { env } from '../track.mjs';

/** Electric-type move sounds. */
export const ELECTRIC = {
  /**
   * ElectricMoveAnimations.playThunder: the sky darkens (0-0.7 s), one heavy
   * bolt strikes with field shake and flickers back twice (+0.32 s, +0.59 s),
   * the sky clears (to ~2.2 s). Deep and heavy: rumble, crack, rolling thunder.
   */
  thunder: () => {
    const t = new MoveSfx(2.4, 0x7d02);

    // Gathering storm: distant low rumble and a bass drone swelling up.
    t.noise(0.02, 0.72, { clock: env.ramp(300, 700), gain: env.ramp(0.05, 0.4) });
    t.pulse(0.02, 0.72, { freq: env.ramp(46, 38), gain: env.ramp(0.02, 0.22), duty: 0.5 });

    // The strike: bright crack, a falling boom and a bass hit.
    t.noise(0.7, 0.28, { clock: (u) => 24000 - 21000 * u, gain: env.attackDecay(0.95, 0.01) });
    t.pulse(0.7, 0.45, { freq: (u) => 900 * Math.pow(0.07, u), gain: env.decay(0.6, 2), duty: 0.25 });
    t.pulse(0.7, 0.65, { freq: env.ramp(70, 34), gain: env.decay(0.55, 1.5), duty: 0.5 });

    // The bolt flickers back twice: smaller cracks.
    for (const [at, g] of [[1.02, 0.55], [1.29, 0.42]]) {
      t.noise(at, 0.16, { clock: (u) => 16000 - 12000 * u, gain: env.attackDecay(g, 0.02) });
      t.pulse(at, 0.2, { freq: (u) => 600 * Math.pow(0.15, u), gain: env.decay(g * 0.5, 2), duty: 0.25 });
    }

    // Rolling thunder: low noise that wobbles and fades while the sky clears.
    t.noise(0.75, 1.62, {
      clock: env.ramp(900, 220),
      gain: (u) => 0.5 * Math.pow(1 - u, 1.5) * (0.7 + 0.3 * Math.sin(2 * Math.PI * 5 * u)),
    });

    return t;
  },

  /**
   * ElectricMoveAnimations.playThunderbolt: four thin bolts strike one after
   * another (every 0.23 s, each flickering once at +0.18 s) while a crackling
   * electric ball glows on the target (0.06-1.35 s) and throws off sparks.
   */
  thunderbolt: () => {
    const t = new MoveSfx(1.5, 0x7b01);

    // Four zaps: noise crack + falling pulse, pitch varies per strike.
    [1.0, 1.12, 0.94, 1.2].forEach((pitch, i) => {
      const at = 0.02 + i * 0.23;
      const g = 0.8 - i * 0.06;
      t.noise(at, 0.12, { clock: (u) => 18000 - 12000 * u, gain: env.attackDecay(g, 0.03) });
      t.pulse(at, 0.18, { freq: (u) => pitch * (1800 - 1400 * u), gain: env.decay(g * 0.55, 2), duty: 0.25 });
      // The flicker: a short re-zap halfway through the bolt.
      t.pulse(at + 0.18, 0.08, { freq: (u) => pitch * (1400 - 600 * u), gain: env.decay(g * 0.3, 1), duty: 0.125 });
    });

    // The electric ball: metallic buzz that pulses while it glows.
    t.noise(0.08, 1.3, {
      clock: () => 5200,
      gain: (u) => 0.3 * Math.sin(Math.PI * u) * (0.75 + 0.25 * Math.sin(2 * Math.PI * 9 * u)),
      short: true,
    });

    // Sparks crackling off the ball.
    for (let i = 0; i < 10; i++) {
      const at = 0.1 + i * 0.099 + t.random() * 0.03;
      const f = 2000 + t.random() * 2200;
      t.pulse(at, 0.035, { freq: (u) => f * (1 - 0.35 * u), gain: env.decay(0.28, 1), duty: 0.125 });
    }

    return t;
  },

  /** Generic melee at high power + paralysis fleck: a charging, crackling body blow. */
  boltstrike: () => {
    const s = new MoveSfx(1.15, 0xb057);
    s.noise(0.0, 0.18, { clock: env.ramp(3000, 9000), gain: env.ramp(0.1, 0.4), short: true });
    s.thud(0.17, 0.6, 0.9);
    s.noise(0.17, 0.25, { clock: (u) => 20000 - 14000 * u, gain: env.attackDecay(0.45, 0.02) });
    s.pulse(0.17, 0.3, { freq: (u) => 1600 - 1300 * u, gain: env.decay(0.4, 2), duty: 0.25 });
    s.noise(0.3, 0.4, { clock: () => 6000, gain: env.decay(0.2, 1.5), short: true });
    s.paralyze(0.75);
    return s;
  },

  /** Generic self aura + stat-up fleck: electricity builds up in the body. */
  charge: () => {
    const s = new MoveSfx(1.5, 0xc4a9);
    s.noise(0.02, 0.8, { clock: env.ramp(2000, 9000), gain: env.ramp(0.05, 0.3), short: true });
    s.pulse(0.02, 0.8, { freq: env.ramp(200, 800), gain: env.ramp(0.05, 0.2), duty: 0.25 });
    s.sparkle(0.3, 0.5, 7, { lo: 2000, hi: 4500, gain: 0.16 });
    s.statUp(0.85);
    return s;
  },

  /** Generic beam (grows 0.26 s, holds ~0.21 s, fades 0.2 s): a buzzing electric beam. */
  chargebeam: () => {
    const s = new MoveSfx(0.85, 0xc4be);
    s.pulse(0.0, 0.26, { freq: env.ramp(300, 900), gain: env.ramp(0.08, 0.25), duty: 0.25 });
    s.noise(0.0, 0.7, { clock: () => 6500, gain: (u) => 0.3 * Math.min(1, u * 4) * Math.min(1, (1 - u) * 3), short: true });
    s.pulse(0.26, 0.42, { freq: (u) => 880 * (1 + 0.03 * Math.sin(2 * Math.PI * 20 * u)), gain: (u) => 0.2 * (1 - u), duty: 0.125 });
    s.noise(0.26, 0.15, { clock: (u) => 16000 - 8000 * u, gain: env.attackDecay(0.4, 0.05) });
    return s;
  },

  /** Generic field move + paralysis fleck: electricity bursts out in all directions. */
  discharge: () => {
    const s = new MoveSfx(1.15, 0xd15c);
    s.noise(0.0, 0.5, { clock: (u) => 18000 - 10000 * u, gain: env.attackDecay(0.5, 0.03), short: true });
    s.pulse(0.0, 0.4, { freq: (u) => 1500 - 1100 * u, gain: env.decay(0.3, 1.5), duty: 0.25 });
    s.sparkle(0.05, 0.5, 10, { lo: 2000, hi: 4500, gain: 0.18 });
    s.paralyze(0.55);
    return s;
  },

  /** Generic self aura + stat-down fleck: strange electric waves pulse out of the user. */
  eerieimpulse: () => {
    const s = new MoveSfx(1.5, 0xee1e);
    s.wave(0.02, 0.8, { freq: (u) => 600 * (1 + 0.08 * Math.sin(2 * Math.PI * 7 * u)), gain: env.swell(0.25) });
    s.noise(0.02, 0.8, { clock: () => 4500, gain: (u) => 0.18 * Math.sin(Math.PI * u) * (0.5 + 0.5 * Math.sin(2 * Math.PI * 6 * u)), short: true });
    for (let i = 0; i < 4; i++) s.pulse(0.05 + i * 0.18, 0.1, { freq: env.ramp(1600, 900), gain: env.decay(0.2, 1.5), duty: 0.25 });
    s.statDown(0.85);
    return s;
  },

  /** Generic target aura (field terrain): the ground charges with a bright, steady electric hum. */
  electricterrain: () => {
    const s = new MoveSfx(1.3, 0xe7e2);
    s.noise(0.02, 1.0, { clock: () => 6500, gain: (u) => 0.22 * Math.sin(Math.PI * u) * (0.7 + 0.3 * Math.sin(2 * Math.PI * 12 * u)), short: true });
    s.chord(0.05, 0.9, [76, 81, 88], { rate: 0.03, gain: 0.18, voice: 'pulse' });
    s.sparkle(0.1, 0.8, 10, { lo: 3000, hi: 6000, gain: 0.16 });
    s.paralyze(0.6, 0.18);
    return s;
  },

  /** Generic target aura: the target is charged up, a rising crackling buzz. */
  electrify: () => {
    const s = new MoveSfx(1.15, 0xe1ef);
    s.noise(0.02, 0.8, { clock: env.ramp(3000, 9000), gain: env.swell(0.25), short: true });
    s.pulse(0.02, 0.75, { freq: (u) => 300 * Math.pow(4, u), gain: env.swell(0.18), duty: 0.25 });
    s.paralyze(0.6, 0.25);
    return s;
  },

  /** Generic lob (impact 0.52 s): a buzzing electric ball arcs over and bursts. */
  electroball: () => {
    const s = new MoveSfx(1.05, 0xe1ba);
    s.noise(0.0, 0.52, { clock: () => 5000, gain: (u) => 0.18 * (0.6 + 0.4 * Math.sin(2 * Math.PI * 10 * u)), short: true });
    s.pulse(0.0, 0.52, { freq: (u) => 700 + 300 * Math.sin(Math.PI * u), gain: () => 0.12, duty: 0.25 });
    s.noise(0.52, 0.2, { clock: (u) => 18000 - 12000 * u, gain: env.attackDecay(0.6, 0.03) });
    s.pulse(0.52, 0.25, { freq: (u) => 1800 - 1400 * u, gain: env.decay(0.35, 2), duty: 0.25 });
    s.sparkle(0.55, 0.3, 5, { gain: 0.15 });
    return s;
  },

  /** Generic field move + stat-down fleck: a crackling net of electricity spreads over the foes. */
  electroweb: () => {
    const s = new MoveSfx(1.35, 0xe1eb);
    s.noise(0.0, 0.6, { clock: () => 6000, gain: (u) => 0.28 * Math.min(1, u * 8) * Math.pow(1 - u, 0.6), short: true });
    for (let i = 0; i < 6; i++) s.pulse(i * 0.09 + s.random() * 0.03, 0.06, { freq: (u) => 2000 - 1000 * u, gain: env.decay(0.25, 1), duty: 0.125 });
    s.pulse(0.0, 0.5, { freq: env.ramp(400, 250), gain: env.decay(0.15, 1), duty: 0.25 });
    s.statDown(0.65, 0.22);
    return s;
  },

  /** Generic projectile (impact at 0.43 s): the user turns into a crackling bolt and rams the target - buzz rush, big zap crash. */
  fusionbolt: () => {
    const s = new MoveSfx(1.05, 0xf0b0);
    s.noise(0.0, 0.43, { clock: (u) => 3000 + 5000 * u, gain: env.ramp(0.08, 0.25), short: true });
    s.pulse(0.0, 0.43, { freq: (u) => 200 + 600 * u, gain: env.ramp(0.06, 0.16), duty: 0.125 });
    s.thud(0.43, 0.75, 0.8);
    s.noise(0.43, 0.4, { clock: (u) => 9000 - 5000 * u, gain: env.attackDecay(0.35, 0.03), short: true });
    for (const at of [0.55, 0.65, 0.74]) s.pulse(at, 0.06, { freq: () => 2400 + s.random() * 800, gain: env.decay(0.14, 1), duty: 0.25 });
    return s;
  },

  /** Generic target aura at priority (~0.8 s, no fleck): a crackling electric storm sweeps the field. */
  iondeluge: () => {
    const s = new MoveSfx(1.05, 0x10de);
    s.noise(0.0, 0.85, { clock: (u) => 6000 + 3000 * Math.sin(2 * Math.PI * 5 * u), gain: env.swell(0.25), short: true });
    s.pulse(0.0, 0.85, { freq: (u) => 220 + 440 * u, gain: env.swell(0.12), duty: 0.25 });
    for (let i = 0; i < 6; i++) {
      const at = 0.08 + i * 0.12;
      s.pulse(at, 0.05, { freq: (u) => 2000 - 1000 * u, gain: env.decay(0.18, 1), duty: 0.25 });
    }
    return s;
  },

  /** Generic self aura (≈ 0.8 s): magnetic field lines hum around the allies, pulsing in and out. */
  magneticflux: () => {
    const s = new MoveSfx(1.1, 0xf1c5);
    s.pulse(0.0, 0.9, { freq: (u) => 120 * (1 + 0.04 * Math.sin(2 * Math.PI * 50 * u)), gain: env.swell(0.22), duty: 0.5 });
    s.noise(0.0, 0.9, { clock: () => 3000, gain: (u) => 0.12 * (0.5 + 0.5 * Math.sin(2 * Math.PI * 5 * u)) * Math.sin(Math.PI * u), short: true });
    s.chord(0.2, 0.7, [71, 78, 83], { rate: 0.03, gain: 0.12, voice: 'pulse' });
    s.sparkle(0.4, 0.5, 5, { lo: 4000, hi: 7000, gain: 0.1 });
    return s;
  },

  /** Generic self aura (≈ 0.8 s): an electromagnetic hum swells and lifts the user off the ground. */
  magnetrise: () => {
    const s = new MoveSfx(1.1, 0xf15e);
    s.pulse(0.0, 0.95, { freq: (u) => 110 * Math.pow(3, u) * (1 + 0.03 * Math.sin(2 * Math.PI * 40 * u)), gain: env.swell(0.24), duty: 0.5 });
    s.wave(0.1, 0.85, { freq: (u) => 220 * Math.pow(3, u), gain: env.swell(0.14) });
    s.noise(0.0, 0.9, { clock: env.ramp(1500, 5000), gain: env.swell(0.08), short: true });
    return s;
  },

  /** Generic melee hit (impact 0.17 s) + paralysis fleck (~0.45 s): a cute little nuzzle, a soft bump and crackling cheeks. */
  nuzzle: () => {
    const s = new MoveSfx(0.85, 0x9e22);
    s.pulse(0.0, 0.17, { freq: env.ramp(900, 1500), gain: env.ramp(0.05, 0.16), duty: 0.25 });
    s.thud(0.17, 0.4, 0.2);
    s.noise(0.17, 0.12, { clock: () => 8000, gain: env.decay(0.3, 1), short: true });
    s.sparkle(0.2, 0.2, 4, { lo: 3000, hi: 5000, gain: 0.12 });
    s.paralyze(0.45);
    return s;
  },

  /** Generic field (≈0.6 s) + drain: a crackling electric ring spreads out, then energy flows back. */
  paraboliccharge: () => {
    const s = new MoveSfx(1.4, 0xe1ac);
    s.noise(0.02, 0.6, { clock: (u) => 6000 + 3000 * Math.sin(2 * Math.PI * 9 * u), gain: env.attackDecay(0.3, 0.1), short: true });
    s.pulse(0.02, 0.5, { freq: (u) => 220 + 500 * u, gain: env.swell(0.2), duty: 0.25 });
    for (let i = 0; i < 4; i++) s.paralyze(0.1 + i * 0.12, 0.12);
    s.drain(0.85, 0.2);
    return s;
  },

  /** Generic projectile (0.43 s), no fleck: a crackling wave of electricity races out and jolts the target with a buzzing zap. */
  shockwave: () => {
    const s = new MoveSfx(0.85, 0x5c0e);
    s.noise(0.0, 0.43, { clock: (u) => 5000 + 3000 * Math.sin(2 * Math.PI * 7 * u), gain: env.ramp(0.12, 0.25), short: true });
    s.pulse(0.0, 0.43, { freq: (u) => 700 + 600 * u, gain: env.swell(0.1), duty: 0.25 });
    s.noise(0.43, 0.25, { clock: () => 8000, gain: env.attackDecay(0.4, 0.05), short: true });
    s.pulse(0.43, 0.2, { freq: (u) => 1800 - 1200 * u, gain: env.decay(0.2, 1.5), duty: 0.25 });
    s.thud(0.43, 0.4, 0.3);
    return s;
  },

  /** Generic melee (impact 0.17 s) + paralysis fleck (~0.6 s): a sparking body tackle. */
  spark: () => {
    const s = new MoveSfx(0.95, 0x5ba4);
    s.noise(0.0, 0.17, { clock: () => 6000, gain: env.ramp(0.08, 0.25), short: true });
    s.thud(0.17, 0.4, 0.4);
    s.noise(0.17, 0.45, { clock: () => 8000, gain: env.decay(0.28, 1), short: true });
    s.sparkle(0.25, 0.35, 5, { lo: 3000, hi: 6000, gain: 0.15 });
    s.pulse(0.17, 0.15, { freq: (u) => 2000 - 1200 * u, gain: env.decay(0.18, 1), duty: 0.25 });
    s.paralyze(0.6, 0.22);
    return s;
  },

  /** Generic melee bite (impact 0.17 s) + paralysis fleck (~0.5 s): sparking fangs snap shut with a crackle. */
  thunderfang: () => {
    const s = new MoveSfx(0.95, 0x7f4a);
    s.noise(0.0, 0.17, { clock: env.ramp(3000, 8000), gain: env.ramp(0.06, 0.2), short: true });
    s.noise(0.17, 0.05, { clock: () => 14000, gain: env.decay(0.3, 1) });
    s.noise(0.23, 0.05, { clock: () => 11000, gain: env.decay(0.24, 1) });
    s.thud(0.17, 0.38, 0.35);
    s.pulse(0.17, 0.18, { freq: (u) => 1900 - 1300 * u, gain: env.decay(0.2, 1.5), duty: 0.25 });
    s.paralyze(0.5);
    return s;
  },

  /**
   * FxEffects.playElementalPunch: the fist zooms in (0-0.15 s) and slams the
   * target, then 16 spark bolts burst out and fade (0.15-~1.3 s). Electric
   * punch: whoosh, hard hit with a crack, a crackling spark cloud dying off.
   */
  thunderpunch: () => {
    const s = new MoveSfx(1.35, 0x7f9c);
    s.whoosh(0.0, 0.15, { from: 2500, to: 9000, gain: 0.3 });
    s.thud(0.15, 0.7, 0.7);
    s.noise(0.15, 0.2, { clock: (u) => 20000 - 12000 * u, gain: env.attackDecay(0.45, 0.02) });
    s.noise(0.17, 1.0, { clock: () => 6500, gain: (u) => 0.22 * Math.min(1, u * 10) * Math.pow(1 - u, 1.4), short: true });
    for (let i = 0; i < 10; i++) {
      const at = 0.2 + i * 0.09 + s.random() * 0.03;
      s.pulse(at, 0.04, { freq: (u) => (1800 + s.random() * 1800) * (1 - 0.4 * u), gain: env.decay(0.2 - i * 0.012, 1), duty: 0.125 });
    }
    return s;
  },

  /** Generic projectile (impact 0.43 s) + paralysis fleck (~0.55 s): a small buzzing jolt flies over and zaps. */
  thundershock: () => {
    const s = new MoveSfx(0.95, 0x75c0);
    s.noise(0.0, 0.43, { clock: () => 5500, gain: (u) => 0.16 * (0.6 + 0.4 * Math.sin(2 * Math.PI * 12 * u)), short: true });
    s.pulse(0.0, 0.43, { freq: (u) => 900 + 400 * u, gain: env.ramp(0.05, 0.12), duty: 0.125 });
    s.noise(0.43, 0.14, { clock: (u) => 18000 - 10000 * u, gain: env.attackDecay(0.5, 0.03) });
    s.pulse(0.43, 0.16, { freq: (u) => 1800 - 1200 * u, gain: env.decay(0.3, 2), duty: 0.25 });
    s.paralyze(0.6, 0.22);
    return s;
  },

  /**
   * ElectricMoveAnimations.playThunderWave: the scene darkens (0-0.3 s),
   * seven electric arcs whirl in round the target (0.3-1.62 s), then the
   * target turns yellow while 14 little bolts crackle (1.66-2.5 s, a shake
   * every 4th), the tint and dark fade (to ~3.0 s). A low hum, a tightening
   * spiral of buzzing zaps, then a crackling paralysis.
   */
  thunderwave: () => {
    const s = new MoveSfx(3.1, 0x7e3a);
    s.pulse(0.0, 0.32, { freq: env.ramp(60, 80), gain: env.ramp(0.02, 0.12), duty: 0.5 });
    // Whirlpool of arcs: a buzz that winds up in pitch and speed.
    s.noise(0.3, 1.32, { clock: env.ramp(3000, 8000), gain: (u) => 0.2 * Math.min(1, u * 4) * (0.6 + 0.4 * Math.sin(2 * Math.PI * (4 + 10 * u) * u)), short: true });
    s.pulse(0.3, 1.32, { freq: (u) => 200 * Math.pow(4, u) * (1 + 0.04 * Math.sin(2 * Math.PI * 30 * u)), gain: (u) => 0.12 * Math.min(1, u * 3), duty: 0.25 });
    for (let i = 0; i < 7; i++) s.pulse(0.3 + i * 0.07, 0.08, { freq: env.ramp(1400, 900), gain: env.decay(0.14, 1), duty: 0.125 });
    // Paralysed: the hold zap, then 14 bolts crackling.
    s.noise(1.62, 0.12, { clock: (u) => 18000 - 9000 * u, gain: env.attackDecay(0.45, 0.03) });
    for (let i = 0; i < 14; i++) {
      const at = 1.66 + i * 0.065;
      const g = i % 4 === 0 ? 0.38 : 0.24;
      s.noise(at, 0.04, { clock: () => 7000 + s.random() * 3000, gain: env.decay(g, 1), short: true });
      s.pulse(at, 0.045, { freq: (u) => (1500 + s.random() * 900) * (1 - 0.4 * u), gain: env.decay(g * 0.6, 1), duty: 0.25 });
    }
    s.noise(1.62, 1.1, { clock: () => 5000, gain: (u) => 0.1 * Math.min(1, u * 8) * Math.pow(1 - u, 1.2), short: true });
    s.pulse(2.6, 0.4, { freq: env.ramp(80, 55), gain: env.decay(0.08, 1.5), duty: 0.5 });
    return s;
  },

  /** Generic projectile (impact 0.43 s): a crackling electric bolt zaps in, then the user whisks away. */
  voltswitch: () => {
    const s = new MoveSfx(0.9, 0x7051);
    s.noise(0.0, 0.43, { clock: () => 6000, gain: env.ramp(0.08, 0.22), short: true });
    s.pulse(0.0, 0.43, { freq: (u) => 900 + 900 * u, gain: env.ramp(0.05, 0.15), duty: 0.25 });
    s.noise(0.43, 0.15, { clock: (u) => 18000 - 12000 * u, gain: env.attackDecay(0.55, 0.03) });
    s.pulse(0.43, 0.2, { freq: (u) => 1800 - 1400 * u, gain: env.decay(0.35, 2), duty: 0.25 });
    s.whoosh(0.55, 0.28, { from: 7000, to: 2000, gain: 0.15 });
    return s;
  },

  /** Generic melee at high power (impact 0.17 s) + recoil (0.29 s) + paralysis fleck (~0.6 s): an electrified full-body charge. */
  volttackle: () => {
    const s = new MoveSfx(1.0, 0x701a);
    s.noise(0.0, 0.17, { clock: env.ramp(3000, 9000), gain: env.ramp(0.1, 0.4), short: true });
    s.thud(0.17, 0.75, 0.85);
    s.noise(0.17, 0.22, { clock: (u) => 20000 - 14000 * u, gain: env.attackDecay(0.45, 0.02) });
    s.pulse(0.17, 0.28, { freq: (u) => 1600 - 1300 * u, gain: env.decay(0.35, 2), duty: 0.25 });
    s.thud(0.29, 0.3, 0.3);
    s.noise(0.3, 0.35, { clock: () => 6000, gain: env.decay(0.18, 1.5), short: true });
    s.paralyze(0.6);
    return s;
  },

  /** Generic melee (impact 0.17 s) + recoil (~0.29 s): a crackling charge slams in, the user takes a jolt back. */
  wildcharge: () => {
    const s = new MoveSfx(0.95, 0x3e61);
    s.noise(0.0, 0.17, { clock: env.ramp(3000, 9000), gain: env.ramp(0.1, 0.35), short: true });
    s.thud(0.17, 0.75, 0.8);
    s.noise(0.17, 0.22, { clock: (u) => 20000 - 14000 * u, gain: env.attackDecay(0.45, 0.02) });
    s.pulse(0.17, 0.25, { freq: (u) => 1600 - 1200 * u, gain: env.decay(0.3, 2), duty: 0.25 });
    s.noise(0.3, 0.35, { clock: () => 6000, gain: env.decay(0.2, 1.5), short: true });
    s.thud(0.29, 0.3, 0.3);
    return s;
  },

  /** Generic beam (grows 0.26 s, holds 0.33 s, fades to 0.79 s) + paralysis fleck (~0.82 s): a booming electric cannon shot. */
  zapcannon: () => {
    const s = new MoveSfx(1.3, 0x3e62);
    s.pulse(0.0, 0.26, { freq: env.ramp(150, 700), gain: env.ramp(0.08, 0.3), duty: 0.25 });
    s.thud(0.26, 0.55, 0.9);
    s.noise(0.26, 0.53, { clock: (u) => 7000 + 2000 * Math.sin(2 * Math.PI * 8 * u), gain: (u) => 0.32 * Math.min(1, (1 - u) * 2.5), short: true });
    s.pulse(0.26, 0.53, { freq: (u) => 110 * (1 + 0.06 * Math.sin(2 * Math.PI * 25 * u)), gain: (u) => 0.22 * (1 - u), duty: 0.5 });
    s.paralyze(0.82);
    return s;
  },
};
