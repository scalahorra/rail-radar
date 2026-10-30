import { createApp } from './app.js'
import { config } from './config.js'
import { startPoller } from './poller.js'
import { TrainStore } from './store/trainStore.js'

const store = new TrainStore(config.trainRetentionMs)
const app = await createApp(store)
const stopPoller = startPoller(store)

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
