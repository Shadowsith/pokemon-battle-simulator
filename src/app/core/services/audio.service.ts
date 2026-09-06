import { Injectable } from '@angular/core';

/**
 * Plays move/cry sound files under assets/sounds/. Move sound files are
 * named after the move's canonical @pkmn/sim id (showdownId), e.g.
 * "solarbeam.mp3", and live in assets/sounds/moves/ (see
 * scripts/rename-move-sounds.mjs). Missing files fail silently so animation
 * testing works before a sound set exists.
 */
@Injectable({ providedIn: 'root' })
export class AudioService {
  playMove(showdownId?: string): void {
    if (!showdownId) return;
    const audio = new Audio(`assets/sounds/moves/${showdownId}.mp3`);
    audio.play().catch(() => {
      /* file not present yet - ignore during animation testing */
    });
  }

  playCry(dexId: number): void {
    const audio = new Audio(`assets/sounds/cries/${dexId}.mp3`);
    audio.play().catch(() => {});
  }
}
