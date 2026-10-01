import { TestBed } from '@angular/core/testing';
import { MOVE_LIBRARY, Move } from '../models/move.model';
import { BattlePokemon, freshBoosts, freshStatus } from '../models/pokemon.model';
import { DamageCalcService } from '../services/damage-calc.service';
import {
  accuracyMult,
  balloonPops,
  berryCheck,
  blocksStatusMoves,
  defenseMods,
  focusSashCap,
  isChoiceItem,
  lifeOrbRecoil,
  offenseMods,
  residualItem,
  retaliation,
  speedMult
} from './item-effects';

const move = (id: string): Move => MOVE_LIBRARY.find((m) => m.showdownId === id)!;

function mon(dexId: number, types: string[], item: string | null, patch: Partial<BattlePokemon> = {}): BattlePokemon {
  return {
    dexId,
    name: `#${dexId}`,
    maxHp: 320,
    currentHp: 320,
    types,
    status: freshStatus(),
    boosts: freshBoosts(),
    item,
    ...patch
  };
}

describe('held item effects', () => {
  it('Magnet boosts Electric moves by 1.2× and nothing else', () => {
    const pika = mon(25, ['electric'], 'magnet');
    expect(offenseMods(pika, move('thunderbolt'), 1).powerMult).toBeCloseTo(1.2, 5);
    expect(offenseMods(pika, move('surf'), 1).powerMult).toBe(1);
  });

  it('a gem boosts its type by 1.3× and reports itself for consumption', () => {
    const turtok = mon(9, ['water'], 'watergem');
    const m = offenseMods(turtok, move('surf'), 1);
    expect(m.powerMult).toBeCloseTo(1.3, 5);
    expect(m.gem?.id).toBe('watergem');
    expect(offenseMods(turtok, move('icebeam'), 1).gem).toBeNull();
  });

  it('Choice Band / Specs boost only the matching category; Expert Belt only super-effective hits', () => {
    expect(offenseMods(mon(6, ['fire'], 'choiceband'), move('earthquake'), 1).atkStatMult).toBe(1.5);
    expect(offenseMods(mon(6, ['fire'], 'choiceband'), move('flamethrower'), 1).atkStatMult).toBe(1);
    expect(offenseMods(mon(6, ['fire'], 'choicespecs'), move('flamethrower'), 1).atkStatMult).toBe(1.5);
    expect(offenseMods(mon(6, ['fire'], 'expertbelt'), move('flamethrower'), 2).finalMult).toBeCloseTo(1.2, 5);
    expect(offenseMods(mon(6, ['fire'], 'expertbelt'), move('flamethrower'), 1).finalMult).toBe(1);
  });

  it('Life Orb: ×1.3 damage and 1/10 max HP recoil', () => {
    const user = mon(6, ['fire'], 'lifeorb');
    const m = offenseMods(user, move('flamethrower'), 1);
    expect(m.finalMult).toBeCloseTo(1.3, 5);
    expect(m.lifeOrb).toBe(true);
    expect(lifeOrbRecoil(user)).toBe(32);
  });

  it('a resist berry halves a super-effective hit of its type only', () => {
    const golem = mon(76, ['rock', 'ground'], 'passhoberry');
    expect(defenseMods(golem, move('surf'), 4).finalMult).toBe(0.5);
    expect(defenseMods(golem, move('surf'), 4).berry?.id).toBe('passhoberry');
    expect(defenseMods(mon(143, ['normal'], 'passhoberry'), move('surf'), 1).berry).toBeNull();
    // Chilan Berry works on any Normal hit.
    expect(defenseMods(mon(143, ['normal'], 'chilanberry'), move('bodyslam'), 1).finalMult).toBe(0.5);
  });

  it('Air Balloon makes Ground moves miss and pops when hit', () => {
    const magnezone = mon(462, ['electric', 'steel'], 'airballoon');
    expect(defenseMods(magnezone, move('earthquake'), 4).immune).toBe(true);
    expect(defenseMods(magnezone, move('flamethrower'), 2).immune).toBe(false);
    expect(balloonPops(magnezone, 40)).toBe(true);
    expect(balloonPops(magnezone, 0)).toBe(false);
  });

  it('Eviolite only helps species that can still evolve; Assault Vest boosts SpD and blocks status moves', () => {
    expect(defenseMods(mon(113, ['normal'], 'eviolite'), move('tackle'), 1).defStatMult).toBe(1.5); // Chaneira
    expect(defenseMods(mon(242, ['normal'], 'eviolite'), move('tackle'), 1).defStatMult).toBe(1); // Heiteira
    const vest = mon(9, ['water'], 'assaultvest');
    expect(defenseMods(vest, move('thunderbolt'), 2).defStatMult).toBe(1.5);
    expect(defenseMods(vest, move('earthquake'), 1).defStatMult).toBe(1);
    expect(blocksStatusMoves(vest)).toBe(true);
  });

  it('Focus Sash survives a KO only from full HP', () => {
    expect(focusSashCap(mon(65, ['psychic'], 'focussash'), 999)).toEqual({ damage: 319, used: true });
    expect(focusSashCap(mon(65, ['psychic'], 'focussash', { currentHp: 300 }), 999).used).toBe(false);
    expect(focusSashCap(mon(65, ['psychic'], 'focussash'), 100).used).toBe(false);
  });

  it('Sitrus Berry heals ¼ at half HP; Salac Berry raises Speed at ¼ HP', () => {
    expect(berryCheck(mon(9, ['water'], 'sitrusberry', { currentHp: 200 }))).toBeNull();
    const sitrus = berryCheck(mon(9, ['water'], 'sitrusberry', { currentHp: 150 }))!;
    expect(sitrus.patch.currentHp).toBe(230);
    expect(sitrus.patch.item).toBeNull();
    const salac = berryCheck(mon(95, ['rock'], 'salacberry', { currentHp: 70 }))!;
    expect(salac.patch.boosts?.spe).toBe(1);
  });

  it('Lum Berry cures a burn; Persim Berry cures confusion; White Herb resets lowered stats', () => {
    const burned = mon(6, ['fire'], 'lumberry', { status: { ...freshStatus(), major: 'brn' } });
    expect(berryCheck(burned)!.patch.status?.major).toBeNull();
    const confused = mon(6, ['fire'], 'persimberry', { status: { ...freshStatus(), confusionTurns: 3 } });
    expect(berryCheck(confused)!.patch.status?.confusionTurns).toBe(0);
    const dropped = mon(6, ['fire'], 'whiteherb', { boosts: { ...freshBoosts(), spa: -2, atk: 1 } });
    const herb = berryCheck(dropped)!;
    expect(herb.patch.boosts?.spa).toBe(0);
    expect(herb.patch.boosts?.atk).toBe(1);
  });

  it('Leftovers heal 1/16; Black Sludge heals Poison types and hurts the rest', () => {
    expect(residualItem(mon(143, ['normal'], 'leftovers', { currentHp: 100 }))?.delta).toBe(20);
    expect(residualItem(mon(143, ['normal'], 'leftovers'))).toBeNull(); // full HP
    expect(residualItem(mon(110, ['poison'], 'blacksludge', { currentHp: 100 }))?.delta).toBe(20);
    expect(residualItem(mon(143, ['normal'], 'blacksludge'))?.delta).toBe(-40);
  });

  it('Rocky Helmet hurts contact attackers only; Jaboca Berry punishes physical hits', () => {
    const attacker = mon(68, ['fighting'], null, { maxHp: 360, currentHp: 360 });
    const helmet = mon(208, ['steel', 'ground'], 'rockyhelmet');
    expect(retaliation(attacker, helmet, move('closecombat'), 50)?.damage).toBe(60);
    expect(retaliation(attacker, helmet, move('focusblast'), 50)).toBeNull();
    const jaboca = mon(208, ['steel', 'ground'], 'jabocaberry');
    expect(retaliation(attacker, jaboca, move('earthquake'), 50)).toEqual(
      jasmine.objectContaining({ damage: 45, consumed: true })
    );
  });

  it('Choice Scarf speeds up; Wide Lens / Bright Powder change accuracy', () => {
    expect(speedMult(mon(6, ['fire'], 'choicescarf'))).toBe(1.5);
    expect(isChoiceItem(mon(6, ['fire'], 'choicescarf'))).toBe(true);
    expect(accuracyMult(mon(6, ['fire'], 'widelens'), mon(9, ['water'], 'brightpowder'))).toBeCloseTo(0.99, 5);
  });

  it('the damage calc applies item multipliers and stays unchanged without them', () => {
    TestBed.configureTestingModule({});
    const calc = TestBed.inject(DamageCalcService);
    const a = mon(25, ['electric'], null);
    const d = mon(9, ['water'], null);
    const base = calc.calculateDamage(a, d, move('thunderbolt'), {}, 1);
    expect(calc.calculateDamage(a, d, move('thunderbolt'), { powerMult: 1, finalMult: 1 }, 1)).toBe(base);
    expect(calc.calculateDamage(a, d, move('thunderbolt'), { finalMult: 0.5 }, 1) / base).toBeCloseTo(0.5, 1);
    expect(calc.effectiveSpeed(mon(25, ['electric'], 'choicescarf')) / calc.effectiveSpeed(a)).toBeCloseTo(1.5, 5);
  });
});
