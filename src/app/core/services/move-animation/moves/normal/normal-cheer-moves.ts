import { Point, BattleStageRefs, MoveAnimRegistry } from '../../animation.types';
import { Fx } from '../../fx';
import { FxGlyphs } from '../../fx-glyphs';
import { FxEffects } from '../../fx-effects';

/** Colours of the rainbow rays and ribbons. */
const RAINBOW = ['#FF3A3A', '#FF9A2A', '#FFE84A', '#4AD84A', '#3A9AFF', '#8A4AFF'];

/** Hand-made animations for the friendly Gen 6 Normal-type moves (celebrations, cheering, making friends). */
export class NormalCheerMoveAnimations {
  /** By @pkmn/sim move id. */
  static readonly anims: MoveAnimRegistry = {
    celebrate: (refs, launch) => NormalCheerMoveAnimations.playCelebrate(refs, launch),
    happyhour: (refs, launch) => NormalCheerMoveAnimations.playHappyHour(refs, launch),
    holdhands: (refs, launch, target) => NormalCheerMoveAnimations.playHoldHands(refs, launch, target),
    playnice: (refs, launch, target) => NormalCheerMoveAnimations.playPlayNice(refs, launch, target)
  };

  /**
   * Celebrate, after the XY animation: the scene goes black and a spotlight
   * falls on a red gift box with white stars and a green lid that hides the
   * user, sparkles twinkling round it (0-1.1 s); the lid pops off, the box
   * falls open and rainbow rays burst up behind the user (1.1-1.7 s) while
   * confetti rains down (1.3-2.6 s), then the scene returns (to 2.8 s).
   * Reference: https://www.pokewiki.de/images/6/65/Ehrentag_Gen6.mp4
   */
  private static async playCelebrate(refs: BattleStageRefs, launch: Point) {
    const { fieldEl, fxEl, launchEl } = refs;
    const W = fieldEl.clientWidth;
    const H = fieldEl.clientHeight;
    const lr = Fx.rect(launchEl);
    const foot = Fx.footOf(launchEl, fieldEl);
    const dark = Fx.backdrop(fieldEl, `background:radial-gradient(ellipse 22% 60% at ${launch.x}px ${foot.y - lr.height * 0.4}px,#5A5A5A,#202020 60%,#000 85%)`);
    await Fx.anim(dark, [{ opacity: 0 }, { opacity: 1 }], { duration: 300, easing: 'ease-out' });

    // The gift box hides the user; sparkles twinkle round it.
    const bw = Math.max(lr.width * 0.9, 60);
    const bh = Math.max(lr.height * 0.75, 50);
    const box = Fx.box(bw, bh, 'border-radius:3px;background:radial-gradient(circle,#ffffff 0 1.8px,#ffffff00 2.4px) 0 0/10px 10px,#E8282A;box-shadow:inset 0 -6px 10px #9A1010');
    const lid = Fx.box(bw * 1.12, bh * 0.2, 'border-radius:3px;background:radial-gradient(circle,#ffffff 0 1.8px,#ffffff00 2.4px) 0 0/10px 100%,#3AC83A;box-shadow:inset 0 -3px 4px #1A7A1A');
    const boxAt: Point = { x: launch.x, y: foot.y - bh / 2 };
    const lidAt: Point = { x: launch.x, y: foot.y - bh - bh * 0.08 };
    Fx.place(box, boxAt);
    Fx.place(lid, lidAt);
    fxEl.append(box, lid);
    const hidden = launchEl.style.opacity;
    launchEl.style.opacity = '0';
    const twinkle: Promise<unknown>[] = [
      Fx.anim(box, [{ transform: 'scale(.2)', opacity: 0 }, { transform: 'scale(1.05)', opacity: 1, offset: 0.6 }, { transform: 'scale(1)', opacity: 1 }], { duration: 300, easing: 'ease-out' }),
      Fx.anim(lid, [{ transform: 'scale(.2)', opacity: 0 }, { transform: 'scale(1.05)', opacity: 1, offset: 0.6 }, { transform: 'scale(1)', opacity: 1 }], { duration: 300, easing: 'ease-out' })
    ];
    for (let i = 0; i < 8; i++) {
      const at: Point = { x: launch.x + (Math.random() * 2 - 1) * bw * 0.8, y: foot.y - bh * (0.2 + Math.random() * 1.1) };
      twinkle.push(
        Fx.spawn(fxEl, FxGlyphs.sparkStar(12 + Math.random() * 8, '#ffffff'), at, [
          { transform: 'scale(0)', opacity: 0 },
          { transform: 'scale(1)', opacity: 1, offset: 0.5 },
          { transform: 'scale(0)', opacity: 0 }
        ], { duration: 400, delay: 200 + i * 70, easing: 'ease-out' })
      );
    }
    await Promise.all(twinkle);
    await Fx.wait(150);

    // The lid pops off, the box falls open, rainbow rays burst up.
    launchEl.style.opacity = hidden;
    const c = `${launch.x}px ${foot.y}px`;
    const stops = RAINBOW.map((col, i) => `${col} ${i * 6 + 1}deg ${i * 6 + 3}deg,#0000 ${i * 6 + 3.5}deg ${i * 6 + 6}deg`).join(',');
    const rays = Fx.box(W, H, `left:0;top:0;background:conic-gradient(from -18deg at ${c},${stops},#0000 36deg);-webkit-mask-image:linear-gradient(0deg,#000 30%,#0000);mask-image:linear-gradient(0deg,#000 30%,#0000)`);
    fieldEl.insertBefore(rays, dark.nextSibling);
    const open: Promise<unknown>[] = [
      Fx.anim(lid, [{ transform: 'translate(0,0) rotate(0deg)', opacity: 1 }, { transform: `translate(${bw * 0.6}px,${-bh * 1.4}px) rotate(40deg)`, opacity: 0 }], { duration: 500, easing: 'ease-out' }).then(() => lid.remove()),
      Fx.anim(box, [
        { transform: 'translateY(0) scale(1,1)', transformOrigin: '50% 100%', opacity: 1 },
        { transform: 'translateY(0) scale(1.5,.12)', transformOrigin: '50% 100%', opacity: 1, offset: 0.4 },
        { transform: 'translateY(0) scale(1.6,.1)', transformOrigin: '50% 100%', opacity: 0 }
      ], { duration: 1100, easing: 'ease-out' }).then(() => box.remove()),
      Fx.anim(rays, [{ opacity: 0, transform: 'scale(.8)' }, { opacity: 1, transform: 'scale(1)', offset: 0.2 }, { opacity: 1, offset: 0.7 }, { opacity: 0 }], { duration: 1200, easing: 'ease-out' }).then(() => rays.remove())
    ];
    // Confetti rains down.
    for (let i = 0; i < 30; i++) {
      const s = 5 + Math.random() * 5;
      const bit = Fx.box(s, s * 0.7, `background:${i % 3 ? '#ffffff' : '#FFE84A'};box-shadow:0 0 2px #00000055`);
      const x = W * Math.random();
      const fall = H * (0.6 + Math.random() * 0.4);
      open.push(
        Fx.spawn(fxEl, bit, { x, y: -10 }, [
          { transform: 'translate(0,0) rotate(0deg)', opacity: 1 },
          { transform: `translate(${(Math.random() * 2 - 1) * 30}px,${fall}px) rotate(${(Math.random() * 2 - 1) * 540}deg)`, opacity: 0.6 }
        ], { duration: 1100 + Math.random() * 300, delay: 200 + Math.random() * 400, easing: 'linear' })
      );
    }
    await Promise.all(open);
    await Fx.anim(dark, [{ opacity: 1 }, { opacity: 0 }], { duration: 250, easing: 'ease-in' });
    dark.remove();
  }

  /**
   * Happy Hour, after the XY animation: the scene dims and the user hops
   * happily twice (0-0.9 s) while golden firefly sparkles rise all round it
   * (0.2-1.5 s).
   * Reference: https://www.pokewiki.de/images/6/66/Goldene_Zeiten_Gen6.png
   */
  private static async playHappyHour(refs: BattleStageRefs, launch: Point) {
    const { fieldEl, fxEl, launchEl } = refs;
    const lr = Fx.rect(launchEl);
    const dim = Fx.backdrop(fieldEl, 'background:#1A2A10a8');
    const original = launchEl.style.transform;
    const hop = (y: number, offset?: number) => ({ transform: `${original} translateY(${y}px)`, ...(offset === undefined ? {} : { offset }) });
    const effects: Promise<unknown>[] = [
      Fx.anim(dim, [{ opacity: 0 }, { opacity: 1, offset: 0.2 }, { opacity: 1, offset: 0.75 }, { opacity: 0 }], { duration: 1500, easing: 'ease-in-out' }).then(() => dim.remove()),
      Fx.anim(launchEl, [hop(0), hop(-16, 0.25), hop(0, 0.5), hop(-16, 0.75), hop(0)], { duration: 900, easing: 'ease-in-out', fill: 'none' })
    ];
    for (let i = 0; i < 18; i++) {
      const at: Point = { x: launch.x + (Math.random() * 2 - 1) * lr.width * 0.9, y: launch.y + lr.height * (0.1 + Math.random() * 0.4) };
      const rise = lr.height * (0.4 + Math.random() * 0.5);
      effects.push(
        Fx.spawn(fxEl, Fx.box(6, 6, 'border-radius:50%;background:#FFF27A;box-shadow:0 0 6px 2px #FFD83A'), at, [
          { transform: 'translate(0,0)', opacity: 0 },
          { transform: `translate(${(Math.random() * 2 - 1) * 8}px,${-rise * 0.5}px)`, opacity: 1, offset: 0.4 },
          { transform: `translate(${(Math.random() * 2 - 1) * 14}px,${-rise}px)`, opacity: 0 }
        ], { duration: 800, delay: 200 + i * 30, easing: 'ease-out' })
      );
    }
    await Promise.all(effects);
  }

  /**
   * Hold Hands, after the XY animation: the scene turns deep magenta with a
   * pattern of stars and pink hearts float up (0-0.9 s), rainbow ribbons
   * swirl through the middle of the field (0.5-1.7 s), two white gloves meet
   * there and clasp in a rainbow ring of light (0.9-1.6 s), golden stars
   * burst out (1.5-2.1 s) and the scene fades through pale pink (to 2.4 s).
   * Reference: https://www.pokewiki.de/images/5/54/H%C3%A4ndchenhalten_Gen6.png
   */
  private static async playHoldHands(refs: BattleStageRefs, launch: Point, target: Point) {
    const { fieldEl, fxEl } = refs;
    const W = fieldEl.clientWidth;
    const H = fieldEl.clientHeight;
    const mid: Point = { x: (launch.x + target.x) / 2, y: (launch.y + target.y) / 2 };
    const scene = Fx.backdrop(fieldEl, 'background:radial-gradient(circle,#FF9AD866 0 2px,#0000 3px) 0 0/28px 28px,radial-gradient(circle at 50% 50%,#C0309A,#6A0A50)');
    const effects: Promise<unknown>[] = [
      Fx.anim(scene, [{ opacity: 0 }, { opacity: 1, offset: 0.15 }, { opacity: 1, offset: 0.8 }, { opacity: 0 }], { duration: 2400, easing: 'ease-in-out' }).then(() => scene.remove())
    ];
    for (let i = 0; i < 12; i++) {
      const at: Point = { x: W * (0.1 + Math.random() * 0.8), y: H * (0.4 + Math.random() * 0.5) };
      effects.push(
        Fx.spawn(fxEl, FxGlyphs.musicNote(14 + Math.random() * 10, '#FF7AC0', '♥'), at, [
          { transform: 'translateY(0) scale(.4)', opacity: 0 },
          { transform: 'translateY(-20px) scale(1)', opacity: 1, offset: 0.4 },
          { transform: 'translateY(-50px) scale(.8)', opacity: 0 }
        ], { duration: 900, delay: 100 + i * 50, easing: 'ease-out' })
      );
    }
    // Rainbow ribbons: thin flat rings in rainbow colours sweeping round the middle.
    for (let i = 0; i < 4; i++) {
      const w = W * (0.45 + i * 0.08);
      const ribbon = Fx.box(w, w * 0.22, `border-radius:50%;border:5px solid ${RAINBOW[(i * 2) % RAINBOW.length]};border-left-color:${RAINBOW[(i * 2 + 1) % RAINBOW.length]};border-bottom-color:${RAINBOW[(i * 2 + 2) % RAINBOW.length]};opacity:.85`);
      effects.push(
        Fx.spawn(fxEl, ribbon, { x: mid.x, y: mid.y + (i - 1.5) * 10 }, [
          { transform: `scale(.3) rotate(${i * 20 - 30}deg)`, opacity: 0 },
          { transform: `scale(1) rotate(${i * 10 - 15}deg)`, opacity: 0.9, offset: 0.35 },
          { transform: `scale(1.1) rotate(${i * 5}deg)`, opacity: 0 }
        ], { duration: 1200, delay: 500 + i * 60, easing: 'ease-out' })
      );
    }
    // The two gloves meet and clasp.
    const gw = 34;
    const gloves = [-1, 1].map((side) => {
      const g = FxGlyphs.gloveGlyph(gw);
      return Fx.spawn(fxEl, g, { x: mid.x + side * 6, y: mid.y }, [
        { transform: `translateX(${side * W * 0.3}px)`, opacity: 0 },
        { transform: `translateX(${side * gw * 0.15}px)`, opacity: 1, offset: 0.4 },
        { transform: `translateX(${side * gw * 0.15}px) scale(1.05)`, opacity: 1, offset: 0.85 },
        { transform: `translateX(${side * gw * 0.15}px) scale(1)`, opacity: 0 }
      ], { duration: 900, delay: 900, easing: 'ease-out' });
    });
    effects.push(...gloves);
    const ringSize = 90;
    const ring = Fx.box(ringSize, ringSize, `border-radius:50%;background:conic-gradient(${RAINBOW.join(',')},${RAINBOW[0]});-webkit-mask-image:radial-gradient(circle,#0000 55%,#000 58% 70%,#0000 74%);mask-image:radial-gradient(circle,#0000 55%,#000 58% 70%,#0000 74%);filter:drop-shadow(0 0 6px #ffffff)`);
    effects.push(
      Fx.spawn(fxEl, ring, mid, [
        { transform: 'scale(.3) rotate(0deg)', opacity: 0 },
        { transform: 'scale(1) rotate(90deg)', opacity: 1, offset: 0.4 },
        { transform: 'scale(1.3) rotate(180deg)', opacity: 0 }
      ], { duration: 600, delay: 1260, easing: 'ease-out' })
    );
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2;
      effects.push(
        Fx.spawn(fxEl, FxGlyphs.fivePointStar(16, '#FFD83A', '#FFFBE0', '#FFD83A'), mid, [
          { transform: 'translate(0,0) scale(.3)', opacity: 0 },
          { transform: `translate(${Math.cos(a) * 60}px,${Math.sin(a) * 40}px) scale(1)`, opacity: 1, offset: 0.5 },
          { transform: `translate(${Math.cos(a) * 80}px,${Math.sin(a) * 55}px) scale(.6)`, opacity: 0 }
        ], { duration: 600, delay: 1500, easing: 'ease-out' })
      );
    }
    await Promise.all(effects);
  }

  /**
   * Play Nice, after the XY animation: the user gives a friendly hop
   * (0-0.5 s), the scene brightens and golden stars and hearts twinkle round
   * the target (0.4-1.2 s), then its Attack falls (1.2-2.2 s).
   * Reference: https://www.pokewiki.de/images/8/86/Kameradschaft_Gen6.png
   */
  private static async playPlayNice(refs: BattleStageRefs, launch: Point, target: Point) {
    const { fieldEl, fxEl, launchEl, targetEl } = refs;
    const tr = Fx.rect(targetEl);
    const original = launchEl.style.transform;
    await Fx.anim(launchEl, [
      { transform: `${original} translateY(0)` },
      { transform: `${original} translateY(-14px)`, offset: 0.4 },
      { transform: `${original} translateY(0)` }
    ], { duration: 450, easing: 'ease-in-out', fill: 'none' });

    const bright = Fx.backdrop(fieldEl, 'background:#ffffff90');
    const effects: Promise<unknown>[] = [
      Fx.anim(bright, [{ opacity: 0 }, { opacity: 1, offset: 0.3 }, { opacity: 0 }], { duration: 800, easing: 'ease-in-out' }).then(() => bright.remove()),
      Fx.glow(targetEl, 'brightness(1.2) drop-shadow(0 0 8px #FFE07A)', 800)
    ];
    for (let i = 0; i < 9; i++) {
      const at: Point = { x: target.x + (Math.random() * 2 - 1) * tr.width * 0.7, y: target.y + (Math.random() * 2 - 1) * tr.height * 0.5 };
      const g = i % 3 === 1 ? FxGlyphs.musicNote(14, '#FF7AB4', '♥') : FxGlyphs.fivePointStar(14, '#FFD83A', '#FFFBE0', '#FFD83A');
      effects.push(
        Fx.spawn(fxEl, g, at, [
          { transform: 'scale(0)', opacity: 0 },
          { transform: 'translateY(-6px) scale(1.1)', opacity: 1, offset: 0.4 },
          { transform: 'translateY(-14px) scale(.6)', opacity: 0 }
        ], { duration: 550, delay: i * 50, easing: 'ease-out' })
      );
    }
    await Promise.all(effects);
    await FxEffects.statDropCloud(refs, target);
  }
}
