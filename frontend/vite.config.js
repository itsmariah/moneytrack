import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// O Electron carrega o build via file://, que exige caminhos relativos ("./").
// Já o deploy web usa roteamento client-side (BrowserRouter), que exige caminhos
// absolutos ("/") para os assets não quebrarem ao acessar/recarregar uma rota
// que não seja a raiz. ELECTRON_BUILD é setado apenas pelos scripts electron:build/electron:pack.
const isElectronBuild = process.env.ELECTRON_BUILD === 'true'

export default defineConfig({
  plugins: [react()],
  base: isElectronBuild ? './' : '/',
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      }
    }
  }
})
