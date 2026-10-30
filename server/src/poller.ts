import type { TrainStore } from './store/trainStore.js'
import { config } from './config.js'
import type { StaticIndex } from './gtfs/staticIndex.js'
import { fetchCercaniasFeed } from './sources/cercanias/fetch.js'
import { fetchLongDistanceFeed } from './sources/largoRecorrido/fetch.js'
import { normalizeLongDistancePositions } from './sources/largoRecorrido/normalize.js'
import {
  normalizeCercaniasAlerts,
  normalizeCercaniasPositions,
} from './sources/cercanias/normalize.js'

export type PollFeeds = {
  positions: () => Promise<unknown>
  tripUpdates: () => Promise<unknown>
  alerts: () => Promise<unknown>
  longDistance: () => Promise<unknown>
}

const defaultFeeds: PollFeeds = {
  positions: () => fetchCercaniasFeed(config.cercaniasPositionsUrl),
  tripUpdates: () => fetchCercaniasFeed(config.cercaniasTripUpdatesUrl),
  alerts: () => fetchCercaniasFeed(config.cercaniasAlertsUrl),
  longDistance: () => fetchLongDistanceFeed(config.longDistancePositionsUrl),
}

export async function runPollCycle(
  store: TrainStore,
  staticIndex: StaticIndex,
  feeds: PollFeeds = defaultFeeds,
): Promise<void> {
  try {
    const [positions, updates] = await Promise.all([feeds.positions(), feeds.tripUpdates()])
    store.replaceServiceTrains(
      'cercanias',
      normalizeCercaniasPositions(positions, updates, staticIndex),
    )
    store.markSourceSuccess('cercanias')
  } catch (error) {
    store.markSourceFailure('cercanias', error)
    console.error('Cercanías poll failed', error)
  }

  try {
    const alerts = await feeds.alerts()
    store.replaceAlerts(normalizeCercaniasAlerts(alerts, staticIndex))
  } catch (error) {
    console.error('Cercanías alerts poll failed; keeping the last valid alerts', error)
  }

  try {
    const payload = await feeds.longDistance()
    store.replaceServiceTrains('ld', normalizeLongDistancePositions(payload))
    store.markSourceSuccess('ld')
  } catch (error) {
    store.markSourceFailure('ld', error)
    console.error('Larga Distancia poll failed', error)
  }
}

export function startPoller(store: TrainStore, staticIndex: StaticIndex): () => void {
  let running = false

  const poll = async (): Promise<void> => {
    if (running) {
      return
    }
    running = true

    try {
      await runPollCycle(store, staticIndex)
    } finally {
      running = false
    }
  }

  void poll()
  const timer = setInterval(() => void poll(), config.pollIntervalMs)
  return () => clearInterval(timer)
}
