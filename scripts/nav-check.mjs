// Checks the navbar with a connected wallet on the live site at several widths: brand and "Walk" must not overlap.
// Uses test wallet C from .env.local (read only, no transaction). Usage: node scripts/nav-check.mjs [url]
import { chromium } from "@playwright/test";
import { readFileSync } from "node:fs";
import { createWalletClient, defineChain, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";

const url = process.argv[2] ?? "https://chog-twain.vercel.app";
const env = Object.fromEntries(readFileSync(".env.local", "utf8").split(/\r?\n/).filter((l) => l.includes("=") && !l.startsWith("#")).map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1).trim()]));
const account = privateKeyToAccount(env.TEST_WALLET_C_KEY);
const b = await chromium.launch();
let bad = 0;
for (const w of [1920, 1280, 1000]) {
  const ctx = await b.newContext({ viewport: { width: w, height: 800 } });
  await ctx.addInitScript(({ address }) => {
    const provider = { request: async ({ method }) => (method === "eth_requestAccounts" || method === "eth_accounts" ? [address] : method === "eth_chainId" ? "0x8f" : method === "net_version" ? "143" : null), on() {}, removeListener() {} };
    const info = { uuid: "00000000-0000-4000-8000-000000000003", name: "Test Wallet", icon: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciLz4=", rdns: "app.chogtwain.navcheck" };
    const announce = () => window.dispatchEvent(new CustomEvent("eip6963:announceProvider", { detail: Object.freeze({ info, provider }) }));
    window.addEventListener("eip6963:requestProvider", announce); announce();
  }, { address: account.address });
  const p = await ctx.newPage();
  await p.goto(`${url}/w/3`, { waitUntil: "networkidle" });
  await p.getByTestId("connect").click({ timeout: 6000 }).catch(() => {});
  await p.getByRole("button", { name: "Test Wallet" }).click({ timeout: 6000 }).catch(() => {});
  await p.waitForTimeout(1500);
  const r = await p.evaluate(() => {
    const q = (s) => document.querySelector(s)?.getBoundingClientRect();
    const nav = q(".nav-capsule"), brand = q(".nav-brand"), text = q(".nav-brand-text"), first = q(".nav-links .nav-item"), cap = q('[data-testid="wallet-capsule"]');
    const vis = (el) => el && getComputedStyle(document.querySelector(el)).display !== "none";
    return { nav: nav && [Math.round(nav.left), Math.round(nav.right)], brandRight: brand && Math.round(brand.right), firstLeft: first && Math.round(first.left), textVisible: vis(".nav-brand-text"), wallet: !!cap, overflowX: document.documentElement.scrollWidth > document.documentElement.clientWidth };
  });
  const collide = r.brandRight && r.firstLeft && r.textVisible && r.brandRight > r.firstLeft + 1;
  if (collide || r.overflowX) bad++;
  console.log(String(w).padStart(5), JSON.stringify(r), collide ? "COLLISION" : "ok");
  if (w === 1920 || w === 1280) await p.screenshot({ path: `reference/nav-${w}.png`, clip: { x: 0, y: 0, width: w, height: 110 } });
  await ctx.close();
}
await b.close();
process.exit(bad ? 1 : 0);
