/**
 * 数据库配置模块
 * 使用 mysql2 连接池管理数据库连接
 * 支持多种连接方式:
 *   1. DATABASE_URL / MYSQL_URL / MYSQL_PUBLIC_URL（云平台完整URL）
 *   2. MYSQLHOST + MYSQLUSER + MYSQLPASSWORD 等（Railway 自动提供的独立变量）
 *   3. DB_HOST + DB_USER + DB_PASSWORD 等（本地开发 .env 配置）
 */
const mysql = require('mysql2/promise');
require('dotenv').config();

// 获取数据库连接 URL
function getDatabaseUrl() {
  // 优先使用完整的数据库 URL
  const urlVars = [
    'DATABASE_URL',
    'MYSQL_URL',
    'MYSQL_PUBLIC_URL',
    'DATABASE_PUBLIC_URL',
  ];

  for (const varName of urlVars) {
    if (process.env[varName]) {
      console.log(`📌 使用 ${varName} 连接数据库`);
      return process.env[varName];
    }
  }
  return null;
}

// 解析连接配置
function getPoolConfig() {
  // 方式一: 使用完整数据库 URL（云平台推荐）
  const dbUrl = getDatabaseUrl();
  if (dbUrl) {
    return {
      uri: dbUrl,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      charset: 'utf8mb4',
    };
  }

  // 方式二: 使用 Railway 自动注入的 MYSQL* 变量
  if (process.env.MYSQLHOST) {
    console.log('📌 使用 MYSQL* 环境变量连接数据库');
    return {
      host: process.env.MYSQLHOST,
      port: parseInt(process.env.MYSQLPORT) || 3306,
      user: process.env.MYSQLUSER || 'root',
      password: process.env.MYSQLPASSWORD || '',
      database: process.env.MYSQLDATABASE || process.env.MYSQL_DATABASE || 'railway',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 0,
      charset: 'utf8mb4',
    };
  }

  // 方式三: 使用独立的 DB_* 环境变量（本地开发）
  console.log('📌 使用 DB_* 环境变量连接数据库（本地模式）');
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
