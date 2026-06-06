// backend/controllers/authController.js
// Autenticação: Login inteligente (email/CPF/telefone), 2FA e Google Auth

const bcrypt    = require('bcryptjs');
const jwt       = require('jsonwebtoken');
const db        = require('../config/db');
const { validarCpf } = require('../config/validarCpf');

// ─── Regex para identificar tipo de identificador ───────────────────────────
const REGEX_EMAIL     = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const REGEX_CPF       = /^\d{3}\.?\d{3}\.?\d{3}-?\d{2}$/;
const REGEX_TELEFONE  = /^(\(?\d{2}\)?\s?)(\d{4,5}-?\d{4})$/;

/**
 * Detecta o tipo do identificador e retorna a coluna SQL correspondente.
 */
function detectarCampo(identificador) {
  if (REGEX_EMAIL.test(identificador))    return 'email';
  if (REGEX_CPF.test(identificador))      return 'cpf';
  if (REGEX_TELEFONE.test(identificador)) return 'telefone';
  return null;
}

/**
 * Gera código numérico aleatório de 6 dígitos.
 */
function gerarCodigo6Digitos() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

// ────────────────────────────────────────────────────────────────────────────
// POST /auth/login
// Body: { identificador, senha }
// ────────────────────────────────────────────────────────────────────────────
async function login(req, res) {
  try {
    const { identificador, senha } = req.body;

    if (!identificador || !senha) {
      return res.status(400).json({ erro: 'Identificador e senha são obrigatórios.' });
    }

    // Validação extra se for CPF
    const campo = detectarCampo(identificador.trim());
    if (!campo) {
      return res.status(400).json({ erro: 'Identificador inválido. Use e-mail, CPF ou telefone.' });
    }

    if (campo === 'cpf' && !validarCpf(identificador)) {
      return res.status(400).json({ erro: 'CPF inválido.' });
    }

    // Busca o usuário pelo campo correto
    const [rows] = await db.execute(
      `SELECT id, nome, email, telefone, senha_hash, google_id, perfil, ativo
       FROM usuarios WHERE ${campo} = ? LIMIT 1`,
      [identificador.trim()]
    );

    if (rows.length === 0) {
      return res.status(401).json({ erro: 'Credenciais inválidas.' });
    }

    const usuario = rows[0];

    if (!usuario.ativo) {
      return res.status(403).json({ erro: 'Conta desativada. Entre em contato com o suporte.' });
    }

    // Usuário Google não pode logar com senha
    if (usuario.google_id && !usuario.senha_hash) {
      return res.status(400).json({ erro: 'Esta conta usa login pelo Google. Use o botão "Entrar com Google".' });
    }

    const senhaCorreta = await bcrypt.compare(senha, usuario.senha_hash);
    if (!senhaCorreta) {
      return res.status(401).json({ erro: 'Credenciais inválidas.' });
    }

    // Credenciais OK → retorna dados para o front iniciar o fluxo 2FA
    return res.status(200).json({
      mensagem: 'Credenciais válidas. Escolha o canal de verificação.',
      usuario_id: usuario.id,
      nome:        usuario.nome,
      email:       usuario.email       || null,
      telefone:    usuario.telefone    || null,
    });

  } catch (err) {
    console.error('[login]', err);
    return res.status(500).json({ erro: 'Erro interno no servidor.' });
  }
}

// ────────────────────────────────────────────────────────────────────────────
// POST /auth/2fa/enviar
// Body: { usuario_id, canal }  — canal: 'EMAIL' | 'SMS'
// ────────────────────────────────────────────────────────────────────────────
async function enviar2FA(req, res) {
  try {
    const { usuario_id, canal } = req.body;

    if (!usuario_id || !['EMAIL', 'SMS'].includes(canal)) {
      return res.status(400).json({ erro: 'usuario_id e canal (EMAIL|SMS) são obrigatórios.' });
    }

    // Invalida tokens anteriores não usados do mesmo usuário
    await db.execute(
      `UPDATE tokens_2fa SET usado = 1
       WHERE usuario_id = ? AND usado = 0 AND expira_em > NOW()`,
      [usuario_id]
    );

    const codigo   = gerarCodigo6Digitos();
    const expiraEm = new Date(Date.now() + 5 * 60 * 1000); // 5 minutos

    await db.execute(
      `INSERT INTO tokens_2fa (usuario_id, codigo, canal, expira_em) VALUES (?, ?, ?, ?)`,
      [usuario_id, codigo, canal, expiraEm]
    );

    // Simulação de envio — em produção, integrar com SendGrid/Twilio
    const [user] = await db.execute('SELECT email, telefone FROM usuarios WHERE id = ?', [usuario_id]);
    const destino = canal === 'EMAIL' ? user[0]?.email : user[0]?.telefone;

    console.log('\n══════════════════════════════════════════');
    console.log(`📨 [SIMULAÇÃO DE ${canal}]`);
    console.log(`   Destinatário : ${destino}`);
    console.log(`   Código 2FA   : ${codigo}`);
    console.log(`   Válido até   : ${expiraEm.toLocaleString('pt-BR')}`);
    console.log('══════════════════════════════════════════\n');

    return res.status(200).json({
      mensagem: `Código enviado via ${canal}.`,
      canal,
      // Em produção, NUNCA retornar o código no JSON!
      // Mantido aqui apenas para facilitar os testes do projeto avaliativo.
      codigo_dev: process.env.NODE_ENV === 'development' ? codigo : undefined,
    });

  } catch (err) {
    console.error('[enviar2FA]', err);
    return res.status(500).json({ erro: 'Erro interno no servidor.' });
  }
}

// ────────────────────────────────────────────────────────────────────────────
// POST /auth/2fa/verificar
// Body: { usuario_id, codigo }
// ────────────────────────────────────────────────────────────────────────────
async function verificar2FA(req, res) {
  try {
    const { usuario_id, codigo } = req.body;

    if (!usuario_id || !codigo) {
      return res.status(400).json({ erro: 'usuario_id e codigo são obrigatórios.' });
    }

    const [tokens] = await db.execute(
      `SELECT id FROM tokens_2fa
       WHERE usuario_id = ? AND codigo = ? AND usado = 0 AND expira_em > NOW()
       ORDER BY criado_em DESC LIMIT 1`,
      [usuario_id, String(codigo).trim()]
    );

    if (tokens.length === 0) {
      return res.status(401).json({ erro: 'Código inválido ou expirado.' });
    }

    // Marca token como usado
    await db.execute('UPDATE tokens_2fa SET usado = 1 WHERE id = ?', [tokens[0].id]);

    // Busca dados completos do usuário para gerar o JWT
    const [users] = await db.execute(
      'SELECT id, nome, email, perfil FROM usuarios WHERE id = ?',
      [usuario_id]
    );
    const usuario = users[0];

    const token = jwt.sign(
      { id: usuario.id, nome: usuario.nome, email: usuario.email, perfil: usuario.perfil },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
    );

    return res.status(200).json({
      mensagem: 'Autenticação concluída com sucesso!',
      token,
      usuario: { id: usuario.id, nome: usuario.nome, email: usuario.email, perfil: usuario.perfil },
    });

  } catch (err) {
    console.error('[verificar2FA]', err);
    return res.status(500).json({ erro: 'Erro interno no servidor.' });
  }
}

// ────────────────────────────────────────────────────────────────────────────
// POST /auth/google
// Body: { google_id, nome, email }
// ────────────────────────────────────────────────────────────────────────────
async function googleAuth(req, res) {
  try {
    const { google_id, nome, email } = req.body;

    if (!google_id || !email) {
      return res.status(400).json({ erro: 'google_id e email são obrigatórios.' });
    }

    // Upsert: cria usuário se não existir
    let [rows] = await db.execute(
      'SELECT id, nome, email, perfil FROM usuarios WHERE google_id = ? OR email = ? LIMIT 1',
      [google_id, email]
    );

    let usuario;
    if (rows.length === 0) {
      const [result] = await db.execute(
        'INSERT INTO usuarios (nome, email, google_id, perfil) VALUES (?, ?, ?, ?)',
        [nome, email, google_id, 'CLIENTE']
      );
      usuario = { id: result.insertId, nome, email, perfil: 'CLIENTE' };
    } else {
      usuario = rows[0];
      // Atualiza google_id se ainda não estava salvo
      await db.execute('UPDATE usuarios SET google_id = ? WHERE id = ?', [google_id, usuario.id]);
    }

    const token = jwt.sign(
      { id: usuario.id, nome: usuario.nome, email: usuario.email, perfil: usuario.perfil },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
    );

    return res.status(200).json({
      mensagem: 'Login via Google realizado com sucesso!',
      token,
      usuario: { id: usuario.id, nome: usuario.nome, email: usuario.email, perfil: usuario.perfil },
    });

  } catch (err) {
    console.error('[googleAuth]', err);
    return res.status(500).json({ erro: 'Erro interno no servidor.' });
  }
}

module.exports = { login, enviar2FA, verificar2FA, googleAuth };
