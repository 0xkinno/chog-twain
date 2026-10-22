# Proof

Mirror of the [Proof page](https://chog-twain.vercel.app/proof), with generated facts. See [PROOF_PLAN.md](PROOF_PLAN.md) for the plan and [EVIDENCE.md](EVIDENCE.md) for transactions.

| | |
|---|---|
| Foundry tests | <!-- FACTS:forge-tests -->42 passing, 0 failing<!-- /FACTS:forge-tests --> |
| Rules engine tests | <!-- FACTS:vitest-tests -->33 passing, 0 failing<!-- /FACTS:vitest-tests --> |
| Browser tests | <!-- FACTS:playwright-tests -->146 passing, 0 failing, 4 skipped<!-- /FACTS:playwright-tests --> |
| Fuzz runs | <!-- FACTS:fuzz-runs -->512<!-- /FACTS:fuzz-runs --> |
| Gaze root | <!-- FACTS:gaze-root -->`0x7cb42ed24f612763f141f9b02c56a637e2cd3f7fcdcb23dea68dc50e7b1d63e4`<!-- /FACTS:gaze-root --> |
| Walks, steps, meetings | <!-- FACTS:walks -->2<!-- /FACTS:walks -->, <!-- FACTS:steps -->1<!-- /FACTS:steps -->, <!-- FACTS:meetings -->0<!-- /FACTS:meetings --> |
| Reverted guard transactions | <!-- FACTS:break-count -->6<!-- /FACTS:break-count --> |
| Latency to proposed / final | <!-- FACTS:latency-proposed -->1171 ms median (20 samples, Monad mainnet)<!-- /FACTS:latency-proposed --> / <!-- FACTS:latency-final -->2013 ms median (20 samples, Monad mainnet)<!-- /FACTS:latency-final --> |
| FACTS generated | <!-- FACTS:facts-time -->2026-10-22T03:21:24.443Z<!-- /FACTS:facts-time --> |

Verify it yourself: `node scripts/verify.mjs`.