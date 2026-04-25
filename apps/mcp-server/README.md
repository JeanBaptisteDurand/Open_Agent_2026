# @lplens/mcp-server

MCP (Model Context Protocol) server that exposes LPLens diagnostic tools to
other agents (Claude Desktop, Cursor, autonomous agents via stdio transport).

## Tools (current)

| Tool | Purpose | Status |
| --- | --- | --- |
| `lplens.ping` | liveness check | implemented |
| `lplens.diagnose` | full diagnostic on a Uniswap LP position | TODO |
| `lplens.preflight` | pre-open simulation of a proposed range | TODO |
| `lplens.migrate` | Permit2 migration bundle builder | TODO |
| `lplens.verify` | verify a signed report by rootHash | TODO |

## Run

```bash
pnpm --filter @lplens/mcp-server run dev    # stdio mode
```

Plug into Claude Desktop by adding the built binary path to
`claude_desktop_config.json`.
