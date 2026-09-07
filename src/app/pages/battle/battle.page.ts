import { Component, ElementRef, ViewChild, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { IonContent, IonButton } from '@ionic/angular/standalone';
import { MOVE_LIBRARY, Move } from '../../core/models/move.model';
import {
  BattlePokemon,
  STATUS_META,
  backSpritePath,
  freshStatus,
  frontSpritePath
} from '../../core/models/pokemon.model';
import {
  DEFAULT_TRAINER_AVATAR,
  trainerAvatarPath,
  trainerLabel
} from '../../core/models/trainer.model';
import { isBattleReady } from '../../core/models/team.model';
import { MoveAnimationService } from '../../core/services/move-animation.service';
import { AudioService } from '../../core/services/audio.service';
import { DamageCalcService } from '../../core/services/damage-calc.service';
import { SettingsService } from '../../core/services/settings.service';
import { TrainerRosterService } from '../../core/services/trainer-roster.service';
import { TeamService } from '../../core/services/team.service';
import { StatusService } from '../../core/services/status.service';

type MenuState = 'main' | 'fight' | 'pokemon';
/** intro = "VS" screen, fight = the battle proper, result = win/loss screen. */
type BattlePhase = 'intro' | 'fight' | 'result';

@Component({
  selector: 'app-battle',
  standalone: true,
  imports: [IonContent, IonButton],
  templateUrl: './battle.page.html',
  styleUrl: './battle.page.scss'
})
export class BattlePage {
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

  /** Status badge presentation, used by the template. */
  readonly statusMeta = STATUS_META;

  readonly log = signal('');
  readonly isAnimating = signal(false);
  readonly menuState = signal<MenuState>('main');

  readonly phase = signal<BattlePhase>('intro');
  readonly outcome = signal<'win' | 'loss' | null>(null);

  /** Used when the player hasn't built a team yet (also the move-animation test bed). */
  private readonly prototypeTeam: Omit<BattlePokemon, 'status'>[] = [
    { dexId: 197, name: 'Nachtara', maxHp: 100, currentHp: 100, types: ['dark'] },
    { dexId: 149, name: 'Dragoran', maxHp: 100, currentHp: 100, types: ['dragon', 'flying'] },
    { dexId: 31, name: 'Nidoqueen', maxHp: 100, currentHp: 100, types: ['poison', 'ground'] }
  ];

  readonly playerTeam = signal<BattlePokemon[]>(this.derivePlayerTeam());
  readonly activePlayerIndex = signal(0);
  readonly player = computed(() => this.playerTeam()[this.activePlayerIndex()]);

  /** true when the fight is using the player's built team rather than the prototype trio. */
  readonly usingBuiltTeam = computed(() => isBattleReady(this.teamService.team()));

  /** Moves shown in the fight menu: the active Pokémon's picks, or the whole
   *  library when no team is built (move-animation testing). */
  readonly activeMoves = computed<Move[]>(() => {
    const built = this.teamService.team();
    if (!isBattleReady(built)) return MOVE_LIBRARY;
    const mon = built[this.activePlayerIndex()];
    if (!mon) return [];
    return mon.moves
      .map((id) => MOVE_LIBRARY.find((m) => m.showdownId === id))
      .filter((m): m is Move => m !== undefined);
  });

  /** Remaining PP per move, keyed by "<active party slot>:<showdownId>". Reset each battle. */
  private readonly movePp = signal<Record<string, number>>({});

  /** The fight menu's moves with their current / max PP for display. */
  readonly activeMoveViews = computed(() => {
    const pp = this.movePp();
    const slot = this.activePlayerIndex();
    return this.activeMoves().map((move) => {
      const max = this.damageCalc.maxPp(move);
      const key = `${slot}:${move.showdownId}`;
      return { move, max, cur: pp[key] ?? max };
    });
  });

  private ppKey(showdownId: string): string {
    return `${this.activePlayerIndex()}:${showdownId}`;
  }

  private derivePlayerTeam(): BattlePokemon[] {
    const built = this.teamService.team();
    if (isBattleReady(built)) {
      return built.map((p) => ({
        dexId: p.speciesNum,
        name: p.name,
        maxHp: 100,
        currentHp: 100,
        types: p.types.map((t) => t.toLowerCase()),
        status: freshStatus()
      }));
    }
    return this.prototypeTeam.map((p) => ({ ...p, status: freshStatus() }));
  }

  readonly opponent = signal<BattlePokemon>({
    dexId: 6,
    name: 'Glurak',
    maxHp: 100,
    currentHp: 100,
    types: ['fire', 'flying'],
    status: freshStatus()
  });

  /** Trainer avatars shown on the intro and result screens. */
  private readonly npcAvatarId = signal<string>(DEFAULT_TRAINER_AVATAR);
  readonly playerAvatar = computed(() => trainerAvatarPath(this.settings.trainerAvatar()));
  readonly npcAvatar = computed(() => trainerAvatarPath(this.npcAvatarId()));
  readonly npcName = computed(() => trainerLabel(this.npcAvatarId()));

  private introTimer: ReturnType<typeof setTimeout> | null = null;

  /** Move pool the NPC opponent picks from on its counter-turn (prototype). */
  private readonly opponentMoves: Move[] = ['flamethrower', 'wingattack', 'dragonclaw', 'slash', 'airslash', 'heatwave']
    .map((showdownId) => MOVE_LIBRARY.find((m) => m.showdownId === showdownId))
    .filter((m): m is Move => m !== undefined);

  playerSpriteSrc = () => backSpritePath(this.player().dexId);
  opponentSpriteSrc = () => frontSpritePath(this.opponent().dexId);
  partySpriteSrc(pokemon: BattlePokemon): string {
    return frontSpritePath(pokemon.dexId);
  }

  constructor(
    private readonly animation: MoveAnimationService,
    private readonly audio: AudioService,
    private readonly damageCalc: DamageCalcService
  ) {
    this.startBattle();
  }

  // --- battle lifecycle -------------------------------------------------

  /** Fresh battle: heal both teams, roll a new NPC trainer, show the VS intro. */
  private async startBattle(): Promise<void> {
    if (this.introTimer) clearTimeout(this.introTimer);
    this.resetTeams();
    this.outcome.set(null);
    this.log.set('');
    this.phase.set('intro');
    this.npcAvatarId.set(await this.roster.randomId());
    this.introTimer = setTimeout(() => this.beginFight(), 2400);
  }

  /** Dismiss the intro and start taking turns - both trainers throw their ball. */
  beginFight(): void {
    if (this.introTimer) {
      clearTimeout(this.introTimer);
      this.introTimer = null;
    }
    if (this.phase() !== 'intro') return;
    this.phase.set('fight');
    this.log.set(`Was wird ${this.player().name} tun?`);
    const fx = this.fxRef.nativeElement;
    const field = this.fieldRef.nativeElement;
    this.animation.playSendOut(this.playerSpriteRef.nativeElement, fx, field, 'player');
    this.animation.playSendOut(this.oppSpriteRef.nativeElement, fx, field, 'opponent');
  }

  private endBattle(outcome: 'win' | 'loss'): void {
    this.outcome.set(outcome);
    this.isAnimating.set(false);
    this.menuState.set('main');
    this.log.set(outcome === 'win' ? `${this.npcName()} wurde besiegt!` : `${this.player().name} wurde besiegt!`);
    this.phase.set('result');
  }

  /** Which side's active sprite has already played its faint animation. */
  private faintDone: { player: boolean; opponent: boolean } = { player: false, opponent: false };

  private resetTeams(): void {
    this.opponent.update((p) => ({ ...p, currentHp: p.maxHp, status: freshStatus() }));
    this.playerTeam.set(this.derivePlayerTeam());
    this.movePp.set({});
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
      this.log.set(`${mon.name} wurde besiegt!`);
      await this.wait(250);
      await this.animation.playFaint(this.spriteEl(side));
    }
  }

  resetBattle(): void {
    this.startBattle();
  }

  toTeamSelect(): void {
    this.router.navigateByUrl('/team-select');
  }

  // --- turns ----------------------------------------------------------

  async useMove(move: Move): Promise<void> {
    if (this.phase() !== 'fight' || this.isAnimating() || this.isActiveFainted()) return;

    const key = this.ppKey(move.showdownId);
    const remaining = this.movePp()[key] ?? this.damageCalc.maxPp(move);
    if (remaining <= 0) {
      this.log.set(`${move.name} hat keine AP mehr übrig!`);
      return;
    }
    this.movePp.update((m) => ({ ...m, [key]: remaining - 1 }));

    this.isAnimating.set(true);
    this.menuState.set('main');

    await this.performMove(move, 'player');
    await this.settleFaints();

    // A KO from the player's move ends the round before the NPC can reply.
    if (this.opponent().currentHp <= 0) {
      await this.wait(300);
      this.endBattle('win');
      return;
    }

    await this.resolveRound();
  }

  /** The NPC's active Pokémon takes its turn. */
  private async npcTurn(): Promise<void> {
    await this.wait(550);
    const reply = this.opponentMoves[Math.floor(Math.random() * this.opponentMoves.length)];
    await this.performMove(reply, 'opponent');
  }

  /**
   * Runs the NPC's turn (unless the player's active just fainted), then the
   * end-of-turn status damage, then settles the round: win, loss, or hand
   * control back to the player.
   */
  private async resolveRound(): Promise<void> {
    if (!this.isActiveFainted() && this.opponent().currentHp > 0) {
      await this.npcTurn();
    }
    await this.settleFaints();
    if (await this.checkEnd()) return;

    await this.applyResiduals();
    await this.settleFaints();
    if (await this.checkEnd()) return;

    this.isAnimating.set(false);
    this.menuState.set('main');
  }

  private async checkEnd(): Promise<boolean> {
    if (this.opponent().currentHp <= 0) {
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

    this.log.set(`${attacker.name} setzt ${move.name} ein...`);
    this.audio.playMove(move.showdownId);

    const playerEl = this.playerSpriteRef.nativeElement;
    const oppEl = this.oppSpriteRef.nativeElement;
    await this.animation.playMove(move, {
      fieldEl: this.fieldRef.nativeElement,
      fxEl: this.fxRef.nativeElement,
      screenFxEl: this.screenFxRef.nativeElement,
      launchEl: side === 'player' ? playerEl : oppEl,
      targetEl: side === 'player' ? oppEl : playerEl
    });

    // Drain and recoil scale with HP actually lost, so cap the roll at the
    // defender's current HP (overkilling a weak target costs less recoil).
    const rawDamage = this.damageCalc.calculateDamage(attacker, defender, move);
    const dealt = Math.min(rawDamage, defender.currentHp);
    if (dealt > 0) this.applyHp(foeSide, -dealt);

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
  }

  /** Shallow-merge a patch onto one side's active Pokémon. */
  private patchActive(side: 'player' | 'opponent', patch: Partial<BattlePokemon>): void {
    if (side === 'opponent') {
      this.opponent.update((p) => ({ ...p, ...patch }));
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

    const fx = this.fxRef.nativeElement;
    const field = this.fieldRef.nativeElement;
    const spriteEl = this.playerSpriteRef.nativeElement;

    if (!forced) {
      // Switching out clears volatiles: confusion ends, the toxic counter resets.
      const out = this.player();
      this.patchActive('player', {
        status: { ...out.status, confusionTurns: 0, toxicTurns: out.status.major === 'tox' ? 1 : 0 }
      });
      this.log.set(`${out.name}, komm zurück!`);
      await this.animation.playRecall(spriteEl, fx, field, 'player');
    }

    this.activePlayerIndex.set(index);
    this.faintDone.player = false;
    await this.wait(60); // let the sprite src rebind before it grows in
    this.log.set(`Los, ${this.player().name}!`);
    await this.animation.playSendOut(spriteEl, fx, field, 'player');

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
