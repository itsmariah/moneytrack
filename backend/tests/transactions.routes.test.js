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

beforeEach(() => {
  // authMiddleware confere tokenVersion a cada requisição autenticada.
  vi.spyOn(prisma.usuario, 'findUnique').mockResolvedValue({ tokenVersion: 0 });
  // GET / materializa recorrências vencidas antes de listar — sem recorrência ativa
  // nenhuma, não deve gerar nada (ver describe dedicado mais abaixo).
  vi.spyOn(prisma.recorrencia, 'findMany').mockResolvedValue([]);
  // contaPertenceAoUsuario: por padrão a conta 1 existe e é do usuário 7.
  vi.spyOn(prisma.conta, 'findFirst').mockResolvedValue({ id: 1, usuarioId: 7 });
  // PUT roda update + (opcionalmente) criação de histórico dentro de $transaction — como
  // nos outros arquivos de teste, simulamos rodando as duas promises com Promise.all.
  vi.spyOn(prisma, '$transaction').mockImplementation((arr) => Promise.all(arr));
  vi.spyOn(prisma.transacaoHistorico, 'create').mockResolvedValue({});
});

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
      .send({ usuarioId: 999, tipo: 'despesa', valor: 50, categoria: 'Lazer', data: '2026-08-10', contaId: 1 });

    expect(res.status).toBe(201);
    expect(res.body.valor).toBe(50);
    expect(createSpy.mock.calls[0][0].data.usuarioId).toBe(7);
    expect(createSpy.mock.calls[0][0].data.contaId).toBe(1);
  });

  it('rejeita corpo inválido (400) e não chama o Prisma', async () => {
    const createSpy = vi.spyOn(prisma.transacao, 'create');

    const res = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${token}`)
      .send({ tipo: 'despesa', valor: 50, categoria: 'Lazer', data: '30/08/2026', contaId: 1 });

    expect(res.status).toBe(400);
    expect(createSpy).not.toHaveBeenCalled();
  });

  it('rejeita quando a conta não pertence ao usuário (400, proteção contra IDOR)', async () => {
    vi.spyOn(prisma.conta, 'findFirst').mockResolvedValue(null);
    const createSpy = vi.spyOn(prisma.transacao, 'create');

    const res = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${token}`)
      .send({ tipo: 'despesa', valor: 50, categoria: 'Lazer', data: '2026-08-10', contaId: 999 });

    expect(res.status).toBe(400);
    expect(createSpy).not.toHaveBeenCalled();
  });

  it('salva o anexo (data URL + nome) quando enviado', async () => {
    const createSpy = vi.spyOn(prisma.transacao, 'create').mockResolvedValue({
      id: 11, usuarioId: 7, tipo: 'despesa', valor: new Prisma.Decimal('50.00'), categoria: 'Lazer', descricao: '', data: '2026-08-10', anexoNome: 'nota.png',
    });

    const res = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${token}`)
      .send({ tipo: 'despesa', valor: 50, categoria: 'Lazer', data: '2026-08-10', contaId: 1, anexo: 'data:image/png;base64,AAAA', anexoNome: 'nota.png' });

    expect(res.status).toBe(201);
    expect(createSpy.mock.calls[0][0].data.anexo).toBe('data:image/png;base64,AAAA');
    expect(createSpy.mock.calls[0][0].data.anexoNome).toBe('nota.png');
  });

  it('rejeita anexo em formato inválido (400)', async () => {
    const createSpy = vi.spyOn(prisma.transacao, 'create');

    const res = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${token}`)
      .send({ tipo: 'despesa', valor: 50, categoria: 'Lazer', data: '2026-08-10', contaId: 1, anexo: 'não-é-data-url', anexoNome: 'a.png' });

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
      .send({ tipo: 'receita', valor: 100, categoria: 'Salário', data: '2026-08-10', contaId: 1 });

    expect(res.status).toBe(200);
    expect(res.body.valor).toBe(100);
  });

  it('não mexe no anexo existente quando o campo não é enviado', async () => {
    vi.spyOn(prisma.transacao, 'findFirst').mockResolvedValue({ id: 5, usuarioId: 7 });
    const updateSpy = vi.spyOn(prisma.transacao, 'update').mockResolvedValue({
      id: 5, usuarioId: 7, tipo: 'receita', valor: new Prisma.Decimal('100.00'), categoria: 'Salário', descricao: '', data: '2026-08-10',
    });

    await request(app)
      .put('/api/transactions/5')
      .set('Authorization', `Bearer ${token}`)
      .send({ tipo: 'receita', valor: 100, categoria: 'Salário', data: '2026-08-10', contaId: 1 });

    expect(updateSpy.mock.calls[0][0].data).not.toHaveProperty('anexo');
    expect(updateSpy.mock.calls[0][0].data).not.toHaveProperty('anexoNome');
  });

  it('remove o anexo quando enviado explicitamente como null', async () => {
    vi.spyOn(prisma.transacao, 'findFirst').mockResolvedValue({ id: 5, usuarioId: 7 });
    const updateSpy = vi.spyOn(prisma.transacao, 'update').mockResolvedValue({
      id: 5, usuarioId: 7, tipo: 'receita', valor: new Prisma.Decimal('100.00'), categoria: 'Salário', descricao: '', data: '2026-08-10',
    });

    await request(app)
      .put('/api/transactions/5')
      .set('Authorization', `Bearer ${token}`)
      .send({ tipo: 'receita', valor: 100, categoria: 'Salário', data: '2026-08-10', contaId: 1, anexo: null });

    expect(updateSpy.mock.calls[0][0].data.anexo).toBeNull();
    expect(updateSpy.mock.calls[0][0].data.anexoNome).toBeNull();
  });

  it('não cria histórico quando nenhum campo financeiro muda', async () => {
    const existente = { id: 5, usuarioId: 7, tipo: 'receita', valor: new Prisma.Decimal('100.00'), categoria: 'Salário', descricao: '', data: '2026-08-10', contaId: 1 };
    vi.spyOn(prisma.transacao, 'findFirst').mockResolvedValue(existente);
    vi.spyOn(prisma.transacao, 'update').mockResolvedValue(existente);
    const historicoSpy = vi.spyOn(prisma.transacaoHistorico, 'create');

    await request(app)
      .put('/api/transactions/5')
      .set('Authorization', `Bearer ${token}`)
      .send({ tipo: 'receita', valor: 100, categoria: 'Salário', data: '2026-08-10', contaId: 1 });

    expect(historicoSpy).not.toHaveBeenCalled();
  });

  it('cria uma entrada de histórico com o que mudou quando um campo financeiro é editado', async () => {
    const existente = { id: 5, usuarioId: 7, tipo: 'receita', valor: new Prisma.Decimal('100.00'), categoria: 'Salário', descricao: '', data: '2026-08-10', contaId: 1 };
    vi.spyOn(prisma.transacao, 'findFirst').mockResolvedValue(existente);
    vi.spyOn(prisma.transacao, 'update').mockResolvedValue({ ...existente, valor: new Prisma.Decimal('150.00'), categoria: 'Freelance' });
    const historicoSpy = vi.spyOn(prisma.transacaoHistorico, 'create').mockResolvedValue({});

    await request(app)
      .put('/api/transactions/5')
      .set('Authorization', `Bearer ${token}`)
      .send({ tipo: 'receita', valor: 150, categoria: 'Freelance', data: '2026-08-10', contaId: 1 });

    expect(historicoSpy).toHaveBeenCalledTimes(1);
    expect(historicoSpy.mock.calls[0][0].data.transacaoId).toBe(5);
    expect(historicoSpy.mock.calls[0][0].data.alteracoes).toEqual([
      { campo: 'valor', de: 100, para: 150 },
      { campo: 'categoria', de: 'Salário', para: 'Freelance' },
    ]);
  });

  it('não registra troca de anexo no histórico financeiro', async () => {
    const existente = { id: 5, usuarioId: 7, tipo: 'receita', valor: new Prisma.Decimal('100.00'), categoria: 'Salário', descricao: '', data: '2026-08-10', contaId: 1 };
    vi.spyOn(prisma.transacao, 'findFirst').mockResolvedValue(existente);
    vi.spyOn(prisma.transacao, 'update').mockResolvedValue(existente);
    const historicoSpy = vi.spyOn(prisma.transacaoHistorico, 'create');

    await request(app)
      .put('/api/transactions/5')
      .set('Authorization', `Bearer ${token}`)
      .send({ tipo: 'receita', valor: 100, categoria: 'Salário', data: '2026-08-10', contaId: 1, anexo: 'data:image/png;base64,AAAA', anexoNome: 'a.png' });

    expect(historicoSpy).not.toHaveBeenCalled();
  });
});

describe('GET /api/transactions/:id/historico', () => {
  it('retorna 404 quando a transação não é do usuário', async () => {
    vi.spyOn(prisma.transacao, 'findFirst').mockResolvedValue(null);

    const res = await request(app)
      .get('/api/transactions/5/historico')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
  });

  it('retorna a lista de edições, mais recente primeiro', async () => {
    vi.spyOn(prisma.transacao, 'findFirst').mockResolvedValue({ id: 5 });
    const findManySpy = vi.spyOn(prisma.transacaoHistorico, 'findMany').mockResolvedValue([
      { id: 2, transacaoId: 5, alteracoes: [{ campo: 'valor', de: 100, para: 150 }], createdAt: new Date('2026-08-12') },
      { id: 1, transacaoId: 5, alteracoes: [{ campo: 'categoria', de: 'Lazer', para: 'Saúde' }], createdAt: new Date('2026-08-10') },
    ]);

    const res = await request(app)
      .get('/api/transactions/5/historico')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    expect(findManySpy.mock.calls[0][0]).toMatchObject({ where: { transacaoId: 5 }, orderBy: { createdAt: 'desc' } });
  });
});

describe('GET /api/transactions/:id/anexo', () => {
  it('retorna 404 quando a transação não é do usuário', async () => {
    vi.spyOn(prisma.transacao, 'findFirst').mockResolvedValue(null);

    const res = await request(app)
      .get('/api/transactions/5/anexo')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
  });

  it('retorna 404 quando a transação não tem anexo', async () => {
    vi.spyOn(prisma.transacao, 'findFirst').mockResolvedValue({ anexo: null, anexoNome: null });

    const res = await request(app)
      .get('/api/transactions/5/anexo')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
  });

  it('retorna o anexo completo quando existe', async () => {
    vi.spyOn(prisma.transacao, 'findFirst').mockResolvedValue({ anexo: 'data:image/png;base64,AAAA', anexoNome: 'nota.png' });

    const res = await request(app)
      .get('/api/transactions/5/anexo')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ anexo: 'data:image/png;base64,AAAA', anexoNome: 'nota.png' });
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
      .send({ transactions: many, contaId: 1 });
    expect(res.status).toBe(400);
  });

  it('importa um lote válido (201) com o count retornado', async () => {
    const createManySpy = vi.spyOn(prisma.transacao, 'createMany').mockResolvedValue({ count: 2 });

    const res = await request(app)
      .post('/api/transactions/bulk')
      .set('Authorization', `Bearer ${token}`)
      .send({
        contaId: 1,
        transactions: [
          { tipo: 'despesa', valor: 10, categoria: 'Lazer', data: '2026-08-10' },
          { tipo: 'receita', valor: 20, categoria: 'Salário', data: '2026-08-11' },
        ],
      });

    expect(res.status).toBe(201);
    expect(res.body.count).toBe(2);
    expect(createManySpy.mock.calls[0][0].data.every(t => t.contaId === 1)).toBe(true);
  });

  it('rejeita quando a conta do lote não pertence ao usuário (400)', async () => {
    vi.spyOn(prisma.conta, 'findFirst').mockResolvedValue(null);
    const createManySpy = vi.spyOn(prisma.transacao, 'createMany');

    const res = await request(app)
      .post('/api/transactions/bulk')
      .set('Authorization', `Bearer ${token}`)
      .send({ contaId: 999, transactions: [{ tipo: 'despesa', valor: 10, categoria: 'Lazer', data: '2026-08-10' }] });

    expect(res.status).toBe(400);
    expect(createManySpy).not.toHaveBeenCalled();
  });
});

describe('GET /api/transactions materializa recorrências vencidas', () => {
  it('cria a transação em falta de uma recorrência ativa antes de listar', async () => {
    vi.spyOn(prisma.recorrencia, 'findMany').mockResolvedValue([
      { id: 1, usuarioId: 7, tipo: 'despesa', valor: new Prisma.Decimal('1200.00'), categoria: 'Moradia', descricao: 'Aluguel', diaDoMes: 1, dataInicio: '2020-01-01', dataFim: null, ativa: true },
    ]);
    const createManySpy = vi.spyOn(prisma.transacao, 'createMany').mockResolvedValue({ count: 1 });
    // Primeira chamada: ensureOccurrences checando o que já existe. Segunda: listagem final da rota.
    vi.spyOn(prisma.transacao, 'findMany').mockResolvedValueOnce([]).mockResolvedValue([]);
    vi.spyOn(prisma.transacao, 'count').mockResolvedValue(0);

    const res = await request(app).get('/api/transactions').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(createManySpy).toHaveBeenCalled();
    expect(createManySpy.mock.calls[0][0].data[0]).toMatchObject({ usuarioId: 7, categoria: 'Moradia', recorrenciaId: 1 });
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
