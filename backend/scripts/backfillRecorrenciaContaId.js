// Rodar uma vez, entre a migração que adiciona Recorrencia.contaId (opcional) e a
// migração seguinte que torna a coluna obrigatória: associa toda recorrência antiga à
// primeira conta do seu usuário (backfillContaPrincipal.js já garante que toda conta
// tem pelo menos uma conta nesse ponto).
// Uso: node scripts/backfillRecorrenciaContaId.js
const prisma = require('../database/db');

async function main() {
  const recorrencias = await prisma.recorrencia.findMany({ where: { contaId: null }, select: { id: true, usuarioId: true } });
  console.log(`Recorrências sem conta: ${recorrencias.length}`);

  for (const r of recorrencias) {
    const conta = await prisma.conta.findFirst({ where: { usuarioId: r.usuarioId }, orderBy: { createdAt: 'asc' } });
    await prisma.recorrencia.update({ where: { id: r.id }, data: { contaId: conta.id } });
    console.log(`  recorrência ${r.id} -> conta ${conta.id}`);
  }

  const restantes = await prisma.recorrencia.count({ where: { contaId: null } });
  console.log(`Recorrências ainda sem conta: ${restantes}`);
}

main()
  .catch(err => { console.error(err); process.exit(1); })
  .finally(() => prisma.$disconnect());
