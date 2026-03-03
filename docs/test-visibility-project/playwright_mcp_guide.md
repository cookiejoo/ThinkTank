# Playwright MCP 安装与使用指南

本文档将指导你如何安装和配置 Playwright MCP Server，以便让 Claude Code 具备操作浏览器的能力（如访问网页、抓取数据、自动化测试等）。

## 1. 什么是 Playwright MCP？
Playwright MCP 是一个基于 [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) 的服务，它充当了 Claude Code 和浏览器之间的桥梁。
*   **Claude Code**：负责理解你的指令。
*   **Playwright MCP**：负责执行浏览器的实际操作（点击、输入、截图等）。

## 2. 安装步骤

### 前置要求
*   已安装 **Node.js** (推荐 v18 或更高版本)。
*   已安装 **Claude Code** CLI 工具。

### 步骤一：配置 Claude Code
Claude Code 会自动读取配置文件来启动 MCP 服务。你需要修改你的 `~/.claude.json` 文件（如果没有则新建）。

1.  打开 `~/.claude.json` 文件。
2.  找到或添加 `mcpServers` 字段，并加入以下配置：

```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": [
        "-y",
        "@playwright/mcp@latest"
      ]
    }
  }
}
```
> **注意**：使用 `npx` 可以免去手动 `npm install` 的麻烦，它会自动下载并运行最新版。

### 步骤二：验证安装
在终端中启动 Claude Code：

```bash
claude

# 进入MCP

/mcp 

# 查看是否安装成功

> /mcp 

─────────────────────────────────────────────────────────────────────
 Manage MCP servers
 3 servers

 ❯ 1. playwright             ✔ connected · Enter to view details
   2. plugin:ftd-plugin:ftd  ✔ connected · Enter to view details
   3. plugin:gitlab:gitlab   △ needs authentication · Enter to login

```

启动时，请留意控制台输出。如果看到类似 `Starting MCP server: playwright` 的绿色提示，或者输入 `/doctor` 命令后看到 `playwright` 状态正常，即表示安装成功。

---

## 3. 如何使用

安装完成后，你无需学习复杂的 API，直接用**自然语言**给 Claude 下指令即可。

### 场景示例

#### 1. 网页内容提取
> **你**：打开 Github Trending 页面，看看今天最火的 Python 项目是哪几个？
>
> **Claude**：(会自动调用 Playwright 打开网页，读取内容并总结给你)

#### 2. 自动化测试/验证
> **你**：访问 https://www.google.com，截图发给我，确认一下页面是否能正常加载。
>
> **Claude**：(会自动截图并展示在终端里)

#### 3. 复杂任务
> **你**：去百度搜索“MCP 协议”，把第一页的搜索结果标题都列出来。

---

## 4. 常见问题 (FAQ)

### Q1: 启动时报错 `EACCES: permission denied`？
**原因**：npm 缓存目录的权限被 root 占用了（通常是因为以前用过 `sudo npm`）。
**解决**：
运行以下命令修复权限（将 `你的用户名` 替换为实际用户名，或者直接复制）：
```bash
sudo chown -R $(id -u):$(id -g) ~/.npm
sudo chown -R $(id -u):$(id -g) ~/Library/Caches/ms-playwright
```

### Q2: 需要手动安装浏览器吗？
**不需要**。Playwright MCP 会在第一次运行时自动下载所需的浏览器二进制文件（Chromium 等）。如果遇到下载失败，可能需要检查网络连接。

### Q3: 它能操作我已经打开的浏览器窗口吗？
**默认不能**。出于安全和稳定性考虑，它会启动一个独立的、隔离的浏览器实例。

---

祝大家使用愉快！如有问题请联系 Jone 团队。
