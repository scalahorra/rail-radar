import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { describe, expect, it, vi } from 'vitest'
import type { HealthResponse, TrainFeatureCollection } from '@rail-radar/shared/train'
import App from './App'
import { server } from './test/server'

vi.mock('./components/TrainMap', () => ({
  default: ({ trains }: { trains: TrainFeatureCollection }) => (
    <div data-testid="train-map">{trains.features.length} posiciones</div>
  ),
}))

const trains: TrainFeatureCollection = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [-3.7, 40.4] },
      properties: {
        id: 'C1-42',
        service: 'cercanias',
        line: 'C-1',
        number: '42',
        lat: 40.4,
        lon: -3.7,
        destination: 'Aeropuerto',
        updatedAt: new Date().toISOString(),
      },
    },
  ],
}

const health: HealthResponse = {
  ok: false,
  sources: {
    cercanias: { status: 'ok' },
    ld: { status: 'down', lastError: 'Feed unavailable' },
  },
}

describe('dashboard', () => {
  it('keeps the available service visible and opens a searched train', async () => {
    const user = userEvent.setup()
    server.use(
      http.get('http://localhost:3000/api/trains', () => HttpResponse.json(trains)),
      http.get('http://localhost:3000/api/health', () => HttpResponse.json(health)),
    )

    render(<App />)

    expect(await screen.findByText(/fuente temporalmente caída/)).toBeInTheDocument()
    expect(screen.getByTestId('train-map')).toHaveTextContent('1 posiciones')

    await user.type(screen.getByRole('textbox', { name: 'Buscar tren, línea o destino' }), '42')
    await user.click(await screen.findByRole('option'))

    expect(await screen.findByRole('heading', { name: 'Tren 42' })).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: 'Buscar tren, línea o destino' })).toHaveValue('')
    await waitFor(() => expect(window.location.search).toContain('train=C1-42'))

    await user.click(screen.getByRole('button', { name: /Cercanías/ }))

    expect(screen.getByTestId('train-map')).toHaveTextContent('0 posiciones')
    expect(screen.queryByRole('heading', { name: 'Tren 42' })).not.toBeInTheDocument()
    await waitFor(() => expect(window.location.search).toContain('service=ld'))
  })
})
