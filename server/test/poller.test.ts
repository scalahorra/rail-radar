import { describe, expect, it, vi } from 'vitest'
import { StaticIndex } from '../src/gtfs/staticIndex.js'
import { runPollCycle } from '../src/poller.js'
import { TrainStore } from '../src/store/trainStore.js'

describe('poller source isolation', () => {
  it('marks invalid Larga Distancia data down without stopping Cercanías', async () => {
    const store = new TrainStore()
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined)

    await runPollCycle(store, StaticIndex.empty(), {
      positions: async () => ({
        entity: [
          {
            vehicle: {
              trip: { tripId: '10T0001C1' },
              position: { latitude: 40.4, longitude: -3.7 },
            },
          },
        ],
      }),
      tripUpdates: async () => ({ entity: [] }),
      alerts: async () => ({ entity: [] }),
      longDistance: async () => ({ fechaActualizacion: 'invalid', trenes: 'invalid' }),
    })

    errorSpy.mockRestore()

    expect(store.getTrains()).toMatchObject([
      { service: 'cercanias', id: 'cercanias:10:10T0001C1' },
    ])
    expect(store.getHealth()).toMatchObject({
      ok: false,
      sources: {
        cercanias: { status: 'ok' },
        ld: { status: 'down', lastError: expect.any(String) },
      },
    })
  })
})
