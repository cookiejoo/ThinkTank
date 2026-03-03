# 权限体系 (RBAC)

本文档详细描述 ThinkTank 的认证机制和基于角色的访问控制（RBAC）。

## 认证 (Authentication)

### NextAuth 配置

ThinkTank 使用 NextAuth.js 进行身份验证，配置位置：`app/api/auth/[...nextauth]/route.ts`

### 支持的认证方式

| 提供商 | 状态 | 说明 |
|-------|------|------|
| Credentials | 启用 | 账号密码登录（默认方式） |
| GitHub | 可选 | GitHub OAuth 登录 |
| Google | 可选 | Google OAuth 登录 |

### 默认账户

系统预置了测试账户：

| 用户名 | 密码 | 角色 |
|-------|-------|------|
| admin | 123456 | admin |
| user1 | 123456 | user |

### 密码哈希

密码使用 `bcryptjs` 进行哈希存储：

```typescript
import bcrypt from 'bcryptjs';

// 注册时
const passwordHash = await bcrypt.hash(password, 10);

// 登录时
const isValid = await bcrypt.compare(password, user.passwordHash);
```

## 授权 (Authorization)

### 会话结构

NextAuth 会话包含以下信息：

```typescript
{
  user: {
    id: string;                    // 用户 ID
    name: string;                  // 用户名
    role: 'admin' | 'user';      // 用户角色
    accessibleProjects: string[];     // 可访问的项目 ID 列表
  },
  expires: string;                 // 会话过期时间
}
```

### 角色定义

#### Admin (管理员)

拥有系统的完全控制权。

**标识**：`role: 'admin'`

**权限**：
- ✅ 创建、编辑、删除所有项目
- ✅ 创建、编辑、删除所有分组
- ✅ 管理所有用户
- ✅ 访问管理后台 (`/admin`)
- ✅ 访问任何项目（不受 `accessibleProjects` 限制）

**代码检查**：
```typescript
if (session?.user?.role !== 'admin') {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}
```

#### User (普通用户)

权限限制在授权的项目范围内。

**标识**：`role: 'user'` 或无 `role` 字段

**权限**：
- ✅ 在授权的项目中：编辑设置、创建/编辑/删除文档
- ✅ 访问管理后台（仅查看有权访问的项目）
- ❌ 创建/编辑/删除其他项目
- ❌ 创建/编辑/删除分组
- ❌ 管理用户

**项目访问控制**：
```typescript
const session = await getServerSession(authOptions);
const userAccessibleProjects = session?.user?.accessibleProjects || [];

// 检查用户是否有权访问该项目
if (session?.user?.role !== 'admin' &&
    !userAccessibleProjects.includes(projectId)) {
  return NextResponse.json({ error: 'Project not accessible' }, { status: 403 });
}
```

#### Guest (游客)

未登录的访问者。

**标识**：无会话或 `status === 'unauthenticated'`

**权限**：
- ✅ 浏览项目列表（`/`）
- ✅ 阅读项目文档（`/project/[id]/preview`）
- ❌ 访问管理后台（`/admin`）- 自动重定向到登录
- ❌ 编辑任何内容

## 路由保护

### Middleware 配置

路由保护在 `middleware.ts` 中配置：

```typescript
import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: { signIn: "/login" },
});

export const config = {
  // 需要登录的路由
  matcher: ["/admin/:path*", "/project/:path*"],
};
```

### 受保护的路由

| 路由 | 访问控制 |
|-------|----------|
| `/admin/*` | 需要登录，Admin 可完整访问 |
| `/project/[id]/*` | 需要登录，检查项目访问权限 |
| `/` | 公开，游客可访问 |
| `/preview/[id]` | 公开，游客可访问 |
| `/login` | 公开 |

## 权限检查流程

### API 层权限检查

每个 API 路由都需要进行权限检查：

```typescript
export async function POST(request: Request) {
  // 1. 获取会话
  const session = await getServerSession(authOptions);

  // 2. 检查是否已登录
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 3. 检查角色
  if (session.user?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // 4. 执行操作
  // ...
}
```

### 项目访问权限检查

对于项目相关的操作，需要额外检查项目访问权限：

```typescript
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  const { id: projectId } = await params;

  // Admin 可以访问所有
  if (session?.user?.role === 'admin') {
    // 继续
  }

  // 检查用户是否有权访问该项目
  const userAccessibleProjects = session?.user?.accessibleProjects || [];
  if (!userAccessibleProjects.includes(projectId)) {
    return NextResponse.json(
      { error: 'You do not have permission to access this project' },
      { status: 403 }
    );
  }

  // 继续...
}
```

## 前端权限控制

### 条件渲染

根据用户角色和权限条件渲染 UI：

```typescript
const { data: session } = useSession();

{session?.user?.role === 'admin' && (
  <Button onClick={handleDeleteProject}>Delete Project</Button>
)}

{session && !readOnly && (
  <Button onClick={handleCreateFile}>Create File</Button>
)}
```

### 只读模式

Git 镜像模式下，所有编辑功能被禁用：

```typescript
// 检查项目模式
const [readOnly, setReadOnly] = useState(false);

useEffect(() => {
  fetch(`/api/projects/${projectId}`)
    .then(res => res.json())
    .then(data => {
      setReadOnly(data.mode === 'git');
    });
}, [projectId]);

// 禁用编辑按钮
{!readOnly && <Button>Edit</Button>}
```

## 用户数据隔离

每个用户的个性化数据独立存储在 `docs/.thinktank/users/[userId].json`：

```json
{
  "starred": ["/file1.md", "/file2.md"],
  "recent": ["/file3.md", "/file4.md"]
}
```

- **收藏夹**：用户可以看到自己收藏的文件
- **最近访问**：用户可以看到自己最近访问的文件
- **游客**：不显示收藏和最近访问面板

## 下一步

- [系统架构](./system-architecture.md) - 了解整体架构
- [数据模型](./data-model.md) - 了解数据结构
