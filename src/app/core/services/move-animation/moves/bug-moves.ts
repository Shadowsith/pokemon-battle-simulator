import { BattleStageRefs, MoveAnimRegistry, Point } from '../animation.types';
import { Fx } from '../fx';
import { FxGlyphs } from '../fx-glyphs';
import { FxEffects } from '../fx-effects';
import { GrassMoveAnimations } from './grass-moves';

/** Hand-made animations for Bug-type moves. */
export class BugMoveAnimations {
  /** Hand-made Bug move animations, by @pkmn/sim move id. */
  static readonly anims: MoveAnimRegistry = {
    // Like Absorb, but blood-red sparkles are drained from the target.
    leechlife: (refs, launch, target) => GrassMoveAnimations.playAbsorb(refs, launch, target, ['#D8201C', '#FF8A80']),
    megahorn: (refs, launch, target) => BugMoveAnimations.playMegahorn(refs, launch, target),
    signalbeam: (refs, launch, target) => BugMoveAnimations.playSignalBeam(refs, launch, target),
    stickyweb: (refs, launch, target) => BugMoveAnimations.playStickyWeb(refs, launch, target)
  };

  /**
   * Sticky Web, after the XY animation: a glowing white orb wrapped in a small
   * green web arcs up from the user to above the target (0-0.52 s), where the
   * web opens wide round it (to 0.82 s). The web drops over the target and
   * settles flat on the ground (to 1.15 s), then a white web spreads out over
   * the ground round the target (to 1.7 s), lies there and fades (~2.45 s).
   */
  private static async playStickyWeb(refs: BattleStageRefs, launch: Point, target: Point) {
    const { fieldEl, fxEl, targetEl } = refs;
    const r = Fx.rect(targetEl);
    const foot = Fx.footOf(targetEl, fieldEl);
    const hover: Point = { x: target.x, y: target.y - Math.max(r.height * 0.55, 40) };
    const big = Math.max(r.width * 1.9, 130);
    const flat = 0.3;

    const layer = document.createElement('div');
    layer.style.cssText = 'position:absolute;inset:0;overflow:hidden;pointer-events:none';
    fxEl.appendChild(layer);

    // The green web and the orb fly together, both centred on `hover` at the end of the arc.
    const web = BugMoveAnimations.webGlyph(big, '#4AF0A0', '#1AC878');
    Fx.place(web, hover);
    const orbSize = Math.max(r.width * 0.3, 20);
    const orb = document.createElement('div');
    orb.style.cssText = `width:${orbSize}px;height:${orbSize}px;border-radius:50%;pointer-events:none;background:radial-gradient(circle,#fff 0 35%,#F0FFF8cc 55%,#C0FFE000 72%);box-shadow:0 0 14px 4px #ffffffaa`;
    Fx.place(orb, hover);
    layer.append(web, orb);

    const dx = launch.x - hover.x;
    const dy = launch.y - hover.y;
    const peak = Math.max(70, Math.abs(dx) * 0.25);
    const arc = (k0: number, spin = 0): Keyframe[] => {
      const frames: Keyframe[] = [];
      for (let k = 0; k <= 8; k++) {
        const t = k / 8;
        // The arc ends at `hover` (0,0); its top lies a little above it.
        const lift = 4 * peak * t * (1 - t) * 0.6;
        frames.push({ transform: `translate(${dx * (1 - t)}px,${dy * (1 - t) - lift}px) scale(${k0}) rotate(${spin * t}deg)`, opacity: t === 0 ? 0 : 1 });
      }
      return frames;
    };
    const s0 = 0.32;
    const fly = 520;
    await Promise.all([
      Fx.anim(orb, arc(1), { duration: fly, easing: 'ease-out' }),
      Fx.anim(web, arc(s0, 96), { duration: fly, easing: 'ease-out' })
    ]);

    // The web opens wide round the orb.
    await Fx.anim(web, [
      { transform: `scale(${s0}) rotate(96deg)` },
      { transform: 'scale(1) rotate(120deg)' }
    ], { duration: 300, easing: 'ease-out' });

    // It drops over the target and settles flat on the ground; the orb sinks with it and goes out.
    const down = foot.y - hover.y;
    const drop = 330;
    await Promise.all([
      Fx.anim(web, [
        { transform: 'translateY(0) scale(1,1) rotate(120deg)' },
        { transform: `translateY(${down}px) scale(1.15,${flat * 1.15}) rotate(120deg)` }
      ], { duration: drop, easing: 'ease-in' }),
      Fx.anim(orb, [
        { transform: 'translateY(0) scale(1)', opacity: 1 },
        { transform: `translateY(${down}px) scale(.3)`, opacity: 0 }
      ], { duration: drop, easing: 'ease-in' })
    ]);
    orb.remove();
    Fx.shake(targetEl, 2);

    // A white web spreads over the ground from the target outward, lies a moment and fades.
    const groundSize = Math.max(r.width * 3.6, 260);
    const ground = BugMoveAnimations.webGlyph(groundSize, '#FFFFFF', '#C8FFE8', 2.2);
    ground.style.transform = `scale(1,${flat})`;
    Fx.place(ground, foot);
    layer.insertBefore(ground, web);
    const greenGone = Fx.anim(web, [{ opacity: 1 }, { opacity: 0 }], { duration: 260, easing: 'ease-in' });
    const spread = 550;
    const lie = 400;
    const fade = 350;
    const total = spread + lie + fade;
    await Promise.all([
      greenGone,
      Fx.anim(ground, [
        { transform: `scale(.6,${0.6 * flat})`, clipPath: 'circle(8%)', opacity: 1 },
        { transform: `scale(1,${flat})`, clipPath: 'circle(71%)', opacity: 1, offset: spread / total },
        { transform: `scale(1,${flat})`, clipPath: 'circle(71%)', opacity: 1, offset: (spread + lie) / total },
        { transform: `scale(1,${flat})`, clipPath: 'circle(71%)', opacity: 0 }
      ], { duration: total, easing: 'ease-out' })
    ]);
    layer.remove();
  }

  /**
   * A round spider web `size` px across: ten spokes and five rings of threads
   * that sag a little toward the centre between the spokes, with a soft glow.
   */
  private static webGlyph(size: number, thread: string, glow: string, stroke = 1.3): HTMLElement {
    const spokes = 10;
    const at = (rad: number, i: number) => {
      const a = (Math.PI * 2 * i) / spokes - Math.PI / 2;
      return [rad * Math.cos(a), rad * Math.sin(a)].map((n) => n.toFixed(1)).join(' ');
    };
    let d = '';
    for (let i = 0; i < spokes; i++) d += `M0 0L${at(49, i)}`;
    for (const rad of [9, 18, 27, 36, 45]) {
      d += `M${at(rad, 0)}`;
      for (let i = 0; i < spokes; i++) d += `Q${at(rad * 0.86, i + 0.5)} ${at(rad, i + 1)}`;
    }
    const el = document.createElement('div');
    el.style.cssText = `width:${size}px;height:${size}px;pointer-events:none;filter:drop-shadow(0 0 3px ${glow})`;
    el.innerHTML =
      `<svg viewBox="-50 -50 100 100" width="100%" height="100%" style="display:block;overflow:visible">` +
      `<path d="${d}" fill="none" stroke="${thread}" stroke-width="${stroke}" stroke-linejoin="round" stroke-linecap="round"/></svg>`;
    return el;
  }

  /**
   * Signal Beam, after the DPPt animation: a beam of glowing squares - blue
   * near the user, turning violet and magenta further on, some inside thin
   * outlined frames - streams from the user past the target (0-1.7 s,
   * reaching the target at ~0.2 s). Meanwhile the target flashes red and
   * green in turn like a traffic light, ending on a green glow that fades
   * (to ~2.1 s).
   */
  private static async playSignalBeam(refs: BattleStageRefs, launch: Point, target: Point) {
    const { fieldEl, fxEl, targetEl } = refs;
    const W = fieldEl.clientWidth;
    const H = fieldEl.clientHeight;
    const dx = target.x - launch.x;
    const dy = target.y - launch.y;
    const dist = Math.max(Math.hypot(dx, dy), 1);
    // The beam runs on past the target, off the screen.
    const reach = dist + Math.hypot(W, H) * 0.5;
    const ux = dx / dist;
    const uy = dy / dist;
    const deg = (Math.atan2(dy, dx) * 180) / Math.PI;

    const layer = document.createElement('div');
    layer.style.cssText = 'position:absolute;inset:0;overflow:hidden;pointer-events:none';
    fxEl.appendChild(layer);

    // The stream: squares fly along the beam, shifting from blue to magenta as they go.
    const size = Math.max(Math.min(W, H) * 0.06, 14);
    const count = 40;
    const gap = 30;
    const travel = 520;
    const segments: Promise<void>[] = [];
    for (let i = 0; i < count; i++) {
      const framed = i % 4 === 1;
      const s = size * (framed ? 1.35 : 0.85 + Math.random() * 0.3);
      const seg = document.createElement('div');
      seg.style.cssText = framed
        ? `position:absolute;width:${s}px;height:${s}px;pointer-events:none;border:1.5px solid;box-sizing:border-box`
        : `position:absolute;width:${s}px;height:${s}px;pointer-events:none;border-radius:2px;filter:blur(1px);box-shadow:0 0 5px #FF60C0`;
      Fx.place(seg, launch);
      layer.appendChild(seg);
      const side = (Math.random() * 2 - 1) * size * 0.15;
      const at = (f: number) => `translate(${ux * reach * f - uy * side}px,${uy * reach * f + ux * side}px) rotate(${deg}deg)`;
      const paint = (c: string) => (framed ? { borderColor: c } : { backgroundColor: c });
      segments.push(
        Fx.anim(seg, [
          { transform: `${at(0)} scale(.6)`, opacity: 0, ...paint('#3A5AF0') },
          { transform: `${at(0.08)} scale(1)`, opacity: 0.95, ...paint('#4A5AF0'), offset: 0.08 },
          { transform: `${at(0.3)} scale(1)`, opacity: 0.95, ...paint(framed ? '#9A6AFF' : '#9A3AE8'), offset: 0.3 },
          { transform: `${at(1)} scale(1)`, opacity: 0.9, ...paint(framed ? '#FF6AD0' : '#F0207A') }
        ], { duration: travel, easing: 'linear', delay: i * gap, fill: 'backwards' }).then(() => seg.remove())
      );
    }

    // The target flashes red and green in turn while the beam hits it, then glows green and clears.
    const hitAt = travel * (dist / reach);
    const hold = count * gap + travel - hitAt;
    const cycle = 280;
    const fade = 450;
    const total = hold + fade;
    const red = 'sepia(1) saturate(6) hue-rotate(-40deg) brightness(.9)';
    const green = 'sepia(1) saturate(5) hue-rotate(70deg) brightness(1.05)';
    const light: Keyframe[] = [{ filter: 'none', offset: 0 }];
    const flips = Math.floor(hold / cycle);
    for (let k = 0; k < flips; k++) {
      const col = k % 2 ? green : red;
      light.push({ filter: col, offset: (k * cycle + 60) / total }, { filter: col, offset: ((k + 1) * cycle) / total });
    }
    light.push({ filter: green, offset: Math.min(flips * cycle + 60, hold) / total },{ filter: green, offset: hold / total }, { filter: 'none', offset: 1 });
    const glow = Fx.wait(hitAt).then(() => {
      for (let k = 0; k < flips; k += 2) setTimeout(() => Fx.shake(targetEl, 3), k * cycle);
      return Fx.anim(targetEl, light, { duration: total, easing: 'linear', fill: 'none' });
    });

    await Promise.all([...segments, glow]);
    layer.remove();
  }

  /**
   * Megahorn: a big black horn shoots at the target trailing red streaks,
   * then the scene turns red with yellow burst rays and a yellow blast hits
   * the target while yellow sparkle stripes fly out of it.
   */
  private static async playMegahorn(refs: BattleStageRefs, launch: Point, target: Point) {
    await BugMoveAnimations.hornShot(refs, launch, target);
    await BugMoveAnimations.hornImpact(refs, target);
  }

  /** A black horn, `len` px long, pointing right: wide base, curved flanks, sharp tip. */
  private static hornGlyph(len: number): HTMLElement {
    const el = document.createElement('div');
    el.style.cssText = `position:absolute;width:${len}px;height:${len * 0.4}px;pointer-events:none`;
    el.innerHTML =
      '<svg viewBox="0 0 60 24" width="100%" height="100%"><defs><linearGradient id="bugHorn" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6A6A74"/><stop offset=".45" stop-color="#2A2A30"/><stop offset="1" stop-color="#0A0A0C"/></linearGradient></defs>' +
      '<path d="M1 2Q30 3 59 12Q30 23 1 22Q5 12 1 2Z" fill="url(#bugHorn)" stroke="#000" stroke-width="1.2" stroke-linejoin="round"/>' +
      '<path d="M8 7Q30 8 50 11.5" stroke="#9A9AA6" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".8"/></svg>';
    return el;
  }

  /** The horn flies point-first from the caster to the target with red-orange streaks behind it. */
  private static async hornShot(refs: BattleStageRefs, launch: Point, target: Point) {
    const { fxEl, targetEl } = refs;
    const r = Fx.rect(targetEl);
    const len = Math.max(r.width * 0.6, 50);
    const dx = target.x - launch.x;
    const dy = target.y - launch.y;
    const angle = (Math.atan2(dy, dx) * 180) / Math.PI;

    // The horn and its trail ride in one box that is turned toward the target.
    const shot = document.createElement('div');
    shot.style.cssText = `position:absolute;width:${len}px;height:${len * 0.4}px;pointer-events:none`;
    for (const [off, w, c] of [[-0.28, 1.6, '#E8402A'], [0, 2, '#FF7A2A'], [0.28, 1.4, '#C8201A']] as const) {
      const streak = document.createElement('div');
      streak.style.cssText = `position:absolute;left:${-len * w + len * 0.4}px;top:${len * 0.2 + off * len * 0.4 - 2.5}px;width:${len * w}px;height:5px;border-radius:3px;background:linear-gradient(90deg,${c}00,${c} 80%,${c}00)`;
      shot.appendChild(streak);
    }
    shot.appendChild(BugMoveAnimations.hornGlyph(len));
    Fx.place(shot, launch);
    fxEl.appendChild(shot);
    await Fx.anim(shot, [
      { transform: `translate(0,0) rotate(${angle}deg) scale(.6)`, opacity: 0 },
      { transform: `translate(${dx * 0.1}px,${dy * 0.1}px) rotate(${angle}deg) scale(1)`, opacity: 1, offset: 0.15 },
      { transform: `translate(${dx * 0.95}px,${dy * 0.95}px) rotate(${angle}deg) scale(1)`, opacity: 1 }
    ], { duration: 420, easing: 'ease-in' });
    shot.remove();
  }

  /** Red burst backdrop, a yellow blast on the target and yellow sparkle stripes flying outward. */
  private static async hornImpact(refs: BattleStageRefs, target: Point) {
    const { fieldEl, fxEl, targetEl } = refs;
    const r = Fx.rect(targetEl);
    const red = await FxEffects.burstBackdrop(fieldEl, target);

    const size = Math.max(r.width * 1.3, 90);
    const blast = FxGlyphs.spikyBurst(size, '#FFB020', '#FFE45A', '#FFFBE0');
    Fx.place(blast, target);
    fxEl.appendChild(blast);
    const blastDone = Fx.anim(blast, [
      { transform: 'scale(.3) rotate(0deg)', opacity: 1 },
      { transform: 'scale(1.1) rotate(12deg)', opacity: 1, offset: 0.35 },
      { transform: 'scale(1.25) rotate(20deg)', opacity: 0 }
    ], { duration: 650, easing: 'ease-out' }).then(() => blast.remove());
    Fx.flash(targetEl, '#FFE45A', 0.8);
    Fx.shake(targetEl, 7);
    Fx.shakeField(fieldEl, 0.8);

    // Yellow sparkle stripes shoot outward, with a few white sparkle dots.
    const effects: Promise<void>[] = [blastDone];
    const reach = Math.max(r.width * 1.6, 120);
    for (let i = 0; i < 18; i++) {
      const ang = (360 * i) / 18 + Math.random() * 12;
      const stripe = document.createElement('div');
      const l = reach * (0.25 + Math.random() * 0.2);
      stripe.style.cssText = `position:absolute;width:${l}px;height:4px;border-radius:2px;pointer-events:none;background:linear-gradient(90deg,#FFE45A00,#FFE45A 40%,#FFFBE0);box-shadow:0 0 4px #FFD040`;
      Fx.place(stripe, target);
      fxEl.appendChild(stripe);
      const d = reach * (0.6 + Math.random() * 0.4);
      effects.push(
        Fx.anim(stripe, [
          { transform: `rotate(${ang}deg) translateX(${size * 0.15}px) scaleX(.3)`, opacity: 1 },
          { transform: `rotate(${ang}deg) translateX(${d}px) scaleX(1)`, opacity: 0 }
        ], { duration: 520 + Math.random() * 180, easing: 'ease-out', delay: Math.random() * 120 }).then(() => stripe.remove())
      );
    }
    for (let i = 0; i < 8; i++) {
      const dot = FxGlyphs.sparkStar(8 + Math.random() * 6, '#FFFFFF');
      Fx.place(dot, { x: target.x + (Math.random() * 2 - 1) * size * 0.6, y: target.y + (Math.random() * 2 - 1) * size * 0.5 });
      fxEl.appendChild(dot);
      effects.push(
        Fx.anim(dot, [
          { transform: 'scale(0)', opacity: 0 },
          { transform: 'scale(1)', opacity: 1, offset: 0.4 },
          { transform: 'scale(0)', opacity: 0 }
        ], { duration: 500, delay: 80 + Math.random() * 300 }).then(() => dot.remove())
      );
    }
    await Promise.all(effects);

    await Fx.anim(red, [{ opacity: 1 }, { opacity: 0 }], { duration: 300, easing: 'ease-in' });
    red.remove();
  }
}
