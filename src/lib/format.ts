export const travelModeLabels: Record<string, string> = {
  WALKING: "Walking",
  CYCLING: "Cycling",
  PUBLIC_TRANSPORT: "Public transport",
  CAR: "Car / cab",
  OTHER: "Other",
};

export function formatDateTime(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
    day: "numeric",
    month: "short",
  }).format(new Date(value));
}

export function formatRelative(value: string, now = Date.now()) {
  const delta = new Date(value).getTime() - now;
  const absoluteMinutes = Math.max(0, Math.round(Math.abs(delta) / 60_000));
  if (Math.abs(delta) < 45_000) return delta >= 0 ? "due now" : "just now";
  if (absoluteMinutes < 60) return delta > 0 ? `in ${absoluteMinutes} min` : `${absoluteMinutes} min ago`;
  const hours = Math.round(absoluteMinutes / 60);
  return delta > 0 ? `in ${hours} hr` : `${hours} hr ago`;
}

export function formatCountdown(milliseconds: number) {
  const total = Math.max(0, Math.floor(milliseconds / 1000));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  return [hours, minutes, seconds].map((part) => String(part).padStart(2, "0")).join(":");
}
