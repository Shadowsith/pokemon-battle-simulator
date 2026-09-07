import { Injectable, effect, inject } from '@angular/core';
import { SettingsService } from './settings.service';

/** Battle themes under assets/sounds/music/; one is picked at random per battle. */
const BATTLE_TRACKS = ['battle_gen1', 'battle_gen2', 'battle_gen3', 'battle_gen4', 'battle_gen5'];

/**
 * Plays move / cry / misc sound files under assets/sounds/. Move files are
 * named after the move's canonical @pkmn/sim id (e.g. "solarbeam.mp3") in
 * assets/sounds/moves/. Every clip is scaled by the base volume from
 * {@link SettingsService}. Missing files fail silently.
 *
 * Also owns the looping battle music ({@link startBattleMusic} /
 * {@link stopBattleMusic}), scaled by the separate music volume setting.
 */
@Injectable({ providedIn: 'root' })
export class AudioService {
  private readonly settings = inject(SettingsService);

  /** The currently looping battle theme, if any. */
  private music: HTMLAudioElement | null = null;

  constructor() {
    // Keep a playing track in sync with the music-volume slider.
    effect(() => {
      const v = this.settings.musicVolume();
      if (this.music) this.music.volume = v;
    });
  }

  /** Start a random battle theme on loop, replacing any track already playing. */
  startBattleMusic(): void {
    this.stopBattleMusic();
    const track = BATTLE_TRACKS[Math.floor(Math.random() * BATTLE_TRACKS.length)];
    const audio = new Audio(`assets/sounds/music/${track}.mp3`);
    audio.loop = true;
    audio.volume = this.settings.musicVolume();
    this.music = audio;
    audio.play().catch(() => {
      /* autoplay blocked before a user gesture - ignore */
    });
  }

  /** Stop and release the looping battle theme. */
  stopBattleMusic(): void {
    if (!this.music) return;
    this.music.pause();
    this.music.src = '';
    this.music = null;
  }

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

  /** The whir of a Poké Ball recalling a Pokémon to its ball. */
  playBallReturn(): void {
    this.play('assets/sounds/misc/ball_return.mp3');
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
