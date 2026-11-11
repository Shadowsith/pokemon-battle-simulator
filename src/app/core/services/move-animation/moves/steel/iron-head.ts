import { Point, BattleStageRefs, MoveVisual } from '../../animation.types';
import { Fx } from '../../fx';
import { FxGlyphs } from '../../fx-glyphs';
import { FxEffects } from '../../fx-effects';

/**
 * Iron Head, after the Gen 4 / Gen 5 animation:
 * - Gen 4: https://www.pokewiki.de/images/3/3e/Eisensch%C3%A4del_Gen4.png
 * - Gen 5: https://www.pokewiki.de/images/6/62/Eisensch%C3%A4del_Gen5.png
 *
 * The scene turns steel blue with speed lines rushing past (0-0.25 s) and the
 * user glints silver and rams forward (0.25-0.6 s). On impact (0.45 s) a
 * white-silver spiky burst with a red core flares on the target and grey
 * metal shards and dust fly off and fall away (to ~1.3 s); the scene clears
 * (to ~1.55 s).
 */
export class IronHead {
  static async play(refs: BattleStageRefs, launch: Point, target: Point, v: MoveVisual) {
    const { fieldEl, fxEl, launchEl, targetEl } = refs;
    const W = fieldEl.clientWidth;
    const H = fieldEl.clientHeight;
    const tr = Fx.rect(targetEl);

    const bg = Fx.backdrop(fieldEl, 'background:linear-gradient(180deg,#2A3448,#5A6C88 50%,#2A3448)');
    FxEffects.speedLines(bg, W, H, v.dir > 0 ? -1 : 1, ['#E4E8F0', '#A9B0BE']);
    await Fx.anim(bg, [{ opacity: 0 }, { opacity: 1 }], { duration: 250, easing: 'ease-out' });

    // The ram: a silver glint, then a hard lunge.
    Fx.flash(launchEl, '#E4E8F0', 0.8);
    const lunge = Fx.anim(launchEl, [
      { transform: 'translateX(0)' },
      { transform: `translateX(${v.dir * 60}px)`, offset: 0.55 },
      { transform: 'translateX(0)' }
    ], { duration: 350, easing: 'ease-in', fill: 'none' });
    await Fx.wait(200);

    // Impact: silver burst with a red core, flying shards and dust.
    const burst = FxGlyphs.spikyBurst(Math.max(tr.width * 0.9, 70), '#C8CEDA', '#FFFFFF', '#FF5A3A');
    Fx.place(burst, target);
    fxEl.appendChild(burst);
    Fx.flash(targetEl, '#ffffff', 0.8);
    Fx.shake(targetEl, 7);
    Fx.shakeField(fieldEl, 0.5);
    const effects: Promise<void>[] = [
      lunge,
      Fx.anim(burst, [
        { transform: 'scale(.3)', opacity: 1 },
        { transform: 'scale(1)', opacity: 1, offset: 0.3 },
        { transform: 'scale(1.15)', opacity: 0 }
      ], { duration: 450, easing: 'ease-out' }).then(() => burst.remove()),
      FxEffects.smokePuff(fxEl, target, Math.max(tr.width * 0.9, 64), ['#E4E8F0', '#A9B0BE'])
    ];
    for (let i = 0; i < 12; i++) {
      const s = 5 + Math.random() * 7;
      const shard = document.createElement('div');
      shard.style.cssText = `position:absolute;width:${s}px;height:${s * 0.8}px;pointer-events:none;clip-path:polygon(20% 0,100% 30%,80% 100%,0 70%);background:linear-gradient(135deg,#C8CEDA,#5A6070)`;
      Fx.place(shard, target);
      fxEl.appendChild(shard);
      const ang = -Math.PI / 2 + (Math.random() * 2 - 1) * Math.PI * 0.6;
      const d = Math.max(tr.width, 60) * (0.5 + Math.random() * 0.5);
      const x = Math.cos(ang) * d;
      const y = Math.sin(ang) * d;
      const spin = (Math.random() * 2 - 1) * 540;
      effects.push(
        Fx.anim(shard, [
          { transform: 'translate(0,0) rotate(0deg)', opacity: 1 },
          { transform: `translate(${x * 0.8}px,${y * 0.8}px) rotate(${spin * 0.6}deg)`, opacity: 1, offset: 0.5 },
          { transform: `translate(${x}px,${y + 50}px) rotate(${spin}deg)`, opacity: 0 }
        ], { duration: 750 + Math.random() * 150, delay: Math.random() * 80, easing: 'ease-out' }).then(() => shard.remove())
      );
    }
    await Promise.all(effects);

    await Fx.anim(bg, [{ opacity: 1 }, { opacity: 0 }], { duration: 250, easing: 'ease-in' });
    bg.remove();
  }
}
