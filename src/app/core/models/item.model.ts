import { ITEM_TABLE } from './item-table';

/**
 * Held items the battle engine models (a curated competitive set). The data
 * lives in the generated {@link ITEM_TABLE} (scripts/build-item-table.mjs);
 * what each effect does in battle is in core/battle/item-effects.ts.
 */

export type ItemCategory = 'booster' | 'gem' | 'berry' | 'battle';

export type StatusCure = 'par' | 'slp' | 'psn' | 'tox' | 'brn' | 'frz' | 'confusion';

/** Item behaviours that are not a type booster / gem / berry. */
export type BattleItemId =
  | 'leftovers'
  | 'blacksludge'
  | 'lifeorb'
  | 'choiceband'
  | 'choicespecs'
  | 'choicescarf'
  | 'focussash'
  | 'expertbelt'
  | 'muscleband'
  | 'wiseglasses'
  | 'eviolite'
  | 'assaultvest'
  | 'rockyhelmet'
  | 'airballoon'
  | 'brightpowder'
  | 'widelens'
  | 'powerherb'
  | 'whiteherb'
  | 'shellbell';

export type ItemEffect =
  /** ×mult power for moves of `type` (Magnet, Mystic Water …). */
  | { kind: 'typeBoost'; type: string; mult: number }
  /** ×1.3 power for the first damaging move of `type`, then used up. */
  | { kind: 'gem'; type: string }
  /** Halves one super-effective hit of `type` (Normal: any hit), then eaten. */
  | { kind: 'resistBerry'; type: string }
  /** At ≤ threshold HP: heal a fraction of max HP or a flat amount, then eaten. */
  | { kind: 'healBerry'; threshold: number; fraction?: number; flat?: number }
  /** Cures the listed conditions as soon as they're inflicted, then eaten. */
  | { kind: 'cureBerry'; cures: StatusCure[] }
  /** At ≤ 25 % HP: raise a stat (or a random one), then eaten. */
  | { kind: 'pinchBerry'; stat: 'atk' | 'def' | 'spa' | 'spd' | 'spe' | 'random'; stages: number }
  /** Hit by a move of this category: the attacker loses ⅛ of its max HP, then eaten. */
  | { kind: 'retaliateBerry'; category: 'Physical' | 'Special' }
  | { kind: 'battle'; id: BattleItemId };

export interface HeldItem {
  /** @pkmn/sim item id ("magnet"). */
  id: string;
  /** German name ("Magnet", "Zauberwasser"). */
  name: string;
  category: ItemCategory;
  /** Position in Showdown's item icon sheet. */
  spritenum: number;
  /** One-line German description for the picker. */
  desc: string;
  effect: ItemEffect;
}

export const ITEMS: readonly HeldItem[] = ITEM_TABLE;

const BY_ID = new Map(ITEM_TABLE.map((i) => [i.id, i]));

export function heldItem(id: string | null | undefined): HeldItem | undefined {
  return id ? BY_ID.get(id) : undefined;
}

/** Keep only ids of items the engine models (sanitizers use this). */
export function knownItemId(id: unknown): string | null {
  return typeof id === 'string' && BY_ID.has(id) ? id : null;
}

/** Picker tabs, in display order. */
export const ITEM_CATEGORIES: { id: ItemCategory; label: string }[] = [
  { id: 'booster', label: 'Typ-Booster' },
  { id: 'gem', label: 'Juwelen' },
  { id: 'berry', label: 'Beeren' },
  { id: 'battle', label: 'Kampf-Items' }
];

/** Showdown item icon sheet: 24 × 24 px icons, 16 per row. */
export const ITEM_ICON_SHEET = 'assets/sprites/itemicons-sheet.png';

/** CSS for one item icon cut out of {@link ITEM_ICON_SHEET}. */
export function itemIconStyle(item: HeldItem | undefined): Record<string, string> {
  if (!item) return {};
  const n = item.spritenum;
  return {
    'background-image': `url(${ITEM_ICON_SHEET})`,
    'background-position': `-${(n % 16) * 24}px -${Math.floor(n / 16) * 24}px`
  };
}
