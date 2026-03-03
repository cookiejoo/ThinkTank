# 编辑器功能

本文档详细说明 ThinkTank 使用的 Markdown 编辑器及其功能。

## 概述

ThinkTank 使用 Tiptap 作为核心 Markdown 编辑器，提供以下特性：

- 实时 Markdown 编辑
- 所见即所得（WYSIWYG）预览
- 源码编辑模式
- 分屏模式（源码 + 预览）
- 自动大纲生成
- Frontmatter 支持
- 代码高亮
- Mermaid 图表支持

## 编辑器组件

位置：`components/editor.tsx`

### Props

```typescript
interface EditorProps {
  initialContent: string;      // 初始内容（包含 Frontmatter）
  onChange: (content: string) => void;  // 内容变化回调
  readOnly?: boolean;         // 只读模式（Git 模式）
  projectId: string;          // 项目 ID
  currentFilePath?: string;    // 当前文件路径（用于图片路径解析）
  versions?: string[];        // 可用版本列表
  selectedVersion?: string;    // 当前选择的版本
  onVersionChange?: (version: string) => void;  // 版本变化回调
}
```

## 工作模式

编辑器支持四种工作模式：

### 1. Edit 模式

**图标**：Pencil

**特点**：
- 可编辑的 Markdown 编辑器
- 显示编辑工具栏
- 实时保存
- 可编辑 Frontmatter

### 2. Source 模式

**图标**：FileCode

**特点**：
- 纯文本编辑
- 显示完整 Markdown + Frontmatter
- 支持 YAML 语法高亮
- 实时同步到预览

### 3. Split 模式

**图标**：Columns

**特点**：
- 左侧：源码编辑
- 右侧：只读预览
- 源码变化实时更新预览
- 适用于需要看到最终效果的场景

### 4. Preview 模式

**图标**：Eye

**特点**：
- 纯预览视图
- 只读
- Git 模式下的默认模式

## 工具栏功能

工具栏位置：`components/editor-toolbar.tsx`

### 文本格式

- **粗体**：`Ctrl/Cmd + B`
- **斜体**：`Ctrl/Cmd + I`
- **下划线**：`Ctrl/Cmd + U`
- **删除线**：工具栏按钮

### 标题

- H1, H2, H3, H4, H5, H6

### 列表

- 无序列表
- 有序列表
- 任务列表

### 代码块

支持代码高亮：

````typescript
const example = "code";
````

### 链接和图片

- **插入链接**：支持 URL 输入
- **插入图片**：支持相对路径和绝对路径

### 表格

支持 Markdown 表格：

| 列 1 | 列 2 |
|-------|-------|
| 数据 1 | 数据 2 |

## Frontmatter 支持

编辑器支持 YAML Frontmatter：

```markdown
---
title: 文档标题
isHidden: false
sortOrder: 1
createdAt: 2023-10-01
---

这里是正文内容...
```

### Frontmatter 解析

使用 `gray-matter` 库解析：

```typescript
const { content, data, frontmatterRaw } = matter(fullContent);
```

### Frontmatter 编辑

在 Edit 模式下可以编辑 Frontmatter：
- 自动分离 Frontmatter 和正文
- 编辑后重新组合

## 图片路径解析

编辑器自动将相对路径转换为 API 资源路径：

```typescript
// 输入：../images/logo.png
// 解析为：/api/projects/${projectId}/assets/images/logo.png

// 如果选择了版本
// /api/projects/${projectId}/assets/images/logo.png?version=v1.0.0
```

解析逻辑：
1. 获取当前文件所在目录
2. 处理 `..` 和 `.` 路径
3. 拼接生成最终路径
4. 添加版本参数（如果有）

## 扩展支持

### 代码高亮

使用 `lowlight` 库实现代码高亮：

```typescript
import { CodeBlock } from '@tiptap/extension-code-block';
import { CodeBlockExtension } from './extensions/code-block-lowlight';
```

### Mermaid 图表

自定义扩展支持 Mermaid 图表：

```typescript
import { ExtendedCodeBlock as Mermaid } from './extensions/mermaid';
```

```markdown
```mermaid
graph TD
    A[Start] --> B[End]
`````

### Markdown 扩展

使用官方 `@tiptap/markdown` 扩展：

```typescript
import { Markdown } from '@tiptap/markdown';

Markdown.configure({
  html: true,
  transformPastedText: true,
  transformCopiedText: true,
})
```

## 保存机制

编辑器在以下情况下触发保存：

### 自动保存

```typescript
onUpdate: ({ editor }) => {
  if (modeRef.current !== 'edit') return;

  const markdown = editor.getMarkdown();
  const fullContent = currentFrontmatter + '\n' + markdown;

  setSourceContent(fullContent);
  onChange(fullContent);  // 回调父组件
}
```

### 手动保存

用户可以通过工具栏按钮或快捷键触发保存。

## 目录生成

编辑器右侧自动生成文档目录：

- 基于 H1-H6 标题
- 点击目录项滚动到对应位置
- 可通过工具栏按钮切换显示/隐藏

## 只读模式

Git 镜像模式下，编辑器自动切换到只读模式：

```typescript
// 检查项目模式
useEffect(() => {
  if (readOnly) {
    setMode('preview');
    setShowToc(true);
  }
}, [readOnly]);

// 禁用编辑器
const shouldBeEditable = !readOnly && mode === 'edit';
if (editor.isEditable !== shouldBeEditable) {
  editor.setEditable(shouldBeEditable);
}
```

## 下一步

- [文件管理](./file-management.md) - 了解文件操作功能
- [Git 同步](./git-sync.md) - 了解 Git 模式
