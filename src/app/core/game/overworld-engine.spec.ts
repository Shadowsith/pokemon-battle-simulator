import { OverworldEngine, OverworldInput } from './overworld-engine';
import { OverworldMap, Facing } from './overworld-map.model';
import { Tileset } from './tileset';

const NONE: OverworldInput = { up: false, down: false, left: false, right: false };
const held = (dir: keyof OverworldInput): OverworldInput => ({ ...NONE, [dir]: true });

function makeMap(w: number, h: number, solids: [number, number][] = [], spawn = { x: 2, y: 2, facing: 'down' as Facing }): OverworldMap {
  const n = w * h;
  const solid = new Array(n).fill(0) as (0 | 1)[];
  for (const [x, y] of solids) solid[y * w + x] = 1;
  return {
    id: 'test',
    width: w,
    height: h,
    tileSize: 16,
    tileset: '',
    columns: 8,
    layers: { ground: new Array(n).fill(1), overlay: new Array(n).fill(0) },
    solid,
    spawn
  };
}

/** Run `update` in ~16ms steps until it has advanced `ms` total. */
function tick(engine: OverworldEngine, input: OverworldInput, ms: number): void {
  for (let t = 0; t < ms; t += 16) engine.update(16, input, 240, 160);
}

function newEngine(map: OverworldMap): OverworldEngine {
  return new OverworldEngine(map, new Tileset(16, 8), null);
}

describe('OverworldEngine', () => {
  it('walks exactly one tile per tap, then settles', () => {
    const e = newEngine(makeMap(10, 10));
    expect(e.player.tileX).toBe(2);
    tick(e, held('right'), 48); // start the step
    expect(e.moving).toBe(true);
    tick(e, NONE, 200); // key released - the step finishes but nothing chains
    expect(e.player.tileX).toBe(3);
    expect(e.player.tileY).toBe(2);
    expect(e.player.facing).toBe('right');
    expect(e.moving).toBe(false);
  });

  it('does not move into a solid tile, only turns to face it', () => {
    const e = newEngine(makeMap(10, 10, [[3, 2]]));
    tick(e, held('right'), 200);
    expect(e.player.tileX).toBe(2);
    expect(e.player.facing).toBe('right');
    expect(e.moving).toBe(false);
  });

  it('does not walk off the map edge', () => {
    const e = newEngine(makeMap(10, 10, [], { x: 0, y: 0, facing: 'down' }));
    tick(e, held('left'), 200);
    tick(e, held('up'), 200);
    expect(e.player.tileX).toBe(0);
    expect(e.player.tileY).toBe(0);
  });

  it('keeps walking while the direction stays held', () => {
    const e = newEngine(makeMap(12, 12));
    tick(e, held('right'), 500); // ~3 steps of 150ms
    expect(e.player.tileX).toBeGreaterThanOrEqual(4);
  });

  it('clamps the camera to the map bounds', () => {
    const big = makeMap(20, 20, [], { x: 0, y: 0, facing: 'down' });
    const e = newEngine(big);
    e.update(16, NONE, 240, 160);
    expect(e.camX).toBe(0);
    expect(e.camY).toBe(0);

    const farCorner = makeMap(20, 20, [], { x: 19, y: 19, facing: 'down' });
    const e2 = newEngine(farCorner);
    e2.update(16, NONE, 240, 160);
    expect(e2.camX).toBe(20 * 16 - 240); // 80
    expect(e2.camY).toBe(20 * 16 - 160); // 160
  });
});
