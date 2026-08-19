import { motion } from "motion/react";
import { useSession } from "../hooks/useSession";
import { Brand } from "./Brand";
import { ErrorState, LoadingState } from "./Feedback";
import { Countdown, EventTimeline, JourneyFacts, StatusBadge, TetherMap } from "./SessionDisplay";
import { SafetySignalBrief } from "./SafetySignalBrief";

export function MonitorView({ shareCode, onHome }: { shareCode: string; onHome: () => void }) {
  const { session, loading, refreshing, error, refresh } = useSession(shareCode, 7_500);
  if (loading && !session) return <LoadingState label="Connecting to the journey" />;
  if (error && !session) return <ErrorState error={error} onRetry={() => void refresh()} onHome={onHome} />;
  if (!session) return null;

  const emergency = session.status === "SOS";
  const overdue = session.status === "OVERDUE";

  return <motion.div className={`app-shell monitor-shell app-shell--${session.status.toLowerCase()}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.34 }}>
    <header className="app-header"><Brand compact onHome={onHome} /><div className="mode-label mode-label--live"><i className={refreshing ? "is-refreshing" : ""} /><span>Trusted-contact view</span><small>Auto-refreshing live</small></div></header>
    {emergency && <div className="priority-banner priority-banner--sos" role="alert"><strong>{session.ownerName} activated SOS</strong><span>Contact local emergency services if they may be in immediate danger.</span></div>}
    {overdue && <div className="priority-banner priority-banner--overdue" role="alert"><strong>{session.ownerName} missed a check-in</strong><span>Try reaching them directly. This page will update automatically.</span></div>}
    {session.status === "SAFE" && <div className="priority-banner priority-banner--safe"><strong>{session.ownerName} arrived safely</strong><span>The protected journey is complete.</span></div>}
    <main className="companion-layout"><section className="companion-main"><div className="session-kicker"><p className="eyebrow">Watching / {session.shareCode.slice(0, 6).toUpperCase()}</p><StatusBadge status={session.status} /></div><div className="session-title"><div><span>{session.ownerName} is heading to</span><h1>{session.destination}</h1></div><Countdown session={session} /></div><TetherMap session={session} /><SafetySignalBrief session={session} readOnly /><div className="monitor-note"><i aria-hidden="true">◎</i><div><strong>You are connected to {session.ownerName}'s live safety tether.</strong><p>Status refreshes every few seconds. Location coordinates appear only when the traveller has shared them.</p></div><button className="text-button" type="button" onClick={() => void refresh()} disabled={refreshing}>{refreshing ? "Refreshing…" : "Refresh now"}</button></div></section>
      <aside className="companion-side"><section className="facts-panel"><div className="section-heading"><div><p className="eyebrow">Live detail</p><h2>Journey pulse</h2></div></div><JourneyFacts session={session} /></section><div className="privacy-note"><span aria-hidden="true">⌁</span><p><strong>Private tracking link</strong>Only people with this secure URL can open this monitoring view.</p></div></aside><EventTimeline events={session.events} /></main>
  </motion.div>;
}
