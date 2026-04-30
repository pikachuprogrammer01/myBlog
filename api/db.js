const mysql = require('mysql2/promise');
require('dotenv').config({ path: __dirname + '/.env' });

const requiredVars = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'];
const missing = requiredVars.filter((k) => !process.env[k]);

if (missing.length > 0) {
  console.error(
    `[DB] Missing environment variables: ${missing.join(', ')}. ` +
    'Set them via Vercel dashboard or `vercel env add`.'
  );
}

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 4000,
  user: process.env.DB_USER || '',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || '',
  waitForConnections: true,
  connectionLimit: 5,
  queueLimit: 0,
  ssl: {
    rejectUnauthorized: false,
  },
});

module.exports = pool;
