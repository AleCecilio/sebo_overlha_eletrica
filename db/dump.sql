-- ============================================================
-- SEBO ONLINE - Dump Completo do Banco de Dados
-- Disciplina: Programação II - Web | UEMG - Unidade Passos
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
  capa_url        VARCHAR(500),
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

-- ============================================================
-- DADOS INICIAIS
-- ============================================================

-- Senha: Admin@123 (bcrypt hash)
INSERT INTO usuarios (nome, email, cpf, telefone, senha_hash, perfil) VALUES
(
  'Administrador',
  'admin@seboonline.com',
  '529.982.247-25',
  '(35) 99000-0001',
  '$2b$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- Admin@123
  'ADMIN'
),
(
  'Alessandro Cecilio',
  'alessandro@email.com',
  '987.654.321-00',
  '(35) 99111-2222',
  '$2b$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- Admin@123
  'CLIENTE'
),
(
  'João Paulo Borges',
  'joaopaulo@email.com',
  '123.456.789-09',
  '(35) 99333-4444',
  '$2b$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
  'CLIENTE'
);

INSERT INTO enderecos (usuario_id, cep, logradouro, numero, bairro, cidade, estado, principal) VALUES
(2, '37902-144', 'Rua das Flores', '42', 'Centro', 'Passos', 'MG', 1),
(3, '37901-000', 'Av. Getúlio Vargas', '100', 'Bairro Novo', 'Passos', 'MG', 1);

INSERT INTO livros (titulo, autor, isbn, editora, ano_publicacao, genero, sinopse, conservacao, preco, estoque, capa_url) VALUES
(
  'Dom Casmurro',
  'Machado de Assis',
  '978-8503008273',
  'L&PM Pocket',
  2006,
  'Romance',
  'Clássico da literatura brasileira que narra a história de Bentinho e Capitu, levantando a questão da traição e dos ciúmes no século XIX.',
  'Bom',
  12.90,
  3,
  'https://m.media-amazon.com/images/I/71rJNZ7KNRL._AC_UF1000,1000_QL80_.jpg'
),
(
  'O Senhor dos Anéis: A Sociedade do Anel',
  'J.R.R. Tolkien',
  '978-8578276195',
  'Martins Fontes',
  2019,
  'Fantasia',
  'A jornada épica de Frodo Bolseiro para destruir o Um Anel e salvar a Terra Média das garras do Senhor das Trevas Sauron.',
  'Ótimo',
  39.90,
  2,
  'https://m.media-amazon.com/images/I/71jLBXtWJWL._AC_UF1000,1000_QL80_.jpg'
),
(
  '1984',
  'George Orwell',
  '978-8535914849',
  'Companhia das Letras',
  2009,
  'Distopia',
  'Em um futuro sombrio, Winston Smith vive sob o domínio totalitário do Grande Irmão e tenta resistir ao sistema opressor.',
  'Regular',
  18.50,
  5,
  'https://m.media-amazon.com/images/I/71kxa2Wy03L._AC_UF1000,1000_QL80_.jpg'
),
(
  'O Pequeno Príncipe',
  'Antoine de Saint-Exupéry',
  '978-8574480929',
  'Agir',
  2015,
  'Infantojuvenil',
  'Um piloto perdido no Saara conhece um menino misterioso vindo de outro planeta, e juntos exploram lições sobre a vida e os relacionamentos.',
  'Novo',
  22.00,
  10,
  'https://m.media-amazon.com/images/I/71OZY035QKL._AC_UF1000,1000_QL80_.jpg'
),
(
  'Sapiens: Uma Breve História da Humanidade',
  'Yuval Noah Harari',
  '978-8525432186',
  'L&PM',
  2015,
  'História',
  'Uma narrativa fascinante sobre a trajetória do Homo sapiens desde a Idade da Pedra até a era moderna.',
  'Bom',
  34.90,
  4,
  'https://m.media-amazon.com/images/I/71N3lDSKZUL._AC_UF1000,1000_QL80_.jpg'
),
(
  'Harry Potter e a Pedra Filosofal',
  'J.K. Rowling',
  '978-8532530783',
  'Rocco',
  2017,
  'Fantasia',
  'Harry Potter descobre que é um bruxo e ingressa na Escola de Magia e Bruxaria de Hogwarts, onde enfrenta seu primeiro grande desafio.',
  'Ótimo',
  29.90,
  6,
  'https://m.media-amazon.com/images/I/81YOuOGFCJL._AC_UF1000,1000_QL80_.jpg'
),
(
  'A Metamorfose',
  'Franz Kafka',
  '978-8525406392',
  'L&PM Pocket',
  2011,
  'Ficção',
  'Gregor Samsa acorda uma manhã transformado em um enorme inseto. Uma das obras mais impactantes da literatura universal.',
  'Com Defeito',
  9.90,
  1,
  'https://m.media-amazon.com/images/I/61kqBTXSuQL._AC_UF1000,1000_QL80_.jpg'
),
(
  'O Hobbit',
  'J.R.R. Tolkien',
  '978-8578270704',
  'Martins Fontes',
  2013,
  'Fantasia',
  'Bilbo Bolseiro, um hobbit tranquilo, é convocado para uma aventura épica em busca de um tesouro guardado pelo dragão Smaug.',
  'Bom',
  27.50,
  3,
  'https://m.media-amazon.com/images/I/710+HC-7nBL._AC_UF1000,1000_QL80_.jpg'
);
