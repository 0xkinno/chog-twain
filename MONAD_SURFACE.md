# Monad and Chog surface

Every Monad and Chog feature we use, with the file and line that uses it, and what we do **not** use.
Line numbers are for this commit; `git blame` is the source of truth after edits.

## Chog Genesis (read only)

| Feature | Where |
|---|---|
| Live `ownerOf` for the optional keeper's seal and the home-only switch | `contracts/src/ChogTwain.sol:196` (`setHome`), `_pickable` |
| Gaze (`Side` trait) proven by Merkle proof against `GAZE_ROOT` | `contracts/src/ChogTwain.sol:167` (`proveGaze`), `:173` (`canMeet`) |
| One walk per Chog, world-wide | `contracts/src/ChogTwain.sol:88` (`activeWalkOf`) |
| Art through our proxy, token id mapped to the artwork file (never assuming id = artwork number) | `src/lib/server/art.ts`, `src/app/api/art/[tokenId]/route.ts`, `src/lib/chogs.ts` |
| The contract never writes to Chog Genesis | `scripts/check-no-nft-writes.mjs`, `test_noNftWrites` |

## $CHOG

| Feature | Where |
|---|---|
| Pledges escrowed and settled by pull (`claim`), conservation invariant | `contracts/src/ChogTwain.sol:212` (`open`), `_end`, `claim`; `ChogTwain.invariant.t.sol` |
| Lanterns burned to `0x...dEaD` | `contracts/src/ChogTwain.sol:446` (`light`) |
| Exact `approve` before a pledge or lantern, never unlimited | `src/lib/hooks.ts:49` (`ensureAllowance`) |

## Monad

| Feature | How we use it | Where |
|---|---|---|
| 300 ms blocks, cheap daily writes | A daily on-chain tap per person is the whole retention loop | `contracts/src/ChogTwain.sol:295` (`showUp`) |
| Finality stages (proposed, voted, finalized) | The two-stage postmark: receipt = proposed, `finalized` block >= receipt block = final | `src/lib/tx.ts:14` |
| Gas charged as `gas_limit x price` | Every write sends a tight explicit limit measured by `scripts/gas-table.mjs`; `showUpMeet` is separate because it mints two postcards | `src/lib/tx.ts:7`, `src/lib/gas-limits.json` |
| Public RPC log range of 100 blocks | Storage-first views, Multicall3, no log scans; one-block `getLogs` only to verify a meeting block | `src/lib/twain.ts:73` (`readCounters`), `:161` (`verifyMeetBlock`), `contracts/src/ChogTwain.sol:526` (`openWalks`) |
| Multicall3 `0xcA11...CA11` | Batches of 200, 250 ms apart, for `activeWalkOf` across the picker page and `ownerOf` for held Chogs | `src/lib/picker.ts:8`, `src/lib/chains.ts:3` |
| Multiple public RPCs | `fallback` transport over `rpc.monad.xyz`, `rpc1`, `rpc3`; the answering host is shown on Proof | `src/lib/chains.ts:63` |
| Packed storage (MIP-8 pages) | The fields a daily show-up touches share one struct; ablation contract `ChogTwainLoose` measures the alternative | `contracts/src/ChogTwain.sol:57` (`Walk`), `contracts/src/ablation/ChogTwainLoose.sol` |
| Latest note per walker stored | A browser can show notes from a view call | `contracts/src/ChogTwain.sol:100` (`noteOf`) |
| Soulbound on-chain postcard (ERC-5192) | Cannot be bought; image is an SVG drawn in `tokenURI` | `contracts/src/TwainPostcard.sol:60`, `:66` |
| Sourcify verification | Both contracts verified; links on Proof | `scripts/deploy-mainnet.mjs` |

## Not used, so not claimed

EIP-7702, the P256 precompile, `eth_sendRawTransactionSync`, the execution events SDK, staking, account abstraction,
ERC-6551 token-bound accounts, off-chain relayers, an indexer, a database.