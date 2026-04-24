#!/usr/bin/env node

// LPLens MCP server — exposes tools callable by other agents
// (Claude Desktop, Cursor, or autonomous agents via MCP transport).

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

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

  const transport = new StdioServerTransport();
  await server.connect(transport);

  // Keep process alive until stdio closes.
  process.stdin.resume();
}

main().catch((err) => {
  process.stderr.write(`mcp fatal: ${String(err)}\n`);
  process.exit(1);
});
