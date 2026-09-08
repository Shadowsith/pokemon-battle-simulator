import { MOVE_LIBRARY } from './move.model';

/**
 * Story mode data model. A story arc is a graph of scenes authored as a single
 * JSON file under `public/assets/story/`; the list of arcs lives in
 * `public/assets/story/index.json`. Phase 1 ships the engine plus one
 * placeholder arc - no authored Johto content yet.
 */

/** One selectable story on the Story menu. `available: false` = shown, not playable. */
export interface StoryArc {
  id: string;
  title: string;
  subtitle?: string;
  /** Asset path of the arc's scene file, e.g. "assets/story/johto-leaf.json". */
  file: string;
  available: boolean;
}

export interface StoryDoc {
  id: string;
  title: string;
  startSceneId: string;
  /** Keyed by scene id for O(1) navigation. */
  scenes: Record<string, Scene>;
}

export type Scene = DialogueScene | ChoiceScene | BattleScene | EndScene;

export interface SceneBase {
  id: string;
  /** Asset path or a CSS colour / gradient. Falls back to a default gradient. */
  background?: string;
}

export interface DialogueLine {
  /** Trainer sprite id (assets/trainers/<id>.png). Omit for narration. */
  speakerId?: string;
  speakerName?: string;
  side?: 'left' | 'right' | 'center';
  text: string;
}

export interface DialogueScene extends SceneBase {
  kind: 'dialogue';
  lines: DialogueLine[];
  /** Applied once, when the scene is entered. */
  effects?: SceneEffect[];
  next: string;
}

export interface ChoiceOption {
  label: string;
  next: string;
  requires?: FlagCondition;
  effects?: SceneEffect[];
}

export interface ChoiceScene extends SceneBase {
  kind: 'choice';
  prompt: string;
  options: ChoiceOption[];
}

export interface BattleScene extends SceneBase {
  kind: 'battle';
  opponent: StoryOpponent;
  introText?: string;
  onWin: string;
  onLose: string;
}

export interface EndScene extends SceneBase {
  kind: 'end';
  endingId: string;
  text: string;
}

export interface StoryOpponent {
  /** Trainer sprite id (assets/trainers/<id>.png). */
  trainerId: string;
  name: string;
  /** 1-6 Pokémon. */
  team: StoryMon[];
}

/** Same shape the team builder persists (team.model.ts -> TeamPokemon). */
export interface StoryMon {
  speciesNum: number;
  speciesId: string;
  name: string;
  types: string[];
  /** @pkmn/sim move ids; only ids present in MOVE_LIBRARY actually fire. */
  moves: string[];
}

export type SceneEffect =
  | { op: 'setFlag'; key: string; value: string | number | boolean }
  | { op: 'grantPokemon'; mon: StoryMon }
  | { op: 'setTeam'; team: StoryMon[] };

export interface FlagCondition {
  key: string;
  equals: string | number | boolean;
}

const ARC_INDEX_URL = 'assets/story/index.json';

/** The arc manifest. Fetched once per call; the page caches the result. */
export async function loadArcIndex(): Promise<StoryArc[]> {
  try {
    const res = await fetch(ARC_INDEX_URL);
    if (!res.ok) return [];
    const raw = (await res.json()) as unknown;
    return Array.isArray(raw) ? raw.filter(isStoryArc) : [];
  } catch {
    return [];
  }
}

/**
 * Loads one arc's scene graph. Warns (does not fail) on move ids the prototyped
 * MOVE_LIBRARY can't resolve, so content authoring catches typos early.
 */
export async function loadStory(file: string): Promise<StoryDoc | null> {
  try {
    const res = await fetch(file);
    if (!res.ok) return null;
    const doc = (await res.json()) as StoryDoc;
    if (!doc || typeof doc.startSceneId !== 'string' || typeof doc.scenes !== 'object') return null;
    warnUnknownMoves(doc);
    return doc;
  } catch {
    return null;
  }
}

function isStoryArc(v: unknown): v is StoryArc {
  if (!v || typeof v !== 'object') return false;
  const a = v as Record<string, unknown>;
  return (
    typeof a['id'] === 'string' &&
    typeof a['title'] === 'string' &&
    typeof a['file'] === 'string' &&
    typeof a['available'] === 'boolean'
  );
}

function warnUnknownMoves(doc: StoryDoc): void {
  const known = new Set(MOVE_LIBRARY.map((m) => m.showdownId));
  for (const scene of Object.values(doc.scenes)) {
    if (scene.kind !== 'battle') continue;
    for (const mon of scene.opponent.team) {
      for (const id of mon.moves) {
        if (!known.has(id)) {
          console.warn(`[story:${doc.id}] scene "${scene.id}": unknown move id "${id}" on ${mon.name}`);
        }
      }
    }
  }
}
