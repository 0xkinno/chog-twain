// The responsive matrix (10.8): 9 viewports x every route. Runs against the seeded local chain so every walk state exists.
import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { mkdirSync } from "node:fs";
import { seed } from "./support/chain";

const VIEWPORTS: [string, number, number][] = [
  ["375x667", 375, 667], ["393x852", 393, 852], ["412x915", 412, 915], ["360x800", 360, 800], ["768x1024", 768, 1024],
  ["834x1194", 834, 1194], ["1366x768", 1366, 768], ["1440x900", 1440, 900], ["1920x1080", 1920, 1080],
];
const S = seed();
const ROUTES: { name: string; path: string; nav?: boolean; heading?: RegExp }[] = [
  { name: "home", path: "/", heading: /looking at/i },
  { name: "walk-new", path: "/walk/new", nav: true, heading: /Start a walk/i },
  { name: "walk-open", path: `/w/${S.open}`, nav: true },
  { name: "walk-walking", path: `/w/${S.walking}`, nav: true },
  { name: "walk-drifted", path: `/w/${S.drifted}`, nav: true },
  { name: "walk-lantern", path: `/w/${S.lantern}`, nav: true },
  { name: "walk-met", path: `/w/${S.met}`, nav: true },
  { name: "walk-apart", path: `/w/${S.apart}`, nav: true },
  { name: "me", path: "/me", nav: true, heading: /My walks/i },
  { name: "chog", path: "/chog/846", heading: /Token 846/ },
  { name: "heartbeat", path: "/heartbeat", nav: true, heading: /Heartbeat/i },
  { name: "proof", path: "/proof", nav: true, heading: /Proof/i },
  { name: "demo", path: "/demo", nav: true, heading: /without a wallet/i },
  { name: "judge", path: "/judge", heading: /judge walk/i },
];

mkdirSync("docs/screenshots/matrix", { recursive: true });

async function scrollAll(page: Page) {
  const h = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < h; y += 600) { await page.evaluate((yy) => window.scrollTo(0, yy), y); await page.waitForTimeout(120); }
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(300);
}

const ONLY = process.env.VP?.split(",");
for (const [vpName, width, height] of VIEWPORTS.filter(([n]) => !ONLY || ONLY.includes(n))) {
  test.describe(`viewport ${vpName}`, () => {
    test.use({ viewport: { width, height } });
    for (const r of ROUTES) {
      test(`${r.name} @ ${vpName}`, async ({ page }) => {
        const errors: string[] = [];
        page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
        page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
        await page.goto(r.path, { waitUntil: "networkidle" });
        await page.waitForSelector("main");
        if (r.name.startsWith("walk-")) await page.waitForSelector('[data-testid="walk-page"]', { timeout: 60_000 });
        if (r.name === "chog") await page.waitForSelector('[data-testid="chog-state"]', { timeout: 60_000 });
        if (r.name === "heartbeat") await page.waitForSelector('[data-testid="hb-walks"]:not(:has-text("..."))', { timeout: 60_000 });
        await page.waitForTimeout(1200); // spread draw-in
        await scrollAll(page);

        // one H1
        expect(await page.locator("h1").count(), "exactly one h1").toBe(1);
        if (r.heading) await expect(page.locator("h1")).toHaveText(r.heading);

        // no horizontal scroll
        const overflow = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
        expect(overflow.sw, `no horizontal scroll (${overflow.sw} > ${overflow.cw})`).toBeLessThanOrEqual(overflow.cw);

        // headings and buttons do not overflow their own box
        const overflowing = await page.evaluate(() =>
          [...document.querySelectorAll("h1,h2,h3,button,.btn")].filter((el) => { const e = el as HTMLElement; return e.offsetParent !== null && e.scrollWidth > e.clientWidth + 1; }).map((el) => `${el.tagName}.${(el as HTMLElement).className}: ${(el.textContent || "").slice(0, 40)}`),
        );
        expect(overflowing, "headings and buttons do not overflow").toEqual([]);

        // no two interactive elements overlap (page coordinates; fixed bars are compared among themselves)
        const overlaps = await page.evaluate(() => {
          type R = { el: Element; x: number; y: number; w: number; h: number; fixed: boolean; label: string };
          const sel = 'a[href],button,input,select,textarea,[role="button"],[tabindex]:not([tabindex="-1"])';
          const items: R[] = [];
          for (const el of document.querySelectorAll(sel)) {
            const b = el.getBoundingClientRect();
            if (b.width < 2 || b.height < 2) continue;
            const cs = getComputedStyle(el);
            if (cs.visibility === "hidden" || cs.display === "none" || (el as HTMLElement).offsetParent === null && cs.position !== "fixed") continue;
            let fixed = false;
            for (let n: Element | null = el; n; n = n.parentElement) if (getComputedStyle(n).position === "fixed") { fixed = true; break; }
            if (el.closest(".sr-only") || (el as HTMLElement).classList.contains("sr-only")) continue;
            items.push({ el, x: b.left + scrollX, y: b.top + (fixed ? 0 : scrollY), w: b.width, h: b.height, fixed, label: `${el.tagName}:${(el.textContent || (el as HTMLInputElement).placeholder || "").trim().slice(0, 24)}` });
          }
          const out: string[] = [];
          for (let i = 0; i < items.length; i++) for (let j = i + 1; j < items.length; j++) {
            const a = items[i], b = items[j];
            if (a.fixed !== b.fixed) continue;
            if (a.el.contains(b.el) || b.el.contains(a.el)) continue;
            const ox = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
            const oy = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
            if (ox > 3 && oy > 3) out.push(`${a.label} x ${b.label}`);
          }
          return out.slice(0, 6);
        });
        expect(overlaps, "no two interactive elements overlap").toEqual([]);

        // hero text does not overlap elements marked data-avoid
        const heroHit = await page.evaluate(() => {
          const h = document.querySelector("h1"); if (!h) return [] as string[];
          const hb = h.getBoundingClientRect();
          return [...document.querySelectorAll("[data-avoid]")].filter((e) => !e.contains(h) && !h.contains(e)).filter((e) => {
            const b = e.getBoundingClientRect();
            return Math.min(hb.right, b.right) - Math.max(hb.left, b.left) > 2 && Math.min(hb.bottom, b.bottom) - Math.max(hb.top, b.top) > 2;
          }).map((e) => e.getAttribute("data-testid") || e.className);
        });
        expect(heroHit, "hero text overlaps nothing marked data-avoid").toEqual([]);

        // nav: the active capsule exists and glows
        if (r.nav) {
          const sel = width <= 720 ? ".dock .nav-active" : ".nav-capsule .nav-active";
          await expect(page.locator(sel).first()).toBeVisible();
          const shadow = await page.locator(sel).first().evaluate((e) => getComputedStyle(e).boxShadow);
          expect(shadow, "active capsule has a glow").not.toBe("none");
        }

        // glow cards change their shadow on hover (desktop)
        if (width >= 1024) {
          const card = page.locator(".glow-card").first();
          if (await card.count()) {
            await card.scrollIntoViewIfNeeded();
            const before = await card.evaluate((e) => getComputedStyle(e).boxShadow);
            await card.hover();
            await page.waitForTimeout(400);
            const after = await card.evaluate((e) => getComputedStyle(e).boxShadow);
            expect(after, "glow card changes shadow on hover").not.toBe(before);
          }
        }

        // axe: zero serious or critical
        const axe = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
        const bad = axe.violations.filter((v) => v.impact === "serious" || v.impact === "critical").map((v) => `${v.id}: ${v.nodes.slice(0, 2).map((n) => n.target.join(" ")).join(" | ")}`);
        expect(bad, "axe serious or critical").toEqual([]);

        // zero console errors
        expect(errors, "console errors").toEqual([]);

        await page.screenshot({ path: `docs/screenshots/matrix/${r.name}-${vpName}.png`, fullPage: true });
      });
    }
  });
}