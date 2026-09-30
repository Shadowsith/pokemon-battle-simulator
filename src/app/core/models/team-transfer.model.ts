import { ImportedTeam, SavedTeam, sanitizeTeamBody } from './team.model';

export const TEAM_EXPORT_FORMAT = 'pbs-teams';
export const TEAM_EXPORT_VERSION = 1;

/** The JSON document written by "Exportieren" and read by "Importieren". */
export interface TeamExportFile {
  format: typeof TEAM_EXPORT_FORMAT;
  version: number;
  exportedAt: string;
  teams: ImportedTeam[];
}

export interface ImportResult {
  teams: ImportedTeam[];
  /** German, user-facing reason the file was rejected. */
  error?: string;
}

/** Export file for the given teams. Local ids are dropped; imports always get fresh ones. */
export function buildExportFile(teams: SavedTeam[], now = new Date()): TeamExportFile {
  return {
    format: TEAM_EXPORT_FORMAT,
    version: TEAM_EXPORT_VERSION,
    exportedAt: now.toISOString(),
    teams: teams.map((t) => ({
      name: t.name,
      pokemon: t.pokemon.map((p) => ({ ...p, types: [...p.types], moves: [...p.moves] }))
    }))
  };
}

/**
 * Parse an import file. Accepts the export format, a bare team array (e.g. a raw
 * `pbs.teams` localStorage dump) or a single team object. Every team is run
 * through the same sanitizer as saved teams.
 */
export function parseImportFile(text: string): ImportResult {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return { teams: [], error: 'Die Datei ist kein gültiges JSON.' };
  }

  let rawTeams: unknown[];
  if (Array.isArray(data)) {
    rawTeams = data;
  } else if (data && typeof data === 'object' && 'format' in data) {
    const file = data as Record<string, unknown>;
    if (file['format'] !== TEAM_EXPORT_FORMAT) {
      return { teams: [], error: 'Unbekanntes Dateiformat.' };
    }
    if (typeof file['version'] !== 'number' || file['version'] > TEAM_EXPORT_VERSION) {
      return { teams: [], error: 'Die Datei stammt aus einer neueren Version der App.' };
    }
    rawTeams = Array.isArray(file['teams']) ? file['teams'] : [];
  } else if (data && typeof data === 'object' && 'pokemon' in data) {
    rawTeams = [data];
  } else {
    return { teams: [], error: 'Unbekanntes Dateiformat.' };
  }

  const teams = rawTeams.map(sanitizeTeamBody).filter((t): t is ImportedTeam => !!t);
  if (!teams.length) return { teams: [], error: 'Die Datei enthält keine gültigen Teams.' };
  return { teams };
}

/** `team-<name>.json` for one team, `pbs-teams-YYYY-MM-DD.json` for several. */
export function exportFileName(teams: SavedTeam[], now = new Date()): string {
  if (teams.length === 1) {
    const slug = teams[0].name
      .normalize('NFKD')
      .replace(/\p{Diacritic}/gu, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    return `team-${slug || 'export'}.json`;
  }
  const pad = (n: number) => String(n).padStart(2, '0');
  return `pbs-teams-${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}.json`;
}
