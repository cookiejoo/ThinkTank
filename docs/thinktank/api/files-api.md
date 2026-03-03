# 文件 API

本文档描述 ThinkTank 文件操作相关的所有 API 端点。

## 基础信息

- **Base URL**: `/api/files`
- **Content-Type**: `application/json`
- **认证**: 所有端点需要登录

## 端点列表

### GET /api/files/tree

获取项目的文件树结构。

**权限**：需要登录，需有项目访问权限

**请求**：

```http
GET /api/files/tree?projectId=thinktank-docs&version=latest
```

**查询参数**：

| 参数 | 类型 | 必填 | 说明 |
|-----|------|------|------|
| `projectId` | string | 是 | 项目 ID |
| `version` | string | 否 | Git 版本标签，默认 `latest` |

**响应**：

```json
[
  {
    "id": "/",
    "name": "docs",
    "isDir": true,
    "isVisible": true,
    "children": [
      {
        "id": "/docs/getting-started",
        "name": "getting-started",
        "isDir": true,
        "isVisible": true,
        "children": [
          {
            "id": "/docs/getting-started/overview.md",
            "name": "overview.md",
            "isDir": false,
            "isVisible": true
          }
        ]
      }
    ]
  }
]
```

**说明**：
- 过滤掉被逻辑删除的文件
- 隐藏的文件标记 `isVisible: false`
- 按 `sortOrder` 和名称排序

---

### GET /api/files/content

获取文件内容。

**权限**：需要登录，需有项目访问权限

**请求**：

```http
GET /api/files/content?projectId=thinktank-docs&path=/docs/intro.md&version=v1.0.0
```

**查询参数**：

| 参数 | 类型 | 必填 | 说明 |
|-----|------|------|------|
| `projectId` | string | 是 | 项目 ID |
| `path` | string | 是 | 文件相对路径 |
| `version` | string | 否 | Git 版本标签，默认 `latest` |

**响应**：

```json
{
  "content": "# Introduction\n\nThis is the content..."
}
```

**说明**：
- 当 `version=latest` 时，从项目目录读取物理文件
- 当指定版本时，从 Git 仓库读取该版本的快照
- 自动移除 Frontmatter（YAML 头）返回内容

---

### POST /api/files/content

保存文件内容。

**权限**：需要登录，需有项目访问权限，项目不能为 Git 模式

**请求**：

```http
POST /api/files/content
Content-Type: application/json

{
  "projectId": "thinktank-docs",
  "path": "/docs/new-page.md",
  "content": "# New Page\n\nThis is a new page."
}
```

**参数**：

| 参数 | 类型 | 必填 | 说明 |
|-----|------|------|------|
| `projectId` | string | 是 | 项目 ID |
| `path` | string | 是 | 文件相对路径 |
| `content` | string | 是 | 文件内容（包含 Frontmatter）|

**响应**：

```json
{
  "success": true
}
```

**错误响应**（Git 模式）：

```json
{
  "error": "Cannot edit files in Git mirror mode"
}
```

---

### POST /api/files/create

创建新文件或文件夹。

**权限**：需要登录，需有项目访问权限，项目不能为 Git 模式

**请求**：

```http
POST /api/files/create
Content-Type: application/json

{
  "projectId": "thinktank-docs",
  "path": "new-file.md",
  "isDir": false
}
```

**参数**：

| 参数 | 类型 | 必填 | 说明 |
|-----|------|------|------|
| `projectId` | string | 是 | 项目 ID |
| `path` | string | 是 | 文件/文件夹相对路径 |
| `isDir` | boolean | 是 | 是否为文件夹 |

**响应**：

```json
{
  "success": true
}
```

**说明**：
- 如果路径已存在且被逻辑删除，自动恢复
- 创建多级目录时自动创建父目录

---

### POST /api/files/rename

重命名文件或文件夹。

**权限**：需要登录，需有项目访问权限，项目不能为 Git 模式

**请求**：

```http
POST /api/files/rename
Content-Type: application/json

{
  "projectId": "thinktank-docs",
  "oldPath": "/docs/old-name.md",
  "newName": "new-name.md"
}
```

**参数**：

| 参数 | 类型 | 必填 | 说明 |
|-----|------|------|------|
| `projectId` | string | 是 | 项目 ID |
| `oldPath` | string | 是 | 原文件路径 |
| `newName` | string | 是 | 新名称（仅名称，不包含路径）|

**响应**：

```json
{
  "success": true
}
```

---

### POST /api/files/delete

删除文件或文件夹。

**权限**：需要登录，需有项目访问权限，项目不能为 Git 模式

**请求**：

```http
POST /api/files/delete
Content-Type: application/json

{
  "projectId": "thinktank-docs",
  "path": "/docs/unused.md",
  "physical": false
}
```

**参数**：

| 参数 | 类型 | 默认值 | 说明 |
|-----|------|-------|------|
| `projectId` | string | - | 项目 ID |
| `path` | string | - | 文件相对路径 |
| `physical` | boolean | false | 是否物理删除 |

**响应**：

```json
{
  "success": true
}
```

**说明**：
- 逻辑删除：在项目配置中标记 `isDeleted: true`
- 物理删除：从文件系统移除文件

---

### POST /api/files/sort

批量更新文件排序。

**权限**：需要登录，需有项目访问权限

**请求**：

```http
POST /api/files/sort
Content-Type: application/json

{
  "projectId": "thinktank-docs",
  "updates": [
    { "path": "/docs/intro.md", "sortOrder": 1 },
    { "path": "/docs/advanced.md", "sortOrder": 2 }
  ]
}
```

**参数**：

| 参数 | 类型 | 必填 | 说明 |
|-----|------|------|------|
| `projectId` | string | 是 | 项目 ID |
| `updates` | array | 是 | 排序更新列表 |

**响应**：

```json
{
  "success": true
}
```

---

### POST /api/files/visibility

切换文件可见性。

**权限**：需要登录，需有项目访问权限

**请求**：

```http
POST /api/files/visibility
Content-Type: application/json

{
  "projectId": "thinktank-docs",
  "path": "/docs/draft.md",
  "isHidden": true
}
```

**参数**：

| 参数 | 类型 | 必填 | 说明 |
|-----|------|------|------|
| `projectId` | string | 是 | 项目 ID |
| `path` | string | 是 | 文件相对路径 |
| `isHidden` | boolean | 是 | 是否隐藏 |

**响应**：

```json
{
  "success": true
}
```

**说明**：
- 隐藏的文件在文件树中显示为斜体/灰色
- 隐藏的文件不在预览入口显示

---

## 错误码

| HTTP 状态码 | 说明 |
|-----------|------|
| 200 | 成功 |
| 400 | 请求参数错误 |
| 401 | 未认证 |
| 403 | 无权限 |
| 404 | 文件不存在 |
| 500 | 服务器内部错误 |

## 下一步

- [项目 API](./projects-api.md) - 项目管理 API
- [用户 API](./users-api.md) - 用户和认证 API
