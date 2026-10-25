import { Point, BattleStageRefs, MoveVisual } from './animation.types';
import { FLECK_COLOR, WEATHER_COLOR } from './animation.constants';
import { Fx } from './fx';
import { FxGlyphs } from './fx-glyphs';
import { FxEffects } from './fx-effects';

/** Generic animations derived from a move's delivery (melee, beam, lob, …) - used for every move without a hand-made animation. */
export class DeliveryAnimations {
  static playDelivery(refs: BattleStageRefs, launch: Point, target: Point, v: MoveVisual): Promise<void> {
    switch (v.delivery) {
      case 'weather':
        return DeliveryAnimations.playWeather(refs, v);
      case 'selfAura':
        return DeliveryAnimations.playSelfAura(refs, launch, v);
      case 'targetAura':
        return DeliveryAnimations.playTargetAura(refs, target, v);
      case 'powder':
        return DeliveryAnimations.playPowder(refs, launch, target, v);
      case 'sonic':
        return DeliveryAnimations.playSonic(refs, launch, target, v);
      case 'field':
        return DeliveryAnimations.playField(refs, target, v);
      case 'beam':
        return DeliveryAnimations.playBeam(refs, launch, target, v);
      case 'pulse':
        return DeliveryAnimations.playPulse(refs, launch, target, v);
      case 'lob':
        return DeliveryAnimations.playLob(refs, launch, target, v);
      case 'projectile':
        return DeliveryAnimations.playProjectile(refs, launch, target, v);
      case 'melee':
        return DeliveryAnimations.playMelee(refs, launch, target, v);
    }
  }

  private static async playMelee(refs: BattleStageRefs, launch: Point, target: Point, v: MoveVisual) {
    const { launchEl, targetEl, fxEl } = refs;
    const dir = v.dir;
    const original = launchEl.style.transform;
    for (let hit = 0; hit < v.hits; hit++) {
      await Fx.anim(launchEl, [
        { transform: `${original} translateX(${dir * -10}px)` },
        { transform: `${original} translateX(${dir * 42}px)` }
      ], { duration: v.quick ? 120 : 170, easing: 'ease-in' });
      FxEffects.meleeGlyph(fxEl, target, v);
      await FxEffects.impact(refs, target, v, hit);
      await Fx.anim(launchEl, [{ transform: `${original} translateX(${dir * 42}px)` }, { transform: original }], {
        duration: 110,
        easing: 'ease-out'
      });
    }
    launchEl.style.transform = original;
    FxEffects.afterImpact(refs, launch, target, v);
  }

  private static async playProjectile(refs: BattleStageRefs, launch: Point, target: Point, v: MoveVisual) {
    for (let hit = 0; hit < v.hits; hit++) {
      FxEffects.streamParticles(refs.fxEl, launch, target, v, 5 + Math.round(v.power * 6), v.quick ? 260 : 420);
      const core = FxGlyphs.glyph(v, 16 + v.power * 12);
      Fx.place(core, launch);
      refs.fxEl.appendChild(core);
      await Fx.anim(core, [
        { transform: 'translate(0,0) scale(.4)', opacity: 0.9 },
        { transform: `translate(${target.x - launch.x}px,${target.y - launch.y}px) scale(1.3)`, opacity: 1 }
      ], { duration: v.quick ? 260 : 430, easing: 'cubic-bezier(.4,0,.7,1)' });
      core.remove();
      await FxEffects.impact(refs, target, v, hit);
    }
    FxEffects.afterImpact(refs, launch, target, v);
  }

  private static async playLob(refs: BattleStageRefs, launch: Point, target: Point, v: MoveVisual) {
    const arc = Math.min(launch.y, target.y) - 90 - v.power * 40;
    for (let hit = 0; hit < v.hits; hit++) {
      const orb = FxGlyphs.glyph(v, 18 + v.power * 14);
      Fx.place(orb, launch);
      refs.fxEl.appendChild(orb);
      await Fx.anim(orb, [
        { transform: 'translate(0,0) scale(.5)', offset: 0 },
        { transform: `translate(${(target.x - launch.x) * 0.5}px,${arc - launch.y}px) scale(1)`, offset: 0.5 },
        { transform: `translate(${target.x - launch.x}px,${target.y - launch.y}px) scale(1.1)`, offset: 1 }
      ], { duration: 520, easing: 'linear' });
      orb.remove();
      await FxEffects.impact(refs, target, v, hit);
      if (hit < v.hits - 1) await Fx.wait(80);
    }
    FxEffects.afterImpact(refs, launch, target, v);
  }

  private static async playBeam(refs: BattleStageRefs, launch: Point, target: Point, v: MoveVisual) {
    const dx = target.x - launch.x;
    const dy = target.y - launch.y;
    const dist = Math.hypot(dx, dy);
    const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
    const thickness = 6 + v.power * 16;
    const beam = document.createElement('div');
    beam.style.cssText = `position:absolute;left:${launch.x}px;top:${launch.y - thickness / 2}px;height:${thickness}px;width:0;border-radius:${thickness}px;transform-origin:left center;transform:rotate(${angle}deg);background:linear-gradient(90deg,${v.color},#fff 75%);box-shadow:0 0 ${8 + v.power * 20}px ${v.color}`;
    refs.fxEl.appendChild(beam);
    await Fx.anim(beam, [{ width: '0px' }, { width: `${dist}px` }], {
      duration: 260,
      easing: 'ease-out',
      fill: 'forwards'
    });
    await FxEffects.impact(refs, target, v, 0);
    await Fx.wait(120 + v.power * 260);
    await Fx.anim(beam, [{ opacity: 1 }, { opacity: 0 }], { duration: 200, fill: 'forwards' });
    beam.remove();
    FxEffects.afterImpact(refs, launch, target, v);
  }

  private static async playPulse(refs: BattleStageRefs, launch: Point, target: Point, v: MoveVisual) {
    const dx = target.x - launch.x;
    const dy = target.y - launch.y;
    for (let i = 0; i < 3; i++) {
      const ring = document.createElement('div');
      const size = 26 + v.power * 16;
      ring.style.cssText = `position:absolute;left:${launch.x - size / 2}px;top:${launch.y - size / 2}px;width:${size}px;height:${size}px;border-radius:50%;border:3px solid ${v.color};background:radial-gradient(circle,${v.color}44,transparent 70%)`;
      refs.fxEl.appendChild(ring);
      Fx.anim(ring, [
        { transform: 'translate(0,0) scale(.6)', opacity: 1 },
        { transform: `translate(${dx}px,${dy}px) scale(1.4)`, opacity: 0 }
      ], { duration: 520, easing: 'ease-in', delay: i * 130 }).then(() => ring.remove());
    }
    await Fx.wait(560);
    await FxEffects.impact(refs, target, v, 0);
    FxEffects.afterImpact(refs, launch, target, v);
  }

  private static async playSonic(refs: BattleStageRefs, launch: Point, target: Point, v: MoveVisual) {
    for (let i = 0; i < 4; i++) {
      const ring = document.createElement('div');
      ring.style.cssText = `position:absolute;left:${launch.x}px;top:${launch.y}px;width:20px;height:20px;margin:-10px 0 0 -10px;border-radius:50%;border:2px solid ${v.color};opacity:.85`;
      refs.fxEl.appendChild(ring);
      Fx.anim(ring, [
        { transform: 'scale(.4)', opacity: 0.9 },
        { transform: `scale(${6 + v.power * 5})`, opacity: 0 }
      ], { duration: 640, easing: 'ease-out', delay: i * 110 }).then(() => ring.remove());
    }
    await Fx.wait(430);
    await FxEffects.impact(refs, target, v, 0);
    FxEffects.afterImpact(refs, launch, target, v);
  }

  private static async playPowder(refs: BattleStageRefs, launch: Point, target: Point, v: MoveVisual) {
    FxEffects.streamParticles(refs.fxEl, launch, target, v, 22, 900, 26);
    await Fx.wait(760);
    Fx.flash(refs.targetEl, v.color, 0.3);
    FxEffects.fleck(refs.fxEl, target, v);
    await Fx.wait(240);
  }

  private static async playField(refs: BattleStageRefs, target: Point, v: MoveVisual) {
    const { fieldEl, fxEl, screenFxEl, targetEl } = refs;
    const rect = fieldEl.getBoundingClientRect();
    Fx.screenWash(screenFxEl, `${v.color}55`, 150, 460, v.dir === 1 ? '65%' : '35%');
    Fx.shakeField(fieldEl, 0.7 + v.power * 0.6);

    if (v.type === 'Ground' || v.type === 'Rock') {
      // Cracks radiate from under whoever is being hit, not always mid-field.
      const originX = Fx.clamp(target.x, rect.width * 0.22, rect.width * 0.78);
      for (let i = 0; i < 5; i++) {
        const w = 40 + i * 26;
        const crack = document.createElement('div');
        crack.style.cssText = `position:absolute;left:${originX - w / 2}px;top:${rect.height * 0.72}px;height:3px;width:2px;background:${v.color};border-radius:2px`;
        fxEl.appendChild(crack);
        Fx.anim(crack, [
          { width: '2px', opacity: 0.9 },
          { width: `${w}px`, opacity: 0.9, offset: 0.5 },
          { width: `${w}px`, opacity: 0 }
        ], { duration: 620, easing: 'ease-out' }).then(() => crack.remove());
      }
    } else {
      // Wave sweeps from the caster's side across to the target's side.
      const from = v.dir === 1 ? -80 : rect.width + 80;
      const to = v.dir === 1 ? rect.width + 80 : -80;
      const mid = v.dir === 1 ? rect.width * 0.35 : rect.width * 0.65;
      const wave = document.createElement('div');
      wave.style.cssText = `position:absolute;left:0;top:${rect.height * 0.45}px;width:60px;height:${rect.height * 0.5}px;background:linear-gradient(90deg,transparent,${v.color}cc,transparent);filter:blur(2px)`;
      fxEl.appendChild(wave);
      Fx.anim(wave, [
        { transform: `translateX(${from}px) scaleY(.6)`, opacity: 0 },
        { transform: `translateX(${mid}px) scaleY(1)`, opacity: 1, offset: 0.4 },
        { transform: `translateX(${to}px) scaleY(.7)`, opacity: 0 }
      ], { duration: 620, easing: 'ease-in-out' }).then(() => wave.remove());
    }
    await Fx.wait(360);
    await FxEffects.impact(refs, target, v, 0);
    FxEffects.fleck(fxEl, target, v);
    void targetEl;
  }

  private static async playSelfAura(refs: BattleStageRefs, launch: Point, v: MoveVisual) {
    const { launchEl, fxEl } = refs;
    const up = v.fleck !== 'statDown';
    const tint = v.heal ? FLECK_COLOR.statUp : up ? v.color : FLECK_COLOR.statDown;
    const original = launchEl.style.transform;
    Fx.anim(launchEl, [
      { transform: original },
      { transform: `${original} translateY(${up ? -10 : 6}px)`, offset: 0.5 },
      { transform: original }
    ], { duration: 700, easing: 'ease-in-out' });

    for (let i = 0; i < 2; i++) {
      const size = 64 + i * 22;
      const ring = document.createElement('div');
      ring.style.cssText = `position:absolute;left:${launch.x - size / 2}px;top:${launch.y - size / 2}px;width:${size}px;height:${size}px;border-radius:50%;border:2px solid ${tint}`;
      fxEl.appendChild(ring);
      Fx.anim(ring, [
        { transform: 'scale(.6)', opacity: 0 },
        { transform: `scale(1.25) rotate(${i ? -80 : 80}deg)`, opacity: 0.9, offset: 0.5 },
        { transform: 'scale(1.5)', opacity: 0 }
      ], { duration: 780, easing: 'ease-out' }).then(() => ring.remove());
    }
    for (let i = 0; i < 12; i++) {
      const mote = document.createElement('div');
      const s = 5 + Math.random() * 5;
      mote.style.cssText = `position:absolute;width:${s}px;height:${s}px;border-radius:50%;background:${tint};left:${launch.x + (Math.random() * 60 - 30)}px;top:${launch.y + 24}px`;
      fxEl.appendChild(mote);
      Fx.anim(mote, [
        { transform: 'translateY(0) scale(1)', opacity: 0.9 },
        { transform: `translateY(${up ? -60 : 40}px) scale(.2)`, opacity: 0 }
      ], { duration: 600 + Math.random() * 300, easing: 'ease-out', delay: Math.random() * 250 }).then(() => mote.remove());
    }
    Fx.flash(launchEl, tint, 0.4);
    await Fx.wait(780);
    launchEl.style.transform = original;
  }

  private static async playTargetAura(refs: BattleStageRefs, target: Point, v: MoveVisual) {
    const { fxEl, targetEl } = refs;
    const glyph = FxGlyphs.glyph(v, 30);
    Fx.place(glyph, { x: target.x, y: target.y - 70 });
    fxEl.appendChild(glyph);
    await Fx.anim(glyph, [
      { transform: 'translateY(-24px) scale(.6)', opacity: 0 },
      { transform: 'translateY(0) scale(1)', opacity: 1, offset: 0.6 },
      { transform: 'translateY(6px) scale(1.2)', opacity: 0 }
    ], { duration: 520, easing: 'ease-in' });
    glyph.remove();
    Fx.flash(targetEl, v.color, 0.35);
    Fx.shake(targetEl, 3);
    FxEffects.fleck(fxEl, target, v);
    await Fx.wait(260);
  }

  private static async playWeather(refs: BattleStageRefs, v: MoveVisual) {
    const { fieldEl, fxEl, screenFxEl } = refs;
    const rect = fieldEl.getBoundingClientRect();
    const color = WEATHER_COLOR[v.weather ?? 'sun'];
    screenFxEl.style.background = `linear-gradient(${v.weather === 'sun' ? '180deg' : '200deg'},${color}55,transparent 70%)`;
    screenFxEl.style.transition = 'opacity 300ms ease-out';
    screenFxEl.style.opacity = '1';

    const drops = v.weather === 'sun' ? 0 : 46;
    for (let i = 0; i < drops; i++) {
      const p = document.createElement('div');
      const rain = v.weather === 'rain';
      const s = rain ? 2 : v.weather === 'hail' ? 6 : 4;
      p.style.cssText = `position:absolute;width:${s}px;height:${rain ? 14 : s}px;border-radius:${rain ? '1px' : '50%'};background:${color};left:${Math.random() * rect.width}px;top:-20px;opacity:.8`;
      fxEl.appendChild(p);
      Fx.anim(p, [
        { transform: 'translateY(0)', opacity: 0.8 },
        { transform: `translate(${v.weather === 'sand' ? 40 : 12}px,${rect.height + 30}px)`, opacity: 0.1 }
      ], { duration: 700 + Math.random() * 500, easing: 'linear', delay: Math.random() * 500 }).then(() => p.remove());
    }
    if (v.weather === 'sun') {
      const glow = document.createElement('div');
      glow.style.cssText = `position:absolute;right:${rect.width * 0.12}px;top:${rect.height * 0.08}px;width:80px;height:80px;border-radius:50%;background:radial-gradient(circle,${color},transparent 70%)`;
      fxEl.appendChild(glow);
      Fx.anim(glow, [
        { transform: 'scale(.4)', opacity: 0 },
        { transform: 'scale(1.2)', opacity: 1, offset: 0.5 },
        { transform: 'scale(1)', opacity: 0.8 }
      ], { duration: 900, easing: 'ease-out' }).then(() => glow.remove());
    }
    await Fx.wait(900);
    screenFxEl.style.transition = 'opacity 500ms ease-in';
    screenFxEl.style.opacity = '0';
    await Fx.wait(300);
  }
}
