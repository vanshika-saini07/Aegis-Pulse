import { motion } from "motion/react";
import { useState } from "react";
import { api, ApiError } from "../lib/api";
import { getBrowserLocation } from "../lib/location";
import { useSession } from "../hooks/useSession";
import type { SafetySession } from "../types";
import { Brand } from "./Brand";
import { ErrorState, LoadingState } from "./Feedback";
import { Countdown, EventTimeline, JourneyFacts, StatusBadge, TetherMap } from "./SessionDisplay";
import { SafetySignalBrief } from "./SafetySignalBrief";
import { SosControl } from "./SosControl";

interface JourneyViewProps { shareCode: string; initialSession?: SafetySession | null; onHome: () => void; }

export function JourneyView({ shareCode, initialSession = null, onHome }: JourneyViewProps) {
  const { session, setSession, loading, error, refresh } = useSession(shareCode, 8_000, initialSession);
  const [busy, setBusy] = useState("");
  const [notice, setNotice] = useState(initialSession ? "Safety tether activated." : "");
  const [actionError, setActionError] = useState("");

  const run = async (key: string, operation: () => Promise<SafetySession>, success: string) => {
    setBusy(key); setActionError(""); setNotice("");
    try { setSession(await operation()); setNotice(success); }
    catch (caught) { setActionError(caught instanceof ApiError ? caught.message : "The signal could not be updated. Please retry."); }
    finally { setBusy(""); }
  };

  if (loading && !session) return <LoadingState />;
  if (error && !session) return <ErrorState error={error} onRetry={() => void refresh()} onHome={onHome} />;
  if (!session) return null;
  const isClosed = session.status === "SAFE";
  const isSos = session.status === "SOS";
  const trackingUrl = `${window.location.origin}/track/${session.shareCode}`;

  const checkIn = async () => { const coordinates = await getBrowserLocation(); await run("checkin", () => api.checkIn(session.id, coordinates), "Check-in received. Your tether is active."); };
  const updateLocation = async () => { setBusy("location"); setActionError(""); const coordinates = await getBrowserLocation(); if (!coordinates) { setBusy(""); setActionError("Location permission is unavailable. The rest of your safety tether remains active."); return; } setBusy(""); await run("location", () => api.updateLocation(session.id, coordinates), "Current location attached to the tether."); };
  const copyTrackingLink = async () => {
    try {
      if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(trackingUrl);
      else { const field = document.createElement("textarea"); field.value = trackingUrl; field.style.position = "fixed"; field.style.opacity = "0"; document.body.appendChild(field); field.select(); document.execCommand("copy"); field.remove(); }
      setNotice("Private tracking link copied.");
    } catch { setActionError("Could not copy the link. You can still share it directly."); }
  };
  const share = async () => {
    const shareData = { title: `${session.ownerName}'s Aegis Pulse journey`, text: `Follow my protected journey to ${session.destination} on Aegis Pulse.`, url: trackingUrl };
    if (navigator.share) { try { await navigator.share(shareData); setNotice("Tracking link shared."); return; } catch (caught) { if (caught instanceof DOMException && caught.name === "AbortError") return; } }
    window.open(`https://wa.me/?text=${encodeURIComponent(`${shareData.text}\n${trackingUrl}`)}`, "_blank", "noopener,noreferrer"); setNotice("WhatsApp share opened.");
  };

  return <motion.div className={`app-shell app-shell--${session.status.toLowerCase()}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.34 }}>
    <header className="app-header"><Brand compact onHome={onHome} /><div className="mode-label"><span>Traveller command surface</span><small>Private controls</small></div></header>
    {(session.status === "OVERDUE" || isSos) && <div className={`priority-banner priority-banner--${session.status.toLowerCase()}`} role="alert"><strong>{isSos ? "SOS signal is live" : "Your check-in is overdue"}</strong><span>{isSos ? `${session.trustedContactName} can see this emergency state now.` : "Check in when safe to restore the active tether."}</span></div>}
    <main className="companion-layout"><section className="companion-main"><div className="session-kicker"><p className="eyebrow">Live journey / {session.shareCode.slice(0, 6).toUpperCase()}</p><StatusBadge status={session.status} /></div><div className="session-title"><div><span>Heading to</span><h1>{session.destination}</h1></div><Countdown session={session} /></div><TetherMap session={session} />
      <SafetySignalBrief session={session} onPersisted={(assessment) => setSession((current) => current ? { ...current, latestRiskAssessment: assessment } : current)} />
      {!isClosed && !isSos && <section className="action-dock" aria-label="Journey safety actions"><button className="safe-button" type="button" onClick={() => void checkIn()} disabled={Boolean(busy)}><span className="safe-button__icon" aria-hidden="true">✓</span><span><strong>{busy === "checkin" ? "Checking in…" : "I'm safe"}</strong><small>Reset the safety timer</small></span></button><div className="secondary-actions"><button className="button button--line" type="button" onClick={() => void share()} disabled={Boolean(busy)}>Share with trusted contact</button><button className="button button--line" type="button" onClick={() => void copyTrackingLink()} disabled={Boolean(busy)}>Copy private link</button><button className="button button--line" type="button" onClick={() => void updateLocation()} disabled={Boolean(busy)}>{busy === "location" ? "Locating…" : "Update location"}</button><SosControl disabled={Boolean(busy)} busy={busy === "sos"} onTrigger={() => run("sos", () => api.triggerSos(session.id, null), "SOS activated and recorded immediately.")} /></div></section>}
      {isSos && <section className="sos-active-panel"><span className="sos-rings" aria-hidden="true"><i /><i /></span><div><p className="eyebrow">Emergency mode</p><h2>SOS is broadcasting.</h2><p>Your latest journey state and available location are visible on the private link.</p></div><button className="button button--light" type="button" onClick={() => void share()}>Share SOS link</button></section>}
      {isClosed && <section className="completion-panel"><span aria-hidden="true">✓</span><div><p className="eyebrow">Tether closed</p><h2>You arrived safe.</h2><p>{session.trustedContactName} can see the completed status on the shared link.</p></div><button className="button button--dark" type="button" onClick={onHome}>Start another journey</button></section>}
      {(notice || actionError) && <div className={`toast ${actionError ? "toast--error" : "toast--success"}`} role="status"><span>{actionError || notice}</span><button type="button" onClick={() => { setNotice(""); setActionError(""); }} aria-label="Dismiss message">×</button></div>}
    </section><aside className="companion-side"><section className="facts-panel"><div className="section-heading"><div><p className="eyebrow">Tether detail</p><h2>Journey pulse</h2></div></div><JourneyFacts session={session} /></section>{!isClosed && !isSos && <button className="complete-button" type="button" disabled={Boolean(busy)} onClick={() => { if (window.confirm("Mark this journey complete and tell your trusted contact you arrived safely?")) void run("complete", () => api.completeSession(session.id), "Journey completed safely."); }}><span>Complete journey</span><strong>{busy === "complete" ? "Closing…" : "Mark arrival safe →"}</strong></button>}</aside><EventTimeline events={session.events} /></main>
  </motion.div>;
}
