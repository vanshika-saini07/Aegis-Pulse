import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { api, ApiError } from "../lib/api";
import { formatDateTime, travelModeLabels } from "../lib/format";
import type { CreateSessionPayload, RiskAssessment, RiskLevel, SafetySession } from "../types";

const riskCopy: Record<RiskLevel, { label: string; eyebrow: string }> = {
  LOW: { label: "Low contextual risk", eyebrow: "Signal is steady" },
  MODERATE: { label: "Moderate contextual risk", eyebrow: "Keep the tether close" },
  HIGH: { label: "High contextual risk", eyebrow: "Heightened awareness" },
};

const travelModes: CreateSessionPayload["travelMode"][] = ["WALKING", "CYCLING", "PUBLIC_TRANSPORT", "CAR", "OTHER"];

function unavailableCopy(error: ApiError | null) {
  if (!error) return "";
  if (error.code === "AI_NOT_CONFIGURED") return "AI brief is not configured for this environment. Your safety tether, check-ins, tracking and SOS remain active.";
  return "AI brief is temporarily unavailable. Your safety tether, check-ins, tracking and SOS remain active.";
}

function BriefDetails({ assessment }: { assessment: RiskAssessment }) {
  const copy = riskCopy[assessment.riskLevel];
  return <div className="safety-brief__result">
    <div className="safety-brief__risk-row">
      <span className="safety-brief__pulse" aria-hidden="true"><i /><i /></span>
      <div><p>{copy.eyebrow}</p><h3>{copy.label}</h3></div>
      <time dateTime={assessment.createdAt}>Generated {formatDateTime(assessment.createdAt)}</time>
    </div>
    <p className="safety-brief__summary">{assessment.summary}</p>
    <div className="safety-brief__columns">
      <div><h4>Contributing context</h4><ul>{assessment.contributingFactors.length ? assessment.contributingFactors.map((factor) => <li key={factor}>{factor}</li>) : <li>Journey details supplied</li>}</ul></div>
      <div><h4>Practical next steps</h4><ol>{assessment.safetyActions.map((action) => <li key={action}>{action}</li>)}</ol></div>
    </div>
    <div className="safety-brief__cadence"><span>Recommended check-in</span><strong>Every {assessment.recommendedCheckInMinutes} min</strong><small>Advisory only — your active journey timer stays under your control.</small></div>
  </div>;
}

interface SafetySignalBriefProps {
  session: SafetySession;
  readOnly?: boolean;
  onPersisted?: (assessment: RiskAssessment) => void;
}

export function SafetySignalBrief({ session, readOnly = false, onPersisted }: SafetySignalBriefProps) {
  const [open, setOpen] = useState(!session.latestRiskAssessment && !readOnly);
  const [context, setContext] = useState("");
  const [travelMode, setTravelMode] = useState<CreateSessionPayload["travelMode"]>(
    travelModes.includes(session.travelMode as CreateSessionPayload["travelMode"])
      ? session.travelMode as CreateSessionPayload["travelMode"]
      : "OTHER",
  );
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const generate = async () => {
    setGenerating(true);
    setError(null);
    try {
      const assessment = await api.generateRiskAssessment(session.id, {
        travelMode,
        ...(context.trim() ? { context: context.trim() } : {}),
      });
      onPersisted?.(assessment);
      setOpen(false);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught : new ApiError("AI brief is temporarily unavailable.", 0, "AI_UNAVAILABLE"));
      setOpen(true);
    } finally {
      setGenerating(false);
    }
  };

  const assessment = session.latestRiskAssessment;
  const title = readOnly || assessment ? "Safety Signal Brief" : "Set your safety signal";

  return <section className={`safety-brief ${assessment ? `safety-brief--${assessment.riskLevel.toLowerCase()}` : "safety-brief--idle"}`} aria-labelledby="safety-brief-title">
    <div className="safety-brief__header"><div><p className="eyebrow">Contextual AI guidance</p><h2 id="safety-brief-title">{title}</h2></div>{assessment && <span className="safety-brief__tag">Persisted brief</span>}</div>
    {assessment ? <BriefDetails assessment={assessment} /> : <div className="safety-brief__empty"><span className="safety-brief__pulse" aria-hidden="true"><i /><i /></span><div><h3>No brief generated yet.</h3><p>Use your journey timing and any non-sensitive concern to choose an appropriate check-in rhythm.</p></div></div>}
    {!readOnly && <div className="safety-brief__controls">
      {assessment && !open && <button className="brief-action" type="button" onClick={() => { setError(null); setOpen(true); }}>Retry / reanalyse</button>}
      {!assessment && !open && <button className="brief-action" type="button" onClick={() => setOpen(true)}>Generate AI Safety Brief</button>}
      <AnimatePresence initial={false}>
        {open && <motion.form className="safety-brief__form" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.24 }} onSubmit={(event) => { event.preventDefault(); void generate(); }}>
          <div className="brief-form-field"><label htmlFor="brief-mode">Travel mode</label><select id="brief-mode" value={travelMode} onChange={(event) => setTravelMode(event.target.value as CreateSessionPayload["travelMode"])} disabled={generating}>{travelModes.map((mode) => <option key={mode} value={mode}>{travelModeLabels[mode]}</option>)}</select></div>
          <div className="brief-form-field brief-form-field--wide"><label htmlFor="brief-context">Optional safety concern <span>0–500 characters</span></label><textarea id="brief-context" maxLength={500} value={context} onChange={(event) => setContext(event.target.value)} disabled={generating} placeholder="For example: unfamiliar transfer or a late arrival." /></div>
          <p className="safety-brief__form-note">Only timing, travel mode and this optional context are sent. Names, contacts, location, share code and event history stay private.</p>
          <div className="safety-brief__form-actions"><button className="brief-action" type="submit" disabled={generating}>{generating ? "Analysing safety signal…" : assessment ? "Generate revised brief" : "Generate AI Safety Brief"}</button>{assessment && <button className="text-button" type="button" onClick={() => setOpen(false)} disabled={generating}>Keep current brief</button>}</div>
        </motion.form>}
      </AnimatePresence>
      {error && <div className="safety-brief__error" role="alert"><span>{unavailableCopy(error)}</span><button className="text-button" type="button" onClick={() => void generate()} disabled={generating}>{generating ? "Retrying…" : "Retry"}</button></div>}
    </div>}
    <p className="safety-brief__disclaimer">Contextual guidance based on the details provided—not a guarantee of safety.</p>
  </section>;
}
