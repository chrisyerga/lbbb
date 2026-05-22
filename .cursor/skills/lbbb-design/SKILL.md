---
name: lbbb-design
description: Design system for Little Bestiary Blog Builder (LBBB). Use when building or restyling UI components, pages, layouts, navigation, or visual polish. Covers app UI (flat dark geometric) and marketing landing (V1 Sticker Pop).
---

# LBBB Design System

Two visual contexts — pick the right one:

| Context | Route | Aesthetic |
| ------- | ----- | --------- |
| **App UI** | `/app/*`, `/login` | V1 Sticker Pop (cream, Unbounded, sticker buttons) |
| **Public blogs** | `/p/*` | Flat dark utilitarian (legacy) |
| **Marketing landing** | `/` | V1 Sticker Pop scrapbook |

---

## App UI (`/app/*`, `/login`)

Uses the same V1 **Sticker Pop** system as the landing page, scoped via [`AppShell`](src/components/AppShell.tsx) and `.landing-v1` in [`landing-v1.css`](src/styles/landing-v1.css).

### Typography

- **Display**: Unbounded (`.font-display`, auto on `h1`–`h3` inside `.landing-v1`)
- **Body**: DM Sans
- **Labels**: DM Mono (`.section-label`, `.font-mono`)
- **Page titles**: `font-display text-3xl sm:text-4xl font-extrabold`

### Color tokens

Inside `.landing-v1`, existing app utility vars are bridged to landing palette:

| Token | Maps to |
| ----- | ------- |
| `--bg-base` | `--landing-cream` |
| `--bg-raised` | `#fff` |
| `--text-primary` | `--landing-ink` |
| `--accent` | `--landing-primary` |

See [`landingPalette.ts`](src/components/landing/landingPalette.ts) for palette values.

### Layout & components

- **Panels**: 2px `#14100E` border, 18px radius (`.panel`, `.panel-interactive`)
- **Inputs**: `.input-field` — 2px border, 12px radius, white fill
- **Buttons**: `.btn` / `buttonClassName()` — sticker style (rounded-xl, ink border, primary red fill)
- **PageShell**, **MetricCard**, **Header** — V1 typography and colors
- **Header**: cafezoe wordmark + paw favicon; no theme toggle
- **Errors**: `.alert-error` for form validation messages

### Navigation

- Logo → `/app`
- `/` is the marketing landing (separate nav/footer)
- Public blogs at `/p/:slug` keep legacy dark header with theme toggle

---

## Public blogs (`/p/*`) — legacy

Flat, utilitarian UI. IBM Plex Sans, 1px borders, dark/light theme toggle.

### Color tokens

Defined in [`src/styles.css`](src/styles.css):

| Token            | Use                       |
| ---------------- | ------------------------- |
| `--bg-base`      | Page background           |
| `--bg-raised`    | Panels, header            |
| `--bg-input`     | Form fields               |
| `--border`       | All dividers and outlines |
| `--text-primary` | Headings, primary copy    |
| `--text-muted`   | Secondary copy, labels    |
| `--accent`       | CTAs, active nav, links   |

### Anti-patterns (legacy `/p/*` only)

Do NOT use on public blog routes:

- Large border-radius pill buttons, scrapbook rotations, tape decorations
- Forced cream palette

### Theme

Dark-first CSS on `:root`. Light mode via `.light`, `data-theme='light'`, or system preference when auto.

---

## Legacy app tokens (reference)

The following applied before V1 migration; still active on `/p/*` via [`styles.css`](src/styles.css):

### Typography (legacy)

- **Font**: IBM Plex Sans only
- **Section labels**: `.section-label` — uppercase, tracked, muted, 11px
- **Body**: `text-sm text-[var(--text-muted)]`

### Layout (legacy)

- **Flat 2D**: 1px borders, rectangles, 0–2px radius
- **Panels**: `.panel`, `.panel-interactive`
- **Grids**: `.metric-grid`
- **Page width**: `.page-wrap`

### Components (legacy `/p/*`)

- [`Button`](src/components/ui/Button.tsx) — orange accent, square corners (outside `.landing-v1`)
- [`Header`](src/components/Header.tsx) — LBBB wordmark + theme toggle on non-app routes
- `.nav-link` — underline active state

---

## Marketing landing (`/`)

V1 **Sticker Pop** — scrapbook/sticker sheet aesthetic. Implemented in [`src/components/landing/`](src/components/landing/).

### When to use

- Homepage only (full marketing sections)
- Do **not** duplicate landing nav on `/app/*` — app uses [`Header`](src/components/Header.tsx) instead

### Typography

- **Display**: Unbounded (`.font-display`)
- **Body**: DM Sans (default inside `.landing-v1`)
- **Marginalia**: Caveat (`.font-hand`)
- **Labels**: DM Mono (`.font-mono`)

Fonts loaded via [`src/styles/landing-v1.css`](src/styles/landing-v1.css).

### Color tokens (scoped)

On `.landing-v1` — default **Tomato** palette from [`landingPalette.ts`](src/components/landing/landingPalette.ts):

| Token | Default | Use |
| ----- | ------- | --- |
| `--landing-cream` | `#FBF1DE` | Page background |
| `--landing-ink` | `#1A1410` | Text, borders |
| `--landing-primary` | `#E0382E` | CTAs, emphasis |
| `--landing-accent` | `#F2A02E` | Decorations, highlights |
| `--landing-soft` | `#F5E1B4` | Section backgrounds |

### Motifs

- 2px `#14100E` borders, rotated cards, tape strips
- Pill badges, sticker buttons, sunbursts, squiggles, stars
- Rounded corners (12–24px) and pill CTAs are **expected** on landing

### Components

Landing-specific primitives in [`src/components/landing/primitives/`](src/components/landing/primitives/):

- `Pill`, `StickerBtn`, `Tape`, `Squiggle`, `SunBurst`, `Star`, `ArtTile`
- Sections in [`src/components/landing/sections/`](src/components/landing/sections/)
- `LandingLayout` wraps page, sets body class

### Chrome

- Global `Header` / `Footer` hidden on `/` via [`RootShell`](src/components/RootShell.tsx)
- Landing has its own nav + footer sections
- Light-only; no theme toggle on landing

### Motion

- Marquee, bob, typewriter demo — respect `prefers-reduced-motion`
- Keyframes in `landing-v1.css`: `v1-bob`, `v1-marq`, `v1-blink`, `v1-pulse`, `v1-spin`
