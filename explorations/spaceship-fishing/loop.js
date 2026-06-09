import { netAcceleration, integrate } from './core/physics.js';
import { vec2 } from './core/vec2.js';

const FIXED_DT  = 1 / 240;  // physics sub-step (seconds)
const MAX_DT    = 0.1;       // cap real dt to prevent spiral-of-death on tab resume

// ── SIMULATION LOOP ───────────────────────────────────────────────────────────
// One instance per mount. Drives physics sub-stepping and hands snapshots to the renderer.

export class SimLoop {
  constructor({ rocket, planet, atmosphere, renderer, onCrash, onOffscreen, onAutoReset, bounds, trackVelocity = true, controller = null, autoResetAt = null, chain = null, plume = null, onChainBurn = null, forwardAirspeed = 0 }) {
    this.rocket      = rocket;
    this.planet      = planet;
    this.atmosphere  = atmosphere;
    this.renderer    = renderer;
    this.onCrash      = onCrash       || (() => {});
    this.onOffscreen  = onOffscreen   || (() => {});
    this.onAutoReset  = onAutoReset   || (() => {});
    this.trackVelocity = trackVelocity;
    this.controller  = controller;     // (rocket, simTime, dt, ctx) => void — drives scripted scenes
    this.autoResetAt = autoResetAt;    // seconds; null = no auto reset
    this.bounds      = bounds;         // { width, height } — sim canvas dimensions
    this.chain       = chain;          // Chain instance or null
    this.plume       = plume;          // { mode, originY, halfAngleDeg, length, heatRate, aeroHeatK } or null
    this.onChainBurn = onChainBurn;    // (point) => void — fired once when any link reaches heat 1
    this.forwardAirspeed = forwardAirspeed;  // out-of-plane airspeed (px/s) added to aero heating only
    this._chainBurnFired = false;

    this._rafId       = null;
    this._accumulator = 0;
    this._lastTime    = null;
    this._paused      = false;
    this._crashed     = false;
    this._fadeAlpha   = 1;
    this._simTime     = 0;             // accumulated sim seconds since last (re)start
    this._autoResetFired = false;

    this._visibilityHandler = () => {
      if (document.hidden) this._pauseInternal();
      else this._resumeInternal();
    };
    document.addEventListener('visibilitychange', this._visibilityHandler);
  }

  start() {
    this._crashed  = false;
    this._lastTime = null;
    this._simTime  = 0;
    this._autoResetFired = false;
    this._chainBurnFired = false;
    this._tick(performance.now());
  }

  resetSimTime() {
    this._simTime = 0;
    this._autoResetFired = false;
    this._chainBurnFired = false;
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
      { rocket: this.rocket, chain: this.chain, fadeAlpha: this._fadeAlpha },
      dt
    );
  }

  // World-space exhaust geometry for the current rocket pose: nozzle point and
  // unit exhaust direction (anti-facing, i.e. local +y rotated into the world).
  _exhaustGeometry() {
    const a = this.rocket.angle;
    const c = Math.cos(a), s = Math.sin(a);
    const oy = this.plume?.originY ?? 30;
    return {
      nozzle: {
        x: this.rocket.position.x - oy * s,
        y: this.rocket.position.y + oy * c,
      },
      dir: { x: -s, y: c },
    };
  }

  // Chain heating: exhaust-plume immersion + aerodynamic heating. Fires
  // onChainBurn once when any link reaches heat 1, severing the chain there.
  _heatChain(dt) {
    const chain = this.chain;
    const plume = this.plume;

    // Plume immersion — point-in-cone test against the exhaust cone.
    if (plume && plume.mode === 'cone' && plume.heatRate && this.rocket.engineOn) {
      const { nozzle, dir } = this._exhaustGeometry();
      const tanHalf = Math.tan((plume.halfAngleDeg * Math.PI) / 180);
      for (let i = 1; i < chain.points.length; i++) {
        const p = chain.points[i];
        const wx = p.x - nozzle.x;
        const wy = p.y - nozzle.y;
        const s = wx * dir.x + wy * dir.y;          // distance along the cone axis
        if (s <= 0 || s >= plume.length) continue;
        const rx = wx - s * dir.x;
        const ry = wy - s * dir.y;
        const radial = Math.hypot(rx, ry);
        if (radial < 4 + s * tanHalf) {
          // Hotter close to the nozzle.
          p.heat += plume.heatRate * (1 - 0.5 * (s / plume.length)) * dt;
        }
      }
    }

    // Aerodynamic heating — scales with local air density and speed².
    const aeroK = plume?.aeroHeatK;
    if (aeroK && this.atmosphere) {
      const fwd2 = this.forwardAirspeed * this.forwardAirspeed;
      for (let i = 1; i < chain.points.length; i++) {
        const p = chain.points[i];
        const density = this.atmosphere.densityAt({ x: p.x, y: p.y });
        if (density <= 0) continue;
        const v = chain.pointVelocity(i, dt);
        const speed2 = v.x * v.x + v.y * v.y + fwd2;
        p.heat += aeroK * density * speed2 * dt;
      }
    }

    // Burn-through.
    if (!this._chainBurnFired && this.onChainBurn) {
      const { value, index } = chain.maxHeat();
      if (value >= 1) {
        this._chainBurnFired = true;
        chain.sever(index);
        this.onChainBurn({ x: chain.points[index].x, y: chain.points[index].y });
      }
    }
  }

  _step(dt) {
    if (this._crashed) return;

    this._simTime += dt;

    // Scripted controller — mutates rocket (engineOn, angle, etc.) by sim time.
    if (this.controller) {
      this.controller(this.rocket, this._simTime, dt, { planet: this.planet, bounds: this.bounds, chain: this.chain });
    }

    // Auto-reset by sim time (used to loop scenes that don't end in a crash).
    if (this.autoResetAt !== null && !this._autoResetFired && this._simTime >= this.autoResetAt) {
      this._autoResetFired = true;
      this.onAutoReset();
      return;
    }

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

    // Chain: step the pendulum dynamics, then apply heating.
    if (this.chain) {
      this.chain.step(dt, this.rocket, env);
      this._heatChain(dt);
    }

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
