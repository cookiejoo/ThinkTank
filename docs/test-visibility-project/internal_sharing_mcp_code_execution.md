# 技术分享：基于代码执行 (Code Execution) 优化 MCP 执行效率

本文档参考 [Anthropic 关于 MCP 代码执行模式的文章](https://www.anthropic.com/engineering/code-execution-with-mcp)，系统阐述如何借助代码执行 (Code Execution) 模式优化 MCP Agent 架构，以解决传统直接工具调用所面临的两大核心痛点：工具定义过载与中间结果 Token 浪费。

---

## 1. 目录结构

1.  **背景与目的**：为什么我们需要关注 MCP 与代码执行的结合？
2.  **核心痛点分析**：传统 Agent 架构在扩展性上的瓶颈。
3.  **技术方案详解**：Code Execution with MCP 模式。
4.  **案例与数据支撑**：效率提升的量化分析。
5.  **落地建议**：如何实施新的架构模式。
6.  **总结与 Q&A**：关键回顾与常见问题。

---

## 2. 背景与目的

### 分享背景
随着 AI Agent 生态的快速发展，Model Context Protocol (MCP) 已成为连接 AI 模型与外部数据/工具的行业标准。然而，在实际工程落地中，我们发现随着接入工具数量的增加（从几十个扩展到成百上千个）以及处理数据复杂度的提升，传统的 Agent 交互模式开始显现出严重的性能和成本问题。

### 分享目的
本次分享旨在介绍 Anthropic 工程团队提出的最新架构模式——**Code Execution with MCP**。通过将 MCP 工具调用从“模型直接映射”转变为“模型编写代码调用”，我们可以显著降低 Token 消耗，突破上下文窗口限制，并提高复杂任务的执行准确率。

---

## 3. 核心痛点分析

在目前的“直接工具调用” (Direct Tool Calling) 模式下，Agent 面临两大核心挑战：

### 3.1 工具定义过载 (Context Overload)
*   **现象**：Agent 需要预加载所有可用工具的定义（描述、参数 schema）。
*   **后果**：当工具有数千个时，仅工具定义就会占用数万 Token 的上下文窗口，导致响应延迟增加，且压缩了实际任务处理的空间。

### 3.2 中间结果的 Token 浪费 (Token Waste)
*   **现象**：工具产生的每一个中间结果（Intermediate Result）都必须返回给 LLM，写入上下文，再由 LLM 决定下一步操作。
*   **后果**：大量原始数据（如长文档、数据库查询结果）在模型和工具之间反复“搬运”，导致 Token 消耗成倍增加，且容易触发 Context Window 溢出。

---

## 4. 技术方案详解：Code Execution with MCP

### 核心理念
从 **"Model as Orchestrator"** (模型作为调度器，一步步发指令) 转向 **"Model as Coder"** (模型作为程序员，编写脚本执行任务)。

### 架构对比

| 特性 | 传统模式 (Direct Tool Calling) | 新模式 (Code Execution with MCP) |
| :--- | :--- | :--- |
| **交互方式** | 模型输出 JSON -> 客户端解析 -> 调用工具 -> 结果回传模型 | 模型编写代码 (Python/TS) -> 沙箱环境执行代码 -> 仅最终结果回传 |
| **工具感知** | 全量加载所有工具定义 | 通过代码库/文件树索引，按需 import |
| **数据流向** | 工具 -> **模型 Context** -> 下一个工具 | 工具 -> **执行环境内存** -> 下一个工具 |
| **适用场景** | 简单、单步任务 | 复杂流程、大数据量处理、多工具组合 |

### 实现逻辑
1.  **工具即代码库**：将 MCP Server 映射为代码执行环境中的本地库或 API 文件。
2.  **动态发现**：Agent 通过浏览文件树（File Tree）查看可用工具，而非阅读冗长的 JSON Schema。
3.  **脚本编排**：Agent 编写一段完整的脚本，在其中导入所需的工具函数，定义变量存储中间数据，并直接传递给下一个函数。

---

## 5. 案例与数据支撑

为了直观展示新架构的优势，我们结合公司的核心业务，分析一个典型场景：**“批量借贷申请的风控初筛与额度测算”**。

### 场景描述
业务人员指令：“请对昨天提交的 10,000 份贷款申请进行初筛，根据‘V3 授信规则’（收入>5000且无逾期，额度=月收入*3）计算建议额度，并输出高风险客户名单。”

### 传统模式流程 (Direct Tool Calling)
1.  **数据灾难**：模型调用 `credit_system.get_applications()`，试图获取 1 万个用户的征信报告、流水详情。
2.  **Context 溢出与幻觉**：
    *   即使每人数据仅 1KB，总量也达到 10MB，远远超出任何 LLM 的 Context 限制。
    *   若强行分批（每批 50 人），LLM 需要进行 200 轮交互。在执行“月收入*3”这种数学计算时，LLM 经常出现计算错误（如 5000*3=150000），导致**授信风险失控**。
3.  **隐私合规风险**：大量敏感的客户征信数据直接作为 Prompt 发送给模型，增加了数据泄露的攻击面。

### 新模式流程 (Code Execution)
1.  **代码编写**：LLM 编写如下 Python 脚本，将业务逻辑转化为代码：
    ```python
    import pandas as pd
    from internal_tools import load_loan_applications
    
    # 1. 加载数据：直接在沙箱内存中加载，不经过 LLM Context
    df = load_loan_applications(date="yesterday")
    
    # 2. 逻辑实现：精准执行 V3 风控规则
    def calculate_limit(row):
        # 规则：有逾期记录或信用分低于 600 -> 拒单
        if row['overdue_count'] > 0 or row['credit_score'] < 600:
            return 0
        # 规则：额度 = 月收入 * 3，且不超过 20万
        limit = row['monthly_income'] * 3
        return min(limit, 200000)
    
    # 3. 批量计算：毫秒级完成 1 万次运算
    df['suggested_limit'] = df.apply(calculate_limit, axis=1)
    
    # 4. 结果聚合
    approved_count = len(df[df['suggested_limit'] > 0])
    total_amount = df['suggested_limit'].sum()
    high_risk_ids = df[df['credit_score'] < 600]['application_id'].head(5).tolist()
    
    print(f"通过审批人数: {approved_count}")
    print(f"建议授信总额: {total_amount}")
    print(f"高风险样本(前5): {high_risk_ids}")
    ```
2.  **代码执行**：沙箱环境运行脚本，数据全程在受控的内存环境中流转。
3.  **结果回传**：LLM 仅获得最终的统计数字，无敏感明细数据。

### 核心优势对比
| 维度 | 传统模式 (Direct Tool Calling) | 新模式 (Code Execution) |
| :--- | :--- | :--- |
| **计算准确性** | **低** (LLM 数学能力弱，易幻觉) | **100%** (代码逻辑严丝合缝，风控刚需) |
| **数据隐私** | **高风险** (原始数据进 Prompt) | **安全** (原始数据不出沙箱，仅统计结果流出) |
| **处理容量** | < 50 条记录/次 | > 100,000 条记录/次 (取决于内存) |
| **Token 成本** | 极高 (反复搬运数据) | 极低 (仅代码文本) |

此案例证明，对于**金融借贷**这种对**计算准确性**和**数据隐私**要求极高的场景，Code Execution 模式是唯一可行的生产级方案。

---

## 6. 落地建议

针对我司目前的 Agent 架构，建议采取以下步骤进行升级：

1.  **构建沙箱环境**：部署安全的 Python 或 Node.js 代码执行沙箱（如 E2B 或自研容器环境）。
2.  **SDK 适配**：封装现有的 MCP Client，使其能自动生成对应的 Client SDK 代码库，供 Agent 在沙箱中 import。
3.  **Prompt 工程更新**：调整 System Prompt，引导模型在遇到多步骤数据处理任务时，优先选择编写代码而非直接调用工具。

---

## 7. 总结与 Q&A

### 总结
**Code Execution with MCP** 是 AI Agent 走向生产级应用的关键一步。它通过解耦“控制流”与“数据流”，让模型回归由于逻辑推理（写代码），而让传统计算环境承担数据搬运（运行代码），从而实现了效率与能力的双重飞跃。

### Q&A (常见问题预测)

**Q1: 这是否意味着所有的工具调用都要改成写代码？**
*   **A**: 不一定。对于简单的、单次查询（如“查天气”），直接工具调用依然高效。该模式主要针对多步骤、大数据量的复杂工作流。

**Q2: 让模型写代码会不会增加出错的概率？**
*   **A**: 现代 LLM (如 Claude 3.5, GPT-4o) 的代码生成能力极强。配合 TypeScript 的类型检查或 Python 的静态分析，代码执行的鲁棒性往往高于直接生成复杂的 JSON 结构。

**Q3: 安全性如何保障？**
*   **A**: 代码必须在隔离的沙箱容器中运行，严禁直接在宿主机执行。同时需对网络访问做白名单限制。

---
