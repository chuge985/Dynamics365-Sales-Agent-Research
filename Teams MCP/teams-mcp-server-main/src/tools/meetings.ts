/**
 * Meetings & calendar tools: create a Teams meeting (as a calendar event with
 * attendees + join link), list upcoming events, get a single event.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { graphCollect, graphRequest, handleGraphError, dataResult, textResult, htmlToText } from "../graph.js";
import { ResponseFormat } from "../constants.js";
import { responseFormatSchema, limitSchema } from "../schemas.js";

interface GraphEvent {
  id: string;
  subject?: string;
  start?: { dateTime?: string; timeZone?: string };
  end?: { dateTime?: string; timeZone?: string };
  isOnlineMeeting?: boolean;
  onlineMeeting?: { joinUrl?: string } | null;
  webLink?: string;
  bodyPreview?: string;
  attendees?: { emailAddress?: { address?: string; name?: string } }[];
  organizer?: { emailAddress?: { address?: string; name?: string } };
}

const isoDateTime = z
  .string()
  .min(1)
  .describe("ISO 8601 local date-time, e.g. '2026-07-02T14:00:00'. Interpreted in 'time_zone'.");

function renderEvent(e: GraphEvent): string {
  const start = e.start?.dateTime ? new Date(e.start.dateTime).toLocaleString() : "?";
  const end = e.end?.dateTime ? new Date(e.end.dateTime).toLocaleString() : "?";
  const join = e.onlineMeeting?.joinUrl ? `\n- Join: ${e.onlineMeeting.joinUrl}` : "";
  const attendees = (e.attendees ?? [])
    .map((a) => a.emailAddress?.name ?? a.emailAddress?.address)
    .filter(Boolean)
    .join(", ");
  return (
    `**${e.subject ?? "(no subject)"}**\n` +
    `- ${start} → ${end}\n` +
    (attendees ? `- Attendees: ${attendees}\n` : "") +
    join +
    `\n- id: \`${e.id}\``
  );
}

export function registerMeetingTools(server: McpServer): void {
  // --- Create Teams meeting -------------------------------------------------
  server.registerTool(
    "teams_create_meeting",
    {
      title: "Create a Teams meeting",
      description: `Create a Microsoft Teams meeting as a calendar event on the user's calendar,
with a Teams join link and (optionally) invited attendees. This CREATES an event
and sends invitations.

Args:
  - subject (string): meeting title
  - start (string): ISO local date-time, e.g. '2026-07-02T14:00:00'
  - end (string): ISO local date-time, must be after start
  - time_zone (string): IANA/Windows time zone (default 'America/Chicago')
  - attendees (string[], optional): attendee email addresses
  - body (string, optional): meeting description / agenda

Returns: JSON { id, subject, joinUrl, webLink }.`,
      inputSchema: {
        subject: z.string().min(1).max(255).describe("Meeting subject/title"),
        start: isoDateTime,
        end: isoDateTime,
        time_zone: z.string().default("America/Chicago").describe("Time zone for start/end"),
        attendees: z
          .array(z.string().email())
          .max(100)
          .optional()
          .describe("Attendee email addresses to invite"),
        body: z.string().max(10000).optional().describe("Optional meeting description/agenda"),
      },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
    },
    async ({ subject, start, end, time_zone, attendees, body }): Promise<ReturnType<typeof dataResult>> => {
      try {
        const payload: Record<string, unknown> = {
          subject,
          start: { dateTime: start, timeZone: time_zone },
          end: { dateTime: end, timeZone: time_zone },
          isOnlineMeeting: true,
          onlineMeetingProvider: "teamsForBusiness",
        };
        if (body) payload.body = { contentType: "HTML", content: body };
        if (attendees && attendees.length) {
          payload.attendees = attendees.map((address) => ({
            emailAddress: { address },
            type: "required",
          }));
        }
        const event = await graphRequest<GraphEvent>("/me/events", "POST", payload);
        const structured = {
          id: event.id,
          subject: event.subject,
          joinUrl: event.onlineMeeting?.joinUrl ?? null,
          webLink: event.webLink ?? null,
        };
        return dataResult(
          `✅ Meeting created: **${event.subject}**\n` +
            `- Join: ${event.onlineMeeting?.joinUrl ?? "(link provisioning…)"}\n` +
            `- id: \`${event.id}\``,
          structured,
        );
      } catch (error) {
        return textResult(handleGraphError(error), true);
      }
    },
  );

  // --- List events ----------------------------------------------------------
  server.registerTool(
    "teams_list_events",
    {
      title: "List calendar events",
      description: `List the user's upcoming calendar events (ordered by start time).

Args:
  - limit (number, 1-50): max events (default 20)
  - days_ahead (number, 1-90): look-ahead window in days (default 14)
  - response_format ('markdown' | 'json'): output format (default markdown)

Returns: JSON { count, events: [{ id, subject, start, end, joinUrl, attendees }] }.`,
      inputSchema: {
        limit: limitSchema,
        days_ahead: z.number().int().min(1).max(90).default(14).describe("Look-ahead window in days"),
        response_format: responseFormatSchema,
      },
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
    },
    async ({ limit, days_ahead, response_format }): Promise<ReturnType<typeof dataResult>> => {
      try {
        const now = new Date();
        const future = new Date(now.getTime() + days_ahead * 24 * 60 * 60 * 1000);
        const events = await graphCollect<GraphEvent>("/me/calendarView", limit, {
          startDateTime: now.toISOString(),
          endDateTime: future.toISOString(),
          $orderby: "start/dateTime",
          $top: Math.min(limit, 50),
          $select: "id,subject,start,end,isOnlineMeeting,onlineMeeting,webLink,attendees,organizer",
        });
        const structured = {
          count: events.length,
          events: events.map((e) => ({
            id: e.id,
            subject: e.subject,
            start: e.start?.dateTime,
            end: e.end?.dateTime,
            joinUrl: e.onlineMeeting?.joinUrl ?? null,
            attendees: (e.attendees ?? [])
              .map((a) => a.emailAddress?.address)
              .filter(Boolean),
          })),
        };
        if (response_format === ResponseFormat.JSON) {
          return dataResult(JSON.stringify(structured, null, 2), structured);
        }
        const text = [`# Upcoming events (${events.length})`, "", ...events.map(renderEvent)].join("\n\n");
        return dataResult(text, structured);
      } catch (error) {
        return textResult(handleGraphError(error), true);
      }
    },
  );

  // --- Get single event -----------------------------------------------------
  server.registerTool(
    "teams_get_event",
    {
      title: "Get a calendar event",
      description: `Get full details for a single calendar event, including the Teams join link
and body preview.

Args:
  - event_id (string): the event ID (from teams_list_events)
  - response_format ('markdown' | 'json'): output format (default markdown)

Returns: JSON event object with subject, start, end, joinUrl, attendees, body preview.`,
      inputSchema: {
        event_id: z.string().min(1).describe("Calendar event ID"),
        response_format: responseFormatSchema,
      },
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
    },
    async ({ event_id, response_format }): Promise<ReturnType<typeof dataResult>> => {
      try {
        const e = await graphRequest<GraphEvent>(`/me/events/${encodeURIComponent(event_id)}`);
        const structured = {
          id: e.id,
          subject: e.subject,
          start: e.start?.dateTime,
          end: e.end?.dateTime,
          joinUrl: e.onlineMeeting?.joinUrl ?? null,
          organizer: e.organizer?.emailAddress?.address ?? null,
          attendees: (e.attendees ?? []).map((a) => a.emailAddress?.address).filter(Boolean),
          bodyPreview: htmlToText(e.bodyPreview),
        };
        if (response_format === ResponseFormat.JSON) {
          return dataResult(JSON.stringify(structured, null, 2), structured);
        }
        const preview = structured.bodyPreview ? `\n\n${structured.bodyPreview}` : "";
        return dataResult(renderEvent(e) + preview, structured);
      } catch (error) {
        return textResult(handleGraphError(error), true);
      }
    },
  );
}
