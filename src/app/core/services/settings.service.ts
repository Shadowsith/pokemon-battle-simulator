import { Injectable, signal } from '@angular/core';
import { DEFAULT_TRAINER_AVATAR, isTrainerAvatarId } from '../models/trainer.model';

const TRAINER_AVATAR_KEY = 'pbs.settings.trainerAvatar';

/**
 * Player-facing preferences that outlive a single battle. Persisted to
 * localStorage; falls back to in-memory only when storage is unavailable
 * (private browsing, embedded webviews).
 */
@Injectable({ providedIn: 'root' })
export class SettingsService {
  private readonly _trainerAvatar = signal<string>(this.loadTrainerAvatar());

  /** Showdown sprite id of the player's chosen trainer avatar. */
  readonly trainerAvatar = this._trainerAvatar.asReadonly();

  setTrainerAvatar(id: string): void {
    if (!isTrainerAvatarId(id) || id === this._trainerAvatar()) return;
    this._trainerAvatar.set(id);
    try {
      localStorage.setItem(TRAINER_AVATAR_KEY, id);
    } catch {
      /* storage unavailable - keep the choice in memory for this session */
    }
  }

  private loadTrainerAvatar(): string {
    try {
      const saved = localStorage.getItem(TRAINER_AVATAR_KEY);
      if (saved && isTrainerAvatarId(saved)) return saved;
    } catch {
      /* ignore - use the default */
    }
    return DEFAULT_TRAINER_AVATAR;
  }
}
