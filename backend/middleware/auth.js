const jwt = require('jsonwebtoken');
const prisma = require('../database/db');

const JWT_SECRET = process.env.JWT_SECRET;

async function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token não fornecido' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] });

    // Confere que o token ainda corresponde à versão atual do usuário — trocar a
    // senha incrementa tokenVersion, invalidando qualquer token emitido antes disso.
    // Já aproveita esse mesmo SELECT pra resolver a família atual — sem round-trip extra,
    // e sempre atualizado (trocar de família não exige logout, diferente de trocar senha).
    const user = await prisma.usuario.findUnique({
      where: { id: decoded.id },
      select: { tokenVersion: true, familiaId: true, papelFamilia: true },
    });
    if (!user || user.tokenVersion !== decoded.tokenVersion) {
      return res.status(401).json({ error: 'Sessão expirada. Faça login novamente.' });
    }

    req.userId = decoded.id;
    req.familiaId = user.familiaId;
    req.papelFamilia = user.papelFamilia;
    next();
  } catch {
    res.status(401).json({ error: 'Token inválido ou expirado' });
  }
}

module.exports = authMiddleware;
