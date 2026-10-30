import type {
  HealthResponse,
  SourceHealth,
  SourceName,
  Train,
  TrainAlert,
} from '@rail-radar/shared/train'

type StoredTrain = {
  train: Train
  lastSeenAt: number
}

export class TrainStore {
  private readonly trains = new Map<string, StoredTrain>()
  private alerts: TrainAlert[] = []
  private readonly sources = new Map<SourceName, SourceHealth>([
    ['cercanias', { status: 'down' }],
    ['ld', { status: 'down' }],
  ])

  constructor(private readonly retentionMs = 60_000) {}

  getTrains(now = Date.now()): Train[] {
    this.pruneExpiredTrains(now)
    return [...this.trains.values()].map(({ train }) => train)
  }

  getAlerts(): TrainAlert[] {
    return this.alerts
  }

  replaceAlerts(alerts: TrainAlert[]): void {
    this.alerts = alerts
  }

  replaceServiceTrains(service: Train['service'], trains: Train[], now = Date.now()): void {
    const incomingIds = new Set<string>()
    for (const train of trains) {
      incomingIds.add(train.id)
      this.trains.set(train.id, { train, lastSeenAt: now })
    }

    for (const [id, stored] of this.trains) {
      if (
        stored.train.service === service &&
        !incomingIds.has(id) &&
        now - stored.lastSeenAt > this.retentionMs
      ) {
        this.trains.delete(id)
      }
    }
  }

  markSourceSuccess(source: SourceName, now = new Date()): void {
    this.sources.set(source, { status: 'ok', lastSuccessAt: now.toISOString() })
  }

  markSourceFailure(source: SourceName, error: unknown): void {
    const previous = this.sources.get(source)
    this.sources.set(source, {
      status: 'down',
      ...(previous?.lastSuccessAt ? { lastSuccessAt: previous.lastSuccessAt } : {}),
      lastError: error instanceof Error ? error.message : String(error),
    })
  }

  getHealth(): HealthResponse {
    const sources = Object.fromEntries(this.sources) as Record<SourceName, SourceHealth>
    const ok = [...this.sources.values()].every((source) => source.status === 'ok')
    return { ok, sources }
  }

  private pruneExpiredTrains(now: number): void {
    for (const [id, stored] of this.trains) {
      if (now - stored.lastSeenAt > this.retentionMs) {
        this.trains.delete(id)
      }
    }
  }
}
