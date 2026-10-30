import { z } from 'zod'

const timestampSchema = z.union([z.string(), z.number()])

const tripSchema = z
  .object({
    tripId: z.string().optional(),
    routeId: z.string().optional(),
    scheduleRelationship: z.string().optional(),
  })
  .passthrough()

const positionSchema = z
  .object({
    latitude: z.number().finite(),
    longitude: z.number().finite(),
    bearing: z.number().finite().optional(),
  })
  .passthrough()

const vehicleSchema = z
  .object({
    trip: tripSchema.optional(),
    position: positionSchema.optional(),
    timestamp: timestampSchema.optional(),
    vehicle: z
      .object({
        id: z.string().optional(),
        label: z.string().optional(),
      })
      .passthrough()
      .optional(),
  })
  .passthrough()

const tripUpdateSchema = z
  .object({
    trip: tripSchema.optional(),
  })
  .passthrough()

const entitySchema = z
  .object({
    id: z.string().optional(),
    vehicle: vehicleSchema.optional(),
    tripUpdate: tripUpdateSchema.optional(),
  })
  .passthrough()

export const realtimeFeedSchema = z
  .object({
    header: z.object({ timestamp: timestampSchema.optional() }).passthrough().optional(),
    entity: z.array(entitySchema),
  })
  .passthrough()
