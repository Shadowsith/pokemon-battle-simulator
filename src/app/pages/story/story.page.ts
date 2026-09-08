import { Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { IonContent, IonButton } from '@ionic/angular/standalone';
import { trainerAvatarPath } from '../../core/models/trainer.model';
import {
  ChoiceOption,
  Scene,
  StoryArc,
  StoryDoc,
  loadArcIndex,
  loadStory
} from '../../core/models/story.model';
import { StoryProgressService } from '../../core/services/story-progress.service';
import { BattleHandoffService } from '../../core/services/battle-handoff.service';

type View = 'arcs' | 'start' | 'scene';

const DEFAULT_BG = 'linear-gradient(180deg, #e9eef5 0%, #f6f4ef 100%)';

@Component({
  selector: 'app-story',
  standalone: true,
  imports: [IonContent, IonButton],
  templateUrl: './story.page.html',
  styleUrl: './story.page.scss'
})
export class StoryPage {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly progress = inject(StoryProgressService);
  private readonly handoff = inject(BattleHandoffService);

  readonly avatarPath = trainerAvatarPath;

  readonly view = signal<View>('arcs');
  readonly arcs = signal<StoryArc[]>([]);
  readonly loadingArcs = signal(true);

  readonly selectedArc = signal<StoryArc | null>(null);
  private readonly storyDoc = signal<StoryDoc | null>(null);

  /** Index into the active dialogue scene's line queue. */
  readonly lineIndex = signal(0);

  readonly save = this.progress.save;

  /** The scene the current run points at, or null when there is no matching run. */
  readonly currentScene = computed<Scene | null>(() => {
    const doc = this.storyDoc();
    const save = this.progress.save();
    if (!doc || !save || save.storyId !== doc.id) return null;
    return doc.scenes[save.currentSceneId] ?? null;
  });

  readonly background = computed(() => this.currentScene()?.background || DEFAULT_BG);

  /** Whichever dialogue line is currently on screen. */
  readonly currentLine = computed(() => {
    const scene = this.currentScene();
    if (scene?.kind !== 'dialogue') return null;
    return scene.lines[this.lineIndex()] ?? null;
  });

  readonly canContinue = computed(() => {
    const arc = this.selectedArc();
    return !!arc && this.progress.hasRunFor(arc.id);
  });

  constructor() {
    void this.loadArcs();

    // On every scene change: reset the line queue and run enter-effects once.
    effect(() => {
      const scene = this.currentScene();
      if (!scene) return;
      untracked(() => {
        this.lineIndex.set(0);
        if (scene.kind === 'dialogue') this.progress.applyEffects(scene.effects);
        if (scene.kind === 'end') this.progress.finish(scene.endingId);
      });
    });
  }

  private async loadArcs(): Promise<void> {
    this.loadingArcs.set(true);
    const arcs = await loadArcIndex();
    this.arcs.set(arcs);
    this.loadingArcs.set(false);

    // Coming back from a story battle: reload the run's arc and drop into the scene.
    const save = this.progress.save();
    if (this.route.snapshot.queryParamMap.has('resume') && save) {
      const arc = arcs.find((a) => a.id === save.storyId);
      if (arc) {
        const doc = await loadStory(arc.file);
        if (doc) {
          this.storyDoc.set(doc);
          this.selectedArc.set(arc);
          this.view.set('scene');
        }
      }
    }
  }

  // --- arc selection -------------------------------------------------

  async selectArc(arc: StoryArc): Promise<void> {
    if (!arc.available) return;
    const doc = await loadStory(arc.file);
    if (!doc) {
      this.storyDoc.set(null);
      return;
    }
    this.storyDoc.set(doc);
    this.selectedArc.set(arc);
    this.view.set('start');
  }

  backToArcs(): void {
    this.selectedArc.set(null);
    this.storyDoc.set(null);
    this.view.set('arcs');
  }

  newStory(): void {
    const doc = this.storyDoc();
    if (!doc) return;
    const save = this.progress.save();
    if (save && save.storyId !== doc.id && !confirm('Ein anderer Spielstand wird überschrieben. Fortfahren?')) {
      return;
    }
    this.progress.start(doc);
    this.view.set('scene');
  }

  continueStory(): void {
    if (!this.canContinue()) return;
    this.view.set('scene');
  }

  // --- scene interaction -------------------------------------------------

  /** Advance a dialogue scene: next line, or move on once the queue is spent. */
  advanceDialogue(): void {
    const scene = this.currentScene();
    if (scene?.kind !== 'dialogue') return;
    if (this.lineIndex() + 1 < scene.lines.length) {
      this.lineIndex.update((i) => i + 1);
    } else {
      this.progress.goTo(scene.next);
    }
  }

  visibleOptions(): ChoiceOption[] {
    const scene = this.currentScene();
    if (scene?.kind !== 'choice') return [];
    return scene.options.filter((o) => this.progress.checkCondition(o.requires));
  }

  choose(option: ChoiceOption): void {
    this.progress.applyEffects(option.effects);
    this.progress.goTo(option.next);
  }

  startSceneBattle(): void {
    const scene = this.currentScene();
    if (scene?.kind !== 'battle') return;
    this.handoff.set({ opponent: scene.opponent, introText: scene.introText, scene });
    void this.router.navigateByUrl('/battle');
  }

  toMenu(): void {
    void this.router.navigateByUrl('/team-select');
  }
}
