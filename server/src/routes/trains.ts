import type { FastifyInstance } from 'fastify'
import type { TrainFeatureCollection } from '@rail-radar/shared/train'
import type { TrainStore } from '../store/trainStore.js'

export async function registerTrainRoutes(app: FastifyInstance, store: TrainStore): Promise<void> {
  app.get('/api/trains', async (_request, reply): Promise<TrainFeatureCollection> => {
    reply.header('Cache-Control', 'public, max-age=5, stale-while-revalidate=10')
    return {
      type: 'FeatureCollection',
      features: store.getTrains().map((train) => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [train.lon, train.lat] },
        properties: train,
      })),
    }
  })
}
