export async function fetchLongDistanceFeed(url: string): Promise<unknown> {
  const requestUrl = new URL(url)
  requestUrl.searchParams.set('v', Date.now().toString())
  const response = await fetch(requestUrl, { signal: AbortSignal.timeout(10_000) })
  if (!response.ok) {
    throw new Error(`Larga Distancia feed returned HTTP ${response.status}`)
  }

  const payload: unknown = await response.json()
  return payload
}
