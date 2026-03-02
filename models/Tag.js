/**
 * 标签模型 (Tag Model)
 */
const { pool } = require('../config/database');

class Tag {
  static async findAll() {
    const [rows] = await pool.query(
      `SELECT t.*, COUNT(pt.post_id) as post_count
       FROM tags t
       LEFT JOIN post_tags pt ON t.id = pt.tag_id
       GROUP BY t.id
       ORDER BY t.name ASC`
    );
    return rows;
  }

  static async findById(id) {
    const [rows] = await pool.query('SELECT * FROM tags WHERE id = ?', [id]);
    return rows[0] || null;
  }

  static async create({ name, slug }) {
    const [result] = await pool.query(
      'INSERT INTO tags (name, slug) VALUES (?, ?)',
      [name, slug]
    );
    return { id: result.insertId, name, slug };
  }
}

module.exports = Tag;
