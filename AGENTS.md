# AGENTS.md — CicloMap CWB

Guide for AI agents working in this repository.

## What this project is

Interactive web app for exploring and planning cycling routes in Curitiba (PR). Displays the city's cycling infrastructure (bike paths, bike lanes, cycling routes), with route planning, elevation profile, weather, neighborhood ranking, and route sharing.

## Stack

| Layer | Technologies |
|---|---|
| Framework | React 18 + TypeScript + Vite |
| Routing | React Router |
| State/Cache | TanStack React Query |
| UI | Tailwind CSS + shadcn/ui + Radix UI |
| Maps | Leaflet + React-Leaflet |
| Cycling routing | OSRM (bicycle profile) |
| Geocoding | Nominatim (reverse and forward) |
| POIs | Overpass API (parks) |
| Geometry | Turf.js |
| Charts | Recharts |
| Animations | Framer Motion |
| Testing | Vitest (unit) + Playwright (e2e) |
| Deploy | Vercel |

## Project structure

```
src/
├── components/         # React components
│   ├── ui/            # Base components (Button, Dialog, etc.)
│   ├── shared/        # Shared feature components
│   ├── CycleMap.tsx   # Central map component
│   ├── SearchBar.tsx  # Route search interface
│   ├── RoutePlannerPanel.tsx
│   ├── RouteInfoPanel.tsx
│   ├── RouteElevationChart.tsx
│   ├── WeatherPanel.tsx
│   └── ...
├── pages/             # Index.tsx (main) + NotFound.tsx
├── services/          # External integrations
│   ├── routing.ts     # OSRM
│   ├── weather.ts
│   ├── elevation.ts   # Open-Elevation API
│   ├── reverseGeocode.ts
│   ├── forwardGeocode.ts
│   ├── traffic.ts
│   └── parksOverpass.ts
├── hooks/             # useGeolocation, useFavoriteCiclovias, etc.
├── utils/             # Pure functions (geo, export, share, URL params)
└── data/              # Static data (ciclovias, typologies, neighborhoods)
```

## Essential commands

```bash
npm install          # install dependencies
npm run dev          # dev server (port 8080)
npm run build        # production build
npm run lint         # ESLint
npm run test         # Vitest (unit)
npx playwright test  # e2e tests
```

## Environment variables

Copy `.env.example` to `.env`. Relevant variables:

| Variable | Purpose |
|---|---|
| `VITE_OSRM_URL` | OSRM server for route calculation |
| `VITE_CICLOVIAS_LIVE_URL` | IPPUC API for live cycling network data |
| `VITE_ELEVATION_URL` | Open-Elevation API for elevation profiles |
| `VITE_TRAFFIC_HISTORY_URL` | Traffic history API (optional) |

If `VITE_CICLOVIAS_LIVE_URL` is not set, the app falls back to static data from `src/data/ciclovias.ts`.

## API proxies (Vite + Vercel)

Proxies in `vite.config.ts` and `vercel.json` forward calls to external APIs, avoiding CORS in development and production:

- `/api/ippuc` → ArcGIS IPPUC
- `/api/osrm` → OSRM server
- `/api/nominatim` → Nominatim OSM
- `/api/overpass` → Overpass API

## Code conventions

- **Strict TypeScript** — no explicit `any` without justification
- **Import alias** — use `@/` to import from `src/`
- **Components** — one file per component, PascalCase
- **Hooks** — `use` prefix, camelCase
- **Services** — pure async functions in `src/services/`, no React state
- **Utils** — pure functions with no side effects in `src/utils/`
- **Static data** — in `src/data/`, no business logic
- **Comments** — only when the "why" is not obvious from the code

## Critical areas for changes

- **`CycleMap.tsx`** — central component; changes here affect the entire map visualization
- **`services/routing.ts`** — OSRM routing logic and route alternatives
- **`utils/cicloviaNetworkRoute.ts`** — routing over the IPPUC cycling network
- **`utils/mapUrlParams.ts`** — URL parameter encoding/decoding for route sharing
- **`data/ciclovias.ts`** — static fallback data; changes here affect offline mode

## What not to do

- Do not mock geospatial data in tests without justification — incorrect coordinates cause silent bugs
- Do not add map dependencies without checking compatibility with React-Leaflet
- Do not change the Vite proxy without also updating `vercel.json`
- Do not use `useEffect` for state synchronization that React Query already manages
- Do not store coordinates in React state unnecessarily — prefer URL parameters via `mapUrlParams.ts`
