import { Point, BattleStageRefs, MoveVisual } from '../../animation.types';
import { Fx } from '../../fx';
import { FxGlyphs } from '../../fx-glyphs';

/**
 * Hyperspace Hole, after the ORAS animation: the scene washes out to white
 * (0-0.3 s). Dark ink rings swirl under the user, a black hole spreads there
 * and the user sinks into it while ink spikes shoot up (0.3-1.1 s); the hole
 * shrinks away (to 1.35 s). A hole opens under the target and the user rises
 * out of it right in front of the target (1.35-1.85 s), striking: a
 * pink-white burst in a yellow glow, a white bolt and more ink spikes
 * (1.85-2.35 s). The user fades back to its place while the hole and the
 * white wash clear (to ~2.9 s).
 */
export class HyperspaceHole {
  private static readonly INK = '#1A0A22';

  static async play(refs: BattleStageRefs, launch: Point, target: Point, v: MoveVisual) {
    const { fieldEl, fxEl, launchEl: el, targetEl } = refs;
    el.getAnimations?.().forEach((a) => a.cancel());
    const lr = Fx.rect(el);
    const tr = Fx.rect(targetEl);
    const lFoot = Fx.footOf(el, fieldEl);
    const tFoot = Fx.footOf(targetEl, fieldEl);

    const wash = Fx.backdrop(fieldEl, 'background:#F6F6FA');
    await Fx.anim(wash, [{ opacity: 0 }, { opacity: 1 }], { duration: 300, easing: 'ease-out' });

    // The user sinks into a hole of ink under its feet.
    const userHole = HyperspaceHole.hole(fxEl, lFoot, Math.max(lr.width * 1.3, 90));
    const swirl = HyperspaceHole.rings(fxEl, lFoot, Math.max(lr.width * 1.4, 100));
    await Fx.wait(200);
    const spikesA = HyperspaceHole.inkSpikes(fxEl, lFoot, Math.max(lr.width * 0.5, 40), lr.height * 0.4);
    await Fx.anim(el, [
      { transform: 'translateY(0)', clipPath: 'inset(0 0 -40px 0)' },
      { transform: `translateY(${lr.height}px)`, clipPath: `inset(0 0 ${lr.height}px 0)` }
    ], { duration: 400, easing: 'ease-in', fill: 'none' });
    el.style.opacity = '0';
    await Promise.all([swirl, spikesA]);
    await userHole.close();

    // A hole opens under the target and the user rises out of it in front of the target.
    const targetHole = HyperspaceHole.hole(fxEl, tFoot, Math.max(tr.width * 1.5, 100));
    const swirlB = HyperspaceHole.rings(fxEl, tFoot, Math.max(tr.width * 1.5, 100));
    await Fx.wait(250);
    const dx = target.x - v.dir * tr.width * 0.5 - launch.x;
    const dy = tFoot.y - lFoot.y;
    el.style.opacity = '1';
    await Fx.anim(el, [
      { transform: `translate(${dx}px,${dy + lr.height * 0.8}px) scale(.8)`, clipPath: `inset(0 0 ${lr.height}px 0)` },
      { transform: `translate(${dx}px,${dy}px) scale(.8)`, clipPath: 'inset(0 0 -40px 0)' }
    ], { duration: 250, easing: 'ease-out', fill: 'forwards' });

    // The strike.
    const strike = HyperspaceHole.strike(refs, target);
    const spikesB = HyperspaceHole.inkSpikes(fxEl, tFoot, Math.max(tr.width * 0.8, 60), tr.height * 0.6);
    Fx.shake(targetEl, 7);
    Fx.shakeField(fieldEl, 0.5);
    await Promise.all([strike, spikesB, swirlB]);

    // The user fades back to its own place; the hole and the wash clear.
    await Fx.anim(el, [
      { transform: `translate(${dx}px,${dy}px) scale(.8)`, opacity: 1 },
      { transform: `translate(${dx}px,${dy}px) scale(.8)`, opacity: 0 }
    ], { duration: 180, easing: 'ease-in', fill: 'forwards' });
    el.getAnimations?.().forEach((a) => a.cancel());
    el.style.opacity = '1';
    await Promise.all([
      Fx.anim(el, [{ opacity: 0 }, { opacity: 1 }], { duration: 250, easing: 'ease-out', fill: 'none' }),
      targetHole.close(),
      Fx.anim(wash, [{ opacity: 1 }, { opacity: 0 }], { duration: 350, easing: 'ease-in' })
    ]);
    wash.remove();
  }

  /** A black ink hole spreading flat on the ground at `foot`; `close()` shrinks it away. */
  private static hole(fxEl: HTMLElement, foot: Point, w: number): { close: () => Promise<void> } {
    const el = document.createElement('div');
    el.style.cssText = `width:${w}px;height:${w * 0.3}px;border-radius:50%;pointer-events:none;background:radial-gradient(ellipse,${HyperspaceHole.INK} 0 45%,#3A1A44cc 62%,#5A3A6400 75%)`;
    Fx.place(el, foot);
    fxEl.appendChild(el);
    Fx.anim(el, [{ transform: 'scale(0)' }, { transform: 'scale(1)' }], { duration: 300, easing: 'ease-out', fill: 'forwards' });
    return {
      close: () =>
        Fx.anim(el, [{ transform: 'scale(1)', opacity: 1 }, { transform: 'scale(.2)', opacity: 0 }], { duration: 250, easing: 'ease-in', fill: 'forwards' })
          .then(() => el.remove())
    };
  }

  /** Dark ink rings swirling inward on the ground at `foot`. */
  private static rings(fxEl: HTMLElement, foot: Point, w: number): Promise<unknown> {
    const done: Promise<void>[] = [];
    for (const [delay, k] of [[0, 1.2], [100, 0.95], [200, 0.7]] as const) {
      const ring = document.createElement('div');
      ring.style.cssText = `width:${w * k}px;height:${w * k * 0.3}px;border-radius:50%;pointer-events:none;border:3px solid #2A1434;border-top-color:#2A143400;opacity:.85`;
      Fx.place(ring, foot);
      fxEl.appendChild(ring);
      done.push(
        Fx.anim(ring, [
          { transform: 'scale(1.3)', opacity: 0 },
          { transform: 'scale(1)', opacity: 0.85, offset: 0.4 },
          { transform: 'scale(.4)', opacity: 0 }
        ], { duration: 600, delay, easing: 'ease-in' }).then(() => ring.remove())
      );
    }
    return Promise.all(done);
  }

  /** Thin black ink spikes shooting up from the ground round `foot`, then sinking back. */
  private static inkSpikes(fxEl: HTMLElement, foot: Point, spread: number, height: number): Promise<unknown> {
    const done: Promise<void>[] = [];
    for (let i = 0; i < 9; i++) {
      const h = Math.max(height, 30) * (0.5 + Math.random() * 0.7);
      const w = 4 + Math.random() * 4;
      const spike = document.createElement('div');
      spike.style.cssText =
        `position:absolute;left:${foot.x + (Math.random() * 2 - 1) * spread - w / 2}px;top:${foot.y - h + (Math.random() * 2 - 1) * 4}px;` +
        `width:${w}px;height:${h}px;transform-origin:50% 100%;pointer-events:none;clip-path:polygon(50% 0,100% 100%,0 100%);background:${HyperspaceHole.INK}`;
      fxEl.appendChild(spike);
      done.push(
        Fx.anim(spike, [
          { transform: 'scaleY(0)' },
          { transform: 'scaleY(1)', offset: 0.3 },
          { transform: 'scaleY(1)', offset: 0.6 },
          { transform: 'scaleY(0)' }
        ], { duration: 500, delay: Math.random() * 150, easing: 'ease-out' }).then(() => spike.remove())
      );
    }
    return Promise.all(done);
  }

  /** A pink-white burst in a yellow glow on the target, with a white bolt striking down. */
  private static strike(refs: BattleStageRefs, target: Point): Promise<unknown> {
    const { fxEl, targetEl } = refs;
    const r = Fx.rect(targetEl);
    const size = Math.max(r.width * 1.3, 100);
    const glow = document.createElement('div');
    glow.style.cssText = `width:${size * 2}px;height:${size * 2}px;border-radius:50%;pointer-events:none;background:radial-gradient(circle,#FFF8D0 0 15%,#FFE880aa 35%,#F0E06040 55%,#F0E06000 70%)`;
    const burst = FxGlyphs.spikyBurst(size, '#FF70C8', '#FFC0E8', '#ffffff');
    Fx.place(glow, target);
    Fx.place(burst, target);
    fxEl.append(glow, burst);

    const top = target.y - Math.max(r.height * 1.3, 90);
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('style', 'position:absolute;inset:0;width:100%;height:100%;overflow:visible;pointer-events:none;filter:drop-shadow(0 0 3px #ffffff) drop-shadow(0 0 2px #444)');
    const bolt = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
    bolt.setAttribute('points', Fx.zigzagPoints(target.x, top, target.x, target.y, 10));
    bolt.setAttribute('fill', 'none');
    bolt.setAttribute('stroke', '#ffffff');
    bolt.setAttribute('stroke-width', '4');
    svg.appendChild(bolt);
    fxEl.appendChild(svg);

    return Promise.all([
      Fx.anim(glow, [
        { transform: 'scale(.3)', opacity: 0 },
        { transform: 'scale(1)', opacity: 1, offset: 0.3 },
        { transform: 'scale(1.1)', opacity: 0 }
      ], { duration: 500, easing: 'ease-out' }).then(() => glow.remove()),
      Fx.anim(burst, [
        { transform: 'scale(.3) rotate(0deg)', opacity: 1 },
        { transform: 'scale(1) rotate(10deg)', opacity: 1, offset: 0.35 },
        { transform: 'scale(1.2) rotate(18deg)', opacity: 0 }
      ], { duration: 500, easing: 'ease-out' }).then(() => burst.remove()),
      Fx.anim(svg, [{ opacity: 1 }, { opacity: 0.3, offset: 0.3 }, { opacity: 1, offset: 0.5 }, { opacity: 0 }], { duration: 400, delay: 80, easing: 'linear', fill: 'backwards' })
        .then(() => svg.remove())
    ]);
  }
}
