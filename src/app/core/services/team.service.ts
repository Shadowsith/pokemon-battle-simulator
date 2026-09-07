import { Injectable, computed, signal } from '@angular/core';
import {
  MAX_TEAM_SIZE,
  MOVES_PER_POKEMON,
  SpeciesInfo,
  TeamPokemon,
  isBattleReady
} from '../models/team.model';

const STORAGE_KEY = 'pbs.team';

/**
 * The player's built team: up to 6 Pokémon, each with up to 4 moves. Persisted
 * to localStorage; the battle screen reads it via {@link team}.
 */
@Injectable({ providedIn: 'root' })
export class TeamService {
  private readonly _team = signal<TeamPokemon[]>(this.load());

  readonly team = this._team.asReadonly();
  readonly isFull = computed(() => this._team().length >= MAX_TEAM_SIZE);
  readonly battleReady = computed(() => isBattleReady(this._team()));

  addPokemon(species: SpeciesInfo): void {
    if (this._team().length >= MAX_TEAM_SIZE) return;
    this._team.update((t) => [
      ...t,
      { speciesNum: species.num, speciesId: species.id, name: species.name, types: species.types, moves: [] }
    ]);
    this.persist();
  }

  removePokemon(index: number): void {
    this._team.update((t) => t.filter((_, i) => i !== index));
    this.persist();
  }

  /** Set (moveId) or clear (null) the move in a given slot, de-duping. */
  setMove(pokeIndex: number, slot: number, moveId: string | null): void {
    if (slot < 0 || slot >= MOVES_PER_POKEMON) return;
    this._team.update((t) =>
      t.map((p, i) => {
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
    this.persist();
  }

  clear(): void {
    this._team.set([]);
    this.persist();
  }

  private persist(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this._team()));
    } catch {
      /* storage unavailable - keep in memory for this session */
    }
  }

  private load(): TeamPokemon[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed
        .filter(
          (p): p is TeamPokemon =>
            p && typeof p.speciesId === 'string' && typeof p.speciesNum === 'number' && Array.isArray(p.moves)
        )
        .slice(0, MAX_TEAM_SIZE)
        .map((p) => ({
          speciesNum: p.speciesNum,
          speciesId: p.speciesId,
          name: p.name,
          types: Array.isArray(p.types) ? p.types : [],
          moves: p.moves.filter((m: unknown): m is string => typeof m === 'string').slice(0, MOVES_PER_POKEMON)
        }));
    } catch {
      return [];
    }
  }
}
