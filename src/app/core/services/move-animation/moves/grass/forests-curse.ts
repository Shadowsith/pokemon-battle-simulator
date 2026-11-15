import { Point, BattleStageRefs } from '../../animation.types';
import { Fx } from '../../fx';

/**
 * Forest's Curse, after the XY animation:
 * https://www.pokewiki.de/images/2/2c/Waldesfluch_Gen6.png
 *
 * The scene goes black (0-0.25 s), then a purple dusk sky opens and dark,
 * twisted bare trees grow up all round the target while green spores drift
 * (0.25-1.4 s); the target takes on an eerie green glow (0.75-1.4 s), then
 * the forest sinks back into black and the field returns (to 1.9 s).
 */
export class ForestsCurse {
  static async play(refs: BattleStageRefs, target: Point) {
    const { fieldEl, fxEl, targetEl } = refs;
    const W = fieldEl.clientWidth;
    const H = fieldEl.clientHeight;
    const black = Fx.backdrop(fieldEl, 'background:#000');
    await Fx.anim(black, [{ opacity: 0 }, { opacity: 1 }], { duration: 250, easing: 'ease-out' });

    const dusk = Fx.backdrop(fieldEl, 'background:linear-gradient(180deg,#1A0A3A,#4A2A7A 45%,#2A1A3A)');
    black.after(dusk);
    // Trees grow up from the ground round the target, nearer ones larger and darker.
    for (let i = 0; i < 9; i++) {
      const near = i % 3 === 0;
      const h = H * (near ? 0.95 : 0.6 + Math.random() * 0.2);
      const x = Fx.clamp(target.x + (i - 4) * W * 0.11 + (Math.random() * 2 - 1) * 20, 0, W);
      const tree = ForestsCurse.tree(h, near ? '#140A1A' : '#3A2A40');
      tree.style.left = `${x - h * 0.3}px`;
      tree.style.top = `${H - h}px`;
      tree.style.transformOrigin = '50% 100%';
      dusk.appendChild(tree);
      tree.animate([{ transform: 'scaleY(0)' }, { transform: 'scaleY(1)' }], { duration: 500, delay: 100 + i * 40, easing: 'ease-out', fill: 'backwards' });
    }
    const effects: Promise<unknown>[] = [
      Fx.anim(dusk, [{ opacity: 0 }, { opacity: 1 }], { duration: 200, easing: 'ease-out' }),
      Fx.glow(targetEl, 'brightness(.9) sepia(1) saturate(4) hue-rotate(60deg) drop-shadow(0 0 8px #5AFF5A)', 700, 500)
    ];
    for (let i = 0; i < 14; i++) {
      const at: Point = { x: W * Math.random(), y: H * (0.3 + Math.random() * 0.6) };
      effects.push(
        Fx.spawn(fxEl, Fx.box(5, 5, 'border-radius:50%;background:#9AFF7A;box-shadow:0 0 6px #5AE04A'), at, [
          { transform: 'translate(0,0)', opacity: 0 },
          { transform: 'translate(6px,-12px)', opacity: 1, offset: 0.5 },
          { transform: 'translate(-4px,-26px)', opacity: 0 }
        ], { duration: 900, delay: 200 + i * 40, easing: 'ease-in-out' })
      );
    }
    await Promise.all(effects);
    await Fx.anim(dusk, [{ opacity: 1 }, { opacity: 0 }], { duration: 250, easing: 'ease-in' });
    dusk.remove();
    await Fx.anim(black, [{ opacity: 1 }, { opacity: 0 }], { duration: 250, easing: 'ease-in' });
    black.remove();
  }

  /** A bare, twisted tree silhouette `h` px tall: a crooked trunk with forking branches. */
  private static tree(h: number, color: string): HTMLElement {
    const w = h * 0.6;
    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg') as unknown as HTMLElement;
    svg.setAttribute('width', `${w}`);
    svg.setAttribute('height', `${h}`);
    svg.setAttribute('viewBox', '0 0 60 100');
    svg.setAttribute('preserveAspectRatio', 'none');
    svg.setAttribute('style', 'position:absolute;overflow:visible;pointer-events:none');
    let paths = '';
    const branch = (x: number, y: number, len: number, angle: number, width: number, depth: number) => {
      const bend = (Math.random() * 2 - 1) * 12;
      const x2 = x + Math.cos(angle) * len;
      const y2 = y + Math.sin(angle) * len;
      const cx = (x + x2) / 2 + bend;
      const cy = (y + y2) / 2;
      paths += `<path d="M${x.toFixed(1)},${y.toFixed(1)} Q${cx.toFixed(1)},${cy.toFixed(1)} ${x2.toFixed(1)},${y2.toFixed(1)}" stroke-width="${width.toFixed(1)}"/>`;
      if (depth > 0) {
        branch(x2, y2, len * 0.65, angle - 0.5 - Math.random() * 0.3, width * 0.6, depth - 1);
        branch(x2, y2, len * 0.65, angle + 0.5 + Math.random() * 0.3, width * 0.6, depth - 1);
      }
    };
    branch(30, 100, 42, -Math.PI / 2 + (Math.random() * 2 - 1) * 0.15, 7, 3);
    svg.innerHTML = `<g fill="none" stroke="${color}" stroke-linecap="round">${paths}</g>`;
    return svg;
  }
}
