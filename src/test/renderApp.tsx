import { render } from '@testing-library/react'
import { StrictMode } from 'react'
import { MemoryRouter } from 'react-router-dom'

import App from '../App'
import { AppProviders } from '../AppProviders'
import { createQueryClient } from '../queryClient'

export function renderApp(path = '/') {
  const queryClient = createQueryClient()
  queryClient.setDefaultOptions({ queries: { ...queryClient.getDefaultOptions().queries, retry: false } })
  // StrictMode as in main.tsx: it double-runs effects, which is where redirect loops show up.
  return render(
    <StrictMode>
      <MemoryRouter initialEntries={[path]}>
        <AppProviders queryClient={queryClient}>
          <App />
        </AppProviders>
      </MemoryRouter>
    </StrictMode>,
  )
}
