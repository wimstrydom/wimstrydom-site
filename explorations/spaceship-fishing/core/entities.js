import { vec2 } from './vec2.js';

// ── PLANET ────────────────────────────────────────────────────────────────────

export class Planet {
  constructor({ position, radius, g }) {
    this.position = position;   // { x, y } in sim pixels
    this.radius   = radius;     // px
    this.g        = g;          // constant gravity magnitude, px/s²
  }

  // Returns gravitational acceleration vector at a given point.
  // Constant magnitude g toward planet centre — simple and orbit-friendly.
  gravityAt(point) {
    const delta = vec2.sub(this.position, point);
    if (vec2.magnitudeSq(delta) < 1) return vec2.zero();
    return vec2.scale(vec2.normalize(delta), this.g);
  }

  // Orbital speed for a circular orbit at radius r: v = sqrt(g * r)
  orbitalSpeed(r) { return Math.sqrt(this.g * r); }

  // True if point is inside (or on the surface of) the planet.
  contains(point) {
    return vec2.distanceSq(point, this.position) <= this.radius * this.radius;
  }
}

// ── ATMOSPHERE ────────────────────────────────────────────────────────────────

export class Atmosphere {
  // mode: 'field'  — uniform drag throughout the sim bounds (no planet required)
  //       'shell'  — drag starts at planet surface and falls off with altitude,
  //                  reaching zero at planet.radius + thickness. Adjusting thickness
  //                  only moves the outer edge; the inner edge is always at the surface.
  constructor({ mode, dragCoefficient, planet = null, thickness = 0 }) {
    this.mode            = mode;
    this.dragCoefficient = dragCoefficient; // k in F = -k * v
    this.planet          = planet;          // required for shell mode
    this.thickness       = thickness;       // shell thickness in px (shell mode only)
  }

  // Returns drag force vector for a given position and velocity.
  dragAt(position, velocity) {
    let k = this.dragCoefficient;

    if (this.mode === 'shell' && this.planet) {
      const dist  = vec2.distance(position, this.planet.position);
      const inner = this.planet.radius;     // atmosphere starts at surface
      const outer = inner + this.thickness; // outer edge set by thickness slider
      // t = 1 at surface, 0 at outer edge — matches visual gradient
      const t = 1 - Math.max(0, Math.min(1, (dist - inner) / (outer - inner)));
      k = this.dragCoefficient * t;
    }

    return vec2.scale(velocity, -k);
  }
}

// ── ROCKET ────────────────────────────────────────────────────────────────────

export class Rocket {
  constructor({
    position,
    velocity      = vec2.zero(),
    angle         = 0,           // radians. 0 = pointing up (-y in SVG coords)
    mass          = 1,
    thrustMagnitude = 300,
    engineOn      = false,
    engineDirection = 'rear',    // 'rear' = thrust in facing direction, or a { x, y } unit vector
  }) {
    this.position        = vec2.clone(position);
    this.velocity        = vec2.clone(velocity);
    this.angle           = angle;
    this.mass            = mass;
    this.thrustMagnitude = thrustMagnitude;
    this.engineOn        = engineOn;
    this.engineDirection = engineDirection;
  }

  // Unit vector in the direction the rocket is facing (its "forward" / nose direction).
  // angle 0 = facing up (-y). Positive angle = clockwise rotation in SVG coords.
  facingVector() {
    return { x: Math.sin(this.angle), y: -Math.cos(this.angle) };
  }

  thrustForce() {
    if (!this.engineOn) return vec2.zero();
    const dir = this.engineDirection === 'rear'
      ? this.facingVector()
      : vec2.normalize(this.engineDirection);
    return vec2.scale(dir, this.thrustMagnitude);
  }

  // Aggregate all forces from the environment: gravity + drag + thrust.
  applyForces(env) {
    const forces = [];
    for (const planet of (env.planets || [])) {
      forces.push(planet.gravityAt(this.position));
    }
    if (env.atmosphere) {
      forces.push(env.atmosphere.dragAt(this.position, this.velocity));
    }
    forces.push(this.thrustForce());
    return forces;
  }
}
