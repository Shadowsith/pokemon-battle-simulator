import { Point, BattleStageRefs } from '../../animation.types';
import { Fx } from '../../fx';
import { FxGlyphs } from '../../fx-glyphs';

/** The orb leaves the target at `SEND` (ms) and reaches the user at `TAKE` (ms). */
const SEND = 550;
const TAKE = 950;

/**
 * Me First, after the Gen 4 / Gen 5 animation:
 * - Gen 4: https://www.pokewiki.de/images/e/e2/Egotrip_Gen4.png
 * - Gen 5: https://www.pokewiki.de/images/5/50/Egotrip_Gen5.png
 *
 * Pale blue swirls and sparkles flicker round the target (0-0.55 s), as if
 * its move is being read. A glowing cyan orb is snatched from it and flies
 * over to the user (0.55-0.95 s), which flashes deep blue-green inside a
 * spreading cyan ring (0.95-1.35 s); then the stolen move follows.
 */
export class MeFirst {
  static async play(refs: BattleStageRefs, launch: Point, target: Point) {
    const { fxEl, launchEl, targetEl } = refs;
    const tr = Fx.rect(targetEl);
    const lr = Fx.rect(launchEl);
    const effects: Promise<void>[] = [];
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      const arc = Fx.box(tr.width * 0.5, tr.width * 0.25, 'border-radius:50%;border-top:3px solid #BFEFFF;filter:drop-shadow(0 0 3px #9AE4FF)');
      effects.push(Fx.spawn(fxEl, arc, { x: target.x + Math.cos(a) * tr.width * 0.3, y: target.y + Math.sin(a) * tr.height * 0.3 }, [
        { transform: `rotate(${i * 60}deg) scale(.5)`, opacity: 0 },
        { transform: `rotate(${i * 60 + 60}deg) scale(1)`, opacity: 1, offset: 0.4 },
        { transform: `rotate(${i * 60 + 140}deg) scale(.8)`, opacity: 0 }
      ], { duration: 400, delay: (i * 53) % 180, easing: 'ease-out' }));
      effects.push(Fx.spawn(fxEl, FxGlyphs.sparkStar(8, '#E4F8FF'), { x: target.x - Math.cos(a) * tr.width * 0.35, y: target.y - Math.sin(a) * tr.height * 0.35 }, [
        { transform: 'scale(0)', opacity: 0 },
        { transform: 'scale(1)', opacity: 1, offset: 0.5 },
        { transform: 'scale(0)', opacity: 0 }
      ], { duration: 300, delay: 150 + i * 50, easing: 'ease-out' }));
    }
    const orb = Fx.box(18, 18, 'border-radius:50%;background:radial-gradient(circle,#ffffff 0 25%,#7AF0FF 50%,#3AC8E800 72%);filter:drop-shadow(0 0 6px #5AD8F0)');
    effects.push(Fx.spawn(fxEl, orb, target, [
      { transform: 'translate(0,0) scale(.4)', opacity: 0 },
      { transform: 'translate(0,0) scale(1.2)', opacity: 1, offset: 0.2 },
      { transform: `translate(${launch.x - target.x}px,${launch.y - target.y}px) scale(1)`, opacity: 1 }
    ], { duration: TAKE - SEND + 100, delay: SEND - 100, easing: 'ease-in' }));
    effects.push(Fx.wait(TAKE).then(() => {
      const s = Math.max(lr.width, lr.height, 60) * 0.7;
      return Promise.all([
        Fx.glow(launchEl, 'brightness(.6) sepia(1) hue-rotate(130deg) saturate(3)', 400),
        Fx.spawn(fxEl, Fx.box(s, s, 'border-radius:50%;border:3px solid #7AF0FF;box-shadow:0 0 8px #5AD8F0'), launch, [
          { transform: 'scale(.3)', opacity: 1 },
          { transform: 'scale(1.3)', opacity: 0 }
        ], { duration: 400, easing: 'ease-out' })
      ]).then(() => void 0);
    }));
    await Promise.all(effects);
  }
}
