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
// Exponential approach — eases in but never quite reaches the target. Good for
// "track this moving thing" cases (e.g. velocity-tracking).
function rotateToward(rocket, targetAngle, dt, rate = 3) {
  let diff = targetAngle - rocket.angle;
  while (diff >  Math.PI) diff -= 2 * Math.PI;
  while (diff < -Math.PI) diff += 2 * Math.PI;
  rocket.angle += diff * Math.min(dt * rate, 1);
}

// Linear angular interpolation: rotates the rocket from `fromAngle` to
// `toAngle` over `duration` seconds, reaching `toAngle` exactly when
// `phaseTime` >= duration. Use this for scripted flips where the angle
// must land precisely (180° flip-and-burn etc).
function linearRotate(rocket, fromAngle, toAngle, phaseTime, duration) {
  let diff = toAngle - fromAngle;
  while (diff >  Math.PI) diff -= 2 * Math.PI;
  while (diff < -Math.PI) diff += 2 * Math.PI;
  const t = Math.max(0, Math.min(1, phaseTime / duration));
  rocket.angle = fromAngle + diff * t;
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
        rocket.engineOn = false;
        // Linear flip — guaranteed to land exactly on facing-left after 2s.
        linearRotate(rocket, Math.PI / 2, -Math.PI / 2, t - 3.6, 2.0);
      } else if (t < 6.6) {
        rocket.angle = -Math.PI / 2;       // hold facing-left
        rocket.engineOn = true;            // decelerate
      } else {
        rocket.angle = -Math.PI / 2;
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
        rocket.engineOn = false;
        // Linear flip from facing-down (π) to facing-up (0) over 0.5s.
        linearRotate(rocket, Math.PI, 0, t - 0.5, 0.5);
      } else if (t < 2.6) {
        rocket.angle = 0;                    // hold facing-up
        rocket.thrustMagnitude = 110;        // brake — net upward accel
        rocket.engineOn = true;
      } else if (t < 3.6) {
        rocket.angle = 0;
        rocket.thrustMagnitude = SIM_G;      // hover — cancel gravity exactly
        rocket.engineOn = true;
      } else {
        rocket.angle = 0;
        rocket.engineOn = false;             // cut thrust, fall under gravity
      }
    },
  },

  // Adrian: pure-physics orbital insertion. The rocket spawns at the
  // apoapsis of a bound elliptical trajectory whose periapsis sits exactly
  // at ADRIAN_ORBIT_R. Apoapsis is far enough out that the rocket begins
  // off-screen to the right. Gravity does all the work of bending the path
  // around the planet; the controller never touches velocity directly.
  //
  // When the rocket reaches periapsis (where radial velocity flips from
  // negative to positive — i.e. the moment its motion is purely tangential)
  // the controller fires the textbook circularisation burn:
  //
  //   ΔV = v_circ · t̂ − v_current     where v_circ = √(g · r)
  //
  // The burn is held in feedback until |ΔV| is small. The resulting orbit
  // goes counterclockwise visually (matches the other Adrian scenes).
  //
  // Apoapsis velocity is back-solved from conservation of E and L in a
  // bound orbit so that periapsis lands on ADRIAN_ORBIT_R exactly:
  //   v_apo² = 2·g·r_peri² / (r_apo + r_peri)
  'fishing-adrian-orbit': (() => {
    const R_APO = 600;
    const V_APO = Math.sqrt(
      2 * SIM_G * ADRIAN_ORBIT_R * ADRIAN_ORBIT_R / (R_APO + ADRIAN_ORBIT_R)
    );

    // Orientation timeline (sim seconds). Off-screen spawn at R_APO=600 takes
    // about 2.5–3 s to drift into the panel, so the flip is timed to start
    // after the rocket has clearly appeared.
    const FLIP_HOLD_T = 3.0;                   // hold nose-up while appearing
    const FLIP_END_T  = 5.0;                   // 2-second gentle flip

    // Controller state, persisted across the IIFE closure. Reset whenever
    // sim time goes backward (which is what resetSimTime() does on loop).
    let burnPhase = 'approach';   // 'approach' | 'burn' | 'orbit'
    let prevVr    = null;
    let prevT     = -1;

    return {
      environment: 'vacuum',
      planet: {
        position: ADRIAN_CENTER,
        radius: ADRIAN_R,
        g: SIM_G,
      },
      atmosphere: null,
      rocket: {
        // Spawn at apoapsis = 3 o'clock (right of planet, off-screen on
        // typical viewports), velocity tangent counterclockwise = straight up.
        position: (dims) => ({
          x: ADRIAN_CENTER(dims).x + R_APO,
          y: ADRIAN_CENTER(dims).y,
        }),
        velocity: () => ({ x: 0, y: -V_APO }),
        angle: 0,                              // nose up, aligned with velocity
        thrustMagnitude: 110,
        engineOn: false,
        engineDirection: 'rear',
      },
      controls: { showButton: false },
      trackVelocity: false,                    // controller manages rotation
      resetWhen: 'never',
      autoResetAt: 32,                         // approach + flip + burn + ~1 orbit
      planetLabel: 'Adrian',
      showOrbitPath: true,
      orbitRadius: ADRIAN_ORBIT_R,
      controller: (rocket, t, dt, ctx) => {
        // Reset closure state when sim time loops back to ~0.
        if (t < prevT) {
          burnPhase = 'approach';
          prevVr    = null;
        }
        prevT = t;

        const planet = ctx.planet;
        const dx = rocket.position.x - planet.position.x;
        const dy = rocket.position.y - planet.position.y;
        const dist = Math.hypot(dx, dy) || 1;

        const v = rocket.velocity;
        const speed = Math.hypot(v.x, v.y);

        // Radial velocity: outward positive, inward negative.
        const vr = (v.x * dx + v.y * dy) / dist;

        // Counterclockwise (visual) tangent unit vector at this point.
        const tx =  dy / dist;
        const ty = -dx / dist;

        // ΔV to circularise at the current radius.
        const vCirc = Math.sqrt(SIM_G * dist);
        const dvx = tx * vCirc - v.x;
        const dvy = ty * vCirc - v.y;
        const dv  = Math.hypot(dvx, dvy);

        if (burnPhase === 'approach') {
          rocket.engineOn = false;

          // Orientation timeline:
          //   t < FLIP_HOLD_T : hold nose-up (prograde at spawn) while the
          //                     rocket is still drifting onto the panel.
          //   FLIP_HOLD_T..FLIP_END_T : gentle 180° flip, clockwise through
          //                     the right side (tail swings forward).
          //   t ≥ FLIP_END_T  : track anti-prograde — engine stays pointed
          //                     in the direction of motion, "ass-first".
          if (t < FLIP_HOLD_T) {
            rocket.angle = 0;
          } else if (t < FLIP_END_T) {
            linearRotate(rocket, 0, Math.PI, t - FLIP_HOLD_T, FLIP_END_T - FLIP_HOLD_T);
          } else if (speed > 5) {
            rotateToward(rocket, Math.atan2(-v.x, v.y), dt, 4);
          }

          // Periapsis: radial velocity crosses from approach (vr < 0) to
          // recede (vr ≥ 0). At that instant velocity is purely tangent —
          // the textbook moment for a circularising burn. The dist guard
          // prevents a spurious trigger from numerical noise right at
          // apoapsis where vr starts at 0.
          if (prevVr !== null && prevVr < 0 && vr >= 0 && dist < R_APO * 0.95) {
            burnPhase = 'burn';
          }
          prevVr = vr;
          return;
        }

        if (burnPhase === 'burn') {
          if (dv > 4) {
            // Snap to ΔV direction. Because the rocket is already anti-
            // prograde and ΔV ≈ anti-tangent at periapsis, this is only a
            // few-degree correction, not a 180° flip.
            rocket.angle = Math.atan2(dvx, -dvy);
            rocket.engineOn = true;
            return;
          }
          burnPhase = 'orbit';
        }

        // Orbit phase — engine cold, keep the ass-first orientation.
        rocket.engineOn = false;
        if (speed > 5) rotateToward(rocket, Math.atan2(-v.x, v.y), dt, 4);
      },
    };
  })(),

  // Adrian: stable orbit that runs forever. Goes counterclockwise visually
  // (matches the orbit-insertion scene) — at the top of the orbit the rocket
  // is moving leftward.
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
      velocity: () => ({ x: -ADRIAN_ORBIT_V, y: 0 }),
      angle: -Math.PI / 2,                     // facing left (along velocity)
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
      velocity: () => ({ x: -ADRIAN_ORBIT_V, y: 0 }),
      angle: Math.PI / 2,                    // anti-prograde (right) — rear toward leftward motion
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
    // The rocket orbits "engines-first": its nose is locked anti-prograde
    // (180° from velocity), so the rear engine — and the rendered exhaust
    // glow — both point in the direction of motion. When the engine fires,
    // thrust is applied retrograde and the visual matches the physics.
    //
    // The burn is brief: ~50% of orbital velocity bled off, not all of it.
    controller: (rocket, t, dt, ctx) => {
      const v = rocket.velocity;
      const speed = Math.hypot(v.x, v.y);

      // Anti-prograde nose: rear (and exhaust) point in the direction of motion.
      if (speed > 1) rocket.angle = Math.atan2(-v.x, v.y);

      // Brief orbit, then a short braking burn, then coast.
      // thrust = 90 px/s², duration 0.6s → ΔV ≈ 54 ≈ 50% of ADRIAN_ORBIT_V.
      if (t < 2) {
        rocket.engineOn = false;
      } else if (t < 2.6) {
        rocket.engineOn = true;
      } else {
        rocket.engineOn = false;
      }
    },
  },

  // Adrian: helicopter-hover scenario. Rocket holds altitude with a radially
  // outward thrust *less than gravity* — the difference (g - T) provides the
  // centripetal force needed for slow lateral motion.
  //
  //   For stable circular motion at radius r:  v_lateral = sqrt(r * (g - T))
  //
  // We pick a deliberately slow lateral speed (~22 px/s, ≈20% of orbital)
  // and back-solve thrust so the altitude stays constant.
  'fishing-adrian-hover': (() => {
    const HOVER_V = 22;                                                    // px/s lateral
    const HOVER_T = SIM_G - (HOVER_V * HOVER_V) / ADRIAN_ORBIT_R;          // calc'd thrust
    return {
      environment: 'vacuum',
      planet: {
        position: ADRIAN_CENTER,
        radius: ADRIAN_R,
        g: SIM_G,
      },
      atmosphere: null,
      rocket: {
        // Start at the top of the orbit altitude, moving slowly leftward
        // (matches the orbit-insertion scene's counterclockwise direction).
        position: (dims) => ({
          x: ADRIAN_CENTER(dims).x,
          y: ADRIAN_CENTER(dims).y - ADRIAN_ORBIT_R,
        }),
        velocity: () => ({ x: -HOVER_V, y: 0 }),
        angle: 0,                            // nose points up — radially out at top of orbit
        thrustMagnitude: HOVER_T,            // back-solved to balance the slow centripetal need
        engineOn: true,
        engineDirection: 'rear',
      },
      controls: { showButton: false },
      trackVelocity: false,
      resetWhen: 'crash',
      autoResetAt: 14,
      crashCallout: null,
      planetLabel: 'Adrian',
      showOrbitPath: false,
      // Lock the nose to "radially outward from Adrian" every step. This keeps
      // the engine pointed straight at the planet so thrust is always purely
      // outward, regardless of how far the rocket has drifted around.
      controller: (rocket, t, dt, ctx) => {
        const planet = ctx.planet;
        const dx = rocket.position.x - planet.position.x;
        const dy = rocket.position.y - planet.position.y;
        rocket.angle = Math.atan2(dx, -dy);
        rocket.engineOn = true;
      },
    };
  })(),

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
