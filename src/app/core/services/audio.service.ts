import { Injectable, inject } from '@angular/core';
import { SettingsService } from './settings.service';

/**
 * Plays move / cry / misc sound files under assets/sounds/. Move files are
 * named after the move's canonical @pkmn/sim id (e.g. "solarbeam.mp3") in
 * assets/sounds/moves/. Every clip is scaled by the base volume from
 * {@link SettingsService}. Missing files fail silently.
 */
@Injectable({ providedIn: 'root' })
export class AudioService {
  private readonly settings = inject(SettingsService);

  playMove(showdownId?: string): void {
    if (showdownId) this.play(`assets/sounds/moves/${showdownId}.mp3`);
  }

  /**
   * A Pokémon's cry. When `faint` is set the cry is slowed and pitched down
   * for the classic "wound-down" fainting sound.
   */
  playCry(dexId: number, faint = false): void {
    this.play(`assets/sounds/cries/${dexId}.mp3`, faint);
  }

  /** The pop of a Poké Ball springing open as a Pokémon is released. */
  playBallOpen(): void {
    this.play('assets/sounds/misc/ball_open.mp3');
  }

  /**
   * Impact sound keyed by the type-effectiveness multiplier:
   * `> 1` super effective, `< 1` not very effective, `1` normal, `0` (immune) silent.
   */
  playHit(effectiveness: number): void {
    const file =
      effectiveness > 1
        ? 'hit-super-effective'
        : effectiveness > 0 && effectiveness < 1
          ? 'hit-weak-not-very-effective'
          : effectiveness === 1
            ? 'hit-normal-damage'
            : null;
    if (file) this.play(`assets/sounds/moves/${file}.mp3`);
  }

  private play(src: string, faint = false): void {
    const audio = new Audio(src);
    audio.volume = this.settings.volume();
    if (faint) {
      audio.playbackRate = 0.55;
      (audio as HTMLAudioElement & { preservesPitch: boolean }).preservesPitch = false;
    }
    audio.play().catch(() => {
      /* file missing or autoplay blocked before a user gesture - ignore */
    });
  }
}
