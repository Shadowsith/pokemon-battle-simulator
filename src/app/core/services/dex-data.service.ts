import { Injectable } from '@angular/core';
import { MoveInfo, SpeciesInfo } from '../models/team.model';

const SPECIES_URL = 'assets/data/species-gen6.json';
const MOVES_URL = 'assets/data/moves-gen6.json';
const LEARNSETS_URL = 'assets/data/learnsets-gen6.json';

/**
 * Loads the static Gen 6 team-builder data (built by scripts/build-team-data.mjs):
 * the base species list, per-move display info, and per-species legal move
 * lists. Each file is fetched once and cached.
 */
@Injectable({ providedIn: 'root' })
export class DexDataService {
  private speciesP?: Promise<SpeciesInfo[]>;
  private movesP?: Promise<Record<string, MoveInfo>>;
  private learnsetsP?: Promise<Record<string, string[]>>;

  species(): Promise<SpeciesInfo[]> {
    return (this.speciesP ??= fetchJson<SpeciesInfo[]>(SPECIES_URL, []));
  }

  moves(): Promise<Record<string, MoveInfo>> {
    return (this.movesP ??= fetchJson<Record<string, MoveInfo>>(MOVES_URL, {}));
  }

  private learnsets(): Promise<Record<string, string[]>> {
    return (this.learnsetsP ??= fetchJson<Record<string, string[]>>(LEARNSETS_URL, {}));
  }

  /** @pkmn/sim move ids the given species can legally run in a Gen 1-5 battle. */
  async legalMoves(speciesId: string): Promise<string[]> {
    const all = await this.learnsets();
    return all[speciesId] ?? [];
  }
}

async function fetchJson<T>(url: string, fallback: T): Promise<T> {
  try {
    const res = await fetch(url);
    return res.ok ? ((await res.json()) as T) : fallback;
  } catch {
    return fallback;
  }
}
