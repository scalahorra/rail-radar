import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { normalizeLongDistancePositions } from '../src/sources/largoRecorrido/normalize.js'
import { flotaLDSchema } from '../src/sources/largoRecorrido/schema.js'

async function readSample(): Promise<unknown> {
  const contents = await readFile(
    resolve(process.cwd(), '../docs/samples/flotaLD.sample.json'),
    'utf8',
  )
  return JSON.parse(contents)
}

describe('Larga Distancia feed', () => {
  it('validates and normalizes the real flota sample', async () => {
    const sample = await readSample()
    const trains = normalizeLongDistancePositions(sample)

    expect(trains).toHaveLength(39)
    expect(trains[0]).toMatchObject({
      id: 'ld:15064',
      service: 'ld',
      line: 'LD',
      number: '15064',
      lat: 41.39203,
      lon: 2.1646564,
      delayMin: 13,
      updatedAt: '2026-10-30T22:41:12.000Z',
    })
  })

  it('rejects invalid coordinates instead of accepting an invalid feed', async () => {
    const sample = await readSample()
    const result = flotaLDSchema.safeParse(sample)
    expect(result.success).toBe(true)
    if (!result.success) {
      return
    }

    const invalidSample = structuredClone(result.data)
    const firstTrain = invalidSample.trenes[0]
    if (!firstTrain) {
      throw new Error('Sample must contain a train')
    }
    firstTrain.latitud = 91

    expect(() => normalizeLongDistancePositions(invalidSample)).toThrow()
  })
})
