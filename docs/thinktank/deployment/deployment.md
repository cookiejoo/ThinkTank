# 部署指南

本文档介绍如何将 ThinkTank 部署到生产环境。

## 部署要求

- **Node.js**: 18.x 或更高版本
- **npm**: 用于构建项目
- **文件系统权限**: 对 `docs` 目录的读写权限

## 构建步骤

### 1. 安装依赖

```bash
npm install
```

### 2. 构建项目

```bash
npm run build
```

这将在 `.next` 目录生成优化后的生产版本。

### 3. 启动服务器

```bash
npm start
```

默认监听端口 3000。

## 环境变量

在生产环境中设置以下环境变量：

```bash
# 文档存储根目录（必填）
DOCS_ROOT=/path/to/your/docs

# 加密密钥（必填）
# 必须是 64 位十六进制字符串
ENCRYPTION_KEY=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef

# NextAuth 密钥（必填）
NEXTAUTH_SECRET=your_strong_random_secret
NEXTAUTH_URL=https://your-domain.com

# GitHub OAuth（可选）
GITHUB_ID=your_github_client_id
GITHUB_SECRET=your_github_client_secret

# Google OAuth（可选）
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

### 生成密钥

使用以下命令生成随机密钥：

```bash
# NextAuth Secret
openssl rand -base64 32

# 加密密钥（64 位十六进制）
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Docker 部署

### Dockerfile

创建 `Dockerfile`：

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

RUN npm run build

ENV DOCS_ROOT=/app/docs
ENV ENCRYPTION_KEY=your_encryption_key
ENV NEXTAUTH_SECRET=your_auth_secret
ENV NEXTAUTH_URL=https://your-domain.com

EXPOSE 3000

CMD ["npm", "start"]
```

### 构建和运行

```bash
# 构建镜像
docker build -t thinktank .

# 运行容器
docker run -p 3000:3000 \
  -e ENCRYPTION_KEY=your_key \
  -e NEXTAUTH_SECRET=your_secret \
  -e NEXTAUTH_URL=https://your-domain.com \
  -v /path/to/docs:/app/docs \
  thinktank
```

## 使用 PM2 运行

PM2 是 Node.js 进程管理器，适合生产环境。

### 安装 PM2

```bash
npm install -g pm2
```

### 启动应用

```bash
# 开发模式
pm2 start npm --name thinktank -- run dev

# 生产模式
pm2 start npm --name thinktank -- start
```

### 使用配置文件

创建 `ecosystem.config.js`：

```javascript
module.exports = {
  apps: [{
    name: 'thinktank',
    script: 'npm',
    args: 'start',
    cwd: '/path/to/thinktank',
    env: {
      NODE_ENV: 'production',
      DOCS_ROOT: '/path/to/docs',
      ENCRYPTION_KEY: 'your_key',
      NEXTAUTH_SECRET: 'your_secret',
      NEXTAUTH_URL: 'https://your-domain.com'
    }
  }]
};
```

启动：

```bash
pm2 start ecosystem.config.js
```

### 常用命令

```bash
pm2 status          # 查看状态
pm2 logs thinktank   # 查看日志
pm2 restart thinktank # 重启
pm2 stop thinktank    # 停止
pm2 delete thinktank  # 删除
```

## 使用 Nginx 反向代理

### 配置示例

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### HTTPS 配置

使用 Let's Encrypt 获取免费 SSL 证书：

```bash
sudo certbot --nginx -d your-domain.com
```

## 数据备份

由于所有数据存储在文件系统，备份非常简单：

### 使用 rsync

```bash
rsync -avz /path/to/docs/ /backup/location/
```

### 使用 tar

```bash
tar -czf backup-$(date +%Y%m%d).tar.gz /path/to/docs/
```

### 定期备份

使用 cron 定期备份：

```bash
# 每天凌晨 2 点备份
0 2 * * * /path/to/backup-script.sh
```

## 性能优化

### 1. 缓存配置

Next.js 自动处理缓存。确保配置正确：

```javascript
// next.config.js (如果需要)
module.exports = {
  // ...
};
```

### 2. 日志管理

配置日志轮转防止日志文件过大：

```bash
# 使用 pm2-logrotate
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M thinktank
```

### 3. 监控

使用 PM2 监控应用：

```bash
pm2 monit
```

## 故障排查

### 构建失败

**症状**：`npm run build` 失败

**解决方案**：
1. 清理缓存：`rm -rf .next`
2. 重新安装依赖：`rm -rf node_modules && npm install`
3. 检查 Node.js 版本

### 文件权限错误

**症状**：无法创建/修改文件

**解决方案**：
```bash
# 设置正确的权限
chmod -R 755 /path/to/docs
chown -R user:group /path/to/docs
```

### 端口被占用

**症状**：端口 3000 无法绑定

**解决方案**：
```bash
# 查找占用进程
lsof -i :3000

# 终止进程
kill -9 <PID>

# 或修改端口
PORT=3001 npm start
```

## 下一步

- [配置说明](./configuration.md) - 了解所有配置选项
- [故障排查](./troubleshooting.md) - 解决常见问题
