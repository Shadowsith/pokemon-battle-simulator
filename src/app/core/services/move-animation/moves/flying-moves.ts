import { Point, BattleStageRefs, MoveVisual, MoveAnimRegistry } from '../animation.types';
import { Fx } from '../fx';
import { FxGlyphs } from '../fx-glyphs';
import { FxEffects } from '../fx-effects';

/** Hand-made animations for Flying-type moves. */
export class FlyingMoveAnimations {
  /** Hand-made Flying move animations, by @pkmn/sim move id. */
  static readonly anims: MoveAnimRegistry = {
    drillpeck: (refs, _launch, target, v) => FlyingMoveAnimations.playDrillPeck(refs, target, v),
    fly: (refs, _launch, target) => FlyingMoveAnimations.playFlyDown(refs, target)
  };

  /** Turn-1 animations of two-turn Flying moves, by @pkmn/sim move id. */
  static readonly chargeAnims: MoveAnimRegistry = {
    fly: (refs, launch) => FlyingMoveAnimations.playFlyUp(refs, launch)
  };

  /**
   * Fly, turn 1: the sky backdrop rushes downward (streaks moving up), a blue
   * bubble forms around the user, which fades into it, and the bubble shoots
   * up out of the top of the screen.
   */
  static async playFlyUp(refs: BattleStageRefs, launch: Point) {
    const { launchEl: el, fieldEl, fxEl } = refs;
    el.getAnimations?.().forEach((a) => a.cancel());
    const r = el.getBoundingClientRect();
    const sky = FlyingMoveAnimations.skyBackdrop(fieldEl, 'up');
    await Fx.anim(sky, [{ opacity: 0 }, { opacity: 1 }], { duration: 250, easing: 'ease-out' });

    const size = Math.max(Math.max(r.width, r.height) * 1.05, 60);
    const bubble = document.createElement('div');
    bubble.style.cssText = `position:absolute;width:${size}px;height:${size}px;border-radius:50%;pointer-events:none;background:radial-gradient(circle at 35% 28%,#ffffffdd 0 7%,#C8F6FF 20%,#5CD6F4 62%,#2A9CD8);box-shadow:0 0 12px #A8ECFF;opacity:.92`;
    Fx.place(bubble, launch);
    fxEl.appendChild(bubble);
    Fx.anim(el, [
      { transform: 'scale(1)', opacity: 1 },
      { transform: 'scale(.6)', opacity: 0 }
    ], { duration: 300, easing: 'ease-in', fill: 'forwards' });
    await Fx.anim(bubble, [
      { transform: 'scale(0)', opacity: 0 },
      { transform: 'scale(1.1)', opacity: 0.92, offset: 0.7 },
      { transform: 'scale(1)', opacity: 0.92 }
    ], { duration: 320, easing: 'ease-out' });
    await Fx.wait(150);
    await Fx.anim(bubble, [
      { transform: 'translateY(0) scale(1,1)' },
      { transform: `translateY(${-(launch.y + size)}px) scale(.85,1.2)` }
    ], { duration: 550, easing: 'ease-in' });
    bubble.remove();
    el.style.opacity = '0';

    await Fx.wait(200);
    await Fx.anim(sky, [{ opacity: 1 }, { opacity: 0 }], { duration: 300, easing: 'ease-in' });
    sky.remove();
  }

  /**
   * Fly, turn 2: the sky backdrop returns (streaks now moving down), a white
   * glowing orb dives from above onto the target with a burst of yellow
   * sparks, then the user drops back into its place.
   */
  private static async playFlyDown(refs: BattleStageRefs, target: Point) {
    const { launchEl, fieldEl, fxEl, targetEl } = refs;
    // Away in the sky until the end (also when Power Herb skipped turn 1).
    launchEl.getAnimations?.().forEach((a) => a.cancel());
    launchEl.style.opacity = '0';
    const r = targetEl.getBoundingClientRect();
    const sky = FlyingMoveAnimations.skyBackdrop(fieldEl, 'down');
    await Fx.anim(sky, [{ opacity: 0 }, { opacity: 1 }], { duration: 250, easing: 'ease-out' });
    await Fx.wait(150);

    const size = Math.max(r.width * 0.75, 50);
    const orb = document.createElement('div');
    orb.style.cssText = `position:absolute;width:${size}px;height:${size}px;border-radius:50%;pointer-events:none;background:radial-gradient(circle,#fff 0 42%,#F2F8FFee 55%,#DCEBFF00 72%);box-shadow:0 0 ${size * 0.4}px #ffffffcc`;
    Fx.place(orb, target);
    fxEl.appendChild(orb);
    await Fx.anim(orb, [
      { transform: `translate(${-size * 0.8}px,${-(target.y + size)}px) scale(.8,1.3)`, opacity: 0.8 },
      { transform: 'translate(0,0) scale(.9,1.15)', opacity: 1 }
    ], { duration: 320, easing: 'ease-in' });

    // Hit: the orb flattens and fades, yellow sparks burst, the target blinks.
    Fx.anim(orb, [
      { transform: 'scale(1)', opacity: 1 },
      { transform: 'scale(1.5,.8)', opacity: 0 }
    ], { duration: 380, easing: 'ease-out' }).then(() => orb.remove());
    for (let i = 0; i < 10; i++) {
      const star = FxGlyphs.sparkStar(10 + Math.random() * 8, '#FFE04A');
      Fx.place(star, target);
      fxEl.appendChild(star);
      const ang = Math.random() * Math.PI * 2;
      const dist = size * (0.4 + Math.random() * 0.5);
      Fx.anim(star, [
        { transform: 'translate(0,0) scale(.3)', opacity: 1 },
        { transform: `translate(${Math.cos(ang) * dist}px,${Math.sin(ang) * dist}px) scale(1)`, opacity: 1, offset: 0.6 },
        { transform: `translate(${Math.cos(ang) * dist * 1.2}px,${Math.sin(ang) * dist * 1.2}px) scale(.4)`, opacity: 0 }
      ], { duration: 500 + Math.random() * 150, easing: 'ease-out' }).then(() => star.remove());
    }
    Fx.flash(targetEl, '#ffffff', 0.7);
    Fx.shake(targetEl, 6);
    Fx.shakeField(fieldEl, 0.5);
    await Fx.blink(targetEl);
    await Fx.wait(250);

    await Fx.anim(sky, [{ opacity: 1 }, { opacity: 0 }], { duration: 300, easing: 'ease-in' });
    sky.remove();
    await FxEffects.dropBackIn(launchEl);
  }

  /**
   * A bright blue sky backdrop (light column in the middle, deeper blue at the
   * sides) with white wind streaks endlessly rushing up or down. Remove it when done.
   */
  private static skyBackdrop(fieldEl: HTMLElement, dir: 'up' | 'down'): HTMLElement {
    const sky = Fx.backdrop(
      fieldEl,
      'background:linear-gradient(90deg,#1A56C8,#3E8CEA 22%,#A8D4FF 42%,#E4F2FF 50%,#A8D4FF 58%,#3E8CEA 78%,#1A56C8)'
    );
    const { width, height } = fieldEl.getBoundingClientRect();
    for (let i = 0; i < 26; i++) {
      const w = 5 + Math.random() * 9;
      const h = 30 + Math.random() * 50;
      const streak = document.createElement('div');
      streak.style.cssText = `position:absolute;left:${Math.random() * width}px;top:0;width:${w}px;height:${h}px;border-radius:50%;background:radial-gradient(ellipse,#ffffff,#ffffffaa 50%,#ffffff00 75%);opacity:${0.55 + Math.random() * 0.4}`;
      sky.appendChild(streak);
      const from = height + h;
      const to = -h;
      const dur = 450 + Math.random() * 450;
      streak.animate(
        [{ transform: `translateY(${dir === 'up' ? from : to}px)` }, { transform: `translateY(${dir === 'up' ? to : from}px)` }],
        // Negative delay: the streaks are already spread over the screen when it appears.
        { duration: dur, iterations: Infinity, delay: -Math.random() * dur, easing: 'linear' }
      );
    }
    return sky;
  }

  /**
   * Drill Peck: the caster steps forward, then rapid pecks land one after
   * another on different spots of the target, turning round it like a
   * revolver's cylinder. Each peck is a small yellow starburst with a puff of
   * grey dust. The target shakes the whole time; then the caster steps back.
   */
  private static async playDrillPeck(refs: BattleStageRefs, target: Point, v: MoveVisual) {
    const { launchEl, targetEl, fxEl } = refs;
    const r = targetEl.getBoundingClientRect();
    const fwd = v.dir * 30;

    // 1. Step forward.
    await Fx.anim(launchEl, [{ transform: 'translateX(0)' }, { transform: `translateX(${fwd}px)` }], {
      duration: 200,
      easing: 'ease-out'
    });

    // 2. Pecks round the target, each spot 135° on from the last.
    const pecks = 9;
    const gap = 75;
    const rad = Math.max(Math.min(r.width, r.height) * 0.28, 16);
    const start = Math.random() * Math.PI * 2;
    for (let i = 0; i < pecks; i++) {
      const a = start + i * ((Math.PI * 3) / 4);
      const at = { x: target.x + Math.cos(a) * rad, y: target.y + Math.sin(a) * rad * 0.9 };
      FlyingMoveAnimations.peckSpark(fxEl, at);
      // The caster jabs in a little with every peck.
      Fx.anim(launchEl, [
        { transform: `translateX(${fwd}px)` },
        { transform: `translateX(${fwd + v.dir * 8}px)`, offset: 0.4 },
        { transform: `translateX(${fwd}px)` }
      ], { duration: gap, easing: 'ease-out' });
      if (i % 2 === 0) Fx.shake(targetEl, 4);
      if (i % 3 === 0) Fx.flash(targetEl, '#FFF2A0', 0.35);
      await Fx.wait(gap);
    }
    await Fx.wait(150);

    // 3. Step back.
    await Fx.anim(launchEl, [{ transform: `translateX(${fwd}px)` }, { transform: 'translateX(0)' }], {
      duration: 220,
      easing: 'ease-in-out',
      fill: 'none'
    });
    launchEl.getAnimations().forEach((a) => a.cancel());
  }

  /** One peck: a small yellow starburst that pops, with grey dust spraying out. */
  private static peckSpark(fxEl: HTMLElement, at: Point) {
    const burst = document.createElement('div');
    burst.style.cssText = 'position:absolute;width:22px;height:22px;pointer-events:none;filter:drop-shadow(0 0 3px #FFE36A)';
    const shape = document.createElement('div');
    shape.style.cssText = 'width:100%;height:100%;clip-path:polygon(50% 0,58% 34%,85% 15%,66% 42%,100% 50%,66% 58%,85% 85%,58% 66%,50% 100%,42% 66%,15% 85%,34% 58%,0 50%,34% 42%,15% 15%,42% 34%);background:radial-gradient(circle,#fff,#FFE04A 55%,#F2B21A)';
    burst.appendChild(shape);
    Fx.place(burst, at);
    fxEl.appendChild(burst);
    const rot = Math.random() * 90;
    Fx.anim(burst, [
      { transform: `scale(.3) rotate(${rot}deg)`, opacity: 1 },
      { transform: `scale(1.1) rotate(${rot + 20}deg)`, opacity: 1, offset: 0.4 },
      { transform: `scale(.6) rotate(${rot + 30}deg)`, opacity: 0 }
    ], { duration: 200, easing: 'ease-out' }).then(() => burst.remove());

    for (let i = 0; i < 6; i++) {
      const s = 2 + Math.random() * 3;
      const d = document.createElement('div');
      d.style.cssText = `position:absolute;width:${s}px;height:${s}px;border-radius:50%;pointer-events:none;background:${i % 2 ? '#C8C4B8' : '#F4F0E4'}`;
      Fx.place(d, at);
      fxEl.appendChild(d);
      const ang = Math.random() * Math.PI * 2;
      const dist = 10 + Math.random() * 14;
      Fx.anim(d, [
        { transform: 'translate(0,0)', opacity: 1 },
        { transform: `translate(${Math.cos(ang) * dist}px,${Math.sin(ang) * dist}px)`, opacity: 0 }
      ], { duration: 260 + Math.random() * 120, easing: 'ease-out' }).then(() => d.remove());
    }
  }
}
