import type { HealthResponse, TrainFeatureCollection } from '@rail-radar/shared/train'

async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(new URL(path, window.location.origin))

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`)
  }

  return (await response.json()) as T
}

export function fetchTrains(): Promise<TrainFeatureCollection> {
  return getJson('/api/trains')
}

export function fetchHealth(): Promise<HealthResponse> {
  return getJson('/api/health')
}
