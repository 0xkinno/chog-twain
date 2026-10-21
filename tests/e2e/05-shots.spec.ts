// README screenshots of states that need a finished meeting. Run on the seeded LOCAL chain (a real meeting needs 7 real
// UTC days on mainnet). The README labels these as the local test chain.
import { test, expect } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { seed, lists } from "./support/chain";

test.skip(!!process.env.MAINNET, "local chain only");
mkdirSync("docs/screenshots", { recursive: true });
const S = seed();
const { L, R } = lists();

test("the meeting (local chain)", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`/w/${S.met}`, { waitUntil: "networkidle" });
  await expect(page.getByTestId("walk-page")).toHaveAttribute("data-status", "met", { timeout: 60_000 });
  await expect(page.getByTestId("postmark")).toBeVisible();
  await page.waitForTimeout(2500);
  await page.screenshot({ path: "docs/screenshots/meeting.png" });
});

test("a Chog's Friend Book (local chain)", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`/chog/${L[41]}`, { waitUntil: "networkidle" });
  await expect(page.getByTestId("book")).toContainText(`#${S.met}`, { timeout: 60_000 });
  await page.waitForTimeout(800);
  await page.screenshot({ path: "docs/screenshots/friend-book.png" });
});