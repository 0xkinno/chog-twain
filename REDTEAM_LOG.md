# Red team log

Five fresh roles after each deploy (rubric judge, ten-minute judge on a phone viewport, Monad maintainer, verifier,
skeptic). Fix, re-run, log here, stop at a clean round.

| Round | Date | Role | Finding | Fix | Status |
|---|---|---|---|---|---|
| 0 | 21 Oct 2026 | self review before mainnet | Notes could not be shown from storage on a public RPC with a 100-block log cap | Added `noteOf` storage to the contract before deploy, with a test | fixed |
| 0 | 21 Oct 2026 | self review | Footer and wrapped inline links overlapped in the Playwright overlap check at 360 px | Footer links are block level | fixed |
| 0 | 21 Oct 2026 | self review | Mobile nav showed desktop items because an inline style beat the media query | Moved to a class | fixed |

Rounds 1 to 5 run after the mainnet deploy, with the live URL. They are not started yet.