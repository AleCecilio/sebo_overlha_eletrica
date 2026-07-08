-- Garante que o cliente MySQL importe este arquivo como UTF-8, evitando
-- corrupção de acentos (títulos, nomes) quando o charset padrão do cliente
-- for latin1 (comum em muitas instalações/ferramentas).
SET NAMES utf8mb4;

-- ============================================================
-- SEBO OVELHA ELÉTRICA - Inserção de Livros (v2)
-- Disciplina: Programação II - Web | UEMG - Unidade Passos
--
-- CORREÇÃO (item 5 do escopo de ajustes): a lista anterior de livros usava
-- títulos pouco catalogados e ISBNs pouco confiáveis, resultando em quase
-- nenhuma capa preenchida pela Open Library. Esta versão troca o catálogo
-- por 20 obras extremamente famosas e amplamente catalogadas
-- internacionalmente, priorizando taxa de acerto de capa em vez de volume.
--
-- `imagem_url` já vem preenchida para os títulos com ISBN internacional
-- padronizado e confirmado (ex: 1984). Para os demais, o campo é deixado
-- em branco e deve ser preenchido rodando:
--     cd backend && npm run capas
-- (script atualizado — busca primeiro por título+autor na Open Library,
-- que tem taxa de acerto muito maior para obras famosas do que tentar
-- adivinhar o ISBN exato de cada edição).
--
-- Este script SUBSTITUI o antigo 02_insercao_livros.sql. Rode-o com o
-- banco já criado (ex: logo após 01_criacao_banco.sql), antes do
-- 03_insercao_usuarios_teste.sql e do 04_migracao_expansao.sql.
-- ============================================================

USE sebo_online;

-- DELETE FROM livros;
ALTER TABLE livros AUTO_INCREMENT = 1;

INSERT INTO livros
  (titulo, autor, isbn, editora, ano_publicacao, genero, sinopse, conservacao, preco, estoque, imagem_url)
VALUES

('1984', 'George Orwell', '9780451524935', 'Companhia das Letras', 1949,
 'Ficção Científica, Distopia, Clássico',
 'Em um regime totalitário que controla até os pensamentos dos cidadãos, Winston Smith arrisca tudo em busca de liberdade e verdade.',
 'Ótimo', 39.90, 6, 'https://covers.openlibrary.org/b/isbn/9780451524935-L.jpg'),

('A Revolução dos Bichos', 'George Orwell', NULL, 'Companhia das Letras', 1945,
 'Sátira, Ficção Política, Clássico',
 'Os animais de uma fazenda expulsam os humanos e tentam construir uma sociedade igualitária — até o poder corromper os próprios líderes.',
 'Bom', 32.90, 5, NULL),

('Dom Casmurro', 'Machado de Assis', NULL, 'Ática', 2013,
 'Literatura Brasileira, Romance, Clássico',
 'Bentinho narra sua obsessão pelo ciúme de Capitu, em um dos maiores clássicos da literatura brasileira.',
 'Bom', 29.90, 5, NULL),

('Memórias Póstumas de Brás Cubas', 'Machado de Assis', NULL, 'Ática', 2011,
 'Literatura Brasileira, Romance, Clássico',
 'Narrado por um defunto-autor, o romance ironiza os costumes da sociedade brasileira do século XIX.',
 'Regular', 27.90, 4, NULL),

('O Cortiço', 'Aluísio Azevedo', NULL, 'Ática', 2012,
 'Literatura Brasileira, Naturalismo, Clássico',
 'Retrato cru da vida em um cortiço carioca, onde os instintos humanos se sobrepõem à moral da época.',
 'Regular', 26.90, 3, NULL),

('Capitães da Areia', 'Jorge Amado', NULL, 'Companhia das Letras', 1937,
 'Literatura Brasileira, Drama, Clássico',
 'Um bando de meninos de rua vive de pequenos furtos nas ruas de Salvador, entre a sobrevivência e o sonho.',
 'Bom', 34.90, 5, NULL),

('O Pequeno Príncipe', 'Antoine de Saint-Exupéry', NULL, 'Agir', 1943,
 'Fábula, Infantojuvenil, Clássico',
 'Um piloto perdido no deserto encontra um pequeno príncipe vindo de outro planeta, que lhe ensina sobre o que é essencial na vida.',
 'Novo', 42.90, 8, NULL),

('Dom Quixote', 'Miguel de Cervantes', NULL, 'Penguin Clássicos', 2019,
 'Clássico, Aventura, Sátira',
 'Um pequeno fidalgo enlouquece de tanto ler romances de cavalaria e sai pelo mundo em busca de aventuras imaginárias.',
 'Bom', 44.90, 4, NULL),

('Orgulho e Preconceito', 'Jane Austen', NULL, 'Penguin Clássicos', 2017,
 'Romance, Clássico, Literatura Britânica',
 'Elizabeth Bennet enfrenta preconceitos de classe e primeiras impressões equivocadas em seu relacionamento com o Sr. Darcy.',
 'Ótimo', 36.90, 6, NULL),

('Crime e Castigo', 'Fiódor Dostoiévski', NULL, 'Editora 34', 2016,
 'Clássico, Drama Psicológico, Literatura Russa',
 'Um jovem estudante comete um assassinato e mergulha em uma espiral de culpa e redenção nas ruas de São Petersburgo.',
 'Bom', 46.90, 4, NULL),

('Harry Potter e a Pedra Filosofal', 'J.K. Rowling', NULL, 'Rocco', 1997,
 'Fantasia, Aventura, Infantojuvenil',
 'Um garoto órfão descobre, ao completar onze anos, que é um bruxo e é convidado a estudar na Escola de Magia e Bruxaria de Hogwarts.',
 'Ótimo', 49.90, 7, NULL),

('O Hobbit', 'J.R.R. Tolkien', NULL, 'HarperCollins', 1937,
 'Fantasia, Aventura, Clássico',
 'O hobbit Bilbo Bolseiro é arrastado para uma jornada inesperada em busca de um tesouro guardado por um dragão.',
 'Bom', 44.90, 5, NULL),

('O Senhor dos Anéis: A Sociedade do Anel', 'J.R.R. Tolkien', NULL, 'HarperCollins', 1954,
 'Fantasia, Aventura, Clássico',
 'Frodo Bolseiro parte em uma jornada perigosa para destruir o Um Anel e impedir o retorno do Senhor do Escuro.',
 'Bom', 54.90, 4, NULL),

('Cem Anos de Solidão', 'Gabriel García Márquez', NULL, 'Record', 1967,
 'Realismo Mágico, Literatura Latino-Americana, Clássico',
 'A saga da família Buendía ao longo de gerações na fictícia cidade de Macondo, entrelaçando realidade e magia.',
 'Ótimo', 47.90, 4, NULL),

('A Metamorfose', 'Franz Kafka', NULL, 'Companhia das Letras', 1915,
 'Ficção, Clássico, Literatura Alemã',
 'Gregor Samsa acorda uma manhã transformado em um inseto monstruoso e precisa lidar com a rejeição da própria família.',
 'Bom', 24.90, 6, NULL),

('O Apanhador no Campo de Centeio', 'J.D. Salinger', NULL, 'Editora 42', 1951,
 'Romance, Clássico, Literatura Norte-Americana',
 'Holden Caulfield narra, com ironia e angústia, alguns dias de sua vida em Nova York após ser expulso do colégio interno.',
 'Bom', 38.90, 5, NULL),

('Moby Dick', 'Herman Melville', NULL, 'Penguin Clássicos', 2015,
 'Aventura, Clássico, Literatura Norte-Americana',
 'O capitão Ahab persegue obsessivamente a baleia branca que lhe tirou a perna, em uma jornada de vingança pelos mares.',
 'Regular', 41.90, 3, NULL),

('Frankenstein', 'Mary Shelley', NULL, 'Penguin Clássicos', 2018,
 'Ficção Científica, Terror, Clássico',
 'O cientista Victor Frankenstein cria uma criatura viva a partir de partes de cadáveres — e não consegue lidar com as consequências.',
 'Bom', 33.90, 5, NULL),

('Drácula', 'Bram Stoker', NULL, 'Penguin Clássicos', 2014,
 'Terror, Clássico, Literatura Britânica',
 'O Conde Drácula deixa a Transilvânia rumo à Inglaterra, espalhando terror por onde passa.',
 'Bom', 35.90, 4, NULL),

('A Culpa é das Estrelas', 'John Green', NULL, 'Intrínseca', 2012,
 'Romance, Drama, Infantojuvenil',
 'Hazel e Augustus se conhecem em um grupo de apoio a pacientes com câncer e vivem um amor intenso contra o tempo.',
 'Novo', 34.90, 7, NULL);
