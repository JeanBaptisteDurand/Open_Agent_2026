# Deploy LPLens contracts to 0G Newton testnet

One-liner — deploy `LPLensReports` and `LPLensAgent` to chain id 16602:

```bash
cd contracts

# Required: a deployer key with at least 0.1 0G on Newton
export WALLET_DEPLOYER_PK=0x...

# Optional: mint the agent iNFT in the same tx, with a code-image hash
# (32 bytes hex). Leave unset to skip the mint and call `LPLensAgent.mint`
# from the server later.
export LPLENS_CODE_IMAGE_HASH=0x0000000000000000000000000000000000000000000000000000000000000000
export LPLENS_METADATA_URI="og://lplens-agent-v1.0.0"

forge script script/Deploy.s.sol \
  --rpc-url https://evmrpc-testnet.0g.ai \
  --broadcast \
  --legacy \
  --private-key "$WALLET_DEPLOYER_PK"
```

Forge prints the deployed addresses. Copy them into the project root `.env`:

```env
LPLENS_REPORTS_CONTRACT=0x...
LPLENS_AGENT_CONTRACT=0x...
```

Restart the server. From now on, phase 9 calls `LPLensReports.publishReport(tokenId, rootHash, attestation)` against the real registry, and the MCP tool `lplens.lookupReportOnChain` resolves any anchored rootHash directly through `viem` against your contract — no LPLens API trust required.

## Verifying the deploy

```bash
# Pure on-chain read, independent of the LPLens server.
cast call $LPLENS_REPORTS_CONTRACT \
  'reportCount(uint256)(uint256)' \
  $TOKEN_ID \
  --rpc-url https://evmrpc-testnet.0g.ai
```

If you anchored at least one report, the count goes up by one per call to `publishReport`.

## Re-deploying / migrating

The contracts use no proxies on purpose — the registry is append-only and the iNFT is non-upgradeable. To redeploy, change `LPLENS_REPORTS_CONTRACT` / `LPLENS_AGENT_CONTRACT` in `.env`; the old contracts stay on chain and remain queryable by their previous address.

## What if I don't have a deployer key?

Skip the deploy. The server's `ogChain` adapter falls back to a raw self-tx with the rootHash as calldata when `LPLENS_REPORTS_CONTRACT` is empty — the rootHash still hits 0G Chain, just without the per-tokenId index. Panels label themselves accordingly so the demo is honest about what's contract-anchored vs raw-tx-anchored.
