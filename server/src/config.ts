function positiveInteger(value: string | undefined, fallback: number, name: string): number {
  if (value === undefined) {
    return fallback
  }

  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${name} must be a positive integer`)
  }

  return parsed
}

export const config = {
  host: process.env.HOST ?? '0.0.0.0',
  port: positiveInteger(process.env.PORT, 3000, 'PORT'),
  pollIntervalMs: positiveInteger(process.env.POLL_INTERVAL_MS, 20_000, 'POLL_INTERVAL_MS'),
  trainRetentionMs: positiveInteger(process.env.TRAIN_RETENTION_MS, 60_000, 'TRAIN_RETENTION_MS'),
  cercaniasPositionsUrl:
    process.env.CERCANIAS_POSITIONS_URL ?? 'https://gtfsrt.renfe.com/vehicle_positions.pb',
  cercaniasTripUpdatesUrl:
    process.env.CERCANIAS_TRIP_UPDATES_URL ?? 'https://gtfsrt.renfe.com/trip_updates.pb',
  cercaniasAlertsUrl: process.env.CERCANIAS_ALERTS_URL ?? 'https://gtfsrt.renfe.com/alerts.pb',
  longDistancePositionsUrl:
    process.env.LD_POSITIONS_URL ??
    'https://tiempo-real.largorecorrido.renfe.com/renfe-visor/flotaLD.json',
}
