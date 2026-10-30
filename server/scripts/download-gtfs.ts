import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import AdmZip from 'adm-zip'

const gtfsUrl = 'https://ssl.renfe.com/ftransit/Fichero_CER_FOMENTO/fomento_transit.zip'
const scriptDirectory = dirname(fileURLToPath(import.meta.url))
const outputDirectory = resolve(scriptDirectory, '../data/gtfs')
const response = await fetch(gtfsUrl, { signal: AbortSignal.timeout(10_000) })

if (!response.ok) {
  throw new Error(`Failed to download GTFS: HTTP ${response.status}`)
}

const archive = new AdmZip(Buffer.from(await response.arrayBuffer()))
await mkdir(outputDirectory, { recursive: true })

for (const filename of ['routes.txt', 'trips.txt']) {
  const entry = archive.getEntries().find((item) => item.entryName.split('/').at(-1) === filename)
  if (!entry || entry.isDirectory) {
    throw new Error(`GTFS archive does not contain ${filename}`)
  }

  await writeFile(resolve(outputDirectory, filename), entry.getData())
  console.log(`Saved ${filename}`)
}
