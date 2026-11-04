# D365 Sales Agent 扩展能力——学习笔记

> 基于微软官方文档整理的结构化学习文档。  
> 目的：建立清晰、可操作的理解——能扩展什么、能扩展到什么程度、受哪些约束。

---

## 开篇概要：模型、杠杆与边界

D365 Sales Agent **不是通过直接修改代理本身来扩展的**。官方支持的模型是间接的：你先构建（或选择一个）**自定义声明式代理**，其中已装配好所需的工具和知识，然后由管理员将该代理的工具与知识**复制**到 Sales Agent 中。声明式代理充当**能力容器**——Sales Agent 拿到的是其内容的副本，而不是与该代理的实时链接。

**两个扩展杠杆：**

- **工具（Tools）** 让 Sales Agent *能够行动*：基于 OpenAPI 的 API 插件或 MCP 服务器，可以检索数据、创建/更新/删除记录，并针对 Dynamics 365、Salesforce、ServiceNow、SharePoint、Outlook 等系统执行受支持的业务操作。
- **知识（Knowledge）** 让 Sales Agent *有据可依*：挂接 SharePoint 站点、网站、文档和政策，使回答基于组织内容，而非仅依赖模型记忆。

**界定“能扩展到什么程度”的边界：**

- **单一来源**：一次只能从**一个**声明式代理复制工具和知识。
- **150 KB 上限**：所有复制过来的自定义工具与知识，合计大小不得超过 **150 KB**。
- **内置内容永久保留**：管理员无法移除 Sales Agent 自带的工具与知识。
- **快照而非同步**：扩展是源代理某一版本的快照。源代理发布新版本**不会**自动更新 Sales Agent；管理员必须执行 **Update from store**。
- **传播延迟**：发布、更新或移除扩展，最多可能需要 **24 小时**才对用户可见。
- **权限前置条件**：所有用户必须已经拥有扩展所引用的每一项底层数据源和操作的访问权限。

还存在**第二条并行路径**：通过 Power Platform 自定义连接器和技能服务，在运行时调用你的 API 来扩展 Sales 能力——但该路径有其自身约束，宜将其视为独立路线，而非声明式代理复制模型的替代品。

---

## 第 1 章——声明式代理作为来源的模型

**本章内容：** 概念架构——为什么扩展要经由声明式代理流转、声明式代理包含什么、复制操作如何运作。

**需掌握的关键点：**

- 声明式代理的定义：面向特定场景（如客户研究、续约规划、订单状态）组合指令、工具与知识的专用代理。
- Microsoft 365 管理中心中的复制操作：Agents > All agents > Sales > Custom tools & knowledge > Choose agent > 选择声明式代理 > 分配用户或安全组 > Save。
- “复制”的实际含义：所选代理的**全部**工具和知识都会被复制；无法逐项挑选。
- 内置基线内容与复制内容并存；扩展是叠加式的，而非替换式的。

**官方文档：**

- [Extend Sales agent with custom tools and knowledge in the Microsoft 365 admin center](https://learn.microsoft.com/en-us/microsoft-sales-copilot/extend-sales-chat-custom-tools)
- [Extend Sales Agent with custom tools and knowledge（培训模块）](https://learn.microsoft.com/en-us/training/modules/sales-copilot-deploy-configure/extend-copilot-sales)

---

## 第 2 章——工具：API 插件与 MCP 服务器

**本章内容：** “工具”的两种技术形态、各自由什么构成、何时用哪种。

**需掌握的关键点：**

- **API 插件**由两个构件定义：**插件清单**（JSON），描述函数、身份验证和响应格式；以及 **OpenAPI 规范**，定义端点、路径和架构。清单引用 OpenAPI 规范，并将操作映射为 Copilot 可调用的函数。
- **MCP 服务器**可封装为插件；Microsoft 365 Agents Toolkit 支持从 MCP 服务器构建插件，将声明式代理连接到远程 MCP 端点。
- 声明式代理清单通过 `actions` 数组引用插件；插件清单提供操作细节。
- **工具的能力范围**：检索数据与洞察、创建/更新/删除记录、执行受支持的业务操作。

**官方文档：**

- [Write instructions for declarative agents with API plugins](https://learn.microsoft.com/en-us/microsoft-365-copilot/extensibility/write-instructions-api-plugin)
- [Build API plugins from an existing API for Microsoft 365 Copilot](https://learn.microsoft.com/en-us/microsoft-365-copilot/extensibility/build-api-plugins-existing-api)
- [Build a plugin for a declarative agent from an MCP server](https://learn.microsoft.com/en-us/microsoft-365-copilot/extensibility/build-mcp-plugins)
- [Declarative agents for Microsoft 365 Copilot — overview](https://learn.microsoft.com/en-us/microsoft-365-copilot/extensibility/overview-declarative-agent)

---

## 第 3 章——知识源与 grounding（事实基础）

**本章内容：** 什么算知识源、它如何改变回答行为、需要注意什么。

**需掌握的关键点：**

- 知识源为回答提供组织内容依据：SharePoint 站点、网站、文档和政策。
- 知识挂接在声明式代理上，随后随工具一起复制到 Sales Agent；它不是在 Sales Agent 内部单独配置的。
- Grounding 使 Sales Agent 能够基于组织上下文作答，而非仅靠模型知识——准确性和上下文相关性是设计目标。
- 150 KB 上限适用于工具与知识的**合计**大小，因此知识体量与工具清单大小会争夺容量。

**官方文档：**

- [Knowledge sources for declarative agents](https://learn.microsoft.com/en-us/microsoft-365-copilot/extensibility/knowledge-sources)

---

## 第 4 章——引用与 `response_semantics`

**本章内容：** 如何让自定义工具和知识的结果在 Sales Agent 中呈现为可点击的来源引用。

**需掌握的关键点：**

- 引用行为通过插件清单中的 **`response_semantics`** 配置。它告诉 Copilot 可引用 URL 和标题位于响应负载的何处，从而将引用渲染为可点击链接。
- `response_semantics` 充当 API/MCP 响应与 Copilot 渲染层之间的**契约**。
- 最低配置：将 `data_path` 映射到相关数组，并在每个条目内映射 `title` 与 URL 字段。
- 没有 `response_semantics`，即使数据存在，自定义工具响应也可能不会以结构化引用的形式呈现。

**官方文档：**

- [Show citations with response semantics in declarative agents](https://learn.microsoft.com/en-us/microsoft-365-copilot/extensibility/plugin-citations)
- [Configure citations and source links（Sales Agent 扩展章节）](https://learn.microsoft.com/en-us/microsoft-sales-copilot/extend-sales-chat-custom-tools#configure-citations-and-source-links)

---

## 第 5 章——构建源声明式代理

**本章内容：** 源代理在复制到 Sales Agent 之前的构建工作流。

**需掌握的关键点：**

- 围绕具体销售场景（客户研究、续约规划、订单状态）设计，而非通用的“全能”代理。
- 添加业务操作所需的 API 插件或 MCP 工具，挂接相关知识源，并验证目标用户能访问每一项底层数据源和操作。
- 在**发布之前**测试代理的响应、权限和业务操作；验证通过后再发布。
- Sales Agent 扩展所记录的主要创作路径是 **Microsoft 365 Agents Toolkit**；它生成声明式代理脚手架、插件清单和 OpenAPI 规范结构。

**官方文档：**

- [Create declarative agents using Microsoft 365 Agents Toolkit](https://learn.microsoft.com/en-us/microsoft-365/copilot/extensibility/build-declarative-agents)
- [Declarative agents for Microsoft 365 Copilot — overview](https://learn.microsoft.com/en-us/microsoft-365-copilot/extensibility/overview-declarative-agent)

---

## 第 6 章——生命周期：发布、更新、移除与传播

**本章内容：** 源代理存在且扩展就位之后会发生什么。

**需掌握的关键点：**

- **发布**：源声明式代理必须先发布，其工具和知识才能被复制到 Sales Agent。
- **更新**：当存在更新的源版本时，在 Custom tools & knowledge 选项卡上使用 **Update from store**；已分配的用户和安全组会保留。
- **移除**：在同一选项卡上选择 **Remove agent extension**，移除自定义能力。
- **传播**：发布、更新和移除操作各自最多可能需要 24 小时才触达用户。
- **版本固定**：由于扩展是快照，Sales Agent 不会自动跟踪源代理的最新版本；生命周期管理是明确的管理员操作。

**官方文档：**

- [Update custom tools and knowledge in Sales agent](https://learn.microsoft.com/en-us/microsoft-sales-copilot/update-sales-chat-custom-tools)
- [Extend Sales agent — 完整工作流与当前限制](https://learn.microsoft.com/en-us/microsoft-sales-copilot/extend-sales-chat-custom-tools)

---

## 第 7 章——并行路径：Power Platform 自定义连接器与技能服务

**本章内容：** 第二条扩展路线、它在机制上与声明式代理复制模型有何不同，以及其边界在哪里。

**需掌握的关键点：**

- Microsoft 365 Copilot 中的每项 Sales 能力都由一个**技能服务**支撑；扩展性允许该技能服务在运行时调用你的应用程序 API，以附加洞察增强该能力。
- 制作者需构建三样东西：符合该能力预期输入/输出的 **API**、带 OAuth 身份验证的 **Power Platform 连接器**，以及为连接器添加 Copilot 面向描述的**操作**。
- 身份验证使用 **OAuth 2.0 与 Microsoft Entra ID**；建议采用委托权限和最小权限范围。
- **重要边界**：该路径可以增强现有能力，并为聊天功能添加新的 **问答** 能力，但**不能为应用的非聊天功能添加新能力**。

**官方文档：**

- [Extend the Sales in Microsoft 365 Copilot（技能服务与自定义 API）](https://learn.microsoft.com/en-us/training/modules/sales-copilot-deploy-configure/extend-copilot-sales)
- [Extend Microsoft 365 Copilot for Sales with partner applications（预览版）](https://learn.microsoft.com/en-us/microsoft-sales-copilot/extend-sales-partner-apps)
- [Create a custom connector and connector action（预览版）](https://learn.microsoft.com/en-us/microsoft-sales-copilot/create-custom-connector)

---

## 第 8 章——Dataverse 中的业务技能（预览版）

**本章内容：** 更深层的、流程级的扩展机制，教导 Sales Agent *如何*遵循组织流程。

**需掌握的关键点：**

- **业务技能**是存储在 Dataverse 中的自然语言指令，为特定任务定义步骤、所需信息和业务规则。
- 与工具（暴露操作）和知识（提供依据）不同，业务技能编码的是**流程性与政策性知识**——组织希望任务如何被执行。
- 启用所需 Dataverse 功能后，Sales Agent 通过 **Dataverse Model Context Protocol (MCP) 服务器**发现并使用这些技能。
- 启用需要在环境级别开启 Dataverse 智能功能、搜索索引和 MCP 客户端权限；用户至少需要 Dynamics 365 环境中的 **Basic User** 安全角色才能看到组织级业务技能。
- 这是**预览功能**——不得用于生产，功能受限，并适用补充使用条款。

**官方文档：**

- [Enable business skills in Dataverse for Sales agent（预览版）](https://learn.microsoft.com/en-us/microsoft-sales-copilot/business-skills-dataverse)
- [Business skills overview（Power Apps / Dataverse）](https://learn.microsoft.com/en-us/power-apps/maker/data-platform/data-platform-business-skill-overview)

---

## 第 9 章——安全、权限与治理

**本章内容：** 位于每条扩展路线之下的访问与同意控制。

**需掌握的关键点：**

- **用户级权限不可妥协**：每个获得扩展的用户都必须能访问所有被引用的数据源和操作；扩展本身不授予权限。
- Sales Agent 应用组织现有的 **CRM 访问控制和用户权限**；管理员需要 CRM 中的自定义权限，用户需要对其通过 Copilot 交互的记录具备查看/更新/创建权限。
- 对于自定义连接器路径，**OAuth 2.0 与 Microsoft Entra ID** 是预期的身份验证模式；管理员同意和条件访问策略管控应用授权。
- 治理控制包括：限制非管理员同意、对高风险委托权限要求管理员批准、定期审查 OAuth 授权、租户级数据隔离。

**官方文档：**

- [Privileges required to use Copilot for Sales](https://learn.microsoft.com/en-us/microsoft-sales-copilot/privileges-required-copilot-sales)
- [Grant agents access to Microsoft 365 resources](https://learn.microsoft.com/en-us/microsoft-365-copilot/extensibility/grant-agent-access)

---

## 第 10 章——决策指南：哪种扩展路线适合哪种场景？

**本章内容：** 在声明式代理复制模型、自定义连接器/技能服务模型和业务技能之间做选择的比较框架。

**需掌握的关键点：**

- **使用声明式代理复制模型**：当目标是在 150 KB 单一来源约束内，为 Sales Agent 聊天体验*添加新工具和知识*时——这是记录最直接、约束也最明确的路径。
- **使用自定义连接器/技能服务模型**：当目标是*用自有 API 的实时洞察增强现有 Sales 能力*，且仅增强聊天问答即可满足时；它无法扩展非聊天功能。
- **使用业务技能（预览版）**：当需求是*流程遵循*而非新的数据访问——教导代理存储在 Dataverse 中的步骤、规则和政策。应将预览状态视为生产约束。
- 三条路线在平台层面并不互斥，但声明式代理复制模型的**单一来源规则**意味着你不能同时将多个声明式代理堆叠进 Sales Agent。

**官方文档：**

- [Extend Sales Agent — 核心扩展性文章](https://learn.microsoft.com/en-us/microsoft-sales-copilot/extend-sales-chat-custom-tools)
- [Extend the Sales in Microsoft 365 Copilot — 技能服务路线](https://learn.microsoft.com/en-us/training/modules/sales-copilot-deploy-configure/extend-copilot-sales)
- [Business skills in Dataverse（预览版）](https://learn.microsoft.com/en-us/microsoft-sales-copilot/business-skills-dataverse)

---

## 如何使用本文档

先从**第 1 章**建立心智模型，再读**第 2–3 章**理解两个能力杠杆；如果引用对你的场景重要，读**第 4 章**；**第 5–6 章**是构建与运维工作流。**第 7–8 章**是“第二条路线”，宜在主线模型清晰后再读。**第 9–10 章**用于治理与路线选择决策。每一章刻意保持为**骨架**——随着你研读所链接的官方文档，逐步补全实现细节（清单架构、具体 OpenAPI 模式、连接器认证步骤等）。