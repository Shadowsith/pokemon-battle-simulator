import { Injectable, inject } from '@angular/core';
import { MOVE_LIBRARY, Move } from '../models/move.model';
import { MoveInfo, SpeciesInfo } from '../models/team.model';
import { germanSpeciesName } from '../models/species-names.de';
import { DamageCalcService } from './damage-calc.service';
import { DexDataService } from './dex-data.service';
import { SettingsService } from './settings.service';

/** One rolled NPC Pokémon: species identity plus a ready-to-use moveset. */
export interface NpcPokemon {
  dexId: number;
  name: string;
  /** Gen 5 type names, capitalised (e.g. "Fire"). */
  types: string[];
  moves: Move[];
}

const MOVES_PER_NPC = 5;
/** A damaging move only counts for the NPC if it hits at least this hard. */
const MIN_DAMAGING_BP = 70;
/** A species is skipped unless it can field this many strong attacks. */
const MIN_DAMAGING = 3;
const MAX_STATUS = 2;

/**
 * Strong moves the battle engine doesn't fully model (recharge turns, charge
 * turns, self-KO, Focus Punch's flinch window, Last Resort's condition). Kept
 * out of NPC sets so the AI never wastes a turn or blows itself up.
 */
const NPC_AVOID = new Set([
  'hyperbeam', 'gigaimpact', 'blastburn', 'hydrocannon', 'frenzyplant', 'rockwrecker', 'roaroftime',
  'razorwind', 'skullbash', 'skyattack', 'freezeshock', 'iceburn',
  'fly', 'dig', 'dive', 'bounce', 'solarbeam', 'shadowforce',
  'selfdestruct', 'explosion', 'focuspunch', 'lastresort'
]);

/**
 * Status moves worth handing an NPC, best-first (setup, then recovery, then
 * status infliction). Restricted to effects the battle engine actually models -
 * stat stages, direct healing, and major-status / confusion infliction - so the
 * NPC never spends a turn on a move that does nothing. An entry is only used if
 * the species can learn it and it exists in MOVE_LIBRARY.
 */
const STATUS_PICKS = [
  // setup (stat stages)
  'shellsmash', 'quiverdance', 'dragondance', 'swordsdance', 'nastyplot', 'calmmind',
  'bulkup', 'coil', 'workup', 'growth', 'agility', 'rockpolish', 'honeclaws',
  'irondefense', 'amnesia', 'cosmicpower', 'meditate', 'sharpen',
  // recovery (handled by DamageCalcService.calculateRecovery)
  'roost', 'recover', 'softboiled', 'milkdrink', 'slackoff', 'healorder',
  'moonlight', 'morningsun', 'synthesis', 'rest',
  // major status / confusion infliction (handled by StatusService.rollInfliction)
  'spore', 'sleeppowder', 'lovelykiss', 'hypnosis', 'sing',
  'willowisp', 'thunderwave', 'toxic', 'glare', 'stunspore', 'poisonpowder', 'confuseray'
];

/**
 * Rolls a random NPC team: `size` distinct fully-evolved species, each with a
 * five-move set that leans on strong attacks (>= 70 BP), keeps at most two
 * status moves, and never ends up status-only.
 */
@Injectable({ providedIn: 'root' })
export class NpcTeamService {
  private readonly dex = inject(DexDataService);
  private readonly damageCalc = inject(DamageCalcService);
  private readonly settings = inject(SettingsService);
  private readonly moveById = new Map(MOVE_LIBRARY.map((m) => [m.showdownId, m] as const));

  async generate(size: number): Promise<NpcPokemon[]> {
    const [species, moveInfo] = await Promise.all([this.dex.species(), this.dex.moves()]);

    const allowLegendaries = this.settings.allowLegendaries();
    const pool = shuffle(
      species.filter((s) => s.fullyEvolved && (allowLegendaries || !s.legendary))
    );
    if (!pool.length) return [];

    const team: NpcPokemon[] = [];
    for (const s of pool) {
      if (team.length >= size) break;
      const legal = await this.dex.legalMoves(s.id);
      const moves = this.buildMoveset(s, legal, moveInfo);
      if (moves) {
        team.push({ dexId: s.num, name: germanSpeciesName(s.num, s.name), types: s.types, moves });
      }
    }
    return team;
  }

  /** A five-move set, or null when the species can't back three real attacks. */
  private buildMoveset(
    species: SpeciesInfo,
    legal: string[],
    info: Record<string, MoveInfo>
  ): Move[] | null {
    const ownTypes = species.types.map((t) => t.toLowerCase());
    const known = legal.filter((id) => this.moveById.has(id) && info[id]);

    // Nudge the set toward the species' better offensive stat: a special
    // attacker's physical moves score lower, and vice-versa.
    const stats = this.damageCalc.statLine(species.num);
    const physFit = stats ? stats.atk / Math.max(stats.atk, stats.spa) : 1;
    const specFit = stats ? stats.spa / Math.max(stats.atk, stats.spa) : 1;

    const damaging = known
      .filter(
        (id) =>
          info[id].category !== 'status' && info[id].bp >= MIN_DAMAGING_BP && !NPC_AVOID.has(id)
      )
      .map((id) => {
        const stab = ownTypes.includes(info[id].type.toLowerCase()) ? 1.5 : 1;
        const fit = info[id].category === 'phys' ? physFit : specFit;
        const acc = this.damageCalc.accuracy(this.moveById.get(id) as Move);
        return { id, type: info[id].type, score: info[id].bp * stab * fit * acc };
      })
      .sort((a, b) => b.score - a.score);

    if (damaging.length < MIN_DAMAGING) return null;

    const status = STATUS_PICKS.filter(
      (id) => known.includes(id) && info[id].category === 'status'
    );

    // Aim for a mostly-attacking set: usually 0-1 status moves, sometimes 2,
    // never more - and enough to fill five slots if the species is short on
    // strong attacks.
    const want = [0, 1, 1, 2][Math.floor(Math.random() * 4)];
    const minStatus = MOVES_PER_NPC - Math.min(damaging.length, MOVES_PER_NPC);
    const statusCount = Math.min(MAX_STATUS, status.length, Math.max(minStatus, want));
    const attackCount = MOVES_PER_NPC - statusCount;

    const picks = [...this.spreadByType(damaging, attackCount), ...status.slice(0, statusCount)];
    return picks.map((id) => this.moveById.get(id) as Move);
  }

  /**
   * Picks `n` attacks strongest-first, but skips a move whose type is already
   * covered until every remaining slot has to be filled - so the set gets
   * coverage instead of four near-identical moves.
   */
  private spreadByType(ranked: { id: string; type: string }[], n: number): string[] {
    const out: string[] = [];
    const seen = new Set<string>();
    for (const m of ranked) {
      if (out.length >= n) break;
      if (seen.has(m.type)) continue;
      out.push(m.id);
      seen.add(m.type);
    }
    for (const m of ranked) {
      if (out.length >= n) break;
      if (!out.includes(m.id)) out.push(m.id);
    }
    return out;
  }
}

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
