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
    store.replaceServiceTrains('cercanias', [sampleTrain], 0)
    store.replaceServiceTrains('cercanias', [], 30_000)

    expect(store.getTrains(59_999)).toHaveLength(1)
    expect(store.getTrains(60_001)).toHaveLength(0)
  })

  it('does not expire another service when replacing one service', () => {
    const store = new TrainStore(60_000)
    const longDistanceTrain: Train = {
      ...sampleTrain,
      id: 'ld:15064',
      service: 'ld',
      line: 'LD',
    }
    store.replaceServiceTrains('cercanias', [sampleTrain], 0)
    store.replaceServiceTrains('ld', [longDistanceTrain], 30_000)
    store.replaceServiceTrains('cercanias', [], 30_000)

    expect(store.getTrains(59_999).map((train) => train.service)).toEqual(['cercanias', 'ld'])
    expect(store.getTrains(60_001).map((train) => train.service)).toEqual(['ld'])
  })

  it('keeps the previous success time when a source fails', () => {
    const store = new TrainStore()
    store.markSourceSuccess('cercanias', new Date('2026-10-30T12:00:00.000Z'))
    store.markSourceFailure('cercanias', new Error('network unavailable'))

    expect(store.getHealth()).toEqual({
      ok: false,
      sources: {
        cercanias: {
          status: 'down',
          lastSuccessAt: '2026-10-30T12:00:00.000Z',
          lastError: 'network unavailable',
        },
        ld: { status: 'down' },
      },
    })
  })
})
