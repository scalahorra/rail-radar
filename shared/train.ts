export type Train = {
  id: string
  service: 'cercanias' | 'ld'
  line: string
  number: string
  lat: number
  lon: number
  bearing?: number
  delayMin?: number
  destination?: string
  color?: string
  updatedAt: string
}

export type TrainFeature = {
  type: 'Feature'
  geometry: {
    type: 'Point'
    coordinates: [number, number]
  }
  properties: Train
}

export type TrainFeatureCollection = {
  type: 'FeatureCollection'
  features: TrainFeature[]
}

export type TrainAlert = {
  id: string
  text: string
  lines: string[]
  startsAt?: string
  endsAt?: string
}

export type SourceHealth = {
  status: 'ok' | 'down'
  lastSuccessAt?: string
  lastError?: string
}

export type SourceName = 'cercanias' | 'ld'

export type HealthResponse = {
  ok: boolean
  sources: Record<SourceName, SourceHealth>
}
