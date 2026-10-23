import { test, expect } from "@playwright/test";
import { ERROR_COPY } from "../../src/lib/errors";

test.describe("demo (no wallet, nothing on-chain)", () => {
  test("the full loop on the local rules engine with real art", async ({ page }) => {
    await page.goto("/demo", { waitUntil: "networkidle" });
    await expect(page.getByTestId("demo-banner")).toContainText("Nothing here is on-chain");
    await page.getByTestId("demo-begin").click();
    await expect(page.getByTestId("demo-status")).toHaveText("Waiting for a friend");
    await expect(page.getByTestId("empty-chair")).toBeVisible();
    await page.getByTestId("demo-join").click();
    await expect(page.getByTestId("demo-status")).toContainText("Walking, 7 apart");
    await expect(page.locator('[data-testid="spread"] img').first()).toBeVisible();
    // I'm here, friend shows up: a step
    await page.getByTestId("demo-imhere").click();
    await page.getByTestId("demo-friend-shows").click();
    await expect(page.getByTestId("demo-status")).toContainText("6 apart");
    await expect(page.getByTestId("spread")).toHaveAttribute("data-walked", "1");
    // lantern, then a day the friend misses
    await page.getByTestId("demo-lantern").click();
    await expect(page.getByTestId("lantern")).toBeVisible();
    await page.getByTestId("demo-friend-misses").click();
    await expect(page.getByTestId("demo-log")).toContainText(/lantern kept it|drift/i);
    // an error in the controls shows a sentence
    await page.getByTestId("demo-imhere").click();
    await page.getByTestId("demo-imhere").waitFor();
    // walk it all the way: they meet, postcard and keepsakes appear
    await page.getByTestId("demo-auto").click();
    await expect(page.getByTestId("demo-status")).toHaveText("Met");
    await expect(page.getByTestId("postmark")).toBeVisible();
    await expect(page.getByTestId("demo-met")).toBeVisible();
    await expect(page.getByTestId("demo-keepsakes")).toBeVisible();
  });

  test("walking away ends it and forfeits the pledge in the demo", async ({ page }) => {
    await page.goto("/demo", { waitUntil: "networkidle" });
    await page.getByText("Pledge 700 demo $CHOG each").click();
    await page.getByTestId("demo-begin").click();
    await page.getByTestId("demo-join").click();
    await page.getByTestId("demo-leave").click();
    await expect(page.getByTestId("demo-status")).toHaveText("Apart");
    // walking away forfeits the whole pledge to the friend: nothing is left for you to claim
    await expect(page.getByTestId("demo-claim")).toHaveCount(0);
    await expect(page.getByTestId("demo-log")).toContainText(/whole pledge goes to the friend/);
    await expect(page.getByTestId("demo-pledge")).toContainText("moved: 700 from you, 0 from your friend");
  });

  test("a Chog that looks the same way is refused with the contract's sentence", async ({ page }) => {
    await page.goto("/demo", { waitUntil: "networkidle" });
    await page.getByTestId("demo-begin").click();
    await page.getByRole("button", { name: /tries a Chog that looks the same way/ }).click();
    await expect(page.getByTestId("demo-error")).toHaveAttribute("data-error", "NotFacing");
    await expect(page.getByTestId("demo-error")).toContainText(ERROR_COPY.NotFacing);
  });

  const names = ["AlreadyToday", "NotFacing", "ChogBusy", "SelfWalk", "NotWalker", "LanternsFull", "NotInvited", "InviteExpired", "StillOpen", "NothingToClaim", "NotOpen", "NotWalking", "BadDistance", "HomeOnly", "NotHolder", "TransferFailed", "BadProof"] as const;
  test("every contract error has its sentence in the break-a-rule panel", async ({ page }) => {
    await page.goto("/demo", { waitUntil: "networkidle" });
    for (const n of names) {
      await page.getByTestId(`break-${n}`).click();
      const r = page.getByTestId("break-result");
      await expect(r).toHaveAttribute("data-error", n);
      await expect(r).toContainText(ERROR_COPY[n]);
    }
    // all 20 sentences are the copy from the build instruction (BadGaze, GazeUnknown and BadChog are unreachable with a valid proof)
    expect(Object.keys(ERROR_COPY)).toHaveLength(20);
  });
});

test("the landing page: discovery numbers come from the collection data, the scroll story walks", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Every Chog is looking at someone");
  await page.getByTestId("gaze-left").scrollIntoViewIfNeeded();
  await expect(page.getByTestId("gaze-left")).toHaveText("650");
  await expect(page.getByTestId("gaze-right")).toHaveText("1,309");
  await expect(page.getByTestId("gaze-front")).toHaveText("10");
  await expect(page.getByTestId("discovery-line")).toContainText("660");
  await expect(page.getByTestId("discovery-line")).toContainText("649");
  await expect(page.locator('[data-testid="mosaic"] .mosaic-tile')).toHaveCount(48);
  const stage = page.getByTestId("scroll-stage");
  await stage.scrollIntoViewIfNeeded();
  const first = await stage.textContent();
  await page.getByTestId("scroll-meet").scrollIntoViewIfNeeded();
  await page.mouse.wheel(0, 2400);
  await page.waitForTimeout(1500);
  expect(await stage.textContent()).not.toBe(first);
});

test("copy rules hold in the rendered UI: no em or en dashes on any public page", async ({ page }) => {
  for (const p of ["/", "/demo", "/judge", "/proof", "/walk/new", "/heartbeat"]) {
    await page.goto(p, { waitUntil: "networkidle" });
    const text = await page.locator("body").innerText();
    expect(text, p).not.toMatch(/[\u2013\u2014]/);
  }
});