import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { IonContent, IonButton } from '@ionic/angular/standalone';
import { trainerAvatarPath } from '../../core/models/trainer.model';
import { ELITE_FOUR_REGIONS, EliteFourMember, eliteFourRegion } from '../../core/models/elite-four.model';
import { EliteFourRunService } from '../../core/services/elite-four-run.service';
import { TeamService } from '../../core/services/team.service';

type MemberState = 'beaten' | 'next' | 'lost' | 'upcoming';

@Component({
  selector: 'app-elite-four',
  standalone: true,
  imports: [IonContent, IonButton, RouterLink],
  templateUrl: './elite-four.page.html',
  styleUrl: './elite-four.page.scss'
})
export class EliteFourPage {
  private readonly router = inject(Router);
  readonly e4 = inject(EliteFourRunService);
  readonly teamService = inject(TeamService);

  readonly avatarPath = trainerAvatarPath;
  readonly regions = ELITE_FOUR_REGIONS;

  readonly view = signal<'config' | 'run'>(this.e4.run() ? 'run' : 'config');
  readonly selectedRegionId = signal<string>('kanto');

  readonly run = this.e4.run;
  readonly runRegion = this.e4.region;
  readonly nextMember = this.e4.currentMember;

  readonly selectedRegion = computed(() => eliteFourRegion(this.selectedRegionId()));

  /** Member rows for the run list, each with its progress state. */
  readonly memberRows = computed<{ member: EliteFourMember; state: MemberState }[]>(() => {
    const r = this.run();
    const region = this.runRegion();
    if (!r || !region) return [];
    return region.members.map((member, i) => {
      let state: MemberState;
      if (r.status === 'won') state = 'beaten';
      else if (r.status === 'lost') state = i < r.index ? 'beaten' : i === r.index ? 'lost' : 'upcoming';
      else state = i < r.index ? 'beaten' : i === r.index ? 'next' : 'upcoming';
      return { member, state };
    });
  });

  // --- config ------------------------------------------------------

  pickRegion(id: string): void {
    const r = eliteFourRegion(id);
    if (r?.available) this.selectedRegionId.set(id);
  }

  startRun(): void {
    if (!this.teamService.activeReady() || !this.selectedRegion()?.available) return;
    this.e4.start(this.selectedRegionId());
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
    this.e4.start(this.run()?.regionId ?? this.selectedRegionId());
  }

  newRun(): void {
    this.e4.reset();
    this.view.set('config');
  }

  toMenu(): void {
    void this.router.navigateByUrl('/team-select');
  }
}
