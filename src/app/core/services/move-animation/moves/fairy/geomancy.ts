import { Point, BattleStageRefs } from '../../animation.types';
import { Fx } from '../../fx';
import { FxEffects } from '../../fx-effects';

/** Rainbow colours of the gem shards and the light fan. */
const RAINBOW = ['#FF5A8A', '#FFA040', '#FFE84A', '#6AF06A', '#4AD8FF', '#6A7AFF', '#C86AFF'];

/**
 * Geomancy, after the XY animation (two turns).
 * Turn 1: the scene goes dark, white light pillars rise round the user, pink
 * rings spread at its feet and rainbow gem shards swirl up while it glows (~1.6 s).
 * Turn 2: the scene turns magenta, a fan of rainbow light bursts up from the
 * user's feet with a white flash and flying gems, a white glow spreads over
 * the ground, then its stats rise (~3.3 s).
 */
export class Geomancy {
  /** Turn 1: the user draws in power. */
  static async charge(refs: BattleStageRefs, launch: Point) {
    const { fieldEl, fxEl, launchEl } = refs;
    const r = Fx.rect(launchEl);
    const foot = Fx.footOf(launchEl, fieldEl);

    const dark = Fx.backdrop(fieldEl, 'background:#06040A');
    await Fx.anim(dark, [{ opacity: 0 }, { opacity: 1 }], { duration: 250, easing: 'ease-out' });

    const effects: Promise<unknown>[] = [
      Geomancy.pillars(fxEl, foot, r, 1100),
      Geomancy.footRings(fxEl, foot, r),
      Fx.anim(launchEl, [
        { filter: 'none' },
        { filter: 'brightness(1.2) drop-shadow(0 0 10px #8AFF9A)', offset: 0.5 },
        { filter: 'none' }
      ], { duration: 1100, easing: 'ease-in-out', fill: 'none' })
    ];
    // Gem shards swirl up round the user.
    for (let i = 0; i < 18; i++) {
      const gem = Geomancy.gem(RAINBOW[i % RAINBOW.length]);
      Fx.place(gem, foot);
      fxEl.appendChild(gem);
      const rx = Math.max(r.width * 0.6, 40);
      const phase = Math.random() * Math.PI * 2;
      const rise = r.height * (0.8 + Math.random() * 0.5);
      const frames: Keyframe[] = [];
      for (let k = 0; k <= 8; k++) {
        const t = k / 8;
        const a = phase + t * Math.PI * 2;
        frames.push({ transform: `translate(${Math.cos(a) * rx}px,${-rise * t + Math.sin(a) * 8}px) rotate(${t * 360}deg)`, opacity: t === 0 || t === 1 ? 0 : 1 });
      }
      effects.push(Fx.anim(gem, frames, { duration: 900, delay: 100 + i * 30, easing: 'linear' }).then(() => gem.remove()));
    }
    await Promise.all(effects);
    await Fx.anim(dark, [{ opacity: 1 }, { opacity: 0 }], { duration: 300, easing: 'ease-in' });
    dark.remove();
  }

  /** Turn 2: the power is unleashed and the user's stats rise. */
  static async release(refs: BattleStageRefs, launch: Point) {
    const { fieldEl, fxEl, launchEl } = refs;
    const r = Fx.rect(launchEl);
    const foot = Fx.footOf(launchEl, fieldEl);

    const back = Fx.backdrop(fieldEl, 'background:radial-gradient(circle at 50% 60%,#A04A78,#6A2448 60%,#3A1028)');
    await Fx.anim(back, [{ opacity: 0 }, { opacity: 1 }], { duration: 250, easing: 'ease-out' });
    const pillars = Geomancy.pillars(fxEl, foot, r, 600);
    const rings = Geomancy.footRings(fxEl, foot, r);
    await Fx.wait(450);

    // The rainbow fan bursts up from the feet.
    const effects: Promise<unknown>[] = [pillars, rings];
    const len = Math.max(r.height * 1.8, 150);
    for (let i = 0; i < 14; i++) {
      const ang = -165 + (i / 13) * 150 + (Math.random() * 2 - 1) * 4;
      const color = RAINBOW[i % RAINBOW.length];
      const beam = document.createElement('div');
      beam.style.cssText = `position:absolute;left:${foot.x}px;top:${foot.y - 5}px;width:${len}px;height:10px;transform-origin:0 50%;border-radius:5px;pointer-events:none;background:linear-gradient(90deg,#ffffff,${color} 30%,${color}00);filter:blur(1px)`;
      fxEl.appendChild(beam);
      effects.push(
        Fx.anim(beam, [
          { transform: `rotate(${ang}deg) scaleX(0)`, opacity: 1 },
          { transform: `rotate(${ang}deg) scaleX(1)`, opacity: 1, offset: 0.4 },
          { transform: `rotate(${ang}deg) scaleX(1.1)`, opacity: 0 }
        ], { duration: 600, delay: Math.random() * 100, easing: 'ease-out' }).then(() => beam.remove())
      );
    }
    const flashSize = Math.max(r.width * 1.4, 100);
    const flash = document.createElement('div');
    flash.style.cssText = `width:${flashSize}px;height:${flashSize}px;border-radius:50%;pointer-events:none;background:radial-gradient(circle,#ffffff 0 30%,#FFE8F4aa 50%,#FFC0E000 70%)`;
    Fx.place(flash, foot);
    fxEl.appendChild(flash);
    effects.push(
      Fx.anim(flash, [{ transform: 'scale(.3)', opacity: 1 }, { transform: 'scale(1.2)', opacity: 0 }], { duration: 500, easing: 'ease-out' }).then(() => flash.remove())
    );
    // Gems burst outward.
    for (let i = 0; i < 16; i++) {
      const gem = Geomancy.gem(RAINBOW[i % RAINBOW.length]);
      Fx.place(gem, { x: launch.x, y: launch.y });
      fxEl.appendChild(gem);
      const ang = Math.random() * Math.PI * 2;
      const d = Math.max(r.width, 70) * (0.8 + Math.random() * 0.6);
      effects.push(
        Fx.anim(gem, [
          { transform: 'translate(0,0) rotate(0deg)', opacity: 0 },
          { transform: `translate(${Math.cos(ang) * d * 0.4}px,${Math.sin(ang) * d * 0.4}px) rotate(120deg)`, opacity: 1, offset: 0.3 },
          { transform: `translate(${Math.cos(ang) * d}px,${Math.sin(ang) * d + 20}px) rotate(300deg)`, opacity: 0 }
        ], { duration: 700, delay: 150 + Math.random() * 150, easing: 'ease-out' }).then(() => gem.remove())
      );
    }
    await Promise.all(effects);

    // A white glow spreads over the ground; the user glows white.
    const groundW = Math.max(r.width * 3, 220);
    const ground = document.createElement('div');
    ground.style.cssText = `width:${groundW}px;height:${groundW * 0.22}px;border-radius:50%;pointer-events:none;background:radial-gradient(ellipse,#ffffff 0 25%,#FFF0F8aa 50%,#FFE0F000 72%)`;
    Fx.place(ground, foot);
    fxEl.appendChild(ground);
    await Promise.all([
      Fx.anim(ground, [{ transform: 'scale(.3)', opacity: 1 }, { transform: 'scale(1)', opacity: 1, offset: 0.4 }, { transform: 'scale(1.1)', opacity: 0 }], { duration: 500, easing: 'ease-out' }).then(() => ground.remove()),
      Fx.anim(launchEl, [{ filter: 'none' }, { filter: 'brightness(1.8) drop-shadow(0 0 10px #ffffff)', offset: 0.3 }, { filter: 'none' }], { duration: 500, easing: 'ease-out', fill: 'none' })
    ]);
    await Fx.anim(back, [{ opacity: 1 }, { opacity: 0 }], { duration: 250, easing: 'ease-in' });
    back.remove();

    await FxEffects.statUpAura(refs, launch);
  }

  /** White light pillars shooting up and flickering round the user for `duration` ms. */
  private static pillars(fxEl: HTMLElement, foot: Point, r: DOMRect, duration: number): Promise<unknown> {
    const done: Promise<void>[] = [];
    const h = Math.max(r.height * 1.8, 150);
    for (const [k, delay] of [[-1.1, 0], [1.1, 80], [-0.6, 160], [0.6, 240]] as const) {
      const w = 10 + Math.abs(k) * 4;
      const pillar = document.createElement('div');
      pillar.style.cssText =
        `position:absolute;left:${foot.x + k * Math.max(r.width * 0.55, 36) - w / 2}px;top:${foot.y - h}px;width:${w}px;height:${h}px;transform-origin:50% 100%;pointer-events:none;` +
        'background:linear-gradient(0deg,#ffffff,#ffffffcc 40%,#ffffff00);filter:blur(1.5px)';
      fxEl.appendChild(pillar);
      done.push(
        Fx.anim(pillar, [
          { transform: 'scaleY(0)', opacity: 1 },
          { transform: 'scaleY(1)', opacity: 1, offset: 0.2 },
          { transform: 'scaleY(1)', opacity: 0.5, offset: 0.45 },
          { transform: 'scaleY(1)', opacity: 1, offset: 0.7 },
          { transform: 'scaleY(1)', opacity: 0 }
        ], { duration: duration - delay, delay, easing: 'ease-out' }).then(() => pillar.remove())
      );
    }
    return Promise.all(done);
  }

  /** Two pink rings spreading flat over the ground at the user's feet. */
  private static footRings(fxEl: HTMLElement, foot: Point, r: DOMRect): Promise<unknown> {
    const done: Promise<void>[] = [];
    const w = Math.max(r.width * 1.3, 90);
    for (const delay of [0, 250]) {
      const ring = document.createElement('div');
      ring.style.cssText = `width:${w}px;height:${w * 0.3}px;border-radius:50%;pointer-events:none;border:3px solid #FF9AD0;box-shadow:0 0 8px #FF60B0`;
      Fx.place(ring, foot);
      fxEl.appendChild(ring);
      done.push(Fx.anim(ring, [{ transform: 'scale(.3)', opacity: 1 }, { transform: 'scale(1.4)', opacity: 0 }], { duration: 650, delay, easing: 'ease-out' }).then(() => ring.remove()));
    }
    return Promise.all(done);
  }

  /** A small glowing gem shard (a long diamond) in `color`. */
  private static gem(color: string): HTMLElement {
    const s = 7 + Math.random() * 6;
    const el = document.createElement('div');
    el.style.cssText = `width:${s * 0.55}px;height:${s}px;pointer-events:none;clip-path:polygon(50% 0,100% 50%,50% 100%,0 50%);background:linear-gradient(135deg,#ffffff,${color} 50%)`;
    return el;
  }
}
