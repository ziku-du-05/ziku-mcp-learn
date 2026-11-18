import { McpServer } from "@modelcontextprotocol/server";
import { serveStdio } from "@modelcontextprotocol/server/stdio";
import * as z from "zod/v4";

import { listCalendarEvents } from "../google-calendar.js";

/**
 * প্রতিটি MCP connection-এর জন্য server তৈরি করে।
 */
function createCalendarMcpServer() {
  const server = new McpServer({
    name: "google-calendar-server",
    version: "1.0.0",
  });

  /**
   * AI এই tool call করে upcoming calendar events জানতে পারবে।
   */
  server.registerTool(
    "list_calendar_events",
    {
      title: "List Google Calendar events",

      description:
        "List upcoming events from the connected user's primary Google Calendar.",

      inputSchema: z.object({
        days: z
          .number()
          .int()
          .min(1)
          .max(365)
          .default(30)
          .describe(
            "How many upcoming days to search. Example: 7"
          ),

        maxResults: z
          .number()
          .int()
          .min(1)
          .max(100)
          .default(20)
          .describe(
            "Maximum number of events to return."
          ),
      }),

      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },

    async ({ days, maxResults }) => {
      try {
        const events = await listCalendarEvents({
          days,
          maxResults,
        });

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  searchPeriodDays: days,
                  count: events.length,
                  events,
                },
                null,
                2
              ),
            },
          ],

          structuredContent: {
            searchPeriodDays: days,
            count: events.length,
            events,
          },
        };
      } catch (error) {
        return {
          isError: true,

          content: [
            {
              type: "text",
              text:
                error instanceof Error
                  ? error.message
                  : "Calendar events load failed.",
            },
          ],
        };
      }
    }
  );

  return server;
}

/**
 * MCP server stdin/stdout দিয়ে MCP Client-এর সঙ্গে যোগাযোগ করবে।
 *
 * stdout MCP protocol-এর জন্য reserved।
 * Debug log-এর জন্য console.error ব্যবহার করুন।
 */
void serveStdio(createCalendarMcpServer);

console.error("Google Calendar MCP Server running on stdio");