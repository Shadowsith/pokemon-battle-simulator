import { Point, BattleStageRefs, MoveVisual, MoveAnimRegistry } from '../animation.types';
import { Fx } from '../fx';
import { FxGlyphs } from '../fx-glyphs';
import { FxEffects } from '../fx-effects';

/** Silver tones of Steel moves: sparkle, dust light, dust shade. */
const SILVER = '#DDE2EC';
const DUST: [string, string] = ['#E4E8F0', '#A9B0BE'];

/** Hand-made animations for Steel-type moves. */
export class SteelMoveAnimations {
  /** Hand-made Steel move animations, by @pkmn/sim move id. */
  static readonly anims: MoveAnimRegistry = {
    irontail: (refs, launch, target, v) => SteelMoveAnimations.playIronTail(refs, launch, target, v),
    steelwing: (refs, launch, target, v) => SteelMoveAnimations.playSteelWing(refs, launch, target, v)
  };

  /**
   * Iron Tail: the caster glints with silver sparkles, then a wide silver
   * swipe sweeps across the target in the attack direction (left to right
   * for the player), kicking up glittering iron dust clouds along its path.
   */
  private static async playIronTail(refs: BattleStageRefs, launch: Point, target: Point, v: MoveVisual) {
    await SteelMoveAnimations.silverGlint(refs, launch);
    await SteelMoveAnimations.ironSwipe(refs, target, v.dir);
  }

  /**
   * Steel Wing: three gleaming steel feathers appear around the caster,
   * pointing at the target, then fly at it one after another; each lands
   * with a silver slash streak and sparkles.
   */
  private static async playSteelWing(refs: BattleStageRefs, launch: Point, target: Point, v: MoveVisual) {
    const { fxEl, launchEl, targetEl } = refs;
    const lr = Fx.rect(launchEl);
    const tr = Fx.rect(targetEl);
    const len = Math.max(lr.width * 0.5, 44);
    const count = 3;

    // Phase 1: the feathers fade in around the caster with a silver glint.
    const feathers = Array.from({ length: count }, (_, i) => {
      const at: Point = {
        x: launch.x + v.dir * lr.width * 0.15,
        y: launch.y + (i - (count - 1) / 2) * Math.max(lr.height * 0.3, 20)
      };
      const angle = (Math.atan2(target.y - at.y, target.x - at.x) * 180) / Math.PI;
      const el = SteelMoveAnimations.steelFeather(len);
      Fx.place(el, at);
      fxEl.appendChild(el);
      return { el, at, angle };
    });
    for (let i = 0; i < 3; i++) setTimeout(() => Fx.flash(launchEl, '#F0F3FA', 0.5), 60 + i * 130);
    await Promise.all(feathers.map(({ el, angle }, i) =>
      Fx.anim(el, [
        { transform: `rotate(${angle}deg) scale(.2)`, opacity: 0 },
        { transform: `rotate(${angle}deg) scale(1.1)`, opacity: 1, offset: 0.6 },
        { transform: `rotate(${angle}deg) scale(1)`, opacity: 1 }
      ], { duration: 300, delay: i * 50, easing: 'ease-out' })
    ));

    // Phase 2: one after another they shoot at the target and strike it.
    const strikes = feathers.map(({ el, at, angle }, i) => {
      const hit: Point = {
        x: target.x + (Math.random() * 2 - 1) * tr.width * 0.15,
        y: target.y + (i - 1) * tr.height * 0.18
      };
      return Fx.anim(el, [
        { transform: `translate(0,0) rotate(${angle}deg)`, opacity: 1 },
        { transform: `translate(${hit.x - at.x}px,${hit.y - at.y}px) rotate(${angle}deg)`, opacity: 1 }
      ], { duration: 240, delay: i * 90, easing: 'ease-in' }).then(() => {
        el.remove();
        return SteelMoveAnimations.silverSlash(fxEl, targetEl, hit, angle + (i % 2 ? 20 : -20), tr.width);
      });
    });
    await Promise.all(strikes);
  }

  /** Counter for unique SVG gradient ids, so feathers on screen at once don't share one. */
  private static featherId = 0;

  /** A long, gleaming steel feather pointing right (rotate it to aim), `len` px long. */
  private static steelFeather(len: number): HTMLElement {
    const id = `steelFeather${SteelMoveAnimations.featherId++}`;
    const el = document.createElement('div');
    const h = len * 0.28;
    el.style.cssText = `width:${len}px;height:${h}px;pointer-events:none;filter:drop-shadow(0 0 3px #ffffffcc)`;
    el.innerHTML =
      '<svg viewBox="0 0 60 16" width="100%" height="100%" preserveAspectRatio="none" style="display:block;overflow:visible">' +
      `<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFFFFF"/><stop offset=".5" stop-color="#DDE2EC"/><stop offset="1" stop-color="#8E96A6"/></linearGradient></defs>` +
      `<path d="M2 8 Q14 1 34 2 L38 4.5 L42 2.5 Q54 3 60 8 Q54 13 42 13.5 L38 11.5 L34 14 Q14 15 2 8 Z" fill="url(#${id})" stroke="#6E7686" stroke-width=".8"/>` +
      '<line x1="0" y1="8" x2="58" y2="8" stroke="#F8FAFF" stroke-width="1.2"/></svg>';
    return el;
  }

  /** A feather lands: a thin silver slash streak at `angle` across `at`, with sparkles; the target flashes and shakes. */
  private static silverSlash(fxEl: HTMLElement, targetEl: HTMLElement, at: Point, angle: number, width: number): Promise<void> {
    const w = Math.max(width * 0.9, 60);
    const streak = document.createElement('div');
    streak.style.cssText = `width:${w}px;height:4px;border-radius:4px;pointer-events:none;background:linear-gradient(90deg,#ffffff00,#ffffff 45%,#DDE2EC 70%,#ffffff00);filter:drop-shadow(0 0 4px #ffffff)`;
    Fx.place(streak, at);
    fxEl.appendChild(streak);
    const effects: Promise<void>[] = [
      Fx.anim(streak, [
        { transform: `rotate(${angle}deg) scaleX(0)`, opacity: 1 },
        { transform: `rotate(${angle}deg) scaleX(1)`, opacity: 1, offset: 0.4 },
        { transform: `rotate(${angle}deg) scaleX(1.1)`, opacity: 0 }
      ], { duration: 320, easing: 'ease-out' }).then(() => streak.remove())
    ];
    for (let i = 0; i < 2; i++) {
      const star = FxGlyphs.sparkStar(12 + Math.random() * 10, SILVER);
      Fx.place(star, { x: at.x + (Math.random() * 2 - 1) * w * 0.3, y: at.y + (Math.random() * 2 - 1) * 12 });
      fxEl.appendChild(star);
      effects.push(
        Fx.anim(star, [
          { transform: 'scale(.2) rotate(0deg)', opacity: 1 },
          { transform: 'scale(1.1) rotate(30deg)', opacity: 1, offset: 0.4 },
          { transform: 'scale(0) rotate(50deg)', opacity: 0 }
        ], { duration: 380, easing: 'ease-out', delay: i * 60 }).then(() => star.remove())
      );
    }
    Fx.flash(targetEl, '#ffffff', 0.6);
    Fx.shake(targetEl, 4);
    return Promise.all(effects).then(() => void 0);
  }

  /** Silver four-point sparkles twinkle around the caster while it flashes silver. */
  private static async silverGlint(refs: BattleStageRefs, launch: Point) {
    const { fxEl, launchEl } = refs;
    const r = Fx.rect(launchEl);
    const sparkles: Promise<void>[] = [];
    for (let i = 0; i < 9; i++) {
      const star = FxGlyphs.sparkStar(12 + Math.random() * 14, SILVER);
      Fx.place(star, {
        x: launch.x + (Math.random() * 2 - 1) * r.width * 0.5,
        y: launch.y + (Math.random() * 2 - 1) * r.height * 0.45
      });
      fxEl.appendChild(star);
      sparkles.push(
        Fx.anim(star, [
          { transform: 'scale(0) rotate(0deg)', opacity: 0 },
          { transform: 'scale(1.1) rotate(25deg)', opacity: 1, offset: 0.45 },
          { transform: 'scale(0) rotate(45deg)', opacity: 0 }
        ], { duration: 420, easing: 'ease-in-out', delay: i * 70 }).then(() => star.remove())
      );
    }
    for (let i = 0; i < 3; i++) setTimeout(() => Fx.flash(launchEl, '#F0F3FA', 0.6), 80 + i * 220);
    await Promise.all(sparkles);
  }

  /**
   * A wide, flat silver arc is drawn across the target from the attack side
   * to the far side; dust clouds and sparkles follow the blade's tip.
   */
  private static async ironSwipe(refs: BattleStageRefs, target: Point, dir: 1 | -1) {
    const { fxEl, targetEl } = refs;
    const r = Fx.rect(targetEl);
    const w = Math.max(r.width * 1.9, 120);
    const h = Math.max(r.height * 0.55, 34);
    const sweep = 380;

    const arc = document.createElement('div');
    arc.style.cssText = `position:absolute;width:${w}px;height:${h}px;border-radius:50%;pointer-events:none;border:6px solid #F2F4F8;border-top-color:#ffffff;border-bottom-color:#B8BFCC;background:radial-gradient(ellipse at 50% 50%,#ffffff00 55%,#DDE2EC55 70%,#ffffff00 74%);filter:drop-shadow(0 0 6px #ffffffcc)`;
    Fx.place(arc, target);
    fxEl.appendChild(arc);
    // Reveal from the attack side (left for the player) to the far side.
    const from = dir > 0 ? 'inset(0 100% 0 0)' : 'inset(0 0 0 100%)';
    const arcDone = Fx.anim(arc, [
      { clipPath: from, opacity: 1 },
      { clipPath: 'inset(0 0 0 0)', opacity: 1, offset: 0.6 },
      { clipPath: 'inset(0 0 0 0)', opacity: 0 }
    ], { duration: sweep / 0.6, easing: 'ease-out' }).then(() => arc.remove());

    // Dust clouds and glints trail the blade's tip along the arc.
    const steps = 5;
    const effects: Promise<void>[] = [];
    for (let i = 0; i < steps; i++) {
      const t = i / (steps - 1);
      const x = target.x + dir * (t - 0.5) * w * 0.85;
      const y = target.y + Math.sin(t * Math.PI) * h * 0.35;
      effects.push(
        Fx.wait(t * sweep).then(async () => {
          const star = FxGlyphs.sparkStar(14 + Math.random() * 10, SILVER);
          Fx.place(star, { x, y: y - h * 0.3 });
          fxEl.appendChild(star);
          Fx.anim(star, [
            { transform: 'scale(.2)', opacity: 1 },
            { transform: 'scale(1) rotate(30deg)', opacity: 0 }
          ], { duration: 420, easing: 'ease-out' }).then(() => star.remove());
          await FxEffects.smokePuff(fxEl, { x, y }, Math.max(r.width * 0.45, 36), DUST);
        })
      );
    }
    await Fx.wait(sweep * 0.45);
    Fx.flash(targetEl, '#ffffff', 0.7);
    Fx.shake(targetEl, 5);
    await Promise.all([arcDone, ...effects]);
  }
}
