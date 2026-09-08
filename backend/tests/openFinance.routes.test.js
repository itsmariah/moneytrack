import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { createTestApp } from './testApp.js';
import { makeToken } from './makeToken.js';

// Ver comentário em auth.routes.test.js: usamos vi.spyOn no singleton real do
// Prisma em vez de vi.mock, porque vi.mock não intercepta require() dentro de
// arquivos CJS neste projeto. O mesmo vale pro cliente da Pluggy (também um singleton).
const prisma = require('../database/db');
const pluggyClient = require('../utils/pluggyClient');
const app = createTestApp();
const token = makeToken(7);

beforeEach(() => {
  // authMiddleware confere tokenVersion e resolve a família a cada requisição autenticada.
  vi.spyOn(prisma.usuario, 'findUnique').mockResolvedValue({ tokenVersion: 0, familiaId: 1, papelFamilia: 'dono' });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('POST /api/open-finance/webhook', () => {
  it('não exige token (chamado pela Pluggy, não por um usuário logado)', async () => {
    vi.spyOn(prisma.conexaoBancaria, 'findUnique').mockResolvedValue(null);
    const res = await request(app).post('/api/open-finance/webhook').send({ event: 'item/created', itemId: 'item-1' });
    expect(res.status).toBe(200);
  });

  it('dispara sincronização quando o evento é item/updated e a conexão existe', async () => {
    vi.spyOn(prisma.conexaoBancaria, 'findUnique')
      .mockResolvedValueOnce({ id: 1, pluggyItemId: 'item-1', usuarioId: 7, ultimaSincronizacao: null }) // dentro do sincronizarConexao
      .mockResolvedValue({ id: 1, pluggyItemId: 'item-1', usuarioId: 7, ultimaSincronizacao: null });
    vi.spyOn(pluggyClient, 'fetchItem').mockResolvedValue({ status: 'UPDATED' });
    vi.spyOn(prisma.conexaoBancaria, 'update').mockResolvedValue({});
    const fetchAccountsSpy = vi.spyOn(pluggyClient, 'fetchAccounts').mockResolvedValue([]);

    const res = await request(app).post('/api/open-finance/webhook').send({ event: 'item/updated', itemId: 'item-1' });

    expect(res.status).toBe(200);
    expect(fetchAccountsSpy).toHaveBeenCalled();
  });

  it('sempre responde 200 mesmo se a sincronização falhar (evita retry-loop da Pluggy)', async () => {
    vi.spyOn(prisma.conexaoBancaria, 'findUnique').mockRejectedValue(new Error('falha de conexão com o banco de dados'));
    const res = await request(app).post('/api/open-finance/webhook').send({ event: 'item/updated', itemId: 'item-1' });
    expect(res.status).toBe(200);
  });

  it('ignora eventos que não sejam item/updated', async () => {
    const findSpy = vi.spyOn(prisma.conexaoBancaria, 'findUnique');
    const res = await request(app).post('/api/open-finance/webhook').send({ event: 'item/created', itemId: 'item-1' });
    expect(res.status).toBe(200);
    expect(findSpy).not.toHaveBeenCalled();
  });
});

describe('POST /api/open-finance/connect-token', () => {
  it('retorna 401 sem token', async () => {
    const res = await request(app).post('/api/open-finance/connect-token');
    expect(res.status).toBe(401);
  });

  it('gera o connect token com o clientUserId do usuário logado', async () => {
    const createTokenSpy = vi.spyOn(pluggyClient, 'createConnectToken').mockResolvedValue({ accessToken: 'connect-abc' });

    const res = await request(app).post('/api/open-finance/connect-token').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBe('connect-abc');
    expect(createTokenSpy.mock.calls[0][1].clientUserId).toBe('7');
  });
});

describe('POST /api/open-finance/conexoes', () => {
  it('retorna 400 sem pluggyItemId', async () => {
    const res = await request(app).post('/api/open-finance/conexoes').set('Authorization', `Bearer ${token}`).send({});
    expect(res.status).toBe(400);
  });

  it('cria a conexão com o usuarioId do token e já sincroniza', async () => {
    vi.spyOn(pluggyClient, 'fetchItem').mockResolvedValue({ status: 'UPDATED', connector: { name: 'Pluggy Bank' } });
    const createSpy = vi.spyOn(prisma.conexaoBancaria, 'create').mockResolvedValue({ id: 1, pluggyItemId: 'item-1', usuarioId: 7, nomeConector: 'Pluggy Bank', ultimaSincronizacao: null });
    vi.spyOn(prisma.conexaoBancaria, 'findUnique').mockResolvedValue({ id: 1, pluggyItemId: 'item-1', usuarioId: 7, ultimaSincronizacao: null });
    vi.spyOn(prisma.conexaoBancaria, 'update').mockResolvedValue({});
    vi.spyOn(pluggyClient, 'fetchAccounts').mockResolvedValue([]);

    const res = await request(app)
      .post('/api/open-finance/conexoes')
      .set('Authorization', `Bearer ${token}`)
      .send({ usuarioId: 999, pluggyItemId: 'item-1' });

    expect(res.status).toBe(201);
    expect(createSpy.mock.calls[0][0].data.usuarioId).toBe(7);
    expect(res.body.nomeConector).toBe('Pluggy Bank');
    expect(res.body.status).toBe('UPDATED');
  });
});

describe('GET /api/open-finance/conexoes', () => {
  it('escopa a busca por familiaId do token', async () => {
    const findSpy = vi.spyOn(prisma.conexaoBancaria, 'findMany').mockResolvedValue([]);
    await request(app).get('/api/open-finance/conexoes?usuarioId=999').set('Authorization', `Bearer ${token}`);
    expect(findSpy.mock.calls[0][0].where.familiaId).toBe(1);
  });
});

describe('POST /api/open-finance/conexoes/:id/sincronizar', () => {
  it('retorna 404 quando a conexão não é do usuário (proteção contra IDOR)', async () => {
    vi.spyOn(prisma.conexaoBancaria, 'findFirst').mockResolvedValue(null);
    const res = await request(app).post('/api/open-finance/conexoes/123/sincronizar').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });

  it('sincroniza quando a conexão pertence ao usuário', async () => {
    vi.spyOn(prisma.conexaoBancaria, 'findFirst').mockResolvedValue({ id: 1, usuarioId: 7 });
    vi.spyOn(prisma.conexaoBancaria, 'findUnique').mockResolvedValue({ id: 1, pluggyItemId: 'item-1', usuarioId: 7, ultimaSincronizacao: null });
    vi.spyOn(pluggyClient, 'fetchItem').mockResolvedValue({ status: 'UPDATING' });
    vi.spyOn(prisma.conexaoBancaria, 'update').mockResolvedValue({});

    const res = await request(app).post('/api/open-finance/conexoes/1/sincronizar').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('UPDATING');
  });
});

describe('DELETE /api/open-finance/conexoes/:id', () => {
  it('retorna 404 quando a conexão não é do usuário', async () => {
    vi.spyOn(prisma.conexaoBancaria, 'findFirst').mockResolvedValue(null);
    const res = await request(app).delete('/api/open-finance/conexoes/999').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });

  it('exclui e retorna 204 quando a conexão é do usuário', async () => {
    vi.spyOn(prisma.conexaoBancaria, 'findFirst').mockResolvedValue({ id: 1, usuarioId: 7 });
    const deleteSpy = vi.spyOn(prisma.conexaoBancaria, 'delete').mockResolvedValue({});

    const res = await request(app).delete('/api/open-finance/conexoes/1').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(204);
    expect(deleteSpy).toHaveBeenCalledWith({ where: { id: 1 } });
  });
});
