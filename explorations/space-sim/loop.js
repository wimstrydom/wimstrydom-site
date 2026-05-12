import { netAcceleration, integrate } from './core/physics.js';
import { vec2 } from './core/vec2.js';

const FIXED_DT  = 1 / 240;  // physics sub-step (seconds)
const MAX_DT    = 0.1;       // cap real dt to prevent spiral-of-death on tab resume

// ── SIMULATION LOOP ───────────────────────────────────────────────────────────
// One instance per mount. Drives physics sub-stepping and hands snapshots to the renderer.

export class SimLoop {
  constructor({ rocket, planet, atmosphere, renderer, onCrash, onOffscreen, bounds, trackVelocity = true }) {
    this.rocket      = rocket;
    this.planet      = planet;
    this.atmosphere  = atmosphere;
    this.renderer    = renderer;
    this.onCrash      = onCrash     || (() => {});
    this.onOffscreen  = onOffscreen || (() => {});
    this.trackVelocity = trackVelocity;
    this.bounds      = bounds;     // { width, height } — sim canvas dimensions

    this._rafId       = null;
    this._accumulator = 0;
    this._lastTime    = null;
    this._paused      = false;
    this._crashed     = false;
    this._fadeAlpha   = 1;

    this._visibilityHandler = () => {
      if (document.hidden) this._pauseInternal();
      else this._resumeInternal();
    };
    document.addEventListener('visibilitychange', this._visibilityHandler);
  }

  start() {
    this._crashed  = false;
    this._lastTime = null;
    this._tick(performance.now());
  }

  pause()  { this._paused = true; }
  resume() { if (this._paused) { this._paused = false; this._crashed = false; this._lastTime = null; this._tick(performance.now()); } }

  _pauseInternal()  { cancelAnimationFrame(this._rafId); this._rafId = null; }
  _resumeInternal() {
    if (!this._rafId && !this._paused) {
      this._lastTime = null;
      this._tick(performance.now());
    }
  }

  destroy() {
    cancelAnimationFrame(this._rafId);
    document.removeEventListener('visibilitychange', this._visibilityHandler);
  }

  _tick(now) {
    this._rafId = requestAnimationFrame((t) => this._tick(t));

    if (this._paused) return;

    const rawDt = this._lastTime === null ? 0 : (now - this._lastTime) / 1000;
    this._lastTime = now;
    const dt = Math.min(rawDt, MAX_DT);

    // Fixed-timestep accumulator
    this._accumulator += dt;
    while (this._accumulator >= FIXED_DT) {
      this._step(FIXED_DT);
      this._accumulator -= FIXED_DT;
    }

    // Renderer update
    this.renderer.update(
      { rocket: this.rocket, fadeAlpha: this._fadeAlpha },
      dt
    );
  }

  _step(dt) {
    if (this._crashed) return;

    const env = {
      planets:    this.planet ? [this.planet] : [],
      atmosphere: this.atmosphere || null,
    };

    const forces      = this.rocket.applyForces(env);
    const acceleration = netAcceleration(forces, this.rocket.mass);
    const { position, velocity } = integrate(
      this.rocket.position,
      this.rocket.velocity,
      acceleration,
      dt
    );

    this.rocket.position = position;
    this.rocket.velocity = velocity;

    // Auto-orient: smoothly rotate craft to face velocity direction.
    // Disabled for setups that specify a fixed orientation (hover, falling, hail-mary).
    if (this.trackVelocity) {
      const speed = vec2.magnitude(velocity);
      if (speed > 8) {
        const targetAngle = Math.atan2(velocity.x, -velocity.y);
        let diff = targetAngle - this.rocket.angle;
        while (diff >  Math.PI) diff -= 2 * Math.PI;
        while (diff < -Math.PI) diff += 2 * Math.PI;
        this.rocket.angle += diff * Math.min(dt * 4, 1);
      }
    }

    // Terminate conditions
    if (this.planet && this.planet.contains(position)) {
      // Clamp to surface and freeze
      const dir  = vec2.sub(position, this.planet.position);
      const dist = vec2.magnitude(dir);
      this.rocket.position = dist > 0
        ? vec2.add(this.planet.position, vec2.scale(vec2.normalize(dir), this.planet.radius))
        : { x: this.planet.position.x, y: this.planet.position.y - this.planet.radius };
      this.rocket.velocity = vec2.zero();
      this._crashed = true;
      this.onCrash();
      return;
    }

    const margin = 80;
    const { width, height } = this.bounds;
    if (
      position.x < -margin || position.x > width  + margin ||
      position.y < -margin || position.y > height + margin
    ) {
      this.onOffscreen();
    }
  }

  // Direct access to set fade alpha (used by the mount controller for transitions)
  setFadeAlpha(a) { this._fadeAlpha = a; }
}
