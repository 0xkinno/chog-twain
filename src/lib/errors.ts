export const ERROR_COPY: Record<string, string> = {
  BadGaze: "That gaze value is not valid.",
  BadProof: "That proof does not match the published collection data.",
  GazeUnknown: "We need to show which way this Chog looks first. Try again; the proof is included.",
  NotFacing: "These two Chogs do not look at each other. Pick one that faces this Chog.",
  BadChog: "That is not a Chog Genesis token number.",
  ChogBusy: "This Chog is already walking with someone. Pick another, or cheer them on.",
  HomeOnly: "This Chog's holder keeps it for themselves.",
  NotHolder: "Only the wallet holding this Chog can do that.",
  BadDistance: "Pick 7, 14 or 30 days.",
  NotOpen: "This walk is no longer waiting for a friend.",
  NotWalking: "This walk has ended. The steps it took are still here.",
  InviteExpired: "This invite is more than 3 days old.",
  NotInvited: "This walk was opened for someone else.",
  SelfWalk: "A walk needs two different wallets.",
  NotWalker: "Only the two people on this walk can show up for it.",
  AlreadyToday: "You already showed up today. The day turns at 00:00 UTC.",
  LanternsFull: "This walk already holds three lanterns.",
  StillOpen: "Only the opener can cancel before the invite expires.",
  TransferFailed: "The $CHOG transfer did not go through.",
  NothingToClaim: "There is nothing to claim yet.",
};

type Walkable = { walk?: (fn: (e: unknown) => unknown) => unknown; shortMessage?: string; message?: string; name?: string; code?: number; cause?: unknown; data?: { errorName?: string } };

/** Turns anything a wallet or RPC throws into one honest sentence. Custom errors map through ERROR_COPY. */
export function explain(err: unknown): { text: string; name?: string; userRejected: boolean } {
  const e = err as Walkable;
  // walk the cause chain for a decoded custom error
  let name: string | undefined;
  let cur: Walkable | undefined = e;
  for (let i = 0; i < 8 && cur; i++) {
    if (cur.data?.errorName) { name = cur.data.errorName; break; }
    if (cur.name === "ContractFunctionRevertedError" && (cur as { data?: { errorName?: string } }).data?.errorName) { name = (cur as { data: { errorName: string } }).data.errorName; break; }
    cur = cur.cause as Walkable | undefined;
  }
  if (!name) {
    const m = /(?:reverted with the following (?:custom )?error:?|custom error)\s*:?\s*(\w+)\(/i.exec(e?.message ?? "");
    if (m && ERROR_COPY[m[1]]) name = m[1];
  }
  if (name && ERROR_COPY[name]) return { text: ERROR_COPY[name], name, userRejected: false };
  const msg = `${e?.shortMessage ?? ""} ${e?.message ?? ""}`;
  if (e?.code === 4001 || /user rejected|user denied|rejected the request/i.test(msg)) return { text: "You closed the wallet popup. Nothing was sent.", userRejected: true };
  if (/insufficient funds|exceeds the balance/i.test(msg)) return { text: "Not enough MON in this wallet to pay the network fee.", userRejected: false };
  if (/allowance/i.test(msg)) return { text: "The $CHOG allowance is too low. Approve the exact amount first.", userRejected: false };
  if (/chain|network/i.test(msg) && /mismatch|switch/i.test(msg)) return { text: "Your wallet is on another network. Switch to Monad.", userRejected: false };
  return { text: (e?.shortMessage ?? e?.message ?? "Something went wrong.").split("\n")[0].slice(0, 220), userRejected: false };
}