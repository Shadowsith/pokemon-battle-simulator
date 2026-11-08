import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { IonContent, IonButton } from '@ionic/angular/standalone';
import { frontSpritePath } from '../../core/models/pokemon.model';
import { trainerAvatarPath } from '../../core/models/trainer.model';
import type { RandomOpponentRules } from '../../core/models/custom-battle.model';
import {
  TOURNAMENT_SIZES,
  TournamentConfig,
  TournamentSize,
  clampTournamentConfig,
  defaultTournamentConfig,
  roundLabel
} from '../../core/models/tournament.model';
import { TeamService } from '../../core/services/team.service';
import { TournamentService } from '../../core/services/tournament.service';
import { OpponentRulesComponent } from '../../shared/opponent-rules/opponent-rules.component';
import { TournamentBracketComponent } from './tournament-bracket/tournament-bracket.component';

/** Tournament mode: settings, then the bracket with the player's next match. */
@Component({
  selector: 'app-tournament',
  standalone: true,
  imports: [IonContent, IonButton, RouterLink, OpponentRulesComponent, TournamentBracketComponent],
  templateUrl: './tournament.page.html',
  styleUrl: './tournament.page.scss'
})
export class TournamentPage {
  private readonly router = inject(Router);
  readonly teamService = inject(TeamService);
  readonly svc = inject(TournamentService);

  readonly sizes = TOURNAMENT_SIZES;
  readonly avatarPath = trainerAvatarPath;
  readonly spritePath = frontSpritePath;

  readonly config = signal<TournamentConfig>(defaultTournamentConfig());
  /** True while the NPC teams are being rolled. */
  readonly creating = signal(false);
  /** Entrant whose team is shown in the sheet. */
  readonly shownId = signal<string | null>(null);

  readonly tournament = this.svc.tournament;
  readonly bracket = this.svc.bracket;
  readonly opponent = this.svc.currentOpponent;
  readonly champion = this.svc.champion;

  /** Doubles needs at least two Pokémon in the player's active team. */
  readonly canDouble = computed(() => (this.teamService.activeTeam()?.pokemon.length ?? 0) >= 2);

  readonly nextKey = computed(() => {
    const m = this.svc.nextMatch();
    return m ? `${m.round}:${m.index}` : null;
  });

  /** "Viertelfinale" etc. for the player's next match. */
  readonly nextRoundLabel = computed(() => {
    const m = this.svc.nextMatch();
    const b = this.bracket();
    return m && b ? roundLabel(m.round, b.roundCount) : '';
  });

  readonly shown = computed(() => this.svc.entrant(this.shownId()));

  // --- config --------------------------------------------------------

  setSize(size: TournamentSize): void {
    this.config.update((c) => ({ ...c, size }));
  }

  setRules(rules: RandomOpponentRules): void {
    this.config.update((c) => clampTournamentConfig({ ...c, ...rules }));
  }

  async start(): Promise<void> {
    if (!this.teamService.activeReady() || this.creating()) return;
    const c = this.config();
    this.creating.set(true);
    try {
      await this.svc.create({ ...c, format: c.format === 'doubles' && this.canDouble() ? 'doubles' : 'singles' });
    } finally {
      this.creating.set(false);
    }
  }

  // --- bracket --------------------------------------------------------

  startFight(): void {
    this.svc.setPending();
    void this.router.navigateByUrl('/battle');
  }

  showEntrant(id: string): void {
    const e = this.svc.entrant(id);
    this.shownId.set(e && !e.isPlayer ? id : null);
  }

  newTournament(): void {
    this.svc.reset();
  }

  toMenu(): void {
    void this.router.navigateByUrl('/team-select');
  }
}
