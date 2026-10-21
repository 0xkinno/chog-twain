// Starts a local anvil chain (31337), puts Multicall3 at its canonical address, deploys ChogTwain with mocks
// for Chog Genesis and $CHOG using OUR gaze root, and writes .env.local so `npm run dev` talks to it.
// Playwright uses this to exercise every real transaction path without spending real MON.
// Usage: node scripts/local-chain.mjs   (leave running; Ctrl+C stops anvil)
import { spawn, execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const bin = (n) => join(homedir(), ".foundry", "bin", process.platform === "win32" ? `${n}.exe` : n);
const MULTICALL3 = "0xcA11bde05977b3631167028862bE2a173976CA11";
const root = JSON.parse(readFileSync("data/gaze-stats.json", "utf8")).root;
// anvil default dev keys (public, well known; local chain only)
const KEYS = [
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
];

const anvil = spawn(bin("anvil"), ["--port", "8545", "--chain-id", "31337", "--block-time", "1", "--hardfork", "cancun"], { stdio: "inherit" });
process.on("SIGINT", () => (anvil.kill(), process.exit(0)));
const rpc = async (method, params = []) =>
  (await (await fetch("http://127.0.0.1:8545", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }) })).json()).result;
for (let i = 0; i < 50; i++) {
  try { if (await rpc("eth_chainId")) break; } catch {}
  await new Promise((r) => setTimeout(r, 200));
}
const code = execFileSync(bin("cast"), ["code", MULTICALL3, "--rpc-url", "https://rpc.monad.xyz"]).toString().trim();
await rpc("anvil_setCode", [MULTICALL3, code]);

const env = { ...process.env, GAZE_ROOT: root, LANTERN_PRICE: "100000000000000000000" };
KEYS.forEach((k, i) => (env[`ANVIL_KEY_${i}`] = k));
const out = execFileSync(bin("forge"), ["script", "script/DeployLocal.s.sol", "--rpc-url", "http://127.0.0.1:8545", "--broadcast", "--private-key", KEYS[0], "--legacy"], { cwd: "contracts", env }).toString();
const pick = (k) => out.match(new RegExp(`${k}\\s+(0x[0-9a-fA-F]{40})`))[1];
const epoch = out.match(/EPOCH\s+(\d+)/)[1];
const blk = parseInt(await rpc("eth_blockNumber"), 16);
writeFileSync(".env.local", [
  "NEXT_PUBLIC_CHAIN=local",
  "NEXT_PUBLIC_MONAD_RPC=http://127.0.0.1:8545",
  `NEXT_PUBLIC_TWAIN=${pick("TWAIN")}`,
  `NEXT_PUBLIC_POSTCARD=${pick("POSTCARD")}`,
  `NEXT_PUBLIC_CHOG_GENESIS=${pick("CHOG_GENESIS")}`,
  `NEXT_PUBLIC_CHOG_TOKEN=${pick("CHOG_TOKEN")}`,
  "NEXT_PUBLIC_DEPLOY_BLOCK=0",
  `NEXT_PUBLIC_EPOCH=${epoch}`,
  "NEXT_PUBLIC_SITE_URL=http://localhost:3000",
  "",
].join("\n"));
console.log(`local chain ready at block ${blk}; .env.local written (epoch ${epoch})`);
console.log("accounts:", KEYS.map((k, i) => i).join(","), "(anvil dev accounts, 1,000,000 mock $CHOG each; account 9 holds Chogs 1..24)");
await new Promise(() => {});