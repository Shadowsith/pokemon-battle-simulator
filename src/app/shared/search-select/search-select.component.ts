import { Component, computed, input, output, signal } from '@angular/core';

export interface SearchOption {
  id: string;
  label: string;
  /** Short secondary text (type, dex number …); also searched. */
  hint?: string;
  /** Optional accent colour for the hint chip. */
  color?: string;
}

/** Most matches rendered at once; type more to narrow the list. */
export const SEARCH_SELECT_LIMIT = 50;

/** Options whose label or hint contains `query` (case-insensitive), label-prefix matches first. */
export function filterOptions(options: readonly SearchOption[], query: string, limit = SEARCH_SELECT_LIMIT): SearchOption[] {
  const q = query.trim().toLowerCase();
  if (!q) return options.slice(0, limit);
  const prefix: SearchOption[] = [];
  const rest: SearchOption[] = [];
  for (const o of options) {
    const label = o.label.toLowerCase();
    if (label.startsWith(q)) prefix.push(o);
    else if (label.includes(q) || o.hint?.toLowerCase().includes(q)) rest.push(o);
  }
  return [...prefix, ...rest].slice(0, limit);
}

/**
 * A text input that filters a list of options as you type (combobox). Shows
 * the selected option's label while closed; ↑/↓ + Enter pick, Esc closes.
 */
@Component({
  selector: 'app-search-select',
  standalone: true,
  templateUrl: './search-select.component.html',
  styleUrl: './search-select.component.scss'
})
export class SearchSelectComponent {
  readonly options = input.required<readonly SearchOption[]>();
  /** Id of the selected option. */
  readonly value = input<string | null>(null);
  readonly placeholder = input('Suchen …');
  readonly selected = output<string>();

  readonly query = signal('');
  readonly open = signal(false);
  readonly highlight = signal(0);

  readonly matches = computed(() => filterOptions(this.options(), this.query()));
  readonly selectedLabel = computed(() => this.options().find((o) => o.id === this.value())?.label ?? '');

  onFocus(): void {
    this.query.set('');
    this.highlight.set(0);
    this.open.set(true);
  }

  onInput(text: string): void {
    this.query.set(text);
    this.highlight.set(0);
    this.open.set(true);
  }

  onBlur(): void {
    this.open.set(false);
  }

  onKeydown(event: KeyboardEvent): void {
    const n = this.matches().length;
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      this.open.set(true);
      if (n) this.highlight.update((i) => (i + (event.key === 'ArrowDown' ? 1 : n - 1)) % n);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const opt = this.matches()[this.highlight()];
      if (opt) this.pick(opt, event.target as HTMLInputElement);
    } else if (event.key === 'Escape') {
      this.open.set(false);
      (event.target as HTMLInputElement).blur();
    }
  }

  pick(opt: SearchOption, inputEl: HTMLInputElement): void {
    this.selected.emit(opt.id);
    this.open.set(false);
    inputEl.blur();
  }
}
