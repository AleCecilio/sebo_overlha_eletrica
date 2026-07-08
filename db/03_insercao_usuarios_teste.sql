-- Garante que o cliente MySQL importe este arquivo como UTF-8, evitando
-- corrupção de acentos (títulos, nomes) quando o charset padrão do cliente
-- for latin1 (comum em muitas instalações/ferramentas).
SET NAMES utf8mb4;

-- ============================================================
-- SEBO OVELHA ELÉTRICA - Usuários de Teste
-- Disciplina: Programação II - Web | UEMG - Unidade Passos
--
-- Script separado para popular a tabela `usuarios` com duas
-- contas genéricas de teste: uma CLIENTE e uma ADMIN.
-- As senhas estão em hash bcrypt (12 rounds), no mesmo padrão
-- já usado pelo projeto (ver backend/gerar-hash.js).
--
-- Credenciais em texto puro (apenas para uso em ambiente de
-- desenvolvimento/teste):
--   Cliente        -> e-mail: cliente@seboovelhaeletrica.com        | senha: cliente123
--   Administrador  -> e-mail: administrador@seboovelhaeletrica.com  | senha: admin123
--
-- O login do sistema aceita e-mail, CPF ou telefone + senha,
-- seguido da etapa de 2FA simulada (o código é exibido no
-- console do backend e retornado em `codigo_dev` quando
-- NODE_ENV=development).
--
-- Execute depois de 01_criacao_banco.sql (a tabela usuarios
-- precisa existir). Pode ser executado antes ou depois de
-- 02_insercao_livros.sql, pois não há relação entre as tabelas.
-- ============================================================

USE sebo_online;

INSERT INTO usuarios (nome, email, cpf, telefone, senha_hash, perfil, ativo) VALUES
(
  'Cliente',
  'cliente@seboovelhaeletrica.com',
  '111.222.333-96',
  '(35) 99000-1111',
  '$2b$12$o9RuyhGgTXVE3Yke9BV3I.4pJ4pq9issFqPjgcqxNVcFeLdKOdFT6', -- senha: cliente123
  'CLIENTE',
  1
),
(
  'Administrador',
  'administrador@seboovelhaeletrica.com',
  '444.555.666-19',
  '(35) 99000-2222',
  '$2b$12$ztPI2V.j8FKz421iKBVuteFBmCW1ufgDaiuudGhduIVULsK1jLL5S', -- senha: admin123
  'ADMIN',
  1
);
