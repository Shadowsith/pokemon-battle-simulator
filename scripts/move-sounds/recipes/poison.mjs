import { MoveSfx } from '../move-sfx.mjs';
import { env } from '../track.mjs';

/** Poison-type move sounds: gloopy, bubbling, sizzling. */
export const POISON = {
  /** PoisonMoveAnimations.playAcidSpit: 7 droplets spat every 75 ms, each landing 0.44 s later, then a short hold. */
  acid: () => {
    const s = new MoveSfx(1.35, 0xac1d);
    for (let i = 0; i < 7; i++) {
      const at = 0.02 + i * 0.075;
      s.pulse(at, 0.06, { freq: (u) => 500 + 700 * u, gain: env.decay(0.2, 1), duty: 0.25 });
      const land = at + 0.44;
      s.noise(land, 0.1, { clock: (u) => 5000 - 3000 * u, gain: env.attackDecay(0.35, 0.05) });
      s.pulse(land, 0.08, { freq: (u) => 320 * Math.pow(0.5, u), gain: env.decay(0.25, 2), duty: 0.5 });
    }
    // The acid sizzles on the target.
    s.noise(0.5, 0.8, { clock: () => 11000, gain: env.attackDecay(0.16, 0.2) });
    return s;
  },

  /**
   * PoisonMoveAnimations.playAcidArmor: the user melts into a puddle (0-0.5 s), acid drops
   * bubble up (0.3-1.0 s), it re-forms (0.95-1.3 s), stat-up aura (1.3-2.1 s).
   * A gloopy downward slide, bubbling, a slurp back up, then the stat-up jingle.
   */
  acidarmor: () => {
    const s = new MoveSfx(2.4, 0xac1a);
    s.wave(0.0, 0.5, { freq: (u) => 320 * Math.pow(0.4, u) * (1 + 0.08 * Math.sin(2 * Math.PI * 6 * u)), gain: env.attackDecay(0.32, 0.3) });
    s.bubbles(0.3, 0.7, 9, { lo: 160, hi: 420, gain: 0.25 });
    s.wave(0.95, 0.35, { freq: (u) => 140 * Math.pow(2.4, u), gain: env.swell(0.26) });
    s.statUp(1.3);
    return s;
  },

  /** Generic lob (0.52 s arc) + Sp. Def drop fleck. */
  acidspray: () => {
    const s = new MoveSfx(1.3, 0xac5b);
    s.pulse(0.02, 0.06, { freq: (u) => 500 + 700 * u, gain: env.decay(0.25, 1), duty: 0.25 });
    s.pulse(0.03, 0.5, { freq: (u) => 1400 - 900 * u, gain: (u) => 0.12 * (1 - 0.5 * u), duty: 0.125 });
    s.splash(0.54, 0.5);
    s.noise(0.6, 0.5, { clock: () => 11000, gain: env.attackDecay(0.14, 0.2) });
    s.statDown(0.7);
    return s;
  },

  /**
   * Custom (2.4 s): a mighty gassy burp (0-0.6 s) as the rings leave, a
   * wobbling hum while they travel and close in on the target (0.4-1.6 s),
   * then the pink gas bursts round it (1.5 s) with bubbling pops.
   */
  belch: () => {
    const s = new MoveSfx(2.5, 0xbe1c);
    s.pulse(0.05, 0.55, {
      freq: (u) => (95 - 25 * u) * (1 + 0.08 * Math.sin(2 * Math.PI * 22 * u)),
      gain: (u) => 0.4 * Math.min(1, u * 10) * Math.pow(1 - u, 0.6),
      duty: 0.25,
    });
    s.noise(0.05, 0.55, { clock: (u) => 700 - 200 * u, gain: (u) => 0.25 * Math.min(1, u * 10) * Math.pow(1 - u, 0.6) });
    s.wave(0.4, 1.2, { freq: (u) => 220 * (1 + 0.06 * Math.sin(2 * Math.PI * 9 * u)), gain: (u) => 0.12 * Math.sin(Math.PI * u) });
    s.thud(1.0, 0.25, 0.3);
    s.noise(1.5, 0.5, { clock: env.ramp(3000, 800), gain: env.attackDecay(0.32, 0.1) });
    s.bubbles(1.55, 0.6, 7, { lo: 200, hi: 450, gain: 0.15 });
    return s;
  },

  /** Generic projectile (0.43 s): a puff of smog that wipes stat changes clean. */
  clearsmog: () => {
    const s = new MoveSfx(1.1, 0xc15a);
    s.noise(0.0, 0.45, { clock: env.ramp(600, 1600), gain: env.swell(0.35) });
    s.noise(0.43, 0.35, { clock: env.ramp(2500, 700), gain: env.attackDecay(0.35, 0.1) });
    s.arpeggio(0.6, [79, 72], 0.1, { gain: 0.2, voice: 'wave', hold: 0.18 });
    return s;
  },

  /** Custom (rings rise 0-0.7 s, cyan coil 0.6-1.1 s, orange stat-up sparkles 1.0-2.2 s): a winding hiss, a shimmer, the stat-up jingle. */
  coil: () => {
    const s = new MoveSfx(2.3, 0xc011);
    s.noise(0.02, 0.65, { clock: () => 14000, gain: env.swell(0.2) });
    for (const at of [0.05, 0.3]) s.pulse(at, 0.25, { freq: (u) => 300 * Math.pow(2.5, u), gain: env.swell(0.16), duty: 0.125 });
    s.chord(0.6, 0.5, [74, 78, 81], { rate: 0.03, gain: 0.12, voice: 'wave' });
    s.statUp(1.05);
    return s;
  },

  /** Custom (1.15 s): two blades slash an X (0.05 / 0.15 s), poison bursts at 0.3 s and bubbles scatter. */
  crosspoison: () => {
    const s = new MoveSfx(1.25, 0xc25b);
    s.slash(0.05, 0.45);
    s.slash(0.15, 0.5);
    s.thud(0.3, 0.45, 0.4);
    s.bubbles(0.3, 0.6, 6, { lo: 180, hi: 400, gain: 0.15 });
    s.poison(0.35);
    return s;
  },

  /** Generic target aura (~0.8 s), no fleck: sticky acid coats the foe with a fizzing gurgle. */
  gastroacid: () => {
    const s = new MoveSfx(1.25, 0x6a5a);
    s.noise(0.02, 0.85, { clock: () => 2600, gain: env.swell(0.12) });
    s.pulse(0.02, 0.8, { freq: (u) => (260 - 80 * u) * (1 + 0.08 * Math.sin(2 * Math.PI * 11 * u)), gain: env.swell(0.2), duty: 0.25 });
    s.bubbles(0.05, 0.8, 9, { lo: 160, hi: 380, gain: 0.22 });
    return s;
  },

  /** Custom (purple rush 0-0.3 s, glob swells 0.3-0.7 s, hurled 0.7-1.05 s, splats into bubbles 1.05 s, bubbles drift to ~1.8 s): a gurgling build, a heavy throw, a filthy splat. */
  gunkshot: () => {
    const s = new MoveSfx(2.25, 0x6c57);
    s.whoosh(0.0, 0.3, { from: 1200, to: 4000, gain: 0.18 });
    s.pulse(0.3, 0.4, { freq: (u) => (160 + 140 * u) * (1 + 0.08 * Math.sin(2 * Math.PI * 11 * u)), gain: env.swell(0.2), duty: 0.5 });
    s.bubbles(0.32, 0.36, 5, { lo: 180, hi: 360, gain: 0.2 });
    s.pulse(0.7, 0.35, { freq: (u) => (420 - 200 * u) * (1 + 0.05 * Math.sin(2 * Math.PI * 7 * u)), gain: (u) => 0.1 * (1 - 0.5 * u), duty: 0.25 });
    s.thud(1.05, 0.6, 0.8);
    s.noise(1.05, 0.35, { clock: (u) => 3000 - 2200 * u, gain: env.attackDecay(0.4, 0.05) });
    s.bubbles(1.1, 0.65, 10, { lo: 300, hi: 800, gain: 0.2 });
    return s;
  },

  /** Generic melee, bite style (0.17 s impact) + poison fleck: venomous fangs sink in. */
  poisonfang: () => {
    const s = new MoveSfx(1.15, 0xf4f9);
    s.whoosh(0.0, 0.15, { from: 2000, to: 7000, gain: 0.2 });
    s.pulse(0.17, 0.05, { freq: (u) => 1800 - 800 * u, gain: env.decay(0.3, 1.5), duty: 0.25 });
    s.thud(0.17, 0.45, 0.3);
    s.pulse(0.24, 0.05, { freq: (u) => 1600 - 800 * u, gain: env.decay(0.3, 1.5), duty: 0.25 });
    s.thud(0.24, 0.35, 0.25);
    s.poison(0.6);
    return s;
  },

  /** PoisonGas.play (gas streams over 0-0.6 s, cloud wraps the target 0.6-1.2 s, bubbles rise 1.0-1.5 s): a hissing jet of toxic gas, a muffled poof and a bubbling fizz. */
  poisongas: () => {
    const s = new MoveSfx(1.65, 0xf9a5);
    s.noise(0.0, 0.6, { clock: (u) => 1200 + 1200 * u, gain: env.swell(0.3) });
    s.noise(0.05, 0.55, { clock: () => 12000, gain: env.swell(0.1) });
    s.noise(0.6, 0.6, { clock: (u) => 1800 - 1000 * u, gain: env.attackDecay(0.28, 0.1) });
    s.bubbles(1.0, 0.5, 5, { lo: 150, hi: 300, gain: 0.15 });
    return s;
  },

  /** Custom (three pink jabs land at 0.15 / 0.35 / 0.55 s, purple tint 0.35-1.1 s): three stabbing toxic jabs with a bubbling sting. */
  poisonjab: () => {
    const s = new MoveSfx(1.25, 0xf41a);
    for (const at of [0.15, 0.35, 0.55]) {
      s.whoosh(at - 0.1, 0.1, { from: 2000, to: 8000, gain: 0.2 });
      s.thud(at, 0.45, 0.4);
      s.noise(at + 0.02, 0.15, { clock: () => 9000, gain: env.decay(0.12, 1.5) });
    }
    s.bubbles(0.4, 0.6, 7, { lo: 200, hi: 420, gain: 0.16 });
    s.wave(0.4, 0.6, { freq: (u) => 300 * (1 + 0.15 * Math.sin(2 * Math.PI * 6 * u)), gain: env.swell(0.1) });
    return s;
  },

  /** PoisonPowder.play (powder appears 0-0.25 s, sifts down 0.25-0.85 s, target purple 0.45-1.1 s, specks rise to ~1.35 s): a fizzing purple dust and a sickly wobble. */
  poisonpowder: () => {
    const s = new MoveSfx(1.55, 0xf4d0);
    s.noise(0.0, 0.9, { clock: (u) => 7000 - 2500 * u, gain: env.swell(0.24) });
    s.sparkle(0.05, 1.2, 9, { lo: 1500, hi: 3000, gain: 0.12 });
    s.poison(0.5, 0.25);
    return s;
  },

  /** PoisonMoveAnimations.playPoisonSting (barb flies 0-0.35 s, stings at 0.35 s, bubbles float up 0.35-1.1 s): a tiny barb whistles in, pricks and the poison bubbles. */
  poisonsting: () => {
    const s = new MoveSfx(1.25, 0xf457);
    s.pulse(0.02, 0.33, { freq: (u) => 1500 + 1500 * u, gain: (u) => 0.1 * (0.5 + 0.5 * u), duty: 0.125 });
    s.pulse(0.35, 0.04, { freq: () => 2800, gain: env.decay(0.3, 1.5), duty: 0.25 });
    s.thud(0.35, 0.35, 0.15);
    s.poison(0.4);
    s.bubbles(0.45, 0.6, 5, { lo: 250, hi: 500, gain: 0.12 });
    return s;
  },

  /** Generic melee (0.17 s impact) + poison fleck: a swinging tail smack with a venomous drip. */
  poisontail: () => {
    const s = new MoveSfx(1.15, 0xf47a);
    s.whoosh(0.0, 0.17, { from: 1200, to: 6000, gain: 0.3 });
    s.thud(0.17, 0.55, 0.55);
    s.bubbles(0.2, 0.15, 3, { lo: 200, hi: 400, gain: 0.15 });
    s.poison(0.6);
    return s;
  },

  /** Custom (glob lobbed 0-0.45 s, splat 0.45 s, target magenta + bubbles 0.5-1.35 s): a gloopy wobble, a wet splat, bubbling. */
  sludge: () => {
    const s = new MoveSfx(1.5, 0x51d6);
    s.pulse(0.0, 0.45, { freq: (u) => (250 + 150 * u) * (1 + 0.08 * Math.sin(2 * Math.PI * 12 * u)), gain: env.ramp(0.1, 0.22), duty: 0.25 });
    s.splash(0.45, 0.45);
    s.thud(0.45, 0.4, 0.4);
    s.bubbles(0.5, 0.85, 10, { lo: 200, hi: 450, gain: 0.18 });
    return s;
  },

  /** Custom (impact 0.52 s, purple tint 0.65 s): a heavy sludge bomb arcs over and bursts. */
  sludgebomb: () => {
    const s = new MoveSfx(1.15, 0x5b0b);
    s.pulse(0.0, 0.06, { freq: (u) => 300 + 500 * u, gain: env.decay(0.3, 1), duty: 0.5 });
    s.pulse(0.03, 0.49, { freq: (u) => 900 - 600 * u, gain: (u) => 0.1 * (1 - 0.5 * u), duty: 0.25 });
    s.thud(0.52, 0.55, 0.8);
    s.splash(0.52, 0.45);
    s.poison(0.65);
    return s;
  },

  /** Custom (user heaves 0-0.3 s, sludge wave rolls along the ground 0.3-0.9 s, hit 0.9 s, purple bubbles pop round the target 0.9-1.8 s): a wet heave, a rolling toxic tide, a splat and bubbling. */
  sludgewave: () => {
    const s = new MoveSfx(1.9, 0x5a7e);
    s.pulse(0.0, 0.3, { freq: env.ramp(150, 260), gain: env.swell(0.12), duty: 0.5 });
    s.rumble(0.3, 0.6, { from: 300, to: 500, gain: 0.3 });
    s.noise(0.3, 0.6, { clock: (u) => 2500 + 1500 * Math.sin(2 * Math.PI * 3 * u), gain: env.swell(0.25) });
    s.splash(0.9, 0.45);
    s.bubbles(0.95, 0.8, 10, { lo: 180, hi: 420, gain: 0.2 });
    return s;
  },

  /** Custom (smog cloud billows over the target 0-1.1 s, shudder 0.4 s, target darkened 0.9-1.45 s): a churning hiss of exhaust, then a low choke. */
  smog: () => {
    const s = new MoveSfx(1.6, 0x5309);
    s.noise(0.0, 1.1, { clock: (u) => 700 + 300 * Math.sin(2 * Math.PI * 3 * u), gain: env.swell(0.32) });
    s.noise(0.4, 0.2, { clock: env.ramp(1800, 600), gain: env.attackDecay(0.3, 0.1) });
    s.pulse(0.9, 0.5, { freq: env.ramp(180, 110), gain: env.decay(0.14, 1), duty: 0.25 });
    return s;
  },

  /**
   * PoisonMoveAnimations.playToxic: a purple pool spreads under the target (0-0.4 s),
   * from 0.3 s 16 bubbles well up every 60 ms while the sprite turns purple (to ~1.7 s),
   * the pool fades out by ~2.1 s. A sickly, thick gurgle that keeps bubbling.
   */
  toxic: () => {
    const s = new MoveSfx(2.2, 0x70c1);
    s.noise(0.0, 0.45, { clock: env.ramp(600, 1800), gain: env.swell(0.22) });
    s.pulse(0.02, 1.9, { freq: (u) => (150 - 40 * u) * (1 + 0.08 * Math.sin(2 * Math.PI * 14 * u)), gain: (u) => 0.18 * Math.min(1, u * 6) * Math.pow(1 - u, 1.2), duty: 0.25 });
    for (let i = 0; i < 16; i++) {
      const at = 0.3 + i * 0.06 + s.random() * 0.03;
      const f = 220 + s.random() * 260;
      s.pulse(at, 0.08, { freq: (u) => f * (1 + 1.4 * u), gain: env.decay(0.22, 1), duty: 0.5 });
    }
    s.poison(1.2, 0.22);
    return s;
  },

  /** Custom (four spikes thrown 0-0.36 s, landing 0.45-0.81 s every 0.12 s, bubbles to ~1.4 s, fade to 1.65 s): spikes whizz over and clink down, then poison bubbles gurgle. */
  toxicspikes: () => {
    const s = new MoveSfx(1.85, 0x7059);
    for (let i = 0; i < 4; i++) {
      s.whoosh(i * 0.12, 0.3, { from: 2000, to: 5000, gain: 0.12 });
      const at = 0.45 + i * 0.12;
      s.pulse(at, 0.05, { freq: () => 2400 + s.random() * 1200, gain: env.decay(0.22, 1.5), duty: 0.125 });
      s.noise(at, 0.04, { clock: () => 9000, gain: env.decay(0.15, 1), short: true });
    }
    s.bubbles(0.5, 0.9, 10, { lo: 400, hi: 1100, gain: 0.18 });
    s.pulse(0.6, 0.9, { freq: (u) => (280 - 90 * u) * (1 + 0.06 * Math.sin(2 * Math.PI * 9 * u)), gain: env.swell(0.13), duty: 0.25 });
    return s;
  },

  /**
   * Custom (2.6 s): a gloopy swell as the poison bubble grows above the
   * target (0-0.55 s), a wet burst as it drops and pops at 0.55 s, the poison
   * gurgle as bubbles fly (0.6-1.2 s), then the stat-down run (1.25 s).
   */
  venomdrench: () => {
    const s = new MoveSfx(2.6, 0x7ed1);
    s.wave(0.0, 0.55, { freq: env.ramp(200, 500), gain: env.swell(0.16) });
    s.splash(0.55, 0.4);
    s.poison(0.6, 0.22);
    s.bubbles(0.6, 0.6, 6, { lo: 200, hi: 600, gain: 0.16 });
    s.statDown(1.25);
    return s;
  },

  /** Generic projectile (impact 0.43 s): a gurgling venom ball smacks in with a corrosive hiss. */
  venoshock: () => {
    const s = new MoveSfx(0.95, 0x7e05);
    s.pulse(0.0, 0.43, { freq: (u) => (220 + 120 * u) * (1 + 0.1 * Math.sin(2 * Math.PI * 10 * u)), gain: env.ramp(0.1, 0.25), duty: 0.25 });
    s.splash(0.43, 0.5);
    s.thud(0.43, 0.4, 0.5);
    s.noise(0.5, 0.35, { clock: () => 4000, gain: env.decay(0.15, 1.5), short: true });
    s.bubbles(0.5, 0.3, 4, { lo: 200, hi: 400, gain: 0.15 });
    return s;
  },
};
