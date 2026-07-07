import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import api from '../services/api'

export default function ResetPassword() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const navigate = useNavigate()

  const [form, setForm] = useState({ senha: '', confirmar: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (form.senha !== form.confirmar) {
      return setError('As senhas não coincidem')
    }
    setLoading(true)
    try {
      await api.post('/auth/reset-password', { token, senha: form.senha })
      navigate('/login', { state: { resetSuccess: true } })
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao redefinir a senha. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <Link to="/" className="back-link">← Voltar para o início</Link>
      <div className="auth-card">
        <h1>💰 MoneyTrack</h1>
        <h2>Criar nova senha</h2>

        {!token ? (
          <>
            <div className="alert alert-error">Link de redefinição inválido.</div>
            <p className="auth-link">
              <Link to="/esqueci-senha">Solicitar um novo link</Link>
            </p>
          </>
        ) : (
          <>
            {error && <div className="alert alert-error">{error}</div>}
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Nova senha</label>
                <input
                  type="password"
                  value={form.senha}
                  onChange={e => setForm({ ...form, senha: e.target.value })}
                  placeholder="Mínimo 6 caracteres"
                  minLength={6}
                  required
                />
              </div>
              <div className="form-group">
                <label>Confirmar nova senha</label>
                <input
                  type="password"
                  value={form.confirmar}
                  onChange={e => setForm({ ...form, confirmar: e.target.value })}
                  placeholder="Repita a senha"
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
                {loading ? 'Salvando...' : 'Redefinir senha'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
