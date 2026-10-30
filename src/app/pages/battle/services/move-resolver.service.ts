import { Injectable, inject } from '@angular/core';
import { Move } from '../../../core/models/move.model';
import { typeColor } from '../../../core/models/pokemon.model';
import {
  PROTECT_MOVES,
  REDIRECT_MOVES,
  SIDE_GUARD_MOVES,
  Slot,
  applyRedirection,
  forcesSwitch,
  isContactMove,
  isSpreadMove,
  livingAlly,
  livingFoes,
  livingSlots,
  otherSide,
  protectBlocks,
  protectSuccessChance,
  resolveTargets,
  slotKey
} from '../../../core/battle/battle-format';
import {
  balloonPops,
  berryCheck,
  defenseMods,
  focusSashCap,
  hasPowerHerb,
  isChoiceItem,
  lifeOrbRecoil,
  offenseMods,
  retaliation,
  shellBellHeal
} from '../../../core/battle/item-effects';
import { bellyDrumCost, canBellyDrum } from '../../../core/battle/belly-drum';
import { NON_GHOST_CURSE, castsGhostCurse, curseCost } from '../../../core/battle/curse';
import { ENCORE_TURNS, canEncore } from '../../../core/battle/encore';
import { bypassesSubstitute, canAffordSubstitute, hitSubstitute, substituteCost } from '../../../core/battle/substitute';
import { AudioService } from '../../../core/services/audio.service';
import { DamageCalcService } from '../../../core/services/damage-calc.service';
import { MoveAnimationService } from '../../../core/services/move-animation.service';
import { StatChangeService } from '../../../core/services/stat-change.service';
import { StatusService } from '../../../core/services/status.service';
import { chargeMessage, statChangeMessage } from '../battle-messages';
import { BattleStageService } from './battle-stage.service';
import { BattleStateService } from './battle-state.service';

/** Shared bookkeeping while one move hits its targets. */
interface HitContext {
  spread: boolean;
  helped: boolean;
  statLogs: string[];
  itemLogs: string[];
  /** The user's own stat changes (Overheat …) apply once, not per target. */
  userChangesDone: boolean;
}

/** What one target took from a hit; `sub` is set when its Substitute soaked it up. */
interface HitResult {
  dealt: number;
  statusMsg: string | null;
  lifeOrb: boolean;
  sub?: 'hit' | 'broke';
}

/** Plays out a single move: gates, animation, damage, items, status, stats and log lines. */
@Injectable()
export class MoveResolverService {
  private readonly state = inject(BattleStateService);
  private readonly stage = inject(BattleStageService);
  private readonly damageCalc = inject(DamageCalcService);
  private readonly status = inject(StatusService);
  private readonly statChange = inject(StatChangeService);
  private readonly animation = inject(MoveAnimationService);
  private readonly audio = inject(AudioService);

  /**
   * Plays one move from `user`. Protection / support moves (Protect, Wide
   * Guard, Helping Hand, Follow Me) set up this turn's volatiles; everything
   * else resolves its targets now (retargeting and redirection included) and
   * hits each one: Protect / guard check, accuracy, damage (0.75× when it hits
   * several targets, 1.5× after Helping Hand), status and stat changes.
   */
  async performMove(move: Move, user: Slot, chosen: Slot | null): Promise<void> {
    const s = this.state;
    const side = user.side;
    const attacker = s.monAt(user)!;
    const me = () => s.monAt(user)!;
    const id = move.showdownId;
    const myCharge = s.chargeOf(user);

    // --- recharge turn: a move like Hyper Beam forces its user to sit out ---
    if (myCharge?.recharge) {
      s.setCharge(user, null);
      s.log.set(`${attacker.name} muss sich von der Attacke erholen!`);
      await this.stage.wait(900);
      return;
    }

    // Destiny Bond only lasts until its user moves again.
    s.destinyBonds.delete(slotKey(user));

    // --- status gate: sleep / freeze / paralysis / confusion may stop the move ---
    const pre = this.status.resolvePreMove(attacker);
    s.patchSlot(user, { status: pre.status });
    if (pre.message) {
      s.log.set(pre.message);
      await this.stage.wait(950);
    }
    if (pre.confusionSelfHit) {
      s.applyHp(user, -this.damageCalc.confusionSelfDamage(attacker));
      await this.runBerryChecks([user]);
      return;
    }
    if (!pre.canAct) return;
    s.lastMoves[slotKey(user)] = id; // the move Encore would lock in

    // A Choice item locks its holder into the first move it uses.
    const lockKey = s.streakKey(user);
    if (isChoiceItem(attacker) && !s.choiceLocks()[lockKey]) {
      s.choiceLocks.update((l) => ({ ...l, [lockKey]: id }));
    }

    // Any move other than a protection move resets the consecutive-use counter.
    const streakKey = s.streakKey(user);
    if (!PROTECT_MOVES.has(id)) s.protectStreak[streakKey] = 0;

    if (PROTECT_MOVES.has(id) || SIDE_GUARD_MOVES.has(id) || id === 'helpinghand' || REDIRECT_MOVES.has(id)) {
      await this.performSupportMove(move, user, streakKey);
      return;
    }
    if (id === 'substitute') {
      await this.performSubstitute(move, user);
      return;
    }
    if (id === 'batonpass') {
      await this.performBatonPass(move, user);
      return;
    }
    if (id === 'bellydrum') {
      await this.performBellyDrum(move, user);
      return;
    }
    if (id === 'curse') {
      await this.performCurse(move, user, chosen);
      return;
    }
    if (id === 'destinybond') {
      await this.performDestinyBond(move, user);
      return;
    }

    // --- two-turn move, turn 1: start charging, deal nothing (Power Herb skips it) ---
    let phase: 'release' | undefined;
    let aim = chosen;
    if (this.damageCalc.isChargeMove(move) && !myCharge && hasPowerHerb(attacker)) {
      s.consumeItem(user);
      s.log.set(`${attacker.name} ist dank Energiekraut sofort bereit!`);
      await this.stage.wait(800);
      phase = 'release';
    } else if (this.damageCalc.isChargeMove(move) && !myCharge) {
      const semiInvuln = this.damageCalc.isSemiInvulnMove(move);
      s.setCharge(user, { move, semiInvuln, target: chosen });
      s.log.set(chargeMessage(attacker.name, move));
      this.audio.playMove(id);
      const foe = livingFoes(user, s.field())[0] ?? user;
      await this.animation.playMove(move, this.stage.refsFor(user, foe), 'charge');
      await this.stage.wait(350);
      return;
    }

    // --- two-turn move, turn 2: release (skip the charge visual, then hit) ---
    if (myCharge && myCharge.move.showdownId === id) {
      s.setCharge(user, null);
      phase = 'release';
      aim = myCharge.target ?? chosen;
    }

    const field = s.field();
    const res = resolveTargets(move, user, aim, field);
    if (res.kind === 'self') {
      await this.performSelfMove(move, user, phase);
      return;
    }
    const targets = applyRedirection(res.targets, move, user, attacker.types, s.redirector[otherSide(side)], field);

    s.log.set(`${attacker.name} setzt ${move.name} ein...`);
    this.audio.playMove(id);

    if (!targets.length) {
      await this.stage.wait(650);
      s.log.set('Aber es misslang!');
      await this.stage.wait(700);
      this.queueRecharge(user, move);
      return;
    }

    // --- per-target gates: off the field, Protect, Wide / Quick Guard, accuracy ---
    const spread = targets.length > 1;
    const hits: Slot[] = [];
    let missed = 0;
    for (const t of targets) {
      const tm = s.monAt(t)!;
      if (s.chargeOf(t)?.semiInvuln) {
        await this.stage.wait(650);
        s.log.set(`Doch ${tm.name} ist nicht zu sehen!`);
        await this.stage.wait(700);
        continue;
      }
      if (await this.blockedByProtection(move, user, t)) continue;
      // Encore fails on a Pokémon that hasn't moved yet, is already encored, or last used an un-encorable move.
      if (id === 'encore' && !canEncore(s.lastMoves[slotKey(t)], !!s.encores[slotKey(t)])) {
        await this.stage.wait(500);
        s.log.set('Aber es misslang!');
        await this.stage.wait(700);
        continue;
      }
      // Whirlwind / Roar fail when there's nobody left to drag in.
      if (this.damageCalc.isStatusMove(move) && forcesSwitch(move) && !s.bench(t.side).length) {
        await this.stage.wait(500);
        s.log.set('Aber es misslang!');
        await this.stage.wait(700);
        continue;
      }
      if (this.damageCalc.isStatusMove(move) && this.behindSubstitute(move, user, t)) {
        await this.stage.wait(500);
        s.log.set('Aber es misslang!');
        await this.stage.wait(700);
        continue;
      }
      if (defenseMods(tm, move, this.damageCalc.effectiveness(move, tm)).immune) {
        s.patchSlot(t, { itemRevealed: true });
        await this.stage.wait(500);
        s.log.set(`${tm.name} schwebt dank Luftballon über der Attacke!`);
        await this.stage.wait(750);
        continue;
      }
      if (!this.damageCalc.rollHit(move, me(), tm)) {
        await this.stage.wait(480);
        await this.animation.playDodge(this.stage.spriteEl(t));
        s.log.set(spread ? `${tm.name} weicht aus!` : `Die Attacke von ${attacker.name} ging daneben!`);
        await this.stage.wait(650);
        missed++;
        continue;
      }
      hits.push(t);
    }

    if (!hits.length) {
      const crash = missed ? this.damageCalc.crashDamage(move, me()) : 0; // Jump Kick / Hi Jump Kick
      if (crash > 0) {
        s.applyHp(user, -crash);
        s.log.set(`Die Attacke von ${attacker.name} ging daneben! ${attacker.name} verletzt sich dabei selbst!`);
        await this.stage.wait(650);
        await this.runBerryChecks([user]);
      }
      this.queueRecharge(user, move); // a missed / blocked Hyper Beam still exhausts its user (Gen 4+)
      return;
    }

    await this.animation.playMove(move, this.stage.refsFor(user, hits[0]), phase);
    for (const t of hits.slice(1)) await this.animation.playHitFlash(this.stage.spriteEl(t), typeColor(move.type));

    // --- damage, status and stat changes per target ---
    const ctx: HitContext = {
      spread,
      helped: s.helpingHand.has(slotKey(user)),
      statLogs: [],
      itemLogs: [],
      userChangesDone: false
    };
    const { statLogs, itemLogs } = ctx;
    const results: { slot: Slot; dealt: number; statusMsg: string | null; sub?: 'hit' | 'broke' }[] = [];
    let totalDealt = 0;

    // A gem boosts the whole move (every target) and is used up afterwards.
    const gem = offenseMods(me(), move, 1).gem;
    if (gem) {
      s.log.set(`Das ${gem.name} verstärkt ${move.name}!`);
      await this.stage.wait(750);
    }
    let lifeOrb = false;

    for (const t of hits) {
      const hit = this.resolveHit(move, user, t, ctx);
      lifeOrb ||= hit.lifeOrb;
      totalDealt += hit.dealt;
      results.push({ slot: t, dealt: hit.dealt, statusMsg: hit.statusMsg, sub: hit.sub });
    }

    const recovery = this.damageCalc.calculateRecovery(move, me(), totalDealt);
    if (recovery.amount > 0) s.applyHp(user, recovery.amount);
    const recoil = this.damageCalc.calculateSelfDamage(move, me(), totalDealt);
    if (recoil.amount > 0) s.applyHp(user, -recoil.amount);

    // --- attacker items after the move ---
    if (gem && totalDealt > 0) s.consumeItem(user);
    if (totalDealt > 0 && me().currentHp > 0) {
      const bell = shellBellHeal(me(), totalDealt);
      if (bell > 0 && me().currentHp < me().maxHp) {
        s.applyHp(user, bell);
        s.patchSlot(user, { itemRevealed: true });
        itemLogs.push(`${me().name} füllt mit der Muschelglocke etwas KP auf.`);
      }
      if (lifeOrb) {
        s.applyHp(user, -lifeOrbRecoil(me()));
        s.patchSlot(user, { itemRevealed: true });
        itemLogs.push(`${me().name} wird durch den Leben-Orb geschwächt.`);
      }
    }

    // --- one log line per target ---
    const lines = results.map((r) => {
      const foe = s.monAt(r.slot)!;
      let line: string;
      if (r.sub) {
        return `Der Delegator steckt den Treffer für ${foe.name} ein!`;
      } else if (foe.currentHp <= 0) {
        line = `${foe.name} wurde besiegt!`;
      } else if (recovery.kind === 'drain' && recovery.amount > 0) {
        line = `${move.name} trifft ${foe.name}! ${me().name} saugt Energie ab.`;
      } else if (r.dealt > 0) {
        line = `${move.name} trifft ${foe.name}!`;
      } else if (r.statusMsg) {
        return r.statusMsg;
      } else if (id === 'encore') {
        s.encores[slotKey(r.slot)] = { move: s.lastMoves[slotKey(r.slot)], turns: ENCORE_TURNS };
        return `${foe.name} gibt eine Zugabe!`;
      } else if (forcesSwitch(move)) {
        return ''; // Whirlwind / Roar: the drag-out below has its own line
      } else if (statLogs.length > 0) {
        line = statLogs.shift() as string; // a pure stat move - lead with the first change
      } else {
        line = `${move.name} zeigt keine Wirkung …`;
      }
      return r.statusMsg ? `${line} ${r.statusMsg}` : line;
    });
    let line = lines.filter(Boolean).join(' ');

    const anyAlive = results.some((r) => s.alive(r.slot));
    if (recoil.kind === 'selfKo' && anyAlive) {
      line = `${me().name} setzt alles auf eine Karte!`;
    } else if (recoil.kind === 'recoil') {
      line +=
        me().currentHp <= 0
          ? ` ${me().name} bricht durch den Rückstoß zusammen.`
          : ` ${me().name} nimmt Rückstoß-Schaden.`;
    }
    if (line) s.log.set(line);
    // A multi-target summary needs a beat to be read before faint messages replace it.
    if (results.length > 1) await this.stage.wait(900);

    // Broken Substitutes vanish and the Pokémon behind them comes back into view.
    for (const r of results.filter((x) => x.sub === 'broke')) {
      await this.stage.wait(750);
      await this.removeSubstitute(r.slot);
      s.log.set(`Der Delegator von ${s.monAt(r.slot)!.name} verschwindet!`);
      await this.stage.wait(400);
    }

    const followUps = [...statLogs, ...itemLogs];
    for (const msg of followUps) {
      await this.stage.wait(850);
      s.log.set(msg);
    }
    // Let the last follow-up be read before a faint message replaces it.
    if (followUps.length) await this.stage.wait(850);
    await this.runBerryChecks([...hits, user]);
    await this.checkDestinyBonds(user, results);
    if (forcesSwitch(move)) await this.dragOut(move, user, results);

    // Hyper Beam & co.: lock the user into a recharge turn (unless it just fainted).
    if (me().currentHp > 0) this.queueRecharge(user, move);
  }

  /**
   * One target of a damaging / status move: damage, the defender's item
   * reactions, status infliction or thaw, and stat-stage changes. Log lines
   * for items and stats go into `ctx`.
   */
  private resolveHit(
    move: Move,
    user: Slot,
    t: Slot,
    ctx: HitContext
  ): HitResult {
    const s = this.state;
    const me = () => s.monAt(user)!;
    const defender = s.monAt(t)!;
    const eff = this.damageCalc.effectiveness(move, defender);
    const om = offenseMods(me(), move, eff);
    const dm = defenseMods(defender, move, eff);
    // Drain and recoil scale with HP actually lost, so cap the roll at the
    // defender's current HP (overkilling a weak target costs less recoil).
    const raw = this.damageCalc.calculateDamage(me(), defender, move, {
      spread: ctx.spread,
      helpingHand: ctx.helped,
      powerMult: om.powerMult,
      atkStatMult: om.atkStatMult,
      defStatMult: dm.defStatMult,
      finalMult: om.finalMult * dm.finalMult
    });
    // A Substitute takes the hit instead: no HP loss, items, status or stat drops on the target.
    if (this.behindSubstitute(move, user, t)) {
      const { absorbed, left } = hitSubstitute(s.substituteOf(t), raw);
      if (absorbed > 0) {
        this.audio.playHit(eff);
        if (left > 0) s.setSubstitute(t, left); // a broken doll is removed after the log line
      }
      this.applyStatChanges(move, user, t, absorbed, ctx, false);
      return { dealt: absorbed, statusMsg: null, lifeOrb: om.lifeOrb, sub: absorbed > 0 ? (left > 0 ? 'hit' : 'broke') : undefined };
    }

    const sash = focusSashCap(defender, raw);
    const dealt = Math.min(sash.damage, defender.currentHp);
    if (dealt > 0) {
      s.applyHp(t, -dealt);
      this.audio.playHit(eff);
    }

    // --- defender items reacting to the hit ---
    if (dm.berry && dealt > 0) {
      s.consumeItem(t);
      ctx.itemLogs.push(`${defender.name} isst seine ${dm.berry.name} und schwächt den Treffer ab!`);
    }
    if (sash.used) {
      s.consumeItem(t);
      ctx.itemLogs.push(`${defender.name} hält dank Fokusgurt durch!`);
    }
    if (balloonPops(defender, dealt) && s.monAt(t)!.item === 'airballoon') {
      s.consumeItem(t);
      ctx.itemLogs.push(`Der Luftballon von ${defender.name} ist geplatzt!`);
    }
    const hurt = retaliation(me(), defender, move, dealt);
    if (hurt) {
      s.applyHp(user, -hurt.damage);
      if (hurt.consumed) s.consumeItem(t);
      else s.patchSlot(t, { itemRevealed: true });
      ctx.itemLogs.push(hurt.message);
    }

    // --- status infliction / thaw on the target ---
    let statusMsg: string | null = null;
    const now = s.monAt(t)!;
    if (now.currentHp > 0) {
      if (now.status.major === 'frz' && dealt > 0 && this.status.isFireMove(move)) {
        s.patchSlot(t, { status: { ...now.status, major: null } });
        statusMsg = `${now.name} ist aufgetaut!`;
      } else {
        const inflicted = this.status.rollInfliction(move, now, dealt);
        if (inflicted) {
          s.patchSlot(t, { status: this.status.applyInfliction(now, inflicted) });
          statusMsg = this.status.inflictionMessage(now.name, inflicted);
        }
      }
    }

    this.applyStatChanges(move, user, t, dealt, ctx, true);
    return { dealt, statusMsg, lifeOrb: om.lifeOrb };
  }

  /**
   * Stat-stage changes of a hit (Growl, Crunch's chance, Overheat's own drop …).
   * The user's own changes apply once per move; the target's only when
   * `toTarget` (not when a Substitute took the hit).
   */
  private applyStatChanges(move: Move, user: Slot, t: Slot, dealt: number, ctx: HitContext, toTarget: boolean): void {
    const s = this.state;
    const me = s.monAt(user)!;
    const sc = this.statChange.resolve(move, s.monAt(t)!.types, dealt);
    if (!ctx.userChangesDone && Object.keys(sc.toUser).length) {
      const res = this.statChange.apply(me.boosts, sc.toUser);
      s.patchSlot(user, { boosts: res.boosts });
      for (const ch of res.changes) ctx.statLogs.push(statChangeMessage(me.name, ch));
      ctx.userChangesDone = true;
    }
    const tgt = s.monAt(t)!;
    if (toTarget && tgt.currentHp > 0 && Object.keys(sc.toTarget).length) {
      const res = this.statChange.apply(tgt.boosts, sc.toTarget);
      s.patchSlot(t, { boosts: res.boosts });
      for (const ch of res.changes) ctx.statLogs.push(statChangeMessage(tgt.name, ch));
    }
  }

  /** `move` from `user` hits the Substitute standing in front of `t` (never the user's own). */
  private behindSubstitute(move: Move, user: Slot, t: Slot): boolean {
    return slotKey(t) !== slotKey(user) && this.state.substituteOf(t) > 0 && !bypassesSubstitute(move);
  }

  /**
   * Whirlwind / Roar / Dragon Tail / Circle Throw: every target still standing
   * (and not shielded by a Substitute) is blown off the field; the flow then
   * drags a random reserve in. Without a reserve nothing happens.
   */
  private async dragOut(move: Move, user: Slot, results: { slot: Slot; dealt: number; sub?: 'hit' | 'broke' }[]): Promise<void> {
    const s = this.state;
    const damaging = !this.damageCalc.isStatusMove(move);
    for (const r of results) {
      if (!s.alive(r.slot) || r.sub || (damaging && r.dealt <= 0) || !s.bench(r.slot.side).length) continue;
      const name = s.monAt(r.slot)!.name;
      await this.stage.wait(damaging ? 600 : 200);
      const away = r.slot.side === 'opponent' ? 1 : -1; // off its own screen edge
      await this.animation.playBlownAway(this.stage.spriteEl(r.slot), away);
      s.log.set(move.showdownId === 'whirlwind' ? `${name} wurde weggeweht!` : `${name} wurde aus dem Kampf gedrängt!`);
      await this.stage.wait(800);
      s.dragOuts.push(r.slot);
    }
  }

  /** A broken Substitute in `slot` fades away and the Pokémon behind it shows again. */
  private async removeSubstitute(slot: Slot): Promise<void> {
    if (this.state.substituteOf(slot) <= 0) return;
    await this.animation.playSubstituteFade(this.stage.spriteEl(slot), this.stage.fxEl, this.stage.fieldEl, () =>
      this.state.setSubstitute(slot, 0)
    );
  }

  /** Destiny Bond: until it moves again, whoever knocks the user out faints with it. */
  private async performDestinyBond(move: Move, user: Slot): Promise<void> {
    const s = this.state;
    const name = s.monAt(user)!.name;
    s.log.set(`${name} setzt ${move.name} ein...`);
    this.audio.playMove(move.showdownId);
    const foe = livingFoes(user, s.field())[0] ?? user;
    await this.animation.playMove(move, this.stage.refsFor(user, foe));
    s.destinyBonds.add(slotKey(user));
    s.log.set(`${name} will den Angreifer mit sich nehmen!`);
    await this.stage.wait(800);
  }

  /** A target under Destiny Bond that this hit knocked out takes the attacker down with it. */
  private async checkDestinyBonds(user: Slot, results: { slot: Slot }[]): Promise<void> {
    const s = this.state;
    for (const r of results) {
      const key = slotKey(r.slot);
      if (key === slotKey(user) || !s.destinyBonds.has(key) || s.alive(r.slot) || !s.alive(user)) continue;
      s.destinyBonds.delete(key);
      await this.stage.wait(700);
      s.applyHp(user, -s.monAt(user)!.currentHp);
      s.log.set(`${s.monAt(r.slot)!.name} nimmt ${s.monAt(user)!.name} mit sich!`);
      await this.stage.wait(900);
    }
  }

  /**
   * Curse: a Ghost-type pays half its max HP to curse a foe (it then loses ¼
   * of its max HP each turn; fails if it's already cursed). Anyone else raises
   * Attack and Defense and lowers Speed by one stage.
   */
  private async performCurse(move: Move, user: Slot, chosen: Slot | null): Promise<void> {
    const s = this.state;
    const mon = s.monAt(user)!;
    s.log.set(`${mon.name} setzt ${move.name} ein...`);
    this.audio.playMove(move.showdownId);
    const foes = livingFoes(user, s.field());

    if (!castsGhostCurse(mon)) {
      await this.animation.playMove(move, this.stage.refsFor(user, foes[0] ?? user));
      const res = this.statChange.apply(s.monAt(user)!.boosts, NON_GHOST_CURSE);
      s.patchSlot(user, { boosts: res.boosts });
      for (const [i, ch] of res.changes.entries()) {
        if (i) await this.stage.wait(850);
        s.log.set(statChangeMessage(mon.name, ch));
      }
      await this.stage.wait(700);
      await this.runBerryChecks([user]); // White Herb resets the Speed drop
      return;
    }

    const t = chosen && chosen.side !== user.side && s.alive(chosen) ? chosen : (foes[0] ?? null);
    if (!t || s.cursed.has(slotKey(t))) {
      await this.stage.wait(500);
      s.log.set('Aber es misslang!');
      await this.stage.wait(700);
      return;
    }
    s.applyHp(user, -curseCost(mon));
    await this.animation.playMove(move, this.stage.refsFor(user, t));
    s.cursed.add(slotKey(t));
    s.log.set(`${mon.name} halbiert seine KP und belegt ${s.monAt(t)!.name} mit einem Fluch!`);
    await this.stage.wait(800);
    await this.runBerryChecks([user]);
  }

  /** Belly Drum: half of max HP for maximum Attack (+6). Fails with too little HP or Attack already maxed. */
  private async performBellyDrum(move: Move, user: Slot): Promise<void> {
    const s = this.state;
    const mon = s.monAt(user)!;
    s.log.set(`${mon.name} setzt ${move.name} ein...`);
    this.audio.playMove(move.showdownId);
    if (!canBellyDrum(mon)) {
      await this.stage.wait(500);
      s.log.set('Aber es misslang!');
      await this.stage.wait(700);
      return;
    }
    s.applyHp(user, -bellyDrumCost(mon));
    const foe = livingFoes(user, s.field())[0] ?? user;
    await this.animation.playMove(move, this.stage.refsFor(user, foe));
    s.patchSlot(user, { boosts: { ...s.monAt(user)!.boosts, atk: 6 } });
    s.log.set(`${mon.name} halbiert seine KP und maximiert seinen Angriff!`);
    await this.stage.wait(800);
    await this.runBerryChecks([user]); // the HP cost can trigger a pinch berry
  }

  /**
   * Baton Pass: the baton is tossed and caught, then the flow swaps the user
   * for a reserve that inherits its stat stages, confusion and Substitute.
   * Fails without a healthy reserve.
   */
  private async performBatonPass(move: Move, user: Slot): Promise<void> {
    const s = this.state;
    s.log.set(`${s.monAt(user)!.name} setzt ${move.name} ein...`);
    this.audio.playMove(move.showdownId);
    if (!s.bench(user.side).length) {
      await this.stage.wait(500);
      s.log.set('Aber es misslang!');
      await this.stage.wait(700);
      return;
    }
    const foe = livingFoes(user, s.field())[0] ?? user;
    await this.animation.playMove(move, this.stage.refsFor(user, foe));
    s.batonPasses.push(user);
  }

  /**
   * Substitute: pay a quarter of max HP for a doll with that much HP. Fails
   * with a doll already up or too little HP left.
   */
  private async performSubstitute(move: Move, user: Slot): Promise<void> {
    const s = this.state;
    const mon = s.monAt(user)!;
    s.log.set(`${mon.name} setzt ${move.name} ein...`);
    this.audio.playMove(move.showdownId);

    let fail: string | null = null;
    if (s.substituteOf(user) > 0) fail = `${mon.name} hat bereits einen Delegator!`;
    else if (!canAffordSubstitute(mon)) fail = `Aber ${mon.name} hat zu wenig KP für einen Delegator!`;
    if (fail) {
      await this.stage.wait(500);
      s.log.set(fail);
      await this.stage.wait(700);
      return;
    }

    const cost = substituteCost(mon);
    s.applyHp(user, -cost);
    await this.animation.playSubstitute(this.stage.spriteEl(user), this.stage.fxEl, this.stage.fieldEl, () =>
      s.setSubstitute(user, cost)
    );
    s.log.set(`${mon.name} setzt einen Delegator ein!`);
    await this.stage.wait(700);
    await this.runBerryChecks([user]); // the HP cost can trigger a pinch berry
  }

  /** Let berries / White Herb react to HP, status or stat changes, one log line each. */
  async runBerryChecks(slots: Slot[]): Promise<void> {
    for (const slot of slots) {
      const mon = this.state.monAt(slot);
      if (!mon || mon.currentHp <= 0) continue;
      const trigger = berryCheck(mon);
      if (!trigger) continue;
      this.state.patchSlot(slot, trigger.patch);
      await this.stage.wait(700);
      this.state.log.set(trigger.message);
      await this.stage.wait(850);
    }
  }

  /**
   * Protect / Detect / King's Shield on the target, or Wide / Quick Guard on its
   * side, stop `move`. Plays the block and returns true when it's stopped.
   */
  private async blockedByProtection(move: Move, user: Slot, t: Slot): Promise<boolean> {
    const s = this.state;
    const tm = s.monAt(t)!;
    const prot = s.protectedSlots.get(slotKey(t));
    const guard = s.sideGuards[t.side];
    let msg: string | null = null;

    if (prot && t.side !== user.side && protectBlocks(prot, move)) {
      msg = `${tm.name} hat sich geschützt!`;
      if (prot === 'kingsshield' && isContactMove(move)) {
        const atk = s.monAt(user)!;
        const res = this.statChange.apply(atk.boosts, { atk: -1 });
        s.patchSlot(user, { boosts: res.boosts });
        for (const ch of res.changes) msg += ` ${statChangeMessage(atk.name, ch)}`;
      }
    } else if (guard.wide && isSpreadMove(move) && protectBlocks('wideguard', move)) {
      msg = `Rundumschutz hat ${tm.name} geschützt!`;
    } else if (
      guard.quick &&
      t.side !== user.side &&
      this.damageCalc.movePriority(move) > 0 &&
      protectBlocks('quickguard', move)
    ) {
      msg = `Rapidschutz hat ${tm.name} geschützt!`;
    }
    if (!msg) return false;

    await this.stage.wait(400);
    await this.animation.playShield(this.stage.spriteEl(t), this.stage.fxEl, this.stage.fieldEl);
    s.log.set(msg);
    await this.stage.wait(700);
    return true;
  }

  /** Protect family, Wide / Quick Guard, Helping Hand, Follow Me / Rage Powder. */
  private async performSupportMove(move: Move, user: Slot, streakKey: string): Promise<void> {
    const s = this.state;
    const id = move.showdownId;
    const name = s.monAt(user)!.name;
    const fx = this.stage.fxEl;
    const fieldEl = this.stage.fieldEl;
    s.log.set(`${name} setzt ${move.name} ein...`);
    this.audio.playMove(id);

    const fail = async () => {
      await this.stage.wait(500);
      s.log.set('Aber es misslang!');
      await this.stage.wait(700);
    };

    if (PROTECT_MOVES.has(id)) {
      const streak = s.protectStreak[streakKey] ?? 0;
      if (Math.random() >= protectSuccessChance(streak)) {
        s.protectStreak[streakKey] = 0;
        return fail();
      }
      s.protectStreak[streakKey] = streak + 1;
      s.protectedSlots.set(slotKey(user), id);
      if (this.animation.hasCustomAnimation(move)) {
        await this.animation.playMove(move, this.stage.refsFor(user, livingFoes(user, s.field())[0] ?? user));
      } else {
        await this.animation.playShield(
          this.stage.spriteEl(user),
          fx,
          fieldEl,
          id === 'kingsshield' ? '#c9b458' : '#7fd3ff'
        );
      }
      s.log.set(`${name} schützt sich selbst!`);
      await this.stage.wait(700);
      return;
    }

    if (SIDE_GUARD_MOVES.has(id)) {
      const wide = id === 'wideguard';
      if (wide) s.sideGuards[user.side].wide = true;
      else s.sideGuards[user.side].quick = true;
      await Promise.all(
        livingSlots(user.side, s.field()).map((slot) =>
          this.animation.playShield(this.stage.spriteEl(slot), fx, fieldEl, wide ? '#b98a4b' : '#e0703c')
        )
      );
      const team = user.side === 'player' ? 'dein Team' : 'das gegnerische Team';
      s.log.set(`${move.name} schützt ${team}!`);
      await this.stage.wait(700);
      return;
    }

    if (id === 'helpinghand') {
      const ally = livingAlly(user, s.field());
      if (!ally || s.moved.has(slotKey(ally))) return fail();
      s.helpingHand.add(slotKey(ally));
      await this.animation.playMove(move, this.stage.refsFor(user, ally));
      s.log.set(`${name} möchte ${s.monAt(ally)!.name} helfen!`);
      await this.stage.wait(700);
      return;
    }

    // Follow Me / Rage Powder: only meaningful with a partner to shield.
    if (!s.isDoubles()) return fail();
    s.redirector[user.side] = { slot: user, kind: id === 'ragepowder' ? 'ragepowder' : 'followme' };
    await this.animation.playMove(move, this.stage.refsFor(user, user));
    s.log.set(`${name} zieht alle Aufmerksamkeit auf sich!`);
    await this.stage.wait(700);
  }

  /** Moves that only affect the user or the field (Swords Dance, Recover, Rest, Spikes …). */
  private async performSelfMove(move: Move, user: Slot, phase: 'release' | undefined): Promise<void> {
    const s = this.state;
    const me = () => s.monAt(user)!;
    s.log.set(`${me().name} setzt ${move.name} ein...`);
    this.audio.playMove(move.showdownId);
    const foe = livingFoes(user, s.field())[0] ?? user;
    await this.animation.playMove(move, this.stage.refsFor(user, foe), phase);

    const recovery = this.damageCalc.calculateRecovery(move, me(), 0);
    if (recovery.amount > 0) s.applyHp(user, recovery.amount);

    // Rest also puts the user to sleep for two turns.
    if (move.showdownId === 'rest' && recovery.amount > 0) {
      s.patchSlot(user, { status: { ...me().status, major: 'slp', sleepTurns: 3, toxicTurns: 0 } });
    }

    const statLogs: string[] = [];
    const sc = this.statChange.resolve(move, me().types, 0);
    if (Object.keys(sc.toUser).length) {
      const res = this.statChange.apply(me().boosts, sc.toUser);
      s.patchSlot(user, { boosts: res.boosts });
      for (const ch of res.changes) statLogs.push(statChangeMessage(me().name, ch));
    }

    let line: string;
    if (recovery.kind === 'selfHeal' && recovery.amount > 0) line = `${me().name} füllt seine KP auf!`;
    else if (recovery.kind === 'selfHeal') line = 'Aber es misslang!';
    else if (statLogs.length) line = statLogs.shift() as string;
    else line = `${move.name} zeigt keine Wirkung …`;
    s.log.set(line);

    for (const msg of statLogs) {
      await this.stage.wait(850);
      s.log.set(msg);
    }
    await this.runBerryChecks([user]); // Rest + Chesto Berry, Curse + White Herb …
    this.queueRecharge(user, move);
  }

  /**
   * If `move` is a recharge move (Hyper Beam …), park it on the acting slot so
   * the next round plays out the mandatory rest turn. Cleared when the Pokémon
   * faints or switches out.
   */
  private queueRecharge(slot: Slot, move: Move): void {
    if (!this.damageCalc.needsRecharge(move)) return;
    this.state.setCharge(slot, { move, semiInvuln: false, recharge: true });
  }
}
