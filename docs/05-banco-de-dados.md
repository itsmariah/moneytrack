# 05 — Banco de Dados (SQLite + Prisma)

## O que é um banco de dados?

Um banco de dados é onde as informações ficam **salvas de forma permanente**. Sem ele, os dados sumiriam toda vez que o servidor fosse reiniciado.

Exemplos de dados que persistimos no MoneyTrack:
- Usuários cadastrados (nome, e-mail, senha)
- Transações financeiras (tipo, valor, categoria, data)

---

## Por que SQLite?

Existem vários bancos de dados disponíveis. Para o MoneyTrack escolhemos o **SQLite** pelos seguintes motivos:

| Motivo | Explicação |
|--------|-----------|
| **Sem servidor** | O SQLite é um arquivo `.db` no disco — não precisa instalar e rodar um servidor separado (como MySQL ou PostgreSQL) |
| **Simplicidade** | Perfeito para projetos acadêmicos e protótipos |
| **Zero configuração** | Funciona logo após o `npm install` |
| **Confiável** | Usado em bilhões de dispositivos (smartphones Android, iOS, etc.) |

---

## O que é o Prisma?

O **Prisma** é um **ORM** (Object-Relational Mapper). Em termos simples: é uma camada que traduz código JavaScript em comandos SQL.

### Sem Prisma (SQL puro):
```js
db.query("SELECT * FROM transacoes WHERE usuario_id = ? AND tipo = ?", [userId, 'despesa'])
```

### Com Prisma:
```js
prisma.transacao.findMany({
  where: { usuarioId: userId, tipo: 'despesa' }
})
```

O Prisma é mais legível, evita erros de digitação em SQL e tem **autocomplete** no editor.

### Por que não usar SQL puro?

Para um projeto simples o SQL puro funcionaria. Mas o Prisma oferece:
- **Type safety**: erros de campo são pegos em tempo de desenvolvimento
- **Migrations**: controle de versão do banco
- **Binários pré-compilados**: não precisa compilar código nativo no Windows (evitamos o problema com `better-sqlite3`)

---

## Arquivo: `prisma/schema.prisma`

Este arquivo define a estrutura do banco — é como o "projeto" das tabelas.

```prisma
datasource db {
  provider = "sqlite"      // Tipo de banco: SQLite
  url      = "file:./dev.db"  // Caminho do arquivo
}

model Usuario {
  id         Int         @id @default(autoincrement())
  nome       String
  email      String      @unique   // Não pode ter dois e-mails iguais
  senha      String
  createdAt  DateTime    @default(now())
  transacoes Transacao[]           // Relacionamento: um usuário tem muitas transações
}

model Transacao {
  id        Int      @id @default(autoincrement())
  usuarioId Int                    // Chave estrangeira
  tipo      String                 // 'receita' ou 'despesa'
  valor     Float
  categoria String
  descricao String   @default("")
  data      String                 // Formato: "YYYY-MM-DD"
  createdAt DateTime @default(now())
  usuario   Usuario  @relation(fields: [usuarioId], references: [id], onDelete: Cascade)
}
```

### Explicação dos tipos:
| Tipo Prisma | Equivalente SQL | Exemplo |
|-------------|-----------------|---------|
| `Int` | INTEGER | 1, 2, 3... |
| `String` | TEXT | "Jefferson" |
| `Float` | REAL | 150.50 |
| `DateTime` | DATETIME | 2026-05-21T10:00:00Z |
| `@id` | PRIMARY KEY | — |
| `@default(autoincrement())` | AUTO_INCREMENT | ID gerado automaticamente |
| `@unique` | UNIQUE | Valor único na tabela |
| `@default(now())` | DEFAULT CURRENT_TIMESTAMP | Data/hora atual |

---

## SQL gerado pelo Prisma

Quando rodamos `prisma migrate dev`, o Prisma traduz o schema para SQL e executa no banco:

```sql
CREATE TABLE "Usuario" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senha" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "Transacao" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "usuarioId" INTEGER NOT NULL,
    "tipo" TEXT NOT NULL,
    "valor" REAL NOT NULL,
    "categoria" TEXT NOT NULL,
    "descricao" TEXT NOT NULL DEFAULT '',
    "data" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Transacao_usuarioId_fkey"
        FOREIGN KEY ("usuarioId")
        REFERENCES "Usuario" ("id")
        ON DELETE CASCADE ON UPDATE CASCADE
);
```

---

## Relacionamento entre tabelas

O relacionamento é **Um para Muitos (1:N)**:
- Um usuário pode ter **várias** transações
- Cada transação pertence a **um** usuário

```
Usuario                    Transacao
┌────┬──────────┐         ┌────┬───────────┬──────────┐
│ id │ nome     │         │ id │ usuarioId │ tipo     │
├────┼──────────┤    1:N  ├────┼───────────┼──────────┤
│  1 │ Jefferson│────────►│  1 │     1     │ receita  │
│  2 │ Mariah   │         │  2 │     1     │ despesa  │
└────┴──────────┘    ┌───►│  3 │     2     │ receita  │
                     │    └────┴───────────┴──────────┘
                     └── Mariah tem a transação 3
```

O campo `usuarioId` na tabela `Transacao` é a **chave estrangeira (FK)** que cria esse vínculo.

### `onDelete: Cascade`

Significa que se um usuário for deletado, **todas as suas transações também são deletadas** automaticamente. Isso evita transações "órfãs" no banco.

---

## Comandos Prisma importantes

```bash
# Criar/aplicar migrations (cria ou atualiza o banco)
npx prisma migrate dev --name nome_da_migration

# Regenerar o cliente Prisma (após mudar o schema)
npx prisma generate

# Visualizar o banco no navegador (interface gráfica)
npx prisma studio

# Ver o estado atual das migrations
npx prisma migrate status
```

### O que é uma migration?

Migration é um arquivo que registra **mudanças no banco de dados ao longo do tempo**. Fica em `prisma/migrations/`. Isso permite que todos da equipe tenham exatamente a mesma estrutura de banco, rodando as mesmas migrations em ordem.

```
prisma/migrations/
└── 20260521161934_init/
    └── migration.sql    ← SQL que criou as tabelas na primeira vez
```

---

## Operações do Prisma nos arquivos de rota

### Criar
```js
await prisma.transacao.create({
  data: { usuarioId, tipo, valor, categoria, descricao, data }
})
```

### Buscar um
```js
await prisma.usuario.findUnique({ where: { email } })
```

### Buscar muitos (com filtro)
```js
await prisma.transacao.findMany({
  where: { usuarioId, tipo: 'despesa' },
  orderBy: { data: 'desc' }
})
```

### Atualizar
```js
await prisma.transacao.update({
  where: { id },
  data: { valor: 200, categoria: 'Saúde' }
})
```

### Deletar
```js
await prisma.transacao.delete({ where: { id } })
```

### Agrupar e somar
```js
await prisma.transacao.groupBy({
  by: ['tipo'],
  where: { usuarioId },
  _sum: { valor: true }
})
// Retorna: [{ tipo: 'receita', _sum: { valor: 3000 } }, ...]
```
