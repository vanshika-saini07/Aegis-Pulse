import type { Coordinates } from "../types";

export function getBrowserLocation(): Promise<Coordinates | null> {
  if (!("geolocation" in navigator)) return Promise.resolve(null);

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (position) =>
        resolve({
          latitude: Number(position.coords.latitude.toFixed(6)),
          longitude: Number(position.coords.longitude.toFixed(6)),
        }),
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 6500, maximumAge: 30_000 },
    );
  });
}
