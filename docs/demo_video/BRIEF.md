# Demo video brief (for the cloud agent)

**Goal:** a clean demo film of **2:50** with a calm voice-over of about **2:40**, cut from the builder's own screen recording.

## Already done: the picture cut

`docs/demo_video/chog_twain_demo_cut_2m50_silent.mp4` (2:51, 1440x810, about 19 MB, silent) is the raw recording cut exactly to the table below (including the speed-ups). **Start here.** Remaining work: record or synthesise the voice-over (V1 to V11), lay it on the scenes, burn captions, add short cross-fades, export 1080p H.264, and commit the result as `docs/demo_video/chog_twain_demo_2m50.mp4`. Re-cut from the raw file only if a scene needs changing.

## The source recording

- `docs/demo_video/chog_twain_demo_raw.mp4`: 4:08, 1440x810, 30 fps, **silent** (no audio track). Re-encoded from the builder's 166 MB original (`docs/playwright_outputs_for_demo/videos/Chog_twain_video.mp4`, not in git because GitHub caps files at 100 MB) at the same resolution, about 25 MB. The original stays on the builder's machine; ask him for it only if you need the pristine pixels.
- `docs/demo_video/frames/contact-sheet.jpg` shows one frame every 10 seconds, labelled. `frames/tNNNs.jpg` are the individual frames. Rebuild with `node scripts/contact-sheet.mjs`.
- It is the **live site on Monad mainnet** (https://chog-twain.vercel.app) with two real wallets, plus the no-wallet Demo page. Do not claim a meeting happened on mainnet: the first can land on 28 Oct (UTC). The meeting shown is the Demo.

## What is where (approximate, verify against the contact sheet)

| Source time | What is on screen |
|---|---|
| 0:00 to 0:08 | Landing hero: "Every Chog is looking at someone", live strip |
| 0:09 to 0:19 | The faces mosaic sorted by gaze and the discovery line (660 walks at most, 649 waiting) |
| 0:20 to 0:27 | Heartbeat preview ("The world, live from storage") |
| 0:28 to 1:02 | Start a walk: filter, pick a Chog, 7 days, pledge 10 $CHOG, Open the walk, wallet confirmation |
| 1:03 to 1:14 | Postmarked, the share link and QR, "Waiting for a friend" with the empty chair |
| 1:20 to 1:33 | Second wallet connects (wallet modal) |
| 1:36 to 1:58 | Join flow: only facing Chogs are offered, Join, the walk is Walking |
| 1:58 to 2:30 | Today panel: countdown to 00:00 UTC, note, I'm here, lanterns, pledge, notes, calendar |
| 2:38 to 2:56 | Demo page: Break a rule (every contract error as a sentence) |
| 2:56 to 3:34 | Demo loop: Friend shows up, a missed day, a lantern, Day 10, "They met" postcard and keepsakes |
| 3:40 to 3:52 | Proof page and the break-campaign table |
| 3:52 to 4:00 | Heartbeat: steps per day, left and right in use |
| 4:00 to 4:08 | Landing spread, closing frame |

## Cut list to 2:50 (source ranges, then speed)

Cut dead time (wallet popups waiting, scrolling, empty pauses). Keep every click readable.

| Out | Source | Speed | Voice-over line |
|---|---|---|---|
| 0:00 to 0:08 | 0:00 to 0:08 | 1x | V1 |
| 0:08 to 0:20 | 0:09 to 0:19 | 1x | V2 |
| 0:20 to 0:47 | 0:28 to 1:02 | 1.25x | V3 |
| 0:47 to 0:57 | 1:03 to 1:14 | 1x | V4 |
| 0:57 to 1:15 | 1:36 to 1:58 | 1.2x | V5 |
| 1:15 to 1:41 | 1:58 to 2:30 | 1.25x | V6 |
| 1:41 to 1:59 | 2:38 to 2:56 | 1x | V7 |
| 1:59 to 2:24 | 2:56 to 3:34 | 1.5x | V8 |
| 2:24 to 2:36 | 3:40 to 3:52 | 1x | V9 |
| 2:36 to 2:44 | 3:52 to 4:00 | 1x | V10 |
| 2:44 to 2:50 | 4:00 to 4:08 | 1x | V11 |

Speed with `setpts=PTS/1.25` and `fps=30`; join with `concat`; add a 0.4 s cross-fade between scenes; burn captions from the script
below (captions on). Use a plain lilac title card is optional: the app already looks like the product. Export 1080p H.264, under 3 minutes.

## Voice-over script (about 2:40, about 395 words, calm, no hype)

V1 (8 s). Every Chog is looking at someone. Its face points left, right, or straight at you.

V2 (12 s). Six hundred and fifty look left, one thousand three hundred and nine look right, ten look at you. So at most six hundred and sixty walks can run at once. That trait became the rule of Chog Twain.

V3 (27 s). Two friends, two Chogs that look at each other. I pick any Chog, I do not need to own it, and I choose seven days. I can put a small pledge of Chog on it. One tap opens the walk on Monad, and my wallet asks me to confirm.

V4 (10 s). The page shows two stamps: landed in a block, then postmarked as final, in about two seconds. Now I send my friend the link.

V5 (18 s). My friend opens it and can only pick a Chog that looks at mine. They join, and joining counts as their first day.

V6 (26 s). Every day we both tap I'm here, with an optional note, before midnight UTC. When the second person arrives, the step happens in the same transaction and the Chogs move closer. Anyone can light a lantern, which burns Chog to keep a day only one of us made.

V7 (18 s). Every rule has a plain sentence. Show up twice in a day, pick a Chog that looks the wrong way, light a fourth lantern: the app says why before your wallet even opens.

V8 (25 s). If one of us misses a day, the Chogs drift apart and a slice of the pledge goes to the one who showed up. Keep going, and on the last day they meet. It is written onto both Chogs forever, and each of us gets a postcard that cannot be sold. This is the demo, no wallet needed.

V9 (12 s). One contract, no admin, verified on Sourcify. Every rule has a test, and every guard has a reverted transaction on mainnet.

V10 (8 s). The Heartbeat shows the live numbers straight from storage.

V11 (6 s). A meeting cannot be bought or rushed. Chog Twain. Try it at chog-twain.vercel.app.

## Voice-over production

Use the `hackathon-demo-video` skill's tooling (edge-tts and ffmpeg) or any natural TTS voice; lay each line over its scene and let
the picture breathe 0.3 s before and after. Keep the loudness at about minus 16 LUFS. If a line runs longer than its scene,
trim words, not the picture.

## House rules for the film

No emoji, no hype words, no claims of a mainnet meeting, name no other Chogathon entry. Real numbers on screen come from the
live site. The builder (@0xkinno) is the only author; do not add any AI credit to the video or the repository.