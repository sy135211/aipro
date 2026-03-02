/**
 * 数据库迁移脚本
 * 运行: npm run migrate
 * 功能: 创建数据库和所有必需的表
 * 支持本地 MySQL 和云数据库 URL 两种方式
 */
const mysql = require('mysql2/promise');
require('dotenv').config();

const DB_NAME = process.env.DB_NAME || 'fullstack_blog';

async function getConnection() {
  // 云平台: 使用 DATABASE_URL 直接连接（数据库已由平台创建）
  if (process.env.DATABASE_URL || process.env.MYSQL_URL) {
    const dbUrl = process.env.DATABASE_URL || process.env.MYSQL_URL;
    return mysql.createConnection(dbUrl);
  }

  // 本地: 先连接不指定数据库，手动创建
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    charset: 'utf8mb4',
  });

  await connection.query(
    `CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
  );
  console.log(`✅ 数据库 "${DB_NAME}" 已就绪`);
  await connection.query(`USE \`${DB_NAME}\``);
  return connection;
}

async function migrate() {
  const connection = await getConnection();

  try {
    console.log('🚀 开始数据库迁移...\n');

    // 1. 创建用户表
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id          INT UNSIGNED    AUTO_INCREMENT PRIMARY KEY,
        username    VARCHAR(50)     NOT NULL UNIQUE,
        email       VARCHAR(100)    NOT NULL UNIQUE,
        password    VARCHAR(255)    NOT NULL,
        avatar      VARCHAR(255)    DEFAULT NULL,
        bio         TEXT            DEFAULT NULL,
        role        ENUM('user', 'admin') DEFAULT 'user',
        is_active   TINYINT(1)      DEFAULT 1,
        created_at  TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
        updated_at  TIMESTAMP       DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_username (username),
        INDEX idx_email (email),
        INDEX idx_role (role)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ 用户表 (users) 已创建');

    // 2. 创建分类表
    await connection.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id          INT UNSIGNED    AUTO_INCREMENT PRIMARY KEY,
        name        VARCHAR(50)     NOT NULL UNIQUE,
        slug        VARCHAR(60)     NOT NULL UNIQUE,
        description VARCHAR(255)    DEFAULT NULL,
        created_at  TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_slug (slug)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ 分类表 (categories) 已创建');

    // 3. 创建文章表
    await connection.query(`
      CREATE TABLE IF NOT EXISTS posts (
        id          INT UNSIGNED    AUTO_INCREMENT PRIMARY KEY,
        title       VARCHAR(200)    NOT NULL,
        slug        VARCHAR(220)    NOT NULL UNIQUE,
        content     TEXT            NOT NULL,
        excerpt     VARCHAR(500)    DEFAULT NULL,
        cover_image VARCHAR(255)    DEFAULT NULL,
        status      ENUM('draft', 'published') DEFAULT 'draft',
        view_count  INT UNSIGNED    DEFAULT 0,
        user_id     INT UNSIGNED    NOT NULL,
        category_id INT UNSIGNED    DEFAULT NULL,
        created_at  TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
        updated_at  TIMESTAMP       DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_status (status),
        INDEX idx_user (user_id),
        INDEX idx_category (category_id),
        INDEX idx_created (created_at),
        FULLTEXT INDEX idx_search (title, content),
        CONSTRAINT fk_post_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        CONSTRAINT fk_post_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ 文章表 (posts) 已创建');

    // 4. 创建标签表
    await connection.query(`
      CREATE TABLE IF NOT EXISTS tags (
        id          INT UNSIGNED    AUTO_INCREMENT PRIMARY KEY,
        name        VARCHAR(30)     NOT NULL UNIQUE,
        slug        VARCHAR(40)     NOT NULL UNIQUE,
        created_at  TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_slug (slug)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ 标签表 (tags) 已创建');

    // 5. 创建文章-标签关联表
    await connection.query(`
      CREATE TABLE IF NOT EXISTS post_tags (
        post_id     INT UNSIGNED    NOT NULL,
        tag_id      INT UNSIGNED    NOT NULL,
        PRIMARY KEY (post_id, tag_id),
        CONSTRAINT fk_pt_post FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
        CONSTRAINT fk_pt_tag  FOREIGN KEY (tag_id)  REFERENCES tags(id)  ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ 文章标签关联表 (post_tags) 已创建');

    console.log('\n🎉 数据库迁移完成！');
  } catch (error) {
    console.error('❌ 迁移失败:', error.message);
    // 命令行直接运行时退出，被引用时抛出错误
    if (require.main === module) {
      process.exit(1);
    }
    throw error;
  } finally {
    await connection.end();
  }
}

// 导出 migrate 函数供 server.js 调用
module.exports = { migrate };

// 如果直接运行此脚本 (npm run migrate)
if (require.main === module) {
  migrate();
}
