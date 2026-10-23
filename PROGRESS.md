# Progress

Updated 2026-10-22. Handoff for the next agent: `docs/handoff/02-state-and-next-steps.md`.

| Phase | State |
|---|---|
| 0 Setup and authorship | done; GitHub branch protection still to set |
| 1 Discovery and data | done (D8 UNKNOWN) |
| 2 Contracts live | mainnet deployed and verified; first real walks running; testnet and friends outstanding |
| 3 Rules engine and plumbing | done |
| 4 Complete flow on mainnet | done; verified live through the UI on mainnet |
| 5 Design pass | done |
| 6 Demo, Heartbeat, Proof, Judge | done; break campaign 6 of 7 (InviteExpired from 25 Oct); 2 of 5 real testers walked (walk 3), see FEEDBACK.md |
| 7 Quality gates | 146 Playwright tests green (layout matrix, real-chain flows, demo); red team round 1 and self-judge done; Lighthouse mobile performance 67 (target 85 not met), accessibility, best practices and SEO 100 |
| 8 README, video, submission | README, docs, scripts done; final 2:50 film uploaded (see Video link in README); film sources kept locally in `reference/` (gitignored); submission is Kinnoski's |

## Live

- App: https://chog-twain.vercel.app (Vercel project `chog-twain`, env vars set for production)
- Contracts (Monad 143): ChogTwain `0x00e17D2072855159C8fb0519c3Afd3a914474DF8`, TwainPostcard `0x3D83641BFE0446D5fEc07aa16Bd0d35d9422BFB3`
- Lantern 50 $CHOG, pledge presets 0 / 10 / 25
- Real walks: walk 1 (7 days, pledge 25 each, 1 step, lantern lit, first meeting possible 28 Oct) and walk 2 (open)

## Final check (copy of Part 18)

- [x] First screen and first README sentence name people and a problem
- [x] A judge with no wallet can finish the Demo in two minutes
- [x] A judge with any wallet and no Chog can open or join a real walk on mainnet (open and cheer verified through the live UI)
- [ ] At least one real meeting with postcards (earliest 28 Oct, UTC); a real lantern was burned (yes)
- [ ] Break-campaign links: 6 of 7 (InviteExpired pending); every invariant has a passing test (yes)
- [ ] FACTS generated, README rendered, CI green (CI not yet seen green on GitHub), copy check green (yes), attribution check green (to confirm)
- [x] Playwright matrix green on all viewports, axe clean, zero console errors, real-chain flows green (146 passed, 0 failed)
- [x] No other entry named in committed files; `reference/` ignored
- [x] Video under 3 minutes (Kinnoski): https://youtu.be/B1Mk1YjT0Sw
- [ ] Submitted 2+ hours early; tag; deployment frozen (Kinnoski)

## Self-judge (22 Oct 2026, after red-team round 1)

Scored 1 to 5 by the build agent, with evidence. A comparison against other entries is kept out of the repository by rule.

| Criterion | Score | Evidence |
|---|---|---|
| Novelty (30%) | 4.5 | The gaze as the rule of a shared world (650 / 1,309 / 10, 660 walks at most), proven on-chain by Merkle proof; Friend Books on the tokens; a meeting that cannot be bought or rushed, with a fuzz finding |
| Fun (20%) | 3.5 | Spread, hop, paper burst, postmark thump, notes, lanterns, scroll story. Weakest: no sound, one real walk so far |
| Retention (20%) | 4 | Friend who waits, UTC countdown, calendar file, strangers' lanterns, pledges, next walk. Not yet proven with real users |
| Clarity (15%) | 4.5 | One sentence per rule, 2-minute Demo, 60-second judge path, Break a rule panel |
| Execution (15%) | 4.5 | Verified immutable contracts, 15 invariants, fuzz, TS twin with shared scenarios, 146 browser tests, mainnet reverted transactions, verifier PASS. Gaps: testnet D8, InviteExpired on chain |
| $CHOG bonus | 4 | Pledges escrowed and settled, lanterns burned (50 $CHOG burned on mainnet), live on Heartbeat. Small amounts by necessity |