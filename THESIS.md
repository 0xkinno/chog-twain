# Thesis

## Five-line pitch

```text
NAME:      Chog Twain
PROBLEM:   An NFT's only verb is "sell", and daily "gm" engagement is empty and easy to fake. People want a
           small daily ritual with someone, and a keepsake that proves they kept it.
DISCOVERY: Every Chog already looks at someone: 650 left, 1,309 right, 10 straight out. Only Left can walk
           toward Right, so at most 660 walks can run at once and 649 right-facers are always waiting.
THESIS:    Two people each take any Chog; the two Chogs step closer only on days both show up; the meeting
           is written onto both tokens and cannot be bought or rushed.
PROOF:     walks, steps and meetings read live from the contract; every rule has a test; a fuzz run found
           that drift makes meetings take at least N steps; reverted mainnet transactions for each guard.
```

The numbers above are generated: see `docs/FACTS.json` and the Discovery section of the README.

## Primary guarantee

> **A meeting cannot be bought or rushed: it takes at least N real days on which both people showed up.**

Each component proves it from a different angle: the contract rules, the Foundry unit, fuzz and invariant tests, the
soulbound postcard, the offline verifier that recomputes every walk from chain state, and a break campaign of
deliberately reverted transactions on mainnet.

Honest boundary: one person with two wallets can walk alone. Nothing rewards it except their own record, and pledges
between your own wallets only move your own $CHOG.

## Vocabulary

| Word | Meaning |
|---|---|
| Chog | A Chog Genesis token, used as a character. Nobody needs to own it |
| Gaze | Which way a Chog looks: Left, Right or Front (the ten 1:1s) |
| Walk | Two people, two facing Chogs, a distance of 7, 14 or 30 steps |
| Open walk | Waiting for a friend to join (expires after 3 days) |
| I'm here | The daily show-up transaction (with an optional 28-byte note) |
| Step | Taken the moment both people have shown up on a UTC day |
| Drift | A day not kept: the gap grows by one (never beyond the distance) |
| Kept day | A step, or a lantern-covered day |
| Apart | Three unkept days in a row, or someone walked away; the walk ends |
| Met | The gap reached zero |
| Friend Book | A Chog's on-chain list of every walk it completed |
| Postcard | A soulbound on-chain token printed for each person at a meeting |
| Pledge | Optional equal $CHOG from each person; returned on meeting minus slices for missed days |
| Lantern | $CHOG burned by anyone; keeps a day on which only one person came (max 3 per walk) |
| Cheer | A free on-chain cheer for any walk |
| Keeper's seal, Home only | Optional extras for the wallet that actually holds the Chog |
| Heartbeat | Live public numbers from contract storage |

## Name rationale

"East is East, and West is West, and never the twain shall meet." Twain means two. Every Chog looks left or right; Chog
Twain is where they meet. It is also a nod to Mark Twain, a travel writer, which suits notes, postcards and a long walk.

Name search result (21 Oct 2026): GitHub search for "chog twain", "chog-twain" and "chogtwain" returned only
`0xkinno/chog-twain`. A web search for "Chog Twain" Monad returned nothing about the name. X search needs a login and
is **UNKNOWN**. The Vercel host `chogtwain.vercel.app` answered 404 (unclaimed) when checked.

## What the Chog is for (delete test)

| Take away | What breaks |
|---|---|
| The gaze (Side trait) | Nobody can face anybody; `canMeet` has nothing to compare; the scarcity disappears |
| The art | No two characters on the page; no meeting scene, no card |
| The token id | No Friend Book; a meeting belongs to nothing that lasts |
| The one-walk-per-Chog lock | Every Chog is infinite; picking one means nothing |
| Live `ownerOf` | No keeper's seal, no "home only" (optional layer only) |
| $CHOG | No pledges, no lanterns; the walk still works (bonus layer, as the rules intend) |
| Monad | The rules work on any EVM chain. Monad makes a daily on-chain tap cost a fraction of a cent and the second arrival land in under a second |
