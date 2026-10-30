import { Injectable, inject } from '@angular/core';
import { Move } from '../models/move.model';
import { AudioService } from './audio.service';
import { SEMI_INVULN_ANIM } from './move-animation/animation.constants';
import { BattleStageRefs, MoveVisual, Point } from './move-animation/animation.types';
import { DeliveryAnimations } from './move-animation/delivery-animations';
import { Fx } from './move-animation/fx';
import { FxEffects } from './move-animation/fx-effects';
import { FxGlyphs } from './move-animation/fx-glyphs';
import { MoveVisualBuilder } from './move-animation/move-visual.builder';
import { CUSTOM_CHARGE_ANIMATIONS, CUSTOM_MOVE_ANIMATIONS } from './move-animation/moves';

export type { BattleStageRefs } from './move-animation/animation.types';

/**
 * Plays the visual effect for a move against a pair of on-screen sprite
 * elements. This is intentionally imperative DOM manipulation (not template
 * bindings) because battle effects are short-lived, one-off animations that
 * don't belong in component state - the same approach used by the
 * interactive prototypes this service is ported from.
 *
 * This service is the entry point; the effects themselves live in
 * `move-animation/`: `Fx` (primitives), `FxGlyphs` (elements), `FxEffects`
 * (shared effects), `DeliveryAnimations` (generic per-delivery animations)
 * and `moves/<type>-moves.ts` (hand-made per-move animations).
 */
@Injectable({ providedIn: 'root' })
export class MoveAnimationService {
  private readonly audio = inject(AudioService);

  /** Resolves once the impact should register (damage applied, HP bar updated). */
  async playMove(
    move: Move,
    refs: BattleStageRefs,
    phase?: 'charge' | 'release'
  ): Promise<void> {
    const launch = Fx.centerOf(refs.launchEl, refs.fieldEl);
    const target = Fx.centerOf(refs.targetEl, refs.fieldEl);
    const v = MoveVisualBuilder.build(move);
    v.dir = target.x >= launch.x ? 1 : -1;

    if (phase === 'charge') {
      return this.playChargeTurn(move, refs, launch, target, v);
    }
    if (phase === 'release') {
      await this.playReleaseIntro(move, refs);
    } else if (v.charge) {
      const customCharge = CUSTOM_CHARGE_ANIMATIONS[move.showdownId];
      await (customCharge ? customCharge(refs, launch, target, v) : FxEffects.chargeUp(refs, launch, v));
    }

    const custom = CUSTOM_MOVE_ANIMATIONS[move.showdownId];
    await (custom ? custom(refs, launch, target, v) : DeliveryAnimations.playDelivery(refs, launch, target, v));
  }

  /** Whether `move` has a hand-made animation (Detect uses it instead of the generic shield bubble). */
  hasCustomAnimation(move: Move): boolean {
    return !!CUSTOM_MOVE_ANIMATIONS[move.showdownId];
  }

  /** Turn 1 of a two-turn move: a hand-made charge, gather energy, or duck under / fly up out of sight. */
  private async playChargeTurn(move: Move, refs: BattleStageRefs, launch: Point, target: Point, v: MoveVisual) {
    const custom = CUSTOM_CHARGE_ANIMATIONS[move.showdownId];
    if (custom) return custom(refs, launch, target, v);
    if (SEMI_INVULN_ANIM.has(move.showdownId)) {
      const el = refs.launchEl;
      const down = move.showdownId === 'dive';
      el.getAnimations?.().forEach((a) => a.cancel());
      el.style.transformOrigin = 'center bottom';
      await Fx.anim(el, [
        { transform: 'translateY(0) scale(1)', opacity: 1 },
        { transform: `translateY(${down ? 58 : -74}px) scale(${down ? 0.7 : 0.55})`, opacity: 0 }
      ], { duration: 400, easing: 'ease-in', fill: 'forwards' });
      el.style.opacity = '0';
      return;
    }
    await FxEffects.chargeUp(refs, launch, v);
  }

  /** Turn 2 of a semi-invulnerable move: the user drops back into view. */
  private async playReleaseIntro(move: Move, refs: BattleStageRefs) {
    // Dig's and Fly's own animations bring the user back.
    if (!SEMI_INVULN_ANIM.has(move.showdownId) || move.showdownId === 'dig' || move.showdownId === 'fly') return;
    await FxEffects.dropBackIn(refs.launchEl);
  }

  /** A quick sidestep-and-back: the target slips the attack when it misses. */
  async playDodge(spriteEl: HTMLElement): Promise<void> {
    await Fx.anim(
      spriteEl,
      [
        { transform: 'translateX(0)' },
        { transform: 'translateX(-18px) skewX(8deg)', offset: 0.3 },
        { transform: 'translateX(12px) skewX(-4deg)', offset: 0.65 },
        { transform: 'translateX(0) skewX(0)' }
      ],
      { duration: 360, easing: 'ease-out', fill: 'none' }
    );
  }

  /** Protect / Detect / King's Shield: a translucent bubble pops up around the Pokémon. */
  async playShield(spriteEl: HTMLElement, fxEl: HTMLElement, fieldEl: HTMLElement, color = '#7fd3ff'): Promise<void> {
    const at = Fx.centerOf(spriteEl, fieldEl);
    const size = Math.max(spriteEl.getBoundingClientRect().height, 60) * 1.15;
    const bubble = document.createElement('div');
    bubble.style.cssText = `position:absolute;left:${at.x - size / 2}px;top:${at.y - size / 2}px;width:${size}px;height:${size}px;border-radius:50%;border:3px solid ${color};background:radial-gradient(circle at 35% 30%,rgba(255,255,255,.55),${color}33 60%,transparent 75%);pointer-events:none`;
    fxEl.appendChild(bubble);
    await Fx.anim(bubble, [
      { transform: 'scale(.4)', opacity: 0 },
      { transform: 'scale(1.05)', opacity: 1, offset: 0.35 },
      { transform: 'scale(1)', opacity: 0.9, offset: 0.7 },
      { transform: 'scale(1.1)', opacity: 0 }
    ], { duration: 620, easing: 'ease-out' });
    bubble.remove();
  }

  /**
   * Substitute: the Pokémon vanishes in a puff of smoke, `swap` turns its
   * sprite into the doll, and the doll drops onto the spot with a bounce.
   */
  async playSubstitute(spriteEl: HTMLElement, fxEl: HTMLElement, fieldEl: HTMLElement, swap: () => void): Promise<void> {
    const at = Fx.centerOf(spriteEl, fieldEl);
    const size = Math.max(spriteEl.getBoundingClientRect().height, 60) * 1.1;
    const puff = FxEffects.smokePuff(fxEl, at, size);
    await Fx.anim(spriteEl, [{ opacity: 1 }, { opacity: 0 }], { duration: 300, easing: 'ease-in', fill: 'forwards' });
    swap();
    await Fx.wait(100); // let the sprite src rebind before the doll appears
    spriteEl.style.transformOrigin = 'center bottom';
    await Fx.anim(spriteEl, [
      { transform: 'translateY(-36px)', opacity: 0, offset: 0 },
      { transform: 'translateY(0) scale(1.08,.88)', opacity: 1, offset: 0.65 },
      { transform: 'translateY(-6px) scale(.97,1.03)', opacity: 1, offset: 0.85 },
      { transform: 'translateY(0) scale(1)', opacity: 1, offset: 1 }
    ], { duration: 340, easing: 'ease-in' });
    spriteEl.getAnimations?.().forEach((a) => a.cancel());
    spriteEl.style.opacity = '';
    await puff;
  }

  /**
   * The Substitute breaks (or is dropped): the doll fades in a puff of smoke,
   * `swap` turns the sprite back into the Pokémon, which fades back in.
   */
  async playSubstituteFade(spriteEl: HTMLElement, fxEl: HTMLElement, fieldEl: HTMLElement, swap: () => void): Promise<void> {
    const at = Fx.centerOf(spriteEl, fieldEl);
    const size = Math.max(spriteEl.getBoundingClientRect().height, 60) * 1.1;
    const puff = FxEffects.smokePuff(fxEl, at, size);
    await Fx.anim(spriteEl, [{ opacity: 1 }, { opacity: 0 }], { duration: 280, easing: 'ease-in', fill: 'forwards' });
    swap();
    await Fx.wait(100);
    await Fx.anim(spriteEl, [{ opacity: 0 }, { opacity: 1 }], { duration: 300, easing: 'ease-out' });
    spriteEl.getAnimations?.().forEach((a) => a.cancel());
    spriteEl.style.opacity = '';
    await puff;
  }

  /**
   * Blown / dragged out of battle (Whirlwind, Roar …): the Pokémon is swept
   * off toward its own screen edge (`away` 1 = right, -1 = left), tumbling
   * up a little and fading. It stays hidden until the next send-in resets it.
   */
  async playBlownAway(spriteEl: HTMLElement, away: 1 | -1): Promise<void> {
    spriteEl.getAnimations?.().forEach((a) => a.cancel());
    await Fx.anim(spriteEl, [
      { transform: 'translate(0,0)', opacity: 1 },
      { transform: `translate(${away * 14}px,-6px)`, opacity: 1, offset: 0.25 },
      { transform: `translate(${away * 160}px,-40px)`, opacity: 0 }
    ], { duration: 520, easing: 'ease-in', fill: 'forwards' });
    spriteEl.style.opacity = '0';
  }

  /** A short hit flash + shake for the extra targets of a spread move. */
  async playHitFlash(spriteEl: HTMLElement, color = '#ffffff'): Promise<void> {
    Fx.flash(spriteEl, color, 0.7);
    Fx.shake(spriteEl, 5);
    await Fx.wait(260);
  }

  /** The classic faint: the Pokémon drops below its platform and fades out. */
  async playFaint(spriteEl: HTMLElement): Promise<void> {
    spriteEl.getAnimations?.().forEach((a) => a.cancel());
    spriteEl.style.transformOrigin = 'center bottom';
    await Fx.anim(spriteEl, [
      { transform: 'translateY(0) scaleY(1)', opacity: 1, offset: 0 },
      { transform: 'translateY(3px) scaleY(0.8)', opacity: 1, offset: 0.16 },
      { transform: 'translateY(70px) scaleY(0.65)', opacity: 0, offset: 1 }
    ], { duration: 640, easing: 'cubic-bezier(.5,0,.9,.35)', fill: 'forwards' });
    spriteEl.style.opacity = '0';
    spriteEl.style.transform = 'translateY(70px)';
  }

  /** Recall a (living) Pokémon: a ball flies in, a beam retracts it, the ball wobbles shut. */
  async playRecall(
    spriteEl: HTMLElement,
    fxEl: HTMLElement,
    fieldEl: HTMLElement,
    side: 'player' | 'opponent'
  ): Promise<void> {
    spriteEl.getAnimations?.().forEach((a) => a.cancel());
    const rect = fieldEl.getBoundingClientRect();
    const sprite = Fx.centerOf(spriteEl, fieldEl);
    const home = this.ballHome(rect, side);
    const point = { x: sprite.x, y: sprite.y + 16 };

    const ball = FxGlyphs.pokeball(20);
    Fx.place(ball, home);
    fxEl.appendChild(ball);
    const at = (p: Point) => `translate(${p.x - home.x}px, ${p.y - home.y}px)`;
    await Fx.anim(ball, [{ transform: at(home) }, { transform: at(point) }], {
      duration: 300,
      easing: 'ease-out',
      fill: 'forwards'
    });

    // ball is in position - the recall beam fires and pulls the Pokémon in
    this.audio.playBallReturn();
    this.beam(fxEl, point, sprite);
    spriteEl.style.transformOrigin = 'center center';
    await Fx.anim(spriteEl, [
      { transform: 'translate(0,0) scale(1)', filter: 'brightness(1) saturate(1)', opacity: 1, offset: 0 },
      { transform: 'translate(0,0) scale(1)', filter: 'brightness(3) saturate(0)', opacity: 1, offset: 0.25 },
      {
        transform: `translate(${point.x - sprite.x}px, ${point.y - sprite.y}px) scale(0.04)`,
        filter: 'brightness(4) saturate(0)',
        opacity: 0.4,
        offset: 1
      }
    ], { duration: 360, easing: 'ease-in', fill: 'forwards' });
    spriteEl.style.opacity = '0';
    spriteEl.style.transform = '';
    spriteEl.style.filter = '';

    await Fx.anim(ball, [
      { transform: `${at(point)} rotate(0)` },
      { transform: `${at(point)} rotate(-20deg)`, offset: 0.3 },
      { transform: `${at(point)} rotate(17deg)`, offset: 0.6 },
      { transform: `${at(point)} rotate(0)` }
    ], { duration: 260 });
    await Fx.anim(ball, [{ transform: at(point), opacity: 1 }, { transform: at(home), opacity: 0 }], {
      duration: 240,
      easing: 'ease-in'
    });
    ball.remove();
  }

  /** Send a Pokémon out: a ball arcs in, bursts open with a flash, the sprite grows in. */
  async playSendOut(
    spriteEl: HTMLElement,
    fxEl: HTMLElement,
    fieldEl: HTMLElement,
    side: 'player' | 'opponent'
  ): Promise<void> {
    spriteEl.getAnimations?.().forEach((a) => a.cancel());
    spriteEl.style.transform = 'none';
    spriteEl.style.filter = 'none';
    spriteEl.style.opacity = '0';

    const rect = fieldEl.getBoundingClientRect();
    const target = Fx.centerOf(spriteEl, fieldEl);
    const home = this.ballHome(rect, side);
    const midX = home.x + (target.x - home.x) * 0.55;
    const arcY = Math.min(home.y, target.y) - 80;

    const ball = FxGlyphs.pokeball(22);
    Fx.place(ball, home);
    fxEl.appendChild(ball);
    await Fx.anim(ball, [
      { transform: 'translate(0,0) rotate(0)', offset: 0 },
      { transform: `translate(${midX - home.x}px, ${arcY - home.y}px) rotate(340deg)`, offset: 0.55 },
      { transform: `translate(${target.x - home.x}px, ${target.y - home.y}px) rotate(560deg)`, offset: 1 }
    ], { duration: 430, easing: 'ease-in', fill: 'forwards' });

    // ball has landed and is springing open - the Pokémon is released now
    this.audio.playBallOpen();

    const flash = document.createElement('div');
    const fs = 14;
    flash.style.cssText = `position:absolute;left:${target.x - fs / 2}px;top:${target.y - fs / 2}px;width:${fs}px;height:${fs}px;border-radius:50%;background:radial-gradient(circle,#fff,#d6ecff 55%,transparent);pointer-events:none`;
    fxEl.appendChild(flash);
    Fx.anim(ball, [{ opacity: 1 }, { opacity: 0 }], { duration: 140 }).then(() => ball.remove());
    await Fx.anim(flash, [
      { transform: 'scale(.3)', opacity: 0 },
      { transform: 'scale(4)', opacity: 1, offset: 0.35 },
      { transform: 'scale(8)', opacity: 0 }
    ], { duration: 340, easing: 'ease-out' });
    flash.remove();

    spriteEl.style.opacity = '1';
    spriteEl.style.transformOrigin = 'center bottom';
    await Fx.anim(spriteEl, [
      { transform: 'scale(0)', filter: 'brightness(4) saturate(0)', offset: 0 },
      { transform: 'scale(1.12)', filter: 'brightness(2) saturate(.4)', offset: 0.6 },
      { transform: 'scale(1)', filter: 'brightness(1) saturate(1)', offset: 1 }
    ], { duration: 380, easing: 'cubic-bezier(.3,1.3,.5,1)' });
    spriteEl.style.transform = '';
    spriteEl.style.filter = '';
  }

  private ballHome(rect: DOMRect, side: 'player' | 'opponent'): Point {
    return side === 'player'
      ? { x: -34, y: rect.height + 34 }
      : { x: rect.width + 34, y: -34 };
  }

  private beam(fxEl: HTMLElement, from: Point, to: Point): void {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const len = Math.hypot(dx, dy) + 26;
    const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
    const b = document.createElement('div');
    b.style.cssText = `position:absolute;left:${from.x}px;top:${from.y - 4}px;height:8px;width:${len}px;border-radius:4px;transform-origin:left center;background:linear-gradient(90deg,#ff5a4d,#ffd2cd);pointer-events:none`;
    fxEl.appendChild(b);
    Fx.anim(b, [
      { transform: `rotate(${angle}deg) scaleX(0)`, opacity: 0.9 },
      { transform: `rotate(${angle}deg) scaleX(1)`, opacity: 0.9, offset: 0.4 },
      { transform: `rotate(${angle}deg) scaleX(0)`, opacity: 0 }
    ], { duration: 430, easing: 'ease-in-out' }).then(() => b.remove());
  }
}
