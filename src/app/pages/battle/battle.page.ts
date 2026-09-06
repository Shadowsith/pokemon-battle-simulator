import { Component, ElementRef, ViewChild, computed, signal } from '@angular/core';
import { IonContent, IonButton } from '@ionic/angular/standalone';
import { MOVE_LIBRARY, Move } from '../../core/models/move.model';
import { BattlePokemon, backSpritePath, frontSpritePath } from '../../core/models/pokemon.model';
import { MoveAnimationService } from '../../core/services/move-animation.service';
import { AudioService } from '../../core/services/audio.service';
import { DamageCalcService } from '../../core/services/damage-calc.service';

type MenuState = 'main' | 'fight' | 'pokemon';

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

  readonly moves: Move[] = MOVE_LIBRARY;
  readonly log = signal('');
  readonly isAnimating = signal(false);
  readonly menuState = signal<MenuState>('main');

  // Replace with real team-selection data later - hardcoded for the prototype.
  readonly playerTeam = signal<BattlePokemon[]>([
    { dexId: 197, name: 'Nachtara', maxHp: 100, currentHp: 100, types: ['dark'] },
    { dexId: 149, name: 'Dragoran', maxHp: 100, currentHp: 100, types: ['dragon', 'flying'] },
    { dexId: 31, name: 'Nidoqueen', maxHp: 100, currentHp: 100, types: ['poison', 'ground'] }
  ]);
  readonly activePlayerIndex = signal(0);
  readonly player = computed(() => this.playerTeam()[this.activePlayerIndex()]);

  readonly opponent = signal<BattlePokemon>({ dexId: 6, name: 'Glurak', maxHp: 100, currentHp: 100, types: ['fire', 'flying'] });

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
  ) {}

  async useMove(move: Move): Promise<void> {
    if (this.isAnimating() || this.isActiveFainted()) return;
    this.isAnimating.set(true);
    this.menuState.set('main');

    await this.performMove(move, 'player');

    if (this.opponent().currentHp > 0 && !this.isActiveFainted()) {
      await this.wait(550);
      const reply = this.opponentMoves[Math.floor(Math.random() * this.opponentMoves.length)];
      await this.performMove(reply, 'opponent');
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
    if (this.isAnimating() || this.isActiveFainted()) return;
    this.menuState.set('fight');
  }

  openPokemonMenu(): void {
    if (this.isAnimating()) return;
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

  resetBattle(): void {
    this.opponent.update((p) => ({ ...p, currentHp: p.maxHp }));
    this.playerTeam.update((team) => team.map((p) => ({ ...p, currentHp: p.maxHp })));
    this.activePlayerIndex.set(0);
    this.menuState.set('main');
    this.log.set('');
  }
}
