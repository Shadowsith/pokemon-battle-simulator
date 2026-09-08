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
import { MoveAnimationService } from '../../core/services/move-animation.service';
import { StoryProgressService } from '../../core/services/story-progress.service';
import { BattleHandoffService, PendingStoryBattle } from '../../core/services/battle-handoff.service';
import { AudioService } from '../../core/services/audio.service';
import { DamageCalcService } from '../../core/services/damage-calc.service';
import { SettingsService } from '../../core/services/settings.service';
import { TrainerRosterService } from '../../core/services/trainer-roster.service';
import { TeamService } from '../../core/services/team.service';
import { NpcPokemon, NpcTeamService } from '../../core/services/npc-team.service';
import { StatusService } from '../../core/services/status.service';
import { StatChange, StatChangeService } from '../../core/services/stat-change.service';

type MenuState = 'main' | 'fight' | 'pokemon';
/** intro = "VS" screen, fight = the battle proper, result = win/loss screen. */
type BattlePhase = 'intro' | 'fight' | 'result';
/** A two-turn move mid-flight: the move being charged and whether its user is hidden. */
type ChargeState = { move: Move; semiInvuln: boolean };

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
  @ViewChild('playerSprite', { static: true }) playerSpriteRef!: ElementRef<HTMLElement>;
  @ViewChild('oppSprite', { static: true }) oppSpriteRef!: ElementRef<HTMLElement>;

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
  private readonly storyProgress = inject(StoryProgressService);
  private readonly handoff = inject(BattleHandoffService);

  /** Set when this battle was launched from the story runner; null for a free battle. */
  private readonly storyBattle: PendingStoryBattle | null = this.handoff.take();
  readonly inStoryBattle = this.storyBattle !== null;
  readonly storyIntroText = this.storyBattle?.introText ?? null;

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

  /** Used when the player hasn't built a team yet (also the move-animation test bed). */
  private readonly prototypeTeam: Pick<BattlePokemon, 'dexId' | 'name' | 'types'>[] = [
    { dexId: 197, name: 'Nachtara', types: ['dark'] },
    { dexId: 149, name: 'Dragoran', types: ['dragon', 'flying'] },
    { dexId: 31, name: 'Nidoqueen', types: ['poison', 'ground'] }
  ];

  readonly playerTeam = signal<BattlePokemon[]>(this.derivePlayerTeam());
  readonly activePlayerIndex = signal(0);
  readonly player = computed(() => this.playerTeam()[this.activePlayerIndex()]);

  /** true when the fight is using the player's active team rather than the prototype trio. */
  readonly usingBuiltTeam = computed(() => this.teamService.activeReady());

  /** Moves shown in the fight menu: the active Pokémon's picks, or the whole
   *  library when no team is selected (move-animation testing). */
  readonly activeMoves = computed<Move[]>(() => {
    const built = this.teamService.activeTeam()?.pokemon ?? [];
    if (!isBattleReady(built)) return MOVE_LIBRARY;
    const mon = built[this.activePlayerIndex()];
    if (!mon) return [];
    return mon.moves
      .map((id) => MOVE_LIBRARY.find((m) => m.showdownId === id))
      .filter((m): m is Move => m !== undefined);
  });

  /** Remaining PP per move, keyed by "<active party slot>:<showdownId>". Reset each battle. */
  private readonly movePp = signal<Record<string, number>>({});

  /** A side that used a two-turn move (Solar Beam, Fly, …) is locked into finishing it. */
  private readonly charge = signal<{
    player: ChargeState | null;
    opponent: ChargeState | null;
  }>({ player: null, opponent: null });

  /** The fight menu's moves with PP and an effectiveness hint vs the opponent. */
  readonly activeMoveViews = computed(() => {
    const pp = this.movePp();
    const slot = this.activePlayerIndex();
    const foe = this.opponent();
    return this.activeMoves().map((move) => {
      const max = this.damageCalc.maxPp(move);
      const key = `${slot}:${move.showdownId}`;
      return { move, max, cur: pp[key] ?? max, hint: this.moveHint(move, foe) };
    });
  });

  private moveHint(
    move: Move,
    foe: BattlePokemon
  ): { kind: 'status' | 'immune' | 'weak' | 'neutral' | 'strong'; label: string } {
    if (this.damageCalc.isStatusMove(move)) return { kind: 'status', label: 'Status' };
    const e = this.damageCalc.effectiveness(move, foe);
    if (e === 0) return { kind: 'immune', label: 'Wirkungslos' };
    if (e < 1) return { kind: 'weak', label: 'Wenig Wirkung' };
    if (e > 1) return { kind: 'strong', label: 'Sehr effektiv' };
    return { kind: 'neutral', label: 'Effektiv' };
  }

  private ppKey(showdownId: string): string {
    return `${this.activePlayerIndex()}:${showdownId}`;
  }

  private derivePlayerTeam(): BattlePokemon[] {
    const hp = (dexId: number) => this.damageCalc.hpStat(dexId);

    // Story mode brings its own team; fall through if the run has none yet.
    if (this.storyBattle) {
      const storyTeam = this.storyProgress.save()?.team ?? [];
      if (storyTeam.length) return storyTeam.map((p) => toBattlePokemon(p, hp));
    }

    const built = this.teamService.activeTeam()?.pokemon ?? [];
    if (isBattleReady(built)) {
      return built.map((p) => toBattlePokemon(p, hp));
    }
    return this.prototypeTeam.map((p) => {
      const maxHp = hp(p.dexId);
      return { ...p, maxHp, currentHp: maxHp, status: freshStatus(), boosts: freshBoosts() };
    });
  }

  /** The NPC's party: 1-6 Pokémon, rolled each battle to match the player's team size. */
  readonly opponentTeam = signal<BattlePokemon[]>([this.makeGlurak()]);
  readonly activeOpponentIndex = signal(0);
  readonly opponent = computed<BattlePokemon>(
    () => this.opponentTeam()[this.activeOpponentIndex()] ?? this.opponentTeam()[0]
  );

  /** The NPC's per-slot movesets, parallel to {@link opponentTeam}. */
  private readonly opponentMovesets = signal<Move[][]>([this.fallbackOpponentMoves()]);

  /** The in-flight NPC-team roll; {@link beginFight} waits on it before sending out. */
  private opponentRoll: Promise<void> | null = null;

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

  /** Six Poké Ball emblems per side: owned / active / knocked-out. */
  readonly playerEmblems = computed(() => this.emblems(this.playerTeam(), this.activePlayerIndex()));
  readonly opponentEmblems = computed(() =>
    this.emblems(this.opponentTeam(), this.activeOpponentIndex())
  );

  private emblems(team: BattlePokemon[], active: number) {
    return Array.from({ length: 6 }, (_, i) => {
      const mon = team[i];
      return { owned: !!mon, fainted: !!mon && mon.currentHp <= 0, active: !!mon && i === active };
    });
  }

  /** Trainer avatars shown on the intro and result screens. */
  private readonly npcAvatarId = signal<string>(DEFAULT_TRAINER_AVATAR);
  /** A story opponent's authored name; overrides the sprite-derived label. */
  private readonly npcNameOverride = signal<string | null>(null);
  readonly playerAvatar = computed(() => trainerAvatarPath(this.settings.trainerAvatar()));
  readonly npcAvatar = computed(() => trainerAvatarPath(this.npcAvatarId()));
  readonly npcName = computed(() => this.npcNameOverride() ?? trainerLabel(this.npcAvatarId()));

  private introTimer: ReturnType<typeof setTimeout> | null = null;

  playerSpriteSrc = () => backSpritePath(this.player().dexId);
  opponentSpriteSrc = () => frontSpritePath(this.opponent().dexId);
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

  // --- battle lifecycle -------------------------------------------------

  /** Fresh battle: heal the player team, set up the NPC trainer + party, show the VS intro. */
  private async startBattle(): Promise<void> {
    if (this.introTimer) clearTimeout(this.introTimer);
    this.resetTeams();
    this.outcome.set(null);
    this.log.set('');
    this.phase.set('intro');
    this.audio.startBattleMusic(); // one random looped battle theme per battle

    if (this.storyBattle) {
      this.applyStoryOpponent(this.storyBattle);
      this.opponentRoll = Promise.resolve();
      this.npcAvatarId.set(this.storyBattle.opponent.trainerId);
      this.npcNameOverride.set(this.storyBattle.opponent.name);
      this.introTimer = setTimeout(() => this.beginFight(), 2400);
      return;
    }

    this.opponentRoll = this.rollOpponentTeam();
    const [avatarId] = await Promise.all([this.roster.randomId(), this.opponentRoll]);
    this.npcAvatarId.set(avatarId);
    this.introTimer = setTimeout(() => this.beginFight(), 2400);
  }

  /** Load an authored story opponent in place of the random NPC roll. */
  private applyStoryOpponent(sb: PendingStoryBattle): void {
    const hp = (dexId: number) => this.damageCalc.hpStat(dexId);
    const mons = sb.opponent.team;
    this.opponentTeam.set(mons.map((m) => toBattlePokemon(m, hp)));
    this.opponentMovesets.set(
      mons.map((m) =>
        m.moves
          .map((id) => MOVE_LIBRARY.find((mv) => mv.showdownId === id))
          .filter((mv): mv is Move => mv !== undefined)
      )
    );
    this.activeOpponentIndex.set(0);
    this.faintDone.opponent = false;
  }

  /** Roll a fresh NPC party sized to the player's team (fully-evolved species,
   *  strong movesets). Falls back to a lone Glurak if generation yields nothing. */
  private async rollOpponentTeam(): Promise<void> {
    const size = this.playerTeam().length;
    let rolled: NpcPokemon[] = [];
    try {
      rolled = await this.npcTeam.generate(size);
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
    this.activeOpponentIndex.set(0);
    this.faintDone.opponent = false;
  }

  /**
   * Dismiss the intro and stage the send-out: the opponent throws their ball
   * first (cry after the ball animation), then the player throws theirs.
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

    const fx = this.fxRef.nativeElement;
    const field = this.fieldRef.nativeElement;
    const playerEl = this.playerSpriteRef.nativeElement;
    const oppEl = this.oppSpriteRef.nativeElement;
    playerEl.style.opacity = '0';
    oppEl.style.opacity = '0';

    this.log.set(`${this.npcName()} schickt ${this.opponent().name} in den Kampf!`);
    await this.animation.playSendOut(oppEl, fx, field, 'opponent');
    await this.wait(150);
    this.audio.playCry(this.opponent().dexId);
    await this.wait(550);

    this.log.set(`Los, ${this.player().name}!`);
    await this.animation.playSendOut(playerEl, fx, field, 'player');
    await this.wait(150);
    this.audio.playCry(this.player().dexId);
    await this.wait(300);

    this.log.set(`Was wird ${this.player().name} tun?`);
    this.isAnimating.set(false);
  }

  private endBattle(outcome: 'win' | 'loss'): void {
    this.audio.stopBattleMusic();
    this.outcome.set(outcome);
    this.isAnimating.set(false);
    this.menuState.set('main');
    this.log.set(outcome === 'win' ? `${this.npcName()} wurde besiegt!` : `${this.player().name} wurde besiegt!`);
    this.phase.set('result');
  }

  /** Which side's active sprite has already played its faint animation. */
  private faintDone: { player: boolean; opponent: boolean } = { player: false, opponent: false };

  private resetTeams(): void {
    // Heal whatever NPC party is still on the field; rollOpponentTeam() replaces it.
    this.opponentTeam.update((team) =>
      team.map((p) => ({ ...p, currentHp: p.maxHp, status: freshStatus(), boosts: freshBoosts() }))
    );
    this.activeOpponentIndex.set(0);
    this.playerTeam.set(this.derivePlayerTeam());
    this.movePp.set({});
    this.charge.set({ player: null, opponent: null });
    this.activePlayerIndex.set(0);
    this.menuState.set('main');
    this.isAnimating.set(false);
    this.faintDone = { player: false, opponent: false };
    for (const ref of [this.playerSpriteRef, this.oppSpriteRef]) {
      const el = ref?.nativeElement;
      if (!el) continue;
      el.getAnimations?.().forEach((a) => a.cancel());
      el.style.opacity = '';
      el.style.transform = '';
      el.style.filter = '';
    }
  }

  private spriteEl(side: 'player' | 'opponent'): HTMLElement {
    return (side === 'player' ? this.playerSpriteRef : this.oppSpriteRef).nativeElement;
  }

  /** Play the faint drop for any active Pokémon that just hit 0 HP (once). */
  private async settleFaints(): Promise<void> {
    for (const side of ['player', 'opponent'] as const) {
      const mon = side === 'player' ? this.player() : this.opponent();
      if (mon.currentHp > 0 || this.faintDone[side]) continue;
      this.faintDone[side] = true;
      this.charge.update((c) => ({ ...c, [side]: null })); // a fainted Pokémon drops any charge
      this.log.set(`${mon.name} wurde besiegt!`);
      await this.wait(250);
      this.audio.playCry(mon.dexId, true);
      await this.animation.playFaint(this.spriteEl(side));
    }
  }

  resetBattle(): void {
    this.startBattle();
  }

  toTeamSelect(): void {
    this.router.navigateByUrl('/team-select');
  }

  /** Story battle over: report the outcome to the run and hand back to the runner. */
  storyContinue(): void {
    if (!this.storyBattle) return;
    this.storyProgress.recordBattleOutcome(this.outcome() === 'win', this.storyBattle.scene);
    this.router.navigate(['/story'], { queryParams: { resume: 1 } });
  }

  // --- turns ----------------------------------------------------------

  async useMove(move: Move): Promise<void> {
    if (this.phase() !== 'fight' || this.isAnimating() || this.isActiveFainted()) return;
    if (this.charge().player) return; // locked into finishing a two-turn move

    const key = this.ppKey(move.showdownId);
    const remaining = this.movePp()[key] ?? this.damageCalc.maxPp(move);
    if (remaining <= 0) {
      this.log.set(`${move.name} hat keine AP mehr übrig!`);
      return;
    }
    // PP is spent when the move starts (the charge turn), not on release.
    this.movePp.update((m) => ({ ...m, [key]: (m[key] ?? remaining) - 1 }));

    await this.runRound(move);
  }

  /**
   * One round: both sides act (player's move given, NPC picks or completes its
   * own charge), in priority/Speed order, then {@link finishRound}. A Pokémon
   * locked into a two-turn move re-enters here automatically to release it.
   */
  private async runRound(playerMove: Move): Promise<void> {
    this.isAnimating.set(true);
    this.menuState.set('main');

    const npcMove = this.charge().opponent?.move ?? this.pickNpcMove();
    const order: ['player' | 'opponent', Move][] = this.playerActsFirst(playerMove, npcMove)
      ? [
          ['player', playerMove],
          ['opponent', npcMove]
        ]
      : [
          ['opponent', npcMove],
          ['player', playerMove]
        ];

    for (let i = 0; i < order.length; i++) {
      const [actor, mv] = order[i];
      const actorMon = actor === 'player' ? this.player() : this.opponent();
      if (actorMon.currentHp <= 0) continue; // KO'd by the faster Pokémon this turn
      if (this.battleDecided()) break;
      if (i > 0) await this.wait(550);
      await this.performMove(mv, actor);
      await this.settleFaints();
    }

    await this.finishRound();
  }

  /**
   * The NPC's move choice for its active Pokémon: score every move by expected
   * power against the player's current Pokémon (STAB + type effectiveness) and
   * usually take the best, with a small chance of a free pick so it isn't
   * perfectly predictable.
   */
  private pickNpcMove(): Move {
    const set = this.opponentMovesets()[this.activeOpponentIndex()] ?? [];
    const moves = set.length ? set : this.fallbackOpponentMoves();
    const target = this.player();
    const scored = moves.map((m) => ({ m, s: this.scoreNpcMove(m, target) }));
    const best = Math.max(...scored.map((x) => x.s));

    if (best <= 0 || Math.random() < 0.15) {
      return moves[Math.floor(Math.random() * moves.length)];
    }
    const top = scored.filter((x) => x.s >= best * 0.85).map((x) => x.m);
    return top[Math.floor(Math.random() * top.length)];
  }

  /**
   * Rough "how useful is this move right now" for the NPC AI. Damaging moves
   * score as base power x STAB x type-effectiveness vs `target`; status moves
   * score low so they stay situational rather than spammed.
   */
  private scoreNpcMove(move: Move, target: BattlePokemon, user: BattlePokemon = this.opponent()): number {
    if (this.damageCalc.isStatusMove(move)) return 12 * this.damageCalc.accuracy(move);
    const bp = this.damageCalc.basePower(move);
    if (bp <= 0) return 25; // fixed / variable damage (Seismic Toss, Night Shade, …)
    const eff = this.damageCalc.effectiveness(move, target); // 0, .25, .5, 1, 2, 4
    if (eff === 0) return 0;
    const stab = user.types.includes(move.type.toLowerCase()) ? 1.5 : 1;
    // Expected damage: fold in hit chance so the AI prefers reliable moves.
    return bp * stab * eff * this.damageCalc.hitChance(move, user, target);
  }

  /** Index of the healthy reserve with the best matchup vs the player's active
   *  Pokémon, or -1 when the NPC has nobody left to send in. */
  private pickOpponentSwitchIn(): number {
    const team = this.opponentTeam();
    const target = this.player();
    let bestIdx = -1;
    let best = -Infinity;
    for (let i = 0; i < team.length; i++) {
      if (i === this.activeOpponentIndex() || team[i].currentHp <= 0) continue;
      const set = this.opponentMovesets()[i] ?? [];
      const score = set.reduce((mx, mv) => Math.max(mx, this.scoreNpcMove(mv, target, team[i])), 0);
      if (score > best) {
        best = score;
        bestIdx = i;
      }
    }
    return bestIdx;
  }

  /** If the NPC's active fainted and it still has a healthy Pokémon, send in the
   *  best matchup against the player's current Pokémon. */
  private async replaceFaintedOpponent(): Promise<void> {
    if (this.opponent().currentHp > 0) return;
    const next = this.pickOpponentSwitchIn();
    if (next < 0) return; // whole party is down - checkEnd() ends the battle

    await this.wait(600);
    this.charge.update((c) => ({ ...c, opponent: null }));
    this.activeOpponentIndex.set(next);
    this.faintDone.opponent = false;

    const oppEl = this.oppSpriteRef.nativeElement;
    oppEl.getAnimations?.().forEach((a) => a.cancel());
    oppEl.style.opacity = '0';
    oppEl.style.transform = '';
    oppEl.style.filter = '';
    await this.wait(60);
    this.log.set(`${this.npcName()} schickt ${this.opponent().name} in den Kampf!`);
    await this.animation.playSendOut(oppEl, this.fxRef.nativeElement, this.fieldRef.nativeElement, 'opponent');
    await this.wait(120);
    this.audio.playCry(this.opponent().dexId);
    await this.wait(250);
  }

  /** True when the player's chosen move resolves before the NPC's. */
  private playerActsFirst(playerMove: Move, npcMove: Move): boolean {
    const pPrio = this.damageCalc.movePriority(playerMove);
    const nPrio = this.damageCalc.movePriority(npcMove);
    if (pPrio !== nPrio) return pPrio > nPrio;

    const pSpe = this.damageCalc.effectiveSpeed(this.player());
    const nSpe = this.damageCalc.effectiveSpeed(this.opponent());
    if (pSpe !== nSpe) return pSpe > nSpe;
    return Math.random() < 0.5;
  }

  private battleDecided(): boolean {
    return (
      this.opponentTeam().every((p) => p.currentHp <= 0) ||
      this.playerTeam().every((p) => p.currentHp <= 0)
    );
  }

  private refsFor(side: 'player' | 'opponent') {
    const playerEl = this.playerSpriteRef.nativeElement;
    const oppEl = this.oppSpriteRef.nativeElement;
    return {
      fieldEl: this.fieldRef.nativeElement,
      fxEl: this.fxRef.nativeElement,
      screenFxEl: this.screenFxRef.nativeElement,
      launchEl: side === 'player' ? playerEl : oppEl,
      targetEl: side === 'player' ? oppEl : playerEl
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

  /** The NPC's active Pokémon takes its turn (used after a player switch). */
  private async npcTurn(): Promise<void> {
    await this.wait(550);
    await this.performMove(this.pickNpcMove(), 'opponent');
  }

  /**
   * Runs the NPC's turn (unless the player's active just fainted) and settles
   * the round. Used when the player's action was a switch, so the NPC always
   * moves second.
   */
  private async resolveRound(): Promise<void> {
    if (!this.isActiveFainted() && this.opponent().currentHp > 0) {
      await this.npcTurn();
    }
    await this.finishRound();
  }

  /** End-of-turn status damage, then win / loss / hand control back to the player. */
  private async finishRound(): Promise<void> {
    await this.settleFaints();
    await this.replaceFaintedOpponent();
    if (await this.checkEnd()) return;

    await this.applyResiduals();
    await this.settleFaints();
    await this.replaceFaintedOpponent();
    if (await this.checkEnd()) return;

    // The player's Pokémon is mid two-turn move: release it automatically.
    const pending = this.charge().player;
    if (pending && !this.isActiveFainted()) {
      await this.wait(650);
      await this.runRound(pending.move);
      return;
    }

    this.isAnimating.set(false);
    this.menuState.set('main');
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

  /** End-of-turn burn / poison / toxic damage on both active Pokémon. */
  private async applyResiduals(): Promise<void> {
    for (const side of ['player', 'opponent'] as const) {
      const mon = side === 'player' ? this.player() : this.opponent();
      if (mon.currentHp <= 0 || !mon.status.major) continue;
      const r = this.status.residual(mon);
      this.patchActive(side, { status: r.status });
      if (r.damage > 0) {
        this.applyHp(side, -r.damage);
        if (r.message) this.log.set(r.message);
        await this.wait(800);
      }
    }
  }

  /**
   * Plays one move in whichever direction the acting side implies: the
   * player casts left -> right (player -> opponent), the NPC casts
   * right -> left (opponent -> player). Same animation, mirrored.
   */
  private async performMove(move: Move, side: 'player' | 'opponent'): Promise<void> {
    const foeSide = side === 'player' ? 'opponent' : 'player';
    const attacker = side === 'player' ? this.player() : this.opponent();
    const defender = side === 'player' ? this.opponent() : this.player();

    // --- status gate: sleep / freeze / paralysis / confusion may stop the move ---
    const pre = this.status.resolvePreMove(attacker);
    this.patchActive(side, { status: pre.status });
    if (pre.message) {
      this.log.set(pre.message);
      await this.wait(950);
    }
    if (pre.confusionSelfHit) {
      this.applyHp(side, -this.damageCalc.confusionSelfDamage(attacker));
      return;
    }
    if (!pre.canAct) return;

    const myCharge = this.charge()[side];
    const foeCharge = this.charge()[foeSide];

    // --- two-turn move, turn 1: start charging, deal nothing ---
    if (this.damageCalc.isChargeMove(move) && !myCharge) {
      const semiInvuln = this.damageCalc.isSemiInvulnMove(move);
      this.charge.update((c) => ({ ...c, [side]: { move, semiInvuln } }));
      this.log.set(this.chargeMessage(attacker.name, move));
      this.audio.playMove(move.showdownId);
      await this.animation.playMove(move, this.refsFor(side), 'charge');
      await this.wait(350);
      return;
    }

    // --- the target is off the field (Fly / Dig / …): the attack whiffs ---
    if (foeCharge?.semiInvuln) {
      this.log.set(`${attacker.name} setzt ${move.name} ein...`);
      this.audio.playMove(move.showdownId);
      await this.wait(650);
      this.log.set(`Doch ${defender.name} ist nicht zu sehen!`);
      await this.wait(700);
      return;
    }

    // --- two-turn move, turn 2: release (skip the charge visual, then hit) ---
    let phase: 'release' | undefined;
    if (myCharge && myCharge.move.showdownId === move.showdownId) {
      this.charge.update((c) => ({ ...c, [side]: null }));
      phase = 'release';
    }

    this.log.set(`${attacker.name} setzt ${move.name} ein...`);
    this.audio.playMove(move.showdownId);

    // --- accuracy check: base accuracy vs the accuracy/evasion stage gap ---
    if (!this.damageCalc.rollHit(move, attacker, defender)) {
      await this.wait(480);
      await this.animation.playDodge(this.spriteEl(foeSide));
      const crash = this.damageCalc.crashDamage(move, attacker); // Jump Kick / Hi Jump Kick
      if (crash > 0) {
        this.applyHp(side, -crash);
        this.log.set(`Die Attacke von ${attacker.name} ging daneben! ${attacker.name} verletzt sich dabei selbst!`);
      } else {
        this.log.set(`Die Attacke von ${attacker.name} ging daneben!`);
      }
      await this.wait(650);
      return;
    }

    await this.animation.playMove(move, this.refsFor(side), phase);

    // Drain and recoil scale with HP actually lost, so cap the roll at the
    // defender's current HP (overkilling a weak target costs less recoil).
    const rawDamage = this.damageCalc.calculateDamage(attacker, defender, move);
    const dealt = Math.min(rawDamage, defender.currentHp);
    if (dealt > 0) {
      this.applyHp(foeSide, -dealt);
      this.audio.playHit(this.damageCalc.effectiveness(move, defender));
    }

    const recovery = this.damageCalc.calculateRecovery(move, attacker, dealt);
    if (recovery.amount > 0) this.applyHp(side, recovery.amount);

    const recoil = this.damageCalc.calculateSelfDamage(move, attacker, dealt);
    if (recoil.amount > 0) this.applyHp(side, -recoil.amount);

    // --- status infliction / thaw on the defender ---
    let statusMsg: string | null = null;
    const defenderNow = foeSide === 'opponent' ? this.opponent() : this.player();
    if (defenderNow.currentHp > 0) {
      if (defenderNow.status.major === 'frz' && dealt > 0 && this.status.isFireMove(move)) {
        this.patchActive(foeSide, { status: { ...defenderNow.status, major: null } });
        statusMsg = `${defenderNow.name} ist aufgetaut!`;
      } else {
        const inflicted = this.status.rollInfliction(move, defenderNow, dealt);
        if (inflicted) {
          this.patchActive(foeSide, { status: this.status.applyInfliction(defenderNow, inflicted) });
          statusMsg = this.status.inflictionMessage(defenderNow.name, inflicted);
        }
      }
    }

    // Rest also puts the user to sleep for two turns.
    if (move.showdownId === 'rest' && recovery.amount > 0) {
      const rester = side === 'player' ? this.player() : this.opponent();
      this.patchActive(side, {
        status: { ...rester.status, major: 'slp', sleepTurns: 3, toxicTurns: 0 }
      });
    }

    // --- stat-stage changes (Swords Dance, Growl, Overheat's own drop, Crunch's chance …) ---
    const statLogs: string[] = [];
    const sc = this.statChange.resolve(move, defenderNow.types, dealt);
    if (Object.keys(sc.toUser).length) {
      const user = side === 'player' ? this.player() : this.opponent();
      const res = this.statChange.apply(user.boosts, sc.toUser);
      this.patchActive(side, { boosts: res.boosts });
      for (const ch of res.changes) statLogs.push(this.statChangeMessage(user.name, ch));
    }
    if (defenderNow.currentHp > 0 && Object.keys(sc.toTarget).length) {
      const tgt = foeSide === 'opponent' ? this.opponent() : this.player();
      const res = this.statChange.apply(tgt.boosts, sc.toTarget);
      this.patchActive(foeSide, { boosts: res.boosts });
      for (const ch of res.changes) statLogs.push(this.statChangeMessage(tgt.name, ch));
    }

    const foe = foeSide === 'opponent' ? this.opponent() : this.player();
    const me = side === 'player' ? this.player() : this.opponent();

    let line: string;
    if (foe.currentHp <= 0) {
      line = `${foe.name} wurde besiegt!`;
    } else if (recovery.kind === 'drain' && recovery.amount > 0) {
      line = `${move.name} trifft ${foe.name}! ${me.name} saugt Energie ab.`;
    } else if (recovery.kind === 'selfHeal' && recovery.amount > 0) {
      line = `${me.name} füllt seine KP auf!`;
    } else if (recovery.kind === 'selfHeal') {
      line = 'Aber es misslang!';
    } else if (dealt > 0) {
      line = `${move.name} trifft ${foe.name}!`;
    } else if (statLogs.length > 0) {
      line = statLogs.shift() as string; // a pure stat move - lead with the first change
    } else {
      line = `${move.name} zeigt keine Wirkung …`;
    }

    if (recoil.kind === 'selfKo' && foe.currentHp > 0) {
      line = `${me.name} setzt alles auf eine Karte!`;
    } else if (recoil.kind === 'recoil') {
      line +=
        me.currentHp <= 0
          ? ` ${me.name} bricht durch den Rückstoß zusammen.`
          : ` ${me.name} nimmt Rückstoß-Schaden.`;
    }
    if (statusMsg) line += ` ${statusMsg}`;
    this.log.set(line);

    for (const msg of statLogs) {
      await this.wait(850);
      this.log.set(msg);
    }
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

  /** Shallow-merge a patch onto one side's active Pokémon. */
  private patchActive(side: 'player' | 'opponent', patch: Partial<BattlePokemon>): void {
    if (side === 'opponent') {
      const idx = this.activeOpponentIndex();
      this.opponentTeam.update((team) => team.map((p, i) => (i === idx ? { ...p, ...patch } : p)));
      return;
    }
    const idx = this.activePlayerIndex();
    this.playerTeam.update((team) => team.map((p, i) => (i === idx ? { ...p, ...patch } : p)));
  }

  /** Add (heal) or subtract (damage) HP on one side's active Pokémon, clamped. */
  private applyHp(side: 'player' | 'opponent', delta: number): void {
    const mon = side === 'player' ? this.player() : this.opponent();
    this.patchActive(side, { currentHp: Math.max(0, Math.min(mon.maxHp, mon.currentHp + delta)) });
  }

  private wait(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  openFightMenu(): void {
    if (this.phase() !== 'fight' || this.isAnimating() || this.isActiveFainted()) return;
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
    this.menuState.set('main');
  }

  isActiveFainted(): boolean {
    return this.player().currentHp <= 0;
  }

  canSwitchTo(index: number): boolean {
    return index !== this.activePlayerIndex() && this.playerTeam()[index].currentHp > 0;
  }

  async switchPokemon(index: number): Promise<void> {
    if (this.isAnimating() || !this.canSwitchTo(index)) return;

    // Replacing a fainted Pokémon is free; a voluntary switch uses the round.
    const forced = this.isActiveFainted();
    this.isAnimating.set(true);
    this.menuState.set('main');
    this.charge.update((c) => ({ ...c, player: null })); // switching cancels a two-turn move

    const fx = this.fxRef.nativeElement;
    const field = this.fieldRef.nativeElement;
    const spriteEl = this.playerSpriteRef.nativeElement;

    if (!forced) {
      // Switching out clears volatiles: confusion ends, the toxic counter resets,
      // and all stat stages are lost.
      const out = this.player();
      this.patchActive('player', {
        status: { ...out.status, confusionTurns: 0, toxicTurns: out.status.major === 'tox' ? 1 : 0 },
        boosts: freshBoosts()
      });
      this.log.set(`${out.name}, komm zurück!`);
      await this.animation.playRecall(spriteEl, fx, field, 'player');
    }

    this.activePlayerIndex.set(index);
    this.faintDone.player = false;
    await this.wait(60); // let the sprite src rebind before it grows in
    this.log.set(`Los, ${this.player().name}!`);
    await this.animation.playSendOut(spriteEl, fx, field, 'player');
    await this.wait(120);
    this.audio.playCry(this.player().dexId);

    if (forced) {
      this.isAnimating.set(false);
      return;
    }

    await this.wait(250);
    await this.resolveRound();
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
