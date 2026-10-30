import { PokemonType } from '../../models/move.model';
import { BubbleStyle, Fleck, Shape, Weather } from './animation.types';

/** Per-type particle identity: the glyph shape and whether it tumbles. */
export const TYPE_STYLE: Record<PokemonType, { shape: Shape; spin: boolean }> = {
  Normal: { shape: 'circle', spin: false },
  Fire: { shape: 'ember', spin: false },
  Water: { shape: 'drop', spin: false },
  Electric: { shape: 'bolt', spin: false },
  Grass: { shape: 'leaf', spin: true },
  Ice: { shape: 'shard', spin: true },
  Fighting: { shape: 'burst', spin: false },
  Poison: { shape: 'bubble', spin: false },
  Ground: { shape: 'rock', spin: true },
  Flying: { shape: 'slash', spin: false },
  Psychic: { shape: 'ring', spin: true },
  Bug: { shape: 'circle', spin: false },
  Rock: { shape: 'rock', spin: true },
  Ghost: { shape: 'wisp', spin: false },
  Dragon: { shape: 'ring', spin: true },
  Dark: { shape: 'wisp', spin: false },
  Steel: { shape: 'shard', spin: true },
  Fairy: { shape: 'ring', spin: true }
};

export const SHAPE_CSS: Record<Shape, (c: string) => string> = {
  circle: (c) => `border-radius:50%;background:radial-gradient(circle at 35% 35%,#fff,${c} 55%,#000)`,
  ember: (c) => `border-radius:50% 50% 50% 0;background:radial-gradient(circle,#fff,${c} 55%,transparent)`,
  drop: (c) => `border-radius:50% 50% 50% 50%/65% 65% 40% 40%;background:radial-gradient(circle at 40% 30%,#fff,${c})`,
  bolt: (c) => `background:${c}`, // replaced by an SVG glyph; kept for completeness
  leaf: (c) => `border-radius:0 100% 0 100%;background:linear-gradient(135deg,${c},#fff)`,
  shard: (c) => `clip-path:polygon(50% 0,100% 100%,0 100%);background:linear-gradient(${c},#fff)`,
  burst: (c) => `clip-path:polygon(50% 0,61% 35%,100% 50%,61% 65%,50% 100%,39% 65%,0 50%,39% 35%);background:${c}`,
  bubble: (c) => `border-radius:50%;background:radial-gradient(circle at 35% 35%,#fff,${c}88 70%,transparent);border:1px solid ${c}`,
  rock: (c) => `border-radius:22%;background:linear-gradient(135deg,${c},#000)`,
  slash: (c) => `border-radius:2px;background:linear-gradient(90deg,transparent,${c},#fff)`,
  ring: (c) => `border-radius:50%;border:2px solid ${c};background:radial-gradient(circle,${c}33,transparent 70%)`,
  wisp: (c) => `border-radius:50%;background:radial-gradient(circle,${c},transparent 72%);filter:blur(1px)`
};

export const FLECK_COLOR: Record<Exclude<Fleck, null>, string> = {
  burn: '#F0803C',
  freeze: '#9CD6FF',
  paralyze: '#F6D33B',
  poison: '#A24BC4',
  sleep: '#C9C2E6',
  flinch: '#FFE58A',
  confusion: '#E58AC8',
  statUp: '#8CE0A6',
  statDown: '#E08C8C'
};

/** Two-turn moves where the user leaves the field on turn 1 (Fly, Dig, …). */
export const SEMI_INVULN_ANIM = new Set(['fly', 'dig', 'bounce', 'dive', 'skydrop', 'shadowforce', 'phantomforce']);

/** Bubble: a slow, loose drift. */
export const BUBBLE_DRIFT: BubbleStyle = { count: 14, travel: 1150, stagger: 55, wobble: 16, jitter: 12 };
/** Bubble Beam: more bubbles, fast, in a tight line. */
export const BUBBLE_BEAM: BubbleStyle = { count: 24, travel: 480, stagger: 28, wobble: 3, jitter: 4 };

/** Red-hot battle backdrop for fire moves (Flamethrower, Fire Blast). */
export const HEAT_BACKDROP = 'background:radial-gradient(circle at 55% 40%,#D2462C,#9A2218 55%,#5E0E0A)';

/** Darkened battle backdrop for moves that dim the scene (Amnesia, Aurora Beam, …). */
export const DIM_BACKDROP = 'background:radial-gradient(circle at 50% 45%,#2A2A3A,#08080F)';

/** Tile of wavy purple / pink bands for the psychedelic Psychic backdrop (60 x 24 px). */
export const PSYCHIC_WAVES =
  'url("data:image/svg+xml,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="60" height="24" viewBox="0 0 60 24">' +
      '<rect width="60" height="24" fill="#4A1A7A"/>' +
      '<path d="M0,6 Q15,0 30,6 T60,6 L60,16 Q45,22 30,16 T0,16 Z" fill="#B23FCF"/>' +
      '<path d="M0,9 Q15,3 30,9 T60,9" fill="none" stroke="#F28BF0" stroke-width="2"/>' +
      '<path d="M0,16 Q15,10 30,16 T60,16" fill="none" stroke="#7A2AA8" stroke-width="2.5"/>' +
      '</svg>'
  ) +
  '")';

/** Tile of light blue water with white foamy wave crests for the rising Waterfall backdrop (80 x 48 px). */
export const WATERFALL_WAVES =
  'url("data:image/svg+xml,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="80" height="48" viewBox="0 0 80 48">' +
      '<defs><linearGradient id="f" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#ffffff" stop-opacity="0"/>' +
      '</linearGradient></defs>' +
      '<rect width="80" height="48" fill="#86C6F0"/>' +
      '<path d="M0,22 Q10,8 20,22 T40,22 T60,22 T80,22 L80,34 Q70,26 60,34 T40,34 T20,34 T0,34 Z" fill="url(#f)"/>' +
      '<path d="M0,22 Q10,8 20,22 T40,22 T60,22 T80,22" fill="none" stroke="#ffffff" stroke-width="3"/>' +
      '</svg>'
  ) +
  '")';

/** Colours for the cartoon fist (Dizzy Punch, Fire Punch, Ice Punch, Thunder Punch, Thrash). */
export const FIST_TONES = {
  yellow: { fill: '#FFD84A', edge: '#B8860B', lines: '#C9971A', glow: '#FFE04A' },
  red: { fill: '#D8342A', edge: '#6E1010', lines: '#8E1A14', glow: '#FF8A3C' },
  ice: { fill: '#8FD4FF', edge: '#2A6CB5', lines: '#4A90D0', glow: '#CFF0FF' },
  dark: { fill: '#262626', edge: '#0A0A0A', lines: '#5A5A5A', glow: '#FFF3A0' }
};

export const WEATHER_COLOR: Record<Exclude<Weather, null>, string> = {
  sun: '#FFB13C',
  rain: '#4C8FD6',
  sand: '#C9A24B',
  hail: '#AFE0FF'
};
