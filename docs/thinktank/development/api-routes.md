# API 路由开发

本文档介绍 ThinkTank 的 API 路由开发规范。

## 路由结构

Next.js App Router 的 API 路由位于 `app/api/` 目录：

```
app/api/
├── auth/[...nextauth]/      # NextAuth 配置
│   └── route.ts
├── projects/                 # 项目管理
│   ├── route.ts             # GET, POST
│   └── [id]/
│       ├── route.ts         # GET, PUT, DELETE
│       ├── versions/route.ts # GET
│       ├── token/route.ts   # POST
│       └── assets/[...path]/route.ts # GET
├── files/                    # 文件操作
│   ├── tree/route.ts        # GET
│   ├── content/route.ts      # GET, POST
│   ├── create/route.ts       # POST
│   ├── rename/route.ts       # POST
│   ├── delete/route.ts       # POST
│   ├── sort/route.ts         # POST
│   └── visibility/route.ts   # POST
├── groups/                   # 分组管理
│   └── route.ts            # GET, POST
├── users/                    # 用户相关
│   ├── route.ts             # GET, POST, PUT
│   ├── star/route.ts        # POST
│   └── recent/route.ts      # POST
└── admin/                    # 管理后台
    └── projects/route.ts     # GET
```

## 路由开发规范

### 1. 文件命名

API 路由文件必须命名为 `route.ts`：

```
app/api/
├── projects/
│   ├── route.ts        # 正确
│   └── index.ts       # 错误（不使用）
└── files/
    ├── route.ts
    └── handler.ts       # 错误（不使用）
```

### 2. 导出 HTTP 方法

每个路由文件必须导出对应的 HTTP 方法：

```typescript
// GET 请求
export async function GET(request: Request) { ... }

// POST 请求
export async function POST(request: Request) { ... }

// PUT 请求
export async function PUT(request: Request) { ... }

// DELETE 请求
export async function DELETE(request: Request) { ... }

// 组合导出
export { handler as GET, handler as POST };
```

### 3. 请求和响应

#### 请求参数

**查询参数**：

```typescript
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get('projectId');

  // 或使用 Next.js 14+ 的方式
  // const { searchParams } = await request.nextUrl.searchParams;
}
```

**路由参数**：

```typescript
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
}
```

**请求体**：

```typescript
export async function POST(request: Request) {
  const body = await request.json();
  const { projectId, path } = body;
}
```

**动态路由**：

```typescript
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; path: string[] }> }
) {
  const { id, path } = await params;
  // path 是数组，如 ['images', 'logo.png']
}
```

#### 响应格式

```typescript
import { NextResponse } from 'next/server';

// 成功响应
return NextResponse.json({ success: true, data: result });

// 错误响应
return NextResponse.json(
  { error: 'Error message' },
  { status: 400 }
);

// 文件响应
return new NextResponse(fileBuffer, {
  headers: { 'Content-Type': 'image/png' }
});
```

### 4. 认证检查

使用 NextAuth 获取会话：

```typescript
import { getServerSession } from "next-auth";
import { authOptions } from '../auth/[...nextauth]/route';

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  // 检查角色
  if (session.user?.role !== 'admin') {
    return NextResponse.json(
      { error: 'Forbidden' },
      { status: 403 }
    );
  }
}
```

### 5. 错误处理

```typescript
export async function POST(request: Request) {
  try {
    const body = await request.json();
    // 处理逻辑
    return NextResponse.json({ success: true });
  } catch (error) {
    const errorMessage = error instanceof Error
      ? error.message
      : 'An unknown error occurred';

    console.error('[API ERROR] POST /api/endpoint:', errorMessage);

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
```

### 6. 类型安全

定义请求和响应类型：

```typescript
interface CreateProjectRequest {
  id: string;
  description?: string;
  group: string;
  mode: 'git' | 'edit';
  gitConfig?: ProjectGitConfig;
}

interface ApiResponse<T = any> {
  success?: boolean;
  error?: string;
  data?: T;
}

export async function POST(request: Request) {
  const body: CreateProjectRequest = await request.json();
  // ...
}
```

## 常见模式

### RESTful 资源操作

| 操作 | 方法 | 端点示例 |
|-----|------|----------|
| 列表 | GET | `GET /api/projects` |
| 创建 | POST | `POST /api/projects` |
| 读取 | GET | `GET /api/projects/[id]` |
| 更新 | PUT | `PUT /api/projects/[id]` |
| 删除 | DELETE | `DELETE /api/projects/[id]` |

### 自定义动作

对于非 RESTful 操作使用 POST + 动作参数：

```
POST /api/files/sort         # 排序
POST /api/files/visibility    # 切换可见性
POST /api/user/star         # 收藏/取消收藏
```

## 服务层调用

API 路由应该调用服务层函数，而不是直接操作文件系统：

```typescript
// ✅ 推荐：使用服务层
import { getProjects, createProject } from '@/lib/fs-service';

export async function GET() {
  const projects = await getProjects(false);
  return NextResponse.json(projects);
}

// ❌ 不推荐：直接操作文件系统
import fs from 'fs/promises';

export async function GET() {
  const content = await fs.readFile('/path/to/file', 'utf-8');
  // ...
}
```

## 下一步

- [项目 API](../api/projects-api.md) - 项目 API 参考
- [文件 API](../api/files-api.md) - 文件 API 参考
