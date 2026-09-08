import { createContext, useContext, useState, useEffect } from 'react'
import api from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    const savedUser = localStorage.getItem('user')
    if (token && savedUser) {
      setUser(JSON.parse(savedUser))
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`
    }
    setLoading(false)
  }, [])

  const login = async (email, senha) => {
    const { data } = await api.post('/auth/login', { email, senha })
    localStorage.setItem('token', data.token)
    localStorage.setItem('user', JSON.stringify(data.user))
    api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`
    setUser(data.user)
    return data.user
  }

  const register = async (nome, email, senha) => {
    const { data } = await api.post('/auth/register', { nome, email, senha })
    localStorage.setItem('token', data.token)
    localStorage.setItem('user', JSON.stringify(data.user))
    api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`
    setUser(data.user)
    return data.user
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    delete api.defaults.headers.common['Authorization']
    setUser(null)
  }

  // Recarrega os dados do usuário logado (inclusive a família) sem precisar de um novo
  // login — usado depois de ações que mudam a família ativa (entrar, sair, ser removido)
  // mas que não passam por /auth/profile.
  const refreshUser = async () => {
    const { data } = await api.get('/auth/me')
    localStorage.setItem('user', JSON.stringify(data))
    setUser(data)
    return data
  }

  const updateProfile = async (payload) => {
    const { data } = await api.put('/auth/profile', payload)
    // Trocar a senha invalida o token anterior no backend — quando isso acontece,
    // a resposta traz um token novo, que precisa substituir o salvo localmente.
    const { token, ...userFields } = data
    if (token) {
      localStorage.setItem('token', token)
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`
    }
    const updated = { ...user, ...userFields }
    localStorage.setItem('user', JSON.stringify(updated))
    setUser(updated)
    return updated
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateProfile, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
