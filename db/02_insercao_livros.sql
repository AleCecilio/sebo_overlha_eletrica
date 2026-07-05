-- ============================================================
-- SEBO OVELHA ELÉTRICA - Carga de Livros (dados completos)
-- Disciplina: Programação II - Web | UEMG - Unidade Passos
--
-- Script separado responsável apenas por popular a tabela
-- `livros` com um catálogo curado: título, autor, ISBN real,
-- editora, ano, gênero + tags (coluna `genero`, já que o
-- projeto não possui tabela de tags separada), sinopse própria,
-- estado de conservação, preço, estoque e capa (via Open
-- Library Covers API, buscada pelo ISBN real de cada edição).
--
-- Observação sobre as capas:
-- A URL de capa usa o padrão https://covers.openlibrary.org/b/isbn/{ISBN}-L.jpg
-- Caso algum ISBN não tenha capa cadastrada na Open Library no
-- momento da consulta, a imagem correspondente simplesmente não
-- carrega (a API não retorna capa de outro livro por engano) —
-- nesse caso, basta atualizar a coluna imagem_url manualmente.
--
-- Execute depois de 01_criacao_banco.sql.
-- ============================================================

USE sebo_online;

INSERT INTO livros
  (titulo, autor, isbn, editora, ano_publicacao, genero, sinopse, conservacao, preco, estoque, imagem_url, ativo)
VALUES

('1984', 'George Orwell', '9788535914849', 'Companhia das Letras', 2009,
 'Ficção Científica, Distopia, Clássico',
 'Numa Oceânia governada pelo Grande Irmão, Winston Smith vive sob vigilância constante e começa a questionar a verdade oficial do Partido, arriscando tudo por liberdade de pensamento.',
 'Ótimo', 39.90, 5, 'https://covers.openlibrary.org/b/isbn/9788535914849-L.jpg', 1),

('A Revolução dos Bichos', 'George Orwell', '9788535909555', 'Companhia das Letras', 2007,
 'Ficção, Sátira, Clássico',
 'Os animais de uma fazenda expulsam os humanos e tentam construir uma sociedade igualitária, mas o poder acaba corrompendo os próprios líderes da revolução.',
 'Bom', 32.50, 6, 'https://covers.openlibrary.org/b/isbn/9788535909555-L.jpg', 1),

('Dom Casmurro', 'Machado de Assis', '9788582850350', 'Penguin-Companhia', 2016,
 'Literatura Brasileira, Romance, Clássico',
 'Bentinho narra, já velho e desconfiado, a história de seu casamento com Capitu, revisitando lembranças de infância para tentar provar uma traição que talvez só exista em sua própria imaginação.',
 'Bom', 28.90, 4, 'https://covers.openlibrary.org/b/isbn/9788582850350-L.jpg', 1),

('Memórias Póstumas de Brás Cubas', 'Machado de Assis', '9788582850015', 'Penguin-Companhia', 2014,
 'Literatura Brasileira, Romance, Clássico',
 'Um defunto-autor conta, com ironia e humor ácido, a própria vida e os pequenos fracassos e vaidades da sociedade carioca do século XIX.',
 'Ótimo', 27.90, 5, 'https://covers.openlibrary.org/b/isbn/9788582850015-L.jpg', 1),

('Vidas Secas', 'Graciliano Ramos', '9788501013210', 'Record', 2015,
 'Literatura Brasileira, Romance, Clássico',
 'Uma família de retirantes atravessa o sertão nordestino fugindo da seca, em uma narrativa seca e direta sobre miséria, resistência e desumanização.',
 'Regular', 22.00, 3, 'https://covers.openlibrary.org/b/isbn/9788501013210-L.jpg', 1),

('O Cortiço', 'Aluísio Azevedo', '9788572329231', 'Martin Claret', 2010,
 'Literatura Brasileira, Naturalismo, Clássico',
 'O cotidiano de um cortiço no Rio de Janeiro do século XIX revela os instintos, disputas e contrastes sociais de seus moradores, sob a ótica naturalista de Aluísio Azevedo.',
 'Regular', 19.90, 4, 'https://covers.openlibrary.org/b/isbn/9788572329231-L.jpg', 1),

('Grande Sertão: Veredas', 'Guimarães Rosa', '9788520925215', 'Nova Fronteira', 2006,
 'Literatura Brasileira, Romance, Clássico',
 'O jagunço Riobaldo narra suas travessias pelo sertão mineiro, misturando aventura, amor e uma reflexão profunda sobre o bem, o mal e o destino.',
 'Bom', 45.00, 3, 'https://covers.openlibrary.org/b/isbn/9788520925215-L.jpg', 1),

('A Hora da Estrela', 'Clarice Lispector', '9788532502463', 'Rocco', 2018,
 'Literatura Brasileira, Romance',
 'A trajetória simples e melancólica de Macabéa, uma jovem nordestina perdida na cidade grande, narrada por um narrador que se envolve cada vez mais com o destino da própria personagem.',
 'Novo', 34.90, 6, 'https://covers.openlibrary.org/b/isbn/9788532502463-L.jpg', 1),

('O Pequeno Príncipe', 'Antoine de Saint-Exupéry', '9788522008731', 'Agir', 2015,
 'Ficção, Fábula, Infantojuvenil, Clássico',
 'Um piloto perdido no deserto encontra um pequeno príncipe vindo de outro planeta, que compartilha reflexões simples e profundas sobre amizade, amor e o que realmente importa na vida.',
 'Ótimo', 29.90, 8, 'https://covers.openlibrary.org/b/isbn/9788522008731-L.jpg', 1),

('Harry Potter e a Pedra Filosofal', 'J.K. Rowling', '9788532511010', 'Rocco', 2000,
 'Fantasia, Aventura, Infantojuvenil',
 'Ao descobrir que é um bruxo, Harry Potter ingressa na Escola de Magia e Bruxaria de Hogwarts e começa a desvendar os mistérios ligados à morte de seus pais.',
 'Bom', 42.00, 5, 'https://covers.openlibrary.org/b/isbn/9788532511010-L.jpg', 1),

('O Senhor dos Anéis: A Sociedade do Anel', 'J.R.R. Tolkien', '9788595084759', 'HarperCollins Brasil', 2019,
 'Fantasia, Aventura, Clássico',
 'Frodo Bolseiro herda um anel de poder capaz de destruir a Terra-média e parte, junto de uma companhia improvável, em uma jornada para destruí-lo antes que caia em mãos erradas.',
 'Ótimo', 54.90, 3, 'https://covers.openlibrary.org/b/isbn/9788595084759-L.jpg', 1),

('Duna', 'Frank Herbert', '9788576572539', 'Aleph', 2015,
 'Ficção Científica, Aventura',
 'No planeta desértico de Arrakis, o jovem Paul Atreides se vê no centro de disputas políticas, religiosas e ecológicas em torno da especiaria mais valiosa do universo.',
 'Bom', 59.90, 4, 'https://covers.openlibrary.org/b/isbn/9788576572539-L.jpg', 1),

('O Guia do Mochileiro das Galáxias', 'Douglas Adams', '9788580411642', 'Arqueiro', 2015,
 'Ficção Científica, Comédia',
 'Momentos antes da destruição da Terra, Arthur Dent é resgatado por um amigo alienígena e passa a viajar pela galáxia em uma aventura absurda e hilária sobre o sentido da vida.',
 'Bom', 36.90, 5, 'https://covers.openlibrary.org/b/isbn/9788580411642-L.jpg', 1),

('O Alquimista', 'Paulo Coelho', '9788576657021', 'Sextante', 2012,
 'Ficção, Literatura Brasileira',
 'O pastor Santiago cruza o deserto em busca de um tesouro anunciado em sonho, e descobre pelo caminho lições sobre escutar os próprios desejos e seguir a própria "lenda pessoal".',
 'Novo', 34.90, 7, 'https://covers.openlibrary.org/b/isbn/9788576657021-L.jpg', 1),

('A Menina que Roubava Livros', 'Markus Zusak', '9788598078279', 'Intrínseca', 2014,
 'Ficção, Drama Histórico',
 'Na Alemanha nazista, a pequena Liesel encontra consolo nos livros que rouba, enquanto a Morte, narradora da história, observa a fragilidade e a força das pessoas em tempos de guerra.',
 'Bom', 44.90, 3, 'https://covers.openlibrary.org/b/isbn/9788598078279-L.jpg', 1),

('Sapiens: Uma Breve História da Humanidade', 'Yuval Noah Harari', '9788525432186', 'L&PM', 2015,
 'Não Ficção, História, Ciência',
 'Harari percorre a trajetória da espécie humana, da revolução cognitiva à revolução científica, explorando como mitos compartilhados — dinheiro, nações, religiões — nos permitiram dominar o planeta.',
 'Ótimo', 49.90, 4, 'https://covers.openlibrary.org/b/isbn/9788525432186-L.jpg', 1),

('Homo Deus: Uma Breve História do Amanhã', 'Yuval Noah Harari', '9788535928211', 'Companhia das Letras', 2016,
 'Não Ficção, Ciência, Futurologia',
 'Depois de dominar a fome, a guerra e a peste, a humanidade volta seus esforços para novas metas: felicidade permanente, longevidade extrema e até a própria divindade.',
 'Bom', 52.90, 3, 'https://covers.openlibrary.org/b/isbn/9788535928211-L.jpg', 1),

('Pai Rico, Pai Pobre', 'Robert T. Kiyosaki', '9788550801486', 'Alta Books', 2017,
 'Economia, Finanças Pessoais, Não Ficção',
 'Kiyosaki compara os ensinamentos financeiros de duas figuras paternas para defender a ideia de que educação financeira e investimento em ativos importam mais do que apenas ter um bom salário.',
 'Bom', 39.90, 6, 'https://covers.openlibrary.org/b/isbn/9788550801486-L.jpg', 1),

('Freakonomics', 'Steven D. Levitt, Stephen J. Dubner', '9788535225417', 'Elsevier/Campus', 2007,
 'Economia, Não Ficção',
 'Usando ferramentas da economia para investigar perguntas inusitadas do cotidiano, os autores mostram como incentivos escondidos moldam o comportamento humano de formas surpreendentes.',
 'Regular', 24.90, 4, 'https://covers.openlibrary.org/b/isbn/9788535225417-L.jpg', 1),

('O Poder do Hábito', 'Charles Duhigg', '9788539004119', 'Objetiva', 2012,
 'Não Ficção, Psicologia, Autoajuda',
 'Duhigg explora a ciência por trás da formação de hábitos, individuais e organizacionais, e como pequenas mudanças de rotina podem gerar grandes transformações.',
 'Novo', 37.90, 5, 'https://covers.openlibrary.org/b/isbn/9788539004119-L.jpg', 1);
