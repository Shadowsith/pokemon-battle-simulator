/** Major (non-volatile) status conditions - a Pokémon can carry only one. */
export type MajorStatus = 'brn' | 'psn' | 'tox' | 'par' | 'slp' | 'frz';

export interface StatusState {
  major: MajorStatus | null;
  /** Escalating counter for badly-poisoned (tox): damage is n/16 max HP. */
  toxicTurns: number;
  /** Remaining forced-sleep turns; the Pokémon wakes when this hits 0. */
  sleepTurns: number;
  /** Remaining confusion turns (a volatile - coexists with a major status). */
  confusionTurns: number;
}

export function freshStatus(): StatusState {
  return { major: null, toxicTurns: 0, sleepTurns: 0, confusionTurns: 0 };
}

export type StatKey = 'atk' | 'def' | 'spa' | 'spd' | 'spe' | 'accuracy' | 'evasion';

/** Battle stat stages, each -6..+6 (0 = unmodified). Reset on switch / faint. */
export type Boosts = Record<StatKey, number>;

export function freshBoosts(): Boosts {
  return { atk: 0, def: 0, spa: 0, spd: 0, spe: 0, accuracy: 0, evasion: 0 };
}

export const STAT_META: Record<StatKey, { short: string; label: string }> = {
  atk: { short: 'ANG', label: 'Angriff' },
  def: { short: 'VER', label: 'Verteidigung' },
  spa: { short: 'SP-ANG', label: 'Spezial-Angriff' },
  spd: { short: 'SP-VER', label: 'Spezial-Verteidigung' },
  spe: { short: 'INI', label: 'Initiative' },
  accuracy: { short: 'GEN', label: 'Genauigkeit' },
  evasion: { short: 'FLU', label: 'Fluchtwert' }
};

export interface BattlePokemon {
  /** National Pokédex number, used to resolve local sprite/sound assets */
  dexId: number;
  name: string;
  maxHp: number;
  currentHp: number;
  types: string[];
  status: StatusState;
  boosts: Boosts;
}

/** Badge presentation per status: short code, background, text colour, full name. */
export const STATUS_META: Record<MajorStatus, { short: string; bg: string; fg: string; label: string }> = {
  brn: { short: 'BRN', bg: '#e8613c', fg: '#ffffff', label: 'Verbrennung' },
  psn: { short: 'PSN', bg: '#9a4bb0', fg: '#ffffff', label: 'Vergiftung' },
  tox: { short: 'PSN', bg: '#7e2f96', fg: '#ffffff', label: 'schwere Vergiftung' },
  par: { short: 'PAR', bg: '#e6c72e', fg: '#3a3300', label: 'Paralyse' },
  slp: { short: 'SLP', bg: '#e9e9e9', fg: '#3a3a3a', label: 'Schlaf' },
  frz: { short: 'FRZ', bg: '#8ad4ec', fg: '#08333f', label: 'Gefroren' }
};

/** Builds the local asset path for a Showdown-style front sprite (used for the opponent). */
export function frontSpritePath(dexId: number): string {
  return `assets/sprites/showdown/${dexId}.gif`;
}

/** Builds the local asset path for a Showdown-style back sprite (used for the player's own Pokémon). */
export function backSpritePath(dexId: number): string {
  return `assets/sprites/showdown/back/${dexId}.gif`;
}

/** Muted per-type colours for type tags / chips (keys are @pkmn/sim type names). */
export const POKEMON_TYPE_COLORS: Record<string, string> = {
  Normal: '#9a9a86',
  Fire: '#c7431f',
  Water: '#2c6fb5',
  Electric: '#e0a422',
  Grass: '#4a8c2b',
  Ice: '#4aa5c4',
  Fighting: '#9b331f',
  Poison: '#7a3d8c',
  Ground: '#a9803b',
  Flying: '#6b8abf',
  Psychic: '#c14d7d',
  Bug: '#8a9a1f',
  Rock: '#9a8a4b',
  Ghost: '#5a4785',
  Dragon: '#4a3ca5',
  Dark: '#4a4048',
  Steel: '#7a8a99'
};

export function typeColor(type: string): string {
  return POKEMON_TYPE_COLORS[type] ?? '#9a9a86';
}
