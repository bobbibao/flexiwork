const EARTH_RADIUS_M = 6371008.8;

export class GeoPoint {
  private constructor(
    readonly lat: number,
    readonly lng: number,
  ) {}

  static of(lat: number, lng: number): GeoPoint {
    const la = Number(lat);
    const ln = Number(lng);
    if (!Number.isFinite(la) || la < -90 || la > 90) throw new Error(`Invalid latitude ${lat}`);
    if (!Number.isFinite(ln) || ln < -180 || ln > 180) throw new Error(`Invalid longitude ${lng}`);
    return new GeoPoint(la, ln);
  }

  /** Great-circle distance in meters (haversine). */
  distanceTo(other: GeoPoint): number {
    const toRad = (d: number) => (d * Math.PI) / 180;
    const dLat = toRad(other.lat - this.lat);
    const dLng = toRad(other.lng - this.lng);
    const a =
      Math.sin(dLat / 2) ** 2 + Math.cos(toRad(this.lat)) * Math.cos(toRad(other.lat)) * Math.sin(dLng / 2) ** 2;
    return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(a)));
  }

  /** Bounding box for a radius, used by the Postgres search fallback. */
  boundingBox(radiusM: number): { minLat: number; maxLat: number; minLng: number; maxLng: number } {
    const dLat = (radiusM / EARTH_RADIUS_M) * (180 / Math.PI);
    const dLng = dLat / Math.max(Math.cos((this.lat * Math.PI) / 180), 1e-6);
    return { minLat: this.lat - dLat, maxLat: this.lat + dLat, minLng: this.lng - dLng, maxLng: this.lng + dLng };
  }

  toJSON(): { lat: number; lng: number } {
    return { lat: this.lat, lng: this.lng };
  }
}
