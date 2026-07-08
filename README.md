# Sebo Ovelha Elétrica — E-commerce de Livros Usados

<div align="center">

**Universidade do Estado de Minas Gerais — UEMG Unidade Passos**
**Curso: Sistemas de Informação | Disciplina: Programação II - Web**
**Professor: Eduardo Henrique Marques Ferreira**

---

| Autor | GitHub |
|---|---|
| Alessandro Moreira Cecilio | [@AleCecilio](https://github.com/AleCecilio) |

</div>

---

## Sumário

- [Sebo Ovelha Elétrica — E-commerce de Livros Usados](#sebo-ovelha-elétrica--e-commerce-de-livros-usados)
  - [Sumário](#sumário)
  - [1. Visão Geral do Projeto](#1-visão-geral-do-projeto)
  - [2. Funcionalidades](#2-funcionalidades)
    - [Catálogo e busca](#catálogo-e-busca)
    - [Autenticação](#autenticação)
    - [Carrinho e compra](#carrinho-e-compra)
    - [Conta do usuário](#conta-do-usuário)
    - [Avaliações e comentários](#avaliações-e-comentários)
    - [Pedidos](#pedidos)
    - [Área administrativa](#área-administrativa)
  - [3. Tecnologias Utilizadas](#3-tecnologias-utilizadas)
  - [4. Estrutura do Projeto](#4-estrutura-do-projeto)
  - [5. Banco de Dados](#5-banco-de-dados)
    - [Preparando o banco do zero](#preparando-o-banco-do-zero)
  - [6. Como Rodar o Projeto Localmente](#6-como-rodar-o-projeto-localmente)
    - [Pré-requisitos](#pré-requisitos)
    - [Passo 1 — Banco de dados](#passo-1--banco-de-dados)
    - [Passo 2 — Back-end](#passo-2--back-end)
    - [Passo 3 — (Opcional) Preencher capas automaticamente](#passo-3--opcional-preencher-capas-automaticamente)
    - [Passo 4 — Front-end](#passo-4--front-end)
    - [Credenciais de teste](#credenciais-de-teste)
  - [7. Como Cadastrar uma Conta](#7-como-cadastrar-uma-conta)
    - [Para criar uma conta de administrador](#para-criar-uma-conta-de-administrador)
  - [8. Como Fazer Login](#8-como-fazer-login)
  - [9. Como Navegar e Usar o Sistema](#9-como-navegar-e-usar-o-sistema)
  - [10. Documentação da API](#10-documentação-da-api)
    - [Autenticação](#autenticação-1)
    - [Livros](#livros)
    - [Comentários e avaliações](#comentários-e-avaliações)
    - [Pedidos](#pedidos-1)
    - [Endereços](#endereços)
    - [Conta do usuário](#conta-do-usuário-1)
  - [11. Melhorias e Correções desta Versão](#11-melhorias-e-correções-desta-versão)
  - [12. Notas Importantes](#12-notas-importantes)

---

## 1. Visão Geral do Projeto

O **Sebo Ovelha Elétrica** é um e-commerce completo para venda de livros usados — um "sebo" digital. O sistema resolve o problema de organizar, expor e vender um acervo de livros de segunda mão de forma estruturada, permitindo que:

- **Visitantes** naveguem pelo catálogo, pesquisem e filtrem livros por gênero e estado de conservação;
- **Clientes cadastrados** montem um carrinho, definam quantidades, salvem endereços de entrega, finalizem compras, avaliem/comentem livros e acompanhem seu histórico de pedidos;
- **Administradores** gerenciem o catálogo (cadastro, edição e remoção de livros) através de um painel próprio, além de terem acesso às mesmas funcionalidades de cliente.

É uma aplicação **cliente-servidor** com API RESTful e front-end desacoplado, desenvolvida como projeto avaliativo da disciplina de Programação II - Web.

---

## 2. Funcionalidades

### Catálogo e busca
- Vitrine de livros com paginação
- Busca por título, autor ou ISBN
- Filtro por gênero (carregado dinamicamente a partir do que existe no banco) e por estado de conservação
- Indicação visual de livro **indisponível** quando o estoque chega a zero (impedindo adição ao carrinho)

### Autenticação
- **Cadastro** de conta (cliente ou administrador) com validação de campos obrigatórios
- **Login** com e-mail, CPF **ou** telefone + senha, com aviso claro em caso de credenciais inválidas
- **Login automático** após o cadastro (o usuário já entra logado, sem precisar logar de novo)
- Autenticação em duas etapas (2FA simulada, por e-mail ou SMS)
- Login simulado via Google
- Cadastro de **administrador por domínio + código**: e-mails com `@seboovelhaeletrica` exigem um código especial para virarem conta ADMIN

### Carrinho e compra
- Carrinho persistente (localStorage) com seletor de quantidade por item, respeitando o estoque disponível
- Checkout com seleção de endereço já salvo ou cadastro de um novo endereço na hora
- Confirmação de pagamento simulada (PIX ou Cartão)
- Baixa automática de estoque a cada compra confirmada

### Conta do usuário
- Página "Minha Conta" (cliente e administrador): edição de nome, e-mail, telefone e foto de perfil (via URL)
- Gerenciamento de **até 5 endereços** por usuário (cadastrar, editar, remover, marcar como principal)
- Resumo das últimas compras
- Exclusão (desativação) da própria conta

### Avaliações e comentários
- Avaliação por estrelas (1 a 5) e comentário de texto por livro
- Um usuário pode reavaliar um livro — a avaliação é atualizada, não duplicada
- Exibição dos comentários mais recentes (até 5, quando o livro tem mais de 10 no total)

### Pedidos
- Histórico de pedidos do usuário autenticado ("Meus Pedidos"), disponível tanto para clientes quanto para administradores

### Área administrativa
- Painel próprio (`/pages/admin.html`) restrito a usuários com perfil `ADMIN`
- CRUD completo de livros (cadastrar, listar, editar, remover)
- Acesso direto a "Meus Pedidos" e "Configurações" a partir do próprio painel

---

## 3. Tecnologias Utilizadas

| Camada | Tecnologia | Uso |
|---|---|---|
| Front-end | HTML5, CSS3, JavaScript Vanilla | Interface, estado do carrinho, chamadas à API via `fetch()` |
| Front-end | Bootstrap 5 (CDN) | Base de grid, formulários e componentes nas telas novas (conta, endereços, avaliações), somando-se ao design system próprio já existente |
| Back-end | Node.js + Express 4 | API RESTful 100% JSON |
| Banco de Dados | MySQL 8 / MariaDB + `mysql2/promise` | Persistência dos dados, sem ORM (SQL nativo) |
| Autenticação | JWT (`jsonwebtoken`) + `bcryptjs` | Emissão/validação de token e hash de senha (12 rounds) |
| Segurança | CORS, RBAC (`autenticar` / `apenasAdmin`), 2FA, validação de CPF | Controle de acesso e proteção de rotas |
| Integração externa | Open Library API | Preenchimento automático das capas dos livros |
| Dev Tools | `dotenv`, `nodemon` | Variáveis de ambiente e reinício automático em desenvolvimento |

---

## 4. Estrutura do Projeto

```
sebo_ovelha_eletrica/
├── backend/
│   ├── config/
│   │   ├── db.js                    # Pool de conexão MySQL
│   │   └── validarCpf.js            # Algoritmo oficial de validação de CPF
│   ├── controllers/
│   │   ├── authController.js        # Login, cadastro, 2FA, Google Auth
│   │   ├── livrosController.js      # CRUD de livros + filtro de gêneros
│   │   ├── pedidosController.js     # Checkout e histórico de pedidos
│   │   ├── enderecosController.js   # CRUD de endereços (até 5 por usuário)
│   │   ├── usuariosController.js    # Perfil / conta do usuário
│   │   └── comentariosController.js # Avaliações e comentários dos livros
│   ├── middlewares/
│   │   └── auth.js                  # JWT (autenticar) + RBAC (apenasAdmin)
│   ├── scripts/
│   │   └── preencherCapas.js        # Preenchimento automático de capas via Open Library
│   ├── .env                         # Variáveis de ambiente (NÃO commitar)
│   ├── package.json
│   └── server.js                    # Ponto de entrada Express
├── frontend/
│   ├── assets/
│   │   ├── css/
│   │   │   └── style.css            # Design system completo
│   │   └── js/
│   │       ├── app.js               # Estado global, API, carrinho, autenticação
│   │       ├── login.js             # Modal de login/cadastro + fluxo 2FA
│   │       └── checkout.js          # Modal de checkout + finalização
│   ├── pages/
│   │   ├── detalhes.html            # Detalhes do livro + avaliações/comentários
│   │   ├── pedidos.html             # "Meus Pedidos" (cliente e admin)
│   │   ├── conta.html               # "Minha Conta" (cliente e admin)
│   │   └── admin.html               # Painel administrativo (ADMIN)
│   └── index.html                   # Vitrine principal
└── db/
    ├── 01_criacao_banco.sql         # Estrutura completa do banco
    ├── 02_insercao_livros.sql       # Catálogo inicial (20 livros)
    └── 03_insercao_usuarios_teste.sql # Usuários e endereços de teste
```

---

## 5. Banco de Dados

A pasta `db/` contém **três scripts**, executados nesta ordem:

| Ordem | Script | O que faz |
|---|---|---|
| 1 | `01_criacao_banco.sql` | Cria o banco `sebo_online` e **toda** a estrutura de tabelas: `usuarios`, `enderecos`, `livros`, `pedidos`, `itens_pedido`, `tokens_2fa` e `avaliacoes`, com todas as colunas, chaves estrangeiras e índices já definidos — inclusive o que antes vivia em uma migração separada (ver nota abaixo) |
| 2 | `02_insercao_livros.sql` | Popula o catálogo com 20 livros famosos e amplamente catalogados (facilita capas confiáveis) |
| 3 | `03_insercao_usuarios_teste.sql` | Cria os dois usuários de teste (CLIENTE e ADMIN) e um endereço válido para cada um |

### Preparando o banco do zero

```bash
mysql -u root -p -e "DROP DATABASE IF EXISTS sebo_online;"
mysql -u root -p < db/01_criacao_banco.sql
mysql -u root -p < db/02_insercao_livros.sql
mysql -u root -p < db/03_insercao_usuarios_teste.sql
```

> Os três scripts começam com `SET NAMES utf8mb4;`, o que evita corrupção de acentos caso o cliente MySQL usado tenha `latin1` como charset padrão (um problema comum dependendo da instalação/ferramenta).

---

## 6. Como Rodar o Projeto Localmente

### Pré-requisitos

| Ferramenta | Versão mínima | Verificar com |
|---|---|---|
| Node.js | 18+ (necessário para `fetch()` nativo, usado pelo script de capas) | `node -v` |
| npm | 9+ | `npm -v` |
| MySQL ou MariaDB | 8.0+ / 10.6+ | `mysql --version` |

### Passo 1 — Banco de dados

Siga as instruções da seção [5. Banco de Dados](#5-banco-de-dados) acima.

### Passo 2 — Back-end

```bash
cd backend
npm install
```

Configure o arquivo `backend/.env`:

```env
PORT=3000

DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=SUA_SENHA_AQUI
DB_NAME=sebo_online

JWT_SECRET=sebo_online_jwt_secret_uemg_passos_2024
JWT_EXPIRES_IN=8h
ADMIN_SIGNUP_CODE=OVELHA-ADMIN-2024

NODE_ENV=development
```

Inicie o servidor:

```bash
node server.js
# ou, em desenvolvimento (reinicia sozinho a cada alteração):
npm run dev
```

O terminal deve exibir algo como:

```
╔═════════════════════════════════════════════╗
║    Sebo Ovelha Elétrica - Servidor Iniciado ║
║    http://localhost:3000                    ║
║    Programação II - Web | UEMG Passos       ║
╚═════════════════════════════════════════════╝

Conectado ao MySQL com sucesso!
```

### Passo 3 — (Opcional) Preencher capas automaticamente

```bash
cd backend
npm run capas
```

O script busca a capa de cada livro sem imagem na Open Library (por título + autor, com ISBN como reforço) e atualiza o banco diretamente.

### Passo 4 — Front-end

O front-end é 100% estático (HTML/CSS/JS puro). Qualquer uma destas opções funciona:

```bash
# Opção 1 — abrir frontend/index.html direto no navegador

# Opção 2 — Live Server do VS Code
# clique com o botão direito em index.html → "Open with Live Server"

# Opção 3 — servidor estático simples
cd frontend
python3 -m http.server 8080
# acesse http://localhost:8080
```

> **Importante:** o front-end faz requisições para `http://localhost:3000`. O **back-end precisa estar rodando** antes de usar o site.

### Credenciais de teste

| Perfil | E-mail | Senha |
|---|---|---|
| CLIENTE | `cliente@seboovelhaeletrica.com` | `cliente123` |
| ADMIN | `administrador@seboovelhaeletrica.com` | `admin123` |

Também é possível logar com o **CPF** ou **telefone** cadastrados (ver `db/03_insercao_usuarios_teste.sql`).

---

## 7. Como Cadastrar uma Conta

1. Na página inicial, clique em **Entrar** (canto superior direito da navbar).
2. No modal que abre, clique na aba **Cadastrar**.
3. Preencha os campos: nome, e-mail, telefone (opcional), CPF (opcional) e senha.
   - Se algum campo obrigatório ficar vazio ou inválido (e-mail mal formatado, senha curta, CPF inválido), o sistema avisa exatamente qual campo precisa de atenção — o cadastro não é enviado até estar tudo certo.
4. Clique em **Criar Conta**.
5. Pronto: a conta é criada no banco e o **login acontece automaticamente** — você já vê a navbar atualizada com seu nome, sem precisar entrar de novo.

### Para criar uma conta de administrador

No passo 3, use um e-mail que contenha `@seboovelhaeletrica` (ex: `voce@seboovelhaeletrica.com`). Um campo extra, **Código de Administrador**, aparece automaticamente — preencha com o código configurado em `ADMIN_SIGNUP_CODE` (padrão: `OVELHA-ADMIN-2024`). Esse campo nunca aparece para e-mails comuns.

---

## 8. Como Fazer Login

1. Clique em **Entrar** e, na aba **Entrar** (padrão), informe **e-mail, CPF ou telefone** e a senha.
2. Se as credenciais estiverem erradas, o sistema mostra o aviso diretamente no formulário e em um toast — nunca falha silenciosamente.
3. Se as credenciais estiverem corretas, o sistema pede a confirmação por **2FA** (código de 6 dígitos simulado): escolha o canal (e-mail ou SMS) e informe o código, que aparece no console do backend (e no JSON da resposta, em modo desenvolvimento).
4. Após validar o 2FA, você está logado. A navbar passa a mostrar seu nome e os botões **Pedidos**, **Conta** e, se for administrador, **Admin**.

---

## 9. Como Navegar e Usar o Sistema

- **Pesquisar/filtrar livros**: use a barra de busca e os filtros de gênero/conservação na página inicial.
- **Ver detalhes de um livro**: clique em qualquer card do catálogo — a página de detalhes mostra sinopse, avaliações de outros usuários e permite comentar/avaliar (se estiver logado).
- **Adicionar ao carrinho**: defina a quantidade desejada (limitada pelo estoque) e clique em Adicionar. O carrinho fica salvo mesmo se você recarregar a página.
- **Finalizar compra**: abra o carrinho → Finalizar Compra → escolha um endereço salvo ou cadastre um novo → escolha a forma de pagamento → confirme.
- **Ver pedidos**: clique em **Pedidos** na navbar (disponível tanto para clientes quanto para administradores).
- **Gerenciar sua conta**: clique em **Conta** para editar dados pessoais, gerenciar endereços ou excluir a conta.
- **Área administrativa**: administradores veem o botão **Admin** na navbar, que leva ao painel de gerenciamento de livros. De dentro do painel também é possível acessar **Meus Pedidos** e **Configurações** sem precisar voltar à vitrine.

---

## 10. Documentação da API

Base URL: `http://localhost:3000` — todas as respostas em JSON.

### Autenticação

| Rota | Método | Finalidade | Auth |
|---|---|---|---|
| `/auth/cadastro` | POST | Cria uma nova conta (CLIENTE ou ADMIN) e já retorna o token | ❌ |
| `/auth/login` | POST | Login com e-mail/CPF/telefone + senha | ❌ |
| `/auth/2fa/enviar` | POST | Gera e "envia" código 2FA | ❌ |
| `/auth/2fa/verificar` | POST | Valida código 2FA e retorna o JWT | ❌ |
| `/auth/google` | POST | Login/cadastro via Google Auth (simulado) | ❌ |

### Livros

| Rota | Método | Finalidade | Auth |
|---|---|---|---|
| `/listar` | GET | Catálogo com busca, filtros e paginação | ❌ |
| `/generos` | GET | Lista de gêneros distintos existentes no catálogo (alimenta o filtro) | ❌ |
| `/buscar/:id` | GET | Detalhes completos de um livro | ❌ |
| `/salvar` | POST | Cadastrar novo livro | ✅ ADMIN |
| `/editar/:id` | PUT | Atualizar dados de um livro | ✅ ADMIN |
| `/deletar/:id` | DELETE | Remover livro do catálogo (soft delete) | ✅ ADMIN |

### Comentários e avaliações

| Rota | Método | Finalidade | Auth |
|---|---|---|---|
| `/livros/:id/comentarios` | GET | Lista comentários/avaliações de um livro (máx. 5 mais recentes se houver mais de 10) | ❌ |
| `/livros/:id/comentarios` | POST | Cria ou atualiza a avaliação do usuário para o livro | ✅ |

### Pedidos

| Rota | Método | Finalidade | Auth |
|---|---|---|---|
| `/pedidos/checkout` | POST | Finaliza a compra (cria pedido, desconta estoque) | ✅ |
| `/pedidos/meus` | GET | Lista os pedidos do usuário autenticado (cliente **ou** admin) | ✅ |

### Endereços

| Rota | Método | Finalidade | Auth |
|---|---|---|---|
| `/enderecos` | GET | Lista os endereços do usuário autenticado | ✅ |
| `/enderecos` | POST | Cadastra um novo endereço (máx. 5 por usuário) | ✅ |
| `/enderecos/:id` | PUT | Atualiza um endereço | ✅ |
| `/enderecos/:id` | DELETE | Remove um endereço | ✅ |

### Conta do usuário

| Rota | Método | Finalidade | Auth |
|---|---|---|---|
| `/usuarios/me` | GET | Dados do perfil autenticado | ✅ |
| `/usuarios/me` | PUT | Atualiza nome, e-mail, telefone ou foto | ✅ |
| `/usuarios/me` | DELETE | Desativa a própria conta | ✅ |

---

## 11. Melhorias e Correções desta Versão

- **Cadastro de usuário**: agora persiste corretamente no banco e realiza login automático logo em seguida.
- **Validação de formulários**: mensagens específicas por campo no cadastro e no login, sem falhas silenciosas.
- **Login**: aviso claro quando e-mail/CPF/telefone ou senha estão incorretos, distinguindo erro de credenciais de erro de conexão com o servidor.
- **Filtro de gênero**: corrigido para comparar corretamente as tags de gênero (antes comparava a string inteira); o filtro agora é populado dinamicamente a partir do catálogo real.
- **Capas dos livros**: catálogo reduzido para 20 obras muito famosas e o script de preenchimento de capas passou a buscar primeiro por título + autor (muito mais confiável do que tentar casar o ISBN exato de uma edição).
- **Checkout**: modal com rolagem corrigida (os botões não somem mais em telas menores) e suporte a reaproveitar endereços já salvos.
- **Endereços**: suporte completo a múltiplos endereços por usuário (até 5), com CRUD dedicado.
- **Conta do usuário**: nova página para clientes e administradores editarem perfil, endereços e excluírem a conta.
- **Avaliações e comentários**: nova funcionalidade completa na página de detalhes do livro.
- **Navbar do administrador**: corrigido o encolhimento da barra de pesquisa (o layout quebrava com a conta admin logada, empurrando botões para fora da tela).
- **"Meus Pedidos" para administrador**: adicionado o link direto no painel admin — antes não havia nenhuma forma de acessar essa página a partir do painel administrativo.
- **Banco de dados**: estrutura consolidada em apenas 3 scripts (`01`, `02`, `03`); o antigo `04_migracao_expansao.sql` foi absorvido e removido.
- **Bootstrap**: adicionado como base para os componentes novos (formulários, grid da página de conta), preservando 100% do design já existente nas telas antigas.

---

## 12. Notas Importantes

- O `codigo_dev` retornado por `/auth/2fa/enviar` só existe com `NODE_ENV=development`, para facilitar testes locais — remova-o em produção e integre com um provedor real de e-mail/SMS.
- O login com Google é **simulado** no front-end; em produção seria necessário integrar com a Google Identity Platform.
- Todas as senhas são armazenadas com **bcrypt** (12 rounds).
- `DELETE /deletar/:id` (livros) e `DELETE /usuarios/me` (conta) fazem **soft delete** (`ativo = 0`), preservando o histórico de pedidos associado.
- O código de administrador padrão é `OVELHA-ADMIN-2024`, configurável via `ADMIN_SIGNUP_CODE` no `.env`.

---

*Projeto desenvolvido para fins acadêmicos — UEMG Unidade Passos.*
