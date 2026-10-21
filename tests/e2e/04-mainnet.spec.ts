// Smoke and end-to-end checks against the LIVE deployment on Monad mainnet (set E2E_BASE_URL to the Vercel URL).
// Skipped unless MAINNET=1. Uses the Chog Twain test wallets from .env.local (never printed).
import { test, expect, type Page } from "@playwright/test";
import { readFileSync, mkdirSync } from "node:fs";
import type { Hex } from "viem";
import { installKeyWallet } from "./support/wallet";

test.skip(!process.env.MAINNET, "set MAINNET=1 and E2E_BASE_URL to run against the live deployment");
const env = Object.fromEntries(readFileSync(".env.local", "utf8").split(/\r?\n/).filter((l) => l.includes("=") && !l.startsWith("#")).map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1).trim()]));
const state = JSON.parse(readFileSync("docs/mainnet-state.json", "utf8")) as { walk1: number; walk2: number };
mkdirSync("docs/screenshots", { recursive: true });

async function connect(page: Page, path: string) {
  await page.goto(path, { waitUntil: "networkidle" });
  await page.getByTestId("connect").click();
  await page.getByRole("button", { name: "Test Wallet" }).click();
  await expect(page.getByTestId("wallet-capsule")).toBeVisible();
}

test("landing reads live numbers from the mainnet contract", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });
  await expect(page.getByTestId("live-strip")).not.toContainText("Live numbers appear here", { timeout: 60_000 });
  await expect(page.getByTestId("live-strip")).toContainText(/Meetings/);
  await page.screenshot({ path: "docs/screenshots/banner.png" });
});

test("walk 1 on mainnet: two real Chogs, one step walked, a lantern, a pledge", async ({ page }) => {
  await page.goto(`/w/${state.walk1}`, { waitUntil: "networkidle" });
  await expect(page.getByTestId("walk-page")).toHaveAttribute("data-status", "walking", { timeout: 60_000 });
  await expect(page.getByTestId("spread")).toHaveAttribute("data-walked", "1");
  await expect(page.getByTestId("disc-left")).toBeVisible();
  await expect(page.getByTestId("disc-right")).toBeVisible();
  await expect(page.getByText("Lanterns 1/3")).toBeVisible();
  await expect(page.getByText(/25 \$CHOG each/)).toBeVisible();
  await expect(page.getByTestId("note-opener")).toContainText("landed in Leipzig");
  await page.waitForTimeout(1500);
  await page.screenshot({ path: "docs/screenshots/walk-mainnet.png", fullPage: false });
});

test("a fan wallet with no Chog cheers walk 1 through the live UI on mainnet", async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  await installKeyWallet(ctx, env.TEST_WALLET_C_KEY as Hex);
  const page = await ctx.newPage();
  await connect(page, `/w/${state.walk1}`);
  const before = Number(((await page.getByTestId("cheer").textContent()) ?? "").match(/\((\d+)\)/)?.[1] ?? 0);
  await page.getByTestId("cheer").click();
  await expect(page.getByTestId("tx-proposed").or(page.getByTestId("tx-final"))).toBeVisible({ timeout: 90_000 });
  await expect(page.getByTestId("tx-final")).toBeVisible({ timeout: 90_000 });
  await expect(page.getByTestId("tx-final").locator("a")).toHaveAttribute("href", /monadvision\.com\/tx\/0x/);
  await expect(page.getByTestId("cheer")).toContainText(`Cheer (${before + 1})`, { timeout: 60_000 });
  await ctx.close();
});

test("My walks, Chog page, Heartbeat and Proof read the live contract", async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  await installKeyWallet(ctx, env.TEST_WALLET_A_KEY as Hex);
  const page = await ctx.newPage();
  await connect(page, "/me");
  await expect(page.getByTestId("walk-card").first()).toBeVisible({ timeout: 60_000 });
  expect(await page.getByTestId("walk-card").count()).toBeGreaterThanOrEqual(2);
  await page.goto("/chog/1", { waitUntil: "networkidle" });
  await expect(page.getByTestId("chog-state")).toContainText(`walk ${state.walk1}`, { timeout: 60_000 });
  await page.goto("/heartbeat", { waitUntil: "networkidle" });
  await expect(page.getByTestId("hb-walks")).not.toHaveText("...", { timeout: 60_000 });
  await expect(page.getByTestId("hb-burned")).toContainText("50");
  await page.goto("/proof", { waitUntil: "networkidle" });
  await expect(page.getByTestId("proof-addresses")).toContainText(env.NEXT_PUBLIC_TWAIN);
  await expect(page.getByTestId("proof-addresses")).toContainText("Sourcify");
  await page.waitForTimeout(800);
  await page.screenshot({ path: "docs/screenshots/proof.png" });
  await ctx.close();
});