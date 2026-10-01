import { Component, computed, input, output, signal } from '@angular/core';
import { HeldItem, ITEM_CATEGORIES, ITEMS, ItemCategory } from '../../core/models/item.model';
import { ItemIconComponent } from '../item-icon/item-icon.component';

/**
 * Bottom-sheet picker for a Pokémon's held item: category tabs, search, icon +
 * German name + one-line effect, and "— Kein Item". Emits the chosen id (null
 * to clear) or `closed` when dismissed.
 */
@Component({
  selector: 'app-item-picker',
  standalone: true,
  imports: [ItemIconComponent],
  templateUrl: './item-picker.component.html',
  styleUrl: './item-picker.component.scss'
})
export class ItemPickerComponent {
  /** The item currently held, highlighted in the list. */
  readonly current = input<string | null | undefined>(null);
  readonly picked = output<string | null>();
  readonly closed = output<void>();

  readonly categories = ITEM_CATEGORIES;
  readonly category = signal<ItemCategory | 'all'>('all');
  readonly search = signal('');

  readonly items = computed<HeldItem[]>(() => {
    const q = this.search().trim().toLowerCase();
    const cat = this.category();
    return ITEMS.filter(
      (i) =>
        (cat === 'all' || i.category === cat) &&
        (!q || i.name.toLowerCase().includes(q) || i.desc.toLowerCase().includes(q))
    );
  });

  pick(id: string | null): void {
    this.picked.emit(id);
  }

  close(): void {
    this.closed.emit();
  }
}
