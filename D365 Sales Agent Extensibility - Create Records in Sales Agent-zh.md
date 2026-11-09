根据微软官方文档，在 Sales agent（Sales 智能体）中启用 **Dynamics 365 记录创建**功能，核心逻辑是**“下载模型驱动应用包 → 作为自定义 agent 上传 → 将其工具和知识扩展到 Sales agent”**。

---

### 前置条件（缺一不可）

在开始配置前，请确认满足以下条件：

1. **模型驱动应用**：已拥有 Sales Hub 或其他包含目标记录表的 Dynamics 365 模型驱动应用。
2. **管理员权限**：Microsoft 365 AI 管理员已启用“上传自定义应用”的权限。
3. **Dynamics 365 安全角色**：在 Dynamics 365 中拥有 **System Administrator** 或 **System Customizer** 角色，并在 Microsoft 365 管理中心或 Agent 365 中拥有 **AI Administrator** 角色。


### 步骤一：从 Power Apps 下载应用包

1. 登录 [Power Apps](https://make.powerapps.com)
2. 以编辑模式打开你的MDA
3. 在左侧栏选择 App MCP 栏
4. 在 Your app agent 下方，点击 Download app agent，下载应用包
5. 下载完成后，会得到一个类似 `*_DeclarativeAgent.zip` 的压缩包。

> **提示**：如果看不到该选项，请确认环境中已启用预览功能。


### 步骤二：在 Microsoft 365 管理中心上传自定义 agent

1. 打开 **Microsoft 365 管理中心** https://admin.microsoft.com/，进入 **Copilot controls**。
2. 选择 **Agents** → **+ Add agent**。
3. 点击 **Choose File**，选中步骤一下载的 ZIP 包。
4. 系统验证通过后，确认 agent 名称、图标和宿主产品，点击 **Next**。
5. 指定可用的用户（建议先选择 **Just me** 或小范围测试组），点击 **Next**。
6. 审阅权限与能力，点击 **Next**，最后选择 **Finish deployment** 完成上传。

> **注意**：此处**无需实际部署（deploy）** agent，只需完成上传并使其出现在组织的 agent 目录中即可。


### 步骤三：将工具和知识添加到 Sales agent

1. 在 **Microsoft 365 管理中心** https://admin.microsoft.com/中，进入 **Agents** → **All agents**。
2. 选择 **Sales**，然后切换到 **Custom tools & knowledge** 选项卡。
3. 点击 **Choose agent**。
4. 在 **Extend Sales** 窗格中，选择步骤二上传的自定义 agent，点击 **Next**。
5. 指定需要应用此扩展的用户或安全组，完成添加。


### 步骤四：测试记录创建体验

1. 打开 **Microsoft 365 Copilot**，选择 **Sales agent**。
2. 用自然语言要求创建记录，例如：
   - “Create an opportunity for Contoso.”
   - “Create a contact: Name Marcus Reed, Company Fabrikam Industries, Email marcus.reed@fabrikam.com, Phone +1 415 555 0182, Job Title IT Director.”
3. Sales agent 会在聊天中显示**内联表单**，字段来自 Dynamics 365 记录的**快速创建表单**。
4. 审阅并补充字段后，点击 **Create**，记录即被保存到 Dynamics 365，并显示确认信息。


### 补充说明

- **安全继承**：记录的创建和数据访问严格遵循 Dynamics 365 的安全角色与字段级安全规则；无创建权限时会报错。
- **表单字段调整**：如果希望修改内联表单中显示的字段，需要自定义 Power Apps 中对应表的**快速创建表单**（Quick Create Form）。