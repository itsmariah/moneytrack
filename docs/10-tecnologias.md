# 10 — Tecnologias Utilizadas

Este documento explica cada tecnologia usada no projeto, por que foi escolhida e como se encaixa no todo.

---

## Backend

### Node.js

**O que é:** Ambiente de execução JavaScript fora do navegador. Permite usar JavaScript no servidor.

**Por que usamos:** A equipe já conhecia JavaScript do frontend, então usar a mesma linguagem no backend reduz a curva de aprendizado. Node.js é amplamente usado na indústria e tem um ecossistema enorme (npm).

**Versão:** 18+

**Comando para verificar:** `node -v`

---

### Express

**O que é:** Framework minimalista para criar servidores HTTP em Node.js.

**Por que usamos:** É o framework mais popular do ecossistema Node.js, muito bem documentado e com sintaxe simples. Permite criar APIs REST de forma organizada.

**Como funciona:**
```js
const app = express()

app.get('/rota', (req, res) => {
  res.json({ mensagem: 'olá' })
})

app.listen(3001)
```

**Site:** https://expressjs.com

---

### Prisma ORM

**O que é:** ORM (Object-Relational Mapper) moderno para Node.js. Traduz código JavaScript em operações no banco de dados.

**Por que usamos:** Alternativa ao `better-sqlite3` (que requer compilação nativa no Windows). O Prisma usa binários pré-compilados em Rust, funcionando em qualquer ambiente sem configuração adicional. Além disso, oferece migrations, type safety e uma API fluente.

**Três partes do Prisma:**
1. **Prisma Client**: biblioteca usada no código para acessar o banco
2. **Prisma Schema**: arquivo que define os modelos (tabelas)
3. **Prisma Migrate**: sistema de migrações de banco de dados

**Site:** https://www.prisma.io

---

### SQLite

**O que é:** Banco de dados relacional que armazena dados em um único arquivo `.db`.

**Por que usamos:** Não requer instalação de um servidor separado (como MySQL ou PostgreSQL). Ideal para projetos acadêmicos, protótipos e aplicações que rodam em uma única máquina.

**Diferença para outros bancos:**
| Banco | Tipo | Quando usar |
|-------|------|-------------|
| SQLite | Arquivo local | Projetos pequenos, desenvolvimento, acadêmico |
| MySQL / PostgreSQL | Servidor | Produção com múltiplos usuários simultâneos |
| MongoDB | NoSQL | Dados não estruturados, documentos JSON |

**Site:** https://sqlite.org

---

### bcryptjs

**O que é:** Biblioteca para criptografar senhas usando o algoritmo bcrypt.

**Por que usamos:** É um requisito de segurança básico nunca armazenar senhas em texto puro. O bcrypt é o algoritmo padrão da indústria para hashing de senhas, pois é intencionalmente lento (resistente a ataques de força bruta) e usa salt automático.

**Por que `bcryptjs` e não `bcrypt`?** O `bcryptjs` é escrito em JavaScript puro — não precisa de compilação nativa. O `bcrypt` original requer node-gyp, que pode dar problemas no Windows (como aconteceu com o `better-sqlite3`).

**Site:** https://github.com/dcodeIO/bcrypt.js

---

### jsonwebtoken (JWT)

**O que é:** Biblioteca para gerar e verificar JSON Web Tokens.

**Por que usamos:** JWT é o padrão moderno para autenticação em APIs. Permite que o servidor seja **stateless** — não precisa guardar sessões em memória ou banco. O token carrega a identidade do usuário e pode ser verificado de forma independente.

**Alternativas:**
- Sessions (cookies + servidor guarda sessão) — mais simples, mas usa mais memória no servidor
- OAuth2 — para autenticação com Google/GitHub, mais complexo

**Site:** https://github.com/auth0/node-jsonwebtoken

---

### CORS (`cors`)

**O que é:** Middleware Express que configura os headers de CORS nas respostas.

**Por que usamos:** O navegador bloqueia por segurança requisições entre origens diferentes (domínios ou portas). Como frontend (5173) e backend (3001) rodam em portas diferentes, precisamos configurar o CORS para permitir a comunicação.

---

### dotenv

**O que é:** Carrega variáveis de ambiente de um arquivo `.env` para `process.env`.

**Por que usamos:** Para separar configurações do código. Senhas, chaves secretas e URLs específicas de cada ambiente (desenvolvimento, produção) ficam no `.env` em vez de hard-coded no código.

---

### nodemon (desenvolvimento)

**O que é:** Monitora arquivos do projeto e reinicia o servidor automaticamente quando há mudanças.

**Por que usamos:** Sem o nodemon, seria necessário parar e reiniciar o servidor manualmente a cada alteração no código. O nodemon automatiza isso, acelerando o desenvolvimento.

---

## Frontend

### React

**O que é:** Biblioteca JavaScript para construir interfaces de usuário com componentes reutilizáveis.

**Por que usamos:** React é a biblioteca frontend mais popular do mundo. Facilita construir interfaces complexas e interativas, gerencia o estado da UI de forma eficiente e tem um ecossistema enorme.

**Conceito central — reconciliação:** React mantém uma cópia virtual do DOM (Virtual DOM). Quando o estado muda, ele calcula a diferença e atualiza apenas as partes necessárias do DOM real. Isso é mais eficiente que manipular o DOM diretamente.

**Versão:** 18

**Site:** https://react.dev

---

### Vite

**O que é:** Ferramenta de build extremamente rápida para projetos frontend modernos.

**Por que usamos:** Alternativa mais moderna e rápida ao Create React App (CRA). O Vite usa ES Modules nativos do navegador em desenvolvimento, o que resulta em hot reload quase instantâneo. Também configuramos o proxy do `/api` nele.

**Versão:** 5

**Site:** https://vitejs.dev

---

### React Router DOM

**O que é:** Biblioteca de roteamento para React. Cria navegação entre "páginas" sem recarregar o navegador.

**Por que usamos:** O MoneyTrack tem múltiplas telas (landing, login, dashboard, relatórios). O React Router gerencia qual componente exibir baseado na URL, criando a experiência de uma aplicação multi-página sem o custo de recarregar tudo.

**Conceito:** SPA (Single Page Application) — o HTML é carregado uma única vez, e o JavaScript troca os componentes na tela conforme o usuário navega.

**Versão:** 6

**Site:** https://reactrouter.com

---

### Axios

**O que é:** Cliente HTTP baseado em Promises para fazer requisições a APIs.

**Por que usamos:** Mais ergonômico que o `fetch` nativo:
- Serializa e desserializa JSON automaticamente
- Permite configurar headers globais (como o token JWT)
- Tem interceptors para tratar erros globalmente
- Melhor tratamento de erros

**Comparação:**
```js
// fetch nativo (mais verboso)
const res = await fetch('/api/transactions', {
  headers: { Authorization: `Bearer ${token}` }
})
const data = await res.json()

// Axios (mais simples)
const { data } = await api.get('/transactions')
// token já está no header por padrão
```

**Site:** https://axios-http.com

---

### Recharts

**O que é:** Biblioteca de gráficos construída especificamente para React, usando SVG.

**Por que usamos:** Os gráficos são componentes React nativos — integram perfeitamente com o estado do React. Quando os dados mudam, os gráficos atualizam automaticamente. É mais simples de usar que Chart.js (que foi usado na versão anterior em HTML puro).

**Gráficos usados:**
| Gráfico | Componente | Onde |
|---------|-----------|------|
| Rosca (donut) | `PieChart + Pie` | Dashboard e Relatórios |
| Barras | `BarChart + Bar` | Relatórios (evolução 6 meses) |

**Site:** https://recharts.org

---

## Controle de versão

### Git

**O que é:** Sistema de controle de versão distribuído.

**Por que usamos:** Permite que a equipe trabalhe em paralelo sem sobrescrever o código um do outro, mantém histórico de todas as mudanças e facilita reverter erros.

**Principais comandos usados:**
```bash
git status              # Ver arquivos modificados
git add arquivo.js      # Preparar arquivo para commit
git commit -m "mensagem"  # Salvar snapshot
git push                # Enviar para o GitHub
git pull                # Baixar mudanças do GitHub
```

---

### GitHub

**O que é:** Plataforma de hospedagem de repositórios Git com ferramentas colaborativas.

**Por que usamos:** Permite que toda a equipe acesse o mesmo código, com histórico de commits, visualização de diferenças e gerenciamento de branches.

**Repositório:** https://github.com/itsmariah/moneytrack

---

## Resumo das dependências

### `backend/package.json`
```json
{
  "dependencies": {
    "@prisma/client": "banco de dados",
    "bcryptjs":       "criptografia de senhas",
    "cors":           "política de origens cruzadas",
    "dotenv":         "variáveis de ambiente",
    "express":        "servidor HTTP",
    "jsonwebtoken":   "autenticação JWT"
  },
  "devDependencies": {
    "nodemon": "reinício automático em dev",
    "prisma":  "migrations e geração do client"
  }
}
```

### `frontend/package.json`
```json
{
  "dependencies": {
    "axios":            "requisições HTTP",
    "react":            "biblioteca de UI",
    "react-dom":        "renderização no navegador",
    "react-router-dom": "navegação entre páginas",
    "recharts":         "gráficos"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "suporte a JSX no Vite",
    "vite":                 "servidor de dev e build"
  }
}
```
