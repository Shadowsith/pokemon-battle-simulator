import { Injectable, computed, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MOVE_LIBRARY, Move } from '../../../core/models/move.model';
import { BattlePokemon } from '../../../core/models/pokemon.model';
import { DEFAULT_TRAINER_AVATAR, trainerLabel } from '../../../core/models/trainer.model';
import { isBattleReady } from '../../../core/models/team.model';
import {
  BattleFormat,
  FieldView,
  Redirector,
  Side,
  Slot,
  SlotPos,
  positions,
  slotKey
} from '../../../core/battle/battle-format';
import { blocksStatusMoves, isChoiceItem } from '../../../core/battle/item-effects';
import { DamageCalcService } from '../../../core/services/damage-calc.service';
import { TeamService } from '../../../core/services/team.service';
import { BattlePhase, ChargeState, Command, MenuState } from '../battle.types';
import { derivePlayerTeam, fallbackOpponentMoves, makeGlurak, movesByIds } from '../battle-defaults';

type SideGuards = Record<Side, { wide: boolean; quick: boolean }>;

const freshGuards = (): SideGuards => ({
  player: { wide: false, quick: false },
  opponent: { wide: false, quick: false }
});

/**
 * All state of one battle plus the slot helpers that read and write it.
 * Provided by the battle page, so every battle gets a fresh instance.
 */
@Injectable()
export class BattleStateService {
  private readonly damageCalc = inject(DamageCalcService);
  private readonly teamService = inject(TeamService);

  /**
   * Debug-Kampf (route data `debug`): singles, one dummy per side, the debug
   * panel instead of the battle menu, and Pokémon that can't faint.
   */
  readonly debug = inject(ActivatedRoute).snapshot.data['debug'] === true;

  readonly log = signal('');
  readonly isAnimating = signal(false);
  readonly menuState = signal<MenuState>('main');

  readonly phase = signal<BattlePhase>('intro');
  readonly outcome = signal<'win' | 'loss' | null>(null);

  /** Singles (1 vs 1) or doubles (2 vs 2); decided at the start of each battle. */
  readonly format = signal<BattleFormat>('singles');
  readonly isDoubles = computed(() => this.format() === 'doubles');

  readonly playerTeam = signal<BattlePokemon[]>(this.derivePlayerTeam());
  /** Party index standing in each player position (−1 = empty). */
  readonly activePlayer = signal<number[]>([0]);

  /** The NPC's party: 1-6 Pokémon, rolled each battle to match the player's team size. */
  readonly opponentTeam = signal<BattlePokemon[]>([makeGlurak((d) => this.hp(d))]);
  /** Party index standing in each opponent position (−1 = empty). */
  readonly activeOpponent = signal<number[]>([0]);

  /** The NPC's per-slot movesets, parallel to {@link opponentTeam}. */
  readonly opponentMovesets = signal<Move[][]>([fallbackOpponentMoves()]);

  /** The player position currently being given a command. */
  readonly actingPos = signal<SlotPos>(0);
  /** Commands chosen so far this turn, per player position. */
  readonly commands = signal<(Command | null)[]>([]);
  /** Positions in the order they were commanded, for "Zurück". */
  readonly commandHistory = signal<SlotPos[]>([]);
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

  /** Remaining PP per move, keyed "<party slot>:<showdownId>". Reset each battle. */
  readonly movePp = signal<Record<string, number>>({});

  /** Two-turn / recharge locks, keyed by slot ("p0", "o1" …). */
  readonly charge = signal<Record<string, ChargeState | null>>({});

  /** Successful protection moves in a row, keyed "<side>:<party index>". */
  protectStreak: Record<string, number> = {};

  /** Choice Band / Specs / Scarf: the move each holder is locked into, keyed "<side>:<party index>". */
  readonly choiceLocks = signal<Record<string, string>>({});

  /** Which slot's active sprite has already played its faint animation. */
  faintDone: Record<string, boolean> = {};

  // --- per-turn volatiles (cleared at the start of each round) ---
  protectedSlots = new Map<string, string>();
  sideGuards: SideGuards = freshGuards();
  helpingHand = new Set<string>();
  redirector: Partial<Record<Side, Redirector>> = {};
  moved = new Set<string>();

  /** Trainer avatar id of the NPC, shown on the intro and result screens. */
  readonly npcAvatarId = signal<string>(DEFAULT_TRAINER_AVATAR);
  /** An authored opponent's name (Top 4); overrides the sprite-derived label. */
  readonly npcNameOverride = signal<string | null>(null);
  readonly npcName = computed(() => this.npcNameOverride() ?? trainerLabel(this.npcAvatarId()));

  /** Max HP of a species at the simulator's level. */
  hp(dexId: number): number {
    return this.damageCalc.hpStat(dexId);
  }

  derivePlayerTeam(): BattlePokemon[] {
    return derivePlayerTeam(this.teamService.activeTeam()?.pokemon ?? [], (d) => this.hp(d));
  }

  /** A party member's moves: the player's built picks (or the whole library when
   *  no team is selected — move-animation testing), or the NPC's rolled set. */
  movesFor(side: Side, partyIdx: number): Move[] {
    if (partyIdx < 0) return [];
    if (side === 'opponent') {
      const set = this.opponentMovesets()[partyIdx] ?? [];
      return set.length ? set : fallbackOpponentMoves();
    }
    const built = this.teamService.activeTeam()?.pokemon ?? [];
    if (!isBattleReady(built)) return MOVE_LIBRARY;
    const mon = built[partyIdx];
    return mon ? movesByIds(mon.moves) : [];
  }

  /**
   * Why a held item forbids `move` right now: a Choice item locked into another
   * move, or an Assault Vest blocking status moves. null when it's allowed.
   */
  itemLockReason(side: Side, partyIdx: number, mon: BattlePokemon, move: Move): string | null {
    const lock = this.choiceLocks()[`${side}:${partyIdx}`];
    if (lock && lock !== move.showdownId && isChoiceItem(mon)) return 'Wahl-Item';
    if (blocksStatusMoves(mon) && this.damageCalc.isStatusMove(move)) return 'Offensivweste';
    return null;
  }

  // --- slot helpers ------------------------------------------------------

  activeOf(side: Side): number[] {
    return side === 'player' ? this.activePlayer() : this.activeOpponent();
  }

  teamOf(side: Side): BattlePokemon[] {
    return side === 'player' ? this.playerTeam() : this.opponentTeam();
  }

  /** Party index standing in a slot, or −1. */
  partyIdxAt(slot: Slot): number {
    return this.activeOf(slot.side)[slot.pos] ?? -1;
  }

  monAt(slot: Slot): BattlePokemon | null {
    const idx = this.partyIdxAt(slot);
    return idx >= 0 ? (this.teamOf(slot.side)[idx] ?? null) : null;
  }

  alive(slot: Slot): boolean {
    return (this.monAt(slot)?.currentHp ?? 0) > 0;
  }

  field(): FieldView {
    return { format: this.format(), alive: (s) => this.alive(s) };
  }

  setActive(side: Side, pos: SlotPos, partyIdx: number): void {
    const upd = (a: number[]) => a.map((v, i) => (i === pos ? partyIdx : v));
    if (side === 'player') this.activePlayer.update(upd);
    else this.activeOpponent.update(upd);
  }

  /** Leads for a party of `n`: positions 0..(1) take party slots 0..(1). */
  initialActive(n: number): number[] {
    return positions(this.format()).map((p) => (p < n ? p : -1));
  }

  /** Shallow-merge a patch onto the Pokémon in a slot. */
  patchSlot(slot: Slot, patch: Partial<BattlePokemon>): void {
    const idx = this.partyIdxAt(slot);
    if (idx < 0) return;
    const upd = (team: BattlePokemon[]) => team.map((p, i) => (i === idx ? { ...p, ...patch } : p));
    if (slot.side === 'player') this.playerTeam.update(upd);
    else this.opponentTeam.update(upd);
  }

  /** Add (heal) or subtract (damage) HP on the Pokémon in a slot, clamped. */
  applyHp(slot: Slot, delta: number): void {
    const mon = this.monAt(slot);
    if (!mon) return;
    const hp = Math.max(0, Math.min(mon.maxHp, mon.currentHp + delta));
    // Debug-Kampf: nobody faints - a knock-out restores full HP instead.
    this.patchSlot(slot, { currentHp: this.debug && hp === 0 ? mon.maxHp : hp });
  }

  /** The Pokémon in `slot` uses up its item (berry eaten, gem spent …). */
  consumeItem(slot: Slot): void {
    this.patchSlot(slot, { item: null, itemRevealed: true });
  }

  chargeOf(slot: Slot): ChargeState | null {
    return this.charge()[slotKey(slot)] ?? null;
  }

  setCharge(slot: Slot, state: ChargeState | null): void {
    this.charge.update((c) => ({ ...c, [slotKey(slot)]: state }));
  }

  /** Key for per-Pokémon counters ("<side>:<party index>"). */
  streakKey(slot: Slot): string {
    return `${slot.side}:${this.partyIdxAt(slot)}`;
  }

  clearChoiceLock(slot: Slot): void {
    const key = this.streakKey(slot);
    this.choiceLocks.update(({ [key]: _gone, ...rest }) => rest);
  }

  /** Party indices of healthy Pokémon on the bench of `side`. */
  bench(side: Side): number[] {
    const active = this.activeOf(side);
    return this.teamOf(side)
      .map((p, i) => (p.currentHp > 0 && !active.includes(i) ? i : -1))
      .filter((i) => i >= 0);
  }

  battleDecided(): boolean {
    return (
      this.opponentTeam().every((p) => p.currentHp <= 0) ||
      this.playerTeam().every((p) => p.currentHp <= 0)
    );
  }

  clearTurnVolatiles(): void {
    this.protectedSlots = new Map();
    this.sideGuards = freshGuards();
    this.helpingHand = new Set();
    this.redirector = {};
    this.moved = new Set();
  }
}
