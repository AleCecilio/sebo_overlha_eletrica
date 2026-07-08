// backend/config/db.js
// Conexão com MySQL usando mysql2/promise (sem ORM)

const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host:               process.env.DB_HOST     || 'localhost',
  port:               parseInt(process.env.DB_PORT) || 3306,
  user:               process.env.DB_USER     || 'root',
  password:           process.env.DB_PASSWORD || '',
  database:           process.env.DB_NAME     || 'sebo_online',
  waitForConnections: true,
  connectionLimit:    10,
  queueLimit:         0,
  timezone:           '-03:00',
  charset:            'utf8mb4',
});

// Teste de conexão ao inicializar
pool.getConnection()
  .then(conn => {
    console.log('Conectado ao MySQL com sucesso!');
    conn.release();
  })
  .catch(err => {
    console.error('Erro ao conectar ao MySQL:', err.message);
    process.exit(1);
  });

module.exports = pool;
