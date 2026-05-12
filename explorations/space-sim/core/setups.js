// Named simulation configurations. Each is a plain config object — no classes.
// All positions are in sim-space pixels relative to the SVG origin (top-left = 0,0).
// The mount() function resolves these against the actual SVG dimensions at runtime.
// Values marked as functions receive { width, height } and return the resolved value.

// Constant gravity magnitude.
// With g=48 and orbit at r=175: v = sqrt(g*r) = sqrt(8400) ≈ 91.6 px/s, T ≈ 12s.
export const SIM_G    = 48;
const PLANET_R  = 65;   // visual planet radius (px) — consistent across all setups
const ORBIT_R   = 175;  // circular orbit radius from planet centre (px)
const HOVER_ALT = 100;  // hover altitude above planet surface (px)

// ── SETUPS ────────────────────────────────────────────────────────────────────

export const SETUPS = {

  // Rocket floating in empty space. Engine off. Hold button to fire.
  'static-vacuum': {
    environment: 'vacuum',
    planet: null,
    atmosphere: null,
    rocket: {
      position: ({ width, height }) => ({ x: width / 2, y: height / 2 }),
      velocity: { x: 0, y: 0 },
      angle: Math.PI / 2,   // pointing right
      thrustMagnitude: 260,
      engineOn: false,
      engineDirection: 'rear',
    },
    controls: { showButton: true },
    trackVelocity: false,
    resetWhen: 'offscreen',
    showOrbitPath: false,
  },

  // Rocket in thick atmosphere. Drag stops it quickly after engine cutoff.
  'static-atmosphere': {
    environment: 'atmosphere',
    planet: null,
    atmosphere: {
      mode: 'field',
      dragCoefficient: 2.2,
    },
    rocket: {
      position: ({ width, height }) => ({ x: width / 2, y: height / 2 }),
      velocity: { x: 0, y: 0 },
      angle: Math.PI / 2,   // pointing right
      thrustMagnitude: 260,
      engineOn: false,
      engineDirection: 'rear',
    },
    controls: { showButton: true },
    trackVelocity: false,
    resetWhen: 'offscreen',
    showOrbitPath: false,
  },

  // Stable circular orbit. No engine. Craft auto-tracks velocity direction.
  'orbit': {
    environment: 'vacuum',
    planet: {
      position: ({ width, height }) => ({ x: width / 2, y: height / 2 }),
      radius: PLANET_R,
      g: SIM_G,
    },
    atmosphere: null,
    rocket: {
      position: ({ width, height }) => ({ x: width / 2, y: height / 2 - ORBIT_R }),
      velocity: () => ({ x: Math.sqrt(SIM_G * ORBIT_R), y: 0 }),  // rightward tangent above planet
      angle: () => Math.PI / 2,
      thrustMagnitude: 260,
      engineOn: false,
      engineDirection: 'rear',
    },
    controls: { showButton: false },
    trackVelocity: true,   // craft faces the direction of travel
    resetWhen: 'never',
    showOrbitPath: true,
    orbitRadius: ORBIT_R,
  },

  // Orbit decaying into a planet atmosphere — 2–4 loops before crash.
  'decaying-orbit': {
    environment: 'atmosphere',
    planet: {
      position: ({ width, height }) => ({ x: width / 2, y: height / 2 }),
      radius: PLANET_R,
      g: SIM_G,
    },
    atmosphere: {
      mode: 'shell',
      dragCoefficient: 0.009,
      thickness: 120,
    },
    rocket: {
      position: ({ width, height }) => ({ x: width / 2, y: height / 2 - ORBIT_R + 10 }),
      velocity: () => ({ x: Math.sqrt(SIM_G * (ORBIT_R - 10)), y: 0 }),
      angle: () => Math.PI / 2,
      thrustMagnitude: 260,
      engineOn: false,
      engineDirection: 'rear',
    },
    controls: { showButton: false },
    trackVelocity: true,
    resetWhen: 'crash',
    showOrbitPath: true,
    orbitRadius: ORBIT_R - 10,
  },

  // Rocket above a planet, v=0. Falls under constant gravity. Button can slow descent.
  'falling': {
    environment: 'vacuum',
    planet: {
      position: ({ width, height }) => ({ x: width / 2, y: height / 2 + 30 }),
      radius: PLANET_R,
      g: SIM_G,
    },
    atmosphere: null,
    rocket: {
      position: ({ width, height }) => ({ x: width / 2, y: height / 2 - 110 }),
      velocity: { x: 0, y: 0 },
      angle: 0,              // pointing up — nose away from planet
      thrustMagnitude: 55,   // slightly above g=48; sufficient to escape if applied early
      engineOn: false,
      engineDirection: 'rear',
    },
    controls: { showButton: true },
    trackVelocity: false,   // maintain upward orientation throughout fall
    resetWhen: 'crash',
    showOrbitPath: false,
  },

  // Engine thrust exactly balances constant gravity — craft hovers in place.
  // Integration error accumulates slowly; expect very gentle drift.
  'hover': {
    environment: 'vacuum',
    planet: {
      position: ({ width, height }) => ({ x: width / 2, y: height / 2 + 30 }),
      radius: PLANET_R,
      g: SIM_G,
    },
    atmosphere: null,
    rocket: {
      position: ({ width, height }) => ({
        x: width / 2,
        y: height / 2 + 30 - PLANET_R - HOVER_ALT,
      }),
      velocity: { x: 0, y: 0 },
      angle: 0,        // pointing up — engine at bottom fires down, thrust goes up
      thrustMagnitude: SIM_G,  // exactly balances gravity (constant model makes this simple)
      engineOn: true,
      engineDirection: 'rear',
    },
    controls: { showButton: false },
    trackVelocity: false,
    resetWhen: 'never',
    showOrbitPath: false,
  },

  // Hail Mary defaults — tune via sandbox.html.
  'hail-mary-hover': {
    environment: 'atmosphere',
    planet: {
      position: ({ width, height }) => ({ x: width / 2, y: height / 2 }),
      radius: PLANET_R,
      g: SIM_G,
    },
    atmosphere: {
      mode: 'shell',
      dragCoefficient: 0.015,
      thickness: 100,
    },
    rocket: {
      position: ({ width, height }) => ({ x: width / 2, y: height / 2 - PLANET_R - 95 }),
      velocity: () => ({ x: Math.sqrt(SIM_G * (PLANET_R + 95)) * 0.45, y: 0 }),
      angle: 0.22,   // ~12° tilt; engine mostly up, slight rightward push
      thrustMagnitude: 72,
      engineOn: true,
      engineDirection: 'rear',
    },
    controls: { showButton: false },
    trackVelocity: false,
    resetWhen: 'crash',
    showOrbitPath: false,
  },
};
