# Design notes

## Colour

Sampled from a sunset photo, then pushed. The grounds come from the slate water in the
photo, the accents are its sun at full brightness. Two complete themes, both authored.

| Token | Light | Dark | Role |
| --- | --- | --- | --- |
| `--bg` | `#e7ebeb` | `#0d1114` | page ground |
| `--bg-2` | `#dbe1e1` | `#141a1e` | recessed, hover |
| `--surface` | `#f1f4f3` | `#1a2126` | cards, chips |
| `--ink` | `#12181b` | `#edf1f2` | primary text |
| `--ink-2` | `#45525a` | `#a5b2b8` | secondary text |
| `--ink-3` | `#6a777e` | `#78868d` | metadata |
| `--accent` | `#c8500a` | `#ff8a1f` | accent text, rails |
| `--gold` | `#9c6a00` | `#ffc426` | year markers, badges |
| `--gold-graphic` | `#ff9e12` | `#ffb01a` | graphics only, never text |

Two rules that matter:

- The light ground is cool slate, deliberately not warm cream. Cream with a terracotta
  accent is the default look every AI design tool reaches for, and it was rejected in review.
- Anything sitting **on** `--accent` or `--gold` takes `--bg` as its text colour, never
  white. White on `#ff8a1f` is about 2.3:1.

Every colour lives in `src/styles/tokens.css`. Components read tokens and never literals.

Tokens are defined three times so all three viewer states work, including the default
"system" setting where no attribute is stamped:

1. bare `:root` for the complete light palette
2. `@media (prefers-color-scheme: dark) { :root:not([data-theme='light']) }`
3. `:root[data-theme='dark']`

The toggle writes `data-theme` to `<html>` and saves to `localStorage`. A small blocking
script in `<head>` applies the stored value before first paint so the theme does not flash.

## Type

Archivo for display and body, Martian Mono for section headings, year markers, chips and
metadata. Both self-hosted through Fontsource, no CDN.

Font stacks live in `tokens.css` as `--font-sans` and `--font-mono`. Never repeat a stack
in a component.

## Layout

Content column is `min(1180px, 100% - 2.5rem)`. Section rhythm is
`padding-block: clamp(3.75rem, 7.5vh, 6rem)`. Breakpoints: 860px, 800px, 700px.

Two pieces of layout are less obvious than they look:

- **Hero portrait.** The portrait cell is `align-self: stretch` and the image is
  `height: 100%; object-fit: contain`, so its height is driven by the headline block beside
  it. Below 860px there is no row to stretch against, so it reverts to width-based sizing.
- **Experience rows.** `align-items: baseline` puts the large year marker and the company
  name on a shared baseline. The first row has no top border, because the section heading's
  underline already serves as that rule. Two parallel lines 30px apart was a bug.

## Signature

The page is one sunset. A fixed, very faint warm wash sits behind all content and descends
as the document scrolls, while a second warm layer rises from below, so light drains down
the page. Both run on `animation-timeline: scroll(root block)`, on the compositor.

The wash is intentionally near-invisible, 10 to 13% alpha. Any stronger and it hazes the
cool ground brown, which defeats the palette. There is no glow behind the portrait. That
was tried and cut.

## Motion

Reveals use `animation-timeline: view()`, with an IntersectionObserver fallback behind
`@supports not (animation-timeline: view())` for Safari. Lenis handles smooth scrolling.
Everything motion-related sits inside `@media (prefers-reduced-motion: no-preference)`.

## Gotcha worth remembering

Astro scopes styles per component. A class passed into a child component, like
`<Prose class="lede" />`, will **not** match a plain `.lede` rule in the parent, because
the rendered element carries the child's scope ID. Those rules need `:global(.lede)`.
This silently broke the lede, the Now statements and the contact blurb on first build.

## Deliberately not on the site

Home address and phone number. A public portfolio is scraped continuously. Email plus
LinkedIn is the whole contact surface.
