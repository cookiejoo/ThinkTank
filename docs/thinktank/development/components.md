# 组件开发

本文档介绍 ThinkTank 的组件开发指南。

## 组件架构

### 组件目录结构

```
components/
├── ui/                      # shadcn/ui 基础组件
│   ├── button.tsx
│   ├── dialog.tsx
│   ├── input.tsx
│   └── ...
├── extensions/                # 编辑器扩展
│   ├── mermaid.tsx
│   ├── code-block-lowlight.tsx
│   └── code-block-component.tsx
├── sidebar.tsx              # 文件树侧边栏
├── editor.tsx               # Markdown 编辑器
├── editor-toolbar.tsx       # 编辑器工具栏
├── home-page.tsx            # 项目仪表盘
├── starred-page.tsx         # 收藏页面
├── search-palette.tsx        # 命令面板
├── table-of-contents.tsx    # 目录导航
├── project-settings-form.tsx  # 项目设置表单
├── user-management.tsx       # 用户管理
├── user-nav.tsx            # 用户导航
├── auth-provider.tsx        # 认证上下文
└── editor-context.tsx        # 编辑器上下文
```

## shadcn/ui 组件

ThinkTank 使用 shadcn/ui 作为基础组件库。

### 使用方法

```typescript
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader } from '@/components/ui/dialog';

export function MyComponent() {
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogHeader>
        <DialogTitle>Title</DialogTitle>
      </DialogHeader>
      <DialogContent>
        <Button onClick={handleClick}>Click me</Button>
      </DialogContent>
    </Dialog>
  );
}
```

### 可用组件

| 组件 | 说明 |
|-----|------|
| Button | 按钮组件 |
| Dialog | 对话框组件 |
| Input | 输入框组件 |
| Label | 标签组件 |
| Select | 下拉选择组件 |
| Popover | 弹出层组件 |
| Command | 命令面板组件 |
| Tabs | 标签页组件 |
| Context Menu | 右键菜单组件 |
| Separator | 分隔线组件 |
| Textarea | 多行文本输入 |

### 添加新组件

shadcn/ui 使用 CLI 添加新组件：

```bash
npx shadcn-ui@latest add [component-name]
```

示例：

```bash
npx shadcn-ui@latest add badge
npx shadcn-ui@latest add tooltip
```

## 功能组件开发

### 组件规范

#### 1. TypeScript 类型

所有组件必须有明确的 Props 接口：

```typescript
interface ComponentProps {
  title: string;
  onAction?: () => void;
  disabled?: boolean;
}

export function MyComponent({ title, onAction, disabled }: ComponentProps) {
  // ...
}
```

#### 2. Props 默认值

为可选 Props 提供合理的默认值：

```typescript
interface ComponentProps {
  variant?: 'default' | 'destructive';  // 默认 'default'
  size?: 'sm' | 'md' | 'lg';          // 默认 'md'
}
```

#### 3. 样式使用

优先使用 Tailwind CSS 类：

```typescript
import { cn } from '@/lib/utils';

export function MyComponent({ className, ...props }) {
  return (
    <div className={cn('base-classes', className)}>
      {/* content */}
    </div>
  );
}
```

#### 4. 事件处理

正确处理事件：

```typescript
const handleClick = (e: React.MouseEvent) => {
  e.preventDefault();
  e.stopPropagation();
  // 处理逻辑
};

<button onClick={handleClick}>Click</button>
```

## 自定义 Hooks

### useUserConfig Hook

管理用户配置（收藏、最近访问）：

```typescript
// hooks/use-user-config.ts
export function useUserConfig(projectId: string) {
  const [config, setConfig] = useState<UserConfig>({ starred: [], recent: [] });
  const [loaded, setLoaded] = useState(false);

  const toggleStar = async (path: string) => {
    // 切换收藏状态
    const newStarred = config.starred.includes(path)
      ? config.starred.filter(p => p !== path)
      : [...config.starred, path];
    setConfig({ ...config, starred: newStarred });
    // API 调用...
  };

  return { config, toggleStar, addRecent, isStarred, loaded };
}
```

### 使用示例

```typescript
const { config, toggleStar, isStarred } = useUserConfig(projectId);

{isStarred(filePath) && <Star className="text-yellow-500" />}
```

## 上下文提供者

### EditorContext

为编辑器子组件提供上下文：

```typescript
// components/editor-context.tsx
import { createContext, useContext } from 'react';

interface EditorContextValue {
  isEditable: boolean;
  setIsEditable: (value: boolean) => void;
}

export const EditorProvider = ({ value, children }) => (
  <EditorContext.Provider value={value}>
    {children}
  </EditorContext.Provider>
);

export const useEditorContext = () => useContext(EditorContext);
```

### 使用示例

```typescript
// 在编辑器中
<EditorProvider value={{ isEditable: mode === 'edit' }}>
  <Toolbar editor={editor} />
  <EditorContent editor={editor} />
</EditorProvider>
```

## 编辑器扩展开发

### 扩展结构

```typescript
// components/extensions/my-extension.tsx
import { NodeViewWrapper } from '@tiptap/react';

export const MyExtension = NodeViewWrapper.create(() => {
  // 扩展实现
}).configure({
  // 配置选项
});
```

### 注册扩展

```typescript
// components/editor.tsx
import { MyExtension } from './extensions/my-extension';

const editor = useEditor({
  extensions: [
    StarterKit,
    CodeBlock,
    MyExtension,  // 添加自定义扩展
  ],
});
```

## 代码组织

### 组件导出

使用具名导出：

```typescript
export function MyComponent() { ... }

export default function MyDefaultComponent() { ... }
```

### 样式模块化

使用组件库的样式工具：

```typescript
import { cn } from '@/lib/utils';

// 合并类名
className={cn('base-class', conditionalClass)}
```

## 性能优化

### React.memo

对于纯展示组件使用 memo：

```typescript
export const MyComponent = React.memo(function MyComponent(props) {
  // ...
});
```

### useMemo

缓存计算结果：

```typescript
const filteredData = useMemo(() => {
  return data.filter(item => item.active);
}, [data]);
```

### useCallback

缓存事件处理函数：

```typescript
const handleClick = useCallback(() => {
  // 处理逻辑
}, [dependencies]);
```

## 下一步

- [项目结构](./project-structure.md) - 了解代码组织
- [API 开发](./api-routes.md) - 了解 API 路由开发
