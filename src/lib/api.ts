import type { Coordinates, CreateSessionPayload, SafetySession } from "../types";

interface ApiErrorBody {
  error?: {
    code?: string;
    message?: string;
    fields?: Record<string, string[]>;
  };
}

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code: string,
    public readonly fields?: Record<string, string[]>,
  ) {
    super(message);
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(path, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...init?.headers,
      },
    });
  } catch {
    throw new ApiError("We couldn’t reach Aegis Pulse. Check your connection and try again.", 0, "NETWORK_ERROR");
  }

  const body = (await response.json().catch(() => ({}))) as ApiErrorBody & { data?: T };
  if (!response.ok) {
    throw new ApiError(
      body.error?.message ?? "Something went wrong. Please try again.",
      response.status,
      body.error?.code ?? "REQUEST_FAILED",
      body.error?.fields,
    );
  }
  return body.data as T;
}

export const api = {
  createSession: (payload: CreateSessionPayload) =>
    request<SafetySession>("/api/sessions", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  getSession: (shareCode: string) =>
    request<SafetySession>(`/api/sessions/${encodeURIComponent(shareCode)}`),
  checkIn: (id: string, coordinates: Coordinates | null) =>
    request<SafetySession>(`/api/sessions/${id}/check-in`, {
      method: "POST",
      body: JSON.stringify(coordinates ?? {}),
    }),
  updateLocation: (id: string, coordinates: Coordinates) =>
    request<SafetySession>(`/api/sessions/${id}/location`, {
      method: "POST",
      body: JSON.stringify(coordinates),
    }),
  triggerSos: (id: string, coordinates: Coordinates | null) =>
    request<SafetySession>(`/api/sessions/${id}/sos`, {
      method: "POST",
      body: JSON.stringify({ ...(coordinates ?? {}), message: "Emergency SOS activated by traveller" }),
    }),
  completeSession: (id: string) =>
    request<SafetySession>(`/api/sessions/${id}/complete`, {
      method: "POST",
      body: "{}",
    }),
};
