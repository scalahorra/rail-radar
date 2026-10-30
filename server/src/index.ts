import { createApp } from './app.js'
import { config } from './config.js'
import { loadStaticIndex, StaticIndex } from './gtfs/staticIndex.js'
import { startPoller } from './poller.js'
import { TrainStore } from './store/trainStore.js'

const store = new TrainStore(config.trainRetentionMs)
const app = await createApp(store)
let staticIndex = StaticIndex.empty()

try {
  staticIndex = await loadStaticIndex()
  app.log.info('Loaded static GTFS routes and trips')
} catch (error) {
  app.log.warn({ err: error }, 'Static GTFS is unavailable; train metadata will be incomplete')
}

const stopPoller = startPoller(store, staticIndex)

try {
  await app.listen({ host: config.host, port: config.port })
} catch (error) {
  stopPoller()
  app.log.error(error)
  process.exitCode = 1
}

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(signal, () => {
    stopPoller()
    void app.close()
  })
}
