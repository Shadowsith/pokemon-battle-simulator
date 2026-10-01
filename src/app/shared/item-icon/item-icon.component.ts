import { Component, computed, input } from '@angular/core';
import { heldItem, itemIconStyle } from '../../core/models/item.model';

/** A held item's 24 × 24 icon from the Showdown item sheet (nothing for no item). */
@Component({
  selector: 'app-item-icon',
  standalone: true,
  template: `@if (item(); as it) {
    <span class="item-icon" [style]="style()" [title]="it.name" role="img" [attr.aria-label]="it.name"></span>
  }`,
  styles: `
    :host {
      display: inline-flex;
      vertical-align: middle;
    }
    .item-icon {
      display: inline-block;
      width: 24px;
      height: 24px;
      image-rendering: pixelated;
      background-repeat: no-repeat;
    }
  `
})
export class ItemIconComponent {
  readonly itemId = input<string | null | undefined>(null);
  readonly item = computed(() => heldItem(this.itemId()));
  readonly style = computed(() => itemIconStyle(this.item()));
}
