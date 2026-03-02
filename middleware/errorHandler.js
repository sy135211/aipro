/**
 * 全局错误处理中间件
 * 统一捕获和格式化所有错误响应
 */

// 404 处理 - 未找到路由
const notFound = (req, res, next) => {
  // 如果是 API 请求返回 JSON
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({
      success: false,
      message: `未找到路由: ${req.method} ${req.originalUrl}`,
    });
  }
  next();
};

// 全局错误处理
const errorHandler = (err, req, res, _next) => {
  console.error('🔥 错误:', err);

  let statusCode = err.statusCode || 500;
  let message = err.message || '服务器内部错误';

  // MySQL 错误处理
  if (err.code === 'ER_DUP_ENTRY') {
    statusCode = 409;
    message = '数据已存在（唯一约束冲突）';
    // 尝试解析具体的重复字段
    if (err.message.includes('username')) message = '用户名已被使用';
    if (err.message.includes('email')) message = '邮箱已被注册';
    if (err.message.includes('slug')) message = 'URL 别名已存在';
  }

  if (err.code === 'ER_NO_REFERENCED_ROW_2') {
    statusCode = 400;
    message = '关联数据不存在（外键约束失败）';
  }

  if (err.code === 'ER_DATA_TOO_LONG') {
    statusCode = 400;
    message = '输入数据过长';
  }

  // 验证错误
  if (err.type === 'validation') {
    statusCode = 422;
  }

  // 生产环境不暴露错误详情
  const response = {
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && {
      stack: err.stack,
      code: err.code,
    }),
  };

  res.status(statusCode).json(response);
};

module.exports = { notFound, errorHandler };
