/**
 * Microsoft Graph client + shared helpers (request, error handling, formatting).
 */

import axios, { AxiosError } from "axios";
import { getAccessToken } from "./auth.js";
import { GRAPH_BASE_URL, REQUEST_TIMEOUT_MS, CHARACTER_LIMIT } from "./constants.js";

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

/** A single Microsoft Graph "OData collection" page. */
export interface GraphPage<T> {
  value: T[];
  "@odata.nextLink"?: string;
  "@odata.count"?: number;
}

/**
 * Make an authenticated Microsoft Graph request.
 *
 * @param endpoint  Path relative to the Graph v1.0 base (e.g. "/me/joinedTeams")
 *                  or an absolute URL (e.g. an @odata.nextLink).
 * @param method    HTTP method (default GET).
 * @param body      JSON request body for POST/PATCH/PUT.
 * @param query     Query string parameters (e.g. OData $top, $filter, $select).
 */
export async function graphRequest<T>(
  endpoint: string,
  method: HttpMethod = "GET",
  body?: unknown,
  query?: Record<string, string | number | undefined>,
): Promise<T> {
  const token = await getAccessToken();
  const url = new URL(endpoint.startsWith("http") ? endpoint : `${GRAPH_BASE_URL}${endpoint}`);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null) url.searchParams.set(key, String(value));
    }
  }

  const response = await axios({
    method,
    url: url.toString(),
    data: body,
    timeout: REQUEST_TIMEOUT_MS,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  });
  return response.data as T;
}

/**
 * Fetch up to `limit` items from a Graph collection endpoint, following
 * @odata.nextLink as needed (Graph caps $top per resource).
 */
export async function graphCollect<T>(
  endpoint: string,
  limit: number,
  query?: Record<string, string | number | undefined>,
): Promise<T[]> {
  const items: T[] = [];
  let page = await graphRequest<GraphPage<T>>(endpoint, "GET", undefined, query);
  items.push(...(page.value ?? []));

  while (page["@odata.nextLink"] && items.length < limit) {
    page = await graphRequest<GraphPage<T>>(page["@odata.nextLink"]);
    items.push(...(page.value ?? []));
  }
  return items.slice(0, limit);
}

/** Convert a Graph/Axios error into a clear, actionable message string. */
export function handleGraphError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const axErr = error as AxiosError<{ error?: { code?: string; message?: string } }>;
    const status = axErr.response?.status;
    const apiCode = axErr.response?.data?.error?.code;
    const apiMsg = axErr.response?.data?.error?.message;
    const detail = apiMsg ? ` — ${apiCode ?? ""}: ${apiMsg}` : "";

    switch (status) {
      case 400:
        return `Error: Bad request (400)${detail}. Check IDs and body fields.`;
      case 401:
        return `Error: Unauthorized (401)${detail}. Run \`npm run login\` to (re)authenticate.`;
      case 403:
        return (
          `Error: Forbidden (403)${detail}. The signed-in user lacks permission, or a ` +
          `required delegated scope needs Entra admin consent (e.g. ChannelMessage.Read.All).`
        );
      case 404:
        return `Error: Not found (404)${detail}. Verify the team/channel/chat/message ID.`;
      case 429:
        return `Error: Rate limited (429)${detail}. Wait and retry; Graph throttles bursts.`;
      case 503:
        return `Error: Service unavailable (503)${detail}. Retry shortly.`;
      default:
        if (axErr.code === "ECONNABORTED") return "Error: Request timed out. Please try again.";
        return `Error: Graph request failed${status ? ` (${status})` : ""}${detail}`;
    }
  }
  return `Error: Unexpected error: ${error instanceof Error ? error.message : String(error)}`;
}

/**
 * Standard MCP tool result shape used across all tools. The index signature
 * keeps it structurally compatible with the SDK's CallToolResult type.
 */
export interface ToolResult {
  [key: string]: unknown;
  content: { type: "text"; text: string }[];
  structuredContent?: Record<string, unknown>;
  isError?: boolean;
}

/** Build a plain text tool result. */
export function textResult(text: string, isError = false): ToolResult {
  return { content: [{ type: "text", text }], isError };
}

/**
 * Build a tool result carrying both a human-readable text rendering and
 * structured data. Truncates the text rendering if it exceeds CHARACTER_LIMIT.
 */
export function dataResult(text: string, structured: Record<string, unknown>): ToolResult {
  let out = text;
  if (out.length > CHARACTER_LIMIT) {
    out =
      out.slice(0, CHARACTER_LIMIT) +
      `\n\n...[truncated at ${CHARACTER_LIMIT} characters. Narrow your query, ` +
      `reduce 'limit', or use pagination to see more.]`;
  }
  return { content: [{ type: "text", text: out }], structuredContent: structured };
}

/** Strip HTML tags from a Teams message body to a readable plain-text snippet. */
export function htmlToText(html: string | undefined): string {
  if (!html) return "";
  return html
    .replace(/<br\s*\/?>(?=)/gi, "\n")
    .replace(/<\/(p|div)>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
