/**
 * 用户模型 (User Model)
 * 封装所有与用户表相关的数据库操作
 */
const { pool } = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
  /**
   * 创建新用户
   * @param {Object} userData - { username, email, password }
   * @returns {Object} 新创建的用户信息
   */
  static async create({ username, email, password }) {
    const hashedPassword = await bcrypt.hash(password, 12);
    const [result] = await pool.query(
      'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
      [username, email, hashedPassword]
    );
    return { id: result.insertId, username, email };
  }

  /**
   * 根据 ID 查找用户
   * @param {number} id
   * @returns {Object|null}
   */
  static async findById(id) {
    const [rows] = await pool.query(
      'SELECT id, username, email, avatar, bio, role, is_active, created_at, updated_at FROM users WHERE id = ?',
      [id]
    );
    return rows[0] || null;
  }

  /**
   * 根据邮箱查找用户（含密码，用于登录验证）
   * @param {string} email
   * @returns {Object|null}
   */
  static async findByEmail(email) {
    const [rows] = await pool.query(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );
    return rows[0] || null;
  }

  /**
   * 根据用户名查找用户
   * @param {string} username
   * @returns {Object|null}
   */
  static async findByUsername(username) {
    const [rows] = await pool.query(
      'SELECT id, username, email, avatar, bio, role, created_at FROM users WHERE username = ?',
      [username]
    );
    return rows[0] || null;
  }

  /**
   * 更新用户信息
   * @param {number} id
   * @param {Object} data - 要更新的字段
   * @returns {boolean}
   */
  static async update(id, data) {
    const allowedFields = ['username', 'email', 'avatar', 'bio'];
    const updates = [];
    const values = [];

    for (const [key, value] of Object.entries(data)) {
      if (allowedFields.includes(key) && value !== undefined) {
        updates.push(`${key} = ?`);
        values.push(value);
      }
    }

    if (updates.length === 0) return false;
    values.push(id);

    const [result] = await pool.query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
      values
    );
    return result.affectedRows > 0;
  }

  /**
   * 修改密码
   * @param {number} id
   * @param {string} newPassword
   * @returns {boolean}
   */
  static async changePassword(id, newPassword) {
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    const [result] = await pool.query(
      'UPDATE users SET password = ? WHERE id = ?',
      [hashedPassword, id]
    );
    return result.affectedRows > 0;
  }

  /**
   * 验证密码
   * @param {string} inputPassword - 输入的明文密码
   * @param {string} hashedPassword - 数据库中的哈希密码
   * @returns {boolean}
   */
  static async comparePassword(inputPassword, hashedPassword) {
    return bcrypt.compare(inputPassword, hashedPassword);
  }

  /**
   * 获取用户列表（分页）
   * @param {number} page
   * @param {number} limit
   * @returns {Object} { users, total, totalPages }
   */
  static async findAll(page = 1, limit = 10) {
    const offset = (page - 1) * limit;
    const [countResult] = await pool.query('SELECT COUNT(*) as total FROM users');
    const total = countResult[0].total;

    const [rows] = await pool.query(
      'SELECT id, username, email, avatar, bio, role, is_active, created_at FROM users ORDER BY created_at DESC LIMIT ? OFFSET ?',
      [limit, offset]
    );

    return {
      users: rows,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
    };
  }
}

module.exports = User;
