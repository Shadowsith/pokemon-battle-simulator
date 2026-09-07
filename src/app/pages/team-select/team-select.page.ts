import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { IonContent, IonButton } from '@ionic/angular/standalone';
import { frontSpritePath, typeColor } from '../../core/models/pokemon.model';
import { MAX_TEAM_SIZE, MOVES_PER_POKEMON, MoveInfo, SpeciesInfo } from '../../core/models/team.model';
import { TRAINER_AVATARS, trainerAvatarPath } from '../../core/models/trainer.model';
import { SettingsService } from '../../core/services/settings.service';
import { DexDataService } from '../../core/services/dex-data.service';
import { TeamService } from '../../core/services/team.service';

type Picker = { kind: 'species' } | { kind: 'move'; pokeIndex: number; slot: number };

@Component({
  selector: 'app-team-select',
  standalone: true,
  imports: [IonContent, IonButton],
  templateUrl: './team-select.page.html',
  styleUrl: './team-select.page.scss'
})
export class TeamSelectPage {
  private readonly router = inject(Router);
  private readonly settings = inject(SettingsService);
  private readonly dex = inject(DexDataService);
  readonly teamService = inject(TeamService);

  readonly maxTeam = MAX_TEAM_SIZE;
  readonly moveSlots = Array.from({ length: MOVES_PER_POKEMON }, (_, i) => i);

  readonly team = this.teamService.team;
  readonly species = signal<SpeciesInfo[]>([]);
  readonly movesById = signal<Record<string, MoveInfo>>({});

  readonly picker = signal<Picker | null>(null);
  readonly search = signal('');
  private readonly legalMoveIds = signal<string[]>([]);

  readonly avatarPath = computed(() => trainerAvatarPath(this.settings.trainerAvatar()));
  readonly avatarLabel = computed(
    () => TRAINER_AVATARS.find((a) => a.id === this.settings.trainerAvatar())?.label ?? ''
  );

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

  // --- team editing -------------------------------------------------

  openSpeciesPicker(): void {
    if (this.teamService.isFull()) return;
    this.search.set('');
    this.picker.set({ kind: 'species' });
  }

  openMovePicker(pokeIndex: number, slot: number): void {
    this.search.set('');
    this.legalMoveIds.set([]);
    this.picker.set({ kind: 'move', pokeIndex, slot });
    const speciesId = this.team()[pokeIndex]?.speciesId;
    if (speciesId) this.dex.legalMoves(speciesId).then((ids) => this.legalMoveIds.set(ids));
  }

  closePicker(): void {
    this.picker.set(null);
  }

  pickSpecies(s: SpeciesInfo): void {
    this.teamService.addPokemon(s);
    this.closePicker();
  }

  pickMove(moveId: string | null): void {
    const p = this.picker();
    if (p?.kind !== 'move') return;
    this.teamService.setMove(p.pokeIndex, p.slot, moveId);
    this.closePicker();
  }

  removePokemon(index: number): void {
    this.teamService.removePokemon(index);
  }

  clearTeam(): void {
    this.teamService.clear();
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
    return (this.team()[p.pokeIndex]?.moves ?? []).includes(moveId);
  }

  // --- navigation -------------------------------------------------

  startBattle(): void {
    this.router.navigateByUrl('/battle');
  }

  goToSettings(): void {
    this.router.navigateByUrl('/settings');
  }
}
