/**
 * 文章模型 (Post Model)
 * 封装所有与文章表相关的数据库操作
 */
const { pool } = require('../config/database');

class Post {
  /**
   * 创建新文章
   * @param {Object} postData
   * @returns {Object}
   */
  static async create({ title, slug, content, excerpt, cover_image, status, user_id, category_id, tags }) {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      const [result] = await conn.query(
        `INSERT INTO posts (title, slug, content, excerpt, cover_image, status, user_id, category_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [title, slug, content, excerpt || null, cover_image || null, status || 'draft', user_id, category_id || null]
      );

      const postId = result.insertId;

      // 关联标签
      if (tags && tags.length > 0) {
        const tagValues = tags.map(tagId => [postId, tagId]);
        await conn.query('INSERT INTO post_tags (post_id, tag_id) VALUES ?', [tagValues]);
      }

      await conn.commit();
      return { id: postId, title, slug, status };
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }
  }

  /**
   * 根据 ID 查找文章（含作者和分类信息）
   * @param {number} id
   * @returns {Object|null}
   */
  static async findById(id) {
    const [rows] = await pool.query(
      `SELECT p.*, u.username as author_name, u.avatar as author_avatar,
              c.name as category_name, c.slug as category_slug
       FROM posts p
       LEFT JOIN users u ON p.user_id = u.id
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.id = ?`,
      [id]
    );

    if (!rows[0]) return null;

    // 获取文章标签
    const [tags] = await pool.query(
      `SELECT t.id, t.name, t.slug
       FROM tags t
       INNER JOIN post_tags pt ON t.id = pt.tag_id
       WHERE pt.post_id = ?`,
      [id]
    );

    return { ...rows[0], tags };
  }

  /**
   * 根据 slug 查找文章
   * @param {string} slug
   * @returns {Object|null}
   */
  static async findBySlug(slug) {
    const [rows] = await pool.query(
      `SELECT p.*, u.username as author_name, u.avatar as author_avatar,
              c.name as category_name, c.slug as category_slug
       FROM posts p
       LEFT JOIN users u ON p.user_id = u.id
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.slug = ?`,
      [slug]
    );

    if (!rows[0]) return null;

    const [tags] = await pool.query(
      `SELECT t.id, t.name, t.slug
       FROM tags t
       INNER JOIN post_tags pt ON t.id = pt.tag_id
       WHERE pt.post_id = ?`,
      [rows[0].id]
    );

    return { ...rows[0], tags };
  }

  /**
   * 获取文章列表（分页 + 搜索 + 筛选）
   * @param {Object} options
   * @returns {Object}
   */
  static async findAll({
    page = 1,
    limit = 10,
    search = '',
    status = '',
    category_id = '',
    user_id = '',
    sort = 'created_at',
    order = 'DESC',
  } = {}) {
    const offset = (page - 1) * limit;
    const conditions = [];
    const params = [];

    // 搜索条件
    if (search) {
      conditions.push('(p.title LIKE ? OR p.content LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }

    if (status) {
      conditions.push('p.status = ?');
      params.push(status);
    }

    if (category_id) {
      conditions.push('p.category_id = ?');
      params.push(category_id);
    }

    if (user_id) {
      conditions.push('p.user_id = ?');
      params.push(user_id);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // 安全的排序字段白名单
    const allowedSorts = ['created_at', 'updated_at', 'title', 'view_count'];
    const safeSort = allowedSorts.includes(sort) ? sort : 'created_at';
    const safeOrder = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    // 获取总数
    const [countResult] = await pool.query(
      `SELECT COUNT(*) as total FROM posts p ${whereClause}`,
      params
    );
    const total = countResult[0].total;

    // 获取分页数据
    const [rows] = await pool.query(
      `SELECT p.id, p.title, p.slug, p.excerpt, p.cover_image, p.status,
              p.view_count, p.created_at, p.updated_at,
              u.username as author_name, u.avatar as author_avatar,
              c.name as category_name
       FROM posts p
       LEFT JOIN users u ON p.user_id = u.id
       LEFT JOIN categories c ON p.category_id = c.id
       ${whereClause}
       ORDER BY p.${safeSort} ${safeOrder}
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    return {
      posts: rows,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
    };
  }

  /**
   * 更新文章
   * @param {number} id
   * @param {Object} data
   * @returns {boolean}
   */
  static async update(id, { title, slug, content, excerpt, cover_image, status, category_id, tags }) {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      const updates = [];
      const values = [];

      if (title !== undefined) { updates.push('title = ?'); values.push(title); }
      if (slug !== undefined) { updates.push('slug = ?'); values.push(slug); }
      if (content !== undefined) { updates.push('content = ?'); values.push(content); }
      if (excerpt !== undefined) { updates.push('excerpt = ?'); values.push(excerpt); }
      if (cover_image !== undefined) { updates.push('cover_image = ?'); values.push(cover_image); }
      if (status !== undefined) { updates.push('status = ?'); values.push(status); }
      if (category_id !== undefined) { updates.push('category_id = ?'); values.push(category_id || null); }

      if (updates.length > 0) {
        values.push(id);
        await conn.query(`UPDATE posts SET ${updates.join(', ')} WHERE id = ?`, values);
      }

      // 更新标签关联
      if (tags !== undefined) {
        await conn.query('DELETE FROM post_tags WHERE post_id = ?', [id]);
        if (tags.length > 0) {
          const tagValues = tags.map(tagId => [id, tagId]);
          await conn.query('INSERT INTO post_tags (post_id, tag_id) VALUES ?', [tagValues]);
        }
      }

      await conn.commit();
      return true;
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }
  }

  /**
   * 删除文章
   * @param {number} id
   * @returns {boolean}
   */
  static async delete(id) {
    const [result] = await pool.query('DELETE FROM posts WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }

  /**
   * 增加浏览次数
   * @param {number} id
   */
  static async incrementViewCount(id) {
    await pool.query('UPDATE posts SET view_count = view_count + 1 WHERE id = ?', [id]);
  }

  /**
   * 获取用户的文章数量
   * @param {number} userId
   * @returns {number}
   */
  static async countByUser(userId) {
    const [rows] = await pool.query(
      'SELECT COUNT(*) as count FROM posts WHERE user_id = ?',
      [userId]
    );
    return rows[0].count;
  }
}

module.exports = Post;
