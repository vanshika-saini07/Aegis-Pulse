import { useEffect, useState } from "react";
import { JourneyView } from "./components/JourneyView";
import { Landing } from "./components/Landing";
import { MonitorView } from "./components/MonitorView";
import type { SafetySession } from "./types";

type Route = { name: "home" } | { name: "journey" | "track"; shareCode: string };

function currentRoute(): Route {
  const match = window.location.pathname.match(/^\/(journey|track)\/([A-Za-z0-9_-]{20,32})\/?$/);
  if (match) return { name: match[1] as "journey" | "track", shareCode: match[2] };
  return { name: "home" };
}

export function App() {
  const [route, setRoute] = useState<Route>(currentRoute);
  const [createdSession, setCreatedSession] = useState<SafetySession | null>(null);

  useEffect(() => {
    const onPopState = () => {
      setCreatedSession(null);
      setRoute(currentRoute());
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const navigateHome = () => {
    window.history.pushState({}, "", "/");
    setCreatedSession(null);
    setRoute({ name: "home" });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (route.name === "track") return <MonitorView shareCode={route.shareCode} onHome={navigateHome} />;
  if (route.name === "journey") return <JourneyView shareCode={route.shareCode} initialSession={createdSession} onHome={navigateHome} />;

  return (
    <Landing
      onStarted={(session) => {
        setCreatedSession(session);
        window.history.pushState({}, "", `/journey/${session.shareCode}`);
        setRoute({ name: "journey", shareCode: session.shareCode });
        window.scrollTo({ top: 0 });
      }}
    />
  );
}
