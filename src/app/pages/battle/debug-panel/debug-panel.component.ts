import { Component, computed, inject, input, output, signal } from '@angular/core';
import { MOVE_LIBRARY, Move } from '../../../core/models/move.model';
import { BattlePokemon } from '../../../core/models/pokemon.model';
import { SpeciesInfo } from '../../../core/models/team.model';
import { heldItem } from '../../../core/models/item.model';
import { germanSpeciesName } from '../../../core/models/species-names.de';
import { DexDataService } from '../../../core/services/dex-data.service';
import { MUSIC_TRACKS } from '../../../core/services/audio.service';
import type { Side } from '../../../core/battle/battle-format';
import { SearchOption, SearchSelectComponent } from '../../../shared/search-select/search-select.component';
import { ItemPickerComponent } from '../../../shared/item-picker/item-picker.component';
import { ItemIconComponent } from '../../../shared/item-icon/item-icon.component';

const MOVE_OPTIONS: SearchOption[] = [...MOVE_LIBRARY]
  .sort((a, b) => a.name.localeCompare(b.name, 'de'))
  .map((m) => ({ id: m.showdownId, label: m.name, hint: m.type, color: m.color }));

/**
 * Controls of the Debug-Kampf, shown below the field instead of the battle
 * menu: per side a Pokémon, a move and an item, plus the battle-logic toggle,
 * the music picker, reset and leave. Holds only its own selections; every
 * action is emitted to the battle page.
 */
@Component({
  selector: 'app-debug-panel',
  standalone: true,
  imports: [SearchSelectComponent, ItemPickerComponent, ItemIconComponent],
  templateUrl: './debug-panel.component.html',
  styleUrl: './debug-panel.component.scss'
})
export class DebugPanelComponent {
  private readonly dex = inject(DexDataService);

  readonly player = input.required<BattlePokemon>();
  readonly opponent = input.required<BattlePokemon>();
  /** True while an animation runs; action buttons are disabled. */
  readonly busy = input(false);

  readonly useMove = output<{ side: Side; move: Move; logic: boolean }>();
  readonly setPokemon = output<{ side: Side; species: SpeciesInfo }>();
  readonly setItem = output<{ side: Side; item: string | null }>();
  readonly playMusic = output<string>();
  readonly reset = output<void>();
  readonly leave = output<void>();

  readonly sides: { side: Side; label: string }[] = [
    { side: 'player', label: 'Ich' },
    { side: 'opponent', label: 'Gegner' }
  ];
  readonly musicTracks = MUSIC_TRACKS;
  readonly moveOptions = MOVE_OPTIONS;

  readonly useLogic = signal(false);
  readonly music = signal('');
  readonly moveId = signal<Record<Side, string>>({ player: 'tackle', opponent: 'tackle' });
  readonly speciesId = signal<Record<Side, string | null>>({ player: null, opponent: null });
  /** Side whose item picker is open. */
  readonly itemPickerFor = signal<Side | null>(null);

  private readonly species = signal<SpeciesInfo[]>([]);
  readonly speciesOptions = computed<SearchOption[]>(() =>
    this.species().map((s) => ({ id: s.id, label: germanSpeciesName(s.num, s.name), hint: `#${s.num}` }))
  );

  constructor() {
    this.dex.species().then((list) => this.species.set(list));
  }

  monOf(side: Side): BattlePokemon {
    return side === 'player' ? this.player() : this.opponent();
  }

  itemName(side: Side): string {
    return heldItem(this.monOf(side).item)?.name ?? 'Kein Item';
  }

  pickMove(side: Side, id: string): void {
    this.moveId.update((m) => ({ ...m, [side]: id }));
  }

  pickSpecies(side: Side, id: string): void {
    this.speciesId.update((m) => ({ ...m, [side]: id }));
  }

  attack(side: Side): void {
    const move = MOVE_LIBRARY.find((m) => m.showdownId === this.moveId()[side]);
    if (move) this.useMove.emit({ side, move, logic: this.useLogic() });
  }

  swapIn(side: Side): void {
    const species = this.species().find((s) => s.id === this.speciesId()[side]);
    if (species) this.setPokemon.emit({ side, species });
  }

  pickItem(item: string | null): void {
    const side = this.itemPickerFor();
    this.itemPickerFor.set(null);
    if (side) this.setItem.emit({ side, item });
  }

  pickMusic(track: string): void {
    this.music.set(track);
    if (track) this.playMusic.emit(track);
  }
}
