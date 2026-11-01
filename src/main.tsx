import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'

import App from './App'
import { AppProviders } from './AppProviders'
import { createQueryClient } from './queryClient'
import './styles/app.css'

const queryClient = createQueryClient()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AppProviders queryClient={queryClient}>
        <App />
      </AppProviders>
    </BrowserRouter>
  </StrictMode>,
)
