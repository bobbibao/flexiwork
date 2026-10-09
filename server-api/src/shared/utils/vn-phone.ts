import { parsePhoneNumberFromString } from 'libphonenumber-js';

/** Normalises a Vietnamese phone number to E.164 (+84...). Returns null if invalid. */
export function toE164Vn(input: string | null | undefined): string | null {
  if (!input) return null;
  const parsed = parsePhoneNumberFromString(String(input).trim(), 'VN');
  if (!parsed || !parsed.isValid()) return null;
  return parsed.number;
}

export const looksLikeEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
