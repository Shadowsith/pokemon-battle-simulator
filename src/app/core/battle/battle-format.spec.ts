import {
  FieldView,
  Slot,
  applyRedirection,
  needsTargetChoice,
  orderActions,
  protectBlocks,
  protectSuccessChance,
  resolveTargets,
  slotKey,
  spreadModifier,
  targetChoices
} from './battle-format';

const mv = (showdownId: string) => ({ showdownId });
const P0: Slot = { side: 'player', pos: 0 };
const P1: Slot = { side: 'player', pos: 1 };
const O0: Slot = { side: 'opponent', pos: 0 };
const O1: Slot = { side: 'opponent', pos: 1 };

function field(format: 'singles' | 'doubles', fainted: Slot[] = []): FieldView {
  const down = new Set(fainted.map(slotKey));
  return { format, alive: (s) => !down.has(slotKey(s)) && (format === 'doubles' || s.pos === 0) };
}

const keys = (r: ReturnType<typeof resolveTargets>) => (r.kind === 'targets' ? r.targets.map(slotKey) : r.kind);

describe('battle format targeting', () => {
  it('singles: every attack hits the one foe, no target choice', () => {
    const f = field('singles');
    expect(keys(resolveTargets(mv('tackle'), P0, null, f))).toEqual(['o0']);
    expect(keys(resolveTargets(mv('surf'), P0, null, f))).toEqual(['o0']);
    expect(keys(resolveTargets(mv('rockslide'), P0, null, f))).toEqual(['o0']);
    expect(needsTargetChoice(mv('tackle'), P0, f)).toBe(false);
  });

  it('doubles: single-target moves need a choice and hit the chosen foe', () => {
    const f = field('doubles');
    expect(needsTargetChoice(mv('tackle'), P0, f)).toBe(true);
    expect(targetChoices(mv('tackle'), P0, f).map(slotKey)).toEqual(['o0', 'o1']);
    expect(targetChoices(mv('airslash'), P0, f).map(slotKey)).toEqual(['o0', 'o1', 'p1']); // "any" may hit the partner
    expect(keys(resolveTargets(mv('tackle'), P0, O1, f))).toEqual(['o1']);
  });

  it('retargets to the other foe when the chosen one has fainted', () => {
    const f = field('doubles', [O1]);
    expect(keys(resolveTargets(mv('tackle'), P0, O1, f))).toEqual(['o0']);
    expect(needsTargetChoice(mv('tackle'), P0, f)).toBe(false);
  });

  it('Surf / Earthquake hit both foes and the partner; Rock Slide only the foes', () => {
    const f = field('doubles');
    expect(keys(resolveTargets(mv('surf'), P0, null, f))).toEqual(['o0', 'o1', 'p1']);
    expect(keys(resolveTargets(mv('earthquake'), O1, null, f))).toEqual(['p0', 'p1', 'o0']);
    expect(keys(resolveTargets(mv('rockslide'), P0, null, f))).toEqual(['o0', 'o1']);
    expect(keys(resolveTargets(mv('surf'), P0, null, field('doubles', [P1])))).toEqual(['o0', 'o1']);
  });

  it('self / field moves resolve to the user side', () => {
    const f = field('doubles');
    for (const id of ['swordsdance', 'protect', 'lightscreen', 'raindance', 'spikes', 'helpinghand']) {
      expect(resolveTargets(mv(id), P0, null, f).kind).withContext(id).toBe('self');
    }
  });

  it('random-target moves pick a living foe', () => {
    const f = field('doubles', [O0]);
    expect(keys(resolveTargets(mv('outrage'), P0, null, f, () => 0))).toEqual(['o1']);
  });

  it('applies the 0.75 spread modifier only for multiple targets', () => {
    expect(spreadModifier(1)).toBe(1);
    expect(spreadModifier(2)).toBe(0.75);
    expect(spreadModifier(3)).toBe(0.75);
  });
});

describe('redirection', () => {
  const f = field('doubles');

  it('Follow Me pulls single-target attacks, not spread moves', () => {
    const r = { slot: O1, kind: 'followme' as const };
    expect(applyRedirection([O0], mv('tackle'), P0, ['Normal'], r, f).map(slotKey)).toEqual(['o1']);
    expect(applyRedirection([O0, O1], mv('rockslide'), P0, ['Rock'], r, f).map(slotKey)).toEqual(['o0', 'o1']);
  });

  it('Rage Powder does not affect Grass-type attackers', () => {
    const r = { slot: O1, kind: 'ragepowder' as const };
    expect(applyRedirection([O0], mv('tackle'), P0, ['Grass'], r, f).map(slotKey)).toEqual(['o0']);
    expect(applyRedirection([O0], mv('tackle'), P0, ['Water'], r, f).map(slotKey)).toEqual(['o1']);
  });

  it('ignores a fainted redirector and the redirector’s own side', () => {
    expect(
      applyRedirection([O0], mv('tackle'), P0, [], { slot: O1, kind: 'followme' }, field('doubles', [O1])).map(slotKey)
    ).toEqual(['o0']);
    expect(applyRedirection([P0], mv('tackle'), P1, [], { slot: O1, kind: 'followme' }, f).map(slotKey)).toEqual(['p0']);
  });
});

describe('turn order and protection', () => {
  it('switches first, then priority, then speed', () => {
    const order = orderActions([
      { id: 'slow', kind: 'move' as const, priority: 0, speed: 50 },
      { id: 'fast', kind: 'move' as const, priority: 0, speed: 200 },
      { id: 'prio', kind: 'move' as const, priority: 1, speed: 10 },
      { id: 'swap', kind: 'switch' as const, priority: 0, speed: 1 }
    ]);
    expect(order.map((a) => a.id)).toEqual(['swap', 'prio', 'fast', 'slow']);
  });

  it('protect odds drop to 1/3ⁿ on consecutive use', () => {
    expect(protectSuccessChance(0)).toBe(1);
    expect(protectSuccessChance(1)).toBeCloseTo(1 / 3, 5);
    expect(protectSuccessChance(2)).toBeCloseTo(1 / 9, 5);
  });

  it('Protect blocks attacks and status moves; King’s Shield lets status moves through', () => {
    expect(protectBlocks('protect', mv('tackle'))).toBe(true);
    expect(protectBlocks('protect', mv('thunderwave'))).toBe(true);
    expect(protectBlocks('kingsshield', mv('thunderwave'))).toBe(false);
    expect(protectBlocks('kingsshield', mv('tackle'))).toBe(true);
    expect(protectBlocks('protect', mv('swordsdance'))).toBe(false);
  });
});
