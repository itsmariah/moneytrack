# 💰 MoneyTrack

> Sistema de gestão financeira pessoal — Projeto Acadêmico | Programação de Computadores 2026.1

![Status](https://img.shields.io/badge/status-em%20desenvolvimento-yellow)
![Frontend](https://img.shields.io/badge/frontend-React%20%7C%20Vite-61dafb)
![Backend](https://img.shields.io/badge/backend-Node.js%20%7C%20Express-green)
![Database](https://img.shields.io/badge/banco-SQLite%20%7C%20Prisma-blue)
![Desktop](https://img.shields.io/badge/desktop-Electron-47848f)

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

O **MoneyTrack** é uma aplicação de gestão financeira pessoal que permite ao usuário registrar receitas e despesas, visualizar o saldo atualizado automaticamente, filtrar transações, importar extratos bancários (OFX) e gerar relatórios mensais com gráficos. Pode ser executado como aplicação web ou como **app desktop** via Electron.

---

## ✨ Funcionalidades

- Cadastro e login de usuários (senha criptografada)
- Adicionar, editar e excluir transações
- Saldo calculado automaticamente
- Filtros por tipo, categoria e período de data
- **Importação de extratos bancários em formato OFX** com preview e edição de categorias antes de confirmar
- Categorias separadas por tipo (receitas e despesas) com auto-categorização no OFX
- Gráfico de **despesas** por categoria (rosca)
- Gráfico de **fontes de renda** por categoria (rosca)
- Relatório mensal com filtros de tipo e categoria
- Gráfico de evolução mensal (últimos 6 meses)
- Edição de perfil (nome, e-mail, senha)
- Interface responsiva (funciona no celular)
- **Aplicação desktop** empacotável via Electron

---

## 📸 Preview

**Landing Page**
![Landing Page](./frontend/assets/imagens/moneytrack_landing.png)

**Dashboard**
![Dashboard](./frontend/assets/imagens/moneytrack_dashboard.png)

**Relatórios**
![Relatórios](./frontend/assets/imagens/moneytrack_relatorio.png)

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
| Desktop | Electron 31 + electron-builder |

---

## 📁 Estrutura do projeto

```
moneytrack/
│
├── electron/                           ← App desktop (Electron)
│   ├── main.js                         ← Processo principal: inicia backend e janela
│   └── preload.js                      ← Bridge segura entre main e renderer
│
├── backend/                            ← API REST (Node.js + Express)
│   ├── prisma/
│   │   ├── schema.prisma               ← Modelos do banco de dados
│   │   └── dev.db                      ← Banco SQLite (gerado automaticamente)
│   ├── database/
│   │   └── db.js                       ← Conexão com o banco (Prisma Client)
│   ├── middleware/
│   │   └── auth.js                     ← Verificação do token JWT
│   ├── routes/
│   │   ├── auth.js                     ← Cadastro, login, editar perfil
│   │   ├── transactions.js             ← CRUD de transações + importação bulk
│   │   └── reports.js                  ← Saldo, relatórios, gráficos
│   ├── server.js                       ← Ponto de entrada da API
│   ├── .env                            ← Variáveis de ambiente (não vai pro git)
│   └── package.json
│
└── frontend/                           ← Interface React
    ├── src/
    │   ├── pages/
    │   │   ├── Landing.jsx             ← Página inicial
    │   │   ├── Login.jsx               ← Tela de login
    │   │   ├── Register.jsx            ← Tela de cadastro
    │   │   ├── Dashboard.jsx           ← Painel principal
    │   │   └── Reports.jsx             ← Relatórios mensais com filtros
    │   ├── components/
    │   │   ├── Navbar.jsx              ← Barra de navegação
    │   │   ├── SummaryCards.jsx        ← Cards de saldo/receitas/despesas
    │   │   ├── TransactionModal.jsx    ← Modal de adicionar/editar transação
    │   │   ├── TransactionList.jsx     ← Lista de transações
    │   │   ├── OFXImportModal.jsx      ← Modal de importação de extrato OFX
    │   │   ├── ProfileModal.jsx        ← Modal de editar perfil
    │   │   ├── PrivateRoute.jsx        ← Proteção de rotas autenticadas
    │   │   └── charts/
    │   │       └── ExpensePieChart.jsx ← Gráfico de pizza (despesas e receitas)
    │   ├── context/
    │   │   └── AuthContext.jsx         ← Estado global de autenticação
    │   ├── services/
    │   │   └── api.js                  ← Configuração do Axios (suporta file://)
    │   ├── utils/
    │   │   ├── categories.js           ← Categorias por tipo (fonte única)
    │   │   └── ofxParser.js            ← Parser de arquivos OFX (SGML e XML)
    │   ├── App.jsx                     ← Rotas da aplicação
    │   ├── main.jsx                    ← Ponto de entrada React
    │   └── index.css                   ← Estilos globais (tema escuro)
    ├── index.html                      ← HTML base (Vite)
    ├── vite.config.js                  ← Configuração do Vite (base: './')
    └── package.json
```

---

## 🚀 Como rodar o projeto

### Pré-requisitos

- [Node.js](https://nodejs.org/) versão 18 ou superior
- Git instalado

### Passo 1 — Clonar o repositório

```bash
git clone https://github.com/itsmariah/moneytrack.git
cd moneytrack
```

### Passo 2 — Instalar dependências

```bash
# Instala tudo de uma vez (backend + frontend)
npm run install:all

# Instala as dependências do Electron (pasta raiz)
npm install
```

### Passo 3 — Criar o banco de dados

```bash
cd backend
npx prisma migrate dev --name init
```

> Só precisa rodar na primeira vez. Cria o arquivo `backend/prisma/dev.db`.

### Passo 4 — Rodar como aplicação web

Abra dois terminais:

```bash
# Terminal 1 — Backend (porta 3001)
cd backend && npm run dev

# Terminal 2 — Frontend (porta 5173)
cd frontend && npm run dev
```

Acesse: **http://localhost:5173**

### Passo 4 (alternativo) — Rodar como app desktop (Electron)

```bash
# Da pasta raiz, inicia backend + frontend + Electron ao mesmo tempo
npm run electron:dev
```

### Empacotar como instalador

```bash
# Gera instalador .exe (Windows) em dist-electron/
npm run electron:build
```

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
| POST | `/transactions/bulk` | Importar lote de transações (OFX) | Sim |
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

---

## 📂 Categorias disponíveis

| Receitas | Despesas |
|----------|----------|
| Salário | Alimentação |
| Freelance | Delivery |
| Venda | Transporte |
| Investimentos | Moradia |
| Aluguel recebido | Saúde |
| Outros | Educação |
| | Lazer |
| | Pets |
| | Viagem |
| | Vestuário |
| | Assinaturas |
| | Outros |

> Definidas centralmente em `frontend/src/utils/categories.js`. O dropdown de categoria no formulário de transação muda automaticamente conforme o tipo selecionado.

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
Usuário abre o app (web ou desktop)
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
    ├── Importar extrato bancário (.ofx)
    ├── Gráfico de gastos por categoria
    └── Gráfico de fontes de renda
        ↓
Relatórios (/relatorios)
    ├── Selecionar mês
    ├── Filtrar por tipo (Todos / Receitas / Despesas)
    ├── Filtrar por categoria
    ├── Ver resumo do período filtrado
    ├── Gráfico de barras — evolução dos últimos 6 meses
    ├── Gráfico de pizza — despesas por categoria
    └── Gráfico de pizza — fontes de renda
```

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
| RF14 | Importação de extrato OFX | ✅ |
| RF15 | Filtros na página de relatórios | ✅ |
| RF16 | Gráfico de fontes de renda | ✅ |
| RF17 | Versão desktop (Electron) | ✅ |

---

## ⚠️ Observações importantes

- O arquivo `.env` **não vai para o Git** (está no `.gitignore`). Cada desenvolvedor cria o seu.
- O banco `dev.db` também **não vai para o Git**. É criado localmente com `prisma migrate dev`.
- Os dois servidores precisam estar rodando ao mesmo tempo para o sistema funcionar (exceto no modo Electron, que gerencia isso automaticamente).
