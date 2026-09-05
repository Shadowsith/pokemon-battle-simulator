import { Injectable } from '@angular/core';
import { Move } from '../models/move.model';

export interface BattleStageRefs {
  fieldEl: HTMLElement;
  fxEl: HTMLElement;
  screenFxEl: HTMLElement;
  /** The Pokémon that is casting the move (its own sprite lunges/emits from here). */
  launchEl: HTMLElement;
  /** The Pokémon being hit. */
  targetEl: HTMLElement;
}

interface Point {
  x: number;
  y: number;
}

/**
 * Plays the visual effect for a move against a pair of on-screen sprite
 * elements. This is intentionally imperative DOM manipulation (not template
 * bindings) because battle effects are short-lived, one-off animations that
 * don't belong in component state - the same approach used by the
 * interactive prototypes this service is ported from.
 */
@Injectable({ providedIn: 'root' })
export class MoveAnimationService {
  /** Resolves once the impact should register (damage applied, HP bar updated). */
  async playMove(move: Move, refs: BattleStageRefs): Promise<void> {
    const launch = this.centerOf(refs.launchEl, refs.fieldEl);
    const target = this.centerOf(refs.targetEl, refs.fieldEl);

    switch (move.archetype) {
      case 'melee':
        return this.playMelee(refs, move.color);
      case 'projectile':
        return this.playProjectile(refs, launch, target, move.color);
      case 'beam':
        return this.playBeam(refs, launch, target, move.color);
      case 'multiPulse':
        return this.playMultiPulse(refs, launch, target, move.color);
      case 'targetLevitate':
        return this.playTargetLevitate(refs, target, move.color);
      case 'directDischarge':
        return this.playDirectDischarge(refs, target, move.color);
      case 'groundEffect':
        return this.playGroundEffect(refs, move.color);
    }
  }

  private centerOf(el: HTMLElement, fieldEl: HTMLElement): Point {
    const r = el.getBoundingClientRect();
    const f = fieldEl.getBoundingClientRect();
    return { x: r.left - f.left + r.width / 2, y: r.top - f.top + r.height / 2 };
  }

  private flash(el: HTMLElement, color: string): void {
    el.style.filter = `brightness(1.8) drop-shadow(0 0 6px ${color})`;
    setTimeout(() => (el.style.filter = ''), 150);
  }

  private shake(el: HTMLElement): void {
    let i = 0;
    const t = setInterval(() => {
      el.style.transform = i % 2 ? 'translateX(-4px)' : 'translateX(4px)';
      i++;
      if (i > 5) {
        clearInterval(t);
        el.style.transform = '';
      }
    }, 40);
  }

  private shakeField(fieldEl: HTMLElement): void {
    let i = 0;
    const t = setInterval(() => {
      fieldEl.style.transform = `translate(${i % 2 ? -6 : 6}px, ${i % 3 ? 2 : -2}px)`;
      i++;
      if (i > 10) {
        clearInterval(t);
        fieldEl.style.transform = '';
      }
    }, 45);
  }

  private screenWash(screenFxEl: HTMLElement, color: string, rampMs: number, holdMs: number): void {
    screenFxEl.style.background = `radial-gradient(circle at 65% 40%, ${color}, transparent 75%)`;
    screenFxEl.style.transition = `opacity ${rampMs}ms ease-out`;
    screenFxEl.style.opacity = '1';
    setTimeout(() => {
      screenFxEl.style.transition = `opacity ${rampMs}ms ease-in`;
      screenFxEl.style.opacity = '0';
    }, holdMs);
  }

  private async playMelee({ launchEl, targetEl }: BattleStageRefs, color: string): Promise<void> {
    const originalTransform = launchEl.style.transform;
    launchEl.style.transition = 'transform .18s ease-in';
    launchEl.style.transform = 'translateX(-12px)';
    await this.wait(180);
    launchEl.style.transform = 'translateX(48px)';
    await this.wait(150);
    this.flash(targetEl, color);
    this.shake(targetEl);
    launchEl.style.transform = originalTransform;
  }

  private async playProjectile(
    { fxEl, targetEl }: BattleStageRefs,
    launch: Point,
    target: Point,
    color: string
  ): Promise<void> {
    const p = document.createElement('div');
    p.style.cssText = `position:absolute;width:20px;height:20px;border-radius:50%;background:radial-gradient(circle at 35% 35%, ${color}, #000);left:${launch.x - 10}px;top:${launch.y - 10}px;opacity:0;transform:scale(0.2);transition:opacity .3s ease-out,transform .3s ease-out`;
    fxEl.appendChild(p);
    requestAnimationFrame(() => {
      p.style.opacity = '1';
      p.style.transform = 'scale(1)';
    });
    await this.wait(320);
    p.style.transition = 'left 1.1s cubic-bezier(.4,0,.6,1),top 1.1s cubic-bezier(.4,0,.6,1),transform 1.1s ease-in';
    p.style.left = `${target.x - 10}px`;
    p.style.top = `${target.y - 10}px`;
    p.style.transform = 'scale(1.4)';
    await this.wait(1100);
    this.flash(targetEl, color);
    this.shake(targetEl);
    p.remove();
  }

  private async playBeam(
    { fxEl, targetEl }: BattleStageRefs,
    launch: Point,
    target: Point,
    color: string
  ): Promise<void> {
    const dx = target.x - launch.x;
    const dy = target.y - launch.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
    const b = document.createElement('div');
    b.style.cssText = `position:absolute;height:9px;background:linear-gradient(90deg, ${color}, #fff 70%);left:${launch.x}px;top:${launch.y}px;width:0px;border-radius:4px;transform-origin:left center;transform:rotate(${angle}deg)`;
    fxEl.appendChild(b);
    requestAnimationFrame(() => {
      b.style.transition = 'width .3s ease-out';
      b.style.width = `${dist}px`;
    });
    await this.wait(300);
    this.flash(targetEl, color);
    this.shake(targetEl);
    b.style.transition = 'opacity .2s';
    b.style.opacity = '0';
    setTimeout(() => b.remove(), 200);
  }

  private async playMultiPulse(
    { fxEl, targetEl }: BattleStageRefs,
    launch: Point,
    target: Point,
    color: string
  ): Promise<void> {
    const dx = target.x - launch.x;
    const dy = target.y - launch.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const rad = Math.atan2(dy, dx);
    for (let i = 0; i < 3; i++) {
      setTimeout(() => {
        const r = document.createElement('div');
        r.style.cssText = `position:absolute;width:26px;height:26px;left:${launch.x - 13}px;top:${launch.y - 13}px;border-radius:50%;border:3px solid ${color};background:radial-gradient(circle, ${color}55, transparent 70%)`;
        fxEl.appendChild(r);
        requestAnimationFrame(() => {
          r.style.transition = 'left .55s ease-in,top .55s ease-in,opacity .55s linear';
          r.style.left = `${launch.x + Math.cos(rad) * dist - 13}px`;
          r.style.top = `${launch.y + Math.sin(rad) * dist - 13}px`;
          r.style.opacity = '0';
        });
        setTimeout(() => r.remove(), 600);
      }, i * 140);
    }
    await this.wait(560);
    this.flash(targetEl, color);
    this.shake(targetEl);
  }

  private async playTargetLevitate(
    { fxEl, targetEl }: BattleStageRefs,
    target: Point,
    color: string
  ): Promise<void> {
    const originalTransform = targetEl.style.transform;
    targetEl.style.transition = 'transform .5s ease-in-out';
    targetEl.style.transform = 'translateY(-14px)';
    for (let i = 0; i < 2; i++) {
      const size = 70 + i * 20;
      const ring = document.createElement('div');
      ring.style.cssText = `position:absolute;left:${target.x - size / 2}px;top:${target.y - size / 2}px;width:${size}px;height:${size}px;border-radius:50%;border:2px solid ${color};opacity:0;transform:scale(.6)`;
      fxEl.appendChild(ring);
      requestAnimationFrame(() => {
        ring.style.transition = 'opacity .4s,transform .8s ease-out';
        ring.style.opacity = '.9';
        ring.style.transform = `scale(1.3) rotate(${i ? -90 : 90}deg)`;
      });
      setTimeout(() => {
        ring.style.opacity = '0';
        setTimeout(() => ring.remove(), 300);
      }, 700);
    }
    await this.wait(750);
    this.flash(targetEl, color);
    this.shake(targetEl);
    targetEl.style.transform = originalTransform;
  }

  private async playDirectDischarge(
    { fxEl, targetEl }: BattleStageRefs,
    target: Point,
    color: string
  ): Promise<void> {
    for (let i = 0; i < 5; i++) {
      setTimeout(() => {
        this.spawnBolt(fxEl, target.x + (Math.random() * 20 - 10), target.y + (Math.random() * 16 - 8), color);
        this.flash(targetEl, color);
        if (i === 2) this.shake(targetEl);
      }, i * 90);
    }
    await this.wait(480);
  }

  private spawnBolt(fxEl: HTMLElement, cx: number, cy: number, color: string): void {
    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('style', 'position:absolute;left:0;top:0;overflow:visible');
    svg.setAttribute('width', '1');
    svg.setAttribute('height', '1');
    const h = 38 + Math.random() * 14;
    const jitter = () => Math.random() * 16 - 8;
    const pts = [
      [cx + jitter(), cy - h / 2],
      [cx + jitter(), cy - h / 6],
      [cx + jitter(), cy + h / 6],
      [cx + jitter(), cy + h / 2]
    ];
    const path = document.createElementNS(ns, 'polyline');
    path.setAttribute('points', pts.map((p) => p.join(',')).join(' '));
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke', color);
    path.setAttribute('stroke-width', '3');
    path.setAttribute('stroke-linejoin', 'round');
    svg.appendChild(path);
    fxEl.appendChild(svg);
    setTimeout(() => svg.remove(), 110);
  }

  private async playGroundEffect({ fieldEl, fxEl, screenFxEl, targetEl }: BattleStageRefs, color: string): Promise<void> {
    this.screenWash(screenFxEl, `${color}55`, 150, 500);
    this.shakeField(fieldEl);
    const fieldWidth = fieldEl.getBoundingClientRect().width;
    for (let i = 0; i < 4; i++) {
      const w = 40 + i * 30;
      const crack = document.createElement('div');
      crack.style.cssText = `position:absolute;left:${fieldWidth / 2 - w / 2}px;top:${fieldEl.getBoundingClientRect().height * 0.72}px;width:2px;height:2px;background:${color};border-radius:2px;opacity:.8`;
      fxEl.appendChild(crack);
      requestAnimationFrame(() => {
        crack.style.transition = 'width .4s ease-out,height .1s';
        crack.style.width = `${w}px`;
        crack.style.height = '3px';
      });
      setTimeout(() => {
        crack.style.transition = 'opacity .3s';
        crack.style.opacity = '0';
        setTimeout(() => crack.remove(), 300);
      }, 500);
    }
    await this.wait(350);
    this.flash(targetEl, color);
  }

  private wait(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
