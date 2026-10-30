import { describe, expect, it } from 'vitest'
import { StaticIndex } from '../src/gtfs/staticIndex.js'

describe('StaticIndex', () => {
  it('maps trip IDs to normalized line, headsign, and route color', () => {
    const index = StaticIndex.fromCsv(
      'route_id,route_short_name,route_long_name,route_color\nroute-1,C 5,Line C5,073588',
      'route_id,service_id,trip_id,trip_headsign\nroute-1,weekday,trip-1,Aeropuerto-T4',
    )

    expect(index.getTrip('trip-1')).toEqual({
      line: 'C5',
      destination: 'Aeropuerto-T4',
      color: '#073588',
    })
    expect(index.getTrip('missing')).toBeUndefined()
  })

  it('keeps a trip out of the index when its route is missing', () => {
    const index = StaticIndex.fromCsv(
      'route_id,route_short_name,route_long_name,route_color\nroute-1,C1,Line C1,073588',
      'route_id,service_id,trip_id,trip_headsign\nmissing,weekday,trip-1,Central',
    )

    expect(index.getTrip('trip-1')).toBeUndefined()
  })

  it('uses the route long name when the trip has no headsign', () => {
    const index = StaticIndex.fromCsv(
      'route_id,route_short_name,route_long_name,route_color\nroute-1,C1,Airport-T4 - Central,073588',
      'route_id,service_id,trip_id,trip_headsign\nroute-1,weekday,trip-1,',
    )

    expect(index.getTrip('trip-1')?.destination).toBe('Central')
  })
})
