# 💰 MoneyTrack

![Status](https://img.shields.io/badge/status-em%20desenvolvimento-yellow)
![Frontend](https://img.shields.io/badge/frontend-HTML%20%7C%20CSS%20%7C%20JS-blue)
![Storage](https://img.shields.io/badge/storage-LocalStorage-orange)
![License](https://img.shields.io/badge/license-acadêmico-lightgrey)

---

## 📖 Sobre o projeto

O **MoneyTrack** é uma aplicação web de **gestão financeira pessoal**, desenvolvida com o objetivo de auxiliar usuários no controle de suas receitas, despesas e saldo, oferecendo uma experiência visual moderna e intuitiva.

A aplicação permite registrar movimentações financeiras, visualizar resumos e acompanhar dados através de gráficos, promovendo maior organização e controle financeiro.

---

## 🎯 Objetivo

Desenvolver uma plataforma web que permita ao usuário:

- controlar receitas e despesas;
- visualizar saldo atualizado automaticamente;
- analisar seus gastos;
- melhorar sua organização financeira;
- ter uma visão clara de sua saúde financeira.

---

## ✨ Funcionalidades

### 👤 Autenticação
- Cadastro de usuários
- Login com validação
- Logout
- Proteção de acesso à dashboard
- Persistência de sessão com LocalStorage

---

### 💸 Gestão financeira
- Cadastro de transações
- Exclusão de transações
- Associação por usuário
- Tipos:
  - Receita
  - Despesa

---

### 📊 Análise de dados
- Cálculo automático de saldo
- Total de receitas
- Total de despesas
- Atualização em tempo real

---

### 🔎 Filtros
- Filtro por tipo
- Filtro por categoria

---

### 📈 Visualização
- Gráfico Doughnut (Chart.js)
- Atualização dinâmica

---

### 🎨 Interface
- Landing page moderna
- Dashboard interativo
- Cards estilizados
- Animações (fundo com $)
- Botões padronizados
- Responsividade básica

---

## 🛠 Tecnologias utilizadas

| Tecnologia | Uso |
|---|---|
| HTML5 | Estrutura |
| CSS3 | Estilização |
| JavaScript | Lógica |
| LocalStorage | Persistência |
| Chart.js | Gráficos |

---

## 🔄 Fluxo do sistema

Usuário acessa a aplicação
        ↓
Landing Page
        ↓
Cadastro ou Login
        ↓
Autenticação validada
        ↓
Dashboard
        ↓
Gestão de transações financeiras

---

## Modelagem de dados

## 👤 Usuário
{
  "id": 1,
  "nome": "Mariah",
  "email": "mariah@email.com",
  "senha": "123456"
}

## 💸 Transação
{
  "id": 2,
  "usuario_id": 1,
  "tipo": "receita",
  "valor": 1500,
  "descricao": "Salário",
  "categoria": "Salário",
  "data": "2026-04-18"
}

##  🔗 Relacionamento
- Um usuário pode possuir várias transações;
- Cada transação pertence a um único usuário.

## 🔮 Melhorias futuras
- edição de transações;
- filtro por data;
- relatórios mensais;
- exportação de dados (CSV/PDF);
- integração com backend;
- banco de dados real;
- autenticação segura;
- integração com APIs financeiras;
- metas e alertas financeiros.


## 👥 Equipe
- Maria Mariah Q. F. Soares
- Jefferson Fidelis
- Diogo Souza
- Weslley Batista

```md
## 📸 Preview

![Landing](/frontend/assets/imagens/ladingpage_inicio.png)
![Lading](/frontend/assets/imagens/landingpage_recursos2.png)
![Dashboard](/frontend/assets/imagens/dashboard_1.png)
![Dashboard](./frontend/assets/imagens/dashboard_2.png)


## Considerações Finais
O MoneyTrack encontra-se em evolução contínua, já apresentando funcionalidades essenciais de um sistema de gestão financeira pessoal. O projeto demonstra domínio de desenvolvimento frontend, organização de código e aplicação de conceitos fundamentais de engenharia de software.

## 🧱 Arquitetura

```bash
moneytrack/
│
├── backend/
├── database/
├── frontend/
│   ├── assets/
│   ├── js/
│   │   ├── auth.js
│   │   ├── dashboard.js
│   │   └── index.js
│   │
│   ├── index.html
│   ├── login.html
│   ├── register.html
│   ├── dashboard.html
│   ├── style.css
│   └── README.md
