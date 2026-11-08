import { Point, BattleStageRefs } from '../../animation.types';
import { Fx } from '../../fx';
import { FxGlyphs } from '../../fx-glyphs';

/** Colours of a water crash: splash burst edge / inner / centre, spray streaks, target flash. */
export interface SplashTone {
  outer: string;
  inner: string;
  core: string;
  spray: string;
  flash: string;
}

/** Water crashing onto a target, shared by several Water move animations. */
export class WaterCrash {
  static readonly WATERFALL: SplashTone = { outer: '#2F52F0', inner: '#6F8CFF', core: '#E8F0FF', spray: '#ffffff', flash: '#4F7BFF' };
  static readonly SURF: SplashTone = { outer: '#12357A', inner: '#3F74C8', core: '#E8F0FF', spray: '#ffffff', flash: '#5C8FE0' };
  static readonly MUD: SplashTone = { outer: '#6A3E1A', inner: '#B07A44', core: '#F4E4CC', spray: '#F4E4CC', flash: '#C08A50' };

  /**
   * Water crashing onto the target (Waterfall, Surf, Muddy Water): splash
   * bursts stack up from its feet, spray streaks shoot up and droplets fly.
   */
  static async play(refs: BattleStageRefs, target: Point, tone: SplashTone) {
    const { fieldEl, fxEl, targetEl } = refs;
    const r = Fx.rect(targetEl);
    const h = Math.max(r.height, 50);
    const base = { x: target.x, y: target.y + h * 0.35 };
    const blobs = 5;
    const done: Promise<void>[] = [];
    for (let i = 0; i < blobs; i++) {
      const size = Math.max(r.width * 0.55, 34) * (1 - i * 0.1);
      const blob = FxGlyphs.spikyBurst(size, tone.outer, tone.inner, tone.core);
      Fx.place(blob, { x: base.x + (Math.random() * 10 - 5), y: base.y - (i * h * 0.95) / blobs });
      fxEl.appendChild(blob);
      done.push(
        Fx.anim(blob, [
          { transform: 'translateY(20px) scale(.3) rotate(0)', opacity: 0 },
          { transform: 'translateY(0) scale(1.05) rotate(20deg)', opacity: 0.95, offset: 0.3 },
          { transform: 'translateY(-26px) scale(.8) rotate(35deg)', opacity: 0 }
        ], { duration: 560, easing: 'ease-out', delay: i * 55 }).then(() => blob.remove())
      );
      if (i % 2 === 0) setTimeout(() => Fx.shake(targetEl, 5), i * 55);
    }
    for (let i = 0; i < 9; i++) {
      const w = 3 + Math.random() * 4;
      const len = h * (0.5 + Math.random() * 0.6);
      const streak = document.createElement('div');
      streak.style.cssText = `position:absolute;width:${w}px;height:${len}px;border-radius:${w}px;pointer-events:none;background:linear-gradient(0deg,${tone.spray}00,${tone.spray} 50%,${tone.spray}00)`;
      Fx.place(streak, { x: target.x + (Math.random() * 2 - 1) * Math.max(r.width * 0.5, 28), y: base.y - len / 2 });
      fxEl.appendChild(streak);
      done.push(
        Fx.anim(streak, [
          { transform: 'translateY(30px) scaleY(.3)', opacity: 0 },
          { transform: 'translateY(0) scaleY(1)', opacity: 0.95, offset: 0.35 },
          { transform: `translateY(${-h * 0.6}px) scaleY(.6)`, opacity: 0 }
        ], { duration: 520, easing: 'ease-out', delay: 40 + Math.random() * 220 }).then(() => streak.remove())
      );
    }
    for (let i = 0; i < 12; i++) {
      const s = 4 + Math.random() * 5;
      const drop = document.createElement('div');
      drop.style.cssText = `position:absolute;width:${s}px;height:${s}px;border-radius:50%;pointer-events:none;background:${tone.outer};box-shadow:0 0 4px ${tone.inner}`;
      Fx.place(drop, { x: target.x + (Math.random() * 2 - 1) * r.width * 0.6, y: target.y + (Math.random() * 2 - 1) * h * 0.5 });
      fxEl.appendChild(drop);
      done.push(
        Fx.anim(drop, [
          { transform: 'translateY(0) scale(.4)', opacity: 0 },
          { transform: 'translateY(-10px) scale(1)', opacity: 1, offset: 0.3 },
          { transform: `translateY(${-30 - Math.random() * 30}px) scale(.6)`, opacity: 0 }
        ], { duration: 600, easing: 'ease-out', delay: Math.random() * 300 }).then(() => drop.remove())
      );
    }
    Fx.flash(targetEl, tone.flash, 0.7);
    Fx.shakeField(fieldEl, 0.4);
    await Promise.all(done);
  }
}
