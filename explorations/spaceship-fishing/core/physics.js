import { vec2 } from './vec2.js';

// Semi-implicit Euler integrator.
// Energy-conserving enough for short viewing windows (~30s orbits).
// If orbit drift becomes visually apparent, swap integrate() to velocity Verlet.

// Accumulate an array of force vectors into a net acceleration given mass.
export function netAcceleration(forces, mass) {
  let fx = 0, fy = 0;
  for (const f of forces) { fx += f.x; fy += f.y; }
  return { x: fx / mass, y: fy / mass };
}

// Semi-implicit Euler step.
// 1. Update velocity using acceleration at start of step.
// 2. Update position using the NEW velocity (this is what makes it semi-implicit).
export function integrate(position, velocity, acceleration, dt) {
  const newVelocity = vec2.add(velocity, vec2.scale(acceleration, dt));
  const newPosition = vec2.add(position, vec2.scale(newVelocity, dt));
  return { position: newPosition, velocity: newVelocity };
}
