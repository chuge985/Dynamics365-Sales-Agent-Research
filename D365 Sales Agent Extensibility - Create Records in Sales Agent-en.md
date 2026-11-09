Here is the English version, aligned with the official Microsoft terminology used in the source document.

---

According to the Microsoft official documentation, enabling **Dynamics 365 record creation** in the **Sales agent** follows this core flow: **download the model-driven app package → upload it as a custom agent → extend its tools and knowledge to the Sales agent**.

---

### Prerequisites (all required)

Before you begin, confirm that the following requirements are met:

1. **Model-driven app**: You have a Dynamics 365 model-driven app, such as Sales Hub or another app that includes the target record table.
2. **Administrator permissions**: A Microsoft 365 AI administrator has enabled the permission to upload custom apps.
3. **Dynamics 365 security roles**: You have the **System Administrator** or **System Customizer** role in Dynamics 365, and the **AI Administrator** role in the Microsoft 365 admin center or Agent 365.

### Step 1: Download the app package from Power Apps

1. Sign in to [Power Apps](https://make.powerapps.com).
2. Open your model-driven app (MDA) in edit mode.
3. In the left navigation pane, select **App MCP**.
4. Under **Your app agent**, select **Download app agent** to download the app package.
5. After the download completes, you will get a ZIP package similar to `*_DeclarativeAgent.zip`.

> **Tip**: If you do not see this option, confirm that preview features are enabled in your environment.

### Step 2: Upload the custom agent in the Microsoft 365 admin center

1. Open the **Microsoft 365 admin center** at https://admin.microsoft.com/, and go to **Copilot controls**.
2. Select **Agents** → **+ Add agent**.
3. Select **Choose File**, and choose the ZIP package downloaded in Step 1.
4. After the system validates the package, confirm the agent name, icon, and host product, and then select **Next**.
5. Specify the users who can use the agent (for initial testing, we recommend **Just me** or a small test group), and then select **Next**.
6. Review the permissions and capabilities, select **Next**, and then select **Finish deployment** to complete the upload.

> **Note**: You do **not** need to actually deploy the agent here. You only need to complete the upload so that it appears in your organization's agent catalog.

### Step 3: Add tools and knowledge to the Sales agent

1. In the **Microsoft 365 admin center** at https://admin.microsoft.com/, go to **Agents** → **All agents**.
2. Select **Sales**, and then switch to the **Custom tools & knowledge** tab.
3. Select **Choose agent**.
4. In the **Extend Sales** pane, select the custom agent uploaded in Step 2, and then select **Next**.
5. Specify the users or security groups to which this extension should apply, and complete the addition.

### Step 4: Test the record creation experience

1. Open **Microsoft 365 Copilot**, and select the **Sales agent**.
2. Ask it to create a record by using natural language, for example:
   - “Create an opportunity for Contoso.”
   - “Create a contact: Name Marcus Reed, Company Fabrikam Industries, Email marcus.reed@fabrikam.com, Phone +1 415 555 0182, Job Title IT Director.”
3. The Sales agent displays an **inline form** in chat. The fields come from the **quick create form** for the Dynamics 365 record.
4. Review and complete the fields, and then select **Create**. The record is saved to Dynamics 365, and a confirmation message is displayed.

### Additional notes

- **Security inheritance**: Record creation and data access strictly follow Dynamics 365 security roles and field-level security. If the user does not have create permission, an error occurs.
- **Form field customization**: To change the fields displayed in the inline form, customize the **Quick Create Form** for the corresponding table in Power Apps.