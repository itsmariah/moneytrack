# 03 — Arquitetura do Sistema

## Visão Geral

O MoneyTrack segue o modelo **Cliente-Servidor**, uma das arquiteturas mais comuns em aplicações web. O sistema é dividido em duas partes independentes que se comunicam via HTTP.

```
┌─────────────────────────────────────────────────────────────┐
│                      NAVEGADOR DO USUÁRIO                   │
│                                                             │
│   ┌─────────────────────────────────────────────────────┐  │
│   │              FRONTEND (React + Vite)                │  │
│   │                 localhost:5173                      │  │
│   │                                                     │  │
│   │  Landing  →  Login  →  Dashboard  →  Relatórios    │  │
│   └──────────────────┬──────────────────────────────────┘  │
│                      │ HTTP (Axios)                         │
└──────────────────────┼──────────────────────────────────────┘
                       │
              /api/... │  (proxy pelo Vite)
                       │
┌──────────────────────▼──────────────────────────────────────┐
│              BACKEND (Node.js + Express)                    │
│                   localhost:3001                            │
│                                                             │
│   ┌──────────┐  ┌────────────────┐  ┌──────────────────┐  │
│   │  /auth   │  │  /transactions │  │    /reports      │  │
│   │ Cadastro │  │  CRUD completo │  │  Saldo, Gráficos │  │
│   │  Login   │  │  com filtros   │  │  Rel. Mensal     │  │
│   │  Perfil  │  │                │  │                  │  │
│   └──────────┘  └────────────────┘  └──────────────────┘  │
│                                                             │
│   ┌─────────────────────────────────────────────────────┐  │
│   │              Middleware JWT                         │  │
│   │  Verifica token em toda rota protegida              │  │
│   └─────────────────────────────────────────────────────┘  │
│                          │                                  │
└──────────────────────────┼──────────────────────────────────┘
                           │ Prisma ORM
┌──────────────────────────▼──────────────────────────────────┐
│                  BANCO DE DADOS (SQLite)                    │
│                    prisma/dev.db                            │
│                                                             │
│   ┌─────────────────┐      ┌──────────────────────────┐   │
│   │    Usuario      │ 1:N  │        Transacao          │   │
│   │─────────────────│──────│──────────────────────────│   │
│   │ id              │      │ id                        │   │
│   │ nome            │      │ usuarioId (FK)            │   │
│   │ email           │      │ tipo (receita/despesa)    │   │
│   │ senha (hash)    │      │ valor                     │   │
│   │ createdAt       │      │ categoria                 │   │
│   └─────────────────┘      │ descricao                 │   │
│                            │ data                      │   │
│                            │ createdAt                 │   │
│                            └──────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## Modelo Cliente-Servidor

### O que é?

É uma arquitetura onde existe um **cliente** (quem pede informações) e um **servidor** (quem responde). O cliente nunca acessa o banco de dados diretamente — ele sempre passa pelo servidor.

### No MoneyTrack

| Papel | Tecnologia | Porta | Responsabilidade |
|-------|-----------|-------|-----------------|
| Cliente | React (Vite) | 5173 | Interface visual, formulários, gráficos |
| Servidor | Node.js (Express) | 3001 | Regras de negócio, autenticação, banco |
| Banco | SQLite (Prisma) | — | Persistir os dados em arquivo |

---

## Como o Frontend fala com o Backend?

O frontend usa o **Axios** para fazer requisições HTTP ao backend. Por exemplo:

```
Usuário clica "Adicionar transação"
          ↓
React chama api.post('/transactions', dados)
          ↓
Axios envia: POST http://localhost:5173/api/transactions
          ↓
Vite intercepta /api/* e redireciona para localhost:3001/api/transactions
          ↓
Express recebe a requisição
          ↓
Middleware verifica o JWT token
          ↓
Route handler salva no banco via Prisma
          ↓
Express responde com { id, tipo, valor, ... }
          ↓
React atualiza a lista na tela
```

> O redirecionamento `/api → localhost:3001` é chamado de **proxy** e é configurado no `vite.config.js`.

---

## Estrutura de pastas

```
moneytrack/
│
├── backend/                    ← Servidor (Node.js)
│   ├── prisma/
│   │   ├── schema.prisma       ← Define as tabelas do banco
│   │   └── dev.db              ← Arquivo do banco SQLite
│   ├── database/
│   │   └── db.js               ← Exporta o PrismaClient
│   ├── middleware/
│   │   └── auth.js             ← Verifica JWT em rotas protegidas
│   ├── routes/
│   │   ├── auth.js             ← /api/auth/*
│   │   ├── transactions.js     ← /api/transactions/*
│   │   └── reports.js          ← /api/reports/*
│   └── server.js               ← Configura e inicia o Express
│
└── frontend/                   ← Interface (React)
    ├── src/
    │   ├── pages/              ← Telas da aplicação
    │   ├── components/         ← Partes reutilizáveis da UI
    │   ├── context/            ← Estado global (usuário logado)
    │   ├── services/           ← Configuração do Axios
    │   ├── App.jsx             ← Define as rotas do React
    │   └── index.css           ← Estilos globais
    ├── index.html              ← HTML base (único arquivo HTML)
    └── vite.config.js          ← Configuração do Vite + proxy
```

---

## Camadas da aplicação

### Camada de Apresentação (Frontend)
Responsável por tudo que o usuário vê e interage. Construída em React, é executada **no navegador** do usuário. Não tem acesso ao banco de dados.

### Camada de Negócio (Backend)
Responsável pelas regras do sistema: validar dados, autenticar usuários, garantir que cada usuário só veja suas próprias transações. Construída em Node.js com Express, roda em um **processo separado no computador**.

### Camada de Dados (Banco)
Responsável por persistir (salvar) as informações. Usamos SQLite, que é um banco de dados em um único arquivo (`dev.db`). O Prisma é a "ponte" entre o Node.js e esse arquivo.

---

## Por que separar frontend e backend?

1. **Segurança**: o banco de dados fica protegido atrás do servidor
2. **Organização**: cada parte tem uma responsabilidade clara
3. **Escalabilidade**: em produção, cada parte pode rodar em servidores diferentes
4. **Reutilização**: o mesmo backend pode servir um app mobile no futuro
