import GtfsRealtimeBindings from 'gtfs-realtime-bindings'

export async function fetchCercaniasFeed(url: string): Promise<unknown> {
  const response = await fetch(url, { signal: AbortSignal.timeout(10_000) })
  if (!response.ok) {
    throw new Error(`Renfe feed returned HTTP ${response.status}`)
  }

  const bytes = new Uint8Array(await response.arrayBuffer())
  const message = GtfsRealtimeBindings.transit_realtime.FeedMessage.decode(bytes)
  const payload: unknown = GtfsRealtimeBindings.transit_realtime.FeedMessage.toObject(message, {
    longs: String,
    enums: String,
  })
  return payload
}
