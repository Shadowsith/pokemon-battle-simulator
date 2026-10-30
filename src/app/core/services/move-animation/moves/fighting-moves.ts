import { Point, BattleStageRefs, MoveVisual, MoveAnimRegistry } from '../animation.types';
import { DIM_BACKDROP } from '../animation.constants';
import { Fx } from '../fx';
import { FxGlyphs } from '../fx-glyphs';
import { FxEffects } from '../fx-effects';

/** Hand-made animations for Fighting-type moves. */
export class FightingMoveAnimations {
  /** Hand-made Fighting move animations, by @pkmn/sim move id. */
  static readonly anims: MoveAnimRegistry = {
    crosschop: (refs, _launch, target) => FightingMoveAnimations.playCrossChop(refs, target),
    detect: (refs, launch) => FightingMoveAnimations.playDetect(refs, launch),
    dynamicpunch: (refs, _launch, target) => FightingMoveAnimations.playDynamicPunch(refs, target),
    highjumpkick: (refs, _launch, target, v) => FightingMoveAnimations.playHighJumpKick(refs, target, v),
    jumpkick: (refs, launch, target) => FightingMoveAnimations.playJumpKick(refs, launch, target),
    lowkick: (refs, _launch, target) => FightingMoveAnimations.playLowKick(refs, target),
    seismictoss: (refs, _launch, target) => FightingMoveAnimations.playSeismicToss(refs, target),
    submission: (refs, _launch, target) => FightingMoveAnimations.playSubmission(refs, target)
  };

  /**
   * Submission: caster and target tumble together - both run two laps round
   * a small counter-clockwise circle - while four quick yellow hits land on
   * the target; then dust swirls up around it.
   */
  private static async playSubmission(refs: BattleStageRefs, target: Point) {
    const { fieldEl, fxEl, launchEl, targetEl } = refs;
    const r = targetEl.getBoundingClientRect();
    const roll = Promise.all([FxEffects.orbit(launchEl, 16, 2, 1200, 1), FxEffects.orbit(targetEl, 16, 2, 1200, 1)]);

    // Hits at 0.25 / 0.5 / 0.75 / 1.0 s while they roll.
    const hits: Promise<void>[] = [];
    for (let i = 0; i < 4; i++) {
      hits.push(
        Fx.wait(250 + i * 250).then(() => {
          const star = FxGlyphs.spikyBurst(Math.max(r.width * 0.3, 28), '#FFD83A', '#FFF3A0', '#ffffff');
          Fx.place(star, {
            x: target.x + (Math.random() * 2 - 1) * r.width * 0.25,
            y: target.y - r.height * (0.05 + Math.random() * 0.25)
          });
          fxEl.appendChild(star);
          Fx.flash(targetEl, '#FFE04A', 0.4);
          return Fx.anim(star, [
            { transform: 'scale(.3)', opacity: 1 },
            { transform: 'scale(1.1)', opacity: 1, offset: 0.4 },
            { transform: 'scale(.9)', opacity: 0 }
          ], { duration: 260, easing: 'ease-out' }).then(() => star.remove());
        })
      );
    }
    await Promise.all([roll, ...hits]);

    // Dust: grey-brown puffs swirl round the target's feet, swell and fade.
    const f = fieldEl.getBoundingClientRect();
    const foot = { x: target.x, y: r.bottom - f.top - r.height * 0.15 };
    const rx = Math.max(r.width * 0.4, 30);
    const puffs: Promise<void>[] = [];
    for (let i = 0; i < 10; i++) {
      const s = 18 + Math.random() * 16;
      const puff = document.createElement('div');
      puff.style.cssText = `position:absolute;width:${s}px;height:${s}px;border-radius:50%;pointer-events:none;background:radial-gradient(circle,#D8CBB0cc,#A8987Aaa 50%,#8A7A5C00 72%)`;
      Fx.place(puff, foot);
      fxEl.appendChild(puff);
      const a0 = (i / 10) * Math.PI * 2;
      const frames: Keyframe[] = [];
      for (let k = 0; k <= 6; k++) {
        const t = k / 6;
        // Counter-clockwise on screen, rising a little as it spreads.
        const a = a0 - t * Math.PI * 1.2;
        const d = rx * (0.4 + t * 0.7);
        frames.push({
          transform: `translate(${Math.cos(a) * d}px,${Math.sin(a) * d * 0.35 - t * r.height * 0.35}px) scale(${0.5 + t})`,
          opacity: k === 0 ? 0 : k === 6 ? 0 : 0.9
        });
      }
      puffs.push(Fx.anim(puff, frames, { duration: 700, easing: 'ease-out', delay: Math.random() * 120 }).then(() => puff.remove()));
    }
    Fx.shake(targetEl, 3);
    await Promise.all(puffs);
  }

  /**
   * High Jump Kick: the caster darts forward and back, then jagged comic-style
   * impact bursts - a big red one, a yellow-orange one over it, then a
   * smaller one - pop on the target while red specks scatter.
   */
  private static async playHighJumpKick(refs: BattleStageRefs, target: Point, v: MoveVisual) {
    const { launchEl, targetEl, fieldEl, fxEl } = refs;
    const r = targetEl.getBoundingClientRect();
    const size = Math.max(r.width * 0.9, 64);

    await FxEffects.dart(launchEl, v.dir);

    // [x offset, y offset, size factor, outer colour, inner colour, delay]
    const bursts: [number, number, number, string, string, number][] = [
      [-0.15, -0.1, 1, '#E8281C', '#FF6A2A', 0],
      [0.18, 0.08, 0.85, '#FF9A1A', '#FFE84A', 70],
      [-0.05, 0.22, 0.55, '#E8281C', '#FFB02A', 150]
    ];
    const pops = bursts.map(([ox, oy, f, outer, inner, delay]) =>
      Fx.wait(delay).then(() => {
        const s = size * f;
        const el = FxGlyphs.spikyBurst(s, outer, inner);
        Fx.place(el, { x: target.x + ox * size, y: target.y + oy * size });
        fxEl.appendChild(el);
        const rot = Math.random() * 30 - 15;
        return Fx.anim(el, [
          { transform: `scale(.3) rotate(${rot}deg)`, opacity: 1 },
          { transform: `scale(1.1) rotate(${rot}deg)`, opacity: 1, offset: 0.25 },
          { transform: `scale(1) rotate(${rot}deg)`, opacity: 1, offset: 0.7 },
          { transform: `scale(1.05) rotate(${rot}deg)`, opacity: 0 }
        ], { duration: 480, easing: 'ease-out' }).then(() => el.remove());
      })
    );

    // Red specks scatter out, some landing on the platform.
    for (let i = 0; i < 12; i++) {
      const s = 4 + Math.random() * 4;
      const d = document.createElement('div');
      d.style.cssText = `position:absolute;width:${s}px;height:${s}px;border-radius:50%;pointer-events:none;background:radial-gradient(circle at 35% 35%,#FF8A70,#E0281C 60%,#A01010)`;
      Fx.place(d, target);
      fxEl.appendChild(d);
      const ang = Math.random() * Math.PI * 2;
      const dist = size * (0.5 + Math.random() * 0.5);
      Fx.anim(d, [
        { transform: 'translate(0,0)', opacity: 1 },
        { transform: `translate(${Math.cos(ang) * dist}px,${Math.sin(ang) * dist * 0.6 + 12}px)`, opacity: 1, offset: 0.7 },
        { transform: `translate(${Math.cos(ang) * dist}px,${Math.sin(ang) * dist * 0.6 + 16}px)`, opacity: 0 }
      ], { duration: 600 + Math.random() * 200, easing: 'ease-out' }).then(() => d.remove());
    }
    Fx.flash(targetEl, '#FF6A2A', 0.7);
    Fx.shake(targetEl, 7);
    Fx.shakeField(fieldEl, 0.5);
    await Promise.all(pops);
  }

  /**
   * Jump Kick: several black feet fly at the target one after another, each
   * stamping it with a jolt, then a white hit flash bursts into yellow sparkles.
   */
  private static async playJumpKick(refs: BattleStageRefs, launch: Point, target: Point) {
    const { fxEl, targetEl } = refs;
    const r = targetEl.getBoundingClientRect();
    const w = Math.max(r.width * 0.32, 22);
    const spread = Math.max(r.width * 0.3, 18);
    // Feet come in from the caster's side, a bit short of the caster itself.
    const from = { x: target.x + (launch.x - target.x) * 0.45, y: target.y + (launch.y - target.y) * 0.45 };
    const angle = (Math.atan2(target.y - from.y, target.x - from.x) * 180) / Math.PI + 90;
    const kicks = 4;
    const gap = 140;

    const stamps: Promise<void>[] = [];
    for (let i = 0; i < kicks; i++) {
      const hit = { x: target.x + (Math.random() * 2 - 1) * spread, y: target.y + (Math.random() * 2 - 1) * spread * 0.8 };
      const foot = FxGlyphs.footGlyph(w);
      Fx.place(foot, hit);
      fxEl.appendChild(foot);
      const ox = from.x - hit.x;
      const oy = from.y - hit.y;
      stamps.push(
        Fx.anim(foot, [
          { transform: `translate(${ox}px,${oy}px) rotate(${angle}deg) scale(.7)`, opacity: 0, filter: 'blur(3px)' },
          { transform: `translate(${ox * 0.4}px,${oy * 0.4}px) rotate(${angle}deg) scale(.9)`, opacity: 0.8, filter: 'blur(2px)', offset: 0.4 },
          { transform: `translate(0,0) rotate(${angle}deg) scale(1.05)`, opacity: 1, filter: 'blur(0)', offset: 0.7 },
          { transform: `translate(0,0) rotate(${angle}deg) scale(1)`, opacity: 0, filter: 'blur(0)' }
        ], { duration: 380, easing: 'ease-in', delay: i * gap }).then(() => foot.remove())
      );
      setTimeout(() => Fx.shake(targetEl, 4), i * gap + 260);
    }
    await Fx.wait((kicks - 1) * gap + 270);

    await Promise.all([...stamps, FightingMoveAnimations.sparkleHit(fxEl, targetEl, target)]);
  }

  /**
   * Low Kick: a single black foot sweeps from left to right across the target;
   * a yellow sparkle hit bursts the moment it passes over the sprite.
   */
  private static async playLowKick(refs: BattleStageRefs, target: Point) {
    const { fxEl, targetEl } = refs;
    const r = targetEl.getBoundingClientRect();
    const w = Math.max(r.width * 0.32, 22);
    const reach = Math.max(r.width * 0.9, 60);
    const y = target.y + Math.max(r.height * 0.15, 8);
    const travel = 520;

    const foot = FxGlyphs.footGlyph(w);
    Fx.place(foot, { x: target.x, y });
    fxEl.appendChild(foot);
    // Toes lead to the right; it is sharp over the sprite and blurred at the ends.
    const sweep = Fx.anim(foot, [
      { transform: `translateX(${-reach}px) rotate(90deg)`, opacity: 0, filter: 'blur(2px)' },
      { transform: `translateX(${-reach * 0.4}px) rotate(90deg)`, opacity: 1, filter: 'blur(1px)', offset: 0.3 },
      { transform: 'translateX(0) rotate(90deg)', opacity: 1, filter: 'blur(0)', offset: 0.5 },
      { transform: `translateX(${reach * 0.4}px) rotate(90deg)`, opacity: 1, filter: 'blur(1px)', offset: 0.7 },
      { transform: `translateX(${reach}px) rotate(90deg)`, opacity: 0, filter: 'blur(2px)' }
    ], { duration: travel, easing: 'linear' }).then(() => foot.remove());

    await Fx.wait(travel * 0.45);
    await Promise.all([sweep, FightingMoveAnimations.sparkleHit(fxEl, targetEl, target)]);
  }

  /**
   * Dynamic Punch: a red backdrop with yellow burst rays flares up round the
   * target, a big yellow fist slams onto it in an orange blast and stones fly
   * out in all directions; the backdrop clears and little yellow birds circle
   * dizzily round the target's head (it's confused).
   */
  private static async playDynamicPunch(refs: BattleStageRefs, target: Point) {
    const { fieldEl, fxEl, targetEl } = refs;
    const r = targetEl.getBoundingClientRect();
    const f = fieldEl.getBoundingClientRect();

    // 1. Red burst backdrop (0-0.25 s), flickering behind the sprites.
    const at = `${target.x}px ${target.y}px`;
    const red = Fx.backdrop(fieldEl, `background:radial-gradient(circle at ${at},#FF4A1A,#D0140E 35%,#6A0404 85%)`);
    const rays = document.createElement('div');
    rays.style.cssText =
      `position:absolute;inset:0;transform-origin:${at};` +
      `background:radial-gradient(circle at ${at},#FFE07A 0 6%,#D0140E00 22%),` +
      `repeating-conic-gradient(from 0deg at ${at},#FFC23A00 0 8deg,#FFB03Add 8deg 10deg,#FFE87A 10deg 11deg,#FFC23A00 11deg 20deg)`;
    red.appendChild(rays);
    rays.animate([
      { transform: 'scale(1) rotate(0deg)', opacity: 0.85 },
      { transform: 'scale(1.06) rotate(1.5deg)', opacity: 1 },
      { transform: 'scale(1) rotate(0deg)', opacity: 0.85 }
    ], { duration: 160, iterations: 8 });
    await Fx.anim(red, [{ opacity: 0 }, { opacity: 1 }], { duration: 250, easing: 'ease-out', fill: 'forwards' });

    // 2. The fist slams in (0.25-0.42 s) over an orange blast; stones fly out.
    const fistW = Math.max(r.width * 0.55, 44);
    const fist = FxGlyphs.fistGlyph(fistW);
    Fx.place(fist, target);
    fxEl.appendChild(fist);
    await Fx.anim(fist, [{ transform: 'scale(2.2)', opacity: 0 }, { transform: 'scale(1)', opacity: 1 }], {
      duration: 170,
      easing: 'ease-in',
      fill: 'forwards'
    });
    const blast = FxGlyphs.spikyBurst(fistW * 2, '#FF7A1A', '#FFC23A', '#FFF6C0');
    Fx.place(blast, target);
    fxEl.insertBefore(blast, fist);
    const blastDone = Fx.anim(blast, [
      { transform: 'scale(.3) rotate(0deg)', opacity: 1 },
      { transform: 'scale(1.1) rotate(10deg)', opacity: 1, offset: 0.35 },
      { transform: 'scale(1.2) rotate(18deg)', opacity: 0 }
    ], { duration: 600, easing: 'ease-out' }).then(() => blast.remove());
    Fx.flash(targetEl, '#FFC23A', 0.8);
    Fx.shake(targetEl, 7);
    Fx.shakeField(fieldEl, 1);
    const stones: Promise<void>[] = [];
    for (let i = 0; i < 16; i++) {
      const stone = FxGlyphs.rockChunk(8 + Math.random() * 10);
      Fx.place(stone, target);
      fxEl.appendChild(stone);
      const ang = (Math.PI * 2 * i) / 16 + Math.random() * 0.3;
      const d = Math.max(f.width * 0.3, fistW * 2.5) * (0.6 + Math.random() * 0.5);
      stones.push(
        Fx.anim(stone, [
          { transform: 'translate(0,0) scale(.5) rotate(0deg)', opacity: 1 },
          { transform: `translate(${Math.cos(ang) * d}px,${Math.sin(ang) * d}px) scale(1.1) rotate(${(Math.random() * 2 - 1) * 300}deg)`, opacity: 0 }
        ], { duration: 650 + Math.random() * 200, easing: 'ease-out' }).then(() => stone.remove())
      );
    }
    const fistDone = Fx.anim(fist, [
      { transform: 'scale(1)', opacity: 1 },
      { transform: 'scale(1.05)', opacity: 1, offset: 0.6 },
      { transform: 'scale(.9)', opacity: 0 }
    ], { duration: 600, easing: 'ease-in' }).then(() => fist.remove());
    await Promise.all([blastDone, fistDone, ...stones]);

    // 3. The backdrop clears (~1.27-1.57 s).
    await Fx.anim(red, [{ opacity: 1 }, { opacity: 0 }], { duration: 300, easing: 'ease-in' });
    red.remove();

    // 4. Confused: three little birds circle the target's head, stars twinkle (~1.57-2.97 s).
    const head: Point = { x: target.x, y: r.top - f.top + r.height * 0.05 };
    const rx = Math.max(r.width * 0.45, 32);
    const ry = Math.max(r.height * 0.12, 10);
    const circle = 1400;
    const birds = [0, 1, 2].map((i) => {
      const bird = FxGlyphs.birdGlyph(20);
      Fx.place(bird, head);
      fxEl.appendChild(bird);
      const frames: Keyframe[] = [];
      const steps = 24;
      for (let k = 0; k <= steps; k++) {
        const t = k / steps;
        const a = (Math.PI * 2 * i) / 3 + t * Math.PI * 3;
        // Facing the way it flies: left along the front (lower) half of the loop, right along the back.
        const face = Math.sin(a) >= 0 ? -1 : 1;
        frames.push({
          transform: `translate(${Math.cos(a) * rx}px,${Math.sin(a) * ry}px) scaleX(${face}) scale(${0.85 + 0.15 * Math.sin(a)})`,
          opacity: k === 0 || k === steps ? 0 : 1
        });
      }
      return Fx.anim(bird, frames, { duration: circle, easing: 'linear' }).then(() => bird.remove());
    });
    for (let i = 0; i < 4; i++) {
      const star = FxGlyphs.sparkStar(9, '#FFE04A');
      Fx.place(star, { x: head.x + (i - 1.5) * rx * 0.6, y: head.y - ry - 10 - (i % 2) * 6 });
      fxEl.appendChild(star);
      Fx.anim(star, [
        { transform: 'scale(0) rotate(0deg)', opacity: 0 },
        { transform: 'scale(1) rotate(45deg)', opacity: 1, offset: 0.3 },
        { transform: 'scale(.4) rotate(90deg)', opacity: 0.6, offset: 0.6 },
        { transform: 'scale(1) rotate(135deg)', opacity: 1, offset: 0.8 },
        { transform: 'scale(0) rotate(180deg)', opacity: 0 }
      ], { duration: circle - 200, easing: 'ease-in-out', delay: 100 + i * 60 }).then(() => star.remove());
    }
    await Promise.all(birds);
  }

  /**
   * Detect: the scene goes dark, a single cyan sparkle in a glowing ring
   * flashes up at the caster's head - its eye catching the attack coming -
   * and the caster glows white for a moment.
   */
  private static async playDetect(refs: BattleStageRefs, launch: Point) {
    const { fieldEl, fxEl, launchEl } = refs;
    const r = launchEl.getBoundingClientRect();
    const head: Point = { x: launch.x + r.width * 0.08, y: r.top - fieldEl.getBoundingClientRect().top + r.height * 0.25 };

    const dim = Fx.backdrop(fieldEl, DIM_BACKDROP);
    await Fx.anim(dim, [{ opacity: 0 }, { opacity: 1 }], { duration: 300, easing: 'ease-out' });

    // The sparkle flares up (0.3-0.9 s) while the caster glows white (~0.45-0.85 s).
    const sparkle = FxGlyphs.ringSparkle(Math.max(r.width * 0.45, 40), '#3FD8F0', '#C8F6FF');
    Fx.place(sparkle, head);
    fxEl.appendChild(sparkle);
    const flare = Fx.anim(sparkle, [
      { transform: 'scale(0) rotate(0deg)', opacity: 0 },
      { transform: 'scale(1.3) rotate(30deg)', opacity: 1, offset: 0.3 },
      { transform: 'scale(1) rotate(45deg)', opacity: 1, offset: 0.7 },
      { transform: 'scale(.4) rotate(70deg)', opacity: 0 }
    ], { duration: 800, easing: 'ease-out' }).then(() => sparkle.remove());
    await Fx.wait(150);
    await Fx.anim(launchEl, [
      { filter: 'brightness(1)' },
      { filter: 'brightness(2.4) saturate(0) drop-shadow(0 0 8px #ffffff)', offset: 0.35 },
      { filter: 'brightness(1)' }
    ], { duration: 400, easing: 'ease-out', fill: 'none' });
    await flare;

    await Fx.anim(dim, [{ opacity: 1 }, { opacity: 0 }], { duration: 300, easing: 'ease-in' });
    dim.remove();
  }

  /**
   * Cross Chop: two black, white-outlined hands appear raised on either side
   * of the target, then chop down across it in an X; where they cross, yellow
   * impact bursts flare and the target shakes.
   */
  private static async playCrossChop(refs: BattleStageRefs, target: Point) {
    const { fxEl, targetEl } = refs;
    const r = targetEl.getBoundingClientRect();
    const hw = Math.max(r.width * 0.38, 34);
    const sx = Math.max(r.width * 0.45, 36);
    const sy = Math.max(r.height * 0.35, 28);

    // 1. The hands appear raised, upper left and upper right (0-0.4 s).
    const hands = [-1, 1].map((side) => {
      const hand = FxGlyphs.gloveGlyph(hw, '#141414', '#ffffff');
      Fx.place(hand, target);
      fxEl.appendChild(hand);
      return { hand, side };
    });
    const pose = (side: number, x: number, y: number) => `translate(${side * x}px,${y}px) rotate(${side * 20}deg)`;
    await Promise.all(
      hands.map(({ hand, side }) =>
        Fx.anim(hand, [
          { transform: pose(side, sx, -sy + 10), opacity: 0 },
          { transform: pose(side, sx, -sy), opacity: 1 }
        ], { duration: 250, easing: 'ease-out', fill: 'forwards' })
      )
    );
    await Fx.wait(150);

    // 2. The chop (0.4-0.6 s): each hand sweeps down to the opposite side; they cross at ~0.5 s.
    const chop = Promise.all(
      hands.map(({ hand, side }) =>
        Fx.anim(hand, [
          { transform: pose(side, sx, -sy) },
          { transform: pose(side, -sx * 0.9, sy * 0.9) }
        ], { duration: 200, easing: 'ease-in', fill: 'forwards' })
      )
    );
    await Fx.wait(100);
    const bursts: Promise<void>[] = [];
    for (const [i, scale] of [[0, 1], [1, 0.7]] as const) {
      bursts.push(
        Fx.wait(i * 80).then(() => {
          const burst = FxGlyphs.spikyBurst(Math.max(r.width * 0.55, 46) * scale, '#E8D020', '#FFF27A');
          Fx.place(burst, { x: target.x + (i ? sx * 0.3 : 0), y: target.y + (i ? sy * 0.3 : 0) });
          fxEl.appendChild(burst);
          Fx.flash(targetEl, '#FFE04A', 0.6);
          Fx.shake(targetEl, 6);
          return Fx.anim(burst, [
            { transform: 'scale(.3)', opacity: 1 },
            { transform: 'scale(1.1)', opacity: 1, offset: 0.35 },
            { transform: 'scale(1.15)', opacity: 0 }
          ], { duration: 380, easing: 'ease-out' }).then(() => burst.remove());
        })
      );
    }
    await chop;

    // 3. The hands fade (0.6-0.85 s).
    await Promise.all([
      ...bursts,
      ...hands.map(({ hand }) => Fx.anim(hand, [{ opacity: 1 }, { opacity: 0 }], { duration: 250, easing: 'ease-in' }).then(() => hand.remove()))
    ]);
  }

  /**
   * Seismic Toss: the backdrop goes dark, then a deep blue sky fades in with
   * yellow-orange streaks rushing upward (the target is hurled up). The
   * streaks turn and rush downward (the fall), then the target slams down:
   * a yellow impact burst while stones fly out left and right of it.
   */
  private static async playSeismicToss(refs: BattleStageRefs, target: Point) {
    const { fieldEl, fxEl, targetEl } = refs;

    const dim = Fx.backdrop(fieldEl, DIM_BACKDROP);
    await Fx.anim(dim, [{ opacity: 0 }, { opacity: 1 }], { duration: 300, easing: 'ease-out' });

    // Blue sky layer on top of the dim layer, still behind platforms and sprites.
    const sky = document.createElement('div');
    sky.style.cssText = 'position:absolute;inset:0;overflow:hidden;background:linear-gradient(90deg,#06123A,#1B4FB0 30%,#3C86E0 50%,#1B4FB0 70%,#06123A)';
    dim.appendChild(sky);
    await Fx.anim(sky, [{ opacity: 0 }, { opacity: 1 }], { duration: 250, easing: 'ease-out' });

    await FightingMoveAnimations.rushStreaks(sky, -1, 900);
    await FightingMoveAnimations.rushStreaks(sky, 1, 700);

    // Impact: yellow burst on the target, the ground shakes, stones fly out sideways.
    const r = targetEl.getBoundingClientRect();
    const burstSize = Math.max(r.width * 0.6, 50);
    const burst = FxGlyphs.spikyBurst(burstSize, '#FFB020', '#FFE04A');
    Fx.place(burst, { x: target.x, y: target.y + r.height * 0.15 });
    fxEl.appendChild(burst);
    const burstDone = Fx.anim(burst, [
      { transform: 'scale(.3)', opacity: 1 },
      { transform: 'scale(1.15)', opacity: 1, offset: 0.3 },
      { transform: 'scale(1.2)', opacity: 0 }
    ], { duration: 520, easing: 'ease-out' }).then(() => burst.remove());
    Fx.shakeField(fieldEl, 0.7);

    const stones: Promise<void>[] = [];
    for (let i = 0; i < 8; i++) {
      const side = i % 2 ? 1 : -1;
      const stone = FxGlyphs.rockChunk(10 + Math.random() * 10);
      Fx.place(stone, { x: target.x + side * r.width * 0.2, y: target.y + r.height * 0.3 });
      fxEl.appendChild(stone);
      const dx = side * (r.width * 0.45 + Math.random() * 30);
      const peak = -(20 + Math.random() * 30);
      stones.push(
        Fx.anim(stone, [
          { transform: 'translate(0,0) rotate(0deg)', opacity: 1 },
          { transform: `translate(${dx * 0.6}px,${peak}px) rotate(${side * 120}deg)`, opacity: 1, offset: 0.5 },
          { transform: `translate(${dx}px,${peak * 0.2}px) rotate(${side * 220}deg)`, opacity: 0 }
        ], { duration: 600 + Math.random() * 150, easing: 'ease-out', delay: Math.random() * 80 }).then(() => stone.remove())
      );
    }
    await Promise.all([burstDone, FightingMoveAnimations.sparkleHit(fxEl, targetEl, target), ...stones]);

    await Fx.anim(dim, [{ opacity: 1 }, { opacity: 0 }], { duration: 380, easing: 'ease-in' });
    dim.remove();
  }

  /** Glowing yellow-orange streaks rush across `layer` for `duration` ms: up (-1) or down (1). */
  private static rushStreaks(layer: HTMLElement, dir: 1 | -1, duration: number): Promise<void> {
    const { width, height } = layer.getBoundingClientRect();
    const runs: Promise<void>[] = [];
    const count = 22;
    for (let i = 0; i < count; i++) {
      const len = 50 + Math.random() * 70;
      const w = 4 + Math.random() * 5;
      const streak = document.createElement('div');
      streak.style.cssText = `position:absolute;left:${Math.random() * width}px;top:0;width:${w}px;height:${len}px;border-radius:${w}px;pointer-events:none;background:linear-gradient(${dir < 0 ? 0 : 180}deg,#FF8A1F00,#FFA62B 50%,#FFF0A0);box-shadow:0 0 8px #FFB020`;
      layer.appendChild(streak);
      const from = dir < 0 ? height : -len;
      const to = dir < 0 ? -len : height;
      const travel = 280 + Math.random() * 160;
      runs.push(
        Fx.anim(streak, [
          { transform: `translateY(${from}px)` },
          { transform: `translateY(${to}px)` }
        ], { duration: travel, easing: 'linear', delay: (i / count) * (duration - travel) }).then(() => streak.remove())
      );
    }
    return Promise.all(runs).then(() => void 0);
  }

  /** A kick lands: a white flash on the target with yellow sparkles flying out (Jump Kick, Low Kick). */
  private static sparkleHit(fxEl: HTMLElement, targetEl: HTMLElement, target: Point): Promise<void> {
    const r = targetEl.getBoundingClientRect();
    const flashSize = Math.max(r.width * 0.7, 48);
    const flash = document.createElement('div');
    flash.style.cssText = `position:absolute;width:${flashSize}px;height:${flashSize}px;border-radius:50%;pointer-events:none;background:radial-gradient(circle,#fff,#FFF3A0 40%,#FFE04A00 72%)`;
    Fx.place(flash, target);
    fxEl.appendChild(flash);
    const flashDone = Fx.anim(flash, [
      { transform: 'scale(.3)', opacity: 1 },
      { transform: 'scale(1.2)', opacity: 0 }
    ], { duration: 320, easing: 'ease-out' }).then(() => flash.remove());
    Fx.flash(targetEl, '#FFE04A', 0.7);
    Fx.shake(targetEl, 6);
    const sparkles: Promise<void>[] = [];
    for (let i = 0; i < 10; i++) {
      const star = FxGlyphs.sparkStar(8 + Math.random() * 8, '#FFD83A');
      Fx.place(star, target);
      fxEl.appendChild(star);
      const ang = Math.random() * Math.PI * 2;
      const dist = flashSize * (0.4 + Math.random() * 0.5);
      sparkles.push(
        Fx.anim(star, [
          { transform: 'translate(0,0) scale(.3) rotate(0)', opacity: 1 },
          { transform: `translate(${Math.cos(ang) * dist}px,${Math.sin(ang) * dist}px) scale(1) rotate(90deg)`, opacity: 1, offset: 0.6 },
          { transform: `translate(${Math.cos(ang) * dist * 1.1}px,${Math.sin(ang) * dist * 1.1}px) scale(.6) rotate(130deg)`, opacity: 0 }
        ], { duration: 520 + Math.random() * 160, easing: 'ease-out' }).then(() => star.remove())
      );
    }
    return Promise.all([flashDone, ...sparkles]).then(() => void 0);
  }
}
