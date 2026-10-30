import { HttpResponse, http } from 'msw'
import { describe, expect, it } from 'vitest'
import type { HealthResponse, TrainFeatureCollection } from '@rail-radar/shared/train'
import { fetchHealth, fetchTrains } from './client'
import { server } from '../test/server'

const trains: TrainFeatureCollection = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [-3.7, 40.4] },
      properties: {
        id: 'C1-42',
        service: 'cercanias',
        line: 'C-1',
        number: '42',
        lat: 40.4,
        lon: -3.7,
        updatedAt: '2025-01-01T10:00:00.000Z',
      },
    },
  ],
}

const health: HealthResponse = {
  ok: true,
  sources: {
    cercanias: { status: 'ok', lastSuccessAt: '2025-01-01T10:00:00.000Z' },
    ld: { status: 'down', lastError: 'Feed unavailable' },
  },
}

describe('API client', () => {
  it('reads the trains GeoJSON collection', async () => {
    server.use(http.get('http://localhost:3000/api/trains', () => HttpResponse.json(trains)))

    await expect(fetchTrains()).resolves.toEqual(trains)
  })

  it('reads health independently for both sources', async () => {
    server.use(http.get('http://localhost:3000/api/health', () => HttpResponse.json(health)))

    await expect(fetchHealth()).resolves.toEqual(health)
  })
})
