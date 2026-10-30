import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { StaticIndex } from '../src/gtfs/staticIndex.js'
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
      StaticIndex.empty(),
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

    expect(normalizeCercaniasPositions(positions, updates, StaticIndex.empty())).toEqual([])
  })

  it('enriches trains with line, destination, and color from static GTFS', () => {
    const index = StaticIndex.fromCsv(
      'route_id,route_short_name,route_long_name,route_color\n10T0001C1,C 1,Line 1,073588',
      'route_id,service_id,trip_id,trip_headsign\n10T0001C1,weekday,10T0001C1,Airport T4',
    )
    const positions = {
      entity: [
        {
          vehicle: {
            trip: { tripId: '10T0001C1' },
            position: { latitude: 40.4, longitude: -3.7 },
            vehicle: { id: '12345' },
          },
        },
      ],
    }

    const trains = normalizeCercaniasPositions(positions, { entity: [] }, index)

    expect(trains[0]).toMatchObject({
      line: 'C1',
      destination: 'Airport T4',
      color: '#073588',
    })
  })

  it('rejects a feed that does not match the GTFS-Realtime shape', () => {
    expect(() =>
      normalizeCercaniasPositions({ entity: 'not-an-array' }, { entity: [] }, StaticIndex.empty()),
    ).toThrow()
  })
})
