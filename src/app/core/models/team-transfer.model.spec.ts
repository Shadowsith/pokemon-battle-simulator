import { TestBed } from '@angular/core/testing';
import { SavedTeam, TeamPokemon } from './team.model';
import {
  TEAM_EXPORT_FORMAT,
  buildExportFile,
  exportFileName,
  parseImportFile
} from './team-transfer.model';
import { TeamService } from '../services/team.service';

const mon = (speciesNum: number, speciesId: string, moves: string[] = ['tackle']): TeamPokemon => ({
  speciesNum,
  speciesId,
  name: speciesId,
  types: ['Normal'],
  moves
});

const teams = (): SavedTeam[] => [
  { id: 'a', name: 'Regen', pokemon: [mon(186, 'politoed', ['scald', 'icebeam'])] },
  { id: 'b', name: 'Sonne', pokemon: [mon(6, 'charizard'), mon(3, 'venusaur')] }
];

describe('team transfer', () => {
  it('round-trips teams through an export file, dropping local ids', () => {
    const file = buildExportFile(teams());
    expect(file.format).toBe(TEAM_EXPORT_FORMAT);
    expect(JSON.stringify(file)).not.toContain('"id"');

    const { teams: parsed, error } = parseImportFile(JSON.stringify(file));
    expect(error).toBeUndefined();
    expect(parsed.map((t) => t.name)).toEqual(['Regen', 'Sonne']);
    expect(parsed[0].pokemon[0].moves).toEqual(['scald', 'icebeam']);
    expect(parsed[1].pokemon.length).toBe(2);
  });

  it('accepts a bare team array and a single team object', () => {
    expect(parseImportFile(JSON.stringify(teams())).teams.length).toBe(2);
    expect(parseImportFile(JSON.stringify(teams()[0])).teams.map((t) => t.name)).toEqual(['Regen']);
  });

  it('rejects invalid JSON, foreign formats and newer versions', () => {
    expect(parseImportFile('{nope').error).toBeDefined();
    expect(parseImportFile(JSON.stringify({ format: 'other', version: 1, teams: [] })).error).toBeDefined();
    const newer = { ...buildExportFile(teams()), version: 99 };
    expect(parseImportFile(JSON.stringify(newer)).error).toBeDefined();
    expect(parseImportFile(JSON.stringify({ hello: 1 })).error).toBeDefined();
  });

  it('reports a file without usable teams', () => {
    const file = { ...buildExportFile([]), teams: ['junk', 42] };
    expect(parseImportFile(JSON.stringify(file)).error).toBe('Die Datei enthält keine gültigen Teams.');
  });

  it('sanitizes oversized teams and movesets and drops garbage entries', () => {
    const big = {
      name: 'Zu groß',
      pokemon: [
        ...Array.from({ length: 8 }, () => mon(25, 'pikachu', ['a', 'b', 'c', 'd', 'e'])),
        { bogus: true }
      ]
    };
    const [t] = parseImportFile(JSON.stringify([big])).teams;
    expect(t.pokemon.length).toBe(6);
    expect(t.pokemon[0].moves.length).toBe(4);
  });

  it('names the file after one team, or by date for several', () => {
    expect(exportFileName([{ id: 'x', name: 'Mein Überteam!', pokemon: [] }])).toBe(
      'team-mein-uberteam.json'
    );
    expect(exportFileName(teams(), new Date(2026, 8, 3))).toBe('pbs-teams-2026-09-03.json');
  });
});

describe('TeamService.importTeams', () => {
  let svc: TeamService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    svc = TestBed.inject(TeamService);
  });

  it('adds new teams with fresh ids and suffixes clashing names', () => {
    svc.createTeam('Regen');
    const count = svc.importTeams([
      { team: { name: 'Regen', pokemon: [mon(186, 'politoed')] }, mode: 'new' },
      { team: { name: 'Regen', pokemon: [] }, mode: 'new' }
    ]);
    expect(count).toBe(2);
    expect(svc.teams().map((t) => t.name)).toEqual(['Regen', 'Regen (Import)', 'Regen (Import 2)']);
    expect(new Set(svc.teams().map((t) => t.id)).size).toBe(3);
  });

  it('replaces an existing team in place, keeping its id and active status', () => {
    const id = svc.createTeam('Regen');
    expect(svc.activeTeamId()).toBe(id);
    svc.importTeams([
      { team: { name: 'Regen', pokemon: [mon(186, 'politoed')] }, mode: 'replace', replaceId: id }
    ]);
    expect(svc.teams().length).toBe(1);
    expect(svc.activeTeamId()).toBe(id);
    expect(svc.team(id)?.pokemon[0].speciesId).toBe('politoed');
  });

  it('makes the first imported team active when none was, and persists', () => {
    svc.importTeams([{ team: { name: 'Neu', pokemon: [] }, mode: 'new' }]);
    expect(svc.activeTeam()?.name).toBe('Neu');
    expect(localStorage.getItem('pbs.teams')).toContain('Neu');
  });
});
