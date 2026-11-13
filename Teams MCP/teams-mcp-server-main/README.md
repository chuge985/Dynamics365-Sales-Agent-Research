# Microsoft Teams MCP Server

An MCP server that gives an AI agent access to **Microsoft Teams via Microsoft Graph**, using **delegated, device-code authentication** — the server acts *as you*, so it can only touch what your own Teams account can already see (least-privilege by default).

Built with the official MCP TypeScript SDK + MSAL. Runs locally over stdio.

## What it can do

| Scope | Tools |
| --- | --- |
| **Messages** | `teams_list_chats`, `teams_get_chat_messages`, `teams_send_chat_message`, `teams_list_channel_messages`, `teams_send_channel_message`, `teams_reply_channel_message` |
| **Teams & channels** | `teams_list_joined_teams`, `teams_list_channels`, `teams_list_team_members`, `teams_create_channel` |
| **Meetings & calendar** | `teams_create_meeting`, `teams_list_events`, `teams_get_event` |
| **Search & files** | `teams_search_messages`, `teams_list_channel_files` |
| **Identity** | `teams_whoami` |

Every read tool supports `response_format: "markdown" | "json"` and a `limit`. Write tools (`send_*`, `reply_*`, `create_*`) are annotated non-read-only so clients can gate them.

---

## 1. Entra ID setup (one time)

You need an **app registration** in Microsoft Entra ID (Azure AD). You don't need to be a global admin to *create* it, but some delegated scopes are admin-restricted (see below).

1. Go to **Entra ID → App registrations → New registration**.
   - Name: `Teams MCP (delegated)`
   - Supported account types: *Accounts in this organizational directory only* (single tenant) is fine.
   - Redirect URI: leave blank.
2. On the new app, open **Authentication** →
   - Under **Advanced settings**, set **Allow public client flows** = **Yes**. (Required for device-code.)
3. Open **API permissions → Add a permission → Microsoft Graph → Delegated permissions** and add:
   - `User.Read`
   - `Chat.ReadWrite`
   - `ChannelMessage.Send`
   - `ChannelMessage.Read.All` *(admin consent)*
   - `Team.ReadBasic.All`
   - `Channel.ReadBasic.All`
   - `Channel.Create`
   - `TeamMember.Read.All` *(admin consent)*
   - `Calendars.ReadWrite`
   - `OnlineMeetings.ReadWrite`
   - `Files.Read.All`
   - `Sites.Read.All`
   - `offline_access` (usually added automatically)
4. Click **Grant admin consent** for the tenant. (The *.All* read scopes won't work without it. If you're not an admin, send your Teams/M365 admin this list to consent.)
5. Copy the **Application (client) ID** and your **Directory (tenant) ID** from the app's Overview page.

> **Why delegated, not application permissions?** Application (app-only) permissions would grant the server org-wide read of *every* chat in the tenant — a large PHI/privacy blast radius and a harder security review. Delegated keeps the server scoped to your own access. If you later need unattended automation, add a client-credentials path then.

---

## 2. Install & build

```bash
cd teams-mcp-server
npm install
npm run build
```

## 3. Configure environment

```bash
cp .env.example .env
# edit .env: set TEAMS_MCP_CLIENT_ID and TEAMS_MCP_TENANT_ID
```

Or export the variables in your shell / MCP client config (below).

## 4. Sign in (one time)

```bash
export TEAMS_MCP_CLIENT_ID=<your-app-client-id>
export TEAMS_MCP_TENANT_ID=<your-tenant-id>     # or "organizations"
npm run login
```

You'll see a message like *"To sign in, use a web browser to open https://microsoft.com/devicelogin and enter the code XXXXXXXX."* Complete it in your browser. The token cache (including a refresh token) is saved to `~/.teams-mcp-token-cache.json`, so you won't need to do this again until the refresh token expires or is revoked.

## 5. Connect it to your MCP client

Point your MCP client at the built server over stdio. Example client config:

```json
{
  "mcpServers": {
    "teams": {
      "command": "node",
      "args": ["/absolute/path/to/teams-mcp-server/dist/index.js"],
      "env": {
        "TEAMS_MCP_CLIENT_ID": "<your-app-client-id>",
        "TEAMS_MCP_TENANT_ID": "<your-tenant-id>"
      }
    }
  }
}
```

If no cached account exists, the **first tool call** triggers an interactive device-code login printed to **stderr**. Running `npm run login` first avoids that.

---

## Testing

Use the MCP Inspector to exercise tools interactively:

```bash
npx @modelcontextprotocol/inspector node dist/index.js
```

Start with `teams_whoami` to confirm auth, then `teams_list_joined_teams` → grab a `team_id` → `teams_list_channels`, etc.

## How auth works

- **MSAL `PublicClientApplication`** with the **device-code** flow.
- Tokens + refresh token cached to disk (`TEAMS_MCP_TOKEN_CACHE`, default `~/.teams-mcp-token-cache.json`, written `0600`).
- Each Graph call acquires a token **silently** from cache; only an expired/revoked refresh token forces a new device-code login.

## Notes & limits

- **Admin-restricted scopes:** `ChannelMessage.Read.All` and `TeamMember.Read.All` require tenant admin consent. Without it those specific tools return a clear `403` with guidance.
- **Search** uses the Microsoft Search API (`/search/query`, `chatMessage` entity) — relevance-ranked, not a literal grep.
- **Meetings** are created as calendar events with `isOnlineMeeting: true` (Teams provider), which puts them on your calendar, invites attendees, and returns a join link.
- **Channel files** resolve the channel's SharePoint `filesFolder`, then list its children.
- Responses are truncated at 25,000 characters with guidance to narrow the query.
- HIPAA note: this server can read message content that may contain PHI. It runs locally and holds no data beyond the on-disk token cache, but treat the host machine accordingly.

## Project layout

```
teams-mcp-server/
├── package.json
├── tsconfig.json
├── .env.example
├── README.md
└── src/
    ├── index.ts          # entry point + `login` command
    ├── constants.ts      # Graph base URL, scopes, limits
    ├── auth.ts           # MSAL device-code + disk token cache
    ├── graph.ts          # Graph request/pagination/error/format helpers
    ├── schemas.ts        # shared Zod fragments
    └── tools/
        ├── identity.ts   # teams_whoami
        ├── teams.ts      # teams & channels
        ├── messages.ts   # chat + channel messaging
        ├── meetings.ts   # meetings & calendar
        └── search.ts     # search + channel files
```
