import { GYM_REGIONS } from '../models/gym-leader.model';
import {
  OUTDOOR_SCENES,
  background,
  backgroundUrl,
  isSceneId,
  randomOutdoorScene,
  sceneForGymType,
  timeOfDay
} from './battle-background';

const at = (h: number, m: number) => new Date(2026, 0, 1, h, m);

describe('battle-background', () => {
  it('is night from 20:00 until 6:00', () => {
    expect(timeOfDay(at(5, 59))).toBe('night');
    expect(timeOfDay(at(6, 0))).toBe('day');
    expect(timeOfDay(at(19, 59))).toBe('day');
    expect(timeOfDay(at(20, 0))).toBe('night');
  });

  it('keeps day for scenes without a night version', () => {
    expect(background('cave', 'night')).toEqual({ scene: 'cave', time: 'day' });
    expect(background('indoor', 'night')).toEqual({ scene: 'indoor', time: 'day' });
    expect(background('elite-four', 'night')).toEqual({ scene: 'elite-four', time: 'day' });
    expect(background('forest', 'night')).toEqual({ scene: 'forest', time: 'night' });
  });

  it('builds the asset path per variant', () => {
    expect(backgroundUrl({ scene: 'water', time: 'night' })).toBe('assets/backgrounds/water-night.svg');
    expect(backgroundUrl({ scene: 'cave', time: 'day' })).toBe('assets/backgrounds/cave.svg');
  });

  it('rolls only outdoor scenes', () => {
    expect(OUTDOOR_SCENES).toEqual(['grass', 'forest', 'water', 'beach', 'city', 'arena']);
    expect(randomOutdoorScene(() => 0)).toBe('grass');
    expect(randomOutdoorScene(() => 0.999)).toBe('arena');
  });

  it('maps every authored gym type to a scene', () => {
    const types = new Set(GYM_REGIONS.flatMap((r) => r.members.map((m) => m.type)));
    expect(types.size).toBeGreaterThan(0);
    for (const t of types) expect(isSceneId(sceneForGymType(t))).withContext(t).toBeTrue();
    expect(sceneForGymType('Water')).toBe('water');
    expect(sceneForGymType('Rock')).toBe('cave');
  });

  it('recognises scene ids', () => {
    expect(isSceneId('city')).toBeTrue();
    expect(isSceneId('random')).toBeFalse();
    expect(isSceneId(undefined)).toBeFalse();
  });
});
