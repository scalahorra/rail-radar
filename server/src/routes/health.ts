import type { FastifyInstance } from 'fastify'
import type { HealthResponse } from '@rail-radar/shared/train'
import type { TrainStore } from '../store/trainStore.js'

export async function registerHealthRoutes(app: FastifyInstance, store: TrainStore): Promise<void> {
  app.get('/api/health', async (): Promise<HealthResponse> => store.getHealth())
}
