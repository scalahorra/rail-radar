import type { ServiceFilter } from './trains'

export type MapView = {
  longitude: number
  latitude: number
  zoom: number
}

export type DashboardUrlState = {
  services: ServiceFilter[]
  selectedTrain: string | null
  search: string
  railways: boolean
  view: MapView
}

export const DEFAULT_VIEW: MapView = { longitude: -3.7, latitude: 40.2, zoom: 5.2 }

export function parseDashboardUrl(search: string): DashboardUrlState {
  const params = new URLSearchParams(search)
  const requestedServices = params.get('service')?.split(',') ?? []
  const services = (['cercanias', 'ld'] as const).filter((service) =>
    requestedServices.includes(service),
  )
  const longitude = params.has('lon') ? Number(params.get('lon')) : Number.NaN
  const latitude = params.has('lat') ? Number(params.get('lat')) : Number.NaN
  const zoom = params.has('z') ? Number(params.get('z')) : Number.NaN

  return {
    services: params.has('service') ? services : ['cercanias', 'ld'],
    selectedTrain: params.get('train'),
    search: params.get('q') ?? '',
    railways: params.get('railways') === 'on',
    view: {
      longitude:
        Number.isFinite(longitude) && longitude >= -180 && longitude <= 180
          ? longitude
          : DEFAULT_VIEW.longitude,
      latitude:
        Number.isFinite(latitude) && latitude >= -85 && latitude <= 85
          ? latitude
          : DEFAULT_VIEW.latitude,
      zoom: Number.isFinite(zoom) && zoom >= 2 && zoom <= 18 ? zoom : DEFAULT_VIEW.zoom,
    },
  }
}

export function serializeDashboardUrl(state: DashboardUrlState): string {
  const params = new URLSearchParams()

  if (state.services.length !== 2) params.set('service', state.services.join(','))
  if (state.selectedTrain) params.set('train', state.selectedTrain)
  if (state.search) params.set('q', state.search)
  if (state.railways) params.set('railways', 'on')
  params.set('lon', state.view.longitude.toFixed(4))
  params.set('lat', state.view.latitude.toFixed(4))
  params.set('z', state.view.zoom.toFixed(2))

  return params.toString()
}
