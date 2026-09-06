import { Component, ElementRef, ViewChild, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { IonContent, IonButton } from '@ionic/angular/standalone';
import { MOVE_LIBRARY, Move } from '../../core/models/move.model';
import { BattlePokemon, backSpritePath, frontSpritePath } from '../../core/models/pokemon.model';
import {
  DEFAULT_TRAINER_AVATAR,
  trainerAvatarPath,
  trainerLabel
} from '../../core/models/trainer.model';
import { MoveAnimationService } from '../../core/services/move-animation.service';
import { AudioService } from '../../core/services/audio.service';
import { DamageCalcService } from '../../core/services/damage-calc.service';
import { SettingsService } from '../../core/services/settings.service';
import { TrainerRosterService } from '../../core/services/trainer-roster.service';

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

  readonly moves: Move[] = MOVE_LIBRARY;
  readonly log = signal('');
  readonly isAnimating = signal(false);
  readonly menuState = signal<MenuState>('main');

  readonly phase = signal<BattlePhase>('intro');
  readonly outcome = signal<'win' | 'loss' | null>(null);

  // Replace with real team-selection data later - hardcoded for the prototype.
  readonly playerTeam = signal<BattlePokemon[]>([
    { dexId: 197, name: 'Nachtara', maxHp: 100, currentHp: 100, types: ['dark'] },
    { dexId: 149, name: 'Dragoran', maxHp: 100, currentHp: 100, types: ['dragon', 'flying'] },
    { dexId: 31, name: 'Nidoqueen', maxHp: 100, currentHp: 100, types: ['poison', 'ground'] }
  ]);
  readonly activePlayerIndex = signal(0);
  readonly player = computed(() => this.playerTeam()[this.activePlayerIndex()]);

  readonly opponent = signal<BattlePokemon>({ dexId: 6, name: 'Glurak', maxHp: 100, currentHp: 100, types: ['fire', 'flying'] });

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

  /** Dismiss the intro and start taking turns. */
  beginFight(): void {
    if (this.introTimer) {
      clearTimeout(this.introTimer);
      this.introTimer = null;
    }
    if (this.phase() === 'intro') {
      this.phase.set('fight');
      this.log.set(`Was wird ${this.player().name} tun?`);
    }
  }

  private endBattle(outcome: 'win' | 'loss'): void {
    this.outcome.set(outcome);
    this.isAnimating.set(false);
    this.menuState.set('main');
    this.log.set(outcome === 'win' ? `${this.npcName()} wurde besiegt!` : `${this.player().name} wurde besiegt!`);
    this.phase.set('result');
  }

  private resetTeams(): void {
    this.opponent.update((p) => ({ ...p, currentHp: p.maxHp }));
    this.playerTeam.update((team) => team.map((p) => ({ ...p, currentHp: p.maxHp })));
    this.activePlayerIndex.set(0);
    this.menuState.set('main');
    this.isAnimating.set(false);
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
    this.isAnimating.set(true);
    this.menuState.set('main');

    await this.performMove(move, 'player');

    if (this.opponent().currentHp <= 0) {
      await this.wait(650);
      this.endBattle('win');
      return;
    }

    if (!this.isActiveFainted()) {
      await this.wait(550);
      const reply = this.opponentMoves[Math.floor(Math.random() * this.opponentMoves.length)];
      await this.performMove(reply, 'opponent');
    }

    if (this.playerTeam().every((p) => p.currentHp <= 0)) {
      await this.wait(650);
      this.endBattle('loss');
      return;
    }

    this.isAnimating.set(false);
    this.menuState.set('main');
  }

  /**
   * Plays one move in whichever direction the acting side implies: the
   * player casts left -> right (player -> opponent), the NPC casts
   * right -> left (opponent -> player). Same animation, mirrored.
   */
  private async performMove(move: Move, side: 'player' | 'opponent'): Promise<void> {
    const attacker = side === 'player' ? this.player() : this.opponent();
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

    if (side === 'player') {
      const damage = this.damageCalc.calculateDamage(this.player(), this.opponent(), move);
      this.opponent.update((p) => ({ ...p, currentHp: Math.max(0, p.currentHp - damage) }));
      const opp = this.opponent();
      this.log.set(opp.currentHp <= 0 ? `${opp.name} wurde besiegt!` : `${move.name} trifft ${opp.name}!`);
    } else {
      const damage = this.damageCalc.calculateDamage(this.opponent(), this.player(), move);
      const idx = this.activePlayerIndex();
      this.playerTeam.update((team) =>
        team.map((p, i) => (i === idx ? { ...p, currentHp: Math.max(0, p.currentHp - damage) } : p))
      );
      const me = this.player();
      this.log.set(me.currentHp <= 0 ? `${me.name} wurde besiegt!` : `${move.name} trifft ${me.name}!`);
    }
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

  switchPokemon(index: number): void {
    if (this.isAnimating() || !this.canSwitchTo(index)) return;
    this.activePlayerIndex.set(index);
    this.log.set(`Los, ${this.player().name}!`);
    this.menuState.set('main');
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
