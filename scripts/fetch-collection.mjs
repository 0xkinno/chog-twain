// Rebuilds data/collection.json from the chain and IPFS. No snapshot from anyone else is trusted.
// 1. tokenURI(id) for ids 1..1969 through Multicall3 on Monad mainnet (token id != artwork number).
// 2. Fetch each metadata JSON from IPFS with gateway fallback, record sha256 of the raw bytes.
// Usage: MONAD_RPC_URL=https://rpc.monad.xyz node scripts/fetch-collection.mjs
import { createPublicClient, http, parseAbi } from "viem";
import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync, existsSync, readFileSync } from "node:fs";

const CHOG = "0xc96d31F8626c6D03Fae5dCD3d61e3FB9F4a73763";
const MULTICALL3 = "0xcA11bde05977b3631167028862bE2a173976CA11";
const SUPPLY = 1969;
const GATEWAYS = [
  "https://ipfs.filebase.io/ipfs/",
  "https://ipfs.io/ipfs/",
  "https://dweb.link/ipfs/",
  "https://gateway.pinata.cloud/ipfs/",
];

const chain = {
  id: 143,
  name: "Monad",
  nativeCurrency: { name: "MON", symbol: "MON", decimals: 18 },
  rpcUrls: { default: { http: [process.env.MONAD_RPC_URL ?? "https://rpc.monad.xyz"] } },
  contracts: { multicall3: { address: MULTICALL3 } },
};
const client = createPublicClient({ chain, transport: http(undefined, { retryCount: 5, batch: false }) });
const abi = parseAbi(["function tokenURI(uint256) view returns (string)"]);

async function tokenURIs() {
  const out = {};
  const ids = Array.from({ length: SUPPLY }, (_, i) => i + 1);
  for (let i = 0; i < ids.length; i += 200) {
    const chunk = ids.slice(i, i + 200);
    const res = await client.multicall({
      contracts: chunk.map((id) => ({ address: CHOG, abi, functionName: "tokenURI", args: [BigInt(id)] })),
      allowFailure: true,
    });
    res.forEach((r, k) => {
      if (r.status !== "success") throw new Error(`tokenURI(${chunk[k]}) failed: ${r.error?.shortMessage}`);
      out[chunk[k]] = r.result;
    });
    await new Promise((r) => setTimeout(r, 250)); // public RPC: 25 rps
  }
  return out;
}

async function fetchIpfs(uri) {
  const path = uri.replace(/^ipfs:\/\//, "");
  let last;
  for (const g of GATEWAYS) {
    try {
      const res = await fetch(g + path, { signal: AbortSignal.timeout(15000) });
      if (!res.ok) throw new Error(`${res.status}`);
      return Buffer.from(await res.arrayBuffer());
    } catch (e) {
      last = e;
    }
  }
  throw new Error(`all gateways failed for ${uri}: ${last}`);
}

const head = await client.getBlockNumber();
const uris = await tokenURIs();
mkdirSync("data", { recursive: true });
const cachePath = "data/.metadata-cache.json";
const cache = existsSync(cachePath) ? JSON.parse(readFileSync(cachePath, "utf8")) : {};
const tokens = {};
for (let id = 1; id <= SUPPLY; id++) {
  const uri = uris[id];
  if (!cache[uri]) cache[uri] = (await fetchIpfs(uri)).toString("base64");
  const raw = Buffer.from(cache[uri], "base64");
  const meta = JSON.parse(raw.toString("utf8"));
  const attrs = Object.fromEntries((meta.attributes ?? []).map((a) => [a.trait_type, String(a.value)]));
  tokens[id] = {
    tokenId: id,
    name: meta.name,
    tokenURI: uri,
    image: meta.image,
    attributes: attrs,
    metadataSha256: createHash("sha256").update(raw).digest("hex"),
  };
  if (id % 100 === 0) {
    writeFileSync(cachePath, JSON.stringify(cache));
    console.log(`fetched ${id}/${SUPPLY}`);
  }
}
writeFileSync(cachePath, JSON.stringify(cache));
writeFileSync(
  "data/collection.json",
  JSON.stringify({ chainId: 143, collection: CHOG, tokenURIBlock: head.toString(), retrievedAt: new Date().toISOString(), tokens }, null, 1),
);
console.log(`wrote data/collection.json at block ${head}`);
