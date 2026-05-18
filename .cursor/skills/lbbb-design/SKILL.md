---
name: lbbb-design
description: Design system for Little Bestiary Blog Builder (LBBB). Use when building or restyling UI components, pages, layouts, navigation, or visual polish. Covers flat dark geometric aesthetic, IBM Plex Sans typography, blue-gray palette with orange accent, bordered panels, and app-focused navigation patterns.
---

# LBBB Design System

Flat, utilitarian, app-first UI. No decorative gradients, glass effects, or pill shapes.

## Typography

- **Font**: IBM Plex Sans only — never use serif or decorative fonts
- **Page titles**: `text-3xl sm:text-4xl font-bold text-[var(--text-primary)]`
- **Section labels**: `.section-label` — uppercase, tracked, muted, 11px
- **Body**: `text-sm text-[var(--text-muted)]`
- **Emphasis**: weight (`font-semibold`) or accent color — not font switching

## Color tokens

Defined in [`src/styles.css`](src/styles.css):

| Token | Use |
|-------|-----|
| `--bg-base` | Page background |
| `--bg-raised` | Panels, header |
| `--bg-input` | Form fields |
| `--border` | All dividers and outlines |
| `--text-primary` | Headings, primary copy |
| `--text-muted` | Secondary copy, labels |
| `--accent` | CTAs, active nav, links |
| `--accent-hover` | Hover states |
| `--accent-muted` | Subtle accent backgrounds |

Orange accent is scarce — primary actions and active states only.

## Layout

- **Flat 2D**: 1px borders, rectangles, no shadows or blur
- **Corner radius**: 0–2px max (`.input-field` uses 2px)
- **Panels**: `.panel` for static containers, `.panel-interactive` for hoverable cards
- **Grids**: `.metric-grid` for bordered stat cells with shared outer border
- **Page width**: `.page-wrap` (max 1080px)
- **Background**: subtle grid lines on `--bg-base` — no radial gradients

## Components

Reuse existing primitives:

- [`PageShell`](src/components/PageShell.tsx) — page wrapper with label, title, divider
- [`Button`](src/components/ui/Button.tsx) / `buttonClassName()` — primary (orange), secondary (bordered), ghost
- [`MetricCard`](src/components/MetricCard.tsx) — stat cell inside `.metric-grid`
- [`Header`](src/components/Header.tsx) — app nav: Dashboard, Pets, Admin, Account
- `.input-field` — all form inputs
- `.nav-link` — header links with orange bottom border when active

## Navigation

- Logo → `/app`
- `/` redirects to `/app`
- No marketing or stack-demo pages in nav
- Public blogs at `/p/:slug` use same tokens but no extra nav items

## Anti-patterns

Do NOT use:

- Fraunces, Inter, or generic AI aesthetics
- `rounded-full`, large border-radius, pill buttons
- Gradients, backdrop-blur, box-shadow, hover translate lifts
- `.island-shell`, `.feature-card`, `.display-title`, `.island-kicker` (removed)
- Coastal/teal/green palette (`--sea-ink`, `--lagoon`, etc.)
- Page-load animations

## Theme

Dark-first CSS on `:root`. Light mode via `.light`, `data-theme='light'`, or system preference when auto. Theme toggle cycles light → dark → auto.
