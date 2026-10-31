/**
 * Enclosed scenes (one variant each, no day/night): cave and indoor hall.
 */
import { H, HORIZON, Svg, W, rng } from './svg.mjs';

export function cave() {
  const svg = new Svg();
  const rand = rng(53);
  svg.rect(0, 0, W, H, svg.linear([[0, '#2a211c'], [0.45, '#4a3b30'], [1, '#3a2e25']]));
  // Back wall: overlapping rock slabs.
  const rocks = ['#5a4838', '#4f3f31', '#66523f'];
  for (let i = 0; i < 26; i++) {
    const x = rand.range(-40, W);
    const y = rand.range(60, HORIZON);
    const w = rand.range(90, 180);
    const h = rand.range(60, 140);
    svg.polygon(
      [[x, y + h], [x + w * 0.15, y + h * 0.2], [x + w * 0.55, y], [x + w * 0.9, y + h * 0.3], [x + w, y + h]],
      rocks[rand.int(0, rocks.length - 1)]
    );
  }
  // Light falling through a gap in the ceiling, onto the middle of the floor.
  svg.polygon(
    [[560, 0], [720, 0], [900, H], [380, H]],
    svg.linear([[0, '#fff1c8', 0.35], [1, '#fff1c8', 0.05]])
  );
  // Floor.
  svg.rect(0, HORIZON + 10, W, H, svg.linear([[0, '#6b5843', 0.95], [1, '#4d3e2f', 1]]));
  for (let i = 0; i < 40; i++) {
    svg.ellipse(rand.range(0, W), rand.range(HORIZON + 30, H - 6), rand.range(8, 22), rand.range(3, 7), '#3e3226', 'opacity="0.5"');
  }
  // Stalactites hanging from the ceiling.
  for (let x = 10; x < W; x += rand.range(40, 90)) {
    const len = rand.range(30, 110);
    const w = rand.range(16, 34);
    svg.polygon([[x, 0], [x + w, 0], [x + w / 2, len]], '#5e4a3a');
  }
  return svg;
}

export function indoor() {
  const svg = new Svg();
  const rand = rng(67);
  // Wall with vertical panels.
  svg.rect(0, 0, W, HORIZON + 20, svg.linear([[0, '#c9c3d6'], [1, '#e4dfec']]));
  for (let x = 0; x < W; x += 128) {
    svg.rect(x + 10, 70, 108, HORIZON - 90, '#d8d2e3');
    svg.rect(x + 10, 70, 108, 6, '#efeaf5');
  }
  // Ceiling lights with soft glow.
  for (const x of [200, 640, 1080]) {
    svg.circle(x, 30, 120, svg.radial([[0, '#fffbe6', 0.7], [1, '#fffbe6', 0]]));
    svg.rect(x - 50, 14, 100, 14, '#fffdf2');
  }
  svg.rect(0, HORIZON + 6, W, 16, '#8c7a9c');
  // Wooden floor: perspective boards.
  svg.rect(0, HORIZON + 22, W, H, svg.linear([[0, '#d9b47c'], [1, '#c09460']]));
  for (let i = -16; i <= 16; i++) {
    svg.line(W / 2 + i * 34, HORIZON + 22, W / 2 + i * 120, H, '#a87c4c', 2, 'opacity="0.5"');
  }
  for (let i = 0; i < 30; i++) {
    svg.rect(rand.range(0, W), rand.range(HORIZON + 30, H), rand.range(20, 60), 2, '#b88a58', 'opacity="0.4"');
  }
  // Painted court boundary.
  svg.rect(40, HORIZON + 40, W - 80, H - HORIZON - 60, 'none', 'stroke="#ffffff" stroke-width="5" opacity="0.7"');
  svg.line(W / 2, HORIZON + 40, W / 2, H - 20, '#ffffff', 5, 'opacity="0.7"');
  return svg;
}

/** Elite Four hall: polished, formal championship room. */
export function eliteFour() {
  const svg = new Svg();
  // Deep violet wall with a gold trim and banners.
  svg.rect(0, 0, W, HORIZON + 20, svg.linear([[0, '#1a1030'], [1, '#3a2560']]));
  svg.rect(0, HORIZON - 4, W, 10, '#c9a24a');
  svg.rect(0, 40, W, 6, '#c9a24a', 'opacity="0.6"');
  // Pillars with capitals.
  for (const x of [60, 340, 940, 1220]) {
    svg.rect(x - 28, 46, 56, HORIZON - 50, svg.linear([[0, '#e9e2f2'], [0.5, '#ffffff'], [1, '#c9bfd9']], { horizontal: true }));
    svg.rect(x - 38, 46, 76, 16, '#c9a24a');
    svg.rect(x - 38, HORIZON - 18, 76, 14, '#c9a24a');
  }
  // Hanging banners between the pillars, emblem in the centre.
  for (const x of [200, 1080]) {
    svg.polygon([[x - 40, 46], [x + 40, 46], [x + 40, 200], [x, 230], [x - 40, 200]], '#7a1f3d');
    svg.circle(x, 130, 22, 'none', 'stroke="#c9a24a" stroke-width="5"');
  }
  svg.circle(640, 150, 70, svg.radial([[0, '#f6d77a', 0.35], [1, '#f6d77a', 0]]));
  svg.circle(640, 150, 44, 'none', 'stroke="#c9a24a" stroke-width="8"');
  svg.polygon([[640, 118], [662, 150], [640, 182], [618, 150]], '#c9a24a');
  // Polished dark marble floor with a reflective sheen and gold inlays.
  svg.rect(0, HORIZON + 6, W, H, svg.linear([[0, '#2c2440'], [0.4, '#3d3358'], [1, '#231b33']]));
  for (const x of [60, 340, 940, 1220]) {
    svg.rect(x - 28, HORIZON + 8, 56, 90, svg.linear([[0, '#ffffff', 0.18], [1, '#ffffff', 0]]));
  }
  for (let i = -10; i <= 10; i++) {
    svg.line(W / 2 + i * 60, HORIZON + 6, W / 2 + i * 220, H, '#5a4d7a', 2, 'opacity="0.5"');
  }
  svg.ellipse(W / 2, HORIZON + 210, 420, 120, 'none', 'stroke="#c9a24a" stroke-width="6" opacity="0.8"');
  svg.ellipse(W / 2, HORIZON + 210, 380, 104, 'none', 'stroke="#c9a24a" stroke-width="2" opacity="0.6"');
  // Spotlights from the ceiling onto the field.
  for (const [x, to] of [[420, 360], [860, 920]]) {
    svg.polygon([[x - 20, 0], [x + 20, 0], [to + 160, H], [to - 160, H]], svg.linear([[0, '#fff6dc', 0.22], [1, '#fff6dc', 0.04]]));
  }
  return svg;
}
