import { createRocketIcon, ENGINE_EXHAUST_Y } from './rocket-icon.js';

const NS = 'http://www.w3.org/2000/svg';

function el(tag, attrs = {}) {
  const e = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
  return e;
}

// Design token mirrors — these match style.css CSS variables but SVG/JS can't read them.
// Update here if the palette changes in style.css.
const TOKEN = {
  bg:              '#12100e',              // --bg
  planetBase:      '#1a1610',              // dark warm tone for planet fill
  inkDim:          'rgba(232,220,200,0.55)', // --ink-dim
  inkFaint:        'rgba(232,220,200,0.10)', // --ink-faint
  gold:            '#c8a96e',              // --gold
  goldDim:         'rgba(200,169,110,0.55)', // --gold-dim
  blue:            '#5aabcf',              // --blue
  blueTint:        'rgba(90,171,207,0.10)', // --blue-tint
  red:             '#e0705a',              // --red
  amber:           '#c4933a',              // --amber
};

// Chain link colour by heat: cool grey-ink → amber → red as heat goes 0 → 1.
// RGB triples for the three stops.
const CHAIN_COOL  = [200, 192, 176];
const CHAIN_AMBER = [196, 147, 58];
const CHAIN_RED   = [224, 112, 90];

function mixRgb(a, b, t) {
  const r = Math.round(a[0] + (b[0] - a[0]) * t);
  const g = Math.round(a[1] + (b[1] - a[1]) * t);
  const bl = Math.round(a[2] + (b[2] - a[2]) * t);
  return `rgb(${r},${g},${bl})`;
}

function heatColor(heat) {
  if (heat <= 0.02) return 'rgba(200,192,176,0.65)';
  if (heat < 0.45)  return mixRgb(CHAIN_COOL, CHAIN_AMBER, heat / 0.45);
  return mixRgb(CHAIN_AMBER, CHAIN_RED, Math.min(1, (heat - 0.45) / 0.55));
}

// ── SVG RENDERER ──────────────────────────────────────────────────────────────
// Owns the <svg> element and a _worldGroup inside it.
// All scene content lives in _worldGroup so camera transforms can be applied without
// affecting HTML overlays (labels, buttons) that sit outside the SVG.

export class SvgRenderer {
  constructor(mountEl, config = {}) {
    this.mount  = mountEl;
    this.width  = config.width  || mountEl.clientWidth  || 400;
    this.height = config.height || mountEl.clientHeight || 400;

    this._glowOpacity       = 0;
    this._glowTargetOpacity = 0;
    this._planetTickGroup   = null;
    this._rocketScale       = config.rocketScale || 1;

    this._buildSvg(config);
  }

  _buildSvg(config) {
    const svg = el('svg', {
      width:   this.width,
      height:  this.height,
      viewBox: `0 0 ${this.width} ${this.height}`,
      style:   'display:block;',
    });

    // ── DEFS ────────────────────────────────────────────────────────────────
    const defs = el('defs');

    // Planet highlight gradient — warm gold highlight over dark gold-tinted base
    if (config.planet) {
      const g = el('radialGradient', { id: 'planet-grad', cx: '38%', cy: '35%', r: '65%', fx: '38%', fy: '35%' });
      g.append(
        el('stop', { offset: '0%',   'stop-color': TOKEN.gold,       'stop-opacity': '0.22' }),
        el('stop', { offset: '100%', 'stop-color': TOKEN.planetBase,  'stop-opacity': '1' }),
      );
      defs.append(g);
    }

    // Atmosphere shell gradient — dynamic stops so the hard edge locks to the planet surface.
    // The atmosphere circle has radius = planet.radius + thickness.
    // stop offsets are fractions of that total radius, so surfaceFrac marks exactly the surface.
    if (config.atmosphere && config.atmosphere.mode === 'shell' && config.planet) {
      const planetR    = config.planet.radius;
      const thickness  = config.atmosphere.thickness || 40;
      const totalR     = planetR + thickness;
      const sf         = planetR / totalR;                    // surface fraction (0–1)

      // Two stops at sf: opacity 0 → peak opacity creates a hard line at the surface.
      // From the surface, the atmosphere fades to transparent at the outer edge.
      const pct = (f) => (f * 100).toFixed(2) + '%';
      const s0  = pct(0);
      const s1  = pct(sf - 0.001);                            // just inside surface
      const s2  = pct(sf);                                    // hard edge: surface
      const s3  = pct(sf + (1 - sf) * 0.35);                 // 35% through atmosphere
      const s4  = pct(sf + (1 - sf) * 0.70);                 // 70% through atmosphere
      const s5  = pct(1);

      const g = el('radialGradient', { id: 'atmo-grad', cx: '50%', cy: '50%', r: '50%' });
      g.append(
        el('stop', { offset: s0, 'stop-color': TOKEN.blue, 'stop-opacity': '0' }),
        el('stop', { offset: s1, 'stop-color': TOKEN.blue, 'stop-opacity': '0' }),
        el('stop', { offset: s2, 'stop-color': TOKEN.blue, 'stop-opacity': '0.22' }),
        el('stop', { offset: s3, 'stop-color': TOKEN.blue, 'stop-opacity': '0.10' }),
        el('stop', { offset: s4, 'stop-color': TOKEN.blue, 'stop-opacity': '0.02' }),
        el('stop', { offset: s5, 'stop-color': TOKEN.blue, 'stop-opacity': '0' }),
      );
      defs.append(g);
    }

    // Field atmosphere — uniform background tint
    if (config.atmosphere && config.atmosphere.mode === 'field') {
      const g = el('radialGradient', { id: 'field-grad', cx: '50%', cy: '50%', r: '50%' });
      g.append(
        el('stop', { offset: '0%',   'stop-color': TOKEN.blueTint, 'stop-opacity': '0.6' }),
        el('stop', { offset: '100%', 'stop-color': TOKEN.blueTint, 'stop-opacity': '0.15' }),
      );
      defs.append(g);
    }

    // Engine glow gradient
    const glowG = el('radialGradient', { id: 'glow-grad', cx: '50%', cy: '30%', r: '70%' });
    glowG.append(
      el('stop', { offset: '0%',   'stop-color': '#ffb060', 'stop-opacity': '0.95' }),
      el('stop', { offset: '40%',  'stop-color': '#ff6820', 'stop-opacity': '0.6' }),
      el('stop', { offset: '100%', 'stop-color': '#ff4000', 'stop-opacity': '0' }),
    );
    defs.append(glowG);

    // Exhaust plume gradient — bright at the nozzle, fading along the cone.
    if (config.plume && config.plume.mode === 'cone') {
      const oy  = config.plume.originY ?? 30;
      const len = config.plume.length  ?? 200;
      const pg = el('linearGradient', {
        id: 'plume-grad',
        gradientUnits: 'userSpaceOnUse',
        x1: '0', y1: String(oy), x2: '0', y2: String(oy + len),
      });
      pg.append(
        el('stop', { offset: '0%',   'stop-color': '#ffb060', 'stop-opacity': '0.55' }),
        el('stop', { offset: '30%',  'stop-color': '#ff6820', 'stop-opacity': '0.22' }),
        el('stop', { offset: '100%', 'stop-color': '#ff4000', 'stop-opacity': '0' }),
      );
      defs.append(pg);
    }

    // Flat-world atmosphere band — density grows downward from the band top.
    if (config.flatWorld) {
      const fg = el('linearGradient', {
        id: 'flat-atmo-grad',
        gradientUnits: 'userSpaceOnUse',
        x1: '0', y1: String(config.flatWorld.atmoTopY),
        x2: '0', y2: String(this.height),
      });
      fg.append(
        el('stop', { offset: '0%',   'stop-color': TOKEN.blue, 'stop-opacity': '0.05' }),
        el('stop', { offset: '100%', 'stop-color': TOKEN.blue, 'stop-opacity': '0.28' }),
      );
      defs.append(fg);
    }

    svg.append(defs);

    // ── WORLD GROUP — all scene content lives here; camera transforms applied here ──
    this._worldGroup = document.createElementNS(NS, 'g');
    this._worldGroup.setAttribute('class', 'sim-world');

    // Field atmosphere background
    if (config.atmosphere && config.atmosphere.mode === 'field') {
      this._worldGroup.append(el('rect', {
        x: '0', y: '0', width: this.width, height: this.height,
        fill: 'url(#field-grad)',
      }));
    }

    // Decorative orbit path
    if (config.showOrbitPath && config.planet) {
      this._worldGroup.append(el('circle', {
        cx: config.planet.position.x,
        cy: config.planet.position.y,
        r:  config.orbitRadius || 100,
        fill: 'none',
        stroke: TOKEN.goldDim,
        'stroke-width': '0.75',
        'stroke-dasharray': '3 6',
      }));
    }

    // Planet body (base + highlight layer + rotation ticks)
    if (config.planet) {
      const px = config.planet.position.x;
      const py = config.planet.position.y;
      const pr = config.planet.radius;

      this._worldGroup.append(
        el('circle', {
          cx: px, cy: py, r: pr,
          fill: TOKEN.planetBase, stroke: 'none',
        }),
        el('circle', {
          cx: px, cy: py, r: pr,
          fill: 'url(#planet-grad)', stroke: TOKEN.goldDim, 'stroke-width': '0.75',
        }),
      );

      // Static tick marks — 24 radial lines from edge (r) inward to r*0.68
      this._planetTickGroup = document.createElementNS(NS, 'g');
      this._planetTickGroup.setAttribute('transform', `translate(${px},${py})`);
      for (let i = 0; i < 24; i++) {
        const rotG = document.createElementNS(NS, 'g');
        rotG.setAttribute('transform', `rotate(${i * 15})`);
        rotG.append(el('line', {
          x1: String(pr), y1: '0',
          x2: String(pr * 0.95), y2: '0',
          stroke: TOKEN.goldDim, 'stroke-width': '0.6',
        }));
        this._planetTickGroup.append(rotG);
      }
      this._worldGroup.append(this._planetTickGroup);
    }

    // Flat-world atmosphere band: gradient rect below the band top plus a
    // faint dashed line marking the top of the air.
    if (config.flatWorld) {
      const topY = config.flatWorld.atmoTopY;
      this._worldGroup.append(
        el('rect', {
          x: '0', y: String(topY),
          width: this.width, height: this.height - topY,
          fill: 'url(#flat-atmo-grad)',
        }),
        el('line', {
          x1: '0', y1: String(topY), x2: this.width, y2: String(topY),
          stroke: TOKEN.inkDim, 'stroke-width': '0.6', 'stroke-dasharray': '4 9',
          opacity: '0.5',
        }),
      );
    }

    // Atmosphere shell
    if (config.atmosphere && config.atmosphere.mode === 'shell' && config.planet) {
      const r = config.planet.radius + (config.atmosphere.thickness || 40);
      this._worldGroup.append(el('circle', {
        cx: config.planet.position.x, cy: config.planet.position.y,
        r,
        fill: 'url(#atmo-grad)', stroke: 'none',
      }));
    }

    // Planet label — large italic text centred on the planet.
    if (config.planet && config.planetLabel) {
      const px = config.planet.position.x;
      const py = config.planet.position.y;
      const label = el('text', {
        x: px,
        y: py,
        'text-anchor': 'middle',
        'dominant-baseline': 'middle',
        'font-family': "'EB Garamond', Georgia, serif",
        'font-style': 'italic',
        'font-size': String(config.planetLabelSize || 42),
        'letter-spacing': '0.04em',
        fill: TOKEN.inkDim,
      });
      label.textContent = config.planetLabel;
      this._worldGroup.append(label);
    }

    // Chain group — drawn under the rocket so links tuck behind the hull.
    this._chainGroup = null;
    this._chainLines = [];
    this._collectorEl = null;
    if (config.chain) {
      this._chainGroup = document.createElementNS(NS, 'g');
      this._chainGroup.setAttribute('class', 'chain-group');
      this._collectorEl = el('circle', {
        r: '4.5', fill: TOKEN.planetBase,
        stroke: TOKEN.gold, 'stroke-width': '1.2',
      });
      this._worldGroup.append(this._chainGroup);
    }

    // Rocket group (icon + glow + optional plume) — transformed each frame
    this._rocketGroup = document.createElementNS(NS, 'g');
    this._rocketGroup.setAttribute('class', 'rocket-group');

    this._plumeEl = null;
    this._plumeMode = config.plume?.mode || null;
    if (config.plume && config.plume.mode === 'cone') {
      const oy   = config.plume.originY ?? 30;
      const len  = config.plume.length  ?? 200;
      const tanH = Math.tan(((config.plume.halfAngleDeg ?? 8) * Math.PI) / 180);
      const r0 = 3;
      const r1 = r0 + len * tanH;
      this._plumeEl = el('path', {
        d: `M ${-r0} ${oy} L ${r0} ${oy} L ${r1} ${oy + len} Q 0 ${oy + len + r1 * 0.6} ${-r1} ${oy + len} Z`,
        fill: 'url(#plume-grad)',
        opacity: '0',
      });
    } else if (config.plume && config.plume.mode === 'halo') {
      // Engine pointed out of the viewing plane — a soft glow around the
      // nozzle instead of a directional cone.
      const oy = config.plume.originY ?? 30;
      this._plumeEl = el('circle', {
        cx: '0', cy: String(oy), r: '15',
        fill: 'url(#glow-grad)',
        opacity: '0',
      });
    }

    this._glowEl = el('ellipse', {
      cx: '0', cy: String(ENGINE_EXHAUST_Y + 10),
      rx: '12', ry: '18',
      fill: 'url(#glow-grad)',
    });
    // Halo mode replaces the directional glow ellipse entirely.
    if (this._plumeMode === 'halo') this._glowEl.style.display = 'none';

    if (this._plumeEl) this._rocketGroup.append(this._plumeEl);
    this._rocketIcon = createRocketIcon();

    this._rocketGroup.append(this._glowEl, this._rocketIcon);
    if (config.hideRocket) this._rocketGroup.style.display = 'none';
    this._worldGroup.append(this._rocketGroup);
    svg.append(this._worldGroup);

    this._svg = svg;
    this.mount.appendChild(svg);
  }

  // Called once per frame by the loop with a snapshot of entity state.
  update(snapshot, dt = 0) {
    const { rocket, chain = null, fadeAlpha = 1 } = snapshot;

    const deg = (rocket.angle * 180) / Math.PI;
    const sc = this._rocketScale === 1 ? '' : ` scale(${this._rocketScale})`;
    this._rocketGroup.setAttribute(
      'transform',
      `translate(${rocket.position.x},${rocket.position.y}) rotate(${deg})${sc}`
    );
    this._rocketGroup.style.opacity = fadeAlpha;

    // Glow — interpolate toward target opacity
    this._glowTargetOpacity = rocket.engineOn ? 1 : 0;
    if (dt > 0) {
      const tau = 0.08;
      this._glowOpacity += (this._glowTargetOpacity - this._glowOpacity) * (1 - Math.exp(-dt / tau));
    } else {
      this._glowOpacity = this._glowTargetOpacity;
    }
    this._glowEl.setAttribute('opacity', this._glowOpacity.toFixed(3));
    if (this._plumeEl) {
      const scale = this._plumeMode === 'halo' ? 0.9 : 0.5;
      this._plumeEl.setAttribute('opacity', (this._glowOpacity * scale).toFixed(3));
    }

    // Chain — one <line> per link, coloured by heat; collector at the tip.
    if (this._chainGroup && chain && chain.points.length) {
      const pts = chain.points;
      // Lazily create the link lines to match the chain length; keep the
      // collector as the last child so it draws on top.
      while (this._chainLines.length < pts.length - 1) {
        const ln = el('line', { 'stroke-width': '1.4', 'stroke-linecap': 'round' });
        this._chainLines.push(ln);
        this._chainGroup.append(ln);
      }
      if (this._collectorEl.parentNode !== this._chainGroup) {
        this._chainGroup.append(this._collectorEl);
      }
      for (let i = 0; i < pts.length - 1; i++) {
        const ln = this._chainLines[i];
        // A severed joint isn't drawn — the gap shows the break.
        if (chain.severedAt !== null && i + 1 === chain.severedAt) {
          ln.setAttribute('opacity', '0');
          continue;
        }
        ln.setAttribute('opacity', '1');
        ln.setAttribute('x1', pts[i].x.toFixed(1));
        ln.setAttribute('y1', pts[i].y.toFixed(1));
        ln.setAttribute('x2', pts[i + 1].x.toFixed(1));
        ln.setAttribute('y2', pts[i + 1].y.toFixed(1));
        const heat = Math.max(pts[i].heat, pts[i + 1].heat);
        ln.setAttribute('stroke', heatColor(heat));
        ln.setAttribute('stroke-width', heat > 0.6 ? '2.2' : '1.4');
      }
      const tip = pts[pts.length - 1];
      this._collectorEl.setAttribute('cx', tip.x.toFixed(1));
      this._collectorEl.setAttribute('cy', tip.y.toFixed(1));
      if (tip.heat > 0.05) this._collectorEl.setAttribute('stroke', heatColor(tip.heat));
      else this._collectorEl.setAttribute('stroke', TOKEN.gold);
      this._chainGroup.style.opacity = fadeAlpha;
    }
  }

  // Apply a transform string to the world group (camera lock/zoom hooks).
  setWorldTransform(transform) {
    this._worldGroup.setAttribute('transform', transform || '');
  }

  resize(width, height) {
    this.width  = width;
    this.height = height;
    this._svg.setAttribute('width',   width);
    this._svg.setAttribute('height',  height);
    this._svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
  }

  destroy() { this._svg.remove(); }
}
