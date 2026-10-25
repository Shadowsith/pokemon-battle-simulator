import { Injectable } from '@angular/core';
import { Slot, slotKey } from '../../../core/battle/battle-format';

/**
 * The battle page's DOM as seen by the battle logic: the field and effect
 * layers, each slot's sprite, and the pacing timer. Provided by the battle
 * page, which attaches its elements on init.
 */
@Injectable()
export class BattleStageService {
  private fieldNode: HTMLElement | null = null;
  private fxNode: HTMLElement | null = null;
  private screenFxNode: HTMLElement | null = null;

  attach(field: HTMLElement, fx: HTMLElement, screenFx: HTMLElement): void {
    this.fieldNode = field;
    this.fxNode = fx;
    this.screenFxNode = screenFx;
  }

  get fieldEl(): HTMLElement {
    return this.fieldNode!;
  }

  get fxEl(): HTMLElement {
    return this.fxNode!;
  }

  spriteEl(slot: Slot): HTMLElement {
    const el = this.fieldEl.querySelector<HTMLElement>(`[data-slot="${slotKey(slot)}"]`);
    return el ?? this.fieldEl;
  }

  /** Element refs for a move animation from `user` to `target`. */
  refsFor(user: Slot, target: Slot) {
    return {
      fieldEl: this.fieldEl,
      fxEl: this.fxEl,
      screenFxEl: this.screenFxNode!,
      launchEl: this.spriteEl(user),
      targetEl: this.spriteEl(target)
    };
  }

  /** Cancel running sprite animations and clear inline styles left by faints / send-outs. */
  resetSprites(): void {
    for (const el of Array.from(this.fieldNode?.querySelectorAll<HTMLElement>('.sprite') ?? [])) {
      el.getAnimations?.().forEach((a) => a.cancel());
      el.style.opacity = '';
      el.style.transform = '';
      el.style.filter = '';
    }
  }

  wait(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
