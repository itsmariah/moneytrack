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

const rawConta = (overrides = {}) => ({
  id: 1,
  usuarioId: 7,
  nome: 'Nubank',
  tipo: 'corrente',
  saldoInicial: new Prisma.Decimal('500.00'),
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

describe('GET /api/contas', () => {
  it('retorna 401 sem token', async () => {
    const res = await request(app).get('/api/contas');
    expect(res.status).toBe(401);
  });

  it('retorna lista vazia sem consultar transações/transferências quando não há conta', async () => {
    vi.spyOn(prisma.conta, 'findMany').mockResolvedValue([]);
    const groupBySpy = vi.spyOn(prisma.transacao, 'groupBy');

    const res = await request(app).get('/api/contas').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
    expect(groupBySpy).not.toHaveBeenCalled();
  });

  it('calcula o saldo como saldoInicial + receitas - despesas', async () => {
    vi.spyOn(prisma.conta, 'findMany').mockResolvedValue([rawConta()]);
    vi.spyOn(prisma.transacao, 'groupBy').mockResolvedValue([
      { contaId: 1, tipo: 'receita', _sum: { valor: new Prisma.Decimal('1000.00') } },
      { contaId: 1, tipo: 'despesa', _sum: { valor: new Prisma.Decimal('300.00') } },
    ]);
    vi.spyOn(prisma.transferencia, 'groupBy').mockResolvedValue([]);

    const res = await request(app).get('/api/contas').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    // saldoInicial 500 + receitas 1000 - despesas 300 = 1200
    expect(res.body[0]).toMatchObject({ nome: 'Nubank', saldoInicial: 500, saldo: 1200 });
  });

  it('desconta transferências de saída e soma as de entrada no saldo', async () => {
    vi.spyOn(prisma.conta, 'findMany').mockResolvedValue([rawConta()]);
    vi.spyOn(prisma.transacao, 'groupBy').mockResolvedValue([]);
    vi.spyOn(prisma.transferencia, 'groupBy')
      .mockResolvedValueOnce([{ contaOrigemId: 1, _sum: { valor: new Prisma.Decimal('100.00') } }])
      .mockResolvedValueOnce([{ contaDestinoId: 1, _sum: { valor: new Prisma.Decimal('40.00') } }]);

    const res = await request(app).get('/api/contas').set('Authorization', `Bearer ${token}`);

    // saldoInicial 500 - saída 100 + entrada 40 = 440
    expect(res.body[0].saldo).toBe(440);
  });

  it('escopa a busca por usuarioId do token', async () => {
    const findSpy = vi.spyOn(prisma.conta, 'findMany').mockResolvedValue([]);
    await request(app).get('/api/contas?usuarioId=999').set('Authorization', `Bearer ${token}`);
    expect(findSpy.mock.calls[0][0].where.usuarioId).toBe(7);
  });
});

describe('POST /api/contas', () => {
  it('cria a conta com o usuarioId do token, mesmo que o body tente outro', async () => {
    const createSpy = vi.spyOn(prisma.conta, 'create').mockResolvedValue(rawConta());

    const res = await request(app)
      .post('/api/contas')
      .set('Authorization', `Bearer ${token}`)
      .send({ usuarioId: 999, nome: 'Nubank', tipo: 'corrente', saldoInicial: 500 });

    expect(res.status).toBe(201);
    expect(createSpy.mock.calls[0][0].data.usuarioId).toBe(7);
  });

  it('rejeita corpo inválido (400) e não chama o Prisma', async () => {
    const createSpy = vi.spyOn(prisma.conta, 'create');

    const res = await request(app)
      .post('/api/contas')
      .set('Authorization', `Bearer ${token}`)
      .send({ nome: '', tipo: 'corrente', saldoInicial: 500 });

    expect(res.status).toBe(400);
    expect(createSpy).not.toHaveBeenCalled();
  });
});

describe('PUT /api/contas/:id', () => {
  it('retorna 404 quando a conta não é do usuário (proteção contra IDOR)', async () => {
    vi.spyOn(prisma.conta, 'findFirst').mockResolvedValue(null);
    const updateSpy = vi.spyOn(prisma.conta, 'update');

    const res = await request(app)
      .put('/api/contas/123')
      .set('Authorization', `Bearer ${token}`)
      .send({ nome: 'Nubank', tipo: 'corrente', saldoInicial: 500 });

    expect(res.status).toBe(404);
    expect(updateSpy).not.toHaveBeenCalled();
  });

  it('atualiza quando a conta pertence ao usuário (200)', async () => {
    vi.spyOn(prisma.conta, 'findFirst').mockResolvedValue(rawConta());
    vi.spyOn(prisma.conta, 'update').mockResolvedValue(rawConta({ nome: 'Nubank PJ' }));

    const res = await request(app)
      .put('/api/contas/1')
      .set('Authorization', `Bearer ${token}`)
      .send({ nome: 'Nubank PJ', tipo: 'corrente', saldoInicial: 500 });

    expect(res.status).toBe(200);
    expect(res.body.nome).toBe('Nubank PJ');
  });
});

describe('DELETE /api/contas/:id', () => {
  it('retorna 404 quando a conta não é do usuário', async () => {
    vi.spyOn(prisma.conta, 'findFirst').mockResolvedValue(null);
    const res = await request(app).delete('/api/contas/999').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });

  it('rejeita excluir a última conta do usuário (400)', async () => {
    vi.spyOn(prisma.conta, 'findFirst').mockResolvedValue(rawConta());
    vi.spyOn(prisma.conta, 'count').mockResolvedValue(1);
    const deleteSpy = vi.spyOn(prisma.conta, 'delete');

    const res = await request(app).delete('/api/contas/1').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(400);
    expect(deleteSpy).not.toHaveBeenCalled();
  });

  it('exclui quando o usuário tem mais de uma conta (204)', async () => {
    vi.spyOn(prisma.conta, 'findFirst').mockResolvedValue(rawConta());
    vi.spyOn(prisma.conta, 'count').mockResolvedValue(2);
    const deleteSpy = vi.spyOn(prisma.conta, 'delete').mockResolvedValue({});

    const res = await request(app).delete('/api/contas/1').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(204);
    expect(deleteSpy).toHaveBeenCalledWith({ where: { id: 1 } });
  });
});
