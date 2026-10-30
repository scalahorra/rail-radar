import type { FeatureCollection, Point } from 'geojson'
import type { Train, TrainFeatureCollection } from '@rail-radar/shared/train'

export type TrainMapProperties = Train & { stale: boolean }
export type TrainMapCollection = FeatureCollection<Point, TrainMapProperties>
export type ServiceFilter = 'cercanias' | 'ld'

export function toMapFeatureCollection(
  collection: TrainFeatureCollection,
  now = Date.now(),
): TrainMapCollection {
  return {
    type: 'FeatureCollection',
    features: collection.features.map(({ geometry, properties }) => ({
      type: 'Feature',
      id: properties.id,
      geometry,
      properties: {
        ...properties,
        stale: now - Date.parse(properties.updatedAt) > 60_000,
      },
    })),
  }
}

export function filterTrains(trains: Train[], services: ServiceFilter[], query: string): Train[] {
  const normalizedQuery = query.trim().toLocaleLowerCase('es')

  return trains.filter((train) => {
    if (!services.includes(train.service)) return false
    if (!normalizedQuery) return true

    return [train.number, train.line, train.destination, train.id]
      .filter(Boolean)
      .some((value) => value?.toLocaleLowerCase('es').includes(normalizedQuery))
  })
}

export function filterMapFeatureCollection(
  collection: TrainMapCollection,
  services: ServiceFilter[],
  query: string,
): TrainMapCollection {
  const visibleIds = new Set(
    filterTrains(
      collection.features.map((feature) => feature.properties),
      services,
      query,
    ).map((train) => train.id),
  )

  return {
    ...collection,
    features: collection.features.filter((feature) => visibleIds.has(feature.properties.id)),
  }
}

export function formatDelay(delayMin?: number): string {
  if (delayMin === undefined || delayMin === 0) return 'En hora'
  if (delayMin < 0) return `${Math.abs(delayMin)} min antes`
  return `${delayMin} min de retraso`
}

export function newestUpdate(trains: Train[]): string | null {
  return trains.reduce<string | null>((latest, train) => {
    if (!latest || Date.parse(train.updatedAt) > Date.parse(latest)) return train.updatedAt
    return latest
  }, null)
}
