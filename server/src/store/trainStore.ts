import type { HealthResponse, SourceHealth, Train } from '@rail-radar/shared/train'

type StoredTrain = {
  train: Train
  lastSeenAt: number
}

export class TrainStore {
  private readonly trains = new Map<string, StoredTrain>()
  private source: SourceHealth = { status: 'down' }

  constructor(private readonly retentionMs = 60_000) {}

  getTrains(now = Date.now()): Train[] {
    this.pruneExpiredTrains(now)
    return [...this.trains.values()].map(({ train }) => train)
  }

  replaceTrains(trains: Train[], now = Date.now()): void {
    const incomingIds = new Set<string>()
    for (const train of trains) {
      incomingIds.add(train.id)
      this.trains.set(train.id, { train, lastSeenAt: now })
    }

    for (const [id, stored] of this.trains) {
      if (!incomingIds.has(id) && now - stored.lastSeenAt > this.retentionMs) {
        this.trains.delete(id)
      }
    }
  }

  markSourceSuccess(now = new Date()): void {
    this.source = { status: 'ok', lastSuccessAt: now.toISOString() }
  }

  markSourceFailure(error: unknown): void {
    this.source = {
      status: 'down',
      ...(this.source.lastSuccessAt ? { lastSuccessAt: this.source.lastSuccessAt } : {}),
      lastError: error instanceof Error ? error.message : String(error),
    }
  }

  getHealth(): HealthResponse {
    return { ok: this.source.status === 'ok', source: this.source }
  }

  private pruneExpiredTrains(now: number): void {
    for (const [id, stored] of this.trains) {
      if (now - stored.lastSeenAt > this.retentionMs) {
        this.trains.delete(id)
      }
    }
  }
}
