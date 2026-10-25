import { PokemonType } from '../../models/move.model';

export interface BattleStageRefs {
  fieldEl: HTMLElement;
  fxEl: HTMLElement;
  screenFxEl: HTMLElement;
  /** The Pokémon that is casting the move (its own sprite lunges/emits from here). */
  launchEl: HTMLElement;
  /** The Pokémon being hit. */
  targetEl: HTMLElement;
}

export interface Point {
  x: number;
  y: number;
}

/** How the effect gets from caster to target - the coarse motion of the move. */
export type Delivery =
  | 'melee'
  | 'projectile'
  | 'lob'
  | 'beam'
  | 'pulse'
  | 'sonic'
  | 'powder'
  | 'field'
  | 'selfAura'
  | 'targetAura'
  | 'weather';

export type MeleeStyle = 'hit' | 'punch' | 'bite' | 'kick' | 'slash';
export type Fleck =
  | 'burn'
  | 'freeze'
  | 'paralyze'
  | 'poison'
  | 'sleep'
  | 'flinch'
  | 'confusion'
  | 'statUp'
  | 'statDown'
  | null;
export type Weather = 'sun' | 'rain' | 'sand' | 'hail' | null;

/**
 * Everything the renderer needs to draw one move, derived per-move from its
 * real @pkmn/sim data (category, base power, multi-hit, flags, status,
 * drain/recoil, weather, target) rather than from a shared archetype - so
 * Bullet Seed, Ember and Thunder Wave each look like themselves.
 */
export interface MoveVisual {
  delivery: Delivery;
  meleeStyle: MeleeStyle;
  type: PokemonType;
  /** +1 when the caster is left of the target (player -> opponent), -1 otherwise. */
  dir: 1 | -1;
  /** Primary tint (from the Move model). */
  color: string;
  /** 0-1 intensity from base power - scales beams, bursts, flash and shake. */
  power: number;
  /** Number of distinct impacts (multi-hit moves land 2-5). */
  hits: number;
  /** Priority move - dashes in / travels faster. */
  quick: boolean;
  /** Two-turn move - plays a charge-up before firing. */
  charge: boolean;
  /** Draining move - energy streams back to the caster after impact. */
  drain: boolean;
  /** Recoil move - the caster recoils after connecting. */
  recoil: boolean;
  /** Self-healing status move. */
  heal: boolean;
  /** Hits everything on the target side / whole field. */
  spread: boolean;
  fleck: Fleck;
  weather: Weather;
}

export type Shape =
  | 'circle'
  | 'ember'
  | 'drop'
  | 'bolt'
  | 'leaf'
  | 'shard'
  | 'burst'
  | 'bubble'
  | 'rock'
  | 'slash'
  | 'ring'
  | 'wisp';

export interface BubbleStyle {
  count: number;
  /** ms for one bubble to reach the target */
  travel: number;
  /** ms between bubble launches */
  stagger: number;
  /** max px of up-and-down wobble on the way */
  wobble: number;
  /** max px of scatter around the caster at launch */
  jitter: number;
}

/** A hand-made move animation; resolves once the impact should register. */
export type CustomMoveAnim = (refs: BattleStageRefs, launch: Point, target: Point, v: MoveVisual) => Promise<void>;

/** Hand-made move animations keyed by @pkmn/sim move id. */
export type MoveAnimRegistry = Readonly<Record<string, CustomMoveAnim>>;
