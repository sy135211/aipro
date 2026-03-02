/**
 * 数据库种子数据脚本
 * 运行: npm run seed
 * 功能: 插入示例数据用于开发和测试
 */
const bcrypt = require('bcryptjs');
const { pool } = require('../config/database');

async function seed() {
  try {
    console.log('🌱 开始填充种子数据...\n');

    // 1. 创建示例用户
    const hashedPassword = await bcrypt.hash('123456', 10);
    const users = [
      ['admin', 'admin@example.com', hashedPassword, '系统管理员，负责网站维护。', 'admin'],
      ['张三', 'zhangsan@example.com', hashedPassword, '热爱写作的全栈开发者。', 'user'],
      ['李四', 'lisi@example.com', hashedPassword, '前端工程师，喜欢分享技术。', 'user'],
    ];

    for (const user of users) {
      await pool.query(
        'INSERT IGNORE INTO users (username, email, password, bio, role) VALUES (?, ?, ?, ?, ?)',
        user
      );
    }
    console.log('✅ 示例用户已创建（密码均为: 123456）');

    // 2. 创建分类
    const categories = [
      ['前端开发', 'frontend', '关于HTML、CSS、JavaScript等前端技术'],
      ['后端开发', 'backend', '关于Node.js、Python、Java等后端技术'],
      ['数据库', 'database', '关于MySQL、MongoDB等数据库技术'],
      ['DevOps', 'devops', '关于部署、运维、CI/CD等'],
      ['生活随笔', 'life', '技术之外的生活感悟'],
    ];

    for (const cat of categories) {
      await pool.query(
        'INSERT IGNORE INTO categories (name, slug, description) VALUES (?, ?, ?)',
        cat
      );
    }
    console.log('✅ 示例分类已创建');

    // 3. 创建标签
    const tags = [
      ['JavaScript', 'javascript'],
      ['Node.js', 'nodejs'],
      ['MySQL', 'mysql'],
      ['CSS', 'css'],
      ['HTML', 'html'],
      ['Express', 'express'],
      ['API', 'api'],
      ['安全', 'security'],
    ];

    for (const tag of tags) {
      await pool.query(
        'INSERT IGNORE INTO tags (name, slug) VALUES (?, ?)',
        tag
      );
    }
    console.log('✅ 示例标签已创建');

    // 4. 创建示例文章
    const posts = [
      {
        title: 'Node.js 入门指南',
        slug: 'nodejs-getting-started',
        content: `<h2>什么是 Node.js？</h2>
<p>Node.js 是一个基于 Chrome V8 引擎的 JavaScript 运行时环境。它使用事件驱动、非阻塞 I/O 模型，使其轻量且高效。</p>
<h2>安装 Node.js</h2>
<p>访问 <a href="https://nodejs.org">nodejs.org</a> 下载最新的 LTS 版本。安装完成后，可以在终端中运行以下命令验证：</p>
<pre><code>node --version
npm --version</code></pre>
<h2>创建第一个应用</h2>
<p>创建一个 <code>app.js</code> 文件，写入以下代码：</p>
<pre><code>const http = require('http');
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Hello World!');
});
server.listen(3000, () => console.log('Server running on port 3000'));</code></pre>
<p>然后运行 <code>node app.js</code>，打开浏览器访问 <code>http://localhost:3000</code> 即可看到结果。</p>`,
        excerpt: 'Node.js 是一个基于 Chrome V8 引擎的 JavaScript 运行时环境，本文带你快速入门。',
        status: 'published',
        user_id: 1,
        category_id: 2,
        tags: [2, 7],
      },
      {
        title: 'MySQL 数据库设计最佳实践',
        slug: 'mysql-best-practices',
        content: `<h2>数据库设计原则</h2>
<p>良好的数据库设计是应用成功的基石。以下是一些关键的设计原则：</p>
<h3>1. 规范化</h3>
<p>遵循数据库规范化原则（至少到第三范式），减少数据冗余，确保数据一致性。</p>
<h3>2. 合理使用索引</h3>
<p>索引能显著提升查询性能，但过多的索引会影响写入性能。应根据实际查询模式添加索引。</p>
<h3>3. 选择合适的数据类型</h3>
<p>使用最小但足够的数据类型。例如，如果一个字段只需要存储 0-255 的整数，使用 TINYINT 而不是 INT。</p>
<h3>4. 使用外键约束</h3>
<p>外键约束可以维护数据的参照完整性，防止孤立数据的产生。</p>`,
        excerpt: '良好的数据库设计是应用成功的基石，本文介绍 MySQL 数据库设计的最佳实践。',
        status: 'published',
        user_id: 1,
        category_id: 3,
        tags: [3],
      },
      {
        title: '使用 Express.js 构建 RESTful API',
        slug: 'express-restful-api',
        content: `<h2>RESTful API 设计</h2>
<p>REST（Representational State Transfer）是一种软件架构风格，用于设计网络应用的 API。</p>
<h2>Express.js 简介</h2>
<p>Express.js 是 Node.js 最流行的 Web 框架，提供了简洁而灵活的 API 来构建 Web 应用和 API。</p>
<h2>路由设计</h2>
<p>好的 RESTful API 应该遵循以下设计原则：</p>
<ul>
<li>使用名词而非动词表示资源</li>
<li>使用 HTTP 方法表示操作（GET、POST、PUT、DELETE）</li>
<li>使用适当的 HTTP 状态码</li>
<li>支持分页、过滤和排序</li>
</ul>`,
        excerpt: 'Express.js 是 Node.js 最流行的 Web 框架，本文教你如何用它构建 RESTful API。',
        status: 'published',
        user_id: 2,
        category_id: 2,
        tags: [2, 6, 7],
      },
      {
        title: 'CSS Grid 布局完全指南',
        slug: 'css-grid-guide',
        content: `<h2>CSS Grid 简介</h2>
<p>CSS Grid 是一种二维布局系统，可以同时处理行和列。它是目前最强大的 CSS 布局方案。</p>
<h2>基本概念</h2>
<p>Grid 容器（Grid Container）和 Grid 项（Grid Items）是两个核心概念。</p>
<h2>实用示例</h2>
<pre><code>.container {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}</code></pre>`,
        excerpt: 'CSS Grid 是目前最强大的 CSS 布局方案，本文带你全面了解。',
        status: 'published',
        user_id: 3,
        category_id: 1,
        tags: [4, 5],
      },
      {
        title: 'Web 应用安全入门',
        slug: 'web-security-basics',
        content: `<h2>Web 安全的重要性</h2>
<p>随着互联网的普及，Web 安全变得越来越重要。了解常见的安全威胁和防护措施是每个开发者的必修课。</p>
<h2>常见攻击类型</h2>
<h3>XSS (跨站脚本攻击)</h3>
<p>攻击者注入恶意脚本到网页中，窃取用户数据。防护方法：输入验证、输出编码。</p>
<h3>SQL 注入</h3>
<p>攻击者通过输入恶意 SQL 代码来操纵数据库。防护方法：使用参数化查询。</p>
<h3>CSRF (跨站请求伪造)</h3>
<p>攻击者诱导用户执行非预期的操作。防护方法：使用 CSRF Token。</p>`,
        excerpt: '了解常见的 Web 安全威胁和防护措施是每个开发者的必修课。',
        status: 'draft',
        user_id: 2,
        category_id: 2,
        tags: [1, 8],
      },
    ];

    for (const post of posts) {
      const { tags: tagIds, ...postData } = post;
      const [result] = await pool.query(
        'INSERT IGNORE INTO posts (title, slug, content, excerpt, status, user_id, category_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [postData.title, postData.slug, postData.content, postData.excerpt, postData.status, postData.user_id, postData.category_id]
      );
      if (result.insertId && tagIds) {
        for (const tagId of tagIds) {
          await pool.query(
            'INSERT IGNORE INTO post_tags (post_id, tag_id) VALUES (?, ?)',
            [result.insertId, tagId]
          );
        }
      }
    }
    console.log('✅ 示例文章已创建');

    console.log('\n🎉 种子数据填充完成！');
    console.log('提示: 可以使用以下账号登录:');
    console.log('  管理员 - 邮箱: admin@example.com  密码: 123456');
    console.log('  用户1  - 邮箱: zhangsan@example.com  密码: 123456');
    console.log('  用户2  - 邮箱: lisi@example.com  密码: 123456');

  } catch (error) {
    console.error('❌ 种子数据填充失败:', error.message);
  } finally {
    await pool.end();
  }
}

seed();
