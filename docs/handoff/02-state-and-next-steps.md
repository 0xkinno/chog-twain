# Handoff 02: where we are, what is left, how to continue (read this first)

## Setup in a new environment
```bash
git clone https://github.com/0xkinno/chog-twain && cd chog-twain
git config core.hooksPath .githooks   # authorship: 0xkinno only, never a Co-Authored-By trailer
npm install --legacy-peer-deps
export PATH="$HOME/.foundry/bin:$PATH"   # Foundry 1.8.5
```
Secrets are NOT in git. `.env.local` (gitignored) holds `DEPLOYER_KEY`, `TEST_WALLET_{A,B,C}_KEY` and the NEXT_PUBLIC_* values. Ask Kinnoski for it, or regenerate wallets with `node scripts/gen-wallets.mjs` and re-fund (`docs/wallets.md`).

## Live state
- Vercel: https://chog-twain.vercel.app (project `chog-twain`; `vercel.json` pins Next.js; deployment protection disabled). Redeploy: `npx vercel --prod --yes`.
- Mainnet contracts and lantern price: see `docs/deployment.json` and `PROGRESS.md`. Immutable: never redeploy for a UI change.
- Real walks: `docs/mainnet-state.json` (walk 1 and 2). All mainnet transactions: `docs/evidence-txs.json`, rendered to `EVIDENCE.md` by `node scripts/render-evidence.mjs`.

## What is verified
- `forge test` 42 pass; `npm test` 33 pass; `node scripts/verify.mjs` PASS on mainnet; `node scripts/check-copy.mjs` clean.
- Playwright: `node scripts/e2e.mjs` runs everything on a LOCAL anvil chain (never mainnet). Layout matrix 9 viewports x 14 routes green; demo specs green. `04-mainnet.spec.ts` (set `MAINNET=1 E2E_BASE_URL=https://chog-twain.vercel.app`) passed against the live site, including a real cheer through the UI.

## Demo video (cut it from this)

`docs/demo_video/BRIEF.md` is the brief: the source recording is `docs/demo_video/chog_twain_demo_raw.mp4` (silent, 4:08, about 25 MB; the 166 MB original is on Kinnoski's machine and not in git), a labelled contact sheet and per-10-second frames show what is where, and the brief has the cut list to 2:50 and a 2:40 voice-over script. The picture is already cut (`docs/demo_video/chog_twain_demo_cut_2m50_silent.mp4`). Task: add the voice-over and captions, export 1080p H.264, commit the final as `docs/demo_video/chog_twain_demo_2m50.mp4` (stay under 90 MB) and give Kinnoski the file to upload to YouTube unlisted.

## Demo footage (automated recordings)

`docs/playwright_outputs_for_demo/` holds 1280x800 recordings of every real flow (local chain) plus the specs that made them and a README that maps each clip to a scene of `VIDEO_SCRIPT.md`. Re-record with `node scripts/e2e.mjs -c playwright.demo.config.ts`. Mainnet footage: `MAINNET=1 E2E_BASE_URL=https://chog-twain.vercel.app npx playwright test tests/e2e/04-mainnet.spec.ts --video=on`.

## Open items, in order
1. **Done in this session:** the full Playwright suite is green (146 passed, 0 failed, 4 mainnet-only specs skipped locally and run separately against the live site: 4 passed). FACTS, README and EVIDENCE are rendered (`node scripts/facts.mjs && node scripts/render-readme.mjs && node scripts/render-evidence.mjs`). README screenshots were retaken from the live site.
2. **Lighthouse mobile on `/`** (docs/lighthouse-mobile.json): performance below the 85 target (61 before the thumbnail and code-split work; re-measure), accessibility 100, best practices 100, SEO 100. Remaining cost is the wallet stack (wagmi and viem) hydrating on first load: lazy-load `Providers` or split `WalletCapsule`.
3. CI was failing on a clean checkout because `src/data/chogs.json` is generated: fixed by running `node scripts/gen-assets.mjs` first. Check the next Actions run is green.
4. Break campaign: `node scripts/break-campaign.mjs --invite-expired` on or after 25 Oct (walk 2 older than 3 days).
6. Real testers: two outside wallets walked (walk 3), see `FEEDBACK.md`; three more invites to go.
7. Kinnoski: confirm the dashboard deadline (WAT), invite five people (`FEEDBACK.md`), record the video (`VIDEO_SCRIPT.md`), fill the Discord handle and video link in `SUBMISSION_CHOGATHON.md`, submit 2+ hours early, tag `chogathon-submission`.
7. Nice to have: Lighthouse mobile run on `/`, red-team rounds into `REDTEAM_LOG.md`, Monad testnet deploy for D8, WalletConnect (needs a project id), branch protection on GitHub.

## Gotchas learned
- `$CHOG` is scarce in the test wallets (A 75, B 75, C 20 left): do not spend more than needed; walk 1 holds 25 each in escrow.
- Monad charges gas limit x price; gas used equals the limit in receipts.
- Public RPC log range is 100 blocks; never scan logs in the browser. `verify.mjs` reads logs in windows.
- In PowerShell, write files with a UTF-8 encoding that has no BOM (Solidity and TOML break otherwise).
- Next dev server races on parallel art requests; test against `next build && next start` (what `e2e.mjs` does).
- House style: no em or en dashes, no emoji, no hype words; `npm run check:copy` enforces it. Never name other Chogathon entries in committed files.