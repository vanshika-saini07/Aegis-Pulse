import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { lazy, Suspense, useEffect, useRef, useState, type FormEvent } from "react";
import { api, ApiError } from "../lib/api";
import { getBrowserLocation } from "../lib/location";
import type { Coordinates, CreateSessionPayload, SafetySession } from "../types";
import { Brand } from "./Brand";
import { MagneticButton } from "./MagneticButton";
import type { TetherStage } from "./scene/SafetyFieldScene";
import { StatusBadge } from "./SessionDisplay";

gsap.registerPlugin(ScrollTrigger);

const SafetyFieldScene = lazy(() => import("./scene/SafetyFieldScene").then((module) => ({ default: module.SafetyFieldScene })));

function TetherScene({ progress, stage, className, compact = false }: { progress: number; stage: TetherStage; className?: string; compact?: boolean }) {
  return <Suspense fallback={<div className={`scene-loader ${className ?? ""}`} aria-hidden="true" />}><SafetyFieldScene progress={progress} stage={stage} className={className} compact={compact} /></Suspense>;
}

interface LandingProps { onStarted: (session: SafetySession) => void; }
type FormFields = Omit<CreateSessionPayload, "durationMinutes"> & { durationMinutes: string };

const initialForm: FormFields = { ownerName: "", destination: "", durationMinutes: "30", travelMode: "WALKING", trustedContactName: "", trustedContactPhone: "" };
const story = [
  { eyebrow: "01 / Expected return", title: "A journey begins with an expected return.", copy: "Set where you are going and the rhythm of the check-ins that bring you safely home." },
  { eyebrow: "02 / Signal gap", title: "Silence should not go unnoticed.", copy: "When a check-in is missed, the tether does not look away. It becomes clear, timely, and actionable." },
  { eyebrow: "03 / Private tether", title: "One private link keeps someone in the loop.", copy: "Your trusted contact sees the real journey state without needing an account or your internal details." },
  { eyebrow: "04 / Protective network", title: "Check in. Escalate. Arrive safe.", copy: "Every signal has a place: a calm check-in, a visible overdue state, or an intentional SOS." },
];

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

function TetherStory({ onStart }: { onStart: () => void }) {
  const storyRef = useRef<HTMLElement>(null);
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState<TetherStage>(0);
  const [mobile, setMobile] = useState(false);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const media = window.matchMedia("(max-width: 760px)");
    const update = () => setMobile(media.matches);
    update(); media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (!storyRef.current || mobile || reduceMotion) return;
    const context = gsap.context(() => {
      ScrollTrigger.create({ trigger: storyRef.current, start: "top top", end: "+=2800", pin: true, scrub: 0.65, anticipatePin: 1,
        onUpdate: (self) => { const value = Math.min(0.999, self.progress); setProgress(value); setStage(Math.min(3, Math.floor(value * 4)) as TetherStage); },
      });
    }, storyRef);
    return () => context.revert();
  }, [mobile, reduceMotion]);

  if (mobile || reduceMotion) return (
    <section className="story-mobile" id="how-it-works" aria-labelledby="story-mobile-title">
      <div className="section-rail"><span /> Tether walkthrough</div><h2 id="story-mobile-title">Safety should move with the journey.</h2>
      <div className="story-mobile__flow">{story.map((item, index) => <article key={item.eyebrow} className="story-mobile__chapter"><TetherScene stage={index as TetherStage} progress={index / 4} compact /><p>{item.eyebrow}</p><h3>{item.title}</h3><span>{item.copy}</span></article>)}</div>
      <MagneticButton type="button" onClick={onStart}>Create the tether <span aria-hidden="true">↓</span></MagneticButton>
    </section>
  );

  const active = story[stage];
  return (
    <section className="tether-story" ref={storyRef} id="how-it-works" data-stage={stage} aria-labelledby="story-title">
      <div className="tether-story__frame">
        <div className="story-grid-lines" aria-hidden="true" />
        <div className="story-index" aria-hidden="true"><span>{String(stage + 1).padStart(2, "0")}</span><i /><span>04</span></div>
        <div className="story-copy"><AnimatePresence mode="wait"><motion.div key={active.eyebrow} initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -18 }} transition={{ duration: 0.42, ease: [0.22, 0.8, 0.24, 1] }}><p className="section-rail">{active.eyebrow}</p><h2 id="story-title">{active.title}</h2><p>{active.copy}</p></motion.div></AnimatePresence></div>
        <TetherScene progress={progress} stage={stage} className="tether-story__scene" />
        <div className="story-status" aria-live="polite"><i /> {stage === 1 ? "CHECKPOINT REQUIRES ATTENTION" : stage > 1 ? "TRUSTED NETWORK CONNECTED" : "JOURNEY SIGNAL ACTIVE"}</div>
        <div className="story-stepper" aria-hidden="true">{story.map((item, index) => <i key={item.eyebrow} className={index <= stage ? "is-active" : ""} />)}</div>
      </div>
    </section>
  );
}

function TrustedCircleWalkthrough() {
  return <section className="trusted-walkthrough" aria-labelledby="circle-title">
    <div className="trusted-walkthrough__intro"><p className="section-rail">Trusted-circle view</p><h2 id="circle-title">The person waiting gets a calm, useful signal.</h2><p>This is a product walkthrough—not live activity. The shared page only shows the journey state that the traveller has actually created.</p></div>
    <div className="trusted-walkthrough__preview" aria-label="Trusted-contact product walkthrough"><div className="walkthrough-topline"><span>PRIVATE TRACKING LINK</span><i>Walkthrough</i></div><div className="walkthrough-orbit" aria-hidden="true"><span /><span /><b /></div><div className="walkthrough-state"><StatusBadge status="ACTIVE" /><strong>Journey signal visible</strong><p>Location is only shown when the traveller shares it.</p></div><ol className="walkthrough-list"><li><i>01</i><span>Open the private link.</span></li><li><i>02</i><span>See check-ins and status changes.</span></li><li><i>03</i><span>Respond if the tether escalates.</span></li></ol></div>
  </section>;
}

export function Landing({ onStarted }: LandingProps) {
  const [form, setForm] = useState<FormFields>(initialForm);
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null);
  const [locationState, setLocationState] = useState<"idle" | "locating" | "ready" | "unavailable">("idle");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const formRef = useRef<HTMLElement>(null);

  const requestLocation = () => { if (locationState === "locating" || locationState === "ready") return; setLocationState("locating"); void getBrowserLocation().then((position) => { setCoordinates(position); setLocationState(position ? "ready" : "unavailable"); }); };
  const beginJourney = () => { requestLocation(); window.setTimeout(() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 10); };
  const viewStory = () => document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth", block: "start" });
  const update = (field: keyof FormFields, value: string) => { setForm((current) => ({ ...current, [field]: value })); setErrors((current) => ({ ...current, [field]: "" })); };

  const submit = async (event: FormEvent) => {
    event.preventDefault(); const validationErrors = validate(form); setErrors(validationErrors); setApiError(""); if (Object.keys(validationErrors).length > 0) return;
    setSubmitting(true);
    try { const session = await api.createSession({ ownerName: form.ownerName.trim(), destination: form.destination.trim(), durationMinutes: Number(form.durationMinutes), travelMode: form.travelMode, trustedContactName: form.trustedContactName.trim(), trustedContactPhone: form.trustedContactPhone.trim(), ...(coordinates ?? {}) }); onStarted(session); }
    catch (caught) { if (caught instanceof ApiError) { setApiError(caught.message); if (caught.fields) setErrors(Object.fromEntries(Object.entries(caught.fields).map(([key, messages]) => [key, messages[0]]))); } else setApiError("We could not activate this tether. Please retry."); }
    finally { setSubmitting(false); }
  };

  return <div className="landing-shell landing-shell--new">
    <header className="landing-header"><Brand /><div className="landing-header__signal"><i /> SAFETY TETHER READY</div><button className="landing-header__link" type="button" onClick={viewStory}>How it works <span aria-hidden="true">↓</span></button></header>
    <main>
      <section className="tether-hero" aria-labelledby="hero-title"><div className="tether-hero__system"><span>AP / 01</span><i /><span>PRIVATE SAFETY LAYER</span></div><motion.div className="tether-hero__copy" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.22, 0.8, 0.24, 1] }}><p className="section-rail">Live personal safety tether</p><h1 id="hero-title">You should never <em>disappear</em> between two places.</h1><p>Aegis Pulse keeps your trusted person connected to your real journey, check-ins, and safety signal.</p><div className="tether-hero__actions"><MagneticButton type="button" onClick={beginJourney}>Start a safe journey <span aria-hidden="true">↘</span></MagneticButton><MagneticButton type="button" tone="quiet" onClick={viewStory}>See how the tether works <span aria-hidden="true">↓</span></MagneticButton></div></motion.div><TetherScene className="tether-hero__scene" progress={0.06} stage={0} /><div className="tether-hero__caption"><span>TRAVELLER BEACON</span><i /><span>EXPECTED ROUTE</span><i /><span>TRUSTED ANCHOR</span></div></section>
      <TetherStory onStart={beginJourney} />
      <section className="journey-transition" ref={formRef} aria-labelledby="start-title"><div className="journey-transition__lead"><p className="section-rail">The real product</p><h2 id="start-title">Create a journey worth checking in on.</h2><p>A private tracking link is created only after this journey is saved securely.</p><ol className="real-steps"><li><i>01</i><span>Create your journey.</span></li><li><i>02</i><span>Share the private link.</span></li><li><i>03</i><span>Check in while travelling.</span></li><li><i>04</i><span>Escalate or arrive safe.</span></li></ol></div>
        <motion.form className="tether-form" onSubmit={submit} noValidate initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.15 }} transition={{ duration: 0.5 }}><div className="form-field form-field--wide"><label htmlFor="ownerName">Your name</label><input id="ownerName" autoComplete="name" value={form.ownerName} onChange={(event) => update("ownerName", event.target.value)} aria-invalid={Boolean(errors.ownerName)} aria-describedby={errors.ownerName ? "ownerName-error" : undefined} placeholder="Maya Rao" />{errors.ownerName && <span className="field-error" id="ownerName-error">{errors.ownerName}</span>}</div><div className="form-field form-field--wide"><label htmlFor="destination">Destination</label><input id="destination" value={form.destination} onChange={(event) => update("destination", event.target.value)} aria-invalid={Boolean(errors.destination)} aria-describedby={errors.destination ? "destination-error" : undefined} placeholder="North Campus Hostel" />{errors.destination && <span className="field-error" id="destination-error">{errors.destination}</span>}</div><div className="form-field"><label htmlFor="durationMinutes">Journey duration</label><div className="field-with-suffix"><input id="durationMinutes" type="number" inputMode="numeric" min="5" max="720" value={form.durationMinutes} onChange={(event) => update("durationMinutes", event.target.value)} aria-invalid={Boolean(errors.durationMinutes)} /><span>MIN</span></div>{errors.durationMinutes && <span className="field-error">{errors.durationMinutes}</span>}</div><div className="form-field"><label htmlFor="travelMode">Travel mode</label><select id="travelMode" value={form.travelMode} onChange={(event) => update("travelMode", event.target.value)}><option value="WALKING">Walking</option><option value="CYCLING">Cycling</option><option value="PUBLIC_TRANSPORT">Public transport</option><option value="CAR">Car / cab</option><option value="OTHER">Other</option></select></div><div className="tether-form__divider"><span>Trusted person</span></div><div className="form-field"><label htmlFor="trustedContactName">Contact name</label><input id="trustedContactName" autoComplete="name" value={form.trustedContactName} onChange={(event) => update("trustedContactName", event.target.value)} aria-invalid={Boolean(errors.trustedContactName)} placeholder="Arjun Rao" />{errors.trustedContactName && <span className="field-error">{errors.trustedContactName}</span>}</div><div className="form-field"><label htmlFor="trustedContactPhone">Phone number</label><input id="trustedContactPhone" type="tel" autoComplete="tel" value={form.trustedContactPhone} onChange={(event) => update("trustedContactPhone", event.target.value)} aria-invalid={Boolean(errors.trustedContactPhone)} placeholder="+91 98765 43210" />{errors.trustedContactPhone && <span className="field-error">{errors.trustedContactPhone}</span>}</div><div className={`location-bridge location-bridge--${locationState}`} aria-live="polite"><i /><span>{locationState === "idle" && "Location is optional; request it when you start."}{locationState === "locating" && "Requesting your location…"}{locationState === "ready" && "Current location is ready to attach securely."}{locationState === "unavailable" && "Location is unavailable; your tether can still start."}</span>{locationState !== "ready" && <button type="button" onClick={requestLocation} disabled={locationState === "locating"}>Use location</button>}</div>{apiError && <div className="form-api-error" role="alert">{apiError}</div>}<MagneticButton type="submit" tone="sage" disabled={submitting} className="tether-form__submit">{submitting ? "Securing journey…" : "Activate safety tether"}<span aria-hidden="true">↗</span></MagneticButton><p className="tether-form__privacy">A random secure code powers your private tracking link. No account required.</p></motion.form>
      </section>
      <TrustedCircleWalkthrough />
      <section className="landing-final" aria-labelledby="final-title"><p className="section-rail">Aegis Pulse / safety tether</p><h2 id="final-title">Every journey deserves a <em>signal home.</em></h2><MagneticButton type="button" onClick={beginJourney}>Start a safe journey <span aria-hidden="true">↗</span></MagneticButton></section>
    </main>
    <footer className="landing-footer"><Brand compact /><span>Personal safety, carried gently.</span><span>AP / 2026</span></footer>
  </div>;
}
