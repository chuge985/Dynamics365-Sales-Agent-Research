/**
 * Delegated authentication via MSAL device-code flow.
 *
 * The server acts AS the signed-in user, so it can only touch what that user
 * can already see in Teams (least-privilege by default). Tokens (and the
 * refresh token) are cached to disk so the interactive device-code login is a
 * one-time step; after that, access tokens are refreshed silently.
 */

import {
  PublicClientApplication,
  LogLevel,
  type Configuration,
  type ICachePlugin,
  type TokenCacheContext,
} from "@azure/msal-node";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { GRAPH_SCOPES } from "./constants.js";

const DEFAULT_CACHE_PATH = path.join(os.homedir(), ".teams-mcp-token-cache.json");
const CACHE_PATH = process.env.TEAMS_MCP_TOKEN_CACHE || DEFAULT_CACHE_PATH;

/**
 * Persist the MSAL token cache (including refresh tokens) to disk so logins
 * survive process restarts.
 */
const diskCachePlugin: ICachePlugin = {
  beforeCacheAccess: async (ctx: TokenCacheContext): Promise<void> => {
    try {
      if (fs.existsSync(CACHE_PATH)) {
        ctx.tokenCache.deserialize(fs.readFileSync(CACHE_PATH, "utf-8"));
      }
    } catch (err) {
      console.error(`[auth] Failed to read token cache: ${String(err)}`);
    }
  },
  afterCacheAccess: async (ctx: TokenCacheContext): Promise<void> => {
    if (ctx.cacheHasChanged) {
      try {
        fs.writeFileSync(CACHE_PATH, ctx.tokenCache.serialize(), { mode: 0o600 });
      } catch (err) {
        console.error(`[auth] Failed to write token cache: ${String(err)}`);
      }
    }
  },
};

let pcaInstance: PublicClientApplication | null = null;

function getClient(): PublicClientApplication {
  if (pcaInstance) return pcaInstance;

  const clientId = process.env.TEAMS_MCP_CLIENT_ID;
  if (!clientId) {
    throw new Error(
      "TEAMS_MCP_CLIENT_ID is not set. Create an Entra ID app registration " +
        "(public client) and set TEAMS_MCP_CLIENT_ID. See README.",
    );
  }
  const tenantId = process.env.TEAMS_MCP_TENANT_ID || "organizations";

  const config: Configuration = {
    auth: {
      clientId,
      authority: `https://login.microsoftonline.com/${tenantId}`,
    },
    cache: { cachePlugin: diskCachePlugin },
    system: {
      loggerOptions: {
        loggerCallback: (level, message) => {
          if (level === LogLevel.Error) console.error(`[msal] ${message}`);
        },
        piiLoggingEnabled: false,
        logLevel: LogLevel.Error,
      },
    },
  };

  pcaInstance = new PublicClientApplication(config);
  return pcaInstance;
}

/**
 * Acquire a delegated Graph access token. Tries silent refresh from the cached
 * account first; falls back to interactive device-code login (instructions
 * printed to stderr).
 */
export async function getAccessToken(): Promise<string> {
  const pca = getClient();
  const cache = pca.getTokenCache();
  const accounts = await cache.getAllAccounts();

  if (accounts.length > 0) {
    try {
      const result = await pca.acquireTokenSilent({
        account: accounts[0],
        scopes: GRAPH_SCOPES,
      });
      if (result?.accessToken) return result.accessToken;
    } catch (err) {
      // Silent failed (expired/revoked refresh token) — fall through to device code.
      console.error(`[auth] Silent token failed, falling back to device code: ${String(err)}`);
    }
  }

  const result = await pca.acquireTokenByDeviceCode({
    scopes: GRAPH_SCOPES,
    deviceCodeCallback: (response) => {
      // Printed to stderr so it never corrupts the stdio JSON-RPC stream.
      console.error("\n=== Microsoft Teams MCP — sign in required ===");
      console.error(response.message);
      console.error("=============================================\n");
    },
  });

  if (!result?.accessToken) {
    throw new Error("Failed to acquire access token via device code.");
  }
  return result.accessToken;
}

/**
 * Run the interactive device-code login once and persist the token cache.
 * Invoked via `node dist/index.js login`.
 */
export async function runLogin(): Promise<void> {
  console.error("Starting Microsoft Teams device-code login...");
  await getAccessToken();
  const pca = getClient();
  const accounts = await pca.getTokenCache().getAllAccounts();
  const who = accounts[0]?.username ?? "(unknown account)";
  console.error(`\n✅ Logged in as ${who}. Token cache saved to ${CACHE_PATH}`);
}

/** True if a cached account exists (used to warn before starting the server). */
export async function hasCachedAccount(): Promise<boolean> {
  try {
    const pca = getClient();
    const accounts = await pca.getTokenCache().getAllAccounts();
    return accounts.length > 0;
  } catch {
    return false;
  }
}
