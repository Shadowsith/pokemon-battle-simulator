import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { IonContent, IonButton } from '@ionic/angular/standalone';

@Component({
  selector: 'app-team-select',
  standalone: true,
  imports: [IonContent, IonButton],
  template: `
    <ion-content class="ion-padding">
      <h1>Pokémon Battle Simulator</h1>
      <p>Teamaufbau folgt hier später. Für jetzt: direkt in den Move-Animation-Prototyp.</p>
      <ion-button expand="block" (click)="goToBattle()">Testkampf starten</ion-button>
    </ion-content>
  `
})
export class TeamSelectPage {
  constructor(private readonly router: Router) {}

  goToBattle(): void {
    this.router.navigateByUrl('/battle');
  }
}
