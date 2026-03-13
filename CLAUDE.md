# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

FLACON is a PWA for collecting, rating, and ranking perfumes. Built with React 18 + TypeScript, Tailwind CSS, Supabase (PostgreSQL + Auth + Realtime), and a custom PerfumAPI for fragrance search.

## Commands

```bash
npm run dev       # Start dev server on :5173
npm run build     # TypeScript check + Vite production build
npm run preview   # Preview production build locally
```

There are no tests or linting configured.

## Architecture

### State & Data Flow

App.tsx is the orchestration hub — it owns all top-level state via hooks and passes data/callbacks down as props to pages. No Redux or Context API is used.

- `useAuth()` — Supabase Google OAuth + user profile
- `useCollection(userId)` — CRUD for fragrances with Supabase realtime subscription (re-fetches all on any change)
- `useFragellaSearch()` — PerfumAPI search wrapper
- `useImageFetch()` — Image URL resolution with fallback

### Backend

- **Supabase** handles auth, database, and realtime sync
- **PerfumAPI** (external, self-hosted) provides fragrance search data
- RLS policies enforce user-scoped data access — users can only CRUD their own data
- Database schema lives in `supabase/migrations/001_initial_schema.sql`

### Key Data Types (src/lib/types.ts)

- `Fragrance` — main entity with ratings (7 categories, 1-10 scale), tier ranking (S/A/B/C/D), notes layers (top/middle/base), seasons, and financial tracking
- `RatingDetails` — overall, sillage, longevity, uniqueness, value, compliments, versatility
- `UserProfile` — extends Supabase auth user with display name, avatar, API key, currency

### Styling

Tailwind-only with a luxury dark theme. Key design tokens are in `tailwind.config.js`:
- Fonts: Cormorant Garamond (display), DM Sans (body)
- Colors: gold primary (`#c9a96e`), dark background (`#0e0c0b`), 3-level surface hierarchy
- Family-specific accent colors for fragrance categories

### PWA

Configured in `vite.config.ts` with vite-plugin-pwa. Workbox caches PerfumAPI responses for 7 days using CacheFirst strategy. Service worker auto-updates on deployment.

### Reusable Components

`src/components/common/index.tsx` contains all shared UI primitives: Button (primary/ghost/danger), Modal, Input, Select, StarRating, Badge, TierBadge, EmptyState.

## Environment Variables

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_PERFUMAPI_URL=https://your-perfumapi.onrender.com
```

## Path Aliases

`@/` maps to `src/` (configured in both vite.config.ts and tsconfig.json).

## Language Notes

The app UI is in German (seasons: Frühling/Sommer/Herbst/Winter/Ganzjährig; some labels). Code and types are in English.
