# Judge guide

Three paths, each with what you should see. The same text is on the live site at `/judge`.

## 60 seconds, no wallet

1. Open `/demo`. A banner says **Demo. Nothing here is on-chain.**
2. Press **Open the walk**, then **Friend joins**. Two real Chogs stand on a magazine spread, one on each page, with a dashed gaze line between their eyes.
3. Press **I'm here**, then **Friend shows up**. Both Chogs hop one footprint closer, paper stamps burst, the gap drops by one.
4. Press **Friend misses**, then **Light a lantern**. A dotted backward print appears; a lantern hangs at the fold.
5. Press **Walk it all the way**. They meet, the postmark thumps down, a postcard and keepsakes appear.

## 3 minutes, any wallet, no Chog

1. Read the discovery on `/`: how many Chogs look left, right and at you, and the cap on simultaneous walks.
2. Connect a wallet and switch to Monad. The capsule shows your address, MON and $CHOG balances and a power icon that disconnects.
3. `/walk/new`: filter by gaze, pick any Chog, choose 7 days, open. You see **Landed in block N (proposed)**, then **Postmarked. Final in X.X s.**
4. Join from a second wallet. Only Chogs that face yours are offered.
5. From a third wallet with no Chog, light a lantern and cheer. Both show on `/heartbeat`.

## 10 minutes, check the claims

1. `/proof`: addresses with Sourcify links, the 15 invariants with test names, the fuzz finding, the reverted mainnet transactions, gas, fees and which RPC answered.
2. Run `node scripts/verify.mjs`: it rebuilds the gaze root, recomputes every walk and decodes every postcard. PASS or FAIL.
3. Open any `/chog/<token>`: gaze, whether it is walking, its Friend Book read from storage.
4. In the Demo, **Break a rule**: every contract error has its sentence.
5. Read the honest notes on `/proof`.

## Criteria map

| Criterion | Where to look |
|---|---|
| Novelty (30%) | The gaze discovery on `/`; Friend Books written onto tokens; a meeting that cannot be bought or rushed |
| Fun (20%) | The spread, the step animation, the meeting moment, notes, lanterns |
| Retention (20%) | A friend who waits, a countdown to 00:00 UTC, calendar reminder, lanterns from strangers, pledges, the next walk |
| Clarity (15%) | `/demo` in two minutes on a phone; one sentence of rules per card |
| Execution (15%) | `/proof`, 37 contract tests plus fuzz and invariants, 33 engine tests, Playwright matrix, verified contracts |
| $CHOG bonus | Pledges escrowed and settled, lanterns burned: see Heartbeat |