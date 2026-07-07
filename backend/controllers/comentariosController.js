// backend/controllers/comentariosController.js
// Comentários e avaliações dos livros (PARTE 9 do escopo).
// Regra de exibição: se houver mais de 10 comentários, mostrar apenas os
// 5 mais recentes.

const db = require('../config/db');

// ────────────────────────────────────────────────────────────────────────────
// GET /livros/:id/comentarios
// ────────────────────────────────────────────────────────────────────────────
async function listar(req, res) {
  try {
    const { id } = req.params;

    const [totalRows] = await db.execute(
      'SELECT COUNT(*) AS total, AVG(nota) AS media FROM avaliacoes WHERE livro_id = ?',
      [id]
    );
    const total = Number(totalRows[0].total);
    const media = totalRows[0].media ? Number(totalRows[0].media) : null;

    // Se houver mais de 10 comentários, mostra apenas os 5 mais recentes.
    const limite = total > 10 ? 5 : total;

    const [comentarios] = limite > 0
      ? await db.execute(
          `SELECT a.id, a.nota, a.comentario, a.criado_em, u.nome AS usuario_nome
           FROM avaliacoes a
           JOIN usuarios u ON u.id = a.usuario_id
           WHERE a.livro_id = ?
           ORDER BY a.criado_em DESC
           LIMIT ${limite}`,
          [id]
        )
      : [[]];

    return res.status(200).json({ total, media, comentarios });
  } catch (err) {
    console.error('[comentarios.listar]', err);
    return res.status(500).json({ erro: 'Erro ao carregar comentários.' });
  }
}

// ────────────────────────────────────────────────────────────────────────────
// POST /livros/:id/comentarios  [autenticado]
// Body: { nota (1-5), comentario }
// Um usuário só pode ter uma avaliação por livro — reenviar atualiza a
// avaliação existente, mantendo a página simples e evitando duplicidade.
// ────────────────────────────────────────────────────────────────────────────
async function criar(req, res) {
  try {
    const { id } = req.params;
    const { nota, comentario } = req.body;

    const notaNum = parseInt(nota);
    if (!notaNum || notaNum < 1 || notaNum > 5) {
      return res.status(400).json({ erro: 'A avaliação deve ser uma nota de 1 a 5.' });
    }
    if (!comentario || !comentario.trim()) {
      return res.status(400).json({ erro: 'O comentário não pode ficar vazio.' });
    }

    const [livros] = await db.execute('SELECT id FROM livros WHERE id = ? AND ativo = 1', [id]);
    if (livros.length === 0) {
      return res.status(404).json({ erro: 'Livro não encontrado.' });
    }

    await db.execute(
      `INSERT INTO avaliacoes (livro_id, usuario_id, nota, comentario)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE nota = VALUES(nota), comentario = VALUES(comentario)`,
      [id, req.usuario.id, notaNum, comentario.trim()]
    );

    return res.status(201).json({ mensagem: 'Avaliação registrada com sucesso!' });
  } catch (err) {
    console.error('[comentarios.criar]', err);
    return res.status(500).json({ erro: 'Erro ao registrar avaliação.' });
  }
}

module.exports = { listar, criar };
