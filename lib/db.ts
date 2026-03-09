import mysql from 'mysql2/promise'

const pool = mysql.createPool({
  host: process.env.MYSQL_HOST || '136.243.113.127',
  port: parseInt(process.env.MYSQL_PORT || '3306'),
  database: process.env.MYSQL_DB || 'remedy',
  user: process.env.MYSQL_USER || 'dw_reader',
  password: process.env.MYSQL_PASS || '',
  waitForConnections: true,
  connectionLimit: 5,
  queueLimit: 0,
  connectTimeout: 15000,
})

export default pool
