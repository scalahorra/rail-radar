# Rail Radar

Backend mínimo para consultar posiciones de trenes de Cercanías. Cada 20 segundos descarga las posiciones y actualizaciones de viaje, normaliza los trenes y guarda el resultado en memoria durante un máximo de 60 segundos. Las rutas HTTP solo leen esa caché.

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
- `server/src/sources/cercanias/normalize.ts`: convierte los feeds a trenes.
- `server/src/gtfs/staticIndex.ts`: relaciona cada viaje con línea, destino y color.
- `server/scripts/download-gtfs.ts`: descarga y extrae los archivos GTFS necesarios.
- `server/src/poller.ts`: actualiza la caché cada 20 segundos.
- `server/src/store/trainStore.ts`: conserva trenes y estado de salud en memoria.
- `shared/train.ts`: tipos compartidos por backend y web.

## Probar la API

Con el servidor en marcha, abre estas direcciones en el navegador:

- `http://localhost:3000/api/health`: indica si Cercanías se está actualizando correctamente y muestra el último error si lo hay.
- `http://localhost:3000/api/trains`: devuelve los trenes disponibles como GeoJSON. Puede tardar hasta 10 segundos en llenarse tras iniciar el servidor.

También puedes ejecutar `pnpm test:server` para probar la normalización con los samples y la retención de la caché.
