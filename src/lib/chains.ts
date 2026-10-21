import { defineChain, fallback, http, type Chain, type Transport } from "viem";

export const MULTICALL3 = "0xcA11bde05977b3631167028862bE2a173976CA11" as const;

const rpcs = (...extra: (string | undefined)[]) => [...new Set(extra.filter(Boolean) as string[])];

export const monad = defineChain({
  id: 143,
  name: "Monad",
  nativeCurrency: { name: "Monad", symbol: "MON", decimals: 18 },
  rpcUrls: {
    default: { http: rpcs(process.env.NEXT_PUBLIC_MONAD_RPC, "https://rpc.monad.xyz", "https://rpc1.monad.xyz", "https://rpc3.monad.xyz") },
  },
  blockExplorers: { default: { name: "MonadVision", url: "https://monadvision.com" } },
  contracts: { multicall3: { address: MULTICALL3 } },
});

export const monadTestnet = defineChain({
  id: 10143,
  name: "Monad Testnet",
  nativeCurrency: { name: "Monad", symbol: "MON", decimals: 18 },
  rpcUrls: { default: { http: ["https://testnet-rpc.monad.xyz"] } },
  blockExplorers: { default: { name: "MonadVision Testnet", url: "https://testnet.monadvision.com" } },
  contracts: { multicall3: { address: MULTICALL3 } },
  testnet: true,
});

/** Local anvil chain for Playwright and development (scripts/local-chain.mjs). */
export const localChain = defineChain({
  id: 31337,
  name: "Local anvil",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: { default: { http: [process.env.NEXT_PUBLIC_MONAD_RPC || "http://127.0.0.1:8545"] } },
  blockExplorers: { default: { name: "Local", url: "http://localhost:3000/local-explorer" } },
  contracts: { multicall3: { address: MULTICALL3 } },
  testnet: true,
});

export const IS_LOCAL = process.env.NEXT_PUBLIC_CHAIN === "local";
export const ACTIVE_CHAIN: Chain = IS_LOCAL ? localChain : monad;
export const SYMBOL = IS_LOCAL ? "ETH" : "MON";

/** Which RPC answered last, shown on Proof. Updated on every response. */
export const rpcReport: { host: string; count: number; failures: number } = { host: "none yet", count: 0, failures: 0 };

export function makeTransport(chain: Chain = ACTIVE_CHAIN): Transport {
  const urls = chain.rpcUrls.default.http;
  const one = (url: string) =>
    http(url, {
      batch: { wait: 12 },
      retryCount: 1,
      timeout: 8_000,
      onFetchResponse(res) {
        try {
          rpcReport.host = new URL(res.url).host;
          rpcReport.count++;
          if (!res.ok) rpcReport.failures++;
        } catch {
          /* ignore */
        }
      },
    });
  return urls.length > 1 ? fallback(urls.map(one), { rank: false }) : one(urls[0]);
}

export const explorerTx = (hash: string) => `${ACTIVE_CHAIN.blockExplorers?.default.url ?? ""}/tx/${hash}`;
export const explorerAddr = (a: string) => `${ACTIVE_CHAIN.blockExplorers?.default.url ?? ""}/address/${a}`;