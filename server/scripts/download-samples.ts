import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import GtfsRealtimeBindings from 'gtfs-realtime-bindings'

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const samplesDirectory = resolve(projectRoot, 'docs/samples')
const feeds = [
  ['vehicle-positions.sample.json', 'https://gtfsrt.renfe.com/vehicle_positions.pb'],
  ['trip-updates.sample.json', 'https://gtfsrt.renfe.com/trip_updates.pb'],
  ['alerts.sample.json', 'https://gtfsrt.renfe.com/alerts.pb'],
] as const

await mkdir(samplesDirectory, { recursive: true })

for (const [filename, url] of feeds) {
  const response = await fetch(url, { signal: AbortSignal.timeout(10_000) })
  if (!response.ok) {
    throw new Error(`Failed to download ${url}: HTTP ${response.status}`)
  }

  const bytes = new Uint8Array(await response.arrayBuffer())
  const feed = GtfsRealtimeBindings.transit_realtime.FeedMessage.decode(bytes)
  const json = GtfsRealtimeBindings.transit_realtime.FeedMessage.toObject(feed, {
    longs: String,
    enums: String,
  })

  await writeFile(resolve(samplesDirectory, filename), `${JSON.stringify(json, null, 2)}\n`)
  console.log(`Saved ${filename} (${feed.entity.length} entities)`)
}
