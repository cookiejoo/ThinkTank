# 故障排查

本文档提供常见问题和解决方案。

## 启动问题

### 问题：端口 3000 已被占用

**症状**：
```
Error: listen EADDRINUSE: address already in use :::3000
```

**解决方案**：

```bash
# 方法 1: 查找并终止占用进程
lsof -i :3000
kill -9 <PID>

# 方法 2: 使用其他端口
PORT=3001 npm run dev
```

### 问题：依赖安装失败

**症状**：
```
npm ERR! code EEXIST
npm ERR! Refusing to install package with same name
```

**解决方案**：

```bash
# 清理并重新安装
rm -rf node_modules package-lock.json
npm install
```

### 问题：环境变量未生效

**症状**：环境变量读取失败或使用默认值

**解决方案**：

1. 确保 `.env.local` 文件存在
2. 检查文件名拼写（正确是 `.env.local`，不是 `.env`）
3. 重启开发服务器

## 构建问题

### 问题：构建失败，内存不足

**症状**：
```
FATAL ERROR: Ineffective mark-compacts freed up to <number> bytes
```

**解决方案**：

```bash
# 增加 Node.js 内存限制
export NODE_OPTIONS="--max-old-space-size=4096"
npm run build
```

### 问题：TypeScript 错误

**症状**：类型检查失败

**解决方案**：

1. 检查类型定义
2. 使用 `// @ts-ignore` 谨慎使用（用于已知问题）
3. 确保依赖版本兼容

## 运行问题

### 问题：文件无法保存

**症状**：编辑后点击保存无响应

**解决方案**：

1. 检查项目是否为 Git 模式（Git 模式不支持编辑）
2. 检查文件权限
3. 检查浏览器控制台错误

### 问题：Git 同步失败

**症状**：定时任务日志显示同步失败

**解决方案**：

1. **验证仓库 URL**：
   ```bash
   # 测试连接
   git ls-remote <repo-url>
   ```

2. **验证 Token**（私有仓库）：
   - 确保 Token 有效
   - 确保配置了正确的仓库权限

3. **检查网络**：
   - 确保可以访问 Git 服务器
   - 检查防火墙设置

4. **手动触发同步**：
   - 重启应用
   - 或在设置页保存配置触发重新调度

### 问题：编辑器无法加载

**症状**：编辑器显示空白或错误

**解决方案**：

1. 清除浏览器缓存
2. 检查文件内容是否为有效的 Markdown
3. 检查 Frontmatter 格式

## 认证问题

### 问题：登录失败

**症状**：点击登录后无响应或返回错误

**解决方案**：

1. 检查用户名和密码
2. 确保运行了 `getUser()` 时的初始化逻辑
3. 检查浏览器控制台错误

### 问题：会话丢失

**症状**：频繁要求重新登录

**解决方案**：

1. 检查 `NEXTAUTH_SECRET` 是否稳定
2. 检查 `NEXTAUTH_URL` 配置
3. 增加会话时长：

```typescript
// 在 authOptions 中
session: {
  strategy: 'database',
  maxAge: 30 * 24 * 60 * 60, // 30 天
}
```

### 问题：OAuth 回调失败

**症状**：GitHub/Google 登录后回调失败

**解决方案**：

1. 确保 `NEXTAUTH_URL` 配置正确
2. 确保回调 URL 在 OAuth 应用中配置
3. 检查 HTTPS 配置（生产环境）

## 性能问题

### 问题：文件树加载慢

**症状**：打开项目时文件树加载缓慢

**解决方案**：

1. 检查文件数量（大量文件可能导致慢）
2. 考虑使用 `.gitignore` 排除不需要的文件
3. 检查服务器响应时间

### 问题：编辑器响应慢

**症状**：输入后延迟显示

**解决方案**：

1. 检查文件大小（大文件可能导致慢）
2. 使用 Source 模式（更快）
3. 检查浏览器性能

## 调试技巧

### 启用详细日志

在关键位置添加 `console.log`：

```typescript
console.log('[DEBUG] Loading project:', projectId);
console.log('[DEBUG] File tree:', treeData);
```

### 使用浏览器开发者工具

1. **Network 标签**：检查 API 请求和响应
2. **Console 标签**：查看错误和警告
3. **Application 标签**：检查本地存储和会话

### 检查 PM2 日志

```bash
pm2 logs thinktank
pm2 logs thinktank --lines 100
```

## 获取帮助

如果以上方法无法解决问题：

1. 查看 [GitHub Issues](https://github.com/your-repo/issues)
2. 提供详细的错误信息和复现步骤
3. 包含以下信息：
   - Node.js 版本
   - npm 版本
   - 操作系统
   - 浏览器（如果相关）
   - 错误堆栈

## 下一步

- [配置说明](./configuration.md) - 了解配置选项
- [开发指南](../development/) - 了解代码实现
