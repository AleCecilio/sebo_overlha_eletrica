// backend/controllers/enderecosController.js
// CRUD de endereços do usuário autenticado — limite de 5 endereços por
// usuário (PARTE 5 do escopo).

const db = require('../config/db');

const LIMITE_ENDERECOS = 5;

// ────────────────────────────────────────────────────────────────────────────
// GET /enderecos
// Lista os endereços do usuário autenticado.
// ────────────────────────────────────────────────────────────────────────────
async function listar(req, res) {
  try {
    const [enderecos] = await db.execute(
      `SELECT id, cep, logradouro, numero, complemento, bairro, cidade, estado, principal
       FROM enderecos WHERE usuario_id = ? ORDER BY principal DESC, id ASC`,
      [req.usuario.id]
    );
    return res.status(200).json({ enderecos });
  } catch (err) {
    console.error('[enderecos.listar]', err);
    return res.status(500).json({ erro: 'Erro ao listar endereços.' });
  }
}

// ────────────────────────────────────────────────────────────────────────────
// POST /enderecos
// Cria um novo endereço para o usuário autenticado (máx. 5).
// ────────────────────────────────────────────────────────────────────────────
async function criar(req, res) {
  try {
    const { cep, logradouro, numero, complemento, bairro, cidade, estado, principal } = req.body;

    if (!cep || !logradouro || !numero || !bairro || !cidade || !estado) {
      return res.status(400).json({ erro: 'Preencha CEP, logradouro, número, bairro, cidade e estado.' });
    }

    const [countRows] = await db.execute(
      'SELECT COUNT(*) AS total FROM enderecos WHERE usuario_id = ?',
      [req.usuario.id]
    );
    if (Number(countRows[0].total) >= LIMITE_ENDERECOS) {
      return res.status(409).json({ erro: `Limite de ${LIMITE_ENDERECOS} endereços por usuário atingido.` });
    }

    if (principal) {
      await db.execute('UPDATE enderecos SET principal = 0 WHERE usuario_id = ?', [req.usuario.id]);
    }

    const [result] = await db.execute(
      `INSERT INTO enderecos (usuario_id, cep, logradouro, numero, complemento, bairro, cidade, estado, principal)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.usuario.id, cep, logradouro, numero, complemento || null, bairro, cidade, estado.toUpperCase(), principal ? 1 : 0]
    );

    return res.status(201).json({ mensagem: 'Endereço cadastrado com sucesso!', id: result.insertId });
  } catch (err) {
    console.error('[enderecos.criar]', err);
    return res.status(500).json({ erro: 'Erro ao cadastrar endereço.' });
  }
}

// ────────────────────────────────────────────────────────────────────────────
// PUT /enderecos/:id
// Atualiza um endereço, desde que pertença ao usuário autenticado.
// ────────────────────────────────────────────────────────────────────────────
async function atualizar(req, res) {
  try {
    const { id } = req.params;
    const permitidos = ['cep', 'logradouro', 'numero', 'complemento', 'bairro', 'cidade', 'estado', 'principal'];

    const sets   = [];
    const params = [];
    for (const [chave, valor] of Object.entries(req.body || {})) {
      if (permitidos.includes(chave)) {
        sets.push(`${chave} = ?`);
        params.push(chave === 'estado' && valor ? String(valor).toUpperCase() : valor);
      }
    }
    if (sets.length === 0) {
      return res.status(400).json({ erro: 'Nenhum campo válido para atualizar.' });
    }

    if (req.body && req.body.principal) {
      await db.execute('UPDATE enderecos SET principal = 0 WHERE usuario_id = ?', [req.usuario.id]);
    }

    params.push(id, req.usuario.id);
    const [result] = await db.execute(
      `UPDATE enderecos SET ${sets.join(', ')} WHERE id = ? AND usuario_id = ?`,
      params
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ erro: 'Endereço não encontrado.' });
    }
    return res.status(200).json({ mensagem: 'Endereço atualizado com sucesso!' });
  } catch (err) {
    console.error('[enderecos.atualizar]', err);
    return res.status(500).json({ erro: 'Erro ao atualizar endereço.' });
  }
}

// ────────────────────────────────────────────────────────────────────────────
// DELETE /enderecos/:id
// ────────────────────────────────────────────────────────────────────────────
async function deletar(req, res) {
  try {
    const { id } = req.params;
    const [result] = await db.execute(
      'DELETE FROM enderecos WHERE id = ? AND usuario_id = ?',
      [id, req.usuario.id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ erro: 'Endereço não encontrado.' });
    }
    return res.status(200).json({ mensagem: 'Endereço removido com sucesso.' });
  } catch (err) {
    console.error('[enderecos.deletar]', err);
    return res.status(500).json({ erro: 'Erro ao remover endereço.' });
  }
}

module.exports = { listar, criar, atualizar, deletar, LIMITE_ENDERECOS };
