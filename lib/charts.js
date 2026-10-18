import { CURRENCY } from "@/lib/currency";
import {
  addDays as addDaysTz,
  addMonths as addMonthsTz,
  dayKey as dayKeyTz,
  formatDay as formatDayTz,
  instantFromKey as instantFromKeyTz,
  startOfDay as startOfDayTz,
  startOfMonth as startOfMonthTz,
  startOfWeek as startOfWeekTz,
} from "@/lib/time";

/* ---------------------------------------------------------------- geometry */

/** Axis ticks rounded to readable numbers (0 / 500 / 1,000 …). */
export function niceTicks(max, count = 4) {
  if (!Number.isFinite(max) || max <= 0) return [0, 1];
  const rawStep = max / count;
  const mag = 10 ** Math.floor(Math.log10(rawStep));
  const norm = rawStep / mag;
  const step = (norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 2.5 ? 2.5 : norm <= 5 ? 5 : 10) * mag;
  const top = Math.ceil(max / step) * step;
  const ticks = [];
  for (let v = 0; v <= top + step / 2; v += step) ticks.push(Math.round(v * 1000) / 1000);
  return ticks;
}

/** Monotone cubic interpolation — smooths a line without overshooting. */
export function smoothPath(points) {
  if (!points.length) return "";
  if (points.length < 3) return points.map((p, i) => `${i ? "L" : "M"}${p.x} ${p.y}`).join(" ");

  const n = points.length;
  const dx = [];
  const dy = [];
  const slope = [];
  for (let i = 0; i < n - 1; i++) {
    dx[i] = points[i + 1].x - points[i].x;
    dy[i] = points[i + 1].y - points[i].y;
    slope[i] = dx[i] ? dy[i] / dx[i] : 0;
  }

  const m = [slope[0]];
  for (let i = 1; i < n - 1; i++) {
    if (slope[i - 1] * slope[i] <= 0) {
      m[i] = 0;
    } else {
      const w1 = 2 * dx[i] + dx[i - 1];
      const w2 = dx[i] + 2 * dx[i - 1];
      m[i] = (w1 + w2) / (w1 / slope[i - 1] + w2 / slope[i]);
    }
  }
  m[n - 1] = slope[n - 2];

  let d = `M${points[0].x} ${points[0].y}`;
  for (let i = 0; i < n - 1; i++) {
    const c = dx[i] / 3;
    d += ` C${points[i].x + c} ${points[i].y + m[i] * c} ${points[i + 1].x - c} ${
      points[i + 1].y - m[i + 1] * c
    } ${points[i + 1].x} ${points[i + 1].y}`;
  }
  return d;
}

/** Closes a line path down to the baseline so it can be filled. */
export function areaFromLine(linePathD, points, baselineY) {
  if (!linePathD || !points.length) return "";
  const first = points[0];
  const last = points[points.length - 1];
  return `${linePathD} L${last.x} ${baselineY} L${first.x} ${baselineY} Z`;
}

/** A rect rounded only at the data end, square where it meets the baseline. */
export function barPath(x, y, w, h, r = 4, dir = "up") {
  if (h <= 0.5) return "";
  if (dir === "up") {
    const radius = Math.max(0, Math.min(r, w / 2, h));
    return `M${x} ${y + h} L${x} ${y + radius} Q${x} ${y} ${x + radius} ${y} L${x + w - radius} ${y} Q${
      x + w
    } ${y} ${x + w} ${y + radius} L${x + w} ${y + h} Z`;
  }
  const rr = Math.max(0, Math.min(r, h / 2, w));
  return `M${x} ${y} L${x + w - rr} ${y} Q${x + w} ${y} ${x + w} ${y + rr} L${x + w} ${y + h - rr} Q${
    x + w
  } ${y + h} ${x + w - rr} ${y + h} L${x} ${y + h} Z`;
}

/** Ring segment between two angles, used by the donut and gauge. */
export function arcPath(cx, cy, rOuter, rInner, startDeg, endDeg) {
  const sweep = endDeg - startDeg;
  if (sweep <= 0) return "";
  const end = sweep >= 360 ? startDeg + 359.99 : endDeg;
  const p = (r, deg) => {
    const a = ((deg - 90) * Math.PI) / 180;
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  };
  const large = end - startDeg > 180 ? 1 : 0;
  const [x1, y1] = p(rOuter, startDeg);
  const [x2, y2] = p(rOuter, end);
  const [x3, y3] = p(rInner, end);
  const [x4, y4] = p(rInner, startDeg);
  return `M${x1} ${y1} A${rOuter} ${rOuter} 0 ${large} 1 ${x2} ${y2} L${x3} ${y3} A${rInner} ${rInner} 0 ${large} 0 ${x4} ${y4} Z`;
}

/* ----------------------------------------------------------------- format */

/** 1284 → "1,284" · 12900 → "12.9K" · 4200000 → "4.2M" */
export function compact(n) {
  const v = Number(n) || 0;
  const abs = Math.abs(v);
  if (abs >= 1_000_000) return `${round1(v / 1_000_000)}M`;
  if (abs >= 10_000) return `${round1(v / 1_000)}K`;
  return v.toLocaleString("en-KE");
}

function round1(v) {
  return (Math.round(v * 10) / 10).toString();
}

export function compactPrice(n) {
  const symbol = CURRENCY === "KES" ? "KSh" : CURRENCY;
  return `${symbol} ${compact(n)}`;
}

export function percent(part, whole, digits = 0) {
  if (!whole) return 0;
  return Number(((part / whole) * 100).toFixed(digits));
}

/** Signed change between two periods; null when there is no base to compare. */
export function delta(current, previous) {
  if (previous == null) return null;
  if (!previous) return current ? { pct: null, dir: "up" } : null;
  const pct = ((current - previous) / previous) * 100;
  return { pct: Math.round(pct * 10) / 10, dir: pct >= 0 ? "up" : "down" };
}

/* ------------------------------------------------------------------ dates */

export {
  dayKey,
  addDays,
  startOfDay,
  startOfWeek,
  daysBetween,
  formatDay,
  formatDateTime,
  REPORT_TZ,
} from "@/lib/time";

/**
 * Contiguous buckets covering [from, to] at day, week or month granularity,
 * resolved in the reporting timezone.
 */
export function timeBuckets(from, to, size = "day") {
  const out = [];
  const end = startOfDayTz(to);

  if (size === "month") {
    let cursor = startOfMonthTz(from);
    while (cursor <= end) {
      out.push({ key: monthKey(cursor), label: formatDayTz(cursor, { month: "short", year: "2-digit" }), start: cursor });
      cursor = addMonthsTz(cursor, 1);
    }
    return out;
  }

  const stepDays = size === "week" ? 7 : 1;
  let cursor = size === "week" ? startOfWeekTz(from) : startOfDayTz(from);
  while (cursor <= end) {
    out.push({ key: dayKeyTz(cursor), label: formatDayTz(cursor), start: cursor });
    cursor = addDaysTz(cursor, stepDays);
  }
  return out;
}

/** The bucket a day key belongs to, at the given granularity. */
export function bucketKeyForDay(key, size = "day") {
  if (size === "day") return key;
  const instant = instantFromKeyTz(key);
  return size === "week" ? dayKeyTz(startOfWeekTz(instant)) : monthKey(instant);
}

function monthKey(date) {
  return dayKeyTz(date).slice(0, 7);
}

/** Trailing mean, for laying a smoothed line over a noisy series. */
export function movingAverage(values, window = 7) {
  return values.map((_, i) => {
    const from = Math.max(0, i - window + 1);
    const slice = values.slice(from, i + 1);
    return slice.reduce((a, b) => a + b, 0) / slice.length;
  });
}

/** Equal-width bins over a numeric column. */
export function histogram(values, binCount = 8) {
  if (!values.length) return [];
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const step = span / binCount;
  const bins = Array.from({ length: binCount }, (_, i) => ({
    from: min + i * step,
    to: min + (i + 1) * step,
    count: 0,
  }));
  for (const v of values) {
    const i = Math.min(binCount - 1, Math.floor((v - min) / step));
    bins[i].count++;
  }
  return bins;
}
