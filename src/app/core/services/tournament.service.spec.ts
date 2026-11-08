import { TestBed } from '@angular/core/testing';
import { TournamentBracket } from '../battle/tournament-bracket';
import { PLAYER_ENTRANT_ID, Tournament, TournamentEntrant, defaultTournamentConfig } from '../models/tournament.model';
import { TournamentService, sanitizeTournament } from './tournament.service';

const npc = (i: number): TournamentEntrant => ({
  id: `npc${i}`,
  name: `Trainer ${i}`,
  trainerId: 'red',
  isPlayer: false,
  team: [{ speciesNum: 6, name: 'Glurak', types: ['Fire', 'Flying'], moves: ['flamethrower'], item: null }],
  strength: 2000 + i
});

function stored(): Tournament {
  const entrants: TournamentEntrant[] = [
    { id: PLAYER_ENTRANT_ID, name: 'Du', trainerId: 'red', isPlayer: true, team: [], strength: 0 },
    ...[0, 1, 2, 3, 4, 5, 6].map(npc)
  ];
  return {
    config: defaultTournamentConfig(),
    entrants,
    rounds: TournamentBracket.create(entrants.map((e) => e.id)).toJSON(),
    status: 'active',
    lostTo: null
  };
}

function freshService(t: Tournament): TournamentService {
  localStorage.setItem('pbs.tournament', JSON.stringify(t));
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({});
  return TestBed.inject(TournamentService);
}

describe('TournamentService', () => {
  afterEach(() => localStorage.clear());

  it('resumes a stored tournament and names the next opponent', () => {
    const svc = freshService(stored());
    expect(svc.tournament()?.status).toBe('active');
    expect(svc.nextMatch()?.round).toBe(0);
    expect(svc.currentOpponent()?.isPlayer).toBe(false);
  });

  it('hands the next fight to the battle screen exactly once', () => {
    const svc = freshService(stored());
    svc.setPending();
    expect(svc.takePending()?.opponent.id).toBe(svc.currentOpponent()!.id);
    expect(svc.takePending()).toBeNull();
  });

  it('advances on a win and decides the other matches of that round', () => {
    const svc = freshService(stored());
    svc.recordOutcome(true);
    const round0 = svc.bracket()!.rounds[0];
    expect(round0.every((m) => m.winner !== null)).toBe(true);
    expect(svc.nextMatch()?.round).toBe(1);
  });

  it('wins the tournament after three wins', () => {
    const svc = freshService(stored());
    svc.recordOutcome(true);
    svc.recordOutcome(true);
    expect(svc.tournament()?.status).toBe('active');
    svc.recordOutcome(true);
    expect(svc.tournament()?.status).toBe('won');
    expect(svc.champion()?.id).toBe(PLAYER_ENTRANT_ID);
  });

  it('resolves the rest of the bracket to a champion after a loss', () => {
    const svc = freshService(stored());
    const opponent = svc.currentOpponent()!;
    svc.recordOutcome(false);
    const t = svc.tournament()!;
    expect(t.status).toBe('lost');
    expect(t.lostTo).toBe(opponent.name);
    expect(svc.champion()).not.toBeNull();
    expect(svc.champion()?.isPlayer).toBe(false);
    expect(svc.nextMatch()).toBeNull();
  });

  it('rejects broken stored data', () => {
    const t = stored();
    expect(sanitizeTournament(t)).not.toBeNull();
    expect(sanitizeTournament({ ...t, entrants: t.entrants.slice(1) })).toBeNull();
    expect(sanitizeTournament({ ...t, config: { ...t.config, size: 6 } })).toBeNull();
    expect(sanitizeTournament({ ...t, status: 'paused' })).toBeNull();
    expect(sanitizeTournament({ ...t, rounds: [] })).toBeNull();
    expect(freshService({ ...t, status: 'paused' } as unknown as Tournament).tournament()).toBeNull();
  });
});
