/**
 * Reusable Zod schema fragments shared across tools.
 */

import { z } from "zod";
import { ResponseFormat } from "./constants.js";

export const responseFormatSchema = z
  .nativeEnum(ResponseFormat)
  .default(ResponseFormat.MARKDOWN)
  .describe("Output format: 'markdown' for human-readable or 'json' for machine-readable");

export const limitSchema = z
  .number()
  .int()
  .min(1)
  .max(50)
  .default(20)
  .describe("Maximum number of items to return (1-50)");

export const teamIdSchema = z
  .string()
  .min(1)
  .describe("The Microsoft Teams team (group) ID. Get it from teams_list_joined_teams.");

export const channelIdSchema = z
  .string()
  .min(1)
  .describe("The channel ID (e.g. '19:...@thread.tacv2'). Get it from teams_list_channels.");

export const chatIdSchema = z
  .string()
  .min(1)
  .describe("The chat (1:1 or group) ID (e.g. '19:...@thread.v2'). Get it from teams_list_chats.");
