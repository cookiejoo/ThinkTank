# 配置说明

本文档详细说明 ThinkTank 的所有配置选项。

## 环境变量

所有配置通过环境变量设置，模板文件位于 `.env.example`。

### 使用方法

复制模板并创建本地配置：

```bash
cp .env.example .env.local
```

然后填写 `.env.local` 中需要的值。

### 必填变量

#### ENCRYPTION_KEY

用于加密敏感数据（如 Git Token）的 32 字节密钥。

**要求**：
- 必须是 64 位十六进制字符串
- 用于 AES-256-CBC 加密算法

**生成方法**：

```bash
openssl rand -hex 32
```

**配置示例**：

```bash
ENCRYPTION_KEY=0123456789abcdef0123456789abcdef0123456789abcdef
```

#### NEXTAUTH_SECRET

NextAuth.js 的会话密钥。

**要求**：
- 用于加密 JWT Token
- 建议使用 32 字节以上的随机字符串

**生成方法**：

```bash
openssl rand -base64 32
```

**配置示例**：

```bash
NEXTAUTH_SECRET=your_strong_random_secret
```

### 可选变量

#### DOCS_ROOT

文档存储的根目录。

**默认值**：`process.cwd() + '/docs'`

**配置示例**：

```bash
# 如果注释掉，默认使用项目根目录下的 docs 文件夹
# DOCS_ROOT=/path/to/your/docs
```

**说明**：
- 指定所有项目和系统配置的存储位置
- 目录不存在时自动创建
- 支持绝对路径

#### NEXTAUTH_URL

应用的完整 URL。

**默认值**：`http://localhost:3000`

**配置示例**：

```bash
# 生产环境需要设置实际域名
NEXTAUTH_URL=https://your-domain.com
```

**说明**：
- 用于 OAuth 回调
- 必须与实际访问 URL 一致

## 项目配置

每个项目有独立的配置文件：`docs/[projectId]/.thinktank/config.json`

### 基础配置

```json
{
  "description": "项目描述",
  "mode": "edit",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "isDeleted": false
}
```

| 字段 | 类型 | 说明 |
|-----|------|------|
| `description` | string | 项目描述，显示在首页 |
| `mode` | enum | `edit` 或 `git` |
| `createdAt` | string | 项目创建时间（ISO 8601）|
| `isDeleted` | boolean | 是否被逻辑删除 |

### Git 模式配置

```json
{
  "gitConfig": {
    "repoUrl": "https://github.com/user/repo.git",
    "branch": "main",
    "rootPath": "docs/articles",
    "token": "encrypted_token_here",
    "syncInterval": 5
  }
}
```

| 字段 | 类型 | 说明 |
|-----|------|------|
| `repoUrl` | string | Git 仓库地址（必填）|
| `branch` | string | 要同步的分支（必填）|
| `rootPath` | string | 仓库中的子目录（可选）|
| `token` | string | 加密后的 PAT（可选）|
| `syncInterval` | number | 同步间隔，单位分钟（必填）|

### 文件元数据配置

```json
{
  "files": {
    "/docs/intro.md": {
      "isDeleted": false,
      "isHidden": false,
      "sortOrder": 1
    }
  }
}
```

| 字段 | 类型 | 说明 |
|-----|------|------|
| `isDeleted` | boolean | 文件是否被逻辑删除 |
| `isHidden` | boolean | 文件是否隐藏 |
| `sortOrder` | number | 文件排序优先级 |

## 分组配置

全局分组配置：`docs/.thinktank/groups.json`

```json
[
  {
    "name": "核心项目",
    "projects": ["thinktank-docs", "api-reference"],
    "isDeleted": false
  }
]
```

| 字段 | 类型 | 说明 |
|-----|------|------|
| `name` | string | 分组名称，唯一 |
| `projects` | string[] | 项目 ID 列表 |
| `isDeleted` | boolean | 是否被逻辑删除 |

## NextAuth 配置

位置：`app/api/auth/[...nextauth]/route.ts`

### 支持的提供商

```typescript
export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({ ... }),
  ],
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async jwt({ token, user }) { ... },
    async session({ session, token }) { ... }
  }
};
```

### 会话回调

#### JWT Callback

将用户信息添加到 JWT Token：

```typescript
async jwt({ token, user }) {
  if (user) {
    token.id = user.id;
    token.role = user.role;
    token.accessibleProjects = user.accessibleProjects;
  }
  return token;
}
```

#### Session Callback

将 JWT 信息添加到会话：

```typescript
async session({ session, token }) {
  if (session.user) {
    session.user.id = token.id;
    session.user.role = token.role;
    session.user.accessibleProjects = token.accessibleProjects;
  }
  return session;
}
```

## 用户配置

每个用户的个性化配置：`docs/.thinktank/users/[userId].json`

```json
{
  "starred": ["/docs/intro.md", "/docs/guide.md"],
  "recent": ["/docs/new.md", "/docs/old.md"]
}
```

## 默认用户

位置：`docs/.thinktank/users.json`

```json
[
  {
    "id": "1",
    "username": "admin",
    "passwordHash": "$2b$10$7wfcX9s66eKAV.d5jFh5/OOZZ/yVRWPM8o/PeTO3omFvDxJoz0Bxa",
    "role": "admin",
    "accessibleProjects": []
  }
]
```

## 下一步

- [部署指南](./deployment.md) - 了解如何部署
- [故障排查](./troubleshooting.md) - 解决常见问题
