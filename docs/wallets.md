# Wallets to fund (Monad mainnet, chain 143)

Private keys are in `.env.local` only (gitignored, never committed). This file holds addresses only.

| Wallet | Address | MON needed | $CHOG needed | What it does |
|---|---|---|---|---|
| Deployer | `0xd985fb404A1B485A4cDcEDc31C8887274B664690` | 2 MON | none | Deploys ChogTwain and TwainPostcard; sends the break campaign |
| Test wallet A | `0xD7258aB151094E953a64223d9D15c27E9F352e9E` | 1 MON | 1,500 $CHOG | Opens walks, pledges |
| Test wallet B | `0xAEE0139fcC4fBbA116df5c6F47b780513082Eb0f` | 1 MON | 1,500 $CHOG | Joins walks, pledges |
| Test wallet C | `0x5F9695D19AECfBF44556a8Da910788BD53a1ebaD` | 0.5 MON | 300 $CHOG | A fan with no Chog: lanterns and cheers |

Total: 4.5 MON and 3,300 $CHOG.

$CHOG token: `0x350035555E10d9AfAF1566AaebfCeD5BA6C27777` (18 decimals).

## Decision needed before the deploy

The lantern price is fixed forever once deployed. Live $CHOG is about US$0.0015, so **65 $CHOG is about US$0.098**.
Suggested pledge presets: **0 / 150 / 700 $CHOG**. Reply with "65 is fine" or another number.