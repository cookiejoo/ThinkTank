# 项目 API

本文档描述 ThinkTank 项目相关的所有 API 端点。

## 基础信息

- **Base URL**: `/api/projects`
- **Content-Type**: `application/json`
- **认证**: 部分端点需要登录（见各端点说明）

## 端点列表

### GET /api/projects

获取所有项目列表。

**权限**：公开（无需登录）

**请求**：

```http
GET /api/projects
```

**响应**：

```json
[
  {
    "id": "thinktank-docs",
    "name": "thinktank-docs",
    "description": "The official documentation for ThinkTank.",
    "mode": "git",
    "group": "核心项目",
    "gitConfig": {
      "repoUrl": "https://github.com/user/repo.git",
      "branch": "main",
      "rootPath": "docs",
      "syncInterval": 5
    },
    "isDeleted": false
  }
]
```

**说明**：
- 返回所有未被逻辑删除的项目
- 按 分组名称 和 项目名称 排序
- 敏感信息（如 `token`）不返回

---

### POST /api/projects

创建新项目。

**权限**：需要 Admin 角色

**请求**：

```http
POST /api/projects
Content-Type: application/json

{
  "id": "my-new-project",
  "description": "我的新项目描述",
  "group": "核心项目",
  "mode": "edit",
  "gitConfig": {
    "repoUrl": "https://github.com/user/repo.git",
    "branch": "main",
    "rootPath": "docs",
    "token": "ghp_xxxxxxxxxxxx",
    "syncInterval": 5
  }
}
```

**参数**：

| 参数 | 类型 | 必填 | 说明 |
|-----|------|------|------|
| `id` | string | 是 | 项目唯一标识（将作为目录名）|
| `description` | string | 否 | 项目描述 |
| `group` | string | 是 | 分组名称（如不存在则创建）|
| `mode` | string | 否 | `edit` 或 `git`，默认 `edit` |
| `gitConfig` | object | 否 | Git 模式配置 |

**响应**：

```json
{
  "success": true,
  "id": "my-new-project"
}
```

**错误响应**：

```json
{
  "error": "Project ID and Group are required"
}
```

---

### GET /api/projects/[id]

获取单个项目详情。

**权限**：需要登录，需有项目访问权限

**请求**：

```http
GET /api/projects/thinktank-docs
```

**响应**：

```json
{
  "id": "thinktank-docs",
  "name": "thinktank-docs",
  "description": "The official documentation for ThinkTank.",
  "mode": "git",
  "group": "核心项目",
  "readme": "# ThinkTank Documentation\n...",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "isDeleted": false
}
```

---

### PUT /api/projects/[id]

更新项目配置。

**权限**：需要登录，需有项目访问权限

**请求**：

```http
PUT /api/projects/thinktank-docs
Content-Type: application/json

{
  "description": "更新后的描述",
  "group": "其他项目",
  "gitConfig": {
    "repoUrl": "https://github.com/user/repo.git",
    "branch": "develop",
    "syncInterval": 10
  }
}
```

**参数**：

| 参数 | 类型 | 必填 | 说明 |
|-----|------|------|------|
| `description` | string | 否 | 新的项目描述 |
| `group` | string | 否 | 新的分组 |
| `gitConfig` | object | 否 | 新的 Git 配置（会更新到配置文件）|

**响应**：

```json
{
  "success": true
}
```

---

### DELETE /api/projects/[id]

删除项目。

**权限**：需要 Admin 角色

**请求**：

```http
DELETE /api/projects/thinktank-docs?physical=false
```

**查询参数**：

| 参数 | 类型 | 默认值 | 说明 |
|-----|------|-------|------|
| `physical` | boolean | false | 是否物理删除（true）或逻辑删除（false）|

**响应**：

```json
{
  "success": true
}
```

**说明**：
- 逻辑删除（默认）：在 `config.json` 中设置 `isDeleted: true`
- 物理删除：从磁盘删除整个项目目录

---

### GET /api/projects/[id]/versions

获取项目的 Git 版本（标签）列表。

**权限**：需要登录，需有项目访问权限

**请求**：

```http
GET /api/projects/thinktank-docs/versions
```

**响应**：

```json
{
  "versions": ["v1.0.0", "v1.1.0", "v2.0.0"]
}
```

**说明**：
- 仅适用于 Git 模式项目
- 如果项目不是 Git 模式，返回空数组
- 版本按语义化版本顺序排列

---

### POST /api/projects/[id]/token

验证 Git Token 是否有效。

**权限**：需要登录

**请求**：

```http
POST /api/projects/thinktank-docs/token
Content-Type: application/json

{
  "repoUrl": "https://github.com/user/repo.git",
  "token": "ghp_xxxxxxxxxxxx"
}
```

**参数**：

| 参数 | 类型 | 必填 | 说明 |
|-----|------|------|------|
| `repoUrl` | string | 是 | Git 仓库地址 |
| `token` | string | 是 | Personal Access Token |

**响应**：

```json
{
  "success": true
}
```

或

```json
{
  "error": "Failed to connect to repository"
}
```

---

### PUT /api/projects/[id]/settings

更新项目设置（内部使用）。

**权限**：需要登录

**请求**：

```http
PUT /api/projects/thinktank-docs/settings
```

---

### GET /api/projects/[id]/assets/[...path]

访问项目中的资源文件（图片等）。

**权限**：需要登录，需有项目访问权限

**请求**：

```http
GET /api/projects/thinktank-docs/assets/images/logo.png
```

**响应**：

返回文件内容，Content-Type 根据文件扩展名自动设置：

| 扩展名 | Content-Type |
|-------|-------------|
| `.png` | `image/png` |
| `.jpg`, `.jpeg` | `image/jpeg` |
| `.gif` | `image/gif` |
| `.svg` | `image/svg+xml` |
| `.webp` | `image/webp` |
| `.pdf` | `application/pdf` |

**说明**：
- 用于 Markdown 文档中的图片引用
- 支持缓存（`Cache-Control: public, max-age=3600`）
- 支持版本参数：`?version=v1.0.0`

---

## 错误码

| HTTP 状态码 | 说明 |
|-----------|------|
| 200 | 成功 |
| 400 | 请求参数错误 |
| 401 | 未认证 |
| 403 | 无权限 |
| 404 | 资源不存在 |
| 500 | 服务器内部错误 |

## 下一步

- [文件 API](./files-api.md) - 文件操作 API
- [用户 API](./users-api.md) - 用户和认证 API
