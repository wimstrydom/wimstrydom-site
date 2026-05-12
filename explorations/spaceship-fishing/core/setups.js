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

// ── BIG PLANET ("Adrian") ─────────────────────────────────────────────────────
// Used by the spaceship-fishing essay for the orbital scenes. The planet is
// much larger than the default — it should dominate the panel and make the
// rocket feel tiny by comparison.
const ADRIAN_R       = 200;   // visual planet radius (px)
const ADRIAN_ORBIT_R = 245;   // orbit radius from planet centre (px)
const ADRIAN_CENTER  = ({ width, height }) => ({ x: width / 2, y: height * 0.62 });
const ADRIAN_ORBIT_V = Math.sqrt(SIM_G * ADRIAN_ORBIT_R);    // ≈ 108.5 px/s
const ADRIAN_ORBIT_T = 2 * Math.PI * ADRIAN_ORBIT_R / ADRIAN_ORBIT_V; // ≈ 14.2s

// Small helper: smooth angular interpolation toward a target (rad/s rate).
function rotateToward(rocket, targetAngle, dt, rate = 3) {
  let diff = targetAngle - rocket.angle;
  while (diff >  Math.PI) diff -= 2 * Math.PI;
  while (diff < -Math.PI) diff += 2 * Math.PI;
  rocket.angle += diff * Math.min(dt * rate, 1);
}

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

  // ── SPACESHIP-FISHING ESSAY SCENES ──────────────────────────────────────────
  // Scripted controllers drive each scene below. They mutate the rocket each
  // physics step (engineOn, angle). `trackVelocity: false` lets the controller
  // be the sole authority on rocket orientation.

  // Drifting pulses — rocket starts at left, motionless. After 2s, a single
  // longer pulse pushes it right; then three quick pulses accelerate it until
  // it drifts off-screen. Used to illustrate conservation of momentum.
  'fishing-cruise': {
    environment: 'vacuum',
    planet: null,
    atmosphere: null,
    rocket: {
      position: ({ width, height }) => ({ x: width * 0.15, y: height / 2 }),
      velocity: { x: 0, y: 0 },
      angle: Math.PI / 2,   // facing right
      thrustMagnitude: 180,
      engineOn: false,
      engineDirection: 'rear',
    },
    controls: { showButton: false },
    trackVelocity: false,
    resetWhen: 'offscreen',
    showOrbitPath: false,
    controller: (rocket, t /* , dt, ctx */) => {
      // Hold rocket in place for the first 2s (force-clear any drift).
      if (t < 2) {
        rocket.velocity = { x: 0, y: 0 };
        rocket.engineOn = false;
        return;
      }
      // One longer "first" pulse, then three rapid follow-ups.
      const pulses = [
        [2.00, 2.45],   // long pulse
        [3.10, 3.25],   // rapid 1
        [3.40, 3.55],   // rapid 2
        [3.70, 3.85],   // rapid 3
      ];
      rocket.engineOn = pulses.some(([s, e]) => t >= s && t < e);
    },
  },

  // Flip-and-burn — burn rightward, coast, slowly flip 180°, then burn again
  // to come to rest. Used to show how a ship has to actively decelerate.
  'fishing-flip-burn': {
    environment: 'vacuum',
    planet: null,
    atmosphere: null,
    rocket: {
      position: ({ width, height }) => ({ x: width * 0.18, y: height / 2 }),
      velocity: { x: 0, y: 0 },
      angle: Math.PI / 2,   // facing right
      thrustMagnitude: 110,
      engineOn: false,
      engineDirection: 'rear',
    },
    controls: { showButton: false },
    trackVelocity: false,
    resetWhen: 'never',
    autoResetAt: 9.0,
    showOrbitPath: false,
    controller: (rocket, t, dt) => {
      if (t < 0.6) {
        rocket.engineOn = false;
      } else if (t < 1.6) {
        rocket.engineOn = true;            // accelerate right
      } else if (t < 3.6) {
        rocket.engineOn = false;           // coast
      } else if (t < 5.6) {
        rocket.engineOn = false;           // flip — rotate slowly toward facing-left
        rotateToward(rocket, 3 * Math.PI / 2, dt, 1.4);
      } else if (t < 6.6) {
        rocket.engineOn = true;            // decelerate
      } else {
        rocket.engineOn = false;           // drift to a stop
      }
    },
  },

  // Adrian intro — big planet, labelled, no rocket. Pure title slide.
  'fishing-adrian-intro': {
    environment: 'vacuum',
    planet: {
      position: ADRIAN_CENTER,
      radius: ADRIAN_R,
      g: SIM_G,
    },
    atmosphere: null,
    rocket: {
      position: ({ width }) => ({ x: width / 2, y: -200 }),   // hidden off-screen
      velocity: { x: 0, y: 0 },
      angle: 0,
      thrustMagnitude: 0,
      engineOn: false,
      engineDirection: 'rear',
    },
    controls: { showButton: false },
    trackVelocity: false,
    resetWhen: 'never',
    planetLabel: 'Adrian',
    hideRocket: true,
    showOrbitPath: false,
  },

  // Adrian: arrive, brake, briefly hover, then cut thrust and fall in.
  // Demonstrates that "stopping" near a planet just means falling straight in.
  // Timing assumes the rocket starts ~160 px above the planet surface; gravity
  // and a 110-px/s² brake have to balance out so the rocket comes to rest just
  // above the surface, then falls when the engine cuts.
  'fishing-adrian-crash': {
    environment: 'vacuum',
    planet: {
      position: ADRIAN_CENTER,
      radius: ADRIAN_R,
      g: SIM_G,
    },
    atmosphere: null,
    rocket: {
      position: ({ width }) => ({ x: width / 2, y: 50 }),
      velocity: { x: 0, y: 40 },             // cruising down, gently
      angle: Math.PI,                         // facing down
      thrustMagnitude: 110,
      engineOn: false,
      engineDirection: 'rear',
    },
    controls: { showButton: false },
    trackVelocity: false,
    resetWhen: 'crash',
    crashCallout: 'Bad. Bad. Bad.',
    planetLabel: 'Adrian',
    showOrbitPath: false,
    controller: (rocket, t, dt) => {
      if (t < 0.5) {
        rocket.engineOn = false;             // coast — initial cruise
      } else if (t < 1.0) {
        rocket.engineOn = false;             // flip from facing-down to facing-up (fast)
        rotateToward(rocket, 0, dt, 7);
      } else if (t < 2.6) {
        rocket.thrustMagnitude = 110;        // brake — net upward accel
        rocket.engineOn = true;
      } else if (t < 3.6) {
        rocket.thrustMagnitude = SIM_G;      // hover — cancel gravity exactly
        rocket.engineOn = true;
      } else {
        rocket.engineOn = false;             // cut thrust, fall under gravity
      }
    },
  },

  // Adrian: rocket arrives in a stable circular orbit and stays there.
  // Used as a calm "this is what orbit looks like" scene that loops every
  // two full orbits.
  'fishing-adrian-orbit': {
    environment: 'vacuum',
    planet: {
      position: ADRIAN_CENTER,
      radius: ADRIAN_R,
      g: SIM_G,
    },
    atmosphere: null,
    rocket: {
      // Start at the top of the orbit, moving rightward (tangent).
      position: (dims) => ({
        x: ADRIAN_CENTER(dims).x,
        y: ADRIAN_CENTER(dims).y - ADRIAN_ORBIT_R,
      }),
      velocity: () => ({ x: ADRIAN_ORBIT_V, y: 0 }),
      angle: Math.PI / 2,                    // facing right (along velocity)
      thrustMagnitude: 0,
      engineOn: false,
      engineDirection: 'rear',
    },
    controls: { showButton: false },
    trackVelocity: true,                     // nose follows velocity
    resetWhen: 'never',
    autoResetAt: ADRIAN_ORBIT_T * 2 + 0.5,   // two full orbits, then loop
    planetLabel: 'Adrian',
    showOrbitPath: true,
    orbitRadius: ADRIAN_ORBIT_R,
  },

  // Adrian: stable orbit that runs forever — used to anchor the "problem with
  // orbits" scene before the slowdown / hover demos override the panel.
  'fishing-adrian-stable': {
    environment: 'vacuum',
    planet: {
      position: ADRIAN_CENTER,
      radius: ADRIAN_R,
      g: SIM_G,
    },
    atmosphere: null,
    rocket: {
      position: (dims) => ({
        x: ADRIAN_CENTER(dims).x,
        y: ADRIAN_CENTER(dims).y - ADRIAN_ORBIT_R,
      }),
      velocity: () => ({ x: ADRIAN_ORBIT_V, y: 0 }),
      angle: Math.PI / 2,
      thrustMagnitude: 0,
      engineOn: false,
      engineDirection: 'rear',
    },
    controls: { showButton: false },
    trackVelocity: true,
    resetWhen: 'never',
    planetLabel: 'Adrian',
    showOrbitPath: true,
    orbitRadius: ADRIAN_ORBIT_R,
  },

  // Adrian: starts in stable orbit, then performs a retrograde burn. Bleeds
  // off lateral speed and crashes into the planet — illustrates why you can't
  // just "slow down" near a planet.
  'fishing-adrian-slowdown': {
    environment: 'vacuum',
    planet: {
      position: ADRIAN_CENTER,
      radius: ADRIAN_R,
      g: SIM_G,
    },
    atmosphere: null,
    rocket: {
      position: (dims) => ({
        x: ADRIAN_CENTER(dims).x,
        y: ADRIAN_CENTER(dims).y - ADRIAN_ORBIT_R,
      }),
      velocity: () => ({ x: ADRIAN_ORBIT_V, y: 0 }),
      angle: Math.PI / 2,
      thrustMagnitude: 90,
      engineOn: false,
      engineDirection: 'rear',
    },
    controls: { showButton: false },
    trackVelocity: false,                    // controller handles all rotation
    resetWhen: 'crash',
    crashCallout: 'Bad. Bad. Bad.',
    planetLabel: 'Adrian',
    showOrbitPath: false,
    controller: (rocket, t, dt) => {
      const v = rocket.velocity;
      const speed = Math.hypot(v.x, v.y);

      if (t < 3) {
        // Orbit — nose follows velocity (prograde).
        if (speed > 1) rotateToward(rocket, Math.atan2(v.x, -v.y), dt, 6);
        rocket.engineOn = false;
      } else if (t < 4.5) {
        // Slowly flip to face retrograde (opposite velocity).
        if (speed > 1) rotateToward(rocket, Math.atan2(-v.x, v.y), dt, 1.6);
        rocket.engineOn = false;
      } else if (t < 6.5) {
        // Continue tracking retrograde and burn.
        if (speed > 1) rotateToward(rocket, Math.atan2(-v.x, v.y), dt, 6);
        rocket.engineOn = true;
      } else {
        // Coast — gravity does the rest.
        rocket.engineOn = false;
      }
    },
  },

  // Adrian: from orbit, rotate to point engine straight at the planet and
  // hover-thrust. Tangential momentum keeps it drifting sideways — that's
  // the helicopter-hover scenario.
  'fishing-adrian-hover': {
    environment: 'vacuum',
    planet: {
      position: ADRIAN_CENTER,
      radius: ADRIAN_R,
      g: SIM_G,
    },
    atmosphere: null,
    rocket: {
      position: (dims) => ({
        x: ADRIAN_CENTER(dims).x,
        y: ADRIAN_CENTER(dims).y - ADRIAN_ORBIT_R,
      }),
      velocity: () => ({ x: ADRIAN_ORBIT_V, y: 0 }),
      angle: Math.PI / 2,
      thrustMagnitude: SIM_G,                // exactly cancels gravity when aimed radially
      engineOn: false,
      engineDirection: 'rear',
    },
    controls: { showButton: false },
    trackVelocity: false,
    resetWhen: 'crash',
    autoResetAt: 14,
    crashCallout: null,
    planetLabel: 'Adrian',
    showOrbitPath: false,
    controller: (rocket, t, dt, ctx) => {
      const v = rocket.velocity;
      const speed = Math.hypot(v.x, v.y);

      if (t < 2) {
        // Orbit prograde.
        if (speed > 1) rotateToward(rocket, Math.atan2(v.x, -v.y), dt, 6);
        rocket.engineOn = false;
        return;
      }

      // Target: nose points directly away from the planet centre (exhaust
      // therefore points at the planet, thrust pushes the rocket outward).
      const planet = ctx.planet;
      const dx = rocket.position.x - planet.position.x;
      const dy = rocket.position.y - planet.position.y;
      const targetAngle = Math.atan2(dx, -dy);

      if (t < 3.5) {
        rotateToward(rocket, targetAngle, dt, 2.4);
        rocket.engineOn = false;
      } else {
        rocket.angle = targetAngle;          // hold radial attitude
        rocket.engineOn = true;
      }
    },
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
