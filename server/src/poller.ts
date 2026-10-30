import type { TrainStore } from './store/trainStore.js'
import { config } from './config.js'
import type { StaticIndex } from './gtfs/staticIndex.js'
import { fetchCercaniasFeed } from './sources/cercanias/fetch.js'
import { normalizeCercaniasPositions } from './sources/cercanias/normalize.js'

export function startPoller(store: TrainStore, staticIndex: StaticIndex): () => void {
  let running = false

  const poll = async (): Promise<void> => {
    if (running) {
      return
    }
    running = true

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
    } finally {
      running = false
    }
  }

  void poll()
  const timer = setInterval(() => void poll(), config.pollIntervalMs)
  return () => clearInterval(timer)
}

// TODO(phase 7): Poll the alerts and long-distance feeds.
