import { afterEach, describe, expect, it, vi } from 'vitest'
import { fetchLongDistanceFeed } from '../src/sources/largoRecorrido/fetch.js'

describe('fetchLongDistanceFeed', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('adds a changing cache-buster to the viewer URL', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify({ fechaActualizacion: '2026-10-30', trenes: [] })),
      )
    vi.stubGlobal('fetch', fetchMock)

    await fetchLongDistanceFeed('https://example.test/flotaLD.json')

    const requestUrl = new URL(fetchMock.mock.calls[0]?.[0] as URL)
    expect(requestUrl.origin).toBe('https://example.test')
    expect(requestUrl.pathname).toBe('/flotaLD.json')
    expect(Number(requestUrl.searchParams.get('v'))).toBeGreaterThan(0)
  })
})
