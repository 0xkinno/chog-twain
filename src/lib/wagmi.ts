import { createConfig, createStorage, noopStorage } from "wagmi";
import { injected } from "@wagmi/core";
import { ACTIVE_CHAIN, makeTransport } from "./chains";

/**
 * Our own wallet modal lists every EIP-6963 wallet wagmi discovers (MetaMask, Rabby, Phantom, Backpack, OKX,
 * Coinbase extension ...). A plain injected connector covers wallets that only set window.ethereum.
 * WalletConnect is added only when NEXT_PUBLIC_WC_PROJECT_ID is set (see wallet/Providers.tsx).
 */
export const wagmiConfig = createConfig({
  chains: [ACTIVE_CHAIN],
  connectors: [injected({ shimDisconnect: true })],
  multiInjectedProviderDiscovery: true,
  transports: { [ACTIVE_CHAIN.id]: makeTransport() },
  ssr: true,
  storage: createStorage({ storage: typeof window !== "undefined" ? window.localStorage : noopStorage }),
});