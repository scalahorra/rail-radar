# Rail Radar

## Objetivo y arquitectura

- Web React + Vite para mostrar trenes de Renfe en tiempo real sobre un mapa de España.
- `/server` es Node 22 + TypeScript + Fastify. Un poller consulta las fuentes cada 20 s, normaliza y guarda los datos en memoria; las rutas HTTP solo leen esa caché.
- `/web` es React 19 + Vite + TypeScript y consume únicamente `/api/*`; en desarrollo Vite proxya a `http://localhost:3000`. Las instrucciones específicas están en `.github/instructions/web.instructions.md`.
- Los tipos de dominio compartidos viven en `/shared/train.ts`. `GET /api/trains` devuelve GeoJSON FeatureCollection con `[lon, lat]` y propiedades `Train`; `service` es `cercanias | ld`, y puede incluir `bearing`, `delayMin`, `destination` y `color`. `GET /api/health` devuelve `{ ok, sources }` con estado independiente de Cercanías y LD.
- `docs/samples/` contiene respuestas reales de Renfe en JSON y es la fuente de verdad para tipos, esquemas y tests. No deducir payloads: si faltan samples, implementar primero el script que los descarga.

## Fuentes

- Cercanías oficial, GTFS-Realtime protobuf y sin clave: `https://gtfsrt.renfe.com/vehicle_positions.pb`, `trip_updates.pb` y `alerts.pb`.
- GTFS estático oficial (CSV `routes.txt` y `trips.txt`) para asociar `trip_id` con línea, destino y color. El índice se carga al arrancar; no versionar el ZIP ni los CSV descargados.
- Flota LD: JSON del visor `https://tiempo-real.largorecorrido.renfe.com/renfe-visor/flotaLD.json`; usa `LD_POSITIONS_URL` para sustituirlo y añade un cache-buster `v` en cada consulta. Validar siempre con zod porque el formato puede cambiar.

## Contrato y API

- `Train`: `id`, `service` (`cercanias` | `ld`), `line`, `number`, `lat`, `lon`, `bearing?`, `delayMin?`, `destination?`, `color?`, `updatedAt` (ISO 8601 UTC).
- `GET /api/trains` devuelve GeoJSON FeatureCollection con Point `[lon, lat]` y el objeto `Train` en `properties`.
- `GET /api/alerts` devuelve incidencias de Cercanías. `GET /api/health` informa estado por fuente para Cercanías y LD; un error de validación LD marca LD como caída sin detener Cercanías, y un error aislado de alertas conserva la última lista válida.

## Stack y convenciones

- Backend: Fastify, `gtfs-realtime-bindings`, zod, `csv-parse`, `adm-zip`, `tsx`, Vitest y TypeScript. No añadir dependencias sin explicar el motivo.
- TypeScript estricto; no usar `any`. Código y comentarios en inglés; mensajes dirigidos al usuario en español.
- Separar IO (`fetch.ts`) de transformación pura (`normalize.ts`); probar normalizadores con samples reales.
- Atribución obligatoria en la web: “Datos: Renfe (CC BY 4.0)”.
