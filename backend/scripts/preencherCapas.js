// backend/scripts/preencherCapas.js
// Preenche automaticamente a capa (imagem_url) de livros sem capa, usando a
// API pública da Open Library.
//
// CORREÇÃO: a versão anterior tentava primeiro achar a capa pelo ISBN
// cadastrado — e quase todos os livros ficavam sem capa, porque o ISBN de
// uma edição específica raramente bate exatamente com o que a Open Library
// tem indexado. Agora a busca por título + autor é a estratégia principal
// (muito mais tolerante e com taxa de acerto bem maior para obras famosas,
// que é justamente o critério usado para montar o catálogo — ver
// db/02_insercao_livros.sql), e o ISBN só é usado como confirmação extra
// quando disponível.
//
// Uso:
//   node backend/scripts/preencherCapas.js
//   (ou "npm run capas" dentro da pasta backend/)

require('dotenv').config();
const db = require('../config/db');

async function buscarCapaPorTituloAutor(titulo, autor) {
  try {
    const query = encodeURIComponent(`${titulo} ${autor}`);
    const res = await fetch(`https://openlibrary.org/search.json?q=${query}&limit=1&fields=cover_i,title`);
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

async function existeCapaValida(url) {
  try {
    const res = await fetch(url, { method: 'GET' });
    if (!res.ok) return false;
    // A Open Library retorna uma imagem "placeholder" minúscula quando o
    // ISBN não tem capa cadastrada — descartamos esse caso.
    const buffer = Buffer.from(await res.arrayBuffer());
    return buffer.length > 100;
  } catch (_err) {
    return false;
  }
}

async function buscarCapaPorIsbn(isbn) {
  const url = `https://covers.openlibrary.org/b/isbn/${isbn.replace(/\D/g, '')}-L.jpg`;
  return (await existeCapaValida(url)) ? url : null;
}

async function preencherCapas() {
  const [livros] = await db.execute(
    `SELECT id, titulo, autor, isbn, imagem_url FROM livros WHERE ativo = 1`
  );

  const semCapa = livros.filter(l => !l.imagem_url);
  console.log(`Total de livros: ${livros.length} | Sem capa: ${semCapa.length}`);

  let atualizados = 0;

  for (const livro of semCapa) {
    // 1) Título + autor primeiro (mais confiável para obras famosas)
    let urlEncontrada = await buscarCapaPorTituloAutor(livro.titulo, livro.autor);

    // 2) ISBN como alternativa, se cadastrado e a busca acima falhar
    if (!urlEncontrada && livro.isbn) {
      urlEncontrada = await buscarCapaPorIsbn(livro.isbn);
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
