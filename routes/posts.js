/**
 * 文章路由
 * 处理文章 CRUD、分类、标签和统计相关路由
 */
const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController');
const { authenticate, optionalAuth } = require('../middleware/auth');
const {
  postRules,
  postUpdateRules,
  paginationRules,
} = require('../middleware/validator');

// 公开路由
router.get('/categories', postController.getCategories);
router.get('/tags', postController.getTags);
router.get('/posts', paginationRules, postController.getPosts);
router.get('/posts/:id', optionalAuth, postController.getPost);

// 需要认证的路由
router.get('/my/posts', authenticate, paginationRules, postController.getMyPosts);
router.post('/posts', authenticate, postRules, postController.createPost);
router.put('/posts/:id', authenticate, postUpdateRules, postController.updatePost);
router.delete('/posts/:id', authenticate, postController.deletePost);

// 统计
router.get('/stats', optionalAuth, postController.getStats);

module.exports = router;
