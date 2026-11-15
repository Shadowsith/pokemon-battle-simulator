import { BattleStageRefs, Point } from './animation.types';
import { Fx } from './fx';
import { FxGlyphs } from './fx-glyphs';

/** The look of one terrain (Electric / Grassy / Misty Terrain). */
export interface TerrainStyle {
  /** Colour of the sparkles round the user and over the ground. */
  spark: string;
  /** See-through scene tint while the terrain spreads. */
  tint: string;
  /** The fog bank's [top, ground] colours. */
  fog: [string, string];
  /** A particle that blows across the field (leaf, spark …), if any. */
  particle?: () => HTMLElement;
  /** Lightning flickers in the fog. */
  bolts?: boolean;
}

/** The terrain moves of Gen 6 share one animation, coloured per terrain (used by the Electric, Grass and Fairy groups). */
export class TerrainFx {
  static readonly ELECTRIC: TerrainStyle = {
    spark: '#FFE84A',
    tint: '#E8DC2Aa0',
    fog: ['#FFFBD000', '#FFF6A0'],
    particle: () => FxGlyphs.sparkStar(10 + Math.random() * 6, '#FFD84A'),
    bolts: true
  };

  static readonly GRASSY: TerrainStyle = {
    spark: '#7AF08A',
    tint: '#3AC05A90',
    fog: ['#D8FFE000', '#C8F8D0'],
    particle: () => FxGlyphs.leafGlyph(10 + Math.random() * 6)
  };

  static readonly MISTY: TerrainStyle = {
    spark: '#F0F4FF',
    tint: '#B8B0E890',
    fog: ['#FFE0EC00', '#FFD8E8']
  };

  /**
   * A terrain spreading over the field, after the XY animations: big
   * sparkles pop round the user (0-0.55 s), the scene takes on the terrain's
   * tint and small sparkles race over the ground from the user's feet to the
   * far side (0.4-1.3 s) while particles blow across (0.7-1.6 s), then a fog
   * bank rises over the ground, lightning flickering in it for Electric
   * Terrain, and fades (1.1-2.4 s).
   */
  static async play(refs: BattleStageRefs, launch: Point, style: TerrainStyle) {
    const { fieldEl, fxEl, launchEl } = refs;
    const W = fieldEl.clientWidth;
    const H = fieldEl.clientHeight;
    const lr = Fx.rect(launchEl);
    const foot = Fx.footOf(launchEl, fieldEl);
    const dir = launch.x < W / 2 ? 1 : -1;
    const effects: Promise<unknown>[] = [];

    // Big sparkles pop round the user.
    for (let i = 0; i < 5; i++) {
      const at: Point = { x: launch.x + (Math.random() * 2 - 1) * lr.width * 0.7, y: launch.y + (Math.random() * 2 - 1) * lr.height * 0.5 };
      effects.push(
        Fx.spawn(fxEl, FxGlyphs.sparkStar(26 + Math.random() * 14, style.spark), at, [
          { transform: 'scale(0) rotate(0deg)', opacity: 0 },
          { transform: 'scale(1.2) rotate(45deg)', opacity: 1, offset: 0.4 },
          { transform: 'scale(0) rotate(90deg)', opacity: 0 }
        ], { duration: 450, delay: i * 80, easing: 'ease-out' })
      );
    }
    await Fx.wait(400);

    // The scene takes on the tint; sparkles race over the ground.
    const tint = Fx.backdrop(fieldEl, `background:${style.tint}`);
    effects.push(
      Fx.anim(tint, [{ opacity: 0 }, { opacity: 1, offset: 0.2 }, { opacity: 1, offset: 0.7 }, { opacity: 0 }], { duration: 2000, easing: 'ease-in-out' }).then(() => tint.remove())
    );
    for (let i = 0; i < 28; i++) {
      const end: Point = { x: Math.random() * W, y: H * (0.5 + Math.random() * 0.45) };
      effects.push(
        Fx.spawn(fxEl, FxGlyphs.sparkStar(8 + Math.random() * 7, style.spark), foot, [
          { transform: 'translate(0,0) scale(.4)', opacity: 0 },
          { transform: `translate(${(end.x - foot.x) * 0.3}px,${(end.y - foot.y) * 0.3}px) scale(1)`, opacity: 1, offset: 0.25 },
          { transform: `translate(${end.x - foot.x}px,${end.y - foot.y}px) scale(.6)`, opacity: 0 }
        ], { duration: 700, delay: i * 18, easing: 'ease-out' })
      );
    }
    // Particles blow across the field.
    if (style.particle) {
      for (let i = 0; i < 18; i++) {
        const y = H * (0.35 + Math.random() * 0.6);
        const from: Point = { x: dir > 0 ? -20 : W + 20, y };
        const spin = (Math.random() < 0.5 ? -1 : 1) * (300 + Math.random() * 300);
        effects.push(
          Fx.spawn(fxEl, style.particle(), from, [
            { transform: 'translate(0,0) rotate(0deg)', opacity: 0 },
            { transform: `translate(${dir * W * 0.2}px,-10px) rotate(${spin * 0.2}deg)`, opacity: 1, offset: 0.15 },
            { transform: `translate(${dir * (W + 40)}px,${(Math.random() * 2 - 1) * 30}px) rotate(${spin}deg)`, opacity: 0.8 }
          ], { duration: 800, delay: 300 + i * 30, easing: 'linear' })
        );
      }
    }
    await Fx.wait(700);

    // A fog bank rises over the ground and fades.
    const fog = Fx.box(W, H * 0.6, `left:0;top:${H * 0.4}px;background:linear-gradient(180deg,${style.fog[0]},${style.fog[1]}cc 55%,${style.fog[1]})`);
    fxEl.appendChild(fog);
    effects.push(
      Fx.anim(fog, [
        { transform: `translateY(${H * 0.3}px)`, opacity: 0 },
        { transform: 'translateY(0)', opacity: 0.85, offset: 0.35 },
        { transform: 'translateY(0)', opacity: 0.85, offset: 0.7 },
        { transform: 'translateY(-10px)', opacity: 0 }
      ], { duration: 1300, easing: 'ease-out' }).then(() => fog.remove())
    );
    if (style.bolts) {
      for (let i = 0; i < 3; i++) effects.push(TerrainFx.bolt(fxEl, W, H, 300 + i * 220));
    }
    await Promise.all(effects);
  }

  /** One jagged lightning bolt flashing down into the fog after `delay` ms. */
  private static bolt(fxEl: HTMLElement, W: number, H: number, delay: number): Promise<void> {
    const x = W * (0.15 + Math.random() * 0.7);
    const bolt = FxGlyphs.lightning(W, H, { x, y: 0 }, { x: x + (Math.random() * 2 - 1) * 40, y: H * 0.6 }, 16);
    fxEl.appendChild(bolt);
    return Fx.anim(bolt, [{ opacity: 0 }, { opacity: 1, offset: 0.1 }, { opacity: 0.3, offset: 0.4 }, { opacity: 1, offset: 0.5 }, { opacity: 0 }], {
      duration: 260,
      delay,
      easing: 'linear'
    }).then(() => bolt.remove());
  }
}
