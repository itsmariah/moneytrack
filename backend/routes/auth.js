const express = require('express');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const prisma = require('../database/db');
const authMiddleware = require('../middleware/auth');
const { sendPasswordResetEmail } = require('../utils/mailer');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const FOTO_DATA_URL_REGEX = /^data:image\/(png|jpe?g|webp|gif);base64,/;
const MAX_FOTO_LENGTH = 2_000_000; // ~1.5MB decodificado
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hora

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Muitas tentativas. Tente novamente em alguns minutos.' },
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Muitas tentativas. Tente novamente mais tarde.' },
});

const forgotPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Muitas solicitações. Tente novamente mais tarde.' },
});

// RF01 - Cadastro de usuário
router.post('/register', registerLimiter, async (req, res) => {
  try {
    const { nome, email, senha } = req.body;
    if (!nome || !email || !senha) {
      return res.status(400).json({ error: 'Preencha todos os campos' });
    }
    if (!EMAIL_REGEX.test(email)) {
      return res.status(400).json({ error: 'E-mail inválido' });
    }
    if (senha.length < 6) {
      return res.status(400).json({ error: 'A senha deve ter no mínimo 6 caracteres' });
    }

    const existing = await prisma.usuario.findUnique({ where: { email } });
    if (existing) return res.status(409).json({ error: 'E-mail já cadastrado' });

    const hash = await bcrypt.hash(senha, 10);
    const user = await prisma.usuario.create({ data: { nome, email, senha: hash } });

    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ token, user: { id: user.id, nome: user.nome, email: user.email, foto: user.foto } });
  } catch (err) {
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// RF02 - Login
router.post('/login', loginLimiter, async (req, res) => {
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
    res.json({ token, user: { id: user.id, nome: user.nome, email: user.email, foto: user.foto } });
  } catch (err) {
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Esqueci minha senha — gera token e envia e-mail
router.post('/forgot-password', forgotPasswordLimiter, async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Informe o e-mail' });
    }

    const user = await prisma.usuario.findUnique({ where: { email } });

    // Resposta genérica mesmo se o e-mail não existir, para não expor quais e-mails estão cadastrados.
    // O envio do e-mail não é aguardado antes de responder, para não criar uma diferença de tempo
    // perceptível entre "e-mail existe" e "e-mail não existe" (timing side-channel).
    if (user) {
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetTokenExpiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS);

      await prisma.usuario.update({
        where: { id: user.id },
        data: { resetToken, resetTokenExpiresAt },
      });

      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      const resetUrl = `${frontendUrl}/redefinir-senha?token=${resetToken}`;
      sendPasswordResetEmail(user.email, resetUrl).catch(err => {
        console.error('Erro ao enviar e-mail de redefinição:', err.message);
      });
    }

    res.json({ message: 'Se o e-mail informado estiver cadastrado, você receberá um link de redefinição.' });
  } catch (err) {
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Redefinir senha usando o token recebido por e-mail
router.post('/reset-password', loginLimiter, async (req, res) => {
  try {
    const { token, senha } = req.body;
    if (!token || !senha) {
      return res.status(400).json({ error: 'Dados incompletos' });
    }
    if (senha.length < 6) {
      return res.status(400).json({ error: 'A senha deve ter no mínimo 6 caracteres' });
    }

    const user = await prisma.usuario.findUnique({ where: { resetToken: token } });
    if (!user || !user.resetTokenExpiresAt || user.resetTokenExpiresAt < new Date()) {
      return res.status(400).json({ error: 'Link de redefinição inválido ou expirado' });
    }

    const hash = await bcrypt.hash(senha, 10);
    await prisma.usuario.update({
      where: { id: user.id },
      data: { senha: hash, resetToken: null, resetTokenExpiresAt: null },
    });

    res.json({ message: 'Senha redefinida com sucesso' });
  } catch (err) {
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Dados do usuário logado
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await prisma.usuario.findUnique({
      where: { id: req.userId },
      select: { id: true, nome: true, email: true, foto: true },
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
    const { nome, email, senha, foto } = req.body;

    if (email) {
      if (!EMAIL_REGEX.test(email)) {
        return res.status(400).json({ error: 'E-mail inválido' });
      }
      const conflict = await prisma.usuario.findFirst({
        where: { email, NOT: { id: req.userId } },
      });
      if (conflict) return res.status(409).json({ error: 'E-mail já em uso por outro cadastro' });
    }

    if (foto !== undefined && foto !== null) {
      if (!FOTO_DATA_URL_REGEX.test(foto)) {
        return res.status(400).json({ error: 'Formato de imagem inválido' });
      }
      if (foto.length > MAX_FOTO_LENGTH) {
        return res.status(400).json({ error: 'Imagem muito grande' });
      }
    }

    const data = {};
    if (nome) data.nome = nome;
    if (email) data.email = email;
    if (foto !== undefined) data.foto = foto;
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
      select: { id: true, nome: true, email: true, foto: true },
    });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

module.exports = router;
