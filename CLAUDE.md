# wimstrydom-site

Personal brand site for Wim Strydom. Deployed at wimstrydom.com (GitHub: `wimstrydom/wimstrydom-site`).

## Stack

Plain HTML/CSS/JS — no framework, no build step. Each page is a self-contained file. Push to `main` deploys directly.

## Keeping CLAUDE.md up to date

After any change that affects site structure, page descriptions, design system tokens, or workflow instructions, update the relevant section of this file before finishing the task.

## Design system

All design tokens live in `/style.css`, which every page links to via `<link rel="stylesheet" href="/style.css">`. Page-specific layout rules stay inline in each file's `<style>` block — never duplicate tokens there.

### Colour tokens

| Token | Role |
|---|---|
| `--bg` | Page background |
| `--bg-glass` | Sticky/frosted header background |
| `--ink-bright` | Headings, high-emphasis text |
| `--ink` | Body text |
| `--ink-dim` | Dim text — minimum opacity for any text |
| `--ink-faint` | Non-text structure only: borders, dividers, hairlines |
| `--gold` | Accent — active states, links, progress bar |
| `--gold-dim` | Muted accent — blockquote borders, hover underlines |
| `--red` | Data accent A |
| `--red-dim` | Muted data accent A — fills, borders |
| `--blue` | Data accent B |
| `--blue-dim` | Muted data accent B — fills, borders |
| `--green` | Data accent C |
| `--green-dim` | Muted data accent C — fills, borders |
| `--amber` | Data accent D / caution tone |
| `--amber-dim` | Muted data accent D — fills, borders |
| `--gold-tint` | Very faint gold tint — backgrounds, hover states |
| `--red-tint` | Very faint red tint — backgrounds |
| `--blue-tint` | Very faint blue tint — backgrounds |
| `--green-tint` | Very faint green tint — backgrounds |
| `--amber-tint` | Very faint amber tint — backgrounds |

**Rules:**
- Text is never below `--ink-dim`. Use `--ink-dim`, `--ink`, or `--ink-bright` for all text.
- `--ink-faint` is never used for text — only borders, dividers, and structural hairlines.
- No raw hex or rgba colour values anywhere in page files. Always use a token.
- No `--ink-ghost`, `--ink-rule`, or any other ink variant — only the four ink tokens above.
- Never use the CSS `opacity` property to express colour intensity. Use the appropriate token instead (`--ink-dim`, `--gold-dim`, etc.). Raw opacity creates fragmented one-off tones that fall outside the token system. The only legitimate use of `opacity` is for non-colour purposes such as transition effects on interactive states.
- **Pre-existing opacity exceptions** (do not replicate, do not remove): `.wordmark { opacity: 0.85 }` and `#progress-bar { opacity: 0.65 }` predate this rule. No token exists at those exact values and they are load-bearing design choices — leave them as-is.
- **JS canvas/chart mirrors:** `explorations/spin-station/index.html` and `explorations/spin-station-calculator/index.html` contain JS colour constants (canvas and Plotly) that mirror design tokens as hardcoded strings — those APIs cannot read CSS variables. If you update any token in `style.css`, update the matching JS constants in both files too. Each constant is annotated with its corresponding token name.

### Typography

- **Font:** EB Garamond (Google Fonts) — serif only
- **Google Fonts URL:** `https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,500;1,400;1,500&display=swap`
  - Weights 400 and 500 only (regular + medium, normal + italic). Do not add weight 600.
- **Feel:** warm dark, tactile, sophisticated — editorial/manuscript aesthetic

### Other tokens

`style.css` also defines `--serif: 'EB Garamond', Georgia, serif;` — use this in inline `<style>` blocks instead of repeating the font stack.

### Text and spacing

**Base body text:** 18px, `line-height: 1.44`, `color: var(--ink)`.

**Paragraphs:** `margin-bottom: 18px; text-align: justify`. Last paragraph in a block: `margin-bottom: 0`.

**Heading scale:**

| Element | Size | Weight | Style | Color |
|---|---|---|---|---|
| Page title (`.page-title`) | 56px | 400 | — | `--ink-bright` |
| Section heading (`h2`) | 26–27px | 400 | — | `--ink-bright` |
| Sub-heading (`h3`) | 19px | 400 | italic | `--ink` |
| Minor heading (`h4–h6`) | 16px | 500 | uppercase, `letter-spacing: 0.05em` | `--ink-dim` |

Page title specifics: `line-height: 1.08; letter-spacing: -0.3px; margin-bottom: 26px`. Responsive: 40px at ≤860px, 34px at ≤480px.

**Inline elements:**
- `em` → `color: var(--gold); font-style: italic`
- `strong` → `color: var(--ink-bright); font-weight: 500`
- `a` → `color: var(--gold); text-decoration: none; border-bottom: 1px solid var(--gold-dim)`; hover: `opacity: 0.72`

**Eyebrow label (`.page-eyebrow`):** `font-size: 11px; letter-spacing: 0.26em; text-transform: uppercase; color: var(--ink-dim); margin-bottom: 30px`.

**Intro block (`.page-intro`):** `font-size: 18px; font-style: italic; line-height: 1.78; border-left: 2px solid var(--gold-dim); padding-left: 20px`.

**Blockquote:** `border-left: 2px solid var(--gold-dim); padding: 2px 0 2px 20px; margin: 1.6em 0; color: var(--ink-dim); font-style: italic`. Paragraphs inside: `text-align: left`.

**Callout (`.callout`):** `border-left: 2px solid var(--gold-dim); padding: 18px 20px; margin: 28px 0; background: var(--gold-tint)`. Label (`.callout-label`): `font-size: 10px; letter-spacing: 0.22em; text-transform: uppercase; color: var(--ink-dim)`. Body paragraphs: `font-size: 16px; line-height: 1.44; color: var(--ink); text-align: justify`. Used for asides and pull-out notes in essay prose.

**Horizontal rule:** `border: none; border-top: 1px solid var(--ink-faint); margin: 3em auto; width: 40%`.

**Lists:** `padding-left: 1.6em; margin-bottom: 1.4em`. Items: `line-height: 1.72; margin-bottom: 0.4em`.

**Page meta (`.page-meta`):** `font-size: 13px; font-style: italic; color: var(--ink-dim); margin-bottom: 52px; line-height: 1.6`. Used for the date line below the page title on narrative pages.

**Page divider (`.page-divider`):** `height: 1px; background: var(--ink-faint); margin-bottom: 56px`.

**Body text utility (`.body-text`):** A layout utility class for inline prose fragments within page layouts (philosophy Q&A answers, spin-station essay body, build journey prose sections). Provides: 18px / 1.44, justified paragraphs, inline elements (em, strong, a), blockquote, hr, lists. Distinct from the content archetypes (`.prose`, `.poem`) which are for full markdown-rendered documents.

### Interactive components

Three reusable interactive components are defined in `style.css` (after the content archetypes). Use them on any page that needs them.

**Step carousel (`.step-carousel-wrap` / `.step-carousel` / `.step-card`):**
A horizontally snap-scrolling card row for presenting multi-step processes. Each card has a round gold number badge (`.step-card-num`), an uppercase dim title (`.step-card-title`), and body prose (`.step-card-body`). Dot indicators (`.step-carousel-dots` / `.step-carousel-dot`) live below the carousel. The wrap has a right-fade gradient overlay (via `::after`) to signal scrollability. Requires the carousel JS snippet (dot sync + drag-to-scroll) — see `instruments/cooking-without-entering-the-kitchen/index.html` for the reference implementation.

```html
<div class="step-carousel-wrap">
  <div class="step-carousel">
    <div class="step-card">
      <div class="step-card-num">1</div>
      <div class="step-card-title">Step label</div>
      <div class="step-card-body"><p>Step description.</p></div>
    </div>
    <!-- more cards -->
  </div>
  <div class="step-carousel-dots">
    <button class="step-carousel-dot active" aria-label="Step 1"></button>
    <!-- one dot per card -->
  </div>
</div>
```

**Stat grid (`.stat-grid` / `.stat-block`):**
A CSS Grid of large-number stat tiles with border-table styling. Uses `grid-template-columns: repeat(auto-fill, minmax(180px, 1fr))` with `border-top`/`border-left` on the grid and `border-right`/`border-bottom` on each block, forming clean table lines. Each block has `.stat-num` (large, `--ink-bright`), `.stat-label` (small caps, `--ink-dim`), and optional `.stat-note` (italic, `--ink-dim`, with top border).

```html
<div class="stat-grid">
  <div class="stat-block">
    <span class="stat-num">244</span>
    <span class="stat-label">Prompts</span>
    <span class="stat-note">Every message typed.</span>
  </div>
</div>
```

**Claude callout (`.claude-callout`):**
A collapsible callout for Claude-authored commentary. Collapsed by default; toggled by clicking the header button. Uses `grid-template-rows: 0fr → 1fr` for smooth expansion (same technique as the philosophy page accordions). The header shows the inlined Anthropic SVG mark in `--red`, a "Claude" badge label, a summary line, and a `▾` caret that rotates 180° when open. Requires the callout JS snippet — see `instruments/cooking-without-entering-the-kitchen/index.html`.

```html
<div class="claude-callout" id="callout-id">
  <button class="claude-callout-header" aria-expanded="false" aria-controls="callout-id-body">
    <div class="claude-callout-badge">
      <svg class="claude-callout-badge-icon" ...><!-- Anthropic SVG --></svg>
      <span class="claude-callout-badge-label">Claude</span>
    </div>
    <span class="claude-callout-summary">Summary of what's inside</span>
    <span class="claude-callout-caret">▾</span>
  </button>
  <div class="claude-callout-body" id="callout-id-body">
    <div class="claude-callout-body-inner">
      <div class="claude-callout-body-pad">
        <p>Content here.</p>
      </div>
    </div>
  </div>
</div>
```

### Layout and structure

**Shell variables** (`--header-h`, `--rail-w`, `--content-max`) are defined in `style.css` and shared by all content pages:
- `--header-h: 56px` — sticky header height
- `--rail-w: 230px` — fixed left rail width
- `--content-max: 750px` — unified max readable width for philosophy and prose narratives

The `.poem` archetype (via `.content.no-rail:has(.poem)`) overrides `--content-max` to `680px` and adjusts padding automatically — no local overrides needed on poem pages. The `.no-rail` scope prevents the rule from accidentally applying to pages like the style guide that contain a `.poem` demo element.

**Content padding** (defined in `style.css`): `52px 48px 120px` (desktop) → `36px 24px 80px` (≤860px) → `28px 20px 72px` (≤480px). The `.poem` archetype sets its own larger padding: `60px 48px 140px` desktop → `36px 24px 90px` (≤860px).

**Header padding:** `0 48px` desktop → `0 24px` at ≤860px.

**Responsive breakpoints:**
- `≤860px` — rail hidden, padding collapses, page title → 40px
- `≤480px` — page title → 34px, padding tightens further

**Wordmark:** `font-size: 19px; letter-spacing: 0.22em; text-transform: uppercase; opacity: 0.85; font-weight: 400; color: var(--ink)`.

**Rail nav items:** `font-size: 13.5px; line-height: 1.35; color: var(--ink-dim)`; active → `color: var(--gold); font-style: italic`. Rail section label: `font-size: 10px; letter-spacing: 0.24em; text-transform: uppercase`.

## Terminology

The site is structured around five **books** — the top-level groupings named Definitions, Narratives, Explorations, Instruments, and Salivations. Each book is a mode of engagement. Sections within a book are called **chapters**.

## Site structure

```
index.html                                              Homepage — Meridian layout (no header/rail)
scope.md                                                Site scope & roadmap document

definitions/index.html                                  Book 01 — Definitions (integrated about page; Philosophy linked out)
definitions/philosophy/index.html                       Philosophy chapter — full dedicated page

narratives/index.html                                   Book 02 — Narratives index (Stories + Poems)
narratives/<slug>/index.html                            Individual narrative page
narratives/<slug>/<Title>.md                            Narrative content (Markdown)

explorations/index.html                                 Book 03 — Explorations index (Essays + Calculators)
explorations/spin-station/index.html                    Spin Station essay page
explorations/spin-station-calculator/index.html         Spin Station calculator
explorations/spaceship-fishing/index.html               Spaceship Fishing essay (Hail Mary physics, scripted SVG sims)
explorations/fishing-simulator/index.html               Hail Mary Fishing Simulator (interactive companion to the essay)

instruments/index.html                                  Book 04 — Instruments index (Build Journeys + Tools sections)
instruments/<slug>/index.html                           Individual Build Journey page

salivations/index.html                                  Book 05 — Salivations index (recipe listing)
salivations/recipe/index.html                           Recipe viewer (reads ?slug= param, fetches JSON)
salivations/data/<slug>.json                            Exported recipe JSON (one file per recipe)
salivations/data/index.json                             Recipe manifest (drives the listing page)

style-guide/index.html                                  Design system style guide — colour tokens, typography, components, spacing
```

Definitions (Book 01) is live: the index page integrates the about/CV/contact material, and Philosophy is a full dedicated chapter. A standalone Coordinates chapter may still be added later.

## Pages

### Home (`index.html`)
Meridian layout — no header, no rail, full-bleed. Giant split name ("WIM" left / "STRYDOM" right), right-aligned intro, "Recent Machinations" strip (3 live publication links), then five numbered book rows. Books with no live content show a "coming soon" label. Scroll-reveal via vanilla IntersectionObserver.

### Book 01 — Definitions

#### Definitions index (`definitions/index.html`)
Integrated "about" page — a single self-contained narrative rather than a chapter directory. Sticky header (wordmark → `../`, `.header-date` shows "Book 01") + reading progress bar + fixed left rail with in-page section nav (scroll-spy via the same `updateRailActive` pattern as the CV/build-journey pages). Five `.def-section` blocks, each introduced by a `.def-section-label` (page-specific class): **This site** (the five-books overview), **Who I am** (origins — South Africa, Stellenbosch, now London), **What I do** (condensed professional background — a `.role-list` of company/role/place/dates rows, *not* a verbatim CV, with a link out to LinkedIn for the full record), **What I believe** (short intro linking to `philosophy/`), and **Get in touch** (a `.contact-list` of Email + LinkedIn rows). The email is assembled at runtime in JS so it isn't a plain-text string in the markup (light anti-scraping). Prose lives in `.body-text` blocks. There is no standalone CV page — the CV is folded into the "What I do" section by design.

#### Philosophy (`definitions/philosophy/index.html`)
"The Manuscript" design. Key layout features:
- Fixed left rail (230px) — section navigation only; clicking a section auto-collapses others and scrolls to it; active section highlights gold on scroll
- Sticky header with wordmark linking to `../../`
- 5 collapsible sections: Metaphysics, Philosophy of Mind, Epistemology, Moral Philosophy, Meaning of Life
- Nested Q&A accordions under each section ("Okay, so then...")
- Reading progress bar (gold, top of viewport)
- "expand all / collapse all" in rail
- Hash links (`#metaphysics`, `#free-will`, etc.) work as deep links
- Fully responsive — rail hidden on mobile

### Book 02 — Narratives

#### Narratives index (`narratives/index.html`)
Two-section list page. "Stories" section (Short Fiction) and "Poems" section (Poetry), each with its own label + divider + `<ul class="link-list">`. Entries are newest-first within each section.

#### Individual narrative pages
Each narrative lives at `narratives/<slug>/index.html` and renders its `.md` file client-side. Template: copy `narratives/a-man-of-means-and-ends/index.html`. Shared features: sticky header with wordmark, left rail with section nav, reading progress bar.

Narrative pages carry **no formatting CSS** in their `<style>` block — all rendering is handled by content archetypes defined globally in `style.css` (see Content archetypes section below). The only CSS a narrative page should ever add locally is non-formatting layout overrides specific to that one page.

### Book 03 — Explorations

#### Explorations index (`explorations/index.html`)
Two-section list page. "Essays" section and "Calculators" section, each with its own label + divider + `<ul class="link-list">`. Entries are newest-first within each section.

#### Spin Station (`explorations/spin-station/index.html`)
Essay page: "The weird gravity of spin-station transit". Two-column layout — prose on the left, sticky animated canvas diagram on the right showing a rotating station with two colour-coded carriage types (data accent A and B). Ends with a CTA linking to `../spin-station-calculator/`.

The canvas animation uses JS colour constants (`C_RED`, `C_BLUE`) that mirror `--red` and `--blue` from `style.css`. Update both if the palette changes.

#### Spin Station Calculator (`explorations/spin-station-calculator/index.html`)
Interactive calculator built with Plotly. Lets users adjust station diameter, target gravity, train speed, acceleration, and stop spacing, then shows live felt-gravity profiles for both journey directions.

The Plotly chart colours and other chart/diagram constants are grouped at the top of the `<script>` block under "Design token mirrors". Update those constants if the corresponding `style.css` tokens change.

#### Spaceship Fishing (`explorations/spaceship-fishing/index.html`)
Essay: "How to go fishing with a spaceship — exploring the physics of *Project Hail Mary*'s most confusing scene". Complete at 14 pages. Built on a 2D SVG orbital sim engine with a scripted-controller layer (the engine lives in this directory and is also imported by the fishing simulator). The page uses a **page-turn UI** instead of vertical scroll:

- The document has `overflow: hidden`. All content lives inside `.essay-viewport`, a fixed-position container below the header.
- Inside the viewport, `.essay-strip` is a horizontal flex row of `.essay-page` articles (one per page). The strip is translated by `translateX(-N × 100vw)` to reveal page N. The transition is 0.6s `cubic-bezier(.4, 0, .2, 1)`.
- A floating `.page-nav` (prev / counter / next) sits bottom-centre. Arrow keys, Space, PageUp/PageDown, Home, and End all navigate. The top progress bar reflects `currentPage / (totalPages − 1)`.
- Each page that has a paired simulation gets the `has-sim` class. In CSS this expands the page's `padding-right` to `50vw`, which reflows the inner column into the left half of the viewport. The sim panel (fixed to the right half) fades in via `body.split`. Horizontal padding lives on `.essay-page-inner` so the prose gutter travels with the column when it reflows.
- **Dual view:** a page may carry `data-sim2`/`data-sim2-label` to mount a second miniature sim in `.sim-inset` (230×190, top-right of the panel). Used by the zig-zag page (front view + side-view inset).
- **Mobile (≤960px):** the sim panel is moved inline into the active page between the heading and the prose (`body.sim-inline`, 320px-tall block) — phone readers get the animations too. The inset is hidden on mobile.

Narrative arc: momentum → flip-and-burn → Adrian → stop-and-fall → orbital insertion → orbits are too fast (imperative one) → you can't just slow down → hover and the exhaust problem (imperative two) → the book's slow pass (chain cooks) → the movie's swoop (collector vaporises) → "just tilt" and the apparent-gravity lemma (a chain under steady thrust always settles anti-thrust — into the plume) → the zig-zag swing-pumping answer (dual view) → verdict with a CTA to `../fishing-simulator/`.

Animation beats are encoded as scripted **controllers** in `core/setups.js`. Each setup can define `controller(rocket, simTime, dt, ctx)` plus `autoResetAt`, `crashCallout`, `chainBurnCallout`, `planetLabel`, `hideRocket`, `chain`, `plume`, `flatWorld`, and `rocketScale`. The engine includes a position-based-dynamics chain with per-link heat (plume immersion + aero heating), exhaust plume cone/halo rendering, and uniform-gravity "flat world" front-view scenes via a huge off-screen planet. The big planet "Adrian" scenes share constants at the top of `setups.js` and orbit **counterclockwise** visually (down at 9 o'clock → right at 6 → up at 3 → left at 12). See `explorations/spaceship-fishing/CLAUDE.md` for engine-level details — including the numerically verified zig-zag physics findings (swing-pumping bang-bang controller; do not re-derive casually).

The title page keeps two placeholder blocks (`.placeholder-ref`) for the book quote and movie still — Wim will fill these in.

#### Hail Mary Fishing Simulator (`explorations/fishing-simulator/index.html`)
Interactive companion to the essay, listed under Calculators. Imports the spaceship-fishing engine via relative paths (`../spaceship-fishing/core/...`). Front-view flat-world scene with chain + plume. **Autopilot** mode demos the swing-pumping controller; **Manual** mode hands the tilt to the player (←/→, A/D, or on-screen touch buttons). Live sliders: engine tilt (10–40°), forward drift (0–80 px/s, feeds aero heating via `loop.forwardAirspeed`), chain damping; chain links applies on restart. Win by accumulating 12 s of collector-in-atmosphere dwell ("Sample secured ✓"); fail by chain burn ("Chain incinerated") or drifting more than 46% of the panel width off centre ("Drifted off the sample field"). `R` restarts. Telemetry panel: chain-heat and sample-progress bars, collector airspeed, lateral velocity, chain swing angle.

### Book 04 — Instruments

#### Instruments index (`instruments/index.html`)
Two-section list page. "Build Journeys" section and "Tools" section. Follows the same centred-container layout as the explorations index (no rail, no header — just `.container` with a giant heading). Tools may link to external apps (e.g. `malva.recipes`, opened with `target="_blank"`).

#### Build Journey pages (`instruments/<slug>/index.html`)
Long-form narrative pages documenting a complete app build. Use the standard rail + content layout (same shell as the philosophy page): sticky header with wordmark → `../../`, reading progress bar, fixed left rail with section links that highlight on scroll via IntersectionObserver.

Key design patterns used on Build Journey pages:
- **Section number ornaments:** `<h2 data-num="01">` with `h2[data-num]::before { content: attr(data-num) }` in the page `<style>` — renders a small dim ordinal above the heading.
- **`.step-carousel`** (see Interactive components below) — used for all numbered multi-step process lists.
- **`.stat-grid`** (see Interactive components below) — used for hero stats and any large-number dashboards.
- **`.claude-callout`** (see Interactive components below) — used for Claude-authored commentary blocks; collapsed by default, expanded on click. Displays the Anthropic mark SVG icon (inlined) in `--red` beside the "Claude" label.
- **`.callout`** — used for non-Claude editorial asides (e.g. "Small Aside" blocks).
- **`.wim-note`** class — `color: var(--ink-dim); font-style: italic` — used for Wim's inline editorial comments appearing inside Claude-authored callout text.
- **Cost comparison bar** — page-specific: a `div.cost-bar-track` containing `div.cost-bar-fill` with a percentage width, styled in the page `<style>`.

The Anthropic mark SVG (13-ray starburst, `fill="currentColor"`, `viewBox="0 0 100 100"`) is inlined directly in the HTML wherever the Claude icon is needed; the icon colour is set via `color: var(--red)` on the containing element. No external SVG file.

**First build journey:** `instruments/cooking-without-entering-the-kitchen/index.html` — the recipe app build story.

### Book 05 — Salivations

#### Salivations index (`salivations/index.html`)
Centred-container listing page (same pattern as narratives/index.html). Fetches `/salivations/data/index.json` at runtime and renders a `.link-list` of recipes. Each entry links to `salivations/recipe/?slug=<slug>`. No rail, no header — just `.container` with a giant heading.

#### Recipe viewer (`salivations/recipe/index.html`)
Single shared viewer for all recipes. Reads `?slug=` from the URL, fetches `/salivations/data/<slug>.json`, and builds the content entirely in JS. Uses the standard rail + content layout: sticky header (wordmark → `../../`), reading progress bar, and a fixed left rail with just two controls — a scale multiplier (×¼ … ×12) and a units toggle (**Metric** default / **US**). There is no rail section nav: side by side, jump-to-section links do nothing.

**Split-view reading.** The viewer mirrors the recipe app's read mode: ingredients and method sit side by side in a CSS grid (`.r-split`, `0.82fr / 1.18fr`), with the ingredients column **pinned** (`position: sticky`) while the longer method scrolls. Section heads (`.r-section-head`) are plain labels — no leading numbers, no trailing rule. A head gets a rule *below* it (`.is-ruled`) only when its first group carries a label, so it doesn't double up with the leading row's own top border when the first group is unlabelled. At ≤860px the grid collapses to a single column (ingredients above method, no longer sticky), the rail is hidden, and a `.r-mobile-controls` strip below the title carries the same scale + unit controls (the page divider is dropped on mobile so the strip's own border is the only separator). The viewer page gets a wider canvas than the default reading column via `.content.recipe-viewer { --content-max: 940px }`.

Uses the `.recipe` archetype classes from `style.css` (`.r-split`, `.r-col-ing`, `.r-col-method`, `.r-section-head`, `.r-ing-list`, `.r-ing`, `.r-ing-measure`, `.r-ing-qty`, `.r-ing-unit`, `.r-ing-name`, `.r-ing-prep`, `.r-ing-opt`, `.r-step-list`, `.r-step`, `.r-step-num`, `.r-step-text`, `.r-step-badge`, `.r-group-label`) plus the viewer controls (`.r-control`, `.r-scale`, `.r-unit-toggle`, `.r-mobile-controls`). The page file itself carries **no** formatting CSS — everything lives in the `.recipe` archetype.

**Unit + temperature conversion.** This is a faithful vanilla-JS port of the recipe app's deterministic helpers (`apps/web/components/recipe/recipe-helpers.ts` in recipe-scanner) — keep them in sync. Both modes **convert**: Metric targets ml/l + g/kg, US targets tsp/tbsp/cup/fl_oz/… + oz/lb. Conversion goes through a canonical unit table, choosing the largest target unit that keeps the quantity ≥ 1; metric results snap to cooking-friendly values (1 tsp → 5 ml, 1 tbsp → 15 ml, 1 cup → 250 ml). A unit already in the target system passes through unchanged. **Volume↔weight is never attempted.** Custom/non-canonical units (tin, packet) pass through verbatim. Temperatures convert °C↔°F (rounded to the nearest 5°) — °C in Metric, °F in US. Vulgar fractions (¼ ½ ¾ ⅓ ⅔) are used where the value lands on one; the scale multiplier also steps through ¼ and ½. Generic group labels (`Ingredients`, `Method`, etc.) are suppressed. Most Strydom recipes are metric-native, so Metric (the default) shows them as written and US converts.

#### Recipe data format (`salivations/data/<slug>.json`)
Exported from the recipe-scanner app via the `export-recipe` Claude skill (in the recipe-scanner project). Fields: `slug`, `name`, `description`, `yield`, `source` (book + era), `ingredient_groups`, `step_groups`, `categorization`, `exported_at`. English only — no bilingual fields, no pipeline metadata.

#### Manifest (`salivations/data/index.json`)
JSON array: `[{ slug, name, description, categories, source }]`. Updated automatically by the export skill when a new recipe is added. Powers the listing page.

#### Adding a new recipe
Use the `export-recipe` skill in the recipe-scanner Claude session: "export [recipe name] from [library] to the site". The skill writes the JSON file and updates the manifest. Then push to main to publish.

## Content archetypes

Content archetypes are self-contained CSS classes defined in `style.css` that provide complete rendering for a content type. Individual narrative pages set the archetype class on the rendered content div and need zero formatting CSS of their own.

### `.prose` — short fiction / essay

Applied to markdown-rendered narrative documents. Covers: base text (18px / 1.44), paragraphs (justified), inline elements (em, strong, a), blockquote, hr, lists, and headings (h2–h6) and code/pre blocks.

```html
<div id="story-body" class="prose">${storyHtml}</div>
```

### `.poem` — poetry

Applied to poem documents. Covers: base text (20px / line-height 2), stanza paragraphs (left-aligned, 2.2em gap), inline elements. Also narrows the content column: `.content.no-rail:has(.poem)` sets `--content-max: 680px`, larger desktop padding, and poem-specific `.page-title` sizing — no `:root` override needed. The `.no-rail` scope ensures this only fires on narrative pages, not on pages like the style guide that contain poem demos.

```html
<div id="story-body" class="poem">${poemHtml}</div>
```

### `.recipe` — recipe viewer

Applied to the ingredient and step containers inside `salivations/recipe/index.html`. Covers: the split-view layout (`.r-split`, `.r-col-ing` sticky, `.r-col-method`, `.r-section-head`), ingredient rows (`.r-ing`, `.r-ing-measure`, `.r-ing-qty`, `.r-ing-unit`, `.r-ing-name`, `.r-ing-prep`, `.r-ing-opt`), step rows (`.r-step`, `.r-step-num`, `.r-step-text`, `.r-step-badge`), group labels (`.r-group-label`), the viewer controls (`.r-control`, `.r-scale`, `.r-unit-toggle`, `.r-mobile-controls`), the `.recipe-meta` line, and the `.r-state` loading/error message. The wider viewer canvas is set via `.content.recipe-viewer`.

### Adding a new archetype

If a new content type is needed beyond the existing three, add a complete self-contained archetype section to `style.css` after the `.recipe` section. Do not put any of its rules in the page file.

## Content rules

The text in `definitions/philosophy/index.html` is authored by Wim and is **not to be edited or paraphrased**. Reproduce it exactly as written. This applies to all future content pages — treat user-supplied copy as law.

## Analytics

Every page includes Google Analytics (GA4, measurement ID `G-DC8TCGZT0C`). The snippet goes immediately after `<head>`, before `<meta charset>`:

```html
<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-DC8TCGZT0C"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-DC8TCGZT0C');
</script>
```

This must be included in every new page and narrative without exception.

## Adding new pages

1. Create a directory under the appropriate book folder (e.g. `explorations/fibonacci-roulette/`) with an `index.html` inside
2. Update the explorations or definitions index page to include the new entry
3. Update `index.html` if the book is now live — convert the book name from `m-book-name-dim` + `m-book-soon` to `m-book-name` with an `href`
4. Always link `/style.css` in the `<head>` — this provides all tokens and the global reset
5. Use only design tokens (never raw hex/rgba values) for all colours in the page's inline `<style>` block
6. Reuse the header/wordmark pattern from `definitions/philosophy/index.html` (depth-appropriate `href` on wordmark)
7. Include the Google Analytics snippet (see Analytics section above)

## Adding a new narrative

Given a `.md` file for a new narrative (story or poem), follow these steps:

**1. Create the narrative directory and copy the file**

Use a short kebab-case slug based on the title (e.g. `a-man-of-means-and-ends`):
```
narratives/<slug>/
narratives/<slug>/<Original_Filename>.md
```

**2. Create `narratives/<slug>/index.html`**

Copy `narratives/a-man-of-means-and-ends/index.html` verbatim (the GA snippet is already in the template). Then change only these things:
- `<title>` tag — update to `Narrative Title — Wim Strydom`
- The three meta defaults in `loadStory` — `meta.title`, `meta.date`, `meta.eyebrow`
- The default filename in the `init` function — `storySrc` fallback string
- The archetype class on the `#story-body` div — `class="prose"` for fiction, `class="poem"` for poetry

The `meta.date` should reflect when the piece was written or provided; use `YYYY-MM-DD` format.

Set `meta.eyebrow` based on type:
- Short fiction → `'Short Fiction'`
- Poetry → `'Poetry'`

The leading-bold-title strip (`body = body.replace(...)`) stays in place — it handles `.md` files that open with a `**Title**` line.

Do not add any formatting CSS to the page's `<style>` block — all rendering is handled by the archetype class (see Content archetypes). Poetry pages need no local `--content-max` override; `.content:has(.poem)` handles it.

**3. Add the narrative to `narratives/index.html`**

Append a new `<li>` to the correct section's `.link-list`:
- Short fiction → add under the **Stories** section
- Poetry → add under the **Poems** section

Follow the existing pattern and add above any older entries so each section stays newest-first:
```html
<li>
  <a href="<slug>/">
    Narrative Title
    <span class="story-meta">Short Fiction · Month YYYY</span>
  </a>
</li>
```

For poems, use `Poetry` in place of `Short Fiction` in the meta span.

**4. Content rules**

The `.md` file is authored by Wim — reproduce it exactly as written, no edits or paraphrasing. Do not add front matter to the markdown file; metadata is set in the HTML.

## Adding a new Build Journey

1. Create `instruments/<slug>/index.html` — use `instruments/cooking-without-entering-the-kitchen/index.html` as the template.
2. Add the entry to `instruments/index.html` under the "Build Journeys" section (newest-first).
3. Add a sublink to the Book 04 row in `index.html` (inside `.m-book-sublinks`).
4. The page uses rail + content layout. Sections get `id` attributes for scroll-spy. Use `<h2 data-num="NN">` for numbered section ornaments.
5. For numbered process steps: use `.step-carousel-wrap` + dot JS. For large stats: use `.stat-grid`. For Claude commentary: use `.claude-callout` (collapsed by default) with the inlined Anthropic SVG mark.
6. Wim's inline editorial comments inside Claude-authored text get `<span class="wim-note">` (styled in the page `<style>` as `color: var(--ink-dim); font-style: italic`).
