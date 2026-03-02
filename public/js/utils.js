/**
 * 工具函数模块
 * 通用的辅助函数：日期格式化、HTML转义、表单验证、Toast提示等
 */

// ==================== HTML 安全 ====================
/**
 * 转义 HTML 特殊字符，防止 XSS
 */
function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ==================== 日期格式化 ====================
/**
 * 格式化日期为易读格式
 * @param {string} dateStr - ISO 日期字符串
 * @returns {string}
 */
function formatDate(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now - date;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return '刚刚';
  if (minutes < 60) return `${minutes} 分钟前`;
  if (hours < 24) return `${hours} 小时前`;
  if (days < 7) return `${days} 天前`;

  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * 格式化为完整日期时间
 */
function formatDateTime(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ==================== 表单验证 ====================
/**
 * 验证邮箱格式
 */
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * 显示字段错误
 */
function showFieldError(fieldId, message) {
  const field = document.getElementById(fieldId);
  const errorEl = document.getElementById(fieldId + 'Error');
  if (field) field.classList.add('error');
  if (errorEl) {
    errorEl.textContent = message;
    errorEl.classList.remove('hidden');
  }
}

/**
 * 清除字段错误
 */
function clearFieldError(fieldId) {
  const field = document.getElementById(fieldId);
  const errorEl = document.getElementById(fieldId + 'Error');
  if (field) field.classList.remove('error');
  if (errorEl) errorEl.classList.add('hidden');
}

// ==================== Toast 提示 ====================
/**
 * 显示 Toast 消息
 * @param {string} message
 * @param {'success'|'error'|'warning'} type
 * @param {number} duration - 持续时间(ms)
 */
function showToast(message, type = 'success', duration = 3000) {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const icons = {
    success: '&#10004;',
    error: '&#10008;',
    warning: '&#9888;',
  };

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span>${icons[type] || ''}</span> ${escapeHtml(message)}`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('hide');
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// ==================== 文章卡片模板 ====================
/**
 * 生成文章卡片 HTML
 */
function createPostCard(post) {
  const categoryBadge = post.category_name
    ? `<span class="post-card-category">${escapeHtml(post.category_name)}</span>`
    : '';

  const authorInitial = post.author_name ? post.author_name.charAt(0).toUpperCase() : '?';

  return `
    <article class="post-card">
      <div class="post-card-image">
        ${post.cover_image
          ? `<img src="${escapeHtml(post.cover_image)}" alt="${escapeHtml(post.title)}" loading="lazy">`
          : `<span style="opacity:0.3;">&#128221;</span>`
        }
      </div>
      <div class="post-card-body">
        <div class="post-card-meta">
          ${categoryBadge}
          <span>${formatDate(post.created_at)}</span>
        </div>
        <h3 class="post-card-title">
          <a href="/post.html?id=${post.id}">${escapeHtml(post.title)}</a>
        </h3>
        <p class="post-card-excerpt">${escapeHtml(post.excerpt || '')}</p>
        <div class="post-card-footer">
          <span class="post-card-author">
            <span class="avatar-sm">${authorInitial}</span>
            ${escapeHtml(post.author_name || '未知')}
          </span>
          <span>&#128065; ${post.view_count || 0}</span>
        </div>
      </div>
    </article>
  `;
}

// ==================== 移动端菜单 ====================
document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.getElementById('mobileToggle');
  const nav = document.getElementById('navMenu');
  if (toggle && nav) {
    toggle.addEventListener('click', () => {
      nav.classList.toggle('show');
    });
    // 点击链接后关闭菜单
    nav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => nav.classList.remove('show'));
    });
  }
});
