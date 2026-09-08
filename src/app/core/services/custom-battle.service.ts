import { Injectable, signal } from '@angular/core';
import {
  CustomBattleConfig,
  SavedCustomBattle,
  clampConfig,
  defaultCustomBattleConfig
} from '../models/custom-battle.model';
import { MAX_TEAM_SIZE, MOVES_PER_POKEMON, TeamPokemon } from '../models/team.model';

const STORE_KEY = 'pbs.customBattles';

const uid = (): string =>
  globalThis.crypto?.randomUUID?.() ??
  `c${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

/**
 * Named Custom Battle configurations (persisted to localStorage, same pattern as
 * {@link TeamService}) plus a transient hand-off slot the battle screen reads
 * once when a custom fight is launched.
 */
@Injectable({ providedIn: 'root' })
export class CustomBattleService {
  private readonly _saved = signal<SavedCustomBattle[]>(this.load());
  readonly saved = this._saved.asReadonly();

  /** The config waiting to be played; consumed by {@link take}. */
  private pending: CustomBattleConfig | null = null;

  // --- transient hand-off ------------------------------------------

  set(config: CustomBattleConfig): void {
    this.pending = clampConfig(config);
  }

  take(): CustomBattleConfig | null {
    const c = this.pending;
    this.pending = null;
    return c;
  }

  // --- named presets ---------------------------------------------

  get(id: string): SavedCustomBattle | null {
    return this._saved().find((s) => s.id === id) ?? null;
  }

  /** Save under `name`; overwrites an existing preset with the same trimmed name. */
  save(name: string, config: CustomBattleConfig): void {
    const clean = name.trim();
    if (!clean) return;
    const cfg = clampConfig(config);
    this._saved.update((list) => {
      const existing = list.find((s) => s.name === clean);
      if (existing) return list.map((s) => (s.id === existing.id ? { ...s, config: cfg } : s));
      return [...list, { id: uid(), name: clean, config: cfg }];
    });
    this.persist();
  }

  remove(id: string): void {
    this._saved.update((list) => list.filter((s) => s.id !== id));
    this.persist();
  }

  // --- persistence ---------------------------------------------

  private persist(): void {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(this._saved()));
    } catch {
      /* storage unavailable - keep the list in memory for this session */
    }
  }

  private load(): SavedCustomBattle[] {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed)
        ? parsed.map(sanitize).filter((s): s is SavedCustomBattle => s !== null)
        : [];
    } catch {
      return [];
    }
  }
}

function sanitize(v: unknown): SavedCustomBattle | null {
  if (!v || typeof v !== 'object') return null;
  const s = v as Record<string, unknown>;
  if (typeof s['id'] !== 'string' || typeof s['name'] !== 'string') return null;
  const c = (s['config'] ?? {}) as Record<string, unknown>;
  const base = defaultCustomBattleConfig();
  const config = clampConfig({
    opponentCount: typeof c['opponentCount'] === 'number' ? c['opponentCount'] : base.opponentCount,
    mode: c['mode'] === 'team' ? 'team' : 'random',
    team: Array.isArray(c['team'])
      ? (c['team'] as unknown[]).map(sanitizeMon).filter((m): m is TeamPokemon => m !== null)
      : [],
    forceDistinctTypes: c['forceDistinctTypes'] === true,
    distinctTypes: Array.isArray(c['distinctTypes'])
      ? (c['distinctTypes'] as unknown[]).filter((t): t is string => typeof t === 'string')
      : [],
    forceSingleType: c['forceSingleType'] === true,
    singleType: typeof c['singleType'] === 'string' ? (c['singleType'] as string) : null,
    avatarId: typeof c['avatarId'] === 'string' ? (c['avatarId'] as string) : null
  });
  return { id: s['id'], name: s['name'], config };
}

function sanitizeMon(v: unknown): TeamPokemon | null {
  if (!v || typeof v !== 'object') return null;
  const m = v as Record<string, unknown>;
  if (typeof m['speciesNum'] !== 'number' || typeof m['speciesId'] !== 'string') return null;
  return {
    speciesNum: m['speciesNum'],
    speciesId: m['speciesId'],
    name: typeof m['name'] === 'string' ? m['name'] : m['speciesId'],
    types: Array.isArray(m['types'])
      ? (m['types'] as unknown[]).filter((t): t is string => typeof t === 'string')
      : [],
    moves: Array.isArray(m['moves'])
      ? (m['moves'] as unknown[]).filter((x): x is string => typeof x === 'string').slice(0, MOVES_PER_POKEMON)
      : []
  };
}

/** Exported for the config page to enforce the same slot cap. */
export const CUSTOM_MAX_SLOTS = MAX_TEAM_SIZE;
