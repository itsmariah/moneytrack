import axios from 'axios'

// When loaded from file:// (Electron production), use absolute URL.
// VITE_API_URL permite apontar para um backend hospedado em domínio separado do frontend.
const baseURL =
  window.location.protocol === 'file:'
    ? 'http://localhost:3001/api'
    : (import.meta.env.VITE_API_URL || '/api')

const api = axios.create({ baseURL })

const token = localStorage.getItem('token')
if (token) {
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`
}

// Rotas onde um 401 significa "credenciais inválidas" (não "sessão expirada") —
// o formulário da própria página já mostra o erro, então o interceptor não deve
// forçar um redirecionamento/reload por cima dessa mensagem.
const AUTH_ROUTES_WITHOUT_SESSION = ['/auth/login', '/auth/register']

api.interceptors.response.use(
  res => res,
  err => {
    const isAuthRoute = AUTH_ROUTES_WITHOUT_SESSION.some(path => err.config?.url?.includes(path))
    if (err.response?.status === 401 && !isAuthRoute) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default api
