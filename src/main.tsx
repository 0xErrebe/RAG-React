import { createRoot } from 'react-dom/client'
import { StrictMode } from 'react'
import { GlobalProvider } from './context/Global'
import App from './components/App'
import RequirementsGuard from './RequirementsGuard'
import './styles/Global.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RequirementsGuard>
      <GlobalProvider>
        <App />
      </GlobalProvider>
    </RequirementsGuard>
  </StrictMode>
)
