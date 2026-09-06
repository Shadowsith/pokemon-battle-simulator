import { Injectable } from '@angular/core';
import { DEFAULT_TRAINER_AVATAR, TRAINER_AVATARS } from '../models/trainer.model';

const MANIFEST_URL = 'assets/trainers/index.json';
const CURATED_FALLBACK = TRAINER_AVATARS.map((a) => a.id);

/**
 * The full roster of Showdown trainer sprite ids (assets/trainers/index.json,
 * written by scripts/fetch-trainers.mjs). Loaded once, cached. Used to hand
 * each test-battle NPC a random trainer look; falls back to the curated
 * avatar list if the manifest is missing.
 */
@Injectable({ providedIn: 'root' })
export class TrainerRosterService {
  private ids: string[] | null = null;
  private loading: Promise<string[]> | null = null;

  async all(): Promise<string[]> {
    if (this.ids) return this.ids;
    if (!this.loading) {
      this.loading = fetch(MANIFEST_URL)
        .then((r) => (r.ok ? r.json() : null))
        .then((list: unknown) => {
          this.ids = Array.isArray(list) && list.length ? (list as string[]) : [...CURATED_FALLBACK];
          return this.ids;
        })
        .catch(() => {
          this.ids = [...CURATED_FALLBACK];
          return this.ids;
        });
    }
    return this.loading;
  }

  async randomId(exclude?: string): Promise<string> {
    const ids = await this.all();
    const pool = exclude ? ids.filter((id) => id !== exclude) : ids;
    return pool[Math.floor(Math.random() * pool.length)] ?? DEFAULT_TRAINER_AVATAR;
  }
}
