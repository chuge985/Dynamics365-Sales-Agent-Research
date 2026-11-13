/**
 * Shared constants for the Microsoft Teams MCP server.
 */

export const GRAPH_BASE_URL = "https://graph.microsoft.com/v1.0";

// Maximum characters returned in any single tool response, to protect the
// agent's context window. Larger result sets are truncated with guidance.
export const CHARACTER_LIMIT = 25000;

// Default request timeout for Graph calls (ms).
export const REQUEST_TIMEOUT_MS = 30000;

/**
 * Delegated Microsoft Graph scopes requested at sign-in.
 *
 * Several of these (ChannelMessage.Read.All, TeamMember.Read.All) are
 * admin-restricted and may require a one-time Entra ID admin consent for the
 * app registration. See README "Entra ID setup".
 */
export const GRAPH_SCOPES: string[] = [
  "offline_access",
  "User.Read",
  "Chat.ReadWrite",
  "ChannelMessage.Send",
  "ChannelMessage.Read.All",
  "Team.ReadBasic.All",
  "Channel.ReadBasic.All",
  "Channel.Create",
  "TeamMember.Read.All",
  "Calendars.ReadWrite",
  "OnlineMeetings.ReadWrite",
  "Files.Read.All",
  "Sites.Read.All",
];

export enum ResponseFormat {
  MARKDOWN = "markdown",
  JSON = "json",
}
