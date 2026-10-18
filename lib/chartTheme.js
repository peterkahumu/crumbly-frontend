/**
 * Chart tokens. Every categorical value was checked with the data-viz palette
 * validator against the white card surface these charts render on:
 *
 *   SERIES (adjacent)   CVD dE 10.9 · normal-vision dE 24.2 · all >= 3:1
 *   SERIES[0..2] (all)  CVD dE 10.9 · normal-vision dE 24.2 · all >= 3:1
 *   ORDINAL             monotone L, adjacent dL >= 0.06, light end 3.01:1
 *
 * Re-run the validator before changing a hex. The site is a single light
 * theme, so there is no dark column.
 */

/** Dashboard cards are white. */
export const SURFACE = "#ffffff";
/** The page plane behind the cards. */
export const PLANE = "#fffaf3";

/** Chart chrome. Text tokens only; marks never lend their colour to text. */
export const INK = {
  primary: "#2e1b19", // cocoa-900   16.3:1
  secondary: "#6b4038", // cocoa-500    8.7:1
  muted: "#8a6a60", // axis/tick    4.9:1
  grid: "#f4e8db", // hairline gridline, one step off surface
  axis: "#efdcc6", // baseline rule
};

/** Categorical slots, assigned in this fixed order and never cycled. */
export const SERIES = ["#c1502e", "#00907d", "#6a4bb5", "#c98207"];

/** De-emphasis fill. */
export const NEUTRAL = "#e8dccd";

/** Status colours. Reserved meaning; always paired with an icon and label. */
export const STATUS = {
  good: "#0ca30c",
  warning: "#fab219",
  serious: "#ec835a",
  critical: "#d03b3b",
};

/** Ordinal ramp for scales where the order is the meaning. */
export const ORDINAL = ["#dd7a54", "#c1502e", "#a33f22", "#82311b"];

/** Sequential ramp for continuous magnitude; the lightest step is zero. */
export const SEQUENTIAL = [
  "#fdf1ec",
  "#fbe2d6",
  "#f6c4ad",
  "#eea17e",
  "#dd7a54",
  "#c1502e",
  "#a33f22",
  "#82311b",
];

/** Diverging poles either side of a neutral midpoint. */
export const DIVERGING = {
  positive: "#c1502e",
  negative: "#00907d",
  mid: "#ece4d8",
};

/** The order workflow is ordinal; CANCELLED is an exit, not a stage. */
export const ORDER_STATUS_COLOR = {
  PENDING: ORDINAL[0],
  CONTACTED: ORDINAL[1],
  CONFIRMED: ORDINAL[2],
  COMPLETED: ORDINAL[3],
  CANCELLED: NEUTRAL,
};

/** The stages an order walks through, in order. */
export const ORDER_FUNNEL = ["PENDING", "CONTACTED", "CONFIRMED", "COMPLETED"];

/** Bakery lifecycle means good/bad, so it wears status tokens. */
export const BAKERY_STATUS_COLOR = {
  APPROVED: STATUS.good,
  PENDING: STATUS.warning,
  SUSPENDED: STATUS.critical,
  DELETED: INK.muted,
  Approved: STATUS.good,
  Pending: STATUS.warning,
  Suspended: STATUS.critical,
  Deleted: INK.muted,
};

/** Sequential step for a 0..1 intensity. */
export function heatStep(t) {
  if (!Number.isFinite(t) || t <= 0) return SEQUENTIAL[0];
  const i = Math.min(SEQUENTIAL.length - 1, Math.ceil(t * (SEQUENTIAL.length - 1)));
  return SEQUENTIAL[i];
}

/** White or ink for a label inside a filled mark, by fill luminance. */
export function inkOn(hex) {
  const n = parseInt(hex.slice(1), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.42 ? INK.primary : "#ffffff";
}
