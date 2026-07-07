import { useState, useEffect } from 'react'
import api from '../services/api'
import { categoriasPorTipo } from '../utils/categories'

export default function TransactionModal({ transaction, onClose, onSaved }) {
  const [form, setForm] = useState({
    tipo: 'despesa',
    valor: '',
    categoria: 'Outros',
    descricao: '',
    data: new Date().toISOString().split('T')[0],
  })
  const [customCategoria, setCustomCategoria] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (transaction) {
      const cats = categoriasPorTipo(transaction.tipo)
      const isCustom = !cats.includes(transaction.categoria)
      setForm({
        tipo: transaction.tipo,
        valor: transaction.valor,
        categoria: isCustom ? 'Outros' : transaction.categoria,
        descricao: transaction.descricao || '',
        data: transaction.data,
      })
      setCustomCategoria(isCustom ? transaction.categoria : '')
    }
  }, [transaction])

  // Reset categoria quando tipo muda, caso a categoria atual não exista no novo tipo
  useEffect(() => {
    const cats = categoriasPorTipo(form.tipo)
    if (!cats.includes(form.categoria)) {
      setForm(f => ({ ...f, categoria: cats[0] }))
      setCustomCategoria('')
    }
  }, [form.tipo])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    const categoria = form.categoria === 'Outros' && customCategoria.trim()
      ? customCategoria.trim()
      : form.categoria

    setLoading(true)
    try {
      const payload = { ...form, categoria }
      if (transaction) {
        await api.put(`/transactions/${transaction.id}`, payload)
      } else {
        await api.post('/transactions', payload)
      }
      onSaved()
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao salvar transação')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{transaction ? 'Editar Transação' : 'Nova Transação'}</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <label className={`type-btn ${form.tipo === 'receita' ? 'active-income' : ''}`}>
              <input
                type="radio"
                value="receita"
                checked={form.tipo === 'receita'}
                onChange={e => setForm({ ...form, tipo: e.target.value })}
              />
              ↑ Receita
            </label>
            <label className={`type-btn ${form.tipo === 'despesa' ? 'active-expense' : ''}`}>
              <input
                type="radio"
                value="despesa"
                checked={form.tipo === 'despesa'}
                onChange={e => setForm({ ...form, tipo: e.target.value })}
              />
              ↓ Despesa
            </label>
          </div>

          <div className="form-group">
            <label>Valor (R$)</label>
            <input
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
            <label>Categoria</label>
            <select
              value={form.categoria}
              onChange={e => setForm({ ...form, categoria: e.target.value })}
            >
              {categoriasPorTipo(form.tipo).map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {form.categoria === 'Outros' && (
            <div className="form-group">
              <label>Especifique a categoria</label>
              <input
                type="text"
                value={customCategoria}
                onChange={e => setCustomCategoria(e.target.value)}
                placeholder="Ex: Presente, Doação..."
              />
            </div>
          )}

          <div className="form-group">
            <label>Descrição (opcional)</label>
            <input
              type="text"
              value={form.descricao}
              onChange={e => setForm({ ...form, descricao: e.target.value })}
              placeholder="Ex: Supermercado Extra, Salário maio..."
            />
          </div>

          <div className="form-group">
            <label>Data</label>
            <input
              type="date"
              value={form.data}
              onChange={e => setForm({ ...form, data: e.target.value })}
              required
            />
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Salvando...' : transaction ? 'Atualizar' : 'Adicionar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
