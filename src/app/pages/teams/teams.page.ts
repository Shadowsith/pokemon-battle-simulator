import {
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
  computed,
  inject,
  signal
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonContent } from '@ionic/angular/standalone';
import { frontSpritePath, germanTypeLabel, typeColor } from '../../core/models/pokemon.model';
import {
  ImportedTeam,
  MAX_TEAM_SIZE,
  MOVES_PER_POKEMON,
  MoveInfo,
  SavedTeam,
  SpeciesInfo
} from '../../core/models/team.model';
import {
  buildExportFile,
  exportFileName,
  parseImportFile
} from '../../core/models/team-transfer.model';
import { DexDataService } from '../../core/services/dex-data.service';
import { TeamFileService } from '../../core/services/team-file.service';
import { TeamService } from '../../core/services/team.service';

type Picker = { kind: 'species' } | { kind: 'move'; pokeIndex: number; slot: number };

/** How a team from an import file clashes with / lands among the saved teams. */
type ImportChoice = 'new' | 'replace' | 'skip';
interface ImportRow {
  team: ImportedTeam;
  /** Existing team with the same name, if any. */
  conflictId: string | null;
  choice: ImportChoice;
}

@Component({
  selector: 'app-teams',
  standalone: true,
  imports: [IonContent, RouterLink],
  templateUrl: './teams.page.html',
  styleUrl: './teams.page.scss'
})
export class TeamsPage implements OnDestroy {
  @ViewChild('importInput') importInputRef?: ElementRef<HTMLInputElement>;

  private readonly dex = inject(DexDataService);
  private readonly teamFile = inject(TeamFileService);
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
  readonly typeLabel = germanTypeLabel;

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

  /** Export selection mode on the team list: which team ids are ticked. */
  readonly exportSelecting = signal(false);
  readonly exportSelected = signal<ReadonlySet<string>>(new Set());
  readonly allExportSelected = computed(
    () =>
      this.teamService.teams().length > 0 &&
      this.exportSelected().size === this.teamService.teams().length
  );

  /** Teams read from an import file, shown in the import dialog; null when closed. */
  readonly importRows = signal<ImportRow[] | null>(null);
  readonly importCount = computed(
    () => (this.importRows() ?? []).filter((r) => r.choice !== 'skip').length
  );
  readonly allImportSelected = computed(() => {
    const rows = this.importRows() ?? [];
    return rows.length > 0 && rows.every((r) => r.choice !== 'skip');
  });

  /** Short confirmation under the toolbar ("3 Teams importiert"). */
  readonly notice = signal<string | null>(null);
  private noticeTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    this.dex.species().then((s) => this.species.set(s));
    this.dex.moves().then((m) => this.movesById.set(m));
  }

  ngOnDestroy(): void {
    if (this.noticeTimer) clearTimeout(this.noticeTimer);
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

  // --- export ------------------------------------------------------

  startExportSelect(): void {
    this.exportSelected.set(new Set());
    this.exportSelecting.set(true);
  }

  cancelExportSelect(): void {
    this.exportSelecting.set(false);
  }

  toggleExport(id: string): void {
    this.exportSelected.update((sel) => {
      const next = new Set(sel);
      if (!next.delete(id)) next.add(id);
      return next;
    });
  }

  toggleAllExport(): void {
    this.exportSelected.set(
      this.allExportSelected() ? new Set() : new Set(this.teamService.teams().map((t) => t.id))
    );
  }

  async exportSelectedTeams(): Promise<void> {
    const sel = this.exportSelected();
    const teams = this.teamService.teams().filter((t) => sel.has(t.id));
    if (!teams.length) return;
    await this.saveTeams(teams);
    this.exportSelecting.set(false);
  }

  async exportOne(id: string): Promise<void> {
    const team = this.teamService.team(id);
    if (team) await this.saveTeams([team]);
  }

  private async saveTeams(teams: SavedTeam[]): Promise<void> {
    try {
      await this.teamFile.save(
        exportFileName(teams),
        JSON.stringify(buildExportFile(teams), null, 2)
      );
    } catch {
      alert('Export fehlgeschlagen.');
    }
  }

  // --- import ------------------------------------------------------

  pickImportFile(): void {
    this.importInputRef?.nativeElement.click();
  }

  async onImportFile(ev: Event): Promise<void> {
    const input = ev.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = ''; // allow picking the same file again
    if (!file) return;

    let text: string;
    try {
      text = await this.teamFile.read(file);
    } catch {
      alert('Die Datei konnte nicht gelesen werden.');
      return;
    }
    const { teams, error } = parseImportFile(text);
    if (error) {
      alert(error);
      return;
    }
    this.importRows.set(
      teams.map((team) => {
        const conflictId = this.teamService.findByName(team.name)?.id ?? null;
        return { team, conflictId, choice: 'new' as const };
      })
    );
  }

  setImportChoice(index: number, choice: ImportChoice): void {
    this.importRows.update(
      (rows) => rows?.map((r, i) => (i === index ? { ...r, choice } : r)) ?? null
    );
  }

  /** Checkbox on a row: include (as copy) or skip. */
  toggleImportRow(index: number): void {
    const row = this.importRows()?.[index];
    if (row) this.setImportChoice(index, row.choice === 'skip' ? 'new' : 'skip');
  }

  toggleAllImport(): void {
    const all = this.allImportSelected();
    this.importRows.update(
      (rows) =>
        rows?.map((r) => ({
          ...r,
          choice: all ? ('skip' as const) : r.choice === 'skip' ? ('new' as const) : r.choice
        })) ?? null
    );
  }

  closeImport(): void {
    this.importRows.set(null);
  }

  confirmImport(): void {
    const rows = this.importRows() ?? [];
    const count = this.teamService.importTeams(
      rows
        .filter((r) => r.choice !== 'skip')
        .map((r) =>
          r.choice === 'replace' && r.conflictId
            ? { team: r.team, mode: 'replace' as const, replaceId: r.conflictId }
            : { team: r.team, mode: 'new' as const }
        )
    );
    this.importRows.set(null);
    this.showNotice(count === 1 ? '1 Team importiert' : `${count} Teams importiert`);
  }

  private showNotice(text: string): void {
    if (this.noticeTimer) clearTimeout(this.noticeTimer);
    this.notice.set(text);
    this.noticeTimer = setTimeout(() => this.notice.set(null), 3500);
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
