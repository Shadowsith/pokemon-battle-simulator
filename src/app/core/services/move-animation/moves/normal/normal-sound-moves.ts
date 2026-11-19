import { Point, BattleStageRefs, MoveAnimRegistry } from '../../animation.types';
import { DIM_BACKDROP } from '../../animation.constants';
import { Fx } from '../../fx';
import { FxGlyphs } from '../../fx-glyphs';
import { FxEffects } from '../../fx-effects';
import { RelicSong } from './relic-song';

/** Hand-made animations for Normal-type sound moves (Relic Song lives in `relic-song.ts`). */
export class NormalSoundMoveAnimations {
  /** By @pkmn/sim move id. */
  static readonly anims: MoveAnimRegistry = {
    boomburst: (refs, launch, target) => NormalSoundMoveAnimations.playBoomburst(refs, launch, target),
    confide: (refs, launch, target) => NormalSoundMoveAnimations.playConfide(refs, launch, target),
    growl: (refs, launch, target) => NormalSoundMoveAnimations.playGrowl(refs, launch, target),
    nobleroar: (refs, launch, target) => NormalSoundMoveAnimations.playNobleRoar(refs, launch, target),
    relicsong: (refs, launch, target) => RelicSong.play(refs, launch, target),
    roar: (refs, launch, target) => NormalSoundMoveAnimations.playRoar(refs, launch, target),
    screech: (refs, launch, target) => NormalSoundMoveAnimations.playScreech(refs, launch, target),
    sing: (refs, launch, target) => NormalSoundMoveAnimations.playSing(refs, launch, target),
    supersonic: (refs, _launch, target) => NormalSoundMoveAnimations.playSupersonic(refs, target)
  };

  /**
   * Roar, after the Gen 4 / Gen 5 animation:
   * - Gen 4: https://www.pokewiki.de/images/e/e7/Br%C3%BCller_Gen4.png
   * - Gen 5: https://www.pokewiki.de/images/b/b4/Br%C3%BCller_Gen5.png
   *
   * The user rears up and roars (0-0.25 s): three waves of orange zigzag
   * bolts fly out of it at the target in a wide fan (0.15-0.8 s). The first
   * reach the target at 0.45 s (hit), which is blown back a good way and
   * slides back into place (0.45-1.2 s).
   */
  private static async playRoar(refs: BattleStageRefs, launch: Point, target: Point) {
    const { fxEl, launchEl, targetEl } = refs;
    const lr = Fx.rect(launchEl);
    const tr = Fx.rect(targetEl);
    const dir = target.x >= launch.x ? 1 : -1;
    const dx = target.x - launch.x;
    const dy = target.y - launch.y;
    const base = launchEl.style.transform;
    const effects: Promise<void>[] = [
      Fx.anim(launchEl, [
        { transform: `${base} translateY(0) scale(1)` },
        { transform: `${base} translateY(-6px) scale(1.05)`, offset: 0.3 },
        { transform: `${base} translateY(-6px) scale(1.05)`, offset: 0.7 },
        { transform: `${base} translateY(0) scale(1)` }
      ], { duration: 800, easing: 'ease-out', fill: 'none' })
    ];
    const mouth: Point = { x: launch.x + dir * lr.width * 0.25, y: launch.y - lr.height * 0.15 };
    const bolt = Math.max(tr.width * 0.16, 12);
    for (let wave = 0; wave < 3; wave++) {
      for (let i = 0; i < 5; i++) {
        // Fan out round the line to the target.
        const spread = (i - 2) * tr.height * 0.45 + (Math.random() * 2 - 1) * 10;
        const wrap = Fx.box(bolt, bolt * 1.6, 'filter:drop-shadow(0 0 3px #FF8A20)');
        wrap.appendChild(FxGlyphs.boltGlyph(i % 2 ? '#F8A030' : '#FFC040', bolt));
        effects.push(
          Fx.spawn(fxEl, wrap, mouth, [
            { transform: 'translate(0,0) scale(.4) rotate(0deg)', opacity: 0 },
            { transform: `translate(${dx * 0.3}px,${dy * 0.3 + spread * 0.3}px) scale(1) rotate(${dir * 20}deg)`, opacity: 1, offset: 0.25 },
            { transform: `translate(${dx * 1.15}px,${dy * 1.15 + spread}px) scale(1.3) rotate(${dir * 40}deg)`, opacity: 0 }
          ], { duration: 380, delay: 150 + wave * 130 + i * 15, easing: 'linear' })
        );
      }
    }
    await Fx.wait(450);
    // Blown back by the roar, then sliding home.
    const tbase = targetEl.style.transform;
    Fx.shake(targetEl, 3);
    effects.push(
      Fx.anim(targetEl, [
        { transform: `${tbase} translateX(0)` },
        { transform: `${tbase} translateX(${dir * 36}px)`, offset: 0.35 },
        { transform: `${tbase} translateX(${dir * 36}px)`, offset: 0.55 },
        { transform: `${tbase} translateX(0)` }
      ], { duration: 750, easing: 'ease-out', fill: 'none' })
    );
    await Promise.all(effects);
  }

  /**
   * Screech, after the Gen 4 / Gen 5 animation:
   * - Gen 4: https://www.pokewiki.de/images/6/65/Kreideschrei_Gen4.png
   * - Gen 5: https://www.pokewiki.de/images/c/c8/Kreideschrei_Gen5.png
   *
   * The user shrieks and trembles: a jagged yellow ring flares round it
   * three times with little yellow zigzag bolts shooting out (0-0.75 s).
   * Then the target's Defense falls sharply: it turns blue under stat-down
   * bubbles (0.75-1.65 s).
   */
  private static async playScreech(refs: BattleStageRefs, launch: Point, target: Point) {
    const { fxEl, launchEl, targetEl } = refs;
    const r = Fx.rect(launchEl);
    const size = Math.max(Math.max(r.width, r.height) * 1.2, 70);
    const base = launchEl.style.transform;
    const shiver: Keyframe[] = [];
    for (let k = 0; k <= 16; k++) shiver.push({ transform: `${base} translateX(${k === 0 || k === 16 ? 0 : k % 2 ? 2 : -2}px)` });
    const effects: Promise<void>[] = [Fx.anim(launchEl, shiver, { duration: 750, easing: 'linear', fill: 'none' })];
    for (let i = 0; i < 3; i++) {
      effects.push(
        Fx.spawn(fxEl, NormalSoundMoveAnimations.jaggedRing(size), launch, [
          { transform: 'scale(.5) rotate(0deg)', opacity: 0 },
          { transform: 'scale(.9) rotate(8deg)', opacity: 1, offset: 0.35 },
          { transform: 'scale(1.2) rotate(16deg)', opacity: 0 }
        ], { duration: 320, delay: i * 210, easing: 'ease-out' })
      );
      for (let j = 0; j < 6; j++) {
        const a = (j / 6) * Math.PI * 2 + i * 0.5;
        const d = size * 0.45;
        effects.push(
          Fx.spawn(fxEl, FxGlyphs.boltGlyph('#FFE040', 9), { x: launch.x + Math.cos(a) * d, y: launch.y + Math.sin(a) * d * 0.8 }, [
            { transform: 'translate(0,0) scale(.4)', opacity: 0 },
            { transform: `translate(${Math.cos(a) * 8}px,${Math.sin(a) * 8}px) scale(1.1)`, opacity: 1, offset: 0.4 },
            { transform: `translate(${Math.cos(a) * 20}px,${Math.sin(a) * 20}px) scale(.7)`, opacity: 0 }
          ], { duration: 300, delay: i * 210 + 40, easing: 'ease-out' })
        );
      }
    }
    await Promise.all(effects);
    Fx.shake(targetEl, 3);
    await FxEffects.blueStatDrop(refs, target);
  }

  /**
   * Sing, after the Gen 4 / Gen 5 animation:
   * - Gen 4 (DP): https://www.pokewiki.de/images/9/92/Gesang_DP.png
   * - Gen 4 (PtHGSS): https://www.pokewiki.de/images/f/f3/Gesang_PtHGSS.png
   * - Gen 5: https://www.pokewiki.de/images/c/cb/Gesang_Gen5.png
   *
   * The scene pales (0-0.25 s) and a soft white ring pulses round the user
   * (0.25-0.7 s). Eight black, orange and red notes leave the user one after
   * another and float to the target on wavy paths, fading on it
   * (0.25-1.7 s), then the scene's colours come back (1.7-1.95 s).
   */
  private static async playSing(refs: BattleStageRefs, launch: Point, target: Point) {
    const { fieldEl, fxEl, launchEl, targetEl } = refs;
    const lr = Fx.rect(launchEl);
    const tr = Fx.rect(targetEl);
    const dir = target.x >= launch.x ? 1 : -1;
    const pale = Fx.backdrop(fieldEl, 'background:radial-gradient(ellipse at 50% 60%,#FFFDF6,#E8E4D8)');
    await Fx.anim(pale, [{ opacity: 0 }, { opacity: 0.8 }], { duration: 250, easing: 'ease-out' });

    const ring = Math.max(lr.width * 0.9, 60);
    const effects: Promise<unknown>[] = [
      Fx.spawn(fxEl, Fx.box(ring, ring, 'border-radius:50%;border:3px solid #ffffffdd;box-shadow:0 0 8px #fff,inset 0 0 8px #fff'), launch, [
        { transform: 'scale(.4)', opacity: 0 },
        { transform: 'scale(.9)', opacity: 1, offset: 0.4 },
        { transform: 'scale(1.25)', opacity: 0 }
      ], { duration: 450, easing: 'ease-out' })
    ];
    const start: Point = { x: launch.x + dir * lr.width * 0.2, y: launch.y - lr.height * 0.15 };
    const end: Point = { x: target.x, y: target.y - tr.height * 0.15 };
    const colors = ['#2A2A2A', '#F08A30', '#E04A3A', '#2A2A2A', '#F0A040', '#2A2A2A', '#E85A30', '#2A2A2A'];
    colors.forEach((color, i) => {
      const amp = 12 + (i % 3) * 6;
      const frames: Keyframe[] = [];
      for (let k = 0; k <= 10; k++) {
        const t = k / 10;
        const x = (end.x - start.x) * t;
        const y = (end.y - start.y) * t + Math.sin(t * Math.PI * 3 + i) * amp;
        const opacity = t < 0.15 ? t / 0.15 : t > 0.85 ? (1 - t) / 0.15 : 1;
        frames.push({ transform: `translate(${x}px,${y}px) scale(${0.7 + t * 0.5})`, opacity });
      }
      const note = FxGlyphs.musicNote(16 + (i % 2) * 4, color, i % 2 ? '♫' : '♪');
      effects.push(Fx.spawn(fxEl, note, start, frames, { duration: 750, delay: i * 100, easing: 'linear' }));
    });
    await Promise.all(effects);
    await Fx.anim(pale, [{ opacity: 0.8 }, { opacity: 0 }], { duration: 250, easing: 'ease-in' });
    pale.remove();
  }

  /**
   * Supersonic, after the Gen 4 / Gen 5 animation:
   * - Gen 4: https://www.pokewiki.de/images/3/3e/Superschall_Gen4.png
   * - Gen 5: https://www.pokewiki.de/images/2/21/Superschall_Gen5.png
   *
   * The scene darkens (0-0.2 s) and three glowing yellow rings ripple out of
   * the target one after another (0.2-0.95 s) while it trembles. The dark
   * lifts (0.95-1.15 s), then little birds circle the confused target's head
   * (1.15-2.55 s).
   */
  private static async playSupersonic(refs: BattleStageRefs, target: Point) {
    const { fieldEl, fxEl, targetEl } = refs;
    const r = Fx.rect(targetEl);
    const dim = Fx.backdrop(fieldEl, DIM_BACKDROP);
    await Fx.anim(dim, [{ opacity: 0 }, { opacity: 1 }], { duration: 200, easing: 'ease-out' });
    const size = Math.max(r.width, r.height) * 1.1;
    const rings: Promise<unknown>[] = [];
    for (let i = 0; i < 3; i++) {
      const ring = Fx.box(size, size, 'border-radius:50%;border:5px solid #F8E040;box-shadow:0 0 10px #F8E040,inset 0 0 10px #F8E04088');
      rings.push(
        Fx.spawn(fxEl, ring, target, [
          { transform: 'scale(.15)', opacity: 0 },
          { transform: 'scale(.35)', opacity: 1, offset: 0.25 },
          { transform: 'scale(1)', opacity: 0 }
        ], { duration: 450, delay: i * 150, easing: 'ease-out' })
      );
    }
    const base = targetEl.style.transform;
    rings.push(Fx.anim(targetEl, [
      { transform: `${base} translateX(0)` },
      { transform: `${base} translateX(-2px)`, offset: 0.25 },
      { transform: `${base} translateX(2px)`, offset: 0.5 },
      { transform: `${base} translateX(-2px)`, offset: 0.75 },
      { transform: `${base} translateX(0)` }
    ], { duration: 750, easing: 'linear', fill: 'none' }));
    await Promise.all(rings);
    await Fx.anim(dim, [{ opacity: 1 }, { opacity: 0 }], { duration: 200, easing: 'ease-in' });
    dim.remove();
    await FxEffects.dizzyBirds(fxEl, { x: target.x, y: target.y - r.height * 0.45 }, Math.max(r.width * 0.35, 24), Math.max(r.height * 0.12, 10), 1400);
  }

  /** A jagged yellow ring (a star-edged outline) `size` px across. */
  private static jaggedRing(size: number): HTMLElement {
    const pts: string[] = [];
    const spikes = 16;
    for (let i = 0; i < spikes * 2; i++) {
      const a = (Math.PI * 2 * i) / (spikes * 2);
      const rad = i % 2 ? 38 : 47;
      pts.push(`${(50 + Math.cos(a) * rad).toFixed(1)},${(50 + Math.sin(a) * rad).toFixed(1)}`);
    }
    const el = Fx.box(size, size, 'filter:drop-shadow(0 0 4px #FFD020)');
    el.innerHTML = `<svg viewBox="0 0 100 100" width="100%" height="100%" style="display:block"><polygon points="${pts.join(' ')}" fill="none" stroke="#FFE84A" stroke-width="3"/></svg>`;
    return el;
  }

  /**
   * Growl, after the Gen 4 / Gen 5 animation:
   * - Gen 4: https://www.pokewiki.de/images/a/aa/Heuler_Gen4.png
   * - Gen 5: https://www.pokewiki.de/images/4/43/Heuler_Gen5.png
   *
   * The user growls: it hunches forward a little while a soft red glow pulses
   * round it twice and little yellow zigzag bolts pop out at its sides
   * (0-0.75 s). Then blue stat-down bubbles drift down over the target (its
   * Attack falls, 0.75-1.65 s).
   */
  private static async playGrowl(refs: BattleStageRefs, launch: Point, target: Point) {
    const { fxEl, launchEl, targetEl } = refs;
    const r = Fx.rect(launchEl);
    const size = Math.max(r.width, r.height) * 1.5;
    const original = launchEl.style.transform;
    const effects: Promise<void>[] = [
      Fx.anim(launchEl, [
        { transform: `${original} translate(0,0)` },
        { transform: `${original} translate(${(target.x > launch.x ? 1 : -1) * 4}px,3px)`, offset: 0.25 },
        { transform: `${original} translate(0,0)`, offset: 0.5 },
        { transform: `${original} translate(${(target.x > launch.x ? 1 : -1) * 4}px,3px)`, offset: 0.75 },
        { transform: `${original} translate(0,0)` }
      ], { duration: 750, easing: 'ease-in-out', fill: 'none' }),
      Fx.spawn(fxEl, Fx.box(size, size, 'border-radius:50%;background:radial-gradient(circle,#FF3A2A00 25%,#FF4A2A88 50%,#FF6A3A44 62%,#FF3A2A00 72%)'), launch, [
        { transform: 'scale(.6)', opacity: 0 },
        { transform: 'scale(1)', opacity: 1, offset: 0.25 },
        { transform: 'scale(.8)', opacity: 0.4, offset: 0.5 },
        { transform: 'scale(1.1)', opacity: 1, offset: 0.75 },
        { transform: 'scale(1.2)', opacity: 0 }
      ], { duration: 750, easing: 'ease-in-out' })
    ];
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2 + 0.3;
      const d = size * 0.38;
      effects.push(
        Fx.spawn(fxEl, FxGlyphs.boltGlyph('#FFE040', 9), { x: launch.x + Math.cos(a) * d, y: launch.y + Math.sin(a) * d * 0.8 }, [
          { transform: 'scale(0)', opacity: 0 },
          { transform: 'scale(1.1)', opacity: 1, offset: 0.35 },
          { transform: `translate(${Math.cos(a) * 10}px,${Math.sin(a) * 10}px) scale(.8)`, opacity: 0 }
        ], { duration: 320, easing: 'ease-out', delay: (i % 4) * 90 + (i < 4 ? 0 : 360) })
      );
    }
    await Promise.all(effects);
    await FxEffects.statDownBubbles({ ...refs, launchEl: targetEl }, target);
  }

  /**
   * Boomburst, after the XY animation: the user rears up while red-pink rays
   * radiate from it and yellow zigzag sparks crackle at its mouth (0-0.65 s).
   * The scene turns orange and five shockwave rings roll out over the ground
   * from the user (0.6-1.9 s, 0.12 s apart) with glowing orange orbs; they
   * hit the target at 0.95 s with an orange flash and shakes, then clear.
   */
  private static async playBoomburst(refs: BattleStageRefs, launch: Point, target: Point) {
    const { fieldEl, fxEl, launchEl, targetEl } = refs;
    const W = fieldEl.clientWidth;
    const H = fieldEl.clientHeight;
    const lr = Fx.rect(launchEl);
    const tr = Fx.rect(targetEl);
    const lFoot = Fx.footOf(launchEl, fieldEl);

    // Red-pink rays radiate from the user; yellow sparks crackle at its mouth.
    const c = `${launch.x}px ${launch.y}px`;
    const rays = Fx.backdrop(
      fieldEl,
      `background:radial-gradient(circle at ${c},#0000 0 10%,#4A1830aa 60%),repeating-conic-gradient(from 0deg at ${c},#7A2A50 0 7deg,#FF5A8A 7deg 9deg,#7A2A50 9deg 16deg)`
    );
    const original = launchEl.style.transform;
    const effects: Promise<unknown>[] = [
      Fx.anim(rays, [{ opacity: 0 }, { opacity: 0.85, offset: 0.25 }, { opacity: 0.85, offset: 0.75 }, { opacity: 0 }], { duration: 650, easing: 'linear' }).then(() => rays.remove()),
      Fx.anim(launchEl, [
        { transform: `${original} translateY(0) scale(1,1)` },
        { transform: `${original} translateY(-8px) scale(.97,1.05)`, offset: 0.4 },
        { transform: `${original} translateY(0) scale(1.03,.97)`, offset: 0.7 },
        { transform: `${original} translateY(0) scale(1,1)` }
      ], { duration: 650, easing: 'ease-out', fill: 'none' })
    ];
    const mouth: Point = { x: launch.x + (target.x >= launch.x ? 1 : -1) * lr.width * 0.25, y: launch.y - lr.height * 0.2 };
    for (let i = 0; i < 6; i++) {
      const ang = Math.random() * Math.PI * 2;
      const len = 16 + Math.random() * 14;
      const x0 = mouth.x + Math.cos(ang) * 8;
      const y0 = mouth.y + Math.sin(ang) * 8;
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('style', 'position:absolute;inset:0;width:100%;height:100%;overflow:visible;pointer-events:none;filter:drop-shadow(0 0 3px #FFE040)');
      const bolt = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
      bolt.setAttribute('points', Fx.zigzagPoints(x0, y0, x0 + Math.cos(ang) * len, y0 + Math.sin(ang) * len, 4));
      bolt.setAttribute('fill', 'none');
      bolt.setAttribute('stroke', '#FFE860');
      bolt.setAttribute('stroke-width', '2.5');
      svg.appendChild(bolt);
      fxEl.appendChild(svg);
      effects.push(
        Fx.anim(svg, [{ opacity: 0 }, { opacity: 1, offset: 0.2 }, { opacity: 0.3, offset: 0.5 }, { opacity: 1, offset: 0.7 }, { opacity: 0 }], {
          duration: 250,
          delay: 150 + i * 60,
          easing: 'linear'
        }).then(() => svg.remove())
      );
    }
    await Fx.wait(600);

    // The orange scene and the shockwave rings rolling over the ground.
    const orange = Fx.backdrop(fieldEl, 'background:radial-gradient(circle at 50% 60%,#F0A050,#D06A28 60%,#8A3A10)');
    effects.push(Fx.anim(orange, [{ opacity: 0 }, { opacity: 0.85, offset: 0.2 }, { opacity: 0.85, offset: 0.75 }, { opacity: 0 }], { duration: 1200, easing: 'linear' }).then(() => orange.remove()));
    const reach = Math.hypot(W, H) * 1.2;
    for (let i = 0; i < 5; i++) {
      const ring = document.createElement('div');
      ring.style.cssText = `width:${reach}px;height:${reach * 0.3}px;border-radius:50%;pointer-events:none;border:6px solid #FFD070;box-shadow:0 0 12px #FFB040,inset 0 0 12px #FFB040`;
      Fx.place(ring, lFoot);
      fxEl.appendChild(ring);
      effects.push(
        Fx.anim(ring, [{ transform: 'scale(.05)', opacity: 1 }, { transform: 'scale(1)', opacity: 0 }], { duration: 800, delay: i * 120, easing: 'ease-out' }).then(() => ring.remove())
      );
    }
    for (let i = 0; i < 12; i++) {
      const s = 10 + Math.random() * 10;
      const orb = document.createElement('div');
      orb.style.cssText = `width:${s}px;height:${s}px;border-radius:50%;pointer-events:none;background:radial-gradient(circle,#ffffff 0 20%,#FFC060 50%,#FF802000 72%);box-shadow:0 0 6px #FF9030`;
      const from: Point = { x: lFoot.x + (Math.random() * 2 - 1) * 30, y: lFoot.y - Math.random() * 20 };
      const to: Point = { x: target.x + (Math.random() * 2 - 1) * tr.width, y: target.y + (Math.random() * 2 - 1) * tr.height * 0.5 };
      Fx.place(orb, from);
      fxEl.appendChild(orb);
      effects.push(
        Fx.anim(orb, [
          { transform: 'translate(0,0) scale(.5)', opacity: 0 },
          { transform: `translate(${(to.x - from.x) * 0.5}px,${(to.y - from.y) * 0.5}px) scale(1)`, opacity: 1, offset: 0.4 },
          { transform: `translate(${to.x - from.x}px,${to.y - from.y}px) scale(.6)`, opacity: 0 }
        ], { duration: 600, delay: 100 + Math.random() * 400, easing: 'ease-out' }).then(() => orb.remove())
      );
    }

    // The waves hit the target.
    await Fx.wait(350);
    const flashSize = Math.max(tr.width * 1.6, 120);
    const flash = document.createElement('div');
    flash.style.cssText = `width:${flashSize}px;height:${flashSize}px;border-radius:50%;pointer-events:none;background:radial-gradient(circle,#FFF4D0 0 25%,#FFC060aa 45%,#FF902000 70%)`;
    Fx.place(flash, target);
    fxEl.appendChild(flash);
    Fx.flash(targetEl, '#FFC060', 0.7);
    for (const at of [0, 150, 300]) setTimeout(() => Fx.shake(targetEl, 6), at);
    Fx.shakeField(fieldEl, 0.6);
    effects.push(
      Fx.anim(flash, [{ transform: 'scale(.3)', opacity: 1 }, { transform: 'scale(1)', opacity: 1, offset: 0.35 }, { transform: 'scale(1.15)', opacity: 0 }], { duration: 500, easing: 'ease-out' })
        .then(() => flash.remove())
    );
    await Promise.all(effects);
  }

  /**
   * Confide, after the XY animation: black letterbox bars close in and a
   * white speech bubble swells at the user's mouth (0-0.5 s), whooshes to the
   * target through speed lines (0.5-0.85 s) and leaves a small "…" bubble
   * over its head (0.85-1.4 s), then its Sp. Atk falls (1.4-2.4 s).
   * Reference: https://www.pokewiki.de/images/d/d3/Vertrauenssache_Gen6.png
   */
  private static async playConfide(refs: BattleStageRefs, launch: Point, target: Point) {
    const { fieldEl, fxEl, launchEl, targetEl } = refs;
    const W = fieldEl.clientWidth;
    const H = fieldEl.clientHeight;
    const lr = Fx.rect(launchEl);
    const tr = Fx.rect(targetEl);
    const bars = [0, 1].map((bottom) => {
      const bar = Fx.box(W, H * 0.16, `left:0;${bottom ? 'bottom' : 'top'}:0;background:#000`);
      fxEl.appendChild(bar);
      Fx.anim(bar, [{ transform: `translateY(${bottom ? 100 : -100}%)` }, { transform: 'translateY(0)' }], { duration: 250, easing: 'ease-out' });
      return bar;
    });
    const dir = target.x >= launch.x ? 1 : -1;
    const mouth: Point = { x: launch.x + dir * lr.width * 0.35, y: launch.y - lr.height * 0.15 };
    const bw = Math.max(lr.width * 0.55, 44);
    const bubble = NormalSoundMoveAnimations.speechBubble(bw, '');
    Fx.place(bubble, mouth);
    fxEl.appendChild(bubble);
    await Fx.anim(bubble, [{ transform: 'scale(.1)', opacity: 0 }, { transform: 'scale(1.1)', opacity: 1, offset: 0.7 }, { transform: 'scale(1)', opacity: 1 }], { duration: 350, delay: 150, easing: 'ease-out' });

    const lines = Fx.box(W, H, 'left:0;top:0;overflow:hidden');
    fxEl.insertBefore(lines, bars[0]);
    FxEffects.speedLines(lines, W, H, dir, ['#ffffffcc', '#C8D0E0aa']);
    const head: Point = { x: target.x, y: target.y - tr.height * 0.55 };
    await Fx.anim(bubble, [
      { transform: 'translate(0,0) scale(1)' },
      { transform: `translate(${head.x - mouth.x}px,${head.y - mouth.y}px) scale(.35)` }
    ], { duration: 350, easing: 'ease-in' });
    bubble.remove();
    lines.remove();
    await Promise.all(bars.map((bar) => Fx.anim(bar, [{ opacity: 1 }, { opacity: 0 }], { duration: 200, easing: 'ease-in' }).then(() => bar.remove())));
    await Fx.spawn(fxEl, NormalSoundMoveAnimations.speechBubble(26, '…'), head, [
      { transform: 'scale(.3)', opacity: 0 },
      { transform: 'scale(1)', opacity: 1, offset: 0.25 },
      { transform: 'translateY(-4px) scale(1)', opacity: 1, offset: 0.8 },
      { transform: 'translateY(-8px) scale(.9)', opacity: 0 }
    ], { duration: 550, easing: 'ease-out' });
    await FxEffects.statDropCloud(refs, target);
  }

  /** A white speech bubble `w` px wide with a tail at the lower left, showing `text`. */
  private static speechBubble(w: number, text: string): HTMLElement {
    const el = Fx.box(w, w * 0.75, `text-align:center;font:bold ${w * 0.4}px/${w * 0.6}px sans-serif;color:#333;filter:drop-shadow(0 0 3px #00000066)`);
    el.innerHTML =
      `<svg width="100%" height="100%" viewBox="0 0 40 30" style="position:absolute;left:0;top:0"><path d="M20,2 C31,2 38,7 38,13 C38,19 31,24 20,24 C17,24 15,23.6 13,23 L5,28 L8,21 C4,19 2,16 2,13 C2,7 9,2 20,2 Z" fill="#ffffff" stroke="#C8C8D0" stroke-width="1"/></svg>` +
      `<span style="position:relative">${text}</span>`;
    return el;
  }

  /**
   * Noble Roar, after the XY animation: the user rears up and roars - jagged
   * red, orange and blue rays blast out from it across the scene (0-0.7 s);
   * a fiery red ring spirals round the target, which glows red (0.6-1.3 s),
   * then its Attack and Sp. Atk fall (1.3-2.3 s).
   * Reference: https://www.pokewiki.de/images/d/d7/Kampfgebr%C3%BCll_Gen6.png
   */
  private static async playNobleRoar(refs: BattleStageRefs, launch: Point, target: Point) {
    const { fieldEl, fxEl, launchEl, targetEl } = refs;
    const tr = Fx.rect(targetEl);
    const c = `${launch.x}px ${launch.y}px`;
    const rays = Fx.backdrop(fieldEl, `background:radial-gradient(circle at ${c},#FFE0A0 0 6%,#0000 30%),repeating-conic-gradient(from 0deg at ${c},#3A1418 0 4deg,#E83A2A 4deg 6deg,#FF9A3A 6deg 7deg,#3A1418 7deg 11deg,#4A6AE0 11deg 12deg,#3A1418 12deg 16deg)`);
    const original = launchEl.style.transform;
    const effects: Promise<unknown>[] = [
      Fx.anim(rays, [{ opacity: 0 }, { opacity: 0.95, offset: 0.2 }, { opacity: 0.95, offset: 0.7 }, { opacity: 0 }], { duration: 750, easing: 'linear' }).then(() => rays.remove()),
      Fx.anim(launchEl, [
        { transform: `${original} translateY(0) scale(1,1)` },
        { transform: `${original} translateY(-8px) scale(.96,1.06)`, offset: 0.3 },
        { transform: `${original} translateY(0) scale(1,1)` }
      ], { duration: 700, easing: 'ease-out', fill: 'none' })
    ];
    Fx.shakeField(fieldEl, 0.5);
    await Fx.wait(600);

    // A fiery red ring spirals round the glowing target.
    const size = Math.max(tr.width * 1.4, 90);
    const ring = Fx.box(size, size, 'border-radius:50%;background:repeating-conic-gradient(#FF3A1A 0 10deg,#FFB03A 10deg 14deg,#FF3A1A00 14deg 30deg);-webkit-mask-image:radial-gradient(circle,#0000 50%,#000 55% 68%,#0000 72%);mask-image:radial-gradient(circle,#0000 50%,#000 55% 68%,#0000 72%);filter:drop-shadow(0 0 6px #FF5A2A)');
    effects.push(
      Fx.spawn(fxEl, ring, target, [
        { transform: 'scale(1.4) rotate(0deg)', opacity: 0 },
        { transform: 'scale(1) rotate(160deg)', opacity: 1, offset: 0.35 },
        { transform: 'scale(.7) rotate(420deg)', opacity: 0 }
      ], { duration: 700, easing: 'ease-out' }),
      Fx.glow(targetEl, 'brightness(.9) sepia(1) saturate(4) hue-rotate(-30deg) drop-shadow(0 0 6px #FF3A1A)', 700)
    );
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      effects.push(
        Fx.spawn(fxEl, FxGlyphs.boltGlyph('#FFB03A', 8), { x: target.x + Math.cos(a) * size * 0.45, y: target.y + Math.sin(a) * size * 0.35 }, [
          { transform: 'scale(.3)', opacity: 0 },
          { transform: 'scale(1)', opacity: 1, offset: 0.4 },
          { transform: 'scale(.5)', opacity: 0 }
        ], { duration: 400, delay: 100 + i * 50, easing: 'ease-out' })
      );
    }
    await Promise.all(effects);
    await FxEffects.statDropCloud(refs, target);
  }
}
