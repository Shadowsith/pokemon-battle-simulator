import { TournamentBracket } from './tournament-bracket';

/** Deterministic rng (mulberry32). */
function seeded(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const ids = (n: number) => Array.from({ length: n }, (_, i) => `e${i}`);

describe('TournamentBracket', () => {
  it('builds 2/3/4 rounds for 4/8/16 entrants with every id placed once', () => {
    for (const [n, rounds] of [[4, 2], [8, 3], [16, 4]]) {
      const b = TournamentBracket.create(ids(n), seeded(1));
      expect(b.roundCount).toBe(rounds);
      const placed = b.rounds[0].flatMap((m) => [m.a, m.b]);
      expect(new Set(placed).size).toBe(n);
      expect(b.rounds[rounds - 1].length).toBe(1);
    }
  });

  it('rejects sizes that are not a power of two', () => {
    expect(() => TournamentBracket.create(ids(6))).toThrow();
  });

  it('moves a recorded winner into the next round', () => {
    const b = TournamentBracket.create(ids(4), seeded(2));
    const m0 = b.rounds[0][0];
    const m1 = b.rounds[0][1];
    b.record(0, 0, m0.a!);
    b.record(0, 1, m1.b!);
    expect(b.rounds[1][0].a).toBe(m0.a);
    expect(b.rounds[1][0].b).toBe(m1.b);
    expect(b.isFinished()).toBe(false);
    b.record(1, 0, m0.a!);
    expect(b.champion()).toBe(m0.a);
  });

  it('ignores a winner who is not in the match', () => {
    const b = TournamentBracket.create(ids(4), seeded(3));
    b.record(0, 0, 'nobody');
    expect(b.rounds[0][0].winner).toBeNull();
  });

  it('never resolves the excepted entrant\'s match', () => {
    const b = TournamentBracket.create(ids(8), seeded(4));
    b.resolveRound(0, () => 500, seeded(5), 'e0');
    const mine = b.openMatch('e0');
    expect(mine?.round).toBe(0);
    expect(b.rounds[0].filter((m) => m.winner !== null).length).toBe(3);
  });

  it('gives repeatable results for the same seed', () => {
    const run = () => {
      const b = TournamentBracket.create(ids(16), seeded(6));
      b.resolveAll((id) => 400 + Number(id.slice(1)) * 10, seeded(7));
      return b.champion();
    };
    expect(run()).toBe(run());
  });

  it('lets the stronger team win most instant matches', () => {
    const rng = seeded(8);
    let strongWins = 0;
    for (let i = 0; i < 1000; i++) {
      const b = TournamentBracket.create(['strong', 'weak'], rng);
      b.resolveRound(0, (id) => (id === 'strong' ? 3000 : 2400), rng);
      if (b.champion() === 'strong') strongWins++;
    }
    expect(strongWins).toBeGreaterThan(650);
    expect(strongWins).toBeLessThan(1000);
  });

  it('round-trips through JSON and rejects broken data', () => {
    const b = TournamentBracket.create(ids(8), seeded(9));
    b.resolveRound(0, () => 100, seeded(10));
    const set = new Set(ids(8));
    const copy = TournamentBracket.from(JSON.parse(JSON.stringify(b)), set);
    expect(copy?.toJSON()).toEqual(b.toJSON());
    expect(TournamentBracket.from([[{ a: 'x', b: 'e1', winner: null }]], set)).toBeNull();
    expect(TournamentBracket.from([[], []], set)).toBeNull();
    expect(TournamentBracket.from('nope', set)).toBeNull();
  });
});
