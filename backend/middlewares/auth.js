// backend/middlewares/auth.js
// Middlewares de autenticação JWT e controle de acesso (RBAC)

const jwt = require('jsonwebtoken');

/**
 * Verifica se o token JWT no header Authorization é válido.
 * Injeta req.usuario com os dados decodificados.
 */
function autenticar(req, res, next) {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ erro: 'Token de autenticação não fornecido.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.usuario = payload; // { id, nome, email, perfil }
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ erro: 'Token expirado. Faça login novamente.' });
    }
    return res.status(401).json({ erro: 'Token inválido.' });
  }
}

/**
 * Garante que o usuário autenticado possui o perfil ADMIN.
 * Deve ser usado APÓS o middleware autenticar().
 */
function apenasAdmin(req, res, next) {
  if (!req.usuario || req.usuario.perfil !== 'ADMIN') {
    return res.status(403).json({ erro: 'Acesso negado. Requer perfil ADMIN.' });
  }
  next();
}

module.exports = { autenticar, apenasAdmin };
