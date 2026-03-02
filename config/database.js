/**
 * 数据库配置模块
 * 使用 mysql2 连接池管理数据库连接
 * 支持两种连接方式:
 *   1. DATABASE_URL (云平台常用，如 Railway 自动提供)
 *   2. 独立的 DB_HOST/DB_USER/DB_PASSWORD 等环境变量（本地开发）
 */
const mysql = require('mysql2/promise');
require('dotenv').config();

// 解析连接配置
function getPoolConfig() {
  // 方式一: 使用完整数据库 URL（云平台推荐）
  if (process.env.DATABASE_URL || process.env.MYSQL_URL) {
    const dbUrl = process.env.DATABASE_URL || process.env.MYSQL_URL;
    return {
      uri: dbUrl,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      charset: 'utf8mb4',
    };
  }

  // 方式二: 使用独立的环境变量（本地开发）
  return {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'fullstack_blog',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
    charset: 'utf8mb4',
  };
}

// 创建连接池
const pool = mysql.createPool(getPoolConfig());

/**
 * 测试数据库连接
 */
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('✅ 数据库连接成功');
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ 数据库连接失败:', error.message);
    return false;
  }
}

module.exports = { pool, testConnection };
