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
| 6 Demo, Heartbeat, Proof, Judge | done; break campaign 6 of 7 (InviteExpired from 25 Oct); real users not invited yet |
| 7 Quality gates | layout matrix and demo green; real-chain flows being finished; Lighthouse, red team, self-judge open |
| 8 README, video, submission | README, docs, scripts done; video and submission are Kinnoski's |

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
- [ ] Playwright matrix green on all viewports (yes), axe clean (yes), zero console errors (yes); real-chain flows re-run pending
- [x] No other entry named in committed files; `reference/` ignored
- [ ] Video under 3 minutes (Kinnoski)
- [ ] Submitted 2+ hours early; tag; deployment frozen (Kinnoski)

## Self-judge (not yet scored)

To do after the red-team rounds: score 1 to 5 per criterion with evidence. Expected weakest: Fun. Answer with the spread, the step animation, the meeting moment, notes and lanterns.