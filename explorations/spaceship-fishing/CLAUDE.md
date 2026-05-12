# Spaceship Fishing — explorations/spaceship-fishing

A modular 2D orbital physics simulation rendered in SVG. Used in the Explorations essay
"How to go fishing with a spaceship" (`index.html`) as a series of embedded, mostly
scripted demonstrations, and in a companion interactive sandbox (`sandbox.html`) for
tuning the "Hail Mary" setup. Forked from `explorations/space-sim` — that directory will
be removed once this essay is finalised.

## File structure

```
core/
  vec2.js         — pure 2D vector helpers (immutable {x,y} objects)
  physics.js      — semi-implicit Euler integrator + net-acceleration helper
  entities.js     — Rocket, Planet, Atmosphere classes
  setups.js       — named simulation configurations (plain objects, no classes)
render/
  rocket-icon.js  — SVG <image> wrapper for the spacecraft PNG; exports ENGINE_EXHAUST_Y
  svg-renderer.js — SvgRenderer: owns the <svg> element and drives the scene each frame
index.js          — mount() public API; wires entities → renderer → SimLoop
loop.js           — SimLoop: fixed-timestep physics accumulator + render dispatch
index.html        — essay page; scroll-driven setup switcher
sandbox.html      — interactive "Hail Mary" tuning sandbox
hail-mary-spacecraft-small.png  — 640×427 RGBA PNG; engines on left, nose on right
```

## Physics

### Gravity model — constant magnitude, not inverse-square

`Planet.gravityAt(point)` returns a vector of constant magnitude `g` directed toward the
planet centre, regardless of distance. This was chosen deliberately:

- Orbital speed formula simplifies to `v = sqrt(g × r)` (no GM, no mass).
- Hover balance is trivial: `thrustMagnitude = g` exactly cancels gravity.
- Orbital period is predictable; the stable orbit at `r = 175px` with `SIM_G = 48` gives
  `v ≈ 91.6 px/s` and `T ≈ 12 s`.
- The `hover` setup uses `thrustMagnitude = SIM_G` (exactly `g`) to demonstrate this directly.

**Do not switch to inverse-square (`GM/r²`)**. The earlier code attempted that and produced
subtle double-division bugs (dividing by mass inside `netAcceleration` when gravity was already
an acceleration) that were hard to catch.

### Integrator — semi-implicit Euler

`physics.js` uses velocity-first Euler: new velocity is computed from the current forces first,
then position is stepped using the *new* velocity. This dissipates less energy than forward
Euler, keeping orbits stable for hundreds of seconds without drift.

### Fixed-timestep accumulator

`SimLoop` accumulates real `dt` and drains it in `FIXED_DT = 1/240 s` sub-steps. This
decouples render rate from physics, prevents spiral-of-death on tab resume (capped at
`MAX_DT = 0.1 s`), and keeps orbit numerics deterministic.

## Rendering

### SVG world group

All scene geometry lives inside `<g class="sim-world">` (`_worldGroup`). Camera transforms
(`setWorldTransform`) are applied to this group, so HTML overlays (buttons, status badges)
that sit outside the `<svg>` are unaffected.

### Design token mirrors (`TOKEN` in svg-renderer.js)

SVG/JS cannot read CSS custom properties. The `TOKEN` object mirrors the relevant tokens from
`/style.css` as hardcoded strings. If the palette changes in `style.css`, update `TOKEN` here.

Current entries: `bg`, `planetBase`, `inkDim`, `inkFaint`, `gold`, `goldDim`, `blue`, `blueTint`.

`planetBase: '#1a1610'` is not a site-wide token — it is a local dark warm tone for the planet
body fill, derived to complement `gold`.

### Planet rendering

Three layers in Z-order:
1. **Base circle** — solid `planetBase` fill; ensures no gaps.
2. **Gradient circle** — `url(#planet-grad)` radial gradient; gold highlight at 38%/35% offset
   creates a subtle 3-D sheen. Stroke is `goldDim`.
3. **Tick ring** — 24 static radial lines from the edge (`r`) inward to `r × 0.95`, spaced
   every 15°. Stroke `goldDim`. These are reference marks; they do **not** animate.

### Atmosphere gradient (shell mode)

The atmosphere circle has radius `planetR + thickness`. The gradient must show a hard edge
exactly at the planet surface with the haze fading outward. Dynamic stop offsets are computed:

```js
sf = planetR / (planetR + thickness)   // fraction where surface sits within total radius
```

Two stops placed at `sf − 0.001` (opacity 0) and `sf` (opacity 0.22) create the hard edge.
The haze then decays at `sf + 35 %` and `sf + 70 %` of the atmosphere band, reaching 0 at the
outer edge.

Adjusting the thickness slider only moves the outer edge; the inner edge is always the surface.

### Rocket icon

`hail-mary-spacecraft-small.png` (640×427): engines on the left, nose on the right. The image
is displayed at 68×45 px with `transform="rotate(-90)"` inside the SVG `<g>`, so the nose
points up (−y direction) when `rocket.angle = 0`. The engine bay is then at the bottom.

`ENGINE_EXHAUST_Y = W / 2 = 34` is the Y offset of the exhaust point in local rocket space
(bottom edge after rotation). The glow ellipse is centred at `(0, ENGINE_EXHAUST_Y + 10)`.

`rocket.angle = 0` → pointing up (nose in −y). Positive angle = clockwise rotation in SVG
coordinates. The `facingVector()` method is `{ x: sin(angle), y: −cos(angle) }`.

## Simulation setups (`core/setups.js`)

Each setup is a plain config object. `mount()` in `index.js` resolves function values against
`{ width, height }` at runtime, so positions can be viewport-relative.

### Legacy / generic setups

| Setup | Key behaviour |
|---|---|
| `static-vacuum` | Rocket at centre; engine off; hold button to fire |
| `static-atmosphere` | Same but with field-mode drag |
| `orbit` | Stable circular orbit; `trackVelocity: true` so nose faces forward |
| `decaying-orbit` | Orbit slightly inside atmosphere shell; drag spirals it in over ~3 loops |
| `falling` | Falls under gravity; `thrustMagnitude: 55` slightly exceeds `g=48` |
| `hover` | `thrustMagnitude: SIM_G` exactly; integration drift causes very slow drift |
| `hail-mary-hover` | Near-horizontal orbit with atmosphere; tuned in sandbox |

### Fishing essay setups (`fishing-*`)

These setups drive the spaceship-fishing essay. Most are scripted via a `controller`
function (see below) and run on a loop using `autoResetAt`.

| Setup | Key behaviour |
|---|---|
| `fishing-cruise` | Vacuum, no planet. Rocket starts left, motionless. After 2s, one longer pulse and three rapid pulses send it off-screen. Loops via `resetWhen: 'offscreen'`. |
| `fishing-flip-burn` | Vacuum, no planet. Accelerates right, coasts, slowly rotates 180°, decelerates to a stop. `autoResetAt: 9.0`. |
| `fishing-adrian-intro` | Big planet labelled "Adrian"; rocket hidden. Static title slide. |
| `fishing-adrian-crash` | Big planet. Rocket arrives cruising down, flips, brakes to a stop, then falls under gravity and crashes. `crashCallout: 'Bad. Bad. Bad.'` |
| `fishing-adrian-orbit` | Big planet. Rocket placed in a stable circular orbit. Auto-resets after two full periods. |
| `fishing-adrian-stable` | Big planet. Same orbit, never auto-resets — used for the "problem with orbits" scene. |
| `fishing-adrian-slowdown` | Big planet. Starts in orbit, controller flips to retrograde and burns; ship crashes. `crashCallout: 'Bad. Bad. Bad.'` |
| `fishing-adrian-hover` | Big planet. Starts in orbit, controller rotates to point engine radially inward and fires at `SIM_G` — hovers while drifting tangentially. `autoResetAt: 14`. |

Adrian-scene geometry constants live at the top of `setups.js`: `ADRIAN_R = 200`,
`ADRIAN_ORBIT_R = 245`, `ADRIAN_CENTER = ({ width, height }) => ({ x: width/2, y: height*0.62 })`,
`ADRIAN_ORBIT_V = sqrt(SIM_G * ADRIAN_ORBIT_R) ≈ 108.5 px/s`,
`ADRIAN_ORBIT_T ≈ 14.2 s`.

`trackVelocity: true` smoothly rotates the rocket to face the velocity vector at speeds above
8 px/s. Use `false` for setups whose controller manages rotation directly (every scripted
`fishing-*` setup except `fishing-adrian-orbit` / `fishing-adrian-stable`).

## Scripted controllers

A setup can include a `controller(rocket, simTime, dt, ctx)` function. The simulation loop
calls it on every physics sub-step (`FIXED_DT = 1/240 s`). The controller is the sole source
of authority for engine state and (when `trackVelocity: false`) rocket angle during scripted
scenes. `ctx` is `{ planet, bounds }` so controllers can compute radial directions etc.

Companion fields:

- **`autoResetAt`** *(seconds)* — when sim time crosses this, `onAutoReset` fires (which is
  wired to the same `reset()` that crashes use). Set this for scenes that loop without ever
  crashing.
- **`crashCallout`** *(string | null)* — if set, on crash an HTML overlay with this text is
  inserted at the rocket's screen position, held for `crashHoldMs` (default 1.4 s for
  callouts, 0 otherwise) before the fade-out begins. Styled via `.sim-crash-callout` in the
  essay page CSS.
- **`planetLabel`** *(string | null)* — large italic text rendered inside the planet via SVG
  `<text>`. Used for the "Adrian" title.
- **`hideRocket`** *(bool)* — hides the rocket group entirely. Used by the title scene
  where only the labelled planet is visible.

Sim time resets to zero on every reset (`SimLoop.resetSimTime()`), so the controller's
timeline runs from scratch on each loop iteration.

A small helper, `rotateToward(rocket, targetAngle, dt, rate)`, lives at the top of `setups.js`
and is used by every scripted controller that needs smooth rotation. It does proper
wrap-around handling so a flip never takes the long way round.

## Crash detection (`loop.js`)

`_step()` checks `planet.contains(position)` after every physics sub-step. On first contact:

1. Rocket is clamped to the planet surface (normalise rocket−planet vector, scale to radius).
2. Velocity is zeroed.
3. `_crashed = true` is set, blocking all further sub-steps.
4. `onCrash()` callback fires.

`_crashed` is cleared in `start()` and `resume()`, so a reset (fade → rebuild → resume) or
restart clears the flag automatically.

## Camera lock (`sandbox.html`)

Camera lock is controlled by `computeWorldTransform()`. When enabled:

```
translate(cx, cy + d0·zoom) scale(zoom) rotate(deg) translate(−px, −py)
```

- `(px, py)` — planet world position (canvas centre in the sandbox).
- `deg` — angle to rotate so the planet−rocket direction points in +y (planet below rocket).
- `d0 = rocketStartDist` — rocket−planet distance at launch; stored once and never updated.
- `zoom` — current zoom slider value.

**What this achieves:**
- At launch: rocket at `(cx, cy)` — screen centre.
- In circular orbit (constant distance): rocket stays at `(cx, cy)`.
- Altitude changes: rocket drifts to `(cx, cy + (d0 − dist) × zoom)` — camera does not follow.
- Zoom: scales around the launch world position `(cx, cy − d0)`, so changing zoom does not jump
  the view (the screen centre always maps to the same initial world point).

The rotation pivots around the planet (canvas centre), not the rocket. This is intentional:
the rocket's horizontal screen position is `cx` only because the planet is always directly
below after rotation.

**Previous incorrect variants (do not restore):**
- `translate(cx, ry0) scale(zoom) rotate(deg) translate(−rx, −ry)` — locks rocket to a fixed
  screen pixel; altitude changes are invisible.
- `translate(cx, ry0) scale(zoom) translate(0, ry−ry0) rotate(deg) translate(−rx, −ry)` —
  altitude drift tracked continuously, causing the view to scroll upward.

## Visibility & lifecycle

- `IntersectionObserver` on the mount element pauses the loop when off-viewport (`rootMargin: 100px`).
- `document.visibilitychange` pauses on hidden tab.
- `mount()` returns `{ pause, resume, reset, destroy }`. The essay page calls `destroy()` when
  switching between sections.
- `reset()` in `index.js`: fade out → mutate entity state in-place (same object refs, so the
  engine button still points to the right rocket) → fade in.

## Sandbox controls (`sandbox.html`)

`bindPair(rangeId, numId)` keeps each slider and its number input in sync bidirectionally.
`val(id)` and `checked(id)` read current control values.

Attitude lock maintains the selected engine angle relative to the planet−rocket axis:

```js
baseAngle = atan2(n.x, −n.y)   // nose pointing directly away from planet
rocketRef.angle = baseAngle + (angleDeg × π / 180)
```

Applied after each physics sub-step via a patched `loop._step`.

`onCrash` in the sandbox calls `currentLoop.pause()` and clears `engineOn` so the simulation
freezes at the crash frame.
