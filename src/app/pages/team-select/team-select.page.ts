import { Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { IonContent, IonButton } from '@ionic/angular/standalone';
import { TRAINER_AVATARS, trainerAvatarPath } from '../../core/models/trainer.model';
import { SettingsService } from '../../core/services/settings.service';

@Component({
  selector: 'app-team-select',
  standalone: true,
  imports: [IonContent, IonButton],
  template: `
    <ion-content class="ion-padding">
      <h1>Pokémon Battle Simulator</h1>

      <button type="button" class="trainer-badge" (click)="goToSettings()">
        <img [src]="avatarPath()" [alt]="avatarLabel()" width="56" height="56" />
        <span class="trainer-text">
          <small>Trainer</small>
          {{ avatarLabel() }}
        </span>
      </button>

      <p>Teamaufbau folgt hier später. Für jetzt: direkt in den Move-Animation-Prototyp.</p>
      <ion-button expand="block" (click)="goToBattle()">Testkampf starten</ion-button>
      <ion-button expand="block" fill="outline" (click)="goToSettings()">Einstellungen</ion-button>
    </ion-content>
  `,
  styles: [
    `
      .trainer-badge {
        display: flex;
        align-items: center;
        gap: 12px;
        margin: 12px 0 20px;
        padding: 8px 14px;
        background: #fafafa;
        border: 1px solid #e2e2e2;
        border-radius: 12px;
        cursor: pointer;
      }

      .trainer-badge img {
        width: 48px;
        height: 48px;
        image-rendering: pixelated;
      }

      .trainer-text {
        display: flex;
        flex-direction: column;
        font-weight: 600;
      }

      .trainer-text small {
        font-weight: 400;
        font-size: 11px;
        color: #777;
      }
    `
  ]
})
export class TeamSelectPage {
  private readonly router = inject(Router);
  private readonly settings = inject(SettingsService);

  readonly avatarPath = computed(() => trainerAvatarPath(this.settings.trainerAvatar()));
  readonly avatarLabel = computed(
    () => TRAINER_AVATARS.find((a) => a.id === this.settings.trainerAvatar())?.label ?? ''
  );

  goToBattle(): void {
    this.router.navigateByUrl('/battle');
  }

  goToSettings(): void {
    this.router.navigateByUrl('/settings');
  }
}
