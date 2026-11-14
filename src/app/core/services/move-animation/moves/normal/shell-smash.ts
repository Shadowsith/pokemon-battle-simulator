import { Point, BattleStageRefs } from '../../animation.types';
import { Fx } from '../../fx';
import { FxEffects } from '../../fx-effects';

/**
 * Shell Smash, after the Gen 5 animation:
 * - Gen 5: https://www.pokewiki.de/images/d/dc/Hausbruch_Gen5.png
 *
 * The user squashes down three times with a crunch, white shell shards
 * flying off each time (0-0.6 s). Its defences drop: blue bubbles drift
 * down over it (0.6-1.5 s). Then its attacks rise: the orange stat-up aura
 * (1.5-2.3 s).
 */
export class ShellSmash {
  static async play(refs: BattleStageRefs, launch: Point) {
    const { fxEl, fieldEl, launchEl } = refs;
    const lr = Fx.rect(launchEl);
    const original = launchEl.style.transform;
    const shards: Promise<void>[] = [];

    for (let crack = 0; crack < 3; crack++) {
      const squash = Fx.anim(launchEl, [
        { transform: `${original} scale(1,1)`, transformOrigin: 'center bottom' },
        { transform: `${original} scale(1.08,.86)`, transformOrigin: 'center bottom', offset: 0.4 },
        { transform: `${original} scale(1,1)`, transformOrigin: 'center bottom' }
      ], { duration: 200, easing: 'ease-out', fill: 'none' });
      for (let i = 0; i < 5; i++) shards.push(ShellSmash.shard(fxEl, launch, lr.width, lr.height));
      if (crack === 2) Fx.shakeField(fieldEl, 0.4);
      await squash;
    }

    await FxEffects.statDownBubbles(refs, launch);
    await FxEffects.statUpAura(refs, launch);
    await Promise.all(shards);
  }

  /** One white shell shard bursting off the user and falling. */
  private static shard(fxEl: HTMLElement, launch: Point, w: number, h: number): Promise<void> {
    const el = document.createElement('div');
    const s = 6 + Math.random() * 6;
    el.style.cssText =
      `width:${s}px;height:${s * 0.8}px;pointer-events:none;clip-path:polygon(0 30%,55% 0,100% 45%,70% 100%,15% 85%);` +
      'background:linear-gradient(135deg,#FFFFFF,#C8CED8)';
    Fx.place(el, { x: launch.x + (Math.random() * 2 - 1) * w * 0.3, y: launch.y + (Math.random() * 2 - 1) * h * 0.25 });
    fxEl.appendChild(el);
    const ang = Math.random() * Math.PI * 2;
    const d = Math.max(w, 50) * (0.4 + Math.random() * 0.3);
    return Fx.anim(el, [
      { transform: 'translate(0,0) rotate(0deg)', opacity: 1 },
      { transform: `translate(${Math.cos(ang) * d}px,${Math.sin(ang) * d * 0.6 - 10}px) rotate(200deg)`, opacity: 1, offset: 0.55 },
      { transform: `translate(${Math.cos(ang) * d * 1.2}px,${Math.sin(ang) * d * 0.6 + 20}px) rotate(320deg)`, opacity: 0 }
    ], { duration: 550, easing: 'ease-out' }).then(() => el.remove());
  }
}
