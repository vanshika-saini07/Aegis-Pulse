import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";

interface SosControlProps {
  disabled?: boolean;
  busy?: boolean;
  onTrigger: () => Promise<void>;
}

export function SosControl({ disabled, busy, onTrigger }: SosControlProps) {
  const [armed, setArmed] = useState(false);
  const [holding, setHolding] = useState(false);
  const timer = useRef<number | null>(null);

  const cancelHold = () => {
    if (timer.current != null) window.clearTimeout(timer.current);
    timer.current = null;
    setHolding(false);
  };

  const startHold = () => {
    if (disabled || busy || holding) return;
    setHolding(true);
    timer.current = window.setTimeout(() => {
      timer.current = null;
      setHolding(false);
      void onTrigger().then(() => setArmed(false));
    }, 1500);
  };

  useEffect(() => {
    if (!armed) cancelHold();
    return cancelHold;
  }, [armed]);

  useEffect(() => {
    if (!armed) return;
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") setArmed(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [armed]);

  const keyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if ((event.key === "Enter" || event.key === " ") && !event.repeat) {
      event.preventDefault();
      startHold();
    }
  };
  const keyUp = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === "Enter" || event.key === " ") cancelHold();
  };
  const pointerDown = (event: PointerEvent<HTMLButtonElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    startHold();
  };

  if (!armed) {
    return <button className="button button--sos-outline" type="button" disabled={disabled || busy} onClick={() => setArmed(true)}>Activate SOS</button>;
  }

  return (
    <div className="sos-confirm" role="alertdialog" aria-labelledby="sos-title" aria-describedby="sos-help">
      <div><strong id="sos-title">Emergency signal</strong><p id="sos-help">Press and hold for 1.5 seconds to activate SOS.</p></div>
      <button
        className={`hold-button ${holding ? "is-holding" : ""}`}
        type="button"
        disabled={busy}
        onPointerDown={pointerDown}
        onPointerUp={cancelHold}
        onPointerCancel={cancelHold}
        onKeyDown={keyDown}
        onKeyUp={keyUp}
        onContextMenu={(event) => event.preventDefault()}
      >
        <span>{busy ? "Sending SOS…" : holding ? "Keep holding…" : "Hold for SOS"}</span>
      </button>
      <button className="text-button" type="button" onClick={() => setArmed(false)} disabled={busy}>Cancel</button>
    </div>
  );
}
