import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

export default function ProfileModal({ onClose }) {
  const { user, updateProfile } = useAuth()
  const [form, setForm] = useState({ nome: user?.nome || '', email: user?.email || '', senha: '', confirmar: '' })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (form.senha && form.senha !== form.confirmar) {
      return setError('As senhas não coincidem')
    }

    const payload = {}
    if (form.nome !== user.nome) payload.nome = form.nome
    if (form.email !== user.email) payload.email = form.email
    if (form.senha) payload.senha = form.senha

    if (Object.keys(payload).length === 0) {
      return setSuccess('Nenhuma alteração detectada.')
    }

    setLoading(true)
    try {
      await updateProfile(payload)
      setSuccess('Perfil atualizado com sucesso!')
      setForm(f => ({ ...f, senha: '', confirmar: '' }))
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao atualizar perfil')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Editar Perfil</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Nome</label>
            <input
              type="text"
              value={form.nome}
              onChange={e => setForm({ ...form, nome: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>E-mail</label>
            <input
              type="email"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Nova senha (deixe vazio para manter)</label>
            <input
              type="password"
              value={form.senha}
              onChange={e => setForm({ ...form, senha: e.target.value })}
              placeholder="Mínimo 6 caracteres"
              minLength={form.senha ? 6 : 0}
            />
          </div>
          {form.senha && (
            <div className="form-group">
              <label>Confirmar nova senha</label>
              <input
                type="password"
                value={form.confirmar}
                onChange={e => setForm({ ...form, confirmar: e.target.value })}
                required
              />
            </div>
          )}
          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Salvando...' : 'Salvar alterações'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
