/**
 * 请求验证中间件
 * 使用 express-validator 进行输入数据验证
 */
const { body, query, validationResult } = require('express-validator');

// 统一的验证结果处理
const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      success: false,
      message: '输入数据验证失败',
      errors: errors.array().map(err => ({
        field: err.path,
        message: err.msg,
      })),
    });
  }
  next();
};

// 用户注册验证规则
const registerRules = [
  body('username')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('用户名长度为 2-50 个字符')
    .matches(/^[\w\u4e00-\u9fa5]+$/)
    .withMessage('用户名只能包含字母、数字、下划线或中文'),
  body('email')
    .trim()
    .isEmail()
    .withMessage('请输入有效的邮箱地址')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6, max: 100 })
    .withMessage('密码长度至少 6 个字符'),
  handleValidation,
];

// 用户登录验证规则
const loginRules = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('请输入有效的邮箱地址')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('请输入密码'),
  handleValidation,
];

// 文章创建/更新验证规则
const postRules = [
  body('title')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('标题长度为 1-200 个字符'),
  body('content')
    .trim()
    .notEmpty()
    .withMessage('内容不能为空'),
  body('status')
    .optional()
    .isIn(['draft', 'published'])
    .withMessage('状态只能是 draft 或 published'),
  body('category_id')
    .optional({ nullable: true })
    .isInt({ min: 1 })
    .withMessage('分类 ID 必须是正整数'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('标签必须是数组'),
  handleValidation,
];

// 文章更新验证（字段可选）
const postUpdateRules = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('标题长度为 1-200 个字符'),
  body('content')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('内容不能为空'),
  body('status')
    .optional()
    .isIn(['draft', 'published'])
    .withMessage('状态只能是 draft 或 published'),
  handleValidation,
];

// 分页参数验证
const paginationRules = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('页码必须是正整数'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('每页数量为 1-100'),
  handleValidation,
];

// 用户资料更新验证
const profileUpdateRules = [
  body('username')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('用户名长度为 2-50 个字符'),
  body('bio')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('简介不超过 500 个字符'),
  handleValidation,
];

// 修改密码验证
const changePasswordRules = [
  body('currentPassword')
    .notEmpty()
    .withMessage('请输入当前密码'),
  body('newPassword')
    .isLength({ min: 6, max: 100 })
    .withMessage('新密码长度至少 6 个字符'),
  handleValidation,
];

module.exports = {
  registerRules,
  loginRules,
  postRules,
  postUpdateRules,
  paginationRules,
  profileUpdateRules,
  changePasswordRules,
};
