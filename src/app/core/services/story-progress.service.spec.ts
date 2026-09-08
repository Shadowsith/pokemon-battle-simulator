import { TestBed } from '@angular/core/testing';
import { StoryProgressService } from './story-progress.service';
import { BattleScene, StoryDoc, StoryMon } from '../models/story.model';

const doc: StoryDoc = {
  id: 'test-arc',
  title: 'Test',
  startSceneId: 'a',
  scenes: {
    a: { id: 'a', kind: 'dialogue', lines: [{ text: 'hi' }], next: 'b' },
    b: {
      id: 'b',
      kind: 'battle',
      opponent: { trainerId: 'silver', name: 'Silver', team: [] },
      onWin: 'win',
      onLose: 'lose'
    },
    win: { id: 'win', kind: 'end', endingId: 'win', text: 'w' },
    lose: { id: 'lose', kind: 'end', endingId: 'lose', text: 'l' }
  }
};

const mon = (n: number): StoryMon => ({
  speciesNum: n,
  speciesId: `s${n}`,
  name: `S${n}`,
  types: ['Normal'],
  moves: ['tackle']
});

describe('StoryProgressService', () => {
  let svc: StoryProgressService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    svc = TestBed.inject(StoryProgressService);
  });

  it('starts a run at the first scene', () => {
    expect(svc.hasRun()).toBe(false);
    svc.start(doc);
    expect(svc.save()?.currentSceneId).toBe('a');
    expect(svc.hasRunFor('test-arc')).toBe(true);
    expect(svc.hasRunFor('other')).toBe(false);
  });

  it('records visited scenes on goTo', () => {
    svc.start(doc);
    svc.goTo('b');
    expect(svc.save()?.currentSceneId).toBe('b');
    expect(svc.save()?.visitedSceneIds).toEqual(['a', 'b']);
  });

  it('routes battle outcomes to onWin / onLose', () => {
    svc.start(doc);
    const battle = doc.scenes['b'] as BattleScene;

    svc.recordBattleOutcome(true, battle);
    expect(svc.save()?.currentSceneId).toBe('win');

    svc.goTo('b');
    svc.recordBattleOutcome(false, battle);
    expect(svc.save()?.currentSceneId).toBe('lose');
  });

  it('applies flag and team effects', () => {
    svc.start(doc);
    svc.applyEffects([
      { op: 'setFlag', key: 'tone', value: 'calm' },
      { op: 'setTeam', team: [mon(1), mon(2)] },
      { op: 'grantPokemon', mon: mon(3) }
    ]);
    expect(svc.save()?.flags['tone']).toBe('calm');
    expect(svc.save()?.team.map((m) => m.speciesNum)).toEqual([1, 2, 3]);
    expect(svc.checkCondition({ key: 'tone', equals: 'calm' })).toBe(true);
    expect(svc.checkCondition({ key: 'tone', equals: 'cocky' })).toBe(false);
    expect(svc.checkCondition(undefined)).toBe(true);
  });

  it('caps the story team at six', () => {
    svc.start(doc);
    svc.applyEffects([{ op: 'setTeam', team: [1, 2, 3, 4, 5, 6, 7].map(mon) }]);
    expect(svc.save()?.team.length).toBe(6);
  });

  it('persists across service instances and clears on reset', () => {
    svc.start(doc);
    svc.goTo('b');
    svc.applyEffects([{ op: 'setFlag', key: 'x', value: 1 }]);

    const reloaded = new StoryProgressService();
    expect(reloaded.save()?.currentSceneId).toBe('b');
    expect(reloaded.save()?.flags['x']).toBe(1);

    svc.reset();
    expect(svc.hasRun()).toBe(false);
    expect(new StoryProgressService().save()).toBeNull();
  });

  it('marks completion when finished', () => {
    svc.start(doc);
    expect(svc.isComplete()).toBe(false);
    svc.finish('win');
    expect(svc.isComplete()).toBe(true);
    expect(svc.save()?.endingId).toBe('win');
  });
});
