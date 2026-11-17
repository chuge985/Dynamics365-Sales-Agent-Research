# Sales Research Agent 是什么？
Dynamics 365 Sales中的Sales Research Agent通过自然语言与数据对话，为你提供解决复杂的业务问题的能力。它为你提供丰富的销售数据洞察，助你在考虑众多变量时做出明智决策。
你可以向agent提供general 和 business 背景，以提升内容的相关性和一致性。
中文文档：https://learn.microsoft.com/zh-cn/dynamics365/sales/sales-research-agent
英文文档：https://learn.microsoft.com/en-us/dynamics365/sales/sales-research-agent


---

# Sales Research Agent：能力定义、边界与客户使用指引

## 一、这个 Agent 一开始到底要解决什么问题

Sales Research Agent 不是“让 CRM 自己说话”的通用聊天机器人，而是一个**Microsoft 管理的 AI 研究画布（research canvas）** ，专门用于回答销售领导层面临的、**需要跨变量推理的复杂业务问题**。

它的设计初衷可以从三个角度理解：

**问题侧：** 销售主管在管道审查、区域规划、配额覆盖分析等场景中，答案往往分散在 CRM、Fabric Lakehouse 和离线表格里。传统方式需要人工导出、拼接、透视，耗时数天甚至数周。Sales Research Agent 把“向数据提问”这件事变成了自然语言对话，让销售领导**自助地**获得决策就绪的分析结果，而不必等待分析团队排期。

**能力侧：** 它不是一个通用大模型套壳，而是**围绕 Dynamics 365 Sales 的 schema、术语和销售业务逻辑构建的领域专用研究代理**。它理解管道阶段、配额、区域、预测等销售概念，并能在多轮对话中持续深挖，而不是只回答单轮事实性问题。

**输出侧：** 它交付的不是“一段回答”，而是一个**研究蓝图（blueprint）** ——包含研究摘要、关键发现、可视化图表、推理过程（Show Work）和建议的后续步骤。用户可以在此基础上追问、改图、换数据源，把一次研究推演成一条完整的分析链路。

**总结定义：** Sales Research Agent 是给销售领导用的**对话式战略研究工具**，解决的是“数据在那里，但问题太复杂、拼不起来、来不及拼”的问题；它不解决数据录入、流程执行和确定性报表的问题。


## 二、它可以做什么：客户拿到 Agent 后的能力清单

### 1. 回答 pipeline exploration 与 sales operations 领域的战略性问题

Agent 专门针对 **pipeline exploration（管道勘探）** 和 **sales operations（销售运营）** 等销售领导关心的主题进行优化。它既能回答具体问题（“今年平均赢单率是多少”），也能回应宽泛提示（“告诉我管道覆盖的情况”），并自动展开相关分析。

典型可问的问题包括：
- 按区域、阶段、负责人拆解管道覆盖率缺口的原因；
- 预测收入与实际开票收入之间的偏差分析；
- 配额达成情况与管道健康度的交叉诊断；
- 销售周期长度变化对 pipeline 的影响。

### 2. 在权限边界内整合多源数据

Agent 默认连接部署环境中的 Dynamics 365 Sales 数据。如果组织使用多个 Dataverse 环境，可以配置为连接其他环境；如果拥有 Fabric Lakehouse 访问权限，也可以将其作为数据源加入研究。此外，用户可以上传 CSV、Excel 或 PDF 文件来丰富分析。

**关键约束：** Agent 只查询**用户本人已有权限查看的数据**，不会扩展安全角色允许的范围。

### 3. 通过上下文配置提升回答的组织贴合度

Agent 支持两层上下文：

- **General context（一般上下文）：** 职位、行业、财政年度、货币、组织首字母缩略语和数据字典。这些信息跨会话持久保留，适用于该环境下的所有研究。
- **Business function（业务职能）：** 针对特定用例（如管道审查、账户规划）的角色、规则、度量定义和常见问题。不同角色使用 Agent 的方式不同，业务职能让回答自动匹配使用场景。

**没有上下文时，Agent 会给出“正确但泛泛”的答案；有了上下文，答案才会反映组织实际怎么运作**。

### 4. 支持交互式深挖与推理透明

研究蓝图生成后，用户可以用 **AI cursor** 在可视化上直接追问、修改图表类型、调整分组，或要求 Agent 只更新某一个 block。Agent 的 **Show Work** 功能会说明它使用了哪些数据、走了哪些分析步骤，使用户可以评估结论的可信度，并在必要时纠正方向。


## 三、它不能做什么 / 不适合做什么（能力边界与不适用场景）

这一部分是客户期望管理的核心。Sales Research Agent 是一个**研究型、只读型、上下文依赖型**的代理。把它用在它不擅长的场景里，不仅得不到好结果，还会损害对工具的信任。

### A. 不能做什么（硬性能力边界）

**1. 不能写回 CRM，不能替用户执行操作。**
Agent 是只读的研究工具。它不会创建、更新或删除任何 CRM 记录（机会、客户、活动等），也不会替用户推进交易阶段或分配任务。分析完成后，执行动作仍然由用户在 CRM 中完成。

**2. 不能访问外部网站或非 Microsoft 系统。**
Agent 仅处理来自**已连接的 Dataverse 环境**或**直接上传到会话的文件**中的数据。它不能抓取外部网站、第三方 SaaS 或非 Microsoft 业务系统。如果需要外部信息，只在**用户未提供任何数据源**时，Agent 才会基于用户提示查询 Bing；Bing 返回的信息可能无法精确匹配特定业务场景。

**3. 不能绕过用户的安全权限。**
Agent 不会“帮你看更多”。它查询的数据范围**严格等于**用户自身安全角色允许的范围。如果用户看不到某条记录，Agent 也看不到，也不会在结果中暴露该记录。

**4. 不能像 Copilot Studio 自定义代理那样被任意改造。**
这是一个 **Microsoft 管理的开箱即用代理**。你可以配置上下文、业务职能、起始提示和数据源，但**不能直接编辑代理的 topics、提示词、对话流或底层逻辑**，像在 Copilot Studio 中构建自定义代理那样。

**5. 有明确的数据接入与文件限制。**
文件上传支持 PDF、CSV、Excel，但存在硬限制：单个文件不超过 10 MB，最多 5 个文件，总大小不超过 30 MB；PDF 最多 150 页且必须包含可选文本；加密、密码保护或版权管理的文件不支持。不支持音频、图片、通话录音等非结构化格式的直接摄取。

**6. 不是在每个地理区域和每种语言中都可用。**
Agent 的可用性受租户所在区域和语言支持范围限制。在不受支持的区域或语言环境中，可能无法访问或无法获得预期质量的结果。

### B. 不适合做什么（不适用场景）

**1. 不适合替代官方 BI 报表或财务系统做“确定性数汇报”。**
Agent 擅长的是**假设探索和诊断**，而不是出具经过审计口径确认的正式 KPI 数值。经营会议上的确定性数字，应当以现有 BI、财务和 DWH 的定义为准，而不是直接用 Agent 的对话结果替代官方报表。Agent 更适合在正式汇报**之前**用来发现异常、生成假设、缩小排查范围。

**2. 不适合做“大而全的预测引擎”。**
它不是预测建模工具。它可以帮助你**诊断**预测偏差、分析管道覆盖和赢单率驱动因素，但不应被当作“预测下季度销售额”的水晶球来使用。销售预测的准确性首先取决于源数据的完整性和一致性，而不是代理的推理能力。

**3. 不适合在上下文严重缺失或数据质量差的场景下直接上线。**
如果组织的财政年度、自定义字段含义、首字母缩略语、业务规则没有提供给 Agent，它会给出正确但**泛化**的答案；如果自定义表缺少纯语言描述，Agent 可能无法识别其相关性。**没有上下文的 Agent 不是“更中立”，而是“更没用”** ——它无法替组织猜出业务规则。

**4. 不适合替代卖家层面的日常执行工作。**
Agent 的定位是销售领导/销售运营的研究工具，不是卖家日常跟进客户、记录活动的操作助手。卖家层面的线索资格判断、外联执行、活动记录等，属于其他代理或 CRM 工作流的范畴。

**5. 不适合处理需要“写回”或“触发动作”的闭环场景。**
如果你的目标是“发现问题后自动更新记录、自动分配、自动推进流程”，Sales Research Agent 不是正确的工具。它停在“洞察”这一步，执行需要另接流程或人工完成。


## 四、给客户的行动建议：在能力范围内使用 Agent

### 1. 先建上下文，再问问题

在让用户自由提问之前，先完成两件事：

- 在 **Manage context** 中填入财政年度、货币、行业、关键首字母缩略语和数据定义（例如“ARR 指年度经常性收入”“30 天无活动视为风险交易”）；
- 对关键**自定义表**补充纯语言描述，否则 Agent 在回答某些问题时会无法把该表识别为相关数据源。

### 2. 从单一高价值数据源起步，不要一次性堆叠所有数据

官方最佳实践建议：**先用一个高价值内部数据源验证输出质量，再逐步扩展**。同时避免用多个松散相关的数据源“淹没” Agent，这会降低输出准确性。

### 3. 把 Agent 用在“正式决策之前”，而不是“正式汇报之中”

推荐的用法是：在管道审查会、QBR 或区域规划会**之前**，用 Agent 做假设探索和异常排查，生成研究蓝图作为讨论素材；在会议中，确定性数字仍以官方报表为准。Agent 的价值在于**缩短“从问题到假设”的时间**，而不是替代可信数据源。

### 4. 用 Business function 区分角色，而不是用一个 Prompt 服务所有人

销售运营关心管道覆盖率和配额逻辑，客户管理关心续约率和参与模式。**为不同角色创建不同的 business function**，让 Agent 根据问题自动匹配最相关的上下文和度量定义，比让所有人共用一套通用指令效果更好。

### 5. 先确认授权与容量，再向业务用户推广

Agent 需要 **Sales Premium 许可证**才能在 Sales Hub 中访问；非管理员用户需要被授予 **Sales Research Agent Reader** 安全角色才能看到入口；同时运行依赖 **Copilot Studio 容量**，容量不足会导致不可用。在推广前先完成这三项检查，避免用户因“打不开”而放弃使用。


**总结：** Sales Research Agent 是一个**在你权限范围内、基于你已连接数据、围绕销售领导战略问题做深度研究的对话式画布**。它帮你更快地提出对的问题、拆解复杂的管道和运营信号；它不替你执行、不替你汇报确定性数字、也不会在你没有提供上下文时替你看懂你的业务。把它放在“决策之前的研究环节”，用上下文和数据质量喂养它，它才能在能力边界内稳定交付价值。

---

# 使用 Sales Research Agent 分析您的销售表现
中文文档：https://learn.microsoft.com/zh-cn/dynamics365/sales/use-sales-research-agent
英文文档：https://learn.microsoft.com/en-us/dynamics365/sales/use-sales-research-agent


# 提供context以增强销售研究代理
通过添加上下文和说明，你可以提升销售研究代理生成内容的相关性和实用性。代理会自动将这些信息应用到提示中，这样你就不必每次重复。
你可以提供两种context：General context 和 Business function。
## General context
不论agent 研究哪个主题，都要相关的信息。
这包括你的职位、行业、财政年度和货币信息。
### 为代理设定General context
1. 在Sales Hub网站，进入 `My Work > Sales Research Agent`
   ![alt text](./image-openSalesResearchAgent.png)

2. 在页面右上角，选择人像图标 `Manage your context`
      ![alt text](./image-openManageContext.png)
      ![alt text](./image-openGenaralContext.png)
- 输入涵盖你的职位、行业、财政年度和货币的背景信息。这些信息帮助客服更好地理解您的业务和角色，并调整洞察内容使其更贴合您的需求。
- 在`Acronyms and data dictionary` 部分，添加组织在上下文中使用的数据的首字母缩略语或列标题定义。
当缩写出现在提示中或出现在你上传的数据或数据源中时，代理可以正确解读其含义并返回更好的结果。
- 要随时永久删除一般上下文信息，请在页面底部选择 `Delete all`。

## Business function
是什么：为代理提供仅适用于特定用例的角色、上下文和指令。
Business function 向Sales Research Agent 介绍您的组织在某一用例中的运作方式，如账户规划、区域规划、管道审查或参与分析。它包含重要的表格和关系、代理遵循的业务规则和度量定义，以及用户最常提出的问题。

何时创建 Business function：
- 你需要定义自定义字段或逻辑。
- 你希望对数据的展示或解读有更多控制权。
- 你需要将自己的商业知识应用于洞察的生成和呈现方式，同样要考虑具体的使用场景。

### 使用 Business Function Builder 创建业务功能
谁负责什么：
| Role |	他们的作用|
|----|----|
| Maker（销售运营、收入运营，或了解你Dynamics 365数据的管理员）|	创建业务函数，评估它，添加起始提示，编写默认蓝图，并分享业务函数。|
|用户 （卖家、客户经理或销售主管）|	选择一个业务职能和一个启动提示，并从自己的数据中获得答案。 不需要设置。|

中文文档：https://learn.microsoft.com/zh-cn/dynamics365/sales/sales-research-agent-business-function-builder-create#validate-the-business-function
英文文档：https://learn.microsoft.com/zh-cn/dynamics365/sales/sales-research-agent-business-function-builder-create#validate-the-business-function

### 评估 Business Function
中文文档：https://learn.microsoft.com/zh-cn/dynamics365/sales/sales-research-agent-business-function-builder-evaluate
英文文档：https://learn.microsoft.com/zh-cn/dynamics365/sales/sales-research-agent-business-function-builder-evaluate

### 创建和管理起始提示词
中文文档：https://learn.microsoft.com/zh-cn/dynamics365/sales/sales-research-agent-starter-prompts
英文文档：https://learn.microsoft.com/en-us/dynamics365/sales/sales-research-agent-starter-prompts

# 将Sales Research Agent 连接到其他数据源或上传数据

中文文档：https://learn.microsoft.com/zh-cn/dynamics365/sales/sales-research-agent-connect-data
英文文档：https://learn.microsoft.com/en-us/dynamics365/sales/sales-research-agent-connect-data

# 有关销售研究代理的常见问题解答

中文文档：https://learn.microsoft.com/zh-cn/dynamics365/sales/faqs-sales-research-agent
英文文档：https://learn.microsoft.com/en-us/dynamics365/sales/faqs-sales-research-agent