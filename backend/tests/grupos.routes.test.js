import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { Prisma } from '@prisma/client';
import { createTestApp } from './testApp.js';
import { makeToken } from './makeToken.js';

// Ver comentário em auth.routes.test.js: usamos vi.spyOn no singleton real do
// Prisma em vez de vi.mock, porque vi.mock não intercepta require() dentro de
// arquivos CJS neste projeto.
const prisma = require('../database/db');
const app = createTestApp();
const token = makeToken(7);

const rawGrupo = (overrides = {}) => ({
  id: 1,
  nome: 'Viagem Nordeste',
  codigo: 'AB3F92',
  criadorUsuarioId: 7,
  createdAt: new Date(),
  membros: [],
  ...overrides,
});

const rawMembro = (overrides = {}) => ({
  id: 1,
  grupoId: 1,
  usuarioId: 7,
  usuario: { id: 7, nome: 'Mariah', email: 'mariah@example.com', foto: null },
  nomeConvidado: null,
  papel: 'admin',
  createdAt: new Date(),
  ...overrides,
});

beforeEach(() => {
  vi.spyOn(prisma.usuario, 'findUnique').mockResolvedValue({ tokenVersion: 0, familiaId: 1, papelFamilia: 'dono' });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('GET /api/grupos', () => {
  it('retorna 401 sem token', async () => {
    const res = await request(app).get('/api/grupos');
    expect(res.status).toBe(401);
  });

  it('escopa por usuarioId via grupoMembro, nunca por familiaId', async () => {
    const findSpy = vi.spyOn(prisma.grupoMembro, 'findMany').mockResolvedValue([
      { papel: 'admin', grupo: { ...rawGrupo(), _count: { membros: 1 } } },
    ]);
    const res = await request(app).get('/api/grupos').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(findSpy.mock.calls[0][0].where).toEqual({ usuarioId: 7 });
    expect(findSpy.mock.calls[0][0].where).not.toHaveProperty('familiaId');
    expect(res.body[0]).toMatchObject({ nome: 'Viagem Nordeste', papel: 'admin', totalMembros: 1 });
  });
});

describe('GET /api/grupos/:id', () => {
  it('retorna 404 quando o usuário não é membro do grupo (proteção contra IDOR)', async () => {
    vi.spyOn(prisma.grupoMembro, 'findFirst').mockResolvedValue(null);
    const res = await request(app).get('/api/grupos/1').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });

  it('retorna membros, despesas e saldos calculados quando o usuário é membro', async () => {
    vi.spyOn(prisma.grupoMembro, 'findFirst').mockResolvedValue(rawMembro());
    vi.spyOn(prisma.grupo, 'findUnique').mockResolvedValue({
      ...rawGrupo(),
      membros: [rawMembro({ id: 1, usuarioId: 7 }), rawMembro({ id: 2, usuarioId: 8, papel: 'membro', usuario: { id: 8, nome: 'Bruno', email: 'b@x.com', foto: null } })],
      despesas: [{
        id: 1, grupoId: 1, descricao: 'Jantar', valorTotal: new Prisma.Decimal('90.00'), data: '2026-08-10', pagoPorMembroId: 1, criadoPorUsuarioId: 7, createdAt: new Date(),
        divisoes: [{ membroId: 1, valorDevido: new Prisma.Decimal('45.00') }, { membroId: 2, valorDevido: new Prisma.Decimal('45.00') }],
      }],
    });

    const res = await request(app).get('/api/grupos/1').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.membros).toHaveLength(2);
    expect(res.body.despesas[0].valorTotal).toBe(90);
    expect(res.body.saldos).toEqual([{ deMembroId: 2, paraMembroId: 1, valor: 45 }]);
  });
});

describe('POST /api/grupos', () => {
  it('cria o grupo e o membro admin do criador numa escrita só', async () => {
    const createSpy = vi.spyOn(prisma.grupo, 'create').mockResolvedValue({ ...rawGrupo(), membros: [rawMembro()] });

    const res = await request(app)
      .post('/api/grupos')
      .set('Authorization', `Bearer ${token}`)
      .send({ nome: 'Viagem Nordeste' });

    expect(res.status).toBe(201);
    expect(createSpy.mock.calls[0][0].data.criadorUsuarioId).toBe(7);
    expect(createSpy.mock.calls[0][0].data.membros.create).toEqual({ usuarioId: 7, papel: 'admin' });
    expect(res.body.papel).toBe('admin');
  });

  it('rejeita nome inválido (400) e não chama o Prisma', async () => {
    const createSpy = vi.spyOn(prisma.grupo, 'create');
    const res = await request(app).post('/api/grupos').set('Authorization', `Bearer ${token}`).send({ nome: '' });
    expect(res.status).toBe(400);
    expect(createSpy).not.toHaveBeenCalled();
  });
});

describe('POST /api/grupos/entrar', () => {
  it('retorna 404 pra código inexistente', async () => {
    vi.spyOn(prisma.grupo, 'findUnique').mockResolvedValue(null);
    const res = await request(app).post('/api/grupos/entrar').set('Authorization', `Bearer ${token}`).send({ codigo: 'ZZZZZZ' });
    expect(res.status).toBe(404);
  });

  it('retorna 400 se já é membro', async () => {
    vi.spyOn(prisma.grupo, 'findUnique').mockResolvedValue(rawGrupo());
    vi.spyOn(prisma.grupoMembro, 'findFirst').mockResolvedValue(rawMembro());
    const createSpy = vi.spyOn(prisma.grupoMembro, 'create');

    const res = await request(app).post('/api/grupos/entrar').set('Authorization', `Bearer ${token}`).send({ codigo: 'ab3f92' });

    expect(res.status).toBe(400);
    expect(createSpy).not.toHaveBeenCalled();
  });

  it('entra no grupo como "membro" e nunca mexe em Usuario (diferente de familia.js)', async () => {
    vi.spyOn(prisma.grupo, 'findUnique').mockResolvedValueOnce(rawGrupo()).mockResolvedValueOnce({ ...rawGrupo(), membros: [rawMembro({ id: 2, papel: 'membro' })] });
    vi.spyOn(prisma.grupoMembro, 'findFirst').mockResolvedValue(null);
    const createSpy = vi.spyOn(prisma.grupoMembro, 'create').mockResolvedValue(rawMembro({ id: 2, papel: 'membro' }));
    const usuarioUpdateSpy = vi.spyOn(prisma.usuario, 'update');

    const res = await request(app).post('/api/grupos/entrar').set('Authorization', `Bearer ${token}`).send({ codigo: 'ab3f92' });

    expect(res.status).toBe(201);
    expect(createSpy.mock.calls[0][0].data).toEqual({ grupoId: 1, usuarioId: 7, papel: 'membro' });
    expect(usuarioUpdateSpy).not.toHaveBeenCalled();
  });
});

describe('POST /api/grupos/:id/convidados', () => {
  it('retorna 404 se não é membro do grupo', async () => {
    vi.spyOn(prisma.grupoMembro, 'findFirst').mockResolvedValue(null);
    const res = await request(app).post('/api/grupos/1/convidados').set('Authorization', `Bearer ${token}`).send({ nomeConvidado: 'Carlos' });
    expect(res.status).toBe(404);
  });

  it('qualquer membro (não só admin) pode adicionar um convidado', async () => {
    vi.spyOn(prisma.grupoMembro, 'findFirst').mockResolvedValue(rawMembro({ papel: 'membro' }));
    const createSpy = vi.spyOn(prisma.grupoMembro, 'create').mockResolvedValue(rawMembro({ id: 3, usuarioId: null, usuario: null, nomeConvidado: 'Carlos', papel: 'membro' }));

    const res = await request(app).post('/api/grupos/1/convidados').set('Authorization', `Bearer ${token}`).send({ nomeConvidado: 'Carlos' });

    expect(res.status).toBe(201);
    expect(createSpy.mock.calls[0][0].data).toEqual({ grupoId: 1, nomeConvidado: 'Carlos', papel: 'membro' });
    expect(res.body.isConvidado).toBe(true);
  });
});

describe('POST /api/grupos/:id/sair', () => {
  it('bloqueia sair sendo o único membro', async () => {
    vi.spyOn(prisma.grupoMembro, 'findFirst').mockResolvedValue(rawMembro());
    vi.spyOn(prisma.grupoMembro, 'count').mockResolvedValue(1);
    const deleteSpy = vi.spyOn(prisma.grupoMembro, 'delete');

    const res = await request(app).post('/api/grupos/1/sair').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(400);
    expect(deleteSpy).not.toHaveBeenCalled();
  });

  it('promove o próximo membro mais antigo a admin ao sair sendo o único admin', async () => {
    vi.spyOn(prisma.grupoMembro, 'findFirst')
      .mockResolvedValueOnce(rawMembro({ id: 1, papel: 'admin' })) // getMembroAtual
      .mockResolvedValueOnce(rawMembro({ id: 2, usuarioId: 8, papel: 'membro' })); // próximo admin
    vi.spyOn(prisma.grupoMembro, 'count')
      .mockResolvedValueOnce(2) // totalMembros
      .mockResolvedValueOnce(0); // outrosAdmins
    vi.spyOn(prisma.despesaGrupo, 'findFirst').mockResolvedValue(null);
    const updateSpy = vi.spyOn(prisma.grupoMembro, 'update').mockResolvedValue({});
    vi.spyOn(prisma.grupoMembro, 'delete').mockResolvedValue({});

    const res = await request(app).post('/api/grupos/1/sair').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(204);
    expect(updateSpy).toHaveBeenCalledWith({ where: { id: 2 }, data: { papel: 'admin' } });
  });
});

describe('DELETE /api/grupos/:id/membros/:membroId', () => {
  it('retorna 403 quando quem chama não é admin', async () => {
    vi.spyOn(prisma.grupoMembro, 'findFirst').mockResolvedValue(rawMembro({ papel: 'membro' }));
    const res = await request(app).delete('/api/grupos/1/membros/2').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  it('retorna 400 amigável quando o membro tem despesas (checagem prévia)', async () => {
    vi.spyOn(prisma.grupoMembro, 'findFirst')
      .mockResolvedValueOnce(rawMembro({ papel: 'admin' })) // getMembroAtual
      .mockResolvedValueOnce(rawMembro({ id: 2, usuarioId: 8 })); // alvo
    vi.spyOn(prisma.despesaGrupo, 'findFirst').mockResolvedValue({ id: 5 });
    const deleteSpy = vi.spyOn(prisma.grupoMembro, 'delete');

    const res = await request(app).delete('/api/grupos/1/membros/2').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/despesas registradas/);
    expect(deleteSpy).not.toHaveBeenCalled();
  });

  it('retorna 400 amigável (não 500) quando o delete esbarra na constraint do Postgres (corrida)', async () => {
    vi.spyOn(prisma.grupoMembro, 'findFirst')
      .mockResolvedValueOnce(rawMembro({ papel: 'admin' }))
      .mockResolvedValueOnce(rawMembro({ id: 2, usuarioId: 8 }));
    vi.spyOn(prisma.despesaGrupo, 'findFirst').mockResolvedValue(null);
    vi.spyOn(prisma.grupoMembro, 'delete').mockRejectedValue(Object.assign(new Error('FK violation'), { code: 'P2003' }));

    const res = await request(app).delete('/api/grupos/1/membros/2').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/despesas registradas/);
  });

  it('remove o membro quando não tem despesas', async () => {
    vi.spyOn(prisma.grupoMembro, 'findFirst')
      .mockResolvedValueOnce(rawMembro({ papel: 'admin' }))
      .mockResolvedValueOnce(rawMembro({ id: 2, usuarioId: 8 }));
    vi.spyOn(prisma.despesaGrupo, 'findFirst').mockResolvedValue(null);
    const deleteSpy = vi.spyOn(prisma.grupoMembro, 'delete').mockResolvedValue({});

    const res = await request(app).delete('/api/grupos/1/membros/2').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(204);
    expect(deleteSpy).toHaveBeenCalledWith({ where: { id: 2 } });
  });
});

describe('DELETE /api/grupos/:id', () => {
  it('retorna 403 quando quem chama não é admin', async () => {
    vi.spyOn(prisma.grupoMembro, 'findFirst').mockResolvedValue(rawMembro({ papel: 'membro' }));
    const res = await request(app).delete('/api/grupos/1').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  it('exclui o grupo quando quem chama é admin', async () => {
    vi.spyOn(prisma.grupoMembro, 'findFirst').mockResolvedValue(rawMembro({ papel: 'admin' }));
    vi.spyOn(prisma.despesaGrupo, 'deleteMany').mockResolvedValue({ count: 0 });
    const deleteSpy = vi.spyOn(prisma.grupo, 'delete').mockResolvedValue({});
    vi.spyOn(prisma, '$transaction').mockImplementation((arr) => Promise.all(arr));

    const res = await request(app).delete('/api/grupos/1').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(204);
    expect(deleteSpy).toHaveBeenCalledWith({ where: { id: 1 } });
  });

  // Regressão: excluir um grupo que tem despesa dava 500 (erro de FK do Postgres) porque
  // GrupoMembro (onDelete: Cascade a partir de Grupo) podia cascatear antes de as despesas
  // que apontam pra ele (Restrict) serem apagadas. A correção apaga as despesas primeiro,
  // numa transação com a exclusão do grupo.
  it('apaga as despesas do grupo antes do grupo, na mesma transação (evita a corrida Cascade/Restrict)', async () => {
    vi.spyOn(prisma.grupoMembro, 'findFirst').mockResolvedValue(rawMembro({ papel: 'admin' }));
    const deleteManySpy = vi.spyOn(prisma.despesaGrupo, 'deleteMany').mockResolvedValue({ count: 2 });
    const deleteGrupoSpy = vi.spyOn(prisma.grupo, 'delete').mockResolvedValue({});
    const transactionSpy = vi.spyOn(prisma, '$transaction').mockImplementation((arr) => Promise.all(arr));

    const res = await request(app).delete('/api/grupos/1').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(204);
    expect(transactionSpy).toHaveBeenCalled();
    expect(deleteManySpy).toHaveBeenCalledWith({ where: { grupoId: 1 } });
    expect(deleteGrupoSpy).toHaveBeenCalledWith({ where: { id: 1 } });
  });
});

describe('POST /api/grupos/:id/despesas', () => {
  it('rejeita pagador que não é membro do grupo (400, proteção contra IDOR)', async () => {
    vi.spyOn(prisma.grupoMembro, 'findFirst').mockResolvedValue(rawMembro());
    vi.spyOn(prisma.grupoMembro, 'findMany').mockResolvedValue([{ id: 1 }, { id: 2 }]);
    const createSpy = vi.spyOn(prisma.despesaGrupo, 'create');

    const res = await request(app)
      .post('/api/grupos/1/despesas')
      .set('Authorization', `Bearer ${token}`)
      .send({ descricao: 'Jantar', valorTotal: 90, data: '2026-08-10', pagoPorMembroId: 999, participanteIds: [1, 2] });

    expect(res.status).toBe(400);
    expect(createSpy).not.toHaveBeenCalled();
  });

  it('cria a despesa dividindo igualmente entre os participantes, somando exatamente o valor total', async () => {
    vi.spyOn(prisma.grupoMembro, 'findFirst').mockResolvedValue(rawMembro());
    vi.spyOn(prisma.grupoMembro, 'findMany').mockResolvedValue([{ id: 1 }, { id: 2 }, { id: 3 }]);
    const createSpy = vi.spyOn(prisma.despesaGrupo, 'create').mockResolvedValue({
      id: 1, grupoId: 1, descricao: 'Jantar', valorTotal: new Prisma.Decimal('100.00'), data: '2026-08-10', pagoPorMembroId: 1, criadoPorUsuarioId: 7, createdAt: new Date(),
      divisoes: [{ membroId: 1, valorDevido: new Prisma.Decimal('33.34') }, { membroId: 2, valorDevido: new Prisma.Decimal('33.33') }, { membroId: 3, valorDevido: new Prisma.Decimal('33.33') }],
    });

    const res = await request(app)
      .post('/api/grupos/1/despesas')
      .set('Authorization', `Bearer ${token}`)
      .send({ descricao: 'Jantar', valorTotal: 100, data: '2026-08-10', pagoPorMembroId: 1, participanteIds: [1, 2, 3] });

    expect(res.status).toBe(201);
    const divisoesEnviadas = createSpy.mock.calls[0][0].data.divisoes.create;
    const somaCentavos = divisoesEnviadas.reduce((acc, d) => acc + Math.round(d.valorDevido * 100), 0);
    expect(somaCentavos).toBe(10000);
    expect(divisoesEnviadas[0].valorDevido).toBe(33.34);
  });
});

describe('PUT /api/grupos/:id/despesas/:despesaId', () => {
  const membrosDoGrupo = [{ id: 1 }, { id: 2 }];
  const despesaExistente = { id: 5, grupoId: 1, descricao: 'Jantar', valorTotal: new Prisma.Decimal('90.00'), data: '2026-08-10', pagoPorMembroId: 1, criadoPorUsuarioId: 8 };

  it('retorna 403 quando quem chama não é o criador nem admin', async () => {
    vi.spyOn(prisma.grupoMembro, 'findFirst').mockResolvedValue(rawMembro({ papel: 'membro', usuarioId: 7 }));
    vi.spyOn(prisma.despesaGrupo, 'findFirst').mockResolvedValue(despesaExistente);
    const updateSpy = vi.spyOn(prisma.despesaGrupo, 'update');

    const res = await request(app)
      .put('/api/grupos/1/despesas/5')
      .set('Authorization', `Bearer ${token}`)
      .send({ descricao: 'Jantar', valorTotal: 90, data: '2026-08-10', pagoPorMembroId: 1, participanteIds: [1, 2] });

    expect(res.status).toBe(403);
    expect(updateSpy).not.toHaveBeenCalled();
  });

  it('permite edição por um admin mesmo não sendo o criador', async () => {
    vi.spyOn(prisma.grupoMembro, 'findFirst').mockResolvedValue(rawMembro({ papel: 'admin', usuarioId: 7 }));
    vi.spyOn(prisma.despesaGrupo, 'findFirst').mockResolvedValue(despesaExistente);
    vi.spyOn(prisma.grupoMembro, 'findMany').mockResolvedValue(membrosDoGrupo);
    const updateSpy = vi.spyOn(prisma.despesaGrupo, 'update').mockResolvedValue({
      ...despesaExistente, divisoes: [{ membroId: 1, valorDevido: new Prisma.Decimal('45.00') }, { membroId: 2, valorDevido: new Prisma.Decimal('45.00') }],
    });

    const res = await request(app)
      .put('/api/grupos/1/despesas/5')
      .set('Authorization', `Bearer ${token}`)
      .send({ descricao: 'Jantar', valorTotal: 90, data: '2026-08-10', pagoPorMembroId: 1, participanteIds: [1, 2] });

    expect(res.status).toBe(200);
    expect(updateSpy.mock.calls[0][0].data.divisoes.deleteMany).toEqual({});
  });
});

describe('DELETE /api/grupos/:id/despesas/:despesaId', () => {
  it('permite exclusão por quem criou a despesa mesmo não sendo admin', async () => {
    vi.spyOn(prisma.grupoMembro, 'findFirst').mockResolvedValue(rawMembro({ papel: 'membro', usuarioId: 7 }));
    vi.spyOn(prisma.despesaGrupo, 'findFirst').mockResolvedValue({ id: 5, grupoId: 1, criadoPorUsuarioId: 7 });
    const deleteSpy = vi.spyOn(prisma.despesaGrupo, 'delete').mockResolvedValue({});

    const res = await request(app).delete('/api/grupos/1/despesas/5').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(204);
    expect(deleteSpy).toHaveBeenCalledWith({ where: { id: 5 } });
  });

  it('retorna 403 pra quem não criou e não é admin', async () => {
    vi.spyOn(prisma.grupoMembro, 'findFirst').mockResolvedValue(rawMembro({ papel: 'membro', usuarioId: 7 }));
    vi.spyOn(prisma.despesaGrupo, 'findFirst').mockResolvedValue({ id: 5, grupoId: 1, criadoPorUsuarioId: 8 });
    const deleteSpy = vi.spyOn(prisma.despesaGrupo, 'delete');

    const res = await request(app).delete('/api/grupos/1/despesas/5').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(403);
    expect(deleteSpy).not.toHaveBeenCalled();
  });
});
