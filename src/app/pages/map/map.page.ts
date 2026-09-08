import {
  AfterViewInit,
  Component,
  ElementRef,
  HostListener,
  NgZone,
  OnDestroy,
  ViewChild,
  inject
} from '@angular/core';
import { Router } from '@angular/router';
import { IonButton } from '@ionic/angular/standalone';
import { loadMap } from '../../core/game/overworld-map.model';
import { Tileset } from '../../core/game/tileset';
import { OverworldEngine, OverworldInput } from '../../core/game/overworld-engine';

const LOGICAL_W = 240; // GBA-ish logical resolution; the canvas is integer-scaled up
const LOGICAL_H = 160;
const MAP_URL = 'assets/overworld/route01.json';
const PLAYER_URL = 'assets/overworld/player.png';

type Dir = keyof OverworldInput;

@Component({
  selector: 'app-map',
  standalone: true,
  imports: [IonButton],
  templateUrl: './map.page.html',
  styleUrl: './map.page.scss'
})
export class MapPage implements AfterViewInit, OnDestroy {
  @ViewChild('host', { static: true }) hostRef!: ElementRef<HTMLElement>;
  @ViewChild('screen', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;

  private readonly router = inject(Router);
  private readonly zone = inject(NgZone);

  private ctx!: CanvasRenderingContext2D;
  private engine: OverworldEngine | null = null;
  private raf = 0;
  private lastT = 0;
  private resizeObs: ResizeObserver | null = null;

  /** Held directions from the keyboard and the on-screen D-pad, OR'd together. */
  private readonly key: OverworldInput = { up: false, down: false, left: false, right: false };
  private readonly pad: OverworldInput = { up: false, down: false, left: false, right: false };

  loading = { done: false, hasArt: false };

  get engineReady(): boolean {
    return this.engine !== null;
  }

  async ngAfterViewInit(): Promise<void> {
    const canvas = this.canvasRef.nativeElement;
    canvas.width = LOGICAL_W;
    canvas.height = LOGICAL_H;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    this.ctx = ctx;
    this.ctx.imageSmoothingEnabled = false;

    const map = await loadMap(MAP_URL);
    if (!map) {
      this.loading.done = true;
      return;
    }

    const tileset = new Tileset(map.tileSize, map.columns);
    // Character sheet: 3 columns (stand + 2 walk), 4 rows, frames 16x20.
    const playerSheet = new Tileset(16, 3, 20);
    const [tilesetOk] = await Promise.all([tileset.load(map.tileset), playerSheet.load(PLAYER_URL)]);
    this.loading = { done: true, hasArt: tilesetOk };

    this.engine = new OverworldEngine(map, tileset, playerSheet);
    this.fitCanvas();
    this.resizeObs = new ResizeObserver(() => this.fitCanvas());
    this.resizeObs.observe(this.hostRef.nativeElement);

    this.zone.runOutsideAngular(() => {
      const frame = (t: number): void => {
        const dt = this.lastT ? t - this.lastT : 16;
        this.lastT = t;
        const input: OverworldInput = {
          up: this.key.up || this.pad.up,
          down: this.key.down || this.pad.down,
          left: this.key.left || this.pad.left,
          right: this.key.right || this.pad.right
        };
        this.engine?.update(dt, input, LOGICAL_W, LOGICAL_H);
        this.engine?.render(this.ctx, LOGICAL_W, LOGICAL_H);
        this.raf = requestAnimationFrame(frame);
      };
      this.raf = requestAnimationFrame(frame);
    });
  }

  ngOnDestroy(): void {
    cancelAnimationFrame(this.raf);
    this.resizeObs?.disconnect();
  }

  private fitCanvas(): void {
    const host = this.hostRef.nativeElement;
    const scale = Math.max(1, Math.floor(Math.min(host.clientWidth / LOGICAL_W, host.clientHeight / LOGICAL_H)));
    const canvas = this.canvasRef.nativeElement;
    canvas.style.width = `${LOGICAL_W * scale}px`;
    canvas.style.height = `${LOGICAL_H * scale}px`;
  }

  // --- input --------------------------------------------------------

  private static readonly KEY_MAP: Record<string, Dir> = {
    ArrowUp: 'up',
    KeyW: 'up',
    ArrowDown: 'down',
    KeyS: 'down',
    ArrowLeft: 'left',
    KeyA: 'left',
    ArrowRight: 'right',
    KeyD: 'right'
  };

  @HostListener('window:keydown', ['$event'])
  onKeyDown(e: KeyboardEvent): void {
    const dir = MapPage.KEY_MAP[e.code];
    if (!dir) return;
    e.preventDefault();
    this.key[dir] = true;
  }

  @HostListener('window:keyup', ['$event'])
  onKeyUp(e: KeyboardEvent): void {
    const dir = MapPage.KEY_MAP[e.code];
    if (dir) this.key[dir] = false;
  }

  @HostListener('window:blur')
  onBlur(): void {
    this.clearAll();
  }

  @HostListener('window:pointerup')
  onPointerUp(): void {
    this.pad.up = this.pad.down = this.pad.left = this.pad.right = false;
  }

  press(dir: Dir, on: boolean, e: Event): void {
    e.preventDefault();
    this.pad[dir] = on;
  }

  private clearAll(): void {
    for (const k of ['up', 'down', 'left', 'right'] as Dir[]) {
      this.key[k] = false;
      this.pad[k] = false;
    }
  }

  back(): void {
    this.router.navigateByUrl('/team-select');
  }
}
