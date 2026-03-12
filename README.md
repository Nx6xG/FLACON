# FLACON — Parfum Sammlung

Eine Progressive Web App zum Sammeln, Bewerten und Ranken deiner Parfums.

## Features

- **Sammlung** — Übersicht aller Parfums als Grid oder Liste, mit Filter & Suche
- **API-Suche** — Über 74.000 Düfte durchsuchen via Fragella API, ein Klick zum Hinzufügen
- **Bewertung** — 7 Einzelkategorien (Sillage, Longevity, etc.) mit Radar-Chart
- **Tier-Ranking** — S/A/B/C/D System für dein persönliches Ranking
- **Wunschliste** — Düfte merken, mit einem Klick zur Sammlung verschieben
- **Statistiken** — Sammlungswert, Verteilung nach Marke/Familie/Konzentration, Top-bewertet
- **PWA** — Installierbar als App auf iOS, Android und Desktop
- **Cloud-Sync** — Google Login, Daten auf allen Geräten synchronisiert

## Tech Stack

- **Frontend:** React 18 + TypeScript + Tailwind CSS
- **Build:** Vite + vite-plugin-pwa
- **Backend:** Supabase (Postgres, Auth, Realtime)
- **API:** Fragella (Parfum-Datenbank)
- **Charts:** Recharts + Custom SVG Radar Chart
- **Hosting:** Vercel / Netlify

---

## Setup

### 1. Repository klonen & Dependencies installieren

```bash
git clone <your-repo-url>
cd flacon
npm install
```

### 2. Supabase Projekt erstellen

1. Geh zu [supabase.com](https://supabase.com) und erstelle ein neues Projekt (kostenlos)
2. Warte bis das Projekt bereit ist
3. Geh zu **SQL Editor** und führe die Datei `supabase/migrations/001_initial_schema.sql` aus
4. Geh zu **Settings → API** und kopiere:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public key** → `VITE_SUPABASE_ANON_KEY`

### 3. Google Auth aktivieren

1. In Supabase: **Authentication → Providers → Google**
2. Google aktivieren
3. Du brauchst eine Google OAuth Client ID:
   - Geh zu [console.cloud.google.com](https://console.cloud.google.com)
   - Neues Projekt oder bestehendes wählen
   - **APIs & Services → Credentials → OAuth 2.0 Client ID erstellen**
   - Typ: Web Application
   - Authorized redirect URIs: `https://<your-supabase-project>.supabase.co/auth/v1/callback`
4. Client ID und Secret in Supabase eintragen

### 4. Environment Variables

Erstelle eine `.env` Datei im Root:

```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...

# Optional — kann auch in den App-Settings eingetragen werden
VITE_FRAGELLA_API_KEY=your-fragella-key
```

### 5. Fragella API Key (optional)

1. Geh zu [api.fragella.com](https://api.fragella.com)
2. Erstelle einen kostenlosen Account
3. Kopiere deinen API-Key
4. Entweder in `.env` eintragen ODER in den App-Settings

### 6. Starten

```bash
npm run dev
```

App öffnet sich unter `http://localhost:5173`

---

## Deployment auf Vercel

1. Push dein Repo auf GitHub
2. Geh zu [vercel.com](https://vercel.com) → **New Project** → GitHub Repo importieren
3. Vercel erkennt Vite automatisch (Framework: Vite)
4. **Environment Variables** eintragen:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_FRAGELLA_API_KEY` (optional)
5. Deploy!

**Wichtig:** In der Google OAuth Console auch die Vercel-Domain als Redirect URI hinzufügen:
- `https://your-app.vercel.app` (in Supabase unter Authentication → URL Configuration → Site URL)
- Supabase Callback URL bleibt: `https://<project>.supabase.co/auth/v1/callback`

---

## PWA installieren

Nach dem Deploy ist die App automatisch als PWA verfügbar:

- **iPhone:** Safari → Teilen → "Zum Home-Bildschirm"
- **Android:** Chrome → Banner "App installieren" oder Menü → "App installieren"
- **Desktop:** Chrome/Edge → Installations-Icon in der Adressleiste

---

## Projektstruktur

```
src/
├── components/
│   ├── Layout/          Header, Navigation
│   ├── Collection/      FragranceCard, FragranceDetail
│   ├── Search/          AddFragranceModal
│   ├── Rating/          RadarChart
│   └── common/          Button, Modal, Input, Select, StarRating, Badge
├── hooks/
│   ├── useAuth.ts       Supabase Auth
│   ├── useCollection.ts CRUD + Realtime
│   └── useFragellaSearch.ts API search
├── lib/
│   ├── supabase.ts      Client setup
│   ├── fragella.ts      API wrapper
│   ├── stats.ts         Statistik-Berechnungen
│   └── types.ts         TypeScript types
├── pages/
│   ├── CollectionPage   Hauptansicht Sammlung
│   ├── SearchPage       Parfum-Datenbank durchsuchen
│   ├── RankingPage      Tier-Ranking (S–D)
│   ├── WishlistPage     Wunschliste
│   ├── StatsPage        Statistiken & Charts
│   ├── SettingsPage     API-Key, Export/Import
│   └── LoginPage        Google Login
├── App.tsx              Routing & State
├── main.tsx             Entry point
└── index.css            Global styles
```
