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
    if (this.isAnimating()) return;
    this.isAnimating.set(true);
    this.log.set(`${this.player().name} setzt ${move.name} ein...`);
    this.audio.play(move.soundId);

    await this.animation.playMove(move, {
      fieldEl: this.fieldRef.nativeElement,
      fxEl: this.fxRef.nativeElement,
      screenFxEl: this.screenFxRef.nativeElement,
      launchEl: this.playerSpriteRef.nativeElement,
      targetEl: this.oppSpriteRef.nativeElement
    });

    const damage = this.damageCalc.calculateDamage(this.player(), this.opponent(), move);
    this.opponent.update((p) => ({ ...p, currentHp: Math.max(0, p.currentHp - damage) }));
    this.log.set(`${move.name} trifft ${this.opponent().name}!`);
    this.isAnimating.set(false);
    this.menuState.set('main');
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
