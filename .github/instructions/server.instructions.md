---
applyTo: 'server/**'
---

# Reglas del backend

- Mantén la estructura por responsabilidades: `index.ts` arranca; `app.ts` crea Fastify y registra rutas exportables para tests; `config.ts` concentra entorno y valores por defecto; `routes/`, `sources/`, `gtfs/`, `store/` y `poller.ts` contienen HTTP, adaptadores, índice estático, caché y ciclo de actualización.
- Las rutas solo leen de la caché. El poller obtiene y transforma datos fuera de las peticiones de usuario; cada fuente se actualiza de forma aislada y un fallo no debe detener el proceso ni borrar el último dato válido.
- Toda descarga tiene timeout de 10 s. Captura cada error de ciclo, regístralo para logs y `/api/health`, y continúa con el último dato válido. Fechas en ISO UTC.
- Cercanías: protobuf GTFS-Realtime; descarta `(0, 0)` y autobuses de sustitución. La clave del tren es núcleo + `trip_id`, no el entity id. Conserva posiciones ausentes de un lote hasta 60 s.
- Largo recorrido: valida cada respuesta con zod antes de normalizar; trata el formato y la disponibilidad como inestables.
- No inventes estructuras de Renfe. Usa los JSON de `docs/samples/` como referencia; si faltan, crea/ejecuta primero `server/scripts/download-samples.ts`. Mantén descargas (`fetch.ts`) y normalización pura (`normalize.ts`) separadas.
- GTFS estático se descarga con `server/scripts/download-gtfs.ts`; extrae `routes.txt` y `trips.txt` a `server/data/gtfs/`, que no se suben al repo. `index.ts` carga el índice una vez al arrancar y el normalizador lo usa solo para asociar `trip_id` a línea, destino y color. Si los archivos no están disponibles, el servidor inicia sin esos metadatos.
- Código y comentarios en inglés, TypeScript estricto y sin `any`. Añade tests Vitest enfocados en los samples y casos de ausencia/error.
- Comandos previstos desde la raíz: `pnpm --filter @rail-radar/server dev`, `pnpm --filter @rail-radar/server test`, `pnpm --filter @rail-radar/server typecheck` y `pnpm lint`. Si los scripts aún no existen, añádelos al paquete del servidor.
