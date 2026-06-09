import { Rocket, Planet, Atmosphere } from './core/entities.js';
import { Chain } from './core/chain.js';
import { SETUPS } from './core/setups.js';
import { SvgRenderer } from './render/svg-renderer.js';
import { SimLoop } from './loop.js';
import { vec2 } from './core/vec2.js';

// ── HELPERS ───────────────────────────────────────────────────────────────────

// Resolve a config value that may be a function of {width, height}.
function resolve(value, dims) {
  return typeof value === 'function' ? value(dims) : value;
}

function buildEntities(cfg, dims) {
  const planetCfg = cfg.planet ? {
    position: resolve(cfg.planet.position, dims),
    radius:   cfg.planet.radius,
    g:        cfg.planet.g,
  } : null;

  const planet = planetCfg ? new Planet(planetCfg) : null;

  const atmosphere = cfg.atmosphere ? new Atmosphere({
    mode:            cfg.atmosphere.mode,
    dragCoefficient: cfg.atmosphere.dragCoefficient,
    planet,
    thickness:       cfg.atmosphere.thickness || 0,
  }) : null;

  const rCfg = cfg.rocket;
  const rocket = new Rocket({
    position:        resolve(rCfg.position, dims),
    velocity:        resolve(rCfg.velocity || { x: 0, y: 0 }, dims),
    angle:           resolve(rCfg.angle || 0, dims),
    mass:            rCfg.mass || 1,
    thrustMagnitude: resolve(rCfg.thrustMagnitude || 260, dims),
    engineOn:        rCfg.engineOn || false,
    engineDirection: rCfg.engineDirection || 'rear',
  });

  let chain = null;
  if (cfg.chain) {
    chain = new Chain(cfg.chain);
    layoutChain(chain, cfg, rocket);
  }

  return { rocket, planet, atmosphere, chain };
}

// Lay the chain out along its configured initial direction.
// cfg.chain.initAngle is radians from straight-down (0 = hanging vertically).
function layoutChain(chain, cfg, rocket) {
  const a = cfg.chain.initAngle || 0;
  chain.layout(rocket, { x: Math.sin(a), y: Math.cos(a) });
}

// ── ENGINE BUTTON ─────────────────────────────────────────────────────────────

function createEngineButton(mountEl, rocket) {
  const btn = document.createElement('button');
  btn.className = 'sim-engine-btn';
  btn.textContent = 'FIRE';
  btn.setAttribute('aria-label', 'Fire engine (hold)');

  const on  = () => { rocket.engineOn = true; };
  const off = () => { rocket.engineOn = false; };

  btn.addEventListener('pointerdown',   on);
  btn.addEventListener('pointerup',     off);
  btn.addEventListener('pointercancel', off);
  btn.addEventListener('pointerleave',  off);

  mountEl.style.position = 'relative';
  mountEl.appendChild(btn);

  return { destroy: () => btn.remove() };
}

// ── FADE TRANSITION ───────────────────────────────────────────────────────────

function fadeTo(loop, target, durationMs) {
  return new Promise(resolve => {
    const start = loop._fadeAlpha;
    const startTime = performance.now();
    function tick(now) {
      const t = Math.min((now - startTime) / durationMs, 1);
      loop.setFadeAlpha(start + (target - start) * t);
      if (t < 1) requestAnimationFrame(tick);
      else resolve();
    }
    requestAnimationFrame(tick);
  });
}

// ── MOUNT ─────────────────────────────────────────────────────────────────────

// Public API. Returns { destroy, pause, resume, reset }.
export function mount(mountEl, setupName, options = {}) {
  const cfg = SETUPS[setupName];
  if (!cfg) throw new Error(`Unknown setup: "${setupName}"`);

  const width  = options.width  || mountEl.clientWidth  || 400;
  const height = options.height || mountEl.clientHeight || 400;
  const dims   = { width, height };

  let { rocket, planet, atmosphere, chain } = buildEntities(cfg, dims);

  const flatWorld = cfg.flatWorld
    ? { atmoTopY: resolve(cfg.flatWorld.atmoTopY, dims) }
    : null;

  const rendererConfig = {
    width, height,
    // Flat-world setups use a huge off-screen planet for uniform gravity —
    // it provides physics only and must not be drawn.
    planet:        (planet && !flatWorld) ? { position: planet.position, radius: planet.radius } : null,
    atmosphere:    flatWorld ? null : (cfg.atmosphere || null),
    flatWorld,
    chain:         !!chain,
    plume:         cfg.plume || null,
    showOrbitPath: cfg.showOrbitPath || false,
    orbitRadius:   cfg.orbitRadius  || null,
    planetLabel:   cfg.planetLabel  || null,
    planetLabelSize: cfg.planetLabelSize || null,
    rocketScale:   cfg.rocketScale  || 1,
    hideRocket:    cfg.hideRocket   || false,
  };

  const renderer = new SvgRenderer(mountEl, rendererConfig);

  // Initial static render
  renderer.update({ rocket, chain, fadeAlpha: 1 }, 0);

  let buttonHandle = null;
  if (cfg.controls?.showButton) {
    buttonHandle = createEngineButton(mountEl, rocket);
  }

  // Callout overlay — HTML element shown at a sim-space position (rocket
  // crash point, or the point where the chain burned through).
  let calloutEl = null;
  function showCallout(text, pos) {
    if (!text) return;
    calloutEl = document.createElement('div');
    calloutEl.className = 'sim-crash-callout';
    calloutEl.textContent = text;
    // Clamp into the panel so off-screen events (e.g. a burn at the edge on
    // a narrow mobile panel) still show their callout.
    calloutEl.style.left = Math.max(16, Math.min(width - 120, pos.x)) + 'px';
    calloutEl.style.top  = Math.max(40, Math.min(height - 24, pos.y)) + 'px';
    mountEl.style.position = 'relative';
    mountEl.appendChild(calloutEl);
    void calloutEl.offsetWidth;
    calloutEl.classList.add('visible');
  }
  function hideCrashCallout() {
    if (calloutEl) {
      calloutEl.remove();
      calloutEl = null;
    }
  }

  let isResetting = false;
  let isDestroyed = false;

  async function reset() {
    if (isResetting || isDestroyed) return;
    isResetting = true;

    // Hold the crash frame so the callout (and the crash itself) is readable.
    const holdMs = cfg.crashHoldMs ?? (cfg.crashCallout ? 1400 : 0);
    if (cfg.crashCallout && loop._crashed) showCallout(cfg.crashCallout, rocket.position);
    loop.pause();
    if (holdMs > 0) await new Promise(r => setTimeout(r, holdMs));
    if (isDestroyed) { isResetting = false; return; }

    await fadeTo(loop, 0, 300);
    if (isDestroyed) { isResetting = false; return; }
    hideCrashCallout();

    const rebuilt = buildEntities(cfg, dims);
    rocket.position        = rebuilt.rocket.position;
    rocket.velocity        = rebuilt.rocket.velocity;
    rocket.angle           = rebuilt.rocket.angle;
    rocket.thrustMagnitude = rebuilt.rocket.thrustMagnitude;
    rocket.engineDirection = cfg.rocket.engineDirection || 'rear';
    rocket.engineOn        = cfg.rocket.engineOn || false;
    if (chain) layoutChain(chain, cfg, rocket);

    loop.resetSimTime();
    loop.setFadeAlpha(0);
    loop.resume();
    await fadeTo(loop, 1, 300);
    isResetting = false;
  }

  // Chain burn-through: show the callout at the burn point, let the severed
  // chain fall for a beat (the loop keeps running), then reset.
  let burnTimer = null;
  function handleChainBurn(point) {
    if (isResetting || isDestroyed) return;
    showCallout(cfg.chainBurnCallout, point);
    burnTimer = setTimeout(() => { burnTimer = null; reset(); }, 1600);
  }

  const loop = new SimLoop({
    rocket, planet, atmosphere, chain,
    renderer,
    bounds: { width, height },
    trackVelocity: cfg.trackVelocity !== false,
    controller:  cfg.controller  || null,
    autoResetAt: cfg.autoResetAt ?? null,
    plume:       cfg.plume       || null,
    onChainBurn: (cfg.chain && cfg.plume) ? handleChainBurn : null,
    forwardAirspeed: cfg.forwardAirspeed || 0,
    onCrash:     cfg.resetWhen === 'crash'     ? reset : undefined,
    onOffscreen: cfg.resetWhen === 'offscreen' ? reset : undefined,
    onAutoReset: reset,
  });

  // IntersectionObserver: pause when not in viewport
  let observer = null;
  if (typeof IntersectionObserver !== 'undefined') {
    observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loop.resume();
        else loop.pause();
      },
      { rootMargin: '100px' }
    );
    observer.observe(mountEl);
  }

  loop.start();

  return {
    pause:   () => loop.pause(),
    resume:  () => loop.resume(),
    reset:   ()  => reset(),
    destroy: () => {
      isDestroyed = true;
      if (burnTimer) { clearTimeout(burnTimer); burnTimer = null; }
      loop.destroy();
      renderer.destroy();
      observer?.disconnect();
      buttonHandle?.destroy();
      hideCrashCallout();
    },
  };
}
