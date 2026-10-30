import { describe, expect, it } from 'vitest'
import type { Train } from '@rail-radar/shared/train'
import { createApp } from '../src/app.js'
import { TrainStore } from '../src/store/trainStore.js'

describe('API routes', () => {
  it('returns trains as a GeoJSON FeatureCollection and exposes source health', async () => {
    const store = new TrainStore()
    const train: Train = {
      id: 'cercanias:10:trip-1',
      service: 'cercanias',
      line: 'C1',
      number: '12345',
      lat: 40.4,
      lon: -3.7,
      updatedAt: '2026-10-30T12:00:00.000Z',
    }
    store.replaceTrains([train])
    store.replaceAlerts([{ id: 'alert-1', text: 'Incidencia', lines: ['C1'] }])
    store.markSourceSuccess()
    const app = await createApp(store)

    const trainsResponse = await app.inject('/api/trains')
    expect(trainsResponse.statusCode).toBe(200)
    expect(trainsResponse.json()).toMatchObject({
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [-3.7, 40.4] },
          properties: train,
        },
      ],
    })

    const healthResponse = await app.inject('/api/health')
    expect(healthResponse.json()).toMatchObject({ ok: true, source: { status: 'ok' } })

    const alertsResponse = await app.inject('/api/alerts')
    expect(alertsResponse.statusCode).toBe(200)
    expect(alertsResponse.json()).toEqual([{ id: 'alert-1', text: 'Incidencia', lines: ['C1'] }])

    await app.close()
  })
})
