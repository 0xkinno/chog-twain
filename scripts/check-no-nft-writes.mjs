// I14 (CI): the contracts never write to Chog Genesis. The only call on it in contracts/src is ownerOf, the
// interface declares nothing else, and there is no approval or NFT custody. Also enforced in Foundry by
// test_noNftWrites.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const files = [];
(function walk(d) {
  for (const n of readdirSync(d)) {
    const p = join(d, n);
    if (statSync(p).isDirectory()) walk(p);
    else if (n.endsWith(".sol")) files.push(p);
  }
})("contracts/src");

let bad = 0;
for (const f of files) {
  if (f.replace(/\\/g, "/").includes("/mocks/") || f.replace(/\\/g, "/").includes("/ablation/")) continue;
  const src = readFileSync(f, "utf8");
  for (const m of src.matchAll(/\bCHOG\.(\w+)\(/g)) if (m[1] !== "ownerOf") (console.log(`${f}: call CHOG.${m[1]}`), bad++);
  const iface = src.match(/interface IChogGenesis\s*\{([^}]*)\}/);
  if (iface) {
    const fns = [...iface[1].matchAll(/function\s+(\w+)/g)].map((x) => x[1]);
    if (fns.length !== 1 || fns[0] !== "ownerOf") (console.log(`${f}: IChogGenesis declares ${fns.join(",")}`), bad++);
  }
  if (/safeTransferFrom|setApprovalForAll/.test(src)) (console.log(`${f}: NFT custody call`), bad++);
}
console.log(bad ? `check-no-nft-writes: ${bad} problem(s)` : `check-no-nft-writes: clean (${files.length} files)`);
process.exit(bad ? 1 : 0);