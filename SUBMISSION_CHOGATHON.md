# Submission (mirrors the live form, fields 01 to 06)

## 01 Project name, team, handles
Chog Twain. Solo: Kinnoski. Discord: (Kinnoski adds). X: @0xkinno.

## 02 What you built and what is new
Chog Twain is a daily promise between two people, made visible by two Chogs that look at each other. Each person picks any Chog (no ownership needed). Every UTC day both of them tap "I'm here", the two Chogs take one step closer; a day one of them misses, they drift one step apart; when the gap reaches zero they meet. The meeting is written onto both Chogs' on-chain Friend Book, two soulbound postcards are printed on-chain, and optional $CHOG pledges are settled. Anyone can light a lantern ($CHOG burned) to keep a day only one of the two made.

What is new: (1) the gaze (the `Side` trait: 650 left, 1,309 right, 10 straight out) becomes the rule of a shared world, proven on-chain by a Merkle proof against a root anyone can rebuild; (2) a meeting that cannot be bought or rushed (at least N real days on which both showed up), with a fuzz finding that drift makes it "at least"; (3) Friend Books written onto the tokens, readable by any app.

## 03 Why Chog matters
Take the Chog out and nothing works: no gaze means nobody can face anybody and the scarcity disappears; no art means no characters on the page; no token id means no Friend Book; no one-walk-per-Chog lock means every Chog is infinite. Live `ownerOf` adds an optional keeper's seal and home-only switch. $CHOG adds pledges and lanterns as a bonus layer. Monad makes a daily on-chain tap cost a fraction of a cent.

## 04 Working demo, video, testing
- Live: https://chog-twain.vercel.app
- Demo (no wallet): https://chog-twain.vercel.app/demo
- Video (2:50, YouTube unlisted): https://youtu.be/B1Mk1YjT0Sw
- Testing: a visitor with no wallet runs the Demo in two minutes; any wallet with a little MON can open or join a real walk on Monad mainnet at /walk/new; a Chog holder gets a keeper's seal and a home-only switch on the Chog's page. Judge paths: https://chog-twain.vercel.app/judge

## 05 Repo, stack, pre-existing work
Repo: https://github.com/0xkinno/chog-twain. Stack: Solidity 0.8.28 and Foundry, Next.js 15, React 19, Tailwind 4, viem and wagmi, motion, Playwright, Vitest. No pre-existing code; written during Chogtober 2026; AI coding assistants used.

## 06 Usage and what is next
Usage numbers are generated in the README (FACTS) and listed with transaction links in EVIDENCE.md. Walks 1 and 2 are the builder's own test wallets and are labelled as such. Walk 3 was opened and joined by two outside testers (wallets on the explorer in FEEDBACK.md); both came back on day 2 and both asked for a shorter introduction and for inviting more than one friend, which is on the roadmap (group walks). Next: a read API for Friend Books, push reminders, group walks of four, seasonal walks.