import type { TrainStore } from './store/trainStore.js'
import { config } from './config.js'
import type { StaticIndex } from './gtfs/staticIndex.js'
import { fetchCercaniasFeed } from './sources/cercanias/fetch.js'
import {
  normalizeCercaniasAlerts,
  normalizeCercaniasPositions,
} from './sources/cercanias/normalize.js'

export function startPoller(store: TrainStore, staticIndex: StaticIndex): () => void {
  let running = false

  const poll = async (): Promise<void> => {
    if (running) {
      return
    }
    running = true

    try {
      try {
        const [positions, updates] = await Promise.all([
          fetchCercaniasFeed(config.cercaniasPositionsUrl),
          fetchCercaniasFeed(config.cercaniasTripUpdatesUrl),
        ])
        store.replaceTrains(normalizeCercaniasPositions(positions, updates, staticIndex))
        store.markSourceSuccess()
      } catch (error) {
        store.markSourceFailure(error)
        console.error('Cercanías poll failed', error)
      }

      try {
        const alerts = await fetchCercaniasFeed(config.cercaniasAlertsUrl)
        store.replaceAlerts(normalizeCercaniasAlerts(alerts, staticIndex))
      } catch (error) {
        console.error('Cercanías alerts poll failed; keeping the last valid alerts', error)
      }
    } finally {
      running = false
    }
  }

  void poll()
  const timer = setInterval(() => void poll(), config.pollIntervalMs)
  return () => clearInterval(timer)
}

// TODO(phase 8): Poll the long-distance feed.
