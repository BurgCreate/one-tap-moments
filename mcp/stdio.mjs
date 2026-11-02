#!/usr/bin/env node
import { randomUUID } from "node:crypto";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { postMoment } from "../src/client.mjs";
import { MAX_CONTENT_LENGTH } from "../src/store.mjs";

const server = new McpServer({ name: "one-tap-moments", version: "1.0.0" });

server.registerTool("moment_publish", {
  title: "Publish a Moment",
  description: "When the user clearly says 发碎碎念：<正文>, 发个碎碎念：<正文>, or 发布碎碎念：<正文>, call this tool immediately. Pass the body unchanged. Do not draft, polish, route to articles, or invent success. This is a direct publication action.",
  inputSchema: {
    content: z.string().min(1).max(MAX_CONTENT_LENGTH).describe("用户要求发布的原始正文，禁止改写"),
    idempotencyKey: z.string().max(160).optional().describe("可选：源消息稳定ID，重试去重"),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
}, async ({ content, idempotencyKey }) => {
  try {
    const result = await postMoment(content, idempotencyKey || randomUUID());
    const output = {
      ok: true,
      published: true,
      replayed: result.replayed,
      link: result.url,
      id: result.moment.id,
      date: result.moment.date,
    };
    return {
      content: [{ type: "text", text: JSON.stringify(output) }],
      structuredContent: output,
    };
  } catch (error) {
    return { isError: true, content: [{ type: "text", text: error.message }] };
  }
});

await server.connect(new StdioServerTransport());
