import { useState } from 'react'
import api from '../services/api'
import { TIPOS_CONTA } from '../utils/contaTipos'
import Modal from './Modal'
import Alert from './Alert'

export default function ContaModal({ conta, onClose, onSaved }) {
  const [form, setForm] = useState({
    nome: conta?.nome || '',
    tipo: conta?.tipo || TIPOS_CONTA[0].valor,
    saldoInicial: conta?.saldoInicial ?? 0,
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (conta) {
        await api.put(`/contas/${conta.id}`, form)
      } else {
        await api.post('/contas', form)
      }
      onSaved()
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao salvar conta')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal onClose={onClose}>
      <div className="modal-header">
        <h3>{conta ? 'Editar Conta' : 'Nova Conta'}</h3>
        <button className="modal-close" onClick={onClose}>✕</button>
      </div>

      {error && <Alert type="error">{error}</Alert>}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="conta-nome">Nome</label>
          <input
            id="conta-nome"
            type="text"
            value={form.nome}
            onChange={e => setForm({ ...form, nome: e.target.value })}
            placeholder="Ex: Nubank, Carteira, Cartão Inter..."
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="conta-tipo">Tipo</label>
          <select
            id="conta-tipo"
            value={form.tipo}
            onChange={e => setForm({ ...form, tipo: e.target.value })}
          >
            {TIPOS_CONTA.map(t => <option key={t.valor} value={t.valor}>{t.icone} {t.label}</option>)}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="conta-saldo">Saldo inicial (R$)</label>
          <input
            id="conta-saldo"
            type="number"
            step="0.01"
            value={form.saldoInicial}
            onChange={e => setForm({ ...form, saldoInicial: e.target.value })}
            placeholder="0,00"
            required
          />
          <span className="form-hint">Quanto essa conta já tinha antes de você começar a registrar aqui. Pode ser negativo (ex: fatura de cartão em aberto).</span>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-outline" onClick={onClose}>Cancelar</button>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Salvando...' : conta ? 'Atualizar' : 'Criar conta'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
