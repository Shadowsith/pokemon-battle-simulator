import { Component, input } from '@angular/core';
import { PartyEmblem } from '../battle.types';

/** A trainer's six Poké Ball emblems. Size via the `--ball-size` CSS variable (default 12px). */
@Component({
  selector: 'app-party-balls',
  standalone: true,
  template: `@for (e of emblems(); track $index) {
    <span class="party-ball" [class.owned]="e.owned" [class.active]="e.active" [class.fainted]="e.fainted"></span>
  }`,
  styleUrl: './party-balls.component.scss'
})
export class PartyBallsComponent {
  readonly emblems = input.required<PartyEmblem[]>();
}
