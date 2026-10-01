import { computed, signal } from '@angular/core';
import { MajorStatus } from '../models/pokemon.model';
import type { RunMember, RunRegion } from '../models/trainer-run.model';
import type { BattleFormat } from '../battle/battle-format';

/** Battle state that survives between fights of a run (HP is always restored). */
export interface RunCarry {
  /** Major-status per party slot (0..5). Volatiles dropped; fainted slots cleared. */
  status: { major: MajorStatus | null; toxicTurns: number; sleepTurns: number }[];
  /** Remaining PP, keyed "<slot>:<showdownId>" (battle.page's movePp map). */
  pp: Record<string, number>;
}

export interface TrainerRun {
  regionId: string;
  /** Every fight of the run is played in this format. */
  format: BattleFormat;
  /** Index of the next member to fight. */
  index: number;
  status: 'active' | 'won' | 'lost';
  /** Name of the member who ended the run, for the defeat screen. */
  lostTo: string | null;
  /** Carry-over from the previously won fight; null at the start of a run. */
  carry: RunCarry | null;
}

/**
 * A run through a region's authored trainers (Top-Vier, Arenaleiter): fought
 * in canonical order, team HP restored each fight but spent PP / lingering
 * status carried through. One loss ends the run. Persisted to localStorage so
 * a reload resumes. Subclasses name the storage slot and the roster.
 */
export abstract class TrainerRunService<M extends RunMember = RunMember> {
  /** localStorage key of this mode's run. */
  protected abstract storageKey(): string;
  /** Roster lookup for this mode. */
  protected abstract lookupRegion(id: string): RunRegion<M> | undefined;
  /** Page that shows this mode's run (the battle screen returns here). */
  abstract readonly route: string;

  private readonly _run = signal<TrainerRun | null>(this.load());
  readonly run = this._run.asReadonly();
  readonly hasRun = computed(() => this._run() !== null);

  /** The region of the active run, if any. */
  readonly region = computed(() => {
    const r = this._run();
    return r ? this.lookupRegion(r.regionId) : undefined;
  });

  /** The member the run currently points at, or undefined when finished / idle. */
  readonly currentMember = computed<M | undefined>(() => {
    const r = this._run();
    const region = this.region();
    if (!r || !region || r.status !== 'active') return undefined;
    return region.members[r.index];
  });

  /** The fight waiting to start; consumed once by the battle screen. */
  private pending: M | null = null;

  setPending(member: M): void {
    this.pending = member;
  }

  takePending(): M | null {
    const m = this.pending;
    this.pending = null;
    return m;
  }

  // --- run lifecycle ------------------------------------------------

  start(regionId: string, format: BattleFormat = 'singles'): void {
    const region = this.lookupRegion(regionId);
    if (!region || !region.available || !region.members.length) return;
    this._run.set({ regionId, format, index: 0, status: 'active', lostTo: null, carry: null });
    this.persist();
  }

  /** Report the outcome of the current fight and advance / end the run. */
  recordOutcome(won: boolean, carry: RunCarry | null): void {
    const r = this._run();
    const region = this.region();
    if (!r || !region || r.status !== 'active') return;

    if (!won) {
      this._run.set({ ...r, status: 'lost', lostTo: region.members[r.index]?.name ?? null, carry: null });
      this.persist();
      return;
    }

    const index = r.index + 1;
    const done = index >= region.members.length;
    this._run.set({ ...r, index: done ? r.index : index, status: done ? 'won' : 'active', carry });
    this.persist();
  }

  reset(): void {
    this._run.set(null);
    this.pending = null;
    try {
      localStorage.removeItem(this.storageKey());
    } catch {
      /* storage unavailable - the in-memory clear is enough for this session */
    }
  }

  // --- persistence ---------------------------------------------

  private persist(): void {
    try {
      const r = this._run();
      if (r) localStorage.setItem(this.storageKey(), JSON.stringify(r));
      else localStorage.removeItem(this.storageKey());
    } catch {
      /* storage unavailable - keep the run in memory for this session */
    }
  }

  private load(): TrainerRun | null {
    try {
      const raw = localStorage.getItem(this.storageKey());
      if (!raw) return null;
      return this.sanitize(JSON.parse(raw));
    } catch {
      return null;
    }
  }

  private sanitize(v: unknown): TrainerRun | null {
    if (!v || typeof v !== 'object') return null;
    const r = v as Record<string, unknown>;
    const region = typeof r['regionId'] === 'string' ? this.lookupRegion(r['regionId']) : undefined;
    if (!region) return null;
    const status = r['status'];
    if (status !== 'active' && status !== 'won' && status !== 'lost') return null;
    const index = typeof r['index'] === 'number' ? r['index'] : 0;
    return {
      regionId: region.id,
      format: r['format'] === 'doubles' ? 'doubles' : 'singles',
      index: Math.max(0, Math.min(region.members.length - 1, Math.round(index))),
      status,
      lostTo: typeof r['lostTo'] === 'string' ? r['lostTo'] : null,
      carry: sanitizeCarry(r['carry'])
    };
  }
}

function sanitizeCarry(v: unknown): RunCarry | null {
  if (!v || typeof v !== 'object') return null;
  const c = v as Record<string, unknown>;
  const status = Array.isArray(c['status'])
    ? (c['status'] as unknown[]).map((s) => {
        const o = (s ?? {}) as Record<string, unknown>;
        return {
          major: (o['major'] ?? null) as MajorStatus | null,
          toxicTurns: typeof o['toxicTurns'] === 'number' ? o['toxicTurns'] : 0,
          sleepTurns: typeof o['sleepTurns'] === 'number' ? o['sleepTurns'] : 0
        };
      })
    : [];
  const pp: Record<string, number> = {};
  if (c['pp'] && typeof c['pp'] === 'object') {
    for (const [k, val] of Object.entries(c['pp'] as Record<string, unknown>)) {
      if (typeof val === 'number') pp[k] = val;
    }
  }
  return { status, pp };
}
