import type { TrainAlert } from '@rail-radar/shared/train'
import type { FastifyInstance } from 'fastify'
import type { TrainStore } from '../store/trainStore.js'

export async function registerAlertRoutes(app: FastifyInstance, store: TrainStore): Promise<void> {
  app.get('/api/alerts', async (): Promise<TrainAlert[]> => store.getAlerts())
}
