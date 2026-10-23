import { Injectable, effect, inject } from '@angular/core';
import { SettingsService } from './settings.service';

/** Special-fight music: arena_gen<N>.mp3 (gym leaders), elite4_gen<N>.mp3 (Elite Four). */
export type BattleMusicTheme = 'arena' | 'elite4';

const MUSIC_GENS = [1, 2, 3, 4, 5, 6];

/** Battle themes under assets/sounds/music/; one is picked at random per normal battle. */
const BATTLE_TRACKS = MUSIC_GENS.map((g) => `battle_gen${g}`);

/** Every track under assets/sounds/music/ (the browser can't list the folder). */
export const MUSIC_TRACKS: readonly string[] = [
  ...BATTLE_TRACKS,
  ...MUSIC_GENS.map((g) => `arena_gen${g}`),
  ...MUSIC_GENS.map((g) => `elite4_gen${g}`)
];

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

  /**
   * Start a battle theme on loop, replacing any track already playing.
   * With a `theme` (gym leader / Elite Four fight) the generation's
   * `<theme>_gen<N>` track is tried first, then `battle_gen<N>`, then a random
   * battle theme - each step only taken if the previous file fails to load.
   * Without one, a random battle theme plays.
   */
  startBattleMusic(special?: { theme: BattleMusicTheme; gen: number }): void {
    this.stopBattleMusic();
    const random = BATTLE_TRACKS[Math.floor(Math.random() * BATTLE_TRACKS.length)];
    const tracks = special
      ? [`${special.theme}_gen${special.gen}`, `battle_gen${special.gen}`, random]
      : [random];
    this.playMusic(tracks);
  }

  /** Loop one specific track (a {@link MUSIC_TRACKS} name), replacing any track already playing. */
  playMusicTrack(track: string): void {
    this.stopBattleMusic();
    this.playMusic([track]);
  }

  /** Loop the first track of `tracks` that loads, moving on when a file is missing. */
  private playMusic(tracks: string[]): void {
    const [track, ...rest] = tracks;
    if (!track) return;
    const audio = new Audio(`assets/sounds/music/${track}.mp3`);
    audio.loop = true;
    audio.volume = this.settings.musicVolume();
    audio.addEventListener('error', () => {
      if (this.music === audio) this.playMusic(rest);
    });
    this.music = audio;
    audio.play().catch(() => {
      /* autoplay blocked or file missing - a missing file is handled by the error listener */
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
