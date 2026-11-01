import { Component, input } from '@angular/core';
import { Side } from '../../../core/battle/battle-format';
import { PartyBallsComponent } from '../party-balls/party-balls.component';
import { PartyEmblem } from '../battle.types';

/**
 * A trainer beside the battle field on large screens: name, sprite and party
 * balls. The player's panel sits bottom-left, the opponent's top-right, and
 * both trainers face the field.
 */
@Component({
  selector: 'app-trainer-panel',
  standalone: true,
  imports: [PartyBallsComponent],
  template: `
    <span class="trainer-name">{{ name() }}</span>
    <img class="trainer-sprite" [class.flip]="side() === 'player'" [src]="avatar()" [alt]="name()" />
    <app-party-balls [emblems]="emblems()" />
  `,
  styleUrl: './trainer-panel.component.scss',
  host: { '[class]': 'side()' }
})
export class TrainerPanelComponent {
  readonly side = input.required<Side>();
  readonly name = input.required<string>();
  readonly avatar = input.required<string>();
  readonly emblems = input.required<PartyEmblem[]>();
}
