import type { Train } from '@rail-radar/shared/train'
import { flotaLDSchema } from './schema.js'

export function normalizeLongDistancePositions(payload: unknown): Train[] {
  const feed = flotaLDSchema.parse(payload)

  return feed.trenes.map((train) => ({
    id: `ld:${train.codComercial}`,
    service: 'ld',
    line: 'LD',
    number: train.codComercial,
    lat: train.latitud,
    lon: train.longitud,
    updatedAt: new Date(train.time * 1000).toISOString(),
    delayMin: Number(train.ultRetraso),
  }))
}
