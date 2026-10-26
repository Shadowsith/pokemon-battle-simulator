import { Point, BattleStageRefs, MoveVisual, MoveAnimRegistry } from '../../animation.types';
import { DIM_BACKDROP } from '../../animation.constants';
import { Fx } from '../../fx';
import { FxGlyphs } from '../../fx-glyphs';
import { FxEffects } from '../../fx-effects';

/** Hand-made animations for Normal-type ranged moves (orbs, beams, blasts, gazes). */
export class NormalRangedMoveAnimations {
  /** By @pkmn/sim move id. */
  static readonly anims: MoveAnimRegistry = {
    barrage: (refs, launch, target) => NormalRangedMoveAnimations.playBarrage(refs, launch, target),
    eggbomb: (refs, launch, target) => NormalRangedMoveAnimations.playEggBomb(refs, launch, target),
    explosion: (refs, launch, target, v) => NormalRangedMoveAnimations.playExplosion(refs, launch, target, v),
    glare: (refs, launch, target) => NormalRangedMoveAnimations.playGlare(refs, launch, target),
    hyperbeam: (refs, launch, target) => NormalRangedMoveAnimations.playHyperBeam(refs, launch, target),
    triattack: (refs, launch, target) => NormalRangedMoveAnimations.playTriAttack(refs, launch, target),
    razorwind: (refs, _launch, target) => NormalRangedMoveAnimations.playRazorBlades(refs, target)
  };

  /** Turn-1 animations of two-turn moves, by @pkmn/sim move id. */
  static readonly chargeAnims: MoveAnimRegistry = {
    razorwind: (refs, launch) => NormalRangedMoveAnimations.playRazorWhirlwind(refs, launch)
  };

  /**
   * Barrage: one large glowing white orb is lobbed at the target; the ground
   * shakes once it lands.
   */
  private static async playBarrage(refs: BattleStageRefs, launch: Point, target: Point) {
    const { fxEl, fieldEl, targetEl } = refs;
    const size = 46;
    const dx = target.x - launch.x;
    const dy = target.y - launch.y;
    const arc = Math.min(launch.y, target.y) - 70 - launch.y;

    const orb = document.createElement('div');
    orb.style.cssText = `position:absolute;width:${size}px;height:${size}px;border-radius:50%;pointer-events:none;background:radial-gradient(circle at 38% 32%,#fff,#F3EEFF 45%,#CFC6E6 80%,#B7ADD4);box-shadow:0 0 14px #fff,0 0 28px #E8E0FFaa`;
    Fx.place(orb, launch);
    fxEl.appendChild(orb);
    await Fx.anim(orb, [
      { transform: 'translate(0,0) scale(.5)', opacity: 0, offset: 0 },
      { transform: `translate(${dx * 0.12}px,${arc * 0.4}px) scale(.75)`, opacity: 1, offset: 0.12 },
      { transform: `translate(${dx * 0.5}px,${arc}px) scale(1)`, offset: 0.5 },
      { transform: `translate(${dx}px,${dy}px) scale(1.1)`, offset: 1 }
    ], { duration: 620, easing: 'ease-in' });

    // Impact: the orb squashes and bursts into light, the target recoils, then the ground shakes.
    Fx.anim(orb, [
      { transform: `translate(${dx}px,${dy}px) scale(1.1,1.1)`, opacity: 1 },
      { transform: `translate(${dx}px,${dy}px) scale(1.6,1.2)`, opacity: 0 }
    ], { duration: 260, easing: 'ease-out' }).then(() => orb.remove());
    Fx.flash(targetEl, '#ffffff', 0.7);
    Fx.shake(targetEl, 5);
    await Fx.wait(120);
    Fx.shakeField(fieldEl, 0.6);
    await Fx.wait(480);
  }
  /**
   * Egg Bomb: a white egg is lobbed in a high arc, tumbling, onto the target,
   * where it blows up in a fiery blast with red sparks flying out.
   */
  private static async playEggBomb(refs: BattleStageRefs, launch: Point, target: Point) {
    const { fieldEl, fxEl, targetEl } = refs;
    const r = targetEl.getBoundingClientRect();

    // 1. The egg flies in a high arc and lands on the target.
    const egg = document.createElement('div');
    egg.style.cssText = 'position:absolute;width:20px;height:26px;pointer-events:none;border-radius:50% 50% 50% 50%/60% 60% 40% 40%;background:radial-gradient(circle at 35% 30%,#fff 0 30%,#ECEAE4 60%,#BDB9B0);box-shadow:0 0 3px #00000055';
    Fx.place(egg, launch);
    fxEl.appendChild(egg);
    const dx = target.x - launch.x;
    const dy = target.y - launch.y;
    const apexY = Math.min(0, dy) - 120;
    const steps = 14;
    const frames: Keyframe[] = [];
    for (let k = 0; k <= steps; k++) {
      const t = k / steps;
      const u = 1 - t;
      const x = t * dx;
      const y = 2 * u * t * apexY + t * t * dy;
      frames.push({ transform: `translate(${x}px,${y}px) rotate(${t * 300 * Math.sign(dx || 1)}deg) scale(${0.8 + t * 0.2})`, opacity: t === 0 ? 0 : 1 });
    }
    await Fx.anim(egg, frames, { duration: 700, easing: 'ease-in' });
    egg.remove();

    // 2. Explosion on the target.
    const blast = FxEffects.fireBlastCloud(fxEl, { x: target.x, y: target.y + r.height * 0.1 }, Math.max(r.width * 0.55, 44), 12, '#E0201A');
    Fx.flash(targetEl, '#FFB13C', 0.8);
    Fx.shake(targetEl, 6);
    Fx.shakeField(fieldEl, 0.6);
    await blast;
  }
  /**
   * Explosion: glowing orange sparks gather into the caster as it lights up,
   * then it blows up - a huge fireball with light rays and a white flash that
   * fill the screen - and the target is hit (blinking).
   */
  private static async playExplosion(refs: BattleStageRefs, launch: Point, target: Point, v: MoveVisual) {
    const { fieldEl, fxEl, launchEl, targetEl, screenFxEl } = refs;
    const field = fieldEl.getBoundingClientRect();
    const r = launchEl.getBoundingClientRect();

    // 1. Orange sparks drift in from all around and gather on the caster.
    const gather = 900;
    const glow = Fx.anim(launchEl, [
      { filter: 'brightness(1)' },
      { filter: 'brightness(1.8) drop-shadow(0 0 12px #FFB060)' }
    ], { duration: gather, easing: 'ease-in', fill: 'forwards' });
    for (let i = 0; i < 14; i++) {
      const s = 8 + Math.random() * 6;
      const orb = document.createElement('div');
      orb.style.cssText = `position:absolute;width:${s}px;height:${s}px;border-radius:50%;pointer-events:none;background:radial-gradient(circle,#FFF0C0,#FF8A2A 45%,#F0501A00 75%);box-shadow:0 0 ${s}px #FF8A2A`;
      const ang = Math.random() * Math.PI * 2;
      const dist = Math.max(r.width * 0.7, 50) * (0.8 + Math.random() * 0.4);
      Fx.place(orb, { x: launch.x + Math.cos(ang) * dist, y: launch.y + Math.sin(ang) * dist * 0.8 });
      fxEl.appendChild(orb);
      Fx.anim(orb, [
        { transform: 'translate(0,0) scale(.4)', opacity: 0 },
        { transform: 'translate(0,0) scale(1)', opacity: 1, offset: 0.3 },
        { transform: `translate(${-Math.cos(ang) * dist}px,${-Math.sin(ang) * dist * 0.8}px) scale(.3)`, opacity: 0.8 }
      ], { duration: 600, easing: 'ease-in', delay: Math.random() * (gather - 600) }).then(() => orb.remove());
    }
    await glow;

    // 2. Boom: white flash, light rays and a giant fireball on the caster.
    const at = `${launch.x}px ${launch.y}px`;
    // Behind the sprites, so the target stays visible in front of the glare.
    const rays = Fx.backdrop(
      fieldEl,
      `background:radial-gradient(circle at ${at},#fff 0 18%,#FFFDF0cc 35%,#FFF6D000 70%),` +
        `repeating-conic-gradient(from 0deg at ${at},#FFE87Acc 0 8deg,#FFE87A00 8deg 24deg),#FFFBEF`
    );
    const raysShow = Fx.anim(rays, [
      { opacity: 0 },
      { opacity: 1, offset: 0.1 },
      { opacity: 1, offset: 0.65 },
      { opacity: 0 }
    ], { duration: 1400, easing: 'ease-out' }).then(() => rays.remove());
    Fx.screenWash(screenFxEl, '#ffffffcc', 80, 200, `${(launch.x / field.width) * 100}%`);
    launchEl.getAnimations().forEach((a) => a.cancel());
    const blast = FxEffects.fireBlastCloud(fxEl, launch, Math.max(field.width * 0.32, 110), 18, '#FF8A2A');
    Fx.shakeField(fieldEl, 1.4);

    // 3. The target is caught in the blast.
    await Fx.wait(250);
    await Promise.all([Fx.blink(targetEl), FxEffects.impact(refs, target, v, 0)]);
    await Promise.all([blast, raysShow]);
  }
  /**
   * Glare: the scene turns dark red and a pair of glowing red snake eyes
   * opens above the field and stares; then the target is paralysed - its
   * sprite goes dark while yellow sparks crackle around it.
   */
  private static async playGlare(refs: BattleStageRefs, launch: Point, target: Point) {
    const { fieldEl, fxEl, targetEl } = refs;
    const field = fieldEl.getBoundingClientRect();

    const dark = Fx.backdrop(fieldEl, 'background:radial-gradient(circle at 45% 40%,#4A1A12,#24080A 60%,#120404)');
    await Fx.anim(dark, [{ opacity: 0 }, { opacity: 1 }], { duration: 300, easing: 'ease-out' });

    // 1. The eyes open (squeezed flat -> open), glow, narrow once, then fade.
    const eyeW = Math.max(field.width * 0.16, 56);
    const gap = eyeW * 0.25;
    const centre = { x: (launch.x + target.x) / 2, y: Math.min(launch.y, target.y) - 10 };
    const eyes = [-1, 1].map((side) => {
      const eye = FxGlyphs.snakeEyeGlyph(eyeW, side as 1 | -1);
      Fx.place(eye, { x: centre.x + side * (eyeW / 2 + gap / 2), y: centre.y });
      fxEl.appendChild(eye);
      return eye;
    });
    await Promise.all(
      eyes.map((eye) =>
        Fx.anim(eye, [
          { transform: 'scaleY(0)', opacity: 0 },
          { transform: 'scaleY(1.1)', opacity: 1, offset: 0.7 },
          { transform: 'scaleY(1)', opacity: 1 }
        ], { duration: 280, easing: 'ease-out' })
      )
    );
    await Promise.all(
      eyes.map((eye) =>
        Fx.anim(eye, [
          { transform: 'scaleY(1)', filter: 'brightness(1)' },
          { transform: 'scaleY(.55)', filter: 'brightness(1.6)', offset: 0.45 },
          { transform: 'scaleY(1)', filter: 'brightness(1.3)', offset: 0.7 },
          { transform: 'scaleY(1)', filter: 'brightness(1)' }
        ], { duration: 600, easing: 'ease-in-out' })
      )
    );
    eyes.forEach((eye) =>
      Fx.anim(eye, [{ opacity: 1 }, { opacity: 0 }], { duration: 250, easing: 'ease-in' }).then(() => eye.remove())
    );

    // 2. Shock: the target goes dark and twitches while sparks crackle round it.
    const r = targetEl.getBoundingClientRect();
    const darken = Fx.anim(targetEl, [
      { filter: 'brightness(1)' },
      { filter: 'brightness(.35) saturate(.6)', offset: 0.15 },
      { filter: 'brightness(.45) saturate(.6)', offset: 0.85 },
      { filter: 'brightness(1)' }
    ], { duration: 1100, easing: 'ease-in-out', fill: 'none' });
    for (let i = 0; i < 12; i++) {
      setTimeout(() => {
        const bolt = FxGlyphs.boltGlyph('#FFE04A', 8 + Math.random() * 6);
        Fx.place(bolt, {
          x: target.x + (Math.random() * 2 - 1) * Math.max(r.width * 0.5, 26),
          y: target.y + (Math.random() * 2 - 1) * Math.max(r.height * 0.45, 24)
        });
        bolt.style.filter = 'drop-shadow(0 0 4px #FFE04A)';
        fxEl.appendChild(bolt);
        const rot = Math.random() * 60 - 30;
        Fx.anim(bolt, [
          { transform: `rotate(${rot}deg) scale(.4)`, opacity: 0 },
          { transform: `rotate(${rot}deg) scale(1.1)`, opacity: 1, offset: 0.3 },
          { transform: `rotate(${rot}deg) scale(1)`, opacity: 0 }
        ], { duration: 220, easing: 'ease-out' }).then(() => bolt.remove());
        if (i % 3 === 0) Fx.shake(targetEl, 3);
      }, 60 + i * 70);
    }
    await darken;

    await Fx.anim(dark, [{ opacity: 1 }, { opacity: 0 }], { duration: 300, easing: 'ease-in' });
    dark.remove();
  }
  /**
   * Hyper Beam: the backdrop turns bright green with dark green streaks racing
   * along the top and bottom edges. A thick golden beam with a spiky glowing
   * fringe and rolling energy bulges blasts the target, throwing off sparkles.
   */
  private static async playHyperBeam(refs: BattleStageRefs, launch: Point, target: Point) {
    const { fieldEl, fxEl, targetEl } = refs;
    const W = fieldEl.clientWidth;
    const H = fieldEl.clientHeight;
    const dir = target.x >= launch.x ? 1 : -1;
    const gold = '#FFC21A';

    // Backdrop: green field, with streaks scrolling in a band along the top and bottom edges.
    const bg = Fx.backdrop(fieldEl, 'background:linear-gradient(180deg,#3E8E1E,#8CC63A 22%,#C9E35A 50%,#8CC63A 78%,#3E8E1E);opacity:0');
    for (let i = 0; i < 26; i++) {
      const top = i % 2 === 0;
      const len = 30 + Math.random() * 70;
      const h = 4 + Math.random() * 6;
      const y = top ? Math.random() * H * 0.2 : H * 0.8 + Math.random() * H * 0.2 - h;
      const streak = document.createElement('div');
      streak.style.cssText = `position:absolute;left:0;top:${y}px;width:${len}px;height:${h}px;border-radius:${h}px;background:${Math.random() < 0.6 ? '#1F6A12' : '#2E8A1A'};opacity:${0.6 + Math.random() * 0.4}`;
      bg.appendChild(streak);
      streak.animate(
        [
          { transform: `translateX(${dir > 0 ? -len : W}px)` },
          { transform: `translateX(${dir > 0 ? W : -len}px)` }
        ],
        { duration: 500 + Math.random() * 400, delay: -Math.random() * 900, iterations: Infinity, easing: 'linear' }
      );
    }
    // The scene goes dark first; backdrop() inserts at the back, so the dim layer sits behind the green one.
    const dim = Fx.backdrop(fieldEl, DIM_BACKDROP);
    await Fx.anim(dim, [{ opacity: 0 }, { opacity: 1 }], { duration: 300, easing: 'ease-out' });
    await Fx.wait(150);
    await Fx.anim(bg, [{ opacity: 0 }, { opacity: 1 }], { duration: 400, easing: 'ease-in-out' });
    dim.remove();

    const dx = target.x - launch.x;
    const dy = target.y - launch.y;
    const dist = Math.hypot(dx, dy) || 1;
    const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
    const nx = -dy / dist;
    const ny = dx / dist;
    const thick = 40;
    const len = dist + 30; // reaches a little past the target, as if blasting through it
    const grow = 220;
    const hold = 1000;
    const fadeOut = 280;
    const total = grow + hold + fadeOut;

    // Beam: a spiky cream fringe (tiled SVG spikes) around a golden core of rolling bulges.
    const spikes =
      'url("data:image/svg+xml,' +
      encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="40" viewBox="0 0 12 40" preserveAspectRatio="none">' +
          '<path d="M0,20 L1,7 L3,14 L6,1 L8,13 L11,5 L12,20 L11,35 L8,27 L6,39 L3,26 L1,33 Z" fill="#FFF4C8"/>' +
          '</svg>'
      ) +
      '")';
    const beam = document.createElement('div');
    beam.style.cssText = `position:absolute;left:${launch.x}px;top:${launch.y - thick / 2}px;width:${len}px;height:${thick}px;pointer-events:none;transform-origin:0 50%;filter:drop-shadow(0 0 6px ${gold})`;
    const fringe = document.createElement('div');
    fringe.style.cssText = `position:absolute;inset:0;background:${spikes} 0 0/12px 100% repeat-x`;
    const core = document.createElement('div');
    core.style.cssText = `position:absolute;left:0;right:0;top:22%;height:56%;border-radius:${thick}px;background:radial-gradient(ellipse at center,#FFFBE0 0,#FFE066 30%,${gold} 55%,#E89200 72%,transparent 74%) 0 0/26px 100% repeat-x`;
    beam.append(fringe, core);
    fxEl.appendChild(beam);
    // Spikes and bulges roll along the beam towards the target.
    fringe.animate([{ backgroundPosition: '0 0' }, { backgroundPosition: '36px 0' }], { duration: 160, iterations: Infinity });
    core.animate([{ backgroundPosition: '0 0' }, { backgroundPosition: '52px 0' }], { duration: 160, iterations: Infinity });

    const rot = `rotate(${angle}deg)`;
    const frames: Keyframe[] = [{ transform: `${rot} scale(0,.6)`, opacity: 1, offset: 0 }];
    const flickers = 12;
    for (let k = 0; k <= flickers; k++) {
      frames.push({
        transform: `${rot} scale(1,${k % 2 ? 0.88 : 1.1})`,
        opacity: 1,
        offset: (grow + (k / flickers) * hold) / total
      });
    }
    frames.push({ transform: `${rot} scale(1,.1)`, opacity: 0, offset: 1 });
    const beamDone = Fx.anim(beam, frames, { duration: total, easing: 'linear' }).then(() => beam.remove());

    // Golden and white sparkles burst off the sides of the beam.
    for (let i = 0; i < 36; i++) {
      const t = Math.random();
      const side = Math.random() < 0.5 ? -1 : 1;
      const off = side * (10 + Math.random() * 8);
      const drift = side * (14 + Math.random() * 26);
      const star = FxGlyphs.sparkStar(7 + Math.random() * 9, i % 3 ? gold : '#FFFFFF');
      Fx.place(star, { x: launch.x + dx * t + nx * off, y: launch.y + dy * t + ny * off });
      fxEl.appendChild(star);
      Fx.anim(star, [
        { transform: 'translate(0,0) scale(0) rotate(0deg)', opacity: 0 },
        { transform: `translate(${nx * drift * 0.4}px,${ny * drift * 0.4}px) scale(1.2) rotate(70deg)`, opacity: 1, offset: 0.3 },
        { transform: `translate(${nx * drift}px,${ny * drift}px) scale(.2) rotate(160deg)`, opacity: 0 }
      ], { duration: 450 + Math.random() * 250, easing: 'ease-out', delay: grow * t + Math.random() * hold * 0.85 }).then(() => star.remove());
    }

    // Impact: the target is pummelled with golden flashes and the field shakes.
    await Fx.wait(grow);
    Fx.shakeField(fieldEl, 0.8);
    for (let i = 0; i < 5; i++) {
      setTimeout(() => {
        Fx.flash(targetEl, gold, 0.6);
        Fx.shake(targetEl, 5);
      }, i * 210);
    }
    await beamDone;

    // Final burst of sparkles from the target.
    for (let i = 0; i < 10; i++) {
      const star = FxGlyphs.sparkStar(10 + Math.random() * 8, i % 2 ? gold : '#FFFFFF');
      Fx.place(star, target);
      fxEl.appendChild(star);
      const ang = (Math.PI * 2 * i) / 10;
      Fx.anim(star, [
        { transform: 'translate(0,0) scale(.3)', opacity: 1 },
        { transform: `translate(${Math.cos(ang) * 46}px,${Math.sin(ang) * 46}px) scale(1)`, opacity: 0 }
      ], { duration: 380, easing: 'ease-out' }).then(() => star.remove());
    }
    await Fx.anim(bg, [{ opacity: 1 }, { opacity: 0 }], { duration: 350, easing: 'ease-in' });
    bg.remove();
  }
  /**
   * Tri Attack: the field goes black, a blue, a yellow and a red orb circle the
   * caster, then they are hurled one after another at the target and burst
   * into an electric, an ice and a fire effect.
   */
  private static async playTriAttack(refs: BattleStageRefs, launch: Point, target: Point) {
    const { fieldEl, fxEl, launchEl, targetEl } = refs;
    const black = Fx.backdrop(fieldEl, 'background:radial-gradient(circle at 50% 45%,#15151C,#000)');
    await Fx.anim(black, [{ opacity: 0 }, { opacity: 1 }], { duration: 300, easing: 'ease-out' });

    const orbs = [
      { color: '#4F6BFF', core: '#E4EAFF', burst: NormalRangedMoveAnimations.triElectric },
      { color: '#FFD83A', core: '#FFFBE0', burst: NormalRangedMoveAnimations.triIce },
      { color: '#FF3B3B', core: '#FFE2DC', burst: NormalRangedMoveAnimations.triFire }
    ];
    const r = launchEl.getBoundingClientRect();
    const rx = Math.max(r.width * 0.75, 44);
    const ry = rx * 0.3;
    const center = { x: launch.x, y: launch.y + r.height * 0.15 };
    const size = Math.max(rx * 0.38, 18);

    // 1. A faint white swirl ring marks the orbit.
    const ring = document.createElement('div');
    ring.style.cssText = `position:absolute;width:${rx * 2}px;height:${ry * 2}px;border-radius:50%;pointer-events:none;border:2px solid #ffffffaa;box-shadow:0 0 8px #ffffff66`;
    Fx.place(ring, center);
    fxEl.appendChild(ring);
    Fx.anim(ring, [{ opacity: 0 }, { opacity: 0.8, offset: 0.2 }, { opacity: 0.8, offset: 0.8 }, { opacity: 0 }], {
      duration: 1100,
      easing: 'linear'
    }).then(() => ring.remove());

    // 2. The three orbs circle the caster twice, 120° apart; smaller and dimmer behind it.
    const turns = 2;
    const steps = 24;
    const orbitDur = 1000;
    const els = orbs.map((o) => {
      const el = document.createElement('div');
      el.style.cssText = `position:absolute;width:${size}px;height:${size}px;border-radius:50%;pointer-events:none;background:radial-gradient(circle at 40% 38%,${o.core},${o.color} 45%,${o.color}00 78%);box-shadow:0 0 14px ${o.color}`;
      Fx.place(el, center);
      fxEl.appendChild(el);
      return el;
    });
    const orbitAt = (i: number, t: number) => {
      const ang = (i / 3) * Math.PI * 2 + t * turns * Math.PI * 2;
      return { x: Math.cos(ang) * rx, y: Math.sin(ang) * ry, depth: Math.sin(ang) };
    };
    await Promise.all(
      els.map((el, i) => {
        const frames: Keyframe[] = [];
        for (let k = 0; k <= steps; k++) {
          const p = orbitAt(i, k / steps);
          frames.push({
            transform: `translate(${p.x}px,${p.y}px) scale(${0.8 + p.depth * 0.25})`,
            opacity: k === 0 ? 0 : 0.75 + p.depth * 0.25
          });
        }
        return Fx.anim(el, frames, { duration: orbitDur, easing: 'linear', fill: 'forwards' });
      })
    );

    // 3. Hurl them one by one at the target; each bursts into its element.
    const travel = 300;
    const gap = 170;
    await Promise.all(
      els.map((el, i) => {
        const p = orbitAt(i, 1);
        const hit = {
          x: target.x + (i - 1) * 14,
          y: target.y + (i - 1) * 8
        };
        return Fx.anim(el, [
          { transform: `translate(${p.x}px,${p.y}px) scale(1)`, opacity: 1 },
          { transform: `translate(${hit.x - center.x}px,${hit.y - center.y}px) scale(1.15)`, opacity: 1 }
        ], { duration: travel, easing: 'ease-in', delay: i * gap }).then(() => {
          el.remove();
          Fx.flash(targetEl, orbs[i].color, 0.6);
          Fx.shake(targetEl, 4);
          return orbs[i].burst(fxEl, hit, targetEl);
        });
      })
    );

    await Fx.anim(black, [{ opacity: 1 }, { opacity: 0 }], { duration: 300, easing: 'ease-in' });
    black.remove();
  }
  /** Tri Attack hit 1: yellow sparks crackle around the hit point. */
  private static triElectric(fxEl: HTMLElement, at: Point): Promise<void> {
    const done: Promise<void>[] = [];
    for (let i = 0; i < 7; i++) {
      const b = FxGlyphs.sparkBolt();
      const ang = Math.random() * Math.PI * 2;
      const dist = 8 + Math.random() * 26;
      Fx.place(b, { x: at.x + Math.cos(ang) * dist, y: at.y + Math.sin(ang) * dist });
      fxEl.appendChild(b);
      const rot = Math.random() * 60 - 30;
      done.push(
        Fx.anim(b, [
          { transform: `rotate(${rot}deg) scale(.4)`, opacity: 0 },
          { transform: `rotate(${rot}deg) scale(1.1)`, opacity: 1, offset: 0.3 },
          { transform: `rotate(${rot}deg) scale(1)`, opacity: 0 }
        ], { duration: 300, easing: 'ease-out', delay: i * 35 }).then(() => b.remove())
      );
    }
    return Promise.all(done).then(() => void 0);
  }
  /** Tri Attack hit 2: ice crystals burst outward. */
  private static triIce(fxEl: HTMLElement, at: Point): Promise<void> {
    const done: Promise<void>[] = [];
    for (let i = 0; i < 8; i++) {
      const shard = FxGlyphs.iceShard(7 + Math.random() * 6);
      Fx.place(shard, at);
      fxEl.appendChild(shard);
      const ang = (i / 8) * Math.PI * 2 + Math.random() * 0.4;
      const dist = 22 + Math.random() * 16;
      const rot = (ang * 180) / Math.PI + 90;
      done.push(
        Fx.anim(shard, [
          { transform: `translate(0,0) rotate(${rot}deg) scale(.3)`, opacity: 1 },
          { transform: `translate(${Math.cos(ang) * dist}px,${Math.sin(ang) * dist}px) rotate(${rot}deg) scale(1)`, opacity: 0 }
        ], { duration: 380, easing: 'ease-out' }).then(() => shard.remove())
      );
    }
    return Promise.all(done).then(() => void 0);
  }
  /** Tri Attack hit 3: fire puffs flare up around the target. */
  private static triFire(fxEl: HTMLElement, at: Point, targetEl: HTMLElement): Promise<void> {
    const r = targetEl.getBoundingClientRect();
    const spread = Math.max(r.width * 0.45, 26);
    const done: Promise<void>[] = [];
    for (let i = 0; i < 8; i++) {
      const puff = FxGlyphs.firePuff(14 + Math.random() * 12, i % 3 ? 'hot' : 'red');
      Fx.place(puff, { x: at.x + (Math.random() * 2 - 1) * spread, y: at.y + (Math.random() * 2 - 1) * spread * 0.8 });
      fxEl.appendChild(puff);
      done.push(
        Fx.anim(puff, [
          { transform: 'translateY(0) scale(.3)', opacity: 0 },
          { transform: 'translateY(-4px) scale(1.1)', opacity: 1, offset: 0.35 },
          { transform: 'translateY(-14px) scale(.6)', opacity: 0 }
        ], { duration: 480, easing: 'ease-out', delay: i * 45 }).then(() => puff.remove())
      );
    }
    return Promise.all(done).then(() => void 0);
  }

  /**
   * Razor Wind, turn 1: a pale blue whirlwind spins up around the caster -
   * flat spinning rings stacked from its feet upward, rising as they turn.
   */
  private static async playRazorWhirlwind(refs: BattleStageRefs, launch: Point) {
    const { fieldEl, fxEl, launchEl } = refs;
    const r = launchEl.getBoundingClientRect();
    const foot = Fx.footOf(launchEl, fieldEl);
    const h = Math.max(r.height * 1.3, 70);
    const base = Math.max(r.width * 0.9, 56);
    const rings = 7;
    const total = 1400;

    const done: Promise<void>[] = [];
    for (let i = 0; i < rings; i++) {
      const u = i / (rings - 1);
      // A funnel: narrow at the feet, wider towards the top.
      const w = base * (0.7 + u * 0.6);
      // The wrapper flattens a circle into an ellipse; the circle inside spins,
      // so its open arcs sweep round like wind.
      const wrap = document.createElement('div');
      wrap.style.cssText = `position:absolute;width:${w}px;height:${w}px;pointer-events:none`;
      Fx.place(wrap, { x: foot.x, y: foot.y - u * h * 0.85 });
      const ring = document.createElement('div');
      const bw = 2 + (1 - u) * 2;
      ring.style.cssText = `width:100%;height:100%;border-radius:50%;border:${bw}px solid transparent;border-top-color:#F4FBFF;border-left-color:#A8D8FFcc;border-bottom-color:#E0F2FF88;filter:drop-shadow(0 0 3px #9CD6FF)`;
      wrap.appendChild(ring);
      fxEl.appendChild(wrap);
      const delay = i * 60;
      ring.animate([{ transform: 'rotate(0deg)' }, { transform: 'rotate(-1080deg)' }], {
        duration: total,
        delay,
        easing: 'linear'
      });
      done.push(
        Fx.anim(wrap, [
          { transform: 'translateY(0) scale(.4,.12)', opacity: 0 },
          { transform: `translateY(${-h * 0.05}px) scale(1,.28)`, opacity: 1, offset: 0.2 },
          { transform: `translateY(${-h * 0.15}px) scale(1.05,.3)`, opacity: 0.9, offset: 0.75 },
          { transform: `translateY(${-h * 0.3}px) scale(1.15,.3)`, opacity: 0 }
        ], { duration: total, easing: 'ease-in-out', delay }).then(() => wrap.remove())
      );
    }
    await Promise.all(done);
  }

  /**
   * Razor Wind, turn 2: thin red blade slashes cut across the target one
   * after another at different angles.
   */
  private static async playRazorBlades(refs: BattleStageRefs, target: Point) {
    const { fxEl, targetEl } = refs;
    const r = targetEl.getBoundingClientRect();
    const len = Math.max(r.width * 1.5, 90);
    const slashes = 5;
    const gap = 120;

    const done: Promise<void>[] = [];
    for (let i = 0; i < slashes; i++) {
      const angle = -70 + Math.random() * 60 + (i % 2 ? 90 : 0);
      const at = {
        x: target.x + (Math.random() * 2 - 1) * r.width * 0.2,
        y: target.y + (Math.random() * 2 - 1) * r.height * 0.2
      };
      const blade = document.createElement('div');
      blade.style.cssText = `position:absolute;width:${len}px;height:3px;border-radius:2px;pointer-events:none;background:linear-gradient(90deg,#E0281C00,#E0281C 25%,#FF6A50 50%,#E0281C 75%,#E0281C00);box-shadow:0 0 4px #FF3A2A`;
      Fx.place(blade, at);
      fxEl.appendChild(blade);
      // The cut is drawn from one end to the other, then thins out and fades.
      done.push(
        Fx.anim(blade, [
          { transform: `rotate(${angle}deg) scaleX(0)`, transformOrigin: '0 50%', opacity: 1 },
          { transform: `rotate(${angle}deg) scaleX(1)`, transformOrigin: '0 50%', opacity: 1, offset: 0.35 },
          { transform: `rotate(${angle}deg) scale(1,.4)`, transformOrigin: '0 50%', opacity: 0 }
        ], { duration: 320, easing: 'ease-out', delay: i * gap }).then(() => blade.remove())
      );
      setTimeout(() => {
        Fx.shake(targetEl, 4);
        if (i % 2 === 0) Fx.flash(targetEl, '#FF3A2A', 0.5);
      }, i * gap + 80);
    }
    await Promise.all(done);
  }
}
