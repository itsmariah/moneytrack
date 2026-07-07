import { useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setMessage('')
    setLoading(true)
    try {
      const { data } = await api.post('/auth/forgot-password', { email })
      setMessage(data.message)
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao solicitar redefinição. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <Link to="/" className="back-link">← Voltar para o início</Link>
      <div className="auth-card">
        <h1>💰 MoneyTrack</h1>
        <h2>Esqueceu a senha?</h2>

        {error && <div className="alert alert-error">{error}</div>}
        {message && <div className="alert alert-success">{message}</div>}

        {!message && (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>E-mail</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
              />
            </div>
            <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
              {loading ? 'Enviando...' : 'Enviar link de redefinição'}
            </button>
          </form>
        )}

        <p className="auth-link">
          Lembrou a senha? <Link to="/login">Entrar</Link>
        </p>
      </div>
    </div>
  )
}
