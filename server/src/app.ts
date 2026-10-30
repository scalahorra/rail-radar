import Fastify from 'fastify'
import { registerHealthRoutes } from './routes/health.js'
import { registerTrainRoutes } from './routes/trains.js'
import { TrainStore } from './store/trainStore.js'

export async function createApp(store = new TrainStore()) {
  const app = Fastify({ logger: true })
  await registerTrainRoutes(app, store)
  await registerHealthRoutes(app, store)
  return app
}
