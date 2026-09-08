import { Injectable } from '@angular/core';
import { BattleScene, StoryOpponent } from '../models/story.model';

/** A story battle waiting to be played on the battle screen. */
export interface PendingStoryBattle {
  opponent: StoryOpponent;
  introText?: string;
  /** The originating scene, so the battle screen can route the outcome. */
  scene: BattleScene;
}

/**
 * One-shot channel from the story runner to the battle screen. The runner
 * {@link set}s a pending battle and navigates to `/battle`; the battle screen
 * {@link take}s it in its constructor. Kept separate from
 * {@link StoryProgressService} so the battle screen depends only on this.
 */
@Injectable({ providedIn: 'root' })
export class BattleHandoffService {
  private pending: PendingStoryBattle | null = null;

  set(battle: PendingStoryBattle): void {
    this.pending = battle;
  }

  /** Returns the pending battle and clears it. */
  take(): PendingStoryBattle | null {
    const b = this.pending;
    this.pending = null;
    return b;
  }

  peek(): PendingStoryBattle | null {
    return this.pending;
  }
}
