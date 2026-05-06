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
index.html                                              Home page — "Hello" + contents list
philosophy/index.html                                   Philosophy page (live)
narratives/index.html                                   Narratives index — list of stories
narratives/<slug>/index.html                            Individual story page
narratives/<slug>/<Story_Title>.md                      Story content (Markdown)
```

Planned pages (coming soon, linked from home but not yet built):
- `roulette/` — interactive calculator of some kind
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

## Adding a new story to Narratives

Given a `.md` file for a new story, follow these steps:

**1. Create the story directory and copy the file**

Use a short kebab-case slug based on the title (e.g. `a-man-of-means-and-ends`):
```
narratives/<slug>/
narratives/<slug>/<Original_Filename>.md
```

**2. Create `narratives/<slug>/index.html`**

Copy `narratives/a-man-of-means-and-ends/index.html` verbatim, then change only these three things:
- `<title>` tag — update to `Story Title — Wim Strydom`
- The three meta defaults in `loadStory` — `meta.title`, `meta.date`, `meta.eyebrow`
- The default filename in the `init` function — `storySrc` fallback string

The `meta.date` should reflect when the story was written or provided; use `YYYY-MM-DD` format. `meta.eyebrow` is almost always `'Short Fiction'` unless told otherwise.

The leading-bold-title strip (`body = body.replace(...)`) stays in place — it handles `.md` files that open with a `**Title**` line.

**3. Add the story to `narratives/index.html`**

Append a new `<li>` to the `.link-list`, following the existing pattern:
```html
<li>
  <a href="<slug>/">
    Story Title
    <span class="story-meta">Short Fiction · Month YYYY</span>
  </a>
</li>
```
Add it above any older entries so the list stays newest-first.

**4. Content rules**

The `.md` file is authored by Wim — reproduce it exactly as written, no edits or paraphrasing. Do not add front matter to the markdown file; metadata is set in the HTML.
