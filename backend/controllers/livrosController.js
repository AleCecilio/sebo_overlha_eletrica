// backend/controllers/livrosController.js
// CRUD de livros — rotas públicas e protegidas (ADMIN)

const db = require('../config/db');

// ────────────────────────────────────────────────────────────────────────────
// GET /listar
// Catálogo público com filtros opcionais via query string:
//   ?busca=termo&genero=Fantasia&conservacao=Bom&pagina=1&limite=12
// ────────────────────────────────────────────────────────────────────────────
async function listar(req, res) {
  try {
    const busca       = req.query.busca       || null;
    const genero      = req.query.genero      || null;
    const conservacao = req.query.conservacao || null;
    const pagina      = Math.max(1, parseInt(req.query.pagina)  || 1);
    const limite      = Math.min(100, parseInt(req.query.limite) || 12);
    const offset      = (pagina - 1) * limite;

    const params    = [];
    const condicoes = ['l.ativo = 1', 'l.estoque > 0'];

    if (busca) {
      condicoes.push('(l.titulo LIKE ? OR l.autor LIKE ? OR l.isbn LIKE ?)');
      const termo = `%${busca}%`;
      params.push(termo, termo, termo);
    }
    if (genero) {
      condicoes.push('l.genero = ?');
      params.push(genero);
    }
    if (conservacao) {
      condicoes.push('l.conservacao = ?');
      params.push(conservacao);
    }

    const where = `WHERE ${condicoes.join(' AND ')}`;

    // COUNT — usa execute normalmente (sem LIMIT/OFFSET)
    const [countRows] = await db.execute(
      `SELECT COUNT(*) AS total FROM livros l ${where}`,
      params
    );
    const total = Number(countRows[0].total);

    // Listagem — parâmetros de paginação interpolados diretamente
    // (valores já são inteiros validados acima, sem risco de injeção)
    const [livros] = await db.execute(
      `SELECT id, titulo, autor, genero, conservacao, preco, estoque, imagem_url, ano_publicacao
       FROM livros l ${where}
       ORDER BY criado_em DESC
       LIMIT ${limite} OFFSET ${offset}`,
      params
    );

    return res.status(200).json({
      total,
      pagina,
      limite,
      paginas: Math.ceil(total / limite),
      livros,
    });

  } catch (err) {
    console.error('[listar]', err);
    return res.status(500).json({ erro: 'Erro ao listar livros.' });
  }
}

// ────────────────────────────────────────────────────────────────────────────
// GET /buscar/:id
// ────────────────────────────────────────────────────────────────────────────
async function buscarPorId(req, res) {
  try {
    const { id } = req.params;

    const [rows] = await db.execute(
      `SELECT * FROM livros WHERE id = ? AND ativo = 1 LIMIT 1`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ erro: 'Livro não encontrado.' });
    }

    return res.status(200).json({ livro: rows[0] });

  } catch (err) {
    console.error('[buscarPorId]', err);
    return res.status(500).json({ erro: 'Erro ao buscar livro.' });
  }
}

// ────────────────────────────────────────────────────────────────────────────
// POST /salvar  [ADMIN]
// ────────────────────────────────────────────────────────────────────────────
async function salvar(req, res) {
  try {
    const {
      titulo, autor, isbn, editora, ano_publicacao,
      genero, sinopse, conservacao, preco, estoque, imagem_url
    } = req.body;

    if (!titulo || !autor || !preco || !conservacao) {
      return res.status(400).json({ erro: 'Campos obrigatórios: titulo, autor, preco, conservacao.' });
    }

    const conservacoesValidas = ['Novo', 'Ótimo', 'Bom', 'Regular', 'Com Defeito'];
    if (!conservacoesValidas.includes(conservacao)) {
      return res.status(400).json({ erro: `Estado de conservação inválido. Use: ${conservacoesValidas.join(', ')}.` });
    }

    const [result] = await db.execute(
      `INSERT INTO livros
         (titulo, autor, isbn, editora, ano_publicacao, genero, sinopse, conservacao, preco, estoque, imagem_url)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [titulo, autor, isbn || null, editora || null, ano_publicacao || null,
       genero || null, sinopse || null, conservacao,
       parseFloat(preco), parseInt(estoque) || 1, imagem_url || null]
    );

    return res.status(201).json({
      mensagem: 'Livro cadastrado com sucesso!',
      id: result.insertId,
    });

  } catch (err) {
    console.error('[salvar]', err);
    return res.status(500).json({ erro: 'Erro ao cadastrar livro.' });
  }
}

// ────────────────────────────────────────────────────────────────────────────
// PUT /editar/:id  [ADMIN]
// ────────────────────────────────────────────────────────────────────────────
async function editar(req, res) {
  try {
    const { id } = req.params;
    const campos = req.body;

    const permitidos = ['titulo','autor','isbn','editora','ano_publicacao',
                        'genero','sinopse','conservacao','preco','estoque','imagem_url','ativo'];

    const sets   = [];
    const params = [];

    for (const [chave, valor] of Object.entries(campos)) {
      if (permitidos.includes(chave)) {
        sets.push(`${chave} = ?`);
        params.push(valor);
      }
    }

    if (sets.length === 0) {
      return res.status(400).json({ erro: 'Nenhum campo válido para atualizar.' });
    }

    params.push(id);
    const [result] = await db.execute(
      `UPDATE livros SET ${sets.join(', ')} WHERE id = ?`,
      params
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ erro: 'Livro não encontrado.' });
    }

    return res.status(200).json({ mensagem: 'Livro atualizado com sucesso!' });

  } catch (err) {
    console.error('[editar]', err);
    return res.status(500).json({ erro: 'Erro ao atualizar livro.' });
  }
}

// ────────────────────────────────────────────────────────────────────────────
// DELETE /deletar/:id  [ADMIN]
// ────────────────────────────────────────────────────────────────────────────
async function deletar(req, res) {
  try {
    const { id } = req.params;

    const [result] = await db.execute(
      'UPDATE livros SET ativo = 0 WHERE id = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ erro: 'Livro não encontrado.' });
    }

    return res.status(200).json({ mensagem: 'Livro removido do catálogo com sucesso.' });

  } catch (err) {
    console.error('[deletar]', err);
    return res.status(500).json({ erro: 'Erro ao deletar livro.' });
  }
}

module.exports = { listar, buscarPorId, salvar, editar, deletar };
