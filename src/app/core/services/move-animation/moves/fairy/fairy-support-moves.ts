import { Point, BattleStageRefs, MoveAnimRegistry } from '../../animation.types';
import { Fx } from '../../fx';
import { FxGlyphs } from '../../fx-glyphs';
import { FxEffects } from '../../fx-effects';
import { TerrainFx } from '../../terrain-fx';

/** Gold of the Fairy Lock chains and padlocks. */
const GOLD = '#E8C24A';

/** Hand-made animations for the Gen 6 Fairy-type status and support moves. */
export class FairySupportMoveAnimations {
  /** By @pkmn/sim move id. */
  static readonly anims: MoveAnimRegistry = {
    aromaticmist: (refs, launch) => FairySupportMoveAnimations.playAromaticMist(refs, launch),
    babydolleyes: (refs, launch, target) => FairySupportMoveAnimations.playBabyDollEyes(refs, launch, target),
    craftyshield: (refs, launch, target) => FairySupportMoveAnimations.playCraftyShield(refs, launch, target),
    fairylock: (refs) => FairySupportMoveAnimations.playFairyLock(refs),
    flowershield: (refs, launch, target) => FairySupportMoveAnimations.playFlowerShield(refs, launch, target),
    mistyterrain: (refs, launch) => TerrainFx.play(refs, launch, TerrainFx.MISTY)
  };

  /** Where a sprite's eyes roughly are, in field coordinates. */
  private static headOf(el: HTMLElement, fieldEl: HTMLElement): Point {
    const r = Fx.rect(el);
    const f = Fx.rect(fieldEl);
    return { x: r.left - f.left + r.width / 2, y: r.top - f.top + r.height * 0.3 };
  }

  /**
   * Aromatic Mist, after the XY animation: a pink mist washes over the user's
   * side and pink puffs drift round it (0-1.0 s), pink sparkles twinkle on
   * the user (0.7-1.3 s), then its Sp. Def rises (1.2-2.0 s).
   * Reference: https://www.pokewiki.de/images/a/ae/Duftwolke_Gen6.png
   */
  private static async playAromaticMist(refs: BattleStageRefs, launch: Point) {
    const { fieldEl, fxEl, launchEl } = refs;
    const r = Fx.rect(launchEl);
    const mist = Fx.backdrop(fieldEl, `background:radial-gradient(circle at ${launch.x}px ${launch.y}px,#FF8AD8cc,#F070C0aa 40%,#E060B066 75%)`);
    const effects: Promise<unknown>[] = [
      Fx.anim(mist, [{ opacity: 0 }, { opacity: 1, offset: 0.3 }, { opacity: 1, offset: 0.6 }, { opacity: 0 }], { duration: 1100, easing: 'ease-in-out' }).then(() => mist.remove()),
      Fx.glow(launchEl, 'brightness(1.15) drop-shadow(0 0 10px #FF8AD8)', 1100)
    ];
    for (let i = 0; i < 10; i++) {
      const s = Math.max(r.width, 50) * (0.4 + Math.random() * 0.3);
      const puff = Fx.box(s, s, 'border-radius:50%;background:radial-gradient(circle,#FFC0E8cc,#FF8AD800 70%)');
      const at: Point = { x: launch.x + (Math.random() * 2 - 1) * r.width * 0.8, y: launch.y + (Math.random() * 2 - 1) * r.height * 0.5 };
      effects.push(
        Fx.spawn(fxEl, puff, at, [
          { transform: 'scale(.4)', opacity: 0 },
          { transform: 'translateY(-6px) scale(1)', opacity: 0.9, offset: 0.4 },
          { transform: 'translateY(-16px) scale(1.2)', opacity: 0 }
        ], { duration: 800, delay: i * 50, easing: 'ease-out' })
      );
    }
    for (let i = 0; i < 8; i++) {
      const at: Point = { x: launch.x + (Math.random() * 2 - 1) * r.width * 0.45, y: launch.y + (Math.random() * 2 - 1) * r.height * 0.45 };
      effects.push(
        Fx.spawn(fxEl, FxGlyphs.sparkStar(10 + Math.random() * 8, '#FF9AD8'), at, [
          { transform: 'scale(0)', opacity: 0 },
          { transform: 'scale(1.1)', opacity: 1, offset: 0.4 },
          { transform: 'scale(0)', opacity: 0 }
        ], { duration: 420, delay: 700 + i * 60, easing: 'ease-out' })
      );
    }
    await Promise.all(effects);
    await FxEffects.statUpAura(refs, launch);
  }

  /**
   * Baby-Doll Eyes, after the XY animation: the user's eyes catch the light,
   * white rays flare behind it and a glowing white ring flashes round its
   * eyes (0-0.8 s), blue-white glints fly to the target (0.75-1.15 s), then
   * its Attack falls (1.1-2.1 s).
   * Reference: https://www.pokewiki.de/images/d/d3/Kulleraugen_Gen6.png
   */
  private static async playBabyDollEyes(refs: BattleStageRefs, launch: Point, target: Point) {
    const { fieldEl, fxEl, launchEl } = refs;
    const r = Fx.rect(launchEl);
    const eyes = FairySupportMoveAnimations.headOf(launchEl, fieldEl);
    const c = `${eyes.x}px ${eyes.y}px`;
    const rays = Fx.backdrop(fieldEl, `background:radial-gradient(circle at ${c},#ffffffdd 0 8%,#ffffff00 45%),repeating-conic-gradient(from 0deg at ${c},#ffffff00 0 8deg,#ffffff99 9deg 11deg,#ffffff00 12deg 24deg)`);
    const ringSize = Math.max(r.width * 0.7, 50);
    const ring = Fx.box(ringSize, ringSize, 'border-radius:50%;border:5px solid #ffffff;box-shadow:0 0 12px #BFE8FF,inset 0 0 12px #BFE8FF');
    await Promise.all([
      Fx.anim(rays, [{ opacity: 0 }, { opacity: 0.9, offset: 0.4 }, { opacity: 0 }], { duration: 800, easing: 'ease-in-out' }).then(() => rays.remove()),
      Fx.spawn(fxEl, ring, eyes, [
        { transform: 'scale(.2)', opacity: 0 },
        { transform: 'scale(1)', opacity: 1, offset: 0.5 },
        { transform: 'scale(1.3)', opacity: 0 }
      ], { duration: 700, delay: 100, easing: 'ease-out' }),
      Fx.spawn(fxEl, FxGlyphs.sparkStar(ringSize * 0.6, '#BFE8FF'), eyes, [
        { transform: 'scale(0) rotate(0deg)', opacity: 0 },
        { transform: 'scale(1) rotate(45deg)', opacity: 1, offset: 0.5 },
        { transform: 'scale(0) rotate(90deg)', opacity: 0 }
      ], { duration: 600, delay: 200, easing: 'ease-out' })
    ]);

    const dx = target.x - eyes.x;
    const dy = target.y - eyes.y;
    const glints: Promise<void>[] = [];
    for (let i = 0; i < 6; i++) {
      glints.push(
        Fx.spawn(fxEl, FxGlyphs.sparkStar(12, '#9AD8FF'), eyes, [
          { transform: 'translate(0,0) scale(.5)', opacity: 0 },
          { transform: `translate(${dx * 0.3}px,${dy * 0.3 + (i % 2 ? -10 : 10)}px) scale(1)`, opacity: 1, offset: 0.3 },
          { transform: `translate(${dx}px,${dy}px) scale(.6)`, opacity: 0 }
        ], { duration: 380, delay: i * 40, easing: 'ease-in' })
      );
    }
    await Promise.all(glints);
    await FxEffects.statDropCloud(refs, target);
  }

  /**
   * Crafty Shield, after the XY animation: the scene takes a red tint and a
   * curved wall of glowing pink hexagons rises in front of the user's side,
   * one after another (0-0.9 s), shines and fades (to 1.5 s).
   * Reference: https://www.pokewiki.de/images/2/21/Trickschutz_Gen6.png
   */
  private static async playCraftyShield(refs: BattleStageRefs, launch: Point, target: Point) {
    const { fieldEl, fxEl, launchEl } = refs;
    const r = Fx.rect(launchEl);
    const tint = Fx.backdrop(fieldEl, 'background:radial-gradient(circle at 50% 60%,#E89A9Acc,#B04A4Acc)');
    // The wall faces the camera in front of the user: three staggered rows of
    // hexagons from its feet to its head, the ends bowing down toward the viewer.
    const foot = Fx.footOf(launchEl, fieldEl);
    const hex = Math.max(r.height * 0.26, 22);
    const centre: Point = { x: launch.x + (target.x - launch.x) * 0.3, y: foot.y - hex * 1.3 };
    const effects: Promise<void>[] = [
      Fx.anim(tint, [{ opacity: 0 }, { opacity: 0.8, offset: 0.2 }, { opacity: 0.8, offset: 0.7 }, { opacity: 0 }], { duration: 1500, easing: 'ease-in-out' }).then(() => tint.remove())
    ];
    let k = 0;
    for (const row of [0, 1, 2]) {
      for (let i = -3; i <= 3; i++) {
        const t = (i + (row % 2 ? 0.5 : 0)) / 3;
        const at: Point = { x: centre.x + t * hex * 2.7, y: centre.y + (row - 1) * hex * 0.8 + t * t * hex * 0.6 };
        effects.push(
          Fx.spawn(fxEl, FxGlyphs.hexagon(hex, 'linear-gradient(160deg,#FFF0FA,#FF8ADC 45%,#E83AB8)', '#FF4AC8'), at, [
            { transform: 'translateY(20px) scale(.3)', opacity: 0 },
            { transform: 'translateY(0) scale(1)', opacity: 0.95, offset: 0.3 },
            { transform: 'translateY(0) scale(1)', opacity: 0.95, offset: 0.75 },
            { transform: 'translateY(-6px) scale(1.05)', opacity: 0 }
          ], { duration: 1100, delay: k++ * 35, easing: 'ease-out' })
        );
      }
    }
    await Promise.all(effects);
  }

  /**
   * Fairy Lock, after the XY animation: golden chains hung with padlocks
   * slide across the whole field from both sides while white sparkles flash
   * (0-1.0 s), a big padlock drops into the middle and its shackle snaps
   * shut (1.0-1.5 s), then everything fades (to 1.9 s).
   * Reference: https://www.pokewiki.de/images/e/e6/Feenschloss_Gen6.png
   */
  private static async playFairyLock(refs: BattleStageRefs) {
    const { fieldEl, fxEl } = refs;
    const W = fieldEl.clientWidth;
    const H = fieldEl.clientHeight;
    const parts: HTMLElement[] = [];
    const effects: Promise<unknown>[] = [];

    for (const [i, y] of [H * 0.3, H * 0.52, H * 0.72].entries()) {
      const from = i % 2 ? 1 : -1;
      const angle = (i - 1) * 8;
      const chain = Fx.box(W * 1.4, 12, `left:${-W * 0.2}px;top:${y}px;transform-origin:50% 50%;filter:drop-shadow(0 0 4px #FFE88A)`);
      chain.style.background = `radial-gradient(ellipse 8px 4.5px at 9px 50%,#0000 3.5px,${GOLD} 4px 6px,#0000 6.5px) 0 0/16px 100% repeat-x`;
      for (let k = 0; k < 4; k++) {
        const lock = FairySupportMoveAnimations.padlock(22);
        lock.style.left = `${W * (0.3 + k * 0.25)}px`;
        lock.style.top = '6px';
        chain.appendChild(lock);
      }
      fxEl.appendChild(chain);
      parts.push(chain);
      effects.push(
        Fx.anim(chain, [
          { transform: `rotate(${angle}deg) translateX(${from * W}px)` },
          { transform: `rotate(${angle}deg) translateX(0)` }
        ], { duration: 600, delay: i * 120, easing: 'ease-out' })
      );
    }
    for (let i = 0; i < 6; i++) {
      const at: Point = { x: W * (0.15 + Math.random() * 0.7), y: H * (0.25 + Math.random() * 0.5) };
      effects.push(
        Fx.spawn(fxEl, FxGlyphs.sparkStar(26, '#ffffff'), at, [
          { transform: 'scale(0) rotate(0deg)', opacity: 0 },
          { transform: 'scale(1) rotate(45deg)', opacity: 1, offset: 0.5 },
          { transform: 'scale(0) rotate(90deg)', opacity: 0 }
        ], { duration: 350, delay: 300 + i * 100, easing: 'ease-out' })
      );
    }
    await Promise.all(effects);

    // The big padlock drops in and snaps shut.
    const size = H * 0.4;
    const big = FairySupportMoveAnimations.padlock(size);
    Fx.place(big, { x: W / 2, y: H * 0.42 });
    fxEl.appendChild(big);
    parts.push(big);
    const shackle = big.firstElementChild as HTMLElement;
    await Fx.anim(big, [{ transform: 'translateY(-40px) scale(.6)', opacity: 0 }, { transform: 'translateY(0) scale(1)', opacity: 1 }], { duration: 250, easing: 'ease-out' });
    await Fx.anim(shackle, [{ transform: `translateY(${-size * 0.2}px)` }, { transform: 'translateY(0)' }], { duration: 150, easing: 'ease-in' });
    Fx.shakeField(fieldEl, 0.3);
    await Fx.wait(250);
    await Promise.all(parts.map((p) => Fx.anim(p, [{ opacity: 1 }, { opacity: 0 }], { duration: 400, easing: 'ease-in' })));
    parts.forEach((p) => p.remove());
  }

  /** A golden padlock `w` px wide; its first child is the shackle (to snap it shut). */
  private static padlock(w: number): HTMLElement {
    const el = Fx.box(w, w * 1.25, 'filter:drop-shadow(0 0 3px #00000066)');
    const bar = Math.max(w * 0.14, 2);
    const shackle = Fx.box(w * 0.6, w * 0.6, `left:${w * 0.2}px;top:0;box-sizing:border-box;border:${bar}px solid #B8B8C0;border-bottom:none;border-radius:${w * 0.3}px ${w * 0.3}px 0 0`);
    const body = Fx.box(w, w * 0.75, `left:0;top:${w * 0.5}px;border-radius:${w * 0.12}px;background:linear-gradient(135deg,#FFF0A0,${GOLD} 45%,#A87A1A)`);
    const hole = Fx.box(w * 0.16, w * 0.3, `left:${w * 0.42}px;top:${w * 0.2}px;border-radius:${w * 0.08}px ${w * 0.08}px 2px 2px;background:#4A3008`);
    body.appendChild(hole);
    el.append(shackle, body);
    return el;
  }

  /**
   * Flower Shield, after the XY animation: the scene turns purple and a
   * magenta wind swirls round the field carrying pink and white petals while
   * the ground glows pink (0-1.4 s); every Pokémon glows pink as it passes
   * (0.5-1.5 s), then it fades (to 1.8 s).
   * Reference: https://www.pokewiki.de/images/c/c0/Floraschutz_Gen6.png
   */
  private static async playFlowerShield(refs: BattleStageRefs, launch: Point, target: Point) {
    const { fieldEl, fxEl, launchEl, targetEl } = refs;
    const W = fieldEl.clientWidth;
    const H = fieldEl.clientHeight;
    const scene = Fx.backdrop(fieldEl, 'background:radial-gradient(ellipse at 50% 85%,#FF5AD8cc,#B04AC0aa 40%,#6A2A8A99 80%)');
    const swirl = Fx.box(W * 1.1, H * 0.55, `left:${-W * 0.05}px;top:${H * 0.3}px;border-radius:50%;border:${H * 0.08}px solid #F07AE8aa;border-left-color:#F07AE800;border-right-color:#F07AE822;filter:blur(3px)`);
    fxEl.appendChild(swirl);
    const effects: Promise<unknown>[] = [
      Fx.anim(scene, [{ opacity: 0 }, { opacity: 1, offset: 0.2 }, { opacity: 1, offset: 0.75 }, { opacity: 0 }], { duration: 1800, easing: 'ease-in-out' }).then(() => scene.remove()),
      Fx.anim(swirl, [
        { transform: 'rotate(0deg) scale(.8)', opacity: 0 },
        { transform: 'rotate(120deg) scale(1)', opacity: 1, offset: 0.3 },
        { transform: 'rotate(420deg) scale(1.05)', opacity: 0 }
      ], { duration: 1500, easing: 'linear' }).then(() => swirl.remove()),
      Fx.glow(launchEl, 'brightness(1.1) sepia(.4) saturate(1.8) hue-rotate(-80deg) drop-shadow(0 0 8px #FF6AD8)', 1000, 500),
      Fx.glow(targetEl, 'brightness(1.1) sepia(.4) saturate(1.8) hue-rotate(-80deg) drop-shadow(0 0 8px #FF6AD8)', 1000, 600)
    ];
    // Petals ride the wind round the field.
    const centre: Point = { x: (launch.x + target.x) / 2, y: H * 0.58 };
    for (let i = 0; i < 26; i++) {
      const petal = FxGlyphs.petalGlyph(9 + Math.random() * 5, i % 3 ? '#FF9AD0' : '#ffffff', '#FFE8F4', i % 3 ? '#E05AA8' : '#E8D8F0');
      const phase = Math.random() * Math.PI * 2;
      const frames: Keyframe[] = [];
      for (let k = 0; k <= 8; k++) {
        const a = phase + (k / 8) * Math.PI * 2;
        frames.push({ transform: `translate(${Math.cos(a) * W * 0.45}px,${Math.sin(a) * H * 0.22}px) rotate(${k * 90}deg)`, opacity: k === 0 || k === 8 ? 0 : 1 });
      }
      effects.push(Fx.spawn(fxEl, petal, centre, frames, { duration: 1200, delay: i * 25, easing: 'linear' }));
    }
    await Promise.all(effects);
  }
}
