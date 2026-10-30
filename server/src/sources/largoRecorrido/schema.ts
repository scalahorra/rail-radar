import { z } from 'zod'

const flotaTrainSchema = z
  .object({
    codComercial: z.string().min(1),
    codEstAnt: z.string(),
    codEstSig: z.string(),
    horaLlegadaSigEst: z.string(),
    codProduct: z.number().int(),
    codOrigen: z.string(),
    codDestino: z.string(),
    accesible: z.boolean(),
    ultRetraso: z.string().regex(/^-?\d+$/),
    latitud: z.number().finite().min(-90).max(90),
    longitud: z.number().finite().min(-180).max(180),
    time: z.number().int().nonnegative(),
    p: z.string(),
    mat: z.string(),
  })
  .passthrough()

export const flotaLDSchema = z
  .object({
    fechaActualizacion: z.string().min(1),
    trenes: z.array(flotaTrainSchema),
  })
  .passthrough()
