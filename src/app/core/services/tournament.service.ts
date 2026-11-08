import { Injectable, computed, inject, signal } from '@angular/core';
import { TournamentBracket } from '../battle/tournament-bracket';
import { rulesToNpcOptions, sanitizeRules } from '../models/custom-battle.model';
import { knownItemId } from '../models/item.model';
import { trainerLabel } from '../models/trainer.model';
import {
  PLAYER_ENTRANT_ID,
  Tournament,
  TournamentConfig,
  TournamentEntrant,
  TournamentMon,
  clampTournamentConfig,
  isTournamentSize
} from '../models/tournament.model';
import { DamageCalcService } from './damage-calc.service';
import { NpcPokemon, NpcTeamService } from './npc-team.service';
import { SettingsService } from './settings.service';
import { TrainerRosterService } from './trainer-roster.service';

const STORE_KEY = 'pbs.tournament';

/** The fight handed to the battle screen. */
export interface TournamentFight {
  opponent: TournamentEntrant;
  config: TournamentConfig;
}

/**
 * The knockout tournament: the player plus rolled NPC trainers in a bracket.
 * The player fights their matches on the battle screen (full heal every round);
 * NPC-vs-NPC matches get an instant result weighted by team strength.
 * Persisted to localStorage so a reload resumes.
 */
@Injectable({ providedIn: 'root' })
export class TournamentService {
  private readonly npcTeam = inject(NpcTeamService);
  private readonly roster = inject(TrainerRosterService);
  private readonly settings = inject(SettingsService);
  private readonly damageCalc = inject(DamageCalcService);

  /** Page that shows the tournament (the battle screen returns here). */
  readonly route = '/tournament';

  private readonly _tournament = signal<Tournament | null>(this.load());
  readonly tournament = this._tournament.asReadonly();

  /** The bracket of the current tournament (rebuilt on every change). */
  readonly bracket = computed(() => {
    const t = this._tournament();
    return t ? TournamentBracket.from(t.rounds, new Set(t.entrants.map((e) => e.id))) : null;
  });

  /** The player's next match, or null when the tournament is over / idle. */
  readonly nextMatch = computed(() => {
    const t = this._tournament();
    return t?.status === 'active' ? (this.bracket()?.openMatch(PLAYER_ENTRANT_ID) ?? null) : null;
  });

  /** The entrant the player meets next. */
  readonly currentOpponent = computed(() => {
    const m = this.nextMatch()?.match;
    if (!m) return null;
    return this.entrant(m.a === PLAYER_ENTRANT_ID ? m.b : m.a);
  });

  readonly champion = computed(() => this.entrant(this.bracket()?.champion() ?? null));

  /** The fight waiting to start; consumed once by the battle screen. */
  private pending: TournamentFight | null = null;

  entrant(id: string | null): TournamentEntrant | null {
    if (!id) return null;
    return this._tournament()?.entrants.find((e) => e.id === id) ?? null;
  }

  // --- lifecycle ------------------------------------------------------

  /** Rolls the NPC field and starts a fresh tournament. */
  async create(config: TournamentConfig): Promise<void> {
    const cfg = clampTournamentConfig(config);
    const npcCount = cfg.size - 1;
    const playerAvatar = this.settings.trainerAvatar();
    const [sprites, teams] = await Promise.all([
      this.pickSprites(npcCount, playerAvatar),
      Promise.all(Array.from({ length: npcCount }, () => this.rollTeam(cfg)))
    ]);

    const usedNames = new Map<string, number>();
    const npcs: TournamentEntrant[] = teams.map((team, i) => {
      const trainerId = sprites[i];
      const base = trainerLabel(trainerId);
      const seen = (usedNames.get(base) ?? 0) + 1;
      usedNames.set(base, seen);
      return {
        id: `npc${i}`,
        name: seen > 1 ? `${base} ${seen}` : base,
        trainerId,
        isPlayer: false,
        team,
        strength: this.teamStrength(team)
      };
    });
    const player: TournamentEntrant = {
      id: PLAYER_ENTRANT_ID,
      name: 'Du',
      trainerId: playerAvatar,
      isPlayer: true,
      team: [],
      strength: 0
    };
    const entrants = [player, ...npcs];
    const bracket = TournamentBracket.create(entrants.map((e) => e.id));
    this.set({ config: cfg, entrants, rounds: bracket.toJSON(), status: 'active', lostTo: null });
  }

  setPending(): void {
    const t = this._tournament();
    const opponent = this.currentOpponent();
    this.pending = t && opponent ? { opponent, config: t.config } : null;
  }

  takePending(): TournamentFight | null {
    const p = this.pending;
    this.pending = null;
    return p;
  }

  /**
   * Reports the player's fight. The other matches of that round are decided
   * instantly; after a loss the whole rest of the bracket is, so a champion
   * is always shown.
   */
  recordOutcome(won: boolean): void {
    const t = this._tournament();
    const bracket = this.bracket();
    const ref = this.nextMatch();
    if (!t || !bracket || !ref) return;
    const opponentId = ref.match.a === PLAYER_ENTRANT_ID ? ref.match.b! : ref.match.a!;
    const strength = (id: string) => this.entrant(id)?.strength ?? 0;

    bracket.record(ref.round, ref.index, won ? PLAYER_ENTRANT_ID : opponentId);
    if (won) {
      bracket.resolveRound(ref.round, strength, Math.random, PLAYER_ENTRANT_ID);
    } else {
      bracket.resolveAll(strength);
    }
    const status = !won ? 'lost' : bracket.champion() === PLAYER_ENTRANT_ID ? 'won' : 'active';
    this.set({
      ...t,
      rounds: bracket.toJSON(),
      status,
      lostTo: won ? null : (this.entrant(opponentId)?.name ?? null)
    });
  }

  reset(): void {
    this.pending = null;
    this.set(null);
  }

  // --- rolling --------------------------------------------------------

  /** `count` distinct trainer sprites other than the player's. */
  private async pickSprites(count: number, exclude: string): Promise<string[]> {
    const pool = (await this.roster.all()).filter((id) => id !== exclude);
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    // Tiny pools (missing manifest) repeat sprites rather than leave gaps.
    return Array.from({ length: count }, (_, i) => pool[i % Math.max(1, pool.length)] ?? exclude);
  }

  /** One NPC party; drops the type rules if they yield nothing (rare mono types). */
  private async rollTeam(cfg: TournamentConfig): Promise<TournamentMon[]> {
    const roll = async (constrained: boolean): Promise<NpcPokemon[]> => {
      try {
        return await this.npcTeam.generate(cfg.opponentCount, constrained ? rulesToNpcOptions(cfg) : {});
      } catch {
        return [];
      }
    };
    let rolled = await roll(true);
    if (rolled.length < (cfg.format === 'doubles' ? 2 : 1)) rolled = await roll(false);
    return rolled.map((p) => ({
      speciesNum: p.dexId,
      name: p.name,
      types: p.types,
      moves: p.moves.map((m) => m.showdownId),
      item: p.item
    }));
  }

  /** Sum of the party's level-100 stat lines. */
  private teamStrength(team: TournamentMon[]): number {
    return team.reduce((sum, mon) => {
      const s = this.damageCalc.statLine(mon.speciesNum);
      return sum + (s ? s.hp + s.atk + s.def + s.spa + s.spd + s.spe : 0);
    }, 0);
  }

  // --- persistence ----------------------------------------------------

  private set(t: Tournament | null): void {
    this._tournament.set(t);
    try {
      if (t) localStorage.setItem(STORE_KEY, JSON.stringify(t));
      else localStorage.removeItem(STORE_KEY);
    } catch {
      /* storage unavailable - keep the tournament in memory for this session */
    }
  }

  private load(): Tournament | null {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      return raw ? sanitizeTournament(JSON.parse(raw)) : null;
    } catch {
      return null;
    }
  }
}

/** Reads a stored tournament; null if anything structural is broken. */
export function sanitizeTournament(v: unknown): Tournament | null {
  if (!v || typeof v !== 'object') return null;
  const t = v as Record<string, unknown>;
  const c = (t['config'] ?? {}) as Record<string, unknown>;
  if (!isTournamentSize(c['size'])) return null;
  const config: TournamentConfig = clampTournamentConfig({ ...sanitizeRules(c), size: c['size'] });

  if (!Array.isArray(t['entrants'])) return null;
  const entrants = (t['entrants'] as unknown[]).map(sanitizeEntrant);
  if (entrants.length !== config.size || entrants.some((e) => e === null)) return null;
  const list = entrants as TournamentEntrant[];
  const ids = new Set(list.map((e) => e.id));
  if (ids.size !== list.length || !ids.has(PLAYER_ENTRANT_ID)) return null;

  const bracket = TournamentBracket.from(t['rounds'], ids);
  if (!bracket || 2 ** bracket.roundCount !== config.size) return null;
  const status = t['status'];
  if (status !== 'active' && status !== 'won' && status !== 'lost') return null;
  return {
    config,
    entrants: list,
    rounds: bracket.toJSON(),
    status,
    lostTo: typeof t['lostTo'] === 'string' ? t['lostTo'] : null
  };
}

function sanitizeEntrant(v: unknown): TournamentEntrant | null {
  if (!v || typeof v !== 'object') return null;
  const e = v as Record<string, unknown>;
  if (typeof e['id'] !== 'string' || typeof e['name'] !== 'string' || typeof e['trainerId'] !== 'string') {
    return null;
  }
  const team = Array.isArray(e['team']) ? (e['team'] as unknown[]).map(sanitizeMon) : [];
  if (team.some((m) => m === null)) return null;
  const isPlayer = e['id'] === PLAYER_ENTRANT_ID;
  if (!isPlayer && !team.length) return null;
  return {
    id: e['id'],
    name: e['name'],
    trainerId: e['trainerId'],
    isPlayer,
    team: team as TournamentMon[],
    strength: typeof e['strength'] === 'number' ? e['strength'] : 0
  };
}

function sanitizeMon(v: unknown): TournamentMon | null {
  if (!v || typeof v !== 'object') return null;
  const m = v as Record<string, unknown>;
  if (typeof m['speciesNum'] !== 'number' || typeof m['name'] !== 'string') return null;
  const strings = (x: unknown) => (Array.isArray(x) ? x.filter((s): s is string => typeof s === 'string') : []);
  return {
    speciesNum: m['speciesNum'],
    name: m['name'],
    types: strings(m['types']),
    moves: strings(m['moves']),
    item: knownItemId(m['item'])
  };
}
