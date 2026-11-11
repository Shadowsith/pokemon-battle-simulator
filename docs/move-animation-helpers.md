# Move animation helpers (cheat sheet)

Read this before writing a custom move animation, instead of the helper source files. All paths are under `src/app/core/services/move-animation/`. Coordinates are battle-field pixels (640 × 300, unscaled).

## Shape of a custom animation
```ts
// moves/<type>-moves.ts (or a file in moves/<type>/, registered by the type file)
static readonly anims: MoveAnimRegistry = {
  mymove: (refs, launch, target, v) => MyType.playMyMove(refs, launch, target),
};
```
- `refs: BattleStageRefs` — `fieldEl` (backdrops go here), `fxEl` (effect layer, append particles here), `screenFxEl` (screen wash), `launchEl` (caster sprite), `targetEl` (target sprite).
- `launch` / `target: Point` — sprite centres. `v: MoveVisual` — `dir` (1 = caster left of target), `color`, `power` 0-1, `hits`, `recoil`, `drain`, `fleck`, `spread`, …
- Resolve the promise once the hit should register (damage, HP bar). Remove every element you add.
- Custom animations do **not** play the generic fleck / drain / recoil tail; call `FxEffects.afterImpact` or draw it yourself.
- Never mirror, `rotateY` or fully `rotate` a sprite (see CLAUDE.md). Move sprites with `translate`, keep their existing `style.transform` as prefix, and restore it afterwards.
- Glow on a `clip-path` element gets cut off: put the `drop-shadow` on a wrapper.
- Doc comment: what happens with timings (e.g. `0.3-0.9 s`), plus the Pokewiki reference APNG URLs from the checklist. The free sound recipe is timed to these.
- Registry test: `move-animation-registry.spec.ts` (real move ids, one group per id, charge anims only for two-turn moves).

## `Fx` — DOM primitives (`fx.ts`)
| Method | What it does |
|---|---|
| `anim(el, frames, opts): Promise` | Web Animations wrapper, `fill: 'both'` by default; resolves when done. |
| `wait(ms)` | Sleep. |
| `flash(el, color, intensity=0.5)` | 150 ms bright glow on a sprite. |
| `blink(el, times=4, ms=70)` | Classic on/off hit blink. |
| `shake(el, amp=4)` | Quick horizontal sprite shake. |
| `shakeField(fieldEl, scale=1)` | Shakes the whole field. |
| `screenWash(screenFxEl, color, rampMs, holdMs, anchorX='65%')` | Radial colour wash over the screen. |
| `backdrop(fieldEl, css): HTMLElement` | Layer behind platforms/sprites that replaces the scene; fade it in/out and remove it. A later backdrop is inserted *below* earlier ones: use `old.after(newOne)` to put it on top. |
| `rect(el)` | Bounding box in field pixels (use instead of `getBoundingClientRect`). |
| `centerOf(el, fieldEl)` / `footOf(el, fieldEl)` | Sprite centre / where it stands. |
| `place(el, p)` | Absolutely positions `el` centred on `p` (needs `style.width/height` in px). |
| `clamp(n, lo, hi)` | Clamp. |
| `zigzagPoints(x0, y0, x1, y1, jag)` | SVG polyline points for a lightning path. |

## `FxEffects` — shared composed effects (`fx-effects.ts`)
| Method | What it does |
|---|---|
| `impact(refs, target, v, hitIndex)` | Generic hit: type particle burst + flash + shake (scaled by power). |
| `afterImpact(refs, launch, target, v)` | Generic tail: status fleck, drain stream, recoil flash. |
| `streamParticles(fxEl, from, to, v, count, dur, jitter=12)` | Type particles streaming from → to. |
| `meleeGlyph(fxEl, at, v)` / `fleck(fxEl, at, v)` | Generic melee hit shape / status fleck particles. |
| `chargeUp(refs, launch, v)` | Generic charge glow with particles gathering in. |
| `clawMark(fxEl, at, len, angle, {glow:[c1,c2], tip?})` | Black claw stroke with glow (Crush Claw, Dragon Claw). |
| `dropBackIn(el)` | User drops back in from above (Fly, Bounce). |
| `dart(el, dir)` | Caster darts toward the target and back. |
| `orangeSparkles(refs, launch, top)` | Orange sparkles drift down over the caster (~1.2 s). |
| `statUpAura(refs, launch)` | Stat-up: orange bands scroll up over the caster (~0.8 s). |
| `statDownBubbles(refs, launch)` | Stat-down: blue bubbles drift down over the caster (~0.9 s). For a target drop pass `{ ...refs, launchEl: targetEl }, target`. |
| `statDropCloud(refs, target)` | XY-style stat drop: purple cloud rains on the target (~1.0 s). |
| `sleepZs(fxEl, head, away, colors)` | Rising "Z"s. |
| `orbit(el, radius, laps, duration, spin)` | Sprite circles along a path (no turning). |
| `speedLines(layer, W, H, flow, [c1, c2])` | Endless speed lines inside `layer` (stop when it is removed). |
| `smokePuff(fxEl, at, size, [c1, c2]?)` | Puff cloud; white by default, also dust / spray. |
| `burstBackdrop(fieldEl, at, 'red'\|'blue'\|'ember'\|'magenta')` | Backdrop with flickering burst rays; caller fades out + removes it. |
| `cornerSun(fxEl, sun, size, total)` | Pulsing sun with sparkles. |
| `healSparkles(refs, launch)` | Green heal stars round the caster (~0.9 s). |
| `fireBlastCloud(fxEl, hit, size, count, sparkColor)` | Fiery explosion cloud with sparks. |
| `playElementalPunch(refs, target, fistTone, flashColor, particle)` | Coloured fist + element particle burst (Ice/Thunder Punch). |

## `FxGlyphs` — particles and props (`fx-glyphs.ts`)
All return an absolutely positioned element; place it with `Fx.place`.
- **Energy:** `sparkStar(size, color)` 4-point star · `fivePointStar(size, glow)` · `ringSparkle(size, color, ring)` · `psySparkle(size)` · `spikyBurst(size, outer, inner, centre?)` comic impact burst · `glyph(v, size)` type particle · `boltGlyph(color, size)` · `sparkBolt()`.
- **Elements:** `firePuff(size, 'hot'|'red')` · `iceShard(s)` · `iceChunk()` · `bubbleGlyph(size)` water bubble · `rockChunk(size)` · `petalGlyph(s, color)` · `leafGlyph(s)`.
- **Body parts:** `fistGlyph(w, tone)` (tones in `FIST_TONES`: yellow, red, ice, blue, dark, brown) · `footGlyph(w, color?)` · `chopHandGlyph(w)` · `gloveGlyph(w)` · `pointingHandGlyph(w)` · `jawGlyph(w, h, lower)` · `incisorGlyph(h)` · `snakeEyeGlyph(w, side)`.
- **Props:** `swordGlyph(h)` · `boneGlyph(w)` · `nailGlyph(len)` · `batonGlyph(w)` · `eggGlyph(w)` · `girderGlyph(w)` · `bellGlyph(w)` · `milkBottleGlyph(w)` · `pokeball(size)` · `birdGlyph(w)` · `angerMark(size)` · `sleepZ(size, color)` · `noteBubble(size)` · `musicNote(size, color)`.

## Constants (`animation.constants.ts`)
`DIM_BACKDROP` (dark scene) · `HEAT_BACKDROP` (red-hot) · `PSYCHIC_WAVES`, `WATERFALL_WAVES` (tiling backgrounds) · `FIST_TONES` · `FLECK_COLOR` (statUp green, statDown red, poison purple, …) · `TYPE_STYLE` · `BUBBLE_DRIFT` / `BUBBLE_BEAM`.

## Reusable pieces inside type files (private, but worth knowing)
- `ElectricMoveAnimations.crackle(el, size, color)` flickering sparks, `groundStreak(...)` (electric-moves.ts).
- `PoisonMoveAnimations.poisonBubble(size)`, `sludgeGlob(size)` (poison-moves.ts).
- `BugMoveAnimations.webGlyph(...)`, `beeGlyph(w)` (bug-moves.ts).
- `PsychicFx` dim / tremble effects (psychic/psychic-fx.ts), `FireFlames` (fire/fire-flames.ts), `WaterCrash` splash (water/water-crash.ts).

If one of these is needed in another type file, move it to `FxEffects` / `FxGlyphs` instead of copying it.

## Reference frames
`node scripts/apng-sheet.mjs <moveId ...>` downloads a move's Gen 4 and Gen 5 Pokewiki APNGs (URLs from the review checklist) and writes one small frame sheet per move. Read that image, not the raw APNGs.
