# 快速开始

本指南将帮助你在几分钟内启动和运行 ThinkTank。

## 环境要求

- **Node.js**: 18.x 或更高版本
- **npm** 或 **yarn** / **pnpm**: 包管理器

## 安装步骤

### 1. 克隆仓库

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

### 3. 配置环境变量

复制 `.env.example` 文件并创建 `.env.local`：

```bash
cp .env.example .env.local
```

然后填写 `.env.local` 中需要的值。

#### 必填变量

**ENCRYPTION_KEY**：用于加密敏感数据（如 Git Token）的 32 字节密钥。

```bash
# 使用 openssl 生成 32 字节（64 位十六进制）密钥
openssl rand -hex 32
```

将生成的密钥填入：

```bash
ENCRYPTION_KEY=0123456789abcdef0123456789abcdef0123456789abcdef
```

**NEXTAUTH_SECRET**：用于签名和加密会话数据的安全密钥。

```bash
# 使用 openssl 生成 32 字节 Base64 编码密钥
openssl rand -base64 32
```

将生成的密钥填入：

```bash
NEXTAUTH_SECRET=your_strong_random_secret
```

#### 可选变量

**DOCS_ROOT**：文档存储根目录（默认为 `docs` 文件夹）

```bash
# 如果注释掉，默认使用项目根目录下的 docs 文件夹
# DOCS_ROOT=/path/to/your/docs
```

**NEXTAUTH_URL**：应用的完整 URL（默认为 `http://localhost:3000`）

```bash
# 生产环境需要设置实际域名
NEXTAUTH_URL=https://your-domain.com
```

### 4. 运行开发服务器

```bash
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000)

## 默认账号

系统预置了一个管理员账号用于测试：

## 项目目录结构

启动后，项目将自动在配置的 `DOCS_ROOT` 目录下创建以下结构：

```
docs/
├── .thinktank/              # 系统配置目录
│   ├── config.json          # 全局配置（如果有）
│   ├── groups.json          # 分组配置
│   └── users/              # 用户个性化数据
│       └── [userId].json     # 各用户的收藏和最近访问
└── [project-id]/           # 各项目目录
    ├── .thinktank/          # 项目配置
    │   └── config.json      # 项目配置文件
    ├── *.md                # Markdown 文档
    └── .temp/              # Git 模式专用
        └── repo/            # 持久化的 Git 仓库
```

## 创建第一个项目

1. 访问 [http://localhost:3000/admin](http://localhost:3000/admin)
2. 使用默认账号登录
3. 点击 "Add Project"
4. 填写项目信息：
  - **Project ID**: 项目唯一标识（将作为文件夹名）
  - **Description**: 项目描述
  - **Group**: 选择或创建分组
  - **Mode**: 选择 `Edit` 或 `Git`

### 创建 Git 镜像项目

如果选择 Git 模式，需要额外填写：

- **Repository URL**: Git 仓库地址（如 `https://github.com/user/repo.git`）
- **Branch**: 要同步的分支（如 `main`）
- **Root Path**: 仓库中的子目录路径（可选）
- **Personal Access Token**: 访问私有仓库的 Token（将被加密存储）
- **Sync Interval**: 同步间隔（分钟）

## 下一步

- [系统架构](../architecture/system-architecture.md) - 了解技术架构
- [项目结构](../development/project-structure.md) - 了解代码组织

&nbsp;