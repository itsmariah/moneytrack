import { useState, useEffect, useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import Navbar from '../components/Navbar'
import SummaryCards from '../components/SummaryCards'
import ExpensePieChart from '../components/charts/ExpensePieChart'
import api from '../services/api'

const fmt = (n) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n)
const fmtDate = (d) => new Date(d + 'T00:00:00').toLocaleDateString('pt-BR')

export default function Reports() {
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7))
  const [report, setReport] = useState(null)
  const [evolution, setEvolution] = useState([])
  const [loading, setLoading] = useState(true)
  const [tipoFilter, setTipoFilter] = useState('todos')
  const [categoriaFilter, setCategoriaFilter] = useState('todas')

  useEffect(() => { fetchReport() }, [month])

  useEffect(() => {
    api.get('/reports/evolution').then(r => setEvolution(r.data)).catch(() => {})
  }, [])

  // Reset category when month or tipo changes
  useEffect(() => { setCategoriaFilter('todas') }, [month, tipoFilter])

  const fetchReport = async () => {
    setLoading(true)
    try {
      const [monthlyRes, catRes] = await Promise.all([
        api.get('/reports/monthly', { params: { month } }),
        api.get('/reports/categories', {
          params: { start: `${month}-01`, end: `${month}-31` }
        }),
      ])
      setReport({ ...monthlyRes.data, categories: catRes.data })
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // Categories available for the current tipo selection
  const categorias = useMemo(() => {
    if (!report) return []
    const base = tipoFilter === 'todos'
      ? report.transactions
      : report.transactions.filter(t => t.tipo === tipoFilter)
    return [...new Set(base.map(t => t.categoria))].sort()
  }, [report, tipoFilter])

  // Transactions after applying both filters
  const filtered = useMemo(() => {
    if (!report) return []
    return report.transactions.filter(t => {
      const okTipo = tipoFilter === 'todos' || t.tipo === tipoFilter
      const okCat  = categoriaFilter === 'todas' || t.categoria === categoriaFilter
      return okTipo && okCat
    })
  }, [report, tipoFilter, categoriaFilter])

  // Summary cards recomputed from filtered set
  const summary = useMemo(() => {
    const receitas = filtered.filter(t => t.tipo === 'receita').reduce((s, t) => s + t.valor, 0)
    const despesas = filtered.filter(t => t.tipo === 'despesa').reduce((s, t) => s + t.valor, 0)
    return { receitas, despesas, saldo: receitas - despesas }
  }, [filtered])

  // Pie charts computed from filtered set
  const pieDataDespesas = useMemo(() => {
    const catMap = {}
    for (const t of filtered.filter(tx => tx.tipo === 'despesa')) {
      catMap[t.categoria] = (catMap[t.categoria] || 0) + t.valor
    }
    return Object.entries(catMap).map(([name, value]) => ({ name, value }))
  }, [filtered])

  const pieDataReceitas = useMemo(() => {
    const catMap = {}
    for (const t of filtered.filter(tx => tx.tipo === 'receita')) {
      catMap[t.categoria] = (catMap[t.categoria] || 0) + t.valor
    }
    return Object.entries(catMap).map(([name, value]) => ({ name, value }))
  }, [filtered])

  const evolutionData = evolution.map(e => ({
    mes: e.mes,
    Receitas: e.receitas,
    Despesas: e.despesas,
  }))

  const isFiltered = tipoFilter !== 'todos' || categoriaFilter !== 'todas'

  return (
    <div className="app-layout">
      <Navbar />
      <main className="main-content">
        <div className="dashboard-header">
          <h2>Relatórios</h2>
          <input
            type="month"
            value={month}
            onChange={e => setMonth(e.target.value)}
            className="month-picker"
          />
        </div>

        <div className="reports-filters">
          <div className="filter-group">
            {[
              { key: 'todos',   label: 'Todos' },
              { key: 'receita', label: '↑ Receitas' },
              { key: 'despesa', label: '↓ Despesas' },
            ].map(({ key, label }) => (
              <button
                key={key}
                className={`filter-btn${tipoFilter === key ? ` filter-btn--${key}` : ''}`}
                onClick={() => setTipoFilter(key)}
              >
                {label}
              </button>
            ))}
          </div>

          <select
            className="filter-select"
            value={categoriaFilter}
            onChange={e => setCategoriaFilter(e.target.value)}
            disabled={categorias.length === 0}
          >
            <option value="todas">Todas as categorias</option>
            {categorias.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          {isFiltered && (
            <button
              className="btn btn-sm btn-outline"
              onClick={() => { setTipoFilter('todos'); setCategoriaFilter('todas') }}
            >
              Limpar filtros
            </button>
          )}
        </div>

        {loading ? (
          <div className="loading">Carregando relatório...</div>
        ) : report ? (
          <>
            <SummaryCards balance={summary} />

            {/* Evolução — full width */}
            <div className="chart-section" style={{ marginBottom: 24 }}>
              <h3>Evolução dos Últimos 6 Meses</h3>
              {evolutionData.length > 0 ? (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={evolutionData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2d3154" />
                    <XAxis dataKey="mes" stroke="#8892a4" tick={{ fontSize: 12 }} />
                    <YAxis stroke="#8892a4" tick={{ fontSize: 12 }} tickFormatter={v => `R$${(v / 1000).toFixed(0)}k`} />
                    <Tooltip
                      contentStyle={{ background: '#1a1d2e', border: '1px solid #2d3154', borderRadius: 8 }}
                      formatter={(v) => fmt(v)}
                    />
                    <Legend />
                    <Bar dataKey="Receitas" fill="#22c55e" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Despesas" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="empty-chart">Sem dados suficientes para o gráfico</div>
              )}
            </div>

            {/* Dois pies lado a lado */}
            <div className="reports-charts">
              <div className="chart-section">
                <h3>
                  Despesas por Categoria
                  {categoriaFilter !== 'todas' && (
                    <span style={{ fontWeight: 400, color: 'var(--text-muted)', fontSize: 13 }}>
                      {' '}— {categoriaFilter}
                    </span>
                  )}
                </h3>
                <ExpensePieChart data={pieDataDespesas} emptyMessage="Nenhuma despesa neste período" />
              </div>

              <div className="chart-section">
                <h3>
                  Fontes de Renda
                  {categoriaFilter !== 'todas' && (
                    <span style={{ fontWeight: 400, color: 'var(--text-muted)', fontSize: 13 }}>
                      {' '}— {categoriaFilter}
                    </span>
                  )}
                </h3>
                <ExpensePieChart data={pieDataReceitas} emptyMessage="Nenhuma receita neste período" />
              </div>
            </div>

            <div className="transactions-section">
              <div className="section-header">
                <h3>
                  Transações do mês{' '}
                  <span style={{ fontWeight: 400, color: 'var(--text-muted)', fontSize: 14 }}>
                    {isFiltered
                      ? `${filtered.length} de ${report.transactions.length} registro(s)`
                      : `${report.transactions.length} registro(s)`}
                  </span>
                </h3>
              </div>

              {filtered.length === 0 ? (
                <div className="empty-state">
                  {isFiltered
                    ? 'Nenhuma transação com os filtros selecionados.'
                    : 'Nenhuma transação neste mês.'}
                </div>
              ) : (
                <ul className="transaction-list">
                  {filtered.map(t => (
                    <li key={t.id} className={`transaction-item ${t.tipo}`}>
                      <div className="tx-icon">{t.tipo === 'receita' ? '↑' : '↓'}</div>
                      <div className="tx-info">
                        <span className="tx-desc">{t.descricao || t.categoria}</span>
                        <span className="tx-meta">{t.categoria} · {fmtDate(t.data)}</span>
                      </div>
                      <div className="tx-amount">
                        {t.tipo === 'receita' ? '+' : '-'}{fmt(t.valor)}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        ) : null}
      </main>
    </div>
  )
}
