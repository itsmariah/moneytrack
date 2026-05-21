import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Register() {
  const [form, setForm] = useState({ nome: '', email: '', senha: '', confirmar: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { register, user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (user) navigate('/dashboard')
  }, [user, navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (form.senha !== form.confirmar) {
      return setError('As senhas não coincidem')
    }
    setLoading(true)
    try {
      await register(form.nome, form.email, form.senha)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao criar conta. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>💰 MoneyTrack</h1>
        <h2>Criar conta grátis</h2>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Nome completo</label>
            <input
              type="text"
              value={form.nome}
              onChange={e => setForm({ ...form, nome: e.target.value })}
              placeholder="Seu nome"
              required
            />
          </div>
          <div className="form-group">
            <label>E-mail</label>
            <input
              type="email"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              placeholder="seu@email.com"
              required
            />
          </div>
          <div className="form-group">
            <label>Senha</label>
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
            <label>Confirmar senha</label>
            <input
              type="password"
              value={form.confirmar}
              onChange={e => setForm({ ...form, confirmar: e.target.value })}
              placeholder="Repita a senha"
              required
            />
          </div>
          <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
            {loading ? 'Criando conta...' : 'Criar conta'}
          </button>
        </form>

        <p className="auth-link">
          Já tem conta? <Link to="/login">Entrar</Link>
        </p>
      </div>
    </div>
  )
}
