"use client";
import { useAccount, useBalance, useDisconnect, useReadContract } from "wagmi";
import { CHOG_TOKEN, ERC20_ABI } from "@/lib/contracts";
import { SYMBOL } from "@/lib/chains";
import { chogAmount, monAmount, short } from "@/lib/format";
import { PowerIcon } from "@/components/ui/Icons";
import { useWalletModal } from "./WalletModal";

export function WalletCapsule() {
  const { address, isConnected, chainId } = useAccount();
  const { open } = useWalletModal();
  const { disconnect } = useDisconnect();
  const { data: bal } = useBalance({ address, query: { enabled: !!address, refetchInterval: 8_000 } });
  const { data: chog } = useReadContract({ address: CHOG_TOKEN, abi: ERC20_ABI, functionName: "balanceOf", args: address ? [address] : undefined, query: { enabled: !!address, refetchInterval: 8_000 } });
  void chainId;
  if (!isConnected || !address) {
    return <button className="btn btn-small nav-wallet" onClick={open} data-testid="connect">Connect</button>;
  }
  return (
    <span className="capsule nav-wallet" data-testid="wallet-capsule">
      <span title={address}>{short(address)}</span>
      <span className="bal" data-testid="mon-balance">{bal ? `${monAmount(bal.value, 3)} ${SYMBOL}` : "..."}</span>
      <span className="bal" data-testid="chog-balance">{typeof chog === "bigint" ? `${chogAmount(chog, 0)} $CHOG` : "..."}</span>
      <button className="power" onClick={() => disconnect()} aria-label="Disconnect" title="Disconnect"><PowerIcon /></button>
    </span>
  );
}