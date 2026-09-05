import { useState } from 'react'
import api from '../services/api'
import Modal from './Modal'
import Alert from './Alert'

function todayLocal() {
  const now = new Date()
  const mes = String(now.getMonth() + 1).padStart(2, '0')
  const dia = String(now.getDate()).padStart(2, '0')
  return `${now.getFullYear()}-${mes}-${dia}`
}

export default function TransferModal({ contas, onClose, onSaved }) {
  const [form, setForm] = useState({
    contaOrigemId: contas[0]?.id || '',
    contaDestinoId: contas[1]?.id || '',
    valor: '',
    data: todayLocal(),
    descricao: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const destinoOptions = contas.filter(c => c.id !== Number(form.contaOrigemId))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await api.post('/transferencias', form)
      onSaved()
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao criar transferência')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal onClose={onClose}>
      <div className="modal-header">
        <h3>Nova Transferência</h3>
        <button className="modal-close" onClick={onClose}>✕</button>
      </div>

      {error && <Alert type="error">{error}</Alert>}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="transf-origem">De</label>
          <select
            id="transf-origem"
            value={form.contaOrigemId}
            onChange={e => {
              const contaOrigemId = Number(e.target.value)
              setForm(f => ({
                ...f,
                contaOrigemId,
                contaDestinoId: f.contaDestinoId === contaOrigemId ? (contas.find(c => c.id !== contaOrigemId)?.id || '') : f.contaDestinoId,
              }))
            }}
          >
            {contas.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="transf-destino">Para</label>
          <select
            id="transf-destino"
            value={form.contaDestinoId}
            onChange={e => setForm({ ...form, contaDestinoId: Number(e.target.value) })}
          >
            {destinoOptions.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="transf-valor">Valor (R$)</label>
          <input
            id="transf-valor"
            type="number"
            step="0.01"
            min="0.01"
            value={form.valor}
            onChange={e => setForm({ ...form, valor: e.target.value })}
            placeholder="0,00"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="transf-data">Data</label>
          <input
            id="transf-data"
            type="date"
            value={form.data}
            onChange={e => setForm({ ...form, data: e.target.value })}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="transf-descricao">Descrição (opcional)</label>
          <input
            id="transf-descricao"
            type="text"
            value={form.descricao}
            onChange={e => setForm({ ...form, descricao: e.target.value })}
            placeholder="Ex: Pagamento da fatura..."
          />
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-outline" onClick={onClose}>Cancelar</button>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Salvando...' : 'Transferir'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
