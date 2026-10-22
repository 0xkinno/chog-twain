# Feedback

Real people, real wallets, real transactions on Monad mainnet. Dated, with exact scope. Answers are **summarised from what
each tester told the builder, not quoted word for word**; nothing is quoted verbatim until a tester gives permission.
Both testers were invited by the builder (Kinnoski) from his own circle, so this is early friendly feedback, not a
random sample. We say so plainly.

## Verify it yourself

Both walkers are public on Monad. Anyone can open the walk and the wallet pages.

| | |
|---|---|
| The walk | [walk 3 on the live app](https://chog-twain.vercel.app/w/3): a 7 day walk, Chog 11 (looks left) and Chog 4 (looks right), 10 $CHOG pledged by each, opened by Tester 1 as a private invite for Tester 2 |
| Tester 1 (opened the walk) | [`0xe98ACBD5d8F02A92A5492b5830BA83ffBB684E7f`](https://monadvision.com/address/0xe98ACBD5d8F02A92A5492b5830BA83ffBB684E7f) |
| Tester 2 (joined) | [`0x81c6E3657588C8E51331a1696742DDa990E12A46`](https://monadvision.com/address/0x81c6E3657588C8E51331a1696742DDa990E12A46) |
| On-chain state read on 22 Oct 2026 | `walk(3)`: status Walking, distance 7, gap 6, 1 step walked, pledge 10 $CHOG each held by the contract, Tester 1's note "Ready to forge ahead" stored for day 2 |
| Contract | [`ChogTwain`](https://monadvision.com/address/0x00e17D2072855159C8fb0519c3Afd3a914474DF8) (`walkerA` and `walkerB` of walk 3 are exactly the two wallets above) |

## Sessions

| Date (UTC) | Who | Channel | What was asked | Scope |
|---|---|---|---|---|
| 22 Oct 2026 | Tester 1 | direct message from the builder | Open the link, connect, open a walk, show up, report back | opened walk 3 with a pledge, showed up with a note |
| 22 Oct 2026 | Tester 2 | direct message from the builder | Join the walk from the link, show up, report back | joined walk 3 (joining counts as day one), matched the pledge |

Both were asked the same four questions.

## Tester 1

1. **Where did you get stuck?** Nowhere meaningful. The path from opening the link to the first "I'm here" felt smooth and understandable.
2. **Was the first transaction worth it?** Yes. The check-in made progress in the walk tangible.
3. **Day 2?** Came back on the second day and intends to continue.
4. **What was missing?** Nothing essential. A shorter introduction, and a way to invite more than one friend, would make it easier to share.

## Tester 2

1. **Where did you get stuck?** At first wondered whether both people had to choose the exact same Chog. The pairing rule (the two Chogs must look at each other) became clear quickly.
2. **Was the first transaction worth it?** Yes, once the pairing rule was understood: the check-in made the walk's progress tangible.
3. **Day 2?** Came back on the second day and intends to continue.
4. **What was missing?** The layout felt balanced. The main suggestions were a shorter introduction and inviting several friends.

## What we heard, and what we do with it

| Signal | Source | Our response |
|---|---|---|
| Both came back on day 2 without a reminder from us beyond the walk itself | both | The retention loop works for a pair who know each other. Still n = 2, builder-invited |
| "Do both of us pick the exact same Chog?" | Tester 2 | The picker already offers only Chogs that face the opener's; the join card says so in its first sentence. Next: say "pick a Chog that looks at theirs" on the open-walk screen too, before the friend ever sees it |
| A shorter introduction | both | The landing page is long on purpose for judges; the walk link goes straight to the walk. Next: a one-screen "what happens when I tap" card on the join flow |
| Invite more than one friend | both | Group walks of four are on the roadmap in the README ("What's next") |

## Not yet done

- Three more people from the Chog Discord and X are still to be invited (the plan was five). This file lists only people who actually walked.
- Permission to quote either tester word for word has not been asked.
- A message for the next invites is below.

## Outreach message (for the next invites)

> I built a small thing for Chogathon: two people each pick a Chog, the two Chogs look at each other, and every day you
> both show up they step closer. Miss a day and they drift apart. You do not need to own a Chog, only a few cents of
> MON. Want to walk with me for 7 days? https://chog-twain.vercel.app

## What we asked (the four questions)

1. Where did you get stuck, from opening the link to your first "I'm here"?
2. Did the first "I'm here" feel worth a transaction?
3. Day 2: did you come back, and what made you (or not)?
4. What was missing?