// Builds the gaze (Side trait) Merkle tree that ChogTwain checks on-chain.
// Leaf format: OpenZeppelin StandardMerkleTree ["uint256", "uint8"] = [tokenId, gaze],
// gaze 1 = Left, 2 = Right, 3 = Front (the ten 1:1s).
// Writes data/gaze.json (root + per-token proofs, served to the browser) and
// data/gaze-stats.json (counts that README and the UI read; never typed by hand).
// Usage: node scripts/build-gaze.mjs [path/to/collection.json]
import { StandardMerkleTree } from "@openzeppelin/merkle-tree";
import { readFileSync, writeFileSync } from "node:fs";

const src = process.argv[2] ?? "data/collection.json";
const col = JSON.parse(readFileSync(src, "utf8"));
const tokens = col.tokens ?? col;

const values = [];
const counts = { Left: 0, Right: 0, Front: 0 };
for (const [id, t] of Object.entries(tokens)) {
  const attrs = t.attributes ?? t.a ?? {};
  let side = attrs.Side;
  // Discovery: the ten 1:1 Legendaries carry only Base and Tier, so they have no Side.
  // In the art they face the viewer, so they get side 3 (Front). Anything else missing is an error.
  if (side === undefined && attrs.Base === "1:1") side = "Front";
  if (!["Left", "Right", "Front"].includes(side)) throw new Error(`token ${id} has no usable Side (got ${side})`);
  counts[side]++;
  values.push([BigInt(id).toString(), side === "Left" ? 1 : side === "Right" ? 2 : 3]);
}
if (values.length !== 1969) throw new Error(`expected 1969 tokens, got ${values.length}`);

const tree = StandardMerkleTree.of(values, ["uint256", "uint8"]);
const proofs = {};
for (const [i, v] of tree.entries()) proofs[v[0]] = { side: v[1], proof: tree.getProof(i) };

writeFileSync("data/gaze.json", JSON.stringify({ root: tree.root, proofs }));
const stats = {
  root: tree.root,
  tokens: values.length,
  left: counts.Left,
  right: counts.Right,
  front: counts.Front,
  // A Chog walks with one pair at a time and Left must meet Right (or a Front 1:1), so at most this
  // many walks can run at once, and at least this many right-facing Chogs are always waiting.
  maxSimultaneousWalks: Math.min(counts.Left + counts.Front, counts.Right),
  rightAlwaysWaiting: Math.max(0, counts.Right - counts.Left - counts.Front),
  source: src,
  builtAt: new Date().toISOString(),
};
writeFileSync("data/gaze-stats.json", JSON.stringify(stats, null, 2));
console.log(stats);
