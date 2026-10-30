import type { Train } from '@rail-radar/shared/train'
import { realtimeFeedSchema } from '../realtimeSchema.js'

type RealtimeEntity = ReturnType<typeof realtimeFeedSchema.parse>['entity'][number]

function epochToIso(value: string | number | undefined, fallback: Date): string {
  if (value === undefined) {
    return fallback.toISOString()
  }

  const epochSeconds = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(epochSeconds)) {
    return fallback.toISOString()
  }

  return new Date(epochSeconds * 1000).toISOString()
}

function lineFromId(value: string | undefined): string | undefined {
  if (!value) {
    return undefined
  }

  return value.match(/(?:T\d+|V\d+)([A-Z][A-Z0-9]*[a-z]?)$/)?.[1]
}

function isReplacementBus(entity: RealtimeEntity, line: string): boolean {
  const vehicle = entity.vehicle
  const description = [vehicle?.trip?.tripId, vehicle?.vehicle?.id, vehicle?.vehicle?.label, line]
    .filter(Boolean)
    .join(' ')

  return /\b(bus|autob[uú]s)\b/i.test(description)
}

function getTrainNumber(tripId: string, vehicleId: string | undefined): string {
  return vehicleId || tripId.match(/V(\d+)/)?.[1] || tripId
}

export function normalizeCercaniasPositions(
  positionsPayload: unknown,
  tripUpdatesPayload: unknown,
  now = new Date(),
): Train[] {
  const positions = realtimeFeedSchema.parse(positionsPayload)
  const updates = realtimeFeedSchema.parse(tripUpdatesPayload)
  const updatesByTripId = new Map<string, RealtimeEntity>()

  for (const entity of updates.entity) {
    const tripId = entity.tripUpdate?.trip?.tripId
    if (tripId) {
      updatesByTripId.set(tripId, entity)
    }
  }

  const trains = new Map<string, Train>()
  for (const entity of positions.entity) {
    const vehicle = entity.vehicle
    const tripId = vehicle?.trip?.tripId
    const position = vehicle?.position
    if (!tripId || !position || (position.latitude === 0 && position.longitude === 0)) {
      continue
    }

    const update = updatesByTripId.get(tripId)
    if (update?.tripUpdate?.trip?.scheduleRelationship === 'CANCELED') {
      continue
    }

    const line = lineFromId(vehicle.trip?.routeId) ?? lineFromId(tripId) ?? 'Cercanías'
    if (isReplacementBus(entity, line)) {
      continue
    }

    const nucleus = tripId.match(/^(\d{2})/)?.[1] ?? 'unknown'
    const timestamp = vehicle.timestamp ?? positions.header?.timestamp
    const train: Train = {
      id: `cercanias:${nucleus}:${tripId}`,
      service: 'cercanias',
      line,
      number: getTrainNumber(tripId, vehicle.vehicle?.id),
      lat: position.latitude,
      lon: position.longitude,
      updatedAt: epochToIso(timestamp, now),
      ...(position.bearing !== undefined ? { bearing: position.bearing } : {}),
    }

    trains.set(train.id, train)
  }

  return [...trains.values()]
}

// TODO(phase 6): Enrich line metadata from static GTFS and normalize trip delays and alerts.
