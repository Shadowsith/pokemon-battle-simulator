/**
 * Outdoor scenes (day + night): grassy plain, forest, open water, town.
 * Each recipe takes the time of day and returns a finished Svg.
 */
import { H, HORIZON, Svg, W, cloud, moon, ridge, rng, sky, stars, sun, tufts } from './svg.mjs';

const SKY = {
  day: ['#7cc4f2', '#d7f0fb'],
  night: ['#0d1638', '#33437a']
};

function skyWithLights(svg, time, rand, { sunX = 980, cloudCount = 4 } = {}) {
  sky(svg, ...SKY[time]);
  if (time === 'day') {
    sun(svg, sunX, 80);
    for (let i = 0; i < cloudCount; i++) {
      cloud(svg, rand.range(80, W - 80), rand.range(50, HORIZON - 120), rand.range(0.7, 1.3), '#ffffff', 0.85);
    }
  } else {
    stars(svg, rand, 110);
    moon(svg, sunX, 80);
    for (let i = 0; i < 2; i++) {
      cloud(svg, rand.range(80, W - 80), rand.range(60, HORIZON - 120), rand.range(0.8, 1.2), '#3e4e86', 0.6);
    }
  }
}

export function grass(time) {
  const svg = new Svg();
  const rand = rng(11);
  const night = time === 'night';
  skyWithLights(svg, time, rand);
  ridge(svg, rand, HORIZON - 10, 60, 7, night ? '#2d4a5c' : '#9ccfa2');
  ridge(svg, rand, HORIZON + 10, 30, 9, night ? '#2f5a43' : '#7fbf6a');
  svg.rect(0, HORIZON + 20, W, H, svg.linear(night ? [[0, '#335f3f'], [1, '#1f4630']] : [[0, '#8fd06d'], [1, '#6bb450']]));
  tufts(svg, rand, 140, HORIZON + 40, H - 10, night ? '#193826' : '#4f9a3c', 0.45);
  return svg;
}

export function forest(time) {
  const svg = new Svg();
  const rand = rng(23);
  const night = time === 'night';
  skyWithLights(svg, time, rand, { sunX: 300, cloudCount: 2 });
  // Back tree line: round canopies.
  const back = night ? '#1b3338' : '#4f8f5a';
  for (let x = -40; x < W + 60; x += rand.range(50, 80)) {
    svg.circle(x, HORIZON - rand.range(30, 90), rand.range(55, 85), back);
  }
  svg.rect(0, HORIZON - 40, W, 80, back);
  // Front trunks + canopies along the edges, leaving the middle open.
  const trunk = night ? '#2b2420' : '#6b4a2e';
  const leaf = night ? '#143024' : '#357a3f';
  for (const x of [40, 150, 1120, 1230, 620]) {
    const top = HORIZON - rand.range(120, 180);
    svg.rect(x - 14, top, 28, HORIZON + 40 - top, trunk);
    svg.circle(x, top, rand.range(60, 80), leaf);
    svg.circle(x - 40, top + 30, 45, leaf);
    svg.circle(x + 40, top + 25, 48, leaf);
  }
  svg.rect(0, HORIZON + 30, W, H, svg.linear(night ? [[0, '#2c3d2a'], [1, '#1d2b1c']] : [[0, '#7a9c4f'], [1, '#5f7f3b']]));
  // Leaf litter.
  for (let i = 0; i < 160; i++) {
    const colors = night ? ['#3c4a2a', '#4a4030'] : ['#a3843f', '#c19a4a', '#86a14a'];
    svg.ellipse(rand.range(0, W), rand.range(HORIZON + 40, H - 4), rand.range(3, 7), rand.range(1.5, 3), colors[rand.int(0, colors.length - 1)], 'opacity="0.6"');
  }
  return svg;
}

export function water(time) {
  const svg = new Svg();
  const rand = rng(37);
  const night = time === 'night';
  skyWithLights(svg, time, rand, { sunX: 880 });
  // Distant island.
  svg.ellipse(220, HORIZON + 4, 160, 26, night ? '#24395a' : '#7fb08c');
  svg.rect(0, HORIZON, W, H, svg.linear(night ? [[0, '#1d3466'], [1, '#0f1f45']] : [[0, '#4fa8dc'], [1, '#2b7fbf']]));
  if (night) {
    // Moon reflection under the moon.
    for (let i = 0; i < 14; i++) {
      const y = HORIZON + 8 + i * 22;
      svg.rect(880 - (30 - i) * 1.2, y, (30 - i) * 2.4, 4, '#f6f0d6', `opacity="${(0.5 - i * 0.03).toFixed(2)}"`);
    }
  }
  // Wave crests, smaller near the horizon.
  for (let i = 0; i < 90; i++) {
    const y = rand.range(HORIZON + 12, H - 6);
    const s = 0.4 + ((y - HORIZON) / (H - HORIZON)) * 1.6;
    const x = rand.range(0, W);
    svg.path(
      `M${(x - 18 * s).toFixed(1)},${y.toFixed(1)} Q${x.toFixed(1)},${(y - 7 * s).toFixed(1)} ${(x + 18 * s).toFixed(1)},${y.toFixed(1)}`,
      'none',
      `stroke="${night ? '#8fa6d8' : '#e8f7ff'}" stroke-width="${(2 * s).toFixed(1)}" stroke-linecap="round" opacity="0.55"`
    );
  }
  return svg;
}

export function city(time) {
  const svg = new Svg();
  const rand = rng(41);
  const night = time === 'night';
  skyWithLights(svg, time, rand, { sunX: 1060, cloudCount: 3 });
  // Far skyline.
  for (let x = 0; x < W; ) {
    const w = rand.range(50, 110);
    const h = rand.range(60, 170);
    svg.rect(x, HORIZON - h, w, h + 20, night ? '#26304f' : '#a9bccd');
    x += w + rand.range(0, 10);
  }
  // Front houses with roofs and windows.
  const walls = night ? ['#4a4660', '#3f4c63', '#56495a'] : ['#f2d7b0', '#e8c2a0', '#d9e2c8', '#f0e4d0'];
  const roofs = night ? ['#5a2f3a', '#2f3f5a'] : ['#c4553f', '#5b7fb5', '#8a5a3c'];
  const window = night ? '#ffd76a' : '#9fd3ef';
  for (let x = -20; x < W; ) {
    const w = rand.range(120, 170);
    const h = rand.range(90, 130);
    const top = HORIZON + 20 - h;
    svg.rect(x, top, w, h, walls[rand.int(0, walls.length - 1)]);
    svg.polygon([[x - 8, top], [x + w / 2, top - 40], [x + w + 8, top]], roofs[rand.int(0, roofs.length - 1)]);
    for (let wy = top + 18; wy < top + h - 30; wy += 36) {
      for (let wx = x + 16; wx < x + w - 30; wx += 38) {
        const lit = !night || rand() < 0.7;
        svg.rect(wx, wy, 20, 20, lit ? window : '#2a2a3a');
      }
    }
    x += w + rand.range(8, 20);
  }
  // Street lamps at night.
  if (night) {
    for (const x of [300, 980]) {
      svg.rect(x - 3, HORIZON - 40, 6, 70, '#2a2a33');
      svg.circle(x, HORIZON - 44, 60, svg.radial([[0, '#ffe39a', 0.55], [1, '#ffe39a', 0]]));
      svg.circle(x, HORIZON - 44, 9, '#fff1b8');
    }
  }
  // Paved square with perspective joints.
  svg.rect(0, HORIZON + 20, W, H, svg.linear(night ? [[0, '#55596a'], [1, '#3a3d4b']] : [[0, '#d2d0c8'], [1, '#b3b1a8']]));
  const joint = night ? '#2f3240' : '#9c9a92';
  for (let i = -12; i <= 12; i++) {
    svg.line(W / 2 + i * 30, HORIZON + 20, W / 2 + i * 150, H, joint, 2, 'opacity="0.45"');
  }
  for (let y = HORIZON + 40, gap = 18; y < H; gap *= 1.25, y += gap) {
    svg.line(0, y, W, y, joint, 2, 'opacity="0.45"');
  }
  return svg;
}

export function beach(time) {
  const svg = new Svg();
  const rand = rng(59);
  const night = time === 'night';
  skyWithLights(svg, time, rand, { sunX: 700, cloudCount: 3 });
  // Sea strip behind the shore.
  const seaY = HORIZON - 10;
  svg.rect(0, seaY, W, 70, svg.linear(night ? [[0, '#1f3a70'], [1, '#2a4d86']] : [[0, '#3f9fd8'], [1, '#6cc6e8']]));
  if (night) {
    for (let i = 0; i < 4; i++) svg.rect(700 - 40 + i * 6, seaY + 6 + i * 14, 80 - i * 12, 3, '#f6f0d6', 'opacity="0.45"');
  }
  // Surf line, then sand down to the bottom.
  const shore = HORIZON + 60;
  svg.path(
    `M0,${shore} C320,${shore - 18} 640,${shore + 14} 960,${shore - 10} S1200,${shore + 6} ${W},${shore - 4} L${W},${H} L0,${H} Z`,
    svg.linear(night ? [[0, '#8c8670'], [1, '#6e6855']] : [[0, '#f3dfa6'], [1, '#e6c983']])
  );
  svg.path(
    `M0,${shore} C320,${shore - 18} 640,${shore + 14} 960,${shore - 10} S1200,${shore + 6} ${W},${shore - 4}`,
    'none',
    `stroke="${night ? '#c7d2ea' : '#ffffff'}" stroke-width="6" opacity="0.8"`
  );
  // Palms on both edges, leaning outwards.
  const trunk = night ? '#3e3326' : '#9a7448';
  const frond = night ? '#1f3a2c' : '#3f9a4c';
  for (const [x, lean] of [[70, -1], [1210, 1]]) {
    const topX = x + lean * 40;
    const topY = HORIZON - 150;
    svg.path(`M${x - 10},${shore + 40} Q${x + lean * 10},${HORIZON} ${topX - 6},${topY} L${topX + 6},${topY} Q${x + lean * 22},${HORIZON} ${x + 10},${shore + 40} Z`, trunk);
    for (const a of [-160, -120, -60, -20, 20, 200]) {
      const rad = (a * Math.PI) / 180;
      const ex = topX + Math.cos(rad) * 95;
      const ey = topY + Math.sin(rad) * 45 + 30;
      svg.path(`M${topX},${topY} Q${(topX + ex) / 2},${topY - 30} ${ex.toFixed(1)},${ey.toFixed(1)} Q${(topX + ex) / 2},${topY - 8} ${topX},${topY} Z`, frond);
    }
  }
  // Shells and pebbles.
  for (let i = 0; i < 50; i++) {
    const colors = night ? ['#a49d86', '#5f5949'] : ['#ffffff', '#f0b9a0', '#cfb27a'];
    svg.ellipse(rand.range(0, W), rand.range(shore + 20, H - 6), rand.range(3, 6), rand.range(2, 4), colors[rand.int(0, colors.length - 1)], 'opacity="0.75"');
  }
  return svg;
}

export function arena(time) {
  const svg = new Svg();
  const rand = rng(71);
  const night = time === 'night';
  skyWithLights(svg, time, rand, { sunX: 1000, cloudCount: 2 });
  // Grandstand: tiers with a crowd of coloured dots.
  const standTop = HORIZON - 120;
  svg.rect(0, standTop, W, 150, night ? '#2a2f45' : '#8a93a8');
  const crowd = night ? ['#4a5170', '#5a4d68', '#3d5a66'] : ['#e05a4f', '#f2c14e', '#4f8fe0', '#6cc070', '#f0f0f0'];
  for (let row = 0; row < 5; row++) {
    const y = standTop + 12 + row * 24;
    svg.rect(0, y + 10, W, 4, night ? '#1d2133' : '#6f7890');
    for (let x = 6; x < W; x += rand.range(10, 16)) svg.circle(x, y, rand.range(4, 6), crowd[rand.int(0, crowd.length - 1)]);
  }
  svg.rect(0, HORIZON + 16, W, 14, night ? '#3b3f58' : '#c7ccd6');
  // Pennants on the roof edge.
  for (let x = 40; x < W; x += 120) {
    svg.rect(x, standTop - 50, 3, 50, '#555');
    svg.polygon([[x + 3, standTop - 50], [x + 35, standTop - 42], [x + 3, standTop - 34]], ['#e05a4f', '#4f8fe0', '#f2c14e'][(x / 120) % 3 | 0]);
  }
  // Floodlights at night.
  if (night) {
    for (const x of [140, 1140]) {
      svg.rect(x - 4, standTop - 120, 8, 120, '#2a2a33');
      svg.rect(x - 34, standTop - 140, 68, 24, '#3a3a44');
      svg.circle(x, standTop - 128, 160, svg.radial([[0, '#fffbe0', 0.5], [1, '#fffbe0', 0]]));
      for (let i = -2; i <= 2; i++) svg.circle(x + i * 12, standTop - 128, 5, '#fffbe0');
    }
  }
  // Clay pitch with white court lines.
  svg.rect(0, HORIZON + 30, W, H, svg.linear(night ? [[0, '#8a6a52'], [1, '#6b5040']] : [[0, '#d9a374'], [1, '#c48a5c']]));
  const line = `opacity="${night ? 0.7 : 0.85}"`;
  svg.polygon([[180, HORIZON + 50], [W - 180, HORIZON + 50], [W + 80, H], [-80, H]], 'none', `stroke="#ffffff" stroke-width="5" ${line}`);
  svg.line(W / 2, HORIZON + 50, W / 2, H, '#ffffff', 5, line);
  svg.ellipse(W / 2, HORIZON + 200, 120, 40, 'none', `stroke="#ffffff" stroke-width="5" ${line}`);
  return svg;
}
