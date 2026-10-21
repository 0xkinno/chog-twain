# Proof plan

What we claim, how each claim is checked, and what would prove us wrong.

## The claim

> A meeting cannot be bought or rushed: it takes at least N real days on which both people showed up.

## Layers of proof

| Layer | What it checks | Where |
|---|---|---|
| Contract rules | I1 to I15 enforced in `ChogTwain.sol` | `contracts/src/ChogTwain.sol` |
| Unit tests | Each rule, each custom error, soulbound postcards, tokenURI decoding, note storage, home-only after a sale | `contracts/test/ChogTwain.t.sol` (37 tests) |
| Fuzz | Over any attendance and lantern pattern: steps never exceed together-days, gap stays in range, a meeting needs at least `distance` steps, $CHOG is conserved. 512 runs | `testFuzz_meetingNeedsRealDays` |
| Invariants | Six actors, ten actions in random order: no Chog in two active walks (I6), $CHOG conservation (I9), gap in range, steps never decrease, every Met walk has `steps >= distance`, two postcards per meeting | `contracts/test/ChogTwain.invariant.t.sol` |
| JS to Solidity proof parity | A Right, a Left and a Front Chog proof built by `scripts/build-gaze.mjs` from our own data verifies on-chain; forged token or gaze reverts | `contracts/test/GazeProofCompat.t.sol` (generated) |
| Engine parity | 18 hand-written scenarios run against the contract in Foundry and against `packages/rules` in Vitest. Same results or CI fails | `fixtures/scenarios`, `contracts/test/Scenarios.t.sol`, `packages/rules/test/scenarios.test.ts` |
| Randomised engine test | 300 random attendance runs: one step per day, bounds, at-least-N, conservation including burned lanterns | `packages/rules/test/engine.test.ts` |
| No NFT writes (I14) | The only call on Chog Genesis is `ownerOf`; no approvals, no custody | `test_noNftWrites`, `scripts/check-no-nft-writes.mjs` in CI |
| Offline verifier | Rebuilds the gaze root from `data/collection.json`, refetches metadata and compares sha256, recomputes every walk from its events with the same engine, decodes every postcard | `scripts/verify.mjs` |
| Break campaign | One deliberately reverted mainnet transaction per guard: NotWalker, AlreadyToday, BadProof, SelfWalk, NotFacing, ChogBusy, InviteExpired | `scripts/break-campaign.mjs` (needs Kinnoski's go-ahead) |
| End to end | Real transactions through the real UI on a local chain: open, join with facing-only picker, I'm here, step, lantern, cheer, drift, poke, leave, claim, meeting with postcards, Friend Books, home only | `tests/e2e` |

## What could prove us wrong

1. A fuzz or invariant counterexample that breaks I1 to I15. None found in 512 fuzz runs and 128 invariant runs of depth 64.
2. A walk on mainnet that met in fewer than `distance` real days. The verifier recomputes every walk and would print FAIL.
3. A Chog that appears in two active walks (`activeWalkOf` lock). Invariant I6.
4. $CHOG left in the contract that no one can claim, or claimable that the contract cannot pay. Invariant I9.
5. A gaze proof accepted for the wrong side. `GazeProofCompat` and `test_forgedGazeReverts`.
6. A drift or forfeit computed differently by the UI than by the chain. `preview()` parity test and the shared scenarios.

## Known boundaries (stated, not hidden)

- One person with two wallets can walk alone; nothing rewards it except their own record.
- Days are UTC days. The countdown on the walk page says so.
- The gaze lives in IPFS metadata. The contract trusts a Merkle root fixed at deploy; anyone can rebuild it from the collection, and `verify.mjs` does.
- Meeting block numbers on the card are shown only when one `eth_getLogs` over exactly that block confirms them.