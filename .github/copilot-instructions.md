# Rail Radar

## Objetivo y arquitectura

- Web React + Vite para mostrar trenes de Renfe en tiempo real sobre un mapa de España.
- `/server` es Node 22 + TypeScript + Fastify. Un poller consulta las fuentes cada 20 s, normaliza y guarda los datos en memoria; las rutas HTTP solo leen esa caché.
- `/web` consume únicamente `/api/*`. Los tipos de dominio compartidos viven en `/shared/train.ts`.
- `docs/samples/` contiene respuestas reales de Renfe en JSON y es la fuente de verdad para tipos, esquemas y tests. No deducir payloads: si faltan samples, implementar primero el script que los descarga.

## Fuentes

- Cercanías oficial, GTFS-Realtime protobuf y sin clave: `https://gtfsrt.renfe.com/vehicle_positions.pb`, `trip_updates.pb` y `alerts.pb`.
- GTFS estático oficial (CSV `routes.txt` y `trips.txt`) para asociar `trip_id` con línea, destino y color. El índice se carga al arrancar; no versionar el ZIP ni los CSV descargados.
- AV/LD/MD: feed JSON oficial `https://gtfsrt.renfe.com/vehicle_positions_LD.json`, publicado en `data.renfe.com`; validar siempre con zod porque el formato puede cambiar.

## Contrato y API

- `Train`: `id`, `service` (`cercanias` | `ld`), `line`, `number`, `lat`, `lon`, `bearing?`, `delayMin?`, `destination?`, `color?`, `updatedAt` (ISO 8601 UTC).
- `GET /api/trains` devuelve GeoJSON FeatureCollection con Point `[lon, lat]` y el objeto `Train` en `properties`.
- `GET /api/alerts` devuelve incidencias de Cercanías. `GET /api/health` informa por fuente última actualización correcta, último error y estado.

## Stack y convenciones

- Backend: Fastify, `gtfs-realtime-bindings`, zod, `csv-parse`, `adm-zip`, `tsx`, Vitest y TypeScript. No añadir dependencias sin explicar el motivo.
- TypeScript estricto; no usar `any`. Código y comentarios en inglés; mensajes dirigidos al usuario en español.
- Separar IO (`fetch.ts`) de transformación pura (`normalize.ts`); probar normalizadores con samples reales.
- Atribución obligatoria en la web: “Datos: Renfe (CC BY 4.0)”.
