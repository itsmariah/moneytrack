import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { createTestApp } from './testApp.js';
import { makeToken } from './makeToken.js';

// Ver comentário em auth.routes.test.js: usamos vi.spyOn no singleton real do
// Prisma em vez de vi.mock, porque vi.mock não intercepta require() dentro de
// arquivos CJS neste projeto.
const prisma = require('../database/db');
const app = createTestApp();
const token = makeToken(7);

const rawCategoria = (overrides = {}) => ({
  id: 1,
  usuarioId: 7,
  nome: 'Alimentação',
  tipo: 'despesa',
  icone: '🍔',
  cor: '#6366f1',
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

describe('GET /api/categorias', () => {
  it('retorna 401 sem token', async () => {
    const res = await request(app).get('/api/categorias');
    expect(res.status).toBe(401);
  });

  it('semeia a lista padrão na primeira vez (quando o usuário ainda não tem nenhuma)', async () => {
    vi.spyOn(prisma.categoria, 'count').mockResolvedValue(0);
    const createManySpy = vi.spyOn(prisma.categoria, 'createMany').mockResolvedValue({ count: 18 });
    vi.spyOn(prisma.categoria, 'findMany').mockResolvedValue([rawCategoria()]);

    const res = await request(app).get('/api/categorias').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(createManySpy).toHaveBeenCalled();
    expect(createManySpy.mock.calls[0][0].data.every(c => c.usuarioId === 7)).toBe(true);
  });

  it('não semeia de novo quando o usuário já tem categorias', async () => {
    vi.spyOn(prisma.categoria, 'count').mockResolvedValue(5);
    const createManySpy = vi.spyOn(prisma.categoria, 'createMany');
    vi.spyOn(prisma.categoria, 'findMany').mockResolvedValue([rawCategoria()]);

    await request(app).get('/api/categorias').set('Authorization', `Bearer ${token}`);

    expect(createManySpy).not.toHaveBeenCalled();
  });

  it('escopa a busca por usuarioId do token e aceita filtro por tipo', async () => {
    vi.spyOn(prisma.categoria, 'count').mockResolvedValue(1);
    const findSpy = vi.spyOn(prisma.categoria, 'findMany').mockResolvedValue([]);

    await request(app).get('/api/categorias?tipo=receita&usuarioId=999').set('Authorization', `Bearer ${token}`);

    expect(findSpy.mock.calls[0][0].where).toEqual({ usuarioId: 7, tipo: 'receita' });
  });
});

describe('POST /api/categorias', () => {
  it('cria a categoria com o usuarioId do token', async () => {
    vi.spyOn(prisma.categoria, 'findFirst').mockResolvedValue(null);
    const createSpy = vi.spyOn(prisma.categoria, 'create').mockResolvedValue(rawCategoria());

    const res = await request(app)
      .post('/api/categorias')
      .set('Authorization', `Bearer ${token}`)
      .send({ usuarioId: 999, nome: 'Alimentação', tipo: 'despesa', icone: '🍔', cor: '#ff0000' });

    expect(res.status).toBe(201);
    expect(createSpy.mock.calls[0][0].data.usuarioId).toBe(7);
  });

  it('rejeita corpo inválido (400) e não chama o Prisma', async () => {
    const createSpy = vi.spyOn(prisma.categoria, 'create');

    const res = await request(app)
      .post('/api/categorias')
      .set('Authorization', `Bearer ${token}`)
      .send({ nome: '', tipo: 'despesa' });

    expect(res.status).toBe(400);
    expect(createSpy).not.toHaveBeenCalled();
  });

  it('rejeita nome duplicado no mesmo tipo (400)', async () => {
    vi.spyOn(prisma.categoria, 'findFirst').mockResolvedValue(rawCategoria());
    const createSpy = vi.spyOn(prisma.categoria, 'create');

    const res = await request(app)
      .post('/api/categorias')
      .set('Authorization', `Bearer ${token}`)
      .send({ nome: 'Alimentação', tipo: 'despesa' });

    expect(res.status).toBe(400);
    expect(createSpy).not.toHaveBeenCalled();
  });
});

describe('PUT /api/categorias/:id', () => {
  it('retorna 404 quando a categoria não é do usuário (proteção contra IDOR)', async () => {
    vi.spyOn(prisma.categoria, 'findFirst').mockResolvedValue(null);
    const updateSpy = vi.spyOn(prisma, '$transaction');

    const res = await request(app)
      .put('/api/categorias/123')
      .set('Authorization', `Bearer ${token}`)
      .send({ nome: 'Novo nome' });

    expect(res.status).toBe(404);
    expect(updateSpy).not.toHaveBeenCalled();
  });

  it('atualiza e propaga o nome novo pra transações/recorrências/orçamentos existentes', async () => {
    const existing = rawCategoria({ nome: 'Alimentação' });
    vi.spyOn(prisma.categoria, 'findFirst')
      .mockResolvedValueOnce(existing) // ownership check
      .mockResolvedValueOnce(null); // checagem de conflito de nome novo

    const updatedCategoria = rawCategoria({ nome: 'Comida' });
    const categoriaUpdateSpy = vi.spyOn(prisma.categoria, 'update').mockResolvedValue(updatedCategoria);
    const txSpy = vi.spyOn(prisma.transacao, 'updateMany').mockResolvedValue({ count: 3 });
    const recSpy = vi.spyOn(prisma.recorrencia, 'updateMany').mockResolvedValue({ count: 1 });
    const orcSpy = vi.spyOn(prisma.orcamento, 'updateMany').mockResolvedValue({ count: 1 });
    vi.spyOn(prisma, '$transaction').mockImplementation((arr) => Promise.all(arr));

    const res = await request(app)
      .put('/api/categorias/1')
      .set('Authorization', `Bearer ${token}`)
      .send({ nome: 'Comida', icone: '🍕', cor: '#00ff00' });

    expect(res.status).toBe(200);
    expect(res.body.nome).toBe('Comida');
    expect(categoriaUpdateSpy.mock.calls[0][0].data.nome).toBe('Comida');
    expect(txSpy.mock.calls[0][0].where).toEqual({ usuarioId: 7, categoria: 'Alimentação' });
    expect(txSpy.mock.calls[0][0].data).toEqual({ categoria: 'Comida' });
    expect(recSpy).toHaveBeenCalled();
    expect(orcSpy).toHaveBeenCalled();
  });

  it('rejeita renomear para um nome que já existe no mesmo tipo (400)', async () => {
    const existing = rawCategoria({ id: 1, nome: 'Alimentação' });
    const conflito = rawCategoria({ id: 2, nome: 'Comida' });
    vi.spyOn(prisma.categoria, 'findFirst')
      .mockResolvedValueOnce(existing)
      .mockResolvedValueOnce(conflito);
    const txSpy = vi.spyOn(prisma, '$transaction');

    const res = await request(app)
      .put('/api/categorias/1')
      .set('Authorization', `Bearer ${token}`)
      .send({ nome: 'Comida' });

    expect(res.status).toBe(400);
    expect(txSpy).not.toHaveBeenCalled();
  });

  it('não propaga nada quando o nome não mudou (só ícone/cor)', async () => {
    const existing = rawCategoria({ nome: 'Alimentação' });
    vi.spyOn(prisma.categoria, 'findFirst').mockResolvedValue(existing);
    vi.spyOn(prisma.categoria, 'update').mockResolvedValue(existing);
    const txSpy = vi.spyOn(prisma.transacao, 'updateMany').mockResolvedValue({ count: 0 });
    vi.spyOn(prisma.recorrencia, 'updateMany').mockResolvedValue({ count: 0 });
    vi.spyOn(prisma.orcamento, 'updateMany').mockResolvedValue({ count: 0 });
    vi.spyOn(prisma, '$transaction').mockImplementation((arr) => Promise.all(arr));

    const res = await request(app)
      .put('/api/categorias/1')
      .set('Authorization', `Bearer ${token}`)
      .send({ nome: 'Alimentação', icone: '🍕' });

    expect(res.status).toBe(200);
    // updateMany ainda é chamado (where categoria = nome atual = nome novo), mas não afeta nada de errado
    expect(txSpy.mock.calls[0][0].data).toEqual({ categoria: 'Alimentação' });
  });
});

describe('DELETE /api/categorias/:id', () => {
  it('retorna 404 quando a categoria não é do usuário', async () => {
    vi.spyOn(prisma.categoria, 'findFirst').mockResolvedValue(null);
    const res = await request(app).delete('/api/categorias/999').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });

  it('exclui e retorna 204 quando a categoria é do usuário', async () => {
    vi.spyOn(prisma.categoria, 'findFirst').mockResolvedValue(rawCategoria());
    const deleteSpy = vi.spyOn(prisma.categoria, 'delete').mockResolvedValue({});

    const res = await request(app).delete('/api/categorias/1').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(204);
    expect(deleteSpy).toHaveBeenCalledWith({ where: { id: 1 } });
  });
});
