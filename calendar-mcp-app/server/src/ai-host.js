import "dotenv/config";

import { fileURLToPath } from "node:url";

import { Client } from "@modelcontextprotocol/client";
import { StdioClientTransport } from "@modelcontextprotocol/client/stdio";
import { Ollama } from "ollama";

/**
 * Ollama client backend-এ থাকবে।
 */
const ollama = new Ollama({
  host:
    process.env.OLLAMA_HOST ??
    "http://127.0.0.1:11434",
});

let mcpClientPromise = null;

/**
 * MCP Client তৈরি করে Calendar MCP Server child process হিসেবে চালায়।
 *
 * Client একটি connection reuse করবে।
 */
async function createMcpClient() {
  const calendarServerPath = fileURLToPath(
    new URL("./mcp/calendar-server.js", import.meta.url)
  );

  const client = new Client({
    name: "calendar-ai-host",
    version: "1.0.0",
  });

  const transport = new StdioClientTransport({
    // বর্তমান Node.js executable ব্যবহার করা হচ্ছে।
    command: process.execPath,

    // Calendar MCP Server child process।
    args: [calendarServerPath],
  });

  await client.connect(transport);

  console.log("MCP Client connected to Calendar MCP Server");

  return client;
}

/**
 * একই MCP connection reuse করে।
 */
async function getMcpClient() {
  if (!mcpClientPromise) {
    mcpClientPromise = createMcpClient();
  }

  return mcpClientPromise;
}

/**
 * MCP tool-কে Ollama function-tool format-এ convert করে।
 */
function convertMcpToolsToOllamaTools(mcpTools) {
  return mcpTools.map((tool) => ({
    type: "function",

    function: {
      name: tool.name,
      description:
        tool.description ?? "No description provided",

      // MCP এবং Ollama উভয়েই JSON Schema ব্যবহার করে।
      parameters: tool.inputSchema,
    },
  }));
}

/**
 * MCP result-এর content blocks readable text-এ convert করে।
 */
function mcpResultToText(result) {
  if (
    result.structuredContent &&
    typeof result.structuredContent === "object"
  ) {
    return JSON.stringify(result.structuredContent);
  }

  if (!Array.isArray(result.content)) {
    return JSON.stringify(result);
  }

  return result.content
    .map((item) => {
      if (item.type === "text") {
        return item.text;
      }

      return JSON.stringify(item);
    })
    .join("\n");
}

/**
 * User message Ollama-কে পাঠায় এবং প্রয়োজন হলে MCP tools call করে।
 */
export async function chatWithCalendarAssistant({
  message,
  timezone = "Asia/Dhaka",
}) {
  const mcpClient = await getMcpClient();

  // MCP Server থেকে available tools discover করা হচ্ছে।
  const { tools: mcpTools } =
    await mcpClient.listTools();

  const ollamaTools =
    convertMcpToolsToOllamaTools(mcpTools);

  const now = new Date().toISOString();

  const messages = [
    {
      role: "system",
      content: `
You are a helpful Google Calendar assistant.

Current server time: ${now}
User timezone: ${timezone}

Rules:
- Use the calendar tools when the user asks about calendar events.
- Never invent calendar events.
- If a tool returns no events, clearly say that no events were found.
- Keep answers concise.
- Mention event title, date, time and location when available.
      `.trim(),
    },
    {
      role: "user",
      content: message,
    },
  ];

  /**
   * একটি model একাধিক sequential tool call চাইতে পারে।
   * Infinite loop বন্ধ করতে maximum 5 rounds।
   */
  for (let round = 0; round < 5; round += 1) {
    const response = await ollama.chat({
      model: process.env.OLLAMA_MODEL ?? "qwen3",
      messages,
      tools: ollamaTools,
      stream: false,
      keep_alive: "30m",
      think: false,
      options: {
        num_ctx:4096,
        num_predict: 300,
        temperature:0.2,
      }
    });
    // logOllamaPerformance(response,round+1);

    const assistantMessage = response.message;

    messages.push(assistantMessage);

    const toolCalls =
      assistantMessage.tool_calls ?? [];

    /**
     * কোনো tool call নেই:
     * model final natural-language answer দিয়েছে।
     */
    if (toolCalls.length === 0) {
      return {
        answer:
          assistantMessage.content ||
          "কোনো উত্তর তৈরি করা যায়নি।",
      };
    }

    /**
     * Ollama requested tools MCP Client দিয়ে call করা হচ্ছে।
     */
    for (const toolCall of toolCalls) {
      const toolName = toolCall.function.name;
      const toolArguments =
        toolCall.function.arguments ?? {};

      const toolResult = await mcpClient.callTool({
        name: toolName,
        arguments: toolArguments,
      });

      /**
       * Tool result conversation-এ যোগ করা হচ্ছে।
       * পরবর্তী Ollama call এই data দিয়ে final answer তৈরি করবে।
       */
      messages.push({
        role: "tool",
        tool_name: toolName,
        content: mcpResultToText(toolResult),
      });
    }
  }

  throw new Error(
    "AI assistant maximum tool-call rounds অতিক্রম করেছে।"
  );
}

/**
 * Nanoseconds থেকে seconds-এ convert করে।
 */
function nanosecondsToSeconds(nanoseconds = 0) {
  return nanoseconds / 1_000_000_000;
}

/**
 * Ollama response-এর performance metrics দেখায়।
 */
function logOllamaPerformance(response, round) {
  const totalSeconds = nanosecondsToSeconds(
    response.total_duration
  );

  const loadSeconds = nanosecondsToSeconds(
    response.load_duration
  );

  const promptSeconds = nanosecondsToSeconds(
    response.prompt_eval_duration
  );

  const generationSeconds = nanosecondsToSeconds(
    response.eval_duration
  );

  const outputTokens = response.eval_count ?? 0;

  const tokensPerSecond =
    generationSeconds > 0
      ? outputTokens / generationSeconds
      : 0;

  console.table({
    round,
    totalSeconds: totalSeconds.toFixed(2),
    modelLoadSeconds: loadSeconds.toFixed(2),
    promptEvalSeconds: promptSeconds.toFixed(2),
    generationSeconds: generationSeconds.toFixed(2),
    outputTokens,
    tokensPerSecond: tokensPerSecond.toFixed(2),
  });
}