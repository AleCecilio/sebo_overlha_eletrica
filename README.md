# Sebo Ovelha Eletrica — E-commerce de Livros Usados

<div align="center">

**Universidade do Estado de Minas Gerais — UEMG Unidade Passos**
**Curso: Sistemas de Informação | Disciplina: Programação II - Web**
**Professor: Eduardo Henrique Marques Ferreira**

---

| Autor | GitHub |
|---|---|
| Alessandro Moreira Cecilio | [@AleCecilio](https://github.com/AleCecilio) |
| João Paulo Borges | — |
| João Victor Dizaró | — |

</div>

---

## 📌 Sobre o Projeto

O **Sebo Ovelha Eletrica** e um e-commerce completo de livros usados, desenvolvido como projeto avaliativo da disciplina de Programação II - Web. A aplicação segue uma arquitetura cliente-servidor com separação estrita de responsabilidades:

- **Front-end**: HTML5, CSS3 e JavaScript Vanilla consumindo a API via `fetch()`
- **Back-end**: Node.js + Express expondo uma API RESTful 100% JSON
- **Banco de Dados**: MySQL com queries SQL nativas via `mysql2/promise` (sem ORM)

---

## 🗂 Estrutura de Pastas

```
sebo-online/
├── backend/
│   ├── config/
│   │   ├── db.js               # Pool de conexão MySQL
│   │   └── validarCpf.js       # Algoritmo oficial de validação de CPF
│   ├── controllers/
│   │   ├── authController.js   # Login, 2FA, Google Auth
│   │   ├── livrosController.js # CRUD de livros
│   │   └── pedidosController.js# Checkout e histórico de pedidos
│   ├── middlewares/
│   │   └── auth.js             # JWT (autenticar) + RBAC (apenasAdmin)
│   ├── .env                    # Variáveis de ambiente (NÃO commitar)
│   ├── package.json
│   └── server.js               # Ponto de entrada Express
├── frontend/
│   ├── assets/
│   │   ├── css/
│   │   │   └── style.css       # Design System completo
│   │   └── js/
│   │       ├── app.js          # Estado global, API, carrinho
│   │       ├── login.js        # Modal de login + fluxo 2FA
│   │       └── checkout.js     # Modal de checkout + finalização
│   ├── pages/
│   │   ├── detalhes.html       # Página de detalhes do livro
│   │   └── admin.html          # Painel administrativo (ADMIN)
│   └── index.html              # Vitrine principal
└── db/
    └── dump.sql                # Script completo do banco de dados
```

---

## ⚙️ Como Rodar o Projeto Localmente

### Pré-requisitos

| Ferramenta | Versão mínima | Verificar com |
|---|---|---|
| Node.js | 18+ | `node -v` |
| npm | 9+ | `npm -v` |
| MySQL | 8.0+ | `mysql --version` |

---

### 1. Configurar o Banco de Dados

**a) Inicie o MySQL** (se não estiver rodando):
```bash
# Linux/Mac (via systemctl)
sudo systemctl start mysql

# Ou via homebrew (Mac)
brew services start mysql

# Windows: iniciar pelo MySQL Workbench ou Services
```

**b) Acesse o console MySQL:**
```bash
mysql -u root -p
```

**c) Execute o dump para criar o banco e popular os dados:**
```bash
mysql -u root -p < db/dump.sql
```

Ou dentro do console MySQL:
```sql
SOURCE /caminho/completo/para/sebo-online/db/dump.sql;
```

Isso criará o banco `sebo_online` com todas as tabelas e dados iniciais.

---

### 2. Configurar o Back-end

**a) Instale as dependências:**
```bash
cd backend
npm install
```

**b) Configure as variáveis de ambiente:**

Edite o arquivo `backend/.env` com suas credenciais do MySQL:
```env
PORT=3000

DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=SUA_SENHA_AQUI
DB_NAME=sebo_online

JWT_SECRET=sebo_online_jwt_secret_uemg_passos_2024
JWT_EXPIRES_IN=8h

NODE_ENV=development
```

**c) Inicie o servidor:**
```bash
# Modo normal
node server.js

# Modo desenvolvimento (reinicia automaticamente com nodemon)
npm run dev
```

Você verá no terminal:
```
╔═══════════════════════════════════════════╗
║   🏚  Sebo Online - Servidor Iniciado      ║
║   🌐  http://localhost:3000                ║
║   📚  Programação II - Web | UEMG Passos   ║
╚═══════════════════════════════════════════╝

✅ Conectado ao MySQL com sucesso!
```

---

### 3. Abrir o Front-end

O front-end é composto por arquivos HTML estáticos. Abra diretamente no navegador:

```bash
# Opção 1: Abrir o arquivo diretamente
# Navegue até frontend/index.html e clique duas vezes

# Opção 2: Usar o Live Server do VS Code
# Clique com botão direito em index.html → "Open with Live Server"

# Opção 3: Python (servidor estático simples)
cd frontend
python3 -m http.server 8080
# Acesse: http://localhost:8080
```

> ⚠️ **Importante**: O front-end faz requisições para `http://localhost:3000`. O back-end **deve estar rodando** antes de abrir o front-end.

---

### 4. Credenciais de Teste

| Perfil | Identificador | Senha |
|---|---|---|
| ADMIN | `admin@seboonline.com` | `Admin@123` |
| CLIENTE | `alessandro@email.com` | `Admin@123` |
| CLIENTE | `joaopaulo@email.com` | `Admin@123` |

> Também é possível logar com o **CPF** ou **telefone** cadastrados no `dump.sql`.

### 5. Código 2FA em Desenvolvimento

Ao fazer login, o código de 6 dígitos do 2FA é impresso diretamente no **terminal do servidor Node.js** (simulação de e-mail/SMS). Em modo `development`, ele também é retornado no JSON da rota `/auth/2fa/enviar` no campo `codigo_dev`.

---

## 🔐 Regras de Negócio Implementadas

### Autenticação Inteligente
O campo de login aceita **e-mail**, **CPF** ou **telefone**. O backend usa Regex para detectar o tipo do identificador e seleciona a coluna SQL correta dinamicamente.

### 2FA Obrigatório
Fluxo completo:
1. Usuário insere credenciais → backend valida
2. Front-end abre modal de escolha (E-mail ou SMS)
3. Backend gera código de 6 dígitos, salva com validade de 5 minutos e simula envio via `console.log`
4. Usuário insere o código → backend valida e retorna o JWT

### Validação de CPF
Algoritmo matemático oficial da Receita Federal implementado tanto no front-end (`app.js`) quanto no back-end (`validarCpf.js`).

### RBAC (Controle de Acesso por Perfil)
- **CLIENTE**: pode visualizar catálogo, adicionar ao carrinho e finalizar compras
- **ADMIN**: tudo do CLIENTE + CRUD completo de livros via painel admin

### Checkout com Progressive Profiling
O endereço de entrega é solicitado **somente no momento de fechar o pedido**. O fluxo:
1. Usuário monta carrinho livremente
2. Ao finalizar, informa endereço + forma de pagamento
3. Backend executa transação SQL: valida estoque → cria pedido → insere itens → decrementa estoque → marca como PAGO

---

## 🌐 Documentação Completa da API

Base URL: `http://localhost:3000`

Todas as respostas são em formato **JSON**.

### Autenticação

| Rota | Método | Finalidade | Auth |
|---|---|---|---|
| `/auth/login` | POST | Login com e-mail/CPF/telefone + senha | ❌ |
| `/auth/2fa/enviar` | POST | Gera e "envia" código 2FA | ❌ |
| `/auth/2fa/verificar` | POST | Valida código 2FA e retorna JWT | ❌ |
| `/auth/google` | POST | Login/cadastro via Google Auth | ❌ |

---

#### `POST /auth/login`
**Requisição:**
```json
{
  "identificador": "admin@seboonline.com",
  "senha": "Admin@123"
}
```
**Resposta (200):**
```json
{
  "mensagem": "Credenciais válidas. Escolha o canal de verificação.",
  "usuario_id": 1,
  "nome": "Administrador",
  "email": "admin@seboonline.com",
  "telefone": "(35) 99000-0001"
}
```

---

#### `POST /auth/2fa/enviar`
**Requisição:**
```json
{
  "usuario_id": 1,
  "canal": "EMAIL"
}
```
**Resposta (200):**
```json
{
  "mensagem": "Código enviado via EMAIL.",
  "canal": "EMAIL",
  "codigo_dev": "482951"
}
```

---

#### `POST /auth/2fa/verificar`
**Requisição:**
```json
{
  "usuario_id": 1,
  "codigo": "482951"
}
```
**Resposta (200):**
```json
{
  "mensagem": "Autenticação concluída com sucesso!",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "usuario": {
    "id": 1,
    "nome": "Administrador",
    "email": "admin@seboonline.com",
    "perfil": "ADMIN"
  }
}
```

---

### Livros

| Rota | Método | Finalidade | Auth |
|---|---|---|---|
| `/listar` | GET | Catálogo público com filtros e paginação | ❌ |
| `/buscar/:id` | GET | Detalhes completos de um livro | ❌ |
| `/salvar` | POST | Cadastrar novo livro | ✅ ADMIN |
| `/editar/:id` | PUT | Atualizar dados de um livro | ✅ ADMIN |
| `/deletar/:id` | DELETE | Remover livro do catálogo (soft delete) | ✅ ADMIN |

---

#### `GET /listar`
**Query Params opcionais:** `busca`, `genero`, `conservacao`, `pagina`, `limite`

Exemplo: `GET /listar?busca=tolkien&pagina=1&limite=12`

**Resposta (200):**
```json
{
  "total": 2,
  "pagina": 1,
  "limite": 12,
  "paginas": 1,
  "livros": [
    {
      "id": 2,
      "titulo": "O Senhor dos Anéis: A Sociedade do Anel",
      "autor": "J.R.R. Tolkien",
      "genero": "Fantasia",
      "conservacao": "Ótimo",
      "preco": "39.90",
      "estoque": 2,
      "imagem_url": "https://...",
      "ano_publicacao": 2019
    }
  ]
}
```

---

#### `GET /buscar/:id`
Exemplo: `GET /buscar/2`

**Resposta (200):**
```json
{
  "livro": {
    "id": 2,
    "titulo": "O Senhor dos Anéis: A Sociedade do Anel",
    "autor": "J.R.R. Tolkien",
    "isbn": "978-8578276195",
    "editora": "Martins Fontes",
    "ano_publicacao": 2019,
    "genero": "Fantasia",
    "sinopse": "A jornada épica de Frodo...",
    "conservacao": "Ótimo",
    "preco": "39.90",
    "estoque": 2,
    "imagem_url": "https://..."
  }
}
```

**Resposta (404):**
```json
{ "erro": "Livro não encontrado." }
```

---

#### `POST /salvar` *(ADMIN)*
**Header:** `Authorization: Bearer <JWT>`

**Requisição:**
```json
{
  "titulo": "O Alquimista",
  "autor": "Paulo Coelho",
  "isbn": "978-8532511010",
  "editora": "HarperCollins",
  "ano_publicacao": 1988,
  "genero": "Romance",
  "sinopse": "A jornada de um jovem pastor espanhol em busca de seu tesouro.",
  "conservacao": "Ótimo",
  "preco": 24.90,
  "estoque": 3,
  "imagem_url": "https://..."
}
```
**Resposta (201):**
```json
{
  "mensagem": "Livro cadastrado com sucesso!",
  "id": 9
}
```

---

#### `PUT /editar/:id` *(ADMIN)*
**Header:** `Authorization: Bearer <JWT>`

Somente os campos enviados no body serão atualizados.

**Requisição:**
```json
{
  "preco": 19.90,
  "estoque": 5
}
```
**Resposta (200):**
```json
{ "mensagem": "Livro atualizado com sucesso!" }
```

---

#### `DELETE /deletar/:id` *(ADMIN)*
**Header:** `Authorization: Bearer <JWT>`

**Resposta (200):**
```json
{ "mensagem": "Livro removido do catálogo com sucesso." }
```

---

### Pedidos

| Rota | Método | Finalidade | Auth |
|---|---|---|---|
| `/pedidos/checkout` | POST | Finalizar compra (cria pedido, desconta estoque) | ✅ CLIENTE/ADMIN |
| `/pedidos/meus` | GET | Listar pedidos do usuário autenticado | ✅ CLIENTE/ADMIN |

---

#### `POST /pedidos/checkout`
**Header:** `Authorization: Bearer <JWT>`

**Requisição:**
```json
{
  "itens": [
    { "livro_id": 1, "quantidade": 1 },
    { "livro_id": 4, "quantidade": 2 }
  ],
  "endereco": {
    "cep": "37902-144",
    "logradouro": "Rua das Flores",
    "numero": "42",
    "complemento": "Apto 3",
    "bairro": "Centro",
    "cidade": "Passos",
    "estado": "MG"
  },
  "forma_pagamento": "PIX"
}
```
**Resposta (201):**
```json
{
  "mensagem": "Pedido realizado com sucesso! Pagamento confirmado.",
  "pedido_id": 1,
  "total": 56.90,
  "status": "PAGO",
  "forma_pagamento": "PIX"
}
```

---

#### `GET /pedidos/meus`
**Header:** `Authorization: Bearer <JWT>`

**Resposta (200):**
```json
{
  "pedidos": [
    {
      "id": 1,
      "status": "PAGO",
      "forma_pagamento": "PIX",
      "total": "56.90",
      "criado_em": "2024-11-20T14:30:00.000Z",
      "livros": "Dom Casmurro | O Pequeno Príncipe"
    }
  ]
}
```

---

## 🛠️ Tecnologias Utilizadas

| Camada | Tecnologia |
|---|---|
| Front-end | HTML5, CSS3, JavaScript Vanilla |
| Back-end | Node.js, Express 4 |
| Banco de Dados | MySQL 8 + mysql2/promise |
| Autenticação | JWT (jsonwebtoken) + bcrypt |
| Segurança | CORS, RBAC, 2FA, CPF validation |
| Dev Tools | dotenv, nodemon |

---

## 📝 Notas Importantes

- O `codigo_dev` no retorno de `/auth/2fa/enviar` está presente **apenas em `NODE_ENV=development`** para facilitar os testes. Em produção, remova-o e integre com SendGrid/Twilio.
- O login Google é **simulado** no front-end. Em produção, integrar com a Google Identity Platform para obter um `id_token` real.
- Todas as senhas são armazenadas com **bcrypt** (salt factor 12).
- O `DELETE /deletar/:id` realiza um **soft delete** (campo `ativo = 0`), preservando o histórico de pedidos.

---

*Projeto desenvolvido para fins acadêmicos — UEMG Unidade Passos, 2024.*
