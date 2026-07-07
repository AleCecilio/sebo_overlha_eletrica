// backend/scripts/preencherCapas.js
// PARTE 2 do escopo: preenche automaticamente a capa (imagem_url) de livros
// que estejam sem capa, usando a API pública da Open Library — primeiro por
// ISBN (mais preciso) e, na falta de resultado, por busca de título+autor.
// Não exige cadastro manual de capa por capa.
//
// Uso:
//   node backend/scripts/preencherCapas.js
//   (ou "npm run capas" dentro da pasta backend/)
//
// Critério de sucesso do escopo: pelo menos 90% dos livros com capa.

require('dotenv').config();
const db = require('../config/db');

const OPENLIBRARY_ISBN_COVER = (isbn) => `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`;

async function existeCapaValida(url) {
  try {
    const res = await fetch(url, { method: 'GET' });
    if (!res.ok) return false;
    // A Open Library retorna uma imagem "sem capa" de 1x1 px (43 bytes)
    // quando o ISBN não tem capa cadastrada — descartamos esse caso.
    const buffer = Buffer.from(await res.arrayBuffer());
    return buffer.length > 100;
  } catch (_err) {
    return false;
  }
}

async function buscarCapaPorTituloAutor(titulo, autor) {
  try {
    const query = encodeURIComponent(`${titulo} ${autor}`);
    const res = await fetch(`https://openlibrary.org/search.json?q=${query}&limit=1`);
    if (!res.ok) return null;
    const data = await res.json();
    const doc = data.docs && data.docs[0];
    if (doc && doc.cover_i) {
      return `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg`;
    }
    return null;
  } catch (_err) {
    return null;
  }
}

async function preencherCapas() {
  const [livros] = await db.execute(
    `SELECT id, titulo, autor, isbn, imagem_url FROM livros WHERE ativo = 1`
  );

  const semCapa = livros.filter(l => !l.imagem_url);
  console.log(`Total de livros: ${livros.length} | Sem capa: ${semCapa.length}`);

  let atualizados = 0;

  for (const livro of semCapa) {
    let urlEncontrada = null;

    if (livro.isbn) {
      const urlIsbn = OPENLIBRARY_ISBN_COVER(livro.isbn.replace(/\D/g, ''));
      if (await existeCapaValida(urlIsbn)) {
        urlEncontrada = urlIsbn;
      }
    }

    if (!urlEncontrada) {
      urlEncontrada = await buscarCapaPorTituloAutor(livro.titulo, livro.autor);
    }

    if (urlEncontrada) {
      await db.execute('UPDATE livros SET imagem_url = ? WHERE id = ?', [urlEncontrada, livro.id]);
      atualizados++;
      console.log(`✅ Capa definida para "${livro.titulo}"`);
    } else {
      console.log(`⚠️  Nenhuma capa encontrada para "${livro.titulo}" — mantenha manualmente, se necessário.`);
    }
  }

  const totalComCapa = livros.length - semCapa.length + atualizados;
  const percentual = livros.length ? ((totalComCapa / livros.length) * 100).toFixed(1) : '0.0';
  console.log(`\nResultado: ${totalComCapa}/${livros.length} livros com capa (${percentual}%).`);

  process.exit(0);
}

preencherCapas().catch(err => {
  console.error('Erro ao preencher capas:', err);
  process.exit(1);
});
