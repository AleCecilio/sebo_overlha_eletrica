-- ============================================================
-- SEBO OVELHA ELÉTRICA - Migração de Expansão de Funcionalidades
-- Disciplina: Programação II - Web | UEMG - Unidade Passos
--
-- Este script NÃO recria nada que já existe: apenas adiciona o que é
-- necessário para suportar o novo escopo (correções + expansões),
-- preservando a estrutura e os dados já criados pelos scripts:
--   1) 01_criacao_banco.sql
--   2) 02_insercao_livros.sql
--   3) 03_insercao_usuarios_teste.sql
--
-- Execute este arquivo DEPOIS dos três acima. Pode ser executado mais
-- de uma vez sem erro (usa IF NOT EXISTS / verificações condicionais).
-- ============================================================

USE sebo_online;

-- ============================================================
-- 1) usuarios.foto_url — foto de perfil do cliente/admin (PARTE 6/7)
--    Guardada como URL (mesmo padrão já usado para capas de livro),
--    sem exigir upload de arquivo/multer no back-end.
-- ============================================================
SET @coluna_existe = (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = 'sebo_online' AND TABLE_NAME = 'usuarios' AND COLUMN_NAME = 'foto_url'
);
SET @sql_add_foto = IF(@coluna_existe = 0,
  'ALTER TABLE usuarios ADD COLUMN foto_url VARCHAR(500) NULL AFTER senha_hash',
  'SELECT 1');
PREPARE stmt FROM @sql_add_foto;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ============================================================
-- 2) tabela: avaliacoes — comentários + notas dos livros (PARTE 9)
--    Um usuário só pode ter 1 avaliação por livro (UNIQUE), o que evita
--    duplicidade e transforma reenvio em atualização (ver
--    comentariosController.js).
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

CREATE INDEX idx_aval_livro ON avaliacoes(livro_id, criado_em);

-- ============================================================
-- 3) Endereços dos dois usuários de teste (PARTE 5)
--    A tabela `enderecos` já suporta múltiplos endereços por usuário
--    (nenhuma alteração estrutural necessária); apenas garantimos que
--    os dois usuários de teste já tenham ao menos um endereço válido.
--    Usa subconsultas por e-mail (e não por ID fixo) para funcionar
--    independentemente da ordem de inserção.
-- ============================================================
INSERT INTO enderecos (usuario_id, cep, logradouro, numero, complemento, bairro, cidade, estado, principal)
SELECT u.id, '37900-000', 'Rua Marechal Deodoro', '120', NULL, 'Centro', 'Passos', 'MG', 1
FROM usuarios u
WHERE u.email = 'cliente@seboovelhaeletrica.com'
  AND NOT EXISTS (SELECT 1 FROM enderecos e WHERE e.usuario_id = u.id);

INSERT INTO enderecos (usuario_id, cep, logradouro, numero, complemento, bairro, cidade, estado, principal)
SELECT u.id, '37900-100', 'Avenida Doutor Rasi', '450', 'Sala 2', 'Vila Marial', 'Passos', 'MG', 1
FROM usuarios u
WHERE u.email = 'administrador@seboovelhaeletrica.com'
  AND NOT EXISTS (SELECT 1 FROM enderecos e WHERE e.usuario_id = u.id);

-- ============================================================
-- FIM DA MIGRAÇÃO
-- ============================================================
