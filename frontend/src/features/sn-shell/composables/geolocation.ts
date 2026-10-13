/** navigator.geolocation as a promise with stable error codes (mapped by sn.errors.GEOLOCATION_*). */
export interface Position {
  lat: number;
  lng: number;
  accuracyM: number;
}

export function currentPosition(timeoutMs = 15000): Promise<Position> {
  return new Promise((resolve, reject) => {
    if (!("geolocation" in navigator)) return reject({ code: "GEOLOCATION_UNAVAILABLE" });
    navigator.geolocation.getCurrentPosition(
      p => resolve({ lat: p.coords.latitude, lng: p.coords.longitude, accuracyM: Math.round(p.coords.accuracy ?? 9999) }),
      err => reject({ code: err.code === 1 ? "GEOLOCATION_DENIED" : "GEOLOCATION_UNAVAILABLE" }),
      { enableHighAccuracy: true, timeout: timeoutMs, maximumAge: 0 } // always a fresh fix: a cached position could be from before the worker arrived
    );
  });
}

/** Haversine distance in meters (display only; the server is the authority). */
export function distanceM(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371008.8 * Math.asin(Math.min(1, Math.sqrt(h)));
}
