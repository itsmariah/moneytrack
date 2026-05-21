# 07 — API Endpoints

## O que é uma API REST?

**API** (Application Programming Interface) é um conjunto de "contratos" que define como dois sistemas se comunicam.

**REST** (Representational State Transfer) é um estilo de arquitetura para APIs que usa os métodos HTTP de forma semântica:

| Método HTTP | Ação |
|-------------|------|
| GET | Buscar dados |
| POST | Criar dados |
| PUT | Atualizar dados |
| DELETE | Deletar dados |

**Base URL:** `http://localhost:3001/api`

---

## Autenticação nas requisições

Rotas marcadas com 🔒 exigem o token JWT no header:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 👤 Rotas de Autenticação

### POST /auth/register

Cadastra um novo usuário.

**Não requer autenticação.**

**Body:**
```json
{
  "nome": "Jefferson Fidelis",
  "email": "jefferson@email.com",
  "senha": "minhasenha123"
}
```

**Resposta 201 Created:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "nome": "Jefferson Fidelis",
    "email": "jefferson@email.com"
  }
}
```

**Erros possíveis:**
| Código | Mensagem | Causa |
|--------|----------|-------|
| 400 | "Preencha todos os campos" | Campo faltando |
| 400 | "A senha deve ter no mínimo 6 caracteres" | Senha curta |
| 409 | "E-mail já cadastrado" | E-mail duplicado |

---

### POST /auth/login

Autentica um usuário existente.

**Não requer autenticação.**

**Body:**
```json
{
  "email": "jefferson@email.com",
  "senha": "minhasenha123"
}
```

**Resposta 200 OK:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "nome": "Jefferson Fidelis",
    "email": "jefferson@email.com"
  }
}
```

**Erros possíveis:**
| Código | Mensagem | Causa |
|--------|----------|-------|
| 400 | "Preencha e-mail e senha" | Campo faltando |
| 401 | "E-mail ou senha incorretos" | Credenciais erradas |

---

### GET /auth/me 🔒

Retorna os dados do usuário logado.

**Resposta 200 OK:**
```json
{
  "id": 1,
  "nome": "Jefferson Fidelis",
  "email": "jefferson@email.com"
}
```

---

### PUT /auth/profile 🔒

Atualiza os dados do usuário logado. Todos os campos são opcionais.

**Body (enviar apenas o que quiser atualizar):**
```json
{
  "nome": "Jefferson F.",
  "email": "novo@email.com",
  "senha": "novasenha456"
}
```

**Resposta 200 OK:**
```json
{
  "id": 1,
  "nome": "Jefferson F.",
  "email": "novo@email.com"
}
```

---

## 💸 Rotas de Transações

> Todas as rotas abaixo são 🔒 — requerem JWT.
> Cada usuário acessa apenas suas próprias transações.

---

### GET /transactions 🔒

Lista transações do usuário logado. Suporta filtros via query string.

**Query params (todos opcionais):**
| Parâmetro | Tipo | Exemplo | Descrição |
|-----------|------|---------|-----------|
| `tipo` | string | `receita` ou `despesa` | Filtra por tipo |
| `categoria` | string | `Alimentação` | Filtra por categoria |
| `data_inicio` | string | `2026-05-01` | Data mínima (YYYY-MM-DD) |
| `data_fim` | string | `2026-05-31` | Data máxima (YYYY-MM-DD) |

**Exemplos de URL:**
```
GET /api/transactions
GET /api/transactions?tipo=despesa
GET /api/transactions?categoria=Alimentação
GET /api/transactions?data_inicio=2026-05-01&data_fim=2026-05-31
GET /api/transactions?tipo=despesa&categoria=Lazer
```

**Resposta 200 OK:**
```json
[
  {
    "id": 3,
    "usuarioId": 1,
    "tipo": "despesa",
    "valor": 45.90,
    "categoria": "Alimentação",
    "descricao": "Almoço restaurante",
    "data": "2026-05-21",
    "createdAt": "2026-05-21T14:30:00.000Z"
  },
  {
    "id": 1,
    "usuarioId": 1,
    "tipo": "receita",
    "valor": 3000.00,
    "categoria": "Salário",
    "descricao": "Salário maio",
    "data": "2026-05-01",
    "createdAt": "2026-05-01T09:00:00.000Z"
  }
]
```

---

### POST /transactions 🔒

Cria uma nova transação.

**Body:**
```json
{
  "tipo": "despesa",
  "valor": 45.90,
  "categoria": "Alimentação",
  "descricao": "Almoço restaurante",
  "data": "2026-05-21"
}
```

**Campos obrigatórios:** `tipo`, `valor`, `categoria`, `data`

**Categorias disponíveis:**
`Salário`, `Alimentação`, `Transporte`, `Lazer`, `Saúde`, `Educação`, `Moradia`, `Outros`

**Resposta 201 Created:**
```json
{
  "id": 3,
  "usuarioId": 1,
  "tipo": "despesa",
  "valor": 45.9,
  "categoria": "Alimentação",
  "descricao": "Almoço restaurante",
  "data": "2026-05-21",
  "createdAt": "2026-05-21T14:30:00.000Z"
}
```

---

### PUT /transactions/:id 🔒

Atualiza uma transação existente. O `:id` é o ID da transação na URL.

**Exemplo:** `PUT /api/transactions/3`

**Body (todos os campos obrigatórios):**
```json
{
  "tipo": "despesa",
  "valor": 52.00,
  "categoria": "Alimentação",
  "descricao": "Almoço + sobremesa",
  "data": "2026-05-21"
}
```

**Resposta 200 OK:**
```json
{
  "id": 3,
  "usuarioId": 1,
  "tipo": "despesa",
  "valor": 52.0,
  "categoria": "Alimentação",
  "descricao": "Almoço + sobremesa",
  "data": "2026-05-21",
  "createdAt": "2026-05-21T14:30:00.000Z"
}
```

**Erros possíveis:**
| Código | Causa |
|--------|-------|
| 404 | Transação não encontrada ou não pertence ao usuário |

---

### DELETE /transactions/:id 🔒

Deleta uma transação.

**Exemplo:** `DELETE /api/transactions/3`

**Resposta 204 No Content** (sem corpo na resposta)

---

## 📊 Rotas de Relatórios

> Todas as rotas abaixo são 🔒 — requerem JWT.

---

### GET /reports/balance 🔒

Retorna o saldo geral (total de receitas, total de despesas, saldo).

**Query params opcionais:**
```
?start=2026-05-01   → data inicial
?end=2026-05-31     → data final
```

**Resposta 200 OK:**
```json
{
  "receitas": 3000.00,
  "despesas": 850.50,
  "saldo": 2149.50
}
```

---

### GET /reports/monthly 🔒

Relatório detalhado de um mês específico.

**Query param obrigatório:** `?month=YYYY-MM`

**Exemplo:** `GET /api/reports/monthly?month=2026-05`

**Resposta 200 OK:**
```json
{
  "month": "2026-05",
  "transactions": [
    {
      "id": 1,
      "tipo": "receita",
      "valor": 3000.00,
      "categoria": "Salário",
      "descricao": "Salário maio",
      "data": "2026-05-01"
    },
    {
      "id": 3,
      "tipo": "despesa",
      "valor": 45.90,
      "categoria": "Alimentação",
      "descricao": "Almoço",
      "data": "2026-05-21"
    }
  ],
  "resumo": {
    "receitas": 3000.00,
    "despesas": 45.90,
    "saldo": 2954.10
  }
}
```

---

### GET /reports/categories 🔒

Retorna o total gasto/recebido por categoria e tipo. Usado para o gráfico de pizza.

**Query params opcionais:** `?start=YYYY-MM-DD&end=YYYY-MM-DD`

**Resposta 200 OK:**
```json
[
  { "categoria": "Salário",     "tipo": "receita",  "total": 3000.00 },
  { "categoria": "Alimentação", "tipo": "despesa",  "total": 450.00  },
  { "categoria": "Transporte",  "tipo": "despesa",  "total": 200.00  },
  { "categoria": "Lazer",       "tipo": "despesa",  "total": 150.00  }
]
```

---

### GET /reports/evolution 🔒

Retorna a evolução de receitas e despesas nos últimos 6 meses. Usado para o gráfico de barras.

**Resposta 200 OK:**
```json
[
  { "mes": "2025-12", "receitas": 2800.00, "despesas": 1200.00 },
  { "mes": "2026-01", "receitas": 3000.00, "despesas": 980.00  },
  { "mes": "2026-02", "receitas": 3000.00, "despesas": 1450.00 },
  { "mes": "2026-03", "receitas": 3200.00, "despesas": 800.00  },
  { "mes": "2026-04", "receitas": 3000.00, "despesas": 1100.00 },
  { "mes": "2026-05", "receitas": 3000.00, "despesas": 850.50  }
]
```

---

## Como testar os endpoints manualmente

Você pode testar a API diretamente no terminal com `curl`, ou usar ferramentas como **Insomnia** ou **Postman**.

**Exemplo com curl:**
```bash
# Cadastrar
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"nome":"Teste","email":"teste@test.com","senha":"123456"}'

# Usar o token retornado para listar transações
curl http://localhost:3001/api/transactions \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```
