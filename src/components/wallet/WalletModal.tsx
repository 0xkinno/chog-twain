"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useAccount, useChainId, useConnect, useConnectors, useDisconnect, useSwitchChain } from "wagmi";
import { ACTIVE_CHAIN, IS_LOCAL } from "@/lib/chains";
import { explain } from "@/lib/errors";

interface Ctx { open: () => void; close: () => void }
const WalletCtx = createContext<Ctx>({ open: () => {}, close: () => {} });
export const useWalletModal = () => useContext(WalletCtx);

export function WalletModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setOpen] = useState(false);
  const open = useCallback(() => setOpen(true), []);
  const close = useCallback(() => setOpen(false), []);
  const value = useMemo(() => ({ open, close }), [open, close]);
  return (
    <WalletCtx.Provider value={value}>
      {children}
      {isOpen && <WalletModal onClose={close} />}
    </WalletCtx.Provider>
  );
}

function WalletModal({ onClose }: { onClose: () => void }) {
  const connectors = useConnectors();
  const { connectAsync, isPending } = useConnect();
  const { isConnected } = useAccount();
  const [err, setErr] = useState<string | null>(null);
  const [mobile, setMobile] = useState(false);
  useEffect(() => { setMobile(/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)); }, []);
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [onClose]);
  useEffect(() => { if (isConnected) onClose(); }, [isConnected, onClose]);

  // EIP-6963 wallets carry an id and an icon; the generic injected connector is shown only when it is the only way in
  const discovered = connectors.filter((c) => c.icon || c.id !== "injected");
  const list = discovered.length ? discovered : connectors;
  const host = typeof window !== "undefined" ? window.location.host + window.location.pathname : "";

  return (
    <div className="scrim" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal stack" role="dialog" aria-modal="true" aria-labelledby="wm-title" style={{ ["--gap" as string]: "14px" }}>
        <div className="row" style={{ justifyContent: "space-between" }}>
          <h3 id="wm-title">Connect a wallet</h3>
          <button className="btn btn-ghost btn-small" onClick={onClose} aria-label="Close">Close</button>
        </div>
        <p className="muted">Any wallet with a little MON works. You do not need a Chog. The Demo needs no wallet at all.</p>
        {list.length === 0 && <div className="notice warn">No browser wallet found. Install one, or open this page inside your wallet app.</div>}
        <div className="stack" style={{ ["--gap" as string]: "8px" }}>
          {list.map((c) => (
            <button
              key={c.uid}
              className="wallet-row"
              disabled={isPending}
              onClick={async () => {
                setErr(null);
                try { await connectAsync({ connector: c, chainId: ACTIVE_CHAIN.id }); } catch (e) { setErr(explain(e).text); }
              }}
            >
              {c.icon ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={c.icon} alt="" /> : <span aria-hidden style={{ width: 32, height: 32, borderRadius: 8, background: "var(--paper-2)" }} />}
              <span>{c.name}</span>
            </button>
          ))}
        </div>
        {mobile && (
          <a className="btn btn-ghost" href={`https://link.metamask.io/dapp/${host}`} rel="noopener">Open in MetaMask app</a>
        )}
        {err && <div className="notice bad" role="alert">{err}</div>}
        {IS_LOCAL && <p className="mono muted">Local test chain 31337</p>}
      </div>
    </div>
  );
}

/** One button when the wallet is on another network. Falls back to wallet_addEthereumChain. */
export function SwitchToMonad({ small = false }: { small?: boolean }) {
  const chainId = useChainId();
  const { chainId: walletChain, connector } = useAccount();
  const { switchChainAsync, isPending } = useSwitchChain();
  const [err, setErr] = useState<string | null>(null);
  if (!walletChain || walletChain === chainId) return null;
  return (
    <div className="stack" style={{ ["--gap" as string]: "6px" }}>
      <button
        className={`btn ${small ? "btn-small" : ""}`}
        disabled={isPending}
        onClick={async () => {
          setErr(null);
          try {
            await switchChainAsync({ chainId: ACTIVE_CHAIN.id });
          } catch {
            try {
              const p = (await connector?.getProvider()) as { request: (a: { method: string; params: unknown[] }) => Promise<unknown> } | undefined;
              await p?.request({
                method: "wallet_addEthereumChain",
                params: [{ chainId: "0x" + ACTIVE_CHAIN.id.toString(16), chainName: ACTIVE_CHAIN.name, nativeCurrency: ACTIVE_CHAIN.nativeCurrency, rpcUrls: ACTIVE_CHAIN.rpcUrls.default.http, blockExplorerUrls: ACTIVE_CHAIN.blockExplorers ? [ACTIVE_CHAIN.blockExplorers.default.url] : [] }],
              });
            } catch (e2) { setErr(explain(e2).text); }
          }
        }}
      >
        Switch to {ACTIVE_CHAIN.name}
      </button>
      {err && <span className="notice bad" role="alert">{err}</span>}
    </div>
  );
}

export function useDisconnectWallet() { return useDisconnect(); }