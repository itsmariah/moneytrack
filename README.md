# 💰 MoneyTrack

> Sistema de gestão financeira pessoal — Projeto Acadêmico | Programação de Computadores 2026.1

![Status](https://img.shields.io/badge/status-em%20desenvolvimento-yellow)
![Frontend](https://img.shields.io/badge/frontend-React%20%7C%20Vite-61dafb)
![Backend](https://img.shields.io/badge/backend-Node.js%20%7C%20Express-green)
![Database](https://img.shields.io/badge/banco-SQLite%20%7C%20Prisma-blue)

---

## 👥 Equipe

| Nome | GitHub |
|------|--------|
| Mariah | [@itsmariah](https://github.com/itsmariah) |
| Jefferson | — |
| Diogo | — |
| Weslley | — |

**Professor:** Edkallenn Lima

---

## 📖 Sobre o projeto

O **MoneyTrack** é uma aplicação web de gestão financeira pessoal que permite ao usuário registrar receitas e despesas, visualizar o saldo atualizado automaticamente, filtrar transações e gerar relatórios mensais com gráficos.

---

## ✨ Funcionalidades

- Cadastro e login de usuários (senha criptografada)
- Adicionar, editar e excluir transações
- Saldo calculado automaticamente
- Filtros por tipo, categoria e período de data
- Gráfico de despesas por categoria (rosca)
- Relatório mensal com gráfico de evolução (últimos 6 meses)
- Edição de perfil (nome, e-mail, senha)
- Interface responsiva (funciona no celular)

---

## 🛠 Tecnologias

| Camada | Tecnologia |
|--------|-----------|
| Frontend | React 18 + Vite |
| Roteamento | React Router DOM |
| Gráficos | Recharts |
| HTTP | Axios |
| Backend | Node.js + Express |
| Banco de dados | SQLite (via Prisma ORM) |
| Autenticação | JWT (JSON Web Token) |
| Criptografia | bcryptjs |

---

## 📁 Estrutura do projeto

```
moneytrack/
│
├── backend/                        ← API REST (Node.js + Express)
│   ├── prisma/
│   │   ├── schema.prisma           ← Modelos do banco de dados
│   │   └── dev.db                  ← Banco SQLite (gerado automaticamente)
│   ├── database/
│   │   └── db.js                   ← Conexão com o banco (Prisma Client)
│   ├── middleware/
│   │   └── auth.js                 ← Verificação do token JWT
│   ├── routes/
│   │   ├── auth.js                 ← Cadastro, login, editar perfil
│   │   ├── transactions.js         ← CRUD de transações
│   │   └── reports.js              ← Saldo, relatórios, gráficos
│   ├── server.js                   ← Ponto de entrada da API
│   ├── .env                        ← Variáveis de ambiente (não vai pro git)
│   └── package.json
│
└── frontend/                       ← Interface React
    ├── src/
    │   ├── pages/
    │   │   ├── Landing.jsx         ← Página inicial
    │   │   ├── Login.jsx           ← Tela de login
    │   │   ├── Register.jsx        ← Tela de cadastro
    │   │   ├── Dashboard.jsx       ← Painel principal
    │   │   └── Reports.jsx         ← Relatórios mensais
    │   ├── components/
    │   │   ├── Navbar.jsx          ← Barra de navegação
    │   │   ├── SummaryCards.jsx    ← Cards de saldo/receitas/despesas
    │   │   ├── TransactionModal.jsx← Modal de adicionar/editar transação
    │   │   ├── TransactionList.jsx ← Lista de transações
    │   │   ├── ProfileModal.jsx    ← Modal de editar perfil
    │   │   ├── PrivateRoute.jsx    ← Proteção de rotas autenticadas
    │   │   └── charts/
    │   │       └── ExpensePieChart.jsx ← Gráfico de pizza
    │   ├── context/
    │   │   └── AuthContext.jsx     ← Estado global de autenticação
    │   ├── services/
    │   │   └── api.js              ← Configuração do Axios (HTTP)
    │   ├── App.jsx                 ← Rotas da aplicação
    │   ├── main.jsx                ← Ponto de entrada React
    │   └── index.css               ← Estilos globais (tema escuro)
    ├── index.html                  ← HTML base (Vite)
    ├── vite.config.js              ← Configuração do Vite
    └── package.json
```

---

## 🚀 Como rodar o projeto

### Pré-requisitos

- [Node.js](https://nodejs.org/) versão 18 ou superior instalado
- Git instalado

### Passo 1 — Clonar o repositório

```bash
git clone https://github.com/itsmariah/moneytrack.git
cd moneytrack
```

### Passo 2 — Configurar e rodar o backend

Abra um terminal e execute:

```bash
cd backend
npm install
npx prisma migrate dev --name init
npm run dev
```

O terminal vai mostrar:
```
MoneyTrack API rodando em http://localhost:3001
```

> O comando `prisma migrate dev` cria o banco de dados SQLite automaticamente.
> Só precisa rodar na primeira vez.

### Passo 3 — Configurar e rodar o frontend

Abra **outro terminal** (sem fechar o primeiro) e execute:

```bash
cd frontend
npm install
npm run dev
```

O terminal vai mostrar:
```
  VITE v5.x.x  ready in xxx ms
  ➜  Local:   http://localhost:5173/
```

### Passo 4 — Acessar o sistema

Abra o navegador em: **http://localhost:5173**

> Os dois terminais precisam estar abertos ao mesmo tempo.
> O backend (porta 3001) e o frontend (porta 5173) rodam em paralelo.

---

## 🔌 Endpoints da API

Base URL: `http://localhost:3001/api`

### Autenticação

| Método | Rota | Descrição | Auth |
|--------|------|-----------|------|
| POST | `/auth/register` | Cadastrar usuário | Não |
| POST | `/auth/login` | Fazer login | Não |
| GET | `/auth/me` | Dados do usuário logado | Sim |
| PUT | `/auth/profile` | Editar perfil | Sim |

### Transações

| Método | Rota | Descrição | Auth |
|--------|------|-----------|------|
| GET | `/transactions` | Listar transações (com filtros) | Sim |
| POST | `/transactions` | Criar transação | Sim |
| PUT | `/transactions/:id` | Editar transação | Sim |
| DELETE | `/transactions/:id` | Excluir transação | Sim |

**Filtros disponíveis no GET `/transactions`:**
```
?tipo=receita           → filtra por tipo
?categoria=Alimentação  → filtra por categoria
?data_inicio=2026-05-01 → filtra por data inicial
?data_fim=2026-05-31    → filtra por data final
```

### Relatórios

| Método | Rota | Descrição | Auth |
|--------|------|-----------|------|
| GET | `/reports/balance` | Saldo geral (receitas - despesas) | Sim |
| GET | `/reports/monthly?month=2026-05` | Relatório de um mês | Sim |
| GET | `/reports/categories` | Totais por categoria e tipo | Sim |
| GET | `/reports/evolution` | Evolução dos últimos 6 meses | Sim |

### Exemplo de uso

**Cadastrar usuário:**
```json
POST /api/auth/register
{
  "nome": "Jefferson",
  "email": "jeff@email.com",
  "senha": "minhasenha"
}
```

**Resposta:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": { "id": 1, "nome": "Jefferson", "email": "jeff@email.com" }
}
```

**Criar transação** (com o token no header):
```json
POST /api/transactions
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...

{
  "tipo": "despesa",
  "valor": 45.90,
  "categoria": "Alimentação",
  "descricao": "Almoço",
  "data": "2026-05-21"
}
```

---

## 🗄️ Banco de dados

O banco é um arquivo SQLite criado automaticamente em `backend/prisma/dev.db`.

**Tabela: Usuario**

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | Int (PK) | Identificador único |
| nome | String | Nome do usuário |
| email | String (único) | E-mail de login |
| senha | String | Senha criptografada (bcrypt) |
| createdAt | DateTime | Data de cadastro |

**Tabela: Transacao**

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | Int (PK) | Identificador único |
| usuarioId | Int (FK) | Referência ao usuário |
| tipo | String | `receita` ou `despesa` |
| valor | Float | Valor em reais |
| categoria | String | Ex: Salário, Alimentação... |
| descricao | String | Descrição opcional |
| data | String | Data no formato YYYY-MM-DD |
| createdAt | DateTime | Data de criação |

**Relacionamento:** Um usuário pode ter várias transações (1:N).

---

## 🔐 Segurança

- Senhas armazenadas com hash **bcrypt** (fator 10) — nunca em texto puro
- Autenticação via **JWT** com expiração de 7 dias
- Todas as rotas de transações e relatórios exigem token válido
- Cada usuário só acessa suas próprias transações

---

## 🔄 Fluxo da aplicação

```
Usuário abre o navegador
        ↓
Landing Page (/)
        ↓
Cadastro (/cadastro) ou Login (/login)
        ↓
Token JWT gerado e salvo no navegador
        ↓
Dashboard (/dashboard)
    ├── Ver saldo, receitas e despesas
    ├── Adicionar / editar / excluir transações
    ├── Filtrar por tipo, categoria e data
    └── Ver gráfico de gastos por categoria
        ↓
Relatórios (/relatorios)
    ├── Selecionar mês
    ├── Ver resumo do mês
    ├── Gráfico de barras (últimos 6 meses)
    └── Gráfico de pizza (despesas por categoria)
```

---

## 📸 Preview (versão anterior)

> As imagens abaixo mostram a versão inicial do projeto (HTML/CSS/JS puro).
> A versão atual usa React com design atualizado.

**Landing Page**
![Landing](./frontend/assets/imagens/ladingpage_inicio.png)

**Dashboard**
![Dashboard](./frontend/assets/imagens/dashboard_1.png)

---

## 📋 Requisitos implementados

| ID | Requisito | Status |
|----|-----------|--------|
| RF01 | Cadastro de usuários | ✅ |
| RF02 | Login e logout | ✅ |
| RF03 | Editar dados do usuário | ✅ |
| RF04 | Cadastrar receitas | ✅ |
| RF05 | Cadastrar despesas | ✅ |
| RF06 | Editar transações | ✅ |
| RF07 | Excluir transações | ✅ |
| RF08 | Listar transações | ✅ |
| RF09 | Calcular saldo automaticamente | ✅ |
| RF10 | Filtrar por data | ✅ |
| RF11 | Categorizar transações | ✅ |
| RF12 | Relatório mensal | ✅ |
| RF13 | Gráfico de gastos por categoria | ✅ |

---

## ⚠️ Observações importantes

- O arquivo `.env` **não vai para o Git** (está no `.gitignore`). Cada desenvolvedor cria o seu.
- O banco `dev.db` também **não vai para o Git**. É criado localmente com `prisma migrate dev`.
- Os dois servidores precisam estar rodando ao mesmo tempo para o sistema funcionar.
