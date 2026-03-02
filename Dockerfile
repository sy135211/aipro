# 适用于任何支持 Docker 的云平台（Railway / Render / 阿里云 / 腾讯云等）
FROM node:18-alpine

WORKDIR /app

# 安装依赖（利用 Docker 缓存层）
COPY package*.json ./
RUN npm ci --omit=dev

# 复制项目文件
COPY . .

# 暴露端口（Railway 等平台会自动注入 PORT 环境变量）
EXPOSE 3000

# 启动时先运行数据库迁移，再启动服务器
CMD ["sh", "-c", "npm run migrate && npm start"]
