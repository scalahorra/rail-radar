import { useEffect, useMemo, useState } from 'react'
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query'
import {
  Activity,
  ArrowUpRight,
  Clock3,
  Layers3,
  MapPin,
  Search,
  TrainFront,
  X,
} from 'lucide-react'
import { fetchHealth, fetchTrains } from './api/client'
import { Button } from './components/ui/button'
import TrainMap from './components/TrainMap'
import {
  filterMapFeatureCollection,
  filterTrains,
  formatDelay,
  newestUpdate,
  toMapFeatureCollection,
  type ServiceFilter,
} from './lib/trains'
import { parseDashboardUrl, serializeDashboardUrl, type DashboardUrlState } from './lib/url-state'
import './App.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 5000),
      refetchOnWindowFocus: true,
    },
  },
})

const serviceLabels: Record<ServiceFilter, string> = {
  cercanias: 'Cercanías',
  ld: 'Larga distancia',
}

// TODO(phase 5): Add animation, follow mode, alerts, legend, and mobile layouts.
function Dashboard() {
  const [urlState, setUrlState] = useState<DashboardUrlState>(() =>
    parseDashboardUrl(window.location.search),
  )
  const [now, setNow] = useState(Date.now)
  const trainsQuery = useQuery({
    queryKey: ['trains'],
    queryFn: fetchTrains,
    staleTime: 5000,
    refetchInterval: 10_000,
  })
  const healthQuery = useQuery({
    queryKey: ['health'],
    queryFn: fetchHealth,
    staleTime: 10_000,
    refetchInterval: 15_000,
  })

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 15_000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const query = serializeDashboardUrl(urlState)
      window.history.replaceState(null, '', `${window.location.pathname}?${query}`)
    }, 140)

    return () => window.clearTimeout(timer)
  }, [urlState])

  useEffect(() => {
    const restoreUrlState = () => setUrlState(parseDashboardUrl(window.location.search))
    window.addEventListener('popstate', restoreUrlState)
    return () => window.removeEventListener('popstate', restoreUrlState)
  }, [])

  const trains = trainsQuery.data?.features.map((feature) => feature.properties) ?? []
  const mapTrains = useMemo(
    () =>
      toMapFeatureCollection(trainsQuery.data ?? { type: 'FeatureCollection', features: [] }, now),
    [trainsQuery.data, now],
  )
  const visibleMapTrains = useMemo(
    () => filterMapFeatureCollection(mapTrains, urlState.services, urlState.search),
    [mapTrains, urlState.services, urlState.search],
  )
  const visibleTrains = filterTrains(trains, urlState.services, urlState.search)
  const selectedTrain = trains.find((train) => train.id === urlState.selectedTrain) ?? null
  const latestUpdate = newestUpdate(trains)
  const sourceHealth = healthQuery.data?.sources
  const downSources = sourceHealth
    ? (['cercanias', 'ld'] as const).filter((service) => sourceHealth[service].status === 'down')
    : []

  useEffect(() => {
    if (
      !urlState.selectedTrain ||
      visibleTrains.some((train) => train.id === urlState.selectedTrain)
    ) {
      return
    }

    setUrlState((current) => ({ ...current, selectedTrain: null }))
  }, [urlState.selectedTrain, visibleTrains])

  function toggleService(service: ServiceFilter) {
    setUrlState((current) => ({
      ...current,
      services: current.services.includes(service)
        ? current.services.filter((item) => item !== service)
        : [...current.services, service],
    }))
  }

  function updateView(view: DashboardUrlState['view']) {
    setUrlState((current) => ({ ...current, view }))
  }

  function selectTrain(trainId: string | null) {
    const train = trains.find((item) => item.id === trainId)
    setUrlState((current) => ({
      ...current,
      selectedTrain: trainId,
      search: trainId ? '' : current.search,
      view: train
        ? { longitude: train.lon, latitude: train.lat, zoom: Math.max(current.view.zoom, 9) }
        : current.view,
    }))
  }

  return (
    <main className="radar-app">
      <TrainMap
        trains={visibleMapTrains}
        selectedTrain={urlState.selectedTrain}
        railways={urlState.railways}
        view={urlState.view}
        onSelect={selectTrain}
        onViewChange={updateView}
      />

      <header className="topbar">
        <a className="brand" href="/" aria-label="Rail Radar, vista general">
          <span className="brand-mark">
            <TrainFront size={21} strokeWidth={2.2} />
          </span>
          <span className="brand-copy">
            <strong>RAIL RADAR</strong>
            <small>ESPAÑA · EN DIRECTO</small>
          </span>
        </a>

        <div className="search-wrap">
          <Search size={17} aria-hidden="true" />
          <input
            aria-label="Buscar tren, línea o destino"
            placeholder="Busca tren, línea o destino"
            value={urlState.search}
            onChange={(event) =>
              setUrlState((current) => ({ ...current, search: event.target.value }))
            }
          />
          {urlState.search && (
            <Button
              variant="ghost"
              size="icon"
              aria-label="Borrar búsqueda"
              onClick={() => setUrlState((current) => ({ ...current, search: '' }))}
            >
              <X size={15} />
            </Button>
          )}
          {urlState.search && visibleTrains.length > 0 && (
            <div className="search-results" role="listbox" aria-label="Resultados de búsqueda">
              {visibleTrains.slice(0, 5).map((train) => (
                <button
                  key={train.id}
                  type="button"
                  role="option"
                  aria-selected={train.id === urlState.selectedTrain}
                  onClick={() => selectTrain(train.id)}
                >
                  <span className={`service-glyph ${train.service}`} aria-hidden="true" />
                  <span className="result-main">
                    <strong>{train.number}</strong>
                    <small>
                      {train.line}
                      {train.destination ? ` · ${train.destination}` : ''}
                    </small>
                  </span>
                  <ArrowUpRight size={15} />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="live-indicator" aria-live="polite">
          <span className={`live-dot ${trainsQuery.isError ? 'is-down' : ''}`} />
          <span>{trainsQuery.isError ? 'SIN CONEXIÓN' : 'EN DIRECTO'}</span>
          <small>{trains.length.toLocaleString('es-ES')} trenes</small>
        </div>
      </header>

      <section className="map-toolbar" aria-label="Filtros del mapa">
        <div className="service-filters">
          {(['cercanias', 'ld'] as const).map((service) => {
            const count = trains.filter((train) => train.service === service).length
            const active = urlState.services.includes(service)
            return (
              <button
                key={service}
                type="button"
                className={`filter-button ${active ? 'is-active' : ''} ${service}`}
                aria-pressed={active}
                onClick={() => toggleService(service)}
              >
                <span className={`service-glyph ${service}`} aria-hidden="true" />
                {serviceLabels[service]}
                <span className="filter-count">{count}</span>
              </button>
            )
          })}
        </div>
        <span className="toolbar-divider" />
        <button
          type="button"
          className={`overlay-button ${urlState.railways ? 'is-active' : ''}`}
          aria-pressed={urlState.railways}
          onClick={() => setUrlState((current) => ({ ...current, railways: !current.railways }))}
        >
          <Layers3 size={15} />
          Infraestructura
        </button>
        <span className="toolbar-spacer" />
        <span className="visible-count">
          <strong>{visibleTrains.length.toLocaleString('es-ES')}</strong> visibles
        </span>
      </section>

      {(trainsQuery.isPending ||
        trainsQuery.isError ||
        healthQuery.isError ||
        downSources.length > 0) && (
        <section className="status-stack" aria-live="polite">
          {trainsQuery.isPending && (
            <div className="status-message is-loading">
              <Activity size={15} /> Conectando con el centro de datos
            </div>
          )}
          {trainsQuery.isError && (
            <div className="status-message is-error">
              <span>No se pudo cargar la posición de los trenes.</span>
              <Button variant="dark" size="sm" onClick={() => void trainsQuery.refetch()}>
                Reintentar
              </Button>
            </div>
          )}
          {healthQuery.isError && !trainsQuery.isError && (
            <div className="status-message is-warning">
              No se pudo consultar la salud de las fuentes.
              <Button variant="dark" size="sm" onClick={() => void healthQuery.refetch()}>
                Reintentar
              </Button>
            </div>
          )}
          {downSources.map((service) => (
            <div className="status-message is-warning" key={service}>
              <span>
                <strong>{serviceLabels[service]}:</strong> fuente temporalmente caída.
              </span>
              <Button variant="dark" size="sm" onClick={() => void healthQuery.refetch()}>
                Revisar
              </Button>
            </div>
          ))}
        </section>
      )}

      {selectedTrain && (
        <aside className="train-panel" aria-label="Detalle del tren seleccionado">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">DETALLE DEL SERVICIO</span>
              <h1>Tren {selectedTrain.number}</h1>
            </div>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Cerrar detalle"
              onClick={() => selectTrain(null)}
            >
              <X size={17} />
            </Button>
          </div>
          <div className={`train-line-mark ${selectedTrain.service}`}>
            <span className={`service-glyph ${selectedTrain.service}`} aria-hidden="true" />
            <span>{selectedTrain.line}</span>
            <span className="line-mark-label">{serviceLabels[selectedTrain.service]}</span>
          </div>
          <div className="destination-block">
            <span className="eyebrow">DESTINO</span>
            <strong>{selectedTrain.destination || 'No disponible'}</strong>
          </div>
          <div className="detail-grid">
            <div>
              <span className="eyebrow">PUNTUALIDAD</span>
              <strong
                className={selectedTrain.delayMin && selectedTrain.delayMin > 0 ? 'delay' : ''}
              >
                {formatDelay(selectedTrain.delayMin)}
              </strong>
            </div>
            <div>
              <span className="eyebrow">ACTUALIZADO</span>
              <strong className="detail-time">
                <Clock3 size={13} />
                {new Date(selectedTrain.updatedAt).toLocaleTimeString('es-ES', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </strong>
            </div>
          </div>
          <div className="coordinates-row">
            <MapPin size={14} />
            {selectedTrain.lat.toFixed(4)}, {selectedTrain.lon.toFixed(4)}
          </div>
        </aside>
      )}

      <div className="map-caption">
        <span className="map-caption-dot" />
        {latestUpdate
          ? `Última posición ${new Date(latestUpdate).toLocaleTimeString('es-ES', {
              hour: '2-digit',
              minute: '2-digit',
            })}`
          : 'Esperando posiciones'}
      </div>

      <footer className="attribution">
        <span>Datos: Renfe (CC BY 4.0)</span>
        <span className="attribution-separator">·</span>
        <span>© OpenFreeMap · © OpenStreetMap</span>
        {urlState.railways && (
          <>
            <span className="attribution-separator">·</span>
            <span>© OpenRailwayMap</span>
          </>
        )}
      </footer>
    </main>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Dashboard />
    </QueryClientProvider>
  )
}
