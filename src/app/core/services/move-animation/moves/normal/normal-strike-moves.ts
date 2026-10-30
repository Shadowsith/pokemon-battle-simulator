import { Point, BattleStageRefs, MoveVisual, MoveAnimRegistry } from '../../animation.types';
import { DIM_BACKDROP } from '../../animation.constants';
import { Fx } from '../../fx';
import { FxGlyphs } from '../../fx-glyphs';
import { FxEffects } from '../../fx-effects';

/** Hand-made animations for Normal-type contact moves that bite, cut, bind, or ram after charging up. */
export class NormalStrikeMoveAnimations {
  /** By @pkmn/sim move id. */
  static readonly anims: MoveAnimRegistry = {
    bind: (refs, _launch, target) => NormalStrikeMoveAnimations.playBind(refs, target),
    hyperfang: (refs, _launch, target, v) => NormalStrikeMoveAnimations.playHyperFang(refs, target, v),
    skullbash: (refs, _launch, target, v) => NormalStrikeMoveAnimations.playSkullBash(refs, target, v),
    slash: (refs, _launch, target, v) => NormalStrikeMoveAnimations.playSlash(refs, target, v),
    superfang: (refs, _launch, target, v) => NormalStrikeMoveAnimations.playSuperFang(refs, target, v)
  };

  /**
   * Super Fang: small rodent incisors snap down into the target (a quick
   * Hyper Fang bite), then a red-pink starburst flares on it while white and
   * pink sparks fly out.
   */
  private static async playSuperFang(refs: BattleStageRefs, target: Point, v: MoveVisual) {
    const { targetEl, fxEl } = refs;
    const r = targetEl.getBoundingClientRect();
    const h = Math.max(r.height * 0.35, 28);
    const tilt = `rotate(${-v.dir * 35}deg)`;

    // 1. The bite (0-0.3 s): drops in, clamps, then fades out while the burst flares.
    const teeth = FxGlyphs.incisorGlyph(h);
    Fx.place(teeth, { x: target.x, y: target.y - r.height * 0.1 });
    fxEl.appendChild(teeth);
    await Fx.anim(teeth, [
      { transform: `${tilt} translateY(${-h * 0.8}px)`, opacity: 0 },
      { transform: `${tilt} translateY(0)`, opacity: 1 }
    ], { duration: 130, easing: 'ease-in' });
    Fx.shake(targetEl, 4);
    const teethDone = Fx.anim(teeth, [
      { transform: `${tilt} translateY(0)`, opacity: 1 },
      { transform: `${tilt} translateY(-4px)`, opacity: 1, offset: 0.3 },
      { transform: `${tilt} translateY(0)`, opacity: 1, offset: 0.55 },
      { transform: `${tilt} translateY(-8px)`, opacity: 0 }
    ], { duration: 320, easing: 'ease-out' }).then(() => teeth.remove());
    await Fx.wait(170);

    // 2. The hit (from 0.3 s): a red-pink starburst with a white core.
    const size = Math.max(r.width * 0.55, 46);
    const burst = FxGlyphs.spikyBurst(size, '#F0304A', '#FF8AA8', '#ffffff');
    Fx.place(burst, target);
    fxEl.appendChild(burst);
    const burstDone = Fx.anim(burst, [
      { transform: 'scale(.3) rotate(0deg)', opacity: 1 },
      { transform: 'scale(1.1) rotate(10deg)', opacity: 1, offset: 0.3 },
      { transform: 'scale(1) rotate(14deg)', opacity: 1, offset: 0.65 },
      { transform: 'scale(1.15) rotate(18deg)', opacity: 0 }
    ], { duration: 450, easing: 'ease-out' }).then(() => burst.remove());
    Fx.flash(targetEl, '#FF6A8A', 0.7);
    Fx.shake(targetEl, 6);

    // White and pink sparks fly out round the burst.
    const sparks: Promise<void>[] = [];
    const reach = size * 0.9;
    for (let i = 0; i < 12; i++) {
      const sz = 4 + Math.random() * 4;
      const c = i % 3 ? '#ffffff' : '#FF9AB8';
      const spark = document.createElement('div');
      spark.style.cssText = `position:absolute;width:${sz}px;height:${sz}px;border-radius:50%;pointer-events:none;background:radial-gradient(circle,#fff,${c} 60%);box-shadow:0 0 6px ${c === '#ffffff' ? '#FFC0D0' : c}`;
      Fx.place(spark, target);
      fxEl.appendChild(spark);
      const ang = (Math.PI * 2 * i) / 12 + Math.random() * 0.4;
      const d = reach * (0.6 + Math.random() * 0.5);
      sparks.push(
        Fx.anim(spark, [
          { transform: 'translate(0,0) scale(.5)', opacity: 1 },
          { transform: `translate(${Math.cos(ang) * d * 0.8}px,${Math.sin(ang) * d * 0.8}px) scale(1)`, opacity: 1, offset: 0.6 },
          { transform: `translate(${Math.cos(ang) * d}px,${Math.sin(ang) * d}px) scale(.5)`, opacity: 0 }
        ], { duration: 480 + Math.random() * 100, easing: 'ease-out', delay: 30 }).then(() => spark.remove())
      );
    }
    await Promise.all([teethDone, burstDone, ...sparks]);
  }

  /**
   * Slash: a bright white cut is drawn diagonally across the target with a
   * white flash where it lands, while yellow-orange sparks spray out of it.
   */
  private static async playSlash(refs: BattleStageRefs, target: Point, v: MoveVisual) {
    const { fxEl, targetEl } = refs;
    const r = targetEl.getBoundingClientRect();
    const len = Math.max(r.width * 1.1, 80);
    // Top-back to bottom-front of the target, mirrored with the attack direction.
    const angle = v.dir > 0 ? 35 : 145;

    const blade = document.createElement('div');
    blade.style.cssText = `position:absolute;width:${len}px;height:7px;pointer-events:none;clip-path:polygon(0 50%,50% 0,100% 50%,50% 100%);background:linear-gradient(90deg,#ffffff00,#fff 30%,#fff 70%,#ffffff00);filter:drop-shadow(0 0 5px #FFF6C0)`;
    // The blade turns round its left end; place that end so its middle crosses the target.
    const rad = (angle * Math.PI) / 180;
    Fx.place(blade, { x: target.x - (Math.cos(rad) * len) / 2 + len / 2, y: target.y - (Math.sin(rad) * len) / 2 });
    fxEl.appendChild(blade);
    const bladeDone = Fx.anim(blade, [
      { transform: `rotate(${angle}deg) scale(0,1)`, transformOrigin: '0 50%', opacity: 1 },
      { transform: `rotate(${angle}deg) scale(1,1.3)`, transformOrigin: '0 50%', opacity: 1, offset: 0.4 },
      { transform: `rotate(${angle}deg) scale(1,.3)`, transformOrigin: '0 50%', opacity: 0 }
    ], { duration: 360, easing: 'ease-out' }).then(() => blade.remove());

    await Fx.wait(110);
    const star = FxGlyphs.sparkStar(Math.max(r.width * 0.4, 34), '#FFF3A0');
    Fx.place(star, target);
    fxEl.appendChild(star);
    const starDone = Fx.anim(star, [
      { transform: 'scale(.2) rotate(0deg)', opacity: 1 },
      { transform: 'scale(1.1) rotate(30deg)', opacity: 1, offset: 0.4 },
      { transform: 'scale(.6) rotate(45deg)', opacity: 0 }
    ], { duration: 320, easing: 'ease-out' }).then(() => star.remove());
    Fx.flash(targetEl, '#ffffff', 0.6);
    Fx.shake(targetEl, 5);

    // Yellow-orange sparks spray out, mostly upward and toward the front.
    const sparks: Promise<void>[] = [];
    const reach = Math.max(r.width * 0.55, 40);
    for (let i = 0; i < 16; i++) {
      const s = 4 + Math.random() * 4;
      const spark = document.createElement('div');
      const c = i % 2 ? '#FFD040' : '#FF9A2A';
      spark.style.cssText = `position:absolute;width:${s}px;height:${s}px;border-radius:50%;pointer-events:none;background:radial-gradient(circle,#FFF8D0,${c} 60%);box-shadow:0 0 5px ${c}`;
      const along = (Math.random() * 2 - 1) * 0.4;
      Fx.place(spark, { x: target.x + Math.cos(rad) * len * along, y: target.y + Math.sin(rad) * len * along });
      fxEl.appendChild(spark);
      const ang = -Math.PI / 2 + v.dir * Math.random() * 1.4 + (Math.random() - 0.5) * 0.8;
      const d = reach * (0.4 + Math.random() * 0.7);
      sparks.push(
        Fx.anim(spark, [
          { transform: 'translate(0,0) scale(1)', opacity: 1 },
          { transform: `translate(${Math.cos(ang) * d * 0.7}px,${Math.sin(ang) * d * 0.7}px) scale(1)`, opacity: 1, offset: 0.6 },
          { transform: `translate(${Math.cos(ang) * d}px,${Math.sin(ang) * d + 10}px) scale(.4)`, opacity: 0 }
        ], { duration: 520 + Math.random() * 200, easing: 'ease-out', delay: Math.random() * 80 }).then(() => spark.remove())
      );
    }
    await Promise.all([bladeDone, starDone, ...sparks]);
  }

  /** Turn-1 animations of two-turn moves, by @pkmn/sim move id. */
  static readonly chargeAnims: MoveAnimRegistry = {
    skullbash: (refs, launch, _target, v) => NormalStrikeMoveAnimations.playSkullBashCharge(refs, launch, v)
  };

  /**
   * Skull Bash, turn 1 (tucks its head in): the caster rears back diagonally,
   * away from the foe, twice; then orange sparkles drift down over it.
   */
  private static async playSkullBashCharge(refs: BattleStageRefs, launch: Point, v: MoveVisual) {
    const { fieldEl, launchEl } = refs;
    const back = `translate(${-v.dir * 14}px,-8px)`;
    for (let i = 0; i < 2; i++) {
      await Fx.anim(launchEl, [
        { transform: 'translate(0,0)' },
        { transform: back, offset: 0.4 },
        { transform: 'translate(0,0)' }
      ], { duration: 280, easing: 'ease-in-out', fill: 'none' });
    }
    const top = launchEl.getBoundingClientRect().top - fieldEl.getBoundingClientRect().top;
    await FxEffects.orangeSparkles(refs, launch, top);
  }

  /**
   * Skull Bash, turn 2: the scene goes dark, the caster darts forward and
   * back very fast a few times, then the target is hit by a fiery blast
   * with yellow sparks.
   */
  private static async playSkullBash(refs: BattleStageRefs, target: Point, v: MoveVisual) {
    const { fieldEl, fxEl, launchEl, targetEl } = refs;
    const dim = Fx.backdrop(fieldEl, DIM_BACKDROP);
    await Fx.anim(dim, [{ opacity: 0 }, { opacity: 1 }], { duration: 300, easing: 'ease-out' });

    await Fx.anim(launchEl, [
      { transform: 'translateX(0)' },
      { transform: `translateX(${v.dir * 30}px)`, offset: 0.17 },
      { transform: 'translateX(0)', offset: 0.33 },
      { transform: `translateX(${v.dir * 30}px)`, offset: 0.5 },
      { transform: 'translateX(0)', offset: 0.67 },
      { transform: `translateX(${v.dir * 46}px)`, offset: 0.85 },
      { transform: 'translateX(0)' }
    ], { duration: 420, easing: 'linear', fill: 'none' });

    const r = targetEl.getBoundingClientRect();
    const blast = FxEffects.fireBlastCloud(fxEl, target, Math.max(r.width * 0.5, 42), 10, '#FFE04A');
    Fx.flash(targetEl, '#FFB13C', 0.7);
    Fx.shake(targetEl, 6);
    Fx.shakeField(fieldEl, 0.6);
    await blast;

    await Fx.anim(dim, [{ opacity: 1 }, { opacity: 0 }], { duration: 380, easing: 'ease-in' });
    dim.remove();
  }

  /**
   * Bind: nested dark arcs close in on both sides of the target and squeeze
   * in and out quickly while the target is pressed together.
   */
  private static async playBind(refs: BattleStageRefs, target: Point) {
    const { fxEl, targetEl } = refs;
    const r = targetEl.getBoundingClientRect();
    const baseW = Math.max(r.width * 0.95, 60);
    const baseH = Math.max(r.height * 0.8, 50);
    const squeezes = 6;
    const beat = 150;
    const hold = squeezes * beat;

    // Only the left and right borders are coloured, so each ring reads as "( )".
    const rings: HTMLElement[] = [];
    for (let i = 0; i < 4; i++) {
      const w = baseW * (1 + i * 0.14);
      const h = baseH * (1 - i * 0.06);
      const ring = document.createElement('div');
      ring.style.cssText = `position:absolute;width:${w}px;height:${h}px;border-radius:50%;pointer-events:none;border:${3 - i * 0.4}px solid transparent;border-left-color:#1E1A24;border-right-color:#1E1A24;opacity:${0.85 - i * 0.15}`;
      Fx.place(ring, target);
      fxEl.appendChild(ring);
      rings.push(ring);
    }

    // Close in from wide, then pulse: tight - loose - tight ...
    const frames = (i: number): Keyframe[] => {
      const out: Keyframe[] = [{ transform: 'scaleX(1.6)', opacity: 0, offset: 0 }];
      const start = 0.15;
      for (let k = 0; k <= squeezes * 2; k++) {
        out.push({
          transform: `scaleX(${k % 2 ? 1.08 + i * 0.02 : 0.86})`,
          opacity: 1,
          offset: start + (k / (squeezes * 2)) * (0.85 - start)
        });
      }
      out.push({ transform: 'scaleX(1.2)', opacity: 0, offset: 1 });
      return out;
    };
    const total = hold / 0.7;
    const done = rings.map((ring, i) =>
      Fx.anim(ring, frames(i), { duration: total, easing: 'ease-in-out', delay: i * 20 }).then(() => ring.remove())
    );

    // The target gets squeezed in time with the arcs.
    const original = targetEl.style.transform;
    const squash: Keyframe[] = [{ transform: original, offset: 0 }];
    for (let k = 0; k <= squeezes * 2; k++) {
      squash.push({
        transform: `${original} scaleX(${k % 2 ? 1 : 0.93})`,
        offset: 0.15 + (k / (squeezes * 2)) * 0.7
      });
    }
    squash.push({ transform: original, offset: 1 });
    // A dim flash on every tight squeeze (the even keyframes above).
    for (let j = 0; j < squeezes; j++) {
      setTimeout(() => Fx.flash(targetEl, '#8a7a9a', 0.25), total * (0.15 + (j / squeezes) * 0.7));
    }
    await Fx.anim(targetEl, squash, { duration: total, easing: 'ease-in-out' });
    targetEl.getAnimations?.().forEach((a) => a.cancel());
    targetEl.style.transform = original;
    await Promise.all(done);
  }

  /**
   * Hyper Fang: a pair of big rodent incisors chomps diagonally down into the
   * target, while clusters of little red sparkles twinkle around it.
   */
  private static async playHyperFang(refs: BattleStageRefs, target: Point, v: MoveVisual) {
    const { targetEl, fxEl } = refs;
    const r = targetEl.getBoundingClientRect();
    const h = Math.max(r.height * 0.55, 40);
    // Tilted toward the caster's side, like a bite from that direction.
    const tilt = `rotate(${-v.dir * 35}deg)`;

    const teeth = FxGlyphs.incisorGlyph(h);
    Fx.place(teeth, target);
    fxEl.appendChild(teeth);
    await Fx.anim(teeth, [
      { transform: `${tilt} translateY(${-h * 0.8}px)`, opacity: 0 },
      { transform: `${tilt} translateY(0)`, opacity: 1 }
    ], { duration: 160, easing: 'ease-in' });

    Fx.flash(targetEl, '#FF6A4A', 0.6);
    Fx.shake(targetEl, 6);
    const done = Fx.anim(teeth, [
      { transform: `${tilt} translateY(0)`, opacity: 1 },
      { transform: `${tilt} translateY(-6px)`, opacity: 1, offset: 0.2 },
      { transform: `${tilt} translateY(0)`, opacity: 1, offset: 0.4 },
      { transform: `${tilt} translateY(0)`, opacity: 1, offset: 0.75 },
      { transform: `${tilt} translateY(-10px)`, opacity: 0 }
    ], { duration: 650, easing: 'ease-out' }).then(() => teeth.remove());

    // Red sparkle clusters pop up at a few spots around the target.
    const spots = 4;
    const start = Math.random() * Math.PI * 2;
    for (let c = 0; c < spots; c++) {
      const a = start + (Math.PI * 2 * c) / spots;
      const centre = {
        x: target.x + Math.cos(a) * Math.max(r.width * 0.55, 34),
        y: target.y + Math.sin(a) * Math.max(r.height * 0.45, 28)
      };
      for (let i = 0; i < 4; i++) {
        const star = FxGlyphs.sparkStar(6 + Math.random() * 7, i % 2 ? '#FF3A2A' : '#FF8A6A');
        Fx.place(star, { x: centre.x + (Math.random() * 2 - 1) * 12, y: centre.y + (Math.random() * 2 - 1) * 12 });
        fxEl.appendChild(star);
        Fx.anim(star, [
          { transform: 'scale(0) rotate(0deg)', opacity: 0 },
          { transform: 'scale(1.1) rotate(45deg)', opacity: 1, offset: 0.35 },
          { transform: 'scale(.6) rotate(90deg)', opacity: 0.8, offset: 0.65 },
          { transform: 'scale(0) rotate(135deg)', opacity: 0 }
        ], { duration: 500, easing: 'ease-out', delay: c * 70 + Math.random() * 120 }).then(() => star.remove());
      }
    }
    await done;
  }
}
