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
};

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
        'font-size': '42',
        'letter-spacing': '0.04em',
        fill: TOKEN.inkDim,
      });
      label.textContent = config.planetLabel;
      this._worldGroup.append(label);
    }

    // Rocket group (icon + glow) — transformed each frame
    this._rocketGroup = document.createElementNS(NS, 'g');
    this._rocketGroup.setAttribute('class', 'rocket-group');

    this._glowEl = el('ellipse', {
      cx: '0', cy: String(ENGINE_EXHAUST_Y + 10),
      rx: '12', ry: '18',
      fill: 'url(#glow-grad)',
    });
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
    const { rocket, fadeAlpha = 1 } = snapshot;

    const deg = (rocket.angle * 180) / Math.PI;
    this._rocketGroup.setAttribute(
      'transform',
      `translate(${rocket.position.x},${rocket.position.y}) rotate(${deg})`
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
  }

  // Apply a transform string to the world group (used by the sandbox for camera lock/zoom).
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
