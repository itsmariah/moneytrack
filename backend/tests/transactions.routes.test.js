import { vi, describe, it, expect, afterEach } from 'vitest';
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

afterEach(() => {
  vi.restoreAllMocks();
});

describe('GET /api/transactions', () => {
  it('retorna 401 sem token', async () => {
    const res = await request(app).get('/api/transactions');
    expect(res.status).toBe(401);
  });

  it('retorna a lista paginada e converte valor (Decimal) para number', async () => {
    vi.spyOn(prisma.transacao, 'findMany').mockResolvedValue([
      { id: 1, usuarioId: 7, tipo: 'despesa', valor: new Prisma.Decimal('45.90'), categoria: 'Lazer', descricao: '', data: '2026-08-10' },
    ]);
    vi.spyOn(prisma.transacao, 'count').mockResolvedValue(1);

    const res = await request(app).get('/api/transactions').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.transactions).toHaveLength(1);
    expect(res.body.transactions[0].valor).toBe(45.9);
    expect(res.body).toMatchObject({ page: 1, limit: 50, total: 1, totalPages: 1 });
  });

  it('escopa a busca por usuarioId do token, nunca do query string', async () => {
    const findSpy = vi.spyOn(prisma.transacao, 'findMany').mockResolvedValue([]);
    vi.spyOn(prisma.transacao, 'count').mockResolvedValue(0);

    await request(app)
      .get('/api/transactions?usuarioId=999')
      .set('Authorization', `Bearer ${token}`);

    const whereUsed = findSpy.mock.calls[0][0].where;
    expect(whereUsed.usuarioId).toBe(7);
  });
});

describe('POST /api/transactions', () => {
  it('cria a transação com o usuarioId do token, mesmo que o body tente outro', async () => {
    const createSpy = vi.spyOn(prisma.transacao, 'create').mockResolvedValue({
      id: 10, usuarioId: 7, tipo: 'despesa', valor: new Prisma.Decimal('50.00'), categoria: 'Lazer', descricao: '', data: '2026-08-10',
    });

    const res = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${token}`)
      .send({ usuarioId: 999, tipo: 'despesa', valor: 50, categoria: 'Lazer', data: '2026-08-10' });

    expect(res.status).toBe(201);
    expect(res.body.valor).toBe(50);
    expect(createSpy.mock.calls[0][0].data.usuarioId).toBe(7);
  });

  it('rejeita corpo inválido (400) e não chama o Prisma', async () => {
    const createSpy = vi.spyOn(prisma.transacao, 'create');

    const res = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${token}`)
      .send({ tipo: 'despesa', valor: 50, categoria: 'Lazer', data: '30/08/2026' });

    expect(res.status).toBe(400);
    expect(createSpy).not.toHaveBeenCalled();
  });
});

describe('PUT /api/transactions/:id', () => {
  it('retorna 404 quando a transação não existe ou não é do usuário (proteção contra IDOR)', async () => {
    vi.spyOn(prisma.transacao, 'findFirst').mockResolvedValue(null);
    const updateSpy = vi.spyOn(prisma.transacao, 'update');

    const res = await request(app)
      .put('/api/transactions/123')
      .set('Authorization', `Bearer ${token}`)
      .send({ tipo: 'despesa', valor: 50, categoria: 'Lazer', data: '2026-08-10' });

    expect(res.status).toBe(404);
    expect(updateSpy).not.toHaveBeenCalled();
  });

  it('atualiza quando a transação pertence ao usuário (200)', async () => {
    vi.spyOn(prisma.transacao, 'findFirst').mockResolvedValue({ id: 5, usuarioId: 7 });
    vi.spyOn(prisma.transacao, 'update').mockResolvedValue({
      id: 5, usuarioId: 7, tipo: 'receita', valor: new Prisma.Decimal('100.00'), categoria: 'Salário', descricao: '', data: '2026-08-10',
    });

    const res = await request(app)
      .put('/api/transactions/5')
      .set('Authorization', `Bearer ${token}`)
      .send({ tipo: 'receita', valor: 100, categoria: 'Salário', data: '2026-08-10' });

    expect(res.status).toBe(200);
    expect(res.body.valor).toBe(100);
  });
});

describe('DELETE /api/transactions/:id', () => {
  it('retorna 404 quando a transação não é do usuário', async () => {
    vi.spyOn(prisma.transacao, 'findFirst').mockResolvedValue(null);
    const res = await request(app).delete('/api/transactions/999').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });

  it('exclui e retorna 204 quando a transação é do usuário', async () => {
    vi.spyOn(prisma.transacao, 'findFirst').mockResolvedValue({ id: 5, usuarioId: 7 });
    const deleteSpy = vi.spyOn(prisma.transacao, 'delete').mockResolvedValue({});

    const res = await request(app).delete('/api/transactions/5').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(204);
    expect(deleteSpy).toHaveBeenCalledWith({ where: { id: 5 } });
  });
});

describe('POST /api/transactions/bulk', () => {
  it('rejeita mais de 500 itens (400)', async () => {
    const many = Array.from({ length: 501 }, (_, i) => ({
      tipo: 'despesa', valor: 10, categoria: 'Lazer', data: '2026-08-10', descricao: `${i}`,
    }));
    const res = await request(app)
      .post('/api/transactions/bulk')
      .set('Authorization', `Bearer ${token}`)
      .send({ transactions: many });
    expect(res.status).toBe(400);
  });

  it('importa um lote válido (201) com o count retornado', async () => {
    vi.spyOn(prisma.transacao, 'createMany').mockResolvedValue({ count: 2 });

    const res = await request(app)
      .post('/api/transactions/bulk')
      .set('Authorization', `Bearer ${token}`)
      .send({
        transactions: [
          { tipo: 'despesa', valor: 10, categoria: 'Lazer', data: '2026-08-10' },
          { tipo: 'receita', valor: 20, categoria: 'Salário', data: '2026-08-11' },
        ],
      });

    expect(res.status).toBe(201);
    expect(res.body.count).toBe(2);
  });
});

describe('GET /api/transactions/export', () => {
  it('retorna um CSV com content-type e cabeçalho corretos', async () => {
    vi.spyOn(prisma.transacao, 'findMany').mockResolvedValue([
      { id: 1, tipo: 'despesa', valor: new Prisma.Decimal('45.90'), categoria: 'Lazer', descricao: 'Cinema', data: '2026-08-10' },
    ]);

    const res = await request(app).get('/api/transactions/export').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/csv');
    expect(res.headers['content-disposition']).toContain('attachment');
    expect(res.text).toContain('Data;Tipo;Categoria;Descrição;Valor');
    expect(res.text).toContain('45,90');
  });
});
