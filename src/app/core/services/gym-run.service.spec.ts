import { TestBed } from '@angular/core/testing';
import { GymRunService } from './gym-run.service';
import { EliteFourRunService } from './elite-four-run.service';
import { RunCarry } from './trainer-run.service';

const carry = (): RunCarry => ({ status: [{ major: 'par', toxicTurns: 0, sleepTurns: 0 }], pp: { '0:surf': 5 } });

describe('GymRunService', () => {
  let svc: GymRunService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    svc = TestBed.inject(GymRunService);
  });

  it('starts Kanto at Rocko and returns to the gym page', () => {
    svc.start('kanto');
    expect(svc.currentMember()?.name).toBe('Rocko');
    expect(svc.route).toBe('/gym-challenge');
  });

  it('ignores regions that are not playable yet', () => {
    svc.start('johto');
    expect(svc.hasRun()).toBe(false);
  });

  it('collects all 8 badges with eight wins', () => {
    svc.start('kanto');
    for (let i = 0; i < 7; i++) svc.recordOutcome(true, carry());
    expect(svc.currentMember()?.name).toBe('Giovanni');
    svc.recordOutcome(true, carry());
    expect(svc.run()?.status).toBe('won');
  });

  it('ends the run on a loss and names the leader', () => {
    svc.start('kanto');
    svc.recordOutcome(true, carry());
    svc.recordOutcome(false, null);
    expect(svc.run()?.status).toBe('lost');
    expect(svc.run()?.lostTo).toBe('Misty');
  });

  it('keeps carry-over and format across a reload', () => {
    svc.start('kanto', 'doubles');
    svc.recordOutcome(true, carry());
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    const reloaded = TestBed.inject(GymRunService);
    expect(reloaded.run()?.format).toBe('doubles');
    expect(reloaded.run()?.carry?.pp['0:surf']).toBe(5);
    expect(reloaded.currentMember()?.name).toBe('Misty');
  });

  it('stores its run separately from the Top-Vier run', () => {
    const e4 = TestBed.inject(EliteFourRunService);
    svc.start('kanto');
    e4.start('johto');
    svc.recordOutcome(true, carry());
    expect(svc.currentMember()?.name).toBe('Misty');
    expect(e4.currentMember()?.name).toBe('Willi');
    svc.reset();
    expect(e4.hasRun()).toBe(true);
  });
});
