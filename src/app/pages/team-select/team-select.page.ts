import { Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { IonContent, IonButton } from '@ionic/angular/standalone';
import { frontSpritePath } from '../../core/models/pokemon.model';
import { TRAINER_AVATARS, trainerAvatarPath } from '../../core/models/trainer.model';
import { SettingsService } from '../../core/services/settings.service';
import { TeamService } from '../../core/services/team.service';

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
  readonly teamService = inject(TeamService);

  readonly spritePath = frontSpritePath;
  readonly slotIndexes = [0, 1, 2, 3, 4, 5];

  readonly avatarPath = computed(() => trainerAvatarPath(this.settings.trainerAvatar()));
  readonly avatarLabel = computed(
    () => TRAINER_AVATARS.find((a) => a.id === this.settings.trainerAvatar())?.label ?? ''
  );

  startBattle(): void {
    this.router.navigateByUrl('/battle');
  }

  goToCustomBattle(): void {
    this.router.navigateByUrl('/custom-battle');
  }

  goToEliteFour(): void {
    this.router.navigateByUrl('/elite-four');
  }

  goToStory(): void {
    this.router.navigateByUrl('/story');
  }

  goToMap(): void {
    this.router.navigateByUrl('/map');
  }

  goToTeams(): void {
    this.router.navigateByUrl('/teams');
  }

  goToSettings(): void {
    this.router.navigateByUrl('/settings');
  }
}
