/**
 * Teams & channels structural tools: list joined teams, list channels,
 * list members, create a channel.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { graphCollect, graphRequest, handleGraphError, dataResult, textResult } from "../graph.js";
import { ResponseFormat } from "../constants.js";
import { responseFormatSchema, limitSchema, teamIdSchema } from "../schemas.js";

interface GraphTeam {
  id: string;
  displayName?: string;
  description?: string;
}
interface GraphChannel {
  id: string;
  displayName?: string;
  description?: string;
  membershipType?: string;
  webUrl?: string;
}
interface GraphMember {
  id: string;
  displayName?: string;
  email?: string;
  roles?: string[];
}

export function registerTeamTools(server: McpServer): void {
  // --- List joined teams ----------------------------------------------------
  server.registerTool(
    "teams_list_joined_teams",
    {
      title: "List joined Teams",
      description: `List the Microsoft Teams the signed-in user is a member of.

Use this first to discover team IDs needed by channel/message tools.

Args:
  - limit (number, 1-50): max teams to return (default 20)
  - response_format ('markdown' | 'json'): output format (default markdown)

Returns: JSON { count, teams: [{ id, displayName, description }] }.`,
      inputSchema: { limit: limitSchema, response_format: responseFormatSchema },
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
    },
    async ({ limit, response_format }): Promise<ReturnType<typeof dataResult>> => {
      try {
        const teams = await graphCollect<GraphTeam>("/me/joinedTeams", limit, {
          $select: "id,displayName,description",
        });
        const structured = { count: teams.length, teams: teams as unknown as Record<string, unknown>[] };
        if (response_format === ResponseFormat.JSON) {
          return dataResult(JSON.stringify(structured, null, 2), structured);
        }
        const lines = [`# Joined Teams (${teams.length})`, ""];
        for (const t of teams) {
          lines.push(`## ${t.displayName ?? "(unnamed)"}`);
          if (t.description) lines.push(`- ${t.description}`);
          lines.push(`- ID: \`${t.id}\``, "");
        }
        return dataResult(lines.join("\n"), structured);
      } catch (error) {
        return textResult(handleGraphError(error), true);
      }
    },
  );

  // --- List channels --------------------------------------------------------
  server.registerTool(
    "teams_list_channels",
    {
      title: "List channels in a Team",
      description: `List channels within a given team.

Args:
  - team_id (string): the team ID (from teams_list_joined_teams)
  - limit (number, 1-50): max channels (default 20)
  - response_format ('markdown' | 'json'): output format (default markdown)

Returns: JSON { count, channels: [{ id, displayName, description, membershipType, webUrl }] }.`,
      inputSchema: { team_id: teamIdSchema, limit: limitSchema, response_format: responseFormatSchema },
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
    },
    async ({ team_id, limit, response_format }): Promise<ReturnType<typeof dataResult>> => {
      try {
        const channels = await graphCollect<GraphChannel>(
          `/teams/${encodeURIComponent(team_id)}/channels`,
          limit,
        );
        const structured = { count: channels.length, channels: channels as unknown as Record<string, unknown>[] };
        if (response_format === ResponseFormat.JSON) {
          return dataResult(JSON.stringify(structured, null, 2), structured);
        }
        const lines = [`# Channels (${channels.length})`, ""];
        for (const c of channels) {
          lines.push(`## ${c.displayName ?? "(unnamed)"} ${c.membershipType ? `[${c.membershipType}]` : ""}`);
          if (c.description) lines.push(`- ${c.description}`);
          lines.push(`- ID: \`${c.id}\``, "");
        }
        return dataResult(lines.join("\n"), structured);
      } catch (error) {
        return textResult(handleGraphError(error), true);
      }
    },
  );

  // --- List team members ----------------------------------------------------
  server.registerTool(
    "teams_list_team_members",
    {
      title: "List Team members",
      description: `List members of a team, including their roles (e.g. 'owner').

Note: requires the delegated scope TeamMember.Read.All, which may need a
one-time Entra admin consent.

Args:
  - team_id (string): the team ID
  - limit (number, 1-50): max members (default 20)
  - response_format ('markdown' | 'json'): output format (default markdown)

Returns: JSON { count, members: [{ id, displayName, email, roles }] }.`,
      inputSchema: { team_id: teamIdSchema, limit: limitSchema, response_format: responseFormatSchema },
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
    },
    async ({ team_id, limit, response_format }): Promise<ReturnType<typeof dataResult>> => {
      try {
        const members = await graphCollect<GraphMember>(
          `/teams/${encodeURIComponent(team_id)}/members`,
          limit,
        );
        const structured = { count: members.length, members: members as unknown as Record<string, unknown>[] };
        if (response_format === ResponseFormat.JSON) {
          return dataResult(JSON.stringify(structured, null, 2), structured);
        }
        const lines = [`# Team Members (${members.length})`, ""];
        for (const m of members) {
          const role = m.roles && m.roles.length ? ` (${m.roles.join(", ")})` : "";
          lines.push(`- **${m.displayName ?? "(unknown)"}**${role} — ${m.email ?? "no email"}`);
        }
        return dataResult(lines.join("\n"), structured);
      } catch (error) {
        return textResult(handleGraphError(error), true);
      }
    },
  );

  // --- Create channel -------------------------------------------------------
  server.registerTool(
    "teams_create_channel",
    {
      title: "Create a channel",
      description: `Create a new channel in a team. This MODIFIES the team.

Args:
  - team_id (string): the team ID
  - display_name (string): channel name (1-50 chars)
  - description (string, optional): channel description
  - membership_type ('standard' | 'private'): default 'standard'

Returns: JSON { id, displayName, webUrl }.`,
      inputSchema: {
        team_id: teamIdSchema,
        display_name: z.string().min(1).max(50).describe("Channel display name"),
        description: z.string().max(1024).optional().describe("Optional channel description"),
        membership_type: z
          .enum(["standard", "private"])
          .default("standard")
          .describe("Channel membership type"),
      },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
    },
    async ({ team_id, display_name, description, membership_type }): Promise<ReturnType<typeof dataResult>> => {
      try {
        const body: Record<string, unknown> = {
          displayName: display_name,
          membershipType: membership_type,
        };
        if (description) body.description = description;
        const created = await graphRequest<GraphChannel>(
          `/teams/${encodeURIComponent(team_id)}/channels`,
          "POST",
          body,
        );
        const structured = {
          id: created.id,
          displayName: created.displayName,
          webUrl: created.webUrl,
        };
        return dataResult(
          `✅ Created channel **${created.displayName}**\n- ID: \`${created.id}\`\n- URL: ${created.webUrl ?? "—"}`,
          structured,
        );
      } catch (error) {
        return textResult(handleGraphError(error), true);
      }
    },
  );
}
