# TASK.md: Chog Twain

Work top to bottom. Tick `[x]` only when the item is done and checked (test passing, page looked at, link opened).
Each phase ends with a commit by 0xkinno and an update to `PROGRESS.md`. If an item cannot be done fully, leave it
`[ ]`, write the reason under it, and tell Kinnoski. Items marked **ASK** need Kinnoski's go-ahead first.
Nobody needs to own a Chog for any item in this list.

## Phase 0. Setup and authorship

- [ ] Read `reference/CHOG_TWAIN_BUILD_INSTRUCTION.md`, `ADVANCED_BUILD_STRATEGY.md`, `NEW_INSTRUCTION.md`, `Enhanced_buildrules.md`
- [ ] Create repo `0xkinno/chog-twain`; copy the kit in (contracts/, scripts/, .githooks/, .github/, .claude/, .gitignore, package.json, TASK.md)
- [ ] `git config user.name 0xkinno`, `user.email`, `core.hooksPath .githooks`; first commit; `git log --format='%an %ae %B'` shows no trailer
- [ ] Push; the `no-claude-attribution` workflow passes on GitHub; protect `main` with it
- [ ] Clone the study repos into `reference/`; `git status` ignores `reference/`
- [ ] Write `reference/BANNED_NAMES.txt` (other entries' names, one per line)
- [ ] Copy the live Chogathon page into `RULES_EXTRACT.md`; record the exact deadline in WAT

## Phase 1. Discovery and data

- [ ] Install Foundry and Node 22+; `cd contracts && forge test` shows 24 passing
- [ ] Run experiments D1 to D13; write `DISCOVERY.md` with commands and real outputs
- [ ] `npm install && npm run fetch:collection` (rebuild from chain + IPFS; record block and sha256s)
- [ ] `npm run build:gaze`; commit `data/collection.json`, `data/gaze.json`, `data/gaze-stats.json`
- [ ] Look at 5 Left and 5 Right artworks; record which way "Left" faces (D4); pick the hero pair
- [ ] `scripts/gen-compat-test.mjs` regenerates `test/GazeProofCompat.t.sol` from our own `gaze.json`; tests pass
- [ ] Write `MOMENT.md`, `THESIS.md` (five-line pitch, guarantee, vocabulary, name rationale, name search result), `PROOF_PLAN.md`
- [ ] Find and cite the commitment-contract paper figure, or record that it could not be opened
- [ ] Deploy an empty Next.js app to Vercel project `chog-twain` at its final URL; commit

## Phase 2. Contracts live (everything else depends on real days passing)

- [ ] Add tests: cancel by opener, join after cancel, claim twice, leave before any miss, both miss no forfeit, distance 30, a met Chog walks again, postcard tokenURI decodes
- [ ] Invariant suite `test/ChogTwain.invariant.t.sol` (6 actors; I6, I9, gap bounds, steps monotonic, met implies steps >= distance)
- [ ] `test_noNftWrites` CI check: no write call to the Chog contract exists in `src/`
- [ ] `src/ablation/ChogTwainLoose.sol` for D8
- [ ] `script/DeployTestnet.s.sol` with mock Chog collection and mock $CHOG; deploy to Monad testnet; verify on Sourcify
- [ ] 20+ calls per function with two test wallets; `scripts/gas-table.mjs` writes `src/lib/gas-limits.json` (incl. `showUpMeet`)
- [ ] Measure D7 (fee with wallet default vs our limit), D8 (packed vs loose), proposed and finalized latency (20 samples)
- [ ] **ASK** Propose the lantern price (about US$0.10 of $CHOG at the live price) and suggested pledge sizes; record Kinnoski's numbers
- [ ] **ASK** Deploy `ChogTwain` (with `TwainPostcard`) to Monad mainnet with real Chog Genesis, real $CHOG and our `GAZE_ROOT`; verify both on Sourcify; record in `EVIDENCE.md`
- [ ] **ASK** Kinnoski and two or three friends open and join the first real walks (one with a pledge); first show-ups land; hashes recorded
- [ ] Write `MONAD_SURFACE.md` with file:line per feature and the "not used, so not claimed" list

## Phase 3. Rules engine and data plumbing

- [ ] `packages/rules/engine.ts`: TS port of the contract rules; Vitest tests
- [ ] `fixtures/scenarios/*.json` pass in Vitest and in Foundry (`test/Scenarios.t.sol`)
- [ ] `scene.ts`: spread composition by gaze, trait-to-weather table, states; determinism tests
- [ ] `keepsakes.ts` with tests
- [ ] `src/lib`: chains (fallback RPCs, reports which answered), contracts (addresses + ABIs from forge out), picker (collection + `activeWalkOf` via Multicall3, gaze filter, facing-only for join, "Yours" badge if held), errors copy, tx two-stage postmark, ics builder
- [ ] `/api/art/[tokenId]`: id-to-art mapping, gateway fallback, immutable cache, `X-Art-Gateway`, designed 503 tile
- [ ] `/api/card/[walkId]`: meeting card 1200x630 from chain state and both artworks

## Phase 4. The complete flow on mainnet (any wallet, no Chog)

- [ ] Wallet modal: EIP-6963 list, optional WalletConnect, mobile deep link, switch to Monad, address capsule with MON and $CHOG balances and power-icon disconnect
- [ ] `/walk/new`: picker, distance, optional pledge (exact approve first), optional invitee, share link and QR
- [ ] `/w/[walkId]` open state: join flow offering only facing Chogs, pledge match
- [ ] `/w/[walkId]` walking state: spread, footprints, today status, I'm here with note, countdown to 00:00 UTC, lanterns, pledge state, notes, cheer, calendar reminder, poke when stale, leave with a clear warning
- [ ] `/w/[walkId]` met and apart states; meeting animation; postcard shown from on-chain `tokenURI`
- [ ] `/me`: my walks, today's to-do, postcards, claimable $CHOG with Claim
- [ ] `/chog/[tokenId]`: art, "Token N · CHOG #M", gaze, walking or free, Friend Book, keepsakes; holder-only home toggle
- [ ] Every write: simulate, mapped error, explicit gas, proposed then finalized postmark, fee shown
- [ ] A fan wallet with no Chog and no walk can light a lantern and cheer on mainnet; tx links shown

## Phase 5. Design pass

- [ ] Fonts via `next/font/google` (Bagel Fat One, Fredoka, Nunito, Fraunces, JetBrains Mono); tokens.css; paper grain by script
- [ ] Our SVG set: wordmark, logo mark, footprints, stamps, postmark, lantern, pledge jar, luggage tag, power icon, folio line
- [ ] NavCapsule with glowing square active capsule (desktop) and bottom dock (mobile)
- [ ] GlowCard with cursor-following border light and focus glow
- [ ] Spread component (right-facer left page, left-facer right page, 1:1 placement, gaze line, portrait on mobile)
- [ ] Landing sections 1 to 9 in order, with ScrollMeet
- [ ] Step and meeting animations; reduced-motion variants
- [ ] **ASK** Offer Kinnoski the backdrop prompt; place it if provided, never fighting the type
- [ ] Favicon set, OG image per route, page titles

## Phase 6. Demo, Heartbeat, Proof, Judge, real users

- [ ] `/demo`: full loop on the local engine with real art (Next day, Friend shows up, Friend misses, Light a lantern, Walk away, Meet); "Demo" banner
- [ ] `/heartbeat`: walks today, 14-day steps chart, meetings, $CHOG pledged, burned and moved, most-met Chogs, gaze supply in use
- [ ] `scripts/facts.mjs` writes `docs/FACTS.json`; `scripts/render-readme.mjs` fills FACTS blocks; CI fails on diff
- [ ] **ASK** `scripts/break-campaign.mjs` on mainnet: NotWalker, AlreadyToday, BadProof, SelfWalk, NotFacing, ChogBusy, InviteExpired; hashes in `EVIDENCE.md`
- [ ] `/proof`: addresses, Sourcify links, invariants with test names, the fuzz finding, break links, gas, fees, latencies, which RPC answered
- [ ] `scripts/verify.mjs` prints PASS/FAIL for root rebuild, metadata hashes, walk recompute from events, postcard decode
- [ ] `/judge` and `JUDGE.md`: 60-second, 3-minute, 10-minute paths
- [ ] Invite five real people from the Chog Discord and X to walk; record in `FEEDBACK.md`

## Phase 7. Quality gates

- [ ] `scripts/check-copy.mjs` passes (dashes, emoji, hype words; banned names locally)
- [ ] Playwright layout matrix: 9 viewports x every route, all assertions green; screenshots saved
- [ ] Playwright flows: demo loop, each walk state from fixtures, facing-only picker, error copy
- [ ] axe zero serious or critical; zero console errors; Lighthouse mobile performance 85+ on `/`
- [ ] Red-team rounds (5 roles) until clean; `REDTEAM_LOG.md`
- [ ] Self-judge scores with evidence in `PROGRESS.md`

## Phase 8. README, video, submission

- [ ] README per the template: wordmark, 5 shields, tagline, one-liner, banner, links table, 2x2 screenshots, story, problem with sources, discovery, steps, what the meeting leaves, explore in 2 minutes, essential table, mermaid architecture, ASCII, mermaid sequence, invariants, Monad, $CHOG, measured, criteria map, honest notes, disclosures, run locally, repo map, what's next, license
- [ ] `EVIDENCE.md`, `PROOF.md`, `PROGRESS.md`, `MILESTONE.md` current
- [ ] `VIDEO_SCRIPT.md`; Kinnoski records (2:45 to 2:55); upload to YouTube or Google Drive
- [ ] `SUBMISSION_CHOGATHON.md` mirrors the live form fields 01 to 06
- [ ] `THREAD.md`: X thread with the 20-second hook, video and link
- [ ] **ASK** Kinnoski submits at least 2 hours before the deadline
- [ ] Tag `chogathon-submission`; freeze the deployment; keep walking during judging
