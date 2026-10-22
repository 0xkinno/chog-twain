# TASK.md: Chog Twain

Ticked `[x]` only when verified (test passing, page looked at, link opened). Open items say why.
Last updated 2026-10-22. Handoff notes for the next agent: `docs/handoff/` (start with `02-state-and-next-steps.md`).

## Phase 0. Setup and authorship

- [x] Read the build instruction (kept in `reference/`, gitignored). The three companion files it names (ADVANCED_BUILD_STRATEGY, NEW_INSTRUCTION, Enhanced_buildrules) were not supplied; the instruction alone was followed
- [x] Repo `0xkinno/chog-twain`; kit copied in
- [x] `git config user.name 0xkinno`, email, `core.hooksPath .githooks`; `git log` shows no trailer
- [x] Pushed to https://github.com/0xkinno/chog-twain
- [ ] Confirm the `no-claude-attribution` workflow is green on GitHub and protect `main` with it (needs the GitHub UI)
- [x] Study repos cloned into `reference/`; `reference/` is gitignored
- [x] `reference/BANNED_NAMES.txt`
- [x] `RULES_EXTRACT.md` (a faithful summary: the fetch tool returned a paraphrase, not verbatim; re-copy by hand before submitting). Deadline 23 Oct 2026 15:00 UTC = 16:00 WAT, **UNKNOWN** until confirmed on the dashboard

## Phase 1. Discovery and data

- [x] Foundry 1.8.5 (sha256 checked) and Node 24; `forge test` passes (kit had 24, now 42)
- [x] Experiments D1 to D13 in `DISCOVERY.md` with real outputs (D7 measured on mainnet; **D8 UNKNOWN**: needs Monad testnet gas)
- [x] Collection rebuilt from chain and IPFS (block 115,395,963, sha256 per file)
- [x] `build:gaze`: 650 / 1,309 / 10, root `0x7cb42ed2...63e4`; data committed
- [x] D4 looked at (moderate confidence); hero pair token 1 (CHOG #1462, left) and token 846 (CHOG #338, right)
- [x] `scripts/gen-compat-test.mjs` regenerates `GazeProofCompat.t.sol` from our `gaze.json`; tests pass
- [x] `MOMENT.md`, `THESIS.md` (pitch, guarantee, vocabulary, name rationale and search), `PROOF_PLAN.md`
- [x] Commitment-contract paper: **left out on purpose** (not opened, so no figure quoted)
- [x] App deployed to Vercel project `chog-twain`: https://chog-twain.vercel.app

## Phase 2. Contracts live

- [x] Extra tests: cancel, join after cancel, claim twice, leave before miss, both miss, distance 30, met Chog walks again, postcard tokenURI decodes, note stored
- [x] Invariant suite (6 actors; I6, I9, gap bounds, steps monotonic, met implies steps >= distance, two postcards per meeting)
- [x] `test_noNftWrites` plus `scripts/check-no-nft-writes.mjs`
- [x] `src/ablation/ChogTwainLoose.sol`
- [x] `script/DeployTestnet.s.sol` with mocks written and compiled
- [ ] Deploy to Monad testnet and verify (needs testnet MON from the faucet, which needs a browser captcha)
- [x] Gas table: 20 calls per function, two wallets, `src/lib/gas-limits.json` incl. `showUpMeet` (local EVM). The app sends max(table, 1.25 x live estimate)
- [x] D7 and latency on mainnet (gas used equals gas limit; tight limit 30% cheaper; median 1,171 ms proposed, 2,013 ms final, 20 samples). **D8 not run** (testnet)
- [x] **ASK** lantern price: **50 $CHOG** (Kinnoski approved 50 or 65 on 21 Oct); pledge presets 0 / 10 / 25
- [x] **ASK** mainnet deploy: `ChogTwain` 0x00e17D2072855159C8fb0519c3Afd3a914474DF8, `TwainPostcard` 0x3D83641BFE0446D5fEc07aa16Bd0d35d9422BFB3, both verified on Sourcify; `EVIDENCE.md`
- [ ] **ASK** Kinnoski and friends open and join the first real walks. Done so far by the builder's test wallets: walk 1 (pledge 25 each, note, lantern, cheer), walk 2 open. Friends still to invite
- [x] `MONAD_SURFACE.md` with file:line and the "not used" list

## Phase 3. Rules engine and data plumbing

- [x] `packages/rules/engine.ts` and Vitest (33 tests)
- [x] 18 scenarios pass in Vitest and in Foundry (`Scenarios.t.sol`)
- [x] `scene.ts` (pages, trait weather, states) with determinism tests
- [x] `keepsakes.ts` with tests
- [x] `src/lib`: chains (fallback RPCs, reports which answered), contracts, picker, errors, tx (two-stage postmark), ics
- [x] `/api/art/[tokenId]` (gateway fallback, disk cache, shipped hero art, immutable cache, `X-Art-Gateway`, designed rest tile)
- [x] `/api/card/[walkId]` 1200x630, block shown only if verified (checked in the local run)

## Phase 4. The complete flow on mainnet (any wallet, no Chog)

- [x] Wallet modal: EIP-6963 list, mobile deep link, switch to Monad, capsule with balances and power icon. WalletConnect: dependency installed, **not wired** (optional, needs a project id)
- [x] `/walk/new`: picker, distance, pledge (exact approve first), invitee, share link and QR
- [x] `/w/[id]` open state with facing-only join and pledge match
- [x] `/w/[id]` walking state: spread, footprints, today status, I'm here with note, countdown, lanterns, pledge, notes, cheer, calendar, poke, leave with warning
- [x] Met and apart states, postcards from on-chain `tokenURI` (local chain)
- [x] `/me`, `/chog/[id]` (holder home-only toggle covered on the local chain)
- [x] Every write: simulate, mapped error, explicit gas, proposed then finalized postmark, fee shown
- [x] A fan wallet with no Chog and no walk lit a lantern and cheered on mainnet; tx links in `EVIDENCE.md` (cheer also through the live UI)

## Phase 5. Design pass

- [x] Fonts, `tokens.css`, paper grain
- [x] SVG set: wordmark, mark, footprints, stamps, postmark, lantern, pledge jar, luggage tag, power icon, folio line
- [x] NavCapsule (glowing square capsule, bottom dock on mobile)
- [x] GlowCard with cursor light
- [x] Spread (pages by gaze, 1:1 placement, gaze line draws in, portrait on mobile, empty chair on either page)
- [x] Landing sections 1 to 9 with ScrollMeet
- [x] Step and meeting animations; reduced-motion variants
- [x] Backdrop: the supplied paper-cut valley, placed behind the cover with a wash under the type
- [x] Favicon set, per-route OG images (`/og/[name]`), page titles

## Phase 6. Demo, Heartbeat, Proof, Judge, real users

- [x] `/demo` full loop on the local engine; Demo banner; every reachable contract error as a sentence
- [x] `/heartbeat` from storage (no log scans)
- [x] `scripts/facts.mjs` and `scripts/render-readme.mjs`; CI fails on diff
- [ ] **ASK** break campaign: 6 of 7 reverted mainnet transactions recorded (NotWalker, AlreadyToday, SelfWalk, NotFacing, BadProof, ChogBusy). **InviteExpired** needs a walk older than 3 days (walk 2, from 25 Oct): `node scripts/break-campaign.mjs --invite-expired`
- [x] `/proof`
- [x] `scripts/verify.mjs`: PASS on mainnet (gaze root, metadata sample, 33 events replayed, postcards)
- [x] `/judge` and `JUDGE.md`
- [ ] Invite five real people from the Chog Discord and X to walk; record in `FEEDBACK.md`. **2 of 5 done** (walk 3 on mainnet: two outside wallets, both returned on day 2); three invites to go

## Phase 7. Quality gates

- [x] `scripts/check-copy.mjs` passes
- [x] Playwright layout matrix: 9 viewports x 14 routes, all green in the final full run; screenshots in `docs/screenshots/matrix` (ignored)
- [x] Playwright flows: demo loop, error copy, facing-only picker, and the real-chain flows (open, join, I'm here, step, lantern, cheer, drift, poke, leave, claim, full meeting with postcards and Friend Books, home only). Whole suite 146 passed, 0 failed; 4 mainnet specs passed separately against the live site. Footage in `docs/playwright_outputs_for_demo/`
- [x] axe zero serious or critical on every route and viewport; zero console errors
- [ ] Lighthouse mobile performance 85+ on `/`: **measured 67** (accessibility 100, best practices 100, SEO 100; `docs/lighthouse-mobile.json`). Not met. Cost: wallet stack hydration. Next step in `docs/handoff/02-state-and-next-steps.md`
- [x] Red-team round 1 (5 roles, run by the build agent itself, stated as such) in `REDTEAM_LOG.md`; an independent fresh-session round is still advisable
- [x] Self-judge scores with evidence in `PROGRESS.md`

## Phase 8. README, video, submission

- [x] README per the template (wordmark, shields, tagline, banner, links, 2x2 screenshots, story, problem, discovery, steps, meeting, explore, essential table, mermaid, ASCII, invariants, Monad, $CHOG, measured, criteria map, honest notes, disclosures, run locally, map, next, license)
- [x] `EVIDENCE.md`, `PROOF.md`, `PROGRESS.md`, `MILESTONE.md`
- [x] `VIDEO_SCRIPT.md`
- [ ] Final demo film: raw recording done by Kinnoski (`docs/demo_video/`); cut, voice-over and export by the cloud agent per `docs/demo_video/BRIEF.md`; Kinnoski uploads it
- [x] `SUBMISSION_CHOGATHON.md` mirrors the form fields 01 to 06
- [x] `THREAD.md`
- [ ] **ASK** Kinnoski submits at least 2 hours before the deadline (target 14:00 WAT, 23 Oct)
- [ ] Tag `chogathon-submission`; freeze the deployment; keep walking during judging