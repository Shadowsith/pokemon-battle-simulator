import { Point, BattleStageRefs } from '../../animation.types';
import { Fx } from '../../fx';

/** The spout jets up for `SPOUT` ms; the drops rain down from `RAIN` (ms). */
const SPOUT = 600;
const RAIN = 500;
const DROPS = 16;

/**
 * Water Sport, after the Gen 4 / Gen 5 animation:
 * - Gen 4: https://www.pokewiki.de/images/6/68/Nassmacher_Gen4.png
 * - Gen 5: https://www.pokewiki.de/images/a/ad/Nassmacher_Gen5.png
 *
 * A white-blue fountain of water spouts up from the user and splashes
 * apart (0-0.6 s). Then the water rains back down over the whole field in
 * glinting drops (0.5-1.5 s).
 */
export class WaterSport {
  static async play(refs: BattleStageRefs, launch: Point) {
    const { fieldEl, fxEl, launchEl } = refs;
    const f = Fx.rect(fieldEl);
    const r = Fx.rect(launchEl);
    const w = Math.max(r.width, 50);
    const top: Point = { x: launch.x, y: launch.y - r.height * 0.35 };
    const jet = Fx.box(w * 0.45, w * 1.1, 'border-radius:45% 45% 20% 20%;background:linear-gradient(0deg,#9AD0FF00,#CDEBFFdd 30%,#FFFFFFee 75%,#FFFFFF00);filter:blur(1px)');
    jet.style.transformOrigin = '50% 100%';
    const effects: Promise<void>[] = [
      Fx.spawn(fxEl, jet, { x: top.x, y: top.y - w * 0.5 }, [
        { transform: 'scaleY(0)', opacity: 0 },
        { transform: 'scaleY(1)', opacity: 1, offset: 0.35 },
        { transform: 'scaleY(1.1) scaleX(1.3)', opacity: 0.8, offset: 0.7 },
        { transform: 'scaleY(.8) scaleX(1.8)', opacity: 0 }
      ], { duration: SPOUT, easing: 'ease-out' })
    ];
    for (let i = 0; i < 8; i++) {
      const a = -Math.PI / 2 + (i - 3.5) * 0.35;
      const d = w * 0.8;
      const spray = Fx.box(8, 8, 'border-radius:50%;background:radial-gradient(circle,#ffffff,#BFE4FF 55%,#7AC0FF00 75%)');
      effects.push(Fx.spawn(fxEl, spray, { x: top.x, y: top.y - w }, [
        { transform: 'translate(0,0)', opacity: 0 },
        { transform: `translate(${Math.cos(a) * d}px,${Math.sin(a) * d * 0.6}px)`, opacity: 1, offset: 0.5 },
        { transform: `translate(${Math.cos(a) * d * 1.3}px,${Math.sin(a) * d * 0.3 + 20}px)`, opacity: 0 }
      ], { duration: 400, delay: 250, easing: 'ease-out' }));
    }
    for (let i = 0; i < DROPS; i++) {
      const x = f.width * ((i * 0.37 + 0.03) % 1);
      const fall = f.height * (0.45 + ((i * 0.17) % 0.4));
      const drop = Fx.box(4, 12, 'border-radius:50% 50% 50% 50% / 30% 30% 70% 70%;background:linear-gradient(180deg,#ffffff,#9AD0FF);box-shadow:0 0 3px #CDEBFF');
      effects.push(Fx.spawn(fxEl, drop, { x, y: 0 }, [
        { transform: 'translateY(0)', opacity: 0 },
        { transform: `translateY(${fall * 0.2}px)`, opacity: 1, offset: 0.2 },
        { transform: `translateY(${fall}px)`, opacity: 0 }
      ], { duration: 550, delay: RAIN + (i * 61) % 450, easing: 'ease-in' }));
    }
    await Promise.all(effects);
  }
}
