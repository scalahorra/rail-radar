# Rail Radar

Backend para consultar trenes de Cercanías y Larga Distancia, además de incidencias de Cercanías. Cada 20 segundos descarga, valida y normaliza los feeds; las rutas HTTP solo leen la caché en memoria. Un fallo de Larga Distancia no detiene la actualización de Cercanías.

## Requisitos e inicio

Necesitas Node.js 22 o superior y pnpm. Desde la raíz del repositorio:

```sh
pnpm install
pnpm samples
pnpm gtfs
pnpm dev:server
```

`pnpm samples` descarga los tres feeds GTFS-Realtime de Cercanías y guarda sus muestras JSON en `docs/samples/`. No es necesario para arrancar el servidor; se usa como referencia y en los tests.
`pnpm gtfs` descarga el ZIP oficial y extrae `routes.txt` y `trips.txt` en `server/data/gtfs/`. El servidor carga esos archivos al arrancar para añadir línea, destino y color a los trenes; si aún no existen, inicia sin esos metadatos.

## Archivos principales

- `server/src/index.ts`: inicia Fastify y el poller.
- `server/src/app.ts`: configura las rutas HTTP.
- `server/src/sources/cercanias/fetch.ts`: descarga y decodifica protobuf.
- `server/src/sources/cercanias/normalize.ts`: convierte posiciones y retrasos a trenes, y alertas a incidencias.
- `server/src/sources/largoRecorrido/schema.ts`: valida el JSON de flota LD con Zod.
- `server/src/sources/largoRecorrido/normalize.ts`: convierte el JSON validado a trenes de dominio.
- `server/src/sources/largoRecorrido/fetch.ts`: descarga el JSON de LD con timeout.
- `server/src/routes/alerts.ts`: sirve las incidencias guardadas en memoria.
- `server/src/gtfs/staticIndex.ts`: relaciona cada viaje con línea, destino y color.
- `server/scripts/download-gtfs.ts`: descarga y extrae los archivos GTFS necesarios.
- `server/src/poller.ts`: actualiza la caché cada 20 segundos.
- `server/src/store/trainStore.ts`: conserva trenes y estado de salud en memoria.
- `shared/train.ts`: tipos compartidos por backend y web.

## Probar la API

Con el servidor en marcha, abre estas direcciones en el navegador:

- `http://localhost:3000/api/health`: muestra el estado y último error de Cercanías y Larga Distancia por separado.
- `http://localhost:3000/api/trains`: devuelve los trenes disponibles como GeoJSON. Puede tardar hasta 10 segundos en llenarse tras iniciar el servidor.
- `http://localhost:3000/api/alerts`: devuelve incidencias de Cercanías con texto, líneas afectadas y periodo activo.

El feed LD usa el JSON del visor de Renfe. Puedes sobrescribir su URL con `LD_POSITIONS_URL`; cada consulta añade un parámetro `v` para evitar respuestas cacheadas.

También puedes ejecutar `pnpm test:server` para probar la normalización con los samples y la retención de la caché.
