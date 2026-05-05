# SETUP_FINALE.md — Live demo runbook

This is the operator runbook for the LPLens live demo. Follow it
before every rehearsal and again 5 minutes before going live.

---

## 1. Pre-flight (5 minutes before demo)

```bash
# 1. Boot infra
docker compose up -d                     # postgres + redis
pnpm install --frozen-lockfile

# 2. Pre-warm the demo cache (hits real chain once)
pnpm dev:server &                        # background server on :3001
sleep 6                                  # wait for /health to come up
pnpm demo:warm                           # captures top 5 bleeding tokenIds

# 3. Boot the web app
pnpm dev:web                             # web on :3100

# 4. Confirm replay path
curl -N "http://localhost:3001/api/diagnose/<tokenId>?demo=1" | head
# Should stream the cached events at 2× speed.
```

After `pnpm demo:warm` finishes you should see something like:

```
[demo:warm] READY · 5 recordings · fixtures.json written
  primaryTokenId: 605311
  rootHash:       0xd0da9250a8b71c87…d5c4
  anchor tx:      0xe8e55c75de9a32a9…
  ENS parent:     lplensagent.eth

  Test the replay path:
    curl -N "http://localhost:3001/api/diagnose/605311?demo=1"
```

If `rootHash`/`anchor tx`/`ENS parent` show `(none)`, the corresponding
0G key in `.env` is missing. The demo will still run (panels label
themselves `EMULATED`), but the proof badges won't be clickable.

---

## 2. URLs you'll touch on stage

| Path | Purpose |
|---|---|
| `/finale?presenter=true` | The kiosk. **Open this once and never tab away.** |
| `/finale?presenter=true&demo=1` | Same kiosk but the diagnose iframes replay from cache. |

That's it — you should not need anything else.

### Presenter-mode keyboard shortcuts

- **space** — advance to next beat (also starts the chrono on first press)
- **← / →** — prev / next beat
- **f / F** — toggle fullscreen
- **r / R** — reset chrono
- **p / P** — pause / resume chrono

A 5:00 chrono ticks down in the top-right (visible only to you). A
beat indicator + roadmap docks top-left.

---

## 3. The 7 sections

The kiosk runs through these in order. Each section is one full-screen
snap target.

| # | Section | Source |
|---|---|---|
| 1 | Hero — ON AIR + 3-line thesis + proof badges + live ticker | `apps/web/src/finale/sections/HeroSection.tsx` |
| 2 | Atlas — bleeding wallet pinned + narrative overlay | `apps/web/src/finale/sections/AtlasSection.tsx` |
| 3 | Diagnose live — embedded iframe of `/diagnose/<tokenId>?demo=1` | `apps/web/src/pages/Diagnose.tsx` |
| 4 | Verdict + AT-4 — same iframe with `?showGuard=true` | `apps/web/src/components/VerdictPanel.tsx` |
| 5 | Migration — same iframe scrolled to `#migrate` | (existing migration panel) |
| 6 | Composability — embedded `/composability` scripted loop | `apps/web/src/pages/Composability.tsx` |
| 7 | Verify cascade — embedded `/verify/<rootHash>?demo=true` | `apps/web/src/pages/Verify.tsx` |

---

## 4. URL flags

| Flag | Effect |
|---|---|
| `?demo=1` (or `?demo=true`) | Diagnose stream replays from `cache/demo-runs/<tokenId>.jsonl` instead of running the live pipeline. |
| `?showGuard=true` | VerdictPanel injects a curated AT-4 mask demo and renders the guarded-claims side panel. |
| `?presenter=true` | Enables the chrono + keyboard nav on `/finale`. **Set this on stage.** |

These compose: `/finale?presenter=true&demo=1` is the canonical demo URL.

---

## 5. Cache pipeline

Once-per-demo-session, run with `pnpm demo:warm`:

| Step | Output |
|---|---|
| Subgraph snapshot for 6 demo wallets | `cache/subgraph/<wallet>.json` (in-process LRU + filesystem) |
| Capture top-5 bleeding SSE streams | `cache/demo-runs/<tokenId>.jsonl` |
| Trading API quote | in-memory SWR (60s TTL) |
| 0G Storage upload + 0G Chain anchor | `cache/fixtures.json` (rootHash + tx hash) |
| ENS Sepolia text records | published under `lplensagent.eth` |

The replay endpoint `GET /api/diagnose/:tokenId?demo=1` reads only
from `cache/demo-runs/`. Real chain reads happen during the warm pass
only — never during the live demo, except for block heights and the
real Permit2 signature.

---

## 6. Anti-pattern hard-bans (do not do these on stage)

- **No mainnet tx.** Use 0G Newton testnet + Sepolia only.
- **No live MCP via Claude Desktop during the stream.** The
  `/composability` page is a scripted animation referencing a real
  prior tx (`0xe8e55c75…`). That's the whole demo.
- **No tab switches.** Stay on `/finale?presenter=true` from start to
  finish.
- **Window share, not full-screen share.** Avoids leaking
  notifications, Slack, email.
- **No spinner > 3 s visible.** If something stalls, advance to the
  next beat — the kiosk handles missing data with `EMULATED` labels
  silently.

---

## 7. Rehearsal checklist

- [ ] `pnpm demo:warm` succeeded with `rootHash` set
- [ ] `curl /api/diagnose/<tokenId>?demo=1` streams events
- [ ] `/finale?presenter=true` opens the hero
- [ ] `space` advances to Atlas → Diagnose → Verdict → Migrate → Composability → Verify
- [ ] `f` enters fullscreen
- [ ] Wallet pre-connected in MetaMask (0G Newton + Sepolia funded)
- [ ] Local screen recording running (personal backup)
- [ ] Ethernet plugged in (no Wi-Fi)
- [ ] Demo runs end-to-end in under 4:45

---

## 8. Demo verification surfaces (for sponsor Q&A)

After the demo, sponsors may want to verify on-chain. Show them:

```bash
# 1. The anchored rootHash on 0G Chain
cast call <LPLensReports> "reports(bytes32)(...)" <rootHash> \
  --rpc-url https://evmrpc-testnet.0g.ai

# 2. The iNFT memoryRoot
cast call <LPLensAgent> "agents(uint256)(...)" 1 \
  --rpc-url https://evmrpc-testnet.0g.ai

# 3. The ENS text record
cast call 0x8FADE66B79cC9f707aB26799354482EB93a5B7dD \
  "text(bytes32,string)(string)" \
  $(cast namehash lplensagent.eth) \
  "lplens.<tokenId>.rootHash" \
  --rpc-url https://ethereum-sepolia-rpc.publicnode.com
```

Each command returns the same rootHash from a different vantage. The
`/verify/:rootHash` page shows all 5 surfaces visually.
