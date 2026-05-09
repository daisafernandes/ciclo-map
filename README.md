<div align="center">

# CicloMap CWB

**Explore and plan cycling routes across Curitiba’s bike network.**

Interactive map for cycle paths, lanes, and shared routes — with dual routing (IPPUC network + OSRM), elevation, weather, neighborhood insights, and shareable URLs.

[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

</div>

---

## Table of contents

- [Highlights](#highlights)
- [Tech stack](#tech-stack)
- [Getting started](#getting-started)
- [Environment variables](#environment-variables)
- [API proxies](#api-proxies)
- [URL parameters](#url-parameters)
- [Routing modes](#routing-modes)
- [Elevation & difficulty](#elevation--difficulty)
- [Data fallback](#data-fallback)
- [Deployment](#deployment)

---

## Highlights

| | |
| :--- | :--- |
| **Map & data** | Curitiba cycling network from **IPPUC / GeoCuritiba** (live or static fallback) |
| **Routing** | **IPPUC graph** (paths on the map) **or** **OSRM** `cycling` profile (full road network) |
| **Alternatives** | Multiple route options with **Easy / Moderate / Hard** difficulty |
| **Insights** | Elevation profile (**Recharts**), **Open-Meteo** weather & cycling-oriented alerts |
| **Context** | Neighborhood ranking, parks & **Bicicuritiba** stations (**Overpass**) |
| **UX** | Geolocation, favorites (**LocalStorage**), dark / light / satellite themes |
| **Sharing** | **URL-encoded** origin, destination, filters, and theme |
| **Offline** | **PWA** — installable, works without network when cached |

---

## Tech stack

| Layer | Technology |
| --- | --- |
| Framework | React 18 · TypeScript · Vite 5.4 (SWC) |
| Maps | Leaflet · React-Leaflet |
| Routing | OSRM (bicycle) · custom IPPUC network graph |
| Geocoding | Nominatim (OpenStreetMap) |
| Weather | Open-Meteo |
| Elevation | Open-Elevation (SRTM) |
| POIs | Overpass API |
| Geometry | Turf.js |
| UI | shadcn/ui · Radix UI · Tailwind CSS |
| Data | TanStack React Query v5 |
| Charts & motion | Recharts · Framer Motion |
| Forms | React Hook Form · Zod |
| SPA routing | React Router v6 |
| PWA | vite-plugin-pwa (Workbox) |
| Testing | Vitest · Playwright |
| Deploy | Vercel |

---

## Getting started

```bash
npm install
cp .env.example .env   # optional — configure as needed
npm run dev            # http://localhost:8080
```

**Other scripts**

```bash
npm run build          # production build → dist/
npm run preview        # serve the production build locally
npm run lint           # ESLint
npm run test           # Vitest (single run)
npm run test:watch     # Vitest watch mode
```

E2E (Playwright):

```bash
npx playwright test
```

---

## Environment variables

Copy `.env.example` to `.env`. **All variables are optional** — the app uses public endpoints or bundled static data when unset.

| Variable | Default | Description |
| --- | --- | --- |
| `VITE_CICLOVIAS_LIVE_URL` | _static fallback_ | GeoJSON / ArcGIS URL for live network data (IPPUC / GeoCuritiba) |
| `VITE_OSRM_URL` | `/osrm` proxy | OSRM base URL (no trailing slash). Public hosts may omit `cycling` — use your own OSRM if needed |
| `VITE_ELEVATION_URL` | Open-Elevation public API | Alternative elevation API (`POST`, Open-Elevation-compatible) |
| `VITE_OVERPASS_URL` | `/overpass-api` proxy | Overpass instance for parks & POIs |
| `VITE_NOMINATIM_URL` | `/nominatim` proxy | Nominatim base URL |
| `VITE_TRAFFIC_HISTORY_URL` | _demo data_ | Traffic history API: `[{ hour, movement, cyclists }]` |

---

## API proxies

Vite (dev) and Vercel (prod) rewrite these paths to avoid browser CORS:

| Path | Target |
| --- | --- |
| `/ippuc-arcgis/*` | GeoCuritiba IPPUC ArcGIS |
| `/osrm/*` | `router.project-osrm.org` |
| `/nominatim/*` | `nominatim.openstreetmap.org` |
| `/overpass-api/*` | `overpass-api.de` |

---

## URL parameters

Share a full route state via query string:

| Parameter | Meaning |
| --- | --- |
| `from` | Origin `lat,lng` (5 decimal places) |
| `to` | Destination `lat,lng` |
| `rnet` | `i` = IPPUC network · `o` = OSRM. With `from`/`to` but no `rnet`, behavior matches legacy OSRM default |
| `ciclovia` | Selected cycle path ID |
| `bairro` | Selected neighborhood |
| `tipo` | Path type filter |
| `seg` | Selected segment |
| `map` | Theme: `dark` · `light` · `satellite` |

`from` / `to` override `ciclovia` / `bairro` on first load.

---

## Routing modes

### OSRM (road network)

Uses the `cycling` profile. If the configured server returns `InvalidUrl` (profile missing), point `VITE_OSRM_URL` at an OSRM instance that exposes bicycle routing — the UI surfaces a clear error otherwise.

### IPPUC network (cycle paths only)

Routes follow mapped infrastructure. Best with `VITE_CICLOVIAS_LIVE_URL` and coordinates snapped to the graph. If no path exists, the app nudges you toward OSRM.

---

## Elevation & difficulty

Profiles come from [Open-Elevation](https://open-elevation.com/) (SRTM). Override with `VITE_ELEVATION_URL` for self-hosted or compatible APIs.

The **Easy / Moderate / Hard** badge blends elevation gain, routing mode, weather, and wind.

---

## Data fallback

If `VITE_CICLOVIAS_LIVE_URL` is unset or the request fails, geometry loads from `src/data/ciclovias.ts`.

---

## Deployment

Configured for [Vercel](https://vercel.com/): connect the repo, run `npm run build`, serve `dist/`. `vercel.json` includes proxy rewrites and the SPA fallback (`/*` → `index.html`).
