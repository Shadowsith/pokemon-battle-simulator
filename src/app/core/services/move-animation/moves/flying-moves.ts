import { Point, BattleStageRefs, MoveVisual, MoveAnimRegistry } from '../animation.types';
import { Fx } from '../fx';
import { FxGlyphs } from '../fx-glyphs';
import { FxEffects } from '../fx-effects';

/** Hand-made animations for Flying-type moves. */
export class FlyingMoveAnimations {
  /** Hand-made Flying move animations, by @pkmn/sim move id. */
  static readonly anims: MoveAnimRegistry = {
    aeroblast: (refs, launch, target, v) => FlyingMoveAnimations.playAeroblast(refs, launch, target, v),
    drillpeck: (refs, _launch, target, v) => FlyingMoveAnimations.playDrillPeck(refs, target, v),
    fly: (refs, _launch, target) => FlyingMoveAnimations.playFlyDown(refs, target),
    skyattack: (refs, launch, target) => FlyingMoveAnimations.playSkyAttack(refs, launch, target)
  };

  /** Turn-1 animations of two-turn Flying moves, by @pkmn/sim move id. */
  static readonly chargeAnims: MoveAnimRegistry = {
    fly: (refs, launch) => FlyingMoveAnimations.playFlyUp(refs, launch),
    skyattack: (refs, launch) => FlyingMoveAnimations.playSkyAttackCharge(refs, launch)
  };

  /**
   * Aeroblast: a cyan vortex swirls up behind the battle while streams of air
   * gather into a white-blue orb in front of the caster; then the orb fires a
   * coiling beam of air rings into the target.
   */
  private static async playAeroblast(refs: BattleStageRefs, launch: Point, target: Point, v: MoveVisual) {
    const { fieldEl, fxEl, launchEl, targetEl } = refs;
    const field = fieldEl.getBoundingClientRect();
    const lr = launchEl.getBoundingClientRect();
    const orbAt: Point = { x: launch.x + v.dir * Math.max(lr.width * 0.45, 36), y: launch.y };

    // Cyan vortex backdrop, turning slowly round the orb (0-0.3 s fade in).
    const bg = Fx.backdrop(fieldEl, 'background:#5CCFE0');
    const reach = Math.hypot(field.width, field.height);
    const swirl = document.createElement('div');
    swirl.style.cssText =
      `position:absolute;left:${orbAt.x - reach}px;top:${orbAt.y - reach}px;width:${reach * 2}px;height:${reach * 2}px;` +
      'background:repeating-radial-gradient(circle,#ffffff33 0 5px,#ffffff00 5px 26px),' +
      'repeating-conic-gradient(from 0deg,#8FE6F2 0 14deg,#3FBCD6 14deg 30deg,#6AD8EA 30deg 45deg)';
    bg.appendChild(swirl);
    swirl.animate([{ transform: 'rotate(0deg)' }, { transform: 'rotate(-120deg)' }], { duration: 2600, easing: 'linear' });
    await Fx.anim(bg, [{ opacity: 0 }, { opacity: 1 }], { duration: 300, easing: 'ease-out', fill: 'forwards' });

    // 1. Air gathers into the orb (0.3-1.2 s).
    const orbSize = Math.max(lr.height * 0.5, 40);
    const orb = document.createElement('div');
    orb.style.cssText = `position:absolute;width:${orbSize}px;height:${orbSize}px;border-radius:50%;pointer-events:none;background:radial-gradient(circle,#fff 0 25%,#DFF6FF 45%,#8FD8F0aa 65%,#5CCFE000 75%);box-shadow:0 0 18px #ffffff`;
    Fx.place(orb, orbAt);
    fxEl.appendChild(orb);
    const rings = [0, 1].map((i) => {
      const ring = document.createElement('div');
      ring.style.cssText = `position:absolute;width:${orbSize * 1.3}px;height:${orbSize * 0.45}px;border-radius:50%;pointer-events:none;border:2.5px solid #F0FBFFdd;box-shadow:0 0 6px #BFEFFF`;
      Fx.place(ring, orbAt);
      fxEl.appendChild(ring);
      ring.animate([{ transform: `rotate(${i * 90}deg)` }, { transform: `rotate(${i * 90 + 360}deg)` }], { duration: 700, iterations: Infinity });
      return ring;
    });
    Fx.anim(orb, [{ transform: 'scale(0)' }, { transform: 'scale(1)' }], { duration: 900, easing: 'ease-in', fill: 'forwards' });
    rings.forEach((ring) => Fx.anim(ring, [{ opacity: 0 }, { opacity: 1 }], { duration: 900, easing: 'ease-in', fill: 'forwards' }));
    const gather: Promise<void>[] = [];
    for (let i = 0; i < 16; i++) {
      const ang = Math.random() * Math.PI * 2;
      const d = orbSize * (1.6 + Math.random() * 1.2);
      const len = 18 + Math.random() * 16;
      const streak = document.createElement('div');
      streak.style.cssText = `position:absolute;width:${len}px;height:3px;border-radius:3px;pointer-events:none;background:linear-gradient(90deg,#ffffff00,#ffffff);box-shadow:0 0 4px #BFEFFF`;
      Fx.place(streak, orbAt);
      fxEl.appendChild(streak);
      const deg = (ang * 180) / Math.PI;
      // Each streak spirals inward along its own line, pointing at the orb.
      gather.push(
        Fx.anim(streak, [
          { transform: `rotate(${deg}deg) translateX(${-d}px)`, opacity: 0 },
          { transform: `rotate(${deg + 25}deg) translateX(${-d * 0.5}px)`, opacity: 1, offset: 0.5 },
          { transform: `rotate(${deg + 50}deg) translateX(${-orbSize * 0.2}px) scaleX(.3)`, opacity: 0 }
        ], { duration: 450, easing: 'ease-in', delay: Math.random() * 450 }).then(() => streak.remove())
      );
    }
    await Promise.all([...gather, Fx.wait(900)]);

    // 2. The coiling air beam (1.2-~2.1 s): rings stream from the orb into the target.
    const dx = target.x - orbAt.x;
    const dy = target.y - orbAt.y;
    const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
    const count = 22;
    const gap = 26;
    const travel = 300;
    const flights: Promise<void>[] = [];
    for (let i = 0; i < count; i++) {
      const ring = document.createElement('div');
      ring.style.cssText = `position:absolute;width:16px;height:${orbSize * 0.9}px;border-radius:50%;pointer-events:none;border:2.5px solid #ffffffee;background:radial-gradient(ellipse,#ffffff00 45%,#BFEFFF55);box-shadow:0 0 8px #BFEFFF`;
      Fx.place(ring, orbAt);
      fxEl.appendChild(ring);
      const tilt = (i % 4) * 12 - 18; // the coil: each ring leans a little differently
      flights.push(
        Fx.anim(ring, [
          { transform: `translate(0,0) rotate(${angle + tilt}deg) scale(.5)`, opacity: 0 },
          { transform: `translate(${dx * 0.15}px,${dy * 0.15}px) rotate(${angle + tilt}deg) scale(.7)`, opacity: 0.95, offset: 0.15 },
          { transform: `translate(${dx}px,${dy}px) rotate(${angle + tilt}deg) scale(1.5)`, opacity: 0.2 }
        ], { duration: travel, easing: 'linear', delay: i * gap }).then(() => {
          ring.remove();
          if (i % 5 === 0) {
            Fx.flash(targetEl, '#DFF6FF', 0.6);
            Fx.shake(targetEl, 5);
          }
        })
      );
    }
    // The orb shrinks as it fires.
    const orbDone = Fx.anim(orb, [{ transform: 'scale(1)', opacity: 1 }, { transform: 'scale(.4)', opacity: 0 }], {
      duration: count * gap,
      easing: 'ease-in'
    }).then(() => {
      orb.remove();
      rings.forEach((ring) => ring.remove());
    });
    rings.forEach((ring) => Fx.anim(ring, [{ opacity: 1 }, { opacity: 0 }], { duration: count * gap, easing: 'ease-in', fill: 'forwards' }));
    await Promise.all([...flights, orbDone]);
    Fx.flash(targetEl, '#ffffff', 0.7);
    await Fx.wait(200);

    await Fx.anim(bg, [{ opacity: 1 }, { opacity: 0 }], { duration: 350, easing: 'ease-in' });
    bg.remove();
  }

  /** A glowing blue light orb with a white core (Sky Attack). */
  private static blueOrb(size: number): HTMLElement {
    const orb = document.createElement('div');
    orb.style.cssText = `position:absolute;width:${size}px;height:${size}px;border-radius:50%;pointer-events:none;background:radial-gradient(circle,#fff 0 18%,#9DB8FF 40%,#3C5CFF 65%,#2A3CFF00);box-shadow:0 0 ${size * 0.6}px #4D6BFF`;
    return orb;
  }

  /**
   * Sky Attack, turn 1: the scene turns very dark, blue lights twinkle all
   * over the caster as it charges, then it glows white for a moment.
   */
  private static async playSkyAttackCharge(refs: BattleStageRefs, launch: Point) {
    const { fieldEl, fxEl, launchEl } = refs;
    const dim = Fx.backdrop(fieldEl, 'background:radial-gradient(circle at 50% 45%,#232A3C,#0C0F18)');
    await Fx.anim(dim, [{ opacity: 0 }, { opacity: 0.92 }], { duration: 300, easing: 'ease-out', fill: 'forwards' });

    const r = launchEl.getBoundingClientRect();
    const rx = Math.max(r.width * 0.5, 32);
    const ry = Math.max(r.height * 0.5, 32);
    const lights: Promise<void>[] = [];
    for (let i = 0; i < 18; i++) {
      const orb = FlyingMoveAnimations.blueOrb(8 + Math.random() * 10);
      const off = { x: (Math.random() * 2 - 1) * rx, y: (Math.random() * 2 - 1) * ry };
      Fx.place(orb, { x: launch.x + off.x, y: launch.y + off.y });
      fxEl.appendChild(orb);
      // Each light flares up, then drifts a little toward the caster's centre.
      lights.push(
        Fx.anim(orb, [
          { transform: 'translate(0,0) scale(0)', opacity: 0 },
          { transform: 'translate(0,0) scale(1.2)', opacity: 1, offset: 0.35 },
          { transform: `translate(${-off.x * 0.4}px,${-off.y * 0.4}px) scale(.4)`, opacity: 0 }
        ], { duration: 650, easing: 'ease-out', delay: Math.random() * 800 }).then(() => orb.remove())
      );
    }
    await Promise.all(lights);

    await Fx.anim(launchEl, [
      { filter: 'brightness(1)' },
      { filter: 'brightness(2.4) drop-shadow(0 0 12px #ffffff)', offset: 0.4 },
      { filter: 'brightness(1)' }
    ], { duration: 450, easing: 'ease-out', fill: 'none' });

    await Fx.anim(dim, [{ opacity: 0.92 }, { opacity: 0 }], { duration: 300, easing: 'ease-in' });
    dim.remove();
  }

  /**
   * Sky Attack, turn 2: a bright blue sky fills the background with blue
   * streaks racing left along its top and bottom edges; a sparkling blue
   * cloud of light shoots from the caster into the target. On the hit the
   * scene goes black while the blue light bursts on the target.
   */
  private static async playSkyAttack(refs: BattleStageRefs, launch: Point, target: Point) {
    const { fieldEl, fxEl, targetEl } = refs;
    const sky = Fx.backdrop(fieldEl, 'background:linear-gradient(180deg,#1E8FE8,#5CC4FF 30%,#7FD6FF 50%,#5CC4FF 70%,#1E8FE8)');
    await Fx.anim(sky, [{ opacity: 0 }, { opacity: 1 }], { duration: 250, easing: 'ease-out' });
    const streaks = FlyingMoveAnimations.edgeStreaks(sky, 1100);

    // A cluster of blue lights and white stars races to the target.
    await Fx.wait(250);
    const dx = target.x - launch.x;
    const dy = target.y - launch.y;
    const travel = 380;
    const flight: Promise<void>[] = [];
    for (let i = 0; i < 12; i++) {
      const el = i % 3 ? FlyingMoveAnimations.blueOrb(14 + Math.random() * 16) : FxGlyphs.sparkStar(12 + Math.random() * 8, '#BFD0FF');
      Fx.place(el, { x: launch.x + (Math.random() * 2 - 1) * 14, y: launch.y + (Math.random() * 2 - 1) * 14 });
      fxEl.appendChild(el);
      flight.push(
        Fx.anim(el, [
          { transform: 'translate(0,0) scale(.6)', opacity: 0 },
          { transform: `translate(${dx * 0.1}px,${dy * 0.1}px) scale(1)`, opacity: 1, offset: 0.1 },
          { transform: `translate(${dx}px,${dy}px) scale(1.1)`, opacity: 1 }
        ], { duration: travel, easing: 'ease-in', delay: Math.random() * 90 }).then(() => el.remove())
      );
    }
    await Promise.all(flight);

    // Hit: the scene goes black, blue light bursts on the target, it blinks.
    // On top of the sky (and its streaks), still behind platforms and sprites.
    const black = document.createElement('div');
    black.style.cssText = 'position:absolute;inset:0;background:#000';
    sky.appendChild(black);
    Fx.anim(black, [{ opacity: 0 }, { opacity: 1 }], { duration: 120, easing: 'ease-out', fill: 'forwards' });
    const r = targetEl.getBoundingClientRect();
    const rad = Math.max(r.width * 0.45, 34);
    const burst: Promise<void>[] = [];
    for (let i = 0; i < 14; i++) {
      const el = i % 3 ? FlyingMoveAnimations.blueOrb(16 + Math.random() * 18) : FxGlyphs.sparkStar(16 + Math.random() * 10, '#DCE6FF');
      Fx.place(el, { x: target.x + (Math.random() * 2 - 1) * rad * 0.4, y: target.y + (Math.random() * 2 - 1) * rad * 0.4 });
      fxEl.appendChild(el);
      const ang = Math.random() * Math.PI * 2;
      const d = rad * (0.4 + Math.random() * 0.6);
      burst.push(
        Fx.anim(el, [
          { transform: 'translate(0,0) scale(.4)', opacity: 1 },
          { transform: `translate(${Math.cos(ang) * d}px,${Math.sin(ang) * d}px) scale(1.2)`, opacity: 1, offset: 0.5 },
          { transform: `translate(${Math.cos(ang) * d * 1.2}px,${Math.sin(ang) * d * 1.2}px) scale(.6)`, opacity: 0 }
        ], { duration: 650, easing: 'ease-out', delay: Math.random() * 120 }).then(() => el.remove())
      );
    }
    Fx.shakeField(fieldEl, 0.6);
    await Promise.all([Fx.blink(targetEl), ...burst, streaks]);

    await Fx.anim(sky, [{ opacity: 1 }, { opacity: 0 }], { duration: 350, easing: 'ease-in' });
    sky.remove();
  }

  /** Blue streaks race leftward along the top and bottom edges of `layer` for `duration` ms. */
  private static edgeStreaks(layer: HTMLElement, duration: number): Promise<void> {
    const { width, height } = layer.getBoundingClientRect();
    const runs: Promise<void>[] = [];
    const count = 26;
    for (let i = 0; i < count; i++) {
      const len = 40 + Math.random() * 60;
      const h = 4 + Math.random() * 4;
      const top = i % 2 ? Math.random() * height * 0.16 : height * (0.84 + Math.random() * 0.14);
      const streak = document.createElement('div');
      streak.style.cssText = `position:absolute;left:0;top:${top}px;width:${len}px;height:${h}px;border-radius:${h}px;pointer-events:none;background:linear-gradient(90deg,#E8F6FF,#2E7FE0 60%,#2E7FE000)`;
      layer.appendChild(streak);
      const travel = 350 + Math.random() * 200;
      runs.push(
        Fx.anim(streak, [
          { transform: `translateX(${width}px)` },
          { transform: `translateX(${-len}px)` }
        ], { duration: travel, easing: 'linear', delay: (i / count) * (duration - travel) }).then(() => streak.remove())
      );
    }
    return Promise.all(runs).then(() => void 0);
  }

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
