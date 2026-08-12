# 💰 MoneyTrack

> Gestão financeira pessoal com dashboard, relatórios e importação de extratos bancários (OFX).

![Status](https://img.shields.io/badge/status-ativo-brightgreen)
![Frontend](https://img.shields.io/badge/frontend-React%20%7C%20Vite-61dafb)
![Backend](https://img.shields.io/badge/backend-Node.js%20%7C%20Express-green)
![Database](https://img.shields.io/badge/banco-PostgreSQL%20%7C%20Prisma-blue)
![Desktop](https://img.shields.io/badge/desktop-Electron-47848f)

**🔗 Acesse online:** [moneytrack-m4dd.vercel.app](https://moneytrack-m4dd.vercel.app)

---

## 📖 Sobre o projeto

O **MoneyTrack** é uma aplicação de gestão financeira pessoal que permite ao usuário registrar receitas e despesas, visualizar o saldo atualizado automaticamente, filtrar transações, importar extratos bancários (OFX) e gerar relatórios mensais com gráficos. Pode ser executado como aplicação web ou como **app desktop** via Electron.

---

## ✨ Funcionalidades

- Cadastro e login de usuários (senha criptografada)
- Recuperação de senha por e-mail ("Esqueceu a senha?"), com invalidação automática de sessões antigas ao trocar a senha
- Adicionar, editar e excluir transações
- Saldo calculado automaticamente
- Filtros por tipo, categoria, período de data e **busca por texto** (descrição ou categoria)
- Listagem de transações **paginada**
- **Exportação das transações em CSV** (respeitando os filtros ativos)
- **Importação de extratos bancários em formato OFX** com preview e edição de categorias antes de confirmar
- Categorias separadas por tipo (receitas e despesas) com auto-categorização no OFX
- Gráfico de **despesas** por categoria (rosca)
- Gráfico de **fontes de renda** por categoria (rosca)
- Relatório mensal com filtros de tipo e categoria
- Gráfico de evolução mensal (últimos 6 meses)
- Edição de perfil (nome, e-mail, senha, foto de perfil)
- **Modo claro/escuro**, com preferência salva no navegador
- Interface responsiva (menu mobile com hambúrguer na landing page)
- Navegação completa por teclado (modais com trava de foco, `aria-live` para leitores de tela)
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
| Banco de dados | PostgreSQL (via Prisma ORM) |
| Autenticação | JWT (JSON Web Token) |
| Criptografia | bcryptjs |
| Testes | Vitest (unitários e integração) + Supertest (rotas HTTP) |
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
│   │   ├── schema.prisma               ← Modelos do banco de dados (PostgreSQL)
│   │   └── migrations/                 ← Histórico de migrações do Prisma
│   ├── database/
│   │   └── db.js                       ← Conexão com o banco (Prisma Client)
│   ├── middleware/
│   │   └── auth.js                     ← Verificação do token JWT (confere tokenVersion)
│   ├── routes/
│   │   ├── auth.js                     ← Cadastro, login, recuperação de senha, editar perfil
│   │   ├── transactions.js             ← CRUD de transações + busca + paginação + export CSV + bulk
│   │   └── reports.js                  ← Saldo, relatórios, gráficos
│   ├── utils/                          ← Lógica pura, testável sem banco
│   │   ├── mailer.js                   ← Envio de e-mail (redefinição de senha) via nodemailer
│   │   ├── validateTransaction.js      ← Validação de tipo/valor/categoria/data
│   │   ├── reportCalculations.js       ← Cálculo de saldo, resumo mensal e evolução
│   │   ├── pagination.js               ← Normalização de page/limit
│   │   ├── serializeTransaction.js     ← Converte Prisma.Decimal em number nas respostas
│   │   ├── buildTransactionWhere.js    ← Monta o filtro (tipo/categoria/período/busca)
│   │   ├── csvExport.js                ← Gera o CSV de exportação
│   │   └── resetToken.js               ← Hash (sha256) do token de redefinição de senha
│   ├── tests/                          ← Testes de integração das rotas (Vitest + Supertest)
│   ├── server.js                       ← Ponto de entrada da API
│   ├── .env                            ← Variáveis de ambiente (não vai pro git)
│   ├── .env.example                    ← Modelo de variáveis de ambiente (inclui SMTP)
│   └── package.json
│
├── render.yaml                          ← Blueprint de deploy do backend no Render
│
└── frontend/                           ← Interface React
    ├── src/
    │   ├── pages/
    │   │   ├── Landing.jsx             ← Página inicial
    │   │   ├── Login.jsx               ← Tela de login
    │   │   ├── Register.jsx            ← Tela de cadastro
    │   │   ├── ForgotPassword.jsx      ← Solicitar redefinição de senha
    │   │   ├── ResetPassword.jsx       ← Criar nova senha a partir do link recebido
    │   │   ├── Dashboard.jsx           ← Painel principal
    │   │   └── Reports.jsx             ← Relatórios mensais com filtros
    │   ├── components/
    │   │   ├── Navbar.jsx              ← Barra de navegação
    │   │   ├── SummaryCards.jsx        ← Cards de saldo/receitas/despesas
    │   │   ├── TransactionModal.jsx    ← Modal de adicionar/editar transação
    │   │   ├── TransactionList.jsx     ← Lista de transações (com empty states)
    │   │   ├── OFXImportModal.jsx      ← Modal de importação de extrato OFX
    │   │   ├── ProfileModal.jsx        ← Modal de editar perfil
    │   │   ├── PrivateRoute.jsx        ← Proteção de rotas autenticadas
    │   │   ├── Modal.jsx               ← Base dos modais (trava de foco, fecha com Esc)
    │   │   ├── ConfirmDialog.jsx       ← Confirmação de ações destrutivas
    │   │   ├── Alert.jsx               ← Alertas com role="alert"/"status" (leitor de tela)
    │   │   ├── Skeleton.jsx            ← Placeholders de carregamento
    │   │   ├── ThemeToggle.jsx         ← Alternância modo claro/escuro
    │   │   ├── PasswordMatchHint.jsx   ← Feedback ao vivo de confirmação de senha
    │   │   └── charts/
    │   │       └── ExpensePieChart.jsx ← Gráfico de pizza (despesas e receitas)
    │   ├── context/
    │   │   ├── AuthContext.jsx         ← Estado global de autenticação
    │   │   └── ThemeContext.jsx        ← Estado global de tema (persistido no navegador)
    │   ├── services/
    │   │   └── api.js                  ← Configuração do Axios (suporta file://)
    │   ├── utils/
    │   │   ├── categories.js           ← Categorias por tipo (fonte única)
    │   │   ├── ofxParser.js            ← Parser de arquivos OFX (SGML e XML)
    │   │   ├── resizeImage.js          ← Redimensiona a foto de perfil no navegador antes do upload
    │   │   ├── format.js               ← Formatação de moeda (BRL) e data
    │   │   └── chartTheme.js           ← Cores dos gráficos por tema (claro/escuro)
    │   ├── App.jsx                     ← Rotas da aplicação
    │   ├── main.jsx                    ← Ponto de entrada React
    │   └── index.css                   ← Estilos globais (temas claro e escuro via CSS custom properties)
    ├── index.html                      ← HTML base (Vite)
    ├── vite.config.js                  ← Configuração do Vite (base: '/' no web, './' no Electron)
    ├── vercel.json                     ← Rewrite de SPA para deploy na Vercel
    └── package.json
```

---

## 🚀 Como rodar o projeto

### Pré-requisitos

- [Node.js](https://nodejs.org/) versão 18 ou superior
- Git instalado
- Um banco PostgreSQL acessível (local via Docker/instalação nativa, ou uma instância gratuita na nuvem — Neon, Supabase, Render)

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

### Passo 3 — Configurar variáveis de ambiente

```bash
cd backend
cp .env.example .env
```

> Edite o `.env` gerado: defina um `JWT_SECRET` próprio (qualquer string longa e aleatória serve para desenvolvimento local) e aponte `DATABASE_URL` para o seu Postgres (local ou na nuvem — veja o pré-requisito acima).

### Passo 4 — Criar o banco de dados

```bash
# ainda dentro de backend/
npx prisma migrate deploy
npx prisma generate
```

> Só precisa rodar na primeira vez (ou após novas migrações). Aplica as migrações existentes no Postgres configurado em `DATABASE_URL`.

### Passo 5 — Rodar como aplicação web

Abra dois terminais:

```bash
# Terminal 1 — Backend (porta 3001)
cd backend && npm run dev

# Terminal 2 — Frontend (porta 5173)
cd frontend && npm run dev
```

Acesse: **http://localhost:5173**

### Passo 5 (alternativo) — Rodar como app desktop (Electron)

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
| POST | `/auth/forgot-password` | Solicitar link de redefinição de senha por e-mail | Não |
| POST | `/auth/reset-password` | Redefinir senha usando o token recebido por e-mail | Não |
| GET | `/auth/me` | Dados do usuário logado | Sim |
| PUT | `/auth/profile` | Editar perfil | Sim |

### Transações

| Método | Rota | Descrição | Auth |
|--------|------|-----------|------|
| GET | `/transactions` | Listar transações, paginado (com filtros) | Sim |
| GET | `/transactions/export` | Exportar transações em CSV (respeita os filtros) | Sim |
| POST | `/transactions` | Criar transação | Sim |
| POST | `/transactions/bulk` | Importar lote de transações (OFX, máx. 500 por vez) | Sim |
| PUT | `/transactions/:id` | Editar transação | Sim |
| DELETE | `/transactions/:id` | Excluir transação | Sim |

**Filtros disponíveis no GET `/transactions` (e no `/export`):**
```
?tipo=receita           → filtra por tipo
?categoria=Alimentação  → filtra por categoria
?data_inicio=2026-05-01 → filtra por data inicial
?data_fim=2026-05-31    → filtra por data final
?busca=mercado          → busca por texto na descrição ou categoria
?page=1&limit=50        → paginação (padrão: 50 por página, máx. 200)
```

**Resposta do GET `/transactions`:**
```json
{ "transactions": [ /* ... */ ], "page": 1, "limit": 50, "total": 12, "totalPages": 1 }
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

O banco é **PostgreSQL**, acessado via Prisma ORM a partir da string de conexão em `DATABASE_URL`.

**Tabela: Usuario**

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | Int (PK) | Identificador único |
| nome | String | Nome do usuário |
| email | String (único) | E-mail de login |
| senha | String | Senha criptografada (bcrypt) |
| foto | String? | Foto de perfil (base64), opcional |
| resetTokenHash | String? (único) | Hash (sha256) do token de redefinição de senha, opcional |
| resetTokenExpiresAt | DateTime? | Expiração do token de redefinição |
| tokenVersion | Int | Incrementado ao trocar a senha, invalida tokens JWT antigos |
| createdAt | DateTime | Data de cadastro |

**Tabela: Transacao**

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | Int (PK) | Identificador único |
| usuarioId | Int (FK) | Referência ao usuário |
| tipo | String | `receita` ou `despesa` |
| valor | Decimal(12,2) | Valor em reais (armazenamento exato, sem ruído de ponto flutuante) |
| categoria | String | Ex: Salário, Alimentação... |
| descricao | String | Descrição opcional |
| data | String | Data no formato YYYY-MM-DD |
| createdAt | DateTime | Data de criação |

**Relacionamento:** Um usuário pode ter várias transações (1:N).

---

## 🔐 Segurança

- Senhas armazenadas com hash **bcrypt** (fator 10) — nunca em texto puro
- Autenticação via **JWT** (algoritmo fixado em `HS256`) com expiração de 7 dias, segredo obrigatório via `JWT_SECRET` (o servidor recusa iniciar sem essa variável)
- Trocar a senha invalida qualquer token JWT emitido antes disso (`tokenVersion`), mesmo dentro da janela de 7 dias
- Token de redefinição de senha armazenado como hash (sha256), nunca em texto puro
- Rate limiting em `/auth/login`, `/auth/register`, `/auth/forgot-password`, `/auth/reset-password` e em todas as rotas de transações/relatórios
- Cabeçalhos de segurança via `helmet`
- Todas as rotas de transações e relatórios exigem token válido
- Cada usuário só acessa suas próprias transações

---

## 🧪 Testes

Backend e frontend têm suítes de testes automatizados com **[Vitest](https://vitest.dev)**.

```bash
# Backend — 100+ testes: cálculos financeiros, validação, paginação, hash de token,
# serialização de Decimal, e testes de integração das rotas (auth, transações, relatórios) via Supertest
cd backend && npm test

# Frontend — parser de OFX (receita/despesa, encoding, arquivos malformados) e formatação (moeda, data)
cd frontend && npm test
```

Os testes de integração do backend mockam o Prisma Client (sem precisar de um Postgres real pra rodar) e cobrem, entre outras coisas, que cada rota escopa os dados pelo usuário do token — nunca pelo que vem no corpo ou na query string da requisição.

---

## 🚢 Deploy

O banco de dados é **PostgreSQL** (não SQLite), hospedado gratuitamente no **[Neon](https://neon.com)**. O backend roda no **[Render](https://render.com)** (via [`render.yaml`](render.yaml)), e o frontend é publicado como site estático na **[Vercel](https://vercel.com)** (via [`frontend/vercel.json`](frontend/vercel.json)). Essa combinação não exige cartão de crédito em nenhuma das três plataformas.

> ⚠️ Confira as condições atuais de cada plataforma (limites de uso, cartão de crédito) antes de criar as contas — políticas de free tier mudam com frequência. Duas limitações do plano free a ter em mente: o backend no Render "dorme" após 15 min sem tráfego (primeiro acesso subsequente leva ~1 min pra acordar), e o Postgres do Neon suspende o compute após períodos ociosos (também com cold start rápido, mas sem expirar ou apagar dados — diferente do free tier do próprio Render, que apaga o banco após 30 dias).

### Ambiente em produção

| Camada | URL |
|--------|-----|
| Frontend (Vercel) | https://moneytrack-m4dd.vercel.app |
| Backend (Render) | https://moneytrack-backend-glsk.onrender.com/api |
| Banco de dados | Neon, projeto `moneytrack`, região `aws-sa-east-1` (São Paulo) |

### Banco de dados (Neon)

1. [neon.com](https://neon.com) → crie um projeto Postgres (pode usar a região São Paulo — `aws-sa-east-1`).
2. Copie a **connection string** (formato `postgresql://usuario:senha@host/neondb?sslmode=require`).
3. Rode as migrations apontando pra ela (uma vez, a partir de `backend/`):
   ```bash
   DATABASE_URL="sua-connection-string" npx prisma migrate deploy
   ```

### Backend (Render)

1. [render.com](https://render.com) → **New → Blueprint** → conecte o repositório do GitHub. O Render detecta o [`render.yaml`](render.yaml) na raiz automaticamente.
2. Ao aplicar o blueprint, preencha as variáveis marcadas como `sync: false`:
   - `DATABASE_URL`: a connection string do Neon (passo anterior)
   - `FRONTEND_URL`: URL do projeto na Vercel (ex: `https://seu-projeto.vercel.app`)
   - `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_FROM`: credenciais de e-mail para recuperação de senha
   - `JWT_SECRET` é gerado automaticamente pelo Render (`generateValue: true`)
3. Deploy. O `buildCommand` já roda `prisma generate` e `prisma migrate deploy` a cada deploy.

### Frontend (Vercel)

1. [vercel.com](https://vercel.com) → **Add New → Project** → importe o repositório.
2. **Root Directory**: `frontend`
3. Framework preset: **Vite** (a Vercel detecta sozinha; build command `npm run build`, output `dist`)
4. Variável de ambiente: `VITE_API_URL` = URL do app criado no Render + `/api` (ex: `https://moneytrack-backend.onrender.com/api`)
5. Deploy. Depois disso, pegue a URL gerada pela Vercel e atualize `FRONTEND_URL` nas variáveis de ambiente do serviço no Render, se ainda não tiver usado a URL final no passo anterior.

O `vercel.json` já cuida do rewrite de SPA (`BrowserRouter`), então rotas como `/dashboard` funcionam mesmo com acesso direto/F5.

### Desenvolvimento local com Postgres

Como o schema usa `provider = "postgresql"`, rodar localmente também exige uma conexão Postgres real (não dá mais para usar só um arquivo `dev.db`). Opções mais simples:
- Um Postgres local (nativo ou via Docker: `docker run -e POSTGRES_PASSWORD=postgres -p 5432:5432 postgres`)
- Uma instância gratuita na nuvem (o próprio projeto Neon criado para produção, ou outro separado para dev)

Configure `DATABASE_URL` no `backend/.env` apontando para essa conexão (veja `backend/.env.example`).

### Desktop (Electron)

- Sempre gere o instalador com `npm run electron:build` (ou `electron:pack`) **a partir da raiz do repositório** — esses scripts setam `ELECTRON_BUILD=true`, que faz o Vite usar `base: './'` (necessário para o `file://`). Rodar `cd frontend && npm run build` manualmente gera um build incompatível com o Electron.
- Confira que não existe `backend/.env` nem `backend/prisma/dev.db` com dados reais no momento do build — eles são excluídos do pacote pelo filtro do `electron-builder`, mas vale checar antes de distribuir.

#### Publicando uma release (Windows/macOS/Linux) automaticamente

O workflow [`.github/workflows/release.yml`](.github/workflows/release.yml) builda o instalador para as três plataformas e publica direto em **GitHub Releases** sempre que uma tag `vX.Y.Z` é enviada:

```bash
# 1. Atualize a versão em package.json (raiz) para bater com a tag
# 2. Crie e envie a tag
git tag v1.0.0
git push origin v1.0.0
```

Isso dispara o workflow, que builda em paralelo no Windows, macOS e Linux e anexa `.exe`/`.dmg`/`.AppImage` na release correspondente à tag — sem precisar gerar e subir o instalador manualmente. O botão "Baixar para desktop" da landing page aponta para `https://github.com/itsmariah/moneytrack/releases`, então ele passa a funcionar assim que a primeira tag for publicada.

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
| RF18 | Recuperação de senha por e-mail | ✅ |

---

## ⚠️ Observações importantes

- O arquivo `.env` **não vai para o Git** (está no `.gitignore`). Cada desenvolvedor cria o seu a partir de `backend/.env.example`.
- `JWT_SECRET` é **obrigatório** — o servidor (`node server.js`) encerra imediatamente se essa variável não estiver definida.
- Para a recuperação de senha funcionar, configure as variáveis `SMTP_*` no `.env` do backend com credenciais de um provedor de e-mail (ex: Gmail App Password). Sem isso, o envio do e-mail falha.
- Os dois servidores precisam estar rodando ao mesmo tempo para o sistema funcionar (exceto no modo Electron, que gerencia isso automaticamente).
