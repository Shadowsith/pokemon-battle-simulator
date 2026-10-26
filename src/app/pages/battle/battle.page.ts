import { Component, ElementRef, OnDestroy, OnInit, ViewChild, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { IonContent, IonButton } from '@ionic/angular/standalone';
import { Move } from '../../core/models/move.model';
import {
  BattlePokemon,
  STAT_META,
  STATUS_META,
  StatKey,
  backSpritePath,
  freshBoosts,
  freshStatus,
  frontSpritePath,
  typeColor
} from '../../core/models/pokemon.model';
import { trainerAvatarPath } from '../../core/models/trainer.model';
import { SpeciesInfo } from '../../core/models/team.model';
import { toBattlePokemon } from '../../core/models/battle-pokemon';
import {
  Side,
  Slot,
  livingFoes,
  needsTargetChoice,
  otherSide,
  positions,
  slotKey,
  targetChoices
} from '../../core/battle/battle-format';
import { heldItem } from '../../core/models/item.model';
import { ItemIconComponent } from '../../shared/item-icon/item-icon.component';
import { DebugPanelComponent } from './debug-panel/debug-panel.component';
import { AudioService } from '../../core/services/audio.service';
import { DamageCalcService } from '../../core/services/damage-calc.service';
import { MoveAnimationService } from '../../core/services/move-animation.service';
import { SettingsService } from '../../core/services/settings.service';
import { TeamService } from '../../core/services/team.service';
import { MoveHint, SlotView } from './battle.types';
import { BattleFlowService } from './services/battle-flow.service';
import { BattleSetupService } from './services/battle-setup.service';
import { BattleStageService } from './services/battle-stage.service';
import { BattleStateService } from './services/battle-state.service';
import { MoveResolverService } from './services/move-resolver.service';

/**
 * The battle screen: view models for the template and the player's input.
 * The battle itself runs in the page-scoped services in `./services`.
 */
@Component({
  selector: 'app-battle',
  standalone: true,
  imports: [IonContent, IonButton, ItemIconComponent, DebugPanelComponent],
  providers: [BattleStateService, BattleStageService, BattleSetupService, MoveResolverService, BattleFlowService],
  templateUrl: './battle.page.html',
  styleUrls: ['./battle.page.scss', './battle-portrait.scss']
})
export class BattlePage implements OnInit, OnDestroy {
  @ViewChild('field', { static: true }) fieldRef!: ElementRef<HTMLElement>;
  @ViewChild('fx', { static: true }) fxRef!: ElementRef<HTMLElement>;
  @ViewChild('screenFx', { static: true }) screenFxRef!: ElementRef<HTMLElement>;

  private readonly router = inject(Router);
  private readonly settings = inject(SettingsService);
  private readonly teamService = inject(TeamService);
  private readonly animation = inject(MoveAnimationService);
  private readonly audio = inject(AudioService);
  private readonly damageCalc = inject(DamageCalcService);
  private readonly state = inject(BattleStateService);
  private readonly stage = inject(BattleStageService);
  private readonly setup = inject(BattleSetupService);
  private readonly resolver = inject(MoveResolverService);
  private readonly flow = inject(BattleFlowService);

  readonly debug = this.state.debug;
  readonly inCustomBattle = this.setup.customBattle !== null;
  readonly inChallengeBattle = this.setup.challenge !== null;
  readonly gymTitle = this.setup.gymTitle;

  /** Every Pokémon in this simulator battles at level 100. */
  readonly level = this.damageCalc.level;

  /** Status badge / stat-stage presentation, used by the template. */
  readonly statusMeta = STATUS_META;
  readonly statMeta = STAT_META;

  // --- battle state, as read by the template ---
  readonly log = this.state.log;
  readonly isAnimating = this.state.isAnimating;
  readonly menuState = this.state.menuState;
  readonly phase = this.state.phase;
  readonly outcome = this.state.outcome;
  readonly format = this.state.format;
  readonly isDoubles = this.state.isDoubles;
  readonly playerTeam = this.state.playerTeam;
  readonly activePlayer = this.state.activePlayer;
  readonly opponentTeam = this.state.opponentTeam;
  readonly activeOpponent = this.state.activeOpponent;
  readonly actingPos = this.state.actingPos;
  readonly pendingMove = this.state.pendingMove;
  readonly replacingPos = this.state.replacingPos;
  readonly player = this.state.player;
  readonly activePlayerIndex = this.state.activePlayerIndex;
  readonly opponent = this.state.opponent;
  readonly npcName = this.state.npcName;

  /** true when the fight is using the player's active team rather than the prototype trio. */
  readonly usingBuiltTeam = computed(() => this.teamService.activeReady());

  /** Moves shown in the fight menu for the acting Pokémon. */
  readonly activeMoves = computed<Move[]>(() => this.state.movesFor('player', this.activePlayerIndex()));

  /** The fight menu's moves with PP and effectiveness hints vs the foe(s). */
  readonly activeMoveViews = computed(() => {
    const pp = this.state.movePp();
    const idx = this.activePlayerIndex();
    const user: Slot = { side: 'player', pos: this.actingPos() };
    const foes = livingFoes(user, this.state.field())
      .map((s) => this.state.monAt(s))
      .filter((m): m is BattlePokemon => !!m);
    const holder = this.playerTeam()[idx];
    return this.activeMoves().map((move) => {
      const max = this.damageCalc.maxPp(move);
      const key = `${idx}:${move.showdownId}`;
      const locked = holder ? this.state.itemLockReason('player', idx, holder, move) : null;
      return { move, max, cur: pp[key] ?? max, hints: this.moveHints(move, foes), locked };
    });
  });

  /** Target buttons for the pending single-target move. */
  readonly targetOptions = computed(() => {
    const move = this.pendingMove();
    if (!move) return [];
    const user: Slot = { side: 'player', pos: this.actingPos() };
    return targetChoices(move, user, this.state.field()).map((slot) => ({
      slot,
      key: slotKey(slot),
      mon: this.state.monAt(slot)!,
      ally: slot.side === 'player'
    }));
  });

  /** "Zurück" in the main menu undoes the previous Pokémon's command (doubles). */
  readonly undoTarget = computed(() => {
    const hist = this.state.commandHistory();
    if (!hist.length || this.replacingPos() !== null) return null;
    const pos = hist[hist.length - 1];
    return this.playerTeam()[this.activePlayer()[pos]] ?? null;
  });

  /** Doubles: whose command is being chosen, shown above the menu. */
  readonly commandPrompt = computed(() => {
    if (!this.isDoubles() || this.phase() !== 'fight' || this.isAnimating() || this.replacingPos() !== null) {
      return null;
    }
    const open = positions(this.format()).filter((pos) => this.state.alive({ side: 'player', pos })).length;
    const step = this.state.commandHistory().length + 1;
    return open > 1 ? `${this.player().name} ist am Zug (${step}/${open})` : `${this.player().name} ist am Zug`;
  });

  readonly playerSlotViews = computed(() => this.slotViews('player'));
  readonly opponentSlotViews = computed(() => this.slotViews('opponent'));

  /** Six Poké Ball emblems per side: owned / active / knocked-out. */
  readonly playerEmblems = computed(() => this.emblems(this.playerTeam(), this.activePlayer()));
  readonly opponentEmblems = computed(() => this.emblems(this.opponentTeam(), this.activeOpponent()));

  /** Trainer avatars shown on the intro and result screens. */
  readonly playerAvatar = computed(() => trainerAvatarPath(this.settings.trainerAvatar()));
  readonly npcAvatar = computed(() => trainerAvatarPath(this.state.npcAvatarId()));

  /** The log line the target question replaced, restored when the menu closes. */
  private logBeforeTarget = '';

  ngOnInit(): void {
    this.stage.attach(this.fieldRef.nativeElement, this.fxRef.nativeElement, this.screenFxRef.nativeElement);
    this.flow.startBattle();
  }

  ngOnDestroy(): void {
    this.flow.dispose();
  }

  monAt(slot: Slot): BattlePokemon | null {
    return this.state.monAt(slot);
  }

  private slotViews(side: Side): SlotView[] {
    const active = side === 'player' ? this.activePlayer() : this.activeOpponent();
    const team = side === 'player' ? this.playerTeam() : this.opponentTeam();
    const commanding = this.phase() === 'fight' && !this.isAnimating() && this.isDoubles();
    return positions(this.format())
      .map((pos) => {
        const mon = team[active[pos]];
        const slot: Slot = { side, pos };
        return mon
          ? {
              slot,
              key: slotKey(slot),
              mon,
              acting: commanding && side === 'player' && pos === this.actingPos()
            }
          : null;
      })
      .filter((v): v is SlotView => v !== null);
  }

  private moveHints(move: Move, foes: BattlePokemon[]): MoveHint[] {
    if (this.damageCalc.isStatusMove(move)) {
      return [{ kind: 'status', label: 'Status', short: 'Status', foe: null }];
    }
    const hints = foes.map((foe) => {
      const e = this.damageCalc.effectiveness(move, foe);
      const h: Omit<MoveHint, 'foe'> =
        e === 0
          ? { kind: 'immune', label: 'Wirkungslos', short: 'Keine' }
          : e < 1
            ? { kind: 'weak', label: 'Wenig Wirkung', short: 'Wenig' }
            : e > 1
              ? { kind: 'strong', label: 'Sehr effektiv', short: 'Sehr eff.' }
              : { kind: 'neutral', label: 'Effektiv', short: 'Normal' };
      return { ...h, foe: foe.name };
    });
    return hints.length ? hints : [{ kind: 'neutral', label: 'Effektiv', short: 'Normal', foe: null }];
  }

  private emblems(team: BattlePokemon[], active: number[]) {
    return Array.from({ length: 6 }, (_, i) => {
      const mon = team[i];
      return { owned: !!mon, fainted: !!mon && mon.currentHp <= 0, active: !!mon && active.includes(i) };
    });
  }

  spriteSrc(view: SlotView): string {
    return view.slot.side === 'player' ? backSpritePath(view.mon.dexId) : frontSpritePath(view.mon.dexId);
  }

  partySpriteSrc(pokemon: BattlePokemon): string {
    return frontSpritePath(pokemon.dexId);
  }

  // --- battle lifecycle -------------------------------------------------

  beginFight(): Promise<void> {
    return this.flow.beginFight();
  }

  resetBattle(): void {
    this.flow.startBattle();
  }

  toTeamSelect(): void {
    this.router.navigateByUrl('/team-select');
  }

  /** Run leg over: report the outcome and hand back to that mode's run screen. */
  challengeContinue(): void {
    const challenge = this.setup.challenge;
    if (!challenge) return;
    const { svc } = challenge;
    const won = this.outcome() === 'win';
    svc.recordOutcome(won, won ? this.setup.snapshotRunCarry() : null);
    this.router.navigate([svc.route], { queryParams: { resume: 1 } });
  }

  // --- command phase ------------------------------------------------------

  private canCommand(): boolean {
    return this.phase() === 'fight' && !this.isAnimating() && this.replacingPos() === null;
  }

  async useMove(move: Move): Promise<void> {
    if (!this.canCommand()) return;

    const key = `${this.activePlayerIndex()}:${move.showdownId}`;
    const remaining = this.state.movePp()[key] ?? this.damageCalc.maxPp(move);
    if (remaining <= 0) {
      this.log.set(`${move.name} hat keine AP mehr übrig!`);
      return;
    }
    const blocked = this.state.itemLockReason('player', this.activePlayerIndex(), this.player(), move);
    if (blocked) {
      this.log.set(`${this.player().name} kann ${move.name} wegen ${blocked} nicht einsetzen!`);
      return;
    }
    const user: Slot = { side: 'player', pos: this.actingPos() };
    if (needsTargetChoice(move, user, this.state.field())) {
      this.pendingMove.set(move);
      this.menuState.set('target');
      this.logBeforeTarget = this.log();
      this.log.set(`Welches Ziel soll ${this.player().name} angreifen?`);
      return;
    }
    await this.flow.commit({ kind: 'move', move, target: null });
  }

  async chooseTarget(slot: Slot): Promise<void> {
    const move = this.pendingMove();
    if (!move || !this.canCommand()) return;
    this.pendingMove.set(null);
    this.log.set(this.logBeforeTarget);
    await this.flow.commit({ kind: 'move', move, target: slot });
  }

  /** Doubles: take back the previous Pokémon's command. */
  undoCommand(): void {
    const hist = this.state.commandHistory();
    if (!hist.length || !this.canCommand()) return;
    const pos = hist[hist.length - 1];
    this.state.commandHistory.set(hist.slice(0, -1));
    this.state.commands.update((c) => c.map((cmd, i) => (i === pos ? null : cmd)));
    this.pendingMove.set(null);
    this.actingPos.set(pos);
    this.menuState.set('main');
  }

  // --- Debug-Kampf (driven by the debug panel; singles, position 0 only) ---

  private debugSlot(side: Side): Slot {
    return { side, pos: 0 };
  }

  private debugReady(): boolean {
    return this.debug && this.phase() === 'fight' && !this.isAnimating();
  }

  /**
   * One move from `side`. Without battle logic only its animation and sound
   * play (a charge move shows both turns); with logic it resolves fully via
   * the move resolver. A pending charge / recharge turn takes precedence,
   * just as in a real turn.
   */
  async debugUseMove(e: { side: Side; move: Move; logic: boolean }): Promise<void> {
    if (!this.debugReady()) return;
    const user = this.debugSlot(e.side);
    const foe = this.debugSlot(otherSide(e.side));
    this.isAnimating.set(true);
    try {
      if (e.logic) {
        // Each side acting once makes a turn: Protect, Helping Hand … end when a side acts again.
        if (this.state.moved.has(slotKey(user))) this.state.clearTurnVolatiles();
        await this.resolver.performMove(this.state.chargeOf(user)?.move ?? e.move, user, foe);
        this.state.moved.add(slotKey(user));
      } else {
        this.log.set(`${this.state.monAt(user)!.name} setzt ${e.move.name} ein...`);
        this.audio.playMove(e.move.showdownId);
        const refs = this.stage.refsFor(user, foe);
        if (this.damageCalc.isChargeMove(e.move)) {
          await this.animation.playMove(e.move, refs, 'charge');
          await this.stage.wait(500);
          await this.animation.playMove(e.move, refs, 'release');
        } else {
          await this.animation.playMove(e.move, refs);
        }
      }
    } finally {
      this.isAnimating.set(false);
    }
  }

  /** Put a fresh `species` in the bench slot, then switch it in with the normal recall / send-out. */
  async debugSetPokemon(e: { side: Side; species: SpeciesInfo }): Promise<void> {
    if (!this.debugReady()) return;
    const slot = this.debugSlot(e.side);
    const bench = this.state.partyIdxAt(slot) === 0 ? 1 : 0;
    const mon = toBattlePokemon(
      { speciesNum: e.species.num, name: e.species.name, types: e.species.types },
      (dexId) => this.damageCalc.hpStat(dexId)
    );
    const put = (team: BattlePokemon[]) => {
      const next = [...team];
      next[bench] = mon;
      return next;
    };
    if (e.side === 'player') this.playerTeam.update(put);
    else this.opponentTeam.update(put);

    this.isAnimating.set(true);
    try {
      await this.flow.switchSlot(slot, bench);
    } finally {
      this.isAnimating.set(false);
    }
  }

  debugSetItem(e: { side: Side; item: string | null }): void {
    if (!this.debug) return;
    const slot = this.debugSlot(e.side);
    this.state.patchSlot(slot, { item: e.item, itemRevealed: true });
    this.state.clearChoiceLock(slot);
    const mon = this.state.monAt(slot)!;
    this.log.set(e.item ? `${mon.name} trägt jetzt ${heldItem(e.item)?.name ?? e.item}.` : `${mon.name} trägt kein Item.`);
  }

  /** Full HP, no status / stat changes / charge / Choice lock on both sides. */
  debugReset(): void {
    if (!this.debugReady()) return;
    for (const side of ['player', 'opponent'] as const) {
      const slot = this.debugSlot(side);
      this.state.patchSlot(slot, {
        currentHp: this.state.monAt(slot)!.maxHp,
        status: freshStatus(),
        boosts: freshBoosts()
      });
    }
    this.state.charge.set({});
    this.state.choiceLocks.set({});
    this.state.protectStreak = {};
    this.state.clearTurnVolatiles();
    this.log.set('Beide Pokémon wurden zurückgesetzt.');
  }

  debugPlayMusic(track: string): void {
    this.audio.playMusicTrack(track);
  }

  // --- template helpers -------------------------------------------------

  /** Type-coloured gradient for a move button (yellow for Electric, blue for Water …). */
  moveGradient(type: string): string {
    const c = typeColor(type);
    return `linear-gradient(140deg, ${c} 0%, ${shadeHex(c, -40)} 100%)`;
  }

  /** Non-zero stat stages for the HUD indicator row. */
  boostChips(mon: BattlePokemon): { stat: StatKey; stage: number }[] {
    return (Object.keys(mon.boosts) as StatKey[])
      .filter((k) => mon.boosts[k] !== 0)
      .map((stat) => ({ stat, stage: mon.boosts[stat] }));
  }

  // --- menus ------------------------------------------------------------

  openFightMenu(): void {
    if (!this.canCommand()) return;
    this.menuState.set('fight');
  }

  openPokemonMenu(): void {
    if (this.phase() !== 'fight' || this.isAnimating()) return;
    this.menuState.set('pokemon');
  }

  openBag(): void {
    if (this.isAnimating()) return;
    this.log.set('Der Beutel ist in diesem Prototyp noch leer.');
  }

  /** "Aufgeben": ask first; only allowed between turns, never mid-animation. */
  openForfeit(): void {
    if (this.phase() !== 'fight' || this.isAnimating()) return;
    this.menuState.set('forfeit');
  }

  confirmForfeit(): void {
    if (this.menuState() !== 'forfeit' || this.phase() !== 'fight' || this.isAnimating()) return;
    this.flow.forfeit();
  }

  backToMain(): void {
    if (this.menuState() === 'target') {
      this.pendingMove.set(null);
      this.menuState.set('fight');
      this.log.set(this.logBeforeTarget);
      return;
    }
    if (this.replacingPos() !== null) return; // a forced replacement can't be skipped
    this.menuState.set('main');
  }

  /** True while the acting Pokémon can't act (only a forced replacement is possible). */
  isActiveFainted(): boolean {
    return this.replacingPos() !== null;
  }

  isPartyActive(index: number): boolean {
    return this.activePlayer().includes(index);
  }

  canSwitchTo(index: number): boolean {
    const mon = this.playerTeam()[index];
    if (!mon || mon.currentHp <= 0 || this.activePlayer().includes(index)) return false;
    if (this.replacingPos() !== null) return true;
    // Not already picked to come in by the partner's command this turn.
    return !this.state.commands().some((c) => c?.kind === 'switch' && c.to === index);
  }

  async switchPokemon(index: number): Promise<void> {
    if (this.isAnimating() || !this.canSwitchTo(index)) return;

    const pos = this.replacingPos();
    if (pos !== null) {
      // Refill a fainted position (free, doesn't use a turn).
      this.isAnimating.set(true);
      this.menuState.set('main');
      this.replacingPos.set(null);
      await this.flow.sendIn({ side: 'player', pos }, index);
      await this.flow.startReplacements(true);
      return;
    }

    if (!this.canCommand()) return;
    await this.flow.commit({ kind: 'switch', to: index });
  }

  hpPercent(pokemon: BattlePokemon): number {
    return Math.round((pokemon.currentHp / pokemon.maxHp) * 100);
  }

  hpColor(pokemon: BattlePokemon): string {
    const pct = this.hpPercent(pokemon);
    if (pct < 25) return '#E24B4A';
    if (pct < 50) return '#EF9F27';
    return '#639922';
  }
}

/** Lighten (positive amount) or darken (negative) a `#rrggbb` colour. */
function shadeHex(hex: string, amount: number): string {
  const n = parseInt(hex.slice(1), 16);
  const clamp = (v: number) => Math.max(0, Math.min(255, v));
  const r = clamp(((n >> 16) & 255) + amount);
  const g = clamp(((n >> 8) & 255) + amount);
  const b = clamp((n & 255) + amount);
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}
