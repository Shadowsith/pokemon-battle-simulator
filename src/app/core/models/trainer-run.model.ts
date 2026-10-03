/**
 * Shapes shared by the run-based challenge modes (Top-Vier, Arenaleiter): a
 * region holds an ordered list of authored trainers, each with a fixed team.
 * Every Pokémon battles at level 100 in this simulator, so only species and
 * movesets are honoured, not the original levels.
 */

/** One opponent Pokémon; same shape as TeamPokemon. */
export interface RunMon {
  speciesNum: number;
  speciesId: string;
  name: string;
  /** Capitalised type names ("Water"). */
  types: string[];
  /** @pkmn/sim move ids; resolved against MOVE_LIBRARY. */
  moves: string[];
  /** Held item id (item.model.ts). */
  item?: string | null;
}

/** One trainer of a run, fought in list order. */
export interface RunMember {
  /** Trainer sprite id (assets/trainers/<id>.png). */
  trainerId: string;
  name: string;
  title: string;
  team: RunMon[];
}

/** A gym leader: a run member who hands out a badge. */
export interface GymLeader extends RunMember {
  /** German badge name ("Felsorden"). */
  badge: string;
  /** The leader's speciality type ("Rock"); colours the badge chip. */
  type: string;
  /**
   * Shares the badge with the next member (Ben → Svenja): fought as a gym leader,
   * but the badge is only counted and shown on the partner.
   */
  sharedBadge?: boolean;
}

export interface RunRegion<M extends RunMember = RunMember> {
  id: string;
  gen: number;
  label: string;
  /** false → shown in the picker but not playable yet. */
  available: boolean;
  members: M[];
}
