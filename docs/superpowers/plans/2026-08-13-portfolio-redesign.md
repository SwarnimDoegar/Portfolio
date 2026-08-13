# Portfolio Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the 2020-era flip-card portfolio with a static Astro single-page site whose entire content lives in four hand-editable, build-validated JSON files.

**Architecture:** Astro 5 with zero client framework and static output. Four JSON files under `src/data/` are imported and validated by Zod in `src/lib/content.ts` at build time — a bad edit fails the build with the file and field named. Two pure helper modules (`dates.ts`, `inline.ts`) hold all the logic and are unit-tested with Vitest. Astro components are thin presentation over that validated data. Colour lives only in `tokens.css` as three theme blocks; components read tokens and never literals.

**Tech Stack:** Astro 5, TypeScript, Zod, Vitest, Fontsource (Archivo + Martian Mono), astro-icon with Iconify Lucide + Simple Icons, Lenis. Deployed to GitHub Pages via GitHub Actions.

**Reference:** Design spec at `docs/superpowers/specs/2026-08-13-portfolio-redesign-design.md`. Approved visual reference at `docs/superpowers/specs/2026-08-13-portfolio-mockup.html` — open it in a browser and match it. It is the source of truth for every colour, size, and string.

## Global Constraints

- **Node 20+.** Astro 5 requires it.
- **Static output only.** No SSR adapter, no server islands, no client-side framework.
- **Zero colour literals in `src/**/*.astro` and `src/**/*.css` outside `src/styles/tokens.css`.** Every colour is a `var(--token)`. A reviewer rejecting one thing should reject this. `public/favicon.svg` is exempt — a standalone SVG asset cannot read page CSS variables; it carries a comment naming the token each hex mirrors.
- **Never repeat a font stack in a component.** Use `var(--font-sans)` / `var(--font-mono)`, both defined in `tokens.css`.
- **Three theme blocks, always.** Tokens are defined in bare `:root` (light), `@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) }`, and `:root[data-theme="dark"]`. Never define a colour only inside a media or attribute block.
- **Text on `--accent` or `--gold` uses `--bg`, never white.** White on `#FF8A1F` is ~2.3:1.
- **All motion sits inside `@media (prefers-reduced-motion: no-preference)`.**
- **Content column:** `width: min(1180px, 100% - 2.5rem); margin-inline: auto`.
- **Section rhythm:** `padding-block: clamp(3.75rem, 7.5vh, 6rem)`.
- **Breakpoints:** 860px, 800px, 700px. No others.
- **JSON prose supports `**bold**` and nothing else.** All rendering of JSON strings into HTML goes through `renderInline()`. Never use `set:html` on raw JSON.
- **No home address, no phone number anywhere in the site or data files.**
- **Fonts self-hosted via Fontsource.** No font CDN links — a strict CSP would silently fall back.
- **British spelling in copy** ("optimised", "authorisation") — matches the approved mockup.
- **Commit after every task.**

---

### Task 1: Scaffold the Astro project and remove the old site

**Files:**
- Create: `package.json`, `astro.config.mjs`, `tsconfig.json`, `.gitignore`, `vitest.config.ts`
- Create: `src/pages/index.astro`
- Create: `public/portrait.webp`
- Delete: `index.html`, `styles/main.css`, `styles/scrollbar.css`, `scripts/index.js`, `scripts/pages.js`, `scripts/projectList.js`, `scripts/certificates.js`, `res/me.jpeg`, `res/skillcloud.png`, `res/github.png`, `res/linkedin.png`, `res/email.png`

**Interfaces:**
- Consumes: nothing.
- Produces: a buildable Astro project. `npm run build` emits `dist/`. `npm test` runs Vitest.

- [ ] **Step 1: Initialise package.json**

Create `package.json`:

```json
{
  "name": "swarnim-portfolio",
  "type": "module",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview",
    "check": "astro check",
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```

- [ ] **Step 2: Install dependencies**

```bash
npm install astro zod astro-icon @iconify-json/lucide @iconify-json/simple-icons \
  @fontsource-variable/archivo lenis
npm install -D vitest typescript @astrojs/check
```

Then install the mono face. Try the variable package first and fall back if it does not exist:

```bash
npm install @fontsource-variable/martian-mono || npm install @fontsource/martian-mono
```

Record which one resolved — Task 6 imports it by name.

- [ ] **Step 3: Configure Astro**

Create `astro.config.mjs`. The `base` is required because the site is served from
`https://swarnimdoegar.github.io/Portfolio/`:

```js
import { defineConfig } from 'astro/config';
import icon from 'astro-icon';

export default defineConfig({
  site: 'https://swarnimdoegar.github.io',
  base: '/Portfolio',
  output: 'static',
  trailingSlash: 'ignore',
  integrations: [icon({ include: { lucide: ['*'], 'simple-icons': ['github', 'linkedin'] } })],
});
```

- [ ] **Step 4: Configure TypeScript and Vitest**

Create `tsconfig.json`:

```json
{
  "extends": "astro/tsconfigs/strict",
  "include": [".astro/types.d.ts", "**/*"],
  "exclude": ["dist"]
}
```

Create `vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node',
  },
});
```

Create `.gitignore`:

```
node_modules/
dist/
.astro/
.DS_Store
*.log
```

- [ ] **Step 5: Add a placeholder page so the build has something to emit**

Create `src/pages/index.astro`:

```astro
---
---
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Swarnim Doegar</title>
  </head>
  <body>
    <p>Scaffold.</p>
  </body>
</html>
```

- [ ] **Step 6: Add the portrait asset**

Copy the processed portrait into `public/`. It is a trimmed 900×1209 WebP, roughly 130KB:

```bash
mkdir -p public
magick ~/Downloads/final-portfolio-image.png -trim +repage -resize 900x /tmp/portrait.png
cwebp -q 88 -alpha_q 95 /tmp/portrait.png -o public/portrait.webp
identify public/portrait.webp
```

Expected: `900x1209`. If `~/Downloads/final-portfolio-image.png` is gone, extract the
inlined base64 from the reference mockup instead:

```bash
python3 -c "
import base64, re, pathlib
html = pathlib.Path('docs/superpowers/specs/2026-08-13-portfolio-mockup.html').read_text()
b64 = re.search(r'data:image/webp;base64,([A-Za-z0-9+/=]+)', html).group(1)
pathlib.Path('public/portrait.webp').write_bytes(base64.b64decode(b64))
print('extracted')
"
```

- [ ] **Step 7: Verify the build works**

```bash
npm run build
```

Expected: build succeeds, `dist/index.html` exists.

```bash
npm test
```

Expected: Vitest reports "No test files found" and exits 0 (it is configured with
`include` but no tests exist yet; this confirms the runner is wired).

- [ ] **Step 8: Delete the old site**

```bash
git rm -r index.html styles scripts res
```

Git history retains them. `README.md` stays.

- [ ] **Step 9: Verify the build still works after deletion**

```bash
npm run build && ls dist/index.html
```

Expected: succeeds.

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "chore: scaffold Astro project, remove 2020 flip-card site"
```

---

### Task 2: Date helpers

All three date strings on the page (the large year marker, the "Sep 2025 — Present" range,
and the `Current` badge) derive from two `YYYY-MM` fields, so nothing can drift out of sync.

**Files:**
- Create: `src/lib/dates.ts`
- Test: `src/lib/dates.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `formatMonthYear(value: string): string` — `"2025-09"` → `"Sep 2025"`
  - `formatRange(start: string, end: string | null): string` — → `"Sep 2025 — Present"`
  - `yearMarker(start: string): string` — `"2025-09"` → `"2025"`
  - `isCurrent(end: string | null): boolean`
  - `compareByStartDesc(a: { start: string }, b: { start: string }): number`
  - Throws `Error` on malformed input.

- [ ] **Step 1: Write the failing tests**

Create `src/lib/dates.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import {
  compareByStartDesc,
  formatMonthYear,
  formatRange,
  isCurrent,
  yearMarker,
} from './dates';

describe('formatMonthYear', () => {
  it('formats a year-month as abbreviated month and year', () => {
    expect(formatMonthYear('2025-09')).toBe('Sep 2025');
    expect(formatMonthYear('2021-11')).toBe('Nov 2021');
    expect(formatMonthYear('2024-01')).toBe('Jan 2024');
    expect(formatMonthYear('2024-12')).toBe('Dec 2024');
  });

  it('rejects a malformed value', () => {
    expect(() => formatMonthYear('2025-9')).toThrow(/YYYY-MM/);
    expect(() => formatMonthYear('2025')).toThrow(/YYYY-MM/);
    expect(() => formatMonthYear('Sep 2025')).toThrow(/YYYY-MM/);
    expect(() => formatMonthYear('')).toThrow(/YYYY-MM/);
  });

  it('rejects an out-of-range month', () => {
    expect(() => formatMonthYear('2025-13')).toThrow(/YYYY-MM/);
    expect(() => formatMonthYear('2025-00')).toThrow(/YYYY-MM/);
  });
});

describe('formatRange', () => {
  it('joins start and end with an em dash', () => {
    expect(formatRange('2024-04', '2025-09')).toBe('Apr 2024 — Sep 2025');
  });

  it('renders a null end as Present', () => {
    expect(formatRange('2025-09', null)).toBe('Sep 2025 — Present');
  });
});

describe('yearMarker', () => {
  it('returns the start year', () => {
    expect(yearMarker('2025-09')).toBe('2025');
    expect(yearMarker('2021-11')).toBe('2021');
  });
});

describe('isCurrent', () => {
  it('is true only when end is null', () => {
    expect(isCurrent(null)).toBe(true);
    expect(isCurrent('2025-09')).toBe(false);
  });
});

describe('compareByStartDesc', () => {
  it('sorts most recent first', () => {
    const roles = [
      { start: '2021-11' },
      { start: '2025-09' },
      { start: '2024-04' },
    ];
    expect(roles.sort(compareByStartDesc).map((r) => r.start)).toEqual([
      '2025-09',
      '2024-04',
      '2021-11',
    ]);
  });

  it('orders months correctly inside the same year', () => {
    const roles = [{ start: '2024-02' }, { start: '2024-11' }];
    expect(roles.sort(compareByStartDesc).map((r) => r.start)).toEqual([
      '2024-11',
      '2024-02',
    ]);
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run src/lib/dates.test.ts`
Expected: FAIL — cannot resolve `./dates`.

- [ ] **Step 3: Implement the module**

Create `src/lib/dates.ts`:

```ts
const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
] as const;

const YEAR_MONTH = /^(\d{4})-(0[1-9]|1[0-2])$/;

function parse(value: string): { year: number; month: number } {
  const match = YEAR_MONTH.exec(value);
  if (!match) {
    throw new Error(`Expected a date in YYYY-MM form (e.g. "2025-09"), received ${JSON.stringify(value)}`);
  }
  return { year: Number(match[1]), month: Number(match[2]) };
}

export function formatMonthYear(value: string): string {
  const { year, month } = parse(value);
  return `${MONTHS[month - 1]} ${year}`;
}

export function formatRange(start: string, end: string | null): string {
  const tail = end === null ? 'Present' : formatMonthYear(end);
  return `${formatMonthYear(start)} — ${tail}`;
}

export function yearMarker(start: string): string {
  return String(parse(start).year);
}

export function isCurrent(end: string | null): boolean {
  return end === null;
}

export function compareByStartDesc(a: { start: string }, b: { start: string }): number {
  const left = parse(a.start);
  const right = parse(b.start);
  return right.year - left.year || right.month - left.month;
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run src/lib/dates.test.ts`
Expected: PASS, 8 tests.

- [ ] **Step 5: Commit**

```bash
git add src/lib/dates.ts src/lib/dates.test.ts
git commit -m "feat: add date helpers deriving all role date strings from YYYY-MM"
```

---

### Task 3: Inline markup renderer

This is the single place JSON strings become HTML, so it is also the only place an XSS
could enter. Escaping happens **before** bold conversion, and the tests lock that ordering in.

**Files:**
- Create: `src/lib/inline.ts`
- Test: `src/lib/inline.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `renderInline(input: string): string` — escapes HTML, then converts `**bold**` to `<strong>`. Returns a string safe to pass to Astro's `set:html`.

- [ ] **Step 1: Write the failing tests**

Create `src/lib/inline.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { renderInline } from './inline';

describe('renderInline', () => {
  it('passes plain text through unchanged', () => {
    expect(renderInline('A system nobody can use.')).toBe('A system nobody can use.');
  });

  it('converts double asterisks to strong', () => {
    expect(renderInline('import times **down to 30%** of original')).toBe(
      'import times <strong>down to 30%</strong> of original',
    );
  });

  it('converts several bold runs in one string', () => {
    expect(renderInline('**one** and **two**')).toBe(
      '<strong>one</strong> and <strong>two</strong>',
    );
  });

  it('escapes HTML so JSON cannot inject markup', () => {
    expect(renderInline('<script>alert(1)</script>')).toBe(
      '&lt;script&gt;alert(1)&lt;/script&gt;',
    );
    expect(renderInline('a & b')).toBe('a &amp; b');
    expect(renderInline(`he said "hi"`)).toBe('he said &quot;hi&quot;');
    expect(renderInline("it's")).toBe('it&#39;s');
  });

  it('escapes before emphasising, so tags inside bold stay inert', () => {
    expect(renderInline('**<b>x</b>**')).toBe('<strong>&lt;b&gt;x&lt;/b&gt;</strong>');
  });

  it('leaves an unmatched delimiter literal', () => {
    expect(renderInline('2 ** 8 is 256')).toBe('2 ** 8 is 256');
    expect(renderInline('**unclosed')).toBe('**unclosed');
  });

  it('does not treat single asterisks as emphasis', () => {
    expect(renderInline('*not italic*')).toBe('*not italic*');
  });

  it('ignores an empty bold run rather than emitting an empty tag', () => {
    expect(renderInline('****')).toBe('****');
  });

  it('handles an empty string', () => {
    expect(renderInline('')).toBe('');
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run src/lib/inline.test.ts`
Expected: FAIL — cannot resolve `./inline`.

- [ ] **Step 3: Implement the module**

Create `src/lib/inline.ts`:

```ts
const ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => ESCAPES[char]!);
}

/**
 * Renders a JSON prose string as HTML.
 *
 * Supports exactly one markup form: `**bold**`. Everything else is escaped,
 * so content files can never inject markup. Escaping runs first, which is why
 * `**<b>x</b>**` yields inert text inside a <strong>.
 */
export function renderInline(input: string): string {
  // `[^*]` in the capture keeps runs from spanning a delimiter, so an
  // unmatched `**` stays literal instead of swallowing the rest of the line.
  return escapeHtml(input).replace(/\*\*([^*]+?)\*\*/g, '<strong>$1</strong>');
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run src/lib/inline.test.ts`
Expected: PASS, 9 tests.

- [ ] **Step 5: Commit**

```bash
git add src/lib/inline.ts src/lib/inline.test.ts
git commit -m "feat: add inline renderer supporting **bold** with HTML escaping"
```

---

### Task 4: Content data files and Zod validation

The deliverable the user actually asked for: four JSON files that are the whole editing
surface, and validation that fails the build loudly when one is wrong.

**Files:**
- Create: `src/data/profile.json`, `src/data/experience.json`, `src/data/projects.json`, `src/data/stack.json`
- Create: `src/lib/content.ts`
- Test: `src/lib/content.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `profileSchema`, `experienceSchema`, `projectsSchema`, `stackSchema` — Zod schemas.
  - `ICON_NAMES: readonly string[]`
  - `profile: Profile`, `experience: Role[]`, `projects: Project[]`, `stack: StackGroup[]` — validated, and `experience` already sorted most-recent-first.
  - Types `Profile`, `Role`, `Project`, `StackGroup`, `IconName`, `Link`.
  - `parseOrThrow<T>(schema, data, filename): T` — throws with the filename and the field path.

- [ ] **Step 1: Write the failing tests**

Create `src/lib/content.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import {
  experience,
  experienceSchema,
  parseOrThrow,
  profile,
  profileSchema,
  projects,
  stack,
  stackSchema,
} from './content';

describe('shipped data', () => {
  it('validates every data file', () => {
    expect(profile.name).toBe('Swarnim Doegar');
    expect(experience.length).toBeGreaterThanOrEqual(3);
    expect(projects.length).toBeGreaterThanOrEqual(1);
    expect(stack.length).toBeGreaterThanOrEqual(1);
  });

  it('sorts experience most recent first', () => {
    const starts = experience.map((role) => role.start);
    expect(starts).toEqual([...starts].sort().reverse());
    expect(experience[0]!.company).toBe('ImageKit');
  });

  it('marks exactly one role as current', () => {
    expect(experience.filter((role) => role.end === null)).toHaveLength(1);
  });

  it('gives every role a discipline', () => {
    for (const role of experience) {
      expect(['Full stack', 'Backend', 'Frontend']).toContain(role.discipline);
    }
  });

  it('keeps the stack group count even so the grid has no hole', () => {
    expect(stack.length % 2).toBe(0);
  });

  it('contains no phone number or street address', () => {
    const blob = JSON.stringify({ profile, experience, projects, stack });
    expect(blob).not.toMatch(/\+?\d{10}/);
    expect(blob).not.toMatch(/7624832143/);
    expect(blob).not.toMatch(/Silver City/i);
  });
});

describe('parseOrThrow', () => {
  it('names the file and the field path when validation fails', () => {
    expect(() =>
      parseOrThrow(experienceSchema, [{ company: 'Acme' }], 'experience.json'),
    ).toThrow(/experience\.json/);
    expect(() =>
      parseOrThrow(experienceSchema, [{ company: 'Acme' }], 'experience.json'),
    ).toThrow(/title/);
  });
});

describe('profileSchema', () => {
  const valid = () => structuredClone(profile);

  it('rejects a since value that is not YYYY-MM', () => {
    const bad = valid();
    (bad as { since: string }).since = 'Sep 2025';
    expect(() => profileSchema.parse(bad)).toThrow();
  });

  it('rejects an accentLines index past the end of the headline', () => {
    const bad = valid();
    bad.hero.accentLines = [99];
    expect(() => profileSchema.parse(bad)).toThrow(/accentLines/);
  });

  it('rejects an unknown icon name', () => {
    const bad = valid();
    (bad.contact.links[0] as { icon: string }).icon = 'telegram';
    expect(() => profileSchema.parse(bad)).toThrow();
  });

  it('rejects an empty headline', () => {
    const bad = valid();
    bad.hero.headline = [];
    expect(() => profileSchema.parse(bad)).toThrow();
  });
});

describe('experienceSchema', () => {
  it('rejects a role whose end precedes its start', () => {
    expect(() =>
      experienceSchema.parse([
        {
          company: 'Acme',
          title: 'Engineer',
          discipline: 'Backend',
          location: 'Remote',
          start: '2025-09',
          end: '2024-01',
          badges: [],
          highlights: ['Did a thing.'],
        },
      ]),
    ).toThrow(/end/);
  });

  it('rejects a role with no highlights', () => {
    expect(() =>
      experienceSchema.parse([
        {
          company: 'Acme',
          title: 'Engineer',
          discipline: 'Backend',
          location: 'Remote',
          start: '2025-09',
          end: null,
          badges: [],
          highlights: [],
        },
      ]),
    ).toThrow();
  });
});

describe('stackSchema', () => {
  it('rejects a group with no items', () => {
    expect(() =>
      stackSchema.parse([{ label: 'Empty', icon: 'braces', items: [] }]),
    ).toThrow();
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run src/lib/content.test.ts`
Expected: FAIL — cannot resolve `./content`.

- [ ] **Step 3: Create the four data files**

Copy the exact JSON from the spec's "Content model" section into:
- `src/data/profile.json`
- `src/data/experience.json`
- `src/data/projects.json`
- `src/data/stack.json`

The spec's JSON blocks are complete and final — copy them verbatim, do not paraphrase the
copy. Verify each parses:

```bash
for f in src/data/*.json; do python3 -c "import json,sys; json.load(open('$f')); print('ok $f')"; done
```

- [ ] **Step 4: Implement the validation module**

Create `src/lib/content.ts`:

```ts
import { z } from 'zod';

import profileData from '../data/profile.json';
import experienceData from '../data/experience.json';
import projectsData from '../data/projects.json';
import stackData from '../data/stack.json';
import { compareByStartDesc } from './dates';

/** Icons resolvable through astro-icon. Adding one here means adding it to the
 *  Icon component's allowed set too — a typo must fail the build, not render blank. */
export const ICON_NAMES = [
  'mail', 'github', 'linkedin', 'trophy', 'users', 'braces', 'server',
  'database', 'container', 'activity', 'gauge', 'arrow-up-right',
  'map-pin', 'sun', 'moon',
] as const;

const iconName = z.enum(ICON_NAMES);

const yearMonth = z
  .string()
  .regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'expected a date in YYYY-MM form, e.g. "2025-09"');

const nonEmpty = z.string().min(1);

const linkSchema = z.object({
  label: nonEmpty,
  href: nonEmpty,
  icon: iconName.optional(),
});

const disciplineSchema = z.enum(['Full stack', 'Backend', 'Frontend']);

export const profileSchema = z
  .object({
    name: nonEmpty,
    role: nonEmpty,
    company: nonEmpty,
    since: yearMonth,
    discipline: disciplineSchema,
    location: nonEmpty,
    workMode: nonEmpty,
    yearsExperience: nonEmpty,
    hero: z.object({
      headline: z.array(nonEmpty).min(1),
      accentLines: z.array(z.number().int().nonnegative()),
      lede: nonEmpty,
      primaryCta: linkSchema,
      secondaryCta: linkSchema,
    }),
    now: z.object({
      statements: z.array(nonEmpty).min(1),
      notes: z.array(z.object({ label: nonEmpty, body: nonEmpty })).min(1),
    }),
    contact: z.object({
      headline: z.array(nonEmpty).min(1),
      blurb: nonEmpty,
      links: z.array(linkSchema).min(1),
    }),
    education: z.array(
      z.object({
        qualification: nonEmpty,
        institution: nonEmpty,
        period: nonEmpty,
        note: z.string().optional(),
      }),
    ),
    languages: z.array(nonEmpty),
  })
  .superRefine((value, ctx) => {
    for (const index of value.hero.accentLines) {
      if (index >= value.hero.headline.length) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['hero', 'accentLines'],
          message: `index ${index} has no matching headline line (headline has ${value.hero.headline.length})`,
        });
      }
    }
  });

const roleSchema = z
  .object({
    company: nonEmpty,
    title: nonEmpty,
    discipline: disciplineSchema,
    location: nonEmpty,
    start: yearMonth,
    end: yearMonth.nullable(),
    badges: z.array(nonEmpty),
    highlights: z.array(nonEmpty).min(1),
  })
  .superRefine((value, ctx) => {
    if (value.end !== null && value.end < value.start) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['end'],
        message: `end (${value.end}) precedes start (${value.start})`,
      });
    }
  });

export const experienceSchema = z.array(roleSchema).min(1);

const projectSchema = z.object({
  title: nonEmpty,
  icon: iconName,
  tone: z.enum(['gold', 'accent']),
  badges: z.array(nonEmpty),
  body: nonEmpty,
  link: linkSchema.nullable(),
});

export const projectsSchema = z.array(projectSchema).min(1);

const stackGroupSchema = z.object({
  label: nonEmpty,
  icon: iconName,
  items: z.array(nonEmpty).min(1),
});

export const stackSchema = z.array(stackGroupSchema).min(1);

export type IconName = z.infer<typeof iconName>;
export type Link = z.infer<typeof linkSchema>;
export type Profile = z.infer<typeof profileSchema>;
export type Role = z.infer<typeof roleSchema>;
export type Project = z.infer<typeof projectSchema>;
export type StackGroup = z.infer<typeof stackGroupSchema>;

/** Validates one data file, failing the build with the file and field named. */
export function parseOrThrow<T extends z.ZodTypeAny>(
  schema: T,
  data: unknown,
  filename: string,
): z.infer<T> {
  const result = schema.safeParse(data);
  if (result.success) return result.data;

  const detail = result.error.issues
    .map((issue) => `  - ${issue.path.join('.') || '(root)'}: ${issue.message}`)
    .join('\n');
  throw new Error(`src/data/${filename} is invalid:\n${detail}`);
}

export const profile = parseOrThrow(profileSchema, profileData, 'profile.json');
export const projects = parseOrThrow(projectsSchema, projectsData, 'projects.json');
export const stack = parseOrThrow(stackSchema, stackData, 'stack.json');
export const experience = parseOrThrow(
  experienceSchema,
  experienceData,
  'experience.json',
).sort(compareByStartDesc);
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npx vitest run src/lib/content.test.ts`
Expected: PASS, 13 tests.

- [ ] **Step 6: Verify validation actually fails the build**

This is the feature being bought, so prove it:

```bash
python3 -c "
import json, pathlib
p = pathlib.Path('src/data/experience.json')
d = json.loads(p.read_text()); d[0].pop('title')
p.write_text(json.dumps(d, indent=2))
"
npx vitest run src/lib/content.test.ts
```

Expected: FAIL with a message containing `src/data/experience.json is invalid:` and
`- 0.title: Required`.

Now restore and confirm green:

```bash
git checkout src/data/experience.json
npx vitest run src/lib/content.test.ts
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/data src/lib/content.ts src/lib/content.test.ts
git commit -m "feat: add JSON content files with Zod validation at build time"
```

---

### Task 5: Design tokens and global styles

**Files:**
- Create: `src/styles/tokens.css`
- Create: `src/styles/global.css`

**Interfaces:**
- Consumes: nothing.
- Produces: every CSS custom property the components use — `--bg`, `--bg-2`, `--surface`, `--ink`, `--ink-2`, `--ink-3`, `--rule`, `--rule-firm`, `--accent`, `--gold`, `--gold-graphic`, `--sun-halo`, `--after`, `--scrim`. Plus base element styles, the `.wrap` container, `.mono`, and `section` rhythm.

- [ ] **Step 1: Write the token file**

Create `src/styles/tokens.css`. Values are copied from the spec's colour table; the three
blocks cover all three viewer theme states:

```css
:root {
  /* Typefaces — not theme-dependent, so defined once here. Components use
     var(--font-mono) / var(--font-sans); the stack is never repeated. */
  --font-sans: 'Archivo Variable', 'Archivo', ui-sans-serif, system-ui, sans-serif;
  --font-mono: 'Martian Mono Variable', 'Martian Mono', ui-monospace, SFMono-Regular, monospace;

  /* LIGHT — cool slate ground, bright orange light on top of it */
  --bg:        #E7EBEB;
  --bg-2:      #DBE1E1;
  --surface:   #F1F4F3;
  --ink:       #12181B;
  --ink-2:     #45525A;
  --ink-3:     #6A777E;
  --rule:      rgba(18, 24, 27, 0.14);
  --rule-firm: rgba(18, 24, 27, 0.28);
  --accent:    #C8500A;
  --gold:      #9C6A00;
  --gold-graphic: #FF9E12;
  --sun-halo:  rgba(255, 150, 20, 0.12);
  --after:     rgba(255, 110, 0, 0.11);
  --scrim:     rgba(231, 235, 235, 0.84);
  color-scheme: light;
}

@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    --bg:        #0D1114;
    --bg-2:      #141A1E;
    --surface:   #1A2126;
    --ink:       #EDF1F2;
    --ink-2:     #A5B2B8;
    --ink-3:     #78868D;
    --rule:      rgba(237, 241, 242, 0.13);
    --rule-firm: rgba(237, 241, 242, 0.30);
    --accent:    #FF8A1F;
    --gold:      #FFC426;
    --gold-graphic: #FFB01A;
    --sun-halo:  rgba(255, 160, 30, 0.10);
    --after:     rgba(255, 110, 0, 0.13);
    --scrim:     rgba(13, 17, 20, 0.84);
    color-scheme: dark;
  }
}

:root[data-theme="dark"] {
  --bg:        #0D1114;
  --bg-2:      #141A1E;
  --surface:   #1A2126;
  --ink:       #EDF1F2;
  --ink-2:     #A5B2B8;
  --ink-3:     #78868D;
  --rule:      rgba(237, 241, 242, 0.13);
  --rule-firm: rgba(237, 241, 242, 0.30);
  --accent:    #FF8A1F;
  --gold:      #FFC426;
  --gold-graphic: #FFB01A;
  --sun-halo:  rgba(255, 160, 30, 0.10);
  --after:     rgba(255, 110, 0, 0.13);
  --scrim:     rgba(13, 17, 20, 0.84);
  color-scheme: dark;
}
```

- [ ] **Step 2: Write the global stylesheet**

Create `src/styles/global.css`:

```css
* { box-sizing: border-box; }

html { scroll-behavior: smooth; }

body {
  margin: 0;
  background: var(--bg);
  color: var(--ink);
  font-family: var(--font-sans);
  font-size: 1rem;
  line-height: 1.65;
  -webkit-font-smoothing: antialiased;
  overflow-x: hidden;
}

h1, h2, h3, h4 {
  margin: 0;
  font-weight: 600;
  letter-spacing: -0.02em;
  text-wrap: balance;
}
p { margin: 0; }
ul { margin: 0; padding: 0; list-style: none; }
a { color: inherit; text-decoration: none; }
svg { display: block; }

:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 3px;
  border-radius: 2px;
}

.mono {
  font-family: var(--font-mono);
  font-size: 0.6rem;
  font-weight: 500;
  letter-spacing: 0.13em;
  text-transform: uppercase;
  line-height: 1.5;
}

.wrap {
  position: relative;
  z-index: 1;
  width: min(1180px, 100% - 2.5rem);
  margin-inline: auto;
}

section { padding-block: clamp(3.75rem, 7.5vh, 6rem); }

.skip-link {
  position: absolute;
  left: 0.5rem;
  top: -3rem;
  z-index: 100;
  padding: 0.6rem 1rem;
  background: var(--ink);
  color: var(--bg);
  font-family: var(--font-mono);
  font-size: 0.6rem;
  letter-spacing: 0.13em;
  text-transform: uppercase;
  transition: top 0.15s;
}
.skip-link:focus { top: 0.5rem; }
```

If Task 1 installed the non-variable `@fontsource/martian-mono`, the family name is
`'Martian Mono'` — the stacks above already list both, so no change is needed.

- [ ] **Step 3: Verify the token blocks are structurally correct**

```bash
grep -c "^  --bg:" src/styles/tokens.css
```

Expected: `3` — one per theme block. If it is not 3, a block is missing or malformed.

```bash
grep -n "color-scheme" src/styles/tokens.css
```

Expected: 3 matches.

- [ ] **Step 4: Commit**

```bash
git add src/styles
git commit -m "feat: add design tokens for both themes and global base styles"
```

---

### Task 6: Base layout, theme bootstrap, toggle, and sky layer

**Files:**
- Create: `src/layouts/Base.astro`
- Create: `src/components/ThemeToggle.astro`
- Create: `src/components/Sky.astro`
- Modify: `src/pages/index.astro`

**Interfaces:**
- Consumes: `src/styles/tokens.css`, `src/styles/global.css`, `profile` from `src/lib/content.ts`.
- Produces: `Base.astro` accepting props `{ title: string; description: string }` and a default slot. Renders `<html>`, head, fonts, the pre-paint theme script, `Sky`, a skip link, and `<main id="main">` around the slot.

- [ ] **Step 1: Create the sky layer**

Create `src/components/Sky.astro`. Both layers are `aria-hidden`; the wash is deliberately
faint because at higher opacity it hazes the cool ground brown:

```astro
---
---
<div class="sky" aria-hidden="true">
  <div class="afterglow"></div>
  <div class="sun"></div>
</div>

<style>
  .sky {
    position: fixed;
    inset: 0;
    z-index: 0;
    pointer-events: none;
    overflow: hidden;
  }

  .sun,
  .afterglow {
    position: absolute;
    left: 50%;
    top: -30vh;
    width: min(150vw, 1600px);
    aspect-ratio: 1;
    transform: translate(-50%, 0);
    border-radius: 50%;
    will-change: transform, opacity;
  }

  .sun {
    background: radial-gradient(
      circle closest-side,
      var(--sun-halo) 0%,
      var(--sun-halo) 22%,
      transparent 58%
    );
    opacity: 0.9;
  }

  .afterglow {
    background: radial-gradient(circle closest-side, var(--after) 0%, transparent 55%);
    opacity: 0;
  }

  @keyframes sun-set {
    from { transform: translate(-50%, 0) scale(1); opacity: 0.9; }
    to   { transform: translate(-50%, 74vh) scale(0.7); opacity: 0.12; }
  }

  @keyframes glow-rise {
    from { transform: translate(-50%, 26vh) scale(0.85); opacity: 0; }
    to   { transform: translate(-50%, 96vh) scale(1.25); opacity: 1; }
  }

  @media (prefers-reduced-motion: no-preference) {
    @supports (animation-timeline: scroll()) {
      .sun {
        animation: sun-set linear both;
        animation-timeline: scroll(root block);
      }
      .afterglow {
        animation: glow-rise linear both;
        animation-timeline: scroll(root block);
      }
    }
  }
</style>
```

- [ ] **Step 2: Create the theme toggle**

Create `src/components/ThemeToggle.astro`. Icon visibility is driven by the same three
theme states as the tokens:

```astro
---
import { Icon } from 'astro-icon/components';
---
<button class="toggle" id="themeBtn" type="button" aria-label="Switch theme">
  <Icon name="lucide:moon" class="i-moon" width={16} height={16} />
  <Icon name="lucide:sun" class="i-sun" width={16} height={16} />
</button>

<style>
  .toggle {
    display: grid;
    place-items: center;
    width: 34px;
    height: 34px;
    border: 1px solid var(--rule-firm);
    border-radius: 50%;
    background: transparent;
    color: var(--ink-2);
    cursor: pointer;
    transition: color 0.2s, border-color 0.2s, transform 0.2s;
  }
  .toggle:hover {
    color: var(--gold);
    border-color: var(--gold);
    transform: rotate(-18deg);
  }

  .toggle :global(.i-sun) { display: none; }
  .toggle :global(.i-moon) { display: block; }

  :global(:root[data-theme='dark']) .toggle :global(.i-sun) { display: block; }
  :global(:root[data-theme='dark']) .toggle :global(.i-moon) { display: none; }

  @media (prefers-color-scheme: dark) {
    :global(:root:not([data-theme='light'])) .toggle :global(.i-sun) { display: block; }
    :global(:root:not([data-theme='light'])) .toggle :global(.i-moon) { display: none; }
  }
</style>

<script>
  const root = document.documentElement;
  const btn = document.getElementById('themeBtn')!;

  const active = (): 'dark' | 'light' => {
    const stamped = root.getAttribute('data-theme');
    if (stamped === 'dark' || stamped === 'light') return stamped;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  };

  const sync = () => {
    btn.setAttribute('aria-label', `Switch to ${active() === 'dark' ? 'light' : 'dark'} theme`);
  };

  btn.addEventListener('click', () => {
    const next = active() === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
    sync();
  });

  sync();
</script>
```

- [ ] **Step 3: Create the base layout**

Create `src/layouts/Base.astro`. The inline script in `<head>` runs before first paint so
a stored theme choice does not flash:

```astro
---
import '@fontsource-variable/archivo';
import '@fontsource-variable/martian-mono';
import '../styles/tokens.css';
import '../styles/global.css';
import Sky from '../components/Sky.astro';

interface Props {
  title: string;
  description: string;
}
const { title, description } = Astro.props;
---
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{title}</title>
    <meta name="description" content={description} />
    <meta property="og:title" content={title} />
    <meta property="og:description" content={description} />
    <meta property="og:type" content="website" />
    <link rel="canonical" href={Astro.url.href} />
    <script is:inline>
      // Applied before first paint so a stored choice never flashes.
      const stored = localStorage.getItem('theme');
      if (stored === 'dark' || stored === 'light') {
        document.documentElement.setAttribute('data-theme', stored);
      }
    </script>
  </head>
  <body>
    <a class="skip-link" href="#main">Skip to content</a>
    <Sky />
    <slot name="nav" />
    <main id="main">
      <slot />
    </main>
    <slot name="footer" />
  </body>
</html>
```

If Task 1 fell back to the non-variable mono package, change that import to
`import '@fontsource/martian-mono/500.css';` and `import '@fontsource/martian-mono/600.css';`.

- [ ] **Step 4: Wire the page to the layout**

Replace `src/pages/index.astro`:

```astro
---
import Base from '../layouts/Base.astro';
import ThemeToggle from '../components/ThemeToggle.astro';
import { profile } from '../lib/content.ts';
---
<Base
  title={`${profile.name} — Full-Stack Engineer`}
  description={`${profile.name} is a full-stack engineer at ${profile.company}, working on scalable, secure systems and the interfaces on top of them.`}
>
  <section>
    <div class="wrap">
      <p>{profile.name}</p>
      <ThemeToggle />
    </div>
  </section>
</Base>
```

- [ ] **Step 5: Verify the build and the rendered output**

```bash
npm run build
grep -c "data-theme" dist/index.html
```

Expected: at least 1 (the inline bootstrap script).

```bash
grep -o "Swarnim Doegar" dist/index.html | head -1
```

Expected: `Swarnim Doegar` — proving JSON data reached the page.

```bash
ls dist/_astro/*.css >/dev/null && echo "css emitted"
```

Expected: `css emitted`.

- [ ] **Step 6: Commit**

```bash
git add src/layouts src/components src/pages
git commit -m "feat: add base layout, pre-paint theme bootstrap, toggle and sky layer"
```

---

### Task 7: Nav and SectionHeading

**Files:**
- Create: `src/components/Nav.astro`
- Create: `src/components/SectionHeading.astro`
- Modify: `src/pages/index.astro`

**Interfaces:**
- Consumes: `profile` from `src/lib/content.ts`, `ThemeToggle`.
- Produces:
  - `Nav.astro` — no props, renders the sticky nav into the layout's `nav` slot.
  - `SectionHeading.astro` — props `{ label: string }`, renders the section heading with its underline. Used by every section from Task 8 onward.

- [ ] **Step 1: Create SectionHeading**

Create `src/components/SectionHeading.astro`. `0.8rem` at `--ink-2` — the first pass used
`0.6rem` at `--ink-3` and was rejected as unreadable. The bottom border is the section's
only rule, which is why the first experience row has no top border:

```astro
---
interface Props {
  label: string;
}
const { label } = Astro.props;
---
<p class="mono eyebrow">{label}</p>

<style>
  .eyebrow {
    display: block;
    font-size: 0.8rem;
    font-weight: 600;
    letter-spacing: 0.15em;
    color: var(--ink-2);
    padding-bottom: 0.9rem;
    border-bottom: 1px solid var(--rule-firm);
    margin-bottom: 2rem;
  }
</style>
```

- [ ] **Step 2: Create Nav**

Create `src/components/Nav.astro`:

```astro
---
import ThemeToggle from './ThemeToggle.astro';
import { profile } from '../lib/content.ts';

const links = [
  { label: 'Now', href: '#now' },
  { label: 'Experience', href: '#experience' },
  { label: 'Work', href: '#work' },
  { label: 'Stack', href: '#stack' },
  { label: 'Contact', href: '#contact' },
];
---
<nav class="nav">
  <div class="nav-in">
    <a href="#top" class="mark">{profile.name.toUpperCase().replace(/ /g, ' ')}</a>
    <div class="nav-links">
      {links.map((link) => <a href={link.href}>{link.label}</a>)}
    </div>
    <ThemeToggle />
  </div>
</nav>

<style>
  .nav {
    position: sticky;
    top: 0;
    z-index: 20;
    background: var(--scrim);
    backdrop-filter: blur(14px);
    border-bottom: 1px solid var(--rule);
  }
  .nav-in {
    width: min(1180px, 100% - 2.5rem);
    margin-inline: auto;
    display: flex;
    align-items: center;
    gap: 1.5rem;
    height: 56px;
  }
  .mark {
    font-family: var(--font-mono);
    font-size: 0.72rem;
    font-weight: 600;
    letter-spacing: 0.04em;
    color: var(--ink);
  }
  /* Only .nav-links claims the free space. Putting margin-left:auto on the
     toggle as well makes the two split it and floats the links to the centre. */
  .nav-links {
    display: flex;
    gap: 1.4rem;
    margin-left: auto;
  }
  .nav-links a {
    font-family: var(--font-mono);
    font-size: 0.58rem;
    font-weight: 500;
    letter-spacing: 0.13em;
    text-transform: uppercase;
    color: var(--ink-3);
    padding-block: 0.4rem;
    border-bottom: 1px solid transparent;
    transition: color 0.2s, border-color 0.2s;
  }
  .nav-links a:hover {
    color: var(--ink);
    border-bottom-color: var(--accent);
  }

  @media (max-width: 800px) {
    .nav-links { display: none; }
    /* only now does the toggle take the right edge */
    .nav :global(.toggle) { margin-left: auto; }
  }
</style>
```

- [ ] **Step 3: Wire Nav into the page**

Replace `src/pages/index.astro`:

```astro
---
import Base from '../layouts/Base.astro';
import Nav from '../components/Nav.astro';
import SectionHeading from '../components/SectionHeading.astro';
import { profile } from '../lib/content.ts';
---
<Base
  title={`${profile.name} — Full-Stack Engineer`}
  description={`${profile.name} is a full-stack engineer at ${profile.company}, working on scalable, secure systems and the interfaces on top of them.`}
>
  <Nav slot="nav" />
  <section id="now">
    <div class="wrap">
      <SectionHeading label="Now" />
    </div>
  </section>
</Base>
```

- [ ] **Step 4: Verify**

```bash
npm run build
grep -c "nav-links" dist/index.html
```

Expected: at least 1.

Open `npm run preview` and confirm at a wide window that the nav links sit at the right,
immediately left of the round toggle, with no gap between the two groups. Then narrow the
window below 800px and confirm the links disappear and the toggle moves to the far right.

- [ ] **Step 5: Commit**

```bash
git add src/components/Nav.astro src/components/SectionHeading.astro src/pages/index.astro
git commit -m "feat: add sticky nav and section heading component"
```

---

### Task 8: Hero

The portrait's height is driven by the headline block's height — that is the whole point of
the stretch/`object-fit` arrangement, and it is what the user asked for explicitly.

**Files:**
- Create: `src/components/Hero.astro`
- Create: `src/components/Prose.astro`
- Modify: `src/pages/index.astro`

**Interfaces:**
- Consumes: `profile`, `renderInline`, `formatMonthYear`.
- Produces:
  - `Prose.astro` — props `{ text: string; class?: string; as?: string }`, renders `renderInline(text)` via `set:html`. **Every component that renders a JSON prose string uses this.**
  - `Hero.astro` — no props.

- [ ] **Step 1: Create Prose**

Create `src/components/Prose.astro`:

```astro
---
import { renderInline } from '../lib/inline.ts';

interface Props {
  text: string;
  class?: string;
  as?: 'p' | 'span' | 'li' | 'div';
}
const { text, class: className, as = 'p' } = Astro.props;
const Tag = as;
---
<Tag class={className} set:html={renderInline(text)} />
```

- [ ] **Step 2: Create Hero**

Create `src/components/Hero.astro`:

```astro
---
import { Icon } from 'astro-icon/components';
import Prose from './Prose.astro';
import { profile } from '../lib/content.ts';
import { formatMonthYear } from '../lib/dates.ts';

const { hero } = profile;
const eyebrow = `${profile.role} · ${profile.company} · Since ${formatMonthYear(profile.since)}`;
const accent = new Set(hero.accentLines);
const portrait = `${import.meta.env.BASE_URL.replace(/\/$/, '')}/portrait.webp`;
---
<section class="hero" id="top">
  <div class="wrap">
    <div class="hero-grid">
      <div>
        <p class="mono eyebrow">{eyebrow}</p>
        <h1 class="display">
          {hero.headline.map((line, i) => (
            <>
              {accent.has(i) ? <em>{line}</em> : line}
              {i < hero.headline.length - 1 && <br />}
            </>
          ))}
        </h1>
      </div>
      <div class="portrait">
        <img src={portrait} alt={`${profile.name}, smiling, in a patterned short-sleeve shirt`} width="900" height="1209" />
      </div>
    </div>
  </div>

  <div class="wrap"><div class="horizon"></div></div>

  <div class="wrap">
    <div class="hero-grid hero-lower">
      <div>
        <Prose class="lede" text={hero.lede} />
        <div class="cta-row">
          <a class="btn btn-solid" href={hero.primaryCta.href}>{hero.primaryCta.label}</a>
          <a class="btn btn-ghost" href={hero.secondaryCta.href}>
            {hero.secondaryCta.icon && <Icon name={`lucide:${hero.secondaryCta.icon}`} width={13} height={13} />}
            {hero.secondaryCta.label}
          </a>
        </div>
      </div>
      <div class="hero-meta mono">
        <span><Icon name="lucide:map-pin" width={12} height={12} />{profile.location}</span>
        <span>{profile.workMode}</span>
        <span>{profile.discipline} · {profile.yearsExperience} yrs</span>
      </div>
    </div>
  </div>
</section>

<style>
  .hero { padding-top: clamp(2.5rem, 5vh, 3.8rem); padding-bottom: 0; }

  .hero-grid {
    display: grid;
    grid-template-columns: minmax(0, 1.4fr) minmax(0, 0.6fr);
    gap: clamp(1.5rem, 4vw, 3rem);
    align-items: end;
  }
  .hero-lower { align-items: start; }

  .eyebrow {
    display: block;
    color: var(--ink-3);
    padding-bottom: 0.9rem;
    border-bottom: 1px solid var(--rule);
    margin-bottom: 1.4rem;
  }

  .display {
    font-size: clamp(2.05rem, 5.7vw, 5.3rem);
    font-weight: 700;
    line-height: 0.9;
    letter-spacing: -0.038em;
    text-transform: uppercase;
    text-wrap: initial;
  }
  .display em { font-style: normal; color: var(--accent); }

  /* The cell stretches to the row height, then the image fills it — so the
     portrait is exactly as tall as the headline block beside it. */
  .portrait { position: relative; align-self: stretch; min-height: 0; }
  .portrait img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: contain;
    object-position: bottom center;
  }

  .horizon { position: relative; height: 1px; background: var(--rule-firm); }
  .horizon::after {
    content: '';
    position: absolute;
    inset: -1px 0 auto;
    height: 3px;
    background: linear-gradient(
      90deg,
      transparent 0%,
      var(--gold-graphic) 38%,
      var(--gold-graphic) 62%,
      transparent 100%
    );
    opacity: 0.55;
  }

  .lede {
    font-size: clamp(1.02rem, 1.55vw, 1.22rem);
    line-height: 1.58;
    color: var(--ink-2);
    max-width: 46ch;
    margin-top: 1.8rem;
  }
  .lede :global(strong) { color: var(--ink); font-weight: 600; }

  .cta-row { display: flex; flex-wrap: wrap; gap: 0.8rem; margin-top: 2.2rem; }
  .btn {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.72rem 1.15rem;
    font-family: var(--font-mono);
    font-size: 0.6rem;
    font-weight: 500;
    letter-spacing: 0.13em;
    text-transform: uppercase;
    border: 1px solid var(--rule-firm);
    transition: background 0.2s, color 0.2s, border-color 0.2s;
  }
  .btn-solid { background: var(--ink); color: var(--bg); border-color: var(--ink); }
  /* --bg, not white: white on #FF8A1F is about 2.3:1 */
  .btn-solid:hover { background: var(--accent); border-color: var(--accent); color: var(--bg); }
  .btn-ghost { color: var(--ink-2); }
  .btn-ghost:hover { color: var(--ink); border-color: var(--ink); }

  .hero-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 1.4rem;
    padding-top: 1rem;
    color: var(--ink-3);
  }
  .hero-meta span { display: inline-flex; align-items: center; gap: 0.4rem; }

  @media (max-width: 860px) {
    .hero-grid { grid-template-columns: 1fr; }
    /* single column: no row to stretch against, so size by width again */
    .portrait { order: -1; align-self: auto; }
    .portrait img {
      height: auto;
      max-width: 250px;
      margin-inline: auto;
      object-fit: fill;
    }
  }
</style>
```

- [ ] **Step 3: Wire Hero into the page**

In `src/pages/index.astro`, add `import Hero from '../components/Hero.astro';` and place
`<Hero />` immediately before the `#now` section.

- [ ] **Step 4: Verify**

```bash
npm run build
grep -o "SaaS software." dist/index.html | head -1
grep -o "portrait.webp" dist/index.html | head -1
```

Expected: both strings present.

Confirm `<strong>` reached the lede rather than literal asterisks:

```bash
grep -o "<strong>Swarnim Doegar</strong>" dist/index.html | head -1
```

Expected: a match. If you see `**Swarnim Doegar**`, `Prose` is not being used.

Then `npm run preview` and check against the reference mockup at 1440px: the portrait's
top and bottom edges should line up with the headline block's top and bottom, both sitting
on the horizon rule. Narrow below 860px and confirm the portrait moves above the headline
and shrinks to 250px wide without collapsing to zero height.

- [ ] **Step 5: Commit**

```bash
git add src/components/Hero.astro src/components/Prose.astro src/pages/index.astro
git commit -m "feat: add hero with portrait height matched to the headline block"
```

---

### Task 9: Now section

**Files:**
- Create: `src/components/Now.astro`
- Modify: `src/pages/index.astro`

**Interfaces:**
- Consumes: `profile.now`, `Prose`, `SectionHeading`.
- Produces: `Now.astro` — no props. Also defines the `.reveal` class consumed by Task 14.

- [ ] **Step 1: Create Now**

Create `src/components/Now.astro`:

```astro
---
import Prose from './Prose.astro';
import SectionHeading from './SectionHeading.astro';
import { profile } from '../lib/content.ts';

const { statements, notes } = profile.now;
---
<section id="now">
  <div class="wrap">
    <SectionHeading label="Now" />
    <div class="two-col">
      <div class="reveal">
        {statements.map((text, i) => (
          <Prose class={i === 0 ? 'statement' : 'statement statement-dim'} text={text} />
        ))}
      </div>
      <div class="reveal split-notes">
        {notes.map((note) => (
          <div class="split-note">
            <h4>{note.label}</h4>
            <Prose text={note.body} />
          </div>
        ))}
      </div>
    </div>
  </div>
</section>

<style>
  .two-col {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    gap: clamp(2rem, 5vw, 4.5rem);
    align-items: start;
  }

  .statement {
    font-size: clamp(1.28rem, 2.7vw, 2rem);
    font-weight: 400;
    line-height: 1.38;
    letter-spacing: -0.018em;
    max-width: 40ch;
    color: var(--ink);
  }
  .statement + .statement { margin-top: 1.5rem; }
  .statement-dim { color: var(--ink-2); }
  .statement :global(strong) { font-weight: 600; color: var(--accent); }

  .split-notes { display: grid; gap: 1.6rem; margin-top: 0.5rem; }
  .split-note { border-left: 2px solid var(--accent); padding-left: 1.2rem; }
  .split-note:nth-child(2) { border-left-color: var(--gold); }
  .split-note h4 {
    font-family: var(--font-mono);
    font-size: 0.6rem;
    font-weight: 600;
    letter-spacing: 0.13em;
    text-transform: uppercase;
    color: var(--ink);
    margin-bottom: 0.5rem;
  }
  .split-note :global(p) {
    color: var(--ink-2);
    font-size: 0.95rem;
    line-height: 1.6;
    max-width: 40ch;
  }

  @media (max-width: 860px) {
    .two-col { grid-template-columns: 1fr; }
  }
</style>
```

- [ ] **Step 2: Wire it in**

In `src/pages/index.astro`, replace the placeholder `#now` section with `<Now />` and add
its import.

- [ ] **Step 3: Verify**

```bash
npm run build
grep -o "<strong>design systems that scale" dist/index.html | head -1
```

Expected: a match — the first statement's bold run rendered.

```bash
grep -c "split-note" dist/index.html
```

Expected: at least 2.

- [ ] **Step 4: Commit**

```bash
git add src/components/Now.astro src/pages/index.astro
git commit -m "feat: add Now section with paired backend/frontend notes"
```

---

### Task 10: Experience and Role

**Files:**
- Create: `src/components/Experience.astro`
- Create: `src/components/Role.astro`
- Modify: `src/pages/index.astro`

**Interfaces:**
- Consumes: `experience` (already sorted), `Role` type, `formatRange`, `yearMarker`, `isCurrent`, `Prose`, `SectionHeading`.
- Produces:
  - `Role.astro` — props `{ role: Role; first: boolean }`.
  - `Experience.astro` — no props.

- [ ] **Step 1: Create Role**

Create `src/components/Role.astro`. `align-items: baseline` is what puts the big year
marker and the company name on a shared baseline — without it they visibly misalign:

```astro
---
import Prose from './Prose.astro';
import type { Role } from '../lib/content.ts';
import { formatRange, isCurrent, yearMarker } from '../lib/dates.ts';

interface Props {
  role: Role;
  first: boolean;
}
const { role, first } = Astro.props;
const current = isCurrent(role.end);
---
<div class:list={['role', { current, first }]}>
  <div class="role-when mono">
    <div class="role-year">{yearMarker(role.start)}</div>
    {formatRange(role.start, role.end)}
  </div>
  <div>
    <div class="role-co">
      <h3>{role.company}</h3>
      {current && <span class="badge">Current</span>}
      {role.badges.map((badge) => <span class="badge badge-accent">{badge}</span>)}
      <span class="disc">{role.discipline}</span>
    </div>
    <p class="role-title">{role.title} <span class="sep">·</span> {role.location}</p>
    <ul class="bullets">
      {role.highlights.map((text) => <Prose as="li" text={text} />)}
    </ul>
  </div>
</div>

<style>
  .role {
    display: grid;
    grid-template-columns: 8.5rem minmax(0, 1fr);
    gap: clamp(1rem, 3vw, 2.5rem);
    align-items: baseline;
    padding-block: 2.1rem;
    border-top: 1px solid var(--rule);
  }
  /* The section heading's underline is this section's top rule. Keeping a
     border here too produced two parallel lines 30px apart. */
  .role.first { border-top: none; }
  .role:last-child { border-bottom: 1px solid var(--rule); }

  .role-when { color: var(--ink-3); }
  .role-year {
    font-family: var(--font-mono);
    font-size: 1.5rem;
    font-weight: 600;
    letter-spacing: -0.03em;
    color: var(--ink);
    font-variant-numeric: tabular-nums;
    line-height: 1;
    margin-bottom: 0.55rem;
  }
  .role.current .role-year { color: var(--gold); }

  .role-co {
    display: flex;
    align-items: baseline;
    flex-wrap: wrap;
    gap: 0.6rem 0.85rem;
  }
  .role-co h3 { font-size: clamp(1.35rem, 2.6vw, 1.9rem); letter-spacing: -0.025em; }

  .badge {
    font-family: var(--font-mono);
    font-size: 0.53rem;
    font-weight: 500;
    letter-spacing: 0.13em;
    text-transform: uppercase;
    /* --bg, never white — white on --gold/--accent fails contrast */
    color: var(--bg);
    background: var(--gold);
    padding: 0.25rem 0.5rem;
  }
  .badge-accent { background: var(--accent); }

  .disc {
    font-family: var(--font-mono);
    font-size: 0.53rem;
    font-weight: 500;
    letter-spacing: 0.13em;
    text-transform: uppercase;
    color: var(--ink-2);
    border: 1px solid var(--rule-firm);
    padding: 0.25rem 0.5rem;
    white-space: nowrap;
  }

  .role-title { color: var(--ink-2); margin-top: 0.3rem; font-size: 1rem; }
  .role-title .sep { color: var(--ink-3); }

  .bullets { margin-top: 1.1rem; display: grid; gap: 0.55rem; max-width: 62ch; }
  .bullets :global(li) {
    position: relative;
    padding-left: 1.15rem;
    color: var(--ink-2);
    font-size: 0.965rem;
    line-height: 1.6;
  }
  .bullets :global(li)::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0.68em;
    width: 6px;
    height: 1px;
    background: var(--accent);
  }
  .bullets :global(b),
  .bullets :global(strong) { color: var(--ink); font-weight: 600; }

  @media (max-width: 700px) {
    .role { grid-template-columns: 1fr; gap: 0.5rem; align-items: start; }
    .role-when { display: flex; align-items: baseline; gap: 0.8rem; flex-wrap: wrap; }
    .role-year { margin-bottom: 0; }
  }
</style>
```

- [ ] **Step 2: Create Experience**

Create `src/components/Experience.astro`:

```astro
---
import Role from './Role.astro';
import SectionHeading from './SectionHeading.astro';
import { experience } from '../lib/content.ts';
---
<section id="experience">
  <div class="wrap">
    <SectionHeading label="Experience" />
    {experience.map((role, i) => (
      <div class="reveal"><Role role={role} first={i === 0} /></div>
    ))}
  </div>
</section>
```

- [ ] **Step 3: Wire it in**

Add the import and `<Experience />` after `<Now />` in `src/pages/index.astro`.

- [ ] **Step 4: Verify**

```bash
npm run build
grep -o "Sep 2025 — Present" dist/index.html | head -1
grep -c "class=\"disc\"" dist/index.html
grep -o "Full stack</span>" dist/index.html | head -1
grep -o "Backend</span>" dist/index.html | head -1
```

Expected: the range renders; three `disc` chips; both disciplines present.

```bash
grep -c "Current</span>" dist/index.html
```

Expected: `1` — derived from `end: null`, not authored.

Then `npm run preview` and confirm against the mockup: exactly one rule between the
section heading and the first role (not two), and the year marker sharing a baseline with
the company name.

- [ ] **Step 5: Commit**

```bash
git add src/components/Experience.astro src/components/Role.astro src/pages/index.astro
git commit -m "feat: add experience timeline with discipline chips and derived dates"
```

---

### Task 11: Work section

**Files:**
- Create: `src/components/Work.astro`
- Create: `src/components/HighlightCard.astro`
- Modify: `src/pages/index.astro`

**Interfaces:**
- Consumes: `projects`, `Project` type, `Prose`, `SectionHeading`.
- Produces:
  - `HighlightCard.astro` — props `{ project: Project }`. Renders as `<a>` when `project.link` is set, `<div>` otherwise.
  - `Work.astro` — no props.

- [ ] **Step 1: Create HighlightCard**

Create `src/components/HighlightCard.astro`:

```astro
---
import { Icon } from 'astro-icon/components';
import Prose from './Prose.astro';
import type { Project } from '../lib/content.ts';

interface Props {
  project: Project;
}
const { project } = Astro.props;
const Tag = project.link ? 'a' : 'div';
const linkAttrs = project.link
  ? { href: project.link.href, target: '_blank', rel: 'noopener' }
  : {};
---
<Tag class:list={['highlight', `tone-${project.tone}`, { linked: !!project.link }]} {...linkAttrs}>
  <div class="highlight-ico">
    <Icon name={`lucide:${project.icon}`} width={26} height={26} />
  </div>
  <div>
    <div class="head">
      <h3>{project.title}</h3>
      {project.badges.map((badge) => <span class="badge-quiet">{badge}</span>)}
    </div>
    <Prose text={project.body} />
    {project.link && (
      <span class="proj-link">
        {project.link.label}
        <Icon name="lucide:arrow-up-right" width={12} height={12} />
      </span>
    )}
  </div>
</Tag>

<style>
  .highlight {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    gap: 1.4rem;
    align-items: start;
    background: var(--surface);
    border: 1px solid var(--rule);
    border-left: 3px solid var(--gold);
    padding: clamp(1.4rem, 3vw, 2.2rem);
    text-decoration: none;
  }
  .highlight + .highlight { margin-top: 1rem; }
  .tone-accent { border-left-color: var(--accent); }
  .tone-gold .highlight-ico { color: var(--gold); }
  .tone-accent .highlight-ico { color: var(--accent); }

  .linked { transition: background 0.25s; }
  .linked:hover { background: var(--bg-2); }

  .head {
    display: flex;
    align-items: baseline;
    flex-wrap: wrap;
    gap: 0.6rem 0.85rem;
  }
  .head h3 { font-size: clamp(1.2rem, 2.2vw, 1.55rem); }

  .badge-quiet {
    font-family: var(--font-mono);
    font-size: 0.53rem;
    font-weight: 500;
    letter-spacing: 0.13em;
    text-transform: uppercase;
    background: transparent;
    color: var(--ink-3);
    border: 1px solid var(--rule-firm);
    padding: 0.25rem 0.5rem;
  }

  .highlight :global(p) { color: var(--ink-2); margin-top: 0.5rem; max-width: 58ch; }

  .proj-link {
    display: inline-flex;
    width: fit-content;
    align-items: center;
    gap: 0.4rem;
    margin-top: 0.9rem;
    color: var(--accent);
    font-family: var(--font-mono);
    font-size: 0.55rem;
    font-weight: 500;
    letter-spacing: 0.13em;
    text-transform: uppercase;
  }
  .proj-link :global(svg) { transition: transform 0.2s; }
  .linked:hover .proj-link :global(svg) { transform: translate(2px, -2px); }
</style>
```

- [ ] **Step 2: Create Work**

Create `src/components/Work.astro`:

```astro
---
import HighlightCard from './HighlightCard.astro';
import SectionHeading from './SectionHeading.astro';
import { projects } from '../lib/content.ts';
---
<section id="work">
  <div class="wrap">
    <SectionHeading label="Selected work" />
    {projects.map((project) => (
      <div class="reveal"><HighlightCard project={project} /></div>
    ))}
  </div>
</section>
```

- [ ] **Step 3: Wire it in**

Add the import and `<Work />` after `<Experience />`.

- [ ] **Step 4: Verify**

```bash
npm run build
grep -o "Hyperswitch hackathon" dist/index.html | head -1
grep -o "CU Connect" dist/index.html | head -1
grep -o "Xenial-Xerus" dist/index.html | head -1
```

Expected: all three.

Confirm the unlinked card is not an anchor and the linked one is:

```bash
grep -c 'class="highlight tone-gold"' dist/index.html
grep -c 'tone-accent linked' dist/index.html
```

Expected: `1` each.

- [ ] **Step 5: Commit**

```bash
git add src/components/Work.astro src/components/HighlightCard.astro src/pages/index.astro
git commit -m "feat: add selected work section with highlight cards"
```

---

### Task 12: Stack and Contact

**Files:**
- Create: `src/components/Stack.astro`
- Create: `src/components/Contact.astro`
- Modify: `src/pages/index.astro`

**Interfaces:**
- Consumes: `stack`, `profile.contact`, `profile.education`, `profile.languages`, `Prose`, `SectionHeading`.
- Produces: `Stack.astro` and `Contact.astro`, neither taking props. The footer is rendered by `index.astro` into the layout's `footer` slot, not by `Contact.astro` (see Step 3).

- [ ] **Step 1: Create Stack**

Create `src/components/Stack.astro`. The `300px` minimum resolves to three columns inside
the 1180px container, so an even group count fills the grid with no hole:

```astro
---
import { Icon } from 'astro-icon/components';
import SectionHeading from './SectionHeading.astro';
import { stack } from '../lib/content.ts';
---
<section id="stack">
  <div class="wrap">
    <SectionHeading label="Stack" />
    <div class="stack-grid">
      {stack.map((group) => (
        <div class="reveal">
          <div class="stack-head">
            <Icon name={`lucide:${group.icon}`} width={15} height={15} />
            <span>{group.label}</span>
          </div>
          <div class="chips">
            {group.items.map((item) => <span class="chip">{item}</span>)}
          </div>
        </div>
      ))}
    </div>
  </div>
</section>

<style>
  .stack-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 300px), 1fr));
    gap: 2.4rem clamp(1.5rem, 4vw, 3rem);
  }
  .stack-head {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    padding-bottom: 0.8rem;
    border-bottom: 1px solid var(--rule-firm);
    margin-bottom: 1rem;
    color: var(--ink);
  }
  .stack-head :global(svg) { color: var(--accent); flex: none; }
  .stack-head span {
    font-family: var(--font-mono);
    font-size: 0.6rem;
    font-weight: 600;
    letter-spacing: 0.13em;
    text-transform: uppercase;
  }
  .chips { display: flex; flex-wrap: wrap; gap: 0.4rem; }
  .chip {
    font-size: 0.83rem;
    color: var(--ink-2);
    border: 1px solid var(--rule);
    padding: 0.28rem 0.55rem;
    background: var(--surface);
  }
</style>
```

- [ ] **Step 2: Create Contact**

Create `src/components/Contact.astro`. Brand marks come from Simple Icons because Lucide
removed them in v1:

```astro
---
import { Icon } from 'astro-icon/components';
import Prose from './Prose.astro';
import SectionHeading from './SectionHeading.astro';
import { profile } from '../lib/content.ts';

const { contact, education, languages } = profile;
const BRAND = new Set(['github', 'linkedin']);
const iconFor = (name: string) => (BRAND.has(name) ? `simple-icons:${name}` : `lucide:${name}`);
---
<section class="contact" id="contact">
  <div class="wrap">
    <SectionHeading label="Contact" />
    <h2 class="contact-display">
      {contact.headline.map((line, i) => (
        <>{line}{i < contact.headline.length - 1 && <br />}</>
      ))}
    </h2>
    <Prose class="contact-sub" text={contact.blurb} />
    <div class="links">
      {contact.links.map((link) => (
        <a class="link-btn" href={link.href} target={link.href.startsWith('http') ? '_blank' : undefined} rel={link.href.startsWith('http') ? 'noopener' : undefined}>
          {link.icon && <Icon name={iconFor(link.icon)} width={16} height={16} />}
          {link.label}
        </a>
      ))}
    </div>
    <div class="edu mono">
      {education.map((entry) => (
        <span>
          <b>{entry.qualification}</b> · {entry.institution} · {entry.period}{entry.note && ` · ${entry.note}`}
        </span>
      ))}
      <span><b>Languages</b> · {languages.join(', ')}</span>
    </div>
  </div>
</section>

<style>
  .contact { border-top: 1px solid var(--rule); }
  .contact-display {
    font-size: clamp(2.4rem, 6.4vw, 5.4rem);
    font-weight: 700;
    line-height: 0.92;
    letter-spacing: -0.038em;
    text-transform: uppercase;
  }
  .contact-sub {
    color: var(--ink-2);
    max-width: 44ch;
    margin-top: 1.3rem;
    font-size: 1.05rem;
  }
  .links { display: flex; flex-wrap: wrap; gap: 0.7rem; margin-top: 2.2rem; }
  .link-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.6rem;
    padding: 0.78rem 1.1rem;
    border: 1px solid var(--rule-firm);
    font-size: 0.9rem;
    color: var(--ink-2);
    transition: color 0.2s, border-color 0.2s, background 0.2s;
  }
  .link-btn :global(svg) { flex: none; }
  .link-btn:hover {
    color: var(--ink);
    border-color: var(--accent);
    background: var(--surface);
  }
  .edu {
    margin-top: 3.5rem;
    padding-top: 1.5rem;
    border-top: 1px solid var(--rule);
    color: var(--ink-3);
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem 1.6rem;
  }
  .edu b { color: var(--ink-2); font-weight: 500; }
</style>
```

- [ ] **Step 3: Wire both in, plus the footer**

`src/pages/index.astro` should now read in full:

```astro
---
import Base from '../layouts/Base.astro';
import Nav from '../components/Nav.astro';
import Hero from '../components/Hero.astro';
import Now from '../components/Now.astro';
import Experience from '../components/Experience.astro';
import Work from '../components/Work.astro';
import Stack from '../components/Stack.astro';
import Contact from '../components/Contact.astro';
import { profile } from '../lib/content.ts';
---
<Base
  title={`${profile.name} — Full-Stack Engineer`}
  description={`${profile.name} is a full-stack engineer at ${profile.company}, working on scalable, secure systems and the interfaces on top of them.`}
>
  <Nav slot="nav" />
  <Hero />
  <Now />
  <Experience />
  <Work />
  <Stack />
  <Contact />
  <footer slot="footer">
    <div class="wrap footer-in">
      <span class="mono">{profile.name} · {new Date().getFullYear()}</span>
      <span class="mono">Built with Astro · Archivo &amp; Martian Mono</span>
    </div>
  </footer>
</Base>

<style>
  footer { border-top: 1px solid var(--rule); padding-block: 1.6rem; color: var(--ink-3); }
  .footer-in {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem 1.5rem;
    justify-content: space-between;
  }
</style>
```

- [ ] **Step 4: Verify**

```bash
npm run build
grep -o "swarnimdoegar@gmail.com" dist/index.html | head -1
grep -c "class=\"chip\"" dist/index.html
grep -o "Kubernetes" dist/index.html | head -1
grep -o "ClickHouse" dist/index.html | head -1
```

Expected: email present, many chips, both tools present.

Confirm no contact details leaked that should not be there:

```bash
grep -c "7624832143\|Silver City" dist/index.html || echo "clean"
```

Expected: `clean`.

- [ ] **Step 5: Commit**

```bash
git add src/components/Stack.astro src/components/Contact.astro src/pages/index.astro
git commit -m "feat: add stack and contact sections plus footer"
```

---

### Task 13: Motion — reveals and smooth scroll

**Files:**
- Create: `src/styles/motion.css`
- Create: `src/scripts/motion.ts`
- Modify: `src/layouts/Base.astro`

**Interfaces:**
- Consumes: the `.reveal` class already present on elements in Tasks 9–12.
- Produces: reveal animation with an IntersectionObserver fallback, and Lenis smooth scroll. No exports.

- [ ] **Step 1: Add the reveal stylesheet**

Create `src/styles/motion.css`:

```css
@keyframes rise {
  from { opacity: 0; transform: translateY(22px); }
  to   { opacity: 1; transform: none; }
}

@media (prefers-reduced-motion: no-preference) {
  @supports (animation-timeline: view()) {
    .reveal {
      animation: rise linear both;
      animation-timeline: view();
      animation-range: entry 4% cover 26%;
    }
  }

  /* Safari and older Firefox: IntersectionObserver adds .seen */
  @supports not (animation-timeline: view()) {
    .reveal {
      opacity: 0;
      transform: translateY(22px);
      transition: opacity 0.7s ease, transform 0.7s cubic-bezier(0.2, 0.7, 0.2, 1);
    }
    .reveal.seen { opacity: 1; transform: none; }
  }
}
```

- [ ] **Step 2: Add the motion script**

Create `src/scripts/motion.ts`:

```ts
import Lenis from 'lenis';

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Lenis drives real document scroll, so native scroll-driven timelines keep working.
if (!reduced) {
  const lenis = new Lenis({ duration: 1.1, smoothWheel: true });
  const raf = (time: number) => {
    lenis.raf(time);
    requestAnimationFrame(raf);
  };
  requestAnimationFrame(raf);

  document.querySelectorAll<HTMLAnchorElement>('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', (event) => {
      const id = anchor.getAttribute('href')!.slice(1);
      const target = id ? document.getElementById(id) : document.body;
      if (!target) return;
      event.preventDefault();
      lenis.scrollTo(target, { offset: -56 });
    });
  });
}

// Reveal fallback where scroll-driven animations are unsupported.
const reveals = document.querySelectorAll('.reveal');
if (!CSS.supports('animation-timeline: view()')) {
  if (reduced) {
    reveals.forEach((el) => el.classList.add('seen'));
  } else {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('seen');
            observer.unobserve(entry.target);
          }
        }
      },
      { rootMargin: '0px 0px -12% 0px', threshold: 0.05 },
    );
    reveals.forEach((el) => observer.observe(el));
  }
}
```

- [ ] **Step 3: Wire into the layout**

In `src/layouts/Base.astro`:

Add to the frontmatter imports:

```ts
import '../styles/motion.css';
```

Add before `</body>`:

```astro
    <script>
      import '../scripts/motion.ts';
    </script>
```

- [ ] **Step 4: Verify the Lenis interaction — the plan's main technical risk**

```bash
npm run build && npm run preview
```

In the browser:
1. Scroll the page. The warm wash must visibly drift downward as you scroll. If it is
   frozen, Lenis has broken the `scroll()` timeline — remove Lenis and its anchor handler,
   keeping native `scroll-behavior: smooth`. Note the removal in the commit message.
2. Section content must fade and rise as it enters.
3. Click a nav link — it should glide, not jump.
4. Enable "Reduce motion" in macOS System Settings → Accessibility → Display, reload:
   everything must be immediately visible and static, with no smooth scrolling.

```bash
grep -c "lenis" dist/_astro/*.js | head -1
```

Expected: at least 1, confirming Lenis was bundled.

- [ ] **Step 5: Commit**

```bash
git add src/styles/motion.css src/scripts/motion.ts src/layouts/Base.astro
git commit -m "feat: add scroll reveals with IO fallback and Lenis smooth scroll"
```

---

### Task 14: Verification pass — contrast, keyboard, responsive

No new features. This task exists because the spec lists a verification floor and a
reviewer should be able to reject the site for failing it.

**Files:**
- Modify: any component needing a fix found here.
- Create: `docs/superpowers/plans/2026-08-13-verification-notes.md`

**Interfaces:**
- Consumes: the complete site.
- Produces: verification notes recording what was checked and any fixes.

- [ ] **Step 1: Confirm no colour literals escaped the token file**

```bash
grep -rnE "#[0-9A-Fa-f]{3,8}\b" src --include="*.astro" --include="*.css" \
  | grep -v "src/styles/tokens.css"
```

Expected: no output. Any hit is a Global Constraints violation — replace it with a token.
`public/favicon.svg` is deliberately outside this grep's scope and is exempt.

Also confirm no component repeats a font stack:

```bash
grep -rn "Martian Mono\|Archivo" src --include="*.astro" --include="*.css" \
  | grep -v "src/styles/tokens.css" | grep -v fontsource
```

Expected: no output — components use `var(--font-mono)` / `var(--font-sans)`.

- [ ] **Step 2: Confirm the three theme blocks still hold**

```bash
grep -c "^  --bg:" src/styles/tokens.css
```

Expected: `3`.

- [ ] **Step 3: Capture screenshots in both themes at three widths**

```bash
npm run build
npx astro preview --port 4321 &
sleep 3
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
for w in 1440 860 500; do
  "$CHROME" --headless --disable-gpu --hide-scrollbars --force-color-profile=srgb \
    --screenshot="/tmp/shot-$w.png" --window-size="$w,3000" \
    "http://localhost:4321/Portfolio/" 2>/dev/null
done
kill %1
```

Note Chrome enforces a ~500px minimum window width, so a narrower screenshot is a crop of
a 500px layout, not a true mobile render. Use browser devtools device emulation for
anything below 500px.

Compare each against `docs/superpowers/specs/2026-08-13-portfolio-mockup.html` at the same
width. Fix any difference in the components, not by patching tokens.

- [ ] **Step 4: Check for horizontal overflow at each width**

In devtools console at each width:

```js
document.documentElement.scrollWidth <= document.documentElement.clientWidth
```

Expected: `true` at every width. If false, find the culprit:

```js
[...document.querySelectorAll('*')]
  .filter(el => el.getBoundingClientRect().right > document.documentElement.clientWidth + 1)
  .map(el => el.className || el.tagName)
```

The `.sun` and `.afterglow` layers are expected here — they live inside
`.sky { overflow: hidden }` and do not affect page scroll. Anything else is a real bug.

- [ ] **Step 5: Audit contrast**

For every pair below, confirm the ratio in devtools (inspect element → Accessibility →
Contrast) meets the stated floor in **both** themes:

| Foreground     | Background  | Floor  |
|----------------|-------------|--------|
| `--ink`        | `--bg`      | 4.5:1  |
| `--ink-2`      | `--bg`      | 4.5:1  |
| `--ink-3`      | `--bg`      | 4.5:1  |
| `--accent`     | `--bg`      | 4.5:1  |
| `--bg`         | `--accent`  | 4.5:1  |
| `--bg`         | `--gold`    | 4.5:1  |
| `--ink-2`      | `--surface` | 4.5:1  |

`--gold-graphic` is exempt — it is graphics-only and must not be used for text. Confirm it
is not:

```bash
grep -rn "gold-graphic" src | grep -v "tokens.css"
```

Expected: only the `.horizon::after` gradient in `Hero.astro`.

- [ ] **Step 6: Keyboard-only pass**

Tab from page load with no mouse:
1. First Tab hits the skip link; it becomes visible and Enter jumps to `#main`.
2. Every nav link, the toggle, both CTAs, the CU Connect card and all three contact links
   are reachable, in visual order, each with a visible focus ring.
3. Enter activates the toggle and the theme changes.
4. Nothing is reachable but invisible.

Fix any failure before continuing.

- [ ] **Step 7: Confirm the theme choice persists without flashing**

1. Set the toggle to the opposite of your OS theme.
2. Reload. The chosen theme must be present in the very first painted frame — no flash of
   the other theme. Throttle the network in devtools to make a flash visible if present.
3. `localStorage.getItem('theme')` returns the chosen value.
4. Clear `localStorage`, reload: the site follows the OS setting again.

- [ ] **Step 8: Record the results**

Create `docs/superpowers/plans/2026-08-13-verification-notes.md` listing each step above,
whether it passed, and any fix made. State failures plainly — this file is the evidence
that the verification floor was actually met.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "test: verify contrast, keyboard access and responsive behaviour"
```

---

### Task 15: Deploy to GitHub Pages

**Files:**
- Create: `.github/workflows/deploy.yml`
- Create: `public/favicon.svg`
- Modify: `README.md`
- Modify: `src/layouts/Base.astro`

**Interfaces:**
- Consumes: the built site.
- Produces: a GitHub Actions workflow publishing `dist/` to Pages, and a README documenting the JSON editing workflow.

- [ ] **Step 1: Add a favicon**

Create `public/favicon.svg` — a sun disc on the dark ground, matching the palette:

```svg
<!-- Exempt from the no-literals rule: a standalone SVG cannot read page CSS
     variables. Hexes mirror the dark theme's --bg, --accent and --gold. -->
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <rect width="32" height="32" fill="#0D1114"/>
  <circle cx="16" cy="18" r="7" fill="#FF8A1F"/>
  <rect x="3" y="25" width="26" height="1.5" fill="#FFC426"/>
</svg>
```

Reference it in `src/layouts/Base.astro`'s `<head>`:

```astro
    <link rel="icon" type="image/svg+xml" href={`${import.meta.env.BASE_URL.replace(/\/$/, '')}/favicon.svg`} />
```

- [ ] **Step 2: Add the deploy workflow**

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm test
      - run: npm run build
      - uses: actions/configure-pages@v5
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

`npm test` runs before the build deliberately: a bad JSON edit should fail CI loudly
rather than deploy a broken page.

- [ ] **Step 3: Rewrite the README as the editing guide**

Replace `README.md`:

````markdown
# Portfolio

Live at https://swarnimdoegar.github.io/Portfolio/

Static site built with Astro. **All content lives in JSON — you should never need to touch
a component to update the site.**

## Updating content

| To change | Edit |
|---|---|
| Name, title, hero headline, lede, "Now" text, contact details, education | `src/data/profile.json` |
| Jobs, dates, disciplines, bullet points | `src/data/experience.json` |
| Selected work and projects | `src/data/projects.json` |
| Skill groups and chips | `src/data/stack.json` |

Commit and push to `main`. GitHub Actions builds and deploys automatically.

### Rules the build enforces

A bad edit **fails the build with the file and field named** rather than deploying a broken
page. Run `npm test` locally to check before pushing.

- Dates are `YYYY-MM` (`"2025-09"`). `"end": null` means the role is current — the big year
  marker, the "Sep 2025 — Present" range, and the `Current` badge are all derived from
  these two fields, so there is nothing to keep in sync.
- `discipline` must be `"Full stack"`, `"Backend"`, or `"Frontend"`.
- `icon` values must come from the whitelist in `src/lib/content.ts`.
- Prose fields support `**bold**` and nothing else. No HTML — it is escaped.
- `hero.headline` is one array entry per rendered line; `accentLines` holds the indices
  painted in the accent colour.
- Keep `stack.json` to an even number of groups, or the three-column grid leaves a hole.

## Local development

```bash
npm install
npm run dev      # http://localhost:4321/Portfolio/
npm test         # validates all JSON + unit tests
npm run build
npm run preview
```

## Design

Design spec: `docs/superpowers/specs/2026-08-13-portfolio-redesign-design.md`
Visual reference: `docs/superpowers/specs/2026-08-13-portfolio-mockup.html`
````

- [ ] **Step 4: Verify the base path is correct everywhere**

```bash
npm run build
grep -o 'href="/Portfolio/[^"]*"' dist/index.html | head -5
grep -o 'src="/Portfolio/[^"]*"' dist/index.html | head -5
```

Expected: asset and favicon paths are prefixed with `/Portfolio`. If any absolute path
lacks it, the deployed site loses that asset — route it through `import.meta.env.BASE_URL`.

Serve the built output at the real sub-path to prove it:

```bash
mkdir -p /tmp/pages-check/Portfolio
cp -r dist/* /tmp/pages-check/Portfolio/
cd /tmp/pages-check && python3 -m http.server 8080 &
sleep 2
curl -sI http://localhost:8080/Portfolio/ | head -1
```

Expected: `HTTP/1.0 200 OK`. Open `http://localhost:8080/Portfolio/` and confirm styles,
fonts, portrait and both themes all work. Stop the server afterwards.

- [ ] **Step 5: Enable Pages in the repository — manual step**

In GitHub → repository Settings → Pages, set **Source** to **GitHub Actions**. The repo is
currently set to deploy from a branch; leaving it will keep serving the deleted old site.
This cannot be done from code.

- [ ] **Step 6: Commit and push**

```bash
git add -A
git commit -m "ci: add GitHub Pages deploy workflow and content editing guide"
git push -u origin portfolio-redesign
```

- [ ] **Step 7: Merge and confirm the deployment**

Open a PR from `portfolio-redesign` to `main`, merge it, then watch the Actions run. When
it completes, load https://swarnimdoegar.github.io/Portfolio/ and confirm:
- styles, fonts and the portrait all load
- the theme toggle works and persists
- every nav anchor scrolls to its section

If the page loads unstyled, `base` is wrong or an asset path is hardcoded — return to Step 4.

---

## Self-review

**Spec coverage.** Every spec section maps to a task: content model → Task 4; inline
emphasis → Task 3; icon whitelist → Task 4; colour, type and layout systems → Tasks 5, 7–12;
theme mechanics and persistence → Task 6; hero portrait height → Task 8; experience
alignment and the double-rule fix → Task 10; signature sunset → Task 6; motion and reduced
motion → Task 13; accessibility floor → Tasks 6 and 14; verification → Task 14; deployment
and base path → Task 15; old-site removal → Task 1.

**Type consistency.** `Role`, `Project`, `StackGroup`, `Profile`, `Link`, `IconName` are
defined once in Task 4 and imported by name thereafter. `renderInline` (Task 3) is used
only through `Prose` (Task 8). `formatRange`, `yearMarker`, `isCurrent`,
`compareByStartDesc` (Task 2) are consumed in Tasks 4 and 10 with matching signatures.
`SectionHeading`'s single `label` prop is used identically in Tasks 9–12.

**Known deviations from the mockup**, all deliberate: a skip link is added; the theme
toggle persists to `localStorage` and applies pre-paint; the unused `--shadow` token is
dropped; the footer year is computed rather than hardcoded.
