module.exports = {
  username: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE || process.env.DATABASE,
  host: process.env.MYSQL_HOST || '127.0.0.1',
  port: process.env.MYSQL_PORT || 3306,
  dialect: process.env.MYSQL_DIALECT || process.env.DATABASE_DIALECT || 'mysql',
  storage: process.env.DATABASE_STORAGE
}