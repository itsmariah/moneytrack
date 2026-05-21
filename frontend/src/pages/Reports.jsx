import { useState, useEffect } from 'react'
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

  useEffect(() => {
    fetchReport()
  }, [month])

  useEffect(() => {
    api.get('/reports/evolution').then(r => setEvolution(r.data)).catch(() => {})
  }, [])

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

  const despesasByCategory = (report?.categories || [])
    .filter(d => d.tipo === 'despesa')
    .map(d => ({ name: d.categoria, value: d.total }))

  const evolutionData = evolution.map(e => ({
    mes: e.mes,
    Receitas: e.receitas,
    Despesas: e.despesas,
  }))

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

        {loading ? (
          <div className="loading">Carregando relatório...</div>
        ) : report ? (
          <>
            <SummaryCards balance={report.resumo} />

            <div className="reports-charts">
              <div className="chart-section">
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

              <div className="chart-section">
                <h3>Despesas por Categoria — {month}</h3>
                <ExpensePieChart data={despesasByCategory} />
              </div>
            </div>

            <div className="transactions-section">
              <div className="section-header">
                <h3>Transações do mês — {report.transactions.length} registro(s)</h3>
              </div>
              {report.transactions.length === 0 ? (
                <div className="empty-state">Nenhuma transação neste mês.</div>
              ) : (
                <ul className="transaction-list">
                  {report.transactions.map(t => (
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
