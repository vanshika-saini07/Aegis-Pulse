import { useCallback, useEffect, useRef, useState } from "react";
import { api, ApiError } from "../lib/api";
import type { SafetySession } from "../types";

export function useSession(shareCode: string, pollInterval = 8_000, initialSession: SafetySession | null = null) {
  const [session, setSession] = useState<SafetySession | null>(initialSession);
  const [loading, setLoading] = useState(!initialSession);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const mounted = useRef(true);

  const refresh = useCallback(
    async (quiet = false) => {
      if (!quiet) setLoading(true);
      else setRefreshing(true);
      try {
        const next = await api.getSession(shareCode);
        if (mounted.current) {
          setSession(next);
          setError(null);
        }
      } catch (caught) {
        if (mounted.current) {
          setError(caught instanceof ApiError ? caught : new ApiError("Unable to load this journey.", 0, "UNKNOWN"));
        }
      } finally {
        if (mounted.current) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [shareCode],
  );

  useEffect(() => {
    mounted.current = true;
    void refresh(Boolean(initialSession));
    const timer = window.setInterval(() => void refresh(true), pollInterval);
    return () => {
      mounted.current = false;
      window.clearInterval(timer);
    };
  }, [initialSession, pollInterval, refresh]);

  return { session, setSession, loading, refreshing, error, refresh };
}
