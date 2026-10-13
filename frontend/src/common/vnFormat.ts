/**
 * Vietnamese formatting (docs/ARCHITECTURE.md §17.4). Uses Intl with an explicit time zone;
 * new code never uses moment (main.js forces a global Europe/London moment default for legacy screens).
 */
export const VN_TZ = "Asia/Ho_Chi_Minh";

const vnd = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 });
const num = new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 0 });
const dateTime = new Intl.DateTimeFormat("vi-VN", { timeZone: VN_TZ, day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: false });
const dateOnly = new Intl.DateTimeFormat("vi-VN", { timeZone: VN_TZ, day: "2-digit", month: "2-digit", year: "numeric" });
const timeOnly = new Intl.DateTimeFormat("vi-VN", { timeZone: VN_TZ, hour: "2-digit", minute: "2-digit", hour12: false });
const weekday = new Intl.DateTimeFormat("vi-VN", { timeZone: VN_TZ, weekday: "short" });

/** 352000 -> "352.000 ₫" */
export const formatVnd = (amount: number | null | undefined): string => (amount === null || amount === undefined || Number.isNaN(Number(amount)) ? "—" : vnd.format(Number(amount)));
export const formatNumberVn = (n: number | null | undefined): string => (n === null || n === undefined ? "—" : num.format(n));

const parts = (fmt: Intl.DateTimeFormat, d: Date) => Object.fromEntries(fmt.formatToParts(d).map(p => [p.type, p.value]));

/** dd/MM/yyyy HH:mm in Vietnam time */
export const formatDateTimeVn = (value: string | Date | null | undefined): string => {
  if (!value) return "—";
  const p = parts(dateTime, new Date(value));
  return `${p.day}/${p.month}/${p.year} ${p.hour}:${p.minute}`;
};
export const formatDateVn = (value: string | Date | null | undefined): string => {
  if (!value) return "—";
  const p = parts(dateOnly, new Date(value));
  return `${p.day}/${p.month}/${p.year}`;
};
export const formatTimeVn = (value: string | Date | null | undefined): string => {
  if (!value) return "—";
  const p = parts(timeOnly, new Date(value));
  return `${p.hour}:${p.minute}`;
};
export const formatWeekdayVn = (value: string | Date): string => weekday.format(new Date(value));

/** "T4, 14/10 18:00 - 22:00" style range */
export const formatShiftRange = (start: string | Date, end: string | Date): string =>
  `${formatWeekdayVn(start)}, ${formatDateVn(start)} ${formatTimeVn(start)} - ${formatTimeVn(end)}`;

/** +84901234567 -> "0901 234 567" */
export const formatPhoneVn = (e164: string | null | undefined): string => {
  if (!e164) return "—";
  const local = e164.replace(/^\+84/, "0").replace(/\D/g, "");
  if (local.length === 10) return `${local.slice(0, 4)} ${local.slice(4, 7)} ${local.slice(7)}`;
  if (local.length === 11) return `${local.slice(0, 3)} ${local.slice(3, 7)} ${local.slice(7)}`;
  return local;
};

/** 270 -> "4 giờ 30 phút" */
export const minutesToHoursLabel = (minutes: number | null | undefined): string => {
  if (minutes === null || minutes === undefined) return "—";
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (!h) return `${m} phút`;
  return m ? `${h} giờ ${m} phút` : `${h} giờ`;
};

export const formatDistance = (meters: number | null | undefined): string => {
  if (meters === null || meters === undefined) return "—";
  return meters < 1000 ? `${Math.round(meters)} m` : `${(meters / 1000).toFixed(1).replace(".", ",")} km`;
};

/** Value for <input type="datetime-local"> in Vietnam time. */
export const toVnLocalInput = (value: Date): string => {
  const p = parts(dateTime, value);
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`;
};

/** Parses a datetime-local value entered in Vietnam time (UTC+7, no DST) to an ISO string. */
export const fromVnLocalInput = (value: string): string => new Date(`${value}:00+07:00`).toISOString();
