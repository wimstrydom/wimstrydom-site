# wimstrydom-site

Personal brand site for Wim Strydom. Deployed at wimstrydom.com (GitHub: `wimstrydom/wimstrydom-site`).

## Stack

Plain HTML/CSS/JS — no framework, no build step. Each page is a self-contained file. Push to `main` deploys directly.

## Design system

- **Background:** `#12100e`
- **Ink:** `#e8dcc8` (with opacity variants `--ink-dim`, `--ink-faint`, `--ink-ghost`)
- **Accent:** `#c8a96e` (gold)
- **Font:** EB Garamond (Google Fonts) — serif only, no fallback to sans
- **Feel:** warm dark, tactile, sophisticated — editorial/manuscript aesthetic

## Site structure

```
index.html              Home page — "Hello" + contents list
philosophy/index.html   Philosophy page (live)
```

Planned pages (coming soon, linked from home but not yet built):
- `roulette/` — interactive calculator of some kind
- `narratives/` — blog/essay content
- `pf-dashboard/` — personal finance dashboard

## Pages

### Home (`index.html`)
Centred layout, large "Hello" heading, contents list with links. "Philosophy" is the only live link; the rest show "coming soon" in dimmed italic.

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

## Content rules

The text in `philosophy/index.html` is authored by Wim and is **not to be edited or paraphrased**. Reproduce it exactly as written. This applies to all future content pages — treat user-supplied copy as law.

## Adding new pages

1. Create a directory (e.g. `narratives/`) with an `index.html` inside
2. Update the link in `index.html` — change the `<span class="coming-soon">` to an `<a>` matching the existing Philosophy link style
3. Follow the design system above — reuse the header/wordmark pattern from `philosophy/index.html`
