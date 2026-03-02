/**
 * 认证状态管理模块
 * 管理用户登录状态、导航栏更新和全局认证逻辑
 */
const Auth = (() => {
  /**
   * 检查用户是否已登录
   */
  function isLoggedIn() {
    return !!localStorage.getItem('token');
  }

  /**
   * 获取当前用户信息
   */
  function getUser() {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }

  /**
   * 保存登录信息
   */
  function setToken(token, user) {
    localStorage.setItem('token', token);
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    }
    updateNavUser();
  }

  /**
   * 清除登录信息
   */
  function clearAuth() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  return { isLoggedIn, getUser, setToken, clearAuth };
})();

/**
 * 更新导航栏用户显示
 */
function updateNavUser() {
  const guestActions = document.getElementById('guestActions');
  const userActions = document.getElementById('userActions');
  const navDashboard = document.getElementById('navDashboard');

  if (Auth.isLoggedIn()) {
    const user = Auth.getUser();
    if (guestActions) guestActions.classList.add('hidden');
    if (userActions) userActions.classList.remove('hidden');
    if (navDashboard) navDashboard.classList.remove('hidden');

    // 更新头像和用户名
    const avatarEl = document.getElementById('userAvatarNav');
    const nameEl = document.getElementById('usernameNav');
    if (user) {
      if (avatarEl) avatarEl.textContent = user.username ? user.username.charAt(0).toUpperCase() : 'U';
      if (nameEl) nameEl.textContent = user.username || '用户';
    }
  } else {
    if (guestActions) guestActions.classList.remove('hidden');
    if (userActions) userActions.classList.add('hidden');
    if (navDashboard) navDashboard.classList.add('hidden');
  }
}

/**
 * 全局登出函数
 */
async function handleLogout() {
  try {
    await API.logout();
  } catch {
    // 即使 API 失败也清除本地状态
  }
  Auth.clearAuth();
  window.location.href = '/';
}

// ==================== 用户下拉菜单 ====================
document.addEventListener('DOMContentLoaded', () => {
  // 更新导航栏
  updateNavUser();

  // 用户下拉菜单开关
  const menuToggle = document.getElementById('userMenuToggle');
  const dropdown = document.getElementById('userDropdown');

  if (menuToggle && dropdown) {
    menuToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      dropdown.classList.toggle('show');
    });

    // 点击其他地方关闭
    document.addEventListener('click', (e) => {
      if (!dropdown.contains(e.target) && !menuToggle.contains(e.target)) {
        dropdown.classList.remove('show');
      }
    });
  }
});
