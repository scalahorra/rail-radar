---
applyTo: 'web/**'
---

# Frontend instructions

## Stack and structure

- Use React 19, Vite, TypeScript strict mode, MapLibre GL with `react-map-gl/maplibre`, TanStack Query, Tailwind CSS and shadcn/ui. Use Vitest, React Testing Library and MSW for tests.
- Keep API access in `src/api/client.ts`, hooks in `src/hooks/`, pure transformations in `src/lib/`, and UI components in `src/components/`.
- The browser calls only `/api/*`. Vite proxies `/api` to `http://localhost:3000` in development.
- Backend contract is authoritative: `GET /api/trains` returns a GeoJSON FeatureCollection with coordinates `[lon, lat]` and a `Train` in feature properties. `Train.service` is `cercanias | ld`; optional fields are `bearing`, `delayMin`, `destination`, and `color`.
- `GET /api/health` returns `{ ok, sources }`; `sources.cercanias` and `sources.ld` each contain `status` (`ok | down`) and optional `lastSuccessAt`/`lastError`. Do not assume one source's failure means the other failed.
- `GET /api/alerts` exists, but do not build alert UI during the current frontend phases.

## Map performance and interaction

- Do not render a React `<Marker>` per train. Keep a single GeoJSON source named `trains` and use MapLibre `circle` at low zoom and `symbol` with icon and train number at high zoom.
- Rotate train icons from the `bearing` property using `icon-rotate: ['get', 'bearing']` and `icon-rotation-alignment: 'map'`.
- Distinguish Cercanías and Larga Distancia by both color and icon shape.
- Use MapLibre `feature-state` for hover and selection styling; do not rebuild GeoJSON for those states.
- Do not put interpolated positions in React state. (Animation is out of scope until a later phase.)
- Keep selected train, service filters, and map view shareable in URL query parameters.

## States and accessibility

- Design initial loading, backend failure with automatic retry, and independent source failures without blocking the map.
- Render trains older than 60 seconds with reduced opacity.
- Use keyboard-operable controls, visible focus, accessible names, and distinguish service by icon shape as well as color.
- The required always-visible attribution is `Datos: Renfe (CC BY 4.0)` plus OpenFreeMap and, when enabled, OpenRailwayMap credits.

## Conventions and scope

- TypeScript strict; never use `any`. Keep code/comments in English and user-facing UI text in Spanish.
- Use functional React components and test pure `lib/` functions.
- Use only fields present in `/api/trains` and `/api/health`. Mark missing backend capabilities with `// TODO(backend)` and report them.
- Follow the user's requested phase boundary. Do not implement interpolation/animation, follow-train mode, alerts UI, legend, or a mobile-specific version unless requested later. Add `// TODO(phase N)` at deferred work.
- Do not add CORS assumptions; the frontend and API are same-origin in production.

## Commands

- From the repository root: `pnpm --filter @rail-radar/web dev`, `pnpm --filter @rail-radar/web build`, `pnpm --filter @rail-radar/web test`, `pnpm --filter @rail-radar/web typecheck`, and `pnpm lint`.
- When changing dependencies, update the pnpm lockfile.
