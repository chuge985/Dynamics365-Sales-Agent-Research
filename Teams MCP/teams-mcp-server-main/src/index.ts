#!/usr/bin/env node
/**
 * Microsoft Teams MCP Server
 *
 * Exposes Microsoft Teams (via Microsoft Graph) to MCP clients using delegated,
 * device-code authentication — the server acts AS the signed-in user.
 *
 * Scopes covered:
 *   - Messages: list/read/send chat + channel messages, reply to channel threads
 *   - Teams & channels: list teams, channels, members; create channel
 *   - Meetings & calendar: create Teams meeting, list/get calendar events
 *   - Search & files: search Teams messages, list channel files
 *
 * Usage:
 *   node dist/index.js login    # one-time interactive device-code sign-in
 *   node dist/index.js          # run as an MCP server over stdio
 */
import 'dotenv/config';
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { runLogin, hasCachedAccount } from "./auth.js";
import { registerIdentityTools } from "./tools/identity.js";
import { registerTeamTools } from "./tools/teams.js";
import { registerMessageTools } from "./tools/messages.js";
import { registerMeetingTools } from "./tools/meetings.js";
import { registerSearchTools } from "./tools/search.js";

function buildServer(): McpServer {
  const server = new McpServer({
    name: "teams-mcp-server",
    version: "1.0.0",
  });
  registerIdentityTools(server);
  registerTeamTools(server);
  registerMessageTools(server);
  registerMeetingTools(server);
  registerSearchTools(server);
  return server;
}

async function runServer(): Promise<void> {
  if (!process.env.TEAMS_MCP_CLIENT_ID) {
    console.error("ERROR: TEAMS_MCP_CLIENT_ID is not set. See README 'Entra ID setup'.");
    process.exit(1);
  }
  if (!(await hasCachedAccount())) {
    console.error(
      "[teams-mcp] No cached account found. The first tool call will trigger an " +
        "interactive device-code login (printed to stderr). To pre-authenticate, run " +
        "`npm run login`.",
    );
  }
  const server = buildServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("[teams-mcp] Microsoft Teams MCP server running on stdio.");
}

async function main(): Promise<void> {
  const command = process.argv[2];
  if (command === "login") {
    await runLogin();
    return;
  }
  await runServer();
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
