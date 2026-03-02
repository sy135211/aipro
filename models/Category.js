/**
 * 分类模型 (Category Model)
 */
const { pool } = require('../config/database');

class Category {
  static async findAll() {
    const [rows] = await pool.query(
      `SELECT c.*, COUNT(p.id) as post_count
       FROM categories c
       LEFT JOIN posts p ON c.id = p.category_id AND p.status = 'published'
       GROUP BY c.id
       ORDER BY c.name ASC`
    );
    return rows;
  }

  static async findById(id) {
    const [rows] = await pool.query('SELECT * FROM categories WHERE id = ?', [id]);
    return rows[0] || null;
  }

  static async create({ name, slug, description }) {
    const [result] = await pool.query(
      'INSERT INTO categories (name, slug, description) VALUES (?, ?, ?)',
      [name, slug, description || null]
    );
    return { id: result.insertId, name, slug };
  }
}

module.exports = Category;
