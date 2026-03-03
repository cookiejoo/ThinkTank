# Git 镜像同步

本文档详细说明 ThinkTank 的 Git 仓库镜像和同步机制。

## 概述

Git 镜像模式允许 ThinkTank 自动同步远程 Git 仓库的内容，并将其展示为只读的知识库。

## 核心架构

```
┌─────────────────────────────────────────────────────────────┐
│                    Git Sync Service                       │
│                                                         │
│  ┌────────────────────────────────────────────────┐        │
│  │        Scheduled Task (node-cron)         │        │
│  │  - 定时触发                               │        │
│  │  - 并发控制                               │        │
│  └────────────────────────────────────────────────┘        │
│                                                         │
│  ┌────────────────────────────────────────────────┐        │
│  │       Persistent Git Repository             │        │
│  │       (docs/[project]/.temp/repo/)      │        │
│  │  ┌──────────────────────────────┐      │        │
│  │  │  simple-git operations     │      │        │
│  │  │  - clone, pull, fetch    │      │        │
│  │  │  - git tag               │      │        │
│  │  └──────────────────────────────┘      │        │
│  └────────────────────────────────────────────────┘        │
└─────────────────────────────────────────────────────────────┘
                      │ 复制内容
                      ↓
┌─────────────────────────────────────────────────────────────┐
│              Project Directory (Readable)                 │
│       (docs/[project]/)                              │
│  ┌──────────────────────────────────────────────┐        │
│  │  Markdown 文档                              │        │
│  │  资源文件                                 │        │
│  │  配置文件 (.thinktank/)                    │        │
│  └──────────────────────────────────────────────┘        │
└─────────────────────────────────────────────────────────────┘
```

## 同步流程

### 1. 初始化

应用启动时调用 `initializeGitSync()`：

```typescript
// lib/git-sync-service.ts
export async function initializeGitSync() {
  // 1. 停止所有现有的定时任务（防止 HMR 重复）
  if (scheduledJobs.size > 0) {
    for (const [projectId, task] of scheduledJobs.entries()) {
      task.stop();
    }
    scheduledJobs.clear();
  }

  // 2. 获取所有项目
  const projects = await getProjects(true);

  // 3. 为每个 Git 模式项目创建定时任务
  for (const project of projects) {
    scheduleJob(project);
  }
}
```

### 2. 定时触发

根据 `syncInterval` 配置，使用 Cron 表达式定时触发：

```typescript
function scheduleJob(project: Project) {
  const { syncInterval } = project.gitConfig;

  // 构建 Cron 表达式
  // syncInterval < 1: 分钟数转换为秒（如 0.5 分钟 = 30 秒）
  // syncInterval >= 1: 每隔 N 分钟
  const cronExpression = syncInterval < 1
    ? `*/${Math.round(syncInterval * 60)} * * * * * *`
    : `*/${syncInterval} * * * *`;

  // 创建定时任务
  const task = cron.schedule(cronExpression, async () => {
    // 获取最新项目配置
    const latestProject = projects.find(p => p.id === project.id);
    if (latestProject) {
      await syncProject(latestProject);
    }
  });

  scheduledJobs.set(project.id, task);
}
```

**Cron 示例**：

| syncInterval | Cron 表达式 | 说明 |
|------------|-------------|------|
| 0.5 | `*/30 * * * * * *` | 每 30 秒 |
| 5 | `*/5 * * * *` | 每 5 分钟 |
| 30 | `*/30 * * * *` | 每 30 分钟 |
| 60 | `0 * * * *` | 每小时 |

### 3. 同步执行

核心同步逻辑在 `syncProject()` 函数中：

```typescript
async function syncProject(project: Project) {
  if (project.mode !== 'git' || !project.gitConfig) return;

  // 并发控制：防止同一项目同时多次同步
  if (syncingProjects.has(project.id)) {
    return;
  }
  syncingProjects.add(project.id);

  const { repoUrl, branch = 'main', token, rootPath } = project.gitConfig;
  const projectPath = path.join(ROOT_DIR, project.id);
  const tempGitPath = path.join(projectPath, '.temp', 'repo');

  // 解密 Token（如果有）
  let remoteUrl = repoUrl;
  if (token) {
    const decryptedToken = decrypt(token);
    remoteUrl = repoUrl.replace('https://', `https://${decryptedToken}@`);
  }

  // === 步骤 1: 同步持久化仓库 ===
  const tempGit = simpleGit(tempGitPath);
  const isRepo = await tempGit.checkIsRepo();
  let needsFreshClone = !isRepo;

  if (isRepo) {
    // 检查远程 URL 是否变更
    const originUrl = await tempGit.getRemotes(true);
    if (normalize(originUrl) !== normalize(repoUrl)) {
      needsFreshClone = true;
    }
  }

  if (needsFreshClone) {
    // 重新克隆
    await fs.rm(tempGitPath, { recursive: true, force: true });
    await fs.mkdir(tempGitPath, { recursive: true });
    await git.clone(remoteUrl, tempGitPath, { '--branch': branch });
  } else {
    // 增量更新
    await tempGit.fetch(['--tags']);  // 先获取标签
    await tempGit.pull();
  }

  // === 步骤 2: 复制内容到目标目录 ===
  let sourcePath = tempGitPath;
  if (rootPath) {
    const potentialSourcePath = path.join(tempGitPath, rootPath);
    sourcePath = potentialSourcePath;
  }

  // 清空项目目录（保留 .thinktank 和 .temp）
  const entries = await fs.readdir(projectPath);
  for (const entry of entries) {
    if (entry !== '.thinktank' && entry !== '.temp') {
      await fs.rm(path.join(projectPath, entry), { recursive: true });
    }
  }

  // 复制内容
  const sourceEntries = await fs.readdir(sourcePath);
  for (const entry of sourceEntries) {
    if (entry === '.git') continue;  // 不复制 .git 目录
    await fs.cp(path.join(sourcePath, entry), path.join(projectPath, entry), { recursive: true });
  }

  syncingProjects.delete(project.id);
}
```

## 动态调度

当用户修改项目的 `Sync Interval` 后，系统会动态重新调度：

```typescript
export async function rescheduleSyncJob(projectId: string) {
  // 1. 停止现有任务
  if (scheduledJobs.has(projectId)) {
    scheduledJobs.get(projectId)!.stop();
    scheduledJobs.delete(projectId);
  }

  // 2. 获取最新配置
  const allProjects = await getProjects(true);
  const projectToReschedule = allProjects.find(p => p.id === projectId);

  // 3. 重新调度
  if (projectToReschedule) {
    scheduleJob(projectToReschedule);
  }
}
```

调用时机：
- 保存项目设置时（`PUT /api/projects/[id]`）

## 版本管理

### 版本发现

Git 同步时，先执行 `git fetch --tags` 确保所有标签都被同步：

```typescript
await tempGit.fetch(['--tags']);
```

### 版本 API

获取可用版本的 API：`GET /api/projects/[id]/versions`

```typescript
export async function GET(request: Request, { params }) {
  const tempGitPath = path.join(ROOT_DIR, projectId, '.temp', 'repo');
  const git = simpleGit(tempGitPath);

  // 执行 git tag 命令，按版本号排序
  const tags = await git.tags(['-l', '--sort=-v:refname']);

  return NextResponse.json({ versions: tags.all });
}
```

### 版本内容读取

当用户选择版本时，使用 `git show` 读取历史内容：

```typescript
// 在 API 层
if (version && version !== 'latest') {
  // 从 Git 仓库读取
  const git = simpleGit(tempGitPath);
  const content = await git.show([`${version}:${relativePath}`);
  return content;
} else {
  // 从项目目录读取最新内容
  return await fs.readFile(fullPath, 'utf-8');
}
```

## 安全设计

### Token 加密

Git Token 使用 AES-256-CBC 加密存储：

```typescript
// 保存时（API 层）
if (finalGitConfig?.token) {
  finalGitConfig.token = encrypt(finalGitConfig.token);
}

// 使用时（同步服务）
const decryptedToken = decrypt(token);
remoteUrl = repoUrl.replace('https://', `https://${decryptedToken}@`);
```

加密配置：
- 算法：AES-256-CBC
- 密钥：环境变量 `ENCRYPTION_KEY`（64 位十六进制）
- 格式：`IV十六进制:加密内容十六进制`

### 路径验证

所有文件操作都进行路径验证：

```typescript
if (!path.resolve(fullPath).startsWith(path.resolve(projectPath))) {
  throw new Error('Access denied');
}
```

防止目录遍历攻击。

## 故障排查

### 同步失败

**症状**：定时任务不执行或执行失败

**解决方案**：
1. 检查日志输出
2. 验证 Git 仓库 URL 正确
3. 验证 Token 有效（如果使用私有仓库）
4. 检查网络连接

### 并发问题

**症状**：同时执行多次同步

**解决方案**：
- 系统使用 `syncingProjects` Set 防止并发
- 同步进行中的项目会被跳过

### 仓库损坏

**症状**：`git pull` 或 `git clone` 失败

**解决方案**：
- 系统自动检测仓库损坏或 URL 变更
- 自动重新克隆（`needsFreshClone = true`）

## 下一步

- [项目 API](../api/projects-api.md) - 项目设置 API
- [开发指南](../development/) - 了解如何扩展同步功能
