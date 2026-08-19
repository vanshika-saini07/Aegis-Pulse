import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { formatCountdown, formatDateTime, formatRelative, travelModeLabels } from "../lib/format";
import type { EventType, SafetyEvent, SafetySession, SessionStatus } from "../types";

const statusCopy: Record<SessionStatus, { label: string; detail: string }> = {
  ACTIVE: { label: "Signal active", detail: "Journey is protected" },
  SAFE: { label: "Arrived safe", detail: "Journey completed" },
  OVERDUE: { label: "Check-in overdue", detail: "Attention requested" },
  SOS: { label: "SOS active", detail: "Immediate help requested" },
};

const eventLabels: Record<EventType, string> = {
  SESSION_STARTED: "Journey started",
  CHECK_IN: "Checked in safe",
  LOCATION_UPDATE: "Location refreshed",
  SOS_TRIGGERED: "SOS activated",
  OVERDUE: "Check-in missed",
  COMPLETED: "Arrived safely",
};

export function StatusBadge({ status }: { status: SessionStatus }) {
  return <div className={`status-badge status-badge--${status.toLowerCase()}`} role="status"><i aria-hidden="true" /><span><strong>{statusCopy[status].label}</strong><small>{statusCopy[status].detail}</small></span></div>;
}

export function Countdown({ session }: { session: SafetySession }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const timer = window.setInterval(() => setNow(Date.now()), 1_000); return () => window.clearInterval(timer); }, []);
  const target = new Date(session.startedAt).getTime() + session.durationMinutes * 60_000;
  const complete = session.status === "SAFE";
  return <div className="countdown-block"><span>{complete ? "Journey closed" : "Estimated arrival in"}</span><strong>{complete ? "SAFE" : formatCountdown(target - now)}</strong><small>{complete && session.endedAt ? `Completed ${formatDateTime(session.endedAt)}` : `${session.durationMinutes} minute journey`}</small></div>;
}

export function TetherMap({ session }: { session: SafetySession }) {
  const hasLocation = session.lastLatitude != null && session.lastLongitude != null;
  const coordinate = hasLocation ? `LAT ${session.lastLatitude!.toFixed(4)} / LNG ${session.lastLongitude!.toFixed(4)}` : "No location shared";
  return <section className={`tether-map tether-map--${session.status.toLowerCase()}`} aria-label="Journey signal field">
    <div className="map-grid" aria-hidden="true" /><div className="map-path map-path--one" aria-hidden="true" /><div className="map-path map-path--two" aria-hidden="true" />
    <div className="map-node map-node--user"><i /><span>{session.ownerName.split(" ")[0]}</span></div><div className="map-node map-node--contact"><i /><span>{session.trustedContactName.split(" ")[0]}</span></div><div className="map-signal" aria-hidden="true"><i /><i /><i /></div>
    <div className="map-caption"><span>{hasLocation ? "LATEST SHARED COORDINATE" : "LOCATION SIGNAL"}</span><strong>{coordinate}</strong></div>
  </section>;
}

export function JourneyFacts({ session }: { session: SafetySession }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const timer = window.setInterval(() => setNow(Date.now()), 30_000); return () => window.clearInterval(timer); }, []);
  return <dl className="journey-facts"><div><dt>Destination</dt><dd>{session.destination}</dd></div><div><dt>Travel mode</dt><dd>{travelModeLabels[session.travelMode] ?? session.travelMode}</dd></div><div><dt>Last check-in</dt><dd>{formatRelative(session.lastCheckInAt, now)}</dd></div><div><dt>Next required</dt><dd>{session.status === "SAFE" || session.status === "SOS" ? "—" : formatRelative(session.nextCheckInAt, now)}</dd></div><div><dt>Trusted contact</dt><dd>{session.trustedContactName}<small>{session.trustedContactPhone}</small></dd></div><div><dt>Journey began</dt><dd>{formatDateTime(session.startedAt)}</dd></div></dl>;
}

function EventIcon({ type }: { type: EventType }) {
  const symbols: Record<EventType, string> = { SESSION_STARTED: "↗", CHECK_IN: "✓", LOCATION_UPDATE: "+", SOS_TRIGGERED: "!", OVERDUE: "!", COMPLETED: "✓" };
  return <i className={`event-icon event-icon--${type.toLowerCase()}`} aria-hidden="true">{symbols[type]}</i>;
}

export function EventTimeline({ events }: { events: SafetyEvent[] }) {
  return <section className="timeline-section" aria-labelledby="timeline-title"><div className="section-heading"><div><p className="eyebrow">Signal log</p><h2 id="timeline-title">Journey timeline</h2></div><span>{events.length} event{events.length === 1 ? "" : "s"}</span></div>{events.length === 0 ? <div className="timeline-empty"><p>No safety events yet.</p><span>The live signal will appear here.</span></div> : <ol className="event-list">{events.map((event, index) => <motion.li key={event.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.28, delay: Math.min(index, 5) * 0.035 }}><EventIcon type={event.type} /><div><strong>{eventLabels[event.type]}</strong><p>{event.message ?? "Safety status updated"}</p></div><time dateTime={event.createdAt}>{formatDateTime(event.createdAt)}</time></motion.li>)}</ol>}</section>;
}
