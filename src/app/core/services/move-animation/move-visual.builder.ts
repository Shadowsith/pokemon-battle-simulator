import { Dex } from '@pkmn/sim';
import { Move } from '../../models/move.model';
import { MoveVisual, Fleck, Weather, Delivery, MeleeStyle } from './animation.types';
import { Fx } from './fx';

/** Derives a {@link MoveVisual} - everything the renderer needs to draw one move - from its @pkmn/sim data. */
export class MoveVisualBuilder {
  static build(move: Move): MoveVisual {
    const d = Dex.moves.get(move.showdownId);
    const flags = (d?.flags ?? {}) as Record<string, unknown>;
    const name = move.name + ' ' + move.showdownId;
    const bp = d?.basePower ?? 0;
    const isStatus = d?.category === 'Status';
    const isPhysical = d?.category === 'Physical';
    const targetsSelf = d?.target === 'self' || d?.target === 'allySide';
    const selfBoost = MoveVisualBuilder.boostSign(d?.boosts) || MoveVisualBuilder.boostSign(d?.self?.boosts);
    const spread = d?.target === 'allAdjacent' || d?.target === 'allAdjacentFoes';
    const heal = Boolean(flags['heal'] || d?.heal) && isStatus;

    let delivery: Delivery;
    if (d?.weather) delivery = 'weather';
    else if (targetsSelf || (isStatus && (heal || selfBoost !== 0))) delivery = 'selfAura';
    else if (isStatus) delivery = flags['powder'] ? 'powder' : 'targetAura';
    else if (flags['sound']) delivery = 'sonic';
    else if (flags['pulse']) delivery = 'pulse';
    else if (flags['charge'] || /\bbeam\b|cannon/i.test(name)) delivery = 'beam';
    else if (flags['bullet'] || flags['bomb'] || /\b(ball|seed|bomb|shot|missile)\b/i.test(name))
      delivery = 'lob';
    else if (spread) delivery = 'field';
    else if (flags['contact'] && isPhysical) delivery = 'melee';
    else delivery = 'projectile';

    return {
      delivery,
      meleeStyle: MoveVisualBuilder.meleeStyle(flags, name),
      type: move.type,
      dir: 1, // set from real sprite positions in playMove()
      color: move.color,
      power: bp ? Fx.clamp(bp / 150, 0.14, 1) : 0,
      hits: MoveVisualBuilder.multiHitCount(d?.multihit),
      quick: (d?.priority ?? 0) > 0,
      charge: Boolean(flags['charge']),
      drain: Boolean(d?.drain),
      recoil: Boolean(d?.recoil || d?.hasCrashDamage),
      heal,
      spread,
      fleck: MoveVisualBuilder.deriveFleck(d, selfBoost, delivery),
      weather: MoveVisualBuilder.mapWeather(d?.weather)
    };
  }

  private static multiHitCount(multihit: unknown): number {
    if (typeof multihit === 'number') return Fx.clamp(multihit, 1, 5);
    if (Array.isArray(multihit)) {
      const [min, max] = multihit as number[];
      return Fx.clamp(min === max ? min : 3, 1, 5);
    }
    return 1;
  }

  private static meleeStyle(flags: Record<string, unknown>, name: string): MeleeStyle {
    if (flags['punch']) return 'punch';
    if (flags['bite']) return 'bite';
    if (/\b(kick|stomp|jump)\b/i.test(name)) return 'kick';
    if (/\b(slash|cut|claw|blade|scratch|wing|sword)\b/i.test(name)) return 'slash';
    return 'hit';
  }

  private static boostSign(boosts: unknown): number {
    if (!boosts || typeof boosts !== 'object') return 0;
    const vals = Object.values(boosts as Record<string, number>);
    if (!vals.length) return 0;
    return vals.reduce((a, b) => a + b, 0) >= 0 ? 1 : -1;
  }

  private static deriveFleck(
    d: ReturnType<typeof Dex.moves.get> | undefined,
    selfBoost: number,
    delivery: Delivery
  ): Fleck {
    const statusMap: Record<string, Fleck> = {
      brn: 'burn',
      frz: 'freeze',
      par: 'paralyze',
      psn: 'poison',
      tox: 'poison',
      slp: 'sleep'
    };
    if (d?.status && statusMap[d.status]) return statusMap[d.status];
    if (d?.volatileStatus === 'confusion') return 'confusion';
    const sec = d?.secondary ?? (Array.isArray(d?.secondaries) ? d?.secondaries[0] : undefined);
    if (sec?.status && statusMap[sec.status]) return statusMap[sec.status];
    if (sec?.volatileStatus === 'flinch') return 'flinch';
    if (sec?.volatileStatus === 'confusion') return 'confusion';
    if (sec?.boosts) return 'statDown';
    if (delivery === 'selfAura' && selfBoost !== 0) return selfBoost > 0 ? 'statUp' : 'statDown';
    if ((delivery === 'targetAura' || delivery === 'powder') && MoveVisualBuilder.boostSign(d?.boosts) < 0) return 'statDown';
    return null;
  }

  private static mapWeather(weather: string | undefined): Weather {
    switch (weather) {
      case 'sunnyday':
        return 'sun';
      case 'raindance':
        return 'rain';
      case 'sandstorm':
        return 'sand';
      case 'hail':
        return 'hail';
      default:
        return null;
    }
  }
}
