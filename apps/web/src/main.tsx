import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import '../../../design-system/tokens.css'
import '../../../design-system/components/bundle.css'
import './index.css'
import App from './App.tsx'

// o tema salvo já foi aplicado por public/tema-inicial.js, no <head>, antes de a página aparecer
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
