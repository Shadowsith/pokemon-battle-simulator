import { TestBed } from '@angular/core/testing';
import { EliteFourRunService, RunCarry } from './elite-four-run.service';
import { eliteFourRegion } from '../models/elite-four.model';

const carry = (): RunCarry => ({ status: [{ major: 'brn', toxicTurns: 0, sleepTurns: 0 }], pp: { '0:surf': 3 } });

describe('EliteFourRunService', () => {
  let svc: EliteFourRunService;
  const kantoCount = eliteFourRegion('kanto')!.members.length;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    svc = TestBed.inject(EliteFourRunService);
  });

  it('starts a Kanto run at the first member', () => {
    expect(svc.hasRun()).toBe(false);
    svc.start('kanto');
    expect(svc.run()?.status).toBe('active');
    expect(svc.run()?.index).toBe(0);
    expect(svc.currentMember()?.name).toBe('Lorelei');
  });

  it('ignores an unknown region id', () => {
    svc.start('kalos');
    expect(svc.hasRun()).toBe(false);
  });

  it('has all five regions wired with four full members each', () => {
    for (const id of ['kanto', 'johto', 'hoenn', 'sinnoh', 'einall']) {
      const r = eliteFourRegion(id)!;
      expect(r.available).toBe(true);
      expect(r.members.length).toBe(4);
      expect(r.members.every((m) => m.team.length >= 5 && m.team.length <= 6)).toBe(true);
      expect(r.members.flatMap((m) => m.team).every((p) => p.speciesNum > 0 && p.moves.length === 4)).toBe(true);
    }
  });

  it('runs the Johto Top Four in canonical order', () => {
    const johto = eliteFourRegion('johto')!;
    expect(johto.available).toBe(true);
    expect(johto.members.map((m) => m.name)).toEqual(['Willi', 'Koga', 'Bruno', 'Melanie']);
    expect(johto.members.every((m) => m.team.length === 6)).toBe(true);

    svc.start('johto');
    expect(svc.currentMember()?.name).toBe('Willi');
    for (let i = 0; i < johto.members.length; i++) svc.recordOutcome(true, null);
    expect(svc.run()?.status).toBe('won');
  });

  it('advances on a win and stores the carry', () => {
    svc.start('kanto');
    const c = carry();
    svc.recordOutcome(true, c);
    expect(svc.run()?.index).toBe(1);
    expect(svc.run()?.carry).toEqual(c);
    expect(svc.currentMember()?.name).toBe('Bruno');
  });

  it('marks the run won after the last member', () => {
    svc.start('kanto');
    for (let i = 0; i < kantoCount; i++) svc.recordOutcome(true, carry());
    expect(svc.run()?.status).toBe('won');
    expect(svc.currentMember()).toBeUndefined();
  });

  it('ends the run on a loss and records who beat you', () => {
    svc.start('kanto');
    svc.recordOutcome(true, carry()); // beat Lorelei -> facing Bruno
    svc.recordOutcome(false, null);
    expect(svc.run()?.status).toBe('lost');
    expect(svc.run()?.lostTo).toBe('Bruno');
    expect(svc.run()?.carry).toBeNull();
  });

  it('persists across service instances and clears on reset', () => {
    svc.start('kanto');
    svc.recordOutcome(true, carry());

    const reloaded = new EliteFourRunService();
    expect(reloaded.run()?.index).toBe(1);
    expect(reloaded.run()?.carry?.pp['0:surf']).toBe(3);

    svc.reset();
    expect(new EliteFourRunService().run()).toBeNull();
  });

  it('hands one pending fight to the battle screen', () => {
    const m = eliteFourRegion('kanto')!.members[0];
    svc.setPending(m);
    expect(svc.takePending()).toBe(m);
    expect(svc.takePending()).toBeNull();
  });
});
