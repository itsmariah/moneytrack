import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { Prisma } from '@prisma/client';
import { createTestApp } from './testApp.js';
import { makeToken } from './makeToken.js';

// Ver comentário em auth.routes.test.js sobre por que usamos vi.spyOn no
// singleton real do Prisma em vez de vi.mock.
const prisma = require('../database/db');
const app = createTestApp();
const token = makeToken(7);

beforeEach(() => {
  // authMiddleware confere tokenVersion a cada requisição autenticada.
  vi.spyOn(prisma.usuario, 'findUnique').mockResolvedValue({ tokenVersion: 0 });
});

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
    vi.spyOn(prisma.conta, 'findMany').mockResolvedValue([]);

    const res = await request(app).get('/api/reports/balance').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ receitas: 5000, despesas: 3200, saldo: 1800 });
  });

  it('soma o saldoInicial das contas do usuário ao saldo', async () => {
    vi.spyOn(prisma.transacao, 'groupBy').mockResolvedValue([
      { tipo: 'receita', _sum: { valor: new Prisma.Decimal('1000.00') } },
    ]);
    vi.spyOn(prisma.conta, 'findMany').mockResolvedValue([
      { saldoInicial: new Prisma.Decimal('500.00') },
      { saldoInicial: new Prisma.Decimal('200.00') },
    ]);

    const res = await request(app).get('/api/reports/balance').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ receitas: 1000, despesas: 0, saldo: 1700 });
  });

  it('escopa o groupBy pelo usuarioId do token', async () => {
    const spy = vi.spyOn(prisma.transacao, 'groupBy').mockResolvedValue([]);
    vi.spyOn(prisma.conta, 'findMany').mockResolvedValue([]);
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

describe('GET /api/reports/insights', () => {
  it('retorna 401 sem token', async () => {
    const res = await request(app).get('/api/reports/insights');
    expect(res.status).toBe(401);
  });

  it('cruza categorias, orçamentos e metas do usuário e devolve os insights gerados', async () => {
    vi.spyOn(prisma.transacao, 'groupBy')
      .mockResolvedValueOnce([{ categoria: 'Alimentação', tipo: 'despesa', _sum: { valor: new Prisma.Decimal('1150.00') } }]) // mês atual
      .mockResolvedValueOnce([{ categoria: 'Alimentação', tipo: 'despesa', _sum: { valor: new Prisma.Decimal('1000.00') } }]); // mês anterior
    vi.spyOn(prisma.orcamento, 'findMany').mockResolvedValue([
      { categoria: 'Alimentação', valorLimite: new Prisma.Decimal('800.00') },
    ]);
    vi.spyOn(prisma.meta, 'findMany').mockResolvedValue([]);

    const res = await request(app).get('/api/reports/insights').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toContainEqual(expect.objectContaining({ tipo: 'orcamento_estourado', categoria: 'Alimentação', valorLimite: 800, gasto: 1150 }));
    expect(res.body).toContainEqual(expect.objectContaining({ tipo: 'categoria_aumento', categoria: 'Alimentação' }));
  });

  it('escopa as consultas por usuarioId do token', async () => {
    const groupBySpy = vi.spyOn(prisma.transacao, 'groupBy').mockResolvedValue([]);
    vi.spyOn(prisma.orcamento, 'findMany').mockResolvedValue([]);
    const metaSpy = vi.spyOn(prisma.meta, 'findMany').mockResolvedValue([]);

    await request(app).get('/api/reports/insights?usuarioId=999').set('Authorization', `Bearer ${token}`);

    expect(groupBySpy.mock.calls[0][0].where.usuarioId).toBe(7);
    expect(metaSpy.mock.calls[0][0].where.usuarioId).toBe(7);
  });
});

describe('GET /api/reports/projecao', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-10T12:00:00')); // dia 10 de agosto (31 dias), pra teste determinístico
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('retorna 401 sem token', async () => {
    vi.useRealTimers();
    const res = await request(app).get('/api/reports/projecao');
    expect(res.status).toBe(401);
  });

  it('projeta o saldo combinando o saldo atual, recorrências futuras e o ritmo de gastos', async () => {
    vi.spyOn(prisma.transacao, 'groupBy').mockResolvedValue([
      { tipo: 'receita', _sum: { valor: new Prisma.Decimal('5000.00') } },
      { tipo: 'despesa', _sum: { valor: new Prisma.Decimal('1000.00') } },
    ]);
    vi.spyOn(prisma.conta, 'findMany').mockResolvedValue([{ saldoInicial: new Prisma.Decimal('0.00') }]);
    vi.spyOn(prisma.transacao, 'aggregate').mockResolvedValue({ _sum: { valor: new Prisma.Decimal('300.00') } });
    // dataInicio em agosto (o próprio mês corrente) faz o ensureOccurrences não achar
    // nenhuma ocorrência passada pra materializar (evita mockar transacao.findMany/createMany
    // aqui) — dia 20 ainda não chegou (hoje é dia 10), então conta como recorrência futura.
    vi.spyOn(prisma.recorrencia, 'findMany').mockResolvedValue([
      { tipo: 'despesa', valor: new Prisma.Decimal('1200.00'), diaDoMes: 20, dataInicio: '2026-08-01', dataFim: null },
    ]);

    const res = await request(app).get('/api/reports/projecao').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.saldoAtual).toBe(4000); // 5000 receitas - 1000 despesas
    expect(res.body.despesasRecorrentesFuturas).toBe(1200);
    expect(res.body.mes).toBe('2026-08');
  });

  it('escopa a agregação de gastos não recorrentes por usuarioId do token', async () => {
    vi.spyOn(prisma.transacao, 'groupBy').mockResolvedValue([]);
    vi.spyOn(prisma.conta, 'findMany').mockResolvedValue([]);
    const aggSpy = vi.spyOn(prisma.transacao, 'aggregate').mockResolvedValue({ _sum: { valor: null } });
    vi.spyOn(prisma.recorrencia, 'findMany').mockResolvedValue([]);

    await request(app).get('/api/reports/projecao?usuarioId=999').set('Authorization', `Bearer ${token}`);

    expect(aggSpy.mock.calls[0][0].where.usuarioId).toBe(7);
    expect(aggSpy.mock.calls[0][0].where.recorrenciaId).toBeNull();
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
