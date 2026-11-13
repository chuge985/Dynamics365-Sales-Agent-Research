/**
 * Identity tool — who is the server acting as.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { graphRequest, handleGraphError, dataResult, textResult } from "../graph.js";

interface GraphUser {
  id: string;
  displayName?: string;
  userPrincipalName?: string;
  mail?: string;
  jobTitle?: string;
}

export function registerIdentityTools(server: McpServer): void {
  server.registerTool(
    "teams_whoami",
    {
      title: "Who am I (Teams)",
      description: `Return the Microsoft 365 identity the server is authenticated as (delegated).

Use this to confirm which account the Teams MCP is acting on behalf of before
sending messages or creating meetings.

Args: none.

Returns: JSON { id, displayName, userPrincipalName, mail, jobTitle }.`,
      inputSchema: {},
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async (): Promise<ReturnType<typeof dataResult>> => {
      try {
        const me = await graphRequest<GraphUser>("/me", "GET", undefined, {
          $select: "id,displayName,userPrincipalName,mail,jobTitle",
        });
        const text =
          `Signed in as **${me.displayName ?? "(no name)"}**\n` +
          `- UPN: ${me.userPrincipalName ?? "—"}\n` +
          `- Mail: ${me.mail ?? "—"}\n` +
          `- Title: ${me.jobTitle ?? "—"}\n` +
          `- ID: ${me.id}`;
        return dataResult(text, { user: me as unknown as Record<string, unknown> });
      } catch (error) {
        return textResult(handleGraphError(error), true);
      }
    },
  );
}

// Re-export z so tool files share a single zod version reference if needed.
export { z };
