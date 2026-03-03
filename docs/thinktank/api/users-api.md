# 用户 API

本文档描述 ThinkTank 用户和认证相关的所有 API 端点。

## 基础信息

- **Base URL**: `/api/users` 和 `/api/user/*`
- **Content-Type**: `application/json`
- **认证**: 部分端点需要登录

## 端点列表

### GET /api/users

获取所有用户列表。

**权限**：需要 Admin 角色

**请求**：

```http
GET /api/users
```

**响应**：

```json
[
  {
    "id": "1",
    "username": "admin",
    "role": "admin",
    "accessibleProjects": []
  },
  {
    "id": "2",
    "username": "user1",
    "role": "user",
    "accessibleProjects": ["project-a", "project-b"]
  }
]
```

**说明**：
- 不返回 `passwordHash`（安全）
- 仅 Admin 可以访问此端点

---

### POST /api/users

创建新用户。

**权限**：需要 Admin 角色

**请求**：

```http
POST /api/users
Content-Type: application/json

{
  "username": "newuser",
  "password": "securepass123",
  "role": "user",
  "accessibleProjects": ["project-a", "project-b"]
}
```

**参数**：

| 参数 | 类型 | 必填 | 说明 |
|-----|------|------|------|
| `username` | string | 是 | 用户名（唯一）|
| `password` | string | 是 | 明文密码（将自动哈希）|
| `role` | string | 否 | 角色，默认 `user` |
| `accessibleProjects` | string[] | 否 | 可访问的项目 ID 列表 |

**响应**：

```json
{
  "success": true,
  "id": "2"
}
```

**错误响应**：

```json
{
  "error": "User already exists"
}
```

---

### PUT /api/users

更新用户信息。

**权限**：需要 Admin 角色

**请求**：

```http
PUT /api/users
Content-Type: application/json

{
  "id": "2",
  "username": "updateduser",
  "role": "user",
  "accessibleProjects": ["project-a", "project-b", "project-c"]
}
```

**参数**：

| 参数 | 类型 | 必填 | 说明 |
|-----|------|------|------|
| `id` | string | 是 | 用户 ID |
| `username` | string | 否 | 新用户名 |
| `role` | string | 否 | 新角色 |
| `accessibleProjects` | string[] | 否 | 新的可访问项目列表 |

**响应**：

```json
{
  "success": true
}
```

**说明**：密码不能通过此端点更新（需要单独的密码重置功能）

---

### GET /api/user/config

获取当前用户的配置（收藏和最近访问）。

**权限**：需要登录

**请求**：

```http
GET /api/user/config?projectId=thinktank-docs
```

**查询参数**：

| 参数 | 类型 | 必填 | 说明 |
|-----|------|------|------|
| `projectId` | string | 是 | 项目 ID |

**响应**：

```json
{
  "starred": ["/docs/intro.md", "/docs/guide.md"],
  "recent": ["/docs/new.md", "/docs/old.md"]
}
```

**说明**：
- 返回指定项目的用户配置
- 未登录时返回空配置

---

### POST /api/user/star

切换文件的收藏状态。

**权限**：需要登录

**请求**：

```http
POST /api/user/star
Content-Type: application/json

{
  "projectId": "thinktank-docs",
  "path": "/docs/intro.md"
}
```

**参数**：

| 参数 | 类型 | 必填 | 说明 |
|-----|------|------|------|
| `projectId` | string | 是 | 项目 ID |
| `path` | string | 是 | 文件路径 |

**响应**：

```json
{
  "success": true
}
```

**说明**：
- 如果已收藏，则取消收藏
- 如果未收藏，则添加收藏

---

### POST /api/user/recent

添加文件到最近访问列表。

**权限**：需要登录

**请求**：

```http
POST /api/user/recent
Content-Type: application/json

{
  "projectId": "thinktank-docs",
  "path": "/docs/intro.md"
}
```

**参数**：

| 参数 | 类型 | 必填 | 说明 |
|-----|------|------|------|
| `projectId` | string | 是 | 项目 ID |
| `path` | string | 是 | 文件路径 |

**响应**：

```json
{
  "success": true
}
```

**说明**：
- 将文件添加到列表开头
- 自动去重（重复文件移到前面）
- 最多保留 20 条记录

---

## 认证 API

### POST /api/auth/signin

登录认证（由 NextAuth Credentials Provider 处理）。

**请求**：

```http
POST /api/auth/signin
Content-Type: application/x-www-form-urlencoded

username=admin&password=123456
```

**说明**：
- NextAuth 自动处理
- 成功后重定向到首页
- 失败后显示错误消息

### POST /api/auth/signout

退出登录。

**请求**：

```http
POST /api/auth/signout
```

**说明**：
- 清除会话
- 重定向到首页

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

---

## 密码哈希

ThinkTank 使用 `bcryptjs` 进行密码哈希：

```typescript
import bcrypt from 'bcryptjs';

// 哈希（注册时）
const saltRounds = 10;
const passwordHash = await bcrypt.hash(password, saltRounds);

// 验证（登录时）
const isValid = await bcrypt.compare(password, storedHash);
```

## 下一步

- [项目 API](./projects-api.md) - 项目管理 API
- [文件 API](./files-api.md) - 文件操作 API
