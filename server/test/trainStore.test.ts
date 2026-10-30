import { describe, expect, it } from 'vitest'
import type { Train } from '@rail-radar/shared/train'
import { TrainStore } from '../src/store/trainStore.js'

const sampleTrain: Train = {
  id: 'cercanias:10:trip-1',
  service: 'cercanias',
  line: 'C1',
  number: '12345',
  lat: 40.4,
  lon: -3.7,
  updatedAt: '2026-10-30T12:00:00.000Z',
}

describe('TrainStore', () => {
  it('retains a missing train for 60 seconds and then expires it', () => {
    const store = new TrainStore(60_000)
    store.replaceTrains([sampleTrain], 0)
    store.replaceTrains([], 30_000)

    expect(store.getTrains(59_999)).toHaveLength(1)
    expect(store.getTrains(60_001)).toHaveLength(0)
  })

  it('keeps the previous success time when a source fails', () => {
    const store = new TrainStore()
    store.markSourceSuccess(new Date('2026-10-30T12:00:00.000Z'))
    store.markSourceFailure(new Error('network unavailable'))

    expect(store.getHealth()).toEqual({
      ok: false,
      source: {
        status: 'down',
        lastSuccessAt: '2026-10-30T12:00:00.000Z',
        lastError: 'network unavailable',
      },
    })
  })
})
