import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import Navbar from '../components/Navbar'
import SummaryCards from '../components/SummaryCards'
import TransactionModal from '../components/TransactionModal'
import TransactionList from '../components/TransactionList'
import ExpensePieChart from '../components/charts/ExpensePieChart'
import OFXImportModal from '../components/OFXImportModal'

import { TODAS_CATEGORIAS } from '../utils/categories'

export default function Dashboard() {
  const { user } = useAuth()
  const [transactions, setTransactions] = useState([])
  const [balance, setBalance] = useState({ receitas: 0, despesas: 0, saldo: 0 })
  const [categoryData, setCategoryData] = useState([])
  const [filters, setFilters] = useState({ tipo: '', categoria: '', data_inicio: '', data_fim: '' })
  const [showModal, setShowModal] = useState(false)
  const [showOFXModal, setShowOFXModal] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    try {
      const params = {}
      if (filters.tipo) params.tipo = filters.tipo
      if (filters.categoria) params.categoria = filters.categoria
      if (filters.data_inicio) params.data_inicio = filters.data_inicio
      if (filters.data_fim) params.data_fim = filters.data_fim

      const [txRes, balanceRes, catRes] = await Promise.all([
        api.get('/transactions', { params }),
        api.get('/reports/balance'),
        api.get('/reports/categories'),
      ])

      setTransactions(txRes.data)
      setBalance(balanceRes.data)
      setCategoryData(catRes.data)
    } catch (err) {
      console.error('Erro ao buscar dados:', err)
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleDelete = async (id) => {
    if (!window.confirm('Excluir esta transação?')) return
    try {
      await api.delete(`/transactions/${id}`)
      fetchData()
    } catch (err) {
      console.error(err)
    }
  }

  const handleEdit = (transaction) => {
    setEditingTransaction(transaction)
    setShowModal(true)
  }

  const handleModalClose = () => {
    setShowModal(false)
    setEditingTransaction(null)
  }

  const handleSaved = () => {
    handleModalClose()
    fetchData()
  }

  const hasFilters = filters.tipo || filters.categoria || filters.data_inicio || filters.data_fim
  const clearFilters = () => setFilters({ tipo: '', categoria: '', data_inicio: '', data_fim: '' })

  const despesasByCategory = categoryData
    .filter(d => d.tipo === 'despesa')
    .map(d => ({ name: d.categoria, value: d.total }))

  const receitasByCategory = categoryData
    .filter(d => d.tipo === 'receita')
    .map(d => ({ name: d.categoria, value: d.total }))

  return (
    <div className="app-layout">
      <Navbar />
      <main className="main-content">
        <div className="dashboard-header">
          <h2>Olá, {user?.nome?.split(' ')[0]} 👋</h2>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-outline" onClick={() => setShowOFXModal(true)}>
              ↓ Importar OFX
            </button>
            <button className="btn btn-primary" onClick={() => setShowModal(true)}>
              + Nova Transação
            </button>
          </div>
        </div>

        <SummaryCards balance={balance} />

        <div className="dashboard-grid">
          <div className="transactions-section">
            <div className="section-header">
              <h3>Transações</h3>
              <div className="filters">
                <select value={filters.tipo} onChange={e => setFilters({ ...filters, tipo: e.target.value })}>
                  <option value="">Todos os tipos</option>
                  <option value="receita">Receitas</option>
                  <option value="despesa">Despesas</option>
                </select>
                <select value={filters.categoria} onChange={e => setFilters({ ...filters, categoria: e.target.value })}>
                  <option value="">Todas as categorias</option>
                  {TODAS_CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <input
                  type="date"
                  value={filters.data_inicio}
                  onChange={e => setFilters({ ...filters, data_inicio: e.target.value })}
                  title="Data início"
                />
                <input
                  type="date"
                  value={filters.data_fim}
                  onChange={e => setFilters({ ...filters, data_fim: e.target.value })}
                  title="Data fim"
                />
                {hasFilters && (
                  <button className="btn btn-outline btn-sm" onClick={clearFilters}>
                    Limpar filtros
                  </button>
                )}
              </div>
            </div>

            {loading ? (
              <div className="loading">Carregando transações...</div>
            ) : (
              <TransactionList
                transactions={transactions}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div className="chart-section">
              <h3>Gastos por Categoria</h3>
              <ExpensePieChart data={despesasByCategory} emptyMessage="Nenhuma despesa registrada" />
            </div>
            <div className="chart-section">
              <h3>Fontes de Renda</h3>
              <ExpensePieChart data={receitasByCategory} emptyMessage="Nenhuma receita registrada" />
            </div>
          </div>
        </div>
      </main>

      {showModal && (
        <TransactionModal
          transaction={editingTransaction}
          onClose={handleModalClose}
          onSaved={handleSaved}
        />
      )}

      {showOFXModal && (
        <OFXImportModal
          onClose={() => setShowOFXModal(false)}
          onImported={fetchData}
        />
      )}
    </div>
  )
}
