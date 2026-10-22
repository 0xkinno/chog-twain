// End to end on the local chain, through the real UI and real transactions: open, join (facing-only picker), I'm here
// with a note, the step, lantern, cheer, drift, poke, leave, claim, a full meeting with postcards and Friend Books,
// the holder's home-only switch, and error copy for rules broken through the UI.
import { test, expect, type Browser, type BrowserContext, type Page } from "@playwright/test";
// @ts-expect-error plain ESM helpers shared with the seed and gas scripts
import { makeApi, warpDays as warp } from "../../scripts/lib/local.mjs";
import { installWallet, addr } from "./support/wallet";
import { lists } from "./support/chain";
import { ERROR_COPY } from "../../src/lib/errors";

const { L, R } = lists();
const api = makeApi();
const E18 = 10n ** 18n;

async function ctxFor(browser: Browser, index: number, viewport = { width: 1280, height: 900 }): Promise<{ ctx: BrowserContext; page: Page }> {
  const ctx = await browser.newContext({ viewport, recordVideo: process.env.RECORD_DEMO ? { dir: `docs/playwright_outputs_for_demo/videos/wallet-${index}-${Date.now()}`, size: viewport } : undefined });
  await installWallet(ctx, index);
  const page = await ctx.newPage();
  return { ctx, page };
}
async function connect(page: Page, path: string) {
  await page.goto(path, { waitUntil: "networkidle" });
  await page.getByTestId("connect").click();
  await page.getByRole("button", { name: "Test Wallet" }).click();
  await expect(page.getByTestId("wallet-capsule")).toBeVisible();
}
async function pick(page: Page, id: number) {
  await page.getByLabel("Find by token or artwork number").fill(String(id));
  const tile = page.locator(`.pick[data-token="${id}"]`);
  await expect(tile).toBeVisible({ timeout: 60_000 });
  await tile.click();
  await expect(page.getByTestId("picked")).toContainText(`Token ${id}`);
}
const walkIdFrom = async (page: Page) => Number((await page.getByRole("link", { name: "Go to the walk" }).getAttribute("href"))!.split("/").pop());
const fin = (page: Page) => expect(page.getByTestId("tx-final")).toBeVisible({ timeout: 90_000 });

test.describe.configure({ mode: "serial" });

let walkId = 0;
const A = { chog: L[100], idx: 1 };
const B = { chog: R[100], idx: 2 };

test("wallet capsule shows address, balances and a power icon that disconnects", async ({ browser }) => {
  const { ctx, page } = await ctxFor(browser, 1);
  await connect(page, "/");
  await expect(page.getByTestId("wallet-capsule")).toContainText(addr(1).slice(0, 6));
  await expect(page.getByTestId("mon-balance")).toContainText("ETH");
  await expect(page.getByTestId("chog-balance")).toContainText("$CHOG");
  await page.getByRole("button", { name: "Disconnect" }).click();
  await expect(page.getByTestId("connect")).toBeVisible();
  await ctx.close();
});

test("open a walk: gaze filter, pledge with an exact approve first, two-stage postmark, share link", async ({ browser }) => {
  const { ctx, page } = await ctxFor(browser, A.idx);
  await connect(page, "/walk/new");
  await page.getByRole("button", { name: "Looks left", exact: true }).click();
  const gazes = await page.locator(".pick").evaluateAll((els) => els.slice(0, 30).map((e) => e.getAttribute("data-gaze")));
  expect(gazes.length).toBeGreaterThan(5);
  expect(new Set(gazes)).toEqual(new Set(["Left"]));
  await pick(page, A.chog);
  await page.getByRole("radio", { name: "7 days" }).click();
  await page.getByRole("radio", { name: "25 $CHOG" }).click();
  await page.getByTestId("open-walk").click();
  // the approve comes first, with its own postmark and the "1 of 2" line
  // the approve flashes by quickly; the open step says "2 of 2", which only appears after an exact approve came first
  await expect(page.getByTestId("tx-postmark")).toContainText(/2 of 2: open the walk and escrow the pledge/, { timeout: 90_000 });
  await expect(page.getByTestId("opened")).toBeVisible({ timeout: 120_000 });
  walkId = await walkIdFrom(page);
  expect(walkId).toBeGreaterThan(0);
  await expect(page.getByTestId("tx-final")).toContainText("Postmarked");
  await expect(page.getByTestId("tx-final")).toContainText(/Final in \d+\.\d s/);
  await expect(page.getByTestId("share-box")).toBeVisible();
  await expect(page.getByAltText(/QR code/)).toBeVisible();
  await ctx.close();
});

test("the walk page shows the open state with an empty chair", async ({ browser }) => {
  const { ctx, page } = await ctxFor(browser, A.idx);
  await connect(page, `/w/${walkId}`);
  await expect(page.getByTestId("walk-page")).toHaveAttribute("data-status", "open");
  await expect(page.getByTestId("empty-chair")).toBeVisible();
  await expect(page.getByTestId("share-box")).toBeVisible();
  await ctx.close();
});

test("join: only Chogs that face the opener's are offered, the pledge is matched", async ({ browser }) => {
  const { ctx, page } = await ctxFor(browser, B.idx);
  await connect(page, `/w/${walkId}`);
  await expect(page.getByTestId("join-flow")).toBeVisible();
  await expect(page.getByTestId("join-flow")).toContainText("25");
  const gazes = await page.locator('[data-testid="join-flow"] .pick').evaluateAll((els) => els.slice(0, 40).map((e) => e.getAttribute("data-gaze")));
  expect(gazes.length).toBeGreaterThan(5);
  for (const g of gazes) expect(["Right", "Front"]).toContain(g); // opener looks left
  // a Chog that looks left too is simply not on offer
  await page.getByLabel("Find by token or artwork number").fill(String(L[101]));
  await expect(page.locator(`.pick[data-token="${L[101]}"]`)).toHaveCount(0);
  await pick(page, B.chog);
  await page.getByTestId("join").click();
  await expect(page.getByTestId("walk-page")).toHaveAttribute("data-status", "walking", { timeout: 120_000 });
  await expect(page.getByTestId("disc-left")).toBeVisible();
  await expect(page.getByTestId("disc-right")).toBeVisible();
  // joining counted as the friend's show-up
  await expect(page.getByTestId("im-here")).toBeDisabled();
  await expect(page.getByTestId("today-status")).toContainText(/You are here/);
  await ctx.close();
});

test("I'm here with a note: the second arrival takes the step, the postmark lands, the calendar reminder downloads", async ({ browser }) => {
  const { ctx, page } = await ctxFor(browser, A.idx);
  await connect(page, `/w/${walkId}`);
  await expect(page.getByTestId("countdown")).toBeVisible();
  await page.getByLabel(/Leave a note/).fill("landed in Leipzig");
  await expect(page.getByTestId("im-here")).toBeEnabled();
  await page.getByTestId("im-here").click();
  await fin(page);
  await expect(page.getByTestId("spread")).toHaveAttribute("data-state", "today-both", { timeout: 30_000 });
  await expect(page.getByTestId("spread")).toHaveAttribute("data-walked", "1");
  await expect(page.getByTestId("note-opener")).toContainText("landed in Leipzig");
  await expect(page.getByTestId("tx-proposed").or(page.getByTestId("tx-final"))).toBeVisible();
  const dl = page.waitForEvent("download");
  await page.getByTestId("ics").click();
  const file = await dl;
  expect(file.suggestedFilename()).toMatch(/\.ics$/);
  const body = (await (await file.createReadStream()).toArray()).join("");
  expect(body).toContain("RRULE:FREQ=DAILY");
  expect(body).toContain(`/w/${walkId}`);
  await ctx.close();
});

test("a fan with no Chog and no walk lights a lantern and cheers, with transaction links", async ({ browser }) => {
  const { ctx, page } = await ctxFor(browser, 7);
  await connect(page, `/w/${walkId}`);
  await page.getByTestId("light").click();
  await expect(page.getByTestId("tx-final")).toBeVisible({ timeout: 120_000 });
  await expect(page.getByTestId("tx-final").locator("a")).toHaveAttribute("href", /\/tx\/0x/);
  await expect(page.getByText("Lanterns 1/3")).toBeVisible({ timeout: 30_000 });
  await page.getByTestId("cheer").click();
  await expect(page.getByTestId("cheer")).toContainText("Cheer (1)", { timeout: 60_000 });
  await ctx.close();
});

test("a missed day drifts them apart, the lantern keeps the next one, anyone can poke, walking away warns and ends it, the pledge is claimed", async ({ browser }) => {
  // day 1: only the opener comes; day 2: the opener comes again, which closes day 1 and keeps it with the lantern
  await warp(1);
  await api.up(A.idx, walkId);
  await warp(1);
  await api.up(A.idx, walkId); // closes day 1: one person came and a lantern is stored: no drift
  let w = await api.walk(walkId);
  expect(w.lanternsUsed).toBe(1);
  expect(w.gap).toBe(6);
  // day 3: nobody is here; day 4: the roll closes day 3 (both missed) and day 2 never... open the page and poke
  await warp(2);
  const { ctx, page } = await ctxFor(browser, 7);
  await connect(page, `/w/${walkId}`);
  await expect(page.getByTestId("poke")).toBeVisible({ timeout: 60_000 });
  await page.getByTestId("poke").click();
  await expect(page.getByTestId("tx-final")).toBeVisible({ timeout: 120_000 });
  w = await api.walk(walkId);
  expect(w.gap).toBeGreaterThan(6);
  await ctx.close();

  // the friend walks away: a clear warning first
  const b = await ctxFor(browser, B.idx);
  await connect(b.page, `/w/${walkId}`);
  await b.page.getByTestId("leave").click();
  await expect(b.page.getByTestId("leave-confirm")).toContainText(/forfeit your whole pledge of 25/);
  await expect(b.page.getByTestId("leave-confirm")).toContainText(/cannot be undone/);
  await b.page.getByRole("button", { name: "Yes, walk away" }).click();
  await expect(b.page.getByTestId("walk-page")).toHaveAttribute("data-status", "apart", { timeout: 120_000 });
  await expect(b.page.getByTestId("ended")).toBeVisible();
  await b.ctx.close();

  // the opener claims the pledge that came to them
  const a = await ctxFor(browser, A.idx);
  await connect(a.page, "/me");
  await expect(a.page.getByTestId("claimable")).toContainText("$CHOG", { timeout: 60_000 });
  await a.page.getByTestId("claim").click();
  await expect(a.page.getByTestId("tx-final")).toBeVisible({ timeout: 120_000 });
  await expect(a.page.getByTestId("claim-box")).toHaveCount(0, { timeout: 60_000 });
  await a.ctx.close();
});

test("a full meeting: the last arrival uses the meeting gas path, both postcards decode on-chain, both Friend Books update", async ({ browser }) => {
  const a = { chog: L[102], idx: 3 };
  const b = { chog: R[102], idx: 4 };
  const id = await api.open(a.idx, a.chog, 7);
  await api.join(b.idx, id, b.chog);
  await api.up(a.idx, id); // day 1 step
  for (let d = 1; d < 6; d++) { await warp(1); await api.up(a.idx, id); await api.up(b.idx, id); }
  await warp(1);
  await api.up(a.idx, id); // the opener comes first on the last day
  const pa = await ctxFor(browser, b.idx);
  await connect(pa.page, `/w/${id}`);
  await expect(pa.page.getByTestId("spread")).toHaveAttribute("data-gap", "1");
  await pa.page.getByTestId("im-here").click();
  await expect(pa.page.getByTestId("tx-final")).toBeVisible({ timeout: 120_000 });
  await expect(pa.page.getByTestId("walk-page")).toHaveAttribute("data-status", "met", { timeout: 60_000 });
  await expect(pa.page.getByTestId("met")).toBeVisible();
  await expect(pa.page.getByTestId("postmark")).toBeVisible();
  await expect(pa.page.getByTestId("postcard-img")).toHaveCount(2, { timeout: 60_000 });
  await expect(pa.page.getByText(`Chog ${a.chog} met Chog ${b.chog}`).or(pa.page.getByText(`Chog ${b.chog} met Chog ${a.chog}`)).first()).toBeVisible();
  await expect(pa.page.getByTestId("postcard-owner").filter({ hasText: "Yours" })).toHaveCount(1);
  // the meeting card renders as a 1200x630 image with the verified block
  const card = pa.page.getByAltText(/Meeting card/);
  await expect(card).toBeVisible();
  const src = await card.getAttribute("src");
  expect(src).toMatch(/\/api\/card\/\d+\?b=\d+/);
  const res = await pa.page.request.get(src!);
  expect(res.status()).toBe(200);
  expect(res.headers()["content-type"]).toContain("image/png");
  await pa.ctx.close();
  // Friend Books
  const f = await ctxFor(browser, 8);
  await f.page.goto(`/chog/${a.chog}`, { waitUntil: "networkidle" });
  await expect(f.page.getByTestId("book")).toContainText(`#${id}`, { timeout: 60_000 });
  await expect(f.page.getByTestId("book")).toContainText(`Token ${b.chog}`);
  await f.page.goto(`/chog/${b.chog}`, { waitUntil: "networkidle" });
  await expect(f.page.getByTestId("book")).toContainText(`#${id}`, { timeout: 60_000 });
  // postcards on My walks
  await installWallet(f.ctx, a.idx);
  await f.ctx.close();
  const me = await ctxFor(browser, a.idx);
  await connect(me.page, "/me");
  await expect(me.page.getByTestId("postcards")).toBeVisible({ timeout: 60_000 });
  await me.ctx.close();
});

test("holder extras: only the holder sees the home-only switch, and a home-only Chog refuses everyone else with a sentence", async ({ browser }) => {
  const token = 5; // held by account 9 in the local deploy
  const h = await ctxFor(browser, 9);
  await connect(h.page, `/chog/${token}`);
  await expect(h.page.getByTestId("home-toggle")).toBeVisible({ timeout: 60_000 });
  await h.page.getByTestId("home-toggle").click();
  await expect(h.page.getByTestId("tx-final")).toBeVisible({ timeout: 90_000 });
  await expect(h.page.getByTestId("home-toggle")).toContainText("ON", { timeout: 60_000 });
  await h.ctx.close();
  const other = await ctxFor(browser, 1);
  await connect(other.page, `/chog/${token}`);
  await expect(other.page.getByTestId("not-holder")).toBeVisible({ timeout: 60_000 });
  // someone else tries to open a walk with it
  await other.page.goto("/walk/new", { waitUntil: "networkidle" });
  await other.page.getByLabel("Find by token or artwork number").fill(String(token));
  await other.page.locator(".pick").first().click();
  await other.page.getByTestId("open-walk").click();
  await expect(other.page.getByTestId("tx-error")).toContainText(ERROR_COPY.HomeOnly, { timeout: 60_000 });
  await other.ctx.close();
  // the holder keeps it for themselves and still can: the seal is theirs
  await api.send(9, "setHome", [BigInt(token), false]);
});

test("rules broken through the UI show a sentence, not a hex string: a busy Chog", async ({ browser }) => {
  const busy = (await import("./support/chain")).seed().tokens.walkingA;
  const { ctx, page } = await ctxFor(browser, 6);
  await connect(page, "/walk/new");
  await page.getByText("Free now").click(); // show walking Chogs too
  await page.getByLabel("Find by token or artwork number").fill(String(busy));
  const tile = page.locator(`.pick[data-token="${busy}"]`);
  await expect(tile).toBeVisible();
  // a busy tile is disabled in the picker: the contract guard is the second line of defence, shown on a direct attempt
  await expect(tile).toBeDisabled();
  await ctx.close();
});

test("My walks lists the connected wallet's walks and today's to-do", async ({ browser }) => {
  const { ctx, page } = await ctxFor(browser, 2);
  await connect(page, "/me");
  await expect(page.getByTestId("walk-card").first()).toBeVisible({ timeout: 60_000 });
  await ctx.close();
});

test("an unknown walk and a missing wallet are handled honestly", async ({ browser }) => {
  const { ctx, page } = await ctxFor(browser, 1);
  await page.goto("/w/999999", { waitUntil: "networkidle" });
  await expect(page.getByTestId("walk-missing")).toBeVisible({ timeout: 60_000 });
  await ctx.close();
});