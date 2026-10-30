import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { parse } from 'csv-parse/sync'

type CsvRow = Record<string, string>

export type RouteMetadata = {
  line: string
  destination?: string
  color?: string
}

function parseCsv(contents: string): CsvRow[] {
  return parse(contents, {
    bom: true,
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as CsvRow[]
}

function clean(value: string | undefined): string | undefined {
  const result = value?.trim()
  return result ? result : undefined
}

function normalizeColor(value: string | undefined): string | undefined {
  const color = clean(value)?.replace(/^#/, '')
  return color && /^[0-9a-f]{6}$/i.test(color) ? `#${color.toUpperCase()}` : undefined
}

export class StaticIndex {
  private readonly trips = new Map<string, RouteMetadata>()

  static empty(): StaticIndex {
    return new StaticIndex()
  }

  static fromCsv(routesCsv: string, tripsCsv: string): StaticIndex {
    const index = new StaticIndex()
    const routes = new Map<string, RouteMetadata>()

    for (const row of parseCsv(routesCsv)) {
      const routeId = clean(row.route_id)
      if (!routeId) {
        continue
      }

      const shortName = clean(row.route_short_name)
      const longName = clean(row.route_long_name)
      const destination = clean(longName?.split(/\s+-\s*/).at(-1))
      const color = normalizeColor(row.route_color)
      routes.set(routeId, {
        line: shortName?.replace(/\s+/g, '') ?? longName ?? routeId,
        ...(destination ? { destination } : {}),
        ...(color ? { color } : {}),
      })
    }

    for (const row of parseCsv(tripsCsv)) {
      const tripId = clean(row.trip_id)
      const routeId = clean(row.route_id)
      const route = routeId ? routes.get(routeId) : undefined
      if (!tripId || !route) {
        continue
      }

      const destination = clean(row.trip_headsign)
      index.trips.set(tripId, {
        ...route,
        ...(destination ? { destination } : {}),
      })
    }

    return index
  }

  getTrip(tripId: string): RouteMetadata | undefined {
    return this.trips.get(tripId)
  }
}

export async function loadStaticIndex(
  directory = resolve(process.cwd(), 'data/gtfs'),
): Promise<StaticIndex> {
  const [routesCsv, tripsCsv] = await Promise.all([
    readFile(resolve(directory, 'routes.txt'), 'utf8'),
    readFile(resolve(directory, 'trips.txt'), 'utf8'),
  ])

  return StaticIndex.fromCsv(routesCsv, tripsCsv)
}
