import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import api from '../services/api'
import { useAuth } from './AuthContext'

const CategoriasContext = createContext(null)

const ICONE_PADRAO = '💰'
const COR_PADRAO = '#6366f1'

export function CategoriasProvider({ children }) {
  const { user } = useAuth()
  const [categorias, setCategorias] = useState([])
  const [loading, setLoading] = useState(true)

  const refetch = useCallback(async () => {
    if (!user) return
    try {
      const { data } = await api.get('/categorias')
      setCategorias(data)
    } catch (err) {
      console.error('Erro ao buscar categorias:', err)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (user) {
      refetch()
    } else {
      setCategorias([])
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const categoriasPorTipo = (tipo) => categorias.filter(c => c.tipo === tipo).map(c => c.nome)

  const todasCategorias = [...new Set(categorias.map(c => c.nome))].sort((a, b) => {
    if (a === 'Outros') return 1
    if (b === 'Outros') return -1
    return a.localeCompare(b, 'pt-BR')
  })

  // Usado pra mostrar ícone/cor de uma categoria pelo nome (ex: numa lista de transações)
  // — cai num padrão neutro se a categoria não tiver metadado (ex: foi excluída depois).
  const getCategoriaInfo = (nome, tipo) => {
    const encontrada = categorias.find(c => c.nome === nome && (!tipo || c.tipo === tipo))
    return { icone: encontrada?.icone || ICONE_PADRAO, cor: encontrada?.cor || COR_PADRAO }
  }

  return (
    <CategoriasContext.Provider value={{
      categorias,
      loading,
      refetch,
      categoriasPorTipo,
      todasCategorias,
      categoriasReceita: categoriasPorTipo('receita'),
      categoriasDespesa: categoriasPorTipo('despesa'),
      getCategoriaInfo,
    }}>
      {children}
    </CategoriasContext.Provider>
  )
}

export const useCategorias = () => useContext(CategoriasContext)
