import { addDays, dayKey, startOfDay } from "@/lib/charts";

/** Selectable reporting windows. `days: null` means "everything on record". */
export const RANGE_PRESETS = [
  { value: "7d", label: "Last 7 days", days: 7 },
  { value: "30d", label: "Last 30 days", days: 30 },
  { value: "90d", label: "Last 90 days", days: 90 },
  { value: "6m", label: "Last 6 months", days: 182 },
  { value: "12m", label: "Last 12 months", days: 365 },
  { value: "all", label: "All time", days: null },
  { value: "custom", label: "Custom range", days: null },
];

export const DEFAULT_RANGE = "30d";

function presetFor(value) {
  return RANGE_PRESETS.find((p) => p.value === value) ?? RANGE_PRESETS.find((p) => p.value === DEFAULT_RANGE);
}

function parseDate(value) {
  if (!value) return null;
  const parsed = new Date(`${value}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : startOfDay(parsed);
}

function first(value) {
  return Array.isArray(value) ? value[0] : value;
}

/**
 * Turns a page query string into a validated filter object. Unknown or
 * malformed values fall back to the default rather than throwing, so a
 * hand-edited URL can never break the dashboard.
 */
export function parseFilters(query = {}, { earliest = null } = {}) {
  const requested = first(query.range);
  const range = RANGE_PRESETS.some((p) => p.value === requested) ? requested : DEFAULT_RANGE;

  const today = startOfDay(new Date());
  let from = null;
  let to = today;

  if (range === "custom") {
    const parsedFrom = parseDate(first(query.from));
    const parsedTo = parseDate(first(query.to));
    from = parsedFrom ?? addDays(today, -29);
    to = parsedTo ?? today;
    if (from > to) [from, to] = [to, from];
    if (to > today) to = today;
  } else {
    const { days } = presetFor(range);
    from = days ? addDays(today, -(days - 1)) : earliest ? startOfDay(earliest) : null;
  }

  const spanDays = from ? Math.round((to - from) / 86_400_000) + 1 : null;

  return {
    range,
    from,
    to,
    days: spanDays,
    city: first(query.city) || null,
    bakeryId: first(query.bakery) || null,
    label: describe(range, from, to),
  };
}

function describe(range, from, to) {
  if (range === "custom" && from) {
    const fmt = (d) => d.toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" });
    return `${fmt(from)} – ${fmt(to)}`;
  }
  if (!from) return "All time";
  return presetFor(range).label;
}

/** Serializes filters back into a query object, omitting defaults. */
export function toQuery(filters) {
  const query = {};
  if (filters.range && filters.range !== DEFAULT_RANGE) query.range = filters.range;
  if (filters.range === "custom") {
    if (filters.from) query.from = dayKey(filters.from);
    if (filters.to) query.to = dayKey(filters.to);
  }
  if (filters.city) query.city = filters.city;
  if (filters.bakeryId) query.bakery = filters.bakeryId;
  return query;
}

/** Date filter fragment matching the selected window. */
export function dateWhere(filters) {
  if (!filters.from) return {};
  return { createdAt: { gte: filters.from, lt: addDays(filters.to, 1) } };
}

/**
 * Picks a bucket size that keeps a trend readable: daily up to ~10 weeks,
 * weekly up to ~18 months, monthly beyond that.
 */
export function bucketSizeFor(days) {
  if (!days || days > 550) return "month";
  if (days > 120) return "month";
  if (days > 70) return "week";
  return "day";
}

/** The comparison window immediately preceding the selected one. */
export function previousWindow(filters) {
  if (!filters.from || !filters.days) return null;
  const previousTo = addDays(filters.from, -1);
  return { from: addDays(previousTo, -(filters.days - 1)), to: previousTo };
}
