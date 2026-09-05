// Rodar uma vez, entre a migração que adiciona Conta/Transacao.contaId (opcional) e a
// migração seguinte que torna contaId obrigatório: cria uma "Conta principal" pra todo
// usuário que ainda não tem nenhuma conta (mesmo os sem transação nenhuma, que também
// precisam de uma conta pra conseguir lançar a primeira), e associa as transações
// órfãs (contaId null) a ela.
// Uso: node scripts/backfillContaPrincipal.js
const prisma = require('../database/db');

async function main() {
  const usuarios = await prisma.usuario.findMany({
    select: { id: true, contas: { select: { id: true }, take: 1 } },
  });
  const semConta = usuarios.filter(u => u.contas.length === 0);

  console.log(`Usuários sem nenhuma conta: ${semConta.length} de ${usuarios.length}`);

  for (const { id: usuarioId } of semConta) {
    const conta = await prisma.conta.create({
      data: { usuarioId, nome: 'Conta principal', tipo: 'corrente', saldoInicial: 0 },
    });
    const { count } = await prisma.transacao.updateMany({
      where: { usuarioId, contaId: null },
      data: { contaId: conta.id },
    });
    console.log(`  usuário ${usuarioId}: conta ${conta.id} criada, ${count} transação(ões) associada(s)`);
  }

  const restantes = await prisma.transacao.count({ where: { contaId: null } });
  console.log(`Transações ainda sem conta: ${restantes}`);
}

main()
  .catch(err => { console.error(err); process.exit(1); })
  .finally(() => prisma.$disconnect());
