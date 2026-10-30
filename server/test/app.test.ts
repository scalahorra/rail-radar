import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
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
    store.replaceServiceTrains('cercanias', [train])
    store.replaceAlerts([{ id: 'alert-1', text: 'Incidencia', lines: ['C1'] }])
    store.markSourceSuccess('cercanias')
    const app = await createApp(store)

    const trainsResponse = await app.inject('/api/trains')
    expect(trainsResponse.statusCode).toBe(200)
    expect(trainsResponse.headers['cache-control']).toBe(
      'public, max-age=5, stale-while-revalidate=10',
    )
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
    expect(healthResponse.json()).toMatchObject({
      ok: false,
      sources: {
        cercanias: { status: 'ok' },
        ld: { status: 'down' },
      },
    })

    const alertsResponse = await app.inject('/api/alerts')
    expect(alertsResponse.statusCode).toBe(200)
    expect(alertsResponse.json()).toEqual([{ id: 'alert-1', text: 'Incidencia', lines: ['C1'] }])

    await app.close()
  })

  it('serves the web app and compresses static assets', async () => {
    const webDistPath = await mkdtemp(join(tmpdir(), 'rail-radar-web-'))
    const assetsPath = join(webDistPath, 'assets')
    await mkdir(assetsPath)
    await writeFile(join(webDistPath, 'index.html'), '<html><body>Rail Radar</body></html>')
    await writeFile(join(assetsPath, 'app.js'), 'const app = true;\n'.repeat(200))
    const app = await createApp(new TrainStore(), webDistPath)

    try {
      const indexResponse = await app.inject('/')
      expect(indexResponse.statusCode).toBe(200)
      expect(indexResponse.body).toContain('Rail Radar')

      const assetResponse = await app.inject({
        url: '/assets/app.js',
        headers: { 'accept-encoding': 'gzip' },
      })
      expect(assetResponse.statusCode).toBe(200)
      expect(assetResponse.headers['content-encoding']).toBe('gzip')
    } finally {
      await app.close()
      await rm(webDistPath, { recursive: true, force: true })
    }
  })
})
