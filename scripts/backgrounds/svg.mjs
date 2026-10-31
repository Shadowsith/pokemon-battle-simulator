/**
 * Tiny SVG toolkit for the battle background recipes. Every scene is drawn on
 * a 1280 × 680 canvas with the horizon at ~42 %, so the field's
 * `background-size: cover; background-position: center bottom` keeps the
 * ground visible in both the landscape (640 × 300) and portrait (≤ 639 × 340)
 * layouts. Output is deterministic: randomness comes from a seeded RNG.
 */

export const W = 1280;
export const H = 680;
export const HORIZON = 290;

/** mulberry32 — small seeded RNG so regenerated files don't change. */
export function rng(seed) {
  let a = seed >>> 0;
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  next.range = (min, max) => min + next() * (max - min);
  next.int = (min, max) => Math.floor(next.range(min, max + 1));
  return next;
}

const r1 = (n) => Math.round(n * 10) / 10;

export class Svg {
  #defs = [];
  #body = [];
  #ids = 0;

  /** Vertical (default) or horizontal linear gradient; returns `url(#id)`. */
  linear(stops, { horizontal = false } = {}) {
    const id = `g${this.#ids++}`;
    const dir = horizontal ? 'x1="0" y1="0" x2="1" y2="0"' : 'x1="0" y1="0" x2="0" y2="1"';
    this.#defs.push(`<linearGradient id="${id}" ${dir}>${this.#stops(stops)}</linearGradient>`);
    return `url(#${id})`;
  }

  radial(stops) {
    const id = `g${this.#ids++}`;
    this.#defs.push(`<radialGradient id="${id}">${this.#stops(stops)}</radialGradient>`);
    return `url(#${id})`;
  }

  #stops(stops) {
    return stops
      .map(([offset, color, opacity = 1]) => `<stop offset="${offset}" stop-color="${color}" stop-opacity="${opacity}"/>`)
      .join('');
  }

  raw(markup) {
    this.#body.push(markup);
    return this;
  }

  rect(x, y, w, h, fill, extra = '') {
    return this.raw(`<rect x="${r1(x)}" y="${r1(y)}" width="${r1(w)}" height="${r1(h)}" fill="${fill}" ${extra}/>`);
  }

  circle(cx, cy, r, fill, extra = '') {
    return this.raw(`<circle cx="${r1(cx)}" cy="${r1(cy)}" r="${r1(r)}" fill="${fill}" ${extra}/>`);
  }

  ellipse(cx, cy, rx, ry, fill, extra = '') {
    return this.raw(`<ellipse cx="${r1(cx)}" cy="${r1(cy)}" rx="${r1(rx)}" ry="${r1(ry)}" fill="${fill}" ${extra}/>`);
  }

  polygon(points, fill, extra = '') {
    return this.raw(`<polygon points="${points.map(([x, y]) => `${r1(x)},${r1(y)}`).join(' ')}" fill="${fill}" ${extra}/>`);
  }

  path(d, fill, extra = '') {
    return this.raw(`<path d="${d}" fill="${fill}" ${extra}/>`);
  }

  line(x1, y1, x2, y2, stroke, width, extra = '') {
    return this.raw(
      `<line x1="${r1(x1)}" y1="${r1(y1)}" x2="${r1(x2)}" y2="${r1(y2)}" stroke="${stroke}" stroke-width="${width}" ${extra}/>`
    );
  }

  toString() {
    return (
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" preserveAspectRatio="xMidYMax slice">` +
      `<defs>${this.#defs.join('')}</defs>${this.#body.join('')}</svg>\n`
    );
  }
}

// --- shared scenery ------------------------------------------------------

/** Sky gradient over the whole canvas (ground layers paint over the bottom). */
export function sky(svg, top, bottom) {
  svg.rect(0, 0, W, H, svg.linear([[0, top], [HORIZON / H, bottom], [1, bottom]]));
}

export function stars(svg, rand, count, maxY = HORIZON - 30) {
  for (let i = 0; i < count; i++) {
    const big = rand() < 0.12;
    svg.circle(rand.range(0, W), rand.range(8, maxY), big ? 2.6 : rand.range(0.8, 1.7), '#ffffff', `opacity="${r1(rand.range(0.45, 0.95))}"`);
  }
}

export function moon(svg, cx, cy, r = 34) {
  svg.circle(cx, cy, r * 2.6, svg.radial([[0, '#fdf6d8', 0.35], [1, '#fdf6d8', 0]]));
  svg.circle(cx, cy, r, '#f6f0d6');
  svg.circle(cx - r * 0.3, cy - r * 0.2, r * 0.18, '#e2dbbd');
  svg.circle(cx + r * 0.35, cy + r * 0.3, r * 0.12, '#e2dbbd');
}

export function sun(svg, cx, cy, r = 40) {
  svg.circle(cx, cy, r * 3, svg.radial([[0, '#fff6c8', 0.7], [1, '#fff6c8', 0]]));
  svg.circle(cx, cy, r, '#fff3b0');
}

/** Puffy flat cloud made of overlapping ellipses. */
export function cloud(svg, cx, cy, scale, fill, opacity = 0.9) {
  const o = `opacity="${opacity}"`;
  svg.raw(`<g ${o}>`);
  svg.ellipse(cx, cy, 70 * scale, 22 * scale, fill);
  svg.ellipse(cx - 34 * scale, cy - 10 * scale, 34 * scale, 22 * scale, fill);
  svg.ellipse(cx + 18 * scale, cy - 18 * scale, 40 * scale, 28 * scale, fill);
  svg.raw('</g>');
}

/**
 * A rolling ridge: smooth curve through `count` random points around `baseY`,
 * filled down to the bottom of the canvas.
 */
export function ridge(svg, rand, baseY, amp, count, fill, extra = '') {
  const step = W / (count - 1);
  const pts = Array.from({ length: count }, (_, i) => [i * step, baseY - rand.range(0, amp)]);
  let d = `M0,${H} L${r1(pts[0][0])},${r1(pts[0][1])}`;
  for (let i = 1; i < pts.length; i++) {
    const [px, py] = pts[i - 1];
    const [x, y] = pts[i];
    const mx = (px + x) / 2;
    d += ` C${r1(mx)},${r1(py)} ${r1(mx)},${r1(y)} ${r1(x)},${r1(y)}`;
  }
  d += ` L${W},${H} Z`;
  svg.path(d, fill, extra);
}

/** Small V-shaped grass tufts scattered over a band of the ground. */
export function tufts(svg, rand, count, y0, y1, color, opacity = 0.5) {
  for (let i = 0; i < count; i++) {
    const x = rand.range(0, W);
    const y = rand.range(y0, y1);
    const s = 0.6 + ((y - y0) / (y1 - y0)) * 1.2; // nearer = bigger
    svg.path(
      `M${r1(x - 6 * s)},${r1(y)} L${r1(x - 2 * s)},${r1(y - 12 * s)} L${r1(x)},${r1(y)} L${r1(x + 3 * s)},${r1(y - 14 * s)} L${r1(x + 6 * s)},${r1(y)} Z`,
      color,
      `opacity="${opacity}"`
    );
  }
}
