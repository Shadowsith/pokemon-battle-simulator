import { Injectable, computed, signal } from '@angular/core';
import {
  BattleScene,
  FlagCondition,
  SceneEffect,
  StoryDoc,
  StoryMon
} from '../models/story.model';
import { MAX_TEAM_SIZE } from '../models/team.model';

const SAVE_KEY = 'pbs.story.progress';

/** Persisted state of the single story run. */
export interface StorySave {
  storyId: string;
  currentSceneId: string;
  visitedSceneIds: string[];
  flags: Record<string, string | number | boolean>;
  /** The story-owned team taken into every battle of this run. */
  team: StoryMon[];
  /** Set once an EndScene is reached. */
  endingId: string | null;
}

/**
 * Tracks the player's progress through a story arc. One save slot, persisted to
 * localStorage (in-memory fallback when storage is unavailable, matching
 * {@link SettingsService} / {@link TeamService}).
 */
@Injectable({ providedIn: 'root' })
export class StoryProgressService {
  private readonly _save = signal<StorySave | null>(this.load());

  /** The current run, or null when nothing has been started. */
  readonly save = this._save.asReadonly();
  readonly hasRun = computed(() => this._save() !== null);
  readonly isComplete = computed(() => this._save()?.endingId != null);

  /** True when a resumable save exists for the given arc. */
  hasRunFor(storyId: string): boolean {
    return this._save()?.storyId === storyId;
  }

  /** Begin (or restart) an arc from its first scene, clearing team and flags. */
  start(story: StoryDoc): void {
    this._save.set({
      storyId: story.id,
      currentSceneId: story.startSceneId,
      visitedSceneIds: [story.startSceneId],
      flags: {},
      team: [],
      endingId: null
    });
    this.persist();
  }

  /** Move to a scene and record the visit. No-op without an active run. */
  goTo(sceneId: string): void {
    const cur = this._save();
    if (!cur) return;
    const visited = cur.visitedSceneIds.includes(sceneId)
      ? cur.visitedSceneIds
      : [...cur.visitedSceneIds, sceneId];
    this._save.set({ ...cur, currentSceneId: sceneId, visitedSceneIds: visited });
    this.persist();
  }

  /** Route a battle result to the scene's win / loss target. */
  recordBattleOutcome(win: boolean, scene: BattleScene): void {
    this.goTo(win ? scene.onWin : scene.onLose);
  }

  /** Mark the run finished at an ending. */
  finish(endingId: string): void {
    const cur = this._save();
    if (!cur) return;
    this._save.set({ ...cur, endingId });
    this.persist();
  }

  /** Apply a scene's effects (flags / team grants) in order. */
  applyEffects(effects: SceneEffect[] | undefined): void {
    const cur = this._save();
    if (!cur || !effects?.length) return;

    let flags = cur.flags;
    let team = cur.team;
    for (const eff of effects) {
      switch (eff.op) {
        case 'setFlag':
          flags = { ...flags, [eff.key]: eff.value };
          break;
        case 'grantPokemon':
          if (team.length < MAX_TEAM_SIZE) team = [...team, eff.mon];
          break;
        case 'setTeam':
          team = eff.team.slice(0, MAX_TEAM_SIZE);
          break;
      }
    }
    this._save.set({ ...cur, flags, team });
    this.persist();
  }

  /** Evaluate a choice-option guard. Absent condition = always true. */
  checkCondition(cond: FlagCondition | undefined): boolean {
    if (!cond) return true;
    return this._save()?.flags[cond.key] === cond.equals;
  }

  /** Discard the run entirely. */
  reset(): void {
    this._save.set(null);
    try {
      localStorage.removeItem(SAVE_KEY);
    } catch {
      /* storage unavailable - the in-memory clear is enough for this session */
    }
  }

  // --- persistence ---------------------------------------------

  private persist(): void {
    const cur = this._save();
    try {
      if (cur) localStorage.setItem(SAVE_KEY, JSON.stringify(cur));
      else localStorage.removeItem(SAVE_KEY);
    } catch {
      /* storage unavailable - keep the run in memory for this session */
    }
  }

  private load(): StorySave | null {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return null;
      return sanitize(JSON.parse(raw));
    } catch {
      return null;
    }
  }
}

function sanitize(v: unknown): StorySave | null {
  if (!v || typeof v !== 'object') return null;
  const s = v as Record<string, unknown>;
  if (typeof s['storyId'] !== 'string' || typeof s['currentSceneId'] !== 'string') return null;
  return {
    storyId: s['storyId'],
    currentSceneId: s['currentSceneId'],
    visitedSceneIds: Array.isArray(s['visitedSceneIds'])
      ? (s['visitedSceneIds'] as unknown[]).filter((x): x is string => typeof x === 'string')
      : [s['currentSceneId'] as string],
    flags:
      s['flags'] && typeof s['flags'] === 'object'
        ? (s['flags'] as Record<string, string | number | boolean>)
        : {},
    team: Array.isArray(s['team'])
      ? (s['team'] as unknown[]).map(sanitizeMon).filter((m): m is StoryMon => m !== null).slice(0, MAX_TEAM_SIZE)
      : [],
    endingId: typeof s['endingId'] === 'string' ? s['endingId'] : null
  };
}

function sanitizeMon(v: unknown): StoryMon | null {
  if (!v || typeof v !== 'object') return null;
  const m = v as Record<string, unknown>;
  if (typeof m['speciesNum'] !== 'number' || typeof m['speciesId'] !== 'string') return null;
  return {
    speciesNum: m['speciesNum'],
    speciesId: m['speciesId'],
    name: typeof m['name'] === 'string' ? m['name'] : m['speciesId'],
    types: Array.isArray(m['types']) ? (m['types'] as unknown[]).filter((t): t is string => typeof t === 'string') : [],
    moves: Array.isArray(m['moves']) ? (m['moves'] as unknown[]).filter((x): x is string => typeof x === 'string') : []
  };
}
