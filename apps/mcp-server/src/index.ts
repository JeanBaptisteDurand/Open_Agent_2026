#!/usr/bin/env node

// LPLens MCP server — exposes tools callable by other agents
// (Claude Desktop, Cursor, or autonomous agents via MCP transport).

import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { ping, pingToolDefinition } from "./tools/ping.js";

async function main() {
  const server = new Server(
    {
      name: "lplens-mcp",
      version: "0.1.0",
    },
    {
      capabilities: {
        tools: {},
      },
    },
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [pingToolDefinition],
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name } = request.params;
    switch (name) {
      case "lplens.ping": {
        const result = await ping();
        return { content: [{ type: "text", text: JSON.stringify(result) }] };
      }
      default:
        throw new Error(`unknown tool: ${name}`);
    }
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);

  // Keep process alive until stdio closes.
  process.stdin.resume();
}

main().catch((err) => {
  process.stderr.write(`mcp fatal: ${String(err)}\n`);
  process.exit(1);
});
