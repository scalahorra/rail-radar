import { useEffect, useRef, useState } from 'react'
import type { Map as MapLibreMap } from 'maplibre-gl'
import mapWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url'
import {
  Layer,
  Map as MapGL,
  NavigationControl,
  ScaleControl,
  Source,
  type MapLayerMouseEvent,
  type MapRef,
} from 'react-map-gl/maplibre'
import type { TrainMapCollection } from '../lib/trains'
import type { MapView } from '../lib/url-state'

const interactiveLayers = ['train-circles', 'train-cercanias-icons', 'train-ld-icons']

type TrainMapProps = {
  trains: TrainMapCollection
  selectedTrain: string | null
  railways: boolean
  view: MapView
  onSelect: (trainId: string | null) => void
  onViewChange: (view: MapView) => void
}

function drawTrainIcon(map: MapLibreMap, service: 'cercanias' | 'ld', color: string) {
  if (map.hasImage(`train-${service}`)) return

  const canvas = document.createElement('canvas')
  canvas.width = 48
  canvas.height = 48
  const context = canvas.getContext('2d')
  if (!context) return

  context.translate(24, 24)
  context.fillStyle = '#f3f5ef'
  context.strokeStyle = '#14201f'
  context.lineWidth = 2
  if (service === 'ld') {
    context.rotate(Math.PI / 4)
    context.beginPath()
    context.roundRect(-12, -12, 24, 24, 4)
    context.fill()
    context.stroke()
    context.fillStyle = color
    context.fillRect(-8, -8, 16, 16)
  } else {
    context.beginPath()
    context.arc(0, 0, 14, 0, Math.PI * 2)
    context.fill()
    context.stroke()
    context.fillStyle = color
    context.beginPath()
    context.arc(0, 0, 9, 0, Math.PI * 2)
    context.fill()
  }

  context.fillStyle = '#14201f'
  context.fillRect(-2, -6, 4, 12)
  map.addImage(`train-${service}`, context.getImageData(0, 0, canvas.width, canvas.height), {
    pixelRatio: 2,
  })
}

function getTrainIdAtPoint(event: MapLayerMouseEvent): string | null {
  const feature = event.target
    .queryRenderedFeatures(event.point, { layers: interactiveLayers })
    .find((item) => item.id !== undefined)

  return feature?.id === undefined ? null : String(feature.id)
}

export default function TrainMap({
  trains,
  selectedTrain,
  railways,
  view,
  onSelect,
  onViewChange,
}: TrainMapProps) {
  const mapRef = useRef<MapRef>(null)
  const hoveredTrain = useRef<string | null>(null)
  const [mapReady, setMapReady] = useState(false)
  const [mapView, setMapView] = useState(view)
  const [dimensions, setDimensions] = useState(() => ({
    width: window.innerWidth,
    height: window.innerHeight,
  }))

  useEffect(() => {
    const updateDimensions = () =>
      setDimensions({ width: window.innerWidth, height: window.innerHeight })
    window.addEventListener('resize', updateDimensions)
    return () => window.removeEventListener('resize', updateDimensions)
  }, [])

  useEffect(() => {
    setMapView(view)
  }, [view])

  useEffect(() => {
    const map = mapRef.current?.getMap()
    if (!map?.getSource('trains')) return

    if (hoveredTrain.current) {
      map.setFeatureState({ source: 'trains', id: hoveredTrain.current }, { hover: false })
    }
    if (selectedTrain) {
      map.setFeatureState({ source: 'trains', id: selectedTrain }, { selected: true })
    }

    return () => {
      if (selectedTrain && map.getSource('trains')) {
        map.setFeatureState({ source: 'trains', id: selectedTrain }, { selected: false })
      }
    }
  }, [mapReady, selectedTrain, trains])

  function handleMouseMove(event: MapLayerMouseEvent) {
    const map = mapRef.current?.getMap()
    if (!map?.getSource('trains')) return

    const nextTrain = getTrainIdAtPoint(event)
    if (nextTrain === hoveredTrain.current) return
    if (hoveredTrain.current) {
      map.setFeatureState({ source: 'trains', id: hoveredTrain.current }, { hover: false })
    }
    if (nextTrain) map.setFeatureState({ source: 'trains', id: nextTrain }, { hover: true })
    hoveredTrain.current = nextTrain
    map.getCanvas().style.cursor = nextTrain ? 'pointer' : ''
  }

  function handleClick(event: MapLayerMouseEvent) {
    onSelect(getTrainIdAtPoint(event))
  }

  return (
    <div className="map-viewport" aria-label="Mapa de trenes de España">
      <MapGL
        ref={mapRef}
        workerUrl={mapWorkerUrl}
        mapStyle="https://tiles.openfreemap.org/styles/dark"
        minZoom={2}
        maxZoom={18}
        viewState={{
          ...mapView,
          bearing: 0,
          pitch: 0,
          padding: { top: 0, bottom: 0, left: 0, right: 0 },
          ...dimensions,
        }}
        onMove={(event) =>
          setMapView({
            longitude: event.viewState.longitude,
            latitude: event.viewState.latitude,
            zoom: event.viewState.zoom,
          })
        }
        onMoveEnd={(event) =>
          onViewChange({
            longitude: event.viewState.longitude,
            latitude: event.viewState.latitude,
            zoom: event.viewState.zoom,
          })
        }
        onLoad={(event) => {
          drawTrainIcon(event.target, 'cercanias', '#52d6bd')
          drawTrainIcon(event.target, 'ld', '#f09458')
          setMapReady(true)
        }}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => {
          const map = mapRef.current?.getMap()
          if (hoveredTrain.current && map?.getSource('trains')) {
            map.setFeatureState({ source: 'trains', id: hoveredTrain.current }, { hover: false })
          }
          hoveredTrain.current = null
          if (map) map.getCanvas().style.cursor = ''
        }}
        onClick={handleClick}
        interactiveLayerIds={interactiveLayers}
        attributionControl={false}
        reuseMaps
        dragRotate={false}
        touchPitch={false}
      >
        {/* TODO(backend): expose station GeoJSON before adding station overlays. */}
        {mapReady && (
          <Source id="trains" type="geojson" data={trains} promoteId="id">
            <Layer
              id="train-circles"
              type="circle"
              maxzoom={8}
              paint={{
                'circle-radius': [
                  'case',
                  ['boolean', ['feature-state', 'selected'], false],
                  8,
                  ['boolean', ['feature-state', 'hover'], false],
                  7,
                  5,
                ],
                'circle-color': ['match', ['get', 'service'], 'cercanias', '#52d6bd', '#f09458'],
                'circle-stroke-color': '#f3f5ef',
                'circle-stroke-width': 1.5,
                'circle-opacity': ['case', ['boolean', ['get', 'stale'], false], 0.4, 1],
              }}
            />
            <Layer
              id="train-cercanias-icons"
              type="symbol"
              minzoom={8}
              filter={['==', ['get', 'service'], 'cercanias']}
              layout={{
                'icon-image': 'train-cercanias',
                'icon-size': 0.7,
                'icon-rotate': ['coalesce', ['get', 'bearing'], 0],
                'icon-rotation-alignment': 'map',
                'icon-allow-overlap': true,
                'text-field': ['get', 'number'],
                'text-font': ['Noto Sans Regular'],
                'text-size': 10,
                'text-offset': [0, 1.5],
                'text-allow-overlap': false,
              }}
              paint={{
                'icon-opacity': ['case', ['boolean', ['get', 'stale'], false], 0.45, 1],
                'icon-halo-color': [
                  'case',
                  ['boolean', ['feature-state', 'selected'], false],
                  '#f3f5ef',
                  'rgba(0,0,0,0)',
                ],
                'icon-halo-width': [
                  'case',
                  ['boolean', ['feature-state', 'selected'], false],
                  3,
                  0,
                ],
                'text-color': '#f3f5ef',
                'text-halo-color': '#14201f',
                'text-halo-width': 1.5,
              }}
            />
            <Layer
              id="train-ld-icons"
              type="symbol"
              minzoom={8}
              filter={['==', ['get', 'service'], 'ld']}
              layout={{
                'icon-image': 'train-ld',
                'icon-size': 0.7,
                'icon-rotate': ['coalesce', ['get', 'bearing'], 0],
                'icon-rotation-alignment': 'map',
                'icon-allow-overlap': true,
                'text-field': ['get', 'number'],
                'text-font': ['Noto Sans Regular'],
                'text-size': 10,
                'text-offset': [0, 1.5],
              }}
              paint={{
                'icon-opacity': ['case', ['boolean', ['get', 'stale'], false], 0.45, 1],
                'icon-halo-color': [
                  'case',
                  ['boolean', ['feature-state', 'selected'], false],
                  '#f3f5ef',
                  'rgba(0,0,0,0)',
                ],
                'icon-halo-width': [
                  'case',
                  ['boolean', ['feature-state', 'selected'], false],
                  3,
                  0,
                ],
                'text-color': '#f3f5ef',
                'text-halo-color': '#14201f',
                'text-halo-width': 1.5,
              }}
            />
          </Source>
        )}

        {railways && (
          <Source
            id="railway-overlay"
            type="raster"
            tiles={['https://tiles.openrailwaymap.org/standard/{z}/{x}/{y}.png']}
            tileSize={256}
            maxzoom={19}
          >
            <Layer id="railway-lines" type="raster" paint={{ 'raster-opacity': 0.68 }} />
          </Source>
        )}
        <NavigationControl position="bottom-right" showCompass={false} />
        <ScaleControl position="bottom-left" />
      </MapGL>
    </div>
  )
}
