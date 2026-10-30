import { describe, expect, it } from 'vitest'
import type { DashboardUrlState } from './url-state'
import { DEFAULT_VIEW, parseDashboardUrl, serializeDashboardUrl } from './url-state'

describe('dashboard URL state', () => {
  it('round-trips filters, selection, overlay, search, and camera', () => {
    const state: DashboardUrlState = {
      services: ['ld'],
      selectedTrain: 'LD-0087',
      search: 'Barcelona',
      railways: true,
      view: { longitude: 2.17, latitude: 41.39, zoom: 9.5 },
    }

    expect(parseDashboardUrl(serializeDashboardUrl(state))).toEqual(state)
  })

  it('falls back to the full national view for invalid coordinates', () => {
    expect(parseDashboardUrl('?lon=NaN&lat=120&z=99').view).toEqual(DEFAULT_VIEW)
    expect(parseDashboardUrl('').view).toEqual(DEFAULT_VIEW)
  })
})
