import { Point, BattleStageRefs, MoveAnimRegistry } from '../../animation.types';
import { Fx } from '../../fx';
import { FxGlyphs } from '../../fx-glyphs';
import { FxEffects } from '../../fx-effects';

/** Hand-made animations for the Gen 6 Fairy-type special attacks. */
export class FairySpecialMoveAnimations {
  /** By @pkmn/sim move id. */
  static readonly anims: MoveAnimRegistry = {
    disarmingvoice: (refs, launch, target) => FairySpecialMoveAnimations.playDisarmingVoice(refs, launch, target),
    drainingkiss: (refs, launch, target) => FairySpecialMoveAnimations.playDrainingKiss(refs, launch, target),
    fairywind: (refs, launch, target) => FairySpecialMoveAnimations.playFairyWind(refs, launch, target),
    lightofruin: (refs, launch, target) => FairySpecialMoveAnimations.playLightOfRuin(refs, launch, target)
  };

  /**
   * Disarming Voice, after the XY animation: the user rears up and cries as
   * the scene turns rose-red (0-0.4 s); four jagged pink sound rings roll out
   * to the target with music notes (0.35-1.1 s, 0.12 s apart) and burst on it
   * in pink sparks (1.0-1.5 s), then the scene clears (to 1.7 s).
   * Reference: https://www.pokewiki.de/images/0/0c/S%C3%A4uselstimme_Gen6.png
   */
  private static async playDisarmingVoice(refs: BattleStageRefs, launch: Point, target: Point) {
    const { fieldEl, fxEl, launchEl, targetEl } = refs;
    const lr = Fx.rect(launchEl);
    const tr = Fx.rect(targetEl);
    const scene = Fx.backdrop(fieldEl, 'background:radial-gradient(circle at 50% 50%,#D85A8Acc,#8A2A50cc)');
    const original = launchEl.style.transform;
    const effects: Promise<unknown>[] = [
      Fx.anim(scene, [{ opacity: 0 }, { opacity: 1, offset: 0.2 }, { opacity: 1, offset: 0.8 }, { opacity: 0 }], { duration: 1700, easing: 'ease-in-out' }).then(() => scene.remove()),
      Fx.anim(launchEl, [
        { transform: `${original} translateY(0) scale(1,1)` },
        { transform: `${original} translateY(-8px) scale(.96,1.05)`, offset: 0.3 },
        { transform: `${original} translateY(0) scale(1,1)` }
      ], { duration: 600, easing: 'ease-out', fill: 'none' })
    ];
    await Fx.wait(350);

    const dx = target.x - launch.x;
    const dy = target.y - launch.y;
    const size = Math.max(lr.height * 0.6, 50);
    const mask = 'radial-gradient(circle,#0000 52%,#000 56% 68%,#0000 72%)';
    for (let i = 0; i < 4; i++) {
      const ring = Fx.box(size, size, `border-radius:50%;background:repeating-conic-gradient(#FF4A98 0 6deg,#FFB0D8 6deg 9deg,#FF4A9800 9deg 15deg);-webkit-mask-image:${mask};mask-image:${mask};filter:drop-shadow(0 0 4px #FF6AB0)`);
      effects.push(
        Fx.spawn(fxEl, ring, launch, [
          { transform: 'translate(0,0) scale(.4) rotate(0deg)', opacity: 0 },
          { transform: `translate(${dx * 0.2}px,${dy * 0.2}px) scale(.7) rotate(20deg)`, opacity: 1, offset: 0.2 },
          { transform: `translate(${dx}px,${dy}px) scale(1.3) rotate(60deg)`, opacity: 0.2 }
        ], { duration: 650, delay: i * 120, easing: 'ease-in' })
      );
      const note = FxGlyphs.musicNote(16, i % 2 ? '#FFD84A' : '#FF8AC8', i % 2 ? '♫' : '♪');
      effects.push(
        Fx.spawn(fxEl, note, launch, [
          { transform: 'translate(0,0)', opacity: 0 },
          { transform: `translate(${dx * 0.4}px,${dy * 0.4 - 24}px)`, opacity: 1, offset: 0.4 },
          { transform: `translate(${dx * 0.9}px,${dy * 0.9 - 10}px)`, opacity: 0 }
        ], { duration: 700, delay: i * 120 + 60, easing: 'ease-out' })
      );
    }
    await Fx.wait(620);
    for (let i = 0; i < 3; i++) {
      setTimeout(() => {
        Fx.shake(targetEl, 4);
        Fx.flash(targetEl, '#FF6AB0', 0.5);
      }, i * 120);
    }
    effects.push(
      Fx.spawn(fxEl, FxGlyphs.spikyBurst(Math.max(tr.width * 0.9, 60), '#FF4A98', '#FF9AD0', '#FFFFFF'), target, [
        { transform: 'scale(.3) rotate(0deg)', opacity: 0 },
        { transform: 'scale(1) rotate(15deg)', opacity: 1, offset: 0.3 },
        { transform: 'scale(1.1) rotate(25deg)', opacity: 0 }
      ], { duration: 500, delay: 100, easing: 'ease-out' })
    );
    await Promise.all(effects);
  }

  /**
   * Draining Kiss, after the XY animation: a pink kiss lands on the target
   * with a yellow-white glow and violet sparkles (0-0.55 s), a white orb of
   * stolen energy floats back to the user trailing sparkles (0.55-1.1 s) and
   * green light streaks rise round the user as it heals (1.05-1.7 s).
   * Reference: https://www.pokewiki.de/images/3/30/Diebeskuss_Gen6.png
   */
  private static async playDrainingKiss(refs: BattleStageRefs, launch: Point, target: Point) {
    const { fxEl, launchEl, targetEl } = refs;
    const tr = Fx.rect(targetEl);
    const lr = Fx.rect(launchEl);
    const glowSize = Math.max(tr.width * 0.8, 50);
    const hit: Promise<unknown>[] = [
      Fx.spawn(fxEl, Fx.box(glowSize, glowSize, 'border-radius:50%;background:radial-gradient(circle,#ffffff,#FFF2A0 40%,#FFE06A00 70%)'), target, [
        { transform: 'scale(.2)', opacity: 0 },
        { transform: 'scale(1)', opacity: 1, offset: 0.4 },
        { transform: 'scale(1.2)', opacity: 0 }
      ], { duration: 550, easing: 'ease-out' }),
      Fx.spawn(fxEl, FairySpecialMoveAnimations.lips(Math.max(tr.width * 0.4, 30)), target, [
        { transform: 'scale(.3)', opacity: 0 },
        { transform: 'scale(1.1)', opacity: 1, offset: 0.35 },
        { transform: 'scale(1)', opacity: 1, offset: 0.7 },
        { transform: 'scale(1.2)', opacity: 0 }
      ], { duration: 550, easing: 'ease-out' })
    ];
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      hit.push(
        Fx.spawn(fxEl, FxGlyphs.sparkStar(10, '#C07AFF'), target, [
          { transform: 'translate(0,0) scale(.5)', opacity: 0 },
          { transform: `translate(${Math.cos(a) * glowSize * 0.6}px,${Math.sin(a) * glowSize * 0.6}px) scale(1)`, opacity: 1, offset: 0.5 },
          { transform: `translate(${Math.cos(a) * glowSize * 0.8}px,${Math.sin(a) * glowSize * 0.8}px) scale(.3)`, opacity: 0 }
        ], { duration: 500, delay: 100, easing: 'ease-out' })
      );
    }
    setTimeout(() => {
      Fx.shake(targetEl, 4);
      Fx.flash(targetEl, '#FFF2A0', 0.5);
    }, 200);
    await Promise.all(hit);

    // The white orb floats back to the user, trailing sparkles.
    const dx = launch.x - target.x;
    const dy = launch.y - target.y;
    const orb = Fx.box(18, 18, 'border-radius:50%;background:radial-gradient(circle,#ffffff 0 45%,#ffffff00 72%);box-shadow:0 0 10px 3px #ffffffcc');
    const trail: Promise<void>[] = [];
    for (let i = 0; i < 8; i++) {
      const t = i / 8;
      trail.push(
        Fx.spawn(fxEl, FxGlyphs.sparkStar(8, '#ffffff'), { x: target.x + dx * t, y: target.y + dy * t - Math.sin(t * Math.PI) * 30 }, [
          { transform: 'scale(0)', opacity: 0 },
          { transform: 'scale(1)', opacity: 1, offset: 0.3 },
          { transform: 'scale(0)', opacity: 0 }
        ], { duration: 350, delay: 500 * t, easing: 'ease-out' })
      );
    }
    const arc: Keyframe[] = [];
    for (let k = 0; k <= 6; k++) {
      const t = k / 6;
      arc.push({ transform: `translate(${dx * t}px,${dy * t - Math.sin(t * Math.PI) * 30}px)` });
    }
    await Fx.spawn(fxEl, orb, target, arc, { duration: 550, easing: 'ease-in-out' });

    // Green light streaks rise round the healing user.
    const heal: Promise<unknown>[] = [Fx.glow(launchEl, 'brightness(1.2) drop-shadow(0 0 8px #7AF08A)', 650), ...trail];
    heal.push(FxEffects.healStreaks(refs, launch, 7));
    await Promise.all(heal);
  }

  /** A pink pair of lips blowing a kiss, `w` px wide. */
  private static lips(w: number): HTMLElement {
    const el = Fx.box(w, w * 0.6, 'filter:drop-shadow(0 0 4px #FF6AB0)');
    el.innerHTML =
      '<svg width="100%" height="100%" viewBox="0 0 30 18">' +
      '<path d="M1,9 C5,2 10,1 15,5 C20,1 25,2 29,9 C24,10 20,10 15,10 C10,10 6,10 1,9 Z" fill="#FF5A9A"/>' +
      '<path d="M1,9 C6,10 10,10.5 15,10.5 C20,10.5 24,10 29,9 C25,16 20,17 15,17 C10,17 5,16 1,9 Z" fill="#E83A80"/>' +
      '<path d="M8,12.5 C11,14 14,14 16,13.5" stroke="#FFD0E4" stroke-width="1.2" fill="none" stroke-linecap="round"/>' +
      '</svg>';
    return el;
  }

  /**
   * Fairy Wind, after the XY animation: three pale pink-white gusts sweep
   * from the user across the field (0-0.9 s, 0.15 s apart) and whirl round
   * the target with white streaks and pink sparkles as it is buffeted
   * (0.55-1.3 s).
   * Reference: https://www.pokewiki.de/images/a/a1/Feenbrise_Gen6.png
   */
  private static async playFairyWind(refs: BattleStageRefs, launch: Point, target: Point) {
    const { fieldEl, fxEl, targetEl } = refs;
    const W = fieldEl.clientWidth;
    const H = fieldEl.clientHeight;
    const tr = Fx.rect(targetEl);
    const dir = target.x >= launch.x ? 1 : -1;
    const effects: Promise<unknown>[] = [];
    for (let i = 0; i < 3; i++) {
      const gust = Fx.box(W * 0.7, H * 0.45, `left:0;top:${launch.y - H * 0.3 + i * 12}px;border-radius:50%;background:radial-gradient(ellipse,#FFFFFFcc,#FFE0F088 45%,#FFE0F000 70%);filter:blur(6px)`);
      fxEl.appendChild(gust);
      effects.push(
        Fx.anim(gust, [
          { transform: `translate(${dir > 0 ? -W * 0.7 : W}px,0)`, opacity: 0 },
          { transform: `translate(${dir > 0 ? W * 0.1 : W * 0.2}px,${(target.y - launch.y) * 0.4}px)`, opacity: 0.9, offset: 0.5 },
          { transform: `translate(${dir > 0 ? W : -W * 0.7}px,${target.y - launch.y}px)`, opacity: 0 }
        ], { duration: 800, delay: i * 150, easing: 'ease-in-out' }).then(() => gust.remove())
      );
    }
    await Fx.wait(550);
    const rx = Math.max(tr.width * 0.6, 40);
    for (let i = 0; i < 4; i++) {
      const streak = Fx.box(rx * 1.2, 3, 'border-radius:2px;background:linear-gradient(90deg,#ffffff00,#ffffff,#ffffff00)');
      const y = (i - 1.5) * tr.height * 0.18;
      effects.push(
        Fx.spawn(fxEl, streak, { x: target.x, y: target.y + y }, [
          { transform: `translateX(${-rx}px) scaleX(.3)`, opacity: 0 },
          { transform: 'translateX(0) scaleX(1)', opacity: 1, offset: 0.5 },
          { transform: `translateX(${rx}px) scaleX(.3)`, opacity: 0 }
        ], { duration: 350, delay: i * 90, easing: 'ease-in-out' })
      );
    }
    for (let i = 0; i < 6; i++) {
      const at: Point = { x: target.x + (Math.random() * 2 - 1) * rx, y: target.y + (Math.random() * 2 - 1) * tr.height * 0.4 };
      effects.push(
        Fx.spawn(fxEl, FxGlyphs.sparkStar(10, '#FFB0E0'), at, [
          { transform: 'scale(0)', opacity: 0 },
          { transform: 'scale(1)', opacity: 1, offset: 0.4 },
          { transform: 'scale(0)', opacity: 0 }
        ], { duration: 380, delay: 100 + i * 60, easing: 'ease-out' })
      );
    }
    for (let i = 0; i < 2; i++) setTimeout(() => Fx.shake(targetEl, 4), 80 + i * 200);
    await Promise.all(effects);
  }

  /**
   * Light of Ruin (no reference on Pokewiki; after the eternal flower's XY
   * animation as remembered): the scene darkens and pink light gathers on the
   * user in a growing orb (0-0.9 s), a huge pink-white beam blasts to the
   * target (0.9-1.6 s), which vanishes in a pink-white explosion that shakes
   * the field (1.2-1.9 s); the user flinches from the recoil (1.9-2.2 s).
   */
  private static async playLightOfRuin(refs: BattleStageRefs, launch: Point, target: Point) {
    const { fieldEl, fxEl, screenFxEl, launchEl, targetEl } = refs;
    const W = fieldEl.clientWidth;
    const lr = Fx.rect(launchEl);
    const tr = Fx.rect(targetEl);
    const dark = Fx.backdrop(fieldEl, 'background:radial-gradient(circle at 50% 50%,#3A1030,#12040E)');
    await Fx.anim(dark, [{ opacity: 0 }, { opacity: 1 }], { duration: 250, easing: 'ease-out' });

    // Pink light gathers in a growing orb.
    const orbSize = Math.max(lr.width * 0.9, 60);
    const orb = Fx.box(orbSize, orbSize, 'border-radius:50%;background:radial-gradient(circle,#ffffff 0 30%,#FF9AD8 50%,#FF4AB000 72%);box-shadow:0 0 20px 6px #FF7AC888');
    Fx.place(orb, launch);
    fxEl.appendChild(orb);
    const gather: Promise<unknown>[] = [
      Fx.anim(orb, [{ transform: 'scale(.1)', opacity: 0 }, { transform: 'scale(1)', opacity: 1 }], { duration: 650, easing: 'ease-in' })
    ];
    for (let i = 0; i < 14; i++) {
      const a = Math.random() * Math.PI * 2;
      const d = orbSize * (1 + Math.random() * 0.6);
      gather.push(
        Fx.spawn(fxEl, FxGlyphs.sparkStar(9, '#FF9AD8'), { x: launch.x + Math.cos(a) * d, y: launch.y + Math.sin(a) * d }, [
          { transform: 'translate(0,0) scale(1)', opacity: 0 },
          { transform: `translate(${-Math.cos(a) * d * 0.3}px,${-Math.sin(a) * d * 0.3}px)`, opacity: 1, offset: 0.3 },
          { transform: `translate(${-Math.cos(a) * d}px,${-Math.sin(a) * d}px) scale(.3)`, opacity: 0 }
        ], { duration: 500, delay: i * 25, easing: 'ease-in' })
      );
    }
    await Promise.all(gather);

    // The beam blasts to the target.
    const dx = target.x - launch.x;
    const dy = target.y - launch.y;
    const len = Math.hypot(dx, dy) + tr.width * 0.3;
    const thick = Math.max(lr.height * 0.45, 36);
    const beam = Fx.box(len, thick, `left:${launch.x}px;top:${launch.y - thick / 2}px;transform-origin:0 50%;border-radius:${thick / 2}px;background:linear-gradient(180deg,#FF4AB000,#FF8AD0 20%,#ffffff 40% 60%,#FF8AD0 80%,#FF4AB000);filter:drop-shadow(0 0 10px #FF6AC0)`);
    fxEl.appendChild(beam);
    const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
    const fire = Fx.anim(beam, [
      { transform: `rotate(${angle}deg) scale(0,.6)` },
      { transform: `rotate(${angle}deg) scale(1,1)`, offset: 0.35 },
      { transform: `rotate(${angle}deg) scale(1,1.15)`, offset: 0.7 },
      { transform: `rotate(${angle}deg) scale(1,0)` }
    ], { duration: 700, easing: 'ease-out' });
    await Fx.wait(250);
    orb.remove();

    // The pink-white explosion.
    const blast = Math.max(tr.width * 2.2, 160);
    Fx.screenWash(screenFxEl, '#FFE0F0dd', 80, 300, `${((target.x / W) * 100).toFixed(0)}%`);
    Fx.shakeField(fieldEl, 1);
    Fx.shake(targetEl, 8);
    const explode = Fx.spawn(fxEl, Fx.box(blast, blast, 'border-radius:50%;background:radial-gradient(circle,#ffffff 0 30%,#FFB0E0dd 50%,#FF5AB000 72%)'), target, [
      { transform: 'scale(.2)', opacity: 1 },
      { transform: 'scale(1)', opacity: 1, offset: 0.35 },
      { transform: 'scale(1.15)', opacity: 0 }
    ], { duration: 650, easing: 'ease-out' });
    await Promise.all([fire, explode]);
    beam.remove();
    await Fx.anim(dark, [{ opacity: 1 }, { opacity: 0 }], { duration: 250, easing: 'ease-in' });
    dark.remove();

    // Recoil.
    Fx.flash(launchEl, '#E06666', 0.4);
    Fx.shake(launchEl, 4);
    await Fx.wait(150);
  }
}
