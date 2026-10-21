"use client";
import { useEffect, useState } from "react";
import { GlowCard } from "@/components/ui/GlowCard";
import { FolioLine } from "@/components/ui/Icons";
import { rpcReport, ACTIVE_CHAIN, explorerAddr, explorerTx, IS_LOCAL } from "@/lib/chains";
import { TWAIN, POSTCARD, CHOG_GENESIS, CHOG_TOKEN, DEPLOYED } from "@/lib/contracts";
import { GITHUB_URL } from "@/lib/links";

export interface Facts {
  generatedAt: string;
  gaze?: { left: number; right: number; front: number; root: string; maxSimultaneousWalks: number; rightAlwaysWaiting: number };
  tests?: { forge?: { passed: number; failed: number; suites: number }; vitest?: { passed: number; failed: number } | null; playwright?: { passed: number; failed: number; skipped?: number } | null; fuzzRuns?: number };
  gasLimits?: Record<string, number | string>;
  measurements?: { latency?: { chain: string; samples: number; proposedMedianMs: number; finalMedianMs: number }; d7?: Record<string, unknown>; d8?: Record<string, unknown> } | null;
  breakCampaign?: { error: string; hash: string; note?: string }[] | null;
  chain?: { block: string; walkCount: number; meetings: number; totalSteps: number } | { error: string } | null;
  deployed?: boolean;
}

const INVARIANTS: [string, string, string, string][] = [
  ["I1", "A meeting needs at least `distance` steps, and a step needs both people on the same UTC day", "showUp, _step", "test_sevenTogetherDaysMakeAMeeting, testFuzz_meetingNeedsRealDays"],
  ["I2", "At most one step per walk per day", "stepped, AlreadyToday", "test_aMeetingCannotBeRushed"],
  ["I3", "Only the two walkers can show up", "NotWalker", "test_strangerCannotShowUp"],
  ["I4", "A wallet cannot walk with itself", "SelfWalk", "test_oneWalletCannotWalkWithItself"],
  ["I5", "Only Chogs that look at each other can meet; gaze must match the published root", "canMeet, proveGaze", "test_onlyChogsThatLookAtEachOtherCanMeet, test_forgedGazeReverts, GazeProofCompat"],
  ["I6", "A Chog walks with one pair at a time, world-wide", "activeWalkOf", "test_aChogWalksWithOnePairAtATime, invariant_noChogInTwoActiveWalks"],
  ["I7", "A missed day drifts; steps walked are never taken back; three unkept days end the walk", "_roll, _miss", "test_aMissedDayDriftsThemApart, test_threeUnkeptDaysPartThemForGood"],
  ["I8", "A lantern keeps only a day on which exactly one person came; max 3", "_roll, light", "test_lanternKeepsADayOnlyOneCameTo, test_lanternNeverCoversADayNobodyCame, test_lanternsCapAtThree"],
  ["I9", "Every $CHOG is accounted for", "_end, claim", "testFuzz_meetingNeedsRealDays, invariant_chogConserved"],
  ["I10", "A missed day costs only the one who missed it; walking away costs the whole pledge", "_miss, leave", "test_aMissedDayCostsTheOneWhoMissedIt, test_leaveBeforeAnyMiss"],
  ["I11", "Postcards cannot move", "TwainPostcard._update", "test_postcardIsSoulbound"],
  ["I12", "Holder extras follow the token", "setHome, _pickable", "test_holderSealAndHome, test_homeFollowsTheTokenAfterASale"],
  ["I13", "Nobody needs to own a Chog", "open, join", "test_nobodyNeedsToOwnAChog"],
  ["I14", "The contract never writes to Chog Genesis", "no such call exists", "test_noNftWrites, scripts/check-no-nft-writes.mjs in CI"],
  ["I15", "preview equals what the chain will do", "preview", "test_previewMatchesWhatTheChainWillDo"],
];

export function ProofPage({ facts }: { facts: Facts | null }) {
  const [rpc, setRpc] = useState({ ...rpcReport });
  useEffect(() => { const t = setInterval(() => setRpc({ ...rpcReport }), 1500); return () => clearInterval(t); }, []);
  const sourcify = (a?: string) => (a ? `https://repo.sourcify.dev/contracts/full_match/${ACTIVE_CHAIN.id}/${a}/` : "");
  const row = (name: string, a?: string) => (
    <tr key={name}><td>{name}</td><td className="mono">{a ?? "not in this build"}</td><td>{a && !IS_LOCAL ? <><a href={explorerAddr(a)} rel="noopener" target="_blank">MonadVision</a> {"\u00b7"} <a href={sourcify(a)} rel="noopener" target="_blank">Sourcify</a></> : a ? "local chain" : ""}</td></tr>
  );
  return (
    <div className="page wrap stack" style={{ ["--gap" as string]: "28px" }}>
      <header className="stack" style={{ ["--gap" as string]: "8px" }}>
        <FolioLine extra="PROOF" />
        <h1 className="display sticker-type" style={{ fontSize: "clamp(2.6rem,6.5vw,5rem)", lineHeight: 1 }}>Proof</h1>
        <p className="editorial" style={{ fontSize: "1.3rem", maxWidth: 760 }}>A meeting cannot be bought or rushed: it takes at least N real days on which both people showed up. Every part of this page proves it from a different angle.</p>
      </header>

      <GlowCard className="flat stack" data-testid="proof-addresses">
        <h2 style={{ fontSize: "1.6rem" }}>Addresses</h2>
        {!DEPLOYED && <div className="notice warn">No ChogTwain address is set in this build, so the first two rows are empty. Nothing here is faked.</div>}
        <div className="table-scroll" tabIndex={0} role="region" aria-label="Scrollable table"><table className="table"><thead><tr><th>Contract</th><th>Address</th><th>Links</th></tr></thead><tbody>
          {row("ChogTwain (immutable, no admin)", TWAIN)}{row("TwainPostcard (soulbound)", POSTCARD)}{row("Chog Genesis (read only)", CHOG_GENESIS)}{row("$CHOG", CHOG_TOKEN)}
        </tbody></table></div>
        <p className="mono muted">Network: {ACTIVE_CHAIN.name} ({ACTIVE_CHAIN.id}) {"\u00b7"} Gaze root: {facts?.gaze?.root ?? "not generated"}</p>
      </GlowCard>

      <GlowCard className="flat stack" data-testid="proof-invariants">
        <h2 style={{ fontSize: "1.6rem" }}>Invariants and the tests that guard them</h2>
        <div className="table-scroll" tabIndex={0} role="region" aria-label="Scrollable table"><table className="table"><thead><tr><th>ID</th><th>Invariant</th><th>Enforced in</th><th>Tests</th></tr></thead><tbody>
          {INVARIANTS.map(([id, t, e, tests]) => <tr key={id}><td className="mono">{id}</td><td>{t}</td><td className="mono">{e}</td><td className="mono" style={{ fontSize: ".8rem" }}>{tests}</td></tr>)}
        </tbody></table></div>
        <p className="mono muted">Foundry: {facts?.tests?.forge ? `${facts.tests.forge.passed} passing, ${facts.tests.forge.failed} failing` : "n/a"} {"\u00b7"} Vitest: {facts?.tests?.vitest ? `${facts.tests.vitest.passed} passing` : "n/a"} {"\u00b7"} fuzz runs: {facts?.tests?.fuzzRuns ?? "n/a"} {"\u00b7"} 18 shared scenarios run against the contract and the TypeScript engine</p>
      </GlowCard>

      <GlowCard className="flat stack">
        <h2 style={{ fontSize: "1.6rem" }}>The fuzz finding</h2>
        <p>Because a missed day reopens the gap, a meeting takes <strong>at least</strong> N steps, not exactly N, and a pair that alternates can walk forever. The fuzz test found a counterexample at 16 steps for a distance of 14. The rule is therefore stated as "at least", and <span className="kbd">testFuzz_meetingNeedsRealDays</span> keeps asserting it.</p>
      </GlowCard>

      <GlowCard className="flat stack" data-testid="proof-breaks">
        <h2 style={{ fontSize: "1.6rem" }}>Break campaign</h2>
        {facts?.breakCampaign?.length ? (
          <div className="table-scroll" tabIndex={0} role="region" aria-label="Scrollable table"><table className="table"><thead><tr><th>Guard</th><th>Reverted transaction</th></tr></thead><tbody>{facts.breakCampaign.map((b) => <tr key={b.hash}><td>{b.error}</td><td><a className="mono" href={explorerTx(b.hash)} rel="noopener" target="_blank">{b.hash.slice(0, 18)}...</a></td></tr>)}</tbody></table></div>
        ) : <p className="muted">Deliberately reverted mainnet transactions, one per guard (NotWalker, AlreadyToday, BadProof, SelfWalk, NotFacing, ChogBusy, InviteExpired), are linked here once the contract is live and Kinnoski approves the campaign. None are listed yet.</p>}
      </GlowCard>

      <div className="grid g2" style={{ alignItems: "start" }}>
        <GlowCard className="flat stack" data-testid="proof-gas">
          <h2 style={{ fontSize: "1.6rem" }}>Gas and fees</h2>
          <p className="muted">Monad charges gas limit times price, not gas used, so every write sends a tight explicit limit measured by <span className="kbd">scripts/gas-table.mjs</span>: the highest observed gas, times 1.25, rounded up to 1,000.</p>
          <table className="table"><tbody>{Object.entries(facts?.gasLimits ?? {}).filter(([, v]) => typeof v === "number").map(([k, v]) => <tr key={k}><td className="mono">{k}</td><td className="mono">{Number(v).toLocaleString("en-US")}</td></tr>)}</tbody></table>
        </GlowCard>
        <GlowCard className="flat stack" data-testid="proof-rpc">
          <h2 style={{ fontSize: "1.6rem" }}>Latency and RPC</h2>
          <p>Which RPC answered last in this tab: <strong className="mono" data-testid="rpc-host">{rpc.host}</strong> ({rpc.count} responses, {rpc.failures} failures).</p>
          <p className="muted">Public Monad RPCs return logs only 100 blocks per call and a day is 288,000 blocks, so pages read storage views through Multicall3 and never scan logs.</p>
          {facts?.measurements?.latency ? <p className="mono">Proposed {facts.measurements.latency.proposedMedianMs} ms, final {facts.measurements.latency.finalMedianMs} ms (median of {facts.measurements.latency.samples}, {facts.measurements.latency.chain})</p> : <p className="mono muted">Latency not measured yet.</p>}
        </GlowCard>
      </div>

      <GlowCard className="flat stack">
        <h2 style={{ fontSize: "1.6rem" }}>Verify it yourself</h2>
        <pre className="kbd" style={{ whiteSpace: "pre-wrap", padding: 14 }}>{`git clone ${GITHUB_URL}\ncd chog-twain && npm install\nnode scripts/verify.mjs`}</pre>
        <p className="muted">The verifier rebuilds the gaze root from the collection data and compares it with the contract, optionally refetches metadata from IPFS and compares sha256, recomputes every walk from its events with the same rules engine the Demo uses, and decodes every postcard. It prints PASS or FAIL for each step.</p>
        <p className="mono muted">FACTS generated {facts?.generatedAt ?? "never"}</p>
      </GlowCard>

      <GlowCard className="flat stack">
        <h2 style={{ fontSize: "1.6rem" }}>Honest notes</h2>
        <ul style={{ margin: 0, paddingLeft: "1.2rem" }}>
          <li>One person with two wallets can walk alone. Nothing rewards it except their own record, and pledges between your own wallets only move your own $CHOG.</li>
          <li>The day is a UTC day. 00:00 UTC is 02:00 in Leipzig in summer and 05:30 in Pune.</li>
          <li>Monad is not required by the rules, which would run on any EVM chain. Monad makes a daily on-chain tap cost a fraction of a cent and lets the second arrival land in under a second.</li>
        </ul>
      </GlowCard>
    </div>
  );
}