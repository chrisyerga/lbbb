---
name: lbbb-design
description: Design system for Little Bestiary Blog Builder (LBBB). Use when building or restyling UI components, pages, layouts, navigation, or visual polish. Covers app UI (flat dark geometric) and marketing landing (V1 Sticker Pop).
---

# LBBB Design System

Two visual contexts — pick the right one:

| Context | Route | Aesthetic |
| ------- | ----- | --------- |
| **App UI** | `/app/*`, `/login`, `/p/*` | Flat dark utilitarian |
| **Marketing landing** | `/` | V1 Sticker Pop scrapbook |

---

## App UI

Flat, utilitarian, app-first UI. No decorative gradients, glass effects, or pill shapes.

### Typography

- **Font**: IBM Plex Sans only — never use serif or decorative fonts
- **Page titles**: `text-3xl sm:text-4xl font-bold text-[var(--text-primary)]`
- **Section labels**: `.section-label` — uppercase, tracked, muted, 11px
- **Body**: `text-sm text-[var(--text-muted)]`
- **Emphasis**: weight (`font-semibold`) or accent color — not font switching

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
| `--accent-hover` | Hover states              |
| `--accent-muted` | Subtle accent backgrounds |

Orange accent is scarce — primary actions and active states only.

### Layout

- **Flat 2D**: 1px borders, rectangles, no shadows or blur
- **Corner radius**: 0–2px max (`.input-field` uses 2px)
- **Panels**: `.panel` for static containers, `.panel-interactive` for hoverable cards
- **Grids**: `.metric-grid` for bordered stat cells with shared outer border
- **Page width**: `.page-wrap` (max 1080px)
- **Background**: subtle grid lines on `--bg-base` — no radial gradients

### Components

Reuse existing primitives:

- [`PageShell`](src/components/PageShell.tsx) — page wrapper with label, title, divider
- [`Button`](src/components/ui/Button.tsx) / `buttonClassName()` — primary (orange), secondary (bordered), ghost
- [`MetricCard`](src/components/MetricCard.tsx) — stat cell inside `.metric-grid`
- [`Header`](src/components/Header.tsx) — app nav: Dashboard, Pets, Admin, Account
- `.input-field` — all form inputs
- `.nav-link` — header links with orange bottom border when active

### Navigation

- Logo → `/app`
- `/` is the marketing landing (no app header)
- Public blogs at `/p/:slug` use same tokens but no extra nav items

### Anti-patterns (app only)

Do NOT use in app UI:

- Fraunces, Inter, or generic AI aesthetics
- `rounded-full`, large border-radius, pill buttons
- Gradients, backdrop-blur, box-shadow, hover translate lifts
- `.island-shell`, `.feature-card`, `.display-title`, `.island-kicker` (removed)
- Coastal/teal/green palette (`--sea-ink`, `--lagoon`, etc.)
- Page-load animations

### Theme

Dark-first CSS on `:root`. Light mode via `.light`, `data-theme='light'`, or system preference when auto. Theme toggle cycles light → dark → auto.

---

## Marketing landing (`/`)

V1 **Sticker Pop** — scrapbook/sticker sheet aesthetic. Implemented in [`src/components/landing/`](src/components/landing/).

### When to use

- Homepage and future marketing-only pages
- Do **not** apply landing styles to `/app/*`

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
- `LandingLayout` wraps page, sets body class, loads landing CSS

### Chrome

- Global `Header` / `Footer` hidden on `/` via [`RootShell`](src/components/RootShell.tsx)
- Landing has its own nav + footer sections
- Light-only; no theme toggle on landing

### Motion

- Marquee, bob, typewriter demo — respect `prefers-reduced-motion`
- Keyframes in `landing-v1.css`: `v1-bob`, `v1-marq`, `v1-blink`, `v1-pulse`, `v1-spin`
