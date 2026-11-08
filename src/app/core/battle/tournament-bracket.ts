/** One knockout match. `a` / `b` stay null until the feeding matches are decided. */
export interface TournamentMatch {
  a: string | null;
  b: string | null;
  winner: string | null;
}

/** Where a match sits in the bracket. */
export interface MatchRef {
  round: number;
  index: number;
  match: TournamentMatch;
}

export type Rng = () => number;

/**
 * How strongly team strength decides an instant NPC-vs-NPC result:
 * P(A wins) = sA^k / (sA^k + sB^k). Higher = fewer upsets.
 */
const STRENGTH_EXPONENT = 4;

/**
 * A single-elimination bracket over entrant ids (pure, Angular-free). Round 0
 * holds size/2 matches, every later round half as many; the winner of match i
 * moves into slot `a` (even i) or `b` (odd i) of match i/2 in the next round.
 */
export class TournamentBracket {
  private constructor(private readonly _rounds: TournamentMatch[][]) {}

  /** Shuffled bracket; `ids.length` must be a power of two (>= 2). */
  static create(ids: readonly string[], rng: Rng = Math.random): TournamentBracket {
    const n = ids.length;
    if (n < 2 || (n & (n - 1)) !== 0) throw new Error(`bracket size must be a power of two, got ${n}`);
    const order = [...ids];
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }
    const rounds: TournamentMatch[][] = [];
    for (let size = n / 2; size >= 1; size /= 2) {
      rounds.push(Array.from({ length: size }, () => ({ a: null, b: null, winner: null })));
    }
    rounds[0].forEach((m, i) => {
      m.a = order[2 * i];
      m.b = order[2 * i + 1];
    });
    return new TournamentBracket(rounds);
  }

  /**
   * Rebuilds a bracket from stored data. Returns null unless the shape is a
   * valid bracket whose ids are all in `ids`.
   */
  static from(raw: unknown, ids: ReadonlySet<string>): TournamentBracket | null {
    if (!Array.isArray(raw) || !raw.length) return null;
    const okId = (v: unknown): v is string | null => v === null || (typeof v === 'string' && ids.has(v));
    const rounds: TournamentMatch[][] = [];
    let expected = 2 ** (raw.length - 1);
    for (const round of raw) {
      if (!Array.isArray(round) || round.length !== expected) return null;
      const matches: TournamentMatch[] = [];
      for (const m of round as unknown[]) {
        const o = (m ?? {}) as Record<string, unknown>;
        const a = o['a'] ?? null;
        const b = o['b'] ?? null;
        const winner = o['winner'] ?? null;
        if (!okId(a) || !okId(b) || !okId(winner)) return null;
        if (winner !== null && winner !== a && winner !== b) return null;
        matches.push({ a, b, winner });
      }
      rounds.push(matches);
      expected /= 2;
    }
    return new TournamentBracket(rounds);
  }

  get rounds(): readonly (readonly Readonly<TournamentMatch>[])[] {
    return this._rounds;
  }

  get roundCount(): number {
    return this._rounds.length;
  }

  /** Plain JSON copy for persistence. */
  toJSON(): TournamentMatch[][] {
    return this._rounds.map((r) => r.map((m) => ({ ...m })));
  }

  /** The undecided match `id` is set to play in, or null (out, waiting or champion). */
  openMatch(id: string): MatchRef | null {
    for (let round = 0; round < this._rounds.length; round++) {
      const index = this._rounds[round].findIndex(
        (m) => m.winner === null && m.a !== null && m.b !== null && (m.a === id || m.b === id)
      );
      if (index >= 0) return { round, index, match: this._rounds[round][index] };
    }
    return null;
  }

  /** Decides a match and moves the winner into the next round. */
  record(round: number, index: number, winnerId: string): void {
    const m = this._rounds[round]?.[index];
    if (!m || m.winner !== null || (winnerId !== m.a && winnerId !== m.b)) return;
    m.winner = winnerId;
    const next = this._rounds[round + 1]?.[Math.floor(index / 2)];
    if (!next) return;
    if (index % 2 === 0) next.a = winnerId;
    else next.b = winnerId;
  }

  /**
   * Gives every open match of `round` an instant result, weighted by team
   * strength. Matches involving `except` (the player) are left alone.
   */
  resolveRound(round: number, strength: (id: string) => number, rng: Rng = Math.random, except?: string): void {
    this._rounds[round]?.forEach((m, index) => {
      if (m.winner !== null || m.a === null || m.b === null || m.a === except || m.b === except) return;
      const sa = Math.max(1, strength(m.a)) ** STRENGTH_EXPONENT;
      const sb = Math.max(1, strength(m.b)) ** STRENGTH_EXPONENT;
      this.record(round, index, rng() < sa / (sa + sb) ? m.a : m.b);
    });
  }

  /** Resolves every remaining match, round by round (after the player is out). */
  resolveAll(strength: (id: string) => number, rng: Rng = Math.random): void {
    for (let round = 0; round < this._rounds.length; round++) this.resolveRound(round, strength, rng);
  }

  /** The tournament winner once the final is decided, else null. */
  champion(): string | null {
    return this._rounds[this._rounds.length - 1][0].winner;
  }

  isFinished(): boolean {
    return this.champion() !== null;
  }
}
