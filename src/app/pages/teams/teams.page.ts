import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonContent } from '@ionic/angular/standalone';
import { frontSpritePath, typeColor } from '../../core/models/pokemon.model';
import { MAX_TEAM_SIZE, MOVES_PER_POKEMON, MoveInfo, SpeciesInfo } from '../../core/models/team.model';
import { DexDataService } from '../../core/services/dex-data.service';
import { TeamService } from '../../core/services/team.service';

type Picker = { kind: 'species' } | { kind: 'move'; pokeIndex: number; slot: number };

@Component({
  selector: 'app-teams',
  standalone: true,
  imports: [IonContent, RouterLink],
  templateUrl: './teams.page.html',
  styleUrl: './teams.page.scss'
})
export class TeamsPage {
  private readonly dex = inject(DexDataService);
  readonly teamService = inject(TeamService);

  readonly maxTeam = MAX_TEAM_SIZE;
  readonly slotIndexes = Array.from({ length: MAX_TEAM_SIZE }, (_, i) => i);
  readonly moveSlots = Array.from({ length: MOVES_PER_POKEMON }, (_, i) => i);

  readonly species = signal<SpeciesInfo[]>([]);
  readonly movesById = signal<Record<string, MoveInfo>>({});

  readonly editingId = signal<string | null>(null);
  readonly editingTeam = computed(() => {
    const id = this.editingId();
    return id ? this.teamService.team(id) : null;
  });

  readonly picker = signal<Picker | null>(null);
  readonly search = signal('');
  private readonly legalMoveIds = signal<string[]>([]);

  /** Drag-to-reorder state for the team-edit grid. */
  readonly dragIndex = signal<number | null>(null);
  readonly dragOverIndex = signal<number | null>(null);

  readonly spritePath = frontSpritePath;
  readonly typeColor = typeColor;

  readonly filteredSpecies = computed(() => {
    const q = this.search().trim().toLowerCase();
    const list = this.species();
    if (!q) return list;
    return list.filter((s) => s.name.toLowerCase().includes(q) || String(s.num) === q);
  });

  readonly moveOptions = computed(() => {
    const byId = this.movesById();
    const q = this.search().trim().toLowerCase();
    return this.legalMoveIds()
      .map((id) => ({ id, info: byId[id] }))
      .filter((m): m is { id: string; info: MoveInfo } => !!m.info)
      .filter((m) => !q || m.info.name.toLowerCase().includes(q))
      .sort((a, b) => a.info.name.localeCompare(b.info.name));
  });

  constructor() {
    this.dex.species().then((s) => this.species.set(s));
    this.dex.moves().then((m) => this.movesById.set(m));
  }

  // --- team list ---------------------------------------------------

  newTeam(): void {
    this.editingId.set(this.teamService.createTeam());
  }

  editTeam(id: string): void {
    this.picker.set(null);
    this.editingId.set(id);
  }

  backToList(): void {
    this.picker.set(null);
    this.editingId.set(null);
  }

  useTeam(id: string): void {
    this.teamService.setActive(id);
  }

  duplicateTeam(id: string): void {
    this.teamService.duplicateTeam(id);
  }

  deleteTeam(id: string): void {
    const name = this.teamService.team(id)?.name ?? 'dieses Team';
    if (confirm(`„${name}" wirklich löschen?`)) this.teamService.deleteTeam(id);
  }

  renameEditing(name: string): void {
    const id = this.editingId();
    if (id) this.teamService.renameTeam(id, name);
  }

  clearEditing(): void {
    const id = this.editingId();
    if (id) this.teamService.clearTeam(id);
  }

  // --- editing one team's Pokémon --------------------------------

  private tid(): string {
    return this.editingId() ?? '';
  }

  openSpeciesPicker(): void {
    if (this.teamService.isFull(this.tid())) return;
    this.search.set('');
    this.picker.set({ kind: 'species' });
  }

  openMovePicker(pokeIndex: number, slot: number): void {
    this.search.set('');
    this.legalMoveIds.set([]);
    this.picker.set({ kind: 'move', pokeIndex, slot });
    const speciesId = this.editingTeam()?.pokemon[pokeIndex]?.speciesId;
    if (speciesId) this.dex.legalMoves(speciesId).then((ids) => this.legalMoveIds.set(ids));
  }

  closePicker(): void {
    this.picker.set(null);
  }

  pickSpecies(s: SpeciesInfo): void {
    this.teamService.addPokemon(this.tid(), s);
    this.closePicker();
  }

  pickMove(moveId: string | null): void {
    const p = this.picker();
    if (p?.kind !== 'move') return;
    this.teamService.setMove(this.tid(), p.pokeIndex, p.slot, moveId);
    this.closePicker();
  }

  removePokemon(index: number): void {
    this.teamService.removePokemon(this.tid(), index);
  }

  // --- reordering Pokémon within a team ------------------------

  /** Nudge a Pokémon one slot earlier (-1) or later (+1). */
  movePokemon(index: number, dir: -1 | 1): void {
    this.teamService.reorderPokemon(this.tid(), index, index + dir);
  }

  onDragStart(index: number, ev: DragEvent): void {
    this.dragIndex.set(index);
    this.dragOverIndex.set(index);
    if (ev.dataTransfer) {
      ev.dataTransfer.effectAllowed = 'move';
      ev.dataTransfer.setData('text/plain', String(index)); // Firefox needs a payload
    }
  }

  onDragOver(index: number, ev: DragEvent): void {
    if (this.dragIndex() === null) return;
    ev.preventDefault(); // allow the drop
    if (ev.dataTransfer) ev.dataTransfer.dropEffect = 'move';
    if (this.dragOverIndex() !== index) this.dragOverIndex.set(index);
  }

  onDrop(index: number, ev: DragEvent): void {
    ev.preventDefault();
    const from = this.dragIndex();
    if (from !== null && from !== index) {
      this.teamService.reorderPokemon(this.tid(), from, index);
    }
    this.onDragEnd();
  }

  onDragEnd(): void {
    this.dragIndex.set(null);
    this.dragOverIndex.set(null);
  }

  moveName(id: string): string {
    return this.movesById()[id]?.name ?? id;
  }

  moveType(id: string): string {
    return this.movesById()[id]?.type ?? '';
  }

  catLabel(category: 'phys' | 'spec' | 'status'): string {
    return category === 'phys' ? 'Physisch' : category === 'spec' ? 'Speziell' : 'Status';
  }

  isMoveTaken(moveId: string): boolean {
    const p = this.picker();
    if (p?.kind !== 'move') return false;
    return (this.editingTeam()?.pokemon[p.pokeIndex]?.moves ?? []).includes(moveId);
  }
}
