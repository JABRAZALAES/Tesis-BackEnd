const mysql = require('mysql2/promise');
require('dotenv').config();

const dbGestionNovedades = mysql.createPool({
  host: process.env.DB_ESCRITURA_HOST || 'localhost',
  user: process.env.DB_ESCRITURA_USER || 'root',
  password: process.env.DB_ESCRITURA_PASSWORD || '2003',
  database: process.env.DB_ESCRITURA_NAME || 'gestion_novedades',
  port: process.env.DB_ESCRITURA_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

module.exports = { dbGestionNovedades };