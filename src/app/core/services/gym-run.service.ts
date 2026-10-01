import { Injectable } from '@angular/core';
import { gymRegion } from '../models/gym-leader.model';
import type { GymLeader } from '../models/trainer-run.model';
import { TrainerRunService } from './trainer-run.service';

/** The "Arenaleiter-Herausforderung": a run through a region's 8 gym leaders. */
@Injectable({ providedIn: 'root' })
export class GymRunService extends TrainerRunService<GymLeader> {
  readonly route = '/gym-challenge';

  protected storageKey(): string {
    return 'pbs.gymRun';
  }

  protected lookupRegion(id: string) {
    return gymRegion(id);
  }
}
