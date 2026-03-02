/**
 * 文章控制器
 * 处理文章的 CRUD 操作
 */
const Post = require('../models/Post');
const Category = require('../models/Category');
const Tag = require('../models/Tag');

/**
 * 生成 URL 友好的 slug
 */
function generateSlug(title) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[\s]+/g, '-')
    .replace(/[^\w\u4e00-\u9fa5-]/g, '')
    .replace(/--+/g, '-')
    .replace(/^-+|-+$/g, '')
    + '-' + Date.now().toString(36);
}

/**
 * 获取文章列表（公开）
 * GET /api/posts
 */
exports.getPosts = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      category_id = '',
      sort = 'created_at',
      order = 'DESC',
    } = req.query;

    const result = await Post.findAll({
      page: parseInt(page),
      limit: parseInt(limit),
      search,
      status: 'published', // 公开接口只显示已发布的
      category_id,
      sort,
      order,
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 获取当前用户的文章列表（含草稿）
 * GET /api/posts/my
 */
exports.getMyPosts = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      status = '',
    } = req.query;

    const result = await Post.findAll({
      page: parseInt(page),
      limit: parseInt(limit),
      search,
      status,
      user_id: req.user.id,
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 获取单篇文章详情
 * GET /api/posts/:id
 */
exports.getPost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: '文章不存在',
      });
    }

    // 如果文章是草稿，只有作者本人可以查看
    if (post.status === 'draft') {
      if (!req.user || req.user.id !== post.user_id) {
        return res.status(404).json({
          success: false,
          message: '文章不存在',
        });
      }
    }

    // 增加浏览次数
    await Post.incrementViewCount(post.id);

    res.json({
      success: true,
      data: { post: { ...post, view_count: post.view_count + 1 } },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 创建文章
 * POST /api/posts
 */
exports.createPost = async (req, res, next) => {
  try {
    const { title, content, excerpt, cover_image, status, category_id, tags } = req.body;

    const slug = generateSlug(title);

    const newPost = await Post.create({
      title,
      slug,
      content,
      excerpt: excerpt || content.replace(/<[^>]*>/g, '').substring(0, 200),
      cover_image,
      status: status || 'draft',
      user_id: req.user.id,
      category_id,
      tags,
    });

    const post = await Post.findById(newPost.id);

    res.status(201).json({
      success: true,
      message: '文章创建成功',
      data: { post },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 更新文章
 * PUT /api/posts/:id
 */
exports.updatePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: '文章不存在',
      });
    }

    // 只有作者或管理员可以编辑
    if (post.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: '没有权限编辑此文章',
      });
    }

    const { title, content, excerpt, cover_image, status, category_id, tags } = req.body;

    // 如果标题变了，重新生成 slug
    const slug = title && title !== post.title ? generateSlug(title) : undefined;

    await Post.update(post.id, {
      title,
      slug,
      content,
      excerpt,
      cover_image,
      status,
      category_id,
      tags,
    });

    const updatedPost = await Post.findById(post.id);

    res.json({
      success: true,
      message: '文章更新成功',
      data: { post: updatedPost },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 删除文章
 * DELETE /api/posts/:id
 */
exports.deletePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: '文章不存在',
      });
    }

    // 只有作者或管理员可以删除
    if (post.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: '没有权限删除此文章',
      });
    }

    await Post.delete(post.id);

    res.json({
      success: true,
      message: '文章已删除',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 获取所有分类
 * GET /api/categories
 */
exports.getCategories = async (req, res, next) => {
  try {
    const categories = await Category.findAll();
    res.json({ success: true, data: { categories } });
  } catch (error) {
    next(error);
  }
};

/**
 * 获取所有标签
 * GET /api/tags
 */
exports.getTags = async (req, res, next) => {
  try {
    const tags = await Tag.findAll();
    res.json({ success: true, data: { tags } });
  } catch (error) {
    next(error);
  }
};

/**
 * 获取统计数据（管理面板用）
 * GET /api/stats
 */
exports.getStats = async (req, res, next) => {
  try {
    const { pool } = require('../config/database');

    const [[{ totalPosts }]] = await pool.query('SELECT COUNT(*) as totalPosts FROM posts');
    const [[{ publishedPosts }]] = await pool.query("SELECT COUNT(*) as publishedPosts FROM posts WHERE status = 'published'");
    const [[{ totalUsers }]] = await pool.query('SELECT COUNT(*) as totalUsers FROM users');
    const [[{ totalViews }]] = await pool.query('SELECT COALESCE(SUM(view_count), 0) as totalViews FROM posts');
    const [[{ totalCategories }]] = await pool.query('SELECT COUNT(*) as totalCategories FROM categories');

    const myPosts = req.user
      ? (await Post.countByUser(req.user.id))
      : 0;

    res.json({
      success: true,
      data: {
        stats: {
          totalPosts,
          publishedPosts,
          draftPosts: totalPosts - publishedPosts,
          totalUsers,
          totalViews,
          totalCategories,
          myPosts,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};
