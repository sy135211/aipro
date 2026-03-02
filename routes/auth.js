/**
 * 认证路由
 * 处理用户注册、登录、登出及个人信息相关路由
 */
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const {
  registerRules,
  loginRules,
  profileUpdateRules,
  changePasswordRules,
} = require('../middleware/validator');

// 公开路由
router.post('/register', registerRules, authController.register);
router.post('/login', loginRules, authController.login);
router.post('/logout', authController.logout);

// 需要认证的路由
router.get('/me', authenticate, authController.getMe);
router.put('/profile', authenticate, profileUpdateRules, authController.updateProfile);
router.put('/password', authenticate, changePasswordRules, authController.changePassword);

module.exports = router;
