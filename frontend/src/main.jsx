import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { registerSW } from 'virtual:pwa-register'

// Service workers não registram em origem file:// — o Electron carrega o app assim
// em produção, então esse guard evita uma tentativa de registro fadada a falhar
// (mesmo padrão de detecção que Landing.jsx usa em isDesktopApp).
if (window.location.protocol.startsWith('http')) {
  registerSW({ immediate: true })
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
