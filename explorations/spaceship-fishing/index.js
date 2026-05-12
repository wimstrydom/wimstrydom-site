import { Rocket, Planet, Atmosphere } from './core/entities.js';
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

  return { rocket, planet, atmosphere };
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

  let { rocket, planet, atmosphere } = buildEntities(cfg, dims);

  const rendererConfig = {
    width, height,
    planet:        planet  ? { position: planet.position,  radius: planet.radius } : null,
    atmosphere:    cfg.atmosphere || null,
    showOrbitPath: cfg.showOrbitPath || false,
    orbitRadius:   cfg.orbitRadius  || null,
    planetLabel:   cfg.planetLabel  || null,
    hideRocket:    cfg.hideRocket   || false,
  };

  const renderer = new SvgRenderer(mountEl, rendererConfig);

  // Initial static render
  renderer.update({ rocket, fadeAlpha: 1 }, 0);

  let buttonHandle = null;
  if (cfg.controls?.showButton) {
    buttonHandle = createEngineButton(mountEl, rocket);
  }

  // Crash callout overlay — HTML element shown at the rocket's crash position.
  let calloutEl = null;
  function showCrashCallout(text) {
    if (!text) return;
    calloutEl = document.createElement('div');
    calloutEl.className = 'sim-crash-callout';
    calloutEl.textContent = text;
    const rx = rocket.position.x;
    const ry = rocket.position.y;
    calloutEl.style.left = rx + 'px';
    calloutEl.style.top  = ry + 'px';
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

  async function reset() {
    if (isResetting) return;
    isResetting = true;

    // Hold the crash frame so the callout (and the crash itself) is readable.
    const holdMs = cfg.crashHoldMs ?? (cfg.crashCallout ? 1400 : 0);
    if (cfg.crashCallout) showCrashCallout(cfg.crashCallout);
    loop.pause();
    if (holdMs > 0) await new Promise(r => setTimeout(r, holdMs));

    await fadeTo(loop, 0, 300);
    hideCrashCallout();

    const rebuilt = buildEntities(cfg, dims);
    rocket.position        = rebuilt.rocket.position;
    rocket.velocity        = rebuilt.rocket.velocity;
    rocket.angle           = rebuilt.rocket.angle;
    rocket.thrustMagnitude = rebuilt.rocket.thrustMagnitude;
    rocket.engineOn        = cfg.rocket.engineOn || false;

    loop.resetSimTime();
    loop.setFadeAlpha(0);
    loop.resume();
    await fadeTo(loop, 1, 300);
    isResetting = false;
  }

  const loop = new SimLoop({
    rocket, planet, atmosphere,
    renderer,
    bounds: { width, height },
    trackVelocity: cfg.trackVelocity !== false,
    controller:  cfg.controller  || null,
    autoResetAt: cfg.autoResetAt ?? null,
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
      loop.destroy();
      renderer.destroy();
      observer?.disconnect();
      buttonHandle?.destroy();
      hideCrashCallout();
    },
  };
}
