export interface TrainerAvatar {
  /** Pokémon Showdown trainer sprite filename, without extension. */
  id: string;
  label: string;
}

/**
 * Local asset path for a trainer avatar sprite. The sprites are downloaded
 * from play.pokemonshowdown.com by scripts/fetch-trainers.mjs - keep the id
 * list there in sync with TRAINER_AVATARS below.
 */
export function trainerAvatarPath(id: string): string {
  return `assets/trainers/${id}.png`;
}

export const TRAINER_AVATARS: TrainerAvatar[] = [
  // Protagonists
  { id: 'red', label: 'Red' },
  { id: 'blue', label: 'Blue' },
  { id: 'green', label: 'Green' },
  { id: 'leaf-gen3', label: 'Leaf' },
  { id: 'ethan', label: 'Ethan' },
  { id: 'lyra', label: 'Lyra' },
  { id: 'kris', label: 'Kris' },
  { id: 'brendan', label: 'Brendan' },
  { id: 'may', label: 'May' },
  { id: 'lucas', label: 'Lucas' },
  { id: 'dawn', label: 'Dawn' },
  { id: 'hilbert', label: 'Hilbert' },
  { id: 'hilda', label: 'Hilda' },
  { id: 'nate', label: 'Nate' },
  { id: 'rosa', label: 'Rosa' },
  { id: 'calem', label: 'Calem' },
  { id: 'serena', label: 'Serena' },
  { id: 'elio', label: 'Elio' },
  { id: 'selene', label: 'Selene' },
  { id: 'victor', label: 'Victor' },
  { id: 'gloria', label: 'Gloria' },
  { id: 'florian-s', label: 'Florian' },
  { id: 'juliana-s', label: 'Juliana' },
  // Rivals & story characters
  { id: 'silver', label: 'Silver' },
  { id: 'wally', label: 'Wally' },
  { id: 'barry', label: 'Barry' },
  { id: 'cheren', label: 'Cheren' },
  { id: 'bianca', label: 'Bianca' },
  { id: 'hugh', label: 'Hugh' },
  { id: 'n', label: 'N' },
  { id: 'hau', label: 'Hau' },
  { id: 'gladion', label: 'Gladion' },
  { id: 'lillie', label: 'Lillie' },
  { id: 'hop', label: 'Hop' },
  { id: 'marnie', label: 'Marnie' },
  { id: 'bede', label: 'Bede' },
  { id: 'nemona-s', label: 'Nemona' },
  // Champions & Gym Leaders
  { id: 'cynthia', label: 'Cynthia' },
  { id: 'lance', label: 'Lance' },
  { id: 'steven', label: 'Steven' },
  { id: 'leon', label: 'Leon' },
  { id: 'giovanni', label: 'Giovanni' },
  { id: 'cyrus', label: 'Cyrus' },
  { id: 'guzma', label: 'Guzma' },
  { id: 'misty', label: 'Misty' },
  { id: 'brock', label: 'Brock' },
  { id: 'erika', label: 'Erika' },
  { id: 'sabrina', label: 'Sabrina' },
  { id: 'morty', label: 'Morty' },
  { id: 'jasmine', label: 'Jasmine' },
  { id: 'volkner', label: 'Volkner' },
  { id: 'flannery', label: 'Flannery' },
  { id: 'nessa', label: 'Nessa' }
];

export const DEFAULT_TRAINER_AVATAR = 'red';

export function isTrainerAvatarId(id: string): boolean {
  return TRAINER_AVATARS.some((a) => a.id === id);
}

/**
 * A display name for any Showdown trainer sprite id - the curated label when
 * we have one, otherwise a best-effort prettified version of the id
 * ("acetrainerf-gen4" -> "Acetrainerf", "team-rocket-grunt" -> "Team Rocket Grunt").
 */
export function trainerLabel(id: string): string {
  const known = TRAINER_AVATARS.find((a) => a.id === id);
  if (known) return known.label;

  const base = id.split('-')[0].replace(/([a-z])([A-Z])/g, '$1 $2');
  return base
    .split(/[\s_]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}
