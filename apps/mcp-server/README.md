# @lplens/mcp-server

Model Context Protocol server exposing the LPLens agent over stdio.
Lets other agents — Claude Desktop, Cursor, autonomous agents in any
framework — call the LPLens diagnostic pipeline as a typed tool.

## Tools

| Name | What it does |
| --- | --- |
| `lplens.ping` | Liveness check — returns `{ pong: true, at: <ISO timestamp> }`. Useful to confirm the MCP transport is wired up. |
| `lplens.diagnose` | Runs the full 11-phase diagnostic on a Uniswap V3 LP position. Streams SSE from the LPLens server, returns a structured summary of position, IL, regime, hooks, migration plan, signed report, on-chain anchor, ENS publish, and TEE verdict. |
| `lplens.preflight` | Lightweight migration preview — close→swap→mint plan + Trading API quote + target V4 hook. Stops the upstream stream as soon as the migration field lands so the caller doesn't pay for a full diagnostic. |
| `lplens.migrate` | Builds the EIP-712 PermitSingle typed data ready for the user's wallet to sign. Does not execute — the calling agent is responsible for surfacing the signature flow to the user. |
| `lplens.lookupReport` | Fetches a permanent report by its 0G Storage rootHash, served from the LPLens server cache. |
| `lplens.resolveEnsRecord` | Reads a single ENS text record (`lplens.<tokenId>.rootHash` etc.) — pure on-chain view, no signing. |
| `lplens.lookupReportOnChain` | Reads the LPLensReports registry directly on 0G Chain. Independent verification path that doesn't trust the LPLens API. |

## Run locally

```bash
pnpm install
pnpm --filter @lplens/mcp-server build
pnpm --filter @lplens/mcp-server start    # stdio transport
```

## Wire into Claude Desktop

Add to `~/Library/Application Support/Claude/claude_desktop_config.json`
(macOS) or the equivalent path on your platform:

```json
{
  "mcpServers": {
    "lplens": {
      "command": "node",
      "args": [
        "/absolute/path/to/Open_Agent_2026/apps/mcp-server/dist/index.js"
      ],
      "env": {
        "LPLENS_API_URL": "http://localhost:3001",
        "LPLENS_REPORTS_CONTRACT": ""
      }
    }
  }
}
```

Then restart Claude Desktop. The 7 tools appear under the
`lplens-mcp` server. Run the LPLens API server in another terminal
(`pnpm --filter @lplens/server dev`) so `lplens.diagnose` has somewhere
to stream from.

## Wire into Cursor

Cursor reads `~/.cursor/mcp.json` (same shape as Claude Desktop):

```json
{
  "mcpServers": {
    "lplens": {
      "command": "node",
      "args": ["/absolute/path/to/apps/mcp-server/dist/index.js"]
    }
  }
}
```

## Smoke test

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | pnpm --filter @lplens/mcp-server exec lplens-mcp
```

Should print a JSON-RPC response listing all 7 tools.

## Programmatic sample (autonomous agents)

Any agent with an MCP transport can spawn LPLens as a child process and
talk to it on stdio. Sample TypeScript that runs `diagnose` on a sample
position and prints the verdict:

```ts
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const transport = new StdioClientTransport({
  command: "node",
  args: ["/abs/path/apps/mcp-server/dist/index.js"],
});
const client = new Client({ name: "demo-agent", version: "0.0.1" });
await client.connect(transport);

const out = await client.callTool({
  name: "lplens.diagnose",
  arguments: { tokenId: "482910" },
});
console.log(out);
```
