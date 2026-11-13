/**
 * Messaging tools: 1:1/group chats and channel conversations — read and send.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
  graphCollect,
  graphRequest,
  handleGraphError,
  dataResult,
  textResult,
  htmlToText,
} from "../graph.js";
import { ResponseFormat } from "../constants.js";
import { responseFormatSchema, limitSchema, teamIdSchema, channelIdSchema, chatIdSchema } from "../schemas.js";

interface GraphChat {
  id: string;
  topic?: string | null;
  chatType?: string;
  members?: { displayName?: string; email?: string }[];
}
interface GraphMessage {
  id: string;
  createdDateTime?: string;
  from?: { user?: { displayName?: string } | null; application?: { displayName?: string } | null } | null;
  body?: { content?: string; contentType?: string };
  webUrl?: string;
}

const bodyContentSchema = z
  .string()
  .min(1)
  .max(28000)
  .describe("Message text. Plain text by default; set content_type='html' to send HTML.");

const contentTypeSchema = z
  .enum(["text", "html"])
  .default("text")
  .describe("Body content type: 'text' (plain) or 'html'");

function senderName(m: GraphMessage): string {
  return m.from?.user?.displayName ?? m.from?.application?.displayName ?? "(system)";
}

function renderMessages(title: string, messages: GraphMessage[]): string {
  const lines = [`# ${title} (${messages.length})`, ""];
  for (const m of messages) {
    const when = m.createdDateTime ? new Date(m.createdDateTime).toLocaleString() : "";
    const text = htmlToText(m.body?.content) || "(no text / card or system message)";
    lines.push(`**${senderName(m)}** · ${when}`);
    lines.push(text);
    lines.push(`_id: ${m.id}_`, "");
  }
  return lines.join("\n");
}

function messageStructured(messages: GraphMessage[]): Record<string, unknown> {
  return {
    count: messages.length,
    messages: messages.map((m) => ({
      id: m.id,
      from: senderName(m),
      createdDateTime: m.createdDateTime,
      text: htmlToText(m.body?.content),
      webUrl: m.webUrl,
    })),
  };
}

export function registerMessageTools(server: McpServer): void {
  // --- List chats -----------------------------------------------------------
  server.registerTool(
    "teams_list_chats",
    {
      title: "List my chats",
      description: `List the user's recent 1:1 and group chats (not channel conversations).

Use this to find the chat_id for reading or sending chat messages.

Args:
  - limit (number, 1-50): max chats (default 20)
  - response_format ('markdown' | 'json'): output format (default markdown)

Returns: JSON { count, chats: [{ id, topic, chatType, members }] }.`,
      inputSchema: { limit: limitSchema, response_format: responseFormatSchema },
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
    },
    async ({ limit, response_format }): Promise<ReturnType<typeof dataResult>> => {
      try {
        const chats = await graphCollect<GraphChat>("/me/chats", limit, {
          $expand: "members",
          $top: Math.min(limit, 50),
        });
        const structured = {
          count: chats.length,
          chats: chats.map((c) => ({
            id: c.id,
            topic: c.topic ?? null,
            chatType: c.chatType,
            members: (c.members ?? []).map((mem) => mem.displayName ?? mem.email ?? "?"),
          })),
        };
        if (response_format === ResponseFormat.JSON) {
          return dataResult(JSON.stringify(structured, null, 2), structured);
        }
        const lines = [`# Chats (${chats.length})`, ""];
        for (const c of chats) {
          const memberNames = (c.members ?? []).map((m) => m.displayName ?? m.email ?? "?").join(", ");
          lines.push(`## ${c.topic || memberNames || "(untitled chat)"} [${c.chatType ?? "?"}]`);
          lines.push(`- ID: \`${c.id}\``, "");
        }
        return dataResult(lines.join("\n"), structured);
      } catch (error) {
        return textResult(handleGraphError(error), true);
      }
    },
  );

  // --- Get chat messages ----------------------------------------------------
  server.registerTool(
    "teams_get_chat_messages",
    {
      title: "Read chat messages",
      description: `Read recent messages from a 1:1 or group chat, newest first.

Args:
  - chat_id (string): the chat ID (from teams_list_chats)
  - limit (number, 1-50): max messages (default 20)
  - response_format ('markdown' | 'json'): output format (default markdown)

Returns: JSON { count, messages: [{ id, from, createdDateTime, text, webUrl }] }.`,
      inputSchema: { chat_id: chatIdSchema, limit: limitSchema, response_format: responseFormatSchema },
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
    },
    async ({ chat_id, limit, response_format }): Promise<ReturnType<typeof dataResult>> => {
      try {
        const messages = await graphCollect<GraphMessage>(
          `/chats/${encodeURIComponent(chat_id)}/messages`,
          limit,
          { $top: Math.min(limit, 50) },
        );
        const structured = messageStructured(messages);
        if (response_format === ResponseFormat.JSON) {
          return dataResult(JSON.stringify(structured, null, 2), structured);
        }
        return dataResult(renderMessages("Chat messages", messages), structured);
      } catch (error) {
        return textResult(handleGraphError(error), true);
      }
    },
  );

  // --- Send chat message ----------------------------------------------------
  server.registerTool(
    "teams_send_chat_message",
    {
      title: "Send a chat message",
      description: `Send a message to a 1:1 or group chat. This POSTS a message as the signed-in user.

Args:
  - chat_id (string): the chat ID (from teams_list_chats)
  - content (string): the message body (max 28000 chars)
  - content_type ('text' | 'html'): body format (default text)

Returns: JSON { id, webUrl } of the created message.`,
      inputSchema: { chat_id: chatIdSchema, content: bodyContentSchema, content_type: contentTypeSchema },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
    },
    async ({ chat_id, content, content_type }): Promise<ReturnType<typeof dataResult>> => {
      try {
        const created = await graphRequest<GraphMessage>(
          `/chats/${encodeURIComponent(chat_id)}/messages`,
          "POST",
          { body: { contentType: content_type, content } },
        );
        const structured = { id: created.id, webUrl: created.webUrl };
        return dataResult(`✅ Sent. Message id: \`${created.id}\``, structured);
      } catch (error) {
        return textResult(handleGraphError(error), true);
      }
    },
  );

  // --- List channel messages ------------------------------------------------
  server.registerTool(
    "teams_list_channel_messages",
    {
      title: "Read channel messages",
      description: `Read recent top-level messages from a team channel, newest first.

Args:
  - team_id (string): the team ID
  - channel_id (string): the channel ID (from teams_list_channels)
  - limit (number, 1-50): max messages (default 20)
  - response_format ('markdown' | 'json'): output format (default markdown)

Returns: JSON { count, messages: [{ id, from, createdDateTime, text, webUrl }] }.`,
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
        const messages = await graphCollect<GraphMessage>(
          `/teams/${encodeURIComponent(team_id)}/channels/${encodeURIComponent(channel_id)}/messages`,
          limit,
          { $top: Math.min(limit, 50) },
        );
        const structured = messageStructured(messages);
        if (response_format === ResponseFormat.JSON) {
          return dataResult(JSON.stringify(structured, null, 2), structured);
        }
        return dataResult(renderMessages("Channel messages", messages), structured);
      } catch (error) {
        return textResult(handleGraphError(error), true);
      }
    },
  );

  // --- Send channel message -------------------------------------------------
  server.registerTool(
    "teams_send_channel_message",
    {
      title: "Post a channel message",
      description: `Post a new top-level message to a team channel as the signed-in user.

Args:
  - team_id (string): the team ID
  - channel_id (string): the channel ID
  - content (string): the message body (max 28000 chars)
  - content_type ('text' | 'html'): body format (default text)

Returns: JSON { id, webUrl } of the created message.`,
      inputSchema: {
        team_id: teamIdSchema,
        channel_id: channelIdSchema,
        content: bodyContentSchema,
        content_type: contentTypeSchema,
      },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
    },
    async ({ team_id, channel_id, content, content_type }): Promise<ReturnType<typeof dataResult>> => {
      try {
        const created = await graphRequest<GraphMessage>(
          `/teams/${encodeURIComponent(team_id)}/channels/${encodeURIComponent(channel_id)}/messages`,
          "POST",
          { body: { contentType: content_type, content } },
        );
        const structured = { id: created.id, webUrl: created.webUrl };
        return dataResult(
          `✅ Posted to channel. Message id: \`${created.id}\`${created.webUrl ? `\n- ${created.webUrl}` : ""}`,
          structured,
        );
      } catch (error) {
        return textResult(handleGraphError(error), true);
      }
    },
  );

  // --- Reply to a channel message -------------------------------------------
  server.registerTool(
    "teams_reply_channel_message",
    {
      title: "Reply in a channel thread",
      description: `Reply to an existing top-level channel message (adds to its thread).

Args:
  - team_id (string): the team ID
  - channel_id (string): the channel ID
  - message_id (string): the parent message ID (from teams_list_channel_messages)
  - content (string): the reply body (max 28000 chars)
  - content_type ('text' | 'html'): body format (default text)

Returns: JSON { id, webUrl } of the created reply.`,
      inputSchema: {
        team_id: teamIdSchema,
        channel_id: channelIdSchema,
        message_id: z.string().min(1).describe("Parent message ID to reply under"),
        content: bodyContentSchema,
        content_type: contentTypeSchema,
      },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
    },
    async ({ team_id, channel_id, message_id, content, content_type }): Promise<ReturnType<typeof dataResult>> => {
      try {
        const created = await graphRequest<GraphMessage>(
          `/teams/${encodeURIComponent(team_id)}/channels/${encodeURIComponent(channel_id)}/messages/${encodeURIComponent(message_id)}/replies`,
          "POST",
          { body: { contentType: content_type, content } },
        );
        const structured = { id: created.id, webUrl: created.webUrl };
        return dataResult(`✅ Reply posted. Reply id: \`${created.id}\``, structured);
      } catch (error) {
        return textResult(handleGraphError(error), true);
      }
    },
  );
}
