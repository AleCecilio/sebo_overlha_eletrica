// backend/controllers/pedidosController.js
// Fluxo de Checkout: carrinho → endereço → pagamento → confirmação

const db = require('../config/db');

// ────────────────────────────────────────────────────────────────────────────
// POST /pedidos/checkout
// Finaliza o pedido, atualiza estoque e marca como PAGO
// Body: { itens: [{livro_id, quantidade}], endereco, forma_pagamento }
// ────────────────────────────────────────────────────────────────────────────
async function checkout(req, res) {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const { itens, endereco, forma_pagamento } = req.body;
    const usuario_id = req.usuario.id;

    // Validações básicas
    if (!itens || !Array.isArray(itens) || itens.length === 0) {
      return res.status(400).json({ erro: 'O carrinho está vazio.' });
    }
    if (!['PIX', 'CARTAO'].includes(forma_pagamento)) {
      return res.status(400).json({ erro: 'Forma de pagamento inválida. Use PIX ou CARTAO.' });
    }
    if (!endereco || !endereco.cep || !endereco.logradouro || !endereco.numero
        || !endereco.bairro || !endereco.cidade || !endereco.estado) {
      return res.status(400).json({ erro: 'Endereço completo é obrigatório para finalizar o pedido.' });
    }

    // Salva / busca endereço do usuário
    const [endResult] = await conn.execute(
      `INSERT INTO enderecos (usuario_id, cep, logradouro, numero, complemento, bairro, cidade, estado, principal)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)`,
      [usuario_id, endereco.cep, endereco.logradouro, endereco.numero,
       endereco.complemento || null, endereco.bairro, endereco.cidade, endereco.estado]
    );
    const endereco_id = endResult.insertId;

    // Verifica estoque e calcula total
    let total = 0;
    const itensProcessados = [];

    for (const item of itens) {
      const [livros] = await conn.execute(
        'SELECT id, titulo, preco, estoque FROM livros WHERE id = ? AND ativo = 1 FOR UPDATE',
        [item.livro_id]
      );

      if (livros.length === 0) {
        await conn.rollback();
        return res.status(404).json({ erro: `Livro ID ${item.livro_id} não encontrado.` });
      }

      const livro = livros[0];
      const qtd   = parseInt(item.quantidade) || 1;

      if (livro.estoque < qtd) {
        await conn.rollback();
        return res.status(409).json({
          erro: `Estoque insuficiente para "${livro.titulo}". Disponível: ${livro.estoque}.`
        });
      }

      total += parseFloat(livro.preco) * qtd;
      itensProcessados.push({ livro_id: livro.id, quantidade: qtd, preco_unit: livro.preco });
    }

    // Cria o pedido
    const [pedidoResult] = await conn.execute(
      `INSERT INTO pedidos (usuario_id, endereco_id, status, forma_pagamento, total)
       VALUES (?, ?, 'PAGO', ?, ?)`,
      [usuario_id, endereco_id, forma_pagamento, total.toFixed(2)]
    );
    const pedido_id = pedidoResult.insertId;

    // Insere itens e desconta estoque
    for (const item of itensProcessados) {
      await conn.execute(
        'INSERT INTO itens_pedido (pedido_id, livro_id, quantidade, preco_unit) VALUES (?, ?, ?, ?)',
        [pedido_id, item.livro_id, item.quantidade, item.preco_unit]
      );
      await conn.execute(
        'UPDATE livros SET estoque = estoque - ? WHERE id = ?',
        [item.quantidade, item.livro_id]
      );
    }

    await conn.commit();

    return res.status(201).json({
      mensagem: 'Pedido realizado com sucesso! Pagamento confirmado.',
      pedido_id,
      total:    parseFloat(total.toFixed(2)),
      status:   'PAGO',
      forma_pagamento,
    });

  } catch (err) {
    await conn.rollback();
    console.error('[checkout]', err);
    return res.status(500).json({ erro: 'Erro ao processar pedido.' });
  } finally {
    conn.release();
  }
}

// ────────────────────────────────────────────────────────────────────────────
// GET /pedidos/meus
// Lista pedidos do usuário autenticado
// ────────────────────────────────────────────────────────────────────────────
async function meusPedidos(req, res) {
  try {
    const [pedidos] = await db.execute(
      `SELECT p.id, p.status, p.forma_pagamento, p.total, p.criado_em,
              GROUP_CONCAT(l.titulo ORDER BY l.titulo SEPARATOR ' | ') AS livros
       FROM pedidos p
       JOIN itens_pedido ip ON ip.pedido_id = p.id
       JOIN livros l ON l.id = ip.livro_id
       WHERE p.usuario_id = ?
       GROUP BY p.id
       ORDER BY p.criado_em DESC`,
      [req.usuario.id]
    );

    return res.status(200).json({ pedidos });

  } catch (err) {
    console.error('[meusPedidos]', err);
    return res.status(500).json({ erro: 'Erro ao buscar pedidos.' });
  }
}

module.exports = { checkout, meusPedidos };
