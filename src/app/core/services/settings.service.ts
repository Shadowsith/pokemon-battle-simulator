import { Injectable, signal } from '@angular/core';
import { DEFAULT_TRAINER_AVATAR, isTrainerAvatarId } from '../models/trainer.model';

const TRAINER_AVATAR_KEY = 'pbs.settings.trainerAvatar';
const VOLUME_KEY = 'pbs.settings.volume';
const DEFAULT_VOLUME = 0.5;

/**
 * Player-facing preferences that outlive a single battle. Persisted to
 * localStorage; falls back to in-memory only when storage is unavailable
 * (private browsing, embedded webviews).
 */
@Injectable({ providedIn: 'root' })
export class SettingsService {
  private readonly _trainerAvatar = signal<string>(this.loadTrainerAvatar());
  private readonly _volume = signal<number>(this.loadVolume());

  /** Showdown sprite id of the player's chosen trainer avatar. */
  readonly trainerAvatar = this._trainerAvatar.asReadonly();

  /** Base volume (0-1) for sound effects and cries. */
  readonly volume = this._volume.asReadonly();

  setVolume(value: number): void {
    const clamped = Math.max(0, Math.min(1, value));
    this._volume.set(clamped);
    try {
      localStorage.setItem(VOLUME_KEY, String(clamped));
    } catch {
      /* storage unavailable - keep the choice in memory for this session */
    }
  }

  private loadVolume(): number {
    try {
      const saved = localStorage.getItem(VOLUME_KEY);
      if (saved !== null) {
        const n = Number(saved);
        if (Number.isFinite(n) && n >= 0 && n <= 1) return n;
      }
    } catch {
      /* ignore - use the default */
    }
    return DEFAULT_VOLUME;
  }

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
