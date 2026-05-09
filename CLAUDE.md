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
- **JS canvas/chart mirrors:** `spin-station/index.html` and `spin-station-calculator/index.html` contain JS colour constants (canvas and Plotly) that mirror design tokens as hardcoded strings — those APIs cannot read CSS variables. If you update any token in `style.css`, update the matching JS constants in both files too. Each constant is annotated with its corresponding token name.

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

**Body text utility (`.body-text`):** A layout utility class for inline prose fragments within page layouts (philosophy Q&A answers, spin-station essay body). Provides: 18px / 1.44, justified paragraphs, inline elements (em, strong, a), blockquote, hr, lists. Distinct from the content archetypes (`.prose`, `.poem`) which are for full markdown-rendered documents.

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

## Site structure

```
index.html                                              Home page — "Hello" + contents list
philosophy/index.html                                   Philosophy page (live)
spin-station/index.html                                 Spin Station essay page (live)
spin-station-calculator/index.html                      Spin Station calculator (live)
narratives/index.html                                   Narratives index — two sections: Stories and Poems
narratives/<slug>/index.html                            Individual narrative page
narratives/<slug>/<Title>.md                            Narrative content (Markdown)
style-guide/index.html                                  Design system style guide — colour tokens, typography, components, spacing
```

Planned pages (coming soon, linked from home but not yet built):
- `roulette/` — interactive calculator of some kind
- `pf-dashboard/` — personal finance dashboard

## Pages

### Home (`index.html`)
Centred layout, large "Hello" heading, contents list with links. Live pages: Philosophy, Spin Station, Narratives. Coming soon: Roulette, PF Dashboard.

### Philosophy (`philosophy/index.html`)
"The Manuscript" design. Key layout features:
- Fixed left rail (230px) — section navigation only; clicking a section auto-collapses others and scrolls to it; active section highlights gold on scroll
- Sticky header with wordmark linking to `../`
- 5 collapsible sections: Metaphysics, Philosophy of Mind, Epistemology, Moral Philosophy, Meaning of Life
- Nested Q&A accordions under each section ("Okay, so then...")
- Reading progress bar (gold, top of viewport)
- "expand all / collapse all" in rail
- Hash links (`#metaphysics`, `#free-will`, etc.) work as deep links
- Fully responsive — rail hidden on mobile

### Spin Station (`spin-station/index.html`)
Essay page: "The weird gravity of spin-station transit". Two-column layout — prose on the left, sticky animated canvas diagram on the right showing a rotating station with two colour-coded carriage types (data accent A and B). Ends with a CTA linking to `../spin-station-calculator/`.

The canvas animation uses JS colour constants (`C_RED`, `C_BLUE`) that mirror `--red` and `--blue` from `style.css`. Update both if the palette changes.

### Spin Station Calculator (`spin-station-calculator/index.html`)
Interactive calculator built with Plotly. Lets users adjust station diameter, target gravity, train speed, acceleration, and stop spacing, then shows live felt-gravity profiles for both journey directions.

The Plotly chart colours and other chart/diagram constants are grouped at the top of the `<script>` block under "Design token mirrors". Update those constants if the corresponding `style.css` tokens change.

### Narratives index (`narratives/index.html`)
Two-section list page. "Stories" section (Short Fiction) and "Poems" section (Poetry), each with its own label + divider + `<ul class="link-list">`. Entries are newest-first within each section.

### Individual narrative pages
Each narrative lives at `narratives/<slug>/index.html` and renders its `.md` file client-side. Template: copy `narratives/a-man-of-means-and-ends/index.html`. Shared features: sticky header with wordmark, left rail with section nav, reading progress bar.

Narrative pages carry **no formatting CSS** in their `<style>` block — all rendering is handled by content archetypes defined globally in `style.css` (see Content archetypes section below). The only CSS a narrative page should ever add locally is non-formatting layout overrides specific to that one page.

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

### Adding a new archetype

If a new content type is needed (e.g. `.recipe`), add a complete self-contained archetype section to `style.css` after the existing archetypes. Do not put any of its rules in the page file.

## Content rules

The text in `philosophy/index.html` is authored by Wim and is **not to be edited or paraphrased**. Reproduce it exactly as written. This applies to all future content pages — treat user-supplied copy as law.

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

1. Create a directory (e.g. `roulette/`) with an `index.html` inside
2. Update the link in `index.html` — change the `<span class="coming-soon">` to an `<a>` matching the existing link style
3. Always link `/style.css` in the `<head>` — this provides all tokens and the global reset
4. Use only design tokens (never raw hex/rgba values) for all colours in the page's inline `<style>` block
5. Reuse the header/wordmark pattern from `philosophy/index.html`
6. Include the Google Analytics snippet (see Analytics section above)

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
