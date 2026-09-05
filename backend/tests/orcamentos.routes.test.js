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

const rawOrcamento = (overrides = {}) => ({
  id: 1,
  usuarioId: 7,
  categoria: 'Alimentação',
  valorLimite: new Prisma.Decimal('800.00'),
  createdAt: new Date(),
  ...overrides,
});

beforeEach(() => {
  // authMiddleware confere tokenVersion a cada requisição autenticada.
  vi.spyOn(prisma.usuario, 'findUnique').mockResolvedValue({ tokenVersion: 0 });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('GET /api/orcamentos', () => {
  it('retorna 401 sem token', async () => {
    const res = await request(app).get('/api/orcamentos?month=2026-08');
    expect(res.status).toBe(401);
  });

  it('exige o parâmetro month', async () => {
    const res = await request(app).get('/api/orcamentos').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(400);
  });

  it('retorna lista vazia sem consultar transações quando não há orçamentos', async () => {
    vi.spyOn(prisma.orcamento, 'findMany').mockResolvedValue([]);
    const groupBySpy = vi.spyOn(prisma.transacao, 'groupBy');

    const res = await request(app).get('/api/orcamentos?month=2026-08').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
    expect(groupBySpy).not.toHaveBeenCalled();
  });

  it('calcula o gasto do mês por categoria e o percentual', async () => {
    vi.spyOn(prisma.orcamento, 'findMany').mockResolvedValue([rawOrcamento()]);
    vi.spyOn(prisma.transacao, 'groupBy').mockResolvedValue([
      { categoria: 'Alimentação', _sum: { valor: new Prisma.Decimal('400.00') } },
    ]);

    const res = await request(app).get('/api/orcamentos?month=2026-08').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body[0]).toMatchObject({ categoria: 'Alimentação', valorLimite: 800, gasto: 400, percentual: 50, estourado: false });
  });

  it('escopa a busca por usuarioId do token', async () => {
    const findSpy = vi.spyOn(prisma.orcamento, 'findMany').mockResolvedValue([]);
    await request(app).get('/api/orcamentos?month=2026-08&usuarioId=999').set('Authorization', `Bearer ${token}`);
    expect(findSpy.mock.calls[0][0].where.usuarioId).toBe(7);
  });
});

describe('POST /api/orcamentos', () => {
  it('cria o orçamento com o usuarioId do token, mesmo que o body tente outro', async () => {
    vi.spyOn(prisma.orcamento, 'findFirst').mockResolvedValue(null);
    const createSpy = vi.spyOn(prisma.orcamento, 'create').mockResolvedValue(rawOrcamento());

    const res = await request(app)
      .post('/api/orcamentos')
      .set('Authorization', `Bearer ${token}`)
      .send({ usuarioId: 999, categoria: 'Alimentação', valorLimite: 800 });

    expect(res.status).toBe(201);
    expect(createSpy.mock.calls[0][0].data.usuarioId).toBe(7);
  });

  it('rejeita corpo inválido (400) e não chama o Prisma', async () => {
    const createSpy = vi.spyOn(prisma.orcamento, 'create');

    const res = await request(app)
      .post('/api/orcamentos')
      .set('Authorization', `Bearer ${token}`)
      .send({ categoria: '', valorLimite: 800 });

    expect(res.status).toBe(400);
    expect(createSpy).not.toHaveBeenCalled();
  });

  it('rejeita categoria duplicada para o mesmo usuário (400)', async () => {
    vi.spyOn(prisma.orcamento, 'findFirst').mockResolvedValue(rawOrcamento());
    const createSpy = vi.spyOn(prisma.orcamento, 'create');

    const res = await request(app)
      .post('/api/orcamentos')
      .set('Authorization', `Bearer ${token}`)
      .send({ categoria: 'Alimentação', valorLimite: 800 });

    expect(res.status).toBe(400);
    expect(createSpy).not.toHaveBeenCalled();
  });
});

describe('PUT /api/orcamentos/:id', () => {
  it('retorna 404 quando o orçamento não é do usuário (proteção contra IDOR)', async () => {
    vi.spyOn(prisma.orcamento, 'findFirst').mockResolvedValue(null);
    const updateSpy = vi.spyOn(prisma.orcamento, 'update');

    const res = await request(app)
      .put('/api/orcamentos/123')
      .set('Authorization', `Bearer ${token}`)
      .send({ categoria: 'Alimentação', valorLimite: 800 });

    expect(res.status).toBe(404);
    expect(updateSpy).not.toHaveBeenCalled();
  });

  it('atualiza quando o orçamento pertence ao usuário (200)', async () => {
    vi.spyOn(prisma.orcamento, 'findFirst').mockResolvedValue(rawOrcamento());
    vi.spyOn(prisma.orcamento, 'update').mockResolvedValue(rawOrcamento({ valorLimite: new Prisma.Decimal('900.00') }));

    const res = await request(app)
      .put('/api/orcamentos/1')
      .set('Authorization', `Bearer ${token}`)
      .send({ categoria: 'Alimentação', valorLimite: 900 });

    expect(res.status).toBe(200);
    expect(res.body.valorLimite).toBe(900);
  });

  it('rejeita renomear para uma categoria que já tem orçamento (400)', async () => {
    vi.spyOn(prisma.orcamento, 'findFirst')
      .mockResolvedValueOnce(rawOrcamento({ id: 1, categoria: 'Alimentação' }))
      .mockResolvedValueOnce(rawOrcamento({ id: 2, categoria: 'Lazer' }));
    const updateSpy = vi.spyOn(prisma.orcamento, 'update');

    const res = await request(app)
      .put('/api/orcamentos/1')
      .set('Authorization', `Bearer ${token}`)
      .send({ categoria: 'Lazer', valorLimite: 800 });

    expect(res.status).toBe(400);
    expect(updateSpy).not.toHaveBeenCalled();
  });
});

describe('DELETE /api/orcamentos/:id', () => {
  it('retorna 404 quando o orçamento não é do usuário', async () => {
    vi.spyOn(prisma.orcamento, 'findFirst').mockResolvedValue(null);
    const res = await request(app).delete('/api/orcamentos/999').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });

  it('exclui e retorna 204 quando o orçamento é do usuário', async () => {
    vi.spyOn(prisma.orcamento, 'findFirst').mockResolvedValue(rawOrcamento());
    const deleteSpy = vi.spyOn(prisma.orcamento, 'delete').mockResolvedValue({});

    const res = await request(app).delete('/api/orcamentos/1').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(204);
    expect(deleteSpy).toHaveBeenCalledWith({ where: { id: 1 } });
  });
});
