import { Injectable, signal } from '@angular/core';
import { DEFAULT_TRAINER_AVATAR, isTrainerAvatarId } from '../models/trainer.model';

const TRAINER_AVATAR_KEY = 'pbs.settings.trainerAvatar';
const VOLUME_KEY = 'pbs.settings.volume';
const MUSIC_VOLUME_KEY = 'pbs.settings.musicVolume';
const ALLOW_LEGENDARIES_KEY = 'pbs.settings.allowLegendaries';
const DEFAULT_VOLUME = 0.5;

/**
 * Player-facing preferences that outlive a single battle. Persisted to
 * localStorage; falls back to in-memory only when storage is unavailable
 * (private browsing, embedded webviews).
 */
@Injectable({ providedIn: 'root' })
export class SettingsService {
  private readonly _trainerAvatar = signal<string>(this.loadTrainerAvatar());
  private readonly _volume = signal<number>(this.loadVolume(VOLUME_KEY));
  private readonly _musicVolume = signal<number>(this.loadVolume(MUSIC_VOLUME_KEY));
  private readonly _allowLegendaries = signal<boolean>(this.loadFlag(ALLOW_LEGENDARIES_KEY, true));

  /** Showdown sprite id of the player's chosen trainer avatar. */
  readonly trainerAvatar = this._trainerAvatar.asReadonly();

  /** Base volume (0-1) for sound effects and cries. */
  readonly volume = this._volume.asReadonly();

  /** Volume (0-1) for the looping battle music. */
  readonly musicVolume = this._musicVolume.asReadonly();

  /** Whether the random NPC opponent may field Legendary / Mythical Pokémon. */
  readonly allowLegendaries = this._allowLegendaries.asReadonly();

  setAllowLegendaries(value: boolean): void {
    this._allowLegendaries.set(value);
    try {
      localStorage.setItem(ALLOW_LEGENDARIES_KEY, value ? '1' : '0');
    } catch {
      /* storage unavailable - keep the choice in memory for this session */
    }
  }

  private loadFlag(key: string, fallback: boolean): boolean {
    try {
      const saved = localStorage.getItem(key);
      if (saved !== null) return saved === '1' || saved === 'true';
    } catch {
      /* ignore - use the default */
    }
    return fallback;
  }

  setVolume(value: number): void {
    this._volume.set(this.persistVolume(VOLUME_KEY, value));
  }

  setMusicVolume(value: number): void {
    this._musicVolume.set(this.persistVolume(MUSIC_VOLUME_KEY, value));
  }

  private persistVolume(key: string, value: number): number {
    const clamped = Math.max(0, Math.min(1, value));
    try {
      localStorage.setItem(key, String(clamped));
    } catch {
      /* storage unavailable - keep the choice in memory for this session */
    }
    return clamped;
  }

  private loadVolume(key: string): number {
    try {
      const saved = localStorage.getItem(key);
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
