# 项目结构

本文档详细说明 ThinkTank 项目的代码组织结构。

## 目录结构

```
thinktank/
├── app/                         # Next.js App Router 应用
│   ├── api/                     # API 路由
│   │   ├── auth/               # NextAuth 认证
│   │   │   └── [...nextauth]/route.ts
│   │   ├── projects/            # 项目管理 API
│   │   │   ├── route.ts
│   │   │   └── [id]/
│   │   ├── files/              # 文件操作 API
│   │   │   ├── tree/route.ts
│   │   │   ├── content/route.ts
│   │   │   ├── create/route.ts
│   │   │   ├── rename/route.ts
│   │   │   ├── delete/route.ts
│   │   │   ├── sort/route.ts
│   │   │   └── visibility/route.ts
│   │   ├── groups/              # 分组管理
│   │   │   └── route.ts
│   │   ├── users/               # 用户相关
│   │   │   ├── route.ts
│   │   │   ├── star/route.ts
│   │   │   └── recent/route.ts
│   │   └── admin/              # 管理后台
│   │       └── projects/route.ts
│   │
│   ├── admin/                   # 管理后台页面
│   │   └── page.tsx
│   ├── login/                   # 登录页面
│   │   └── page.tsx
│   ├── project/                  # 项目页面
│   │   └── [id]/
│   │       ├── page.tsx           # 项目主页面
│   │       └── settings/          # 项目设置
│   │           └── page.tsx
│   ├── preview/                  # 公开预览页面
│   │   └── [id]/page.tsx
│   ├── layout.tsx               # 根布局
│   └── page.tsx                # 首页
│
├── components/                  # React 组件
│   ├── ui/                     # shadcn/ui 基础组件
│   │   ├── button.tsx
│   │   ├── dialog.tsx
│   │   ├── input.tsx
│   │   ├── select.tsx
│   │   └── ...
│   ├── extensions/              # 编辑器扩展
│   │   ├── mermaid.tsx
│   │   ├── code-block-lowlight.tsx
│   │   └── code-block-component.tsx
│   ├── sidebar.tsx             # 文件树侧边栏
│   ├── editor.tsx              # Markdown 编辑器
│   ├── editor-toolbar.tsx      # 编辑器工具栏
│   ├── home-page.tsx           # 项目仪表盘
│   ├── starred-page.tsx        # 收藏页面
│   ├── search-palette.tsx       # 命令面板
│   ├── table-of-contents.tsx   # 目录导航
│   ├── project-settings-form.tsx  # 项目设置表单
│   ├── user-management.tsx      # 用户管理
│   ├── user-nav.tsx           # 用户导航
│   ├── auth-provider.tsx        # 认证上下文
│   └── editor-context.tsx     # 编辑器上下文
│
├── lib/                        # 服务层
│   ├── fs-service.ts           # 文件系统服务
│   ├── git-sync-service.ts     # Git 同步服务
│   ├── user-service.ts         # 用户管理服务
│   ├── config-service.ts       # 配置服务
│   ├── crypto.ts              # 加密/解密
│   ├── identity-service.ts     # 身份服务
│   └── utils.ts              # 工具函数
│
├── hooks/                      # 自定义 Hooks
│   └── use-user-config.ts      # 用户配置 Hook
│
├── types/                      # TypeScript 类型
│   └── next-auth.d.ts         # NextAuth 类型扩展
│
├── docs/                       # 文档存储（运行时）
│   ├── .thinktank/            # 系统配置
│   ├── [project-id]/          # 项目目录
│   └── thinktank/            # 本文档
│
├── middleware.ts               # Next.js 中间件
├── instrumentation.ts         # Observability 配置
├── package.json
├── tsconfig.json
├── tailwind.config.js
├── postcss.config.js
└── components.json            # shadcn/ui 配置
```

## 核心目录说明

### app/

Next.js App Router 目录，包含所有页面和 API 路由。

**页面**：
- `app/page.tsx`: 首页，显示所有项目
- `app/admin/page.tsx`: 管理后台
- `app/login/page.tsx`: 登录页面
- `app/project/[id]/page.tsx`: 项目详情页
- `app/project/[id]/settings/page.tsx`: 项目设置页
- `app/preview/[id]/page.tsx`: 公开预览页

**API 路由**：
- `app/api/auth/[...nextauth]/route.ts`: NextAuth 配置
- `app/api/projects/*`: 项目管理 API
- `app/api/files/*`: 文件操作 API
- `app/api/groups/*`: 分组管理 API
- `app/api/users/*`: 用户相关 API

### components/

React 组件目录，包含所有可复用组件。

**基础组件 (ui/)**：
来自 shadcn/ui 的基础 UI 组件，包括：
- Button, Dialog, Input, Select, Tabs, etc.

**功能组件**：
- `sidebar.tsx`: 文件树导航
- `editor.tsx`: Markdown 编辑器
- `home-page.tsx`: 项目仪表盘
- `search-palette.tsx`: 命令面板

**编辑器扩展 (extensions/)**：
- `mermaid.tsx`: Mermaid 图表支持
- `code-block-lowlight.tsx`: 代码高亮

### lib/

服务层，封装核心业务逻辑。

| 文件 | 职责 |
|-----|------|
| `fs-service.ts` | 文件系统操作，项目/文件 CRUD |
| `git-sync-service.ts` | Git 同步，定时任务调度 |
| `user-service.ts` | 用户管理，密码哈希 |
| `crypto.ts` | AES-256-CBC 加密/解密 |
| `config-service.ts` | 配置读取和写入 |
| `identity-service.ts` | 身份相关辅助函数 |
| `utils.ts` | 通用工具函数 |

### hooks/

自定义 React Hooks。

| 文件 | 职责 |
|-----|------|
| `use-user-config.ts` | 管理用户配置（收藏、最近访问） |

### types/

TypeScript 类型定义。

| 文件 | 内容 |
|-----|------|
| `next-auth.d.ts` | NextAuth 会话类型扩展 |

## 关键文件说明

### middleware.ts

NextAuth 中间件，保护需要认证的路由：

```typescript
export default withAuth({
  pages: { signIn: "/login" },
});

export const config = {
  matcher: ["/admin/:path*", "/project/:path*"],
};
```

### instrumentation.ts

Observability 配置，用于监控和日志记录。

### package.json

项目依赖和脚本：

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "next": "^16.1.6",
    "next-auth": "^4.24.13",
    "@tiptap/react": "^3.19.0",
    "simple-git": "^3.31.1",
    ...
  }
}
```

## 代码组织原则

### 1. 按功能分组

相关功能的代码放在同一目录：
- 项目相关：`app/api/projects/`
- 文件相关：`app/api/files/`
- 组件按功能：编辑器、侧边栏、仪表盘

### 2. 服务层复用

核心逻辑在 `lib/` 服务中实现，API 路由调用服务：
- 避免代码重复
- 便于单元测试
- 清晰的职责分离

### 3. 类型安全

使用 TypeScript 确保类型安全：
- 所有组件有 Props 接口
- API 响应有明确的类型
- 服务函数有输入输出类型

## 下一步

- [环境配置](./environment-setup.md) - 配置开发环境
- [组件开发](./components.md) - 组件开发指南
- [API 开发](./api-routes.md) - API 路由开发
