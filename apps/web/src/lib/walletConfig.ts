import { createConfig, http } from "wagmi";
import { mainnet, sepolia } from "wagmi/chains";
import { injected } from "wagmi/connectors";

// Wallet stack — viem under the hood, wagmi for the React surface. The
// migrate flow targets Sepolia (testnet) by default so judges can sign
// without spending real ETH; mainnet stays available for users who want
// to actually migrate. The `injected` connector covers the full long
// tail of browser wallets including MetaMask, Rabby, Brave, Coinbase
// Wallet — no separate connector entries needed, which keeps the type
// graph clean (the metaMask connector leaks @metamask/sdk internal
// types).

export const walletConfig = createConfig({
  chains: [sepolia, mainnet],
  connectors: [injected()],
  transports: {
    [sepolia.id]: http(),
    [mainnet.id]: http(),
  },
});

declare module "wagmi" {
  interface Register {
    config: typeof walletConfig;
  }
}

export const PERMIT2_ADDRESS = "0x000000000022D473030F116dDEE9F6B43aC78BA3";
