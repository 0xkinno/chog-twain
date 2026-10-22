# Red team log

Five roles after the mainnet deploy: rubric judge, ten-minute judge on a phone viewport, Monad maintainer, verifier,
skeptic. **Honest scope:** these rounds were run by the build agent itself in one session, role by role, each against
the live deployment or the repository with a concrete command. They are not independent judges. A fresh-session
round by someone else is still worth doing before submission.

## Round 1 (22 Oct 2026)

| Role | What was run | Finding | Fix | Status |
|---|---|---|---|---|
| Rubric judge | Read `/`, `/demo`, `/judge` against Novelty 30, Fun 20, Retention 20, Clarity 15, Execution 15, $CHOG bonus | Fun is the weakest score: no sound, a single hero pair on the landing | Answered with the spread, step hop, paper burst, postmark thump, notes and lanterns; no unrelated features added | accepted, noted in self-judge |
| Ten-minute judge | Playwright mobile viewports (360x800, 375x667, 393x852, 412x915) over every route, then the 10-minute path in `/judge` | Mobile nav showed desktop items and wrapped footer links overlapped; at 768 px no nav was visible | Nav moved to classes and breakpoints; footer links are block level | fixed, matrix green |
| Monad maintainer | Checked each row of `MONAD_SURFACE.md` against file and line; measured D7 on mainnet | Claim "gas is charged by use" would have been wrong: receipts show gas used equals the limit | README and Proof state limit-based charging with the measured 30% saving | fixed |
| Verifier | `node scripts/verify.mjs` on mainnet; 6 reverted guard transactions; tried to show up as a stranger and twice in a day | All PASS; every guard reverted on chain | none needed | clean |
| Skeptic | Read the README for numbers without a source; compared with FACTS | (1) The Playwright count was typed, not generated; (2) the Demo's rule-breaking scenarios assumed wrong Chog gazes and one error (BadChog) is unreachable with a valid proof; (3) CI failed on a clean checkout because `src/data/chogs.json` is generated | (1) FACTS block from `docs/playwright-summary.json`; (2) scenarios rewritten with real gazes, BadChog explained; (3) CI generates assets first | fixed |

## Also found and fixed by the matrix and flows (not by a role)

- The empty chair only appeared on one page of the spread (Left-facing openers saw no chair): fixed on both pages.
- A `d="undefined"` SVG console error on every walk page: the gaze path no longer animates `d`.
- The open-walk screen hid the transaction postmark; finality was awaited before returning: the caller now returns at "proposed" and finality is stamped asynchronously.
- `GlowCard` swallowed `data-*` attributes: it now forwards them.

## Open after round 1

- `InviteExpired` has no mainnet reverted transaction yet (needs a walk older than 3 days, from 25 Oct).
- No real user feedback yet (`FEEDBACK.md` is empty on purpose).
- D8 (MIP-8 packed versus loose storage) is not measured: needs Monad testnet gas.