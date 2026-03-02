/**
 * 认证控制器
 * 处理用户注册、登录、登出及个人信息管理
 */
const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * 生成 JWT Token
 * @param {Object} user
 * @returns {string}
 */
const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

/**
 * 用户注册
 * POST /api/auth/register
 */
exports.register = async (req, res, next) => {
  try {
    const { username, email, password } = req.body;

    // 检查邮箱是否已注册
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: '该邮箱已被注册',
      });
    }

    // 检查用户名是否已存在
    const existingUsername = await User.findByUsername(username);
    if (existingUsername) {
      return res.status(409).json({
        success: false,
        message: '该用户名已被使用',
      });
    }

    // 创建用户
    const newUser = await User.create({ username, email, password });

    // 生成 token
    const user = await User.findById(newUser.id);
    const token = generateToken(user);

    // 设置 cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 天
    });

    res.status(201).json({
      success: true,
      message: '注册成功',
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 用户登录
 * POST /api/auth/login
 */
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // 查找用户（含密码字段）
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: '邮箱或密码错误',
      });
    }

    // 验证密码
    const isMatch = await User.comparePassword(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: '邮箱或密码错误',
      });
    }

    // 检查账户状态
    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        message: '账户已被禁用，请联系管理员',
      });
    }

    // 生成 token
    const token = generateToken(user);

    // 设置 cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      success: true,
      message: '登录成功',
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 用户登出
 * POST /api/auth/logout
 */
exports.logout = async (req, res) => {
  res.clearCookie('token');
  res.json({
    success: true,
    message: '已成功登出',
  });
};

/**
 * 获取当前用户信息
 * GET /api/auth/me
 */
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    res.json({
      success: true,
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 更新个人资料
 * PUT /api/auth/profile
 */
exports.updateProfile = async (req, res, next) => {
  try {
    const { username, bio, avatar } = req.body;

    // 如果修改了用户名，检查是否与他人冲突
    if (username && username !== req.user.username) {
      const existing = await User.findByUsername(username);
      if (existing) {
        return res.status(409).json({
          success: false,
          message: '该用户名已被使用',
        });
      }
    }

    await User.update(req.user.id, { username, bio, avatar });
    const updatedUser = await User.findById(req.user.id);

    res.json({
      success: true,
      message: '个人资料更新成功',
      data: { user: updatedUser },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 修改密码
 * PUT /api/auth/password
 */
exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // 获取完整用户信息（含密码）
    const user = await User.findByEmail(req.user.email);

    // 验证当前密码
    const isMatch = await User.comparePassword(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: '当前密码错误',
      });
    }

    await User.changePassword(req.user.id, newPassword);

    res.json({
      success: true,
      message: '密码修改成功',
    });
  } catch (error) {
    next(error);
  }
};
