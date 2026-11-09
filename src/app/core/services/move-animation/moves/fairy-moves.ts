import { BattleStageRefs, MoveAnimRegistry, Point } from '../animation.types';
import { Fx } from '../fx';
import { FxGlyphs } from '../fx-glyphs';
import { FxEffects } from '../fx-effects';
import { DazzlingGleam } from './fairy/dazzling-gleam';
import { Geomancy } from './fairy/geomancy';

/** Hand-made animations for Fairy-type moves (Dazzling Gleam and Geomancy live in `fairy/`). */
export class FairyMoveAnimations {
  /** Hand-made Fairy move animations, by @pkmn/sim move id. */
  static readonly anims: MoveAnimRegistry = {
    dazzlinggleam: (refs, launch, target) => DazzlingGleam.play(refs, launch, target),
    geomancy: (refs, launch) => Geomancy.release(refs, launch),
    moonblast: (refs, launch, target) => FairyMoveAnimations.playMoonblast(refs, launch, target),
    moonlight: (refs, launch) => FairyMoveAnimations.playMoonlight(refs, launch),
    playrough: (refs, launch, target) => FairyMoveAnimations.playPlayRough(refs, launch, target)
  };

  /** Turn-1 animations of two-turn Fairy moves, by @pkmn/sim move id. */
  static readonly chargeAnims: MoveAnimRegistry = {
    geomancy: (refs, launch) => Geomancy.charge(refs, launch)
  };

  /**
   * Moonblast, after the XY animation: the scene turns deep magenta (0-0.3 s)
   * and a full moon sinks into view, glowing ever brighter as pink rays burst
   * out behind it (0.3-1.1 s), then flares white and fades; the field shows
   * through a pink tint (to 1.35 s). A white swirl rings the user's feet, a
   * glowing white orb flies to the target in a spray of pink streaks
   * (1.5-1.88 s) and explodes in a huge white flash with pink rings (to 2.55 s).
   */
  private static async playMoonblast(refs: BattleStageRefs, launch: Point, target: Point) {
    const { fieldEl, fxEl, screenFxEl, launchEl, targetEl } = refs;
    const W = fieldEl.clientWidth;
    const H = fieldEl.clientHeight;

    const sky = Fx.backdrop(fieldEl, 'background:radial-gradient(circle at 50% 35%,#9A2A5A,#6A1238 60%,#4A0A26)');
    await Fx.anim(sky, [{ opacity: 0 }, { opacity: 1 }], { duration: 300, easing: 'ease-out' });

    // The moon sinks into view, glowing brighter, with pink rays bursting out behind it.
    const size = Math.min(W, H) * 0.42;
    const at: Point = { x: W * 0.5, y: H * 0.38 };
    const rays = document.createElement('div');
    rays.style.cssText =
      `width:${size * 2.4}px;height:${size * 2.4}px;border-radius:50%;pointer-events:none;` +
      'background:repeating-conic-gradient(from 0deg,#FFD0E800 0 10deg,#FFD0E8cc 12deg 14deg,#FFD0E800 16deg 30deg);' +
      '-webkit-mask-image:radial-gradient(circle,#000 30%,transparent 70%);mask-image:radial-gradient(circle,#000 30%,transparent 70%)';
    Fx.place(rays, at);
    const moon = FairyMoveAnimations.moonGlyph(size);
    Fx.place(moon, at);
    sky.append(rays, moon);
    const sink = 800;
    await Promise.all([
      Fx.anim(moon, [
        { transform: `translateY(${-H * 0.45}px)`, filter: 'drop-shadow(0 0 4px #ffffff)' },
        { transform: 'translateY(0)', filter: 'drop-shadow(0 0 10px #ffffff)', offset: 0.6 },
        { transform: 'translateY(0) scale(1.05)', filter: 'drop-shadow(0 0 26px #ffffff) brightness(1.3)' }
      ], { duration: sink, easing: 'ease-out', fill: 'forwards' }),
      Fx.anim(rays, [
        { transform: 'scale(.6) rotate(0deg)', opacity: 0, offset: 0 },
        { transform: 'scale(.6) rotate(0deg)', opacity: 0, offset: 0.55 },
        { transform: 'scale(1.15) rotate(15deg)', opacity: 1 }
      ], { duration: sink, easing: 'ease-out', fill: 'forwards' })
    ]);
    // It flares white and fades; the field shows through a pink tint.
    await Promise.all([
      Fx.anim(moon, [{ opacity: 1, filter: 'brightness(1.3) drop-shadow(0 0 26px #fff)' }, { opacity: 0, filter: 'brightness(2.5) drop-shadow(0 0 40px #fff)' }], { duration: 250, easing: 'ease-in', fill: 'forwards' }),
      Fx.anim(rays, [{ opacity: 1 }, { opacity: 0 }], { duration: 250, easing: 'ease-in', fill: 'forwards' }),
      Fx.anim(sky, [{ opacity: 1 }, { opacity: 0.45 }], { duration: 250, easing: 'ease-in', fill: 'forwards' })
    ]);
    moon.remove();
    rays.remove();

    // A white swirl rings the user's feet.
    const lr = Fx.rect(launchEl);
    const foot = Fx.footOf(launchEl, fieldEl);
    const swirlW = Math.max(lr.width * 1.4, 90);
    const swirl = document.createElement('div');
    swirl.style.cssText = `width:${swirlW}px;height:${swirlW * 0.35}px;border-radius:50%;pointer-events:none;border:3px solid #ffffffdd;border-left-color:#ffffff00;box-shadow:0 0 8px #FFD0E8`;
    Fx.place(swirl, foot);
    fxEl.appendChild(swirl);
    Fx.anim(swirl, [
      { transform: 'scale(.5)', opacity: 0 },
      { transform: 'scale(1)', opacity: 1, offset: 0.4 },
      { transform: 'scale(1.3)', opacity: 0 }
    ], { duration: 500, easing: 'ease-out' }).then(() => swirl.remove());
    await Fx.wait(150);

    // The orb flies to the target in a spray of pink-white streaks.
    const orbSize = Math.max(lr.width * 0.45, 34);
    const orb = document.createElement('div');
    orb.style.cssText = `width:${orbSize}px;height:${orbSize}px;border-radius:50%;pointer-events:none;background:radial-gradient(circle,#ffffff 0 45%,#FFE0F0cc 60%,#FFB0D000 72%);box-shadow:0 0 16px 4px #ffffffcc`;
    Fx.place(orb, launch);
    fxEl.appendChild(orb);
    const dx = target.x - launch.x;
    const dy = target.y - launch.y;
    const flight = 380;
    const streaks: Promise<void>[] = [];
    for (let i = 0; i < 10; i++) {
      const t = i / 10;
      const len = 30 + Math.random() * 40;
      const ang = Math.random() * 360;
      const streak = document.createElement('div');
      streak.style.cssText = `position:absolute;width:${len}px;height:3px;border-radius:2px;pointer-events:none;background:linear-gradient(90deg,#FFB0D000,#FFD0E8,#ffffff)`;
      Fx.place(streak, { x: launch.x + dx * t, y: launch.y + dy * t });
      fxEl.appendChild(streak);
      streaks.push(
        Fx.anim(streak, [
          { transform: `rotate(${ang}deg) translateX(0) scaleX(.3)`, opacity: 1 },
          { transform: `rotate(${ang}deg) translateX(${len * 0.8}px) scaleX(1)`, opacity: 0 }
        ], { duration: 300, delay: flight * t, easing: 'ease-out' }).then(() => streak.remove())
      );
    }
    await Fx.anim(orb, [{ transform: 'translate(0,0) scale(.6)' }, { transform: `translate(${dx}px,${dy}px) scale(1.2)` }], { duration: flight, easing: 'ease-in' });
    orb.remove();

    // The explosion: a huge white flash and pink rings spreading.
    const tr = Fx.rect(targetEl);
    const flashSize = Math.max(tr.width * 2.4, 180);
    const flash = document.createElement('div');
    flash.style.cssText = `width:${flashSize}px;height:${flashSize}px;border-radius:50%;pointer-events:none;background:radial-gradient(circle,#ffffff 0 30%,#FFF0F8dd 45%,#FFD0E866 60%,#FFB0D000 72%)`;
    Fx.place(flash, target);
    fxEl.appendChild(flash);
    Fx.screenWash(screenFxEl, '#FFFFFFcc', 60, 200, `${((target.x / W) * 100).toFixed(0)}%`);
    Fx.shake(targetEl, 7);
    const effects: Promise<void>[] = [
      ...streaks,
      Fx.anim(flash, [
        { transform: 'scale(.2)', opacity: 1 },
        { transform: 'scale(1)', opacity: 1, offset: 0.3 },
        { transform: 'scale(1.1)', opacity: 0 }
      ], { duration: 550, easing: 'ease-out' }).then(() => flash.remove())
    ];
    for (const [delay, w] of [[100, 1], [220, 1.3]] as const) {
      const ring = document.createElement('div');
      const rs = Math.max(tr.width * 1.2, 90) * w;
      ring.style.cssText = `width:${rs}px;height:${rs * 0.6}px;border-radius:50%;pointer-events:none;border:3px solid #FFC0DC;border-top-color:#FFC0DC00;box-shadow:0 0 6px #FFC0DC`;
      Fx.place(ring, target);
      fxEl.appendChild(ring);
      effects.push(
        Fx.anim(ring, [{ transform: 'scale(.4)', opacity: 1 }, { transform: 'scale(1.5)', opacity: 0 }], { duration: 450, delay, easing: 'ease-out' }).then(() => ring.remove())
      );
    }
    await Promise.all(effects);
    await Fx.anim(sky, [{ opacity: 0.45 }, { opacity: 0 }], { duration: 300, easing: 'ease-in' });
    sky.remove();
  }

  /**
   * Play Rough, after the XY animation: dark radial speed lines flash round
   * the target while the user dashes into it (0-0.28 s). A big cartoon brawl
   * cloud swallows both, bubbling and jolting, with yellow stars and pink
   * hearts popping out of it (0.28-1.3 s). The cloud blows away and the user
   * is back in its place (to ~1.7 s).
   */
  private static async playPlayRough(refs: BattleStageRefs, launch: Point, target: Point) {
    const { fieldEl, fxEl, launchEl, targetEl } = refs;
    const r = Fx.rect(targetEl);

    // Speed lines round the target.
    const c = `${target.x}px ${target.y}px`;
    const lines = Fx.backdrop(
      fieldEl,
      `background:radial-gradient(circle at ${c},#0000 0 14%,#08080Acc 40%),repeating-conic-gradient(from 0deg at ${c},#1A1A20 0 7deg,#E8E8EE 7deg 8.5deg,#1A1A20 8.5deg 17deg),#1A1A20`
    );
    Fx.anim(lines, [{ opacity: 0 }, { opacity: 1, offset: 0.3 }, { opacity: 1, offset: 0.7 }, { opacity: 0 }], { duration: 520, easing: 'linear' })
      .then(() => lines.remove());

    // The dash: the user rushes into the target (no turning) and vanishes into the cloud.
    const original = launchEl.style.transform;
    const dx = (target.x - launch.x) * 0.8;
    const dy = (target.y - launch.y) * 0.8;
    await Fx.anim(launchEl, [
      { transform: `${original} translate(0,0)`, opacity: 1 },
      { transform: `${original} translate(${dx}px,${dy}px)`, opacity: 1 }
    ], { duration: 280, easing: 'ease-in', fill: 'none' });
    launchEl.style.opacity = '0';

    // The brawl cloud: white puffs with grey shading that bubble and jolt.
    const size = Math.max(r.width * 1.8, 130);
    const cloud = document.createElement('div');
    cloud.style.cssText = `width:${size}px;height:${size * 0.85}px;pointer-events:none;filter:drop-shadow(0 0 1px #555)`;
    Fx.place(cloud, target);
    fxEl.appendChild(cloud);
    const puffs: HTMLElement[] = [];
    for (let i = 0; i < 13; i++) {
      const s = size * (0.35 + Math.random() * 0.25);
      const ang = Math.random() * Math.PI * 2;
      const d = Math.random() * size * 0.28;
      const puff = document.createElement('div');
      puff.style.cssText =
        `position:absolute;left:${size / 2 + Math.cos(ang) * d - s / 2}px;top:${size * 0.425 + Math.sin(ang) * d * 0.8 - s / 2}px;width:${s}px;height:${s}px;border-radius:50%;` +
        'background:radial-gradient(circle at 40% 35%,#ffffff 0 45%,#E4E4EA 65%,#B8B8C2)';
      cloud.appendChild(puff);
      puffs.push(puff);
    }
    const hold = 1000;
    const bubbling = puffs.map((puff) =>
      Fx.anim(puff, [
        { transform: 'scale(.2)' },
        { transform: 'scale(1.05)', offset: 0.12 },
        { transform: 'scale(.92)', offset: 0.35 },
        { transform: 'scale(1.08)', offset: 0.6 },
        { transform: 'scale(.95)', offset: 0.85 },
        { transform: 'scale(1)' }
      ], { duration: hold, easing: 'ease-in-out', delay: Math.random() * 60 })
    );
    const jolts: Keyframe[] = [];
    for (let k = 0; k <= 10; k++) {
      const a = k === 0 || k === 10 ? 0 : 6;
      jolts.push({ transform: `translate(${(Math.random() * 2 - 1) * a}px,${(Math.random() * 2 - 1) * a * 0.6}px)` });
    }
    const jolt = Fx.anim(cloud, jolts, { duration: hold, easing: 'steps(10)' });

    // Stars and hearts pop out of the cloud in all directions.
    const pops: Promise<void>[] = [];
    for (let i = 0; i < 14; i++) {
      const heart = i % 3 === 1;
      const g = heart ? FxGlyphs.musicNote(12 + Math.random() * 6, '#FF6AB4', '♥') : FxGlyphs.fivePointStar(12 + Math.random() * 8, '#FFD83A', '#FFFBE0', '#FFD83A');
      Fx.place(g, target);
      fxEl.appendChild(g);
      const ang = Math.random() * Math.PI * 2;
      const d = size * (0.45 + Math.random() * 0.3);
      pops.push(
        Fx.anim(g, [
          { transform: 'translate(0,0) scale(.3)', opacity: 0 },
          { transform: `translate(${Math.cos(ang) * d * 0.7}px,${Math.sin(ang) * d * 0.6}px) scale(1)`, opacity: 1, offset: 0.4 },
          { transform: `translate(${Math.cos(ang) * d}px,${Math.sin(ang) * d * 0.8}px) scale(.8)`, opacity: 0 }
        ], { duration: 480, delay: 80 + i * 60, easing: 'ease-out' }).then(() => g.remove())
      );
    }
    for (const at of [150, 450, 750]) setTimeout(() => Fx.shake(targetEl, 5), at);
    await Promise.all([...bubbling, jolt]);

    // The cloud blows away; the user is back in its place.
    launchEl.style.opacity = '';
    const back = Fx.anim(launchEl, [{ opacity: 0 }, { opacity: 1 }], { duration: 250, easing: 'ease-out', fill: 'none' });
    const away = puffs.map((puff) => {
      const ang = Math.random() * Math.PI * 2;
      return Fx.anim(puff, [
        { transform: 'translate(0,0) scale(1)', opacity: 1 },
        { transform: `translate(${Math.cos(ang) * 20}px,${Math.sin(ang) * 14 - 10}px) scale(1.3)`, opacity: 0 }
      ], { duration: 380, easing: 'ease-out' });
    });
    await Promise.all([back, ...away, ...pops]);
    cloud.remove();
  }

  /**
   * Moonlight: the scene goes dark, then a dark-grey night sky fades in with a
   * full moon slowly rising while yellow stars twinkle down; the night clears
   * and green HP sparkles show the heal.
   */
  private static async playMoonlight(refs: BattleStageRefs, launch: Point) {
    const { fieldEl } = refs;
    const W = fieldEl.clientWidth;
    const H = fieldEl.clientHeight;

    // 1. Darkness.
    const dark = Fx.backdrop(fieldEl, 'background:#050508');
    await Fx.anim(dark, [{ opacity: 0 }, { opacity: 1 }], { duration: 300, easing: 'ease-out' });

    // 2. Dark-grey night sky with the moon rising and stars falling.
    const sky = document.createElement('div');
    sky.style.cssText = 'position:absolute;inset:0;overflow:hidden;background:radial-gradient(circle at 40% 40%,#55555C,#3A3A40 70%)';
    dark.appendChild(sky);
    await Fx.anim(sky, [{ opacity: 0 }, { opacity: 1 }], { duration: 300, easing: 'ease-out' });

    const rise = 1700;
    const size = Math.min(W, H) * 0.42;
    const moon = FairyMoveAnimations.moonGlyph(size);
    Fx.place(moon, { x: W * 0.42, y: H * 0.42 });
    sky.appendChild(moon);
    const moonDone = Fx.anim(moon, [
      { transform: `translateY(${H * 0.22}px)`, opacity: 0 },
      { transform: `translateY(${H * 0.12}px)`, opacity: 1, offset: 0.25 },
      { transform: 'translateY(0)', opacity: 1 }
    ], { duration: rise, easing: 'ease-out', fill: 'forwards' });

    const stars: Promise<void>[] = [];
    for (let i = 0; i < 22; i++) {
      const star = FxGlyphs.sparkStar(10 + Math.random() * 12, '#F6E04A');
      Fx.place(star, { x: Math.random() * W, y: Math.random() * H * 0.7 });
      sky.appendChild(star);
      const fall = H * (0.15 + Math.random() * 0.2);
      stars.push(
        Fx.anim(star, [
          { transform: 'translateY(0) scale(.3)', opacity: 0 },
          { transform: `translateY(${fall * 0.3}px) scale(1)`, opacity: 1, offset: 0.3 },
          { transform: `translateY(${fall * 0.7}px) scale(.8)`, opacity: 1, offset: 0.7 },
          { transform: `translateY(${fall}px) scale(.3)`, opacity: 0 }
        ], { duration: 900 + Math.random() * 400, easing: 'linear', delay: Math.random() * (rise - 900) }).then(() => star.remove())
      );
    }
    await Promise.all([moonDone, ...stars]);

    // 3. The night clears, then the heal.
    await Fx.anim(dark, [{ opacity: 1 }, { opacity: 0 }], { duration: 400, easing: 'ease-in' });
    dark.remove();
    await FxEffects.healSparkles(refs, launch);
  }

  /** A pale, glowing full moon `size` px across with soft grey craters. */
  private static moonGlyph(size: number): HTMLElement {
    const el = document.createElement('div');
    el.style.cssText =
      `position:absolute;width:${size}px;height:${size}px;border-radius:50%;pointer-events:none;` +
      'background:radial-gradient(circle at 32% 38%,#B9B7A4 0 9%,#B9B7A400 11%),' +
      'radial-gradient(circle at 58% 62%,#BFBDAA 0 13%,#BFBDAA00 15%),' +
      'radial-gradient(circle at 68% 30%,#C6C4B0 0 7%,#C6C4B000 9%),' +
      'radial-gradient(circle at 40% 75%,#C8C6B2 0 6%,#C8C6B200 8%),' +
      'radial-gradient(circle at 45% 40%,#F6F4E8,#DEDCCA 60%,#C2C0AC);' +
      `box-shadow:0 0 ${size * 0.25}px #FFFBD8aa,0 0 ${size * 0.6}px #FFFBD844`;
    return el;
  }
}
