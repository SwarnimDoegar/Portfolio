# Portfolio redesign — design spec

**Date:** 2026-08-13
**Owner:** Swarnim Doegar
**Approved mockup:** https://claude.ai/code/artifact/cf128dc9-3937-41ec-9f53-ad0057f5159d

## Goal

Replace the 2020-era flip-card portfolio with a static, single-page site that presents
Swarnim as a full-stack engineer with four years of professional work. All content lives
in hand-editable JSON so future updates are a data edit, not a code change.

## Non-goals

- No CMS, no backend, no database.
- No blog, no analytics, no contact form (mailto only).
- No multi-page routing. One page, anchor navigation.
- Home address and phone number are deliberately excluded from the site. A public
  portfolio is scraped continuously; email plus LinkedIn is the whole contact surface.

## Content model

This is the core requirement. Four JSON files under `src/data/` hold every word and every
list on the page. Editing them and pushing is the entire update workflow.

They are loaded through Astro's Content Layer using the `file()` loader with Zod schemas,
so a malformed edit **fails the build with a clear message** instead of silently rendering
a broken page. That validation is the reason for choosing Content Layer over a plain
`import` of JSON.

### `src/data/profile.json`

Identity, hero, the "Now" section, and contact.

```json
{
  "name": "Swarnim Doegar",
  "role": "Software Engineer II",
  "company": "ImageKit",
  "since": "2025-09",
  "discipline": "Full stack",
  "location": "Derabassi, IN",
  "workMode": "Remote",
  "yearsExperience": "4+",
  "hero": {
    "headline": ["I build", "scalable,", "customer-first", "SaaS software."],
    "accentLines": [3],
    "lede": "I'm **Swarnim Doegar**, a full-stack engineer. I design and build systems that have to scale and stay secure, and the interfaces people use them through. Currently at **ImageKit**, previously **BrowserStack** and **Juspay**.",
    "primaryCta": { "label": "See the work", "href": "#experience" },
    "secondaryCta": { "label": "Get in touch", "href": "mailto:swarnimdoegar@gmail.com", "icon": "mail" }
  },
  "now": {
    "statements": [
      "Four things cover most of what I do: **design systems that scale, keep them secure, make them faster, and work out why something is broken.** Usually in that order. Sometimes all four at once.",
      "The rest is the half people actually touch. A system nobody can use isn't finished, so I build the interfaces too — and I'd rather they feel obvious than clever."
    ],
    "notes": [
      { "label": "Backend",  "body": "Architecture and scale, security and access, performance, and the unglamorous work of finding what is actually wrong. I package and run what I build, rather than handing it over the wall." },
      { "label": "Frontend", "body": "The screens people work in, and the tools other developers build against. Started in college, part of the job again now." }
    ]
  },
  "contact": {
    "headline": ["Let's", "talk."],
    "blurb": "Open to conversations about scaling backends, securing them, and the products built on top.",
    "links": [
      { "label": "swarnimdoegar@gmail.com",      "href": "mailto:swarnimdoegar@gmail.com",             "icon": "mail" },
      { "label": "github.com/SwarnimDoegar",     "href": "https://github.com/SwarnimDoegar",           "icon": "github" },
      { "label": "in/swarnim-doegar",            "href": "https://www.linkedin.com/in/swarnim-doegar/", "icon": "linkedin" }
    ]
  },
  "education": [
    { "qualification": "B.E. Computer Science", "institution": "Chandigarh University", "period": "2018–2022", "note": "8.10 CGPA" }
  ],
  "languages": ["English", "Hindi"]
}
```

Notes on the design of this file:

- **`headline` is an array of lines.** Line breaks in display type are a typographic
  decision, not something to leave to the browser. One array entry per rendered line.
- **`accentLines`** holds the zero-based indices of the lines painted in the accent
  colour. Currently `[3]` — "SaaS software."
- **`since` is `YYYY-MM`.** The eyebrow string ("Software Engineer II · ImageKit · Since
  Sep 2025") is composed in code from `role`, `company`, and `since`. Nothing to keep in sync.

### `src/data/experience.json`

```json
[
  {
    "company": "ImageKit",
    "title": "Software Engineer II",
    "discipline": "Full stack",
    "location": "Remote",
    "start": "2025-09",
    "end": null,
    "badges": [],
    "highlights": [
      "Built AI-powered asset filtering that reads the user's intent and turns it into filters, so finding the right asset in a large library takes almost no effort.",
      "Added C2PA content credentials to images ImageKit delivers, for EU compliance.",
      "Shipped Angular and Astro SDKs so customers on those frameworks can integrate ImageKit without writing the glue themselves.",
      "Improved UI and UX across the ImageKit dashboard and editor — including the backend APIs built to keep those journeys fast.",
      "Added, improved and fixed bugs across ImageKit's image transformations."
    ]
  },
  {
    "company": "BrowserStack",
    "title": "Senior Software Engineer",
    "discipline": "Backend",
    "location": "Remote",
    "start": "2024-04",
    "end": "2025-09",
    "badges": [],
    "highlights": [
      "Built the backend for customisable test observability dashboards and webhooks, on ClickHouse and Kafka.",
      "Rebuilt the external product data import pipeline — **import times down to 30% of original** — and made it survive failure with retry and continue mechanisms.",
      "Found and removed performance and resource bottlenecks across features and workflows.",
      "Optimised the database queries behind the test management product.",
      "Built out the regression environment and disaster recovery infrastructure."
    ]
  },
  {
    "company": "Juspay",
    "title": "Software Development Engineer",
    "discipline": "Backend",
    "location": "Bangalore",
    "start": "2021-11",
    "end": "2024-04",
    "badges": ["Team Lead"],
    "highlights": [
      "Owned authentication and authorisation for the merchant dashboard — designed **fine-grained access control from scratch** using ACLs and RBAC, giving merchants precise control over permissions inside their own accounts and materially hardening the dashboard.",
      "Worked across other security-critical areas of the dashboard.",
      "Made the merchant gateway integration journeys more robust across multiple gateway backends.",
      "Led the dashboard backend team, Mar 2022 – Dec 2023.",
      "Designed and shipped the REST APIs behind the merchant dashboard.",
      "Cut database query time with targeted SQL optimisation."
    ]
  }
]
```

Notes:

- **`discipline`** is required on every role and renders as a bordered chip beside the
  company name, so a reader can tell at a glance which roles were backend and which were
  full stack. Allowed values: `"Full stack"`, `"Backend"`, `"Frontend"`.
- **Dates are `YYYY-MM`; `end: null` means current.** The renderer derives three things
  from them: the large year marker, the "Sep 2025 — Present" range, and the `Current`
  badge. Ordering is by `start` descending, so a new role prepended or appended lands in
  the right place either way.
- **`badges`** are free-text extras like `"Team Lead"`. `Current` is derived, never authored.

### `src/data/projects.json`

```json
[
  {
    "title": "2nd place — Hyperswitch hackathon",
    "icon": "trophy",
    "tone": "gold",
    "badges": [],
    "body": "Built a Square payments connector into Hyperswitch — integrating Square's payment flows into the platform, written in Rust, in 24 hours.",
    "link": null
  },
  {
    "title": "CU Connect",
    "icon": "users",
    "tone": "accent",
    "badges": ["College · Full stack"],
    "body": "A campus social platform for finding out what was actually happening around Chandigarh University — Django on the back, React Native and TypeScript on the front. Where the both-ends habit started.",
    "link": { "label": "View repository", "href": "https://github.com/SwarnimDoegar/Xenial-Xerus" }
  }
]
```

`tone` selects the card's left rail colour (`gold` or `accent`). Pocket IMS and Chat App
are intentionally dropped.

### `src/data/stack.json`

```json
[
  { "label": "Languages",          "icon": "braces",    "items": ["JavaScript (ES6)", "TypeScript", "PureScript", "Haskell", "Ruby", "C++", "Rust"] },
  { "label": "Backend & security", "icon": "server",    "items": ["Node.js", "Express", "Ruby on Rails", "Django", "Flask", "REST APIs", "ACLs & RBAC", "Authn & authz", "System design"] },
  { "label": "Data & streaming",   "icon": "database",  "items": ["ClickHouse", "Kafka", "PostgreSQL", "MySQL", "MongoDB", "Redis", "Query optimisation"] },
  { "label": "Infrastructure",     "icon": "container", "items": ["Docker", "Kubernetes", "Terraform", "FluxCD", "Jenkins", "AWS", "GCP", "Linux"] },
  { "label": "Observability",      "icon": "activity",  "items": ["Grafana", "Kibana", "Benchmarking", "Profiling"] },
  { "label": "Frontend",           "icon": "gauge",     "items": ["React", "Angular", "Astro", "React Native", "HTML & CSS", "SDK design"] }
]
```

Keep the group count even (currently 6) — the grid resolves to three columns on desktop,
so an odd count leaves a visible hole.

### Inline emphasis in JSON strings

Prose fields (`lede`, `statements`, `notes[].body`, `highlights[]`, `body`) support
**one** markup form: `**bold**`. A build-time helper converts it to `<strong>` and escapes
everything else, so JSON can never inject raw HTML. No other markdown is supported —
attempting `_italic_` or `[links](…)` renders literally.

### Icon names

`icon` fields accept a fixed whitelist enforced by a Zod enum, so a typo fails the build:
`mail`, `github`, `linkedin`, `trophy`, `users`, `braces`, `server`, `database`,
`container`, `activity`, `gauge`, `arrow-up-right`, `map-pin`, `sun`, `moon`.
Lucide supplies all of them except `github` and `linkedin`, which come from Simple Icons
(Lucide removed brand marks in v1).

## Design system

### Colour

Grounds are derived from the slate water in the source photograph; accents are its sun
pushed to full saturation. Two complete themes, both authored — not one inverted.

| Token           | Light     | Dark      | Role                          |
|-----------------|-----------|-----------|-------------------------------|
| `--bg`          | `#E7EBEB` | `#0D1114` | page ground                   |
| `--bg-2`        | `#DBE1E1` | `#141A1E` | recessed / hover              |
| `--surface`     | `#F1F4F3` | `#1A2126` | cards, chips                  |
| `--ink`         | `#12181B` | `#EDF1F2` | primary text                  |
| `--ink-2`       | `#45525A` | `#A5B2B8` | secondary text                |
| `--ink-3`       | `#6A777E` | `#78868D` | metadata                      |
| `--accent`      | `#C8500A` | `#FF8A1F` | accent text, rails            |
| `--gold`        | `#9C6A00` | `#FFC426` | year markers, badges          |
| `--gold-graphic`| `#FF9E12` | `#FFB01A` | graphics only, not text       |

The light ground is deliberately cool slate, not warm cream — cream with a terracotta
accent is the most common generated-design default and was explicitly rejected during
review, as was the earlier warm-brown dark ground.

Contrast: all body and metadata text meets 4.5:1 against its own ground. `--gold-graphic`
is graphics-only because it does not. Anything sitting **on** `--accent` or `--gold` takes
`--bg` as its text colour, never white — white on `#FF8A1F` is roughly 2.3:1.

**Theme mechanics.** Tokens are defined in three places and components read only tokens,
never raw colours:

1. bare `:root` — the complete light palette
2. `@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { … } }`
3. `:root[data-theme="dark"] { … }`

This covers all three viewer states, including the default "system" setting where no
attribute is stamped. The toggle writes `data-theme` to `<html>` and persists to
`localStorage`. A small blocking script in `<head>` applies the stored value before first
paint to prevent a theme flash — this is new in the build; the mockup's toggle does not persist.

### Type

- **Archivo** (variable, 400–700) — display and body.
- **Martian Mono** (variable, 400–600) — section headings, year markers, chips, metadata.

Both self-hosted via Fontsource, no CDN.

| Role             | Size                            | Weight | Tracking  |
|------------------|---------------------------------|--------|-----------|
| Hero display     | `clamp(2.05rem, 5.7vw, 5.3rem)` | 700    | `-0.038em`|
| Contact display  | `clamp(2.4rem, 6.4vw, 5.4rem)`  | 700    | `-0.038em`|
| Statement        | `clamp(1.28rem, 2.7vw, 2rem)`   | 400    | `-0.018em`|
| Company name     | `clamp(1.35rem, 2.6vw, 1.9rem)` | 600    | `-0.025em`|
| Body             | `1rem` / 1.65                   | 400    | —         |
| Section heading  | `0.8rem` mono                   | 600    | `0.15em`  |
| Chip / metadata  | `0.53–0.6rem` mono              | 500    | `0.13em`  |

Section headings are `0.8rem` at `--ink-2`. The first pass used `0.6rem` at `--ink-3`,
which was rejected as too small and too faint.

### Layout

- Content column: `min(1180px, 100% - 2.5rem)`.
- Section rhythm: `padding-block: clamp(3.75rem, 7.5vh, 6rem)`.
- Sibling groups use flex/grid `gap`, never per-element margins.
- Breakpoints: 860px (hero and two-column stack), 800px (nav links hide, toggle takes the
  right edge), 700px (experience rows stack).

**Hero.** Two columns, `1.4fr / 0.6fr`, bottom-aligned onto a horizon rule that spans the
full content width. The portrait cell is `align-self: stretch` and the image is
`height: 100%; object-fit: contain; object-position: bottom center`, so **the portrait's
height is driven by the headline block's height**. Below 860px there is no row to stretch
against, so the image reverts to width-based sizing at `max-width: 250px`.

**Experience rows.** `grid-template-columns: 8.5rem 1fr` with `align-items: baseline`, so
the large year marker and the company name share a baseline. The first row has no
top border — the section heading's underline serves as that rule. Two parallel rules
30px apart was a bug in the first pass.

### Signature

The page is one sunset. A fixed, very faint warm radial wash sits behind all content and
descends as the document scrolls, while a second warm layer rises from below — so light
drains down the page from top to bottom. Both are driven by
`animation-timeline: scroll(root block)`, which runs on the compositor.

The wash is intentionally near-invisible (10–13% alpha). At higher opacity it hazes the
cool ground brown, which defeats the palette. There is **no glow behind the portrait** —
that was tried and cut.

### Motion

- Section reveals: `animation-timeline: view()`, `animation-range: entry 4% cover 26%`.
- Fallback for browsers without scroll-driven animations: IntersectionObserver adding a
  `.seen` class, behind `@supports not (animation-timeline: view())`.
- Smooth scrolling: Lenis (~3kb).
- Everything motion-related sits inside `@media (prefers-reduced-motion: no-preference)`.
  With reduced motion requested, content renders in its final state immediately.

## Architecture

Astro 5, zero client framework, static output.

```
├─ astro.config.mjs
├─ package.json
├─ public/
│  ├─ portrait.webp            # 900×1209, trimmed, ~130KB
│  ├─ og.png
│  └─ favicon.svg
├─ src/
│  ├─ content.config.ts        # Zod schemas + file() loaders  ← validation lives here
│  ├─ data/
│  │  ├─ profile.json
│  │  ├─ experience.json
│  │  ├─ projects.json
│  │  └─ stack.json
│  ├─ layouts/Base.astro       # head, meta, fonts, theme bootstrap, Sky
│  ├─ components/
│  │  ├─ Nav.astro
│  │  ├─ ThemeToggle.astro
│  │  ├─ Sky.astro
│  │  ├─ SectionHeading.astro
│  │  ├─ Hero.astro
│  │  ├─ Now.astro
│  │  ├─ Experience.astro
│  │  ├─ Role.astro
│  │  ├─ Work.astro
│  │  ├─ HighlightCard.astro
│  │  ├─ Stack.astro
│  │  ├─ Contact.astro
│  │  └─ Prose.astro           # renders **bold** safely
│  ├─ lib/
│  │  ├─ dates.ts              # YYYY-MM → year marker, range label, isCurrent
│  │  └─ inline.ts             # **bold** → <strong>, escaping everything else
│  ├─ styles/
│  │  ├─ tokens.css            # the three theme blocks, nothing else
│  │  └─ global.css
│  └─ pages/index.astro
└─ .github/workflows/deploy.yml
```

Each component reads one slice of data and owns its own scoped styles. `tokens.css` is the
single place any colour is defined.

Dependencies: `astro`, `@fontsource-variable/archivo`, `@fontsource-variable/martian-mono`,
`astro-icon`, `@iconify-json/lucide`, `@iconify-json/simple-icons`, `lenis`.

## Deployment

GitHub Pages via GitHub Actions building to `dist/`.

The existing site is served from the repository root at
`https://swarnimdoegar.github.io/Portfolio/`, so unless a custom domain or a rename to
`swarnimdoegar.github.io` happens, `astro.config.mjs` needs:

```js
site: 'https://swarnimdoegar.github.io',
base: '/Portfolio',
```

Getting `base` wrong is the single most likely cause of a deployed site with no CSS. All
internal asset references must go through Astro's helpers rather than hardcoded absolute
paths. Pages must also be switched from "deploy from branch" to "GitHub Actions" in the
repository settings — a manual step outside the code.

The old `index.html`, `styles/`, `scripts/`, and `res/` are deleted in this migration. Git
history retains them.

## Accessibility floor

- Visible `:focus-visible` on every interactive element.
- `prefers-reduced-motion` respected throughout.
- Semantic landmarks: `<nav>`, `<main>`, `<section>` with headings, `<footer>`.
- A skip link to `#main` — absent from the mockup, added in the build.
- The portrait carries a real `alt`; the sky layer is `aria-hidden`.
- Theme toggle is a `<button>` with an `aria-label` that states the action.

## Verification

1. `astro build` succeeds; `astro preview` renders.
2. **JSON validation actually fails loudly** — temporarily break a required field and a
   date format, confirm the build errors with a useful message, then revert. This is the
   feature being bought; it gets tested explicitly.
3. Screenshots in both themes at 1440px, 860px, and 500px.
4. Contrast audit of every text/ground pair against the table above.
5. Keyboard-only pass through nav, toggle, CTAs and both project cards.
6. Reduced-motion pass with the OS setting on.
7. Deployed URL loads with styles, fonts, portrait and both themes intact.

## Risks

- **Lenis vs. scroll-driven animations.** Lenis drives real document scroll, so
  `scroll()` and `view()` timelines should work — but this combination must be verified
  early. If reveals stop firing, drop Lenis; native smooth scroll is the lesser loss.
- **`@fontsource-variable/martian-mono` may not exist.** If there is no variable package,
  fall back to static `@fontsource/martian-mono` at the two weights used (500, 600).
- **Safari support for scroll-driven animations** is recent. The IntersectionObserver
  fallback covers reveals; the sunset wash simply sits static there, which is acceptable.
- **`base: '/Portfolio'`** breaks assets if any path is hardcoded.

## Open question

The timeline reads BrowserStack *Senior Software Engineer* → ImageKit *Software Engineer II*,
which scans as a step down even though levelling differs between companies. Worth a line of
framing, or leave as-is. Not blocking; the data is accurate either way.
