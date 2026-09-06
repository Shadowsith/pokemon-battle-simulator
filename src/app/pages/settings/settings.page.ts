import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonContent } from '@ionic/angular/standalone';
import { TRAINER_AVATARS, trainerAvatarPath } from '../../core/models/trainer.model';
import { SettingsService } from '../../core/services/settings.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [IonContent, RouterLink],
  templateUrl: './settings.page.html',
  styleUrl: './settings.page.scss'
})
export class SettingsPage {
  private readonly settings = inject(SettingsService);

  readonly avatars = TRAINER_AVATARS;
  readonly selected = this.settings.trainerAvatar;
  readonly avatarPath = trainerAvatarPath;

  choose(id: string): void {
    this.settings.setTrainerAvatar(id);
  }
}
