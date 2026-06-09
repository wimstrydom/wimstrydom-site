# Spaceship Fishing — explorations/spaceship-fishing

A modular 2D orbital physics simulation rendered in SVG. Used in the Explorations essay
"How to go fishing with a spaceship" (`index.html`) as a series of embedded, scripted
demonstrations, and by the public companion interactive at
`explorations/fishing-simulator/` (which imports this engine across directories).

## File structure

```
core/
  vec2.js         — pure 2D vector helpers (immutable {x,y} objects)
  physics.js      — semi-implicit Euler integrator + net-acceleration helper
  entities.js     — Rocket, Planet, Atmosphere classes (Atmosphere exposes densityAt())
  chain.js        — Chain: position-based-dynamics chain (Verlet + distance constraints)
  setups.js       — named simulation configurations (plain objects, no classes)
render/
  rocket-icon.js  — SVG <image> wrapper for the spacecraft PNG; exports ENGINE_EXHAUST_Y
  svg-renderer.js — SvgRenderer: owns the <svg> element and drives the scene each frame
index.js          — mount() public API; wires entities → renderer → SimLoop
loop.js           — SimLoop: fixed-timestep physics accumulator + render dispatch
index.html        — essay page; page-turn UI with paired sim switcher (14 pages)
hail-mary-spacecraft-small.png  — 640×427 RGBA PNG; engines on left, nose on right
```

The legacy `explorations/space-sim` fork and the internal `sandbox.html` tuning page
have been deleted; the public interactive lives at `explorations/fishing-simulator/`.

## Physics

### Gravity model — constant magnitude, not inverse-square

`Planet.gravityAt(point)` returns a vector of constant magnitude `g` directed toward the
planet centre, regardless of distance. This was chosen deliberately:

- Orbital speed formula simplifies to `v = sqrt(g × r)` (no GM, no mass).
- Hover balance is trivial: `thrustMagnitude = g` exactly cancels gravity.
- Orbital period is predictable; the stable orbit at `r = 175px` with `SIM_G = 48` gives
  `v ≈ 91.6 px/s` and `T ≈ 12 s`.
- **Flat-world trick:** a huge off-screen planet (`radius = 1e5`, centre far below the
  panel) gives *exactly* uniform downward gravity — used by the front-view zig-zag scene
  and the fishing simulator. No physics changes were needed for flat scenes.

**Do not switch to inverse-square (`GM/r²`)**. The earlier code attempted that and produced
subtle double-division bugs (dividing by mass inside `netAcceleration` when gravity was already
an acceleration) that were hard to catch.

Bound-ellipse helper (used by the insertion and swoop scenes): spawning at apoapsis
`r_apo` with `v_apo = √(2·g·r_peri² / (r_apo + r_peri))` produces a periapsis at exactly
`r_peri` (conservation of E and L under constant-magnitude gravity). Note that constant-g
bound orbits are **not** conic sections — apoapsis and periapsis are generally *not* 180°
apart (the swoop spawned at 6 o'clock reaches periapsis around 3 o'clock).

### Integrator — semi-implicit Euler

`physics.js` uses velocity-first Euler: new velocity is computed from the current forces first,
then position is stepped using the *new* velocity. This dissipates less energy than forward
Euler, keeping orbits stable for hundreds of seconds without drift.

### Fixed-timestep accumulator

`SimLoop` accumulates real `dt` and drains it in `FIXED_DT = 1/240 s` sub-steps. This
decouples render rate from physics, prevents spiral-of-death on tab resume (capped at
`MAX_DT = 0.1 s`), and keeps orbit numerics deterministic.

### Chain (`core/chain.js`)

Position-based dynamics: Verlet integration per point, then `CONSTRAINT_ITERATIONS = 6`
passes of distance-constraint projection with the head pinned to the rocket's anchor.
Much more stable at `FIXED_DT = 1/240` than spring forces. The chain is **passive** — it
never pulls back on the rocket (the ship outmasses it).

- `anchorOffset` is in rocket-local coords (`{x: -14, y: 10}` = port side, mid-hull).
  Anchor placement matters enormously: anchors near the nozzle centreline put the upper
  links permanently inside the plume cone (see "shadow zone" below).
- `layout(rocket, dir)` lays the chain out straight along a unit vector; setups give
  `chain.initAngle` (radians from straight-down) and `index.js` converts.
- Per-point `heat` (0→1) cools at `coolRate` (default 0.15/s). `sever(i)` splits the
  chain at joint `i`; the lower part falls free (constraint at that joint is skipped).
- The collector (last point) gets `collectorDragScale` × atmospheric drag.

### Heat model (in `loop.js`, config via the setup's `plume` object)

Two sources, both applied to chain points each sub-step:

- **Plume immersion** (`plume.mode === 'cone'`, engine on): point-in-cone test against
  the exhaust cone (origin `originY` below rocket centre, half-angle `halfAngleDeg`,
  length `length`, base radius 4px). Heat rate `heatRate`/s, ~50% stronger near the nozzle.
- **Aero heating** (`plume.aeroHeatK` set, atmosphere present):
  `heat += aeroHeatK × density × airspeed² × dt`, where airspeed includes the optional
  `forwardAirspeed` loop config (out-of-plane motion, simulator only).
  `plume.mode === 'aero'` gives aero heating with no rendered plume (the movie swoop).

When any link reaches heat 1, `SimLoop` severs the chain there and fires `onChainBurn(point)`
once. `index.js` shows `cfg.chainBurnCallout` at that point, lets the severed chain fall for
1.6 s (the loop keeps running), then runs the standard reset.

## The zig-zag physics (the essay's conclusion — hard-won numerical results)

Three findings that took real iteration; do not re-litigate them casually:

1. **Apparent gravity is exactly anti-thrust.** `g_app = g_vec − a_ship = −T_vec` for a
   ship under thrust. A dangling chain's equilibrium is therefore *always* the plume axis.
   Every steady manoeuvre cooks the chain (this is the `fishing-tilt-pass` scene's point).
2. **"Flip faster than the chain can follow" does NOT work.** With the chain hanging
   near-vertical, the tilted plume's *fan* (the cone swept across ±φ) intersects the
   upper chain links near the nozzle — the "shadow zone". Heat duty cycle ~50% per side
   → slow burn regardless of flip rate. This regime was tested extensively and always burns.
3. **Swing-pumping works.** Bang-bang controller: tilt the thrust *toward* the side the
   chain hangs (plume to the empty side); flip when the chain crosses vertical (±3°
   trigger). A stable limit cycle self-organises: chain swings ±~75°, half-period ~4.4 s,
   ship bounces ±~60 px, max heat saturates ≈ 0.3 — verified over 150 simulated seconds.
   Throttle must be coupled to tilt (`T = g/cos φ`) so the vertical component is exactly
   `g` at all times, otherwise each flip kicks the ship upward.

Recentring must NEVER bias the flip *timing* (that breaks the chain–plume phase and
burns the chain). The working scheme biases the tilt *magnitude* only, outside a dead
zone of ±6% panel width, clamped to ±0.1 rad:
`corr = clamp(0.0008·overshoot·sign(dx) + 0.0025·vx, ±0.1)`, `target = side·φ − corr`.
This holds the bounce on-panel down to ~340 px widths with max heat ≤ 0.30.

## Rendering

### SVG world group

All scene geometry lives inside `<g class="sim-world">` (`_worldGroup`). Camera transforms
(`setWorldTransform`) are applied to this group, so HTML overlays (buttons, status badges)
that sit outside the `<svg>` are unaffected.

### Design token mirrors (`TOKEN` in svg-renderer.js)

SVG/JS cannot read CSS custom properties. The `TOKEN` object mirrors the relevant tokens from
`/style.css` as hardcoded strings. If the palette changes in `style.css`, update `TOKEN` here.

Current entries: `bg`, `planetBase`, `inkDim`, `inkFaint`, `gold`, `goldDim`, `blue`,
`blueTint`, `red`, `amber`. Chain heat colours lerp through RGB triples `CHAIN_COOL` →
`CHAIN_AMBER` (--amber) → `CHAIN_RED` (--red).

`planetBase: '#1a1610'` is not a site-wide token — it is a local dark warm tone for the planet
body fill, derived to complement `gold`.

### Planet rendering

Three layers in Z-order: base circle (`planetBase`), gradient circle (`planet-grad` radial
gradient, gold sheen), and a 24-tick static ring. `planetLabel` renders italic text centred
on the planet; `planetLabelSize` overrides the default 42px (the zig-zag inset uses 16).

### Atmosphere gradient (shell mode)

The atmosphere circle has radius `planetR + thickness`, with dynamic stops placing a hard
edge exactly at the planet surface (`sf = planetR / (planetR + thickness)`), haze decaying
outward to 0 at the outer edge.

### Flat-world band (`config.flatWorld = { atmoTopY }`)

For front-view scenes: a vertical `linearGradient` rect from `atmoTopY` to the bottom of
the panel (blue, opacity 0.05 → 0.28) plus a faint dashed line at `atmoTopY`. When
`cfg.flatWorld` is set, `index.js` passes `planet: null` to the renderer so the huge
physics planet is never drawn, and skips the shell-circle visual.

### Chain rendering

One `<line>` per link, coloured by `heatColor(heat)` (cool grey-ink → amber → red),
stroke width bumps 1.4 → 2.2 above heat 0.6. The collector is a gold-ringed circle at the
tip. A severed joint's line is hidden, showing the break. The chain group draws *under*
the rocket group so links tuck behind the hull.

### Plume rendering (`config.plume`)

- `mode: 'cone'` — a trapezoid `<path>` inside the rocket group (so it rotates with the
  ship), filled with the `plume-grad` linear gradient, opacity = 0.5 × engine-glow level.
- `mode: 'halo'` — a soft radial glow circle at the nozzle instead (engine pointing out of
  the viewing plane — the zig-zag side-view inset). Halo mode hides the stock glow ellipse.
- `mode: 'aero'` — no visual; the config exists only to carry `aeroHeatK` for heating.

### Rocket icon & scale

`hail-mary-spacecraft-small.png` (640×427): engines left, nose right; displayed 68×45 with
`rotate(-90)` so `rocket.angle = 0` points up. `ENGINE_EXHAUST_Y = 34`. `config.rocketScale`
(setup key `rocketScale`) scales the whole rocket group — chain `anchorOffset` values are
world-scale and must be chosen to fit the *scaled* icon (the inset uses 0.55).

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
| `hail-mary-hover` | Legacy near-horizontal orbit tuning setup |

### Fishing essay setups (`fishing-*`)

These drive the spaceship-fishing essay, in page order. Most are scripted via a
`controller` function and loop via `autoResetAt`, crash, or chain burn.

All Adrian orbits go **counterclockwise visually** — at 12 o'clock the rocket is moving
left, at 9 o'clock it's moving down, etc.

| Setup | Key behaviour |
|---|---|
| `fishing-cruise` | Vacuum, no planet. One long pulse + three rapid pulses send the rocket off-screen. Loops via `resetWhen: 'offscreen'`. |
| `fishing-flip-burn` | Accelerate right, coast, `linearRotate` 180°, decelerate to a stop. `autoResetAt: 9.0`. |
| `fishing-adrian-intro` | Big planet labelled "Adrian"; rocket hidden. Static title slide. |
| `fishing-adrian-crash` | Arrive, flip, brake to a stop, hover briefly, cut engines, fall. `crashCallout: 'Bad. Bad. Bad.'` |
| `fishing-adrian-orbit` | Pure-physics insertion: spawns at apoapsis (`R_APO = 600`) of a bound ellipse with periapsis at `ADRIAN_ORBIT_R`; visibility-latched 180° flip on approach; feedback circularisation burn at periapsis (detected by the radial-velocity sign flip with a `dist < 0.95·R_APO` guard). |
| `fishing-adrian-stable` | Stable circular orbit at `ADRIAN_ORBIT_R`, never resets. |
| `fishing-adrian-slowdown` | Orbits engines-first, fires retrograde for 0.6 s (≈50% of orbital v), falls in. `crashCallout: 'Bad. Bad. Bad.'` |
| `fishing-adrian-hover` | Steady-state hover with slow lateral drift (`HOVER_V = 22`); thrust back-solved from `v = sqrt(r × (g − T))`. `autoResetAt: 14`. |
| `fishing-book-pass` | Hover pass with chain + visible atmosphere band + plume cone. Chain hangs into the plume and burns ~7 s. `chainBurnCallout: '…and the chain is cooked.'` |
| `fishing-tilt-pass` | Same but tilted 20° off radial. Chain settles anti-thrust (= into the plume) and burns ~3 s while the ship slides sideways. `chainBurnCallout: 'The chain follows the fire.'` |
| `fishing-movie-swoop` | Ballistic ellipse (apoapsis 395 at 6 o'clock, periapsis 232 inside the band). `trackVelocity: true`, chain trails. Collector aero-burns near periapsis (~4.7 s, right flank). `chainBurnCallout: 'Vaporised.'` |
| `fishing-zigzag-front` | Flat world, front view. Swing-pumping bang-bang controller (see physics section). Runs 48 s per loop; never burns. |
| `fishing-zigzag-side` | Miniature side view for the dual-view inset: mini-Adrian (R 58), `rocketScale: 0.55`, halo plume, slow drift. `autoResetAt: 15`. |

Adrian-scene geometry constants at the top of `setups.js`: `ADRIAN_R = 200`,
`ADRIAN_ORBIT_R = 245`, `ADRIAN_ATMO_THICK = 45` (band top sits exactly at the orbit
radius), `ADRIAN_CENTER = ({width,height}) => ({x: width/2, y: height*0.62})`,
`ADRIAN_ORBIT_V ≈ 108.5 px/s`, `ADRIAN_ORBIT_T ≈ 14.2 s`.

`trackVelocity: true` smoothly rotates the rocket to face the velocity vector at speeds above
8 px/s. Use `false` for setups whose controller manages rotation directly.

## Scripted controllers

A setup can include a `controller(rocket, simTime, dt, ctx)` function called every physics
sub-step. `ctx` is `{ planet, bounds, chain }`. The controller is the sole authority for
engine state and (when `trackVelocity: false`) rocket angle.

Companion fields: `autoResetAt` (seconds), `crashCallout` (shown only on actual crashes),
`chainBurnCallout` (shown at the burn point), `planetLabel` / `planetLabelSize`,
`hideRocket`, `rocketScale`, `flatWorld`, `chain`, `plume`, `forwardAirspeed`.

Sim time resets to zero on every reset; controllers with closure state must reset it when
`t < prevT` (see the insertion and zig-zag controllers).

Rotation helpers: `rotateToward` (exponential approach — for tracking moving targets) and
`linearRotate` (lands exactly — for scripted flips). Don't use `rotateToward` for flips;
it asymptotes ~10° short.

## Crash detection (`loop.js`)

After every sub-step, `planet.contains(position)` clamps the rocket to the surface, zeroes
velocity, sets `_crashed`, and fires `onCrash()`. `_crashed` clears on `start()`/`resume()`.

## Essay page (`index.html`)

Page-turn UI (no document scroll): `.essay-strip` of `.essay-page` articles translated by
`translateX(-N × 100vw)`. Pages with `data-sim` get the `has-sim` class → `padding-right:
50vw` and the fixed right-half sim panel fades in (`body.split`).

- **Dual view:** a page may add `data-sim2` / `data-sim2-label` — the second setup mounts
  in `.sim-inset` (230×190, top-right of the panel). Used by the zig-zag page.
- **Mobile (≤960px):** the sim panel is moved *inline* into the active page (between the
  heading and the prose) by `placePanel()` — `body.sim-inline` restyles it as a 320px-tall
  block. The inset is hidden on mobile. Crossing the breakpoint re-places and re-mounts.
- The final page has a `.cta-row` linking to `../fishing-simulator/`.
- The title page keeps two `.placeholder-ref` blocks (book quote, movie still) for Wim.

## Fishing simulator (`explorations/fishing-simulator/index.html`)

Public interactive listed under Calculators. Imports the engine via relative paths
(`../spaceship-fishing/core/...`). Same flat-world scene as `fishing-zigzag-front` with:

- **Autopilot / Manual** modes. Autopilot = the essay's bang-bang controller + boundary
  steering. Manual = player picks the tilt side (←/→, A/D, or touch buttons); no steering
  assist, staying on the field is the player's job.
- Live controls: engine tilt (10–40°), forward drift 0–80 px/s (feeds
  `loop.forwardAirspeed` → aero heating only), chain damping; chain links applies on restart.
- Win: cumulative collector-in-band time ≥ 12 s → "Sample secured ✓". Fails: chain burn
  ("Chain incinerated") or |x − centre| > 46% width ("Drifted off the sample field");
  fails pause the loop after ~1.8 s. `R` restarts.
- Telemetry panel: chain heat bar, sample-collected bar, collector airspeed, lateral
  velocity, chain swing angle.

## Visibility & lifecycle

- `IntersectionObserver` on the mount element pauses the loop when off-viewport (`rootMargin: 100px`).
- `document.visibilitychange` pauses on hidden tab.
- `mount()` returns `{ pause, resume, reset, destroy }`. The essay page calls `destroy()` when
  switching between pages.
- `reset()` in `index.js`: fade out → mutate entity state in-place (same object refs) →
  re-layout the chain → fade in. It is async with multiple `await` points and checks an
  `isDestroyed` flag after each so a page-turn mid-reset bails cleanly; `destroy()` also
  clears any pending chain-burn timer.
