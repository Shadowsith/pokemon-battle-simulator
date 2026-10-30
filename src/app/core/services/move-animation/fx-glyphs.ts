import { MoveVisual } from './animation.types';
import { TYPE_STYLE, SHAPE_CSS, FIST_TONES } from './animation.constants';
import { Fx } from './fx';

/** Factories for the small DOM / SVG elements (particles, glyphs, props) that animations move around. */
export class FxGlyphs {
  static glyph(v: MoveVisual, size: number): HTMLElement {
    const style = TYPE_STYLE[v.type] ?? TYPE_STYLE.Normal;
    if (style.shape === 'bolt') return FxGlyphs.boltGlyph(v.color, size);
    const el = document.createElement('div');
    el.style.cssText = `position:absolute;width:${size}px;height:${size}px;pointer-events:none;${SHAPE_CSS[style.shape](v.color)}`;
    return el;
  }

  static boltGlyph(color: string, size: number): HTMLElement {
    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg') as unknown as HTMLElement;
    svg.setAttribute('width', `${size}`);
    svg.setAttribute('height', `${size * 1.6}`);
    svg.setAttribute('viewBox', '0 0 10 16');
    svg.setAttribute('style', 'position:absolute;overflow:visible');
    const p = document.createElementNS(ns, 'polyline');
    p.setAttribute('points', '6,0 2,7 5,7 3,16 9,6 5,6');
    p.setAttribute('fill', color);
    p.setAttribute('stroke', '#fff');
    p.setAttribute('stroke-width', '0.6');
    svg.appendChild(p);
    return svg;
  }

  /** A lumpy, golden-brown stone with darker speckles (Rock Slide). */
  static rockChunk(size: number): HTMLElement {
    const el = document.createElement('div');
    const r = () => 38 + Math.round(Math.random() * 24);
    el.style.cssText = `position:absolute;width:${size}px;height:${size * 0.9}px;pointer-events:none;border-radius:${r()}% ${r()}% ${r()}% ${r()}% / ${r()}% ${r()}% ${r()}% ${r()}%;background:radial-gradient(circle at 30% 70%,#5E3F12 0 9%,transparent 11%),radial-gradient(circle at 68% 40%,#5E3F12 0 7%,transparent 9%),radial-gradient(circle at 35% 30%,#F2CF6B,#C8932E 50%,#7A5418);box-shadow:inset -2px -3px 4px #00000055,0 2px 3px #00000066`;
    return el;
  }

  /** A plain white egg, `w` px wide (Egg Bomb, Soft-Boiled). */
  static eggGlyph(w: number): HTMLElement {
    const el = document.createElement('div');
    el.style.cssText = `position:absolute;width:${w}px;height:${w * 1.3}px;pointer-events:none;border-radius:50% 50% 50% 50%/60% 60% 40% 40%;background:radial-gradient(circle at 35% 30%,#fff 0 30%,#ECEAE4 60%,#BDB9B0);box-shadow:0 0 3px #00000055`;
    return el;
  }

  /** A grey iron nail, `len` px long, point to the right (Curse). */
  static nailGlyph(len: number): HTMLElement {
    const el = document.createElement('div');
    el.style.cssText = `position:absolute;width:${len}px;height:${len * 0.3}px;pointer-events:none;filter:drop-shadow(0 0 2px #00000099)`;
    el.innerHTML =
      '<svg width="100%" height="100%" viewBox="0 0 40 12" preserveAspectRatio="none">' +
      '<rect x="0" y="0" width="5" height="12" rx="1.2" fill="#8A8A96" stroke="#3A3A44" stroke-width=".8"/>' +
      '<polygon points="5,4 32,4 40,6 32,8 5,8" fill="#B8B8C4" stroke="#3A3A44" stroke-width=".8"/>' +
      '<line x1="6" y1="5" x2="31" y2="5" stroke="#E8E8F0" stroke-width=".8"/>' +
      '</svg>';
    return el;
  }

  /** A red relay baton, `w` px long, lying horizontally (Baton Pass). */
  static batonGlyph(w: number): HTMLElement {
    const el = document.createElement('div');
    el.style.cssText = `position:absolute;width:${w}px;height:${w * 0.22}px;pointer-events:none;border-radius:${w * 0.11}px;background:linear-gradient(180deg,#FF8A7A,#E8202A 40%,#A81018);box-shadow:inset 0 0 0 1.5px #6E0A10,0 0 4px #00000066`;
    return el;
  }

  /** A cartoon glove, open palm up with spread fingers, `w` px wide; white by default (Baton Pass, Belly Drum). */
  static gloveGlyph(w: number, fill = '#ffffff', edge = '#9A9AA6'): HTMLElement {
    const el = document.createElement('div');
    el.style.cssText = `position:absolute;width:${w}px;height:${w * 1.1}px;pointer-events:none;filter:drop-shadow(0 0 2px #00000077)`;
    el.innerHTML =
      '<svg width="100%" height="100%" viewBox="0 0 30 33">' +
      `<g fill="${fill}" stroke="${edge}" stroke-width="1.2" stroke-linejoin="round">` +
      '<rect x="6" y="10" width="4.6" height="12" rx="2.3"/><rect x="11" y="6" width="4.6" height="16" rx="2.3"/>' +
      '<rect x="16" y="7" width="4.6" height="15" rx="2.3"/><rect x="21" y="10" width="4.4" height="12" rx="2.2"/>' +
      '<rect x="1" y="15" width="10" height="4.6" rx="2.3" transform="rotate(-25 6 17)"/>' +
      '<path d="M6,17 H25.4 V24 C25.4,29 21,31.5 15.7,31.5 C10.4,31.5 6,29 6,24 Z"/>' +
      '</g></svg>';
    return el;
  }

  /** A white bubble with a blue music note in it (Belly Drum). */
  static noteBubble(size: number, note = '♪'): HTMLElement {
    const el = document.createElement('div');
    el.textContent = note;
    el.style.cssText = `position:absolute;width:${size}px;height:${size}px;border-radius:50%;pointer-events:none;text-align:center;font:bold ${size * 0.62}px/${size}px sans-serif;color:#2A56C8;background:radial-gradient(circle at 35% 30%,#fff,#F2F6FF 60%,#D6E2FF);box-shadow:0 0 6px #ffffffcc`;
    return el;
  }

  /** Counter for unique SVG gradient ids of the sword glyph. */
  private static swordId = 0;

  /** An upright sword pointing down, `h` px tall: teal blade, dark guard and grip (Swords Dance). */
  static swordGlyph(h: number): HTMLElement {
    const id = `swb${FxGlyphs.swordId++}`;
    const el = document.createElement('div');
    el.style.cssText = `position:absolute;width:${h * 0.2}px;height:${h}px;pointer-events:none;filter:drop-shadow(0 0 3px #7FF0E8aa)`;
    el.innerHTML =
      '<svg width="100%" height="100%" viewBox="0 0 20 100" preserveAspectRatio="none">' +
      `<defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="0">` +
      '<stop offset="0" stop-color="#2E8C88"/><stop offset=".45" stop-color="#9AF2E8"/><stop offset=".55" stop-color="#5CC8C0"/><stop offset="1" stop-color="#22706C"/>' +
      '</linearGradient></defs>' +
      '<circle cx="10" cy="4" r="3.5" fill="#1E4E5A"/>' +
      '<rect x="7.5" y="6" width="5" height="16" rx="1.5" fill="#2A5E6A"/>' +
      '<rect x="0.5" y="21" width="19" height="5" rx="2" fill="#1E4E5A"/>' +
      `<polygon points="4,26 16,26 15,84 10,99 5,84" fill="url(#${id})" stroke="#1A5A58" stroke-width=".8"/>` +
      '</svg>';
    return el;
  }

  /** A bold, softly glowing "Z" for sleep effects (Rest). */
  static sleepZ(size: number, color: string): HTMLElement {
    const el = document.createElement('div');
    el.textContent = 'Z';
    el.style.cssText = `position:absolute;width:${size}px;height:${size}px;pointer-events:none;text-align:center;font:900 ${size}px/${size}px sans-serif;color:${color};-webkit-text-stroke:1px #ffffffcc;text-shadow:0 0 6px ${color}`;
    return el;
  }

  /** A four-point glowing star used for energy / sparkle effects. */
  static sparkStar(size: number, color: string): HTMLElement {
    // The glow sits on a wrapper: clip-path on the same element would cut the drop-shadow off.
    const el = document.createElement('div');
    el.style.cssText = `position:absolute;width:${size}px;height:${size}px;pointer-events:none;filter:drop-shadow(0 0 4px ${color})`;
    const shape = document.createElement('div');
    shape.style.cssText = `width:100%;height:100%;clip-path:polygon(50% 0,62% 38%,100% 50%,62% 62%,50% 100%,38% 62%,0 50%,38% 38%);background:radial-gradient(circle,#fff,${color} 60%)`;
    el.appendChild(shape);
    return el;
  }

  /**
   * A swirling ball of fire. `hot` is the usual yellow-white core with an
   * orange edge; `red` is a deeper red blast (Flare Blitz). Used by the fire moves.
   */
  static firePuff(size: number, tone: 'hot' | 'red' = 'hot'): HTMLElement {
    const fill =
      tone === 'red'
        ? 'radial-gradient(circle at 45% 45%,#FFD2A8,#F2583A 30%,#D0281C 58%,#9A101000 78%)'
        : 'radial-gradient(circle at 45% 45%,#FFF6C0,#FFC53C 35%,#F0803C 60%,#D2321A00 78%)';
    const puff = document.createElement('div');
    puff.style.cssText = `position:absolute;width:${size}px;height:${size}px;border-radius:50% 50% 45% 55%;pointer-events:none;background:${fill}`;
    return puff;
  }

  /** A light blue diamond-shaped ice crystal, `s` px wide (Blizzard, Ice Beam). */
  static iceShard(s: number): HTMLElement {
    const shard = document.createElement('div');
    shard.style.cssText = `position:absolute;width:${s}px;height:${s * 1.4}px;pointer-events:none;clip-path:polygon(50% 0,100% 50%,50% 100%,0 50%);background:linear-gradient(135deg,#fff,#9CD6FF 60%,#5FA8E0)`;
    return shard;
  }

  /** An irregular see-through ice crystal chunk (Ice Punch). */
  static iceChunk(): HTMLElement {
    const s = 12 + Math.random() * 14;
    const chunk = document.createElement('div');
    chunk.style.cssText = `position:absolute;width:${s}px;height:${s * 0.8}px;pointer-events:none;filter:drop-shadow(0 0 2px #ffffff)`;
    const shape = document.createElement('div');
    shape.style.cssText = 'width:100%;height:100%;clip-path:polygon(18% 0,70% 6%,100% 38%,88% 88%,40% 100%,0 70%,4% 24%);background:linear-gradient(135deg,#ffffffee,#DDF3FFb0 45%,#9CD6FF70)';
    chunk.appendChild(shape);
    return chunk;
  }

  /** A small glowing yellow lightning bolt in a sized box, so Fx.place() centres it (Thunder Punch). */
  static sparkBolt(): HTMLElement {
    const s = 9 + Math.random() * 7;
    const box = document.createElement('div');
    box.style.cssText = `position:absolute;width:${s}px;height:${s * 1.6}px;pointer-events:none;filter:drop-shadow(0 0 4px #FFE04A)`;
    const bolt = FxGlyphs.boltGlyph('#FFE04A', s);
    bolt.style.position = 'static';
    box.appendChild(bolt);
    return box;
  }

  /** A see-through water bubble with a highlight (Bubble, Bubble Beam, Crabhammer). */
  static bubbleGlyph(size: number): HTMLElement {
    const el = document.createElement('div');
    el.style.cssText = `position:absolute;width:${size}px;height:${size}px;border-radius:50%;pointer-events:none;border:1.5px solid #ffffffdd;background:radial-gradient(circle at 30% 28%,#ffffffee 0 14%,transparent 18%),radial-gradient(circle at 50% 50%,#BFE6FF22 55%,#8FD0FF66);box-shadow:inset 0 0 5px #A8DCFF99,0 0 3px #ffffff88`;
    return el;
  }

  /** A black cartoon foot sole with four toes, `w` px wide (Jump Kick). */
  static footGlyph(w: number, color = '#141414'): HTMLElement {
    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg') as unknown as HTMLElement;
    svg.setAttribute('viewBox', '0 0 20 26');
    svg.setAttribute('style', `position:absolute;overflow:visible;pointer-events:none;width:${w}px;height:${w * 1.3}px;filter:drop-shadow(0 0 2px #00000088)`);
    svg.innerHTML =
      `<g fill="${color}">` +
      '<path d="M5,10 C4,6 16,6 15.5,11 C15,15 13,17 13.5,21 C14,25 6,25 6,21 C6,17 5.5,14 5,10 Z"/>' +
      '<circle cx="4.5" cy="5.5" r="2.2"/><circle cx="8.5" cy="3.2" r="2.3"/>' +
      '<circle cx="12.6" cy="3.4" r="2.1"/><circle cx="16" cy="6" r="1.8"/>' +
      '</g>';
    return svg;
  }

  /** A cartoon fist seen from the front (see FIST_TONES for the colours): fingers curled in, thumb across the side. */
  static fistGlyph(w: number, tone: keyof typeof FIST_TONES = 'yellow'): HTMLElement {
    const c = FIST_TONES[tone];
    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg') as unknown as HTMLElement;
    svg.setAttribute('viewBox', '0 0 24 20');
    svg.setAttribute('style', `position:absolute;overflow:visible;pointer-events:none;width:${w}px;height:${w * (20 / 24)}px;filter:drop-shadow(0 0 4px ${c.glow})`);
    const shapes = '<rect x="5" y="2" width="17" height="16" rx="4"/><rect x="2" y="6" width="8" height="11" rx="3.5"/>';
    svg.innerHTML =
      `<g fill="${c.edge}" stroke="${c.edge}" stroke-width="1.6">${shapes}</g>` +
      `<g fill="${c.fill}">${shapes}</g>` +
      `<path d="M11,6.5 H21 M11,10 H21 M11,13.5 H21" stroke="${c.lines}" stroke-width="1" stroke-linecap="round"/>`;
    return svg;
  }

  /** A small yellow cartoon bird (a little chick) facing right. */
  static birdGlyph(w: number): HTMLElement {
    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg') as unknown as HTMLElement;
    svg.setAttribute('viewBox', '0 0 22 16');
    svg.setAttribute('style', `position:absolute;overflow:visible;pointer-events:none;width:${w}px;height:${w * (16 / 22)}px`);
    const shapes = '<ellipse cx="9" cy="11" rx="8" ry="4.8"/><circle cx="14" cy="5" r="4"/>';
    svg.innerHTML =
      `<g fill="#B88A00" stroke="#B88A00" stroke-width="1.4">${shapes}</g>` +
      `<g fill="#FFE04A">${shapes}</g>` +
      '<polygon points="17.5,4.2 21.5,5.6 17.5,7" fill="#F08A24"/>' +
      '<circle cx="15" cy="4" r=".9" fill="#1a1a1a"/>' +
      '<path d="M4,10 Q8,7 11,10" fill="none" stroke="#C99A10" stroke-width="1"/>';
    return svg;
  }

  /** A simple cartoon bone (shaft with two round knobs at each end), outlined only on its outside. */
  static boneGlyph(w: number): HTMLElement {
    const h = w * 0.3;
    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg') as unknown as HTMLElement;
    svg.setAttribute('viewBox', '0 0 40 12');
    svg.setAttribute('style', `position:absolute;overflow:visible;pointer-events:none;width:${w}px;height:${h}px`);
    const shapes =
      '<rect x="5" y="3.6" width="30" height="4.8" rx="1"/>' +
      '<circle cx="4.5" cy="3.6" r="3.4"/><circle cx="4.5" cy="8.4" r="3.4"/>' +
      '<circle cx="35.5" cy="3.6" r="3.4"/><circle cx="35.5" cy="8.4" r="3.4"/>';
    // Outline layer underneath, fill layer on top: overlaps stay seamless.
    svg.innerHTML =
      `<g fill="#7E7A70" stroke="#7E7A70" stroke-width="1.6">${shapes}</g>` +
      `<g fill="#F6F3EA">${shapes}</g>`;
    return svg;
  }

  /** One half of a jaw: a white dome with a row of pointed teeth along its lower edge. */
  static jawGlyph(w: number, h: number, lower: boolean): HTMLElement {
    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg') as unknown as HTMLElement;
    svg.setAttribute('width', `${w}`);
    svg.setAttribute('height', `${h}`);
    svg.setAttribute('viewBox', '0 0 100 46');
    svg.setAttribute('style', `position:absolute;overflow:visible;pointer-events:none;width:${w}px;height:${h}px;filter:drop-shadow(0 0 3px #fff)`);
    const id = `jaw-${lower ? 'lo' : 'up'}-${Math.random().toString(36).slice(2, 8)}`;
    let teeth = '';
    for (let i = 0; i < 8; i++) {
      const x = 4 + i * 11.5;
      teeth += `M${x},30 L${x + 5.75},45 L${x + 11.5},30 `;
    }
    svg.innerHTML =
      `<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#C9CED8"/><stop offset=".55" stop-color="#fff"/><stop offset="1" stop-color="#E9ECF2"/></linearGradient></defs>` +
      `<path d="M2,30 Q2,2 50,2 Q98,2 98,30 Z" fill="url(#${id})" stroke="#7D8594" stroke-width="1.6"/>` +
      `<path d="${teeth}Z" fill="#fff" stroke="#7D8594" stroke-width="1.2" stroke-linejoin="round"/>`;
    return svg;
  }

  /** Two big rodent incisors side by side (cream to orange, chisel-edged at the bottom). */
  static incisorGlyph(h: number): HTMLElement {
    const ns = 'http://www.w3.org/2000/svg';
    const wrap = document.createElement('div');
    wrap.style.cssText = `position:absolute;width:${h * (20 / 30)}px;height:${h}px;pointer-events:none;filter:drop-shadow(0 0 4px #FFB070)`;
    const svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('viewBox', '0 0 20 30');
    svg.setAttribute('style', 'width:100%;height:100%;overflow:visible');
    const tooth = (x: number) => `<path d="M${x + 1},3 Q${x + 1},0 ${x + 4},0 H${x + 6} Q${x + 9},0 ${x + 9},3 V25 L${x + 1},28 Z"/>`;
    const shapes = tooth(0.5) + tooth(10.5);
    svg.innerHTML =
      '<defs><linearGradient id="incisor" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0" stop-color="#E89A50"/><stop offset=".45" stop-color="#FFE2B0"/><stop offset="1" stop-color="#FFF8EA"/>' +
      '</linearGradient></defs>' +
      `<g fill="#7A3E14" stroke="#7A3E14" stroke-width="1.6" stroke-linejoin="round">${shapes}</g>` +
      `<g fill="url(#incisor)">${shapes}</g>`;
    wrap.appendChild(svg);
    return wrap;
  }

  /** One glowing red snake eye with a black slit pupil; side -1 is the left eye (mirrored). */
  static snakeEyeGlyph(w: number, side: 1 | -1): HTMLElement {
    const ns = 'http://www.w3.org/2000/svg';
    const wrap = document.createElement('div');
    wrap.style.cssText = `position:absolute;width:${w}px;height:${w * 0.5}px;pointer-events:none;filter:drop-shadow(0 0 6px #FF3A2A)`;
    const svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('viewBox', '0 0 40 20');
    svg.setAttribute('style', `width:100%;height:100%;overflow:visible;transform:scaleX(${side})`);
    // Almond shape, inner corner lower than the outer one, for an angry stare.
    svg.innerHTML =
      '<defs><radialGradient id="snakeEye" cx="55%" cy="50%" r="60%">' +
      '<stop offset="0" stop-color="#FFD0A0"/><stop offset=".35" stop-color="#FF4A2A"/><stop offset="1" stop-color="#A0100C"/>' +
      '</radialGradient></defs>' +
      '<path d="M2,14 Q16,0 38,4 Q28,20 2,14 Z" fill="url(#snakeEye)" stroke="#5A0806" stroke-width="1.4"/>' +
      '<ellipse cx="21" cy="9.5" rx="1.8" ry="6" fill="#140404"/>';
    wrap.appendChild(svg);
    return wrap;
  }

  /** A jagged comic-style impact burst: irregular spikes in one colour round a core of another, with a bright centre. */
  static spikyBurst(size: number, outer: string, inner: string, centre = '#FFF6C0'): HTMLElement {
    const spikes = 12;
    const pts: string[] = [];
    for (let i = 0; i < spikes * 2; i++) {
      const a = (Math.PI * 2 * i) / (spikes * 2);
      const rad = i % 2 ? 22 + Math.random() * 8 : 42 + Math.random() * 8;
      pts.push(`${(50 + Math.cos(a) * rad).toFixed(1)}% ${(50 + Math.sin(a) * rad).toFixed(1)}%`);
    }
    const el = document.createElement('div');
    el.style.cssText = `position:absolute;width:${size}px;height:${size}px;pointer-events:none;filter:drop-shadow(0 0 4px ${inner})`;
    const shape = document.createElement('div');
    shape.style.cssText = `width:100%;height:100%;clip-path:polygon(${pts.join(',')});background:radial-gradient(circle,${centre} 0 12%,${inner} 30%,${outer} 55%)`;
    el.appendChild(shape);
    return el;
  }

  /** A purple four-point psychic sparkle inside a thin glowing ring. */
  static psySparkle(size: number): HTMLElement {
    return FxGlyphs.ringSparkle(size, '#C860FF', '#F0C8FF');
  }

  /** A four-point sparkle in `color` inside a thin glowing `ring` (Detect: cyan). */
  static ringSparkle(size: number, color: string, ring: string): HTMLElement {
    const el = FxGlyphs.sparkStar(size, color);
    const circle = document.createElement('div');
    circle.style.cssText = `position:absolute;inset:22%;border-radius:50%;border:1.5px solid ${ring};box-shadow:0 0 4px ${color}`;
    el.appendChild(circle);
    return el;
  }

  static pokeball(size: number): HTMLElement {
    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg') as unknown as HTMLElement;
    svg.setAttribute('viewBox', '0 0 20 20');
    svg.setAttribute(
      'style',
      `position:absolute;width:${size}px;height:${size}px;overflow:visible;filter:drop-shadow(0 2px 2px rgba(0,0,0,.3))`
    );
    svg.innerHTML =
      '<circle cx="10" cy="10" r="9" fill="#f6f6f6" stroke="#1a1a1a" stroke-width="1.4"/>' +
      '<path d="M1.3 9.3A9 9 0 0 1 18.7 9.3Z" fill="#ec4b3b"/>' +
      '<rect x="1" y="8.6" width="18" height="2.8" fill="#1a1a1a"/>' +
      '<circle cx="10" cy="10" r="2.7" fill="#fff" stroke="#1a1a1a" stroke-width="1.4"/>';
    return svg;
  }
}
