import axios from 'axios'

// When loaded from file:// (Electron production), use absolute URL
const baseURL =
  window.location.protocol === 'file:'
    ? 'http://localhost:3001/api'
    : '/api'

const api = axios.create({ baseURL })

const token = localStorage.getItem('token')
if (token) {
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`
}

api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default api
