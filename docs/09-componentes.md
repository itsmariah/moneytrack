# 09 — Componentes React

## O que é um componente?

Um componente React é uma função JavaScript que retorna JSX (HTML + JS misturados). Cada componente representa uma parte visual da interface.

```jsx
// Componente simples
function Titulo({ texto }) {
  return <h1>{texto}</h1>
}

// Usando o componente
<Titulo texto="Olá, mundo!" />
```

O MoneyTrack tem dois tipos de arquivos em `frontend/src/`:
- **`pages/`** — telas completas (acessadas por URL)
- **`components/`** — partes reutilizáveis (usadas dentro das páginas)

---

## 📄 Páginas (`src/pages/`)

### Landing.jsx — Página inicial

**URL:** `/`

**O que faz:** Tela de apresentação do sistema com hero e cards de features. Se o usuário já estiver logado, redireciona para `/dashboard`.

```jsx
useEffect(() => {
  if (user) navigate('/dashboard')  // Redireciona se já logado
}, [user, navigate])
```

**Componentes usados:** nenhum (é uma página standalone)

---

### Login.jsx — Tela de login

**URL:** `/login`

**O que faz:** Formulário com e-mail e senha. Ao fazer login com sucesso, salva o token e redireciona para o dashboard.

**Estado interno:**
```jsx
const [form, setForm] = useState({ email: '', senha: '' })
const [error, setError] = useState('')
const [loading, setLoading] = useState(false)
```

**Fluxo:**
```
Usuário preenche form → submit
        ↓
setLoading(true) — mostra "Entrando..."
        ↓
await login(email, senha)  // chama AuthContext
        ↓
  Sucesso → navigate('/dashboard')
  Erro    → setError(mensagem)
        ↓
setLoading(false)
```

---

### Register.jsx — Tela de cadastro

**URL:** `/cadastro`

**O que faz:** Formulário com nome, e-mail, senha e confirmação de senha. Valida que as senhas coincidem antes de enviar.

**Validação local:**
```jsx
if (form.senha !== form.confirmar) {
  return setError('As senhas não coincidem')
}
```

---

### Dashboard.jsx — Painel principal

**URL:** `/dashboard` (protegida — requer login)

**O que faz:** Tela principal do sistema. Mostra saldo, lista de transações com filtros e gráfico de pizza.

**Estado interno:**
```jsx
const [transactions, setTransactions]   // Lista de transações
const [balance, setBalance]             // { receitas, despesas, saldo }
const [categoryData, setCategoryData]   // Dados para o gráfico
const [filters, setFilters]             // Filtros ativos
const [showModal, setShowModal]         // Mostra/oculta modal
const [editingTransaction, ...]         // Transação sendo editada
const [loading, setLoading]             // Estado de carregamento
```

**Busca paralela de dados:**
```jsx
const [txRes, balanceRes, catRes] = await Promise.all([
  api.get('/transactions', { params }),
  api.get('/reports/balance'),
  api.get('/reports/categories'),
])
// Faz as 3 requisições ao mesmo tempo (mais rápido)
```

**Componentes usados:** `Navbar`, `SummaryCards`, `TransactionModal`, `TransactionList`, `ExpensePieChart`

---

### Reports.jsx — Relatórios mensais

**URL:** `/relatorios` (protegida — requer login)

**O que faz:** Exibe relatório de um mês selecionável, com gráfico de barras (evolução 6 meses), gráfico de pizza (categorias) e lista de transações do mês.

**Estado interno:**
```jsx
const [month, setMonth]         // Mês selecionado (ex: "2026-05")
const [report, setReport]       // Dados do relatório mensal
const [evolution, setEvolution] // Dados dos últimos 6 meses
```

**Componentes usados:** `Navbar`, `SummaryCards`, `ExpensePieChart`, `BarChart` (Recharts direto)

---

## 🧩 Componentes (`src/components/`)

### PrivateRoute.jsx

**O que faz:** Componente "guarda" que protege rotas que requerem login. Se o usuário não estiver autenticado, redireciona para `/login`.

```jsx
export default function PrivateRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) return <div>Carregando...</div>  // Aguarda verificação

  return user
    ? children               // Logado: mostra a página
    : <Navigate to="/login" replace />  // Não logado: redireciona
}
```

**Uso no App.jsx:**
```jsx
<Route path="/dashboard" element={
  <PrivateRoute>
    <Dashboard />
  </PrivateRoute>
} />
```

---

### Navbar.jsx

**O que faz:** Barra de navegação no topo das páginas autenticadas. Mostra links de navegação, nome do usuário e botão de logout.

**Props:** nenhuma (usa `useAuth()` e `useLocation()` direto)

**Funcionalidades:**
- Destaca o link da página atual com `useLocation()`
- Abre o `ProfileModal` ao clicar no nome do usuário
- Chama `logout()` do contexto ao clicar em "Sair"

```jsx
const isActive = (path) => location.pathname === path ? 'active' : ''

<Link to="/dashboard" className={isActive('/dashboard')}>Dashboard</Link>
```

---

### SummaryCards.jsx

**O que faz:** Exibe os 3 cards de resumo financeiro: Saldo Atual, Total Receitas, Total Despesas.

**Props:**
```jsx
<SummaryCards balance={{ saldo: 2149.50, receitas: 3000, despesas: 850.50 }} />
```

**Detalhe:** O saldo muda de cor dependendo do valor:
```jsx
<div className={`card-value ${balance.saldo >= 0 ? 'positive' : 'negative'}`}>
```
- Verde (`positive`) se saldo ≥ 0
- Vermelho (`negative`) se saldo < 0

---

### TransactionList.jsx

**O que faz:** Renderiza a lista de transações. Se a lista estiver vazia, mostra uma mensagem de estado vazio.

**Props:**
```jsx
<TransactionList
  transactions={[...]}   // Array de transações
  onEdit={handleEdit}    // Função chamada ao clicar em ✏️
  onDelete={handleDelete} // Função chamada ao clicar em 🗑️
/>
```

**Renderização condicional:**
```jsx
if (transactions.length === 0) {
  return <div className="empty-state">Nenhuma transação encontrada.</div>
}
```

---

### TransactionModal.jsx

**O que faz:** Modal (janela flutuante) para criar ou editar uma transação. Detecta automaticamente se está criando ou editando pela prop `transaction`.

**Props:**
```jsx
<TransactionModal
  transaction={null}         // null = criando nova
  transaction={{ id: 3 }}   // objeto = editando existente
  onClose={handleClose}      // Fecha o modal
  onSaved={handleSaved}      // Chamada após salvar (recarrega lista)
/>
```

**Pré-preenchimento ao editar:**
```jsx
useEffect(() => {
  if (transaction) {
    setForm({
      tipo: transaction.tipo,
      valor: transaction.valor,
      // ...
    })
  }
}, [transaction])
```

**Lógica de salvar:**
```jsx
if (transaction) {
  await api.put(`/transactions/${transaction.id}`, form)  // Editar
} else {
  await api.post('/transactions', form)                   // Criar
}
```

**Fechar clicando fora:**
```jsx
<div className="modal-overlay" onClick={onClose}>        // Overlay fecha
  <div className="modal" onClick={e => e.stopPropagation()}>  // Modal não fecha
```

---

### ProfileModal.jsx

**O que faz:** Modal para editar nome, e-mail e senha do usuário logado. Envia apenas os campos que foram alterados.

**Lógica de diff (enviar só o que mudou):**
```jsx
const payload = {}
if (form.nome !== user.nome)   payload.nome = form.nome
if (form.email !== user.email) payload.email = form.email
if (form.senha)                payload.senha = form.senha

if (Object.keys(payload).length === 0) {
  return setSuccess('Nenhuma alteração detectada.')
}
```

---

### charts/ExpensePieChart.jsx

**O que faz:** Gráfico de rosca (donut chart) que mostra os gastos por categoria.

**Props:**
```jsx
<ExpensePieChart
  data={[
    { name: 'Alimentação', value: 450 },
    { name: 'Transporte',  value: 200 },
    { name: 'Lazer',       value: 150 },
  ]}
/>
```

**Estado vazio:**
```jsx
if (!data || data.length === 0) {
  return <div className="empty-chart">Nenhuma despesa registrada</div>
}
```

**Cores automáticas:** Um array de 8 cores é ciclado automaticamente para cada fatia.

---

## Contextos (`src/context/`)

### AuthContext.jsx

**O que faz:** Gerencia o estado global de autenticação. Persiste o usuário entre recarregamentos da página usando localStorage.

**O que expõe:**
```jsx
const { user, loading, login, register, logout, updateProfile } = useAuth()
```

| Valor/Função | Tipo | Descrição |
|-------------|------|-----------|
| `user` | objeto ou `null` | Usuário logado (ou null se não logado) |
| `loading` | boolean | `true` enquanto verifica o token salvo |
| `login(email, senha)` | async function | Autentica e atualiza `user` |
| `register(nome, email, senha)` | async function | Cadastra e autentica |
| `logout()` | function | Limpa tudo e define `user = null` |
| `updateProfile(payload)` | async function | Atualiza dados e `user` no estado |

---

## Serviços (`src/services/`)

### api.js

Instância configurada do Axios:

```js
const api = axios.create({ baseURL: '/api' })
```

**Funcionalidades:**
1. **baseURL**: todas as chamadas começam com `/api` automaticamente
2. **Token automático**: injeta o JWT no header de todas as requisições
3. **Interceptor 401**: se o token expirar, redireciona para login automaticamente
