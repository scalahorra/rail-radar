import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { normalizeCercaniasPositions } from '../src/sources/cercanias/normalize.js'

async function readSample(filename: string): Promise<unknown> {
  const contents = await readFile(resolve(process.cwd(), '../docs/samples', filename), 'utf8')
  return JSON.parse(contents)
}

describe('Renfe feed normalizers', () => {
  it('normalizes Cercanías positions from real samples', async () => {
    const positions = await readSample('vehicle-positions.sample.json')
    const updates = await readSample('trip-updates.sample.json')
    const trains = normalizeCercaniasPositions(
      positions,
      updates,
      new Date('2026-10-30T12:00:00.000Z'),
    )

    expect(trains.length).toBeGreaterThan(0)
    expect(trains.every((train) => train.lat !== 0 || train.lon !== 0)).toBe(true)
    expect(trains.every((train) => train.id.startsWith('cercanias:'))).toBe(true)
    expect(trains[0]).not.toHaveProperty('delayMin')
  })

  it('ignores canceled trips and empty coordinates', () => {
    const positions = {
      entity: [
        {
          vehicle: {
            trip: { tripId: '10T0001C1' },
            position: { latitude: 40.4, longitude: -3.7 },
          },
        },
        {
          vehicle: {
            trip: { tripId: '10T0002C2' },
            position: { latitude: 0, longitude: 0 },
          },
        },
      ],
    }
    const updates = {
      entity: [
        {
          tripUpdate: {
            trip: { tripId: '10T0001C1', scheduleRelationship: 'CANCELED' },
          },
        },
      ],
    }

    expect(normalizeCercaniasPositions(positions, updates)).toEqual([])
  })

  it('rejects a feed that does not match the GTFS-Realtime shape', () => {
    expect(() => normalizeCercaniasPositions({ entity: 'not-an-array' }, { entity: [] })).toThrow()
  })
})
