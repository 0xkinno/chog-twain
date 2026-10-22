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

## Open items, in order
1. **Real-chain flow spec** `tests/e2e/02-flows.spec.ts`: last fix was rendering `TxPostmark` in the "opened" state of `OpenWalk.tsx` and making `runTx` return at "proposed" (finality is stamped asynchronously; a local chain uses the `latest` tag). Re-run `node scripts/e2e.mjs tests/e2e/02-flows.spec.ts tests/e2e/05-shots.spec.ts`; fix what fails (tests were written ahead of running, expect small selector fixes). Later tests in the file are serial and skip after a failure.
2. After a green run: `node scripts/summarize-playwright.mjs`, `node scripts/facts.mjs`, `node scripts/render-readme.mjs`, `node scripts/render-evidence.mjs`, commit. README FACTS blocks currently show placeholders until facts.mjs is run.
3. Screenshots for the README: `docs/screenshots/{banner,walk-mainnet,proof}.png` come from `MAINNET=1 E2E_BASE_URL=... npx playwright test tests/e2e/04-mainnet.spec.ts`; `meeting.png` and `friend-book.png` come from `05-shots.spec.ts` (local chain). Copy `banner.png` to `docs/banner.png`.
4. Redeploy to Vercel after the last UI fixes (spread chair fix, tx.ts change, demo fixes are not yet live).
5. Break campaign: `node scripts/break-campaign.mjs --invite-expired` on or after 25 Oct (walk 2 older than 3 days).
6. Kinnoski: confirm the dashboard deadline (WAT), invite five people (`FEEDBACK.md`), record the video (`VIDEO_SCRIPT.md`), fill the Discord handle and video link in `SUBMISSION_CHOGATHON.md`, submit 2+ hours early, tag `chogathon-submission`.
7. Nice to have: Lighthouse mobile run on `/`, red-team rounds into `REDTEAM_LOG.md`, Monad testnet deploy for D8, WalletConnect (needs a project id), branch protection on GitHub.

## Gotchas learned
- `$CHOG` is scarce in the test wallets (A 75, B 75, C 20 left): do not spend more than needed; walk 1 holds 25 each in escrow.
- Monad charges gas limit x price; gas used equals the limit in receipts.
- Public RPC log range is 100 blocks; never scan logs in the browser. `verify.mjs` reads logs in windows.
- In PowerShell, write files with a UTF-8 encoding that has no BOM (Solidity and TOML break otherwise).
- Next dev server races on parallel art requests; test against `next build && next start` (what `e2e.mjs` does).
- House style: no em or en dashes, no emoji, no hype words; `npm run check:copy` enforces it. Never name other Chogathon entries in committed files.