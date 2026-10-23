# Chogathon form answers (copy and paste)

## Description (6,318 of 8,000 characters)

CHOG TWAIN: TWO CHOGS, ONE SHARED WALK
Every Chog is looking at someone. Chog Twain turns that glance into a daily promise between two real people. Live on Monad mainnet, no Chog needed to try it.

Film (2:50): https://youtu.be/B1Mk1YjT0Sw
Live app: https://chog-twain.vercel.app   Demo, no wallet: https://chog-twain.vercel.app/demo

1. THE IDEA
Two friends each pick a Chog. The two Chogs must look at each other. On every UTC day both friends tap "I'm here", the Chogs take one step closer. A day one of them misses, the Chogs drift one step apart. When the gap reaches zero they meet, and the meeting is written onto both Chogs forever. A meeting cannot be bought or rushed: it takes at least N real days on which both people showed up.

2. THE STORY
Lena is a night-shift pharmacist in Leipzig. Her best friend Arjun moved back to Pune, and the messages slowly got shorter. They open a walk. The day closes at 00:00 UTC, which is 02:00 in Leipzig and 05:30 in Pune. On day four Arjun forgets, the Chogs drift apart and a slice of his pledge moves to Lena, who showed up. That night he sends her a voice note. On the last day they meet. (Lena and Arjun are an illustrative story, not real users.)

3. THE DISCOVERY THAT BECAME THE RULE
Every Chog already points left, right, or straight out of the frame, and almost nobody used it. We rebuilt the numbers ourselves from the chain and IPFS (all 1,969 tokenURIs through Multicall3, every metadata file hashed): 650 look left, 1,309 look right, 10 look straight at you. Two Chogs can only meet if they face each other, so at most 660 walks can run at once and 649 right-facing Chogs are always waiting for a partner. Scarcity comes from the art itself.
The gaze lives in IPFS metadata, not on-chain, so the contract checks a Merkle proof against a root fixed at deploy. Anyone can rebuild that root.

4. HOW A WALK WORKS
1) Pick. Any of the 1,969 Chogs, owned or not. Filter by gaze, aura or head.
2) Walk. Send the link or QR code. Your friend joins with a Chog that faces yours. Distance is 7, 14 or 30 steps.
3) Show up. Each person taps "I'm here" once per UTC day with an optional 28-byte note. When the second person arrives, the step is taken in the same transaction.
4) Drift. A missed day moves the Chogs one step apart and a slice of the absent person's optional pledge goes to the one who came. Three unkept days in a row end the walk.
5) Meet. In one transaction: both Friend Books are written, two soulbound postcards are minted, pledges are settled, both Chogs are free to walk again.
Anyone, even with no Chog and no walk, can light a lantern (burns $CHOG, keeps a day only one of the two made, never a day nobody came) or cheer for free.

5. WHAT A MEETING LEAVES
- Friend Books: each Chog keeps an on-chain list of every walk it finished, with whom and how long it took. It follows the token if it is sold, and any app can read it.
- Postcards: one per person, drawn as SVG inside tokenURI, soulbound (ERC-5192), cannot be sold.
- A shareable meeting card, and the pledge back minus a slice per missed day.

6. WHY THE CHOG IS ESSENTIAL
Take the Chog out and nothing works. No gaze: nobody can face anybody and the scarcity disappears. No art: no characters, no meeting scene. No token id: no Friend Book, a meeting belongs to nothing that lasts. No one-walk-per-Chog lock: every Chog is infinite. Holders get an optional keeper's seal and a home-only switch, read live from ownerOf. The contract never writes to the Chog contract; its only call is ownerOf, and CI enforces it.

7. $CHOG (BONUS LAYER, BOTH LIVE)
- Pledges are a commitment contract between two people: equal amounts, escrowed, settled on meeting or ending, claimed by pull.
- Lanterns burn 50 $CHOG to the dead address, so they reduce supply. Price fixed forever.
- Totals are on the Heartbeat page, read straight from contract storage.

8. BUILT FOR MONAD
- Every write shows two stamps: "Landed in block N (proposed)", then "Postmarked. Final in X s". Measured on mainnet: median 1,171 ms to proposed, 2,013 ms to final.
- Monad charges gas by limit, so we measured tight limits on mainnet and send the larger of that and 1.25x the live estimate.
- Logs are limited to 100 blocks per call, so no page scans logs. State sits in packed storage and is read through Multicall3.
- Not claimed: EIP-7702, P256, staking. Only what we use is listed.

9. EXECUTION AND PROOF
- One immutable contract plus a postcard contract on Monad mainnet (chain 143). No owner, no admin, no pause, no upgrade. Both verified on Sourcify.
- 15 invariants each tied to a named test, 42 Foundry tests with a 512-run fuzz, 33 tests on a TypeScript twin of the rules, 146 Playwright tests across 9 viewports with accessibility checks.
- The fuzzer found that missed days reopen the gap, so a meeting takes at least N steps, not exactly N. The rule is stated that way.
- 6 deliberately reverted guard transactions on mainnet prove the checks work.
- The Proof page and "node scripts/verify.mjs" rebuild the gaze root, replay every walk and decode every postcard. PASS or FAIL.
- Lighthouse on the live site: accessibility 100, best practices 100, SEO 100.

10. REAL USAGE, STATED PLAINLY
3 walks opened on mainnet, 2 steps taken, 70 $CHOG pledged, 1 lantern lit, 0 meetings yet (a real meeting needs 7 real days, so the first can land from 28 Oct UTC). Walks 1 and 2 are the builder's own test wallets. Walk 3 was opened and joined by two outside testers; both came back on day 2. Their feedback is in the repo.

11. HOW IT MAPS TO THE CRITERIA
Novelty: gaze as the rule of a shared world, Friend Books on the tokens, a meeting that cannot be bought. Fun: the magazine spread, footprints, postmark thump, notes, lanterns, a scroll story. Retention: a friend who waits, a countdown to 00:00 UTC, calendar reminder, pledges, strangers' lanterns, the next walk. Clarity: one sentence per rule, the Demo in two minutes, every contract error shown as a sentence before the wallet opens. Execution: see 9. $CHOG: see 7.

12. TRY IT
- No wallet: /demo, then "Break a rule".
- Any wallet with a little MON: /walk/new on Monad mainnet.
- Check the claims: /proof and /judge.
Repo: https://github.com/0xkinno/chog-twain

13. WHAT IS NEXT
A read API for Friend Books, push reminders, group walks of four, seasonal walks.


## Tech stack

Solidity 0.8.28 and Foundry (contracts, 42 tests, fuzz and invariants); Monad mainnet (chain 143) with Multicall3 batched reads and Sourcify verification; Next.js 15, React 19, Tailwind CSS 4; wagmi 2 and viem 2 for wallets; motion for animation; a TypeScript twin of the rules engine; Merkle proof of the gaze trait against an immutable root; Playwright and Vitest for browser and engine tests; Vercel hosting.

## GitHub repo

https://github.com/0xkinno/chog-twain

## Judge access instructions

No login, invite or test account is needed.
1. No wallet, 60 seconds: open https://chog-twain.vercel.app/demo. Press Open the walk, Friend joins, I'm here, Friend shows up, Friend misses, Light a lantern, Walk it all the way. Then press Break a rule to see every contract error as a sentence. Nothing in the Demo is on-chain, and the page says so.
2. Real app, 3 minutes: install any wallet (Rabby, MetaMask, Phantom, OKX), keep a little MON on Monad mainnet (chain 143) and open https://chog-twain.vercel.app/walk/new. You do not need to own a Chog. Pick any Chog, choose 7 days, open the walk. You will see "Landed in block N (proposed)" then "Postmarked. Final in X s". Join from a second wallet: only Chogs that face yours are offered. A third wallet with no Chog can light a lantern and cheer; both show on /heartbeat.
3. A real walk to look at now: https://chog-twain.vercel.app/w/1 and https://chog-twain.vercel.app/w/3 (walk 3 was opened and joined by two outside testers).
4. Check the claims: https://chog-twain.vercel.app/proof (addresses, Sourcify links, 15 invariants with test names, reverted mainnet transactions) and https://chog-twain.vercel.app/judge (the same three paths). To run it yourself: clone the repo, run npm install --legacy-peer-deps, then node scripts/verify.mjs (rebuilds the gaze root, replays every walk, decodes every postcard; prints PASS or FAIL).
5. Honest note: no real meeting exists yet, because a meeting needs 7 real UTC days. The meeting you see in the Demo is the Demo. Contracts: ChogTwain 0x00e17D2072855159C8fb0519c3Afd3a914474DF8, TwainPostcard 0x3D83641BFE0446D5fEc07aa16Bd0d35d9422BFB3.
Video: https://youtu.be/B1Mk1YjT0Sw

## Go-to-market plan

1. Who it is for. Two kinds of people: anyone with a friend they want to keep in touch with, and Chog holders who want their Chog to have a reason to exist beyond trading. No Chog is needed to start, so the first user is never blocked.
2. Why it spreads. Every walk needs a second person, so every user brings one. The invite is a link or a QR code that opens straight onto the walk. A finished meeting produces a shareable card and a postcard, a reason to post.
3. Launch. A thread on X with the film and the 650 / 1,309 / 10 discovery as the hook; the Chog community and Discord; invites to five more outside testers (two walked already, both returned on day 2).
4. Retention loops. A friend who is waiting, a countdown to 00:00 UTC, a calendar reminder, pledges between the two walkers, lanterns from strangers, and the next walk with the same friend or someone new.
5. Token role. Pledges and lanterns give $CHOG a use that is not speculation: pledges are escrowed between friends and lanterns burn 50 $CHOG each. Both are visible on the Heartbeat.
6. What we measure. The Heartbeat reads live from contract storage: walks, steps, meetings, lanterns, $CHOG pledged and burned. We publish zeroes as they are.
7. Roadmap. A read API for Friend Books so other apps can show a Chog's history, push reminders, group walks of four, seasonal walks with limited editions.
8. Cost to run. No server of record and no admin. Only two stateless routes exist (an art proxy and a card renderer), so running costs stay near zero while it grows.
