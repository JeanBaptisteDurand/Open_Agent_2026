import { AppHeader } from "../components/AppHeader.js";

// /developers — MCP server reference page. Lists the 6 tools with
// their gating (mintLicense vs free), shows three install paths
// (Claude Desktop, cURL, TypeScript), and links to the iNFT contract
// for licensees who need to mint a license before calling the gated
// tools. Static content — every figure traces back to the contract.

// MCP runs as a STDIO subprocess on the user's machine — no public URL
// today. The roadmap entry plans an HTTP/SSE transport hosted at
// lplens.xyz/mcp (same domain, not a subdomain). Override at build via
// VITE_LPLENS_MCP_URL only if/when that endpoint is deployed.
const MCP_SERVER_URL =
  (import.meta.env.VITE_LPLENS_MCP_URL as string | undefined) ??
  "STDIO (self-host)";
const GIT_TAG =
  (import.meta.env.VITE_GIT_TAG as string | undefined) ?? "main";
const REPO_BASE =
  "https://github.com/JeanBaptisteDurand/Open_Agent_2026";
const AGENT_CONTRACT =
  (import.meta.env.VITE_LPLENS_AGENT_CONTRACT as string | undefined) ??
  "0x938f3B7841b3faCbBE967F90B548d991e9882c6C";
const AGENT_TOKEN_ID =
  (import.meta.env.VITE_LPLENS_AGENT_TOKEN_ID as string | undefined) ?? "1";

interface ToolRow {
  name: string;
  gated: boolean;
  price: string;
  description: string;
}

const TOOLS: ToolRow[] = [
  {
    name: "lplens.diagnose",
    gated: true,
    price: "0.1 OG / 24 h",
    description:
      "Full diagnostic pipeline on a Uniswap V3/V4 LP position. Streams SSE phases. Returns signed report + rootHash + on-chain anchor + ENS records.",
  },
  {
    name: "lplens.preflight",
    gated: true,
    price: "0.1 OG / 24 h",
    description:
      "Lightweight scan: range status, regime, rough IL, no hook simulation. Suitable for a quick \"is it worth diagnosing?\" check.",
  },
  {
    name: "lplens.migrate",
    gated: true,
    price: "0.1 OG / 24 h",
    description:
      "Builds the Permit2 EIP-712 typed data for the V3 → V4 migration of a given rootHash verdict. Does not execute.",
  },
  {
    name: "lplens.lookupReport",
    gated: false,
    price: "FREE",
    description:
      "Fetches a previously assembled report by rootHash from the LPLens cache. Verification path #1.",
  },
  {
    name: "lplens.lookupReportOnChain",
    gated: false,
    price: "FREE",
    description:
      "Reads LPLensReports.reports(rootHash) directly on 0G Chain. Verification path #2 — no LPLens server in the trust path.",
  },
  {
    name: "lplens.resolveEnsRecord",
    gated: false,
    price: "FREE",
    description:
      "Resolves any text record under lplensagent.eth on Sepolia. Verification path #3 — pure ENS lookup.",
  },
];

export function Developers() {
  return (
    <div>
      <AppHeader />
      <main
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "48px 36px",
        }}
      >
        <div style={{ marginBottom: 8, fontSize: 11, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.12em" }}>
          Agent economy · MCP + mintLicense
        </div>
        <h1
          style={{
            margin: 0,
            fontFamily: "var(--font-display)",
            fontSize: 42,
            fontWeight: 500,
            letterSpacing: "-0.02em",
          }}
        >
          Call LPLens from any agent.
        </h1>
        <p style={{ marginTop: 12, color: "var(--text-secondary)", maxWidth: 760, fontSize: 14, lineHeight: 1.6 }}>
          LPLens exposes a Model Context Protocol server so Claude Desktop,
          Cursor, custom agents, or your own scripts can invoke it. Three of
          the six tools are gated by an on-chain license (paid in OG via{" "}
          <code>mintLicense</code> on the iNFT, 80/20 split between owner and
          treasury). The three verifier tools stay free — verification is a
          public good. <span style={{ color: "var(--text-tertiary)" }}>x402 USDC settlement is on the roadmap.</span>
        </p>

        {/* Endpoints table */}
        <section
          style={{
            marginTop: 32,
            padding: 0,
            borderRadius: 10,
            border: "1px solid var(--border)",
            overflow: "hidden",
          }}
        >
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "var(--surface-raised)", textAlign: "left" }}>
                <th style={th()}>Endpoint</th>
                <th style={th()}>Access</th>
                <th style={th()}>Price</th>
                <th style={{ ...th(), width: "55%" }}>Description</th>
              </tr>
            </thead>
            <tbody>
              {TOOLS.map((t) => (
                <tr key={t.name} style={{ borderTop: "1px solid var(--border)" }}>
                  <td style={td()}>
                    <code style={{ color: "var(--cyan)" }}>{t.name}</code>
                  </td>
                  <td style={td()}>
                    {t.gated ? (
                      <span style={{ color: "var(--violet, #b48cff)" }}>GATED</span>
                    ) : (
                      <span style={{ color: "var(--green, #8ee887)" }}>FREE</span>
                    )}
                  </td>
                  <td style={td()}>
                    <code>{t.price}</code>
                  </td>
                  <td style={{ ...td(), color: "var(--text-secondary)", lineHeight: 1.5 }}>
                    {t.description}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* Mint a license */}
        <section
          style={{
            marginTop: 32,
            padding: 24,
            borderRadius: 10,
            border: "1px solid var(--border)",
            background: "var(--surface)",
          }}
        >
          <h2 style={{ margin: 0, fontSize: 14, fontFamily: "var(--font-display)", color: "var(--violet, #b48cff)", textTransform: "uppercase", letterSpacing: "0.12em" }}>
            Mint a license
          </h2>
          <p style={{ marginTop: 12, fontSize: 13, color: "var(--text-secondary)", maxWidth: 760, lineHeight: 1.6 }}>
            Paste this <code>cast send</code> in a shell with a funded 0G Newton wallet to buy a 24 h
            license against tokenId {AGENT_TOKEN_ID}. The contract auto-splits payment 80 % to the
            iNFT owner and 20 % to the protocol treasury, then writes the license entry on-chain.
          </p>
          <pre
            style={{
              marginTop: 12,
              padding: 14,
              borderRadius: 8,
              background: "var(--surface-raised)",
              border: "1px solid var(--border)",
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              overflow: "auto",
              lineHeight: 1.6,
            }}
          >
{`# 1. mint a license — 0.1 OG, 24 hours
cast send ${AGENT_CONTRACT || "<LPLensAgent>"} \\
  "mintLicense(uint256,address,uint64)" \\
  ${AGENT_TOKEN_ID} <yourAddress> $(($(date +%s) + 86400)) \\
  --value 0.1ether \\
  --rpc-url https://evmrpc-testnet.0g.ai \\
  --private-key $YOUR_KEY

# 2. verify the license is active
cast call ${AGENT_CONTRACT || "<LPLensAgent>"} \\
  "isLicensed(uint256,address)(bool)" \\
  ${AGENT_TOKEN_ID} <yourAddress> \\
  --rpc-url https://evmrpc-testnet.0g.ai
# → true`}
          </pre>
        </section>

        {/* Run the MCP server locally — install / build / start */}
        <section
          style={{
            marginTop: 24,
            padding: 24,
            borderRadius: 10,
            border: "1px solid var(--border)",
            background: "var(--surface)",
          }}
        >
          <h2 style={{ margin: 0, fontSize: 14, fontFamily: "var(--font-display)", color: "var(--cyan)", textTransform: "uppercase", letterSpacing: "0.12em" }}>
            Run the MCP server on your machine
          </h2>
          <p style={{ marginTop: 12, fontSize: 13, color: "var(--text-secondary)", maxWidth: 760, lineHeight: 1.6 }}>
            The MCP server is a Node STDIO process that Claude Desktop spawns
            as a subprocess on your machine. It calls the LPLens HTTP backend
            for the heavy lifting (subgraph, 0G Compute, storage, chain anchor)
            and reads the iNFT licence on-chain via your local RPC. You don't
            host anything — you run a single binary.
          </p>

          {/* Direct download buttons — auto-generated GitHub source archives
              for the latest pushed tag, no manual release upload needed. */}
          <div
            style={{
              marginTop: 16,
              display: "flex",
              flexWrap: "wrap",
              gap: 10,
            }}
          >
            <a
              href={`${REPO_BASE}/archive/refs/tags/${GIT_TAG}.tar.gz`}
              target="_blank"
              rel="noreferrer"
              className="btn btn-primary"
              style={{ padding: "10px 16px", fontSize: 13 }}
            >
              Download {GIT_TAG} · .tar.gz
            </a>
            <a
              href={`${REPO_BASE}/archive/refs/tags/${GIT_TAG}.zip`}
              target="_blank"
              rel="noreferrer"
              className="btn btn-ghost"
              style={{ padding: "10px 16px", fontSize: 13 }}
            >
              .zip
            </a>
            <a
              href={`${REPO_BASE}/releases`}
              target="_blank"
              rel="noreferrer"
              className="btn btn-ghost"
              style={{ padding: "10px 16px", fontSize: 13 }}
            >
              All releases →
            </a>
          </div>

          <pre
            style={{
              marginTop: 16,
              padding: 14,
              borderRadius: 8,
              background: "var(--surface-raised)",
              border: "1px solid var(--border)",
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              overflow: "auto",
              lineHeight: 1.6,
            }}
          >
{`# Option A — git clone (gets you onto the latest main)
git clone ${REPO_BASE}.git
cd Open_Agent_2026
pnpm install
pnpm --filter @lplens/mcp-server build
node $(pwd)/apps/mcp-server/dist/index.js

# Option B — download the ${GIT_TAG} tarball above, then:
tar xzf Open_Agent_2026-${GIT_TAG.replace(/^v/, "")}.tar.gz
cd Open_Agent_2026-${GIT_TAG.replace(/^v/, "")}
pnpm install
pnpm --filter @lplens/mcp-server build
node $(pwd)/apps/mcp-server/dist/index.js

# Option C — npm install (planned, see /roadmap)
# npm install -g @lplens/mcp-server
# lplens-mcp`}
          </pre>
          <p style={{ marginTop: 12, fontSize: 11, color: "var(--text-tertiary)", lineHeight: 1.55 }}>
            Tarball + zip are GitHub-generated archives of the source pinned
            at the latest tag — no compiled binary yet (npm package is on the{" "}
            <a href="/roadmap" style={{ color: "var(--cyan)" }}>roadmap</a>).
          </p>
        </section>

        {/* Claude Desktop */}
        <section
          style={{
            marginTop: 24,
            padding: 24,
            borderRadius: 10,
            border: "1px solid var(--border)",
            background: "var(--surface)",
          }}
        >
          <h2 style={{ margin: 0, fontSize: 14, fontFamily: "var(--font-display)", color: "var(--cyan)", textTransform: "uppercase", letterSpacing: "0.12em" }}>
            Claude Desktop install
          </h2>
          <p style={{ marginTop: 12, fontSize: 13, color: "var(--text-secondary)", maxWidth: 760, lineHeight: 1.6 }}>
            Drop this into <code>~/Library/Application Support/Claude/claude_desktop_config.json</code>:
          </p>
          <pre
            style={{
              marginTop: 12,
              padding: 14,
              borderRadius: 8,
              background: "var(--surface-raised)",
              border: "1px solid var(--border)",
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              overflow: "auto",
              lineHeight: 1.6,
            }}
          >
{`{
  "mcpServers": {
    "lplens": {
      "command": "node",
      "args": ["/abs/path/to/Open_Agent_2026/apps/mcp-server/dist/index.js"],
      "env": {
        // Hosted prod backend — switch to http://localhost:3001 if you run
        // the server locally with \`pnpm --filter @lplens/server run dev\`.
        "LPLENS_API_URL": "https://lplens.xyz",
        "LPLENS_AGENT_CONTRACT": "${AGENT_CONTRACT || "0x..."}",
        "LPLENS_AGENT_TOKEN_ID": "${AGENT_TOKEN_ID}"
      }
    }
  }
}`}
          </pre>
        </section>

        {/* TypeScript */}
        <section
          style={{
            marginTop: 24,
            padding: 24,
            borderRadius: 10,
            border: "1px solid var(--border)",
            background: "var(--surface)",
          }}
        >
          <h2 style={{ margin: 0, fontSize: 14, fontFamily: "var(--font-display)", color: "var(--green, #8ee887)", textTransform: "uppercase", letterSpacing: "0.12em" }}>
            TypeScript / @modelcontextprotocol/sdk
          </h2>
          <pre
            style={{
              marginTop: 12,
              padding: 14,
              borderRadius: 8,
              background: "var(--surface-raised)",
              border: "1px solid var(--border)",
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              overflow: "auto",
              lineHeight: 1.6,
            }}
          >
{`import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const client = new Client({ name: "your-agent", version: "0.1.0" });
await client.connect(new StdioClientTransport({
  command: "node",
  args: ["/abs/path/to/apps/mcp-server/dist/index.js"],
}));

// Gated tool — pass your address so the server can check isLicensed.
const result = await client.callTool({
  name: "lplens.diagnose",
  arguments: {
    tokenId: "605311",
    caller: "0xYourAddress",
  },
});

// If unlicensed, result.paymentRequired tells you where to mintLicense.
console.log(result);`}
          </pre>
        </section>

        <p style={{ marginTop: 32, fontSize: 11, color: "var(--text-tertiary)", textAlign: "center" }}>
          Backend live at <code>https://lplens.xyz</code>. MCP server runs locally via STDIO ({" "}
          <code>{MCP_SERVER_URL}</code>) — see{" "}
          <a href="/roadmap" style={{ color: "var(--cyan)" }}>
            /roadmap
          </a>{" "}
          for the planned hosted HTTP/SSE endpoint at{" "}
          <code>lplens.xyz/mcp</code>. ENS identity{" "}
          <a
            href="https://sepolia.app.ens.domains/lplensagent.eth"
            target="_blank"
            rel="noreferrer"
            style={{ color: "var(--cyan)" }}
          >
            lplensagent.eth
          </a>
          .
        </p>
      </main>
    </div>
  );
}

function th() {
  return {
    padding: "12px 16px",
    fontSize: 11,
    color: "var(--text-tertiary)",
    textTransform: "uppercase" as const,
    letterSpacing: "0.12em",
    fontWeight: 500,
  };
}

function td() {
  return {
    padding: "14px 16px",
    fontSize: 13,
    fontFamily: "var(--font-mono)",
    verticalAlign: "top" as const,
  };
}
