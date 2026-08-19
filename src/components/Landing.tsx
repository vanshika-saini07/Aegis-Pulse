import { useRef, useState, type FormEvent } from "react";
import { api, ApiError } from "../lib/api";
import { getBrowserLocation } from "../lib/location";
import type { Coordinates, CreateSessionPayload, SafetySession } from "../types";
import { Brand } from "./Brand";

interface LandingProps {
  onStarted: (session: SafetySession) => void;
}

type FormFields = Omit<CreateSessionPayload, "durationMinutes"> & { durationMinutes: string };

const initialForm: FormFields = {
  ownerName: "",
  destination: "",
  durationMinutes: "30",
  travelMode: "WALKING",
  trustedContactName: "",
  trustedContactPhone: "",
};

function validate(form: FormFields) {
  const errors: Record<string, string> = {};
  if (form.ownerName.trim().length < 2) errors.ownerName = "Enter your name.";
  if (form.destination.trim().length < 2) errors.destination = "Enter your destination.";
  const duration = Number(form.durationMinutes);
  if (!Number.isInteger(duration) || duration < 5 || duration > 720) errors.durationMinutes = "Choose 5–720 minutes.";
  if (form.trustedContactName.trim().length < 2) errors.trustedContactName = "Enter your contact’s name.";
  if (!/^\+?[0-9][0-9\s()-]{6,29}$/.test(form.trustedContactPhone.trim())) errors.trustedContactPhone = "Enter a valid phone number.";
  return errors;
}

export function Landing({ onStarted }: LandingProps) {
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<FormFields>(initialForm);
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null);
  const [locationState, setLocationState] = useState<"idle" | "locating" | "ready" | "unavailable">("idle");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const formRef = useRef<HTMLElement>(null);

  const beginJourney = () => {
    setFormOpen(true);
    window.setTimeout(() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
    if (locationState !== "idle") return;
    setLocationState("locating");
    void getBrowserLocation().then((position) => {
      setCoordinates(position);
      setLocationState(position ? "ready" : "unavailable");
    });
  };

  const update = (field: keyof FormFields, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: "" }));
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const validationErrors = validate(form);
    setErrors(validationErrors);
    setApiError("");
    if (Object.keys(validationErrors).length > 0) return;

    setSubmitting(true);
    try {
      const session = await api.createSession({
        ownerName: form.ownerName.trim(),
        destination: form.destination.trim(),
        durationMinutes: Number(form.durationMinutes),
        travelMode: form.travelMode,
        trustedContactName: form.trustedContactName.trim(),
        trustedContactPhone: form.trustedContactPhone.trim(),
        ...(coordinates ?? {}),
      });
      onStarted(session);
    } catch (caught) {
      if (caught instanceof ApiError) {
        setApiError(caught.message);
        if (caught.fields) {
          setErrors(Object.fromEntries(Object.entries(caught.fields).map(([key, messages]) => [key, messages[0]])));
        }
      } else {
        setApiError("We couldn’t start this journey. Please retry.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="landing-shell">
      <header className="site-header">
        <Brand />
        <span className="header-status"><i /> Phase 1 · Live</span>
      </header>

      <main>
        <section className="hero">
          <div className="hero-copy">
            <p className="eyebrow"><span>01</span> Personal safety, kept close</p>
            <h1>Never travel<br /><em>unseen.</em></h1>
            <p className="hero-deck">A live safety tether between you and someone you trust—through every turn, check-in, and arrival.</p>
            <button className="button button--coral button--large" type="button" onClick={beginJourney}>
              Start a protected journey <span aria-hidden="true">↗</span>
            </button>
            <div className="hero-proof" aria-label="Aegis Pulse capabilities">
              <span>Live status</span><span>Timed check-ins</span><span>One-touch SOS</span>
            </div>
          </div>

          <div className="signal-stage" aria-label="Live tether signal illustration">
            <div className="signal-grid" aria-hidden="true" />
            <div className="route route-a" aria-hidden="true" />
            <div className="route route-b" aria-hidden="true" />
            <div className="signal-node signal-node--origin">
              <span className="node-pulse" aria-hidden="true" />
              <strong>YOU</strong>
              <small>Signal active</small>
            </div>
            <div className="signal-node signal-node--contact">
              <strong>TRUSTED</strong>
              <small>Watching</small>
            </div>
            <div className="signal-node signal-node--waypoint"><span /></div>
            <div className="signal-readout">
              <span>AEGIS / TETHER 001</span>
              <strong>CONNECTED</strong>
            </div>
          </div>
        </section>

        <section className="principles" aria-label="How Aegis Pulse works">
          <article><span>01</span><h2>Set the journey.</h2><p>Add where you’re going and who should keep watch.</p></article>
          <article><span>02</span><h2>Keep the pulse.</h2><p>One tap confirms you’re safe. A missed check-in becomes visible.</p></article>
          <article><span>03</span><h2>Arrive connected.</h2><p>Complete the journey and close the tether as safe.</p></article>
        </section>

        {formOpen && (
          <section className="start-section" ref={formRef} aria-labelledby="start-title">
            <div className="form-intro">
              <p className="eyebrow"><span>02</span> Create tether</p>
              <h2 id="start-title">Where are you headed?</h2>
              <p>Your trusted contact receives a private live link. Location is helpful, never required.</p>
              <div className={`location-note location-note--${locationState}`} aria-live="polite">
                <i aria-hidden="true" />
                {locationState === "locating" && "Requesting your current location…"}
                {locationState === "ready" && "Current location attached securely."}
                {locationState === "unavailable" && "Location unavailable—you can continue normally."}
                {locationState === "idle" && "Location has not been requested."}
              </div>
            </div>

            <form className="journey-form" onSubmit={submit} noValidate>
              <div className="field field--wide">
                <label htmlFor="ownerName">Your name</label>
                <input id="ownerName" autoComplete="name" value={form.ownerName} onChange={(e) => update("ownerName", e.target.value)} aria-invalid={Boolean(errors.ownerName)} aria-describedby={errors.ownerName ? "ownerName-error" : undefined} placeholder="Maya Rao" />
                {errors.ownerName && <span className="field-error" id="ownerName-error">{errors.ownerName}</span>}
              </div>
              <div className="field field--wide">
                <label htmlFor="destination">Destination</label>
                <input id="destination" value={form.destination} onChange={(e) => update("destination", e.target.value)} aria-invalid={Boolean(errors.destination)} aria-describedby={errors.destination ? "destination-error" : undefined} placeholder="North Campus Hostel" />
                {errors.destination && <span className="field-error" id="destination-error">{errors.destination}</span>}
              </div>
              <div className="field">
                <label htmlFor="durationMinutes">Estimated duration</label>
                <div className="input-suffix"><input id="durationMinutes" type="number" inputMode="numeric" min="5" max="720" value={form.durationMinutes} onChange={(e) => update("durationMinutes", e.target.value)} aria-invalid={Boolean(errors.durationMinutes)} /><span>min</span></div>
                {errors.durationMinutes && <span className="field-error">{errors.durationMinutes}</span>}
              </div>
              <div className="field">
                <label htmlFor="travelMode">Travel mode</label>
                <select id="travelMode" value={form.travelMode} onChange={(e) => update("travelMode", e.target.value)}>
                  <option value="WALKING">Walking</option>
                  <option value="CYCLING">Cycling</option>
                  <option value="PUBLIC_TRANSPORT">Public transport</option>
                  <option value="CAR">Car / cab</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <div className="form-divider"><span>Trusted contact</span></div>
              <div className="field">
                <label htmlFor="trustedContactName">Contact name</label>
                <input id="trustedContactName" autoComplete="name" value={form.trustedContactName} onChange={(e) => update("trustedContactName", e.target.value)} aria-invalid={Boolean(errors.trustedContactName)} placeholder="Arjun Rao" />
                {errors.trustedContactName && <span className="field-error">{errors.trustedContactName}</span>}
              </div>
              <div className="field">
                <label htmlFor="trustedContactPhone">Phone number</label>
                <input id="trustedContactPhone" type="tel" autoComplete="tel" value={form.trustedContactPhone} onChange={(e) => update("trustedContactPhone", e.target.value)} aria-invalid={Boolean(errors.trustedContactPhone)} placeholder="+91 98765 43210" />
                {errors.trustedContactPhone && <span className="field-error">{errors.trustedContactPhone}</span>}
              </div>
              {apiError && <div className="form-api-error" role="alert">{apiError}</div>}
              <button className="button button--dark button--submit" type="submit" disabled={submitting}>
                {submitting ? <><span className="mini-spinner" /> Securing journey…</> : <>Activate safety tether <span aria-hidden="true">→</span></>}
              </button>
              <p className="form-footnote">Your link uses a random secure code. No account required.</p>
            </form>
          </section>
        )}
      </main>

      <footer className="site-footer"><Brand compact /><p>Live reassurance for the road between here and safe.</p><span>Built for PromptWars · 2026</span></footer>
    </div>
  );
}
