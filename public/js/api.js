/**
 * API 客户端模块
 * 封装所有与后端 API 的通信
 */
const API = (() => {
  const BASE_URL = '/api';

  /**
   * 通用请求方法
   */
  async function request(endpoint, options = {}) {
    const url = `${BASE_URL}${endpoint}`;
    const token = localStorage.getItem('token');

    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    // 如果有 body，序列化为 JSON
    if (config.body && typeof config.body === 'object') {
      config.body = JSON.stringify(config.body);
    }

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        // 如果 401 且不是登录请求，清除 token 并跳转
        if (response.status === 401 && !endpoint.includes('/auth/login')) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          if (!window.location.pathname.includes('login')) {
            window.location.href = '/login.html';
          }
        }
        throw new Error(data.message || `请求失败 (${response.status})`);
      }

      return data.data || data;
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('网络连接失败，请检查网络');
      }
      throw error;
    }
  }

  // ==================== 认证 API ====================
  return {
    // 用户注册
    register: (data) => request('/auth/register', {
      method: 'POST',
      body: data,
    }),

    // 用户登录
    login: (data) => request('/auth/login', {
      method: 'POST',
      body: data,
    }),

    // 用户登出
    logout: () => request('/auth/logout', {
      method: 'POST',
    }),

    // 获取当前用户信息
    getMe: () => request('/auth/me'),

    // 更新个人资料
    updateProfile: (data) => request('/auth/profile', {
      method: 'PUT',
      body: data,
    }),

    // 修改密码
    changePassword: (data) => request('/auth/password', {
      method: 'PUT',
      body: data,
    }),

    // ==================== 文章 API ====================

    // 获取文章列表（公开）
    getPosts: (params = {}) => {
      const query = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          query.append(key, value);
        }
      });
      return request(`/posts?${query.toString()}`);
    },

    // 获取我的文章列表
    getMyPosts: (params = {}) => {
      const query = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          query.append(key, value);
        }
      });
      return request(`/my/posts?${query.toString()}`);
    },

    // 获取单篇文章
    getPost: (id) => request(`/posts/${id}`),

    // 创建文章
    createPost: (data) => request('/posts', {
      method: 'POST',
      body: data,
    }),

    // 更新文章
    updatePost: (id, data) => request(`/posts/${id}`, {
      method: 'PUT',
      body: data,
    }),

    // 删除文章
    deletePost: (id) => request(`/posts/${id}`, {
      method: 'DELETE',
    }),

    // ==================== 分类/标签 API ====================

    // 获取所有分类
    getCategories: () => request('/categories'),

    // 获取所有标签
    getTags: () => request('/tags'),

    // ==================== 统计 API ====================
    getStats: () => request('/stats'),
  };
})();
