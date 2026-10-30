import type { Train, TrainAlert } from '@rail-radar/shared/train'
import type { StaticIndex } from '../../gtfs/staticIndex.js'
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

function delaySeconds(entity: RealtimeEntity | undefined): number | undefined {
  const update = entity?.tripUpdate
  if (update?.delay !== undefined) {
    return update.delay
  }

  for (const stopUpdate of update?.stopTimeUpdate ?? []) {
    const delay = stopUpdate.arrival?.delay ?? stopUpdate.departure?.delay
    if (delay !== undefined) {
      return delay
    }
  }

  return undefined
}

function translationText(
  translations: Array<{ text: string; language?: string | undefined }> | undefined,
): string | undefined {
  return (
    translations?.find((translation) => translation.language?.toLowerCase().startsWith('es'))
      ?.text ?? translations?.[0]?.text
  )
}

export function normalizeCercaniasPositions(
  positionsPayload: unknown,
  tripUpdatesPayload: unknown,
  staticIndex: StaticIndex,
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

    const route = staticIndex.getTrip(tripId)
    const line =
      route?.line ?? lineFromId(vehicle.trip?.routeId) ?? lineFromId(tripId) ?? 'Cercanías'
    if (isReplacementBus(entity, line)) {
      continue
    }

    const nucleus = tripId.match(/^(\d{2})/)?.[1] ?? 'unknown'
    const timestamp = vehicle.timestamp ?? positions.header?.timestamp
    const delay = delaySeconds(update)
    const train: Train = {
      id: `cercanias:${nucleus}:${tripId}`,
      service: 'cercanias',
      line,
      number: getTrainNumber(tripId, vehicle.vehicle?.id),
      lat: position.latitude,
      lon: position.longitude,
      updatedAt: epochToIso(timestamp, now),
      ...(position.bearing !== undefined ? { bearing: position.bearing } : {}),
      ...(delay !== undefined ? { delayMin: Math.round(delay / 60) } : {}),
      ...(route?.destination ? { destination: route.destination } : {}),
      ...(route?.color ? { color: route.color } : {}),
    }

    trains.set(train.id, train)
  }

  return [...trains.values()]
}

export function normalizeCercaniasAlerts(
  payload: unknown,
  staticIndex: StaticIndex,
  now = new Date(),
): TrainAlert[] {
  const feed = realtimeFeedSchema.parse(payload)
  const alerts: TrainAlert[] = []

  for (const entity of feed.entity) {
    const alert = entity.alert
    if (!alert || !entity.id) {
      continue
    }

    const text =
      translationText(alert.descriptionText?.translation) ??
      translationText(alert.headerText?.translation)
    if (!text) {
      continue
    }

    const lines = new Set<string>()
    for (const informedEntity of alert.informedEntity ?? []) {
      const routeId = informedEntity.routeId
      if (!routeId) {
        continue
      }

      const line = staticIndex.getRoute(routeId)?.line ?? lineFromId(routeId)
      if (line) {
        lines.add(line)
      }
    }

    const activePeriod = alert.activePeriod?.[0]
    alerts.push({
      id: entity.id,
      text,
      lines: [...lines],
      ...(activePeriod?.start !== undefined
        ? { startsAt: epochToIso(activePeriod.start, now) }
        : {}),
      ...(activePeriod?.end !== undefined ? { endsAt: epochToIso(activePeriod.end, now) } : {}),
    })
  }

  return alerts
}

// TODO(phase 8): Normalize Larga Distancia feeds.
