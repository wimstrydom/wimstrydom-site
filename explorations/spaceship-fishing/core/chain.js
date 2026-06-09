import { vec2 } from './vec2.js';

// ── CHAIN ─────────────────────────────────────────────────────────────────────
// A dangling chain (sampler line + collector) simulated with position-based
// dynamics: Verlet integration plus iterated distance constraints. This is far
// more stable at FIXED_DT = 1/240 than spring forces, and the pendulum
// behaviour (the chain settling along apparent gravity = anti-thrust) emerges
// naturally from the physics — nothing is scripted.
//
// The chain is passive: it does not pull back on the rocket. The Hail Mary
// outmasses the chain by orders of magnitude, so this is physically honest
// enough for the essay's purposes.
//
// Heat is tracked per point (0 → 1). Two sources feed it (see loop.js):
// exhaust-plume immersion and aerodynamic heating. The chain itself only
// stores and cools the values.

const CONSTRAINT_ITERATIONS = 6;

export class Chain {
  constructor({
    links          = 14,            // number of segments
    linkLength     = 7,             // px per segment
    anchorOffset   = { x: -12, y: 26 },  // attachment point in rocket-local coords
    damping        = 0.4,           // velocity damping per second (air-free)
    dragScale      = 1,             // multiplier on atmospheric drag for links
    collectorDragScale = 3,         // the collector is blunt — extra drag at the tip
    coolRate       = 0.15,          // heat lost per second
  }) {
    this.links          = links;
    this.linkLength     = linkLength;
    this.anchorOffset   = anchorOffset;
    this.damping        = damping;
    this.dragScale      = dragScale;
    this.collectorDragScale = collectorDragScale;
    this.coolRate       = coolRate;

    this.points    = [];     // [{ x, y, px, py, heat }] — head (index 0) is pinned
    this.severedAt = null;   // joint index where the chain burned through (null = intact)
  }

  // World-space anchor point for a given rocket pose.
  anchorWorld(rocket) {
    const c = Math.cos(rocket.angle);
    const s = Math.sin(rocket.angle);
    const o = this.anchorOffset;
    return {
      x: rocket.position.x + o.x * c - o.y * s,
      y: rocket.position.y + o.x * s + o.y * c,
    };
  }

  // Lay the chain out in a straight line from the anchor along `dir` (unit
  // vector). Called at build/reset time.
  layout(rocket, dir = { x: 0, y: 1 }) {
    const a = this.anchorWorld(rocket);
    this.points = [];
    this.severedAt = null;
    for (let i = 0; i <= this.links; i++) {
      const x = a.x + dir.x * this.linkLength * i;
      const y = a.y + dir.y * this.linkLength * i;
      this.points.push({ x, y, px: x, py: y, heat: 0 });
    }
  }

  // Sever the chain at joint `i` — everything below falls free.
  sever(i) {
    if (this.severedAt === null) this.severedAt = Math.max(1, i);
  }

  get collector() { return this.points[this.points.length - 1]; }

  // One physics sub-step. `env` = { planets, atmosphere }, same shape the
  // rocket uses, so gravity and drag are exactly the forces the ship feels.
  step(dt, rocket, env) {
    if (!this.points.length) return;
    const anchor = this.anchorWorld(rocket);
    const dampFactor = Math.max(0, 1 - this.damping * dt);

    // Verlet integration for every point except the pinned head.
    for (let i = 1; i < this.points.length; i++) {
      const p = this.points[i];

      // Accumulate acceleration: gravity + atmospheric drag.
      let ax = 0, ay = 0;
      for (const planet of (env.planets || [])) {
        const g = planet.gravityAt({ x: p.x, y: p.y });
        ax += g.x; ay += g.y;
      }
      if (env.atmosphere) {
        const vx = (p.x - p.px) / dt;
        const vy = (p.y - p.py) / dt;
        const scale = (i === this.points.length - 1)
          ? this.collectorDragScale
          : this.dragScale;
        const d = env.atmosphere.dragAt({ x: p.x, y: p.y }, { x: vx, y: vy });
        ax += d.x * scale; ay += d.y * scale;
      }

      const nx = p.x + (p.x - p.px) * dampFactor + ax * dt * dt;
      const ny = p.y + (p.y - p.py) * dampFactor + ay * dt * dt;
      p.px = p.x; p.py = p.y;
      p.x = nx;  p.y = ny;

      // Cooling.
      p.heat = Math.max(0, p.heat - this.coolRate * dt);
    }

    // Constraint projection: pin head to anchor, then enforce link lengths.
    // A severed joint is skipped — the lower part falls free.
    for (let iter = 0; iter < CONSTRAINT_ITERATIONS; iter++) {
      this.points[0].x = anchor.x;
      this.points[0].y = anchor.y;
      for (let i = 1; i < this.points.length; i++) {
        if (this.severedAt !== null && i === this.severedAt) continue;
        const a = this.points[i - 1];
        const b = this.points[i];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.hypot(dx, dy) || 1e-6;
        const diff = (dist - this.linkLength) / dist;
        // Head is pinned: joint 1 moves only the lower point. Other joints
        // split the correction evenly.
        if (i === 1) {
          b.x -= dx * diff;
          b.y -= dy * diff;
        } else {
          a.x += dx * diff * 0.5;
          a.y += dy * diff * 0.5;
          b.x -= dx * diff * 0.5;
          b.y -= dy * diff * 0.5;
        }
      }
    }
  }

  // Velocity of a point (px/s) from its Verlet state.
  pointVelocity(i, dt) {
    const p = this.points[i];
    return { x: (p.x - p.px) / dt, y: (p.y - p.py) / dt };
  }

  maxHeat() {
    let max = 0, idx = 0;
    for (let i = 1; i < this.points.length; i++) {
      if (this.points[i].heat > max) { max = this.points[i].heat; idx = i; }
    }
    return { value: max, index: idx };
  }
}
