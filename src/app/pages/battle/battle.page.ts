import { Component, ElementRef, OnDestroy, ViewChild, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { IonContent, IonButton } from '@ionic/angular/standalone';
import { MOVE_LIBRARY, Move } from '../../core/models/move.model';
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
import {
  DEFAULT_TRAINER_AVATAR,
  trainerAvatarPath,
  trainerLabel
} from '../../core/models/trainer.model';
import { isBattleReady } from '../../core/models/team.model';
import { toBattlePokemon } from '../../core/models/battle-pokemon';
import {
  BattleFormat,
  FieldView,
  PROTECT_MOVES,
  REDIRECT_MOVES,
  Redirector,
  SIDE_GUARD_MOVES,
  Side,
  Slot,
  SlotPos,
  applyRedirection,
  isContactMove,
  isSpreadMove,
  livingAlly,
  livingFoes,
  livingSlots,
  needsTargetChoice,
  orderActions,
  otherSide,
  positions,
  protectBlocks,
  protectSuccessChance,
  resolveTargets,
  slotKey,
  targetChoices
} from '../../core/battle/battle-format';
import { chooseNpcMove, pickSwitchIn } from '../../core/battle/npc-ai';
import { MoveAnimationService } from '../../core/services/move-animation.service';
import { CustomBattleService } from '../../core/services/custom-battle.service';
import { CustomBattleConfig, configToNpcOptions } from '../../core/models/custom-battle.model';
import { EliteFourRunService } from '../../core/services/elite-four-run.service';
import { GymRunService } from '../../core/services/gym-run.service';
import { RunCarry, TrainerRunService } from '../../core/services/trainer-run.service';
import type { GymLeader, RunMember } from '../../core/models/trainer-run.model';
import { AudioService } from '../../core/services/audio.service';
import { DamageCalcService } from '../../core/services/damage-calc.service';
import { SettingsService } from '../../core/services/settings.service';
import { TrainerRosterService } from '../../core/services/trainer-roster.service';
import { TeamService } from '../../core/services/team.service';
import { NpcPokemon, NpcTeamService } from '../../core/services/npc-team.service';
import { StatusService } from '../../core/services/status.service';
import { StatChange, StatChangeService } from '../../core/services/stat-change.service';

type MenuState = 'main' | 'fight' | 'target' | 'pokemon';
/** intro = "VS" screen, fight = the battle proper, result = win/loss screen. */
type BattlePhase = 'intro' | 'fight' | 'result';
/**
 * A move that ties up a slot across turns: a two-turn move being charged
 * (`semiInvuln` = the user is hidden on turn 1), or the mandatory rest turn a
 * recharge move like Hyper Beam forces afterwards (`recharge`). `target` keeps
 * the chosen target for the release turn.
 */
type ChargeState = { move: Move; semiInvuln: boolean; recharge?: boolean; target?: Slot | null };

/** A player command waiting for the turn to start. */
type Command = { kind: 'move'; move: Move; target: Slot | null } | { kind: 'switch'; to: number };

/** One queued action of a round, ordered by {@link orderActions}. */
interface TurnAction {
  slot: Slot;
  /** Party index of the actor when chosen; the action is dropped if it left the field. */
  partyIdx: number;
  kind: 'move' | 'switch';
  move?: Move;
  target?: Slot | null;
  switchTo?: number;
  priority: number;
  speed: number;
}

/** Everything the template needs to draw one battle position. */
interface SlotView {
  slot: Slot;
  key: string;
  mon: BattlePokemon;
  acting: boolean;
}

/** Hint shown on a move button: effectiveness against one foe. */
interface MoveHint {
  kind: 'status' | 'immune' | 'weak' | 'neutral' | 'strong';
  label: string;
  short: string;
  foe: string | null;
}

@Component({
  selector: 'app-battle',
  standalone: true,
  imports: [IonContent, IonButton],
  templateUrl: './battle.page.html',
  styleUrl: './battle.page.scss'
})
export class BattlePage implements OnDestroy {
  @ViewChild('field', { static: true }) fieldRef!: ElementRef<HTMLElement>;
  @ViewChild('fx', { static: true }) fxRef!: ElementRef<HTMLElement>;
  @ViewChild('screenFx', { static: true }) screenFxRef!: ElementRef<HTMLElement>;

  private readonly router = inject(Router);
  private readonly settings = inject(SettingsService);
  private readonly roster = inject(TrainerRosterService);
  private readonly teamService = inject(TeamService);
  private readonly status = inject(StatusService);
  private readonly statChange = inject(StatChangeService);
  private readonly animation = inject(MoveAnimationService);
  private readonly audio = inject(AudioService);
  private readonly damageCalc = inject(DamageCalcService);
  private readonly npcTeam = inject(NpcTeamService);
  private readonly customBattleSvc = inject(CustomBattleService);
  private readonly e4Svc = inject(EliteFourRunService);
  private readonly gymSvc = inject(GymRunService);

  /** Set when this battle was launched from the Custom Battle config page. */
  private readonly customBattle: CustomBattleConfig | null = this.customBattleSvc.take();
  readonly inCustomBattle = this.customBattle !== null;

  /** Set when this battle is one leg of a run (Top-Vier or Arenaleiter). */
  private readonly challenge: { svc: TrainerRunService; member: RunMember } | null = this.takeChallenge();
  readonly inChallengeBattle = this.challenge !== null;
  /** "Arenaleiter" / "Arenaleiterin" for a gym leader's VS intro, else null. */
  readonly gymTitle = (this.challenge?.member as GymLeader | undefined)?.badge
    ? this.challenge!.member.title.split(' ')[0]
    : null;

  private takeChallenge(): { svc: TrainerRunService; member: RunMember } | null {
    for (const svc of [this.e4Svc, this.gymSvc] as TrainerRunService[]) {
      const member = svc.takePending();
      if (member) return { svc, member };
    }
    return null;
  }

  /** Every Pokémon in this simulator battles at level 100. */
  readonly level = this.damageCalc.level;

  /** Status badge / stat-stage presentation, used by the template. */
  readonly statusMeta = STATUS_META;
  readonly statMeta = STAT_META;

  readonly log = signal('');
  readonly isAnimating = signal(false);
  readonly menuState = signal<MenuState>('main');

  readonly phase = signal<BattlePhase>('intro');
  readonly outcome = signal<'win' | 'loss' | null>(null);

  /** Singles (1 vs 1) or doubles (2 vs 2); decided at the start of each battle. */
  readonly format = signal<BattleFormat>('singles');
  readonly isDoubles = computed(() => this.format() === 'doubles');

  /** Used when the player hasn't built a team yet (also the move-animation test bed). */
  private readonly prototypeTeam: Pick<BattlePokemon, 'dexId' | 'name' | 'types'>[] = [
    { dexId: 197, name: 'Nachtara', types: ['dark'] },
    { dexId: 149, name: 'Dragoran', types: ['dragon', 'flying'] },
    { dexId: 31, name: 'Nidoqueen', types: ['poison', 'ground'] }
  ];

  readonly playerTeam = signal<BattlePokemon[]>(this.derivePlayerTeam());
  /** Party index standing in each player position (−1 = empty). */
  readonly activePlayer = signal<number[]>([0]);

  /** The NPC's party: 1-6 Pokémon, rolled each battle to match the player's team size. */
  readonly opponentTeam = signal<BattlePokemon[]>([this.makeGlurak()]);
  /** Party index standing in each opponent position (−1 = empty). */
  readonly activeOpponent = signal<number[]>([0]);

  /** The NPC's per-slot movesets, parallel to {@link opponentTeam}. */
  private readonly opponentMovesets = signal<Move[][]>([this.fallbackOpponentMoves()]);

  /** The player position currently being given a command. */
  readonly actingPos = signal<SlotPos>(0);
  /** Commands chosen so far this turn, per player position. */
  private readonly commands = signal<(Command | null)[]>([]);
  /** Positions in the order they were commanded, for "Zurück". */
  private readonly commandHistory = signal<SlotPos[]>([]);
  /** A single-target move waiting for its target in the target menu. */
  readonly pendingMove = signal<Move | null>(null);
  /** Player position that must be refilled after a faint (forced switch). */
  readonly replacingPos = signal<SlotPos | null>(null);

  /** The player's Pokémon currently choosing (singles: the only one). */
  readonly player = computed<BattlePokemon>(() => {
    const idx = this.activePlayer()[this.actingPos()] ?? this.activePlayer()[0];
    return this.playerTeam()[idx] ?? this.playerTeam()[0];
  });
  readonly activePlayerIndex = computed(() => this.activePlayer()[this.actingPos()] ?? -1);

  /** The opponent's first active Pokémon (singles: the only one). */
  readonly opponent = computed<BattlePokemon>(
    () => this.opponentTeam()[this.activeOpponent()[0]] ?? this.opponentTeam()[0]
  );

  /** true when the fight is using the player's active team rather than the prototype trio. */
  readonly usingBuiltTeam = computed(() => this.teamService.activeReady());

  /** Moves shown in the fight menu for the acting Pokémon. */
  readonly activeMoves = computed<Move[]>(() => this.movesFor('player', this.activePlayerIndex()));

  /** Remaining PP per move, keyed "<party slot>:<showdownId>". Reset each battle. */
  private readonly movePp = signal<Record<string, number>>({});

  /** Two-turn / recharge locks, keyed by slot ("p0", "o1" …). */
  private readonly charge = signal<Record<string, ChargeState | null>>({});

  /** Successful protection moves in a row, keyed "<side>:<party index>". */
  private protectStreak: Record<string, number> = {};

  // --- per-turn volatiles (cleared at the start of each round) ---
  private protectedSlots = new Map<string, string>();
  private sideGuards: Record<Side, { wide: boolean; quick: boolean }> = this.freshGuards();
  private helpingHand = new Set<string>();
  private redirector: Partial<Record<Side, Redirector>> = {};
  private moved = new Set<string>();

  /** The fight menu's moves with PP and effectiveness hints vs the foe(s). */
  readonly activeMoveViews = computed(() => {
    const pp = this.movePp();
    const idx = this.activePlayerIndex();
    const user: Slot = { side: 'player', pos: this.actingPos() };
    const foes = livingFoes(user, this.field())
      .map((s) => this.monAt(s))
      .filter((m): m is BattlePokemon => !!m);
    return this.activeMoves().map((move) => {
      const max = this.damageCalc.maxPp(move);
      const key = `${idx}:${move.showdownId}`;
      return { move, max, cur: pp[key] ?? max, hints: this.moveHints(move, foes) };
    });
  });

  /** Target buttons for the pending single-target move. */
  readonly targetOptions = computed(() => {
    const move = this.pendingMove();
    if (!move) return [];
    const user: Slot = { side: 'player', pos: this.actingPos() };
    return targetChoices(move, user, this.field()).map((slot) => ({
      slot,
      key: slotKey(slot),
      mon: this.monAt(slot)!,
      ally: slot.side === 'player'
    }));
  });

  /** "Zurück" in the main menu undoes the previous Pokémon's command (doubles). */
  readonly undoTarget = computed(() => {
    const hist = this.commandHistory();
    if (!hist.length || this.replacingPos() !== null) return null;
    const pos = hist[hist.length - 1];
    return this.playerTeam()[this.activePlayer()[pos]] ?? null;
  });

  /** Doubles: whose command is being chosen, shown above the menu. */
  readonly commandPrompt = computed(() => {
    if (!this.isDoubles() || this.phase() !== 'fight' || this.isAnimating() || this.replacingPos() !== null) {
      return null;
    }
    const open = positions(this.format()).filter((pos) => this.alive({ side: 'player', pos })).length;
    const step = this.commandHistory().length + 1;
    return open > 1 ? `${this.player().name} ist am Zug (${step}/${open})` : `${this.player().name} ist am Zug`;
  });

  readonly playerSlotViews = computed(() => this.slotViews('player'));
  readonly opponentSlotViews = computed(() => this.slotViews('opponent'));

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

  private derivePlayerTeam(): BattlePokemon[] {
    const hp = (dexId: number) => this.damageCalc.hpStat(dexId);
    const built = this.teamService.activeTeam()?.pokemon ?? [];
    if (isBattleReady(built)) {
      return built.map((p) => toBattlePokemon(p, hp));
    }
    return this.prototypeTeam.map((p) => {
      const maxHp = hp(p.dexId);
      return { ...p, maxHp, currentHp: maxHp, status: freshStatus(), boosts: freshBoosts() };
    });
  }

  /** A single fallback Pokémon so the field is always valid before the roll lands. */
  private makeGlurak(): BattlePokemon {
    const maxHp = this.damageCalc.hpStat(6);
    return {
      dexId: 6,
      name: 'Glurak',
      maxHp,
      currentHp: maxHp,
      types: ['fire', 'flying'],
      status: freshStatus(),
      boosts: freshBoosts()
    };
  }

  private fallbackOpponentMoves(): Move[] {
    return ['flamethrower', 'airslash', 'dragonclaw', 'heatwave', 'slash']
      .map((id) => MOVE_LIBRARY.find((m) => m.showdownId === id))
      .filter((m): m is Move => m !== undefined);
  }

  /** A party member's moves: the player's built picks (or the whole library when
   *  no team is selected — move-animation testing), or the NPC's rolled set. */
  private movesFor(side: Side, partyIdx: number): Move[] {
    if (partyIdx < 0) return [];
    if (side === 'opponent') {
      const set = this.opponentMovesets()[partyIdx] ?? [];
      return set.length ? set : this.fallbackOpponentMoves();
    }
    const built = this.teamService.activeTeam()?.pokemon ?? [];
    if (!isBattleReady(built)) return MOVE_LIBRARY;
    const mon = built[partyIdx];
    if (!mon) return [];
    return mon.moves
      .map((id) => MOVE_LIBRARY.find((m) => m.showdownId === id))
      .filter((m): m is Move => m !== undefined);
  }

  /** Six Poké Ball emblems per side: owned / active / knocked-out. */
  readonly playerEmblems = computed(() => this.emblems(this.playerTeam(), this.activePlayer()));
  readonly opponentEmblems = computed(() => this.emblems(this.opponentTeam(), this.activeOpponent()));

  private emblems(team: BattlePokemon[], active: number[]) {
    return Array.from({ length: 6 }, (_, i) => {
      const mon = team[i];
      return { owned: !!mon, fainted: !!mon && mon.currentHp <= 0, active: !!mon && active.includes(i) };
    });
  }

  /** Trainer avatars shown on the intro and result screens. */
  private readonly npcAvatarId = signal<string>(DEFAULT_TRAINER_AVATAR);
  /** An authored opponent's name (Top 4); overrides the sprite-derived label. */
  private readonly npcNameOverride = signal<string | null>(null);
  readonly playerAvatar = computed(() => trainerAvatarPath(this.settings.trainerAvatar()));
  readonly npcAvatar = computed(() => trainerAvatarPath(this.npcAvatarId()));
  readonly npcName = computed(() => this.npcNameOverride() ?? trainerLabel(this.npcAvatarId()));

  private introTimer: ReturnType<typeof setTimeout> | null = null;

  spriteSrc(view: SlotView): string {
    return view.slot.side === 'player' ? backSpritePath(view.mon.dexId) : frontSpritePath(view.mon.dexId);
  }

  partySpriteSrc(pokemon: BattlePokemon): string {
    return frontSpritePath(pokemon.dexId);
  }

  constructor() {
    this.startBattle();
  }

  ngOnDestroy(): void {
    if (this.introTimer) clearTimeout(this.introTimer);
    this.audio.stopBattleMusic();
  }

  // --- slot helpers ------------------------------------------------------

  private activeOf(side: Side): number[] {
    return side === 'player' ? this.activePlayer() : this.activeOpponent();
  }

  private teamOf(side: Side): BattlePokemon[] {
    return side === 'player' ? this.playerTeam() : this.opponentTeam();
  }

  /** Party index standing in a slot, or −1. */
  private partyIdxAt(slot: Slot): number {
    return this.activeOf(slot.side)[slot.pos] ?? -1;
  }

  monAt(slot: Slot): BattlePokemon | null {
    const idx = this.partyIdxAt(slot);
    return idx >= 0 ? (this.teamOf(slot.side)[idx] ?? null) : null;
  }

  private alive(slot: Slot): boolean {
    return (this.monAt(slot)?.currentHp ?? 0) > 0;
  }

  private field(): FieldView {
    return { format: this.format(), alive: (s) => this.alive(s) };
  }

  private setActive(side: Side, pos: SlotPos, partyIdx: number): void {
    const upd = (a: number[]) => a.map((v, i) => (i === pos ? partyIdx : v));
    if (side === 'player') this.activePlayer.update(upd);
    else this.activeOpponent.update(upd);
  }

  /** Leads for a party of `n`: positions 0..(1) take party slots 0..(1). */
  private initialActive(n: number): number[] {
    return positions(this.format()).map((p) => (p < n ? p : -1));
  }

  /** Shallow-merge a patch onto the Pokémon in a slot. */
  private patchSlot(slot: Slot, patch: Partial<BattlePokemon>): void {
    const idx = this.partyIdxAt(slot);
    if (idx < 0) return;
    const upd = (team: BattlePokemon[]) => team.map((p, i) => (i === idx ? { ...p, ...patch } : p));
    if (slot.side === 'player') this.playerTeam.update(upd);
    else this.opponentTeam.update(upd);
  }

  /** Add (heal) or subtract (damage) HP on the Pokémon in a slot, clamped. */
  private applyHp(slot: Slot, delta: number): void {
    const mon = this.monAt(slot);
    if (!mon) return;
    this.patchSlot(slot, { currentHp: Math.max(0, Math.min(mon.maxHp, mon.currentHp + delta)) });
  }

  private spriteEl(slot: Slot): HTMLElement {
    const el = this.fieldRef.nativeElement.querySelector<HTMLElement>(`[data-slot="${slotKey(slot)}"]`);
    return el ?? this.fieldRef.nativeElement;
  }

  private chargeOf(slot: Slot): ChargeState | null {
    return this.charge()[slotKey(slot)] ?? null;
  }

  private setCharge(slot: Slot, state: ChargeState | null): void {
    this.charge.update((c) => ({ ...c, [slotKey(slot)]: state }));
  }

  private streakKey(slot: Slot): string {
    return `${slot.side}:${this.partyIdxAt(slot)}`;
  }

  private freshGuards(): Record<Side, { wide: boolean; quick: boolean }> {
    return { player: { wide: false, quick: false }, opponent: { wide: false, quick: false } };
  }

  private clearTurnVolatiles(): void {
    this.protectedSlots = new Map();
    this.sideGuards = this.freshGuards();
    this.helpingHand = new Set();
    this.redirector = {};
    this.moved = new Set();
  }

  // --- battle lifecycle -------------------------------------------------

  /** Singles or doubles for this battle. Doubles needs 2+ Pokémon in the player's team. */
  private pickFormat(): BattleFormat {
    if (this.playerTeam().length < 2) return 'singles';
    if (this.customBattle) return this.customBattle.format;
    if (this.challenge) return this.challenge.svc.run()?.format ?? 'singles';
    return this.settings.allowDoubleBattles() && Math.random() < 0.5 ? 'doubles' : 'singles';
  }

  /** Fresh battle: pick the format, heal the player team, set up the NPC trainer + party, show the VS intro. */
  private async startBattle(): Promise<void> {
    if (this.introTimer) clearTimeout(this.introTimer);
    this.format.set(this.pickFormat());
    this.resetTeams();
    this.outcome.set(null);
    this.log.set('');
    this.phase.set('intro');
    this.audio.startBattleMusic(); // one random looped battle theme per battle

    if (this.customBattle) {
      const cfg = this.customBattle;
      if (cfg.mode === 'team') {
        this.setOpponentMons(cfg.team);
        this.opponentRoll = Promise.resolve();
      } else {
        this.opponentRoll = this.rollOpponentTeam(cfg);
      }
      const [avatarId] = await Promise.all([
        cfg.avatarId ? Promise.resolve(cfg.avatarId) : this.roster.randomId(),
        this.opponentRoll
      ]);
      this.npcAvatarId.set(avatarId);
      this.introTimer = setTimeout(() => this.beginFight(), 2400);
      return;
    }

    if (this.challenge) {
      const member = this.challenge.member;
      this.setOpponentMons(member.team);
      this.opponentRoll = Promise.resolve();
      this.npcAvatarId.set(member.trainerId);
      this.npcNameOverride.set(member.name);
      this.introTimer = setTimeout(() => this.beginFight(), 2400);
      return;
    }

    this.opponentRoll = this.rollOpponentTeam();
    const [avatarId] = await Promise.all([this.roster.randomId(), this.opponentRoll]);
    this.npcAvatarId.set(avatarId);
    this.introTimer = setTimeout(() => this.beginFight(), 2400);
  }

  /** The in-flight NPC-team roll; {@link beginFight} waits on it before sending out. */
  private opponentRoll: Promise<void> | null = null;

  /**
   * Puts an exact, pre-built party on the opponent's side (Top 4, custom
   * "team" mode). `moves` are @pkmn/sim ids resolved against MOVE_LIBRARY.
   */
  private setOpponentMons(
    mons: { speciesNum: number; name: string; types: string[]; moves: string[] }[]
  ): void {
    const hp = (dexId: number) => this.damageCalc.hpStat(dexId);
    this.opponentTeam.set(mons.map((m) => toBattlePokemon(m, hp)));
    this.opponentMovesets.set(
      mons.map((m) =>
        m.moves
          .map((id) => MOVE_LIBRARY.find((mv) => mv.showdownId === id))
          .filter((mv): mv is Move => mv !== undefined)
      )
    );
    this.activeOpponent.set(this.initialActive(mons.length));
  }

  /** Roll a fresh NPC party. Size and type constraints come from a Custom Battle
   *  config when given, otherwise the party mirrors the player's team size
   *  (at least two in doubles). Falls back to a lone Glurak if generation yields nothing. */
  private async rollOpponentTeam(cfg?: CustomBattleConfig): Promise<void> {
    const minSize = this.isDoubles() ? 2 : 1;
    const size = Math.max(minSize, cfg?.opponentCount ?? this.playerTeam().length);
    let rolled: NpcPokemon[] = [];
    try {
      rolled = await this.npcTeam.generate(size, cfg ? configToNpcOptions(cfg) : undefined);
    } catch {
      rolled = [];
    }

    if (!rolled.length) {
      this.opponentTeam.set([this.makeGlurak()]);
      this.opponentMovesets.set([this.fallbackOpponentMoves()]);
    } else {
      this.opponentTeam.set(
        rolled.map((r) => {
          const maxHp = this.damageCalc.hpStat(r.dexId);
          return {
            dexId: r.dexId,
            name: r.name,
            maxHp,
            currentHp: maxHp,
            types: r.types.map((t) => t.toLowerCase()),
            status: freshStatus(),
            boosts: freshBoosts()
          };
        })
      );
      this.opponentMovesets.set(rolled.map((r) => r.moves));
    }
    this.activeOpponent.set(this.initialActive(this.opponentTeam().length));
  }

  /**
   * Dismiss the intro and stage the send-out: the opponent throws their ball(s)
   * first (cry after each ball animation), then the player throws theirs.
   */
  async beginFight(): Promise<void> {
    if (this.introTimer) {
      clearTimeout(this.introTimer);
      this.introTimer = null;
    }
    if (this.phase() !== 'intro') return;

    this.isAnimating.set(true);
    this.phase.set('fight');

    if (this.opponentRoll) await this.opponentRoll; // the NPC party must be rolled before send-out
    await this.wait(30); // let the slot sprites render

    const fx = this.fxRef.nativeElement;
    const field = this.fieldRef.nativeElement;
    const oppSlots = livingSlots('opponent', this.field());
    const playerSlots = livingSlots('player', this.field());
    for (const s of [...oppSlots, ...playerSlots]) this.spriteEl(s).style.opacity = '0';

    const names = (slots: Slot[]) => slots.map((s) => this.monAt(s)!.name).join(' und ');
    this.log.set(`${this.npcName()} schickt ${names(oppSlots)} in den Kampf!`);
    for (const s of oppSlots) {
      await this.animation.playSendOut(this.spriteEl(s), fx, field, 'opponent');
      await this.wait(150);
      this.audio.playCry(this.monAt(s)!.dexId);
      await this.wait(oppSlots.length > 1 ? 350 : 550);
    }

    this.log.set(`Los, ${names(playerSlots)}!`);
    for (const s of playerSlots) {
      await this.animation.playSendOut(this.spriteEl(s), fx, field, 'player');
      await this.wait(150);
      this.audio.playCry(this.monAt(s)!.dexId);
      await this.wait(playerSlots.length > 1 ? 250 : 300);
    }

    await this.beginCommandPhase(true);
  }

  private endBattle(outcome: 'win' | 'loss'): void {
    this.audio.stopBattleMusic();
    this.outcome.set(outcome);
    this.isAnimating.set(false);
    this.menuState.set('main');
    this.replacingPos.set(null);
    this.log.set(
      outcome === 'win'
        ? `${this.npcName()} wurde besiegt!`
        : `${this.isDoubles() ? 'Dein Team' : this.player().name} wurde besiegt!`
    );
    this.phase.set('result');
  }

  /** Which slot's active sprite has already played its faint animation. */
  private faintDone: Record<string, boolean> = {};

  private resetTeams(): void {
    // Heal whatever NPC party is still on the field; rollOpponentTeam() replaces it.
    this.opponentTeam.update((team) =>
      team.map((p) => ({ ...p, currentHp: p.maxHp, status: freshStatus(), boosts: freshBoosts() }))
    );
    this.activeOpponent.set(this.initialActive(this.opponentTeam().length));
    this.playerTeam.set(this.derivePlayerTeam());
    this.activePlayer.set(this.initialActive(this.playerTeam().length));
    this.movePp.set({});
    this.applyRunCarry();
    this.charge.set({});
    this.protectStreak = {};
    this.clearTurnVolatiles();
    this.commands.set([]);
    this.commandHistory.set([]);
    this.pendingMove.set(null);
    this.replacingPos.set(null);
    this.actingPos.set(0);
    this.menuState.set('main');
    this.isAnimating.set(false);
    this.faintDone = {};
    for (const el of Array.from(this.fieldRef?.nativeElement.querySelectorAll<HTMLElement>('.sprite') ?? [])) {
      el.getAnimations?.().forEach((a) => a.cancel());
      el.style.opacity = '';
      el.style.transform = '';
      el.style.filter = '';
    }
  }

  /** Play the faint drop for any active Pokémon that just hit 0 HP (once). */
  private async settleFaints(): Promise<void> {
    for (const side of ['player', 'opponent'] as const) {
      for (const pos of positions(this.format())) {
        const slot: Slot = { side, pos };
        const mon = this.monAt(slot);
        const key = slotKey(slot);
        if (!mon || mon.currentHp > 0 || this.faintDone[key]) continue;
        this.faintDone[key] = true;
        this.setCharge(slot, null); // a fainted Pokémon drops any charge
        this.log.set(`${mon.name} wurde besiegt!`);
        await this.wait(250);
        this.audio.playCry(mon.dexId, true);
        await this.animation.playFaint(this.spriteEl(slot));
      }
    }
  }

  resetBattle(): void {
    this.startBattle();
  }

  toTeamSelect(): void {
    this.router.navigateByUrl('/team-select');
  }

  /**
   * Run leg: in a fresh (full-HP) team, restore the spent PP and lingering
   * major status carried over from the previous won fight.
   */
  private applyRunCarry(): void {
    if (!this.challenge) return;
    const carry = this.challenge.svc.run()?.carry;
    if (!carry) return;
    this.playerTeam.update((team) =>
      team.map((p, i) =>
        carry.status[i] ? { ...p, status: { ...freshStatus(), ...carry.status[i] } } : p
      )
    );
    this.movePp.set({ ...carry.pp });
  }

  /** Snapshot the player team's status + PP for the next leg of a run. */
  private snapshotRunCarry(): RunCarry {
    return {
      status: this.playerTeam().map((p) =>
        p.currentHp <= 0
          ? { major: null, toxicTurns: 0, sleepTurns: 0 }
          : { major: p.status.major, toxicTurns: p.status.toxicTurns, sleepTurns: p.status.sleepTurns }
      ),
      pp: { ...this.movePp() }
    };
  }

  /** Run leg over: report the outcome and hand back to that mode's run screen. */
  challengeContinue(): void {
    if (!this.challenge) return;
    const { svc } = this.challenge;
    const won = this.outcome() === 'win';
    svc.recordOutcome(won, won ? this.snapshotRunCarry() : null);
    this.router.navigate([svc.route], { queryParams: { resume: 1 } });
  }

  // --- command phase ------------------------------------------------------

  /** Next player position (after `after`) that needs a command this turn. */
  private nextCommandPos(after: number): SlotPos | null {
    for (const pos of positions(this.format())) {
      if (pos <= after) continue;
      const slot: Slot = { side: 'player', pos };
      if (this.alive(slot) && !this.chargeOf(slot)) return pos;
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
    this.commands.set([]);
    this.commandHistory.set([]);
    this.pendingMove.set(null);
    const first = this.nextCommandPos(-1);
    if (first === null) {
      // Every living player Pokémon is locked into a charge / recharge turn.
      await this.wait(650);
      await this.executeTurn();
      return;
    }
    this.actingPos.set(first);
    this.menuState.set('main');
    if (announce) this.log.set(`Was wird ${this.player().name} tun?`);
    this.isAnimating.set(false);
  }

  private canCommand(): boolean {
    return this.phase() === 'fight' && !this.isAnimating() && this.replacingPos() === null;
  }

  async useMove(move: Move): Promise<void> {
    if (!this.canCommand()) return;

    const key = `${this.activePlayerIndex()}:${move.showdownId}`;
    const remaining = this.movePp()[key] ?? this.damageCalc.maxPp(move);
    if (remaining <= 0) {
      this.log.set(`${move.name} hat keine AP mehr übrig!`);
      return;
    }
    const user: Slot = { side: 'player', pos: this.actingPos() };
    if (needsTargetChoice(move, user, this.field())) {
      this.pendingMove.set(move);
      this.menuState.set('target');
      this.logBeforeTarget = this.log();
      this.log.set(`Welches Ziel soll ${this.player().name} angreifen?`);
      return;
    }
    await this.commit({ kind: 'move', move, target: null });
  }

  /** The log line the target question replaced, restored when the menu closes. */
  private logBeforeTarget = '';

  async chooseTarget(slot: Slot): Promise<void> {
    const move = this.pendingMove();
    if (!move || !this.canCommand()) return;
    this.pendingMove.set(null);
    this.log.set(this.logBeforeTarget);
    await this.commit({ kind: 'move', move, target: slot });
  }

  /** Record the acting Pokémon's command; ask the next one or start the turn. */
  private async commit(cmd: Command): Promise<void> {
    const pos = this.actingPos();
    this.commands.update((c) => {
      const next = [...c];
      next[pos] = cmd;
      return next;
    });
    this.commandHistory.update((h) => [...h, pos]);
    const next = this.nextCommandPos(pos);
    if (next !== null) {
      this.actingPos.set(next);
      this.menuState.set('main');
      return;
    }
    await this.executeTurn();
  }

  /** Doubles: take back the previous Pokémon's command. */
  undoCommand(): void {
    const hist = this.commandHistory();
    if (!hist.length || !this.canCommand()) return;
    const pos = hist[hist.length - 1];
    this.commandHistory.set(hist.slice(0, -1));
    this.commands.update((c) => c.map((cmd, i) => (i === pos ? null : cmd)));
    this.pendingMove.set(null);
    this.actingPos.set(pos);
    this.menuState.set('main');
  }

  // --- turns ----------------------------------------------------------

  /** The NPC's move for the Pokémon in `slot`. */
  private npcAction(slot: Slot): TurnAction {
    const idx = this.partyIdxAt(slot);
    const user = this.monAt(slot)!;
    const ally = livingAlly(slot, this.field());
    const choice = chooseNpcMove({
      calc: this.damageCalc,
      field: this.field(),
      slot,
      user,
      moves: this.movesFor('opponent', idx),
      monAt: (s) => this.monAt(s),
      allyMoves: ally ? this.movesFor('opponent', this.partyIdxAt(ally)) : [],
      protectStreak: this.protectStreak[this.streakKey(slot)] ?? 0
    });
    return this.moveAction(slot, choice.move, choice.target);
  }

  private moveAction(slot: Slot, move: Move, target: Slot | null): TurnAction {
    return {
      slot,
      partyIdx: this.partyIdxAt(slot),
      kind: 'move',
      move,
      target,
      priority: this.damageCalc.movePriority(move),
      speed: this.damageCalc.effectiveSpeed(this.monAt(slot)!)
    };
  }

  /**
   * One round: collect every active Pokémon's action (player commands, NPC
   * picks, locked charge / recharge turns), run them in turn order, then
   * {@link finishRound}.
   */
  private async executeTurn(): Promise<void> {
    this.isAnimating.set(true);
    this.menuState.set('main');
    this.pendingMove.set(null);
    this.clearTurnVolatiles();

    const actions: TurnAction[] = [];
    const cmds = this.commands();
    for (const side of ['player', 'opponent'] as const) {
      for (const pos of positions(this.format())) {
        const slot: Slot = { side, pos };
        if (!this.alive(slot)) continue;
        const locked = this.chargeOf(slot);
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
            partyIdx: this.partyIdxAt(slot),
            kind: 'switch',
            switchTo: cmd.to,
            priority: 0,
            speed: this.damageCalc.effectiveSpeed(this.monAt(slot)!)
          });
        } else {
          // PP is spent when the move is committed (the charge turn), not on release.
          const key = `${this.partyIdxAt(slot)}:${cmd.move.showdownId}`;
          const remaining = this.movePp()[key] ?? this.damageCalc.maxPp(cmd.move);
          this.movePp.update((m) => ({ ...m, [key]: remaining - 1 }));
          actions.push(this.moveAction(slot, cmd.move, cmd.target));
        }
      }
    }
    this.commands.set([]);
    this.commandHistory.set([]);

    let first = true;
    for (const a of orderActions(actions)) {
      if (this.battleDecided()) break;
      if (this.partyIdxAt(a.slot) !== a.partyIdx || !this.alive(a.slot)) continue; // KO'd or switched out
      if (!first) await this.wait(550);
      first = false;
      if (a.kind === 'switch') {
        await this.switchSlot(a.slot, a.switchTo!);
      } else {
        await this.performMove(a.move!, a.slot, a.target ?? null);
      }
      this.moved.add(slotKey(a.slot));
      await this.settleFaints();
    }

    await this.finishRound();
  }

  private battleDecided(): boolean {
    return (
      this.opponentTeam().every((p) => p.currentHp <= 0) ||
      this.playerTeam().every((p) => p.currentHp <= 0)
    );
  }

  private refsFor(user: Slot, target: Slot) {
    return {
      fieldEl: this.fieldRef.nativeElement,
      fxEl: this.fxRef.nativeElement,
      screenFxEl: this.screenFxRef.nativeElement,
      launchEl: this.spriteEl(user),
      targetEl: this.spriteEl(target)
    };
  }

  private chargeMessage(name: string, move: Move): string {
    const messages: Record<string, string> = {
      fly: `${name} flog empor!`,
      bounce: `${name} sprang hoch!`,
      dig: `${name} grub sich ein!`,
      dive: `${name} tauchte unter!`,
      skydrop: `${name} stieg mit dem Gegner auf!`,
      shadowforce: `${name} verschwand!`,
      phantomforce: `${name} verschwand!`,
      solarbeam: `${name} sammelt Energie!`,
      skyattack: `${name} hüllt sich in gleißendes Licht!`,
      skullbash: `${name} senkt den Kopf!`,
      razorwind: `${name} wirbelt einen Sturm auf!`,
      freezeshock: `${name} lädt sich mit eisiger Energie auf!`,
      iceburn: `${name} umgibt sich mit einer Kältewelle!`
    };
    return messages[move.showdownId] ?? `${name} lädt ${move.name} auf!`;
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
    if (this.opponentTeam().every((p) => p.currentHp <= 0)) {
      await this.wait(350);
      this.endBattle('win');
      return true;
    }
    if (this.playerTeam().every((p) => p.currentHp <= 0)) {
      await this.wait(350);
      this.endBattle('loss');
      return true;
    }
    return false;
  }

  /** End-of-turn burn / poison / toxic damage on every active Pokémon, fastest first. */
  private async applyResiduals(): Promise<void> {
    const slots = [...livingSlots('player', this.field()), ...livingSlots('opponent', this.field())].sort(
      (a, b) => this.damageCalc.effectiveSpeed(this.monAt(b)!) - this.damageCalc.effectiveSpeed(this.monAt(a)!)
    );
    for (const slot of slots) {
      const mon = this.monAt(slot);
      if (!mon || mon.currentHp <= 0 || !mon.status.major) continue;
      const r = this.status.residual(mon);
      this.patchSlot(slot, { status: r.status });
      if (r.damage > 0) {
        this.applyHp(slot, -r.damage);
        if (r.message) this.log.set(r.message);
        await this.wait(800);
      }
    }
  }

  // --- switching ------------------------------------------------------

  /** Party indices of healthy Pokémon on the bench of `side`. */
  private bench(side: Side): number[] {
    const active = this.activeOf(side);
    return this.teamOf(side)
      .map((p, i) => (p.currentHp > 0 && !active.includes(i) ? i : -1))
      .filter((i) => i >= 0);
  }

  /** The NPC sends in its best matchup for every fainted position. */
  private async replaceFaintedOpponents(): Promise<void> {
    for (const pos of positions(this.format())) {
      const slot: Slot = { side: 'opponent', pos };
      if (this.alive(slot)) continue;
      const foes = livingSlots('player', this.field()).map((s) => this.monAt(s)!);
      const next = pickSwitchIn(
        this.damageCalc,
        this.opponentTeam(),
        this.opponentMovesets(),
        foes.length ? foes : [this.player()],
        new Set(this.activeOpponent())
      );
      if (next < 0) continue; // nobody left - the position stays empty
      await this.wait(600);
      this.setCharge(slot, null);
      await this.sendIn(slot, next);
    }
  }

  /** Ask the player to refill fainted positions, one at a time; then start the next turn. */
  private async startReplacements(afterSendIn = false): Promise<void> {
    const bench = this.bench('player');
    const pos = positions(this.format()).find((p) => !this.alive({ side: 'player', pos: p }));
    if (pos === undefined || !bench.length) {
      this.replacingPos.set(null);
      await this.beginCommandPhase(afterSendIn);
      return;
    }
    this.replacingPos.set(pos);
    this.menuState.set('pokemon');
    this.log.set('Welches Pokémon soll in den Kampf?');
    this.isAnimating.set(false);
  }

  /** Bring a fresh Pokémon into a slot whose occupant fainted (no recall). */
  private async sendIn(slot: Slot, partyIdx: number): Promise<void> {
    this.setActive(slot.side, slot.pos, partyIdx);
    this.faintDone[slotKey(slot)] = false;
    const el = this.spriteEl(slot);
    el.getAnimations?.().forEach((a) => a.cancel());
    el.style.opacity = '0';
    el.style.transform = '';
    el.style.filter = '';
    await this.wait(60); // let the sprite src rebind before it grows in
    const mon = this.monAt(slot)!;
    this.log.set(slot.side === 'player' ? `Los, ${mon.name}!` : `${this.npcName()} schickt ${mon.name} in den Kampf!`);
    await this.animation.playSendOut(el, this.fxRef.nativeElement, this.fieldRef.nativeElement, slot.side);
    await this.wait(120);
    this.audio.playCry(mon.dexId);
    await this.wait(250);
  }

  /** A voluntary switch during a turn: recall the current Pokémon, send in `to`. */
  private async switchSlot(slot: Slot, to: number): Promise<void> {
    const out = this.monAt(slot);
    if (!out || this.teamOf(slot.side)[to]?.currentHp <= 0 || this.activeOf(slot.side).includes(to)) return;
    // Switching out clears volatiles: confusion ends, the toxic counter resets,
    // all stat stages are lost, and a two-turn move is cancelled.
    this.patchSlot(slot, {
      status: { ...out.status, confusionTurns: 0, toxicTurns: out.status.major === 'tox' ? 1 : 0 },
      boosts: freshBoosts()
    });
    this.protectStreak[this.streakKey(slot)] = 0;
    this.setCharge(slot, null);
    this.log.set(`${out.name}, komm zurück!`);
    await this.animation.playRecall(this.spriteEl(slot), this.fxRef.nativeElement, this.fieldRef.nativeElement, slot.side);
    await this.sendIn(slot, to);
  }

  // --- moves ------------------------------------------------------------

  /**
   * Plays one move from `user`. Protection / support moves (Protect, Wide
   * Guard, Helping Hand, Follow Me) set up this turn's volatiles; everything
   * else resolves its targets now (retargeting and redirection included) and
   * hits each one: Protect / guard check, accuracy, damage (0.75× when it hits
   * several targets, 1.5× after Helping Hand), status and stat changes.
   */
  private async performMove(move: Move, user: Slot, chosen: Slot | null): Promise<void> {
    const side = user.side;
    const attacker = this.monAt(user)!;
    const me = () => this.monAt(user)!;
    const id = move.showdownId;
    const myCharge = this.chargeOf(user);

    // --- recharge turn: a move like Hyper Beam forces its user to sit out ---
    if (myCharge?.recharge) {
      this.setCharge(user, null);
      this.log.set(`${attacker.name} muss sich von der Attacke erholen!`);
      await this.wait(900);
      return;
    }

    // --- status gate: sleep / freeze / paralysis / confusion may stop the move ---
    const pre = this.status.resolvePreMove(attacker);
    this.patchSlot(user, { status: pre.status });
    if (pre.message) {
      this.log.set(pre.message);
      await this.wait(950);
    }
    if (pre.confusionSelfHit) {
      this.applyHp(user, -this.damageCalc.confusionSelfDamage(attacker));
      return;
    }
    if (!pre.canAct) return;

    // Any move other than a protection move resets the consecutive-use counter.
    const streakKey = this.streakKey(user);
    if (!PROTECT_MOVES.has(id)) this.protectStreak[streakKey] = 0;

    if (PROTECT_MOVES.has(id) || SIDE_GUARD_MOVES.has(id) || id === 'helpinghand' || REDIRECT_MOVES.has(id)) {
      await this.performSupportMove(move, user, streakKey);
      return;
    }

    // --- two-turn move, turn 1: start charging, deal nothing ---
    if (this.damageCalc.isChargeMove(move) && !myCharge) {
      const semiInvuln = this.damageCalc.isSemiInvulnMove(move);
      this.setCharge(user, { move, semiInvuln, target: chosen });
      this.log.set(this.chargeMessage(attacker.name, move));
      this.audio.playMove(id);
      const foe = livingFoes(user, this.field())[0] ?? user;
      await this.animation.playMove(move, this.refsFor(user, foe), 'charge');
      await this.wait(350);
      return;
    }

    // --- two-turn move, turn 2: release (skip the charge visual, then hit) ---
    let phase: 'release' | undefined;
    let aim = chosen;
    if (myCharge && myCharge.move.showdownId === id) {
      this.setCharge(user, null);
      phase = 'release';
      aim = myCharge.target ?? chosen;
    }

    const field = this.field();
    const res = resolveTargets(move, user, aim, field);
    if (res.kind === 'self') {
      await this.performSelfMove(move, user, phase);
      return;
    }
    const targets = applyRedirection(
      res.targets,
      move,
      user,
      attacker.types,
      this.redirector[otherSide(side)],
      field
    );

    this.log.set(`${attacker.name} setzt ${move.name} ein...`);
    this.audio.playMove(id);

    if (!targets.length) {
      await this.wait(650);
      this.log.set('Aber es misslang!');
      await this.wait(700);
      this.queueRecharge(user, move);
      return;
    }

    // --- per-target gates: off the field, Protect, Wide / Quick Guard, accuracy ---
    const spread = targets.length > 1;
    const hits: Slot[] = [];
    let missed = 0;
    for (const t of targets) {
      const tm = this.monAt(t)!;
      if (this.chargeOf(t)?.semiInvuln) {
        await this.wait(650);
        this.log.set(`Doch ${tm.name} ist nicht zu sehen!`);
        await this.wait(700);
        continue;
      }
      if (await this.blockedByProtection(move, user, t)) continue;
      if (!this.damageCalc.rollHit(move, me(), tm)) {
        await this.wait(480);
        await this.animation.playDodge(this.spriteEl(t));
        this.log.set(spread ? `${tm.name} weicht aus!` : `Die Attacke von ${attacker.name} ging daneben!`);
        await this.wait(650);
        missed++;
        continue;
      }
      hits.push(t);
    }

    if (!hits.length) {
      const crash = missed ? this.damageCalc.crashDamage(move, me()) : 0; // Jump Kick / Hi Jump Kick
      if (crash > 0) {
        this.applyHp(user, -crash);
        this.log.set(`Die Attacke von ${attacker.name} ging daneben! ${attacker.name} verletzt sich dabei selbst!`);
        await this.wait(650);
      }
      this.queueRecharge(user, move); // a missed / blocked Hyper Beam still exhausts its user (Gen 4+)
      return;
    }

    await this.animation.playMove(move, this.refsFor(user, hits[0]), phase);
    for (const t of hits.slice(1)) await this.animation.playHitFlash(this.spriteEl(t), typeColor(move.type));

    // --- damage, status and stat changes per target ---
    const helped = this.helpingHand.has(slotKey(user));
    const results: { slot: Slot; dealt: number; statusMsg: string | null }[] = [];
    const statLogs: string[] = [];
    let totalDealt = 0;
    let userChangesDone = false;

    for (const t of hits) {
      const defender = this.monAt(t)!;
      // Drain and recoil scale with HP actually lost, so cap the roll at the
      // defender's current HP (overkilling a weak target costs less recoil).
      const raw = this.damageCalc.calculateDamage(me(), defender, move, { spread, helpingHand: helped });
      const dealt = Math.min(raw, defender.currentHp);
      if (dealt > 0) {
        this.applyHp(t, -dealt);
        this.audio.playHit(this.damageCalc.effectiveness(move, defender));
      }
      totalDealt += dealt;

      // --- status infliction / thaw on the target ---
      let statusMsg: string | null = null;
      const now = this.monAt(t)!;
      if (now.currentHp > 0) {
        if (now.status.major === 'frz' && dealt > 0 && this.status.isFireMove(move)) {
          this.patchSlot(t, { status: { ...now.status, major: null } });
          statusMsg = `${now.name} ist aufgetaut!`;
        } else {
          const inflicted = this.status.rollInfliction(move, now, dealt);
          if (inflicted) {
            this.patchSlot(t, { status: this.status.applyInfliction(now, inflicted) });
            statusMsg = this.status.inflictionMessage(now.name, inflicted);
          }
        }
      }

      // --- stat-stage changes (Growl, Crunch's chance, Overheat's own drop …) ---
      const sc = this.statChange.resolve(move, now.types, dealt);
      if (!userChangesDone && Object.keys(sc.toUser).length) {
        const res2 = this.statChange.apply(me().boosts, sc.toUser);
        this.patchSlot(user, { boosts: res2.boosts });
        for (const ch of res2.changes) statLogs.push(this.statChangeMessage(me().name, ch));
        userChangesDone = true;
      }
      const tgt = this.monAt(t)!;
      if (tgt.currentHp > 0 && Object.keys(sc.toTarget).length) {
        const res2 = this.statChange.apply(tgt.boosts, sc.toTarget);
        this.patchSlot(t, { boosts: res2.boosts });
        for (const ch of res2.changes) statLogs.push(this.statChangeMessage(tgt.name, ch));
      }
      results.push({ slot: t, dealt, statusMsg });
    }

    const recovery = this.damageCalc.calculateRecovery(move, me(), totalDealt);
    if (recovery.amount > 0) this.applyHp(user, recovery.amount);
    const recoil = this.damageCalc.calculateSelfDamage(move, me(), totalDealt);
    if (recoil.amount > 0) this.applyHp(user, -recoil.amount);

    // --- one log line per target ---
    const lines = results.map((r) => {
      const foe = this.monAt(r.slot)!;
      let line: string;
      if (foe.currentHp <= 0) {
        line = `${foe.name} wurde besiegt!`;
      } else if (recovery.kind === 'drain' && recovery.amount > 0) {
        line = `${move.name} trifft ${foe.name}! ${me().name} saugt Energie ab.`;
      } else if (r.dealt > 0) {
        line = `${move.name} trifft ${foe.name}!`;
      } else if (r.statusMsg) {
        return r.statusMsg;
      } else if (statLogs.length > 0) {
        line = statLogs.shift() as string; // a pure stat move - lead with the first change
      } else {
        line = `${move.name} zeigt keine Wirkung …`;
      }
      return r.statusMsg ? `${line} ${r.statusMsg}` : line;
    });
    let line = lines.join(' ');

    const anyAlive = results.some((r) => this.alive(r.slot));
    if (recoil.kind === 'selfKo' && anyAlive) {
      line = `${me().name} setzt alles auf eine Karte!`;
    } else if (recoil.kind === 'recoil') {
      line +=
        me().currentHp <= 0
          ? ` ${me().name} bricht durch den Rückstoß zusammen.`
          : ` ${me().name} nimmt Rückstoß-Schaden.`;
    }
    this.log.set(line);
    // A multi-target summary needs a beat to be read before faint messages replace it.
    if (results.length > 1) await this.wait(900);

    for (const msg of statLogs) {
      await this.wait(850);
      this.log.set(msg);
    }

    // Hyper Beam & co.: lock the user into a recharge turn (unless it just fainted).
    if (me().currentHp > 0) this.queueRecharge(user, move);
  }

  /**
   * Protect / Detect / King's Shield on the target, or Wide / Quick Guard on its
   * side, stop `move`. Plays the block and returns true when it's stopped.
   */
  private async blockedByProtection(move: Move, user: Slot, t: Slot): Promise<boolean> {
    const tm = this.monAt(t)!;
    const prot = this.protectedSlots.get(slotKey(t));
    const guard = this.sideGuards[t.side];
    let msg: string | null = null;

    if (prot && t.side !== user.side && protectBlocks(prot, move)) {
      msg = `${tm.name} hat sich geschützt!`;
      if (prot === 'kingsshield' && isContactMove(move)) {
        const atk = this.monAt(user)!;
        const res = this.statChange.apply(atk.boosts, { atk: -1 });
        this.patchSlot(user, { boosts: res.boosts });
        for (const ch of res.changes) msg += ` ${this.statChangeMessage(atk.name, ch)}`;
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

    await this.wait(400);
    await this.animation.playShield(this.spriteEl(t), this.fxRef.nativeElement, this.fieldRef.nativeElement);
    this.log.set(msg);
    await this.wait(700);
    return true;
  }

  /** Protect family, Wide / Quick Guard, Helping Hand, Follow Me / Rage Powder. */
  private async performSupportMove(move: Move, user: Slot, streakKey: string): Promise<void> {
    const id = move.showdownId;
    const name = this.monAt(user)!.name;
    const fx = this.fxRef.nativeElement;
    const fieldEl = this.fieldRef.nativeElement;
    this.log.set(`${name} setzt ${move.name} ein...`);
    this.audio.playMove(id);

    const fail = async () => {
      await this.wait(500);
      this.log.set('Aber es misslang!');
      await this.wait(700);
    };

    if (PROTECT_MOVES.has(id)) {
      const streak = this.protectStreak[streakKey] ?? 0;
      if (Math.random() >= protectSuccessChance(streak)) {
        this.protectStreak[streakKey] = 0;
        return fail();
      }
      this.protectStreak[streakKey] = streak + 1;
      this.protectedSlots.set(slotKey(user), id);
      await this.animation.playShield(this.spriteEl(user), fx, fieldEl, id === 'kingsshield' ? '#c9b458' : '#7fd3ff');
      this.log.set(`${name} schützt sich selbst!`);
      await this.wait(700);
      return;
    }

    if (SIDE_GUARD_MOVES.has(id)) {
      const wide = id === 'wideguard';
      if (wide) this.sideGuards[user.side].wide = true;
      else this.sideGuards[user.side].quick = true;
      await Promise.all(
        livingSlots(user.side, this.field()).map((s) =>
          this.animation.playShield(this.spriteEl(s), fx, fieldEl, wide ? '#b98a4b' : '#e0703c')
        )
      );
      const team = user.side === 'player' ? 'dein Team' : 'das gegnerische Team';
      this.log.set(`${move.name} schützt ${team}!`);
      await this.wait(700);
      return;
    }

    if (id === 'helpinghand') {
      const ally = livingAlly(user, this.field());
      if (!ally || this.moved.has(slotKey(ally))) return fail();
      this.helpingHand.add(slotKey(ally));
      await this.animation.playMove(move, this.refsFor(user, ally));
      this.log.set(`${name} möchte ${this.monAt(ally)!.name} helfen!`);
      await this.wait(700);
      return;
    }

    // Follow Me / Rage Powder: only meaningful with a partner to shield.
    if (!this.isDoubles()) return fail();
    this.redirector[user.side] = { slot: user, kind: id === 'ragepowder' ? 'ragepowder' : 'followme' };
    await this.animation.playMove(move, this.refsFor(user, user));
    this.log.set(`${name} zieht alle Aufmerksamkeit auf sich!`);
    await this.wait(700);
  }

  /** Moves that only affect the user or the field (Swords Dance, Recover, Rest, Spikes …). */
  private async performSelfMove(move: Move, user: Slot, phase: 'release' | undefined): Promise<void> {
    const me = () => this.monAt(user)!;
    this.log.set(`${me().name} setzt ${move.name} ein...`);
    this.audio.playMove(move.showdownId);
    const foe = livingFoes(user, this.field())[0] ?? user;
    await this.animation.playMove(move, this.refsFor(user, foe), phase);

    const recovery = this.damageCalc.calculateRecovery(move, me(), 0);
    if (recovery.amount > 0) this.applyHp(user, recovery.amount);

    // Rest also puts the user to sleep for two turns.
    if (move.showdownId === 'rest' && recovery.amount > 0) {
      this.patchSlot(user, { status: { ...me().status, major: 'slp', sleepTurns: 3, toxicTurns: 0 } });
    }

    const statLogs: string[] = [];
    const sc = this.statChange.resolve(move, me().types, 0);
    if (Object.keys(sc.toUser).length) {
      const res = this.statChange.apply(me().boosts, sc.toUser);
      this.patchSlot(user, { boosts: res.boosts });
      for (const ch of res.changes) statLogs.push(this.statChangeMessage(me().name, ch));
    }

    let line: string;
    if (recovery.kind === 'selfHeal' && recovery.amount > 0) line = `${me().name} füllt seine KP auf!`;
    else if (recovery.kind === 'selfHeal') line = 'Aber es misslang!';
    else if (statLogs.length) line = statLogs.shift() as string;
    else line = `${move.name} zeigt keine Wirkung …`;
    this.log.set(line);

    for (const msg of statLogs) {
      await this.wait(850);
      this.log.set(msg);
    }
    this.queueRecharge(user, move);
  }

  /**
   * If `move` is a recharge move (Hyper Beam …), park it on the acting slot so
   * the next round plays out the mandatory rest turn. Cleared when the Pokémon
   * faints ({@link settleFaints}) or switches out.
   */
  private queueRecharge(slot: Slot, move: Move): void {
    if (!this.damageCalc.needsRecharge(move)) return;
    this.setCharge(slot, { move, semiInvuln: false, recharge: true });
  }

  private statChangeMessage(name: string, ch: StatChange): string {
    const stat = this.statMeta[ch.stat].label;
    if (ch.capped) {
      return ch.delta > 0
        ? `${name}s ${stat} kann nicht weiter erhöht werden!`
        : `${name}s ${stat} kann nicht weiter gesenkt werden!`;
    }
    const mag = Math.abs(ch.delta);
    const verb =
      ch.delta > 0
        ? mag >= 3
          ? 'steigt extrem'
          : mag === 2
            ? 'steigt stark'
            : 'steigt'
        : mag >= 3
          ? 'sinkt extrem'
          : mag === 2
            ? 'sinkt stark'
            : 'sinkt';
    return `${name}s ${stat} ${verb}!`;
  }

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

  private wait(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
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

  runAway(): void {
    if (this.isAnimating()) return;
    this.log.set('Du kannst nicht vor einem Trainerkampf fliehen!');
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
    return !this.commands().some((c) => c?.kind === 'switch' && c.to === index);
  }

  async switchPokemon(index: number): Promise<void> {
    if (this.isAnimating() || !this.canSwitchTo(index)) return;

    const pos = this.replacingPos();
    if (pos !== null) {
      // Refill a fainted position (free, doesn't use a turn).
      this.isAnimating.set(true);
      this.menuState.set('main');
      this.replacingPos.set(null);
      await this.sendIn({ side: 'player', pos }, index);
      await this.startReplacements(true);
      return;
    }

    if (!this.canCommand()) return;
    await this.commit({ kind: 'switch', to: index });
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
