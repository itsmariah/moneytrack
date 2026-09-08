// Cria uma "família pessoal" pra cada Usuario que ainda não tem uma (familiaId null) e
// propaga esse familiaId pra todas as linhas existentes desse usuário nas 8 tabelas
// financeiras. Idempotente: seguro rodar de novo se for interrompido no meio — cada
// updateMany só afeta linhas com familiaId ainda null, e o Usuario só recebe familiaId
// por último (depois de todos os filhos migrados), então uma falha no meio nunca deixa
// um usuário "pulado" numa próxima rodada.
const prisma = require('../database/db');
const { gerarCodigoUnico } = require('../utils/gerarCodigoFamilia');

async function migrarUsuario(usuario) {
  const codigo = await gerarCodigoUnico();
  const familia = await prisma.familia.create({
    data: { nome: `Família de ${usuario.nome}`, codigo },
  });

  const [categorias, transacoes, contas, conexoes, transferencias, recorrencias, metas, orcamentos] = await Promise.all([
    prisma.categoria.updateMany({ where: { usuarioId: usuario.id, familiaId: null }, data: { familiaId: familia.id } }),
    prisma.transacao.updateMany({ where: { usuarioId: usuario.id, familiaId: null }, data: { familiaId: familia.id } }),
    prisma.conta.updateMany({ where: { usuarioId: usuario.id, familiaId: null }, data: { familiaId: familia.id } }),
    prisma.conexaoBancaria.updateMany({ where: { usuarioId: usuario.id, familiaId: null }, data: { familiaId: familia.id } }),
    prisma.transferencia.updateMany({ where: { usuarioId: usuario.id, familiaId: null }, data: { familiaId: familia.id } }),
    prisma.recorrencia.updateMany({ where: { usuarioId: usuario.id, familiaId: null }, data: { familiaId: familia.id } }),
    prisma.meta.updateMany({ where: { usuarioId: usuario.id, familiaId: null }, data: { familiaId: familia.id } }),
    prisma.orcamento.updateMany({ where: { usuarioId: usuario.id, familiaId: null }, data: { familiaId: familia.id } }),
  ]);

  // Só marca o usuário como migrado depois que todos os filhos já foram — se o processo
  // cair antes disso, o usuário continua "sem família" e é reprocessado na próxima rodada.
  await prisma.usuario.update({ where: { id: usuario.id }, data: { familiaId: familia.id } });

  console.log(
    `Usuário ${usuario.id} (${usuario.email}) -> família ${familia.id} (código ${codigo}): ` +
    `${categorias.count} categorias, ${transacoes.count} transações, ${contas.count} contas, ` +
    `${conexoes.count} conexões bancárias, ${transferencias.count} transferências, ` +
    `${recorrencias.count} recorrências, ${metas.count} metas, ${orcamentos.count} orçamentos`
  );
}

async function main() {
  const usuarios = await prisma.usuario.findMany({ where: { familiaId: null } });
  console.log(`Usuários sem família: ${usuarios.length}`);

  for (const usuario of usuarios) {
    await migrarUsuario(usuario);
  }

  console.log('Backfill concluído.');
}

main()
  .catch(err => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => process.exit());
