import { Component, computed, input, output } from '@angular/core';
import type { TournamentMatch } from '../../../core/battle/tournament-bracket';
import { trainerAvatarPath } from '../../../core/models/trainer.model';
import { PLAYER_ENTRANT_ID, TournamentEntrant, roundLabel } from '../../../core/models/tournament.model';

interface MatchGroup {
  /** Two matches feeding the same next-round match (one for the final). */
  matches: { match: Readonly<TournamentMatch>; index: number }[];
}

/**
 * The knockout diagram: one column per round, connector lines joining each
 * pair of matches to the match they feed. Scrolls sideways on narrow screens.
 */
@Component({
  selector: 'app-tournament-bracket',
  standalone: true,
  templateUrl: './tournament-bracket.component.html',
  styleUrl: './tournament-bracket.component.scss'
})
export class TournamentBracketComponent {
  readonly rounds = input.required<readonly (readonly Readonly<TournamentMatch>[])[]>();
  readonly entrants = input.required<readonly TournamentEntrant[]>();
  /** The player's open match ("round:index"), highlighted. */
  readonly nextKey = input<string | null>(null);
  readonly entrantSelected = output<string>();

  readonly avatarPath = trainerAvatarPath;
  readonly playerId = PLAYER_ENTRANT_ID;

  private readonly byId = computed(() => new Map(this.entrants().map((e) => [e.id, e] as const)));

  readonly columns = computed(() => {
    const rounds = this.rounds();
    return rounds.map((matches, round) => {
      const groups: MatchGroup[] = [];
      const step = matches.length > 1 ? 2 : 1;
      for (let i = 0; i < matches.length; i += step) {
        groups.push({
          matches: matches.slice(i, i + step).map((match, k) => ({ match, index: i + k }))
        });
      }
      return { round, label: roundLabel(round, rounds.length), groups };
    });
  });

  entrant(id: string | null): TournamentEntrant | null {
    return id ? (this.byId().get(id) ?? null) : null;
  }

  isPlayerMatch(m: Readonly<TournamentMatch>): boolean {
    return m.a === PLAYER_ENTRANT_ID || m.b === PLAYER_ENTRANT_ID;
  }

  select(id: string | null): void {
    if (id) this.entrantSelected.emit(id);
  }
}
