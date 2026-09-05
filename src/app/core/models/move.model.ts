/**
 * Each move is mapped to one visual archetype rather than having a bespoke
 * animation. This keeps the animation catalog small (a few dozen archetypes)
 * while every one of the ~600 Gen 1-5 moves can still be assigned one.
 */
export type MoveArchetype =
  | 'melee'
  | 'projectile'
  | 'beam'
  | 'multiPulse'
  | 'targetLevitate'
  | 'directDischarge'
  | 'groundEffect';

export interface Move {
  id: string;
  name: string;
  archetype: MoveArchetype;
  /** Primary hex color used by the archetype's particles/rings/beam. */
  color: string;
  /** Canonical @pkmn/sim move id (e.g. "solarbeam"), used to look up real move data for the damage formula. */
  showdownId: string;
  /** Optional sound file name under assets/sounds/, without extension. */
  soundId?: string;
}

/**
 * Starter catalog covering every archetype demonstrated in the prototypes.
 * Extend this as you map more of the Gen 1-5 move list.
 */
export const MOVE_LIBRARY: Move[] = [
  { id: 'tackle', name: 'Tackle', archetype: 'melee', color: '#B4B2A9', showdownId: 'tackle', soundId: 'tackle' },
  { id: 'bite', name: 'Biss', archetype: 'melee', color: '#72243E', showdownId: 'bite', soundId: 'bite' },
  { id: 'energy_ball', name: 'Energieball', archetype: 'projectile', color: '#3B6D11', showdownId: 'energyball', soundId: 'energy_ball' },
  { id: 'solar_beam', name: 'Solarstrahl', archetype: 'beam', color: '#BA7517', showdownId: 'solarbeam', soundId: 'solar_beam' },
  { id: 'ice_beam', name: 'Eisstrahl', archetype: 'beam', color: '#185FA5', showdownId: 'icebeam', soundId: 'ice_beam' },
  { id: 'dark_pulse', name: 'Finsteraura', archetype: 'multiPulse', color: '#3C3489', showdownId: 'darkpulse', soundId: 'dark_pulse' },
  { id: 'psychic', name: 'Psychokinese', archetype: 'targetLevitate', color: '#993556', showdownId: 'psychic', soundId: 'psychic' },
  { id: 'thunderbolt', name: 'Donnerblitz', archetype: 'directDischarge', color: '#EF9F27', showdownId: 'thunderbolt', soundId: 'thunderbolt' },
  { id: 'earthquake', name: 'Erdbeben', archetype: 'groundEffect', color: '#854F0B', showdownId: 'earthquake', soundId: 'earthquake' }
];
