import type { BrowserContext } from "@playwright/test";
import { privateKeyToAccount } from "viem/accounts";

// anvil dev keys (public, local chain only). Index 9 holds Chogs 1..24 in the local deploy.
export const KEYS = [
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
  "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d",
  "0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a",
  "0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6",
  "0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a",
  "0x8b3a350cf5c34c9194ca85829a2df0ec3153be0318b5e2d3348e872092edffba",
  "0x92db14e403b83dfe3df233f83dfa3a0d7096f21ca9b0d6d6b8d88b2b4ec1564e",
  "0x4bbbf85ce3377467afe5d46f804f221813b2bb87f24d81f60f1fcdbf7cbf4356",
  "0xdbda1821b80551c9d65939329250298aa3472ba22feea921c0cf5d620ea67b97",
  "0x2a871d0798f97d79848a013d4936a73bf4cc922c825d33c1cf7073dff6d409c6",
] as const;
export const addr = (i: number) => privateKeyToAccount(KEYS[i]).address;

/**
 * Installs an EIP-6963 wallet in the page that forwards to the local anvil node, where the dev account is unlocked.
 * It is a real provider as far as the app can tell: connect, chain id, switch chain and eth_sendTransaction all run.
 */
export async function installWallet(context: BrowserContext, index: number, rpc = "http://127.0.0.1:8545") {
  const address = addr(index);
  await context.addInitScript(
    ({ address, rpc }) => {
      let connected = false;
      const call = async (method: string, params: unknown[] = []) => {
        const r = await fetch(rpc, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ jsonrpc: "2.0", id: Date.now(), method, params }) });
        const j = await r.json();
        if (j.error) { const e = new Error(j.error.message) as Error & { code?: number; data?: unknown }; e.code = j.error.code; e.data = j.error.data; throw e; }
        return j.result;
      };
      const listeners: Record<string, ((...a: unknown[]) => void)[]> = {};
      const provider = {
        isTestWallet: true,
        request: async ({ method, params }: { method: string; params?: unknown[] }) => {
          switch (method) {
            case "eth_requestAccounts": connected = true; sessionStorage.setItem("tw-connected", "1"); return [address];
            case "eth_accounts": return connected || sessionStorage.getItem("tw-connected") ? [address] : [];
            case "eth_chainId": return "0x7a69";
            case "net_version": return "31337";
            case "wallet_switchEthereumChain": return null;
            case "wallet_addEthereumChain": return null;
            case "wallet_requestPermissions": connected = true; return [{ parentCapability: "eth_accounts" }];
            case "wallet_getPermissions": return connected ? [{ parentCapability: "eth_accounts" }] : [];
            case "eth_sendTransaction": {
              const tx = (params as Record<string, unknown>[])[0];
              return call("eth_sendTransaction", [{ ...tx, from: address }]);
            }
            default: return call(method, params ?? []);
          }
        },
        on: (e: string, f: (...a: unknown[]) => void) => { (listeners[e] ??= []).push(f); },
        removeListener: (e: string, f: (...a: unknown[]) => void) => { listeners[e] = (listeners[e] ?? []).filter((x) => x !== f); },
      };
      const info = { uuid: "00000000-0000-4000-8000-000000000001", name: "Test Wallet", icon: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAzMiAzMiI+PHJlY3Qgd2lkdGg9IjMyIiBoZWlnaHQ9IjMyIiByeD0iOCIgZmlsbD0iIzgzNmVmOSIvPjwvc3ZnPg==", rdns: "app.chogtwain.testwallet" };
      const announce = () => window.dispatchEvent(new CustomEvent("eip6963:announceProvider", { detail: Object.freeze({ info, provider }) }));
      window.addEventListener("eip6963:requestProvider", announce);
      announce();
      (window as unknown as { __testWallet: string }).__testWallet = address;
    },
    { address, rpc },
  );
}