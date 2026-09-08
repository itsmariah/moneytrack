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

const rawRecorrencia = (overrides = {}) => ({
  id: 1,
  usuarioId: 7,
  tipo: 'despesa',
  valor: new Prisma.Decimal('1200.00'),
  categoria: 'Moradia',
  descricao: 'Aluguel',
  diaDoMes: 5,
  dataInicio: '2026-08-01',
  dataFim: null,
  ativa: true,
  createdAt: new Date(),
  contaId: 1,
  ...overrides,
});

beforeEach(() => {
  // authMiddleware confere tokenVersion e resolve a família a cada requisição autenticada.
  vi.spyOn(prisma.usuario, 'findUnique').mockResolvedValue({ tokenVersion: 0, familiaId: 1, papelFamilia: 'dono' });
  // contaPertenceAFamilia: por padrão a conta 1 existe e é da família 1.
  vi.spyOn(prisma.conta, 'findFirst').mockResolvedValue({ id: 1, familiaId: 1 });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('GET /api/recorrencias', () => {
  it('retorna 401 sem token', async () => {
    const res = await request(app).get('/api/recorrencias');
    expect(res.status).toBe(401);
  });

  it('chama o ensureOccurrences (consulta recorrências ativas) antes de listar', async () => {
    // dataInicio no futuro faz expectedOccurrenceDates retornar vazio, então o
    // ensureOccurrences não chega a consultar/criar Transacao — só confere que ele roda.
    const recSpy = vi.spyOn(prisma.recorrencia, 'findMany').mockResolvedValue([rawRecorrencia({ dataInicio: '2099-01-01' })]);
    const txFindManySpy = vi.spyOn(prisma.transacao, 'findMany');

    const res = await request(app).get('/api/recorrencias').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(recSpy).toHaveBeenCalledTimes(2); // ensureOccurrences + listagem da rota
    expect(txFindManySpy).not.toHaveBeenCalled();
    expect(res.body[0]).toMatchObject({ categoria: 'Moradia', valor: 1200 });
  });

  it('escopa a busca por familiaId do token', async () => {
    const findSpy = vi.spyOn(prisma.recorrencia, 'findMany').mockResolvedValue([]);
    await request(app).get('/api/recorrencias?usuarioId=999').set('Authorization', `Bearer ${token}`);
    // Primeira chamada é do ensureOccurrences (familiaId, ativa: true); confere ali.
    expect(findSpy.mock.calls[0][0].where.familiaId).toBe(1);
  });
});

describe('POST /api/recorrencias', () => {
  it('cria a recorrência com o usuarioId do token, mesmo que o body tente outro', async () => {
    vi.spyOn(prisma.recorrencia, 'findMany').mockResolvedValue([]); // ensureOccurrences pós-criação
    const createSpy = vi.spyOn(prisma.recorrencia, 'create').mockResolvedValue(rawRecorrencia());

    const res = await request(app)
      .post('/api/recorrencias')
      .set('Authorization', `Bearer ${token}`)
      .send({ usuarioId: 999, tipo: 'despesa', valor: 1200, categoria: 'Moradia', diaDoMes: 5, dataInicio: '2026-08-01', contaId: 1 });

    expect(res.status).toBe(201);
    expect(createSpy.mock.calls[0][0].data.usuarioId).toBe(7);
  });

  it('rejeita corpo inválido (400) e não chama o Prisma', async () => {
    const createSpy = vi.spyOn(prisma.recorrencia, 'create');

    const res = await request(app)
      .post('/api/recorrencias')
      .set('Authorization', `Bearer ${token}`)
      .send({ tipo: 'despesa', valor: 1200, categoria: 'Moradia', diaDoMes: 40, dataInicio: '2026-08-01' });

    expect(res.status).toBe(400);
    expect(createSpy).not.toHaveBeenCalled();
  });
});

describe('PUT /api/recorrencias/:id', () => {
  it('retorna 404 quando a recorrência não é do usuário (proteção contra IDOR)', async () => {
    vi.spyOn(prisma.recorrencia, 'findFirst').mockResolvedValue(null);
    const updateSpy = vi.spyOn(prisma.recorrencia, 'update');

    const res = await request(app)
      .put('/api/recorrencias/123')
      .set('Authorization', `Bearer ${token}`)
      .send({ tipo: 'despesa', valor: 1200, categoria: 'Moradia', diaDoMes: 5 });

    expect(res.status).toBe(404);
    expect(updateSpy).not.toHaveBeenCalled();
  });

  it('atualiza sem permitir mudar dataInicio, e materializa de novo se ainda ativa', async () => {
    const existing = rawRecorrencia();
    vi.spyOn(prisma.recorrencia, 'findFirst').mockResolvedValue(existing);
    vi.spyOn(prisma.recorrencia, 'update').mockResolvedValue(rawRecorrencia({ valorLimite: undefined, valor: new Prisma.Decimal('1300.00'), ativa: true }));
    const findManySpy = vi.spyOn(prisma.recorrencia, 'findMany').mockResolvedValue([]); // ensureOccurrences

    const res = await request(app)
      .put('/api/recorrencias/1')
      .set('Authorization', `Bearer ${token}`)
      .send({ tipo: 'despesa', valor: 1300, categoria: 'Moradia', diaDoMes: 5, dataInicio: '1999-01-01', contaId: 1 });

    expect(res.status).toBe(200);
    expect(res.body.valor).toBe(1300);
    const updateData = prisma.recorrencia.update.mock.calls[0][0].data;
    expect(updateData.dataInicio).toBeUndefined(); // dataInicio nunca é alterada
    expect(findManySpy).toHaveBeenCalled();
  });

  it('não materializa de novo quando a recorrência é pausada (ativa: false)', async () => {
    vi.spyOn(prisma.recorrencia, 'findFirst').mockResolvedValue(rawRecorrencia());
    vi.spyOn(prisma.recorrencia, 'update').mockResolvedValue(rawRecorrencia({ ativa: false }));
    const findManySpy = vi.spyOn(prisma.recorrencia, 'findMany');

    const res = await request(app)
      .put('/api/recorrencias/1')
      .set('Authorization', `Bearer ${token}`)
      .send({ tipo: 'despesa', valor: 1200, categoria: 'Moradia', diaDoMes: 5, ativa: false, contaId: 1 });

    expect(res.status).toBe(200);
    expect(res.body.ativa).toBe(false);
    expect(findManySpy).not.toHaveBeenCalled();
  });
});

describe('DELETE /api/recorrencias/:id', () => {
  it('retorna 404 quando a recorrência não é do usuário', async () => {
    vi.spyOn(prisma.recorrencia, 'findFirst').mockResolvedValue(null);
    const res = await request(app).delete('/api/recorrencias/999').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });

  it('exclui e retorna 204 quando a recorrência é do usuário', async () => {
    vi.spyOn(prisma.recorrencia, 'findFirst').mockResolvedValue(rawRecorrencia());
    const deleteSpy = vi.spyOn(prisma.recorrencia, 'delete').mockResolvedValue({});

    const res = await request(app).delete('/api/recorrencias/1').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(204);
    expect(deleteSpy).toHaveBeenCalledWith({ where: { id: 1 } });
  });
});
