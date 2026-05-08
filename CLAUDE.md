# wimstrydom-site

Personal brand site for Wim Strydom. Deployed at wimstrydom.com (GitHub: `wimstrydom/wimstrydom-site`).

## Stack

Plain HTML/CSS/JS — no framework, no build step. Each page is a self-contained file. Push to `main` deploys directly.

## Keeping CLAUDE.md up to date

After any change that affects site structure, page descriptions, design system tokens, or workflow instructions, update the relevant section of this file before finishing the task.

## Design system

All design tokens live in `/style.css`, which every page links to via `<link rel="stylesheet" href="/style.css">`. Page-specific layout rules stay inline in each file's `<style>` block — never duplicate tokens there.

### Colour tokens

| Token | Value | Role |
|---|---|---|
| `--bg` | `#12100e` | Page background |
| `--bg-glass` | `rgba(18,16,14,0.94)` | Sticky/frosted header background |
| `--ink-bright` | `#f0e8d4` | Headings, high-emphasis text |
| `--ink` | `#e8dcc8` | Body text |
| `--ink-dim` | `rgba(232,220,200,0.55)` | Dim text — minimum opacity for any text |
| `--ink-faint` | `rgba(232,220,200,0.10)` | Non-text structure only: borders, dividers, hairlines |
| `--gold` | `#c8a96e` | Accent — active states, links, progress bar |
| `--gold-dim` | `rgba(200,169,110,0.38)` | Muted accent — blockquote borders, hover underlines |

**Rules:**
- Text is never below `--ink-dim`. Use `--ink-dim`, `--ink`, or `--ink-bright` for all text.
- `--ink-faint` is never used for text — only borders, dividers, and structural hairlines.
- No raw hex or rgba colour values anywhere in page files. Always use a token.
- No `--ink-ghost`, `--ink-rule`, or any other ink variant — only the four ink tokens above.

### Typography

- **Font:** EB Garamond (Google Fonts) — serif only
- **Google Fonts URL:** `https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,500;1,400;1,500&display=swap`
  - Weights 400 and 500 only (regular + medium, normal + italic). Do not add weight 600.
- **Feel:** warm dark, tactile, sophisticated — editorial/manuscript aesthetic

### Other tokens

`style.css` also defines `--serif: 'EB Garamond', Georgia, serif;` — use this in inline `<style>` blocks instead of repeating the font stack.

## Site structure

```
index.html                                              Home page — "Hello" + contents list
philosophy/index.html                                   Philosophy page (live)
spin-station/index.html                                 Spin Station essay page (live) — needs design system migration
spin-station-calculator/index.html                      Spin Station calculator (live) — needs design system migration
narratives/index.html                                   Narratives index — two sections: Stories and Poems
narratives/<slug>/index.html                            Individual narrative page
narratives/<slug>/<Title>.md                            Narrative content (Markdown)
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
Essay page: "The weird gravity of spin-station transit". Two-column layout — prose on the left, sticky animated canvas diagram on the right showing a rotating station with spinward (red) and anti-spinward (blue) carriages. Ends with a CTA linking to `../spin-station-calculator/`.

**Note:** this page and the calculator currently define their own inline `:root` tokens and do not link `/style.css`. They need to be migrated to the design system. Do not add further raw values when editing them — migrate as part of any substantive change.

### Spin Station Calculator (`spin-station-calculator/index.html`)
Interactive calculator built with Plotly. Lets users adjust station diameter, target gravity, train speed, acceleration, and stop spacing, then shows live felt-gravity profiles for spinward and anti-spinward journeys.

**Note:** same design system migration needed as the essay page above.

### Narratives index (`narratives/index.html`)
Two-section list page. "Stories" section (Short Fiction) and "Poems" section (Poetry), each with its own label + divider + `<ul class="link-list">`. Entries are newest-first within each section.

### Individual narrative pages
Each narrative lives at `narratives/<slug>/index.html` and renders its `.md` file client-side. Template: copy `narratives/a-man-of-means-and-ends/index.html`. Shared features: sticky header with wordmark, left rail with section nav, reading progress bar.

## Content rules

The text in `philosophy/index.html` is authored by Wim and is **not to be edited or paraphrased**. Reproduce it exactly as written. This applies to all future content pages — treat user-supplied copy as law.

## Adding new pages

1. Create a directory (e.g. `roulette/`) with an `index.html` inside
2. Update the link in `index.html` — change the `<span class="coming-soon">` to an `<a>` matching the existing link style
3. Always link `/style.css` in the `<head>` — this provides all tokens and the global reset
4. Use only design tokens (never raw hex/rgba values) for all colours in the page's inline `<style>` block
5. Reuse the header/wordmark pattern from `philosophy/index.html`

## Adding a new narrative

Given a `.md` file for a new narrative (story or poem), follow these steps:

**1. Create the narrative directory and copy the file**

Use a short kebab-case slug based on the title (e.g. `a-man-of-means-and-ends`):
```
narratives/<slug>/
narratives/<slug>/<Original_Filename>.md
```

**2. Create `narratives/<slug>/index.html`**

Copy `narratives/a-man-of-means-and-ends/index.html` verbatim, then change only these three things:
- `<title>` tag — update to `Narrative Title — Wim Strydom`
- The three meta defaults in `loadStory` — `meta.title`, `meta.date`, `meta.eyebrow`
- The default filename in the `init` function — `storySrc` fallback string

The `meta.date` should reflect when the piece was written or provided; use `YYYY-MM-DD` format.

Set `meta.eyebrow` based on type:
- Short fiction → `'Short Fiction'`
- Poetry → `'Poetry'`

The leading-bold-title strip (`body = body.replace(...)`) stays in place — it handles `.md` files that open with a `**Title**` line.

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
