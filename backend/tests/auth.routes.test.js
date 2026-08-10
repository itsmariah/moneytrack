import { vi, describe, it, expect, afterEach } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { createTestApp } from './testApp.js';

// O Prisma Client é um singleton cacheado pelo Node (database/db.js faz
// `module.exports = new PrismaClient()`) — o mesmo require() que a rota usa.
// Por isso conseguimos usar vi.spyOn nos métodos reais em vez de precisar
// mockar o módulo inteiro (vi.mock não intercepta require() dentro de
// arquivos CJS neste projeto).
const prisma = require('../database/db');
const app = createTestApp();

afterEach(() => {
  vi.restoreAllMocks();
});

describe('POST /api/auth/register', () => {
  it('cria um usuário e retorna token + dados básicos (201)', async () => {
    vi.spyOn(prisma.usuario, 'findUnique').mockResolvedValue(null);
    vi.spyOn(prisma.usuario, 'create').mockResolvedValue({ id: 1, nome: 'Ana', email: 'ana@example.com', foto: null });

    const res = await request(app)
      .post('/api/auth/register')
      .send({ nome: 'Ana', email: 'ana@example.com', senha: '123456' });

    expect(res.status).toBe(201);
    expect(res.body.token).toBeTruthy();
    expect(res.body.user).toEqual({ id: 1, nome: 'Ana', email: 'ana@example.com', foto: null });
  });

  it('rejeita e-mail já cadastrado (409)', async () => {
    vi.spyOn(prisma.usuario, 'findUnique').mockResolvedValue({ id: 1, email: 'ana@example.com' });
    const createSpy = vi.spyOn(prisma.usuario, 'create');

    const res = await request(app)
      .post('/api/auth/register')
      .send({ nome: 'Ana', email: 'ana@example.com', senha: '123456' });

    expect(res.status).toBe(409);
    expect(createSpy).not.toHaveBeenCalled();
  });

  it('rejeita campos obrigatórios faltando (400)', async () => {
    const res = await request(app).post('/api/auth/register').send({ email: 'ana@example.com' });
    expect(res.status).toBe(400);
  });

  it('rejeita senha menor que 6 caracteres (400)', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ nome: 'Ana', email: 'ana@example.com', senha: '123' });
    expect(res.status).toBe(400);
  });

  it('rejeita e-mail em formato inválido (400)', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ nome: 'Ana', email: 'nao-e-email', senha: '123456' });
    expect(res.status).toBe(400);
  });
});

describe('POST /api/auth/login', () => {
  it('retorna token com credenciais corretas (200)', async () => {
    const hash = await bcrypt.hash('123456', 10);
    vi.spyOn(prisma.usuario, 'findUnique').mockResolvedValue({
      id: 1, nome: 'Ana', email: 'ana@example.com', senha: hash, foto: null,
    });

    const res = await request(app).post('/api/auth/login').send({ email: 'ana@example.com', senha: '123456' });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeTruthy();
  });

  it('retorna 401 com senha incorreta', async () => {
    const hash = await bcrypt.hash('123456', 10);
    vi.spyOn(prisma.usuario, 'findUnique').mockResolvedValue({ id: 1, senha: hash });

    const res = await request(app).post('/api/auth/login').send({ email: 'ana@example.com', senha: 'errada' });

    expect(res.status).toBe(401);
  });

  it('retorna 401 quando o e-mail não existe (sem revelar isso na mensagem)', async () => {
    vi.spyOn(prisma.usuario, 'findUnique').mockResolvedValue(null);

    const res = await request(app).post('/api/auth/login').send({ email: 'naoexiste@example.com', senha: '123456' });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('E-mail ou senha incorretos');
  });
});

describe('GET /api/auth/me', () => {
  it('retorna 401 sem token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('retorna 401 com token malformado', async () => {
    const res = await request(app).get('/api/auth/me').set('Authorization', 'Bearer token-invalido');
    expect(res.status).toBe(401);
  });

  it('retorna os dados do usuário autenticado pelo token (200)', async () => {
    const findSpy = vi.spyOn(prisma.usuario, 'findUnique')
      .mockResolvedValue({ id: 42, nome: 'Ana', email: 'ana@example.com', foto: null });
    const token = jwt.sign({ id: 42 }, process.env.JWT_SECRET);

    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.nome).toBe('Ana');
    expect(findSpy).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 42 } }));
  });
});

describe('PUT /api/auth/profile', () => {
  it('retorna 401 sem token', async () => {
    const res = await request(app).put('/api/auth/profile').send({ nome: 'Novo Nome' });
    expect(res.status).toBe(401);
  });

  it('atualiza o nome do usuário autenticado (200)', async () => {
    vi.spyOn(prisma.usuario, 'update').mockResolvedValue({ id: 1, nome: 'Novo Nome', email: 'ana@example.com', foto: null });
    const token = jwt.sign({ id: 1 }, process.env.JWT_SECRET);

    const res = await request(app)
      .put('/api/auth/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ nome: 'Novo Nome' });

    expect(res.status).toBe(200);
    expect(res.body.nome).toBe('Novo Nome');
  });

  it('rejeita e-mail já usado por outro usuário (409)', async () => {
    vi.spyOn(prisma.usuario, 'findFirst').mockResolvedValue({ id: 2, email: 'outro@example.com' });
    const token = jwt.sign({ id: 1 }, process.env.JWT_SECRET);

    const res = await request(app)
      .put('/api/auth/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ email: 'outro@example.com' });

    expect(res.status).toBe(409);
  });
});
