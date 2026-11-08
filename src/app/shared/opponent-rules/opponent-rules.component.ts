import { Component, input, output } from '@angular/core';
import { POKEMON_TYPES, germanTypeLabel, typeColor } from '../../core/models/pokemon.model';
import { MAX_TEAM_SIZE } from '../../core/models/team.model';
import { RandomOpponentRules, clampRules } from '../../core/models/custom-battle.model';
import { SCENES, SceneId, isSceneId } from '../../core/battle/battle-background';
import type { BattleFormat } from '../../core/battle/battle-format';

/**
 * Settings for randomly rolled NPC opponents: format, background, team size and
 * the type rules. Used by Custom Battle (random mode) and the tournament.
 * Content projected into the component appears between the team size and the
 * type rules (Custom Battle puts its opponent-mode switch there).
 */
@Component({
  selector: 'app-opponent-rules',
  standalone: true,
  templateUrl: './opponent-rules.component.html',
  styleUrl: './opponent-rules.component.scss'
})
export class OpponentRulesComponent {
  readonly rules = input.required<RandomOpponentRules>();
  /** Doubles needs at least two Pokémon in the player's active team. */
  readonly canDouble = input(true);
  /** Hide the type rules (Custom Battle with a hand-built opponent team). */
  readonly showTypeRules = input(true);
  /** Label above the team size stepper. */
  readonly countLabel = input('Anzahl gegnerischer Pokémon');
  readonly rulesChange = output<RandomOpponentRules>();

  readonly types = POKEMON_TYPES;
  readonly scenes = SCENES;
  readonly maxCount = MAX_TEAM_SIZE;
  readonly typeColor = typeColor;
  readonly typeLabel = germanTypeLabel;

  private patch(change: Partial<RandomOpponentRules>): void {
    this.rulesChange.emit(clampRules({ ...this.rules(), ...change }));
  }

  minCount(): number {
    return this.rules().format === 'doubles' ? 2 : 1;
  }

  setFormat(format: BattleFormat): void {
    if (format === 'doubles' && !this.canDouble()) return;
    this.patch({ format });
  }

  setBackground(value: string): void {
    const background: SceneId | 'random' = isSceneId(value) ? value : 'random';
    this.patch({ background });
  }

  stepCount(delta: number): void {
    this.patch({ opponentCount: this.rules().opponentCount + delta });
  }

  toggleForceDistinct(on: boolean): void {
    this.patch({ forceDistinctTypes: on, forceSingleType: on ? false : this.rules().forceSingleType });
  }

  toggleForceSingle(on: boolean): void {
    this.patch({ forceSingleType: on, forceDistinctTypes: on ? false : this.rules().forceDistinctTypes });
  }

  isDistinctType(t: string): boolean {
    return this.rules().distinctTypes.includes(t);
  }

  canPickDistinctType(t: string): boolean {
    const r = this.rules();
    return r.distinctTypes.includes(t) || r.distinctTypes.length < r.opponentCount;
  }

  toggleDistinctType(t: string): void {
    const r = this.rules();
    if (r.distinctTypes.includes(t)) {
      this.patch({ distinctTypes: r.distinctTypes.filter((x) => x !== t) });
    } else if (r.distinctTypes.length < r.opponentCount) {
      this.patch({ distinctTypes: [...r.distinctTypes, t] });
    }
  }

  setSingleType(value: string): void {
    this.patch({ singleType: value || null });
  }
}
