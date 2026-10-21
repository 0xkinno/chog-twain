# Handoff 01: contracts, rules engine, app, tests (state at this commit)

## Done and verified
- Contracts: 42 Foundry tests pass (37 unit + fuzz, 4 gaze proof compat, 1 scenarios, invariant suite). Added `noteOf` (latest note per walker) so pages never scan logs.
- `packages/rules`: engine, scene, keepsakes. 33 Vitest tests, including the 18 shared scenarios (`fixtures/scenarios`) that also run in Foundry.
- Data: `data/collection.json`, `gaze.json`, `gaze-stats.json` rebuilt by us from chain and IPFS (650 / 1,309 / 10, root 0x7cb42ed2...63e4).
- App: Next.js 15 production build passes (12 routes). Landing, /walk/new, /w/[id], /me, /chog/[id], /heartbeat, /proof, /demo, /judge, /api/art, /api/card, /og.
- Local end-to-end rig: `node scripts/e2e.mjs` starts anvil, deploys with mocks, seeds a walk in every state, builds and serves the app, runs Playwright.

## In progress
- Playwright layout matrix and flow specs (tests/e2e). Fixing overlaps found by the matrix. See `PROGRESS.md`.

## Wallets (keys only in `.env.local`, gitignored)
Deployer 0xd985fb404A1B485A4cDcEDc31C8887274B664690, test A 0xD7258aB151094E953a64223d9D15c27E9F352e9E,
test B 0xAEE0139fcC4fBbA116df5c6F47b780513082Eb0f, test C 0x5F9695D19AECfBF44556a8Da910788BD53a1ebaD.
Fund: deployer 2 MON; A and B 1 MON + 1,500 $CHOG each; C 0.5 MON + 300 $CHOG.

## Next (in order)
1. Kinnoski funds wallets and confirms lantern price (proposal 65 $CHOG, about US$0.098; pledge presets 0 / 150 / 700).
2. `scripts/deploy-mainnet.mjs` (writes NEXT_PUBLIC_TWAIN and POSTCARD to `.env.local`), verify on Sourcify.
3. Wire the env, run flows against mainnet with wallets A, B, C, then `vercel --prod` and set the same NEXT_PUBLIC_* on Vercel.
4. Break campaign, verify.mjs, facts, README, video script.

## Rules
Authorship 0xkinno only; run `git config core.hooksPath .githooks` first in any new environment. No dashes, emoji or hype words (`npm run check:copy`).