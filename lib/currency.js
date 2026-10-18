export const CURRENCY = process.env.NEXT_PUBLIC_CURRENCY || "KES";

/**
 * Formats an integer amount (stored in whole currency units, no decimals —
 * KES doesn't commonly use cents) as a localized price string, e.g. 4500 -> "KSh 4,500".
 */
export function formatPrice(amount) {
  const symbol = CURRENCY === "KES" ? "KSh" : CURRENCY;
  return `${symbol} ${Number(amount ?? 0).toLocaleString("en-KE")}`;
}
