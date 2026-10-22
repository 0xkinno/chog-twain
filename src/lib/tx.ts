import type { Abi, Address, PublicClient, WalletClient, Hash, TransactionReceipt } from "viem";
import { ACTIVE_CHAIN, IS_LOCAL } from "./chains";
import limits from "./gas-limits.json";
import { explain } from "./errors";

export type GasKey = "open" | "join" | "showUp" | "showUpMeet" | "leave" | "cancel" | "poke" | "light" | "cheer" | "claim" | "setHome" | "approve";
export const gasFor = (k: GasKey): bigint => BigInt((limits as Record<string, number | string>)[k] as number);

export type Stage =
  | { stage: "simulating" }
  | { stage: "signing" }
  | { stage: "sent"; hash: Hash }
  | { stage: "proposed"; hash: Hash; block: bigint; ms: number }
  | { stage: "finalized"; hash: Hash; block: bigint; msFromSend: number; msFromProposed: number; feeWei: bigint; gasUsed: bigint }
  | { stage: "error"; text: string; name?: string; hash?: Hash; userRejected: boolean };

export interface TxArgs {
  publicClient: PublicClient;
  walletClient: WalletClient;
  account: Address;
  address: Address;
  abi: Abi;
  functionName: string;
  args?: readonly unknown[];
  gasKey: GasKey;
  onStage: (s: Stage) => void;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Every write: simulate first (custom errors become sentences before the popup), explicit gas from
 * gas-limits.json, then the two-stage postmark: receipt = "proposed", finalized block >= receipt block = "final".
 */
export async function runTx(t: TxArgs): Promise<{ hash: Hash; block: bigint; receipt: TransactionReceipt } | null> {
  const { publicClient: pc, walletClient: wc } = t;
  try {
    t.onStage({ stage: "simulating" });
    // the measured limit is the floor; if this chain prices an access higher than the local EVM, the live estimate wins
    let gas = gasFor(t.gasKey);
    try {
      const est = await pc.estimateContractGas({ account: t.account, address: t.address, abi: t.abi, functionName: t.functionName, args: t.args as never } as never);
      const padded = (est * 125n) / 100n;
      if (padded > gas) gas = padded;
    } catch { /* simulation below reports the revert as a sentence */ }
    const { request } = await pc.simulateContract({
      account: t.account, address: t.address, abi: t.abi, functionName: t.functionName, args: t.args as never, gas, chain: ACTIVE_CHAIN,
    } as never);
    t.onStage({ stage: "signing" });
    const t0 = performance.now();
    const hash = await wc.writeContract({ ...(request as object), gas, account: t.account, chain: ACTIVE_CHAIN } as never);
    t.onStage({ stage: "sent", hash });

    // proposed: poll the receipt every 300 ms
    let receipt = null as Awaited<ReturnType<typeof pc.getTransactionReceipt>> | null;
    for (let i = 0; i < 400 && !receipt; i++) {
      try { receipt = await pc.getTransactionReceipt({ hash }); } catch { await sleep(300); }
    }
    if (!receipt) throw new Error("The transaction was sent but no receipt arrived in two minutes. Check the explorer.");
    const tProposed = performance.now();
    if (receipt.status === "reverted") {
      t.onStage({ stage: "error", text: "The transaction reverted on chain. The explorer link shows why.", hash, userRejected: false });
      return null;
    }
    t.onStage({ stage: "proposed", hash, block: receipt.blockNumber, ms: Math.round(tProposed - t0) });

    // finalized: poll the finalized tag every 400 ms until it passes the receipt block. The caller gets the result at
    // "proposed" (the receipt exists and the state is readable); the stamp for finality arrives when the block is final.
    const block = receipt.blockNumber;
    void (async () => {
      const tag = IS_LOCAL ? "latest" : "finalized"; // a local dev chain has no finality stages
      for (let i = 0; i < 300; i++) {
        try {
          const fin = await pc.getBlock({ blockTag: tag });
          if (fin.number >= block) {
            const tFinal = performance.now();
            t.onStage({ stage: "finalized", hash, block, msFromSend: Math.round(tFinal - t0), msFromProposed: Math.round(tFinal - tProposed), feeWei: receipt.gasUsed * receipt.effectiveGasPrice, gasUsed: receipt.gasUsed });
            return;
          }
        } catch { /* a node without the finalized tag: the proposed stage already told the truth */ }
        await sleep(400);
      }
    })();
    return { hash, block, receipt };  } catch (e) {
    const x = explain(e);
    t.onStage({ stage: "error", text: x.text, name: x.name, userRejected: x.userRejected });
    return null;
  }
}