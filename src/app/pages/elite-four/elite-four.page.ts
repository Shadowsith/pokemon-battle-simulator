import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { IonContent, IonButton } from '@ionic/angular/standalone';
import { trainerAvatarPath } from '../../core/models/trainer.model';
import { typeColor } from '../../core/models/pokemon.model';
import { ELITE_FOUR_REGIONS } from '../../core/models/elite-four.model';
import { GYM_REGIONS } from '../../core/models/gym-leader.model';
import type { GymLeader, RunMember, RunRegion } from '../../core/models/trainer-run.model';
import { EliteFourRunService } from '../../core/services/elite-four-run.service';
import { GymRunService } from '../../core/services/gym-run.service';
import { TrainerRunService } from '../../core/services/trainer-run.service';
import { TeamService } from '../../core/services/team.service';
import type { BattleFormat } from '../../core/battle/battle-format';

type MemberState = 'beaten' | 'next' | 'lost' | 'upcoming';
type ChallengeKind = 'elite-four' | 'gyms';

/** Per-mode wording; `{region}` / `{n}` are filled in by the template helpers. */
const CHALLENGE_TEXTS: Record<ChallengeKind, { title: string; hint: string; won: string; lost: string }> = {
  'elite-four': {
    title: 'Top-Vier-Herausforderung',
    hint:
      'Wähle eine Region und fordere ihre Top Vier in kanonischer Reihenfolge heraus. Zwischen den ' +
      'Kämpfen werden die KP deines Teams aufgefüllt – verbrauchte AP und Statusprobleme bleiben aber ' +
      'bestehen. Eine Niederlage beendet den Lauf.',
    won: '🏆 Du hast die Top Vier von {region} besiegt!',
    lost: 'Die Top Vier lassen dich nicht durch. Sammle dich und versuch es erneut.'
  },
  gyms: {
    title: 'Arenaleiter-Herausforderung',
    hint:
      'Wähle eine Region und besiege ihre {n} Arenaleiter in kanonischer Reihenfolge. Zwischen den ' +
      'Kämpfen werden die KP deines Teams aufgefüllt – verbrauchte AP und Statusprobleme bleiben aber ' +
      'bestehen. Eine Niederlage beendet den Lauf.',
    won: '🏅 Du hast alle Orden von {region} gesammelt!',
    lost: 'Die Arenaleiter lassen dich nicht durch. Sammle dich und versuch es erneut.'
  }
};

@Component({
  selector: 'app-elite-four',
  standalone: true,
  imports: [IonContent, IonButton, RouterLink],
  templateUrl: './elite-four.page.html',
  styleUrl: './elite-four.page.scss'
})
export class EliteFourPage {
  private readonly router = inject(Router);
  readonly teamService = inject(TeamService);

  /** Which run mode this page drives: route data `challenge` ('elite-four' | 'gyms'). */
  readonly kind: ChallengeKind =
    inject(ActivatedRoute).snapshot.data['challenge'] === 'gyms' ? 'gyms' : 'elite-four';
  private readonly e4: TrainerRunService =
    this.kind === 'gyms' ? inject(GymRunService) : inject(EliteFourRunService);
  readonly texts = CHALLENGE_TEXTS[this.kind];

  readonly avatarPath = trainerAvatarPath;
  readonly typeColor = typeColor;
  readonly regions: RunRegion[] = this.kind === 'gyms' ? GYM_REGIONS : ELITE_FOUR_REGIONS;

  readonly view = signal<'config' | 'run'>(this.e4.run() ? 'run' : 'config');
  readonly selectedRegionId = signal<string>('kanto');
  readonly selectedFormat = signal<BattleFormat>('singles');
  /** Doubles needs at least two Pokémon in the player's active team. */
  readonly canDouble = computed(() => (this.teamService.activeTeam()?.pokemon.length ?? 0) >= 2);

  readonly run = this.e4.run;
  readonly runRegion = this.e4.region;
  readonly nextMember = this.e4.currentMember;

  readonly selectedRegion = computed(() => this.findRegion(this.selectedRegionId()));

  /** Member rows for the run list, each with its progress state. */
  readonly memberRows = computed<{ member: RunMember; state: MemberState; badge: GymLeader | null }[]>(() => {
    const r = this.run();
    const region = this.runRegion();
    if (!r || !region) return [];
    return region.members.map((member, i) => {
      let state: MemberState;
      if (r.status === 'won') state = 'beaten';
      else if (r.status === 'lost') state = i < r.index ? 'beaten' : i === r.index ? 'lost' : 'upcoming';
      else state = i < r.index ? 'beaten' : i === r.index ? 'next' : 'upcoming';
      return { member, state, badge: asGymLeader(member) };
    });
  });

  /** Gym mode: badges earned so far / total. */
  readonly badgeCount = computed(() => {
    const rows = this.memberRows();
    if (!rows.some((r) => r.badge)) return null;
    return { earned: rows.filter((r) => r.badge && r.state === 'beaten').length, total: rows.length };
  });

  private findRegion(id: string): RunRegion | undefined {
    return this.regions.find((r) => r.id === id);
  }

  /** Fill the `{region}` / `{n}` placeholders of a text. */
  fill(text: string, region?: RunRegion): string {
    const r = region ?? this.selectedRegion();
    return text.replace('{region}', r?.label ?? '').replace('{n}', String(r?.members.length || 8));
  }

  // --- config ------------------------------------------------------

  pickRegion(id: string): void {
    const r = this.findRegion(id);
    if (r?.available) this.selectedRegionId.set(id);
  }

  setFormat(format: BattleFormat): void {
    if (format === 'doubles' && !this.canDouble()) return;
    this.selectedFormat.set(format);
  }

  startRun(): void {
    if (!this.teamService.activeReady() || !this.selectedRegion()?.available) return;
    const format = this.selectedFormat() === 'doubles' && this.canDouble() ? 'doubles' : 'singles';
    this.e4.start(this.selectedRegionId(), format);
    this.view.set('run');
  }

  // --- run --------------------------------------------------------

  startNextFight(): void {
    const m = this.nextMember();
    if (!m) return;
    this.e4.setPending(m);
    void this.router.navigateByUrl('/battle');
  }

  restartRun(): void {
    this.e4.start(this.run()?.regionId ?? this.selectedRegionId(), this.run()?.format ?? this.selectedFormat());
  }

  newRun(): void {
    this.e4.reset();
    this.view.set('config');
  }

  toMenu(): void {
    void this.router.navigateByUrl('/team-select');
  }
}

function asGymLeader(member: RunMember): GymLeader | null {
  return 'badge' in member ? (member as GymLeader) : null;
}
