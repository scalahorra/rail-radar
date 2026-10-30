import fastifyCompress from '@fastify/compress'
import fastifyStatic from '@fastify/static'
import Fastify from 'fastify'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { registerAlertRoutes } from './routes/alerts.js'
import { registerHealthRoutes } from './routes/health.js'
import { registerTrainRoutes } from './routes/trains.js'
import { TrainStore } from './store/trainStore.js'

export async function createApp(
  store = new TrainStore(),
  webDistPath = resolve(process.cwd(), '../web/dist'),
) {
  const app = Fastify({ logger: true })

  await app.register(fastifyCompress, { global: true, threshold: 1024 })
  if (existsSync(webDistPath)) {
    await app.register(fastifyStatic, { root: webDistPath, prefix: '/' })
  }

  await registerTrainRoutes(app, store)
  await registerAlertRoutes(app, store)
  await registerHealthRoutes(app, store)
  return app
}
