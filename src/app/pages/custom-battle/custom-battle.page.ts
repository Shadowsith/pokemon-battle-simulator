import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { IonContent, IonButton } from '@ionic/angular/standalone';
import { POKEMON_TYPES, frontSpritePath, typeColor } from '../../core/models/pokemon.model';
import { MOVES_PER_POKEMON, MoveInfo, SpeciesInfo, isBattleReady } from '../../core/models/team.model';
import { germanSpeciesName } from '../../core/models/species-names.de';
import { TRAINER_AVATARS, trainerAvatarPath } from '../../core/models/trainer.model';
import {
  CustomBattleConfig,
  OpponentMode,
  clampConfig,
  defaultCustomBattleConfig
} from '../../core/models/custom-battle.model';
import { DexDataService } from '../../core/services/dex-data.service';
import { TeamService } from '../../core/services/team.service';
import { CustomBattleService } from '../../core/services/custom-battle.service';

type Picker = { kind: 'species' } | { kind: 'move'; pokeIndex: number; slot: number };

@Component({
  selector: 'app-custom-battle',
  standalone: true,
  imports: [IonContent, IonButton, RouterLink],
  templateUrl: './custom-battle.page.html',
  styleUrl: './custom-battle.page.scss'
})
export class CustomBattlePage {
  private readonly router = inject(Router);
  private readonly dex = inject(DexDataService);
  readonly teamService = inject(TeamService);
  readonly customBattleSvc = inject(CustomBattleService);

  readonly types = POKEMON_TYPES;
  readonly avatars = TRAINER_AVATARS;
  readonly avatarPath = trainerAvatarPath;
  readonly spritePath = frontSpritePath;
  readonly typeColor = typeColor;
  readonly moveSlots = Array.from({ length: MOVES_PER_POKEMON }, (_, i) => i);

  readonly config = signal<CustomBattleConfig>(defaultCustomBattleConfig());
  readonly presetId = signal<string>('');
  readonly saveName = signal<string>('');

  readonly species = signal<SpeciesInfo[]>([]);
  readonly movesById = signal<Record<string, MoveInfo>>({});

  readonly picker = signal<Picker | null>(null);
  readonly search = signal('');
  private readonly legalMoveIds = signal<string[]>([]);

  readonly slotIndexes = computed(() =>
    Array.from({ length: this.config().opponentCount }, (_, i) => i)
  );

  readonly canAddMon = computed(() => this.config().team.length < this.config().opponentCount);

  readonly canStart = computed(() => {
    const c = this.config();
    if (c.mode === 'random') return true;
    return isBattleReady(c.team) && c.team.every((m) => m.moves.length >= 1);
  });

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

  // --- presets -----------------------------------------------------

  loadPreset(id: string): void {
    this.presetId.set(id);
    const p = this.customBattleSvc.get(id);
    if (p) this.config.set(clampConfig(cloneConfig(p.config)));
  }

  deletePreset(): void {
    const id = this.presetId();
    if (!id) return;
    this.customBattleSvc.remove(id);
    this.presetId.set('');
  }

  savePreset(): void {
    const name = this.saveName().trim();
    if (!name) return;
    this.customBattleSvc.save(name, clampConfig(this.config()));
    const match = this.customBattleSvc.saved().find((s) => s.name === name);
    if (match) this.presetId.set(match.id);
  }

  // --- top-level config -----------------------------------------

  private patch(fn: (c: CustomBattleConfig) => CustomBattleConfig): void {
    this.config.update((c) => clampConfig(fn({ ...c })));
  }

  setCount(n: number): void {
    this.patch((c) => ({ ...c, opponentCount: n }));
  }

  stepCount(delta: number): void {
    this.setCount(this.config().opponentCount + delta);
  }

  setMode(mode: OpponentMode): void {
    this.patch((c) => ({ ...c, mode }));
  }

  toggleForceDistinct(on: boolean): void {
    this.patch((c) => ({ ...c, forceDistinctTypes: on, forceSingleType: on ? false : c.forceSingleType }));
  }

  toggleForceSingle(on: boolean): void {
    this.patch((c) => ({ ...c, forceSingleType: on, forceDistinctTypes: on ? false : c.forceDistinctTypes }));
  }

  isDistinctType(t: string): boolean {
    return this.config().distinctTypes.includes(t);
  }

  canPickDistinctType(t: string): boolean {
    const c = this.config();
    return c.distinctTypes.includes(t) || c.distinctTypes.length < c.opponentCount;
  }

  toggleDistinctType(t: string): void {
    this.patch((c) => {
      const has = c.distinctTypes.includes(t);
      if (has) return { ...c, distinctTypes: c.distinctTypes.filter((x) => x !== t) };
      if (c.distinctTypes.length >= c.opponentCount) return c;
      return { ...c, distinctTypes: [...c.distinctTypes, t] };
    });
  }

  setSingleType(value: string): void {
    this.patch((c) => ({ ...c, singleType: value || null }));
  }

  // --- avatar --------------------------------------------------

  get avatarEnabled(): boolean {
    return this.config().avatarId !== null;
  }

  toggleAvatar(on: boolean): void {
    this.patch((c) => ({ ...c, avatarId: on ? (c.avatarId ?? this.avatars[0]?.id ?? null) : null }));
  }

  chooseAvatar(id: string): void {
    this.patch((c) => ({ ...c, avatarId: id }));
  }

  // --- opponent team editor ----------------------------------

  copyPlayerTeam(teamId: string): void {
    const team = this.teamService.team(teamId);
    if (!team) return;
    this.patch((c) => ({
      ...c,
      team: team.pokemon.slice(0, c.opponentCount).map((p) => ({
        speciesNum: p.speciesNum,
        speciesId: p.speciesId,
        name: p.name,
        types: [...p.types],
        moves: [...p.moves]
      }))
    }));
  }

  openSpeciesPicker(): void {
    if (!this.canAddMon()) return;
    this.search.set('');
    this.picker.set({ kind: 'species' });
  }

  openMovePicker(pokeIndex: number, slot: number): void {
    this.search.set('');
    this.legalMoveIds.set([]);
    this.picker.set({ kind: 'move', pokeIndex, slot });
    const speciesId = this.config().team[pokeIndex]?.speciesId;
    if (speciesId) this.dex.legalMoves(speciesId).then((ids) => this.legalMoveIds.set(ids));
  }

  closePicker(): void {
    this.picker.set(null);
  }

  pickSpecies(s: SpeciesInfo): void {
    this.patch((c) =>
      c.team.length >= c.opponentCount
        ? c
        : {
            ...c,
            team: [
              ...c.team,
              {
                speciesNum: s.num,
                speciesId: s.id,
                name: germanSpeciesName(s.num, s.name),
                types: s.types,
                moves: []
              }
            ]
          }
    );
    this.closePicker();
  }

  pickMove(moveId: string | null): void {
    const p = this.picker();
    if (p?.kind !== 'move') return;
    this.patch((c) => ({
      ...c,
      team: c.team.map((mon, i) => {
        if (i !== p.pokeIndex) return mon;
        const moves = [...mon.moves];
        if (moveId === null) {
          moves.splice(p.slot, 1);
        } else {
          if (moves.includes(moveId)) return mon;
          moves[p.slot] = moveId;
        }
        return { ...mon, moves: moves.filter(Boolean).slice(0, MOVES_PER_POKEMON) };
      })
    }));
    this.closePicker();
  }

  removeMon(index: number): void {
    this.patch((c) => ({ ...c, team: c.team.filter((_, i) => i !== index) }));
  }

  isMoveTaken(moveId: string): boolean {
    const p = this.picker();
    if (p?.kind !== 'move') return false;
    return (this.config().team[p.pokeIndex]?.moves ?? []).includes(moveId);
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

  // --- launch ------------------------------------------------

  start(): void {
    if (!this.canStart()) return;
    this.customBattleSvc.set(clampConfig(this.config()));
    this.router.navigateByUrl('/battle');
  }
}

function cloneConfig(c: CustomBattleConfig): CustomBattleConfig {
  return JSON.parse(JSON.stringify(c)) as CustomBattleConfig;
}
