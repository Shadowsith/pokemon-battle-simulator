import { Injectable } from '@angular/core';

/**
 * Plays sound files you supply yourself under assets/sounds/{id}.mp3.
 * Missing files fail silently so animation testing works before you've
 * dropped in your own sound set.
 */
@Injectable({ providedIn: 'root' })
export class AudioService {
  play(soundId?: string): void {
    if (!soundId) return;
    const audio = new Audio(`assets/sounds/${soundId}.mp3`);
    audio.play().catch(() => {
      /* file not present yet - ignore during animation testing */
    });
  }

  playCry(dexId: number): void {
    const audio = new Audio(`assets/sounds/cries/${dexId}.mp3`);
    audio.play().catch(() => {});
  }
}
