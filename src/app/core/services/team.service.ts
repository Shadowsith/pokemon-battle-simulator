import { Injectable, computed, signal } from '@angular/core';
import {
  ImportedTeam,
  MAX_TEAM_SIZE,
  MOVES_PER_POKEMON,
  SavedTeam,
  SpeciesInfo,
  TeamPokemon,
  isBattleReady,
  sanitizeMon,
  sanitizeTeam
} from '../models/team.model';
import { germanSpeciesName } from '../models/species-names.de';

const TEAMS_KEY = 'pbs.teams';
const ACTIVE_KEY = 'pbs.activeTeamId';
const LEGACY_TEAM_KEY = 'pbs.team';

/** One team picked in the import dialog and how to apply it. */
export interface TeamImportEntry {
  team: ImportedTeam;
  mode: 'new' | 'replace';
  /** Existing team to overwrite when `mode` is `replace`. */
  replaceId?: string;
}

/** `name`, or `name (Import)`, `name (Import 2)` … if already taken. Records the result in `used`. */
function uniqueName(name: string, used: Set<string>): string {
  let candidate = name;
  for (let n = 1; used.has(candidate); n++) {
    candidate = n === 1 ? `${name} (Import)` : `${name} (Import ${n})`;
  }
  used.add(candidate);
  return candidate;
}

const uid = (): string =>
  globalThis.crypto?.randomUUID?.() ??
  `t${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

/**
 * The player's saved teams. Several may exist; exactly one is "active" and is
 * the team taken into a test battle. Persisted to localStorage.
 */
@Injectable({ providedIn: 'root' })
export class TeamService {
  private readonly _teams = signal<SavedTeam[]>([]);
  private readonly _activeId = signal<string | null>(null);

  readonly teams = this._teams.asReadonly();
  readonly activeTeamId = this._activeId.asReadonly();
  readonly activeTeam = computed<SavedTeam | null>(
    () => this._teams().find((t) => t.id === this._activeId()) ?? null
  );
  /** True when the active team has at least one Pokémon that knows a move. */
  readonly activeReady = computed(() => {
    const t = this.activeTeam();
    return !!t && isBattleReady(t.pokemon);
  });

  constructor() {
    this.load();
  }

  team(id: string): SavedTeam | null {
    return this._teams().find((t) => t.id === id) ?? null;
  }

  isFull(id: string): boolean {
    return (this.team(id)?.pokemon.length ?? 0) >= MAX_TEAM_SIZE;
  }

  isReady(id: string): boolean {
    const t = this.team(id);
    return !!t && isBattleReady(t.pokemon);
  }

  // --- team management --------------------------------------------

  createTeam(name?: string): string {
    const id = uid();
    const finalName = name?.trim() || this.nextDefaultName();
    this._teams.update((ts) => [...ts, { id, name: finalName, pokemon: [] }]);
    if (this._activeId() === null) this._activeId.set(id);
    this.persist();
    return id;
  }

  renameTeam(id: string, name: string): void {
    const n = name.trim();
    if (!n) return;
    this._teams.update((ts) => ts.map((t) => (t.id === id ? { ...t, name: n } : t)));
    this.persist();
  }

  deleteTeam(id: string): void {
    this._teams.update((ts) => ts.filter((t) => t.id !== id));
    if (this._activeId() === id) this._activeId.set(this._teams()[0]?.id ?? null);
    this.persist();
  }

  duplicateTeam(id: string): string {
    const src = this.team(id);
    if (!src) return '';
    const newId = uid();
    this._teams.update((ts) => [
      ...ts,
      {
        id: newId,
        name: `${src.name} (Kopie)`,
        pokemon: src.pokemon.map((p) => ({ ...p, types: [...p.types], moves: [...p.moves] }))
      }
    ]);
    this.persist();
    return newId;
  }

  findByName(name: string): SavedTeam | null {
    const n = name.trim();
    return this._teams().find((t) => t.name === n) ?? null;
  }

  /**
   * Add imported teams in one go. `new` appends with a fresh id (suffixing a
   * clashing name); `replace` swaps name + Pokémon of an existing team, keeping
   * its id so an active team stays active. Returns how many were applied.
   */
  importTeams(entries: TeamImportEntry[]): number {
    let applied = 0;
    let firstNewId: string | null = null;
    const next = this._teams().slice();
    const used = new Set(next.map((t) => t.name));

    for (const e of entries) {
      const pokemon = e.team.pokemon.map((p) => ({
        ...p,
        types: [...p.types],
        moves: [...p.moves]
      }));
      if (e.mode === 'replace') {
        const idx = next.findIndex((t) => t.id === e.replaceId);
        if (idx < 0) continue;
        next[idx] = { ...next[idx], name: e.team.name, pokemon };
      } else {
        const id = uid();
        const name = uniqueName(e.team.name, used);
        next.push({ id, name, pokemon });
        firstNewId ??= id;
      }
      used.add(e.team.name);
      applied++;
    }

    this._teams.set(next);
    if (this._activeId() === null && firstNewId) this._activeId.set(firstNewId);
    this.persist();
    return applied;
  }

  setActive(id: string): void {
    if (!this._teams().some((t) => t.id === id)) return;
    this._activeId.set(id);
    this.persist();
  }

  // --- editing a team's Pokémon ---------------------------------

  addPokemon(teamId: string, species: SpeciesInfo): void {
    this.updatePokemon(teamId, (pk) =>
      pk.length >= MAX_TEAM_SIZE
        ? pk
        : [
            ...pk,
            {
              speciesNum: species.num,
              speciesId: species.id,
              name: germanSpeciesName(species.num, species.name),
              types: species.types,
              moves: []
            }
          ]
    );
  }

  removePokemon(teamId: string, index: number): void {
    this.updatePokemon(teamId, (pk) => pk.filter((_, i) => i !== index));
  }

  /** Move the Pokémon at `from` to position `to`, shifting the rest. */
  reorderPokemon(teamId: string, from: number, to: number): void {
    this.updatePokemon(teamId, (pk) => {
      if (from < 0 || from >= pk.length || to < 0 || to >= pk.length || from === to) return pk;
      const next = pk.slice();
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  }

  /** Set (moveId) or clear (null) the move in a given slot, de-duping. */
  setMove(teamId: string, pokeIndex: number, slot: number, moveId: string | null): void {
    if (slot < 0 || slot >= MOVES_PER_POKEMON) return;
    this.updatePokemon(teamId, (pk) =>
      pk.map((p, i) => {
        if (i !== pokeIndex) return p;
        const moves = [...p.moves];
        if (moveId === null) {
          moves.splice(slot, 1);
        } else {
          if (moves.includes(moveId)) return p;
          moves[slot] = moveId;
        }
        return { ...p, moves: moves.filter(Boolean).slice(0, MOVES_PER_POKEMON) };
      })
    );
  }

  clearTeam(teamId: string): void {
    this.updatePokemon(teamId, () => []);
  }

  private updatePokemon(teamId: string, fn: (pk: TeamPokemon[]) => TeamPokemon[]): void {
    this._teams.update((ts) =>
      ts.map((t) => (t.id === teamId ? { ...t, pokemon: fn(t.pokemon) } : t))
    );
    this.persist();
  }

  // --- persistence ---------------------------------------------

  private nextDefaultName(): string {
    const used = new Set(this._teams().map((t) => t.name));
    for (let n = 1; ; n++) {
      const candidate = `Team ${n}`;
      if (!used.has(candidate)) return candidate;
    }
  }

  private persist(): void {
    try {
      localStorage.setItem(TEAMS_KEY, JSON.stringify(this._teams()));
      const active = this._activeId();
      if (active) localStorage.setItem(ACTIVE_KEY, active);
      else localStorage.removeItem(ACTIVE_KEY);
    } catch {
      /* storage unavailable - keep in memory for this session */
    }
  }

  private load(): void {
    try {
      const rawTeams = localStorage.getItem(TEAMS_KEY);
      if (rawTeams) {
        const parsed = JSON.parse(rawTeams);
        this._teams.set(
          Array.isArray(parsed) ? parsed.map(sanitizeTeam).filter((t): t is SavedTeam => !!t) : []
        );
      } else {
        this.migrateLegacy();
      }
      const active = localStorage.getItem(ACTIVE_KEY);
      this._activeId.set(
        active && this._teams().some((t) => t.id === active)
          ? active
          : (this._teams()[0]?.id ?? null)
      );
    } catch {
      this._teams.set([]);
      this._activeId.set(null);
    }
  }

  /** Fold a pre-multi-team single team ("pbs.team") into one saved team. */
  private migrateLegacy(): void {
    try {
      const raw = localStorage.getItem(LEGACY_TEAM_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      const pokemon = Array.isArray(parsed)
        ? parsed.map(sanitizeMon).filter((p): p is TeamPokemon => !!p)
        : [];
      if (pokemon.length) {
        this._teams.set([{ id: uid(), name: 'Team 1', pokemon }]);
        this.persist();
      }
      localStorage.removeItem(LEGACY_TEAM_KEY);
    } catch {
      /* ignore a bad legacy blob */
    }
  }
}
