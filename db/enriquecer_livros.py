#!/usr/bin/env python3

import json
import time
import urllib.request
import mysql.connector

DB_CONFIG = {
    "host": "localhost",
    "user": "root",
    "password": "Moreira9922!",
    "database": "sebo_online",
}


def buscar_dados_openlibrary(isbn):
    isbn = str(isbn).replace("-", "").replace(" ", "").upper()

    try:
        url = f"https://openlibrary.org/isbn/{isbn}.json"

        req = urllib.request.Request(
            url,
            headers={"User-Agent": "SeboOvelhaEletrica/1.0"}
        )

        with urllib.request.urlopen(req, timeout=10) as resp:
            return json.loads(resp.read().decode("utf-8"))
        
    except Exception as e:
        print(f"Erro ISBN {isbn}: {e}")
        return None


def extrair_editora(dados):
    publishers = dados.get("publishers")

    if not publishers:
        return None

    if isinstance(publishers, list):
        return publishers[0][:150]

    return str(publishers)[:150]


def extrair_ano(dados):
    data_pub = dados.get("publish_date")

    if not data_pub:
        return None

    import re

    anos = re.findall(r"\b(18\d{2}|19\d{2}|20\d{2})\b", data_pub)

    if anos:
        return int(anos[-1])

    return None


def extrair_sinopse(dados):
    descricao = dados.get("description")

    if not descricao:
        return None

    if isinstance(descricao, str):
        return descricao[:5000]

    if isinstance(descricao, dict):
        return descricao.get("value", "")[:5000]

    return None


def main():
    conn = mysql.connector.connect(**DB_CONFIG)
    cursor = conn.cursor()

    cursor.execute("""
        SELECT id, isbn
        FROM livros
        WHERE isbn IS NOT NULL
          AND isbn <> ''
    """)

    livros = cursor.fetchall()

    total = len(livros)

    print(f"\n{total} livros encontrados.\n")

    atualizados = 0

    for i, (livro_id, isbn) in enumerate(livros, start=1):

        dados = buscar_dados_openlibrary(isbn)
        if i % 10 == 0:
            print(f"{i}/{total}")

        if not dados:
            continue

        editora = extrair_editora(dados)
        ano = extrair_ano(dados)
        sinopse = extrair_sinopse(dados)

        cursor.execute("""
            UPDATE livros
            SET
                editora = COALESCE(editora, %s),
                ano_publicacao = COALESCE(ano_publicacao, %s),
                sinopse = COALESCE(sinopse, %s)
            WHERE id = %s
        """, (
            editora,
            ano,
            sinopse,
            livro_id
        ))

        atualizados += 1

        if i % 25 == 0:
            conn.commit()

            print(
                f"{i}/{total} processados - "
                f"{atualizados} atualizados"
            )

        time.sleep(0)

    conn.commit()

    cursor.close()
    conn.close()

    print(
        f"\nConcluído! "
        f"{atualizados} livros enriquecidos."
    )


if __name__ == "__main__":
    main()