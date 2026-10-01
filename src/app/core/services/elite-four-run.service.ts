import { Injectable } from '@angular/core';
import { EliteFourMember, eliteFourRegion } from '../models/elite-four.model';
import { TrainerRun, TrainerRunService } from './trainer-run.service';

export type { RunCarry } from './trainer-run.service';
export type EliteFourRun = TrainerRun;

/** The "Top-Vier-Herausforderung": a run through a region's Elite Four. */
@Injectable({ providedIn: 'root' })
export class EliteFourRunService extends TrainerRunService<EliteFourMember> {
  readonly route = '/elite-four';

  protected storageKey(): string {
    return 'pbs.eliteFourRun';
  }

  protected lookupRegion(id: string) {
    return eliteFourRegion(id);
  }
}
