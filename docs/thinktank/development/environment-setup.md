# 开发环境配置

本文档介绍如何配置 ThinkTank 的开发环境。

## 前置要求

- Node.js 18.x 或更高版本
- npm、yarn 或 pnpm
- Git（用于克隆项目）

## 安装步骤

### 1. 克隆项目

```bash
git clone <repository-url>
cd thinktank
```

### 2. 安装依赖

```bash
npm install
# 或
yarn install
# 或
pnpm install
```

### 3. 环境变量配置

项目包含一个环境模板文件 `.env.example`。首先，将它复制一份并命名为 `.env.local`：

```bash
cp .env.example .env.local
```

接下来，打开 `.env.local` 文件并填写必要的密钥。

```bash
# .env.local

# NextAuth.js 的应用 URL
NEXTAUTH_URL=http://localhost:3000

# 用于签名会话的密钥。运行 `openssl rand -base64 32` 生成
NEXTAUTH_SECRET=

# 用于加密数据的密钥。运行 `openssl rand -hex 32` 生成
ENCRYPTION_KEY=

# 文档存储根目录（可选），默认为 'docs'
# DOCS_ROOT=
```

#### 生成密钥

您需要为 `NEXTAUTH_SECRET` 和 `ENCRYPTION_KEY` 生成安全的随机密钥。打开终端并运行以下命令：

```bash
# 为 NEXTAUTH_SECRET 生成密钥
openssl rand -base64 32

# 为 ENCRYPTION_KEY 生成密钥
openssl rand -hex 32
```

将命令生成的对应值复制并粘贴到 `.env.local` 文件中。

### 4. 运行开发服务器

```bash
npm run dev
```

访问 http://localhost:3000

## 可用脚本

| 命令 | 说明 |
|-----|------|
| `npm run dev` | 启动开发服务器（端口 3000）|
| `npm run build` | 构建生产版本 |
| `npm start` | 启动生产服务器 |
| `npm run lint` | 运行 ESLint 检查 |

## 默认账户

首次启动时，系统会预置测试账户：

| 用户名 | 密码 | 角色 |
|-------|-------|------|
| admin | 123 | admin |
| user1 | 123 | user |

## 目录结构

运行后，将在配置的 `DOCS_ROOT` 目录下创建：

```
docs/
├── .thinktank/              # 系统配置（自动创建）
└── [project-id]/           # 项目目录（创建项目后创建）
```

## VS Code 配置（可选）

### 推荐扩展

- **TypeScript Vue Plugin (Volar)**: TypeScript 支持
- **Tailwind CSS IntelliSense**: Tailwind 类名提示
- **ESLint**: 代码检查

### 工作区设置

创建 `.vscode/settings.json`：

```json
{
  "typescript.tsdk": "node_modules/typescript/lib",
  "tailwindCSS.experimental.classRegex": [
    ["cva\\(([^)]*)\\)", "[\"'`]([^\"'`]*)[\"'`]"]
  ],
  "editor.quickSuggestions": {
    "strings": true
  }
}
```

## 故障排查

### 端口被占用

如果 3000 端口被占用：

```bash
# 查找占用端口的进程
lsof -i :3000

# 终止进程
kill -9 <PID>

# 或使用其他端口
PORT=3001 npm run dev
```

### 加密密钥错误

如果看到以下错误：

```
Error: ENCRYPTION_KEY in .env.local is not set or is not a 64-character hex string.
```

解决方法：
1. 确保 `.env.local` 文件存在
2. 确保 `ENCRYPTION_KEY` 是 64 位十六进制字符串
3. 使用上述脚本重新生成密钥

### 模块未找到

如果遇到模块导入错误：

```bash
# 清理缓存和重新安装
rm -rf node_modules package-lock.json
npm install
```

## 开发建议

### 热重载

Next.js 支持热重载，修改代码后会自动刷新浏览器。

### 调试

使用 `console.log` 或浏览器开发者工具进行调试。

### Git 忽略

项目 `.gitignore` 已配置忽略：
- `node_modules/`
- `.next/`
- `.env.local`
- `docs/` （运行时数据）

## 下一步

- [项目结构](./project-structure.md) - 了解代码组织
- [组件开发](./components.md) - 开始开发组件
