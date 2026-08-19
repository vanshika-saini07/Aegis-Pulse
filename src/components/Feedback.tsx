import type { ApiError } from "../lib/api";

export function LoadingState({ label = "Locating the live signal" }: { label?: string }) {
  return (
    <main className="state-page" aria-live="polite" aria-busy="true">
      <div className="signal-loader" aria-hidden="true"><span /><span /><span /></div>
      <p className="eyebrow">Secure link</p>
      <h1>{label}<span className="ellipsis">…</span></h1>
    </main>
  );
}

export function ErrorState({ error, onRetry, onHome }: { error: ApiError; onRetry: () => void; onHome: () => void }) {
  const missing = error.status === 404;
  return (
    <main className="state-page">
      <div className="state-code">{missing ? "404" : "SIGNAL LOST"}</div>
      <p className="eyebrow">{missing ? "Journey not found" : "Connection interrupted"}</p>
      <h1>{missing ? "This tether is no longer available." : error.message}</h1>
      <p>{missing ? "Check that the trusted-contact link is complete, or ask the traveller to share it again." : "Your journey data is still protected. Reconnect to see its latest state."}</p>
      <div className="button-row">
        {!missing && <button className="button button--dark" type="button" onClick={onRetry}>Retry signal</button>}
        <button className="button button--line" type="button" onClick={onHome}>Aegis Pulse home</button>
      </div>
    </main>
  );
}
