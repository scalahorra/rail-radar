import { describe, expect, it } from 'vitest'
import type { Train, TrainFeatureCollection } from '@rail-radar/shared/train'
import {
  filterMapFeatureCollection,
  filterTrains,
  formatDelay,
  toMapFeatureCollection,
} from './trains'

const cercaniasTrain: Train = {
  id: 'C1-42',
  service: 'cercanias',
  line: 'C-1',
  number: '42',
  lat: 40.4,
  lon: -3.7,
  destination: 'Aeropuerto',
  updatedAt: '2025-01-01T10:00:00.000Z',
}

const ldTrain: Train = {
  id: 'LD-0087',
  service: 'ld',
  line: 'AVE',
  number: '0087',
  lat: 41.4,
  lon: 2.2,
  delayMin: 8,
  updatedAt: '2025-01-01T10:01:00.000Z',
}

const collection: TrainFeatureCollection = {
  type: 'FeatureCollection',
  features: [cercaniasTrain, ldTrain].map((properties) => ({
    type: 'Feature',
    geometry: { type: 'Point', coordinates: [properties.lon, properties.lat] },
    properties,
  })),
}

describe('train helpers', () => {
  it('adds stable feature ids and marks positions older than 60 seconds', () => {
    const result = toMapFeatureCollection(collection, Date.parse('2025-01-01T10:02:00.000Z'))

    expect(result.features[0]).toMatchObject({ id: 'C1-42', properties: { stale: true } })
    expect(result.features[1]).toMatchObject({ id: 'LD-0087', properties: { stale: false } })
  })

  it('filters by service and searches line, number, destination, or id', () => {
    expect(filterTrains([cercaniasTrain, ldTrain], ['cercanias'], 'aeropuerto')).toEqual([
      cercaniasTrain,
    ])
    expect(filterTrains([cercaniasTrain, ldTrain], ['ld'], '87')).toEqual([ldTrain])
  })

  it('filters the GeoJSON features shown on the map', () => {
    const mapCollection = toMapFeatureCollection(collection)
    const filtered = filterMapFeatureCollection(mapCollection, ['cercanias'], 'aeropuerto')

    expect(filtered.features.map((feature) => feature.properties.id)).toEqual(['C1-42'])
  })

  it('formats positive, negative, and absent delays', () => {
    expect(formatDelay(8)).toBe('8 min de retraso')
    expect(formatDelay(-3)).toBe('3 min antes')
    expect(formatDelay()).toBe('En hora')
  })
})
