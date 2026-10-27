import { MoveSfx } from '../move-sfx.mjs';
import { env } from '../track.mjs';

/**
 * Flying-type move sounds: wind and blades. Generic melee: lunge 0-0.17 s,
 * impact at 0.17 s. Generic projectile: travels 0.43 s to the target.
 */
export const FLYING = {
  /** Generic melee: acrobatic flips on the way in, then a light hit. */
  acrobatics: () => {
    const s = new MoveSfx(0.75, 0xac70);
    s.whoosh(0.0, 0.12, { from: 2000, to: 7000, gain: 0.35 });
    s.whoosh(0.08, 0.12, { from: 2500, to: 9000, gain: 0.35 });
    s.thud(0.17, 0.5, 0.3);
    s.whoosh(0.3, 0.35, { from: 6000, to: 1500, gain: 0.2 });
    return s;
  },

  /** Generic melee: a very fast swoop that ends in a clean cut. */
  aerialace: () => {
    const s = new MoveSfx(0.65, 0xae1a);
    s.whoosh(0.0, 0.18, { from: 2000, to: 12000, gain: 0.45 });
    s.slash(0.17, 0.6);
    s.pulse(0.19, 0.25, { freq: () => 3100, gain: env.decay(0.12, 2), duty: 0.5 });
    return s;
  },

  /** Generic projectile (0.43 s): a roaring blast of air. */
  aeroblast: () => {
    const s = new MoveSfx(1.25, 0xae2b);
    s.whoosh(0.0, 0.48, { from: 800, to: 9000, gain: 0.5 });
    s.pulse(0.0, 0.45, { freq: env.ramp(80, 130), gain: env.ramp(0.05, 0.25), duty: 0.25 });
    s.noise(0.43, 0.3, { clock: (u) => 14000 - 9000 * u, gain: env.attackDecay(0.6, 0.03) });
    s.thud(0.43, 0.6, 0.8);
    s.noise(0.5, 0.7, { clock: env.ramp(6000, 1500), gain: env.decay(0.25, 1.5) });
    return s;
  },

  /** Generic field move (0.62 s waves) hitting both foes: two crossing gusts. */
  aircutter: () => {
    const s = new MoveSfx(0.85, 0xa1c7);
    s.whoosh(0.0, 0.35, { from: 2000, to: 9000, gain: 0.35 });
    s.slash(0.1, 0.5);
    s.slash(0.25, 0.45);
    s.whoosh(0.3, 0.5, { from: 6000, to: 1500, gain: 0.22 });
    return s;
  },

  /** Generic projectile (0.43 s) + flinch fleck: a spinning blade of air. */
  airslash: () => {
    const s = new MoveSfx(0.85, 0xa15a);
    s.pulse(0.0, 0.43, {
      freq: env.ramp(1800, 3200),
      gain: (u) => 0.12 * (0.5 + 0.5 * Math.sin(2 * Math.PI * 14 * u)),
      duty: 0.125,
    });
    s.whoosh(0.0, 0.45, { from: 3000, to: 10000, gain: 0.3 });
    s.slash(0.43, 0.6);
    s.flinch(0.6);
    return s;
  },

  /**
   * Two-turn move (plays on both turns): springs high up, drops back down
   * and lands on the target, then a paralysis fleck.
   */
  bounce: () => {
    const s = new MoveSfx(1.15, 0xb0c3);
    s.pulse(0.02, 0.3, { freq: (u) => (200 + 700 * u) * (1 + 0.08 * Math.sin(2 * Math.PI * 9 * u)), gain: env.decay(0.3, 0.8), duty: 0.5 });
    s.whoosh(0.05, 0.3, { from: 1500, to: 6000, gain: 0.2 });
    s.pulse(0.38, 0.28, { freq: (u) => 1400 - 900 * u, gain: env.ramp(0.05, 0.15), duty: 0.125 });
    s.thud(0.65, 0.65, 0.7);
    s.paralyze(0.85, 0.15);
    return s;
  },

  /** Generic melee at high power + recoil: a shrieking dive bomb that hurts the user too. */
  bravebird: () => {
    const s = new MoveSfx(0.9, 0xb2b1);
    s.pulse(0.0, 0.18, { freq: env.ramp(1200, 2600), gain: env.ramp(0.08, 0.22), duty: 0.125 });
    s.whoosh(0.0, 0.18, { from: 2000, to: 10000, gain: 0.4 });
    s.thud(0.17, 0.85, 1);
    s.noise(0.17, 0.2, { clock: (u) => 12000 - 8000 * u, gain: env.attackDecay(0.5, 0.03) });
    s.thud(0.5, 0.3, 0.4);
    return s;
  },

  /** Generic sonic (rings every 0.11 s, impact 0.43 s) + confusion fleck: noisy bird chatter. */
  chatter: () => {
    const s = new MoveSfx(1.2, 0xc4a7);
    for (let i = 0; i < 12; i++) {
      const at = i * 0.04 + s.random() * 0.02;
      const f = 1500 + s.random() * 1500;
      const up = s.random() < 0.5;
      s.pulse(at, 0.05, { freq: (u) => f * (up ? 1 + 0.6 * u : 1.4 - 0.5 * u), gain: env.decay(0.22, 1), duty: 0.25 });
    }
    s.thud(0.43, 0.35, 0.2);
    s.confusion(0.6);
    return s;
  },

  /** Generic target aura: a strong gust blows the fog away. */
  defog: () => {
    const s = new MoveSfx(1.0, 0xdef9);
    s.noise(0.02, 0.85, { clock: (u) => 1800 + 4500 * Math.sin(Math.PI * u), gain: env.swell(0.45) });
    s.wave(0.1, 0.6, { freq: (u) => 500 + 250 * Math.sin(Math.PI * u), gain: env.swell(0.08) });
    return s;
  },

  /** Generic melee at high power: a roaring climb and a crushing dive. */
  dragonascent: () => {
    const s = new MoveSfx(0.95, 0xd2a5);
    s.whoosh(0.0, 0.18, { from: 1500, to: 11000, gain: 0.45 });
    s.pulse(0.0, 0.17, { freq: env.ramp(200, 700), gain: env.ramp(0.05, 0.22), duty: 0.25 });
    s.thud(0.17, 0.9, 1);
    s.noise(0.2, 0.6, { clock: env.ramp(6000, 1200), gain: env.decay(0.3, 1.5) });
    return s;
  },

  /** FlyingMoveAnimations.playDrillPeck: steps in (0.2 s), nine pecks every 75 ms, steps back (~1.25 s). */
  drillpeck: () => {
    const s = new MoveSfx(1.3, 0xd21b);
    s.pulse(0.2, 0.7, { freq: (u) => 900 * (1 + 0.05 * Math.sin(2 * Math.PI * 30 * u)), gain: env.swell(0.1), duty: 0.125 });
    for (let i = 0; i < 9; i++) {
      const at = 0.2 + i * 0.075;
      s.noise(at, 0.03, { clock: () => 12000, gain: env.decay(0.35, 1) });
      s.thud(at, 0.25, 0.1);
    }
    s.whoosh(1.0, 0.25, { from: 4000, to: 1500, gain: 0.15 });
    return s;
  },

  /** Generic self aura (~0.8 s) + Attack drop fleck (0.85 s): a flurry of fluttering down feathers. */
  featherdance: () => {
    const s = new MoveSfx(1.5, 0xfeda);
    for (let i = 0; i < 6; i++) {
      const at = 0.02 + i * 0.12;
      s.noise(at, 0.14, { clock: () => 3000 + s.random() * 2000, gain: env.swell(0.2) });
      s.wave(at, 0.12, { freq: env.ramp(1200 - i * 60, 900 - i * 60), gain: env.swell(0.12) });
    }
    s.whoosh(0.0, 0.8, { from: 4000, to: 1500, gain: 0.12 });
    s.statDown(0.85);
    return s;
  },

  /**
   * Two-turn move, plays on both turns. FlyingMoveAnimations.playFlyUp (turn 1):
   * sky backdrop fades in (0-0.25 s), the user is wrapped in a bubble (to 0.57 s)
   * that shoots upward (0.72-1.27 s). playFlyDown (turn 2): sky fades in, a white
   * orb dives onto the target (0.4-0.72 s, hit with sparks), the sky clears.
   * A rushing wind with a swooping gust that lands as a soft airy whump.
   */
  fly: () => {
    const s = new MoveSfx(1.55, 0xf1f1);
    s.noise(0.0, 1.5, { clock: (u) => 3000 + 2500 * Math.sin(Math.PI * u), gain: env.swell(0.16) });
    s.pulse(0.3, 0.42, { freq: (u) => 600 + 900 * u * u, gain: env.ramp(0.04, 0.16), duty: 0.125 });
    s.whoosh(0.45, 0.28, { from: 2000, to: 9000, gain: 0.3 });
    s.thud(0.72, 0.55, 0.5);
    s.sparkle(0.75, 0.35, 5, { lo: 2600, hi: 4200, gain: 0.12 });
    s.whoosh(0.8, 0.55, { from: 8000, to: 2000, gain: 0.18 });
    return s;
  },

  /** Generic projectile (impact 0.43 s): a gust of wind is whipped up and buffets the foe. */
  gust: () => {
    const s = new MoveSfx(0.85, 0x6057);
    s.whoosh(0.0, 0.45, { from: 900, to: 3800, gain: 0.32 });
    s.whoosh(0.15, 0.3, { from: 1500, to: 5000, gain: 0.18 });
    s.noise(0.43, 0.3, { clock: (u) => 4000 - 2500 * u, gain: env.attackDecay(0.3, 0.05) });
    s.thud(0.44, 0.3, 0.2);
    return s;
  },

  /** Generic projectile (0.43 s) + confusion fleck (0.55 s): a howling vortex of wind slams the target. */
  hurricane: () => {
    const s = new MoveSfx(1.15, 0x4cc4);
    s.noise(0.0, 0.5, { clock: (u) => 2000 + 3000 * u + 1200 * Math.sin(2 * Math.PI * 6 * u), gain: env.ramp(0.12, 0.35) });
    s.wave(0.0, 0.5, { freq: (u) => 500 + 400 * u + 120 * Math.sin(2 * Math.PI * 6 * u), gain: env.ramp(0.05, 0.16) });
    s.noise(0.43, 0.35, { clock: env.ramp(7000, 1500), gain: env.attackDecay(0.35, 0.05) });
    s.thud(0.43, 0.35, 0.4);
    s.confusion(0.55);
    return s;
  },

  /**
   * Generic target aura (~0.8 s); no original sound exists (silent in game), designed from the
   * animation: the move's echo is caught and reflected back - a fluttering airy sweep and a mirrored phrase.
   */
  mirrormove: () => {
    const s = new MoveSfx(1.1, 0x3133);
    s.whoosh(0.02, 0.4, { from: 2000, to: 6000, gain: 0.2 });
    s.arpeggio(0.05, [79, 83, 86], 0.08, { gain: 0.24, duty: 0.25, hold: 0.1 });
    s.whoosh(0.42, 0.4, { from: 6000, to: 2000, gain: 0.18 });
    s.arpeggio(0.45, [86, 83, 79], 0.08, { gain: 0.22, voice: 'wave', hold: 0.15 });
    s.pulse(0.7, 0.25, { freq: () => 1976, gain: env.decay(0.12, 2), duty: 0.5 });
    return s;
  },

  /** Generic projectile (0.43 s) + drain (~0.75 s): a rushing crimson wing-beam slices in, then life flows back. */
  oblivionwing: () => {
    const s = new MoveSfx(1.3, 0x0b17);
    s.whoosh(0.0, 0.45, { from: 1500, to: 9000, gain: 0.4 });
    s.pulse(0.0, 0.45, { freq: env.ramp(400, 1200), gain: env.ramp(0.05, 0.16), duty: 0.125 });
    s.noise(0.43, 0.25, { clock: (u) => 12000 - 8000 * u, gain: env.attackDecay(0.5, 0.03) });
    s.thud(0.43, 0.45, 0.5);
    s.drain(0.75);
    return s;
  },

  /** Generic melee (0.17 s impact): a sharp little beak jab. */
  peck: () => {
    const s = new MoveSfx(0.55, 0xbec4);
    s.whoosh(0.0, 0.15, { from: 2500, to: 8000, gain: 0.2 });
    s.pulse(0.17, 0.05, { freq: (u) => 2200 - 1000 * u, gain: env.decay(0.35, 1.5), duty: 0.25 });
    s.thud(0.17, 0.45, 0.2);
    return s;
  },

  /** Generic melee (0.17 s impact): two quick pecks, then a gulp as the berry is swallowed. */
  pluck: () => {
    const s = new MoveSfx(0.85, 0x91c4);
    s.whoosh(0.0, 0.14, { from: 2500, to: 8000, gain: 0.2 });
    s.thud(0.17, 0.5, 0.3);
    s.pulse(0.17, 0.05, { freq: (u) => 2000 - 900 * u, gain: env.decay(0.3, 1.5), duty: 0.25 });
    s.pulse(0.28, 0.05, { freq: (u) => 2200 - 900 * u, gain: env.decay(0.25, 1.5), duty: 0.25 });
    s.pulse(0.45, 0.14, { freq: (u) => 500 * Math.pow(0.45, u), gain: env.decay(0.3, 1), duty: 0.5 });
    s.arpeggio(0.6, [79, 84], 0.06, { gain: 0.15, duty: 0.25, hold: 0.08 });
    return s;
  },

  /** Generic self aura (~0.8 s): the user lands and rests – soft wing flaps settling into a gentle healing chime. */
  roost: () => {
    const s = new MoveSfx(1.4, 0x9005);
    for (let i = 0; i < 3; i++) s.whoosh(i * 0.18, 0.16, { from: 1500, to: 4000, gain: 0.25 - i * 0.05 });
    s.thud(0.55, 0.2, 0.2);
    s.arpeggio(0.6, [72, 76, 79, 84], 0.08, { gain: 0.2, voice: 'wave', hold: 0.2 });
    s.sparkle(0.7, 0.5, 6, { lo: 2500, hi: 4500, gain: 0.12 });
    return s;
  },

  /**
   * CHARGE, played on both turns. Turn 1 (playSkyAttackCharge): dark 0.3 s, blue lights twinkle to ~1.75 s, white glow
   * to ~2.2 s. Turn 2 (playSkyAttack): sky 0.25 s, light cloud flies 0.5-0.97 s, black-out burst on the target ~0.97-1.75 s.
   * Sound: rising airy twinkles, a rushing dive and a bright, booming blue burst.
   */
  skyattack: () => {
    const s = new MoveSfx(2.0, 0x5ca7);
    s.noise(0.0, 0.5, { clock: env.ramp(1000, 3000), gain: env.swell(0.15) });
    s.sparkle(0.25, 0.75, 9, { lo: 2500, hi: 5000, gain: 0.14 });
    s.wave(0.25, 0.7, { freq: env.ramp(500, 1000), gain: env.swell(0.12) });
    s.whoosh(0.5, 0.47, { from: 2000, to: 11000, gain: 0.4 });
    s.thud(0.97, 0.75, 0.9);
    s.noise(0.97, 0.5, { clock: env.ramp(7000, 1000), gain: env.attackDecay(0.35, 0.05) });
    s.sparkle(1.0, 0.6, 8, { lo: 3500, hi: 6500, gain: 0.14 });
    s.wave(1.0, 0.7, { freq: () => 1318, gain: env.decay(0.12, 1.5) });
    return s;
  },

  /**
   * CHARGE (semi-invulnerable), played on both turns: turn 1 the user (with its foe) soars out of sight (0.4 s);
   * turn 2 drops back in (0.26 s), then a generic beam (grows to 0.52 s, holds to ~0.75 s, fades ~0.94 s).
   * Sound: a gust that lifts off, then a plunging dive whistle and a heavy drop impact.
   */
  skydrop: () => {
    const s = new MoveSfx(1.25, 0x5d70);
    s.whoosh(0.0, 0.4, { from: 1500, to: 7000, gain: 0.35 });
    s.pulse(0.26, 0.46, { freq: env.ramp(1600, 400), gain: env.swell(0.14), duty: 0.25 });
    s.noise(0.3, 0.42, { clock: env.ramp(8000, 2000), gain: env.ramp(0.12, 0.3) });
    s.thud(0.72, 0.8, 1);
    s.rumble(0.72, 0.4, { from: 500, to: 150, gain: 0.3 });
    return s;
  },

  /** Generic self aura (~0.8 s, no fleck): a strong following breeze sweeps over the team - rising and falling gusts. */
  tailwind: () => {
    const s = new MoveSfx(1.15, 0x7a17);
    s.noise(0.0, 1.05, { clock: (u) => 2500 + 3500 * Math.sin(Math.PI * u) + 800 * Math.sin(2 * Math.PI * 4 * u), gain: env.swell(0.4) });
    s.whoosh(0.15, 0.35, { from: 3000, to: 9000, gain: 0.2 });
    s.whoosh(0.5, 0.4, { from: 9000, to: 3500, gain: 0.18 });
    s.wave(0.05, 0.9, { freq: (u) => 700 + 250 * Math.sin(2 * Math.PI * 1.5 * u), gain: env.swell(0.08) });
    return s;
  },

  /** Generic melee, slash (impact 0.17 s): wings beat in and strike. */
  wingattack: () => {
    const s = new MoveSfx(0.65, 0x3f17);
    s.whoosh(0.0, 0.08, { from: 1200, to: 4000, gain: 0.3 });
    s.whoosh(0.08, 0.09, { from: 1500, to: 6000, gain: 0.35 });
    s.slash(0.17, 0.55);
    s.thud(0.17, 0.35, 0.3);
    return s;
  },
};
