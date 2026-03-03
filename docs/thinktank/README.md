# ThinkTank 文档中心

欢迎来到 ThinkTank 项目文档。这里包含了项目的架构、API、开发指南等完整信息。

## 文档导航

### 入门指南

- [项目概述](./getting-started/overview.md) - 了解 ThinkTank 是什么以及它的核心理念
- [快速开始](./getting-started/quick-start.md) - 快速搭建和运行项目

### 架构文档

- [系统架构](./architecture/system-architecture.md) - 整体架构设计和各层关系
- [数据模型](./architecture/data-model.md) - 文件系统和配置数据结构
- [权限体系](./architecture/auth-rbac.md) - 认证和基于角色的访问控制

### 开发指南

- [开发环境配置](./development/environment-setup.md) - 配置开发环境
- [项目结构](./development/project-structure.md) - 代码组织结构说明
- [组件开发](./development/components.md) - UI 组件开发指南
- [API 开发](./development/api-routes.md) - API 路由开发规范

### 功能模块

- [项目管理](./features/project-management.md) - 项目和分组管理功能
- [Git 镜像同步](./features/git-sync.md) - Git 仓库镜像和同步机制
- [编辑器](./features/editor.md) - Tiptap 编辑器功能
- [文件管理](./features/file-management.md) - 文件树和文件操作

### API 参考

- [项目 API](./api/projects-api.md) - 项目相关 API 端点
- [文件 API](./api/files-api.md) - 文件操作 API 端点
- [用户 API](./api/users-api.md) - 用户和认证相关 API

### 运维指南

- [部署指南](./deployment/deployment.md) - 生产环境部署步骤
- [配置说明](./deployment/configuration.md) - 环境变量和配置项
- [故障排查](./deployment/troubleshooting.md) - 常见问题和解决方案

---

## 核心特性

ThinkTank 是一个文件原生的混合模式知识中心，核心特性包括：

- **混合模式**：同时支持在线编辑和 Git 镜像两种工作流
- **文件原生**：所有数据存储在文件系统，无需数据库
- **Git 集成**：自动同步远程 Git 仓库，支持版本浏览
- **权限控制**：基于角色的访问控制（RBAC）
- **个人化**：收藏夹和最近访问记录
- **分组管理**：项目分组和组织

## 技术栈

- **框架**：Next.js 14+ (App Router)
- **编辑器**：Tiptap (Markdown)
- **UI**：Tailwind CSS + shadcn/ui
- **认证**：NextAuth.js (Credentials Provider)
- **版本控制**：Git (simple-git)
- **定时任务**：node-cron
- **加密**：Node.js crypto (AES-256-CBC)

## 贡献指南

欢迎贡献！请先阅读 [开发指南](./development/) 了解项目结构。

## 许可证

ISC