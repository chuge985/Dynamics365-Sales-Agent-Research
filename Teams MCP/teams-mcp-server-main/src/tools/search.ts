/**
 * Search & files tools: search Teams messages (Microsoft Search API) and list
 * files shared in a channel (SharePoint-backed drive).
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { graphRequest, handleGraphError, dataResult, textResult, htmlToText } from "../graph.js";
import { ResponseFormat } from "../constants.js";
import { responseFormatSchema, limitSchema, teamIdSchema, channelIdSchema } from "../schemas.js";

interface SearchHit {
  hitId?: string;
  summary?: string;
  resource?: {
    id?: string;
    createdDateTime?: string;
    from?: { user?: { displayName?: string } | null } | null;
    body?: { content?: string };
    channelIdentity?: { teamId?: string; channelId?: string };
    webUrl?: string;
  };
}
interface SearchResponse {
  value?: {
    hitsContainers?: { hits?: SearchHit[]; total?: number; moreResultsAvailable?: boolean }[];
  }[];
}

interface DriveItemRef {
  id?: string;
  parentReference?: { driveId?: string };
}
interface DriveItem {
  id?: string;
  name?: string;
  size?: number;
  webUrl?: string;
  folder?: unknown;
  file?: { mimeType?: string };
  lastModifiedDateTime?: string;
}

export function registerSearchTools(server: McpServer): void {
  // --- Search messages ------------------------------------------------------
  server.registerTool(
    "teams_search_messages",
    {
      title: "Search Teams messages",
      description: `Search across the user's Teams chat and channel messages using the Microsoft
Search API. Returns matching messages with a snippet and a deep link.

Note: relevance-ranked full-text search; exact phrasing and recency affect hits.

Args:
  - query (string): the search text (e.g. 'Plaid key', 'HIPAA BAA')
  - limit (number, 1-50): max hits (default 20)
  - response_format ('markdown' | 'json'): output format (default markdown)

Returns: JSON { total, count, moreResultsAvailable, hits: [{ id, from, createdDateTime, snippet, webUrl }] }.`,
      inputSchema: {
        query: z.string().min(2).max(400).describe("Search text"),
        limit: limitSchema,
        response_format: responseFormatSchema,
      },
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
    },
    async ({ query, limit, response_format }): Promise<ReturnType<typeof dataResult>> => {
      try {
        const resp = await graphRequest<SearchResponse>("/search/query", "POST", {
          requests: [
            {
              entityTypes: ["chatMessage"],
              query: { queryString: query },
              from: 0,
              size: Math.min(limit, 50),
            },
          ],
        });
        const container = resp.value?.[0]?.hitsContainers?.[0];
        const hits = container?.hits ?? [];
        const structured = {
          total: container?.total ?? hits.length,
          count: hits.length,
          moreResultsAvailable: container?.moreResultsAvailable ?? false,
          hits: hits.map((h) => ({
            id: h.resource?.id ?? h.hitId,
            from: h.resource?.from?.user?.displayName ?? "(unknown)",
            createdDateTime: h.resource?.createdDateTime,
            snippet: htmlToText(h.summary) || htmlToText(h.resource?.body?.content),
            webUrl: h.resource?.webUrl,
          })),
        };
        if (response_format === ResponseFormat.JSON) {
          return dataResult(JSON.stringify(structured, null, 2), structured);
        }
        if (!hits.length) {
          return dataResult(`No Teams messages found for '${query}'.`, structured);
        }
        const lines = [`# Search results for '${query}' (${structured.count} of ${structured.total})`, ""];
        for (const h of structured.hits) {
          const when = h.createdDateTime ? new Date(h.createdDateTime).toLocaleString() : "";
          lines.push(`**${h.from}** · ${when}`);
          lines.push(h.snippet || "(no preview)");
          if (h.webUrl) lines.push(h.webUrl);
          lines.push("");
        }
        return dataResult(lines.join("\n"), structured);
      } catch (error) {
        return textResult(handleGraphError(error), true);
      }
    },
  );

  // --- List channel files ---------------------------------------------------
  server.registerTool(
    "teams_list_channel_files",
    {
      title: "List channel files",
      description: `List files and folders stored in a channel's Files tab (the channel's
SharePoint-backed document folder).

Args:
  - team_id (string): the team ID
  - channel_id (string): the channel ID
  - limit (number, 1-50): max items (default 20)
  - response_format ('markdown' | 'json'): output format (default markdown)

Returns: JSON { count, items: [{ id, name, type, size, webUrl, lastModifiedDateTime }] }.`,
      inputSchema: {
        team_id: teamIdSchema,
        channel_id: channelIdSchema,
        limit: limitSchema,
        response_format: responseFormatSchema,
      },
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
    },
    async ({ team_id, channel_id, limit, response_format }): Promise<ReturnType<typeof dataResult>> => {
      try {
        // 1) Resolve the channel's files folder (driveItem) to get drive + item IDs.
        const folder = await graphRequest<DriveItemRef>(
          `/teams/${encodeURIComponent(team_id)}/channels/${encodeURIComponent(channel_id)}/filesFolder`,
        );
        const driveId = folder.parentReference?.driveId;
        const itemId = folder.id;
        if (!driveId || !itemId) {
          return textResult("Error: Could not resolve the channel's files folder (missing drive/item ID).", true);
        }
        // 2) List the children of that folder.
        const children = await graphRequest<{ value: DriveItem[] }>(
          `/drives/${encodeURIComponent(driveId)}/items/${encodeURIComponent(itemId)}/children`,
          "GET",
          undefined,
          { $top: Math.min(limit, 50) },
        );
        const items = (children.value ?? []).slice(0, limit);
        const structured = {
          count: items.length,
          items: items.map((it) => ({
            id: it.id,
            name: it.name,
            type: it.folder ? "folder" : "file",
            size: it.size ?? null,
            mimeType: it.file?.mimeType ?? null,
            webUrl: it.webUrl,
            lastModifiedDateTime: it.lastModifiedDateTime,
          })),
        };
        if (response_format === ResponseFormat.JSON) {
          return dataResult(JSON.stringify(structured, null, 2), structured);
        }
        const lines = [`# Channel files (${items.length})`, ""];
        for (const it of structured.items) {
          const icon = it.type === "folder" ? "📁" : "📄";
          const size = it.size ? ` (${Math.round((it.size as number) / 1024)} KB)` : "";
          lines.push(`${icon} **${it.name}**${size}`);
          if (it.webUrl) lines.push(`  ${it.webUrl}`);
        }
        return dataResult(lines.join("\n"), structured);
      } catch (error) {
        return textResult(handleGraphError(error), true);
      }
    },
  );
}
