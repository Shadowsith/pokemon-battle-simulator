import { Injectable, inject } from '@angular/core';
import { Move } from '../../../core/models/move.model';
import { freshBoosts } from '../../../core/models/pokemon.model';
import {
  Slot,
  SlotPos,
  livingAlly,
  livingSlots,
  orderActions,
  positions,
  slotKey
} from '../../../core/battle/battle-format';
import { chooseNpcMove, pickSwitchIn } from '../../../core/battle/npc-ai';
import { residualItem } from '../../../core/battle/item-effects';
import { AudioService } from '../../../core/services/audio.service';
import { DamageCalcService } from '../../../core/services/damage-calc.service';
import { MoveAnimationService } from '../../../core/services/move-animation.service';
import { StatusService } from '../../../core/services/status.service';
import { Command, TurnAction } from '../battle.types';
import { BattleSetupService } from './battle-setup.service';
import { BattleStageService } from './battle-stage.service';
import { BattleStateService } from './battle-state.service';
import { MoveResolverService } from './move-resolver.service';

/**
 * The battle's course: intro and send-out, collecting commands, running each
 * round in turn order, end-of-turn effects, faints, replacements and the result.
 */
@Injectable()
export class BattleFlowService {
  private readonly state = inject(BattleStateService);
  private readonly stage = inject(BattleStageService);
  private readonly setup = inject(BattleSetupService);
  private readonly resolver = inject(MoveResolverService);
  private readonly damageCalc = inject(DamageCalcService);
  private readonly status = inject(StatusService);
  private readonly animation = inject(MoveAnimationService);
  private readonly audio = inject(AudioService);

  private introTimer: ReturnType<typeof setTimeout> | null = null;

  // --- battle lifecycle -------------------------------------------------

  /** Set up a fresh battle and show the VS intro. */
  async startBattle(): Promise<void> {
    if (this.introTimer) clearTimeout(this.introTimer);
    const introMs = await this.setup.prepare();
    this.introTimer = setTimeout(() => this.beginFight(), introMs);
  }

  /** Stop the intro timer and the music when the page goes away. */
  dispose(): void {
    if (this.introTimer) clearTimeout(this.introTimer);
    this.audio.stopBattleMusic();
  }

  /**
   * Dismiss the intro and stage the send-out: the opponent throws their ball(s)
   * first (cry after each ball animation), then the player throws theirs.
   */
  async beginFight(): Promise<void> {
    const s = this.state;
    if (this.introTimer) {
      clearTimeout(this.introTimer);
      this.introTimer = null;
    }
    if (s.phase() !== 'intro') return;

    s.isAnimating.set(true);
    s.phase.set('fight');

    if (this.setup.opponentRoll) await this.setup.opponentRoll; // the NPC party must be rolled before send-out
    await this.stage.wait(30); // let the slot sprites render

    const fx = this.stage.fxEl;
    const field = this.stage.fieldEl;
    const oppSlots = livingSlots('opponent', s.field());
    const playerSlots = livingSlots('player', s.field());
    for (const slot of [...oppSlots, ...playerSlots]) this.stage.spriteEl(slot).style.opacity = '0';

    const names = (slots: Slot[]) => slots.map((slot) => s.monAt(slot)!.name).join(' und ');
    s.log.set(`${s.npcName()} schickt ${names(oppSlots)} in den Kampf!`);
    for (const slot of oppSlots) {
      await this.animation.playSendOut(this.stage.spriteEl(slot), fx, field, 'opponent');
      await this.stage.wait(150);
      this.audio.playCry(s.monAt(slot)!.dexId);
      await this.stage.wait(oppSlots.length > 1 ? 350 : 550);
    }

    s.log.set(`Los, ${names(playerSlots)}!`);
    for (const slot of playerSlots) {
      await this.animation.playSendOut(this.stage.spriteEl(slot), fx, field, 'player');
      await this.stage.wait(150);
      this.audio.playCry(s.monAt(slot)!.dexId);
      await this.stage.wait(playerSlots.length > 1 ? 250 : 300);
    }

    await this.beginCommandPhase(true);
  }

  private endBattle(outcome: 'win' | 'loss'): void {
    const s = this.state;
    this.audio.stopBattleMusic();
    s.outcome.set(outcome);
    s.isAnimating.set(false);
    s.menuState.set('main');
    s.replacingPos.set(null);
    s.log.set(
      outcome === 'win'
        ? `${s.npcName()} wurde besiegt!`
        : `${s.isDoubles() ? 'Dein Team' : s.player().name} wurde besiegt!`
    );
    s.phase.set('result');
  }

  // --- command phase ------------------------------------------------------

  /** Next player position (after `after`) that needs a command this turn. */
  private nextCommandPos(after: number): SlotPos | null {
    for (const pos of positions(this.state.format())) {
      if (pos <= after) continue;
      const slot: Slot = { side: 'player', pos };
      if (this.state.alive(slot) && !this.state.chargeOf(slot)) return pos;
    }
    return null;
  }

  /**
   * Start collecting the player's commands for a new turn (or auto-run locked
   * turns). `announce` puts "Was wird X tun?" in the log; after a normal round
   * the last result line stays readable instead (doubles shows whose turn it is
   * above the menu).
   */
  private async beginCommandPhase(announce = false): Promise<void> {
    const s = this.state;
    s.commands.set([]);
    s.commandHistory.set([]);
    s.pendingMove.set(null);
    const first = this.nextCommandPos(-1);
    if (first === null) {
      // Every living player Pokémon is locked into a charge / recharge turn.
      await this.stage.wait(650);
      await this.executeTurn();
      return;
    }
    s.actingPos.set(first);
    s.menuState.set('main');
    if (announce) s.log.set(`Was wird ${s.player().name} tun?`);
    s.isAnimating.set(false);
  }

  /** Record the acting Pokémon's command; ask the next one or start the turn. */
  async commit(cmd: Command): Promise<void> {
    const s = this.state;
    const pos = s.actingPos();
    s.commands.update((c) => {
      const next = [...c];
      next[pos] = cmd;
      return next;
    });
    s.commandHistory.update((h) => [...h, pos]);
    const next = this.nextCommandPos(pos);
    if (next !== null) {
      s.actingPos.set(next);
      s.menuState.set('main');
      return;
    }
    await this.executeTurn();
  }

  // --- turns ----------------------------------------------------------

  /** The NPC's move for the Pokémon in `slot`. */
  private npcAction(slot: Slot): TurnAction {
    const s = this.state;
    const idx = s.partyIdxAt(slot);
    const user = s.monAt(slot)!;
    const ally = livingAlly(slot, s.field());
    const known = s.movesFor('opponent', idx);
    const allowed = known.filter((m) => !s.itemLockReason('opponent', idx, user, m));
    const choice = chooseNpcMove({
      calc: this.damageCalc,
      field: s.field(),
      slot,
      user,
      moves: allowed.length ? allowed : known,
      monAt: (x) => s.monAt(x),
      allyMoves: ally ? s.movesFor('opponent', s.partyIdxAt(ally)) : [],
      protectStreak: s.protectStreak[s.streakKey(slot)] ?? 0
    });
    return this.moveAction(slot, choice.move, choice.target);
  }

  private moveAction(slot: Slot, move: Move, target: Slot | null): TurnAction {
    return {
      slot,
      partyIdx: this.state.partyIdxAt(slot),
      kind: 'move',
      move,
      target,
      priority: this.damageCalc.movePriority(move),
      speed: this.damageCalc.effectiveSpeed(this.state.monAt(slot)!)
    };
  }

  /**
   * One round: collect every active Pokémon's action (player commands, NPC
   * picks, locked charge / recharge turns), run them in turn order, then
   * {@link finishRound}.
   */
  private async executeTurn(): Promise<void> {
    const s = this.state;
    s.isAnimating.set(true);
    s.menuState.set('main');
    s.pendingMove.set(null);
    s.clearTurnVolatiles();

    const actions: TurnAction[] = [];
    const cmds = s.commands();
    for (const side of ['player', 'opponent'] as const) {
      for (const pos of positions(s.format())) {
        const slot: Slot = { side, pos };
        if (!s.alive(slot)) continue;
        const locked = s.chargeOf(slot);
        if (locked) {
          actions.push(this.moveAction(slot, locked.move, locked.target ?? null));
          continue;
        }
        if (side === 'opponent') {
          actions.push(this.npcAction(slot));
          continue;
        }
        const cmd = cmds[pos];
        if (!cmd) continue;
        if (cmd.kind === 'switch') {
          actions.push({
            slot,
            partyIdx: s.partyIdxAt(slot),
            kind: 'switch',
            switchTo: cmd.to,
            priority: 0,
            speed: this.damageCalc.effectiveSpeed(s.monAt(slot)!)
          });
        } else {
          // PP is spent when the move is committed (the charge turn), not on release.
          const key = `${s.partyIdxAt(slot)}:${cmd.move.showdownId}`;
          const remaining = s.movePp()[key] ?? this.damageCalc.maxPp(cmd.move);
          s.movePp.update((m) => ({ ...m, [key]: remaining - 1 }));
          actions.push(this.moveAction(slot, cmd.move, cmd.target));
        }
      }
    }
    s.commands.set([]);
    s.commandHistory.set([]);

    let first = true;
    for (const a of orderActions(actions)) {
      if (s.battleDecided()) break;
      if (s.partyIdxAt(a.slot) !== a.partyIdx || !s.alive(a.slot)) continue; // KO'd or switched out
      if (!first) await this.stage.wait(550);
      first = false;
      if (a.kind === 'switch') {
        await this.switchSlot(a.slot, a.switchTo!);
      } else {
        await this.resolver.performMove(a.move!, a.slot, a.target ?? null);
      }
      s.moved.add(slotKey(a.slot));
      await this.settleFaints();
    }

    await this.finishRound();
  }

  /** End-of-turn status damage, then win / loss / replacements / the next turn. */
  private async finishRound(): Promise<void> {
    await this.settleFaints();
    if (await this.checkEnd()) return;

    await this.applyResiduals();
    await this.settleFaints();
    if (await this.checkEnd()) return;

    await this.replaceFaintedOpponents();
    await this.startReplacements();
  }

  private async checkEnd(): Promise<boolean> {
    if (this.state.opponentTeam().every((p) => p.currentHp <= 0)) {
      await this.stage.wait(350);
      this.endBattle('win');
      return true;
    }
    if (this.state.playerTeam().every((p) => p.currentHp <= 0)) {
      await this.stage.wait(350);
      this.endBattle('loss');
      return true;
    }
    return false;
  }

  /** End-of-turn burn / poison / toxic damage on every active Pokémon, fastest first. */
  private async applyResiduals(): Promise<void> {
    const s = this.state;
    const slots = [...livingSlots('player', s.field()), ...livingSlots('opponent', s.field())].sort(
      (a, b) => this.damageCalc.effectiveSpeed(s.monAt(b)!) - this.damageCalc.effectiveSpeed(s.monAt(a)!)
    );
    for (const slot of slots) {
      const mon = s.monAt(slot);
      if (!mon || mon.currentHp <= 0) continue;
      if (mon.status.major) {
        const r = this.status.residual(mon);
        s.patchSlot(slot, { status: r.status });
        if (r.damage > 0) {
          s.applyHp(slot, -r.damage);
          if (r.message) s.log.set(r.message);
          await this.stage.wait(800);
        }
      }
      // Leftovers / Black Sludge.
      const now = s.monAt(slot);
      const item = now ? residualItem(now) : null;
      if (item) {
        s.applyHp(slot, item.delta);
        s.patchSlot(slot, { itemRevealed: true });
        s.log.set(item.message);
        await this.stage.wait(800);
      }
      await this.resolver.runBerryChecks([slot]);
    }
  }

  /** Play the faint drop for any active Pokémon that just hit 0 HP (once). */
  private async settleFaints(): Promise<void> {
    const s = this.state;
    for (const side of ['player', 'opponent'] as const) {
      for (const pos of positions(s.format())) {
        const slot: Slot = { side, pos };
        const mon = s.monAt(slot);
        const key = slotKey(slot);
        if (!mon || mon.currentHp > 0 || s.faintDone[key]) continue;
        s.faintDone[key] = true;
        s.setCharge(slot, null); // a fainted Pokémon drops any charge
        s.log.set(`${mon.name} wurde besiegt!`);
        await this.stage.wait(250);
        this.audio.playCry(mon.dexId, true);
        await this.animation.playFaint(this.stage.spriteEl(slot));
      }
    }
  }

  // --- switching ------------------------------------------------------

  /** The NPC sends in its best matchup for every fainted position. */
  private async replaceFaintedOpponents(): Promise<void> {
    const s = this.state;
    for (const pos of positions(s.format())) {
      const slot: Slot = { side: 'opponent', pos };
      if (s.alive(slot)) continue;
      const foes = livingSlots('player', s.field()).map((x) => s.monAt(x)!);
      const next = pickSwitchIn(
        this.damageCalc,
        s.opponentTeam(),
        s.opponentMovesets(),
        foes.length ? foes : [s.player()],
        new Set(s.activeOpponent())
      );
      if (next < 0) continue; // nobody left - the position stays empty
      await this.stage.wait(600);
      s.setCharge(slot, null);
      await this.sendIn(slot, next);
    }
  }

  /** Ask the player to refill fainted positions, one at a time; then start the next turn. */
  async startReplacements(afterSendIn = false): Promise<void> {
    const s = this.state;
    const bench = s.bench('player');
    const pos = positions(s.format()).find((p) => !s.alive({ side: 'player', pos: p }));
    if (pos === undefined || !bench.length) {
      s.replacingPos.set(null);
      await this.beginCommandPhase(afterSendIn);
      return;
    }
    s.replacingPos.set(pos);
    s.menuState.set('pokemon');
    s.log.set('Welches Pokémon soll in den Kampf?');
    s.isAnimating.set(false);
  }

  /** Bring a fresh Pokémon into a slot whose occupant fainted (no recall). */
  async sendIn(slot: Slot, partyIdx: number): Promise<void> {
    const s = this.state;
    s.setActive(slot.side, slot.pos, partyIdx);
    s.faintDone[slotKey(slot)] = false;
    const el = this.stage.spriteEl(slot);
    el.getAnimations?.().forEach((a) => a.cancel());
    el.style.opacity = '0';
    el.style.transform = '';
    el.style.filter = '';
    await this.stage.wait(60); // let the sprite src rebind before it grows in
    const mon = s.monAt(slot)!;
    s.log.set(slot.side === 'player' ? `Los, ${mon.name}!` : `${s.npcName()} schickt ${mon.name} in den Kampf!`);
    await this.animation.playSendOut(el, this.stage.fxEl, this.stage.fieldEl, slot.side);
    await this.stage.wait(120);
    this.audio.playCry(mon.dexId);
    await this.stage.wait(250);
  }

  /** A voluntary switch during a turn: recall the current Pokémon, send in `to`. */
  async switchSlot(slot: Slot, to: number): Promise<void> {
    const s = this.state;
    const out = s.monAt(slot);
    if (!out || s.teamOf(slot.side)[to]?.currentHp <= 0 || s.activeOf(slot.side).includes(to)) return;
    // Switching out clears volatiles: confusion ends, the toxic counter resets,
    // all stat stages are lost, and a two-turn move is cancelled.
    s.patchSlot(slot, {
      status: { ...out.status, confusionTurns: 0, toxicTurns: out.status.major === 'tox' ? 1 : 0 },
      boosts: freshBoosts()
    });
    s.protectStreak[s.streakKey(slot)] = 0;
    s.clearChoiceLock(slot);
    s.setCharge(slot, null);
    s.log.set(`${out.name}, komm zurück!`);
    await this.animation.playRecall(this.stage.spriteEl(slot), this.stage.fxEl, this.stage.fieldEl, slot.side);
    await this.sendIn(slot, to);
  }
}
