// Corrige só o metadado de nome da migração no histórico (_prisma_migrations) — o
// arquivo migration.sql em si nunca mudou, então isso é seguro em qualquer banco onde
// já foi aplicada. Necessário porque a pasta "20260905190918_add_open_finance" tinha
// um timestamp fora de ordem (erro de digitação), corrigido para "20260905200000_...".
// Uso: DATABASE_URL="..." node scripts/renameMigrationRecord.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const NOME_ANTIGO = '20260905190918_add_open_finance';
const NOME_NOVO = '20260905200000_add_open_finance';

async function main() {
  const result = await prisma.$executeRawUnsafe(
    `UPDATE "_prisma_migrations" SET migration_name = $1 WHERE migration_name = $2`,
    NOME_NOVO,
    NOME_ANTIGO
  );
  console.log(`Linhas atualizadas: ${result}`);
}

main()
  .catch(err => { console.error(err); process.exit(1); })
  .finally(() => prisma.$disconnect());
