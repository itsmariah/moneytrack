const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../database/db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'moneytrack_jwt_secret_mude_em_producao';

// RF01 - Cadastro de usuário
router.post('/register', async (req, res) => {
  try {
    const { nome, email, senha } = req.body;
    if (!nome || !email || !senha) {
      return res.status(400).json({ error: 'Preencha todos os campos' });
    }
    if (senha.length < 6) {
      return res.status(400).json({ error: 'A senha deve ter no mínimo 6 caracteres' });
    }

    const existing = await prisma.usuario.findUnique({ where: { email } });
    if (existing) return res.status(409).json({ error: 'E-mail já cadastrado' });

    const hash = await bcrypt.hash(senha, 10);
    const user = await prisma.usuario.create({ data: { nome, email, senha: hash } });

    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ token, user: { id: user.id, nome: user.nome, email: user.email } });
  } catch (err) {
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// RF02 - Login
router.post('/login', async (req, res) => {
  try {
    const { email, senha } = req.body;
    if (!email || !senha) {
      return res.status(400).json({ error: 'Preencha e-mail e senha' });
    }

    const user = await prisma.usuario.findUnique({ where: { email } });
    if (!user || !(await bcrypt.compare(senha, user.senha))) {
      return res.status(401).json({ error: 'E-mail ou senha incorretos' });
    }

    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, nome: user.nome, email: user.email } });
  } catch (err) {
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Dados do usuário logado
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await prisma.usuario.findUnique({
      where: { id: req.userId },
      select: { id: true, nome: true, email: true },
    });
    if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// RF03 - Editar dados do usuário
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const { nome, email, senha } = req.body;

    if (email) {
      const conflict = await prisma.usuario.findFirst({
        where: { email, NOT: { id: req.userId } },
      });
      if (conflict) return res.status(409).json({ error: 'E-mail já em uso por outro cadastro' });
    }

    const data = {};
    if (nome) data.nome = nome;
    if (email) data.email = email;
    if (senha) {
      if (senha.length < 6) return res.status(400).json({ error: 'A senha deve ter no mínimo 6 caracteres' });
      data.senha = await bcrypt.hash(senha, 10);
    }

    if (Object.keys(data).length === 0) {
      return res.status(400).json({ error: 'Nenhum dado para atualizar' });
    }

    const updated = await prisma.usuario.update({
      where: { id: req.userId },
      data,
      select: { id: true, nome: true, email: true },
    });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

module.exports = router;
