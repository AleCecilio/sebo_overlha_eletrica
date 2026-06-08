#!/usr/bin/env python3
"""
db/gerar_inserts.py
Gera INSERTs SQL para a tabela `livros` a partir de um CSV do Kaggle.

Datasets suportados (ambos disponíveis no Kaggle):
  - jealousleopard/goodreadsbooks  (books.csv)
  - dylanjcastillo/7k-books-with-metadata (books_with_metadata.csv)

Uso:
    python3 db/gerar_inserts.py caminho/para/books.csv

Saída:
    db/livros_inserts.sql

Depois importe:
    mysql -u root -p sebo_online < db/livros_inserts.sql
"""

import csv
import sys
import os
import re
import random

# ── Mapeamento de conservação aleatória para simular estoque usado ──────────
CONSERVACOES = ['Novo', 'Ótimo', 'Bom', 'Regular', 'Com Defeito']
PESOS        = [0.10,   0.25,   0.40,  0.20,       0.05]

def conservacao_aleatoria():
    return random.choices(CONSERVACOES, weights=PESOS, k=1)[0]

def preco_aleatorio(conservacao):
    """Gera preço baseado no estado de conservação."""
    faixas = {
        'Novo':       (35.0, 80.0),
        'Ótimo':      (20.0, 50.0),
        'Bom':        (12.0, 35.0),
        'Regular':    (5.0,  18.0),
        'Com Defeito':(2.0,  10.0),
    }
    lo, hi = faixas[conservacao]
    return round(random.uniform(lo, hi), 2)

def escape_sql(valor):
    """Escapa aspas simples para SQL."""
    if valor is None:
        return 'NULL'
    return "'" + str(valor).replace("'", "''").replace("\\", "\\\\")[:500] + "'"

def detectar_colunas(cabecalho):
    """Detecta automaticamente quais colunas do CSV mapear."""
    h = [c.lower().strip() for c in cabecalho]
    mapa = {}

    candidatos = {
        'titulo':     ['title', 'titulo', 'book_title', 'name'],
        'autor':      ['authors', 'author', 'autor', 'writer'],
        'isbn':       ['isbn', 'isbn13', 'isbn10'],
        'editora':    ['publisher', 'editora', 'published_by'],
        'ano':        ['publication_date', 'year', 'published_year', 'publish_year', 'ano'],
        'genero':     ['genre', 'genero', 'categories', 'subject'],
        'sinopse':    ['description', 'sinopse', 'synopsis', 'summary', 'about'],
        'imagem_url': ['image_url', 'thumbnail', 'cover', 'imagem_url', 'cover_image', 'book_image'],
        'avaliacao':  ['average_rating', 'rating', 'nota'],
    }

    for campo, opcoes in candidatos.items():
        for opcao in opcoes:
            if opcao in h:
                mapa[campo] = cabecalho[h.index(opcao)]
                break

    return mapa

def extrair_ano(valor):
    """Extrai apenas o ano de strings como '1/1/2003'."""
    if not valor:
        return None
    match = re.search(r'\b(1[89]\d{2}|20[012]\d)\b', str(valor))
    return int(match.group(1)) if match else None

def gerar_inserts(arquivo_csv, arquivo_saida, limite=500):
    with open(arquivo_csv, newline='', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        cabecalho = reader.fieldnames
        mapa = detectar_colunas(cabecalho)

        print(f"Colunas detectadas: {mapa}")

        if 'titulo' not in mapa or 'autor' not in mapa:
            print("ERRO: Não foi possível detectar colunas de título e autor.")
            print(f"Colunas disponíveis: {cabecalho}")
            sys.exit(1)

        inserts = []
        ignorados = 0

        for i, row in enumerate(reader):
            if len(inserts) >= limite:
                break

            titulo = row.get(mapa.get('titulo', ''), '').strip()
            autor  = row.get(mapa.get('autor',  ''), '').strip()

            # Pula linhas sem dados essenciais
            if not titulo or not autor or titulo == 'N/A':
                ignorados += 1
                continue

            isbn       = row.get(mapa.get('isbn', ''), '').strip() or None
            editora    = row.get(mapa.get('editora', ''), '').strip() or None
            ano_raw    = row.get(mapa.get('ano', ''), '').strip()
            ano        = extrair_ano(ano_raw)
            genero     = row.get(mapa.get('genero', ''), '').strip() or None
            sinopse    = row.get(mapa.get('sinopse', ''), '').strip() or None
            imagem_url = row.get(mapa.get('imagem_url', ''), '').strip() or None

            conservacao = conservacao_aleatoria()
            preco       = preco_aleatorio(conservacao)
            estoque     = random.randint(1, 8)

            # Trunca sinopse longa
            if sinopse and len(sinopse) > 1000:
                sinopse = sinopse[:997] + '...'

            sql = (
                f"INSERT INTO livros "
                f"(titulo, autor, isbn, editora, ano_publicacao, genero, sinopse, "
                f"conservacao, preco, estoque, imagem_url) VALUES ("
                f"{escape_sql(titulo[:255])}, "
                f"{escape_sql(autor[:255])}, "
                f"{escape_sql(isbn)}, "
                f"{escape_sql(editora[:150] if editora else None)}, "
                f"{ano if ano else 'NULL'}, "
                f"{escape_sql(genero[:100] if genero else None)}, "
                f"{escape_sql(sinopse)}, "
                f"'{conservacao}', "
                f"{preco}, "
                f"{estoque}, "
                f"{escape_sql(imagem_url)}"
                f");"
            )
            inserts.append(sql)

    with open(arquivo_saida, 'w', encoding='utf-8') as out:
        out.write("-- Gerado automaticamente por db/gerar_inserts.py\n")
        out.write(f"-- Total de registros: {len(inserts)}\n")
        out.write("USE sebo_online;\n\n")
        out.write('\n'.join(inserts))
        out.write('\n')

    print(f"\nConcluido!")
    print(f"  Inseridos : {len(inserts)}")
    print(f"  Ignorados : {ignorados}")
    print(f"  Arquivo   : {arquivo_saida}")
    print(f"\nPara importar:")
    print(f"  mysql -u root -p sebo_online < {arquivo_saida}")


if __name__ == '__main__':
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(0)

    csv_path = sys.argv[1]
    limite   = int(sys.argv[2]) if len(sys.argv) > 2 else 500

    if not os.path.exists(csv_path):
        print(f"ERRO: Arquivo não encontrado: {csv_path}")
        sys.exit(1)

    saida = os.path.join(os.path.dirname(__file__), 'livros_inserts.sql')
    gerar_inserts(csv_path, saida, limite)
