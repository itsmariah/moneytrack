import { vi, describe, it, expect, afterEach } from 'vitest';
import request from 'supertest';
import { Prisma } from '@prisma/client';
import { createTestApp } from './testApp.js';
import { makeToken } from './makeToken.js';

// Ver comentário em auth.routes.test.js sobre por que usamos vi.spyOn no
// singleton real do Prisma em vez de vi.mock.
const prisma = require('../database/db');
const app = createTestApp();
const token = makeToken(7);

afterEach(() => {
  vi.restoreAllMocks();
});

describe('GET /api/reports/balance', () => {
  it('retorna 401 sem token', async () => {
    const res = await request(app).get('/api/reports/balance');
    expect(res.status).toBe(401);
  });

  it('calcula o saldo a partir do groupBy do Prisma (200)', async () => {
    vi.spyOn(prisma.transacao, 'groupBy').mockResolvedValue([
      { tipo: 'receita', _sum: { valor: new Prisma.Decimal('5000.00') } },
      { tipo: 'despesa', _sum: { valor: new Prisma.Decimal('3200.00') } },
    ]);

    const res = await request(app).get('/api/reports/balance').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ receitas: 5000, despesas: 3200, saldo: 1800 });
  });

  it('escopa o groupBy pelo usuarioId do token', async () => {
    const spy = vi.spyOn(prisma.transacao, 'groupBy').mockResolvedValue([]);
    await request(app).get('/api/reports/balance').set('Authorization', `Bearer ${token}`);
    expect(spy.mock.calls[0][0].where.usuarioId).toBe(7);
  });
});

describe('GET /api/reports/monthly', () => {
  it('retorna 400 sem o parâmetro month', async () => {
    const res = await request(app).get('/api/reports/monthly').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(400);
  });

  it('retorna 400 com month em formato inválido', async () => {
    const res = await request(app).get('/api/reports/monthly?month=agosto').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(400);
  });

  it('retorna transações e resumo do mês (200)', async () => {
    vi.spyOn(prisma.transacao, 'findMany').mockResolvedValue([
      { id: 1, tipo: 'receita', valor: new Prisma.Decimal('3000.00'), categoria: 'Salário', descricao: '', data: '2026-08-05' },
      { id: 2, tipo: 'despesa', valor: new Prisma.Decimal('800.00'), categoria: 'Moradia', descricao: '', data: '2026-08-10' },
    ]);

    const res = await request(app).get('/api/reports/monthly?month=2026-08').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.resumo).toEqual({ receitas: 3000, despesas: 800, saldo: 2200 });
    expect(res.body.transactions).toHaveLength(2);
  });

  it('usa o último dia real do mês no range de busca (fevereiro)', async () => {
    const spy = vi.spyOn(prisma.transacao, 'findMany').mockResolvedValue([]);
    await request(app).get('/api/reports/monthly?month=2026-02').set('Authorization', `Bearer ${token}`);
    expect(spy.mock.calls[0][0].where.data).toEqual({ gte: '2026-02-01', lte: '2026-02-28' });
  });
});

describe('GET /api/reports/categories', () => {
  it('converte os totais (Decimal) para number', async () => {
    vi.spyOn(prisma.transacao, 'groupBy').mockResolvedValue([
      { categoria: 'Lazer', tipo: 'despesa', _sum: { valor: new Prisma.Decimal('120.00') } },
    ]);

    const res = await request(app).get('/api/reports/categories').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body[0].total).toBe(120);
  });
});

describe('GET /api/reports/evolution', () => {
  it('agrupa por mês somando receitas e despesas separadamente (200)', async () => {
    vi.spyOn(prisma.transacao, 'findMany').mockResolvedValue([
      { tipo: 'receita', valor: new Prisma.Decimal('1000.00'), data: '2026-07-01' },
      { tipo: 'despesa', valor: new Prisma.Decimal('300.00'), data: '2026-07-15' },
    ]);

    const res = await request(app).get('/api/reports/evolution').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual([{ mes: '2026-07', receitas: 1000, despesas: 300 }]);
  });
});
