# Playwright outputs for the demo video

Real recordings of Chog Twain's flows, made with Playwright Chromium at 1280x800 with a 250 ms slow-motion so every click is
readable. Use them as raw footage for the 2:50 demo film (see `VIDEO_SCRIPT.md`), or re-record them.

**What these are:** the real UI sending real transactions, but on a **local anvil chain** with mock Chog Genesis and mock
\ (a real meeting needs 7 real UTC days on mainnet). Say so in the film where a meeting is shown. Mainnet footage of
walk 1 comes from the live site (see "Record on mainnet" below).

## Files

- `videos/<test name>/video.webm`: one recording per test that used the default page (the demo, the landing page).
- `videos/wallet-<account>-<timestamp>/*.webm`: one recording per wallet in the real-chain flows (account 1 is the opener,
  2 the friend, 3 and 4 a second pair, 7 a fan with no Chog, 9 the holder).
- `specs/`: the exact specs and the config that produced them.
- `results.json`: the Playwright JSON report (18 tests passed on the last recording run).

## Videos in this folder

- `videos/03-demo-copy-rules-hold-in-04fcd-n-dashes-on-any-public-page-chromium/video.webm  (0.9 MB)`
- `videos/03-demo-demo-no-wallet-not-00406-eits-the-pledge-in-the-demo-chromium/video.webm  (0.3 MB)`
- `videos/03-demo-demo-no-wallet-not-22fc7-e-in-the-break-a-rule-panel-chromium/video.webm  (0.7 MB)`
- `videos/03-demo-demo-no-wallet-not-2dc5e--rules-engine-with-real-art-chromium/video.webm  (0.5 MB)`
- `videos/03-demo-demo-no-wallet-not-f36a0-ith-the-contract-s-sentence-chromium/video.webm  (0.3 MB)`
- `videos/03-demo-the-landing-page-d-cf6ab-data-the-scroll-story-walks-chromium/video.webm  (0.6 MB)`
- `videos/wallet-1-1792638810196/page@42d6325a18c5ebf5604507f556bccbb3.webm  (0.5 MB)`
- `videos/wallet-1-1792638814575/page@e426190dbb9607beb0568f90072217a3.webm  (0.9 MB)`
- `videos/wallet-1-1792638822213/page@fe55589b6d670d3d26ca3487ec7fb53a.webm  (0.3 MB)`
- `videos/wallet-1-1792638831657/page@b6a0b1707731e037ef2b2e8cb9e90b16.webm  (0.5 MB)`
- `videos/wallet-1-1792638850568/page@eb22a83d992524ab0a6ba5e71de7c8aa.webm  (0.3 MB)`
- `videos/wallet-1-1792638882551/page@03f4a4f310dc0d379cb51613035466ec.webm  (0.7 MB)`
- `videos/wallet-1-1792638893946/page@d4d92179836d076af1ac928f65dae69f.webm  (0.1 MB)`
- `videos/wallet-2-1792638825451/page@8f03833bedc90abe5d5d9ffb9858fa54.webm  (0.8 MB)`
- `videos/wallet-2-1792638846472/page@642adc06d304c1587e7bc98d1db05e4a.webm  (0.5 MB)`
- `videos/wallet-2-1792638891417/page@b6b80dbac685d8b28133c46fccf54bad.webm  (0.3 MB)`
- `videos/wallet-3-1792638877106/page@c7bd1c03bfcc1045b15075af1531a4e0.webm  (0.3 MB)`
- `videos/wallet-4-1792638866874/page@6f7161f6bbdef470c4acbd563b9a9c4a.webm  (0.7 MB)`
- `videos/wallet-6-1792638888133/page@cc55f8b4fd767663cd01f9e49ca4623f.webm  (0.4 MB)`
- `videos/wallet-7-1792638835771/page@370b1f5bdab9655cc8c724f0525c0002.webm  (0.7 MB)`
- `videos/wallet-7-1792638842738/page@f6ffe85a1cacfb0110dec6a90348652c.webm  (0.4 MB)`
- `videos/wallet-8-1792638874369/page@1e23ff363e4d902bcbe95b7eea2c7805.webm  (0.3 MB)`
- `videos/wallet-9-1792638879471/page@17637d7fd1ca8e8bc18cc6023ddade48.webm  (0.4 MB)`

## Which footage for which scene of `VIDEO_SCRIPT.md`

| Scene | Footage |
|---|---|
| 0:25 to 1:15 open a walk, friend joins, I'm here, the step, the postmark, the calendar | wallet 1 (open), wallet 2 (join with the facing-only picker), wallet 1 again (I'm here with a note) from `02-flows.spec.ts` |
| 1:15 to 1:40 a missed day, drift, lantern, poke, walk away | the demo loop (`03-demo.spec.ts`, "the full loop on the local rules engine") and wallet 7 (the fan) |
| 1:40 to 2:05 a real meeting, postcards, Friend Books | the "a full meeting" test: the last arrival uses the meeting gas path, then both postcards and both Friend Books |
| 2:05 to 2:30 proof, the Break a rule panel | "every contract error has its sentence" in `03-demo.spec.ts`; the Proof page from the mainnet run |

## Re-record

`ash
# local chain, seeded, app built against it, every flow recorded (about 2 minutes)
node scripts/e2e.mjs -c playwright.demo.config.ts
`

## Record on mainnet (the live site)

Uses the Chog Twain test wallets in `.env.local` (never printed). Small real transactions: a cheer costs about 0.006 MON.

`ash
MAINNET=1 E2E_BASE_URL=https://chog-twain.vercel.app npx playwright test tests/e2e/04-mainnet.spec.ts
`

That run also regenerates `docs/screenshots/banner.png`, `walk-mainnet.png` and `proof.png` used by the README.
To record video on mainnet add `--video=on` to the command.

## Tips for the film

- Keep real numbers on screen: the Heartbeat and the walk page show live values.
- The meeting postmark thumps for about a second: hold the shot for two.
- Do not claim a meeting happened on mainnet before it has (the first can land on 28 Oct, UTC).