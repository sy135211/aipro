/**
 * 主服务器入口文件
 * 全栈博客内容管理系统
 */
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const path = require('path');

const { testConnection } = require('./config/database');
const { notFound, errorHandler } = require('./middleware/errorHandler');
const authRoutes = require('./routes/auth');
const postRoutes = require('./routes/posts');

const app = express();
const PORT = process.env.PORT || 3000;

// ==================== 中间件配置 ====================

// 安全头设置（允许 CDN 资源加载）
app.use(helmet({
  contentSecurityPolicy: false,  // 禁用 CSP 以兼容 CDN 和内联脚本
  crossOriginEmbedderPolicy: false,
}));

// CORS 配置（生产环境允许同源，开发环境可配置）
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? true : (process.env.CORS_ORIGIN || 'http://localhost:3000'),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// 压缩响应
app.use(compression());

// 请求日志（开发环境详细，生产环境简洁）
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// 请求体解析
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Cookie 解析
app.use(cookieParser());

// 速率限制 - 防止暴力攻击
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 分钟
  max: 100,                  // 每个 IP 最多 100 次请求
  message: JSON.stringify({
    success: false,
    message: '请求过于频繁，请稍后再试',
  }),
});

// 登录/注册接口更严格的速率限制
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: JSON.stringify({
    success: false,
    message: '登录/注册尝试过于频繁，请15分钟后再试',
  }),
});

// ==================== 静态文件服务 ====================
app.use(express.static(path.join(__dirname, 'public'), {
  maxAge: process.env.NODE_ENV === 'production' ? '1d' : 0,
}));

// ==================== API 路由 ====================
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api', apiLimiter, postRoutes);

// ==================== 前端页面路由 ====================
// 所有非 API 路由返回前端页面（SPA 风格）
app.get('*', (req, res) => {
  // 对 API 路由返回 404 JSON
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({
      success: false,
      message: `未找到路由: ${req.method} ${req.originalUrl}`,
    });
  }
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ==================== 错误处理 ====================
app.use(notFound);
app.use(errorHandler);

// ==================== 启动服务器 ====================
async function startServer() {
  // 测试数据库连接
  const dbConnected = await testConnection();

  app.listen(PORT, () => {
    console.log(`
╔══════════════════════════════════════════════╗
║     全栈博客内容管理系统 已启动!              ║
╠══════════════════════════════════════════════╣
║  地址:  http://localhost:${PORT}               ║
║  环境:  ${(process.env.NODE_ENV || 'development').padEnd(36)}║
║  数据库: ${dbConnected ? '✅ 已连接' : '❌ 未连接'}${' '.repeat(27)}║
╚══════════════════════════════════════════════╝
    `);

    if (!dbConnected) {
      console.log('⚠️  数据库未连接，部分功能可能不可用');
      console.log('   请检查 .env 中的数据库配置，然后运行 npm run migrate');
    }
  });
}

startServer().catch(console.error);

module.exports = app;
