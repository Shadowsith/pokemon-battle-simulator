import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonContent, IonRange } from '@ionic/angular/standalone';
import { TRAINER_AVATARS, trainerAvatarPath } from '../../core/models/trainer.model';
import { SettingsService } from '../../core/services/settings.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [IonContent, IonRange, RouterLink],
  templateUrl: './settings.page.html',
  styleUrl: './settings.page.scss'
})
export class SettingsPage {
  private readonly settings = inject(SettingsService);

  readonly avatars = TRAINER_AVATARS;
  readonly selected = this.settings.trainerAvatar;
  readonly avatarPath = trainerAvatarPath;

  readonly volume = this.settings.volume;
  readonly volumePct = computed(() => Math.round(this.settings.volume() * 100));
  readonly musicVolume = this.settings.musicVolume;
  readonly musicVolumePct = computed(() => Math.round(this.settings.musicVolume() * 100));
  readonly volumePin = (value: number): string => `${Math.round(value)}%`;

  readonly allowLegendaries = this.settings.allowLegendaries;

  choose(id: string): void {
    this.settings.setTrainerAvatar(id);
  }

  onVolume(ev: Event): void {
    const v = this.rangeValue(ev);
    if (v !== null) this.settings.setVolume(v / 100);
  }

  onMusicVolume(ev: Event): void {
    const v = this.rangeValue(ev);
    if (v !== null) this.settings.setMusicVolume(v / 100);
  }

  onAllowLegendaries(ev: Event): void {
    this.settings.setAllowLegendaries((ev.target as HTMLInputElement).checked);
  }

  private rangeValue(ev: Event): number | null {
    const value = (ev as CustomEvent<{ value: number | { lower: number; upper: number } }>).detail
      .value;
    return typeof value === 'number' ? value : null;
  }
}
