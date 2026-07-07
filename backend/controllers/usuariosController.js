// backend/controllers/usuariosController.js
// Conta/Configuração do usuário autenticado — cliente ou administrador
// (PARTES 6 e 7 do escopo): ver dados, atualizar perfil e excluir conta.

const db = require('../config/db');

// ────────────────────────────────────────────────────────────────────────────
// GET /usuarios/me
// ────────────────────────────────────────────────────────────────────────────
async function meuPerfil(req, res) {
  try {
    const [rows] = await db.execute(
      `SELECT id, nome, email, telefone, cpf, foto_url, perfil, criado_em
       FROM usuarios WHERE id = ? LIMIT 1`,
      [req.usuario.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ erro: 'Usuário não encontrado.' });
    }
    return res.status(200).json({ usuario: rows[0] });
  } catch (err) {
    console.error('[usuarios.meuPerfil]', err);
    return res.status(500).json({ erro: 'Erro ao carregar perfil.' });
  }
}

// ────────────────────────────────────────────────────────────────────────────
// PUT /usuarios/me
// Body: { nome?, email?, telefone?, foto_url? }
// ────────────────────────────────────────────────────────────────────────────
async function atualizarPerfil(req, res) {
  try {
    const permitidos = ['nome', 'email', 'telefone', 'foto_url'];
    const sets   = [];
    const params = [];

    for (const [chave, valor] of Object.entries(req.body || {})) {
      if (permitidos.includes(chave)) {
        sets.push(`${chave} = ?`);
        params.push(valor === '' ? null : valor);
      }
    }

    if (sets.length === 0) {
      return res.status(400).json({ erro: 'Nenhum campo válido para atualizar.' });
    }

    params.push(req.usuario.id);
    await db.execute(`UPDATE usuarios SET ${sets.join(', ')} WHERE id = ?`, params);

    return res.status(200).json({ mensagem: 'Perfil atualizado com sucesso!' });
  } catch (err) {
    if (err && err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ erro: 'E-mail ou telefone já está em uso por outra conta.' });
    }
    console.error('[usuarios.atualizarPerfil]', err);
    return res.status(500).json({ erro: 'Erro ao atualizar perfil.' });
  }
}

// ────────────────────────────────────────────────────────────────────────────
// DELETE /usuarios/me
// Desativa a própria conta (reutiliza a coluna `ativo` já existente, que
// também bloqueia o login — ver authController.login).
// ────────────────────────────────────────────────────────────────────────────
async function excluirConta(req, res) {
  try {
    await db.execute('UPDATE usuarios SET ativo = 0 WHERE id = ?', [req.usuario.id]);
    return res.status(200).json({ mensagem: 'Conta desativada com sucesso.' });
  } catch (err) {
    console.error('[usuarios.excluirConta]', err);
    return res.status(500).json({ erro: 'Erro ao excluir conta.' });
  }
}

module.exports = { meuPerfil, atualizarPerfil, excluirConta };
