import { Point, BattleStageRefs } from '../../animation.types';
import { Fx } from '../../fx';
import { FxGlyphs } from '../../fx-glyphs';

/**
 * Steam Eruption, after the XY animation: the user glows white while steam
 * jets burst out of it sideways and upward with pressure rings (0-0.8 s).
 * White steam floods the field and rushes to the target (0.45-1.1 s). A hot
 * yellow-white blast hits the target, which glows orange (1.05-1.9 s), then
 * it cools down dark red while a steam column rises off it (to ~2.7 s).
 */
export class SteamEruption {
  private static readonly HOT = 'sepia(1) saturate(5) hue-rotate(-12deg) brightness(1.25)';
  private static readonly COOLING = 'sepia(1) saturate(4) hue-rotate(-30deg) brightness(.8)';

  static async play(refs: BattleStageRefs, launch: Point, target: Point) {
    const { fieldEl, fxEl } = refs;
    const layer = document.createElement('div');
    layer.style.cssText = 'position:absolute;inset:0;overflow:hidden;pointer-events:none';
    fxEl.appendChild(layer);

    const charge = SteamEruption.charge(refs, layer, launch);
    await Fx.wait(450);
    const flood = SteamEruption.flood(layer, fieldEl, launch, target);
    await Fx.wait(600);
    await SteamEruption.blast(refs, layer, target);
    await SteamEruption.coolDown(refs, layer, target);
    await Promise.all([charge, flood]);
    layer.remove();
  }

  /** The user glows white; steam jets shoot out to both sides and upward, with pressure rings. */
  private static charge(refs: BattleStageRefs, layer: HTMLElement, launch: Point): Promise<unknown> {
    const { launchEl } = refs;
    const r = Fx.rect(launchEl);
    const glow = Fx.anim(launchEl, [
      { filter: 'none' },
      { filter: 'brightness(1.5) drop-shadow(0 0 10px #ffffff)', offset: 0.25 },
      { filter: 'brightness(1.3) drop-shadow(0 0 6px #ffffff)', offset: 0.6 },
      { filter: 'brightness(1.6) drop-shadow(0 0 12px #ffffff)', offset: 0.8 },
      { filter: 'none' }
    ], { duration: 900, easing: 'ease-in-out', fill: 'none' });

    const effects: Promise<unknown>[] = [glow];
    const len = Math.max(r.width * 1.6, 120);
    // Jets: left, right and straight up from the upper body.
    const origin: Point = { x: launch.x, y: launch.y - r.height * 0.15 };
    for (const [deg, delay] of [[180, 0], [0, 60], [-90, 140], [-150, 200], [-30, 240]] as const) {
      const jet = document.createElement('div');
      const w = deg === -90 ? len * 0.8 : len;
      jet.style.cssText =
        `position:absolute;left:${origin.x}px;top:${origin.y - 7}px;width:${w}px;height:14px;transform-origin:0 50%;pointer-events:none;` +
        'border-radius:7px;filter:blur(2px);background:linear-gradient(90deg,#ffffff,#F4F8FFdd 50%,#E8EEF600)';
      layer.appendChild(jet);
      effects.push(
        Fx.anim(jet, [
          { transform: `rotate(${deg}deg) scaleX(0) scaleY(.6)`, opacity: 1 },
          { transform: `rotate(${deg}deg) scaleX(1) scaleY(1)`, opacity: 1, offset: 0.4 },
          { transform: `rotate(${deg}deg) scaleX(1.15) scaleY(1.8)`, opacity: 0 }
        ], { duration: 650, delay, easing: 'ease-out' }).then(() => jet.remove())
      );
      // Steam puffs billow along the jet.
      const rad = (deg * Math.PI) / 180;
      for (let k = 0; k < 4; k++) {
        const s = 22 + Math.random() * 18;
        const puff = SteamEruption.puff(s);
        Fx.place(puff, origin);
        layer.appendChild(puff);
        const d = w * (0.35 + k * 0.2);
        effects.push(
          Fx.anim(puff, [
            { transform: 'translate(0,0) scale(.3)', opacity: 0 },
            { transform: `translate(${Math.cos(rad) * d * 0.6}px,${Math.sin(rad) * d * 0.6}px) scale(1)`, opacity: 0.9, offset: 0.35 },
            { transform: `translate(${Math.cos(rad) * d}px,${Math.sin(rad) * d - 10}px) scale(1.6)`, opacity: 0 }
          ], { duration: 700, delay: delay + k * 50, easing: 'ease-out' }).then(() => puff.remove())
        );
      }
    }
    // Two pressure rings swell out from the user.
    for (const delay of [0, 280]) {
      const size = Math.max(r.width, 70);
      const ring = document.createElement('div');
      ring.style.cssText = `width:${size}px;height:${size}px;border-radius:50%;pointer-events:none;border:3px solid #ffffffcc;box-shadow:0 0 8px #ffffff`;
      Fx.place(ring, origin);
      layer.appendChild(ring);
      effects.push(
        Fx.anim(ring, [
          { transform: 'scale(.3)', opacity: 0.9 },
          { transform: 'scale(1.8)', opacity: 0 }
        ], { duration: 550, delay, easing: 'ease-out' }).then(() => ring.remove())
      );
    }
    return Promise.all(effects);
  }

  /** White steam floods the field from the user and a stream of puffs rushes to the target. */
  private static flood(layer: HTMLElement, fieldEl: HTMLElement, launch: Point, target: Point): Promise<unknown> {
    const W = fieldEl.clientWidth;
    const H = fieldEl.clientHeight;
    const fog = document.createElement('div');
    fog.style.cssText =
      'position:absolute;inset:0;pointer-events:none;' +
      `background:radial-gradient(ellipse at ${launch.x}px ${launch.y}px,#ffffff 0 20%,#F2F5FAcc 55%,#E4EAF288 100%)`;
    layer.insertBefore(fog, layer.firstChild);
    const effects: Promise<unknown>[] = [
      Fx.anim(fog, [
        { opacity: 0 },
        { opacity: 0.85, offset: 0.45 },
        { opacity: 0.6, offset: 0.7 },
        { opacity: 0 }
      ], { duration: 1300, easing: 'ease-in-out' }).then(() => fog.remove())
    ];
    const dx = target.x - launch.x;
    const dy = target.y - launch.y;
    const spread = Math.min(W, H) * 0.12;
    for (let i = 0; i < 16; i++) {
      const s = 30 + Math.random() * 30;
      const puff = SteamEruption.puff(s);
      Fx.place(puff, launch);
      layer.appendChild(puff);
      const off = (Math.random() * 2 - 1) * spread;
      effects.push(
        Fx.anim(puff, [
          { transform: 'translate(0,0) scale(.4)', opacity: 0 },
          { transform: `translate(${dx * 0.3}px,${dy * 0.3 + off * 0.5}px) scale(1)`, opacity: 0.95, offset: 0.3 },
          { transform: `translate(${dx}px,${dy + off}px) scale(1.5)`, opacity: 0 }
        ], { duration: 520, delay: i * 30, easing: 'ease-in' }).then(() => puff.remove())
      );
    }
    return Promise.all(effects);
  }

  /** A hot yellow-white blast on the target with sparks flying up and out; the target glows orange. */
  private static async blast(refs: BattleStageRefs, layer: HTMLElement, target: Point) {
    const { fieldEl, targetEl } = refs;
    const r = Fx.rect(targetEl);
    const size = Math.max(r.width * 1.5, 110);
    const hit: Point = { x: target.x, y: target.y + r.height * 0.15 };

    const heat = document.createElement('div');
    heat.style.cssText = `width:${size * 1.8}px;height:${size * 1.8}px;border-radius:50%;pointer-events:none;background:radial-gradient(circle,#FFFDF0 0 12%,#FFE680cc 30%,#FFB04066 55%,#FF904000 72%)`;
    Fx.place(heat, hit);
    const burst = FxGlyphs.spikyBurst(size, '#FFB030', '#FFE870', '#FFFFF4');
    Fx.place(burst, hit);
    layer.append(heat, burst);

    const total = 850;
    const effects: Promise<unknown>[] = [
      Fx.anim(heat, [
        { transform: 'scale(.3)', opacity: 0 },
        { transform: 'scale(1)', opacity: 1, offset: 0.2 },
        { transform: 'scale(1.05)', opacity: 0.9, offset: 0.7 },
        { transform: 'scale(1.1)', opacity: 0 }
      ], { duration: total, easing: 'ease-out' }).then(() => heat.remove()),
      Fx.anim(burst, [
        { transform: 'scale(.3) rotate(0deg)', opacity: 1 },
        { transform: 'scale(1) rotate(10deg)', opacity: 1, offset: 0.3 },
        { transform: 'scale(1.1) rotate(16deg)', opacity: 0.8, offset: 0.7 },
        { transform: 'scale(1.2) rotate(22deg)', opacity: 0 }
      ], { duration: total, easing: 'ease-out' }).then(() => burst.remove()),
      Fx.anim(targetEl, [
        { filter: 'none' },
        { filter: SteamEruption.HOT, offset: 0.15 },
        { filter: SteamEruption.HOT }
      ], { duration: total, easing: 'ease-out', fill: 'none' })
    ];
    Fx.shake(targetEl, 6);
    Fx.shakeField(fieldEl, 0.6);

    // Bright sparks spray out of the blast, mostly upward.
    for (let i = 0; i < 22; i++) {
      const ang = -90 + (Math.random() * 2 - 1) * 80;
      const l = size * (0.25 + Math.random() * 0.25);
      const spark = document.createElement('div');
      spark.style.cssText = `position:absolute;width:${l}px;height:3px;border-radius:2px;pointer-events:none;background:linear-gradient(90deg,#FFE45A00,#FFE45A 50%,#FFFFF4);box-shadow:0 0 4px #FFC040`;
      Fx.place(spark, hit);
      layer.appendChild(spark);
      const d = size * (0.5 + Math.random() * 0.5);
      effects.push(
        Fx.anim(spark, [
          { transform: `rotate(${ang}deg) translateX(${size * 0.1}px) scaleX(.3)`, opacity: 1 },
          { transform: `rotate(${ang}deg) translateX(${d}px) scaleX(1)`, opacity: 0 }
        ], { duration: 420 + Math.random() * 200, delay: Math.random() * 450, easing: 'ease-out' }).then(() => spark.remove())
      );
    }
    await Promise.all(effects);
  }

  /** The target cools from dark red back to normal while a steam column rises off it. */
  private static async coolDown(refs: BattleStageRefs, layer: HTMLElement, target: Point) {
    const { targetEl } = refs;
    const r = Fx.rect(targetEl);
    const total = 800;
    const effects: Promise<unknown>[] = [
      Fx.anim(targetEl, [
        { filter: SteamEruption.HOT },
        { filter: SteamEruption.COOLING, offset: 0.3 },
        { filter: SteamEruption.COOLING, offset: 0.6 },
        { filter: 'none' }
      ], { duration: total, easing: 'ease-in-out', fill: 'none' })
    ];
    const top: Point = { x: target.x, y: target.y - r.height * 0.35 };
    for (let i = 0; i < 10; i++) {
      const s = 18 + Math.random() * 16;
      const puff = SteamEruption.puff(s);
      Fx.place(puff, { x: top.x + (Math.random() * 2 - 1) * r.width * 0.15, y: top.y });
      layer.appendChild(puff);
      const rise = Math.max(r.height * 0.9, 70);
      const sway = (Math.random() * 2 - 1) * 12;
      effects.push(
        Fx.anim(puff, [
          { transform: 'translate(0,0) scale(.4)', opacity: 0 },
          { transform: `translate(${sway * 0.5}px,${-rise * 0.35}px) scale(.9)`, opacity: 0.8, offset: 0.3 },
          { transform: `translate(${sway}px,${-rise}px) scale(1.5)`, opacity: 0 }
        ], { duration: 650, delay: i * 50, easing: 'ease-out' }).then(() => puff.remove())
      );
    }
    await Promise.all(effects);
  }

  /** A soft white steam puff `size` px across. */
  private static puff(size: number): HTMLElement {
    const el = document.createElement('div');
    el.style.cssText = `width:${size}px;height:${size}px;border-radius:50%;pointer-events:none;background:radial-gradient(circle at 40% 35%,#ffffff,#EEF2F8cc 50%,#DDE4EE00 72%)`;
    return el;
  }
}
