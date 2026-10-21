// Copies ABIs out of forge's build output into src/lib/abi (committed, because Vercel has no forge).
// Usage: (cd contracts && forge build) && node scripts/gen-abi.mjs
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
mkdirSync("src/lib/abi", { recursive: true });
for (const [file, name] of [["ChogTwain.sol/ChogTwain.json", "ChogTwain"], ["TwainPostcard.sol/TwainPostcard.json", "TwainPostcard"]]) {
  const j = JSON.parse(readFileSync(`contracts/out/${file}`, "utf8"));
  writeFileSync(`src/lib/abi/${name}.json`, JSON.stringify(j.abi));
  console.log(`abi ${name}: ${j.abi.length} entries`);
}