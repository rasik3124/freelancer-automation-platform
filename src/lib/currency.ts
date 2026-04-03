/**
 * currency.ts — Indian Rupee formatting utilities
 *
 * Usage:
 *   formatINR(15400)        → "₹15,400"
 *   formatINRCompact(109800)→ "₹1.1L"
 *   INR_SYMBOL              → "₹"
 */

export const INR_SYMBOL = "₹";

/**
 * Formats a number as Indian Rupees with ₹ prefix.
 * Uses Indian locale (en-IN) for lakh/comma grouping.
 * e.g. 150000 → "₹1,50,000"
 */
export const formatINR = (value: number): string =>
  `₹${value.toLocaleString("en-IN")}`;

/**
 * Compact form for large values:
 *   ≥ 1 Cr  (10,000,000) → "₹X.XCr"
 *   ≥ 1 L   (100,000)    → "₹X.XL"
 *   otherwise            → "₹X,XX,XXX"
 */
export const formatINRCompact = (value: number): string => {
  if (value >= 10_000_000) return `₹${(value / 10_000_000).toFixed(1)}Cr`;
  if (value >= 100_000)    return `₹${(value / 100_000).toFixed(1)}L`;
  return formatINR(value);
};
