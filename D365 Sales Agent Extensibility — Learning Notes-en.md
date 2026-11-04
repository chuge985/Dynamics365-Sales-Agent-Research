# D365 Sales Agent Extensibility — Learning Notes

> A structured study document based on Microsoft official documentation.  
> Purpose: build a clear, working understanding of what can be extended, how far extension can go, and what constraints apply.

---

## Opening Summary: The Model, the Levers, and the Boundaries

D365 Sales Agent is **not extended by directly modifying the agent itself**. The supported model is indirect: you build or select a **custom declarative agent** that already contains the tools and knowledge you need, then an administrator **copies** that agent’s tools and knowledge into Sales Agent. The declarative agent acts as a **capability container** — Sales Agent receives a copy of its contents, not a live link to the agent itself.

**Two extension levers:**

- **Tools** make Sales Agent *able to act*: API plugins (OpenAPI-based) or MCP servers can retrieve data, create/update/delete records, and perform supported business actions against systems such as Dynamics 365, Salesforce, ServiceNow, SharePoint, and Outlook.
- **Knowledge** makes Sales Agent *grounded*: SharePoint sites, websites, documentation, and policies are attached so responses are based on organizational content rather than model memory alone.

**The boundaries that define “how far” you can go:**

- **Single source**: tools and knowledge can be copied from only **one** declarative agent at a time.
- **150 KB ceiling**: the combined size of all copied custom tools and knowledge cannot exceed **150 KB**.
- **Built-in content is permanent**: administrators cannot remove Sales Agent’s out-of-the-box tools and knowledge.
- **Snapshot, not sync**: the extension is a snapshot of the source agent’s version. Publishing a new source version does **not** auto-update Sales Agent; an administrator must run **Update from store**.
- **Propagation delay**: publishing, updating, or removing an extension can take up to **24 hours** to appear for users.
- **Permission prerequisite**: all users must already have access to every underlying data source and action referenced by the extension.

A **second, parallel path** exists through Power Platform custom connectors and skill services, which extends Sales capabilities by calling your APIs at runtime — but this path has its own constraints and is best treated as a separate route rather than a replacement for the declarative-agent-copy model.

---

## Chapter 1 — The Declarative-Agent-as-Source Model

**What this chapter covers:** the conceptual architecture — why extension flows through a declarative agent, what a declarative agent contains, and how the copy operation works.

**Key points to capture:**

- Definition of a declarative agent: a specialized agent combining instructions, tools, and knowledge for a specific scenario such as account research, renewal planning, or order status.
- The copy operation in the Microsoft 365 admin center: Agents > All agents > Sales > Custom tools & knowledge > Choose agent > select the declarative agent > assign users or security groups > Save.
- What “copy” actually means: all tools and knowledge from the selected agent are copied; you cannot cherry-pick individual items.
- The built-in baseline remains alongside the copied content; extension is additive, not substitutive.

**Official documentation:**

- [Extend Sales agent with custom tools and knowledge in the Microsoft 365 admin center](https://learn.microsoft.com/en-us/microsoft-sales-copilot/extend-sales-chat-custom-tools)
- [Extend Sales Agent with custom tools and knowledge (training module)](https://learn.microsoft.com/en-us/training/modules/sales-copilot-deploy-configure/extend-copilot-sales)

---

## Chapter 2 — Tools: API Plugins and MCP Servers

**What this chapter covers:** the two technical forms a “tool” can take, what each is built from, and when to use which.

**Key points to capture:**

- **API plugins** are defined by two artifacts: a **plugin manifest** (JSON) that describes functions, authentication, and response formats, and an **OpenAPI specification** that defines endpoints, paths, and schemas. The manifest references the OpenAPI spec and maps operations to functions Copilot can call.
- **MCP servers** can be wrapped as plugins; Microsoft 365 Agents Toolkit supports building a plugin from an MCP server, connecting the declarative agent to a remote MCP endpoint.
- The declarative agent manifest references the plugin through an `actions` array; the plugin manifest supplies the operational detail.
- **Capability scope of tools**: retrieve data and insights, create/update/delete records, perform supported business actions.

**Official documentation:**

- [Write instructions for declarative agents with API plugins](https://learn.microsoft.com/en-us/microsoft-365-copilot/extensibility/write-instructions-api-plugin)
- [Build API plugins from an existing API for Microsoft 365 Copilot](https://learn.microsoft.com/en-us/microsoft-365-copilot/extensibility/build-api-plugins-existing-api)
- [Build a plugin for a declarative agent from an MCP server](https://learn.microsoft.com/en-us/microsoft-365-copilot/extensibility/build-mcp-plugins)
- [Declarative agents for Microsoft 365 Copilot — overview](https://learn.microsoft.com/en-us/microsoft-365-copilot/extensibility/overview-declarative-agent)

---

## Chapter 3 — Knowledge Sources and Grounding

**What this chapter covers:** what counts as a knowledge source, how it changes response behavior, and what to watch for.

**Key points to capture:**

- Knowledge sources ground responses in organizational content: SharePoint sites, websites, documentation, and policies.
- Knowledge is attached to the declarative agent, then copied into Sales Agent along with tools; it is not configured separately inside Sales Agent.
- Grounding is what allows Sales Agent to answer with organizational context rather than model-only knowledge — accuracy and contextual relevance are the design goals.
- The 150 KB ceiling applies to the **combined** size of tools and knowledge, so knowledge volume competes with tool manifest size for capacity.

**Official documentation:**

- [Knowledge sources for declarative agents](https://learn.microsoft.com/en-us/microsoft-365-copilot/extensibility/knowledge-sources)

---

## Chapter 4 — Citations and `response_semantics`

**What this chapter covers:** how to make custom tool and knowledge results appear as clickable, source-linked citations in Sales Agent.

**Key points to capture:**

- Citation behavior is configured through **`response_semantics`** in the plugin manifest. It tells Copilot where the citable URL and title live in the response payload, so citations render as clickable links.
- `response_semantics` acts as a **contract** between the API/MCP response and Copilot’s rendering layer.
- A minimum configuration maps a `data_path` to the relevant array and maps `title` and URL fields within each item.
- Without `response_semantics`, custom tool responses may not surface as structured citations even if the data is present.

**Official documentation:**

- [Show citations with response semantics in declarative agents](https://learn.microsoft.com/en-us/microsoft-365-copilot/extensibility/plugin-citations)
- [Configure citations and source links (Sales Agent extension section)](https://learn.microsoft.com/en-us/microsoft-sales-copilot/extend-sales-chat-custom-tools#configure-citations-and-source-links)

---

## Chapter 5 — Building the Source Declarative Agent

**What this chapter covers:** the build workflow for the source agent before it is copied into Sales Agent.

**Key points to capture:**

- Design around a specific sales scenario (account research, renewal planning, order status) rather than a generic “everything” agent.
- Add required API plugins or MCP tools for business actions, attach relevant knowledge sources, and validate that target users can access every underlying data source and action.
- Test the agent’s responses, permissions, and business actions **before publishing**; publish only after validation.
- The primary authoring path documented for Sales Agent extension is **Microsoft 365 Agents Toolkit**; it generates the declarative agent scaffold, plugin manifest, and OpenAPI spec structure.

**Official documentation:**

- [Create declarative agents using Microsoft 365 Agents Toolkit](https://learn.microsoft.com/en-us/microsoft-365/copilot/extensibility/build-declarative-agents)
- [Declarative agents for Microsoft 365 Copilot — overview](https://learn.microsoft.com/en-us/microsoft-365-copilot/extensibility/overview-declarative-agent)

---

## Chapter 6 — Lifecycle: Publish, Update, Remove, and Propagate

**What this chapter covers:** what happens after the source agent exists and the extension is in place.

**Key points to capture:**

- **Publish**: the source declarative agent must be published before its tools and knowledge can be copied into Sales Agent.
- **Update**: when a newer source version exists, use **Update from store** on the Custom tools & knowledge tab; assigned users and security groups are preserved.
- **Remove**: select **Remove agent extension** on the same tab to strip the custom capabilities.
- **Propagation**: publish, update, and remove operations can each take up to 24 hours to reach users.
- **Version pinning**: because the extension is a snapshot, the Sales Agent does not track the source agent’s latest version automatically; lifecycle management is an explicit admin action.

**Official documentation:**

- [Update custom tools and knowledge in Sales agent](https://learn.microsoft.com/en-us/microsoft-sales-copilot/update-sales-chat-custom-tools)
- [Extend Sales agent — full workflow and current limitations](https://learn.microsoft.com/en-us/microsoft-sales-copilot/extend-sales-chat-custom-tools)

---

## Chapter 7 — The Parallel Path: Power Platform Custom Connectors and Skill Services

**What this chapter covers:** the second extensibility route, how it differs mechanically from the declarative-agent-copy model, and where its boundary lies.

**Key points to capture:**

- Each Sales in Microsoft 365 Copilot capability is backed by a **skill service**; extensibility lets that skill service call your application APIs at runtime to enrich the capability with additional insights.
- The maker builds three things: **APIs** that match the capability’s expected inputs/outputs, a **Power Platform connector** with OAuth authentication, and an **action** that adds Copilot-facing descriptions to the connector.
- Authentication uses **OAuth 2.0 with Microsoft Entra ID**; delegated permissions and least-privilege scopes are the recommended posture.
- **Important boundary**: this path can enhance existing capabilities and add new **Q&A** capabilities to chat features, but **cannot add new capabilities to non-chat features** of the application.

**Official documentation:**

- [Extend the Sales in Microsoft 365 Copilot (skill services and custom APIs)](https://learn.microsoft.com/en-us/training/modules/sales-copilot-deploy-configure/extend-copilot-sales)
- [Extend Microsoft 365 Copilot for Sales with partner applications (preview)](https://learn.microsoft.com/en-us/microsoft-sales-copilot/extend-sales-partner-apps)
- [Create a custom connector and connector action (preview)](https://learn.microsoft.com/en-us/microsoft-sales-copilot/create-custom-connector)

---

## Chapter 8 — Business Skills in Dataverse (Preview)

**What this chapter covers:** the deeper, process-level extension mechanism that teaches Sales Agent *how* to follow organizational procedures.

**Key points to capture:**

- **Business skills** are natural-language instructions stored in Dataverse that define steps, required information, and business rules for specific tasks.
- Unlike tools (which expose operations) and knowledge (which grounds responses), business skills encode **procedural and policy knowledge** — how the organization wants a task performed.
- Sales Agent discovers and uses these skills through the **Dataverse Model Context Protocol (MCP) server** after the required Dataverse features are enabled.
- Enabling requires Dataverse intelligence features, search indexing, and MCP client permissions at the environment level; users need at least the **Basic User** security role in the Dynamics 365 environment to see organization-level business skills.
- This is a **preview feature** — not for production use, with restricted functionality and supplemental terms of use.

**Official documentation:**

- [Enable business skills in Dataverse for Sales agent (preview)](https://learn.microsoft.com/en-us/microsoft-sales-copilot/business-skills-dataverse)
- [Business skills overview (Power Apps / Dataverse)](https://learn.microsoft.com/en-us/power-apps/maker/data-platform/data-platform-business-skill-overview)

---

## Chapter 9 — Security, Permissions, and Governance

**What this chapter covers:** the access and consent controls that sit underneath every extension route.

**Key points to capture:**

- **User-level permissions are non-negotiable**: every user who receives the extension must have access to all referenced data sources and actions; the extension does not grant permissions on its own.
- Sales Agent applies the organization’s existing **CRM access controls and user permissions**; administrators need customization rights in the CRM, and users need view/update/create permissions for records they interact with through Copilot.
- For the custom-connector path, **OAuth 2.0 with Microsoft Entra ID** is the expected authentication pattern; admin consent and conditional access policies govern app authorization.
- Governance controls include: restricting non-admin consent, requiring admin approval for high-risk delegated permissions, regular review of OAuth grants, and tenant-level data isolation.

**Official documentation:**

- [Privileges required to use Copilot for Sales](https://learn.microsoft.com/en-us/microsoft-sales-copilot/privileges-required-copilot-sales)
- [Grant agents access to Microsoft 365 resources](https://learn.microsoft.com/en-us/microsoft-365-copilot/extensibility/grant-agent-access)

---

## Chapter 10 — Decision Guide: Which Extension Route Fits Which Scenario?

**What this chapter covers:** a comparison framework for choosing between the declarative-agent-copy model, the custom-connector/skill-service model, and business skills.

**Key points to capture:**

- **Use the declarative-agent-copy model** when the goal is to add *new tools and knowledge to the Sales Agent chat experience* within the 150 KB single-source constraint — it is the most directly documented and most constrained path.
- **Use the custom-connector/skill-service model** when the goal is to *enrich an existing Sales capability with real-time insights from your own APIs*, and when chat-only Q&A enhancement is sufficient; it cannot extend non-chat features.
- **Use business skills (preview)** when the need is *process adherence* rather than new data access — teaching the agent steps, rules, and policies stored in Dataverse. Treat preview status as a production constraint.
- The three routes are not mutually exclusive at the platform level, but the declarative-agent-copy model’s **single-source rule** means you cannot stack multiple declarative agents into Sales Agent at once.

**Official documentation:**

- [Extend Sales Agent — core extensibility article](https://learn.microsoft.com/en-us/microsoft-sales-copilot/extend-sales-chat-custom-tools)
- [Extend the Sales in Microsoft 365 Copilot — skill-service route](https://learn.microsoft.com/en-us/training/modules/sales-copilot-deploy-configure/extend-copilot-sales)
- [Business skills in Dataverse (preview)](https://learn.microsoft.com/en-us/microsoft-sales-copilot/business-skills-dataverse)

---

## How to Use This Document

Start with **Chapter 1** for the mental model, then read **Chapters 2–3** for the two capability levers, **Chapter 4** if citations matter to your scenario, and **Chapters 5–6** for the build-and-operate workflow. **Chapters 7–8** are the “second routes” and are best read once the main model is clear. **Chapters 9–10** are for governance and route selection decisions. Each chapter is intentionally a **skeleton** — fill in implementation detail (manifest schemas, exact OpenAPI patterns, connector certification steps) as you work through the linked official docs.