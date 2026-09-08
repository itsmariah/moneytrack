// Versão em SQL puro do backfill, pra não depender do Prisma Client (que já reflete o
// schema mais novo, com colunas que ainda não existem no banco de produção nesse ponto
// intermediário da migração). Faz exatamente a mesma coisa que backfillContaPrincipal.js:
// cria uma "Conta principal" pra todo usuário sem nenhuma conta, e associa as
// transações órfãs (contaId null) a ela.
// Uso: DATABASE_URL="$PROD_DATABASE_URL" node scripts/backfillContaPrincipalRaw.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const semConta = await prisma.$queryRawUnsafe(`
    SELECT u.id AS "usuarioId"
    FROM "Usuario" u
    LEFT JOIN "Conta" c ON c."usuarioId" = u.id
    WHERE c.id IS NULL
  `);

  console.log(`Usuários sem nenhuma conta: ${semConta.length}`);

  for (const { usuarioId } of semConta) {
    const [conta] = await prisma.$queryRawUnsafe(
      `INSERT INTO "Conta" ("usuarioId", "nome", "tipo", "saldoInicial", "createdAt")
       VALUES (${usuarioId}, 'Conta principal', 'corrente', 0, NOW())
       RETURNING id`
    );
    const result = await prisma.$executeRawUnsafe(
      `UPDATE "Transacao" SET "contaId" = ${conta.id} WHERE "usuarioId" = ${usuarioId} AND "contaId" IS NULL`
    );
    console.log(`  usuário ${usuarioId}: conta ${conta.id} criada, ${result} transação(ões) associada(s)`);
  }

  const [{ total: restantes }] = await prisma.$queryRawUnsafe(
    `SELECT COUNT(*)::int AS total FROM "Transacao" WHERE "contaId" IS NULL`
  );
  console.log(`Transações ainda sem conta: ${restantes}`);
}

main()
  .catch(err => { console.error(err); process.exit(1); })
  .finally(() => prisma.$disconnect());
