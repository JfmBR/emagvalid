import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import '../../../design-system/tokens.css'
import '../../../design-system/components/bundle.css'
import './index.css'
import App from './App.tsx'
import { aplicarTema, lerPreferencias } from './tema.ts'

// antes do primeiro render: a página já abre no tema escolhido, sem piscar
aplicarTema(lerPreferencias())

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
