import { useState, useRef, useCallback } from 'react'
import { readOFXFile, parseOFX } from '../utils/ofxParser'
import { TODAS_CATEGORIAS } from '../utils/categories'
import api from '../services/api'
const fmt = (n) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n)

export default function OFXImportModal({ onClose, onImported }) {
  const [step, setStep]               = useState('upload') // upload | preview | done
  const [transactions, setTransactions] = useState([])
  const [error, setError]             = useState('')
  const [importing, setImporting]     = useState(false)
  const [importedCount, setImportedCount] = useState(0)
  const [dragging, setDragging]       = useState(false)
  const inputRef = useRef(null)

  const processFile = async (file) => {
    setError('')
    try {
      if (!/\.(ofx|ofc)$/i.test(file.name)) {
        throw new Error('Arquivo inválido. Selecione um arquivo .ofx exportado pelo seu banco.')
      }
      const content = await readOFXFile(file)
      const txs = parseOFX(content)
      setTransactions(txs)
      setStep('preview')
    } catch (err) {
      setError(err.message || 'Erro ao processar o arquivo OFX.')
    }
  }

  const handleFileInput  = (e) => { const f = e.target.files?.[0]; if (f) processFile(f) }

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setDragging(false)
    const f = e.dataTransfer.files?.[0]
    if (f) processFile(f)
  }, [])

  const toggle    = (key)            => setTransactions(p => p.map(t => t._key === key ? { ...t, selected: !t.selected } : t))
  const toggleAll = (val)            => setTransactions(p => p.map(t => ({ ...t, selected: val })))
  const setcat    = (key, categoria) => setTransactions(p => p.map(t => t._key === key ? { ...t, categoria } : t))

  const handleImport = async () => {
    const toImport = transactions.filter(t => t.selected)
    if (!toImport.length) { setError('Selecione ao menos uma transação.'); return }
    setImporting(true)
    setError('')
    try {
      const { data } = await api.post('/transactions/bulk', {
        transactions: toImport.map(({ tipo, valor, categoria, descricao, data }) => ({
          tipo, valor, categoria, descricao, data,
        })),
      })
      setImportedCount(data.count)
      setStep('done')
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao importar transações.')
    } finally {
      setImporting(false)
    }
  }

  const selected = transactions.filter(t => t.selected)
  const totalReceitas = selected.filter(t => t.tipo === 'receita').reduce((s, t) => s + t.valor, 0)
  const totalDespesas = selected.filter(t => t.tipo === 'despesa').reduce((s, t) => s + t.valor, 0)

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-wide" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Importar OFX</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        {/* ── STEP 1: upload ── */}
        {step === 'upload' && (
          <>
            <div
              className={`ofx-dropzone${dragging ? ' ofx-dropzone--active' : ''}`}
              onClick={() => inputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
            >
              <div className="ofx-dropzone-icon">📂</div>
              <p className="ofx-dropzone-title">Arraste o arquivo OFX aqui</p>
              <p className="ofx-dropzone-sub">ou clique para selecionar · .ofx</p>
              <input ref={inputRef} type="file" accept=".ofx,.ofc" style={{ display: 'none' }} onChange={handleFileInput} />
            </div>
            <p className="ofx-hint">
              Exporte o extrato da sua conta bancária em formato OFX e importe aqui. A maioria dos bancos brasileiros disponibiliza essa opção no internet banking.
            </p>
          </>
        )}

        {/* ── STEP 2: preview ── */}
        {step === 'preview' && (
          <>
            <div className="ofx-preview-header">
              <span className="ofx-preview-count">{transactions.length} transação(ões) encontrada(s)</span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-sm btn-outline" onClick={() => toggleAll(true)}>Selecionar todos</button>
                <button className="btn btn-sm btn-outline" onClick={() => toggleAll(false)}>Desmarcar todos</button>
              </div>
            </div>

            <div className="ofx-table-wrap">
              <table className="ofx-table">
                <thead>
                  <tr>
                    <th></th>
                    <th>Tipo</th>
                    <th>Data</th>
                    <th>Descrição</th>
                    <th>Categoria</th>
                    <th style={{ textAlign: 'right' }}>Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map(t => (
                    <tr key={t._key} className={t.selected ? '' : 'ofx-row--unselected'}>
                      <td><input type="checkbox" checked={t.selected} onChange={() => toggle(t._key)} /></td>
                      <td>
                        <span className={`ofx-badge ofx-badge--${t.tipo}`}>
                          {t.tipo === 'receita' ? '↑ Receita' : '↓ Despesa'}
                        </span>
                      </td>
                      <td className="ofx-date">{t.data.split('-').reverse().join('/')}</td>
                      <td className="ofx-desc" title={t.descricao}>{t.descricao}</td>
                      <td>
                        <select className="ofx-cat-select" value={t.categoria} onChange={e => setcat(t._key, e.target.value)}>
                          {TODAS_CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </td>
                      <td className={`ofx-amount ofx-amount--${t.tipo}`}>
                        {t.tipo === 'receita' ? '+' : '-'}{fmt(t.valor)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="ofx-summary">
              <span className="ofx-summary-item positive">↑ {fmt(totalReceitas)}</span>
              <span className="ofx-summary-item negative">↓ {fmt(totalDespesas)}</span>
            </div>

            <div className="modal-footer">
              <span className="ofx-footer-info">{selected.length} de {transactions.length} selecionada(s)</span>
              <button className="btn btn-outline" onClick={onClose}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleImport} disabled={importing || !selected.length}>
                {importing ? 'Importando...' : `Importar ${selected.length} transação(ões)`}
              </button>
            </div>
          </>
        )}

        {/* ── STEP 3: done ── */}
        {step === 'done' && (
          <div className="ofx-done">
            <div className="ofx-done-icon">✅</div>
            <p className="ofx-done-title">{importedCount} transação(ões) importada(s) com sucesso!</p>
            <div className="modal-footer" style={{ justifyContent: 'center' }}>
              <button className="btn btn-primary" onClick={() => { onImported(); onClose() }}>
                Ver transações
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
