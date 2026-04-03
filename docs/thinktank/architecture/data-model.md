# 数据模型

本文档描述 ThinkTank 中使用的所有数据结构和存储格式。

## 数据存储原则

ThinkTank 采用**文件原生**的数据存储方式：

1. **所有数据存储为文件**：Markdown 文档、配置文件、用户数据都是磁盘文件
2. **JSON 作为配置格式**：结构化数据使用 JSON 格式
3. **无数据库依赖**：不需要任何关系型数据库

## 核心数据结构

### 1. 项目配置 (Project Config)

**位置**：`docs/[projectId]/.thinktank/config.json`

```json
{
  "description": "项目的描述信息",
  "mode": "edit",
  "gitConfig": {
    "repoUrl": "https://github.com/user/repo.git",
    "branch": "main",
    "rootPath": "docs/articles",
    "token": "encrypted_token_here",
    "syncInterval": 5
  },
  "createdAt": "2024-01-01T00:00:00.000Z",
  "files": {
    "/getting-started.md": {
      "isDeleted": true,
      "isHidden": false,
      "sortOrder": 1
    }
  },
  "isDeleted": false
}
```

**字段说明**：

**GitConfig 子结构**：

### 2. 分组配置 (Groups Config)

**位置**：`docs/.thinktank/groups.json`

```json
[
  {
    "name": "核心项目",
    "projects": ["thinktank-docs", "api-reference"],
    "isDeleted": false
  },
  {
    "name": "实验性项目",
    "projects": [],
    "isDeleted": true
  }
]
```

**字段说明**：

### 3. 用户配置 (User Config)

**位置**：`docs/.thinktank/users/[userId].json`

```json
{
  "starred": [
    "/getting-started/quick-start.md",
    "/architecture/system-architecture.md"
  ],
  "recent": [
    "/features/editor.md",
    "/api/files-api.md",
    "/development/components.md"
  ]
}
```

**字段说明**：

### 4. 用户账户 (User Account)

**位置**：`docs/.thinktank/users.json`

```json
[
  {
    "id": "1",
    "username": "admin",
    "passwordHash": "$2b$10$...",
    "role": "admin",
    "accessibleProjects": []
  },
  {
    "id": "2",
    "username": "user1",
    "passwordHash": "$2b$10$...",
    "role": "user",
    "accessibleProjects": ["project-a", "project-b"]
  }
]
```

**字段说明**：

## 文件元数据 (File Metadata)

存储在项目配置的 `files` 对象中，以文件路径为键：

```json
{
  "/docs/intro.md": {
    "isDeleted": false,
    "isHidden": false,
    "sortOrder": 1
  }
}
```

## 前端类型定义

### Project (项目)

```typescript
export interface Project {
  id: string;           // 项目 ID（目录名）
  name: string;         // 项目名称
  description?: string;   // 项目描述
  mode?: 'git' | 'edit';  // 项目模式
  group?: string;        // 所属分组
  gitConfig?: ProjectGitConfig;
  isDeleted?: boolean;  // 是否逻辑删除
}
```

### TreeNode (文件树节点)

```typescript
export interface TreeNode {
  id: string;           // 文件路径（如 "/docs/intro.md"）
  name: string;         // 文件/文件夹名
  children?: TreeNode[]; // 子节点（文件夹）
  isDir?: boolean;      // 是否为文件夹
  isVisible?: boolean;   // 是否可见（基于 isHidden）
}
```

### User (用户)

```typescript
export interface User {
  id: string;
  username: string;
  passwordHash: string;
  role: 'admin' | 'user';
  accessibleProjects: string[];  // 用户可访问的项目
}
```

### UserConfig (用户配置)

```typescript
export interface UserConfig {
  starred: string[];    // 收藏的文件路径
  recent: string[];     // 最近访问的文件路径
}
```

## 数据关系图

```
docs/                              (根目录)
│
├── .thinktank/                      (系统配置)
│   ├── groups.json                  (分组定义)
│   │   ├── [Group] 1→* [Project]
│   │   └── [Group] 1→* [Project]
│   │
│   ├── users.json                   (用户账户)
│   │   └── [User] → accessibleProjects → [Project]
│   │
│   └── users/                      (用户个性化数据)
│       ├── [userId].json              (单个用户配置)
│       │   ├── starred → [FilePath] → File
│       │   └── recent → [FilePath] → File
│
└── [project-id]/                   (单个项目)
    ├── .thinktank/config.json       (项目配置)
    │   ├── mode → (git | edit)
    │   ├── gitConfig → { repoUrl, branch, ... }
    │   └── files → { [FilePath] → { isDeleted, isHidden, sortOrder } }
    │
    ├── [path]/                     (文件和文件夹)
    │   ├── file.md                (Markdown 文档)
    │   └── [subdir]/              (子目录)
    │
    └── .temp/repo/               (Git 模式专用)
        └── .git/                (Git 数据)
```

## 数据一致性保证

### 逻辑删除 (Soft Delete)

所有删除操作默认为逻辑删除：

1. **文件删除**：在 `files` 对象中设置 `isDeleted: true`
2. **项目删除**：在 `config.json` 中设置 `isDeleted: true`
3. **分组删除**：在 `groups.json` 中设置 `isDeleted: true`

好处：数据可恢复，误操作可挽回。

### 物理删除 (Hard Delete)

用户勾选"永久删除"时执行：

1. **文件删除**：从文件系统移除文件
2. **项目删除**：递归删除整个项目目录
3. **分组删除**：从 `groups.json` 中移除条目

### 恢复机制

- **文件恢复**：在原路径创建同名文件，自动移除 `isDeleted` 标记
- **项目/分组恢复**：需要手动修改配置文件

## 数据加密

Git Token 使用 AES-256-CBC 加密存储：

- **加密位置**：`gitConfig.token`
- **加密实现**：`lib/crypto.ts`
- **密钥来源**：环境变量 `ENCRYPTION_KEY`

加密格式：`IV十六进制:加密内容十六进制`

## 下一步

- [权限体系](./auth-rbac.md) - 了解认证和授权机制
- [开发环境配置](../development/environment-setup.md) - 开始本地开发

&nbsp;