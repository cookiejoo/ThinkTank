# 文件管理

本文档详细说明 ThinkTank 的文件管理功能。

## 文件树组件

位置：`components/sidebar.tsx`

### 功能概述

文件树是项目文件的主要导航界面，提供以下功能：

- 展开/折叠文件夹
- 文件高亮（选中状态）
- 拖拽排序
- 右键菜单
- 收藏标记
- 隐藏/显示

### 虚拟化渲染

使用 `react-arborist` 实现虚拟滚动：

```typescript
<Tree
  data={displayData}
  width={treeDims.width}
  height={treeDims.height}
  rowHeight={28}
  openByDefault={false}
  onMove={onMove}
  disableDrag={readOnly}
  disableDrop={readOnly}
>
  {Node}
</Tree>
```

好处：
- 支持大量文件
- 性能优异
- 流畅滚动

## 文件操作

### 创建文件/文件夹

**触发方式**：
1. 点击侧边栏顶部的 `+` 按钮
2. 在文件夹上右键 → "Create New"

**对话框**：
- 输入文件/文件夹名称
- `.md` 结尾表示文件，否则为文件夹

**API**：`POST /api/files/create`

```json
{
  "projectId": "thinktank-docs",
  "path": "new-file.md",
  "isDir": false
}
```

### 重命名

**触发方式**：右键 → "Rename"

**对话框**：
- 输入新名称

**API**：`POST /api/files/rename`

```json
{
  "projectId": "thinktank-docs",
  "oldPath": "/docs/old-name.md",
  "newName": "new-name.md"
}
```

### 删除

**触发方式**：右键 → "Delete"

**确认对话框**：
- 是否永久删除（Permanently delete）
- 逻辑删除为默认

**API**：`POST /api/files/delete`

```json
{
  "projectId": "thinktank-docs",
  "path": "/docs/unused.md",
  "physical": false
}
```

### 拖拽排序

**触发方式**：拖拽文件/文件夹到新位置

**API**：`POST /api/files/sort`

```json
{
  "projectId": "thinktank-docs",
  "updates": [
    { "path": "/docs/intro.md", "sortOrder": 1 },
    { "path": "/docs/advanced.md", "sortOrder": 2 }
  ]
}
```

**限制**：Git 模式下禁用拖拽

## 文件属性

### 可见性控制

**功能**：隐藏文件在文件树和预览中

**触发方式**：右键 → "Show/Hide"

**API**：`POST /api/files/visibility`

```json
{
  "projectId": "thinktank-docs",
  "path": "/docs/draft.md",
  "isHidden": true
}
```

**显示效果**：
- 文件树：斜体 + 灰色
- 预览入口：不显示

### 收藏功能

**功能**：标记重要文件以便快速访问

**触发方式**：
1. 右键 → "Star/Unstar"
2. 点击星星图标

**API**：`POST /api/user/star`

```json
{
  "projectId": "thinktank-docs",
  "path": "/docs/important.md"
}
```

**显示效果**：
- 文件树：黄色星标图标

## 文件类型支持

### Markdown 文件

- 扩展名：`.md`
- 可在编辑器中打开
- 支持实时编辑

### 资源文件

- 支持格式：`.png`, `.jpg`, `.jpeg`, `.gif`, `.svg`, `.webp`
- 点击在新标签页打开
- 通过 `/api/projects/[id]/assets/[...path]` 访问

### 其他文件

- 其他格式的文件不支持在线预览
- 点击显示提示消息

## 排序规则

文件按以下顺序排列：

1. **sortOrder**（优先）：数值越小越靠前
2. **类型**：文件夹优先于文件
3. **名称**：字母顺序

```typescript
nodes.sort((a, b) => {
  const metaA = filesConfig[a.id] || {};
  const metaB = filesConfig[b.id] || {};

  const orderA = metaA.sortOrder ?? Number.MAX_SAFE_INTEGER;
  const orderB = metaB.sortOrder ?? Number.MAX_SAFE_INTEGER;

  if (orderA !== orderB) return orderA - orderB;

  if (a.isDir !== b.isDir) return a.isDir ? -1 : 1;

  return a.name.localeCompare(b.name);
});
```

## 版本支持

当项目是 Git 模式时，文件树支持版本切换：

- 选择版本后重新加载文件树
- API 增加版本参数：`?version=v1.0.0`
- 历史版本为只读

## 下一步

- [编辑器](./editor.md) - 了解编辑器功能
- [文件 API](../api/files-api.md) - 了解文件 API
