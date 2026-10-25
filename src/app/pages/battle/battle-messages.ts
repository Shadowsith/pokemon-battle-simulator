import { Move } from '../../core/models/move.model';
import { STAT_META } from '../../core/models/pokemon.model';
import { StatChange } from '../../core/services/stat-change.service';

const CHARGE_MESSAGES: Record<string, (name: string) => string> = {
  fly: (n) => `${n} flog empor!`,
  bounce: (n) => `${n} sprang hoch!`,
  dig: (n) => `${n} grub sich ein!`,
  dive: (n) => `${n} tauchte unter!`,
  skydrop: (n) => `${n} stieg mit dem Gegner auf!`,
  shadowforce: (n) => `${n} verschwand!`,
  phantomforce: (n) => `${n} verschwand!`,
  solarbeam: (n) => `${n} sammelt Energie!`,
  skyattack: (n) => `${n} hüllt sich in gleißendes Licht!`,
  skullbash: (n) => `${n} senkt den Kopf!`,
  razorwind: (n) => `${n} wirbelt einen Sturm auf!`,
  freezeshock: (n) => `${n} lädt sich mit eisiger Energie auf!`,
  iceburn: (n) => `${n} umgibt sich mit einer Kältewelle!`
};

/** Log line for turn 1 of a two-turn move. */
export function chargeMessage(name: string, move: Move): string {
  return CHARGE_MESSAGES[move.showdownId]?.(name) ?? `${name} lädt ${move.name} auf!`;
}

/** Log line for one stat-stage change ("Glurak's Angriff steigt stark!"). */
export function statChangeMessage(name: string, ch: StatChange): string {
  const stat = STAT_META[ch.stat].label;
  if (ch.capped) {
    return ch.delta > 0
      ? `${name}s ${stat} kann nicht weiter erhöht werden!`
      : `${name}s ${stat} kann nicht weiter gesenkt werden!`;
  }
  const mag = Math.abs(ch.delta);
  const strength = mag >= 3 ? ' extrem' : mag === 2 ? ' stark' : '';
  return `${name}s ${stat} ${ch.delta > 0 ? 'steigt' : 'sinkt'}${strength}!`;
}
