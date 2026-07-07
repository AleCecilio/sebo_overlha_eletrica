// backend/server.js
// Ponto de entrada do servidor Express - Sebo Online

require('dotenv').config();
const express = require('express');
const cors    = require('cors');

const { autenticar, apenasAdmin } = require('./middlewares/auth');
const authController       = require('./controllers/authController');
const livrosController     = require('./controllers/livrosController');
const pedidosController    = require('./controllers/pedidosController');
const enderecosController  = require('./controllers/enderecosController');
const usuariosController   = require('./controllers/usuariosController');
const comentariosController= require('./controllers/comentariosController');

const app  = express();
const PORT = process.env.PORT || 3000;

// ─── Middlewares Globais ─────────────────────────────────────────────────────
app.use(cors({
  origin: '*', // Em produção, restringir ao domínio do front-end
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Log simples de requisições em desenvolvimento
if (process.env.NODE_ENV === 'development') {
  app.use((req, _res, next) => {
    console.log(`[${new Date().toLocaleTimeString('pt-BR')}] ${req.method} ${req.url}`);
    next();
  });
}

// ─── Rota de saúde ──────────────────────────────────────────────────────────
app.get('/', (_req, res) => {
  res.json({
    api:     'Sebo Ovelha Elétrica - API',
    versao:  '1.0.0',
    status:  'online',
    projeto: 'Programação II - Web | UEMG Passos',
  });
});

// ─── Rotas de Autenticação ───────────────────────────────────────────────────
app.post('/auth/login',          authController.login);
app.post('/auth/cadastro',       authController.cadastro);
app.post('/auth/2fa/enviar',     authController.enviar2FA);
app.post('/auth/2fa/verificar',  authController.verificar2FA);
app.post('/auth/google',         authController.googleAuth);

// ─── Rotas de Livros (exigidas pelo projeto) ─────────────────────────────────
app.get('/listar',          livrosController.listar);
app.get('/generos',         livrosController.listarGeneros);
app.get('/buscar/:id',      livrosController.buscarPorId);
app.post('/salvar',         autenticar, apenasAdmin, livrosController.salvar);
app.put('/editar/:id',      autenticar, apenasAdmin, livrosController.editar);
app.delete('/deletar/:id',  autenticar, apenasAdmin, livrosController.deletar);

// ─── Rotas de Comentários e Avaliações dos Livros ────────────────────────────
app.get('/livros/:id/comentarios',  comentariosController.listar);
app.post('/livros/:id/comentarios', autenticar, comentariosController.criar);

// ─── Rotas de Pedidos ────────────────────────────────────────────────────────
app.post('/pedidos/checkout',  autenticar, pedidosController.checkout);
app.get('/pedidos/meus',       autenticar, pedidosController.meusPedidos);

// ─── Rotas de Endereços do Usuário (até 5 por usuário) ───────────────────────
app.get('/enderecos',        autenticar, enderecosController.listar);
app.post('/enderecos',       autenticar, enderecosController.criar);
app.put('/enderecos/:id',    autenticar, enderecosController.atualizar);
app.delete('/enderecos/:id', autenticar, enderecosController.deletar);

// ─── Rotas de Conta / Configuração do Usuário (cliente e admin) ─────────────
app.get('/usuarios/me',    autenticar, usuariosController.meuPerfil);
app.put('/usuarios/me',    autenticar, usuariosController.atualizarPerfil);
app.delete('/usuarios/me', autenticar, usuariosController.excluirConta);

// ─── Middleware de erros 404 ─────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ erro: 'Rota não encontrada.' });
});

// ─── Middleware de erros globais ─────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error('[Erro global]', err);
  res.status(500).json({ erro: 'Erro interno no servidor.' });
});

// ─── Inicia o servidor ───────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log('\n╔═══════════════════════════════════════════╗');
  console.log(`║      Sebo Ovelha Elétrica - Servidor Iniciado      ║`);
  console.log(`║   🌐  http://localhost:${PORT}                ║`);
  console.log(`║   📚  Programação II - Web | UEMG Passos   ║`);
  console.log('╚═══════════════════════════════════════════╝\n');
});
