import { useState } from 'react'
import api from '../services/api'
import Modal from './Modal'
import Alert from './Alert'

export default function GrupoModal({ onClose, onSaved }) {
  const [nome, setNome] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await api.post('/grupos', { nome })
      onSaved()
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao criar grupo')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal onClose={onClose}>
      <div className="modal-header">
        <h3>Novo Grupo</h3>
        <button className="modal-close" onClick={onClose}>✕</button>
      </div>

      {error && <Alert type="error">{error}</Alert>}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="grupo-nome">Nome</label>
          <input
            id="grupo-nome"
            type="text"
            value={nome}
            onChange={e => setNome(e.target.value)}
            placeholder="Ex: Viagem Nordeste"
            maxLength={60}
            required
          />
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-outline" onClick={onClose}>Cancelar</button>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Criando...' : 'Criar grupo'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
