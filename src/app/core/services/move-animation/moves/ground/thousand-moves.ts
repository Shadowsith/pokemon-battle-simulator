import { Point, BattleStageRefs } from '../../animation.types';
import { Fx } from '../../fx';
import { FxGlyphs } from '../../fx-glyphs';

/** Night sky both of Zygarde's signature moves play under. */
const NIGHT = 'background:linear-gradient(180deg,#060A1A,#101A34 55%,#1A2030)';

/** Thousand Arrows and Thousand Waves, Zygarde's green-light signature moves (after the XY animations). */
export class ThousandMoves {
  /**
   * Thousand Arrows: night falls and a glowing green sphere swells at the
   * user (0-0.75 s), a fan of green light arrows shoots up out of it into
   * the sky (0.6-1.15 s), then they rain down as green beams onto the
   * target's side (1.15-1.85 s; hit at 1.4 s) and leave green dust; the
   * night clears (to 2.4 s).
   * Reference: https://www.pokewiki.de/images/6/60/Tausend_Pfeile_Gen6.mp4
   */
  static async playArrows(refs: BattleStageRefs, launch: Point, target: Point) {
    const { fieldEl, fxEl, screenFxEl, launchEl, targetEl } = refs;
    const W = fieldEl.clientWidth;
    const H = fieldEl.clientHeight;
    const lr = Fx.rect(launchEl);
    const tr = Fx.rect(targetEl);
    const night = Fx.backdrop(fieldEl, NIGHT);
    await Fx.anim(night, [{ opacity: 0 }, { opacity: 1 }], { duration: 250, easing: 'ease-out' });

    const size = Math.max(lr.width * 1.1, 80);
    const sphere = Fx.box(size, size, 'border-radius:50%;background:radial-gradient(circle,#F0FFE0 0 15%,#7AF05A88 45%,#3AC82A44 65%,#3AC82A00 72%);box-shadow:0 0 24px #5AE04A');
    Fx.place(sphere, launch);
    fxEl.appendChild(sphere);
    await Fx.anim(sphere, [{ transform: 'scale(.2)', opacity: 0 }, { transform: 'scale(1)', opacity: 1 }], { duration: 450, easing: 'ease-out' });

    // A fan of arrows shoots up into the sky.
    const up: Promise<void>[] = [];
    for (let i = 0; i < 12; i++) {
      const angle = -40 + (i / 11) * 80 + (Math.random() * 2 - 1) * 4;
      const len = H * (0.35 + Math.random() * 0.2);
      const arrow = ThousandMoves.lightArrow(len);
      arrow.style.transformOrigin = '50% 100%';
      up.push(
        Fx.spawn(fxEl, arrow, { x: launch.x, y: launch.y - len / 2 }, [
          { transform: `rotate(${angle}deg) translateY(0) scaleY(.2)`, opacity: 0 },
          { transform: `rotate(${angle}deg) translateY(${-len * 0.3}px) scaleY(1)`, opacity: 1, offset: 0.3 },
          { transform: `rotate(${angle}deg) translateY(${-H * 1.2}px) scaleY(1)`, opacity: 1 }
        ], { duration: 520, delay: 150 + i * 25, easing: 'ease-in' })
      );
    }
    await Fx.wait(300);
    Fx.anim(sphere, [{ opacity: 1 }, { opacity: 0 }], { duration: 300, easing: 'ease-in' }).then(() => sphere.remove());
    await Promise.all(up);

    // They rain down onto the target's side.
    const down: Promise<unknown>[] = [];
    const spreadX = Math.max(tr.width * 1.6, 120);
    for (let i = 0; i < 20; i++) {
      const x = target.x + (Math.random() * 2 - 1) * spreadX * 0.6;
      const len = H * (0.3 + Math.random() * 0.15);
      const land = target.y + tr.height * (0.1 + Math.random() * 0.35);
      down.push(
        Fx.spawn(fxEl, ThousandMoves.lightArrow(len), { x, y: land - len / 2 }, [
          { transform: `translateY(${-land - len}px) rotate(180deg)`, opacity: 1 },
          { transform: 'translateY(0) rotate(180deg)', opacity: 1, offset: 0.8 },
          { transform: 'translateY(0) rotate(180deg) scaleY(.2)', opacity: 0 }
        ], { duration: 380, delay: i * 30, easing: 'ease-in' })
      );
    }
    await Fx.wait(250);
    Fx.screenWash(screenFxEl, '#7AF05A66', 80, 260, `${((target.x / W) * 100).toFixed(0)}%`);
    Fx.flash(targetEl, '#7AF05A', 0.7);
    Fx.shake(targetEl, 7);
    Fx.shakeField(fieldEl, 0.6);
    const foot = Fx.footOf(targetEl, fieldEl);
    for (let i = 0; i < 10; i++) {
      down.push(
        Fx.spawn(fxEl, Fx.box(8, 8, 'border-radius:50%;background:#5AC83A;box-shadow:0 0 6px #7AF05A'), { x: foot.x + (Math.random() * 2 - 1) * spreadX * 0.5, y: foot.y }, [
          { transform: 'translate(0,0) scale(1)', opacity: 1 },
          { transform: `translate(${(Math.random() * 2 - 1) * 20}px,${-10 - Math.random() * 20}px) scale(.3)`, opacity: 0 }
        ], { duration: 500, delay: 100 + i * 20, easing: 'ease-out' })
      );
    }
    await Promise.all(down);
    await Fx.anim(night, [{ opacity: 1 }, { opacity: 0 }], { duration: 300, easing: 'ease-in' });
    night.remove();
  }

  /** A slim green light arrow `len` px long, pointing up. */
  private static lightArrow(len: number): HTMLElement {
    const el = Fx.box(12, len, 'filter:drop-shadow(0 0 5px #5AE04A)');
    el.appendChild(Fx.box(12, len, 'left:0;top:0;clip-path:polygon(50% 0,100% 8%,65% 8%,65% 100%,35% 100%,35% 8%,0 8%);background:linear-gradient(180deg,#F0FFE0,#7AF05A 30%,#3AC82A00)'));
    return el;
  }

  /**
   * Thousand Waves: night falls and green hexagon cells spray up round the
   * user (0.2-0.75 s), roll over the ground to the target as a wave
   * (0.6-1.35 s) and burst round its feet in white-green flashes and a
   * yellow-green spark (1.2-1.8 s; hit at 1.25 s), then the night clears
   * (to 2.2 s).
   * Reference: https://www.pokewiki.de/images/0/04/Tausend_Wellen_Gen6.mp4
   */
  static async playWaves(refs: BattleStageRefs, launch: Point, target: Point) {
    const { fieldEl, fxEl, launchEl, targetEl } = refs;
    const lr = Fx.rect(launchEl);
    const tr = Fx.rect(targetEl);
    const lFoot = Fx.footOf(launchEl, fieldEl);
    const tFoot = Fx.footOf(targetEl, fieldEl);
    const night = Fx.backdrop(fieldEl, NIGHT);
    await Fx.anim(night, [{ opacity: 0 }, { opacity: 1 }], { duration: 200, easing: 'ease-out' });

    const cells: Promise<unknown>[] = [];
    const dx = tFoot.x - lFoot.x;
    const dy = tFoot.y - lFoot.y;
    for (let i = 0; i < 34; i++) {
      const s = 8 + Math.random() * 10;
      const white = i % 4 === 0;
      const hex = FxGlyphs.hexagon(s, white ? '#F4FFF0' : 'radial-gradient(circle,#9AF07A,#2AA82A)', white ? '#ffffff' : '#5AE04A');
      const start: Point = { x: lFoot.x + (Math.random() * 2 - 1) * lr.width * 0.6, y: lFoot.y - Math.random() * lr.height * 0.5 };
      const lift = 20 + Math.random() * 40;
      const lane = (Math.random() * 2 - 1) * tr.width * 0.5;
      const frames: Keyframe[] = [{ transform: 'translate(0,0) rotate(0deg) scale(.3)', opacity: 0 }, { transform: `translate(0,${-lift}px) rotate(60deg) scale(1)`, opacity: 1, offset: 0.25 }];
      for (let k = 1; k <= 4; k++) {
        const t = k / 4;
        frames.push({
          transform: `translate(${(dx + lane) * t + (lFoot.x - start.x) * t}px,${(dy + (lFoot.y - start.y)) * t - Math.abs(Math.sin(t * Math.PI * 2)) * 14}px) rotate(${60 + k * 60}deg) scale(1)`,
          opacity: 1,
          offset: 0.25 + t * 0.65
        });
      }
      frames.push({ transform: `translate(${dx + lane + lFoot.x - start.x}px,${dy + lFoot.y - start.y - 20}px) rotate(420deg) scale(.4)`, opacity: 0 });
      cells.push(Fx.spawn(fxEl, hex, start, frames, { duration: 1150, delay: i * 12, easing: 'linear' }));
    }
    await Fx.wait(1000);
    Fx.flash(targetEl, '#7AF05A', 0.7);
    Fx.shake(targetEl, 7);
    for (let i = 0; i < 4; i++) {
      const at: Point = { x: tFoot.x + (i - 1.5) * tr.width * 0.3, y: tFoot.y - Math.random() * 10 };
      cells.push(
        Fx.spawn(fxEl, Fx.box(40, 40, 'border-radius:50%;background:radial-gradient(circle,#ffffff 0 30%,#C8FFB0aa 50%,#7AF05A00 72%)'), at, [
          { transform: 'scale(.2)', opacity: 0 },
          { transform: 'scale(1)', opacity: 1, offset: 0.4 },
          { transform: 'scale(1.2)', opacity: 0 }
        ], { duration: 400, delay: i * 70, easing: 'ease-out' })
      );
    }
    cells.push(
      Fx.spawn(fxEl, FxGlyphs.spikyBurst(Math.max(tr.width * 0.6, 50), '#C8F03A', '#F0FF8A', '#ffffff'), { x: target.x + tr.width * 0.15, y: target.y }, [
        { transform: 'scale(.3)', opacity: 0 },
        { transform: 'scale(1)', opacity: 1, offset: 0.35 },
        { transform: 'scale(1.1)', opacity: 0 }
      ], { duration: 450, delay: 150, easing: 'ease-out' })
    );
    await Promise.all(cells);
    await Fx.anim(night, [{ opacity: 1 }, { opacity: 0 }], { duration: 300, easing: 'ease-in' });
    night.remove();
  }
}
