/** i18n helpers for Shift Network code (vue-i18n global instance, Vietnamese). */
import i18n from "@/core/plugins/vue3/i18n";
import { SnApiError } from "@/api/sn-api";

export const t = (key: string, params?: Record<string, unknown>): string => (i18n.global as any).t(key, params || {});
export const te = (key: string): boolean => (i18n.global as any).te(key, "vi");

/** Maps a backend / browser error to Vietnamese text via sn.errors.<CODE>. */
export function errorText(err: unknown): string {
  const code = err instanceof SnApiError ? err.code : (err as any)?.code || (err as any)?.message;
  if (code && te(`sn.errors.${code}`)) {
    const base = t(`sn.errors.${code}`);
    const d = (err as any)?.details;
    if (code === "CHECKIN_OUTSIDE_GEOFENCE" && d?.distance_m !== undefined) return `${base} (cách ${d.distance_m} m, cho phép ${d.radius_m} m).`;
    return base;
  }
  return t("sn.errors.UNKNOWN");
}
