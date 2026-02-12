import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'

createRoot(document.getElementById('app-main')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// @ts-ignore
window.rendered = true;