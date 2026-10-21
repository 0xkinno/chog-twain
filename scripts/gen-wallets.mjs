// Creates fresh wallets for Chog Twain and writes the KEYS to .env.local only (gitignored). Prints addresses only.
// Existing keys are never overwritten. Usage: node scripts/gen-wallets.mjs
import { existsSync, readFileSync, writeFileSync, appendFileSync } from "node:fs";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";

const names = ["DEPLOYER_KEY", "TEST_WALLET_A_KEY", "TEST_WALLET_B_KEY", "TEST_WALLET_C_KEY"];
const labels = { DEPLOYER_KEY: "Deployer (pays for deploy and the break campaign)", TEST_WALLET_A_KEY: "Test wallet A (opens walks, pledges)", TEST_WALLET_B_KEY: "Test wallet B (joins walks, pledges)", TEST_WALLET_C_KEY: "Test wallet C (a fan: lanterns and cheers, no Chog)" };
const file = ".env.local";
const cur = existsSync(file) ? readFileSync(file, "utf8") : "";
if (!cur.includes("# Chog Twain wallets")) appendFileSync(file, `${cur && !cur.endsWith("\n") ? "\n" : ""}# Chog Twain wallets (local only, never committed)\n`);
let text = readFileSync(file, "utf8");
for (const n of names) {
  const m = text.match(new RegExp(`^${n}=(0x[0-9a-fA-F]{64})$`, "m"));
  let key = m?.[1];
  if (!key) { key = generatePrivateKey(); appendFileSync(file, `${n}=${key}\n`); text += `${n}=${key}\n`; }
  console.log(`${n.replace("_KEY", "").padEnd(18)} ${privateKeyToAccount(key).address}   ${labels[n]}`);
}