# 停止构建 Agent，开始构建 Skills

> **视频链接**：[Don't Build Agents, Build Skills Instead - YouTube](https://www.youtube.com/watch?v=CEvIs9y1uog)
> **来源**：AI Engineer Code Summit 2025 (2025年11月21日) / The AI Engineer Podcast
> **演讲者**：Barry Zhang (Product Lead, Anthropic) & Mahesh Murag (Engineering Lead, Anthropic)
> **原标题**：Don't Build Agents, Build Skills Instead

## 1. 核心观点与主要论点

演讲者提出了 AI 开发范式的转变，认为当前的 AI 行业仍处于早期阶段（类比为“诺基亚时代”），开发者应该停止为每个细分领域重复造“全能 Agent”的轮子，转而构建通用的 Skills。

*   **“AI 堆栈”的新类比**：
    *   **模型 (Model) ≈ CPU**：拥有巨大的潜力，但单独使用能力有限，只有少数巨头能制造。
    *   **Agent 运行时 (Agent Runtime) ≈ 操作系统 (OS)**：负责编排进程、资源和数据（如 Claude Desktop, OpenAI API）。
    *   **Skills ≈ 应用程序 (Apps)**：这是数百万开发者应该关注的层面，用于解决具体问题。

*   **专业知识鸿沟 (The Expertise Gap)**：
    *   **Mahesh vs. Barry 比喻**：演讲中用了一个生动的比喻——Mahesh 是一个智商 300 的数学天才（代表通用大模型），但他不懂税务法规；Barry 是一个经验丰富的税务专家（代表领域知识）。如果你要报税，你会选 Barry 而不是 Mahesh。
    *   **结论**：目前的 Agent 虽然“聪明”（高智商），但缺乏特定领域的“专业知识”（Expertise）。Skills 的作用就是让通用的“天才”学会具体的“专业技能”。

*   **通用 Agent + 专用 Skills**：未来的方向是一个通用的、强大的 Agent（运行时），搭载各种领域特定的 Skills（如财务、法律、编程等），而不是为每个领域单独开发一个 Agent。

## 2. 关于构建 Skills 的具体方法和建议

演讲者强调，Skills 不仅仅是 Prompt，而是应该被视为**软件**来构建和维护。

*   **结构化定义**：一个成熟的 Skill 应该包含以下结构化组件，而不仅仅是一段长文本：
    *   **元数据 (Metadata)**：描述 Skill 的名称、版本、适用范围。
    *   **指令文档 (Instruction/Documentation)**：清晰定义操作步骤和规则。
    *   **脚本/工具 (Scripts/Tools)**：可执行的代码或 API 调用（通常通过 MCP 实现）。
    *   **示例 (Examples)**：Few-shot 示例，教模型如何处理特定情况。

*   **工程化实践**：
    *   **像软件一样对待**：Skills 需要经过开发、测试、评估（Evaluation）和优化。
    *   **解耦**：将“领域知识”与“智能推理”解耦。Skills 承载程序性知识（Procedural Knowledge），模型承载通用推理能力。
    *   **利用 MCP (Model Context Protocol)**：通过 MCP 服务器连接本地数据和工具，使 Skills 能够安全地访问外部系统。

*   **参与者多元化**：构建 Skills 的门槛比构建 Agent 低，非技术人员（如财务专家、法务顾问）也可以通过编写文档和规则来贡献 Skills。

## 3. 与构建 Agent 方式的对比分析

| 特性 | 传统 Agent 构建模式 | 新的 Skills 构建模式 |
| :--- | :--- | :--- |
| **开发重心** | 从头构建整个系统（Prompt + 记忆 + 工具调度） | 专注于构建特定任务的“程序性知识”模块 |
| **复用性** | 低，通常针对特定场景定制，难以迁移 | 高，Skills 是模块化的，可被不同 Agent 加载 |
| **维护成本** | 高，模型升级往往导致 Agent 需要重写 | 低，Skills 相对独立，模型升级后 Skills 往往能表现更好 |
| **知识沉淀** | 知识分散在 Prompt 和代码逻辑中，难以管理 | 知识结构化存储（文档、示例、工具），易于迭代 |
| **适用人群** | 需要深厚的 AI 工程背景 | 领域专家（SME）与工程师协作，甚至由业务人员编写 |

## 4. 视频中展示的典型案例或实际应用场景

视频中展示了 Anthropic 内部及合作伙伴如何利用 Skills 扩展 Claude 的能力：

*   **Document Skills (文档处理)**：Anthropic 发布了专门用于创建和编辑专业 Office 文档的 Skills。这赋予了通用模型处理复杂格式文档的能力，而不需要重新训练模型。
*   **行业垂直应用**：
    *   **金融服务 (Financial Services)**：通过特定的 MCP Server 和 Skills，让 Claude 能够访问实时市场数据、执行合规检查。
    *   **生命科学 (Life Sciences)**：集成了特定领域的知识库和分析工具，辅助科研人员。
*   **Claude Code**：在 Claude Code 的开发中，团队发现让 Claude 自己创建和优化 Skill，可以实现能力的自我进化。例如，编写一个 Skill 来规范特定的代码风格或数据库操作流程。

## 5. 演讲者提供的参考资料或工具推荐

*   **MCP (Model Context Protocol)**：一种开放标准，用于将 AI 助手连接到数据系统（如内容存储库、业务工具、开发环境）。它是构建 Skills 的重要基础设施。
*   **Procedural Knowledge (程序性知识)**：关于“如何做某事”的知识，通常包含步骤、规则和策略，是 Skills 的核心内容。
*   **Agent Skills Library**：鼓励开发者建立组织内部的 Skills 库，让不同的 Agent 共享这些能力。
