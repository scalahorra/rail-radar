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

const stopTimeUpdateSchema = z
  .object({
    arrival: z.object({ delay: z.number().optional() }).passthrough().optional(),
    departure: z.object({ delay: z.number().optional() }).passthrough().optional(),
  })
  .passthrough()

const tripUpdateSchema = z
  .object({
    trip: tripSchema.optional(),
    delay: z.number().optional(),
    stopTimeUpdate: z.array(stopTimeUpdateSchema).optional(),
  })
  .passthrough()

const translationSchema = z
  .object({ text: z.string(), language: z.string().optional() })
  .passthrough()

const alertSchema = z
  .object({
    activePeriod: z
      .array(
        z
          .object({ start: timestampSchema.optional(), end: timestampSchema.optional() })
          .passthrough(),
      )
      .optional(),
    informedEntity: z.array(z.object({ routeId: z.string().optional() }).passthrough()).optional(),
    headerText: z.object({ translation: z.array(translationSchema).optional() }).optional(),
    descriptionText: z.object({ translation: z.array(translationSchema).optional() }).optional(),
  })
  .passthrough()

const entitySchema = z
  .object({
    id: z.string().optional(),
    vehicle: vehicleSchema.optional(),
    tripUpdate: tripUpdateSchema.optional(),
    alert: alertSchema.optional(),
  })
  .passthrough()

export const realtimeFeedSchema = z
  .object({
    header: z.object({ timestamp: timestampSchema.optional() }).passthrough().optional(),
    entity: z.array(entitySchema),
  })
  .passthrough()
