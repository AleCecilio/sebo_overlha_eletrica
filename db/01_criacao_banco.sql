-- Garante que o cliente MySQL importe este arquivo como UTF-8, evitando
-- corrupção de acentos (títulos, nomes) quando o charset padrão do cliente
-- for latin1 (comum em muitas instalações/ferramentas).
SET NAMES utf8mb4;

-- ============================================================
-- SEBO OVELHA ELÉTRICA - Script de Criação do Banco de Dados
-- Disciplina: Programação II - Web | UEMG - Unidade Passos
--
-- Este script cria a estrutura COMPLETA do banco (banco + tabelas +
-- chaves + índices), incluindo os campos e tabelas que antes viviam
-- em uma migração separada (db/04_migracao_expansao.sql). Esse
-- arquivo foi absorvido aqui e não existe mais — a estrutura final
-- do banco agora fica pronta só com os 3 scripts abaixo, nesta ordem:
--
--   1) 01_criacao_banco.sql        (este arquivo)
--   2) 02_insercao_livros.sql
--   3) 03_insercao_usuarios_teste.sql
-- ============================================================

CREATE DATABASE IF NOT EXISTS sebo_online
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE sebo_online;

-- ============================================================
-- TABELA: usuarios
-- ============================================================
CREATE TABLE IF NOT EXISTS usuarios (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nome         VARCHAR(150)        NOT NULL,
  email        VARCHAR(255)        UNIQUE,
  cpf          VARCHAR(14)         UNIQUE,
  telefone     VARCHAR(20)         UNIQUE,
  senha_hash   VARCHAR(255),                        -- NULL para usuários Google
  foto_url     VARCHAR(500),                         -- foto de perfil (URL), opcional
  google_id    VARCHAR(255)        UNIQUE,
  perfil       ENUM('ADMIN','CLIENTE') NOT NULL DEFAULT 'CLIENTE',
  ativo        TINYINT(1)          NOT NULL DEFAULT 1,
  criado_em    DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
  atualizado_em DATETIME           NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ============================================================
-- TABELA: enderecos
-- ============================================================
CREATE TABLE IF NOT EXISTS enderecos (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  usuario_id   INT UNSIGNED        NOT NULL,
  cep          VARCHAR(9)          NOT NULL,
  logradouro   VARCHAR(255)        NOT NULL,
  numero       VARCHAR(20)         NOT NULL,
  complemento  VARCHAR(100),
  bairro       VARCHAR(100)        NOT NULL,
  cidade       VARCHAR(100)        NOT NULL,
  estado       CHAR(2)             NOT NULL,
  principal    TINYINT(1)          NOT NULL DEFAULT 0,
  CONSTRAINT fk_end_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================
-- TABELA: livros
-- ============================================================
CREATE TABLE IF NOT EXISTS livros (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  titulo          VARCHAR(255)     NOT NULL,
  autor           VARCHAR(255)     NOT NULL,
  isbn            VARCHAR(20),
  editora         VARCHAR(150),
  ano_publicacao  YEAR,
  genero          VARCHAR(100),
  sinopse         TEXT,
  conservacao     ENUM('Novo','Ótimo','Bom','Regular','Com Defeito') NOT NULL DEFAULT 'Bom',
  preco           DECIMAL(10,2)    NOT NULL,
  estoque         INT UNSIGNED     NOT NULL DEFAULT 1,
  imagem_url      VARCHAR(500),
  ativo           TINYINT(1)       NOT NULL DEFAULT 1,
  criado_em       DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP,
  atualizado_em   DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ============================================================
-- TABELA: pedidos
-- ============================================================
CREATE TABLE IF NOT EXISTS pedidos (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  usuario_id      INT UNSIGNED     NOT NULL,
  endereco_id     INT UNSIGNED,
  status          ENUM('PENDENTE','PAGO','ENVIADO','ENTREGUE','CANCELADO') NOT NULL DEFAULT 'PENDENTE',
  forma_pagamento ENUM('PIX','CARTAO')    NOT NULL,
  total           DECIMAL(10,2)    NOT NULL DEFAULT 0.00,
  criado_em       DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP,
  atualizado_em   DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_ped_usuario  FOREIGN KEY (usuario_id)  REFERENCES usuarios(id),
  CONSTRAINT fk_ped_endereco FOREIGN KEY (endereco_id) REFERENCES enderecos(id)
) ENGINE=InnoDB;

-- ============================================================
-- TABELA: itens_pedido
-- ============================================================
CREATE TABLE IF NOT EXISTS itens_pedido (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  pedido_id   INT UNSIGNED     NOT NULL,
  livro_id    INT UNSIGNED     NOT NULL,
  quantidade  INT UNSIGNED     NOT NULL DEFAULT 1,
  preco_unit  DECIMAL(10,2)    NOT NULL,
  CONSTRAINT fk_item_pedido FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE CASCADE,
  CONSTRAINT fk_item_livro  FOREIGN KEY (livro_id)  REFERENCES livros(id)
) ENGINE=InnoDB;

-- ============================================================
-- TABELA: avaliacoes
-- Comentários + notas dos livros. Um usuário só pode ter 1
-- avaliação por livro (UNIQUE) — reenviar atualiza a avaliação
-- existente em vez de duplicar (ver comentariosController.js).
-- ============================================================
CREATE TABLE IF NOT EXISTS avaliacoes (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  livro_id      INT UNSIGNED     NOT NULL,
  usuario_id    INT UNSIGNED     NOT NULL,
  nota          TINYINT UNSIGNED NOT NULL,
  comentario    TEXT             NOT NULL,
  criado_em     DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP,
  atualizado_em DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_aval_livro   FOREIGN KEY (livro_id)   REFERENCES livros(id)   ON DELETE CASCADE,
  CONSTRAINT fk_aval_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  CONSTRAINT uq_aval_livro_usuario UNIQUE (livro_id, usuario_id),
  CONSTRAINT chk_aval_nota CHECK (nota BETWEEN 1 AND 5)
) ENGINE=InnoDB;

-- ============================================================
-- TABELA: tokens_2fa
-- ============================================================
CREATE TABLE IF NOT EXISTS tokens_2fa (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  usuario_id  INT UNSIGNED     NOT NULL,
  codigo      CHAR(6)          NOT NULL,
  canal       ENUM('EMAIL','SMS') NOT NULL,
  usado       TINYINT(1)       NOT NULL DEFAULT 0,
  expira_em   DATETIME         NOT NULL,
  criado_em   DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_2fa_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================
-- ÍNDICES ADICIONAIS
-- ============================================================
CREATE INDEX idx_livros_titulo  ON livros(titulo);
CREATE INDEX idx_livros_autor   ON livros(autor);
CREATE INDEX idx_livros_genero  ON livros(genero);
CREATE INDEX idx_tokens_expira  ON tokens_2fa(expira_em);
CREATE INDEX idx_aval_livro     ON avaliacoes(livro_id, criado_em);
