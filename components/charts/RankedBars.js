import { SERIES, NEUTRAL, INK } from "@/lib/chartTheme";

/**
 * Ranked horizontal bars. Nominal categories all take one colour, since bar
 * length already carries the value. Pass `emphasis` to highlight one row.
 */
export default function RankedBars({
  items,
  formatValue = (v) => v,
  color = SERIES[0],
  emphasis = null,
  barHeight = 10,
  showRank = false,
}) {
  const max = Math.max(...items.map((i) => i.value), 1);

  return (
    <ul className="space-y-3">
      {items.map((item, i) => {
        const pct = (item.value / max) * 100;
        const highlighted = emphasis == null || emphasis === i;
        const fill = highlighted ? item.color || color : NEUTRAL;

        return (
          <li key={item.label} className="group">
            <div className="mb-1.5 flex items-baseline justify-between gap-3">
              <span className="flex min-w-0 items-baseline gap-2">
                {showRank && (
                  <span className="w-4 shrink-0 text-[10px] font-bold text-cocoa-300">{i + 1}</span>
                )}
                <span className="truncate text-xs font-semibold text-cocoa-800">{item.label}</span>
                {item.meta && <span className="shrink-0 text-[11px] text-cocoa-400">{item.meta}</span>}
              </span>
              <span className="shrink-0 font-heading text-xs font-bold text-cocoa-900">
                {formatValue(item.value)}
              </span>
            </div>
            <div
              className="w-full overflow-hidden rounded-[4px] bg-cream-200/70"
              style={{ height: barHeight }}
              role="img"
              aria-label={`${item.label}: ${formatValue(item.value)}`}
            >
              <div
                className="h-full rounded-r-[4px] transition-[width,filter] duration-500 ease-out group-hover:brightness-95"
                style={{
                  width: `${Math.max(pct, item.value > 0 ? 2 : 0)}%`,
                  background: fill,
                }}
              />
            </div>
          </li>
        );
      })}
      {items.length === 0 && <li className="text-xs text-cocoa-400">Nothing to rank yet.</li>}
    </ul>
  );
}

/** Bare track, for leaderboard rows that carry their own layout. */
export function BarTrack({ value, max, color = SERIES[0], height = 6 }) {
  return (
    <div className="w-full overflow-hidden rounded-[3px] bg-cream-200/70" style={{ height }} aria-hidden="true">
      <div
        className="h-full rounded-r-[3px]"
        style={{ width: `${Math.max((value / (max || 1)) * 100, value > 0 ? 2 : 0)}%`, background: color }}
      />
    </div>
  );
}

export const AXIS_INK = INK.muted;
