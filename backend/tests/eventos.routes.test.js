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

const rawEvento = (overrides = {}) => ({
  id: 1,
  usuarioId: 7,
  familiaId: 1,
  nome: 'Viagem Rio 2026',
  dataInicio: '2026-01-10',
  dataFim: '2026-01-20',
  orcamento: new Prisma.Decimal('2000.00'),
  status: 'ativo',
  createdAt: new Date(),
  notificacaoEnviada: false,
  ...overrides,
});

beforeEach(() => {
  // authMiddleware confere tokenVersion e resolve a família a cada requisição autenticada.
  vi.spyOn(prisma.usuario, 'findUnique').mockResolvedValue({ tokenVersion: 0, familiaId: 1, papelFamilia: 'dono' });
  vi.spyOn(prisma.transacao, 'groupBy').mockResolvedValue([]);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('GET /api/eventos', () => {
  it('retorna 401 sem token', async () => {
    const res = await request(app).get('/api/eventos');
    expect(res.status).toBe(401);
  });

  it('escopa a busca por familiaId do token', async () => {
    const findSpy = vi.spyOn(prisma.evento, 'findMany').mockResolvedValue([]);
    await request(app).get('/api/eventos').set('Authorization', `Bearer ${token}`);
    expect(findSpy.mock.calls[0][0].where.familiaId).toBe(1);
  });

  it('não consulta transações quando não há eventos', async () => {
    vi.spyOn(prisma.evento, 'findMany').mockResolvedValue([]);
    const groupBySpy = prisma.transacao.groupBy;

    const res = await request(app).get('/api/eventos').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
    expect(groupBySpy).not.toHaveBeenCalled();
  });

  it('agrega gasto e recebido por evento a partir das transações vinculadas', async () => {
    vi.spyOn(prisma.evento, 'findMany').mockResolvedValue([rawEvento()]);
    vi.spyOn(prisma.transacao, 'groupBy').mockResolvedValue([
      { eventoId: 1, tipo: 'despesa', _sum: { valor: new Prisma.Decimal('500.00') } },
      { eventoId: 1, tipo: 'receita', _sum: { valor: new Prisma.Decimal('100.00') } },
    ]);

    const res = await request(app).get('/api/eventos').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body[0]).toMatchObject({ nome: 'Viagem Rio 2026', gasto: 500, recebido: 100, saldo: -400, percentual: 25, estourado: false });
  });
});

describe('GET /api/eventos/:id', () => {
  it('retorna 404 quando o evento não é da família (proteção contra IDOR)', async () => {
    vi.spyOn(prisma.evento, 'findFirst').mockResolvedValue(null);
    const res = await request(app).get('/api/eventos/999').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });

  it('retorna o evento com o progresso calculado', async () => {
    vi.spyOn(prisma.evento, 'findFirst').mockResolvedValue(rawEvento());
    vi.spyOn(prisma.transacao, 'groupBy').mockResolvedValue([
      { eventoId: 1, tipo: 'despesa', _sum: { valor: new Prisma.Decimal('2500.00') } },
    ]);

    const res = await request(app).get('/api/eventos/1').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ gasto: 2500, estourado: true, restante: 0 });
  });
});

describe('POST /api/eventos', () => {
  it('cria o evento com o usuarioId do token, sempre ativo, mesmo que o body tente outro', async () => {
    const createSpy = vi.spyOn(prisma.evento, 'create').mockResolvedValue(rawEvento());

    const res = await request(app)
      .post('/api/eventos')
      .set('Authorization', `Bearer ${token}`)
      .send({ usuarioId: 999, status: 'encerrado', nome: 'Viagem Rio 2026', dataInicio: '2026-01-10', dataFim: '2026-01-20', orcamento: 2000 });

    expect(res.status).toBe(201);
    expect(createSpy.mock.calls[0][0].data.usuarioId).toBe(7);
    expect(createSpy.mock.calls[0][0].data.status).toBe('ativo');
  });

  it('rejeita corpo inválido (400) e não chama o Prisma', async () => {
    const createSpy = vi.spyOn(prisma.evento, 'create');

    const res = await request(app)
      .post('/api/eventos')
      .set('Authorization', `Bearer ${token}`)
      .send({ nome: '', dataInicio: '2026-01-10' });

    expect(res.status).toBe(400);
    expect(createSpy).not.toHaveBeenCalled();
  });

  it('cria evento sem orçamento (teto opcional)', async () => {
    const createSpy = vi.spyOn(prisma.evento, 'create').mockResolvedValue(rawEvento({ orcamento: null }));

    const res = await request(app)
      .post('/api/eventos')
      .set('Authorization', `Bearer ${token}`)
      .send({ nome: 'Viagem Rio 2026', dataInicio: '2026-01-10' });

    expect(res.status).toBe(201);
    expect(createSpy.mock.calls[0][0].data.orcamento).toBeNull();
  });
});

describe('PUT /api/eventos/:id', () => {
  it('retorna 404 quando o evento não é da família (proteção contra IDOR)', async () => {
    vi.spyOn(prisma.evento, 'findFirst').mockResolvedValue(null);
    const updateSpy = vi.spyOn(prisma.evento, 'update');

    const res = await request(app)
      .put('/api/eventos/123')
      .set('Authorization', `Bearer ${token}`)
      .send({ nome: 'Viagem Rio 2026', dataInicio: '2026-01-10' });

    expect(res.status).toBe(404);
    expect(updateSpy).not.toHaveBeenCalled();
  });

  it('atualiza quando o evento pertence à família (200), sem mexer em status', async () => {
    vi.spyOn(prisma.evento, 'findFirst').mockResolvedValue(rawEvento());
    vi.spyOn(prisma.evento, 'update').mockResolvedValue(rawEvento({ orcamento: new Prisma.Decimal('3000.00') }));

    const res = await request(app)
      .put('/api/eventos/1')
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'encerrado', nome: 'Viagem Rio 2026', dataInicio: '2026-01-10', orcamento: 3000 });

    expect(res.status).toBe(200);
    expect(res.body.orcamento).toBe(3000);
    const updateSpy = prisma.evento.update;
    expect(updateSpy.mock.calls[0][0].data).not.toHaveProperty('status');
  });
});

describe('POST /api/eventos/:id/fechar e /reabrir', () => {
  it('fechar retorna 404 quando o evento não é da família', async () => {
    vi.spyOn(prisma.evento, 'findFirst').mockResolvedValue(null);
    const res = await request(app).post('/api/eventos/999/fechar').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });

  it('fechar muda status para encerrado', async () => {
    vi.spyOn(prisma.evento, 'findFirst').mockResolvedValue(rawEvento());
    const updateSpy = vi.spyOn(prisma.evento, 'update').mockResolvedValue(rawEvento({ status: 'encerrado' }));

    const res = await request(app).post('/api/eventos/1/fechar').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('encerrado');
    expect(updateSpy).toHaveBeenCalledWith({ where: { id: 1 }, data: { status: 'encerrado' } });
  });

  it('reabrir muda status para ativo', async () => {
    vi.spyOn(prisma.evento, 'findFirst').mockResolvedValue(rawEvento({ status: 'encerrado' }));
    const updateSpy = vi.spyOn(prisma.evento, 'update').mockResolvedValue(rawEvento({ status: 'ativo' }));

    const res = await request(app).post('/api/eventos/1/reabrir').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ativo');
    expect(updateSpy).toHaveBeenCalledWith({ where: { id: 1 }, data: { status: 'ativo' } });
  });
});

describe('DELETE /api/eventos/:id', () => {
  it('retorna 404 quando o evento não é da família', async () => {
    vi.spyOn(prisma.evento, 'findFirst').mockResolvedValue(null);
    const res = await request(app).delete('/api/eventos/999').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });

  it('exclui e retorna 204 quando o evento é da família', async () => {
    vi.spyOn(prisma.evento, 'findFirst').mockResolvedValue(rawEvento());
    const deleteSpy = vi.spyOn(prisma.evento, 'delete').mockResolvedValue({});

    const res = await request(app).delete('/api/eventos/1').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(204);
    expect(deleteSpy).toHaveBeenCalledWith({ where: { id: 1 } });
  });
});
