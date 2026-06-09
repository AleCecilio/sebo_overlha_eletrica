#!/usr/bin/env python3
"""
Busca capas na Open Library para livros sem imagem_url no banco.

Uso:
    python3 db/buscar_capas.py
"""

import time
import urllib.request
import mysql.connector

# ── Configuração ────────────────────────────────────────────────
DB_CONFIG = {
    "host": "localhost",
    "user": "root",
    "password": "Moreira9922!",
    "database": "sebo_online",
}


def capa_existe(isbn):
    """
    Verifica se existe uma capa para o ISBN informado
    e retorna a URL da imagem.
    """
    if not isbn:
        return None

    isbn_limpo = str(isbn).replace("-", "").replace(" ", "").upper()

    if len(isbn_limpo) not in (10, 13):
        return None

    try:
        url = (
            f"https://covers.openlibrary.org/"
            f"b/isbn/{isbn_limpo}-M.jpg?default=false"
        )

        req = urllib.request.Request(
            url,
            headers={
                "User-Agent": "SeboOvelhaEletrica/1.0"
            }
        )

        with urllib.request.urlopen(req, timeout=10) as resp:
            data = resp.read(1024)

            if resp.status == 200 and len(data) > 100:
                return (
                    f"https://covers.openlibrary.org/"
                    f"b/isbn/{isbn_limpo}-M.jpg"
                )

    except Exception as e:
        print(f"Erro ISBN {isbn_limpo}: {e}")

    return None


def main():
    conn = mysql.connector.connect(**DB_CONFIG)
    cursor = conn.cursor()

    cursor.execute("""
        SELECT id, isbn
        FROM livros
        WHERE imagem_url IS NULL
          AND isbn IS NOT NULL
          AND isbn <> ''
    """)

    livros = cursor.fetchall()
    total = len(livros)

    print(f"{total} livros sem capa. Buscando...\n")

    atualizados = 0

    for i, (livro_id, isbn) in enumerate(livros, start=1):
        url = capa_existe(isbn)

        if url:
            cursor.execute(
                """
                UPDATE livros
                SET imagem_url = %s
                WHERE id = %s
                """,
                (url, livro_id)
            )

            atualizados += 1

        if i % 50 == 0:
            conn.commit()
            print(
                f"{i}/{total} verificados — "
                f"{atualizados} capas encontradas"
            )

        time.sleep(0.05)

    conn.commit()

    cursor.close()
    conn.close()

    print(
        f"\nConcluído! "
        f"{atualizados}/{total} livros atualizados com capa."
    )


if __name__ == "__main__":
    main()