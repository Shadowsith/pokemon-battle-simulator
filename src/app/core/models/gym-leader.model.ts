import type { GymLeader, RunRegion } from './trainer-run.model';
import { EINALL } from './gym-leader/gym-leader-einall.model';
import { HOENN } from './gym-leader/gym-leader-hoenn.model';
import { JOHTO } from './gym-leader/gym-leader-johto.model';
import { KALOS } from './gym-leader/gym-leader-kalos.model';
import { KANTO } from './gym-leader/gym-leader-kanto.model';
import { SINNOH } from './gym-leader/gym-leader-sinnoh.model';

/**
 * Arenaleiter rosters for the "Arenaleiter-Herausforderung" run mode. One region
 * per generation, Kanto through Kalos.
 */

export const GYM_REGIONS: RunRegion<GymLeader>[] = [
  KANTO,
  JOHTO,
  HOENN,
  SINNOH,
  EINALL,
  KALOS
];

export function gymRegion(id: string): RunRegion<GymLeader> | undefined {
  return GYM_REGIONS.find((r) => r.id === id);
}
