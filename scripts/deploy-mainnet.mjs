// Deploys ChogTwain (which creates TwainPostcard) to Monad MAINNET (143) with the real Chog Genesis, real $CHOG and OUR
// gaze root, then writes the addresses into .env.local and verifies both contracts on Sourcify.
// The contract is immutable and the lantern price is fixed forever: Kinnoski confirms LANTERN_PRICE_CHOG first.
// Usage: node scripts/deploy-mainnet.mjs --lantern 65            (whole $CHOG)
import { spawnSync } from "node:child_process";
import { appendFileSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { createPublicClient, formatEther, http, parseUnits } from "viem";
import { privateKeyToAccount } from "viem/accounts";

const arg = (n) => { const i = process.argv.indexOf(`--${n}`); return i > 0 ? process.argv[i + 1] : undefined; };
const lantern = arg("lantern");
if (!lantern || !/^\d+(\.\d+)?$/.test(lantern)) throw new Error("pass --lantern <whole $CHOG>, e.g. --lantern 65");
const envText = readFileSync(".env.local", "utf8");
const get = (k) => envText.match(new RegExp(`^${k}=(.*)$`, "m"))?.[1]?.trim();
const key = get("DEPLOYER_KEY");
if (!/^0x[0-9a-fA-F]{64}$/.test(key ?? "")) throw new Error("DEPLOYER_KEY missing in .env.local");
if (get("NEXT_PUBLIC_TWAIN")) throw new Error("NEXT_PUBLIC_TWAIN is already set in .env.local: refusing to deploy a second contract");
const RPC = "https://rpc.monad.xyz";
const GENESIS = "0xc96d31F8626c6D03Fae5dCD3d61e3FB9F4a73763";
const TOKEN = "0x350035555E10d9AfAF1566AaebfCeD5BA6C27777";
const root = JSON.parse(readFileSync("data/gaze-stats.json", "utf8")).root;
const account = privateKeyToAccount(key);
const pc = createPublicClient({ transport: http(RPC) });
if ((await pc.getChainId()) !== 143) throw new Error("RPC is not chain 143");
const bal = await pc.getBalance({ address: account.address });
console.log(`deployer ${account.address} holds ${formatEther(bal)} MON`);
if (bal < 600_000_000_000_000_000n) throw new Error("deployer needs at least 0.6 MON");

const bin = (n) => join(homedir(), ".foundry", "bin", process.platform === "win32" ? `${n}.exe` : n);
const env = { ...process.env, CHOG_GENESIS: GENESIS, CHOG_TOKEN: TOKEN, GAZE_ROOT: root, LANTERN_PRICE: parseUnits(lantern, 18).toString() };
const r = spawnSync(bin("forge"), ["script", "script/Deploy.s.sol", "--rpc-url", RPC, "--broadcast", "--private-key", key, "--legacy", "--slow"], { cwd: "contracts", env, encoding: "utf8" });
const out = (r.stdout ?? "") + (r.stderr ?? "");
console.log(out.replace(key, "<key>").split("\n").filter((l) => /ChogTwain|EPOCH|TwainPostcard|Error|error|Hash|Block/.test(l)).join("\n"));
if (r.status) throw new Error("forge script failed");
const pick = (k) => out.match(new RegExp(`${k}\\s+(0x[0-9a-fA-F]{40})`))?.[1];
const twain = pick("ChogTwain");
const postcard = pick("TwainPostcard");
const epoch = out.match(/EPOCH\s+(\d+)/)?.[1];
if (!twain || !postcard) throw new Error("could not read addresses from the forge output");
const block = (await pc.getBlockNumber()).toString();
appendFileSync(".env.local", `NEXT_PUBLIC_TWAIN=${twain}\nNEXT_PUBLIC_POSTCARD=${postcard}\nNEXT_PUBLIC_DEPLOY_BLOCK=${block}\nNEXT_PUBLIC_EPOCH=${epoch}\nNEXT_PUBLIC_LANTERN_PRICE_CHOG=${lantern}\n`);
writeFileSync("docs/deployment.json", JSON.stringify({ network: "Monad mainnet", chainId: 143, twain, postcard, genesis: GENESIS, token: TOKEN, gazeRoot: root, lanternPriceChog: lantern, deployBlock: block, epoch, deployer: account.address, at: new Date().toISOString() }, null, 2) + "\n");
console.log(`\nChogTwain     ${twain}\nTwainPostcard ${postcard}\nlantern ${lantern} $CHOG, deploy block ~${block}`);

// verify on Sourcify (runtime bytecode match; immutables are read from the deployed code, so no constructor args are needed)
const v1 = spawnSync(bin("forge"), ["verify-contract", twain, "src/ChogTwain.sol:ChogTwain", "--verifier", "sourcify", "--chain", "143"] , { cwd: "contracts", encoding: "utf8" });
console.log("verify ChogTwain:", (v1.stdout + v1.stderr).split("\n").filter(Boolean).slice(-2).join(" | "));
const v2 = spawnSync(bin("forge"), ["verify-contract", postcard, "src/TwainPostcard.sol:TwainPostcard", "--verifier", "sourcify", "--chain", "143"] , { cwd: "contracts", encoding: "utf8" });
console.log("verify TwainPostcard:", (v2.stdout + v2.stderr).split("\n").filter(Boolean).slice(-2).join(" | "));
