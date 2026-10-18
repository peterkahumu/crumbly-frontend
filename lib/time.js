/**
 * Reporting calendar. Timestamps are stored in UTC, but a bakery's "Tuesday"
 * is a Nairobi Tuesday — every bucket boundary in the dashboards, the exports
 * and the SQL aggregates is resolved in this one zone so the numbers agree.
 */

export const REPORT_TZ = process.env.REPORT_TIME_ZONE || "Africa/Nairobi";

const KEY_FORMAT = new Intl.DateTimeFormat("en-CA", {
  timeZone: REPORT_TZ,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const PARTS_FORMAT = new Intl.DateTimeFormat("en-US", {
  timeZone: REPORT_TZ,
  hour12: false,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  weekday: "short",
});

const WEEKDAY_INDEX = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

function parts(date) {
  const out = {};
  for (const part of PARTS_FORMAT.formatToParts(date)) {
    if (part.type !== "literal") out[part.type] = part.value;
  }
  return out;
}

function offsetMs(date) {
  const p = parts(date);
  const asUtc = Date.UTC(
    Number(p.year),
    Number(p.month) - 1,
    Number(p.day),
    Number(p.hour) % 24,
    Number(p.minute),
    Number(p.second)
  );
  return asUtc - date.getTime();
}

/** YYYY-MM-DD in the reporting zone. */
export function dayKey(date) {
  return KEY_FORMAT.format(new Date(date));
}

/** The instant at which the reporting day containing `date` begins. */
export function startOfDay(date) {
  return instantFromKey(dayKey(date));
}

/** Turns a YYYY-MM-DD key back into the instant of its local midnight. */
export function instantFromKey(key) {
  const [y, m, d] = key.split("-").map(Number);
  const guess = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  const midnightUtc = Date.UTC(y, m - 1, d, 0, 0, 0);
  return new Date(midnightUtc - offsetMs(guess));
}

export function addDays(date, n) {
  const midday = startOfDay(date).getTime() + 43_200_000;
  return startOfDay(new Date(midday + n * 86_400_000));
}

/** Day-of-week index (0 = Sunday) in the reporting zone. */
export function weekday(date) {
  return WEEKDAY_INDEX[parts(date).weekday] ?? 0;
}

export function startOfWeek(date) {
  return addDays(startOfDay(date), -weekday(date));
}

export function startOfMonth(date) {
  const p = parts(date);
  return instantFromKey(`${p.year}-${p.month}-01`);
}

export function addMonths(date, n) {
  const p = parts(date);
  const total = Number(p.year) * 12 + (Number(p.month) - 1) + n;
  const year = Math.floor(total / 12);
  const month = `${(total % 12) + 1}`.padStart(2, "0");
  return instantFromKey(`${year}-${month}-01`);
}

/** Whole days between two instants, inclusive of both endpoints. */
export function daysBetween(from, to) {
  return Math.round((startOfDay(to) - startOfDay(from)) / 86_400_000) + 1;
}

const LABEL_OPTS = { timeZone: REPORT_TZ };

export function formatDay(date, opts = { day: "numeric", month: "short" }) {
  return new Date(date).toLocaleDateString("en-KE", { ...LABEL_OPTS, ...opts });
}

export function formatDateTime(date) {
  return new Date(date).toLocaleString("en-KE", {
    ...LABEL_OPTS,
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
