# 01 — Visão Geral do Projeto

## O que é o MoneyTrack?

O **MoneyTrack** é um sistema web de gestão financeira pessoal. O usuário cria uma conta, faz login e passa a registrar suas receitas (dinheiro que entra) e despesas (dinheiro que sai). O sistema calcula o saldo automaticamente e exibe gráficos para facilitar a análise dos gastos.

O projeto foi desenvolvido como trabalho acadêmico da disciplina **Programação de Computadores** no período 2026.1.

---

## 🎯 Objetivos

### Objetivo geral
Desenvolver um sistema que permita ao usuário controlar suas finanças pessoais de forma simples, intuitiva e eficiente.

### Objetivos específicos
- Permitir cadastro e autenticação de usuários com senha criptografada
- Registrar receitas e despesas com categoria e data
- Exibir saldo atualizado automaticamente
- Filtrar transações por tipo, categoria e período
- Gerar relatórios financeiros mensais
- Exibir gráficos de gastos por categoria

---

## 📋 Requisitos Funcionais

Os requisitos funcionais descrevem **o que o sistema deve fazer**.

### Usuário
| ID | Descrição | Onde está implementado |
|----|-----------|----------------------|
| RF01 | O sistema deve permitir o cadastro de usuários | `POST /api/auth/register` + página `/cadastro` |
| RF02 | O sistema deve permitir login e logout | `POST /api/auth/login` + botão "Sair" na Navbar |
| RF03 | O sistema deve permitir editar dados do usuário | `PUT /api/auth/profile` + `ProfileModal.jsx` |

### Transações
| ID | Descrição | Onde está implementado |
|----|-----------|----------------------|
| RF04 | O sistema deve permitir cadastrar receitas | `POST /api/transactions` (tipo: receita) |
| RF05 | O sistema deve permitir cadastrar despesas | `POST /api/transactions` (tipo: despesa) |
| RF06 | O sistema deve permitir editar transações | `PUT /api/transactions/:id` + botão ✏️ |
| RF07 | O sistema deve permitir excluir transações | `DELETE /api/transactions/:id` + botão 🗑️ |
| RF08 | O sistema deve listar todas as transações | `GET /api/transactions` + `TransactionList.jsx` |

### Controle financeiro
| ID | Descrição | Onde está implementado |
|----|-----------|----------------------|
| RF09 | O sistema deve calcular o saldo automaticamente | `GET /api/reports/balance` + `SummaryCards.jsx` |
| RF10 | O sistema deve permitir filtrar transações por data | Query params `data_inicio` e `data_fim` |
| RF11 | O sistema deve permitir categorizar transações | Campo `categoria` no formulário e no banco |

### Relatórios
| ID | Descrição | Onde está implementado |
|----|-----------|----------------------|
| RF12 | O sistema deve gerar relatório mensal | `GET /api/reports/monthly` + página `Reports.jsx` |
| RF13 | O sistema deve exibir gráficos de gastos por categoria | `ExpensePieChart.jsx` + Recharts |

---

## 📋 Requisitos Não Funcionais

Os requisitos não funcionais descrevem **como o sistema deve se comportar**.

| ID | Descrição | Como foi atendido |
|----|-----------|-------------------|
| RNF01 | Interface amigável e intuitiva | Design com tema escuro moderno, cards e modais |
| RNF02 | Segurança dos dados (senha criptografada) | bcryptjs com fator 10 de custo |
| RNF03 | Tempo de resposta inferior a 3 segundos | SQLite local + Prisma = respostas em < 100ms |
| RNF04 | Acessível via navegador web | React rodando no navegador via Vite |
| RNF05 | Responsivo (adaptável ao celular) | CSS com media queries e grid layout flexível |

---

## 🗓️ Sprints

### Sprint 1 (Semanas 1–2)
- Definição de requisitos
- Modelagem do banco de dados
- Diagrama de casos de uso e classes
- Estrutura inicial do projeto

### Sprint 2 (Semanas 3–4)
- Implementação do CRUD de transações
- Telas base (landing, login, cadastro, dashboard)
- Cálculo automático de saldo
- Persistência com LocalStorage (versão inicial)

### Sprint 3 (Semanas 5–6)
- Migração para backend real (Node.js + Express)
- Banco de dados SQLite com Prisma
- Autenticação JWT com bcrypt
- React com Vite (versão atual)
- Relatórios mensais e gráficos

---

## 🔄 Fluxo geral da aplicação

```
Usuário abre http://localhost:5173
             ↓
     Landing Page (apresentação)
             ↓
    Cadastro ou Login
             ↓
    Token JWT salvo no navegador
             ↓
         Dashboard
    ┌────────────────────────────┐
    │ • Ver saldo/receitas/despesas │
    │ • Adicionar transação         │
    │ • Editar transação            │
    │ • Excluir transação           │
    │ • Filtrar por tipo/categoria/data │
    │ • Ver gráfico por categoria   │
    └────────────────────────────┘
             ↓
        Relatórios
    ┌────────────────────────────┐
    │ • Selecionar mês              │
    │ • Resumo do mês               │
    │ • Gráfico de barras (6 meses) │
    │ • Gráfico de pizza (categorias)│
    └────────────────────────────┘
```
