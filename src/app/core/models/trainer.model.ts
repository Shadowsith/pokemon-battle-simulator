export interface TrainerAvatar {
  /** Pokémon Showdown trainer sprite filename, without extension. */
  id: string;
  label: string;
}

/** A curated avatar plus how many Masters variants exist for it. */
interface CuratedAvatar extends TrainerAvatar {
  /** Number of `<base>-masters[N]` sprites in assets/trainers. */
  masters?: number;
  /** Sprite base name for the variants when it differs from `id` ("leaf" for "leaf-gen3"). */
  mastersBase?: string;
}

/**
 * Local asset path for a trainer avatar sprite. The sprites are downloaded
 * from play.pokemonshowdown.com by scripts/fetch-trainers.mjs - keep the id
 * list there in sync with TRAINER_AVATARS below.
 */
export function trainerAvatarPath(id: string): string {
  return `assets/trainers/${id}.png`;
}

const CURATED_AVATARS: CuratedAvatar[] = [
  // Protagonists
  { id: 'red', label: 'Red', masters: 4 },
  { id: 'blue', label: 'Blue', masters: 2 },
  { id: 'green', label: 'Green' },
  { id: 'leaf-gen3', label: 'Leaf', masters: 2, mastersBase: 'leaf' },
  { id: 'ethan', label: 'Ethan', masters: 1 },
  { id: 'lyra', label: 'Lyra', masters: 2 },
  { id: 'kris', label: 'Kris', masters: 2 },
  { id: 'brendan', label: 'Brendan', masters: 3 },
  { id: 'may', label: 'May', masters: 4 },
  { id: 'lucas', label: 'Lucas' },
  { id: 'dawn', label: 'Dawn', masters: 3 },
  { id: 'hilbert', label: 'Hilbert', masters: 3 },
  { id: 'hilda', label: 'Hilda', masters: 4 },
  { id: 'nate', label: 'Nate', masters: 1 },
  { id: 'rosa', label: 'Rosa', masters: 4 },
  { id: 'calem', label: 'Calem', masters: 1 },
  { id: 'serena', label: 'Serena', masters: 3 },
  { id: 'elio', label: 'Elio', masters: 1 },
  { id: 'selene', label: 'Selene', masters: 2 },
  { id: 'victor', label: 'Victor', masters: 1 },
  { id: 'gloria', label: 'Gloria', masters: 2 },
  { id: 'florian-s', label: 'Florian', masters: 1, mastersBase: 'florian' },
  { id: 'juliana-s', label: 'Juliana', masters: 1, mastersBase: 'juliana' },
  // Rivals & story characters
  { id: 'silver', label: 'Silver', masters: 2 },
  { id: 'wally', label: 'Wally', masters: 1 },
  { id: 'barry', label: 'Barry', masters: 1 },
  { id: 'cheren', label: 'Cheren', masters: 1 },
  { id: 'bianca', label: 'Bianca', masters: 1 },
  { id: 'hugh', label: 'Hugh', masters: 1 },
  { id: 'n', label: 'N', masters: 3 },
  { id: 'hau', label: 'Hau', masters: 1 },
  { id: 'gladion', label: 'Gladion', masters: 2 },
  { id: 'lillie', label: 'Lillie', masters: 5 },
  { id: 'hop', label: 'Hop', masters: 1 },
  { id: 'marnie', label: 'Marnie', masters: 4 },
  { id: 'bede', label: 'Bede', masters: 2 },
  { id: 'nemona-s', label: 'Nemona', masters: 1, mastersBase: 'nemona' },
  // Champions & Gym Leaders
  { id: 'cynthia', label: 'Cynthia', masters: 5 },
  { id: 'lance', label: 'Lance', masters: 2 },
  { id: 'steven', label: 'Steven', masters: 5 },
  { id: 'leon', label: 'Leon', masters: 2 },
  { id: 'giovanni', label: 'Giovanni', masters: 2 },
  { id: 'cyrus', label: 'Cyrus', masters: 1 },
  { id: 'guzma', label: 'Guzma', masters: 1 },
  { id: 'misty', label: 'Misty', masters: 1 },
  { id: 'brock', label: 'Brock', masters: 1 },
  { id: 'erika', label: 'Erika', masters: 3 },
  { id: 'sabrina', label: 'Sabrina', masters: 1 },
  { id: 'morty', label: 'Morty', masters: 3 },
  { id: 'jasmine', label: 'Jasmine', masters: 3 },
  { id: 'volkner', label: 'Volkner', masters: 1 },
  { id: 'flannery', label: 'Flannery' },
  { id: 'nessa', label: 'Nessa', masters: 1 }
];

/**
 * Every selectable avatar: each curated trainer followed by its Pokémon
 * Masters EX variants ("leaf-masters", "leaf-masters2", …).
 */
export const TRAINER_AVATARS: TrainerAvatar[] = CURATED_AVATARS.flatMap(
  ({ id, label, masters = 0, mastersBase = id }) => [
    { id, label },
    ...Array.from({ length: masters }, (_, i) => ({
      id: `${mastersBase}-masters${i ? i + 1 : ''}`,
      label: `${label} (Masters${i ? ' ' + (i + 1) : ''})`
    }))
  ]
);

export const DEFAULT_TRAINER_AVATAR = 'red';

export function isTrainerAvatarId(id: string): boolean {
  return TRAINER_AVATARS.some((a) => a.id === id);
}

/**
 * A display name for any Showdown trainer sprite id - the curated label when
 * we have one (without its Masters tag), otherwise a best-effort prettified version of the id
 * ("acetrainerf-gen4" -> "Acetrainerf", "team-rocket-grunt" -> "Team Rocket Grunt").
 */
export function trainerLabel(id: string): string {
  const known = TRAINER_AVATARS.find((a) => a.id === id);
  if (known) return known.label.replace(/ \(Masters.*\)$/, '');

  const base = id.split('-')[0].replace(/([a-z])([A-Z])/g, '$1 $2');
  return base
    .split(/[\s_]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}
