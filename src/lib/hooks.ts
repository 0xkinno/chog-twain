"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";
import { useQueryClient } from "@tanstack/react-query";
import type { Address, Hash, PublicClient, WalletClient } from "viem";
import { maxUint256, parseEventLogs } from "viem";
import { ACTIVE_CHAIN } from "./chains";
import { CHOG_TOKEN, ERC20_ABI, TWAIN, TWAIN_ABI } from "./contracts";
import { runTx, type GasKey, type Stage } from "./tx";
import { chogAmount } from "./format";

export function useClients() {
  const { address, isConnected, chainId } = useAccount();
  const pc = usePublicClient({ chainId: ACTIVE_CHAIN.id }) as PublicClient | undefined;
  const { data: wc } = useWalletClient({ chainId: ACTIVE_CHAIN.id });
  const wrongChain = isConnected && chainId !== ACTIVE_CHAIN.id;
  return { pc, wc: wc as WalletClient | undefined, address: address as Address | undefined, isConnected, wrongChain };
}

export interface TxState { stage: Stage | null; label: string; busy: boolean; note?: string }

/** Runs writes one after another (approve, then the action), reporting each stage for the postmark panel. */
export function useTx() {
  const { pc, wc, address } = useClients();
  const qc = useQueryClient();
  const [state, setState] = useState<TxState>({ stage: null, label: "", busy: false });
  const mounted = useRef(true);
  useEffect(() => () => { mounted.current = false; }, []);

  const set = useCallback((s: Partial<TxState>) => { if (mounted.current) setState((p) => ({ ...p, ...s })); }, []);

  const send = useCallback(
    async (label: string, functionName: string, args: readonly unknown[], gasKey: GasKey, opts?: { address?: Address; abi?: typeof TWAIN_ABI; note?: string }) => {
      if (!pc || !wc || !address) { set({ stage: { stage: "error", text: "Connect a wallet first.", userRejected: false }, label, busy: false }); return null; }
      set({ busy: true, label, note: opts?.note, stage: { stage: "simulating" } });
      const r = await runTx({
        publicClient: pc, walletClient: wc, account: address,
        address: opts?.address ?? (TWAIN as Address), abi: opts?.abi ?? TWAIN_ABI, functionName, args, gasKey,
        onStage: (s) => set({ stage: s, label }),
      });
      set({ busy: false });
      if (r) qc.invalidateQueries();
      return r;
    },
    [pc, wc, address, qc, set],
  );

  /** Pledge and lantern flows: ask for an exact approve first (never unlimited). */
  const ensureAllowance = useCallback(
    async (amount: bigint): Promise<boolean> => {
      if (!pc || !address || !TWAIN || amount === 0n) return true;
      const have = (await pc.readContract({ address: CHOG_TOKEN, abi: ERC20_ABI, functionName: "allowance", args: [address, TWAIN] })) as bigint;
      if (have >= amount) return true;
      const r = await send(`Allow exactly ${chogAmount(amount)} $CHOG`, "approve", [TWAIN, amount], "approve", {
        address: CHOG_TOKEN, abi: ERC20_ABI as never, note: `1 of 2: allow exactly ${chogAmount(amount)} $CHOG`,
      });
      return !!r;
    },
    [pc, address, send],
  );

  const reset = useCallback(() => setState({ stage: null, label: "", busy: false }), []);
  return useMemo(() => ({ state, send, ensureAllowance, reset }), [state, send, ensureAllowance, reset]);
}

export function parseOpened(receipt: { logs: readonly unknown[] }): number | null {
  const logs = parseEventLogs({ abi: TWAIN_ABI, logs: receipt.logs as never, eventName: "Opened" }) as unknown as { args: { walkId: bigint } }[];
  return logs.length ? Number(logs[0].args.walkId) : null;
}

/** Re-render each second. Used by the countdown to 00:00 UTC. */
export function useNow(ms = 1000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), ms); return () => clearInterval(t); }, [ms]);
  return now;
}

export { maxUint256 };
export type { Hash };